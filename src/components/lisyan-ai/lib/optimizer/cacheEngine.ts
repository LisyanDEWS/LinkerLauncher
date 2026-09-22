import { db } from "../../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { normalizeText } from "./textCompressor";

export interface CacheEntry {
  hash: string;
  response: string;
  modelId: string;
  lang: string;
  timestamp: number;
  hitCount: number;
  tokensSaved: number;
  imageHash?: string;
  structuredQuestions?: any;
  isCompound?: boolean;
}

// In-Memory LRU / RAM Cache for instantaneous sub-1ms lookups
const RAM_CACHE = new Map<string, CacheEntry>();
const MAX_RAM_ENTRIES = 200; // increased from 120 for better hit rate on small questions

/**
 * Fast 32-bit FNV-1a string hashing
 */
export function computeHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Enhanced normalization for small questions to increase cache hit rate.
 * For tiny questions, we do aggressive normalization:
 * - lowercase
 * - trim punctuation
 * - collapse whitespace
 * - remove extra symbols
 */
function aggressiveNormalizeForSmall(prompt: string): string {
  let clean = prompt.trim().toLowerCase();
  // Remove leading/trailing punctuation for small questions
  if (clean.length <= 200) {
    clean = clean
      .replace(/^[?!.,;:]+/, "")
      .replace(/[?!.,;:]+$/, "")
      .replace(/\s+/g, " ")
      .trim();
    // For very tiny (<50 chars), also remove question marks inside and extra spaces
    if (clean.length <= 50) {
      clean = clean.replace(/[?؟¿]+/g, "").trim();
    }
  }
  return clean;
}

/**
 * Generates an exact lookup key for normalized text prompt
 * Enhanced: small questions get aggressive normalization for higher cache hits
 */
export function buildPromptKey(normalizedPrompt: string, modelId: string, lang: string): string {
  const isSmall = normalizedPrompt.trim().length <= 200;
  const baseNormalized = normalizeText(normalizedPrompt).toLowerCase();
  const aggressive = isSmall ? aggressiveNormalizeForSmall(baseNormalized) : baseNormalized;
  
  // For small questions, use a shared cache key across models that can handle them (lnv1)
  // This increases hit rate: "what is ai" cached once works for all small handlers
  const effectiveModelId = isSmall && (modelId === "lnv1" || modelId === "lv1pro") ? "lnv1" : modelId;
  
  return `p_${effectiveModelId}_${lang}_${computeHash(aggressive)}`;
}

/**
 * Builds alternative keys to try for small questions (for higher hit rate)
 * NOTE: Now language-aware — no cross-language fallback to avoid answering in wrong language.
 * We only try same language with different model variants.
 */
function buildAlternativeKeys(prompt: string, modelId: string, lang: string): string[] {
  const keys: string[] = [];
  const base = buildPromptKey(prompt, modelId, lang);
  keys.push(base);

  // For tiny questions, try same prompt with lnv1 model variant (shared model cache) but SAME language
  // This increases hit rate without mixing languages
  if (prompt.trim().length <= 80) {
    if (modelId !== "lnv1") {
      const altKey = buildPromptKey(prompt, "lnv1", lang);
      if (altKey !== base) keys.push(altKey);
    }
  }

  return [...new Set(keys)];
}

/**
 * Computes difference hash (dHash) for an image data URL via HTML Canvas.
 * Generates a 64-bit binary representation of gradient changes.
 */
export async function computeImageDHash(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 9;
          canvas.height = 8;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(computeHash(dataUrl.slice(0, 100)));
            return;
          }
          // Grayscale draw
          ctx.drawImage(img, 0, 0, 9, 8);
          const imgData = ctx.getImageData(0, 0, 9, 8);
          const pixels = imgData.data;

          // Convert each pixel to grayscale luminance
          const grays: number[] = [];
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            grays.push(Math.round(r * 0.299 + g * 0.587 + b * 0.114));
          }

          // Compute 64-bit gradient differences (pixel[x] > pixel[x+1])
          let bitString = "";
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              const left = grays[y * 9 + x];
              const right = grays[y * 9 + x + 1];
              bitString += left > right ? "1" : "0";
            }
          }

          // Convert 64 bits to 16 hex characters
          let hex = "";
          for (let i = 0; i < 64; i += 4) {
            const nibble = bitString.slice(i, i + 4);
            hex += parseInt(nibble, 2).toString(16);
          }
          resolve(hex);
        } catch {
          resolve(computeHash(dataUrl.slice(0, 100)));
        }
      };
      img.onerror = () => resolve(computeHash(dataUrl.slice(0, 100)));
      img.src = dataUrl;
    } catch {
      resolve(computeHash(dataUrl.slice(0, 100)));
    }
  });
}

/**
 * Calculates Hamming distance between two hex hashes (0 = identical, <= 6 = highly similar).
 */
export function calculateHammingDistance(hashA: string, hashB: string): number {
  if (hashA.length !== hashB.length) return 64;
  let dist = 0;
  for (let i = 0; i < hashA.length; i++) {
    const valA = parseInt(hashA[i], 16);
    const valB = parseInt(hashB[i], 16);
    let xor = valA ^ valB;
    while (xor > 0) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}

/**
 * Checks if cache entry is expired (TTL for small questions is longer)
 */
function isExpired(entry: CacheEntry): boolean {
  const now = Date.now();
  const ageMs = now - entry.timestamp;
  // Small compound questions: cache for 7 days (high reuse)
  // Regular: 3 days
  // Vision: 1 day
  const isSmall = entry.hash.length > 0 && (entry as any).isCompound;
  const ttl = isSmall ? 7 * 24 * 60 * 60 * 1000 : entry.imageHash ? 24 * 60 * 60 * 1000 : 3 * 24 * 60 * 60 * 1000;
  return ageMs > ttl;
}

/**
 * Finds a cached response:
 * 1. Checks RAM Cache (with alternative keys for small questions).
 * 2. Checks LocalStorage Cache.
 * 3. Checks Firebase Firestore (`lisyan_cache`).
 * 4. Image perceptual hash
 */
export async function getCachedResponse(
  prompt: string,
  modelId: string,
  lang: string,
  imageDataUrl?: string
): Promise<{ entry: CacheEntry; source: "ram" | "local" | "firebase" | "image_similarity" } | null> {
  const promptKeys = buildAlternativeKeys(prompt, modelId, lang);

  // 1. RAM Cache check — try all alternative keys
  for (const key of promptKeys) {
    const ramEntry = RAM_CACHE.get(key);
    if (ramEntry && !isExpired(ramEntry)) {
      ramEntry.hitCount++;
      return { entry: ramEntry, source: "ram" };
    }
  }

  // 2. LocalStorage Cache check
  try {
    for (const key of promptKeys) {
      const localRaw = localStorage.getItem(`linkerru_lisyan_cache_${key}`);
      if (localRaw) {
        const entry: CacheEntry = JSON.parse(localRaw);
        if (isExpired(entry)) {
          localStorage.removeItem(`linkerru_lisyan_cache_${key}`);
          continue;
        }
        entry.hitCount = (entry.hitCount || 0) + 1;
        RAM_CACHE.set(key, entry);
        return { entry, source: "local" };
      }
    }
  } catch {
    /* ignore local storage error */
  }

  // 3. Image Perceptual Hash Check
  if (imageDataUrl) {
    const imgHash = await computeImageDHash(imageDataUrl);
    // Search cached image entries in RAM or local
    for (const [_, entry] of RAM_CACHE) {
      if (entry.imageHash && !isExpired(entry)) {
        const dist = calculateHammingDistance(imgHash, entry.imageHash);
        if (dist <= 5) {
          // Similarity >= 92%
          entry.hitCount++;
          return { entry, source: "image_similarity" };
        }
      }
    }
  }

  // 4. Firestore Cache check — only try primary key to avoid extra reads
  try {
    const primaryKey = promptKeys[0];
    const docRef = doc(db, "lisyan_cache", primaryKey);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const entry = docSnap.data() as CacheEntry;
      if (isExpired(entry)) {
        return null;
      }
      entry.hitCount = (entry.hitCount || 0) + 1;
      RAM_CACHE.set(primaryKey, entry);
      try {
        localStorage.setItem(`linkerru_lisyan_cache_${primaryKey}`, JSON.stringify(entry));
      } catch {
        /* ignore */
      }
      return { entry, source: "firebase" };
    }
  } catch {
    /* Firestore optional fallback */
  }

  return null;
}

/**
 * Saves a new response to RAM, LocalStorage, and Firebase Firestore in the background.
 */
export async function saveCachedResponse(
  prompt: string,
  response: string,
  modelId: string,
  lang: string,
  tokensSaved: number = 0,
  imageDataUrl?: string,
  structuredQuestions?: any
): Promise<void> {
  if (!response || response.trim().length < 5) return;

  const promptKey = buildPromptKey(prompt, modelId, lang);
  let imageHash: string | undefined;

  if (imageDataUrl) {
    imageHash = await computeImageDHash(imageDataUrl);
  }

  const isCompound = prompt.trim().length <= 200;

  const entry: CacheEntry = {
    hash: promptKey,
    response,
    modelId,
    lang,
    timestamp: Date.now(),
    hitCount: 1,
    tokensSaved,
    imageHash,
    structuredQuestions,
    isCompound,
  };

  // 1. RAM Cache — LRU eviction
  if (RAM_CACHE.size >= MAX_RAM_ENTRIES) {
    // Evict oldest (first inserted) — but prefer to keep compound entries
    let oldestKey: string | undefined;
    let oldestTime = Infinity;
    for (const [k, v] of RAM_CACHE) {
      // Prefer evicting non-compound, older entries
      const score = v.timestamp + (v.isCompound ? 10000000 : 0) - v.hitCount * 100000;
      if (score < oldestTime) {
        oldestTime = score;
        oldestKey = k;
      }
    }
    if (oldestKey) RAM_CACHE.delete(oldestKey);
    else {
      const firstKey = RAM_CACHE.keys().next().value;
      if (firstKey) RAM_CACHE.delete(firstKey);
    }
  }
  RAM_CACHE.set(promptKey, entry);

  // 2. LocalStorage Cache
  try {
    localStorage.setItem(`linkerru_lisyan_cache_${promptKey}`, JSON.stringify(entry));
  } catch {
    // If quota exceeded, try to clear oldest local cache entries
    try {
      const keys: { key: string; time: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("linkerru_lisyan_cache_")) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const e = JSON.parse(raw) as CacheEntry;
              keys.push({ key: k, time: e.timestamp || 0 });
            }
          } catch {}
        }
      }
      keys.sort((a, b) => a.time - b.time);
      // Remove 5 oldest
      for (let i = 0; i < Math.min(5, keys.length); i++) {
        localStorage.removeItem(keys[i].key);
      }
      // Retry
      localStorage.setItem(`linkerru_lisyan_cache_${promptKey}`, JSON.stringify(entry));
    } catch {
      /* ignore storage quota */
    }
  }

  // 3. Firestore Cache (fire-and-forget background sync)
  try {
    const docRef = doc(db, "lisyan_cache", promptKey);
    setDoc(docRef, entry, { merge: true }).catch(() => {});
  } catch {
    /* ignore */
  }
}

/**
 * Clears expired entries from RAM and LocalStorage — called periodically
 */
export function cleanupExpiredCache(): number {
  let removed = 0;
  for (const [k, v] of RAM_CACHE) {
    if (isExpired(v)) {
      RAM_CACHE.delete(k);
      removed++;
    }
  }
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("linkerru_lisyan_cache_")) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const e = JSON.parse(raw) as CacheEntry;
            if (isExpired(e)) toRemove.push(key);
          }
        } catch {
          toRemove.push(key!);
        }
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    removed += toRemove.length;
  } catch {}
  return removed;
}

// Synchronous RAM-only check for ultra-fast path (<0.1ms)
export function getRamCacheSync(
  prompt: string,
  modelId: string,
  lang: string
): CacheEntry | null {
  try {
    const keys = buildAlternativeKeys(prompt, modelId, lang);
    for (const key of keys) {
      const entry = RAM_CACHE.get(key);
      if (entry && !isExpired(entry)) {
        entry.hitCount++;
        return entry;
      }
    }
  } catch {}
  return null;
}

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}

// Pre-warm RAM cache from localStorage on startup for instant hits
if (typeof window !== 'undefined') {
  try {
    const start = performance.now();
    let loaded = 0;
    for (let i = 0; i < localStorage.length && loaded < 50; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("linkerru_lisyan_cache_")) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const entry = JSON.parse(raw) as CacheEntry;
            if (!isExpired(entry)) {
              // Use prompt key without prefix as RAM key
              const ramKey = key.replace("linkerru_lisyan_cache_", "");
              if (!RAM_CACHE.has(ramKey)) {
                RAM_CACHE.set(ramKey, entry);
                loaded++;
              }
            }
          }
        } catch {}
      }
    }
    if (loaded > 0) {
      console.log(`[Cache] Pre-warmed ${loaded} entries in ${(performance.now() - start).toFixed(1)}ms`);
    }
  } catch {}
}

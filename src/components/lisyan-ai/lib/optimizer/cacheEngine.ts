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
}

// In-Memory LRU / RAM Cache for instantaneous sub-1ms lookups
const RAM_CACHE = new Map<string, CacheEntry>();
const MAX_RAM_ENTRIES = 120;

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
 * Generates an exact lookup key for normalized text prompt
 */
export function buildPromptKey(normalizedPrompt: string, modelId: string, lang: string): string {
  const clean = normalizeText(normalizedPrompt).toLowerCase();
  return `p_${modelId}_${lang}_${computeHash(clean)}`;
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
 * Finds a cached response:
 * 1. Checks RAM Cache.
 * 2. Checks LocalStorage Cache.
 * 3. Checks Firebase Firestore (`lisyan_cache`).
 */
export async function getCachedResponse(
  prompt: string,
  modelId: string,
  lang: string,
  imageDataUrl?: string
): Promise<{ entry: CacheEntry; source: "ram" | "local" | "firebase" | "image_similarity" } | null> {
  const promptKey = buildPromptKey(prompt, modelId, lang);

  // 1. RAM Cache check
  const ramEntry = RAM_CACHE.get(promptKey);
  if (ramEntry) {
    ramEntry.hitCount++;
    return { entry: ramEntry, source: "ram" };
  }

  // 2. LocalStorage Cache check
  try {
    const localRaw = localStorage.getItem(`linkerru_lisyan_cache_${promptKey}`);
    if (localRaw) {
      const entry: CacheEntry = JSON.parse(localRaw);
      entry.hitCount = (entry.hitCount || 0) + 1;
      RAM_CACHE.set(promptKey, entry);
      return { entry, source: "local" };
    }
  } catch {
    /* ignore local storage error */
  }

  // 3. Image Perceptual Hash Check
  if (imageDataUrl) {
    const imgHash = await computeImageDHash(imageDataUrl);
    // Search cached image entries in RAM or local
    for (const [_, entry] of RAM_CACHE) {
      if (entry.imageHash) {
        const dist = calculateHammingDistance(imgHash, entry.imageHash);
        if (dist <= 5) {
          // Similarity >= 92%
          entry.hitCount++;
          return { entry, source: "image_similarity" };
        }
      }
    }
  }

  // 4. Firestore Cache check
  try {
    const docRef = doc(db, "lisyan_cache", promptKey);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const entry = docSnap.data() as CacheEntry;
      entry.hitCount = (entry.hitCount || 0) + 1;
      RAM_CACHE.set(promptKey, entry);
      try {
        localStorage.setItem(`linkerru_lisyan_cache_${promptKey}`, JSON.stringify(entry));
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
  };

  // 1. RAM Cache
  if (RAM_CACHE.size >= MAX_RAM_ENTRIES) {
    const firstKey = RAM_CACHE.keys().next().value;
    if (firstKey) RAM_CACHE.delete(firstKey);
  }
  RAM_CACHE.set(promptKey, entry);

  // 2. LocalStorage Cache
  try {
    localStorage.setItem(`linkerru_lisyan_cache_${promptKey}`, JSON.stringify(entry));
  } catch {
    /* ignore storage quota */
  }

  // 3. Firestore Cache (fire-and-forget background sync)
  try {
    const docRef = doc(db, "lisyan_cache", promptKey);
    setDoc(docRef, entry, { merge: true }).catch(() => {});
  } catch {
    /* ignore */
  }
}

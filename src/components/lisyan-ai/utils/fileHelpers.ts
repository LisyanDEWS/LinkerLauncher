import type { AttachedFile } from "../types";
import mammoth from "mammoth";

const MAX_IMAGE_SIDE = 768;
const JPEG_QUALITY = 0.75;
const MAX_IMAGE_BYTES = 250 * 1024;
export const MAX_FILE_CHARS = 30000;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "avif", "ico", "tiff", "tif", "heic"
]);

const WORD_EXTENSIONS = new Set(["docx", "doc", "rtf", "odt", "docm", "dotx"]);

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "json", "js", "jsx", "ts", "tsx",
  "html", "htm", "css", "scss", "py", "sh", "bash", "yml", "yaml",
  "xml", "sql", "csv", "tsv", "env", "c", "cpp", "h", "hpp", "java",
  "rs", "go", "php", "rb", "swift", "kt", "toml", "ini", "log", "rtf", "odt", "pdf"
]);

export function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.has(ext);
}

export function isWordDocument(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (WORD_EXTENSIONS.has(ext)) return true;
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword" ||
    file.type === "application/rtf" ||
    file.type === "text/rtf" ||
    file.type === "application/vnd.oasis.opendocument.text"
  );
}

export function isTextFile(file: File): boolean {
  if (file.type && file.type.startsWith("text/")) return true;
  if (
    file.type === "application/json" ||
    file.type === "application/javascript" ||
    file.type === "application/xml" ||
    file.type === "application/x-yaml" ||
    file.type === "application/csv" ||
    file.type === "application/pdf"
  ) {
    return true;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return TEXT_EXTENSIONS.has(ext);
}

function decodeWindows1251Byte(byte: number): string {
  if (byte >= 192 && byte <= 255) {
    // 192 is Russian 'А', 255 is 'я'
    return String.fromCharCode(0x0410 + (byte - 192));
  }
  if (byte === 168) return 'Ё';
  if (byte === 184) return 'ё';
  if (byte >= 32 && byte <= 126) return String.fromCharCode(byte);
  if (byte === 10 || byte === 13 || byte === 9) return String.fromCharCode(byte);
  return '';
}

function extractTextFromBinaryDoc(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  
  // 1. Scan for 16-bit UTF-16LE characters common in Word documents
  const utf16Words: string[] = [];
  let currentWord: string[] = [];
  for (let i = 0; i < bytes.length - 1; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8);
    if (
      (code >= 32 && code <= 126) ||
      (code >= 0x0400 && code <= 0x04ff) || // Cyrillic
      code === 10 || code === 13 || code === 9
    ) {
      currentWord.push(String.fromCharCode(code));
    } else {
      if (currentWord.length >= 3) {
        utf16Words.push(currentWord.join(""));
      }
      currentWord = [];
    }
  }
  if (currentWord.length >= 3) utf16Words.push(currentWord.join(""));

  const utf16Text = utf16Words.join(" ").replace(/\s+/g, " ").trim();
  if (utf16Text.length > 60) {
    return utf16Text;
  }

  // 2. Scan for Windows-1251 (Cyrillic CP1251) and ASCII text chunks
  const cp1251Words: string[] = [];
  let cpWord: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const ch = decodeWindows1251Byte(bytes[i]);
    if (ch) {
      cpWord.push(ch);
    } else {
      if (cpWord.length >= 4) {
        cp1251Words.push(cpWord.join(""));
      }
      cpWord = [];
    }
  }
  if (cpWord.length >= 4) cp1251Words.push(cpWord.join(""));

  const cp1251Text = cp1251Words.join(" ").replace(/\s+/g, " ").trim();
  return cp1251Text.length > utf16Text.length ? cp1251Text : utf16Text;
}

function extractTextFromPdf(buffer: ArrayBuffer): string {
  try {
    const decoder = new TextDecoder('latin1');
    const content = decoder.decode(buffer);
    const textPieces: string[] = [];

    // Extract text from PDF parentheses: (text) Tj or [(t)(e)(x)(t)] TJ
    const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let match;
    while ((match = tjRegex.exec(content)) !== null) {
      const unescaped = match[1]
        .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
        .replace(/\\([\\()nrtbf])/g, (_, ch) => {
          if (ch === 'n') return '\n';
          if (ch === 'r') return '\r';
          if (ch === 't') return '\t';
          return ch;
        });
      if (unescaped.trim().length > 1) {
        textPieces.push(unescaped);
      }
    }

    if (textPieces.length > 5) {
      return textPieces.join(" ").replace(/\s+/g, " ").trim();
    }

    // Fallback: extract printable strings of 4+ characters
    const stringMatches = content.match(/[A-Za-zА-Яа-я0-9\s.,!?:;()\-]{6,}/g) || [];
    const filtered = stringMatches.filter(s => !s.startsWith('/Font') && !s.startsWith('/ProcSet') && !s.includes('endobj'));
    return filtered.join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

async function compressImage(file: File): Promise<string> {
  const originalDataUrl = await readAsDataURL(file);
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  
  // If already under reasonable size and is standard webp/png/jpg, keep format
  if (file.size <= MAX_IMAGE_BYTES && (ext === "webp" || ext === "png" || ext === "jpeg" || ext === "jpg")) {
    return originalDataUrl;
  }

  try {
    const img = await loadImage(originalDataUrl);
    let side = MAX_IMAGE_SIDE;
    let quality = JPEG_QUALITY;
    let result = originalDataUrl;

    const outputType = ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";

    for (let attempt = 0; attempt < 4; attempt++) {
      const scale = Math.min(1, side / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return originalDataUrl;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      result = canvas.toDataURL(outputType, quality);
      if (approxBytesFromDataUrl(result) <= MAX_IMAGE_BYTES) break;
      side = Math.round(side * 0.75);
      quality = Math.max(0.4, quality - 0.1);
    }
    return result.length < originalDataUrl.length ? result : originalDataUrl;
  } catch {
    return originalDataUrl;
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function approxBytesFromDataUrl(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.round((base64.length * 3) / 4);
}

export async function processUploadedFile(file: File): Promise<AttachedFile> {
  const isImage = isImageFile(file);
  const isWord = isWordDocument(file);
  const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
  const isText = !isImage && (isTextFile(file) || isWord || isPdf);
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  let dataUrl: string | undefined;
  let textContent: string | undefined;
  let size = file.size;
  let originalSize: number | undefined;

  if (isImage) {
    dataUrl = await compressImage(file);
    const newSize = approxBytesFromDataUrl(dataUrl);
    if (newSize < file.size) {
      originalSize = file.size;
      size = newSize;
    }
  } else if (isWord) {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const arrayBuffer = await file.arrayBuffer();
      if (ext === "docx" || ext === "docm" || ext === "dotx") {
        let raw = "";
        try {
          const parsed = await mammoth.extractRawText({ arrayBuffer });
          raw = (parsed.value || "").trim();
        } catch {}
        if (!raw) {
          try {
            const md = await mammoth.convertToMarkdown({ arrayBuffer });
            raw = (md.value || "").trim();
          } catch {}
        }
        if (!raw) {
          raw = extractTextFromBinaryDoc(arrayBuffer);
        }
        textContent =
          raw.length > MAX_FILE_CHARS
            ? raw.slice(0, MAX_FILE_CHARS) +
              `\n\n[Текст документа сокращен: показано ${MAX_FILE_CHARS} из ${raw.length} символов]`
            : raw;
      } else {
        // .doc, .rtf, binary Word format
        const raw = extractTextFromBinaryDoc(arrayBuffer);
        textContent =
          raw.length > MAX_FILE_CHARS
            ? raw.slice(0, MAX_FILE_CHARS) +
              `\n\n[Текст документа сокращен: показано ${MAX_FILE_CHARS} из ${raw.length} символов]`
            : raw;
      }
    } catch (docErr) {
      console.warn("Failed to parse Word document:", docErr);
      textContent = `[Не удалось полностью прочитать документ ${file.name}]`;
    }
  } else if (isPdf) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const raw = extractTextFromPdf(arrayBuffer);
      if (raw) {
        textContent =
          raw.length > MAX_FILE_CHARS
            ? raw.slice(0, MAX_FILE_CHARS) +
              `\n\n[Текст PDF сокращен: показано ${MAX_FILE_CHARS} из ${raw.length} символов]`
            : raw;
      }
    } catch (pdfErr) {
      console.warn("Failed to parse PDF document:", pdfErr);
    }
  } else if (isText && file.size <= 8 * 1024 * 1024) {
    try {
      const raw = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
      textContent =
        raw.length > MAX_FILE_CHARS
          ? raw.slice(0, MAX_FILE_CHARS) +
            `\n\n[Текст сокращен: показано ${MAX_FILE_CHARS} из ${raw.length} символов]`
          : raw;
    } catch (txtErr) {
      console.warn("Failed to read text file:", txtErr);
    }
  }

  return {
    id,
    name: file.name,
    size,
    originalSize,
    type: file.type || (isWord ? "application/msword" : isPdf ? "application/pdf" : isImage ? "image/jpeg" : "application/octet-stream"),
    dataUrl,
    textContent,
    isImage,
  };
}

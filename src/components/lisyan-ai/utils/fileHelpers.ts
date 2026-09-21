import type { AttachedFile } from "../types";

const MAX_IMAGE_SIDE = 512;
const JPEG_QUALITY = 0.6;
const MAX_IMAGE_BYTES = 90 * 1024;
export const MAX_FILE_CHARS = 6000;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "json", "js", "jsx", "ts", "tsx",
  "html", "css", "scss", "py", "sh", "bash", "yml", "yaml",
  "xml", "sql", "csv", "env", "c", "cpp", "h", "hpp", "java",
  "rs", "go", "php", "rb", "swift", "kt", "toml", "ini", "log",
]);

export function isTextFile(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  if (
    file.type === "application/json" ||
    file.type === "application/javascript" ||
    file.type === "application/xml"
  ) {
    return true;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return TEXT_EXTENSIONS.has(ext);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

async function compressImage(file: File): Promise<string> {
  const originalDataUrl = await readAsDataURL(file);
  try {
    const img = await loadImage(originalDataUrl);
    let side = MAX_IMAGE_SIDE;
    let quality = JPEG_QUALITY;
    let result = originalDataUrl;

    for (let attempt = 0; attempt < 4; attempt++) {
      const scale = Math.min(1, side / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return originalDataUrl;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      result = canvas.toDataURL("image/jpeg", quality);
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
  const isText = isTextFile(file);
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
  } else if (isText && file.size <= 2 * 1024 * 1024) {
    const raw = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
    textContent =
      raw.length > MAX_FILE_CHARS
        ? raw.slice(0, MAX_FILE_CHARS) +
          `\n\n[Truncated: ${MAX_FILE_CHARS} of ${raw.length} characters]`
        : raw;
  }

  return {
    id,
    name: file.name,
    size,
    originalSize,
    type: file.type || "application/octet-stream",
    dataUrl,
    textContent,
    isImage,
  };
}

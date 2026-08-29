/**
 * Canvas-based renderer for the loading indicator shape.
 */
import type { Point } from "./shapes";

export interface RenderOptions {
  color: string;
  /** Ratio of indicator size to canvas size (default 0.79 = 38dp/48dp). */
  sizeRatio?: number;
  /** If true, draw a circular container behind the indicator. */
  contained?: boolean;
  /** Container background color (default "rgba(0,0,0,0.08)"). */
  containerColor?: string;
}

/**
 * Draw a morphed shape onto a canvas context.
 *
 * @param ctx - 2D canvas context (already scaled for DPR)
 * @param cssSize - The CSS pixel size of the canvas
 * @param points - Morphed shape points in [-1, 1] normalized space
 * @param rotation - Rotation angle in degrees
 * @param options - Color and sizing
 */
export function drawIndicator(
  ctx: CanvasRenderingContext2D,
  cssSize: number,
  points: Point[],
  rotation: number,
  options: RenderOptions,
): void {
  const ratio = options.sizeRatio ?? 0.79;
  const indicatorSize = cssSize * ratio;
  const cx = cssSize / 2;
  const cy = cssSize / 2;
  const scale = indicatorSize / 2;

  ctx.clearRect(0, 0, cssSize, cssSize);

  // Draw circular container if contained mode (clean matte container)
  if (options.contained) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cssSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = options.containerColor ?? "rgba(0,0,0,0.06)";
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);

  // Smooth closed curve path
  const len = points.length;
  if (len > 2) {
    ctx.beginPath();
    
    // Compute midpoint between last point and first point
    const pLast = points[len - 1];
    const pFirst = points[0];
    const startX = ((pLast[0] + pFirst[0]) / 2) * scale;
    const startY = ((pLast[1] + pFirst[1]) / 2) * scale;
    ctx.moveTo(startX, startY);

    for (let i = 0; i < len; i++) {
      const pCurrent = points[i];
      const pNext = points[(i + 1) % len];
      const midX = ((pCurrent[0] + pNext[0]) / 2) * scale;
      const midY = ((pCurrent[1] + pNext[1]) / 2) * scale;
      ctx.quadraticCurveTo(pCurrent[0] * scale, pCurrent[1] * scale, midX, midY);
    }
    ctx.closePath();
    
    // Crisp, pure matte fill (non-glossy, high precision)
    ctx.fillStyle = options.color;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Set up a canvas for high-DPI rendering.
 *
 * @returns The DPR-scaled context ready for drawing
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  cssSize: number,
): CanvasRenderingContext2D {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const px = Math.round(cssSize * dpr);
  canvas.width = px;
  canvas.height = px;
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  return ctx;
}

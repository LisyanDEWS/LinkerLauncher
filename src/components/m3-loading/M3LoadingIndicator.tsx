import {
  useRef,
  useLayoutEffect,
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { M3Animator, getMorphedShape, drawIndicator, setupCanvas } from "./index";

export interface M3LoadingIndicatorProps
  extends Omit<HTMLAttributes<HTMLCanvasElement>, "children"> {
  /** CSS pixel size of the indicator (default 48). */
  size?: number;
  /** Fill color (default: var(--accent)). */
  color?: string;
  /** Ratio of indicator shape to container (default 0.79 = 38/48dp). */
  sizeRatio?: number;
  /** Animation speed multiplier (default 1). */
  speed?: number;
  /** Pause the animation. */
  paused?: boolean;
  /** Render with circular container background. */
  contained?: boolean;
  /** Container background color when contained (default "rgba(0,0,0,0.08)"). */
  containerColor?: string;
}

function resolveCanvasColor(canvas: HTMLCanvasElement | null, rawColor?: string): string {
  if (!rawColor) return "var(--accent)";
  if (typeof window === "undefined") return rawColor;

  if (rawColor.includes("var(") || rawColor.startsWith("--") || rawColor === "currentColor") {
    const target = canvas || document.documentElement;
    const computedStyle = getComputedStyle(target);

    const match = rawColor.match(/var\(\s*([^,\s)]+)(?:\s*,\s*([^)]+))?\s*\)/);
    if (match) {
      const varName = match[1];
      const fallback = match[2];
      const val = computedStyle.getPropertyValue(varName).trim();
      if (val) {
        if (val.includes("var(") || val.startsWith("--")) {
          return resolveCanvasColor(canvas, val);
        }
        return val;
      }
      if (fallback) {
        return resolveCanvasColor(canvas, fallback.trim());
      }
    } else if (rawColor.startsWith("--")) {
      const val = computedStyle.getPropertyValue(rawColor).trim();
      if (val) return resolveCanvasColor(canvas, val);
    } else if (rawColor === "currentColor") {
      const computed = computedStyle.color;
      if (computed) return computed;
    }
  }

  return rawColor;
}

/**
 * Material Design 3 Expressive Loading Indicator for React.
 *
 * Renders a canvas element with the morphing shape animation.
 */
export const M3LoadingIndicator = forwardRef<
  HTMLCanvasElement,
  M3LoadingIndicatorProps
>(function M3LoadingIndicator(
  {
    size = 48,
    color = "var(--accent)",
    sizeRatio = 0.79,
    speed = 1,
    paused = false,
    contained = false,
    containerColor,
    style,
    ...rest
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<M3Animator | null>(null);
  const rafRef = useRef<number>(0);

  // Sync mutable values without re-triggering effect
  const propsRef = useRef({ color, sizeRatio, speed, paused, contained, containerColor });
  propsRef.current = { color, sizeRatio, speed, paused, contained, containerColor };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = setupCanvas(canvas, size);

    const anim = new M3Animator();
    animRef.current = anim;

    const loop = (ts: number) => {
      const p = propsRef.current;
      anim.speed = p.speed;
      anim.paused = p.paused;
      anim.update(ts);
      const shape = getMorphedShape(anim.morph);
      const resolvedColor = resolveCanvasColor(canvas, p.color);
      const resolvedContainer = p.containerColor
        ? resolveCanvasColor(canvas, p.containerColor)
        : undefined;

      drawIndicator(ctx, size, shape, anim.rotation, {
        color: resolvedColor,
        sizeRatio: p.sizeRatio,
        contained: p.contained,
        containerColor: resolvedContainer,
      });
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [size]);

  const mergedStyle: CSSProperties = {
    display: "block",
    width: size,
    height: size,
    ...style,
  };

  return (
    <canvas
      ref={(el) => {
        canvasRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      aria-label="Loading"
      width={size}
      height={size}
      style={mergedStyle}
      {...rest}
    />
  );
});

export default M3LoadingIndicator;

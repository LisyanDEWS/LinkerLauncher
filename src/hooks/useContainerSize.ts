import { useState, useEffect, useRef } from 'react';

/**
 * useContainerSize — tracks the dimensions of a container element via ResizeObserver.
 *
 * Returns a ref to attach to the container element, plus the current width/height
 * and an `isNarrow` flag that is true when the container is in a "mobile" state
 * (width < breakpoint, or very vertical aspect ratio).
 *
 * This allows components rendered inside a window-manager floating window to
 * respond to the window's dimensions rather than the browser viewport.
 *
 * @param narrowBreakpoint - width in px below which isNarrow becomes true (default 580)
 * @param aspectThreshold  - if height > width * aspectThreshold AND width < aspectWidthLimit, also narrow (default 1.3, 480)
 */
export function useContainerSize(
  narrowBreakpoint = 580,
  aspectThreshold = 1.3,
  aspectWidthLimit = 480,
) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        setWidth(w);
        setHeight(h);
        const isVerticalAspect = h > w * aspectThreshold;
        setIsNarrow(w < narrowBreakpoint || (w < aspectWidthLimit && isVerticalAspect));
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [narrowBreakpoint, aspectThreshold, aspectWidthLimit]);

  return { ref, width, height, isNarrow };
}

import { useEffect, useState, useRef } from 'react';
import { M3LoadingIndicator } from './m3-loading/M3LoadingIndicator';

interface AppLoaderProps {
  /** List of image URLs to preload before dismissing the loader. */
  imageUrls?: string[];
  /** Minimum time (ms) the loader stays visible, even if everything loads faster. */
  minDuration?: number;
  /** Accent color for the loading indicator. */
  color?: string;
  /** Background to match the app's wallpaper (avoids brightness flash on fade-out). */
  background?: string;
  /** Brightness level (0-100). Applies a matching dim overlay so the loader
   *  matches the app's brightness setting during fade-out. */
  brightness?: number;
  /** Whether the system is currently performing an update. */
  isUpdating?: boolean;
  /** Custom title for updating mode. */
  updatingTitle?: string;
  /** Custom subtitle for updating mode. */
  updatingSubtitle?: string;
  /** Called once the loader has fully faded out and been removed from the DOM. */
  onComplete?: () => void;
}

/**
 * AppLoader — shows a blurred preview of the app with an M3 Expressive
 * loading indicator centered on top. Stays visible until all specified
 * images have finished loading (or failed) AND the minimum duration has
 * elapsed. Then fades out the indicator and removes the blur.
 */
export function AppLoader({
  imageUrls = [],
  minDuration = 1200,
  color = 'var(--accent)',
  background,
  brightness = 100,
  isUpdating = false,
  updatingTitle,
  updatingSubtitle,
  onComplete,
}: AppLoaderProps) {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'hidden'>('visible');
  const imagesLoadedRef = useRef(0);
  const totalImages = imageUrls.length;
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    if (totalImages === 0) {
      imagesLoadedRef.current = 0;
    } else {
      imageUrls.forEach((url) => {
        const img = new Image();
        img.onload = () => { imagesLoadedRef.current++; checkDone(); };
        img.onerror = () => { imagesLoadedRef.current++; checkDone(); };
        img.src = url;
      });
    }

    function checkDone() {
      if (imagesLoadedRef.current >= totalImages) {
        const elapsed = performance.now() - startTimeRef.current;
        const remaining = Math.max(0, minDuration - elapsed);
        setTimeout(() => setPhase('fading'), remaining);
      }
    }

    // If no images, just wait for minDuration
    if (totalImages === 0) {
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, minDuration - elapsed);
      const t = setTimeout(() => setPhase('fading'), remaining);
      return () => clearTimeout(t);
    }

    return () => {};
  }, [imageUrls, totalImages, minDuration]);

  // After fade-out transition completes, remove from DOM and notify parent.
  useEffect(() => {
    if (phase === 'fading') {
      const t = setTimeout(() => {
        setPhase('hidden');
        onComplete?.();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  if (phase === 'hidden') return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none select-none"
      style={{
        backdropFilter: 'blur(28px) saturate(150%)',
        WebkitBackdropFilter: 'blur(28px) saturate(150%)',
        // Semi-transparent tint over the wallpaper so the blurred interface
        // is visible behind the loader, not fully covered.
        background: background
          ? `color-mix(in srgb, ${background} 60%, transparent)`
          : 'color-mix(in srgb, var(--bg) 60%, transparent)',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Brightness dim overlay — matches the app's brightness setting so
          there's no brightness flash when the loader fades out. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${1 - brightness / 100})`,
        }}
      />
      <div className="flex flex-col items-center justify-center relative z-10">
        <div
          style={{
            width: isUpdating ? 80 : 56,
            height: isUpdating ? 80 : 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <M3LoadingIndicator size={isUpdating ? 78 : 56} color={color} speed={isUpdating ? 1.1 : 1} />
        </div>

        {isUpdating && (
          <div className="mt-7 flex flex-col items-center gap-1.5 text-center px-4 max-w-sm">
            <span className="text-base sm:text-lg font-black tracking-tight text-[var(--on-surface)] leading-snug">
              {updatingTitle || 'Ваша система обновляется'}
            </span>
            <span className="text-xs sm:text-[13px] font-semibold text-[var(--on-surface-var)] opacity-85 leading-relaxed">
              {updatingSubtitle || 'Применение последних изменений и синхронизация'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppLoader;

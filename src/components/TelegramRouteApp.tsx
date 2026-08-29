import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { M3LoadingIndicator } from './m3-loading/M3LoadingIndicator';
import { Language } from '../types';

interface TelegramRouteAppProps {
  lang?: Language;
  onReloadTrigger?: () => void;
}

export function TelegramRouteApp({ lang = 'ru', onReloadTrigger }: TelegramRouteAppProps) {
  const isRu = lang === 'ru';
  const isUk = lang === 'uk';
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastReloadTimeRef = useRef<number>(Date.now());
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setProgress(0);
    const startTime = Date.now();
    const duration = 20000; // 20 seconds loading as requested

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(currentProgress);
      if (elapsed >= duration) {
        clearInterval(interval);
        setIsLoading(false);
        setIsReloading(false);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [reloadKey]);

  const triggerReload = useCallback(() => {
    setIsReloading(true);
    setIsLoading(true);
    setProgress(0);
    lastReloadTimeRef.current = Date.now();
    setReloadKey((prev) => prev + 1);
    onReloadTrigger?.();
  }, [onReloadTrigger]);

  // 1. Tab visibility change & focus listener
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Throttle auto-reload to avoid rapid multiple refreshes (minimum 2.5s)
        if (now - lastReloadTimeRef.current > 2500) {
          triggerReload();
        }
      }
    };

    const handleWindowFocus = () => {
      const now = Date.now();
      if (now - lastReloadTimeRef.current > 2500) {
        triggerReload();
      }
    };

    const handleOnline = () => {
      triggerReload();
    };

    const handlePageShow = () => {
      const now = Date.now();
      if (now - lastReloadTimeRef.current > 2500) {
        triggerReload();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('pageshow', handlePageShow);

    // 2. Chromebook & Laptop sleep/suspend resume detector
    let lastTick = Date.now();
    const sleepInterval = setInterval(() => {
      const current = Date.now();
      // If tick gap > 3500ms, the OS / Chromebook went to sleep and just resumed
      if (current - lastTick > 3500) {
        triggerReload();
      }
      lastTick = current;
    }, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('pageshow', handlePageShow);
      clearInterval(sleepInterval);
    };
  }, [triggerReload]);

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--surface)] select-none overflow-hidden font-sans">
      {/* Main Iframe container */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-transparent">
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src="https://linkerroutetraffic.sonytvrepair.com/"
          className="w-full h-full border-none bg-transparent"
          title="Telegram Route Frame"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
          allow="fullscreen; autoplay; clipboard-read; clipboard-write"
        />

        {/* M3 Material You reload / launch animation overlay */}
        {(isLoading || isReloading) && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center select-none bg-[var(--surface)]/85 backdrop-blur-xl transition-opacity duration-300"
          >
            <div className="flex flex-col items-center gap-4 px-4 text-center w-full max-w-sm">
              <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <M3LoadingIndicator size={48} color="var(--accent)" speed={1} />
              </div>
              
              {/* Status Bar Pill with wave filling effect */}
              <div className="relative overflow-hidden flex items-center justify-between w-full px-4 py-2.5 rounded-full bg-[var(--container-high)] border border-[var(--outline-var)] shadow-sm">
                {/* Horizontal status fill */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-100 ease-out"
                  style={{
                    width: `${Math.min(100, Math.round(progress))}%`,
                    background: 'linear-gradient(90deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 75%, white) 50%, var(--accent) 100%)',
                    backgroundSize: '200% 100%',
                    opacity: 0.88,
                  }}
                />
                
                {/* Subtle animated wave shimmer */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-30 animate-pulse"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                  }}
                />

                <div className="relative z-10 flex items-center gap-2 text-[var(--on-surface)]">
                  <Send size={13} className={progress > 20 ? 'text-white' : 'text-[var(--accent)]'} />
                  <span className={`text-xs font-bold transition-colors ${progress > 45 ? 'text-white drop-shadow-xs' : 'text-[var(--on-surface)]'}`}>
                    {isRu ? 'Обновление сессии Telegram...' : isUk ? 'Оновлення сесії Telegram...' : 'Refreshing Telegram session...'}
                  </span>
                </div>
                <span className={`relative z-10 text-[11px] font-black tabular-nums transition-colors ${progress > 85 ? 'text-white' : 'text-[var(--on-surface-var)]'}`}>
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TelegramRouteApp;

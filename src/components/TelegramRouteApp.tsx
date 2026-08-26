import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCw, Send, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { M3LoadingIndicator } from './m3-loading/M3LoadingIndicator';
import { Language } from '../types';

interface TelegramRouteAppProps {
  lang?: Language;
  onReloadTrigger?: () => void;
}

export function TelegramRouteApp({ lang = 'ru', onReloadTrigger }: TelegramRouteAppProps) {
  const isRu = lang === 'ru';
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const lastReloadTimeRef = useRef<number>(Date.now());
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsReloading(false);
    }, 9000);
    return () => clearTimeout(timer);
  }, [reloadKey]);

  const triggerReload = useCallback(() => {
    setIsReloading(true);
    setIsLoading(true);
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
      {/* Top subtle status bar */}
      <div className="h-8.5 px-3 bg-[var(--surface-dim)]/90 backdrop-blur-md border-b border-[var(--outline-var)] flex items-center justify-between shrink-0 select-none z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--on-surface)] truncate">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-xs shadow-emerald-500/50" />
          <span className="truncate text-[11px] md:text-xs">Telegram Route Tunnel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--on-surface-var)] font-semibold px-2 py-0.5 rounded-full bg-[var(--container)] border border-[var(--outline-var)]">
            Active · TLS 1.3
          </span>
        </div>
      </div>

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
            <div className="flex flex-col items-center gap-3.5 px-4 text-center">
              <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <M3LoadingIndicator size={44} color="var(--accent)" speed={1} />
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--container-high)] border border-[var(--outline-var)] shadow-xs">
                <Send size={13} className="text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--on-surface)]">
                  {isRu ? 'Обновление сессии Telegram...' : 'Refreshing Telegram session...'}
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

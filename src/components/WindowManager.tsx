import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Square, Copy, Eye, XCircle } from 'lucide-react';
import { Language } from '../types';
import { M3LoadingIndicator } from './m3-loading/M3LoadingIndicator';

/**
 * WindowManager — OS-style window system for LinkerRu apps.
 *
 * Features:
 *  - Apps open as floating popup windows
 *  - Resizable (drag bottom-right corner)
 *  - Draggable (drag title bar; double-click to maximize)
 *  - Maximize / restore (also via double-click on title bar)
 *  - Minimize to a persistent taskbar (app keeps running in background)
 *  - Persistent taskbar at the bottom shows ALL open windows
 *  - Minimized apps are highlighted with a gradient "steel" indicator
 *  - Restore from taskbar; click active app to minimize back
 *  - Close terminates the app
 *  - Focus z-stacking
 */

export interface WindowInstance {
  id: string;
  title: string;
  icon?: React.ReactNode;
  render: () => React.ReactNode;
  initialWidth: number;
  initialHeight: number;
  minWidth?: number;
  minHeight?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
  savedRect?: { x: number; y: number; width: number; height: number };
  zIndex: number;
  /** Incremented to force re-mount of the app content (reload). */
  renderKey: number;
  hideTitleBar?: boolean;
  allowMaximize?: boolean;
  /** Custom action buttons rendered in the title bar (left of minimize/maximize/close). */
  headerActions?: React.ReactNode;
  disableLoader?: boolean;
  loadingDuration?: number;
  loaderTitle?: string;
}

export interface OpenWindowOptions {
  id: string;
  title: string;
  icon?: React.ReactNode;
  render: () => React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  singleton?: boolean;
  hideTitleBar?: boolean;
  allowMaximize?: boolean;
  /** Custom action buttons rendered in the title bar (left of minimize/maximize/close). */
  headerActions?: React.ReactNode;
  disableLoader?: boolean;
  loadingDuration?: number;
  loaderTitle?: string;
}

export interface WindowManager {
  windows: WindowInstance[];
  open: (opts: OpenWindowOptions) => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focus: (id: string) => void;
  isOpen: (id: string) => boolean;
  /** Reload just the app content (re-mount) without closing/reopening the window. */
  reload: (id: string) => void;
}

const MAX_Z = 200;

export function useWindows(): WindowManager {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const zCounter = useRef(100);

  const focus = useCallback((id: string) => {
    setWindows((prev) => {
      zCounter.current = Math.min(zCounter.current + 1, MAX_Z);
      const nextZ = zCounter.current;
      return prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w));
    });
  }, []);

  const open = useCallback((opts: OpenWindowOptions) => {
    window.dispatchEvent(new CustomEvent('linkerru_window_opened'));
    setWindows((prev) => {
      if (opts.singleton) {
        const existing = prev.find((w) => w.id === opts.id);
        if (existing) {
          zCounter.current = Math.min(zCounter.current + 1, MAX_Z);
          const nextZ = zCounter.current;
          return prev.map((w) =>
            w.id === opts.id
              ? {
                  ...w,
                  zIndex: nextZ,
                  isMinimized: false,
                  render: opts.render,
                  title: opts.title,
                  icon: opts.icon,
                  hideTitleBar: opts.hideTitleBar,
                  allowMaximize: opts.allowMaximize ?? true,
                  headerActions: opts.headerActions,
                  disableLoader: opts.disableLoader,
                  loadingDuration: opts.loadingDuration,
                  loaderTitle: opts.loaderTitle,
                }
              : w,
          );
        }
      }
      if (prev.some((w) => w.id === opts.id)) {
        return prev;
      }
      zCounter.current = Math.min(zCounter.current + 1, MAX_Z);
      const nextZ = zCounter.current;
      const isMobileScreen = window.innerWidth < 640;
      
      const w = isMobileScreen 
        ? Math.max(300, window.innerWidth - 16) 
        : Math.min(opts.initialWidth ?? 720, window.innerWidth - 80);
      const h = isMobileScreen 
        ? Math.max(400, window.innerHeight - 72) 
        : Math.min(opts.initialHeight ?? 560, window.innerHeight - 140);

      // Smart window placement:
      const visibleWindows = prev.filter((win) => !win.isMinimized);
      const offsetCount = visibleWindows.length;
      const cascadeX = 32;
      const cascadeY = 28;
      const maxOffsetX = 160;
      const maxOffsetY = 120;

      const centerX = (window.innerWidth - w) / 2;
      const centerY = (window.innerHeight - h) / 2;
      const rawX = isMobileScreen ? 8 : centerX + Math.min(offsetCount * cascadeX, maxOffsetX);
      const rawY = isMobileScreen ? 8 : centerY + Math.min(offsetCount * cascadeY, maxOffsetY);

      // Clamp to viewport with a small margin
      const x = Math.max(4, Math.min(rawX, window.innerWidth - w - 4));
      const y = Math.max(4, Math.min(rawY, window.innerHeight - h - 50));
      const instance: WindowInstance = {
        id: opts.id,
        title: opts.title,
        icon: opts.icon,
        render: opts.render,
        initialWidth: opts.initialWidth ?? 720,
        initialHeight: opts.initialHeight ?? 560,
        minWidth: isMobileScreen ? 280 : (opts.minWidth ?? 360),
        minHeight: isMobileScreen ? 320 : (opts.minHeight ?? 280),
        x,
        y,
        width: w,
        height: h,
        isMaximized: isMobileScreen,
        isMinimized: false,
        zIndex: nextZ,
        renderKey: 0,
        hideTitleBar: opts.hideTitleBar || false,
        allowMaximize: opts.allowMaximize ?? true,
        headerActions: opts.headerActions,
        disableLoader: opts.disableLoader,
        loadingDuration: opts.loadingDuration,
        loaderTitle: opts.loaderTitle,
      };
      return [...prev, instance];
    });
  }, []);

  const close = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimize = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
  }, []);

  const restore = useCallback((id: string) => {
    focus(id);
  }, [focus]);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (w.isMaximized) {
          const r = w.savedRect ?? { x: 80, y: 80, width: w.initialWidth, height: w.initialHeight };
          return { ...w, isMaximized: false, ...r, savedRect: undefined };
        }
        return {
          ...w,
          isMaximized: true,
          savedRect: { x: w.x, y: w.y, width: w.width, height: w.height },
        };
      }),
    );
  }, []);

  const isOpen = useCallback((id: string) => windows.some((w) => w.id === id), [windows]);

  const reload = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, renderKey: w.renderKey + 1 } : w)));
  }, []);

  const updateGeometry = useCallback((id: string, patch: Partial<WindowInstance>) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const manager: WindowManager = {
    windows,
    open,
    close,
    minimize,
    restore,
    toggleMaximize,
    focus,
    isOpen,
    reload,
  };
  (manager as any).__updateGeometry = updateGeometry;
  return manager;
}

/* ---------- Window Manager Layer (renders windows + persistent taskbar) ---------- */

interface WindowManagerLayerProps {
  wm: WindowManager;
  lang: Language;
  isOptimizedEngine?: boolean;
  isMobileLayout?: boolean;
  isStandbyOpen?: boolean;
  renderWindowContent?: (id: string) => React.ReactNode;
}

export function WindowManagerLayer({
  wm,
  lang,
  isOptimizedEngine = false,
  isMobileLayout = false,
  isStandbyOpen = false,
  renderWindowContent,
}: WindowManagerLayerProps) {
  if (isStandbyOpen) return null;

  const isRu = lang === 'ru';
  const updateGeometry = (wm as any).__updateGeometry as (id: string, patch: Partial<WindowInstance>) => void;
  // Taskbar shows ALL open windows (not just minimized)
  const taskbarItems = wm.windows;

  // Find the top-most non-minimized window (the "active" one)
  const activeWin = wm.windows
    .filter((w) => !w.isMinimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0];

  // Right-click context menu state for taskbar pills
  const [ctxMenu, setCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  // Close context menu on any click elsewhere or Escape
  useEffect(() => {
    if (!ctxMenu) return;
    const onAnyClick = () => setCtxMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCtxMenu(null); };
    window.addEventListener('click', onAnyClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', onAnyClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [ctxMenu]);

  const ctxWin = ctxMenu ? wm.windows.find((w) => w.id === ctxMenu.id) : null;

  // Auto-hide taskbar capsule after 5s, pop back up when mouse comes near bottom (< 100px)
  const [isTaskbarVisible, setIsTaskbarVisible] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsTaskbarVisible(true);
    hideTimeoutRef.current = setTimeout(() => {
      setIsTaskbarVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const distFromBottom = window.innerHeight - e.clientY;
      if (distFromBottom <= 100) {
        resetHideTimer();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    resetHideTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [resetHideTimer]);

  useEffect(() => {
    if (taskbarItems.length > 0) {
      resetHideTimer();
    }
  }, [taskbarItems.length, activeWin?.id, resetHideTimer]);

  return (
    <>
      {/* Windows */}
      <AnimatePresence>
        {wm.windows.map((win) => (
          <React.Fragment key={win.id}>
            <WindowFrame
              win={win}
              lang={lang}
              isActive={activeWin?.id === win.id}
              onClose={() => wm.close(win.id)}
              onMinimize={() => wm.minimize(win.id)}
              onToggleMaximize={() => wm.toggleMaximize(win.id)}
              onReload={() => wm.reload(win.id)}
              onFocus={() => wm.focus(win.id)}
              onGeometryChange={(patch) => updateGeometry(win.id, patch)}
              isOptimizedEngine={isOptimizedEngine}
              isMobileLayout={isMobileLayout}
              renderWindowContent={renderWindowContent}
            />
          </React.Fragment>
        ))}
      </AnimatePresence>

      {/* Persistent taskbar — only on desktop layouts */}
      <AnimatePresence>
        {!isMobileLayout && taskbarItems.length > 0 && (
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={
              isTaskbarVisible
                ? { y: 0, opacity: 1, scale: 1 }
                : { y: 60, opacity: 0, scale: 0.95 }
            }
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed bottom-3 left-1/2 z-[190] -translate-x-1/2"
            style={{ pointerEvents: isTaskbarVisible ? 'auto' : 'none' }}
            onMouseEnter={() => {
              if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
              setIsTaskbarVisible(true);
            }}
            onMouseLeave={() => {
              resetHideTimer();
            }}
          >
            <div className="flex items-center gap-1 rounded-[1.25rem] border bg-[var(--surface)] p-1.5"
              style={{
                borderColor: 'var(--outline)',
                borderRadius: '1.25rem',
                boxShadow: '0 12px 32px -8px rgba(0,0,0,0.25), 0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent)',
                backdropFilter: 'blur(20px) saturate(180%)',
                background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
              }}
            >
              {taskbarItems.map((w, idx) => {
                const isActive = activeWin?.id === w.id;
                const isMinimized = w.isMinimized;
                return (
                  <React.Fragment key={w.id}>
                    {/* Divider between items */}
                    {idx > 0 && (
                      <div className="h-6 w-px shrink-0" style={{ background: 'var(--outline-var)' }} />
                    )}
                  <motion.button
                    whileHover={{ scaleX: 1.08, scaleY: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => {
                      if (isMinimized) {
                        wm.restore(w.id);
                      } else if (isActive) {
                        // Active window → minimize (Windows-style toggle)
                        wm.minimize(w.id);
                      } else {
                        // Background window → focus it
                        wm.focus(w.id);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCtxMenu({ id: w.id, x: e.clientX, y: e.clientY });
                    }}
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      if (!touch) return;
                      const timer = setTimeout(() => {
                        try { navigator.vibrate?.(35); } catch {}
                        setCtxMenu({ id: w.id, x: touch.clientX, y: Math.max(10, touch.clientY - 120) });
                      }, 480);
                      (e.currentTarget as any).__lpTimer = timer;
                    }}
                    onTouchMove={(e) => {
                      const timer = (e.currentTarget as any).__lpTimer;
                      if (timer) clearTimeout(timer);
                    }}
                    onTouchEnd={(e) => {
                      const timer = (e.currentTarget as any).__lpTimer;
                      if (timer) clearTimeout(timer);
                    }}
                    className="relative flex items-center gap-2 rounded-[1rem] px-3 py-2 text-xs font-bold transition-colors cursor-pointer overflow-hidden select-none"
                    style={{
                      background: isActive
                        ? 'var(--container-high)'
                        : isMinimized
                          ? 'color-mix(in srgb, var(--accent) 12%, var(--container))'
                          : 'transparent',
                      color: 'var(--on-surface)',
                    }}
                    title={isMinimized
                      ? (isRu ? `Восстановить: ${w.title}` : `Restore: ${w.title}`)
                      : isActive
                        ? (isRu ? `Свернуть: ${w.title}` : `Minimize: ${w.title}`)
                        : (isRu ? `Активировать: ${w.title}` : `Focus: ${w.title}`)}
                  >
                    {/* Gradient steel indicator for minimized apps */}
                    {isMinimized && (
                      <span
                        className="absolute inset-0 opacity-50"
                        style={{
                          background:
                            'linear-gradient(135deg, color-mix(in srgb, var(--accent) 25%, transparent) 0%, transparent 60%)',
                        }}
                      />
                    )}
                    {/* Active indicator bar (left accent stripe) */}
                    {isActive && !isMinimized && (
                      <motion.span
                        layoutId={`active-stripe-${w.id}`}
                        className="absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {w.icon}
                      <span>{w.title}</span>
                    </span>
                  </motion.button>
                  </React.Fragment>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right-click context menu for taskbar pills */}
      <AnimatePresence>
        {ctxMenu && ctxWin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ type: 'spring', damping: 24, stiffness: 360 }}
            className="fixed z-[300] min-w-[180px] overflow-hidden rounded-2xl border py-1.5"
            style={{
              left: Math.min(ctxMenu.x, window.innerWidth - 200),
              top: Math.min(ctxMenu.y, window.innerHeight - 220),
              borderColor: 'var(--outline)',
              background: 'color-mix(in srgb, var(--surface) 96%, transparent)',
              backdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 16px 40px -8px rgba(0,0,0,0.3), 0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with app title */}
            <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-var)' }}>
              {ctxWin.icon}
              <span className="truncate">{ctxWin.title}</span>
            </div>
            <div className="mx-2 h-px" style={{ background: 'var(--outline-var)' }} />

            {/* Open / Restore — focuses the window (or restores if minimized) */}
            <CtxItem
              icon={ctxWin.isMinimized ? <Eye size={15} /> : <Copy size={15} />}
              label={ctxWin.isMinimized
                ? (isRu ? 'Открыть' : 'Open')
                : (isRu ? 'Активировать' : 'Focus')}
              onClick={() => { wm.restore(ctxWin.id); setCtxMenu(null); }}
            />

            <div className="mx-2 my-1 h-px" style={{ background: 'var(--outline-var)' }} />

            {/* Close — terminates the app */}
            <CtxItem
              icon={<XCircle size={15} />}
              label={isRu ? 'Закрыть' : 'Close'}
              danger
              onClick={() => { wm.close(ctxWin.id); setCtxMenu(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- Context menu item ---------- */

interface CtxItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function CtxItem({ icon, label, onClick, danger }: CtxItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer"
      style={{
        color: danger ? 'var(--error, #ef4444)' : 'var(--on-surface)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? 'color-mix(in srgb, var(--error, #ef4444) 12%, transparent)'
          : 'var(--container-high)';
      }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

/* ---------- Single Window Frame ---------- */

interface WindowFrameProps {
  win: WindowInstance;
  lang: Language;
  isActive: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onReload: () => void;
  onFocus: () => void;
  onGeometryChange: (patch: Partial<WindowInstance>) => void;
  isOptimizedEngine?: boolean;
  isMobileLayout?: boolean;
  renderWindowContent?: (id: string) => React.ReactNode;
}

function WindowFrame({
  win,
  lang,
  isActive,
  onClose,
  onMinimize,
  onToggleMaximize,
  onFocus,
  onGeometryChange,
  isOptimizedEngine = false,
  isMobileLayout = false,
  renderWindowContent,
}: WindowFrameProps) {
  const isRu = lang === 'ru';
  const isSystemApp = win.disableLoader ?? (win.id === 'settings' || win.id === 'account' || win.id === 'changelog' || win.id === 'extensions' || win.id === 'calculator');
  const defaultDuration = win.id === 'telegramroute' ? 3000 : 1500;
  const duration = win.loadingDuration ?? defaultDuration;

  const [loaderPhase, setLoaderPhase] = useState<'visible' | 'fading' | 'hidden'>(() => (isSystemApp ? 'hidden' : 'visible'));

  useEffect(() => {
    if (isSystemApp) {
      setLoaderPhase('hidden');
      return;
    }
    setLoaderPhase('visible');
    const timer = setTimeout(() => {
      setLoaderPhase('fading');
    }, duration);
    return () => clearTimeout(timer);
  }, [win.renderKey, isSystemApp, duration]);

  useEffect(() => {
    if (loaderPhase === 'fading') {
      const timer = setTimeout(() => {
        setLoaderPhase('hidden');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loaderPhase]);

  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeState = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const onTitleMouseDown = (e: React.MouseEvent) => {
    if (win.isMaximized || isMobileLayout) return;
    if ((e.target as HTMLElement).closest('button')) return;
    onFocus();
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: win.x, origY: win.y };
    setIsInteracting(true);
    e.preventDefault();
  };

  const onTitleDoubleClick = () => {
    if (!isMobileLayout && win.allowMaximize !== false) {
      onToggleMaximize();
    }
  };

  const onTitleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    onFocus();

    // Double-tap detection for touch/tablet
    const now = Date.now();
    const dt = now - lastTapRef.current.time;
    const dx = Math.abs(touch.clientX - lastTapRef.current.x);
    const dy = Math.abs(touch.clientY - lastTapRef.current.y);

    if (dt < 320 && dx < 28 && dy < 28) {
      lastTapRef.current = { time: 0, x: 0, y: 0 };
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (!isMobileLayout && win.allowMaximize !== false) {
        onToggleMaximize();
      }
      return;
    }

    lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };

    // Touch drag initiation
    if (!win.isMaximized && !isMobileLayout) {
      dragState.current = { startX: touch.clientX, startY: touch.clientY, origX: win.x, origY: win.y };
      setIsInteracting(true);
    }

    // Long press detection for touch/tablet
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      try { navigator.vibrate?.(35); } catch {}
      if (!isMobileLayout && win.allowMaximize !== false) {
        onToggleMaximize();
      }
    }, 500);
  };

  const onResizeTouchStart = (e: React.TouchEvent) => {
    if (win.isMaximized || isMobileLayout) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    onFocus();
    resizeState.current = { startX: touch.clientX, startY: touch.clientY, origW: win.width, origH: win.height };
    setIsInteracting(true);
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (dragState.current) {
        const dx = clientX - dragState.current.startX;
        const dy = clientY - dragState.current.startY;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
        const nx = Math.max(0, Math.min(window.innerWidth - 100, dragState.current.origX + dx));
        const ny = Math.max(0, Math.min(window.innerHeight - 60, dragState.current.origY + dy));
        onGeometryChange({ x: nx, y: ny });
      }
      if (resizeState.current) {
        const dx = clientX - resizeState.current.startX;
        const dy = clientY - resizeState.current.startY;
        const nw = Math.max(win.minWidth ?? 360, resizeState.current.origW + dx);
        const nh = Math.max(win.minHeight ?? 280, resizeState.current.origH + dy);
        onGeometryChange({ width: nw, height: nh });
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onEnd = () => {
      dragState.current = null;
      resizeState.current = null;
      setIsInteracting(false);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, [win.minWidth, win.minHeight, onGeometryChange]);

  const onResizeMouseDown = (e: React.MouseEvent) => {
    if (win.isMaximized || isMobileLayout) return;
    onFocus();
    resizeState.current = { startX: e.clientX, startY: e.clientY, origW: win.width, origH: win.height };
    setIsInteracting(true);
    e.preventDefault();
    e.stopPropagation();
  };

  const isFullScreen = win.isMaximized || isMobileLayout;
  const frameStyle: React.CSSProperties = isFullScreen
    ? { left: 0, top: 0, width: '100vw', height: '100vh' }
    : { left: win.x, top: win.y, width: win.width, height: win.height };

  const taskbarX = window.innerWidth / 2;
  const taskbarY = window.innerHeight - 24;
  const winCenterX = win.x + win.width / 2;
  const winCenterY = win.y + win.height / 2;
  const minimizeX = taskbarX - winCenterX;
  const minimizeY = taskbarY - winCenterY;

  return (
    <motion.div
      initial={{ opacity: 0, scale: isMobileLayout ? 0.98 : 0.92, y: isMobileLayout ? 16 : 22 }}
      animate={
        win.isMinimized
          ? {
              opacity: 0,
              scale: 0.6,
              x: minimizeX,
              y: minimizeY,
            }
          : {
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
            }
      }
      exit={{
        opacity: 0,
        scale: isMobileLayout ? 0.98 : 0.92,
        y: isMobileLayout ? 16 : 20,
        transition: {
          duration: 0.16,
          ease: 'easeOut',
        },
      }}
      transition={
        win.isMinimized
          ? {
              duration: 0.24,
              ease: [0.2, 0.9, 0.3, 1],
            }
          : {
              type: 'spring',
              damping: isMobileLayout ? 26 : 24,
              stiffness: isMobileLayout ? 360 : 340,
              mass: 0.7,
              restDelta: 0.005,
            }
      }
      onMouseDown={onFocus}
      onTouchStart={onFocus}
      className={`fixed z-[100] flex flex-col overflow-hidden bg-[var(--surface)] ${isFullScreen ? 'border-none' : 'border'}`}
      style={{
        ...frameStyle,
        zIndex: win.zIndex,
        borderRadius: isFullScreen ? 0 : '1.25rem',
        borderColor: isActive
          ? 'color-mix(in srgb, var(--accent) 40%, var(--outline))'
          : 'var(--outline)',
        boxShadow: isFullScreen
          ? 'none'
          : isActive
            ? '0 20px 50px -12px rgba(0,0,0,0.3), 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent)'
            : 'var(--shadow-2, 0 4px 12px rgba(0,0,0,0.15))',
        willChange: 'transform, opacity',
        transition: isInteracting
          ? 'none'
          : 'left 0.32s cubic-bezier(0.16, 1, 0.3, 1), top 0.32s cubic-bezier(0.16, 1, 0.3, 1), width 0.32s cubic-bezier(0.16, 1, 0.3, 1), height 0.32s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: win.isMinimized ? 'none' : 'auto',
      }}
    >
      {/* Header bar */}
      {!win.hideTitleBar && (
        <div
          onMouseDown={onTitleMouseDown}
          onDoubleClick={onTitleDoubleClick}
          onTouchStart={onTitleTouchStart}
          className={`flex ${isMobileLayout ? 'h-12 px-3' : 'h-8.5 px-3 cursor-grab active:cursor-grabbing'} shrink-0 items-center justify-between relative border-b border-[var(--outline-var)] select-none`}
          style={{
            background: isActive
              ? 'linear-gradient(180deg, var(--surface-dim) 0%, var(--surface) 100%)'
              : 'var(--surface)',
          }}
        >
          <div className="flex items-center gap-2">
            {win.icon}
            <span className={`${isMobileLayout ? 'text-xs font-black' : 'text-[11px] font-bold'} text-[var(--on-surface)] tracking-tight`}>
              {win.title}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {win.headerActions}
            {!isMobileLayout && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                  title={isRu ? 'Свернуть' : 'Minimize'}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-colors cursor-pointer"
                >
                  <Minus size={13} />
                </motion.button>
                {win.allowMaximize !== false && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onToggleMaximize(); }}
                    title={win.isMaximized ? (isRu ? 'Восстановить' : 'Restore') : (isRu ? 'Развернуть' : 'Maximize')}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-colors cursor-pointer"
                  >
                    {win.isMaximized ? <Copy size={12} /> : <Square size={12} />}
                  </motion.button>
                )}
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              title={isRu ? 'Закрыть' : 'Close'}
              className={`flex items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-red-500 hover:text-white transition-colors cursor-pointer ${isMobileLayout ? 'h-7 w-7 bg-[var(--surface-dim)] border border-[var(--outline)]' : 'h-6 w-6'}`}
            >
              <X size={isMobileLayout ? 16 : 14} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative flex-1 overflow-auto wm-content" key={win.renderKey}>
        {renderWindowContent ? (renderWindowContent(win.id) ?? win.render()) : win.render()}

        {/* Material You M3 Window Launching Loader */}
        {!isSystemApp && loaderPhase !== 'hidden' && (
          <div
            className={`absolute inset-0 z-30 flex flex-col items-center justify-center select-none ${
              loaderPhase === 'fading' ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
            style={{
              backdropFilter: 'blur(20px) saturate(140%)',
              WebkitBackdropFilter: 'blur(20px) saturate(140%)',
              background: 'color-mix(in srgb, var(--surface) 88%, transparent)',
              opacity: loaderPhase === 'fading' ? 0 : 1,
              transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div className="flex flex-col items-center justify-center gap-3.5 px-4 text-center">
              <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <M3LoadingIndicator size={44} color="var(--accent)" speed={1} />
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--container-high)] border border-[var(--outline-var)] shadow-xs">
                {win.icon && (
                  <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 opacity-85">
                    {win.icon}
                  </div>
                )}
                <span className="text-[11px] md:text-xs font-bold tracking-tight text-[var(--on-surface)]">
                  {win.loaderTitle || win.title} — {isRu ? 'Запуск' : 'Launching'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resize handle */}
      {!win.isMaximized && !isMobileLayout && (
        <div
          onMouseDown={onResizeMouseDown}
          onTouchStart={onResizeTouchStart}
          className="absolute bottom-0 right-0 h-6 w-6 cursor-se-resize touch-none"
          style={{
            background:
              'linear-gradient(135deg, transparent 55%, color-mix(in srgb, var(--accent) 30%, var(--outline)) 55%)',
            borderRadius: '0 0 1.25rem 0',
          }}
        />
      )}
    </motion.div>
  );
}

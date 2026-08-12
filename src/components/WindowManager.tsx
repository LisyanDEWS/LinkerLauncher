import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Square, Copy, Eye, XCircle, PanelTop, PanelTopClose } from 'lucide-react';
import { Language } from '../types';

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
      // - Mobile: auto-fill viewport cleanly
      // - First desktop window: centered on screen
      // - Subsequent desktop windows: cascaded offset from previous windows
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

  return (
    <AnimatePresence>
      {wm.windows.map((win) => (
        <React.Fragment key={win.id}>
          <WindowFrame
            win={win}
            lang={lang}
            onClose={() => wm.close(win.id)}
            renderWindowContent={renderWindowContent}
            isMobileLayout={isMobileLayout}
          />
        </React.Fragment>
      ))}
    </AnimatePresence>
  );
}

function WindowFrame({
  win,
  lang,
  onClose,
  renderWindowContent,
  isMobileLayout,
}: any) {
  const isRu = lang === 'ru';
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative z-10 flex flex-col overflow-hidden bg-[var(--surface)] border border-[var(--outline)] shadow-2xl"
        style={{
          width: isMobileLayout ? '92vw' : Math.min(win.initialWidth, 1000),
          height: isMobileLayout ? '85vh' : Math.min(win.initialHeight, 800),
          borderRadius: '1.5rem',
        }}
      >
        {!win.hideTitleBar && (
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--outline-var)] bg-[var(--surface-dim)] px-4 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[var(--on-surface-var)] [&>svg]:h-4 [&>svg]:w-4">{win.icon}</span>
              <span className="font-bold text-[var(--on-surface)] text-sm tracking-tight">{win.title}</span>
            </div>
            <div className="flex items-center gap-2">
              {win.headerActions}
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-red-500 hover:text-white transition-colors"
                title={isRu ? 'Закрыть' : 'Close'}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="relative flex-1 overflow-auto bg-[var(--surface)]">
          {renderWindowContent ? (renderWindowContent(win.id) ?? win.render()) : win.render()}
        </div>
      </motion.div>
    </div>
  );
}

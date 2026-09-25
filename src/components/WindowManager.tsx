import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Square, Copy, Eye, XCircle, ChevronUp, ChevronDown, RotateCw, Trash2, Plus, ExternalLink } from 'lucide-react';
import { Language } from '../types';
import { M3LoadingIndicator } from './m3-loading/M3LoadingIndicator';
import { DockTabsLadder } from './DockTabsLadder';

export interface WindowTabItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  render: () => React.ReactNode;
  closable?: boolean;
}

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
  disableReload?: boolean;
  loadingDuration?: number;
  loaderTitle?: string;
  tabs?: WindowTabItem[];
  activeTabId?: string;
  tabGeometries?: Record<string, { width: number; height: number; x: number; y: number; isMaximized: boolean }>;
  onNewTabClick?: () => void;
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
  disableReload?: boolean;
  loadingDuration?: number;
  loaderTitle?: string;
  tabs?: WindowTabItem[];
  activeTabId?: string;
  onNewTabClick?: () => void;
}

export interface WindowManager {
  windows: WindowInstance[];
  open: (opts: OpenWindowOptions) => void;
  close: (id: string) => void;
  closeAll: () => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focus: (id: string) => void;
  isOpen: (id: string) => boolean;
  /** Reload just the app content (re-mount) without closing/reopening the window. */
  reload: (id: string) => void;
  addTab: (windowId: string, tab: WindowTabItem) => void;
  removeTab: (windowId: string, tabId: string) => void;
  setActiveTab: (windowId: string, tabId: string) => void;
  setActiveTabByIndex: (windowId: string, tabIndex: number) => void;
  getTabs: (windowId: string) => WindowTabItem[];
  getActiveTabId: (windowId: string) => string | undefined;
  detachTab: (windowId: string, tabId: string) => void;
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
                  disableReload: opts.disableReload,
                  loadingDuration: opts.loadingDuration,
                  loaderTitle: opts.loaderTitle,
                  tabs: opts.tabs ?? w.tabs,
                  activeTabId: opts.activeTabId ?? (opts.tabs && opts.tabs.length > 0 ? opts.tabs[0].id : w.activeTabId),
                  onNewTabClick: opts.onNewTabClick ?? w.onNewTabClick,
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

      const centerX = Math.round((window.innerWidth - w) / 2);
      const centerY = Math.round((window.innerHeight - h) / 2);
      const rawX = isMobileScreen ? 8 : centerX + Math.min(offsetCount * cascadeX, maxOffsetX);
      const rawY = isMobileScreen ? 8 : centerY + Math.min(offsetCount * cascadeY, maxOffsetY);

      // Clamp to viewport with a small margin and integer pixel alignment
      const x = Math.round(Math.max(4, Math.min(rawX, window.innerWidth - w - 4)));
      const y = Math.round(Math.max(4, Math.min(rawY, window.innerHeight - h - 50)));
      const instance: WindowInstance = {
        id: opts.id,
        title: opts.title,
        icon: opts.icon,
        render: opts.render,
        initialWidth: Math.round(opts.initialWidth ?? 720),
        initialHeight: Math.round(opts.initialHeight ?? 560),
        minWidth: Math.round(isMobileScreen ? 280 : (opts.minWidth ?? 360)),
        minHeight: Math.round(isMobileScreen ? 320 : (opts.minHeight ?? 280)),
        x,
        y,
        width: Math.round(w),
        height: Math.round(h),
        isMaximized: isMobileScreen,
        isMinimized: false,
        zIndex: nextZ,
        renderKey: 0,
        hideTitleBar: opts.hideTitleBar || false,
        allowMaximize: opts.allowMaximize ?? true,
        headerActions: opts.headerActions,
        disableLoader: opts.disableLoader,
        disableReload: opts.disableReload,
        loadingDuration: opts.loadingDuration,
        loaderTitle: opts.loaderTitle,
        tabs: opts.tabs,
        activeTabId: opts.activeTabId ?? (opts.tabs && opts.tabs.length > 0 ? opts.tabs[0].id : undefined),
        onNewTabClick: opts.onNewTabClick,
      };
      return [...prev, instance];
    });
  }, []);

  const close = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const closeAll = useCallback(() => {
    setWindows([]);
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

  const addTab = useCallback((windowId: string, tab: WindowTabItem) => {
    setWindows((prev) => {
      const win = prev.find((w) => w.id === windowId);
      if (!win) return prev;
      zCounter.current = Math.min(zCounter.current + 1, MAX_Z);
      const nextZ = zCounter.current;

      const existingTabs: WindowTabItem[] =
        win.tabs && win.tabs.length > 0
          ? win.tabs
          : [
              {
                id: `${windowId}_tab_1`,
                title: win.title,
                icon: win.icon,
                render: win.render,
                closable: true,
              },
            ];

      const safeTabId = existingTabs.some((t) => t.id === tab.id)
        ? `${tab.id}_${Date.now()}`
        : tab.id;
      const safeTab = { ...tab, id: safeTabId };
      const updatedTabs = [...existingTabs, safeTab];

      const currentTabId = win.activeTabId || existingTabs[0]?.id;
      const currentGeom = {
        width: win.width,
        height: win.height,
        x: win.x,
        y: win.y,
        isMaximized: win.isMaximized,
      };
      const updatedTabGeometries = {
        ...(win.tabGeometries || {}),
        ...(currentTabId ? { [currentTabId]: currentGeom } : {}),
        [safeTab.id]: currentGeom,
      };

      return prev.map((w) =>
        w.id === windowId
          ? {
              ...w,
              tabs: updatedTabs,
              activeTabId: safeTab.id,
              isMinimized: false,
              zIndex: nextZ,
              tabGeometries: updatedTabGeometries,
            }
          : w,
      );
    });
    window.dispatchEvent(new CustomEvent('linkerru_tab_changed', { detail: { windowId } }));
  }, []);

  const removeTab = useCallback((windowId: string, tabId: string) => {
    setWindows((prev) => {
      const win = prev.find((w) => w.id === windowId);
      if (!win || !win.tabs) return prev;
      const remainingTabs = win.tabs.filter((t) => t.id !== tabId);
      if (remainingTabs.length === 0) {
        return prev.filter((w) => w.id !== windowId);
      }
      let nextActiveId = win.activeTabId;
      if (win.activeTabId === tabId) {
        const removedIdx = win.tabs.findIndex((t) => t.id === tabId);
        const nextIdx = Math.max(0, removedIdx - 1);
        nextActiveId = remainingTabs[nextIdx]?.id || remainingTabs[0].id;
      }
      const nextGeom = nextActiveId && win.tabGeometries ? win.tabGeometries[nextActiveId] : undefined;
      return prev.map((w) =>
        w.id === windowId
          ? {
              ...w,
              tabs: remainingTabs,
              activeTabId: nextActiveId,
              ...(nextGeom
                ? {
                    width: nextGeom.width,
                    height: nextGeom.height,
                    x: nextGeom.x,
                    y: nextGeom.y,
                    isMaximized: nextGeom.isMaximized,
                  }
                : {}),
            }
          : w,
      );
    });
    window.dispatchEvent(new CustomEvent('linkerru_tab_changed', { detail: { windowId } }));
  }, []);

  const setActiveTab = useCallback((windowId: string, tabId: string) => {
    setWindows((prev) => {
      const win = prev.find((w) => w.id === windowId);
      if (!win) return prev;
      zCounter.current = Math.min(zCounter.current + 1, MAX_Z);
      const nextZ = zCounter.current;
      const currentTabId = win.activeTabId || (win.tabs && win.tabs[0]?.id);
      const currentGeom = {
        width: win.width,
        height: win.height,
        x: win.x,
        y: win.y,
        isMaximized: win.isMaximized,
      };
      const updatedTabGeometries = {
        ...(win.tabGeometries || {}),
        ...(currentTabId ? { [currentTabId]: currentGeom } : {}),
      };
      const nextGeom = updatedTabGeometries[tabId];

      return prev.map((w) =>
        w.id === windowId
          ? {
              ...w,
              activeTabId: tabId,
              isMinimized: false,
              zIndex: nextZ,
              tabGeometries: updatedTabGeometries,
              ...(nextGeom
                ? {
                    width: nextGeom.width,
                    height: nextGeom.height,
                    x: nextGeom.x,
                    y: nextGeom.y,
                    isMaximized: nextGeom.isMaximized,
                  }
                : {}),
            }
          : w,
      );
    });
    window.dispatchEvent(new CustomEvent('linkerru_tab_changed', { detail: { windowId } }));
  }, []);

  const setActiveTabByIndex = useCallback((windowId: string, tabIndex: number) => {
    setWindows((prev) => {
      const win = prev.find((w) => w.id === windowId);
      if (!win || !win.tabs || win.tabs.length === 0) return prev;
      const target = win.tabs[tabIndex - 1] || win.tabs[0];
      if (!target) return prev;
      zCounter.current = Math.min(zCounter.current + 1, MAX_Z);
      const nextZ = zCounter.current;
      const currentTabId = win.activeTabId || win.tabs[0]?.id;
      const currentGeom = {
        width: win.width,
        height: win.height,
        x: win.x,
        y: win.y,
        isMaximized: win.isMaximized,
      };
      const updatedTabGeometries = {
        ...(win.tabGeometries || {}),
        ...(currentTabId ? { [currentTabId]: currentGeom } : {}),
      };
      const nextGeom = updatedTabGeometries[target.id];

      return prev.map((w) =>
        w.id === windowId
          ? {
              ...w,
              activeTabId: target.id,
              isMinimized: false,
              zIndex: nextZ,
              tabGeometries: updatedTabGeometries,
              ...(nextGeom
                ? {
                    width: nextGeom.width,
                    height: nextGeom.height,
                    x: nextGeom.x,
                    y: nextGeom.y,
                    isMaximized: nextGeom.isMaximized,
                  }
                : {}),
            }
          : w,
      );
    });
    window.dispatchEvent(new CustomEvent('linkerru_tab_changed', { detail: { windowId } }));
  }, []);

  const detachTab = useCallback((windowId: string, tabId: string) => {
    setWindows((prev) => {
      const win = prev.find((w) => w.id === windowId);
      if (!win || !win.tabs) return prev;
      const tabToDetach = win.tabs.find((t) => t.id === tabId);
      if (!tabToDetach) return prev;

      zCounter.current = Math.min(zCounter.current + 1, MAX_Z);
      const nextZ = zCounter.current;

      const remainingTabs = win.tabs.filter((t) => t.id !== tabId);
      let nextActiveId = win.activeTabId;
      if (win.activeTabId === tabId) {
        const removedIdx = win.tabs.findIndex((t) => t.id === tabId);
        const nextIdx = Math.max(0, removedIdx - 1);
        nextActiveId = remainingTabs[nextIdx]?.id || remainingTabs[0]?.id;
      }

      const geom = win.tabGeometries?.[tabId] || {
        width: win.width,
        height: win.height,
        x: win.x,
        y: win.y,
        isMaximized: win.isMaximized,
      };

      const detachedWindowId = `${windowId}_detached_${tabId}_${Date.now()}`;
      const detachedInstance: WindowInstance = {
        id: detachedWindowId,
        title: tabToDetach.title,
        icon: tabToDetach.icon || win.icon,
        render: tabToDetach.render,
        initialWidth: geom.width,
        initialHeight: geom.height,
        minWidth: win.minWidth,
        minHeight: win.minHeight,
        width: geom.width,
        height: geom.height,
        x: Math.max(8, Math.min(geom.x + 36, window.innerWidth - geom.width - 16)),
        y: Math.max(8, Math.min(geom.y + 36, window.innerHeight - geom.height - 48)),
        isMaximized: false,
        isMinimized: false,
        zIndex: nextZ,
        renderKey: 0,
        disableLoader: true,
        disableReload: win.disableReload,
        allowMaximize: win.allowMaximize,
        tabs: [
          {
            id: tabToDetach.id,
            title: tabToDetach.title,
            icon: tabToDetach.icon,
            render: tabToDetach.render,
            closable: true,
          },
        ],
        activeTabId: tabToDetach.id,
        tabGeometries: {
          [tabToDetach.id]: {
            width: geom.width,
            height: geom.height,
            x: Math.max(8, Math.min(geom.x + 36, window.innerWidth - geom.width - 16)),
            y: Math.max(8, Math.min(geom.y + 36, window.innerHeight - geom.height - 48)),
            isMaximized: false,
          },
        },
        onNewTabClick: win.onNewTabClick,
      };

      if (remainingTabs.length === 0) {
        return prev.map((w) => (w.id === windowId ? detachedInstance : w));
      }

      const updatedOriginal = {
        ...win,
        tabs: remainingTabs,
        activeTabId: nextActiveId,
      };

      return [...prev.map((w) => (w.id === windowId ? updatedOriginal : w)), detachedInstance];
    });
    window.dispatchEvent(new CustomEvent('linkerru_tab_changed', { detail: { windowId } }));
  }, []);

  const getTabs = useCallback((windowId: string): WindowTabItem[] => {
    const win = windows.find((w) => w.id === windowId);
    if (!win) return [];
    if (win.tabs && win.tabs.length > 0) return win.tabs;
    return [
      {
        id: `${win.id}_tab_1`,
        title: win.title,
        icon: win.icon,
        render: win.render,
        closable: true,
      },
    ];
  }, [windows]);

  const getActiveTabId = useCallback((windowId: string): string | undefined => {
    const win = windows.find((w) => w.id === windowId);
    return win?.activeTabId;
  }, [windows]);

  const updateGeometry = useCallback((id: string, patch: Partial<WindowInstance>) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const updated = { ...w, ...patch };
        if (updated.tabs && updated.tabs.length > 0 && updated.activeTabId) {
          const currentGeom = {
            width: updated.width,
            height: updated.height,
            x: updated.x,
            y: updated.y,
            isMaximized: updated.isMaximized,
          };
          updated.tabGeometries = {
            ...(updated.tabGeometries || {}),
            [updated.activeTabId]: currentGeom,
          };
        }
        return updated;
      }),
    );
  }, []);

  const manager: WindowManager = {
    windows,
    open,
    close,
    closeAll,
    minimize,
    restore,
    toggleMaximize,
    focus,
    isOpen,
    reload,
    addTab,
    removeTab,
    setActiveTab,
    setActiveTabByIndex,
    getTabs,
    getActiveTabId,
    detachTab,
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
  const isUk = lang === 'uk';
  const updateGeometry = (wm as any).__updateGeometry as (id: string, patch: Partial<WindowInstance>) => void;
  // Taskbar shows ALL open windows (not just minimized)
  const taskbarItems = wm.windows;

  // Find the top-most non-minimized window (the "active" one)
  const activeWin = wm.windows
    .filter((w) => !w.isMinimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0];

  // Right-click context menu state for taskbar pills
  const [ctxMenu, setCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  // Hover & hold state for the tabs ladder ("лесенка")
  const [ladderAppId, setLadderAppId] = useState<string | null>(null);
  const hoverLadderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeLadderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openLadder = (id: string) => {
    if (closeLadderTimeoutRef.current) clearTimeout(closeLadderTimeoutRef.current);
    if (hoverLadderTimeoutRef.current) clearTimeout(hoverLadderTimeoutRef.current);
    setLadderAppId(id);
  };

  const scheduleOpenLadder = (id: string) => {
    if (closeLadderTimeoutRef.current) clearTimeout(closeLadderTimeoutRef.current);
    hoverLadderTimeoutRef.current = setTimeout(() => {
      setLadderAppId(id);
    }, 180);
  };

  const scheduleCloseLadder = () => {
    if (hoverLadderTimeoutRef.current) clearTimeout(hoverLadderTimeoutRef.current);
    closeLadderTimeoutRef.current = setTimeout(() => {
      setLadderAppId(null);
    }, 320);
  };

  const cancelCloseLadder = () => {
    if (closeLadderTimeoutRef.current) clearTimeout(closeLadderTimeoutRef.current);
  };

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
  const isCtxSystemApp = ctxWin ? (ctxWin.disableLoader ?? (ctxWin.id === 'settings' || ctxWin.id === 'account' || ctxWin.id === 'changelog' || ctxWin.id === 'wallpapers' || ctxWin.id === 'calculator' || ctxWin.id === 'keeps' || ctxWin.id === 'weather' || ctxWin.id === 'clock' || ctxWin.id === 'calendar' || ctxWin.id === 'notifications' || ctxWin.id === 'server' || ctxWin.disableReload)) : false;

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
              onSelectTab={(tabId) => wm.setActiveTab(win.id, tabId)}
              onCloseTab={(tabId) => wm.removeTab(win.id, tabId)}
              onDetachTab={(tabId) => wm.detachTab(win.id, tabId)}
              onNewTab={() => win.onNewTabClick?.()}
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
            <div className="flex items-center gap-1 rounded-[1.25rem] border bg-[var(--surface)]/80 p-1.5"
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
                const tabsCount = w.tabs && w.tabs.length > 0 ? w.tabs.length : 1;
                return (
                  <React.Fragment key={w.id}>
                    {/* Divider between items */}
                    {idx > 0 && (
                      <div className="h-6 w-px shrink-0" style={{ background: 'var(--outline-var)' }} />
                    )}
                  <div
                    className="relative flex items-center"
                    onMouseEnter={() => scheduleOpenLadder(w.id)}
                    onMouseLeave={scheduleCloseLadder}
                  >
                    {/* Cascading Tabs Ladder ("Лесенка") on hover/hold */}
                    <AnimatePresence>
                      {ladderAppId === w.id && (
                        <div
                          onMouseEnter={cancelCloseLadder}
                          onMouseLeave={scheduleCloseLadder}
                        >
                          <DockTabsLadder
                            appId={w.id}
                            appTitle={w.title}
                            appIcon={w.icon}
                            tabs={
                              w.tabs && w.tabs.length > 0
                                ? w.tabs.map((t) => ({
                                    id: t.id,
                                    title: t.title,
                                    icon: t.icon,
                                    isActive: w.activeTabId ? w.activeTabId === t.id : false,
                                  }))
                                : [
                                    {
                                      id: `${w.id}_tab_1`,
                                      title: w.title,
                                      icon: w.icon,
                                      isActive: true,
                                    },
                                  ]
                            }
                            activeTabId={w.activeTabId}
                            onSelectTab={(tabId) => {
                              wm.setActiveTab(w.id, tabId);
                              wm.restore(w.id);
                              wm.focus(w.id);
                              setLadderAppId(null);
                            }}
                            onCloseTab={(tabId) => {
                              wm.removeTab(w.id, tabId);
                            }}
                            onDetachTab={(tabId) => {
                              wm.detachTab(w.id, tabId);
                            }}
                            onNewTab={
                              w.onNewTabClick
                                ? () => {
                                    w.onNewTabClick!();
                                    setLadderAppId(null);
                                  }
                                : undefined
                            }
                            onClose={() => setLadderAppId(null)}
                            lang={lang}
                            theme={'dark'}
                            accentColor={'var(--accent)'}
                          />
                        </div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileHover={{ scaleX: 1.08, scaleY: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onMouseDown={() => openLadder(w.id)}
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
                          openLadder(w.id);
                        }, 380);
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
                      className="relative flex items-center gap-2 rounded-[0.85rem] px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer overflow-hidden select-none"
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

                      {/* Bottom status bar with wave fill */}
                      {(isActive || isMinimized) && (
                        <div className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full overflow-hidden">
                          <div
                            className="h-full w-full rounded-full transition-all duration-300"
                            style={{
                              background: isActive
                                ? 'linear-gradient(90deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 50%, white) 50%, var(--accent) 100%)'
                                : 'color-mix(in srgb, var(--accent) 40%, transparent)',
                              backgroundSize: '200% 100%',
                              animation: isActive ? 'shimmerWave 2.5s ease-in-out infinite' : undefined,
                            }}
                          />
                        </div>
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        {w.icon}
                        <span>{w.title}</span>
                        {tabsCount > 1 && (
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none border"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                              borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)',
                              color: 'var(--accent)',
                            }}
                          >
                            {tabsCount}
                          </span>
                        )}
                      </span>
                    </motion.button>
                  </div>
                  </React.Fragment>
                );
              })}

              {/* Close All Windows Button */}
              {taskbarItems.length > 0 && (
                <>
                  <div className="h-6 w-px shrink-0" style={{ background: 'var(--outline-var)' }} />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => {
                      wm.closeAll();
                    }}
                    className="relative flex items-center gap-1.5 rounded-[1rem] px-2.5 py-2 text-xs font-bold transition-all cursor-pointer overflow-hidden select-none hover:bg-red-500/12 text-[var(--on-surface-var)] hover:text-red-500"
                    title={isRu ? 'Закрыть все окна' : isUk ? 'Закрити всі вікна' : 'Close all windows'}
                    id="wm-close-all-btn"
                  >
                    <Trash2 size={13} className="shrink-0" />
                    <span className="text-[11px] font-semibold hidden sm:inline whitespace-nowrap">
                      {isRu ? 'Закрыть все' : isUk ? 'Закрити всі' : 'Close all'}
                    </span>
                  </motion.button>
                </>
              )}
            </div>

            {/* Taskbar bottom wave status line */}
            <div className="absolute -bottom-1 left-4 right-4 h-[2px] rounded-full overflow-hidden opacity-60">
              <div
                className="w-full h-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmerWave 3s ease-in-out infinite',
                }}
              />
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

            {/* Reload app — only for non-system apps */}
            {!isCtxSystemApp && (
              <CtxItem
                icon={<RotateCw size={14} />}
                label={isRu ? 'Перезагрузить' : isUk ? 'Перезавантажити' : 'Reload'}
                onClick={() => { wm.reload(ctxWin.id); setCtxMenu(null); }}
              />
            )}

            <div className="mx-2 my-1 h-px" style={{ background: 'var(--outline-var)' }} />

            {/* Close — terminates the app */}
            <CtxItem
              icon={<XCircle size={15} />}
              label={isRu ? 'Закрыть' : 'Close'}
              danger
              onClick={() => { wm.close(ctxWin.id); setCtxMenu(null); }}
            />

            {/* Close all — terminates all apps */}
            <CtxItem
              icon={<Trash2 size={14} />}
              label={isRu ? 'Закрыть все окна' : 'Close all windows'}
              danger
              onClick={() => { wm.closeAll(); setCtxMenu(null); }}
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
  onSelectTab?: (tabId: string) => void;
  onCloseTab?: (tabId: string) => void;
  onDetachTab?: (tabId: string) => void;
  onNewTab?: () => void;
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
  onReload,
  onFocus,
  onGeometryChange,
  onSelectTab,
  onCloseTab,
  onDetachTab,
  onNewTab,
  isOptimizedEngine = false,
  isMobileLayout = false,
  renderWindowContent,
}: WindowFrameProps) {
  const isRu = lang === 'ru';
  const isUk = lang === 'uk';
  const isSystemApp = win.disableLoader ?? (win.id === 'settings' || win.id === 'account' || win.id === 'changelog' || win.id === 'wallpapers' || win.id === 'calculator' || win.id === 'keeps' || win.id === 'weather' || win.id === 'clock' || win.id === 'calendar' || win.id === 'notifications' || win.id === 'server' || win.disableReload);
  const defaultDuration = win.id === 'telegramroute' ? 18000 : win.id === 'weather' ? 350 : 600;
  const duration = win.loadingDuration ?? defaultDuration;

  const [loaderPhase, setLoaderPhase] = useState<'visible' | 'fading' | 'hidden'>(() => (isSystemApp ? 'hidden' : 'visible'));
  const [loaderProgress, setLoaderProgress] = useState(0);

  useEffect(() => {
    if (isSystemApp) {
      setLoaderPhase('hidden');
      return;
    }
    setLoaderPhase('visible');
    setLoaderProgress(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const prog = Math.min(100, (elapsed / duration) * 100);
      setLoaderProgress(prog);
      if (elapsed >= duration) {
        clearInterval(interval);
        setLoaderPhase('fading');
      }
    }, 40);

    return () => clearInterval(interval);
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

  // Auto-hide panel / titlebar after 5 seconds ONLY when maximized / full-screen
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringHeaderRef = useRef<boolean>(false);

  const resetAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    // Only allow auto-hide if the window is maximized on desktop
    if (!isMobileLayout && win.isMaximized) {
      autoHideTimerRef.current = setTimeout(() => {
        if (!isHoveringHeaderRef.current && !isInteracting) {
          setIsHeaderHidden(true);
        }
      }, 5000);
    }
  }, [isMobileLayout, win.isMaximized, isInteracting]);

  const showHeader = useCallback(() => {
    setIsHeaderHidden(false);
    resetAutoHideTimer();
  }, [resetAutoHideTimer]);

  useEffect(() => {
    if (!win.isMaximized) {
      setIsHeaderHidden(false);
    }
    resetAutoHideTimer();
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, [win.isMaximized, resetAutoHideTimer]);

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
        const nx = Math.round(Math.max(0, Math.min(window.innerWidth - 100, dragState.current.origX + dx)));
        const ny = Math.round(Math.max(0, Math.min(window.innerHeight - 60, dragState.current.origY + dy)));
        onGeometryChange({ x: nx, y: ny });
      }
      if (resizeState.current) {
        const dx = clientX - resizeState.current.startX;
        const dy = clientY - resizeState.current.startY;
        const nw = Math.round(Math.max(win.minWidth ?? 360, resizeState.current.origW + dx));
        const nh = Math.round(Math.max(win.minHeight ?? 280, resizeState.current.origH + dy));
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
    : {
        left: Math.round(win.x),
        top: Math.round(win.y),
        width: Math.round(win.width),
        height: Math.round(win.height),
      };

  const taskbarX = Math.round(window.innerWidth / 2);
  const taskbarY = Math.round(window.innerHeight - 24);
  const winCenterX = Math.round(win.x + win.width / 2);
  const winCenterY = Math.round(win.y + win.height / 2);
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
      className={`fixed z-[100] flex flex-col overflow-hidden bg-[var(--surface)] text-[var(--on-surface)] wm-window-frame ${isFullScreen ? 'border-none' : 'border border-[var(--outline-var)]/80 shadow-2xl'}`}
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
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        transition: isInteracting
          ? 'none'
          : 'left 0.32s cubic-bezier(0.16, 1, 0.3, 1), top 0.32s cubic-bezier(0.16, 1, 0.3, 1), width 0.32s cubic-bezier(0.16, 1, 0.3, 1), height 0.32s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: win.isMinimized ? 'none' : 'auto',
      }}
    >
      {/* Floating island to restore header (only in maximized mode when header is hidden) */}
      {isHeaderHidden && !win.hideTitleBar && win.isMaximized && (
        <motion.button
          initial={{ opacity: 0, y: -16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          whileHover={{ scale: 1.05, y: 1 }}
          whileTap={{ scale: 0.96 }}
          onClick={showHeader}
          title={isRu ? 'Развернуть панель' : 'Restore panel'}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[var(--surface)]/85 backdrop-blur-xl border border-[var(--outline-var)]/80 shadow-lg shadow-black/10 hover:shadow-xl hover:border-[var(--accent)]/40 transition-all cursor-pointer select-none group"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent)]/12 text-[var(--accent)] group-hover:bg-[var(--accent)]/20 transition-colors">
            <ChevronDown size={13} strokeWidth={2.5} />
          </span>
          <span className="text-[10.5px] font-bold text-[var(--on-surface-var)] group-hover:text-[var(--on-surface)] transition-colors tracking-tight">
            {win.title}
          </span>
        </motion.button>
      )}

      {/* Header bar */}
      <AnimatePresence>
        {!win.hideTitleBar && (!isHeaderHidden || !win.isMaximized) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isMobileLayout ? 48 : 34, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => {
              isHoveringHeaderRef.current = true;
              if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
            }}
            onMouseLeave={() => {
              isHoveringHeaderRef.current = false;
              resetAutoHideTimer();
            }}
            onMouseDown={onTitleMouseDown}
            onDoubleClick={onTitleDoubleClick}
            onTouchStart={onTitleTouchStart}
            className={`flex ${isMobileLayout ? 'h-12 px-3' : 'h-8.5 px-3 cursor-grab active:cursor-grabbing'} shrink-0 items-center justify-between relative border-b border-[var(--outline-var)] select-none overflow-hidden`}
            style={{
              background: isActive
                ? 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 7%, var(--surface-dim)) 0%, var(--surface) 100%)'
                : 'var(--surface)',
            }}
          >
            {win.tabs && win.tabs.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2 overflow-x-auto custom-scrollbar-none py-0.5">
                {win.icon && (
                  <div className="w-4 h-4 flex items-center justify-center shrink-0 opacity-80 mr-0.5">
                    {win.icon}
                  </div>
                )}
                {win.tabs.map((tab, idx) => {
                  const isTabActive = win.activeTabId ? win.activeTabId === tab.id : idx === 0;
                  return (
                    <div
                      key={tab.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTab?.(tab.id);
                      }}
                      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer select-none max-w-[160px] shrink-0 border ${
                        isTabActive
                          ? 'bg-[var(--surface-high)] text-[var(--on-surface)] shadow-xs border-[var(--outline)]'
                          : 'border-transparent text-[var(--on-surface-var)] hover:bg-[var(--container)] hover:text-[var(--on-surface)]'
                      }`}
                      title={tab.title}
                    >
                      {tab.icon && <span className="shrink-0 w-3 h-3 opacity-80">{tab.icon}</span>}
                      <span className="truncate text-[11px]">{tab.title || `${isRu ? 'Вкладка' : isUk ? 'Вкладка' : 'Tab'} ${idx + 1}`}</span>

                      {/* Detach tab into separate overlapping window on top */}
                      {win.tabs!.length > 1 && onDetachTab && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDetachTab(tab.id);
                          }}
                          className="w-4 h-4 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-all ml-0.5 cursor-pointer"
                          title={isRu ? 'Открыть поверх (отдельным окном)' : isUk ? 'Відкрити окремим вікном поверх' : 'Open on top (overlapping window)'}
                        >
                          <ExternalLink size={9} />
                        </button>
                      )}

                      {win.tabs!.length > 1 && tab.closable !== false && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCloseTab?.(tab.id);
                          }}
                          className="w-4 h-4 rounded-full flex items-center justify-center opacity-50 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 transition-all ml-0.5 cursor-pointer"
                          title={isRu ? 'Закрыть вкладку' : isUk ? 'Закрити вкладку' : 'Close tab'}
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  );
                })}
                {win.onNewTabClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewTab?.();
                    }}
                    className="w-6 h-6 rounded-lg border border-dashed border-[var(--outline)] flex items-center justify-center text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] hover:border-[var(--accent)] transition-all cursor-pointer shrink-0"
                    title={isRu ? 'Новая вкладка' : isUk ? 'Нова вкладка' : 'New tab'}
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {win.icon}
                <span className={`${isMobileLayout ? 'text-xs font-black' : 'text-[11px] font-bold'} text-[var(--on-surface)] tracking-tight`}>
                  {win.title}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {win.headerActions}
              {!isMobileLayout && (
                 <>
                  {!isSystemApp && !win.disableReload && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReload();
                      }}
                      title={isRu ? 'Перезагрузить' : isUk ? 'Перезавантажити' : 'Reload'}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-colors cursor-pointer group"
                    >
                      <RotateCw size={11} className="group-hover:rotate-180 transition-transform duration-500" />
                    </motion.button>
                  )}
                  {win.isMaximized && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsHeaderHidden(true);
                      }}
                      title={isRu ? 'Скрыть панель' : isUk ? 'Приховати панель' : 'Hide panel'}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-colors cursor-pointer"
                    >
                      <ChevronUp size={13} />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                    title={isRu ? 'Свернуть' : isUk ? 'Згорнути' : 'Minimize'}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-colors cursor-pointer"
                  >
                    <Minus size={13} />
                  </motion.button>
                  {win.allowMaximize !== false && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); onToggleMaximize(); }}
                      title={win.isMaximized ? (isRu ? 'Восстановить' : isUk ? 'Відновити' : 'Restore') : (isRu ? 'Развернуть' : isUk ? 'Розгорнути' : 'Maximize')}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-colors cursor-pointer"
                    >
                      {win.isMaximized ? <Copy size={12} /> : <Square size={12} />}
                    </motion.button>
                  )}
                </>
              )}
              {isMobileLayout && !isSystemApp && !win.disableReload && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReload();
                  }}
                  title={isRu ? 'Перезагрузить' : isUk ? 'Перезавантажити' : 'Reload'}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-dim)] border border-[var(--outline)] text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-colors cursor-pointer group"
                >
                  <RotateCw size={13} className="group-hover:rotate-180 transition-transform duration-500" />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                title={isRu ? 'Закрыть' : isUk ? 'Закрити' : 'Close'}
                className={`flex items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-red-500 hover:text-white transition-colors cursor-pointer ${isMobileLayout ? 'h-7 w-7 bg-[var(--surface-dim)] border border-[var(--outline)]' : 'h-6 w-6'}`}
              >
                <X size={isMobileLayout ? 16 : 14} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] wm-content" key={win.renderKey}>
        {win.tabs && win.tabs.length > 0 ? (
          win.tabs.map((tab, idx) => {
            const isTabActive = win.activeTabId ? win.activeTabId === tab.id : idx === 0;
            return (
              <div
                key={tab.id}
                className="w-full h-full"
                style={{
                  display: isTabActive ? 'block' : 'none',
                }}
              >
                {tab.render()}
              </div>
            );
          })
        ) : renderWindowContent ? (
          renderWindowContent(win.id) ?? win.render()
        ) : (
          win.render()
        )}
      </div>

      {/* Material You M3 Window Launching Loader (covers entire window full-page) */}
      {!isSystemApp && loaderPhase !== 'hidden' && (
        <div
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center select-none rounded-[inherit] overflow-hidden ${
            loaderPhase === 'fading' ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
          style={{
            backdropFilter: 'blur(24px) saturate(150%)',
            WebkitBackdropFilter: 'blur(24px) saturate(150%)',
            background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
            opacity: loaderPhase === 'fading' ? 0 : 1,
            transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Dismiss button on top right */}
          <div className="absolute top-3 right-3 flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title={isRu ? 'Закрыть' : isUk ? 'Закрити' : 'Close'}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-dim)] border border-[var(--outline-var)] text-[var(--on-surface-var)] hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 px-6 text-center w-full max-w-sm">
            <div style={{ width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <M3LoadingIndicator size={50} color="var(--accent)" speed={1} />
            </div>
            <div className="flex flex-col items-center justify-center w-full gap-2.5">
              <div className="flex items-center gap-2">
                {win.icon && (
                  <div className="w-4 h-4 flex items-center justify-center shrink-0 opacity-80 text-[var(--accent)]">
                    {win.icon}
                  </div>
                )}
                <span className="text-xs sm:text-sm font-bold tracking-tight text-[var(--on-surface)]">
                  {win.loaderTitle || win.title} — {isRu ? 'Запуск' : isUk ? 'Запуск' : 'Launching'} <span className="text-[var(--on-surface-var)] ml-1 font-mono text-xs">{Math.round(loaderProgress)}%</span>
                </span>
              </div>
              {/* Horizontal status fill — simple line */}
              <div className="w-full h-1 bg-[var(--outline-var)] rounded-full overflow-hidden opacity-75">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-150 ease-out"
                  style={{
                    width: `${Math.min(100, Math.round(loaderProgress))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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

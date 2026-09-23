import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ChevronRight, Eye, Layers } from 'lucide-react';
import { Language, ThemeMode } from '../types';

export interface InkAppLauncherButtonProps {
  appId: string;
  openTabsCount: number;
  activeTabIndex?: number;
  onOpenNewTab: () => void;
  onFocusTab: (tabIndex: number) => void;
  onBackground: () => void;
  lang: Language;
  theme: ThemeMode;
  accentColor?: string;
  className?: string;
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 26,
  mass: 0.75,
};

export function InkAppLauncherButton({
  appId,
  openTabsCount,
  activeTabIndex = 1,
  onOpenNewTab,
  onFocusTab,
  onBackground,
  lang,
  theme,
  accentColor,
  className = '',
}: InkAppLauncherButtonProps) {
  const isRu = lang === 'ru';
  const isDark = theme === 'dark';
  const accent = accentColor || 'var(--accent, #6366f1)';

  // Build array of tab numbers to render
  const tabNumbers = Array.from({ length: Math.min(Math.max(openTabsCount, 2), 6) }, (_, i) => i + 1);

  return (
    <div className={`relative flex items-center justify-center w-full min-h-[44px] ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {openTabsCount === 0 ? (
          /* STATE 0: SINGLE "OPEN" BUTTON */
          <motion.button
            key={`${appId}-closed`}
            layoutId={`${appId}-launcher-ink`}
            transition={springTransition}
            initial={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenNewTab();
            }}
            className="w-full py-3 px-4 rounded-full text-xs font-black border transition-colors cursor-pointer text-center shadow-sm flex items-center justify-center gap-2 group relative overflow-hidden"
            style={{
              backgroundColor: isDark ? 'var(--btn-bg, #262626)' : accent,
              borderColor: isDark ? 'var(--btn-border, #404040)' : 'transparent',
              color: isDark ? 'var(--on-surface, #ffffff)' : '#ffffff',
              boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : `0 4px 14px ${accent}40`,
            }}
          >
            {/* Ripple ink reflection */}
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <span className="tracking-tight">{isRu ? 'Открыть' : 'Open'}</span>
            <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        ) : openTabsCount === 1 ? (
          /* STATE 1: SPLIT INTO "NEW TAB" + "IN BACKGROUND" */
          <motion.div
            key={`${appId}-single-tab`}
            layoutId={`${appId}-launcher-ink`}
            transition={springTransition}
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(3px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(3px)' }}
            className="flex items-center gap-1.5 w-full"
          >
            {/* New Tab button */}
            <motion.button
              layout
              transition={springTransition}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenNewTab();
              }}
              className="flex-1 py-2.5 px-3 rounded-2xl text-[11px] font-black border transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm relative overflow-hidden group"
              style={{
                backgroundColor: isDark ? 'var(--btn-bg, #262626)' : accent,
                borderColor: isDark ? 'var(--btn-border, #404040)' : 'transparent',
                color: isDark ? 'var(--on-surface, #ffffff)' : '#ffffff',
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.25)' : `0 3px 12px ${accent}35`,
              }}
              title={isRu ? 'Открыть новую вкладку' : 'Open new tab'}
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <Plus size={13} className="stroke-[3]" />
              <span className="truncate tracking-tight">{isRu ? 'Новая вкладка' : 'New Tab'}</span>
            </motion.button>

            {/* In Background button */}
            <motion.button
              layout
              transition={springTransition}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                e.stopPropagation();
                onBackground();
              }}
              className="px-3.5 py-2.5 rounded-2xl text-[11px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 relative overflow-hidden group"
              style={{
                backgroundColor: isDark ? 'var(--container, #1f1f1f)' : 'var(--container, #f3f4f6)',
                borderColor: isDark ? 'var(--btn-border, #404040)' : 'var(--outline-var, #e5e7eb)',
                color: 'var(--on-surface, #e5e7eb)',
              }}
              title={isRu ? 'Свернуть в фон' : 'Run in background'}
            >
              <Eye size={12} className="opacity-80" />
              <span className="tracking-tight">{isRu ? 'В фоне' : 'Background'}</span>
            </motion.button>
          </motion.div>
        ) : (
          /* STATE 2+: SPLIT INTO [+] [1] [2] ... [IN BACKGROUND] */
          <motion.div
            key={`${appId}-multi-tabs`}
            layoutId={`${appId}-launcher-ink`}
            transition={springTransition}
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(3px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(3px)' }}
            className="flex items-center gap-1.5 w-full"
          >
            {/* Plus button to open another new tab */}
            <motion.button
              layout
              transition={springTransition}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenNewTab();
              }}
              className="h-10 w-10 rounded-2xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm relative overflow-hidden group"
              style={{
                backgroundColor: isDark ? 'var(--btn-bg, #262626)' : accent,
                borderColor: isDark ? 'var(--btn-border, #404040)' : 'transparent',
                color: isDark ? 'var(--on-surface, #ffffff)' : '#ffffff',
                boxShadow: isDark ? '0 2px 6px rgba(0,0,0,0.25)' : `0 3px 10px ${accent}30`,
              }}
              title={isRu ? 'Открыть ещё вкладку' : 'Open another tab'}
            >
              <Plus size={15} className="stroke-[3]" />
            </motion.button>

            {/* Tab buttons: 1, 2, ... */}
            <div className="flex-1 flex items-center gap-1 min-w-0">
              {tabNumbers.map((tabNum) => {
                const isActive = activeTabIndex === tabNum;
                return (
                  <motion.button
                    key={`${appId}-tab-${tabNum}`}
                    layout
                    transition={springTransition}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFocusTab(tabNum);
                    }}
                    className={`flex-1 py-2 px-2 rounded-2xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1 relative overflow-hidden ${
                      isActive ? 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--surface)]' : ''
                    }`}
                    style={{
                      backgroundColor: isActive
                        ? isDark
                          ? 'var(--surface-high, #333333)'
                          : 'var(--accent-dim, #e0e7ff)'
                        : isDark
                        ? 'var(--container, #1f1f1f)'
                        : 'var(--container, #f3f4f6)',
                      borderColor: isActive
                        ? 'var(--accent)'
                        : isDark
                        ? 'var(--btn-border, #404040)'
                        : 'var(--outline-var, #e5e7eb)',
                      color: isActive
                        ? isDark
                          ? '#ffffff'
                          : 'var(--accent)'
                        : 'var(--on-surface, #e5e7eb)',
                    }}
                    title={isRu ? `Перейти во вкладку ${tabNum}` : `Switch to Tab ${tabNum}`}
                  >
                    <span>{tabNum}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* In Background */}
            <motion.button
              layout
              transition={springTransition}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onBackground();
              }}
              className="px-2.5 py-2.5 rounded-2xl text-[10px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0 relative overflow-hidden"
              style={{
                backgroundColor: isDark ? 'var(--container, #1f1f1f)' : 'var(--container, #f3f4f6)',
                borderColor: isDark ? 'var(--btn-border, #404040)' : 'var(--outline-var, #e5e7eb)',
                color: 'var(--on-surface-var, #9ca3af)',
              }}
              title={isRu ? 'Свернуть в фон' : 'Background'}
            >
              <Eye size={12} />
              <span className="hidden sm:inline tracking-tight">{isRu ? 'В фоне' : 'Bg'}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

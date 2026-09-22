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
  stiffness: 450,
  damping: 28,
  mass: 0.8,
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

  return (
    <div className={`relative flex items-center justify-center w-full min-h-[44px] ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {openTabsCount === 0 ? (
          /* STATE 0: SINGLE "OPEN" BUTTON */
          <motion.button
            key={`${appId}-closed`}
            layoutId={`${appId}-launcher-ink`}
            transition={springTransition}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenNewTab();
            }}
            className="w-full py-3 px-4 rounded-full text-xs font-black border transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer text-center shadow-sm flex items-center justify-center gap-2"
            style={{
              backgroundColor: isDark ? 'var(--btn-bg, #262626)' : accent,
              borderColor: isDark ? 'var(--btn-border, #404040)' : 'transparent',
              color: isDark ? 'var(--on-surface, #ffffff)' : '#ffffff',
              boxShadow: isDark ? undefined : `0 4px 14px ${accent}40`,
            }}
          >
            <span>{isRu ? 'Открыть' : 'Open'}</span>
            <ChevronRight size={15} />
          </motion.button>
        ) : openTabsCount === 1 ? (
          /* STATE 1: SPLIT INTO "NEW TAB" + "IN BACKGROUND" */
          <motion.div
            key={`${appId}-single-tab`}
            layoutId={`${appId}-launcher-ink`}
            transition={springTransition}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-1.5 w-full"
          >
            {/* New Tab button */}
            <motion.button
              layout
              transition={springTransition}
              onClick={(e) => {
                e.stopPropagation();
                onOpenNewTab();
              }}
              className="flex-1 py-2.5 px-3 rounded-2xl text-[11px] font-black border transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              style={{
                backgroundColor: isDark ? 'var(--btn-bg, #262626)' : accent,
                borderColor: isDark ? 'var(--btn-border, #404040)' : 'transparent',
                color: isDark ? 'var(--on-surface, #ffffff)' : '#ffffff',
              }}
              title={isRu ? 'Открыть новую вкладку' : 'Open new tab'}
            >
              <Plus size={13} className="stroke-[3]" />
              <span className="truncate">{isRu ? 'Новая вкладка' : 'New Tab'}</span>
            </motion.button>

            {/* In Background / Switch tab 1 button */}
            <motion.button
              layout
              transition={springTransition}
              onClick={(e) => {
                e.stopPropagation();
                onBackground();
              }}
              className="px-3 py-2.5 rounded-2xl text-[11px] font-bold border transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-1 shrink-0"
              style={{
                backgroundColor: isDark ? 'var(--container, #1f1f1f)' : 'var(--container, #f3f4f6)',
                borderColor: isDark ? 'var(--btn-border, #404040)' : 'var(--outline-var, #e5e7eb)',
                color: 'var(--on-surface, #e5e7eb)',
              }}
              title={isRu ? 'Работать в фоне / скрыть' : 'Run in background'}
            >
              <Eye size={12} />
              <span>{isRu ? 'В фоне' : 'Background'}</span>
            </motion.button>
          </motion.div>
        ) : (
          /* STATE 2+: SPLIT INTO [+] [1] [2] ... [IN BACKGROUND] */
          <motion.div
            key={`${appId}-multi-tabs`}
            layoutId={`${appId}-launcher-ink`}
            transition={springTransition}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-1.5 w-full"
          >
            {/* Plus button to open another new tab */}
            <motion.button
              layout
              transition={springTransition}
              onClick={(e) => {
                e.stopPropagation();
                onOpenNewTab();
              }}
              className="h-10 w-10 rounded-2xl border flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-sm"
              style={{
                backgroundColor: isDark ? 'var(--btn-bg, #262626)' : accent,
                borderColor: isDark ? 'var(--btn-border, #404040)' : 'transparent',
                color: isDark ? 'var(--on-surface, #ffffff)' : '#ffffff',
              }}
              title={isRu ? 'Открыть ещё вкладку' : 'Open another tab'}
            >
              <Plus size={15} className="stroke-[3]" />
            </motion.button>

            {/* Tab 1 button */}
            <motion.button
              layout
              transition={springTransition}
              onClick={(e) => {
                e.stopPropagation();
                onFocusTab(1);
              }}
              className={`flex-1 py-2.5 px-2 rounded-2xl text-xs font-black border transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1 ${
                activeTabIndex === 1 ? 'ring-2 ring-[var(--accent)]' : ''
              }`}
              style={{
                backgroundColor: isDark ? 'var(--container, #1f1f1f)' : 'var(--container, #f3f4f6)',
                borderColor: isDark ? 'var(--btn-border, #404040)' : 'var(--outline-var, #e5e7eb)',
                color: 'var(--on-surface, #e5e7eb)',
              }}
              title={isRu ? 'Перейти во вкладку 1' : 'Switch to Tab 1'}
            >
              <span>1</span>
            </motion.button>

            {/* Tab 2 button */}
            <motion.button
              layout
              transition={springTransition}
              onClick={(e) => {
                e.stopPropagation();
                onFocusTab(2);
              }}
              className={`flex-1 py-2.5 px-2 rounded-2xl text-xs font-black border transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1 ${
                activeTabIndex === 2 ? 'ring-2 ring-[var(--accent)]' : ''
              }`}
              style={{
                backgroundColor: isDark ? 'var(--container, #1f1f1f)' : 'var(--container, #f3f4f6)',
                borderColor: isDark ? 'var(--btn-border, #404040)' : 'var(--outline-var, #e5e7eb)',
                color: 'var(--on-surface, #e5e7eb)',
              }}
              title={isRu ? 'Перейти во вкладку 2' : 'Switch to Tab 2'}
            >
              <span>2</span>
            </motion.button>

            {/* In Background */}
            <motion.button
              layout
              transition={springTransition}
              onClick={(e) => {
                e.stopPropagation();
                onBackground();
              }}
              className="px-2.5 py-2.5 rounded-2xl text-[10px] font-bold border transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1 shrink-0"
              style={{
                backgroundColor: isDark ? 'var(--container, #1f1f1f)' : 'var(--container, #f3f4f6)',
                borderColor: isDark ? 'var(--btn-border, #404040)' : 'var(--outline-var, #e5e7eb)',
                color: 'var(--on-surface-var, #9ca3af)',
              }}
              title={isRu ? 'В фоне' : 'Background'}
            >
              <Eye size={12} />
              <span className="hidden sm:inline">{isRu ? 'В фоне' : 'Bg'}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

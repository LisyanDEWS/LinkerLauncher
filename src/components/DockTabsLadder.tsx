import React from 'react';
import { motion } from 'motion/react';
import { Plus, X, Layers } from 'lucide-react';
import { Language, ThemeMode } from '../types';

export interface DockTabItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

export interface DockTabsLadderProps {
  appId: string;
  appTitle: string;
  appIcon?: React.ReactNode;
  tabs: DockTabItem[];
  activeTabId?: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab?: (tabId: string) => void;
  onNewTab?: () => void;
  onClose: () => void;
  lang: Language;
  theme: ThemeMode;
  accentColor?: string;
}

const springLadder = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 26,
  mass: 0.8,
};

export function DockTabsLadder({
  appTitle,
  appIcon,
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onClose,
  lang,
  accentColor,
}: DockTabsLadderProps) {
  const isRu = lang === 'ru';
  const isUk = lang === 'uk';
  const accent = accentColor || 'var(--accent, #6366f1)';

  // Build the list of tabs: if empty, show at least 1 tab for the main window
  const displayTabs: DockTabItem[] =
    tabs.length > 0
      ? tabs
      : [
          {
            id: 'main_tab',
            title: appTitle,
            icon: appIcon,
            isActive: true,
          },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.94 }}
      transition={springLadder}
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2 z-[250] min-w-[250px] max-w-[320px] rounded-3xl p-3 border shadow-2xl select-none pointer-events-auto"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--surface) 92%, transparent)',
        borderColor: 'var(--outline)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow:
          '0 24px 48px -12px rgba(0,0,0,0.38), 0 0 0 1px color-mix(in srgb, var(--accent) 18%, transparent)',
      }}
    >
      {/* Downward pointer notch pointing to the dock pill */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--surface) 92%, transparent)',
          borderColor: 'var(--outline)',
        }}
      />

      {/* Header with App Title & Tabs Count */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--outline-var)]">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded-xl flex items-center justify-center shrink-0 border border-[var(--outline-var)]"
            style={{
              backgroundColor: 'var(--container)',
              color: accent,
            }}
          >
            {appIcon || <Layers size={13} />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-[var(--on-surface)] tracking-tight truncate">
              {appTitle}
            </span>
            <span className="text-[10px] font-semibold text-[var(--on-surface-var)]">
              {displayTabs.length}{' '}
              {isRu
                ? displayTabs.length === 1
                  ? 'вкладка'
                  : displayTabs.length < 5
                    ? 'вкладки'
                    : 'вкладок'
                : isUk
                  ? displayTabs.length === 1
                    ? 'вкладка'
                    : displayTabs.length < 5
                      ? 'вкладки'
                      : 'вкладок'
                  : displayTabs.length === 1
                    ? 'tab'
                    : 'tabs'}
            </span>
          </div>
        </div>

        {onNewTab && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={(e) => {
              e.stopPropagation();
              onNewTab();
              onClose();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black border transition-colors cursor-pointer shrink-0"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
              color: accent,
            }}
            title={isRu ? 'Открыть новую вкладку' : isUk ? 'Відкрити нову вкладку' : 'Open new tab'}
          >
            <Plus size={12} className="stroke-[3]" />
            <span>{isRu ? 'Вкладка' : isUk ? 'Вкладка' : 'Tab'}</span>
          </motion.button>
        )}
      </div>

      {/* Cascading ladder ("лесенка") of tabs */}
      <div className="flex flex-col gap-1.5 relative py-0.5">
        {/* Visual rail connecting the ladder steps */}
        <div
          className="absolute left-3.5 top-3 bottom-3 w-0.5 rounded-full pointer-events-none opacity-25"
          style={{
            background: 'linear-gradient(to bottom, var(--accent), var(--outline))',
          }}
        />

        {displayTabs.map((tab, idx) => {
          const isActive =
            tab.isActive !== undefined
              ? tab.isActive
              : activeTabId
                ? tab.id === activeTabId
                : idx === 0;

          // Staircase step offset: each step is subtly indented to form a ladder
          const stepOffset = Math.min(idx * 5, 20);

          return (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, x: -8, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 24,
                delay: idx * 0.04,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTab(tab.id);
                onClose();
              }}
              className={`group relative flex items-center justify-between gap-2.5 p-2 rounded-2xl border transition-all cursor-pointer select-none overflow-hidden ${
                isActive
                  ? 'shadow-sm'
                  : 'hover:bg-[var(--container)]'
              }`}
              style={{
                marginLeft: `${stepOffset}px`,
                backgroundColor: isActive
                  ? 'var(--surface-high)'
                  : 'color-mix(in srgb, var(--container) 55%, transparent)',
                borderColor: isActive
                  ? accent
                  : 'var(--outline-var)',
              }}
            >
              {/* Step indicator with rung number */}
              <div className="flex items-center gap-2 min-w-0 z-10">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? accent
                      : 'var(--container-high)',
                    color: isActive ? '#ffffff' : 'var(--on-surface-var)',
                  }}
                >
                  {idx + 1}
                </span>

                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs font-bold truncate tracking-tight transition-colors ${
                      isActive
                        ? 'text-[var(--on-surface)]'
                        : 'text-[var(--on-surface-var)] group-hover:text-[var(--on-surface)]'
                    }`}
                  >
                    {tab.title || `${isRu ? 'Вкладка' : isUk ? 'Вкладка' : 'Tab'} ${idx + 1}`}
                  </span>

                  {isActive && (
                    <span
                      className="text-[9px] font-extrabold flex items-center gap-1 leading-none mt-0.5"
                      style={{ color: accent }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: accent }}
                      />
                      {isRu ? 'Активна' : isUk ? 'Активна' : 'Active'}
                    </span>
                  )}
                </div>
              </div>

              {/* Close button for tab (if more than 1 tab) */}
              {onCloseTab && displayTabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="w-5 h-5 rounded-full flex items-center justify-center opacity-40 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 transition-all shrink-0 cursor-pointer z-10"
                  title={isRu ? 'Закрыть вкладку' : isUk ? 'Закрити вкладку' : 'Close tab'}
                >
                  <X size={11} />
                </button>
              )}

              {/* Active ambient glow reflection */}
              {isActive && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{
                    background: `linear-gradient(90deg, ${accent} 0%, transparent 100%)`,
                  }}
                />
              )}
            </motion.div>
          );
        })}

        {/* Bottom step: "+ Новая вкладка" */}
        {onNewTab && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              onNewTab();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 mt-1 rounded-2xl border border-dashed text-xs font-bold transition-all cursor-pointer"
            style={{
              borderColor: 'var(--outline)',
              color: 'var(--on-surface-var)',
              backgroundColor: 'color-mix(in srgb, var(--container) 40%, transparent)',
            }}
          >
            <Plus size={13} className="stroke-[2.5]" />
            <span>{isRu ? 'Новая вкладка' : isUk ? 'Нова вкладка' : 'New tab'}</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

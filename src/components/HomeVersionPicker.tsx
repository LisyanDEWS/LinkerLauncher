import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, LayoutGrid, Sparkles, Layers } from 'lucide-react';
import { HomeVersion, Language } from '../types';

/**
 * HomeVersionPicker — modal that lists every registered home version.
 *
 * To add a new version:
 *   1. Add a value to `HomeVersion` in src/types.ts
 *   2. Add an entry to `VERSIONS` below (id, icon, title, description, accent)
 *   3. Register the component in App.tsx's home switch block
 *
 * The picker reads the registry below, so it auto-renders new versions
 * without any picker-side changes.
 */

export interface HomeVersionMeta {
  id: HomeVersion;
  // Icon shown in the picker card
  icon: React.ReactNode;
  // Localized titles
  titleRu: string;
  titleEn: string;
  // Localized descriptions
  descRu: string;
  descEn: string;
  // A short tag for the badge
  tag: string;
}

export const HOME_VERSIONS: HomeVersionMeta[] = [
  {
    id: 'classic',
    icon: <LayoutGrid size={22} />,
    titleRu: 'Классический',
    titleEn: 'Classic',
    descRu: 'Оригинальный bento-лаунчер LinkerRu:Re с верхней панелью и виджетами.',
    descEn: 'The original LinkerRu:Re bento launcher with top bar and widgets.',
    tag: 'v1',
  },
  {
    id: 'nextgen',
    icon: <Sparkles size={22} />,
    titleRu: 'NextGen',
    titleEn: 'NextGen',
    descRu: 'Стеклянный bento-grid с авророй-фоном и omnibox-поиском.',
    descEn: 'Glassmorphic bento grid with aurora background and omnibox search.',
    tag: 'v2',
  },
  {
    id: 'expressive',
    icon: <Layers size={22} />,
    titleRu: 'Expressive',
    titleEn: 'Expressive',
    descRu: 'M3 Expressive платформенный лаунчер: док, секции, Now-карта.',
    descEn: 'M3 Expressive platform launcher: dock, sections, Now-card.',
    tag: 'v3',
  },
  {
    id: 'fusion',
    icon: <Sparkles size={22} />,
    titleRu: 'Fusion',
    titleEn: 'Fusion',
    descRu: 'Гибрид NextGen + Expressive: стекло, секции, док, аврора.',
    descEn: 'NextGen + Expressive hybrid: glass, sections, dock, aurora.',
    tag: 'v4',
  },
];

interface HomeVersionPickerProps {
  open: boolean;
  onClose: () => void;
  current: HomeVersion;
  onSelect: (v: HomeVersion) => void;
  lang: Language;
}

export function HomeVersionPicker({ open, onClose, current, onSelect, lang }: HomeVersionPickerProps) {
  const isRu = lang === 'ru';
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 24, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-[2rem] border border-[var(--outline)] bg-[var(--surface)] p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--container)] border border-[var(--outline)]">
                  <Layers size={18} className="text-[var(--on-surface)]" />
                </div>
                <div className="flex flex-col leading-tight">
                  <h2 className="text-lg font-black tracking-tight text-[var(--on-surface)]">
                    {isRu ? 'Дизайн дома' : 'Home Design'}
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">
                    {isRu ? 'Выберите версию лаунчера' : 'Choose a launcher version'}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] border border-[var(--outline)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Version list */}
            <div className="flex flex-col gap-2.5">
              {HOME_VERSIONS.map((v, i) => {
                const active = v.id === current;
                return (
                  <motion.button
                    key={v.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i + 0.1 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelect(v.id)}
                    className={`group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-[var(--accent)] bg-[var(--container)]'
                        : 'border-[var(--outline)] bg-[var(--surface-dim)] hover:border-[var(--on-surface-var)]'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--outline)] text-[var(--on-surface)]"
                      style={{ background: 'var(--surface)' }}
                    >
                      {v.icon}
                    </div>
                    {/* Text */}
                    <div className="flex flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black tracking-tight text-[var(--on-surface)]">
                          {isRu ? v.titleRu : v.titleEn}
                        </span>
                        <span className="rounded-md border border-[var(--outline)] bg-[var(--surface)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">
                          {v.tag}
                        </span>
                      </div>
                      <span className="text-xs font-medium leading-relaxed text-[var(--on-surface-var)]">
                        {isRu ? v.descRu : v.descEn}
                      </span>
                    </div>
                    {/* Active check */}
                    {active && (
                      <motion.div
                        layoutId="home-version-active"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ background: 'var(--accent)' }}
                      >
                        <Check size={14} className="stroke-[3]" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)] opacity-60">
              {isRu ? 'Выбор сохраняется между сессиями' : 'Choice persists across sessions'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

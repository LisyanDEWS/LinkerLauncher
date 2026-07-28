import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, LayoutGrid, Sparkles, Layers, Compass, ArrowUpRight, Search, ShieldCheck } from 'lucide-react';
import { HomeVersion, Language } from '../types';

export interface HomeVersionMeta {
  id: HomeVersion;
  icon: React.ReactNode;
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  tag: string;
  badgeRu: string;
  badgeEn: string;
  previewType: 'classic' | 'nextgen' | 'expressive' | 'fusion';
}

export const HOME_VERSIONS: HomeVersionMeta[] = [
  {
    id: 'classic',
    icon: <LayoutGrid size={20} />,
    titleRu: 'Классический',
    titleEn: 'Classic OS',
    descRu: 'Оригинальный bento-лаунчер LinkerRu:Re с виджетами, системным сайдбаром и панелью ссылок.',
    descEn: 'Original bento launcher with modular widgets, system sidebar and quick link panels.',
    tag: 'v1',
    badgeRu: 'Классика',
    badgeEn: 'Classic Bento',
    previewType: 'classic',
  },
  {
    id: 'nextgen',
    icon: <Sparkles size={20} />,
    titleRu: 'NextGen',
    titleEn: 'NextGen Aurora',
    descRu: 'Стеклянный bento-grid с динамической авророй, омнибоксом поиска и плавным стеклом.',
    descEn: 'Glassmorphic bento grid with dynamic background aurora, omnibox and ultra-smooth glass.',
    tag: 'v2',
    badgeRu: 'Стекло & Аврора',
    badgeEn: 'Aurora & Glass',
    previewType: 'nextgen',
  },
  {
    id: 'expressive',
    icon: <Layers size={20} />,
    titleRu: 'Expressive',
    titleEn: 'Expressive M3',
    descRu: 'Платформенный интерфейс M3: плавающий док, тематические секции, Hero-карты.',
    descEn: 'M3 Expressive launcher: floating bottom dock, themed category sections, Hero cards.',
    tag: 'v3',
    badgeRu: 'M3 Платформа',
    badgeEn: 'M3 Expressive',
    previewType: 'expressive',
  },
  {
    id: 'fusion',
    icon: <Compass size={20} />,
    titleRu: 'Fusion Hybrid',
    titleEn: 'Fusion Hybrid',
    descRu: 'Гибрид NextGen + Expressive: глубокое стекло, карточки «Now», аврора и умный док.',
    descEn: 'NextGen + Expressive hybrid: deep frosted glass, Now hero cards, aurora & dynamic dock.',
    tag: 'v4',
    badgeRu: 'Флагман v4',
    badgeEn: 'Flagship v4',
    previewType: 'fusion',
  },
];

interface HomeVersionPickerProps {
  open: boolean;
  onClose: () => void;
  current: HomeVersion;
  onSelect: (v: HomeVersion) => void;
  lang: Language;
}

function VersionPreviewGraphic({ type, active }: { type: 'classic' | 'nextgen' | 'expressive' | 'fusion'; active: boolean }) {
  if (type === 'classic') {
    return (
      <div className="relative h-28 w-full overflow-hidden rounded-xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-2.5 flex flex-col justify-between select-none">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <div className="h-2 w-12 rounded-full bg-[var(--outline)]" />
          </div>
          <div className="h-2 w-8 rounded-full bg-[var(--outline-var)]" />
        </div>
        {/* Mini Grid */}
        <div className="grid grid-cols-3 gap-1.5 my-auto">
          <div className="h-9 rounded-lg bg-[var(--surface)] border border-[var(--outline-var)] p-1 flex flex-col justify-between">
            <div className="h-1.5 w-4 rounded-full bg-[var(--accent)]" />
            <div className="h-1 w-full rounded bg-[var(--outline-var)]" />
          </div>
          <div className="h-9 rounded-lg bg-[var(--surface)] border border-[var(--outline-var)] p-1 flex flex-col justify-between">
            <div className="h-1.5 w-4 rounded-full bg-[var(--on-surface-var)]" />
            <div className="h-1 w-3/4 rounded bg-[var(--outline-var)]" />
          </div>
          <div className="h-9 rounded-lg bg-[var(--surface)] border border-[var(--outline-var)] p-1 flex flex-col justify-between">
            <div className="h-1.5 w-4 rounded-full bg-[var(--accent)]" />
            <div className="h-1 w-1/2 rounded bg-[var(--outline-var)]" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'nextgen') {
    return (
      <div className="relative h-28 w-full overflow-hidden rounded-xl border border-[var(--outline-var)] bg-black/40 p-2.5 flex flex-col justify-between select-none">
        {/* Aurora background simulation */}
        <div className="absolute -top-6 -left-6 h-20 w-20 rounded-full bg-cyan-500/30 blur-xl" />
        <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-indigo-500/30 blur-xl" />
        
        {/* Search omnibox */}
        <div className="relative z-10 flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-2.5 py-1 border border-white/20">
          <Search size={10} className="text-white/70" />
          <div className="h-1.5 w-16 rounded-full bg-white/40" />
        </div>
        {/* Bento glass tiles */}
        <div className="relative z-10 grid grid-cols-2 gap-1.5">
          <div className="h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-1.5 flex flex-col justify-between">
            <div className="h-2 w-2 rounded-full bg-cyan-400" />
            <div className="h-1.5 w-10 rounded bg-white/50" />
          </div>
          <div className="h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-1.5 flex flex-col justify-between">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <div className="h-1.5 w-12 rounded bg-white/50" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'expressive') {
    return (
      <div className="relative h-28 w-full overflow-hidden rounded-xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-2 flex flex-col justify-between select-none">
        {/* Hero banner card */}
        <div className="h-12 w-full rounded-lg bg-gradient-to-r from-[var(--accent)] to-purple-600 p-2 text-white flex flex-col justify-between">
          <div className="h-1.5 w-8 rounded-full bg-white/40" />
          <div className="h-2 w-20 rounded-full bg-white font-bold text-[8px]" />
        </div>
        {/* Bottom floating dock pill */}
        <div className="mx-auto flex items-center gap-2 rounded-full bg-[var(--surface)] border border-[var(--outline)] px-3 py-1 shadow-sm">
          <div className="h-3.5 w-3.5 rounded-full bg-[var(--accent)]" />
          <div className="h-3.5 w-3.5 rounded-full bg-[var(--on-surface-var)]" />
          <div className="h-3.5 w-3.5 rounded-full bg-[var(--outline)]" />
          <div className="h-3.5 w-3.5 rounded-full bg-[var(--accent)]" />
        </div>
      </div>
    );
  }

  // fusion
  return (
    <div className="relative h-28 w-full overflow-hidden rounded-xl border border-[var(--outline-var)] bg-slate-950 p-2.5 flex flex-col justify-between select-none">
      {/* Aurora glow */}
      <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-purple-500/25 blur-xl" />
      <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-blue-500/25 blur-xl" />

      {/* Top Glass Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="h-2 w-10 rounded-full bg-white/60" />
        <div className="h-3 w-3 rounded-full bg-cyan-400/80" />
      </div>

      {/* Grid */}
      <div className="relative z-10 grid grid-cols-3 gap-1 my-auto">
        <div className="col-span-2 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-md bg-cyan-500/80 shrink-0" />
          <div className="h-1.5 w-12 rounded bg-white/60" />
        </div>
        <div className="col-span-1 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full bg-purple-400/80" />
        </div>
      </div>

      {/* Floating dock indicator */}
      <div className="relative z-10 mx-auto h-1.5 w-14 rounded-full bg-white/40" />
    </div>
  );
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-[2.5rem] border border-[var(--outline)] bg-[var(--surface)] p-5 sm:p-7 shadow-2xl my-auto max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--container)] border border-[var(--outline)] shadow-sm">
                  <Layers size={22} className="text-[var(--accent)]" />
                </div>
                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black tracking-tight text-[var(--on-surface)]">
                      {isRu ? 'Выбор стиля лаунчера' : 'Home Version Launcher'}
                    </h2>
                    <span className="rounded-full bg-[var(--container)] border border-[var(--outline)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--accent)]">
                      LinkerOS
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[var(--on-surface-var)] mt-0.5">
                    {isRu ? 'Выберите концепцию внешнего вида рабочего стола' : 'Select your preferred desktop UI framework & theme concept'}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--container)] border border-[var(--outline)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-1 pb-1 scrollbar-thin">
              {HOME_VERSIONS.map((v, i) => {
                const active = v.id === current;
                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i + 0.05, duration: 0.3 }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelect(v.id);
                    }}
                    className={`group relative flex flex-col justify-between rounded-3xl border p-4 text-left transition-all cursor-pointer ${
                      active
                        ? 'border-[var(--accent)] bg-[var(--container)] shadow-lg ring-2 ring-[var(--accent)]/30'
                        : 'border-[var(--outline)] bg-[var(--surface-dim)] hover:border-[var(--on-surface-var)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    {/* Visual Graphic */}
                    <div className="mb-3.5 relative">
                      <VersionPreviewGraphic type={v.previewType} active={active} />
                      
                      {/* Active indicator badge */}
                      {active && (
                        <motion.div
                          layoutId="home-version-active-badge"
                          className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md z-20"
                          style={{ background: 'var(--accent)' }}
                        >
                          <Check size={12} className="stroke-[3]" />
                          <span>{isRu ? 'Активен' : 'Active'}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-col flex-1 justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black tracking-tight text-[var(--on-surface)]">
                              {isRu ? v.titleRu : v.titleEn}
                            </span>
                          </div>
                          <span className="rounded-full border border-[var(--outline)] bg-[var(--surface)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">
                            {v.tag}
                          </span>
                        </div>

                        <p className="text-xs font-semibold leading-relaxed text-[var(--on-surface-var)] line-clamp-2 mb-3">
                          {isRu ? v.descRu : v.descEn}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--outline-var)]">
                        <span className="text-[10px] font-bold text-[var(--accent)] tracking-wide uppercase">
                          {isRu ? v.badgeRu : v.badgeEn}
                        </span>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 ${active ? 'text-[var(--accent)]' : 'text-[var(--on-surface-var)]'}`}>
                          <ArrowUpRight size={14} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-[var(--outline-var)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-semibold text-[var(--on-surface-var)] shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-[var(--accent)]" />
                <span>{isRu ? 'Настройки и состояние приложений сохраняются' : 'Settings and app states are preserved'}</span>
              </div>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[var(--accent)] text-white font-extrabold hover:opacity-90 active:scale-95 transition-all cursor-pointer text-center"
              >
                {isRu ? 'Применить и закрыть' : 'Apply & Close'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


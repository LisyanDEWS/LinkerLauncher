import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  X,
  ChevronRight,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Languages,
  Check,
  ChevronDown,
  Sliders,
} from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { translations } from '../data/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  onOpenFullSettings: () => void;
  primaryColor: string;
  brightness: number;
  onBrightnessChange: (val: number) => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  isSoundEnabled: boolean;
  onSoundToggle: () => void;
}

const calculatePopoverPos = () => {
  const pw = 340;
  if (typeof window === 'undefined') {
    return { top: 80, left: 16 };
  }
  // Anchor to settings pill or avatar on topbar
  const anchor =
    document.getElementById('topbar-settings-pill') ||
    document.getElementById('topbar-avatar') ||
    document.getElementById('topbar-clock-pill');
  const rect = anchor?.getBoundingClientRect();

  if (rect && rect.width > 0 && rect.height > 0) {
    let left = rect.right - pw;
    if (left < 16) left = 16;
    if (left + pw > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - pw - 16);
    }
    return {
      top: rect.bottom + 10,
      left,
    };
  }

  // Fallback: top-right corner
  return {
    top: 76,
    left: Math.max(16, window.innerWidth - pw - 20),
  };
};

// Staggered cascade animation variants (ladder entrance)
const panelVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 380,
      mass: 0.7,
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -14,
    scale: 0.97,
    transition: {
      duration: 0.15,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 420,
      mass: 0.6,
    },
  },
};

export default function SettingsModal({
  isOpen,
  onClose,
  lang,
  onLangChange,
  theme,
  onThemeToggle,
  onOpenFullSettings,
  primaryColor,
  brightness,
  onBrightnessChange,
  volume,
  onVolumeChange,
  isSoundEnabled,
  onSoundToggle,
}: SettingsModalProps) {
  const t = translations[lang] || translations.ru;
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>(calculatePopoverPos);
  const [backdropClickable, setBackdropClickable] = useState(true);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const langOptions: { id: Language; name: string; desc: string; code: string }[] = [
    {
      id: 'ru',
      name: 'Русский',
      desc: lang === 'ru' ? 'Русский язык' : 'Russian language',
      code: 'RU',
    },
    {
      id: 'en',
      name: 'English',
      desc: lang === 'ru' ? 'Английский язык' : 'English language',
      code: 'EN',
    },
  ];

  useLayoutEffect(() => {
    if (!isOpen) {
      setIsLangMenuOpen(false);
      return;
    }
    setBackdropClickable(true);

    const updatePosition = () => {
      setPopoverPos(calculatePopoverPos());
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLangMenuOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Frosted translucent backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onAnimationComplete={() => {
              if (!isOpen) setBackdropClickable(false);
            }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            style={{ pointerEvents: backdropClickable ? 'auto' : 'none' }}
            id="settings-quick-backdrop"
          />

          {/* Quick Settings Panel (Translucent Frosted Glass + Staggered Cascade) */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onAnimationComplete={() => {
              if (!isOpen) setBackdropClickable(false);
            }}
            className="fixed z-10 w-[calc(100vw-32px)] max-w-[340px] rounded-[24px] border border-white/20 dark:border-white/10 bg-[color-mix(in_srgb,var(--surface)_75%,transparent)] backdrop-blur-xl p-4 shadow-[0_20px_45px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] select-none overflow-hidden"
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              pointerEvents: backdropClickable ? 'auto' : 'none',
            }}
            id="settings-quick-modal"
          >
            {/* Step 1: Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-3 px-0.5">
              <div className="flex items-center gap-2">
                <Sliders size={14} className="text-[var(--accent)]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">
                  {t.quick_settings_title || (lang === 'ru' ? 'БЫСТРЫЕ НАСТРОЙКИ' : 'QUICK SETTINGS')}
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--on-surface-var)] transition-all hover:bg-[var(--surface-high)]/60 hover:text-[var(--on-surface)] active:scale-95 cursor-pointer"
                id="quick-settings-close"
                title={lang === 'ru' ? 'Закрыть' : 'Close'}
              >
                <X size={15} />
              </button>
            </motion.div>

            {/* Step 2: Brightness Slider */}
            <motion.div
              variants={itemVariants}
              className="mb-2.5 p-3 rounded-2xl bg-[color-mix(in_srgb,var(--container)_60%,transparent)] border border-white/10 dark:border-white/5"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[var(--on-surface)] mb-1.5">
                <div className="flex items-center gap-2 text-[var(--on-surface-var)]">
                  <Sun size={15} />
                  <span className="text-xs font-semibold text-[var(--on-surface)]">
                    {lang === 'ru' ? 'Яркость' : 'Brightness'}
                  </span>
                </div>
                <span className="text-xs font-black tabular-nums text-[var(--on-surface)]">{brightness}%</span>
              </div>
              <div className="relative flex items-center h-5">
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={brightness}
                  onChange={(e) => onBrightnessChange(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--surface-high)]/70 accent-[var(--accent)]"
                  style={{
                    accentColor: primaryColor,
                  }}
                  id="quick-settings-brightness-range"
                />
              </div>
            </motion.div>

            {/* Step 3: Volume Slider */}
            <motion.div
              variants={itemVariants}
              className="mb-3 p-3 rounded-2xl bg-[color-mix(in_srgb,var(--container)_60%,transparent)] border border-white/10 dark:border-white/5"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[var(--on-surface)] mb-1.5">
                <div className="flex items-center gap-2 text-[var(--on-surface-var)]">
                  {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span className="text-xs font-semibold text-[var(--on-surface)]">
                    {lang === 'ru' ? 'Громкость' : 'Volume'}
                  </span>
                </div>
                <span className="text-xs font-black tabular-nums text-[var(--on-surface)]">{volume}%</span>
              </div>
              <div className="relative flex items-center h-5">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--surface-high)]/70 accent-[var(--accent)]"
                  style={{
                    accentColor: primaryColor,
                  }}
                  id="quick-settings-volume-range"
                />
              </div>
            </motion.div>

            {/* Step 4: Quick Toggles (Theme & Silent Mode) */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2 mb-2.5">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={onThemeToggle}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-[color-mix(in_srgb,var(--container)_60%,transparent)] border border-white/10 dark:border-white/5 hover:border-white/20 transition-all cursor-pointer text-left active:scale-95 group shadow-2xs"
                id="quick-settings-theme-btn"
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    theme === 'dark'
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'bg-amber-500 text-white shadow-xs'
                  }`}
                >
                  {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[var(--on-surface)] leading-tight truncate">
                    {theme === 'dark'
                      ? lang === 'ru'
                        ? 'Тёмная'
                        : 'Dark'
                      : lang === 'ru'
                        ? 'Светлая'
                        : 'Light'}
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--on-surface-var)] leading-tight mt-0.5">
                    {lang === 'ru' ? 'Тема' : 'Theme'}
                  </span>
                </div>
              </button>

              {/* Silent Mode Toggle Button */}
              <button
                type="button"
                onClick={onSoundToggle}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-[color-mix(in_srgb,var(--container)_60%,transparent)] border border-white/10 dark:border-white/5 hover:border-white/20 transition-all cursor-pointer text-left active:scale-95 group shadow-2xs"
                id="quick-settings-sound-btn"
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    !isSoundEnabled
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'bg-white/10 dark:bg-black/20 text-[var(--on-surface-var)]'
                  }`}
                >
                  {!isSoundEnabled ? <BellOff size={15} /> : <Bell size={15} />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[var(--on-surface)] leading-tight truncate">
                    {!isSoundEnabled
                      ? lang === 'ru'
                        ? 'Без звука'
                        : 'Muted'
                      : lang === 'ru'
                        ? 'Со звуком'
                        : 'Sound on'}
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--on-surface-var)] leading-tight mt-0.5">
                    {lang === 'ru' ? 'Звук' : 'Sound'}
                  </span>
                </div>
              </button>
            </motion.div>

            {/* Step 5: Language Selector */}
            <motion.div variants={itemVariants} className="relative mb-2.5" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[color-mix(in_srgb,var(--container)_60%,transparent)] border border-white/10 dark:border-white/5 hover:border-white/20 transition-all cursor-pointer text-left active:scale-95 shadow-2xs"
                id="quick-settings-lang-btn"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 dark:bg-black/20 flex items-center justify-center text-[var(--accent)] border border-white/10 shadow-2xs">
                    <Languages size={15} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--on-surface)] leading-tight">
                      {langOptions.find((l) => l.id === lang)?.name || lang.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--on-surface-var)] leading-tight mt-0.5">
                      {lang === 'ru' ? 'Язык интерфейса' : 'Interface language'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-lg text-white shadow-2xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {lang.toUpperCase()}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[var(--on-surface-var)] transition-transform duration-200 ${
                      isLangMenuOpen ? 'rotate-180 text-[var(--accent)]' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Language Dropdown */}
              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl p-1.5 shadow-2xl space-y-1"
                    id="quick-settings-lang-menu"
                  >
                    {langOptions.map((opt) => {
                      const isSelected = lang === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            onLangChange(opt.id);
                            setIsLangMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'text-white shadow-sm'
                              : 'text-[var(--on-surface)] hover:bg-white/10 dark:hover:bg-white/5'
                          }`}
                          style={{
                            backgroundColor: isSelected ? primaryColor : undefined,
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${
                                isSelected
                                  ? 'bg-white/20 text-white border-white/30'
                                  : 'bg-white/10 dark:bg-black/20 text-[var(--on-surface-var)] border-white/10'
                              }`}
                            >
                              {opt.code}
                            </span>
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-bold leading-tight">{opt.name}</span>
                              <span
                                className={`text-[10px] font-medium leading-tight ${
                                  isSelected ? 'text-white/80' : 'text-[var(--on-surface-var)]'
                                }`}
                              >
                                {opt.desc}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check size={14} className="stroke-[2.5] ml-2" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Step 6: Full Settings Button */}
            <motion.div variants={itemVariants} className="pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullSettings();
                }}
                className="w-full flex items-center justify-between p-2.5 hover:bg-white/10 dark:hover:bg-white/5 rounded-2xl transition-all text-left group active:scale-[0.99] cursor-pointer"
                id="quick-settings-full-btn"
              >
                <span className="text-xs font-extrabold text-[var(--on-surface)] group-hover:text-[var(--accent)] transition-colors">
                  {t.all_settings_label || (lang === 'ru' ? 'Все настройки...' : 'All Settings...')}
                </span>
                <div className="w-6 h-6 rounded-full bg-white/10 dark:bg-black/20 flex items-center justify-center text-[var(--on-surface-var)] group-hover:text-[var(--on-surface)] group-hover:translate-x-0.5 transition-all">
                  <ChevronRight size={14} />
                </div>
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

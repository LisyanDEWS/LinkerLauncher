import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Sun, Volume2, Languages, Check, ChevronDown } from 'lucide-react';
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
  onSoundToggle
}: SettingsModalProps) {
  const t = translations[lang] || translations.ru;
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({
    top: 80,
    left: 24,
  });
  const [backdropClickable, setBackdropClickable] = useState(true);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const langOptions: { id: Language; name: string; desc: string; code: string }[] = [
    {
      id: 'ru',
      name: 'Русский',
      desc: lang === 'ru' ? 'Русский язык' : lang === 'uk' ? 'Російська мова' : 'Russian language',
      code: 'RU',
    },
    {
      id: 'en',
      name: 'English',
      desc: lang === 'ru' ? 'Английский язык' : lang === 'uk' ? 'Англійська мова' : 'English language',
      code: 'EN',
    },
    {
      id: 'uk',
      name: 'Українська',
      desc: lang === 'ru' ? 'Украинский язык' : lang === 'uk' ? 'Українська мова' : 'Ukrainian language',
      code: 'UK',
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      setIsLangMenuOpen(false);
      return;
    }
    setBackdropClickable(true);

    const updatePosition = () => {
      // Anchor the popup's right edge to the right edge of the account
      // manager button. Using `left` (not `right`) so both the measurement
      // and the positioning share the same left-origin coordinate space —
      // this stays consistent across Chrome zoom levels.
      const anchor = document.getElementById('topbar-avatar');
      const rect = anchor?.getBoundingClientRect();

      if (rect && rect.width > 0 && rect.height > 0) {
        // Place the panel so its right edge = anchor's right edge.
        // max-w-xs = 20rem = 320px; use that as the panel width.
        const pw = 320;
        let left = rect.right - pw;
        if (left < 16) left = 16;

        setPopoverPos({
          top: rect.bottom + 8,
          left,
        });
        return;
      }

      // Fallback
      setPopoverPos({ top: 80, left: window.innerWidth - 320 - 24 });
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: number) => void) => {
    setter(Number(e.target.value));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onAnimationComplete={() => { if (!isOpen) setBackdropClickable(false); }}
            onClick={onClose}
            className="absolute inset-0 bg-black/10"
            style={{ pointerEvents: backdropClickable ? 'auto' : 'none' }}
            id="settings-quick-backdrop"
          />

          {/* Quick Settings Panel */}
          <motion.div
            initial={{ scale: 0.95, y: -8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -8, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 500 }}
            onAnimationComplete={() => { if (!isOpen) setBackdropClickable(false); }}
            className="fixed z-10 w-[calc(100vw-32px)] max-w-xs rounded-3xl border border-[var(--outline-var)] bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] backdrop-blur-xl p-5 shadow-2xl select-none"
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              pointerEvents: backdropClickable ? 'auto' : 'none',
            }}
            id="settings-quick-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black tracking-widest text-[var(--on-surface-var)] uppercase">
                {t.quick_settings_title}
              </span>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
                id="quick-settings-close"
              >
                <X size={14} />
              </button>
            </div>

            {/* Sliders Area */}
            <div className="flex gap-4 mb-4 justify-around h-32">
              {/* Brightness Vertical Slider */}
              <div className="relative w-12 h-full bg-[var(--container)] rounded-2xl overflow-hidden flex flex-col justify-end group border border-[var(--outline-var)] shadow-inner">
                <div 
                  className="absolute bottom-0 w-full origin-bottom transition-all" 
                  style={{ height: `${brightness}%`, backgroundColor: primaryColor }} 
                />
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={brightness}
                  onChange={(e) => handleSliderChange(e, onBrightnessChange)}
                  className="absolute inset-0 w-32 h-12 -rotate-90 origin-center translate-y-10 -translate-x-10 opacity-0 cursor-pointer"
                />
                <div className="absolute top-3 w-full flex justify-center text-white/70 pointer-events-none">
                  <Sun size={18} />
                </div>
              </div>

                            {/* Volume Vertical Slider */}
              <div className="relative w-12 h-full bg-[var(--container)] rounded-2xl overflow-hidden flex flex-col justify-end group border border-[var(--outline-var)] shadow-inner">
                <div 
                  className="absolute bottom-0 w-full origin-bottom transition-all" 
                  style={{ height: `${volume}%`, backgroundColor: primaryColor }} 
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleSliderChange(e, onVolumeChange)}
                  className="absolute inset-0 w-32 h-12 -rotate-90 origin-center translate-y-10 -translate-x-10 opacity-0 cursor-pointer"
                />
                <div className="absolute top-3 w-full flex justify-center text-white/70 pointer-events-none">
                  <Volume2 size={18} />
                </div>
              </div>
            </div>

            {/* Silent Mode Toggle */}
            <div className="flex items-center justify-between mb-4 mt-6 px-4">
              <span className="text-sm font-bold text-[var(--on-surface)]">
                {lang === 'ru' ? 'Тихий режим' : 'Silent Mode'}
              </span>
              <button
                onClick={onSoundToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isSoundEnabled ? 'bg-[var(--container-high)]' : ''
                }`}
                style={{ backgroundColor: isSoundEnabled ? undefined : primaryColor }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[var(--surface)] transition-transform shadow-sm ${
                    isSoundEnabled ? 'translate-x-1' : 'translate-x-6'
                  }`}
                />
              </button>
            </div>

            {/* Language Selection Dropdown Ladder (without increasing popover size) */}
            <div className="relative mb-4" ref={langMenuRef} id="quick-settings-lang-ladder-container">
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[var(--container)] border border-[var(--outline-var)] hover:border-[var(--outline)] rounded-2xl transition-all cursor-pointer shadow-sm group"
                id="quick-settings-lang-trigger"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[var(--surface)] flex items-center justify-center text-[var(--accent)] border border-[var(--outline-var)] shadow-2xs">
                    <Languages size={13} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] leading-none">
                      {lang === 'ru' ? 'Язык' : lang === 'uk' ? 'Мова' : 'Language'}
                    </span>
                    <span className="text-xs font-bold text-[var(--on-surface)] mt-0.5 leading-none">
                      {langOptions.find((l) => l.id === lang)?.name || lang.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[var(--accent)] text-white shadow-2xs">
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

              {/* Floating Ladder Menu */}
              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--outline-var)] rounded-2xl p-1.5 shadow-xl space-y-1"
                    id="quick-settings-lang-ladder-menu"
                  >
                    <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] border-b border-[var(--outline-var)] pb-1 mb-0.5">
                      {lang === 'ru' ? 'Выбор языка' : lang === 'uk' ? 'Вибір мови' : 'Select language'}
                    </div>
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
                              ? 'bg-[var(--accent)] text-white shadow-sm'
                              : 'text-[var(--on-surface)] hover:bg-[var(--container)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${
                                isSelected
                                  ? 'bg-white/20 text-white border-white/30'
                                  : 'bg-[var(--container)] text-[var(--on-surface-var)] border-[var(--outline-var)]'
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
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between mb-4 px-4" id="quick-settings-theme-row">
              <span className="text-sm font-bold text-[var(--on-surface)]">
                {t.theme_toggle_label}
              </span>
              <button
                onClick={onThemeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  theme === 'dark' ? '' : 'bg-[var(--container-high)]'
                }`}
                style={{ backgroundColor: theme === 'dark' ? primaryColor : undefined }}
                id="quick-settings-theme-toggle"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[var(--surface)] transition-transform shadow-sm ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-[var(--outline-var)] my-3" />

            {/* Navigate Full Settings App */}
            <button
              onClick={() => {
                onClose();
                onOpenFullSettings();
              }}
              className="w-full flex items-center justify-between p-2.5 hover:bg-[var(--container-high)] rounded-xl transition-colors text-left"
              id="quick-settings-full-btn"
            >
              <span className="text-xs font-extrabold text-[var(--on-surface)]">
                {t.all_settings_label}
              </span>
              <ChevronRight size={16} className="text-[var(--on-surface-var)]" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

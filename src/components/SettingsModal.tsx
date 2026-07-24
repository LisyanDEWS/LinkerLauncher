import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Moon, Sun, Languages, Volume2, Monitor, User, LogOut, Shield } from 'lucide-react';
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
  onVolumeChange
}: SettingsModalProps) {
  const t = translations[lang];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: number) => void) => {
    setter(Number(e.target.value));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-6 pt-24">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
            id="settings-quick-backdrop"
          />

          {/* Quick Settings Panel */}
          <motion.div
            initial={{ scale: 0.95, y: -10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -10, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative z-10 w-full max-w-xs rounded-3xl border border-[var(--outline-var)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur-xl p-5 shadow-2xl"
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
                <div className="absolute top-3 w-full flex justify-center text-[var(--surface)] mix-blend-difference pointer-events-none">
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
                <div className="absolute top-3 w-full flex justify-center text-[var(--surface)] mix-blend-difference pointer-events-none">
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
                onClick={() => {
                  const el = document.getElementById('volume-slider') as HTMLInputElement;
                  if (el) {
                     if (volume > 0) {
                       onVolumeChange(0);
                       el.value = '0';
                     } else {
                       onVolumeChange(100);
                       el.value = '100';
                     }
                  } else {
                     onVolumeChange(volume > 0 ? 0 : 100);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  volume === 0 ? 'bg-[var(--accent)]' : 'bg-[var(--surface-dim)]'
                }`}
                style={{ backgroundColor: volume === 0 ? primaryColor : undefined }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[var(--surface)] transition-transform shadow-sm ${
                    volume === 0 ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Language Selection Segment */}
            <div className="flex bg-[var(--container)] border border-[var(--outline-var)] rounded-2xl p-1 gap-1 mb-4" id="quick-settings-lang-tabs">
              <button
                onClick={() => onLangChange('en')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  lang === 'en'
                    ? 'text-[var(--surface)] shadow-md'
                    : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                }`}
                style={{
                  backgroundColor: lang === 'en' ? primaryColor : undefined,
                }}
                id="quick-settings-lang-en"
              >
                EN
              </button>
              <button
                onClick={() => onLangChange('ru')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  lang === 'ru'
                    ? 'text-[var(--surface)] shadow-md'
                    : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                }`}
                style={{
                  backgroundColor: lang === 'ru' ? primaryColor : undefined,
                }}
                id="quick-settings-lang-ru"
              >
                RU
              </button>
            </div>

            {/* Theme Toggle Button Row */}
            <div
              onClick={onThemeToggle}
              className="flex items-center justify-between p-2.5 hover:bg-[var(--container-high)] rounded-xl cursor-pointer transition-colors"
              id="quick-settings-theme-row"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon size={18} className="text-[var(--on-surface-var)]" />
                ) : (
                  <Sun size={18} className="text-[var(--accent)]" />
                )}
                <span className="text-xs font-semibold text-[var(--on-surface)]">
                  {t.theme_toggle_label}
                </span>
              </div>
              <div
                className={`w-11 h-6 rounded-full p-0.5 border transition-colors cursor-pointer relative ${
                  theme === 'dark' ? 'border-transparent' : 'border-[var(--outline)] bg-[var(--container-high)]'
                }`}
                style={{
                  backgroundColor: theme === 'dark' ? primaryColor : undefined,
                }}
                id="quick-settings-theme-toggle"
              >
                <motion.div
                  layout
                  className="w-4 h-4 rounded-full bg-white shadow"
                  animate={{ x: theme === 'dark' ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </div>
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

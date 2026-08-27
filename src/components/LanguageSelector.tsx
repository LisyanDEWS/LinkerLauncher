import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { Language } from '../types';

export interface LanguageSelectorProps {
  key?: React.Key;
  lang: Language;
  onLangChange: (lang: Language) => void;
  variant?: 'compact' | 'full' | 'button' | 'toggle';
  align?: 'left' | 'right';
  className?: string;
  id?: string;
}

export interface LanguageOption {
  id: Language;
  name: string;
  code: string;
  descriptions: {
    ru: string;
    en: string;
    uk: string;
  };
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: 'ru',
    name: 'Русский',
    code: 'RU',
    descriptions: {
      ru: 'Русский язык',
      en: 'Russian language',
      uk: 'Російська мова',
    },
  },
  {
    id: 'en',
    name: 'English',
    code: 'EN',
    descriptions: {
      ru: 'Английский язык',
      en: 'English language',
      uk: 'Англійська мова',
    },
  },
  {
    id: 'uk',
    name: 'Українська',
    code: 'UK',
    descriptions: {
      ru: 'Украинский язык',
      en: 'Ukrainian language',
      uk: 'Українська мова',
    },
  },
];

export function LanguageSelector({
  lang,
  onLangChange,
  variant = 'button',
  align = 'right',
  className = '',
  id = 'language-selector',
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption = LANGUAGE_OPTIONS.find((opt) => opt.id === lang) || LANGUAGE_OPTIONS[0];

  const getLangTitle = () => {
    if (lang === 'ru') return 'Язык';
    if (lang === 'uk') return 'Мова';
    return 'Language';
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (variant === 'compact') {
    return (
      <div className={`relative inline-block ${className}`} ref={containerRef} id={id}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--container)] border border-[var(--outline-var)] hover:border-[var(--outline)] text-[var(--on-surface)] text-xs font-bold transition-all cursor-pointer shadow-2xs"
          title={getLangTitle()}
        >
          <Languages size={13} className="text-[var(--accent)]" />
          <span className="text-[11px] font-black tracking-wide">{currentOption.code}</span>
          <ChevronDown
            size={12}
            className={`text-[var(--on-surface-var)] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--accent)]' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 z-50 min-w-[210px] bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--outline-var)] rounded-2xl p-1.5 shadow-xl space-y-1`}
            >
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] border-b border-[var(--outline-var)] pb-1.5 mb-1">
                {getLangTitle()}
              </div>
              {LANGUAGE_OPTIONS.map((opt) => {
                const isSelected = lang === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onLangChange(opt.id);
                      setIsOpen(false);
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
                          {opt.descriptions[lang]}
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
    );
  }

  if (variant === 'toggle') {
    return (
      <div className={`relative ${className}`} ref={containerRef} id={id}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-2 p-2 px-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer bg-[var(--btn-bg)] text-[var(--on-surface)] border border-[var(--btn-border)] hover:bg-[var(--btn-hover)] shadow-sm"
        >
          <div className="flex items-center justify-center shrink-0 w-7 h-7 rounded-xl bg-[var(--container)] text-[var(--accent)] border border-[var(--outline-var)]">
            <Languages size={14} />
          </div>
          <div className="flex flex-col items-start text-left min-w-0 flex-1">
            <span className="text-[11px] font-extrabold leading-tight truncate w-full text-[var(--on-surface)]">
              {currentOption.name}
            </span>
            <span className="text-[9px] font-bold truncate w-full mt-0.5 text-[var(--on-surface-var)]">
              {currentOption.descriptions[lang]}
            </span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
            {currentOption.code}
          </span>
          <ChevronDown
            size={13}
            className={`text-[var(--on-surface-var)] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--accent)]' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="absolute left-0 bottom-full mb-2 z-50 min-w-[210px] bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--outline-var)] rounded-2xl p-1.5 shadow-2xl space-y-1"
            >
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] border-b border-[var(--outline-var)] pb-1.5 mb-1">
                {getLangTitle()}
              </div>
              {LANGUAGE_OPTIONS.map((opt) => {
                const isSelected = lang === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onLangChange(opt.id);
                      setIsOpen(false);
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
                          {opt.descriptions[lang]}
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
    );
  }

  // Default 'button' / 'full' variant
  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] hover:border-[var(--outline)] text-[var(--on-surface)] text-xs font-bold transition-all cursor-pointer shadow-sm group"
      >
        <div className="w-6 h-6 rounded-lg bg-[var(--surface)] flex items-center justify-center text-[var(--accent)] border border-[var(--outline-var)] shadow-2xs">
          <Languages size={13} />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] leading-none">
            {getLangTitle()}
          </span>
          <span className="text-xs font-bold text-[var(--on-surface)] mt-0.5 leading-none">
            {currentOption.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-1">
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[var(--accent)] text-white shadow-2xs">
            {currentOption.code}
          </span>
          <ChevronDown
            size={14}
            className={`text-[var(--on-surface-var)] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--accent)]' : ''
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 z-50 min-w-[210px] bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--outline-var)] rounded-2xl p-1.5 shadow-xl space-y-1`}
          >
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] border-b border-[var(--outline-var)] pb-1.5 mb-1">
              {getLangTitle()}
            </div>
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = lang === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onLangChange(opt.id);
                    setIsOpen(false);
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
                        {opt.descriptions[lang]}
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
  );
}


import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppWindow, Layers, Check, Sparkles, X } from 'lucide-react';
import { AppMode, Language, Material3Palette } from '../types';

interface AppModePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: AppMode) => void;
  currentMode: AppMode;
  lang: Language;
  activePalette: Material3Palette;
}

export function AppModePromptModal({
  isOpen,
  onClose,
  onSelectMode,
  currentMode,
  lang,
  activePalette,
}: AppModePromptModalProps) {
  const [selected, setSelected] = useState<AppMode>(currentMode || 'window_manager');
  const isRu = lang === 'ru';

  if (!isOpen) return null;

  const handleApply = () => {
    onSelectMode(selected);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleApply}
          className="fixed inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-3xl bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline)] shadow-2xl p-6 sm:p-7 overflow-hidden z-10 flex flex-col gap-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--surface-dim)] border border-[var(--outline-var)] text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)]">
                <Sparkles size={11} style={{ color: activePalette.primary }} />
                <span>{isRu ? 'Интерфейс системы' : 'System Interface'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--on-surface)]">
                {isRu ? 'Выберите стиль работы приложений' : 'Choose App Interaction Mode'}
              </h2>
              <p className="text-xs text-[var(--on-surface-var)] leading-relaxed max-w-md">
                {isRu 
                  ? 'Как вам удобнее запускать сервисы и утилиты в LinkerRu? Вы можете изменить этот выбор в любой момент в Настройках.'
                  : 'How would you prefer apps to launch in LinkerRu? You can easily change this anytime in Settings.'}
              </p>
            </div>

            <button
              onClick={handleApply}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface-dim)] hover:bg-[var(--surface-bright)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] border border-[var(--outline-var)] transition-all shrink-0 cursor-pointer"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Option 1: Window Manager (Web OS) */}
            <button
              type="button"
              onClick={() => setSelected('window_manager')}
              className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                selected === 'window_manager'
                  ? 'bg-[var(--surface-dim)] shadow-lg'
                  : 'bg-[var(--surface)] border-[var(--outline-var)] hover:bg-[var(--surface-dim)] opacity-85 hover:opacity-100'
              }`}
              style={{
                borderColor: selected === 'window_manager' ? activePalette.primary : undefined,
              }}
            >
              {selected === 'window_manager' && (
                <div 
                  className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow-xs"
                  style={{ backgroundColor: activePalette.primary }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              )}

              <div className="w-10 h-10 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface)] mb-3 shadow-xs">
                <AppWindow size={20} style={{ color: activePalette.primary }} />
              </div>

              <h3 className="text-sm font-black text-[var(--on-surface)] mb-1">
                {isRu ? 'Веб-ОС (Окна)' : 'Web OS (Windows)'}
              </h3>
              <p className="text-[11px] text-[var(--on-surface-var)] leading-snug">
                {isRu
                  ? 'Многооконный режим: плавающие окна, изменение размера, многозадачность и сворачивание в док.'
                  : 'Desktop multitask mode: movable windows, resizing, background tasks, and dock controls.'}
              </p>
            </button>

            {/* Option 2: Classic (About:Blank + Center Popups) */}
            <button
              type="button"
              onClick={() => setSelected('classic')}
              className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                selected === 'classic'
                  ? 'bg-[var(--surface-dim)] shadow-lg'
                  : 'bg-[var(--surface)] border-[var(--outline-var)] hover:bg-[var(--surface-dim)] opacity-85 hover:opacity-100'
              }`}
              style={{
                borderColor: selected === 'classic' ? activePalette.primary : undefined,
              }}
            >
              {selected === 'classic' && (
                <div 
                  className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow-xs"
                  style={{ backgroundColor: activePalette.primary }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              )}

              <div className="w-10 h-10 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface)] mb-3 shadow-xs">
                <Layers size={20} style={{ color: activePalette.primary }} />
              </div>

              <h3 className="text-sm font-black text-[var(--on-surface)] mb-1">
                {isRu ? 'Классический режим' : 'Classic Mode'}
              </h3>
              <p className="text-[11px] text-[var(--on-surface-var)] leading-snug">
                {isRu
                  ? 'Сервисы в защищенных вкладках about:blank, а утилиты и настройки — в поп-апах по центру с размытием.'
                  : 'Apps launch in cloaked about:blank tabs, while tools & settings open in centered blurred popups.'}
              </p>
            </button>
          </div>

          {/* Action button */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--outline-var)]/60">
            <button
              type="button"
              onClick={handleApply}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              style={{ backgroundColor: activePalette.primary }}
            >
              <span>{isRu ? 'Применить выбор' : 'Apply Mode'}</span>
              <Check size={14} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

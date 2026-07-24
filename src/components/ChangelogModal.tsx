import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export default function ChangelogModal({ isOpen, onClose, lang }: ChangelogModalProps) {
  const t = translations[lang];

  const changes = [
    {
      version: 'v1/262608 (Stable)',
      date: '2026-07-16',
      itemsRu: [
        'Перевод интерфейса на React 19 + Tailwind CSS 4.',
        'Добавлен динамический движок тем Material 3 со сочными пастельными тонами.',
        'Добавлен интерактивный календарь с поддержкой добавления и удаления событий.',
        'Добавлен умный конвертер температур Цельсий / Фаренгейт в виджете погоды.',
        'Создана полнофункциональная macOS-панель настроек с живым поиском.',
        'Реализованы приятные звуковые эффекты кликов и уведомлений.',
      ],
      itemsEn: [
        'Ported interface to modular React 19 + Tailwind CSS 4.',
        'Added dynamic Material 3 design palette with rich pastel tints.',
        'Built interactive scheduler calendar supporting custom persistent events.',
        'Created real-time smart Celsius / Fahrenheit toggle conversion in weather.',
        'Engineered full macOS-style settings panel equipped with live searching.',
        'Integrated premium audio click-feedback effects for layout actions.',
      ],
    },
    {
      version: 'v1/181512 (Beta)',
      date: '2026-03-20',
      itemsRu: [
        'Оптимизирована задержка прокси-сервера Proxy Space Hub.',
        'Реорганизована структура файлов для повышения модульности.',
      ],
      itemsEn: [
        'Optimized ping delays inside Proxy Space Hub Node Selector.',
        'Re-organized file layout structures to increase general code modularity.',
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            id="changelog-backdrop"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative z-10 w-full max-w-md max-h-[75vh] overflow-hidden rounded-3xl border border-[var(--outline-var)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur-xl p-6 shadow-2xl flex flex-col"
            id="changelog-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <History size={18} className="text-[var(--on-surface-var)]" />
                <span className="text-xs font-black tracking-widest text-[var(--on-surface-var)] uppercase">
                  {t.changelog_title}
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
                id="changelog-close"
              >
                <X size={14} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin" id="changelog-list-content">
              {changes.map((change, idx) => (
                <div key={idx} className="space-y-2 border-b border-[var(--outline-var)] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[var(--on-surface)]">
                      {change.version}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--outline)]">
                      {change.date}
                    </span>
                  </div>

                  <ul className="space-y-1.5 list-disc list-inside">
                    {(lang === 'ru' ? change.itemsRu : change.itemsEn).map((item, index) => (
                      <li key={index} className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

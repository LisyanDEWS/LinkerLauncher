import React from 'react';
import { History, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface ChangelogModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  lang: Language;
  embeddedInWindow?: boolean;
}

export default function ChangelogModal({ lang, embeddedInWindow = true }: ChangelogModalProps) {
  const t = translations[lang];

  const changes = [
    {
      version: 'v1/262608 (Stable)',
      date: '2026-07-16',
      itemsRu: [
        'Перевод интерфейса на React 19 + Tailwind CSS 4.',
        'Добавлен динамический движок тем Material 3 с пастельными тонами.',
        'Добавлен интерактивный календарь с поддержкой событий.',
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
    <div className="w-full h-full p-6 bg-[var(--surface-dim)] text-[var(--on-surface)] flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between mb-4 flex-shrink-0 border-b border-[var(--outline-var)] pb-3">
        <div className="flex items-center gap-2">
          <History size={18} className="text-[var(--accent)]" />
          <span className="text-xs font-black tracking-widest text-[var(--on-surface)] uppercase">
            {t.changelog_title}
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-1 rounded-full">
          v1/262608
        </span>
      </div>

      <div className="flex-1 space-y-5 pr-1" id="changelog-list-content">
        {changes.map((change, idx) => (
          <div key={idx} className="space-y-2 border-b border-[var(--outline-var)] pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[var(--on-surface)] flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--accent)]" />
                {change.version}
              </span>
              <span className="text-[10px] font-bold text-[var(--on-surface-var)]">
                {change.date}
              </span>
            </div>

            <ul className="space-y-2 list-disc list-inside">
              {(lang === 'ru' ? change.itemsRu : change.itemsEn).map((item, index) => (
                <li key={index} className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

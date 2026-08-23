import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, X, AlertCircle, EyeOff, Check, Search, Globe } from 'lucide-react';

interface WeatherLocationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ru' | 'en';
  onSetCustomCity: (city: string) => void;
  onDisableWidget: () => void;
  onEnableGeolocation?: () => void;
  currentCity?: string;
  locationMode?: 'auto' | 'custom';
}

const POPULAR_CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Алматы',
  'Астана',
  'Минск',
  'Бишкек',
  'Ташкент',
  'Берлин',
  'Лондон',
  'Нью-Йорк',
  'Токио',
];

export const WeatherLocationErrorModal: React.FC<WeatherLocationErrorModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSetCustomCity,
  onDisableWidget,
  onEnableGeolocation,
  currentCity = '',
  locationMode = 'auto',
}) => {
  const [activeView, setActiveView] = useState<'options' | 'manual'>('options');
  const [cityInput, setCityInput] = useState(currentCity);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSaveCity = (cityToSave: string) => {
    if (!cityToSave.trim()) return;
    setIsSearching(true);
    onSetCustomCity(cityToSave.trim());
    setIsSearching(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-6 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--on-surface)] leading-tight">
                  {lang === 'ru' ? 'Настройка локации погоды' : 'Weather Location Setup'}
                </h3>
                <p className="text-xs text-[var(--on-surface-var)] font-medium">
                  {lang === 'ru' ? 'Нет доступа к геопозиции' : 'Geolocation unavailable'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {activeView === 'options' ? (
            <div className="space-y-3">
              <p className="text-xs text-[var(--on-surface-var)] leading-relaxed mb-4">
                {lang === 'ru'
                  ? 'Приложение не может автоматически определить вашу геопозицию. Выберите действие:'
                  : 'Unable to detect your current location automatically. Select an option:'}
              </p>

              {/* Option 1: Allow / Request Geolocation */}
              <button
                onClick={() => {
                  if (onEnableGeolocation) {
                    onEnableGeolocation();
                  }
                  onClose();
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] hover:border-[var(--accent)] hover:bg-[var(--surface-bright)] transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[var(--on-surface)] group-hover:text-[var(--accent)] transition-colors">
                      {lang === 'ru' ? 'Разрешить геолокацию' : 'Allow Geolocation'}
                    </div>
                    <div className="text-[11px] text-[var(--on-surface-var)]">
                      {lang === 'ru'
                        ? 'Попробовать снова определить авто-позицию браузера'
                        : 'Try auto-detecting location via browser again'}
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 2: Add location manually */}
              <button
                onClick={() => setActiveView('manual')}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] hover:border-[var(--accent)] hover:bg-[var(--surface-bright)] transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[var(--on-surface)] group-hover:text-[var(--accent)] transition-colors">
                      {lang === 'ru' ? 'Добавить локацию вручную' : 'Add location manually'}
                    </div>
                    <div className="text-[11px] text-[var(--on-surface-var)]">
                      {currentCity
                        ? `${lang === 'ru' ? 'Текущий город:' : 'Current city:'} ${currentCity}`
                        : (lang === 'ru' ? 'Ввести название города или выбрать из списка' : 'Type a city name or pick from list')}
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 3: Disable widget */}
              <button
                onClick={() => {
                  onDisableWidget();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] hover:border-[var(--outline)] hover:bg-[var(--surface-bright)] transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container-high)] text-[var(--on-surface-var)]">
                    <EyeOff size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[var(--on-surface)]">
                      {lang === 'ru' ? 'Отключить виджет полностью' : 'Disable widget completely'}
                    </div>
                    <div className="text-[11px] text-[var(--on-surface-var)]">
                      {lang === 'ru'
                        ? 'Виджет скроется. Включить его можно в Настройках'
                        : 'Hides the widget. You can re-enable it in Settings'}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-surface-var)]" />
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder={lang === 'ru' ? 'Введите город (например, Москва)...' : 'Enter city (e.g. London)...'}
                  className="w-full text-xs font-semibold py-3 pl-10 pr-4 bg-[var(--surface-dim)] text-[var(--on-surface)] border border-[var(--outline)] rounded-2xl outline-none focus:border-[var(--accent)]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCity(cityInput);
                  }}
                />
              </div>

              {/* Popular cities tags */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)] block mb-2">
                  {lang === 'ru' ? 'Популярные города' : 'Popular Cities'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CITIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSaveCity(c)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--surface-dim)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-bright)] hover:border-[var(--accent)] transition-all cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setActiveView('options')}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] transition-colors"
                >
                  {lang === 'ru' ? 'Назад' : 'Back'}
                </button>
                <button
                  onClick={() => handleSaveCity(cityInput)}
                  disabled={!cityInput.trim() || isSearching}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {lang === 'ru' ? 'Сохранить' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

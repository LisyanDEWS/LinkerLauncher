import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  ShieldAlert, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Type,
  SkipForward
} from 'lucide-react';
import { NOTIFICATION_SOUNDS } from '../data/sounds';
import { Language, ThemeMode } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLangChange: (l: Language) => void;
  theme?: ThemeMode;
  onThemeChange?: (t: ThemeMode) => void;
  activePaletteId?: string;
  onPaletteChange?: (id: string) => void;
  mainWallpaper?: string;
  onWallpaperChange?: (wp: string) => void;
  clockType?: 'digital' | 'analog';
  onClockTypeChange?: (type: 'digital' | 'analog') => void;
  clockVariation?: 1 | 2 | 3;
  onClockVariationChange?: (v: 1 | 2 | 3) => void;
  panicKey: string;
  onPanicKeyChange: (key: string) => void;
  panicUrl: string;
  onPanicUrlChange: (url: string) => void;
  // Font, Time Format & Temp Unit settings
  fontFamily: string;
  onFontFamilyChange: (font: string) => void;
  timeFormat?: '12h' | '24h';
  onTimeFormatChange?: (tf: '12h' | '24h') => void;
  tempUnit?: 'C' | 'F';
  onTempUnitChange?: (tu: 'C' | 'F') => void;
}

export default function OnboardingModal({
  isOpen,
  onClose,
  lang,
  onLangChange,
  theme = 'dark',
  panicKey,
  onPanicKeyChange,
  panicUrl,
  onPanicUrlChange,
  fontFamily,
  onFontFamilyChange,
}: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Local state for Panic Button
  const [isPanicEnabled, setIsPanicEnabled] = useState(panicKey !== '');
  const [localPanicKey, setLocalPanicKey] = useState(panicKey || 'Ctrl+0');
  const [localPanicUrl, setLocalPanicUrl] = useState(panicUrl || 'https://google.com');
  const [panicSound] = useState<string>(() => localStorage.getItem('linkerru_panic_sound') || 'opal_bell');

  const linkerLogo = 'https://github.com/user-attachments/assets/0964c230-e7dc-4cab-9983-1c2abe689206';

  const fonts = [
    { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', preview: 'Modern & Clean' },
    { id: 'Inter', name: 'Inter', preview: 'Crisp & Technical' },
    { id: 'Outfit', name: 'Outfit', preview: 'Expressive & Rounded' },
    { id: 'Playfair Display', name: 'Playfair Display', preview: 'Serif & Elegant' },
    { id: 'system-ui', name: 'System Sans', preview: 'Native OS Default' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const key = e.key;
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return;

    const modifiers = [];
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.metaKey) modifiers.push('Meta');

    const combo = [...modifiers, key === ' ' ? 'Space' : key.length === 1 ? key.toUpperCase() : key].join('+');
    setLocalPanicKey(combo);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      if (isPanicEnabled) {
        onPanicKeyChange(localPanicKey);
        onPanicUrlChange(localPanicUrl);
        localStorage.setItem('linkerru_panic_key', localPanicKey);
        localStorage.setItem('linkerru_panic_url', localPanicUrl);
        localStorage.setItem('linkerru_panic_sound', panicSound);
      } else {
        onPanicKeyChange('');
        localStorage.setItem('linkerru_panic_key', '');
      }
      localStorage.setItem('linkerru_onboarded', 'true');
      onClose();
    }
  };

  const handleSkipStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleNext();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (!isOpen) return null;

  const isRu = lang === 'ru';
  const isUk = lang === 'uk';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.94, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative z-10 w-full max-w-2xl bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-[2.5rem] p-6 sm:p-8 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
        >
          {/* Top Bar with Logo & Progress Indicators */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--outline-var)] shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center p-2 drop-shadow-sm border transition-all ${
                  theme === 'light'
                    ? 'bg-[var(--accent)] border-[var(--accent)]'
                    : 'bg-black border-[var(--outline-var)]'
                }`}
              >
                <img 
                  src={linkerLogo} 
                  alt="LinkerRu Logo" 
                  className="w-full h-full object-contain brightness-0 invert" 
                />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-[var(--on-surface)]">LinkerRu :Re</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
                  {isRu ? 'Первичная настройка' : isUk ? 'Початкове налаштування' : 'Initial Setup'}
                </p>
              </div>
            </div>

            {/* Step Counter Pills */}
            <div className="flex items-center gap-1.5 bg-[var(--surface-dim)] px-3 py-1.5 rounded-full border border-[var(--outline-var)]">
              {Array.from({ length: totalSteps }).map((_, i) => {
                const stepNum = i + 1;
                const isActive = stepNum === step;
                const isPassed = stepNum < step;
                return (
                  <div
                    key={i}
                    onClick={() => setStep(stepNum)}
                    className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'w-7 bg-[var(--accent)]'
                        : isPassed
                          ? 'w-2.5 bg-[var(--accent)]/50'
                          : 'w-2.5 bg-[var(--outline-var)]'
                    }`}
                    title={`${isRu ? 'Шаг' : isUk ? 'Крок' : 'Step'} ${stepNum}`}
                  />
                );
              })}
              <span className="text-[10px] font-black text-[var(--on-surface-var)] ml-1 tabular-nums">
                {step}/{totalSteps}
              </span>
            </div>
          </div>

          {/* STEP CONTENT BODY */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-6 min-h-[320px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {/* STEP 1: Language */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center max-w-md mx-auto space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <Languages size={28} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--on-surface)]">
                      {isRu ? 'Выберите язык интерфейса' : isUk ? 'Оберіть мову інтерфейсу' : 'Select interface language'}
                    </h3>
                    <p className="text-xs text-[var(--on-surface-var)] font-semibold">
                      {isRu 
                        ? 'Вы сможете переключить язык в любой момент в настройках.' 
                        : isUk 
                          ? 'Ви зможете змінити мову в будь-який момент у налаштуваннях.' 
                          : 'You can switch the language anytime in settings.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => onLangChange('ru')}
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                        lang === 'ru'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md scale-[1.02]'
                          : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--outline)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🇷🇺</span>
                        <div>
                          <div className="text-sm font-black text-[var(--on-surface)]">Русский</div>
                          <div className="text-[10px] font-extrabold text-[var(--on-surface-var)]">Russian</div>
                        </div>
                      </div>
                      {lang === 'ru' && <Check size={18} className="text-[var(--accent)] shrink-0" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => onLangChange('en')}
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                        lang === 'en'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md scale-[1.02]'
                          : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--outline)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🇬🇧</span>
                        <div>
                          <div className="text-sm font-black text-[var(--on-surface)]">English</div>
                          <div className="text-[10px] font-extrabold text-[var(--on-surface-var)]">English</div>
                        </div>
                      </div>
                      {lang === 'en' && <Check size={18} className="text-[var(--accent)] shrink-0" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => onLangChange('uk')}
                      className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                        lang === 'uk'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md scale-[1.02]'
                          : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--outline)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🇺🇦</span>
                        <div>
                          <div className="text-sm font-black text-[var(--on-surface)]">Українська</div>
                          <div className="text-[10px] font-extrabold text-[var(--on-surface-var)]">Ukrainian</div>
                        </div>
                      </div>
                      {lang === 'uk' && <Check size={18} className="text-[var(--accent)] shrink-0" />}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Fonts Selection */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="text-center max-w-md mx-auto space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <Type size={28} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--on-surface)]">
                      {isRu ? 'Системный шрифт' : isUk ? 'Системний шрифт' : 'System Typography'}
                    </h3>
                    <p className="text-xs text-[var(--on-surface-var)] font-semibold">
                      {isRu 
                        ? 'Выберите основной гарнитурный шрифт для рабочего стола и приложений.' 
                        : isUk 
                          ? 'Оберіть основний шрифт для робочого столу та додатків.' 
                          : 'Select the primary typeface family for desktop UI and apps.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                    {fonts.map((f) => {
                      const isSelected = fontFamily === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => onFontFamilyChange(f.id)}
                          className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md'
                              : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--outline)]'
                          }`}
                          style={{ fontFamily: f.id }}
                        >
                          <div>
                            <div className="text-sm font-bold text-[var(--on-surface)]">{f.name}</div>
                            <div className="text-[10px] font-medium text-[var(--on-surface-var)]">{f.preview}</div>
                          </div>
                          {isSelected && <Check size={16} className="text-[var(--accent)] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Panic Button */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="text-center max-w-md mx-auto space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <ShieldAlert size={28} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--on-surface)]">
                      {isRu ? 'Тревожная кнопка (Panic Button)' : isUk ? 'Тривожна кнопка (Panic Button)' : 'Panic Button Safety'}
                    </h3>
                    <p className="text-xs text-[var(--on-surface-var)] font-semibold">
                      {isRu 
                        ? 'Мгновенно скрывает экран и перенаправляет вкладку при нажатии сочетания клавиш.' 
                        : isUk 
                          ? 'Миттєво приховує екран та перенаправляє вкладку за гарячою клавішею.' 
                          : 'Instantly hides screen content and redirects tab upon emergency key combination.'}
                    </p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    {/* Toggle Panic */}
                    <div className="flex items-center justify-between p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl">
                      <span className="text-xs font-black text-[var(--on-surface)]">
                        {isRu ? 'Активировать функцию Panic Button' : isUk ? 'Активувати функцію Panic Button' : 'Enable Panic Button Protection'}
                      </span>
                      <button
                        onClick={() => setIsPanicEnabled(!isPanicEnabled)}
                        className={`w-12 h-7 rounded-full transition-all relative ${
                          isPanicEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--outline-var)]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-all absolute top-1 ${
                            isPanicEnabled ? 'left-6' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    {isPanicEnabled && (
                      <div className="space-y-3 p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] block mb-1">
                            {isRu ? 'Сочетание клавиш' : isUk ? 'Комбінація клавіш' : 'Hotkey Combination'}
                          </label>
                          <input
                            type="text"
                            value={localPanicKey}
                            onKeyDown={handleKeyDown}
                            onChange={() => {}}
                            className="w-full text-xs font-bold py-2.5 px-3 bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-xl outline-none text-center focus:border-[var(--accent)]"
                            placeholder="e.g. Ctrl+0"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] block mb-1">
                            {isRu ? 'Безопасный адрес для перехода' : isUk ? 'Безпечна адреса переходу' : 'Redirect Destination URL'}
                          </label>
                          <input
                            type="text"
                            value={localPanicUrl}
                            onChange={(e) => setLocalPanicUrl(e.target.value)}
                            className="w-full text-xs font-bold py-2.5 px-3 bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-xl outline-none focus:border-[var(--accent)]"
                            placeholder="https://google.com"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* BOTTOM CONTROLS & NAVIGATION */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--outline-var)] mt-4 shrink-0 gap-3">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-4 py-3 rounded-2xl text-xs font-black text-[var(--on-surface-var)] hover:text-[var(--on-surface)] disabled:opacity-30 disabled:hover:text-[var(--on-surface-var)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>{isRu ? 'Назад' : isUk ? 'Назад' : 'Back'}</span>
            </button>

            <div className="flex items-center gap-2">
              {step < totalSteps && (
                <button
                  onClick={handleSkipStep}
                  className="px-4 py-3 rounded-2xl text-xs font-bold text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <SkipForward size={14} />
                  <span>{isRu ? 'Пропустить' : isUk ? 'Пропустити' : 'Skip'}</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-6 py-3.5 rounded-2xl text-xs font-black bg-[var(--accent)] text-white hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>
                  {step === totalSteps 
                    ? (isRu ? 'Завершить настройку' : isUk ? 'Завершити налаштування' : 'Finish Setup') 
                    : (isRu ? 'Продолжить' : isUk ? 'Продовжити' : 'Continue')}
                </span>
                {step === totalSteps ? <Check size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

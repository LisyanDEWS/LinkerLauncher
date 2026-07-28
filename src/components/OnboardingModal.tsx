import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  Sun, 
  Moon, 
  Clock, 
  ShieldAlert, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Type,
  Thermometer,
  SkipForward
} from 'lucide-react';
import { materialPalettes } from '../data/themes';
import { NOTIFICATION_SOUNDS } from '../data/sounds';
import { Language, ThemeMode } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLangChange: (l: Language) => void;
  theme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
  activePaletteId: string;
  onPaletteChange: (id: string) => void;
  mainWallpaper: string;
  onWallpaperChange: (wp: string) => void;
  clockType: 'digital' | 'analog';
  onClockTypeChange: (type: 'digital' | 'analog') => void;
  clockVariation: 1 | 2 | 3;
  onClockVariationChange: (v: 1 | 2 | 3) => void;
  panicKey: string;
  onPanicKeyChange: (key: string) => void;
  panicUrl: string;
  onPanicUrlChange: (url: string) => void;
  // Font, Time Format & Temp Unit settings
  fontFamily: string;
  onFontFamilyChange: (font: string) => void;
  timeFormat: '12h' | '24h';
  onTimeFormatChange: (tf: '12h' | '24h') => void;
  tempUnit: 'C' | 'F';
  onTempUnitChange: (tu: 'C' | 'F') => void;
}

export default function OnboardingModal({
  isOpen,
  onClose,
  lang,
  onLangChange,
  theme,
  onThemeChange,
  activePaletteId,
  onPaletteChange,
  mainWallpaper,
  onWallpaperChange,
  clockType,
  onClockTypeChange,
  clockVariation,
  onClockVariationChange,
  panicKey,
  onPanicKeyChange,
  panicUrl,
  onPanicUrlChange,
  fontFamily,
  onFontFamilyChange,
  timeFormat,
  onTimeFormatChange,
  tempUnit,
  onTempUnitChange,
}: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Local state for Panic Button
  const [isPanicEnabled, setIsPanicEnabled] = useState(panicKey !== '');
  const [localPanicKey, setLocalPanicKey] = useState(panicKey || 'Ctrl+0');
  const [localPanicUrl, setLocalPanicUrl] = useState(panicUrl || 'https://google.com');
  const [panicSound, setPanicSound] = useState<string>(() => localStorage.getItem('linkerru_panic_sound') || 'opal_bell');

  const selectedPalette = useMemo(() => {
    return materialPalettes.find(p => p.id === activePaletteId) || materialPalettes[0];
  }, [activePaletteId]);

  const linkerLogo = theme === 'dark' 
    ? 'https://github.com/user-attachments/assets/9fad2245-28d1-4b70-a3ee-74e3d8a757e6' 
    : 'https://github.com/user-attachments/assets/4d4a877a-6135-4dc5-82fc-d3705c8fc142';

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

  const playPanicSoundPreview = () => {
    const found = NOTIFICATION_SOUNDS.find(s => s.id === panicSound);
    if (found) {
      const audio = new Audio(found.url);
      audio.volume = 0.8;
      audio.play().catch(console.error);
    }
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
              <img 
                src={linkerLogo} 
                alt="LinkerRu Logo" 
                className={`w-10 h-10 object-contain drop-shadow-sm rounded-xl p-1 border border-[var(--outline-var)] ${theme === 'dark' ? 'bg-black' : 'bg-white'}`} 
              />
              <div>
                <h2 className="text-base font-black tracking-tight text-[var(--on-surface)]">LinkerRu :Re</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">
                  {isRu ? 'Первичная настройка M3' : 'Material 3 Initial Setup'}
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
                    title={`${isRu ? 'Шаг' : 'Step'} ${stepNum}`}
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
                      {isRu ? 'Выберите язык интерфейса' : 'Select interface language'}
                    </h3>
                    <p className="text-xs text-[var(--on-surface-var)] font-semibold">
                      {isRu ? 'Вы сможете переключить язык в любой момент в настройках.' : 'You can switch the language anytime in settings.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                    <button
                      onClick={() => onLangChange('ru')}
                      className={`p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                        lang === 'ru'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md scale-[1.02]'
                          : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--outline)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center font-black text-xs text-[var(--on-surface)]">
                          RU
                        </div>
                        <div>
                          <div className="text-sm font-black text-[var(--on-surface)]">Русский</div>
                          <div className="text-[10px] font-extrabold text-[var(--on-surface-var)]">Russian</div>
                        </div>
                      </div>
                      {lang === 'ru' && <Check size={18} className="text-[var(--accent)]" />}
                    </button>

                    <button
                      onClick={() => onLangChange('en')}
                      className={`p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                        lang === 'en'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md scale-[1.02]'
                          : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--outline)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center font-black text-xs text-[var(--on-surface)]">
                          EN
                        </div>
                        <div>
                          <div className="text-sm font-black text-[var(--on-surface)]">English</div>
                          <div className="text-[10px] font-extrabold text-[var(--on-surface-var)]">Английский</div>
                        </div>
                      </div>
                      {lang === 'en' && <Check size={18} className="text-[var(--accent)]" />}
                    </button>
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
                      {isRu ? 'Системный шрифт' : 'System Typography'}
                    </h3>
                    <p className="text-xs text-[var(--on-surface-var)] font-semibold">
                      {isRu ? 'Выберите основной гарнитурный шрифт для рабочего стола и приложений.' : 'Select the primary typeface family for desktop UI and apps.'}
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

              {/* STEP 3: Time Format & Temp Unit */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center max-w-md mx-auto space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <Clock size={28} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--on-surface)]">
                      {isRu ? 'Формат времени и Единицы' : 'Time & Unit Preferences'}
                    </h3>
                    <p className="text-xs text-[var(--on-surface-var)] font-semibold">
                      {isRu ? 'Настройте отображение времени и температуры в системе.' : 'Configure default time presentation and temperature measurement.'}
                    </p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    {/* Time Format */}
                    <div className="p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-[var(--on-surface-var)] tracking-wider">
                        <Clock size={14} />
                        <span>{isRu ? 'Формат времени' : 'Time Format'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onTimeFormatChange('24h')}
                          className={`py-3 rounded-xl text-xs font-black transition-all border ${
                            timeFormat === '24h'
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                              : 'bg-[var(--surface)] text-[var(--on-surface)] border-[var(--outline-var)] hover:bg-[var(--container)]'
                          }`}
                        >
                          24-Hour (14:30)
                        </button>
                        <button
                          onClick={() => onTimeFormatChange('12h')}
                          className={`py-3 rounded-xl text-xs font-black transition-all border ${
                            timeFormat === '12h'
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                              : 'bg-[var(--surface)] text-[var(--on-surface)] border-[var(--outline-var)] hover:bg-[var(--container)]'
                          }`}
                        >
                          12-Hour AM/PM (2:30 PM)
                        </button>
                      </div>
                    </div>

                    {/* Temp Unit */}
                    <div className="p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-[var(--on-surface-var)] tracking-wider">
                        <Thermometer size={14} />
                        <span>{isRu ? 'Единица температуры' : 'Temperature Unit'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onTempUnitChange('C')}
                          className={`py-3 rounded-xl text-xs font-black transition-all border ${
                            tempUnit === 'C'
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                              : 'bg-[var(--surface)] text-[var(--on-surface)] border-[var(--outline-var)] hover:bg-[var(--container)]'
                          }`}
                        >
                          Celsius (°C)
                        </button>
                        <button
                          onClick={() => onTempUnitChange('F')}
                          className={`py-3 rounded-xl text-xs font-black transition-all border ${
                            tempUnit === 'F'
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                              : 'bg-[var(--surface)] text-[var(--on-surface)] border-[var(--outline-var)] hover:bg-[var(--container)]'
                          }`}
                        >
                          Fahrenheit (°F)
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Theme Mode & Palette */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="text-center max-w-md mx-auto space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <Sun size={28} />
                    </div>
                    <h3 className="text-xl font-black text-[var(--on-surface)]">
                      {isRu ? 'Тема и Цветовая палитра' : 'Theme & Accent Palette'}
                    </h3>
                    <p className="text-xs text-[var(--on-surface-var)] font-semibold">
                      {isRu ? 'Выберите режим оформления и Material 3 палитру акцентов.' : 'Choose visual mode and dynamic Material 3 accent color palette.'}
                    </p>
                  </div>

                  {/* Mode switcher */}
                  <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
                    <button
                      onClick={() => onThemeChange('light')}
                      className={`flex-1 py-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--on-surface)] shadow-md'
                          : 'border-[var(--outline-var)] bg-[var(--surface-dim)] text-[var(--on-surface-var)]'
                      }`}
                    >
                      <Sun size={16} />
                      <span>{isRu ? 'Светлая' : 'Light'}</span>
                    </button>

                    <button
                      onClick={() => onThemeChange('dark')}
                      className={`flex-1 py-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--on-surface)] shadow-md'
                          : 'border-[var(--outline-var)] bg-[var(--surface-dim)] text-[var(--on-surface-var)]'
                      }`}
                    >
                      <Moon size={16} />
                      <span>{isRu ? 'Тёмная' : 'Dark'}</span>
                    </button>
                  </div>

                  {/* Palette selector */}
                  <div className="space-y-2 max-w-md mx-auto pt-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] block text-center">
                      {isRu ? 'Материальные акценты' : 'Material Accent Tokens'}
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {materialPalettes.map((p) => {
                        const isSelected = p.id === activePaletteId;
                        return (
                          <button
                            key={p.id}
                            onClick={() => onPaletteChange(p.id)}
                            className={`h-11 rounded-2xl border-2 transition-all hover:scale-110 cursor-pointer flex items-center justify-center ${
                              isSelected ? 'border-[var(--on-surface)] shadow-lg scale-105' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: p.primary }}
                            title={isRu ? p.nameRu : p.nameEn}
                          >
                            {isSelected && <Check size={14} className="text-white drop-shadow-md" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: Panic Button */}
              {step === 5 && (
                <motion.div
                  key="step5"
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
                      {isRu ? 'Тревожная кнопка (Panic Button)' : 'Panic Button Safety'}
                    </h3>
                    <p className="text-xs text-[var(--on-surface-var)] font-semibold">
                      {isRu ? 'Мгновенно скрывает экран и перенаправляет вкладку при нажатии сочетания клавиш.' : 'Instantly hides screen content and redirects tab upon emergency key combination.'}
                    </p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    {/* Toggle Panic */}
                    <div className="flex items-center justify-between p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl">
                      <span className="text-xs font-black text-[var(--on-surface)]">
                        {isRu ? 'Активировать функцию Panic Button' : 'Enable Panic Button Protection'}
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
                            {isRu ? 'Сочетание клавиш' : 'Hotkey Combination'}
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
                            {isRu ? 'Безопасный адрес для перехода' : 'Redirect Destination URL'}
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
              <span>{isRu ? 'Назад' : 'Back'}</span>
            </button>

            <div className="flex items-center gap-2">
              {step < totalSteps && (
                <button
                  onClick={handleSkipStep}
                  className="px-4 py-3 rounded-2xl text-xs font-bold text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <SkipForward size={14} />
                  <span>{isRu ? 'Пропустить' : 'Skip'}</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-6 py-3.5 rounded-2xl text-xs font-black bg-[var(--accent)] text-white hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>{step === totalSteps ? (isRu ? 'Завершить настройку' : 'Finish Setup') : (isRu ? 'Продолжить' : 'Continue')}</span>
                {step === totalSteps ? <Check size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

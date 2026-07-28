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
  Sparkles,
  Volume2,
  Play,
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
}: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Local state for Panic Button to avoid immediate global binding until next/finish
  const [isPanicEnabled, setIsPanicEnabled] = useState(panicKey !== '');
  const [localPanicKey, setLocalPanicKey] = useState(panicKey || 'Ctrl+0');
  const [localPanicUrl, setLocalPanicUrl] = useState(panicUrl || 'https://google.com');
  const [panicSound, setPanicSound] = useState<string>(() => localStorage.getItem('linkerru_panic_sound') || 'opal_bell');

  const selectedPalette = useMemo(() => {
    return materialPalettes.find(p => p.id === activePaletteId) || materialPalettes[0];
  }, [activePaletteId]);

  // Key combination capture (e.g. Ctrl+0, Shift+Escape, Alt+1)
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

  // Previews for wallpapers based on selected palette
  const wallpapers = useMemo(() => {
    const p1 = selectedPalette.primary;
    const p2 = selectedPalette.secondary;
    const p3 = selectedPalette.tertiary;
    return [
      { id: 'none', nameRu: 'Сплошной цвет', nameEn: 'Solid Neutral', style: 'var(--bg)' },
      { id: 'gradient-1', nameRu: 'Градиент 1', nameEn: 'Smooth Diagonal', style: `linear-gradient(135deg, ${p1}, ${p2}, ${p3})` },
      { id: 'gradient-2', nameRu: 'Градиент 2', nameEn: 'Double Radial', style: `radial-gradient(circle at 10% 20%, ${p2} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3} 0%, transparent 50%), linear-gradient(135deg, ${p1}, var(--bg))` },
      { id: 'gradient-3', nameRu: 'Градиент 3', nameEn: 'Soft Fade', style: `linear-gradient(to bottom right, ${p1} 0%, transparent 100%), linear-gradient(to top right, ${p3} 0%, transparent 100%), var(--bg)` },
      { id: 'gradient-4', nameRu: 'Градиент 4', nameEn: 'Conic Ambient', style: `conic-gradient(from 180deg at 50% 50%, ${p1} 0deg, ${p2} 120deg, ${p3} 240deg, ${p1} 360deg)` },
    ];
  }, [selectedPalette]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Save Panic button states upon finishing
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

  const t = {
    ru: {
      welcome: 'Первичная настройка LinkerRu',
      subtitle: 'Быстрая адаптация интерфейса Material 3 Expressive.',
      next: 'Продолжить',
      back: 'Назад',
      skipStep: 'Пропустить шаг',
      finish: 'Завершить настройку',
      step: 'Шаг',
      of: 'из',
      
      // Step 1: Lang
      step1Title: 'Выберите язык интерфейса',
      step1Desc: 'Вы можете изменить язык в любое время в настройках.',
      langRu: 'Русский (RU)',
      langEn: 'English (EN)',

      // Step 2: Theme & Palette
      step2Title: 'Оформление и палитра',
      step2Desc: 'Выберите тему оформления и динамическую акцентную палитру.',
      themeMode: 'Режим интерфейса',
      themeLight: 'Светлая тема',
      themeDark: 'Тёмная тема',
      colorPalette: 'Цветовая палитра',

      // Step 3: Wallpapers
      step3Title: 'Фоновые обои',
      step3Desc: 'Выберите фоновое оформление для рабочего стола.',
      preview: 'Предпросмотр',

      // Step 4: Standby clock
      step4Title: 'Режим ожидания (Standby)',
      step4Desc: 'Выберите интерактивный вариант отображения часов.',
      clockStyle: 'Стиль часов',
      digital: 'Цифровые',
      analog: 'Аналоговые',
      clockVar: 'Вариант отображения (Визуальный предпросмотр)',
      var1: 'Классический контейнер',
      var2: 'Минималистичные тонкие цифры',
      var3: 'Акцентный крупный формат',

      // Step 5: Panic button
      step5Title: 'Тревожная кнопка (Panic Button)',
      step5Desc: 'Позволяет мгновенно скрыть содержимое экрана и перенаправить вкладку при нажатии комбинации клавиш.',
      enablePanic: 'Активировать тревожную кнопку',
      panicKeyLabel: 'Комбинация клавиш (например, Ctrl+0 или Alt+P)',
      panicKeyPlaceholder: 'Нажмите клавиши (напр. Ctrl+0)...',
      panicUrlLabel: 'Безопасный URL для перенаправления',
      panicUrlPlaceholder: 'https://google.com',
      panicSoundLabel: 'Звуковое оповещение / Сигнал',
      testSound: 'Прослушать',
    },
    en: {
      welcome: 'Initial Setup LinkerRu',
      subtitle: 'Tailor your Material 3 Expressive experience.',
      next: 'Continue',
      back: 'Back',
      skipStep: 'Skip step',
      finish: 'Finish Setup',
      step: 'Step',
      of: 'of',

      // Step 1: Lang
      step1Title: 'Select interface language',
      step1Desc: 'You can change the language anytime in settings.',
      langRu: 'Russian (RU)',
      langEn: 'English (EN)',

      // Step 2: Theme & Palette
      step2Title: 'Theme & Accent Palette',
      step2Desc: 'Choose interface mode and dynamic accent palette.',
      themeMode: 'Interface Mode',
      themeLight: 'Light Theme',
      themeDark: 'Dark Theme',
      colorPalette: 'Color Palette',

      // Step 3: Wallpapers
      step3Title: 'Desktop Wallpaper',
      step3Desc: 'Select background styling for your screen.',
      preview: 'Preview',

      // Step 4: Standby clock
      step4Title: 'Standby Clock Setup',
      step4Desc: 'Select an interactive preview style for your standby clock.',
      clockStyle: 'Clock Style',
      digital: 'Digital',
      analog: 'Analog',
      clockVar: 'Visual Variant Options',
      var1: 'Classic Info Card',
      var2: 'Minimalist Thin Typography',
      var3: 'Accent Ultra Large Digits',

      // Step 5: Panic button
      step5Title: 'Panic Button Emergency Exit',
      step5Desc: 'Instantly redirects the tab to a safe website when your panic hotkey combo is pressed.',
      enablePanic: 'Enable Panic Button functionality',
      panicKeyLabel: 'Hotkey Combination (e.g., Ctrl+0 or Alt+P)',
      panicKeyPlaceholder: 'Press key combination (e.g. Ctrl+0)...',
      panicUrlLabel: 'Safe Redirect Destination URL',
      panicUrlPlaceholder: 'https://google.com',
      panicSoundLabel: 'Chime Sound Effect',
      testSound: 'Test Sound',
    }
  }[lang];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-[var(--surface)] border border-[var(--outline)] rounded-[2.5rem] w-full max-w-2xl overflow-hidden flex flex-col relative my-8 shadow-2xl"
      >
        {/* Expressive Header with Logo */}
        <div 
          className="relative px-8 pt-8 pb-6 overflow-hidden transition-all duration-500" 
          style={{ background: `linear-gradient(135deg, ${selectedPalette.primary} 0%, ${selectedPalette.tertiary} 100%)` }}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-xl" />
          <div className="pointer-events-none absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-white/5 blur-2xl" />
          
          <div className="relative z-10 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <img 
                src="https://github.com/user-attachments/assets/939c90aa-0efa-4e50-b886-007111d41fa3" 
                alt="LinkerRu Logo" 
                className="w-12 h-12 object-contain drop-shadow-md rounded-2xl bg-black/20 p-1.5 border border-white/20 shrink-0" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20">
                    {t.step} {step} {t.of} {totalSteps}
                  </span>
                </div>
                <h2 className="text-xl font-black mt-1 flex items-center gap-2 tracking-tight">
                  <span>{t.welcome}</span>
                </h2>
                <p className="text-xs font-medium opacity-90 mt-0.5">{t.subtitle}</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/20 shadow-sm">
              <Sparkles size={14} />
              <span>LinkerRu :Re</span>
            </div>
          </div>

          {/* M3 Progress Bar */}
          <div className="relative z-10 mt-6 h-2 w-full bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/20">
            <motion.div
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="h-full bg-white rounded-full shadow-sm"
            />
          </div>
        </div>

        {/* Scrollable Step Content */}
        <div className="p-8 flex-1 min-h-[260px] sm:min-h-[360px] max-h-[55vh] overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            {/* Step 1: Language */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-[var(--on-surface)] tracking-tight">{t.step1Title}</h3>
                  <p className="text-xs font-medium text-[var(--on-surface-var)] mt-1">{t.step1Desc}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      onLangChange('ru');
                      localStorage.setItem('linkerru_lang', 'ru');
                    }}
                    className={`p-6 rounded-3xl border-2 text-left transition-all flex flex-col justify-between h-[130px] cursor-pointer ${lang === 'ru' ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm' : 'border-[var(--outline-var)] hover:border-[var(--outline)] bg-[var(--surface-dim)]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <Languages size={24} className={lang === 'ru' ? 'text-[var(--accent)]' : 'text-[var(--on-surface-var)]'} />
                      {lang === 'ru' && <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center"><Check size={14} strokeWidth={3} /></div>}
                    </div>
                    <div>
                      <div className="text-sm font-black text-[var(--on-surface)]">{t.langRu}</div>
                      <div className="text-[10px] font-semibold text-[var(--on-surface-var)] mt-0.5">Русский язык по умолчанию</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onLangChange('en');
                      localStorage.setItem('linkerru_lang', 'en');
                    }}
                    className={`p-6 rounded-3xl border-2 text-left transition-all flex flex-col justify-between h-[130px] cursor-pointer ${lang === 'en' ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm' : 'border-[var(--outline-var)] hover:border-[var(--outline)] bg-[var(--surface-dim)]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <Languages size={24} className={lang === 'en' ? 'text-[var(--accent)]' : 'text-[var(--on-surface-var)]'} />
                      {lang === 'en' && <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center"><Check size={14} strokeWidth={3} /></div>}
                    </div>
                    <div>
                      <div className="text-sm font-black text-[var(--on-surface)]">{t.langEn}</div>
                      <div className="text-[10px] font-semibold text-[var(--on-surface-var)] mt-0.5">English language default</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Theme & Palette */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-[var(--on-surface)] tracking-tight">{t.step2Title}</h3>
                  <p className="text-xs font-medium text-[var(--on-surface-var)] mt-1">{t.step2Desc}</p>
                </div>

                <div className="space-y-4">
                  {/* Theme toggles */}
                  <div className="p-5 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-3xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">{t.themeMode}</span>
                    <div className="grid grid-cols-2 gap-3 mt-2.5">
                      <button
                        onClick={() => {
                          onThemeChange('light');
                          localStorage.setItem('linkerru_theme', 'light');
                        }}
                        className={`py-3.5 px-4 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${theme === 'light' ? 'bg-white text-black border-black shadow-md' : 'bg-transparent text-[var(--on-surface-var)] border-[var(--outline-var)] hover:text-[var(--on-surface)]'}`}
                      >
                        <Sun size={16} />
                        <span>{t.themeLight}</span>
                      </button>

                      <button
                        onClick={() => {
                          onThemeChange('dark');
                          localStorage.setItem('linkerru_theme', 'dark');
                        }}
                        className={`py-3.5 px-4 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${theme === 'dark' ? 'bg-black text-white border-white shadow-md' : 'bg-transparent text-[var(--on-surface-var)] border-[var(--outline-var)] hover:text-[var(--on-surface)]'}`}
                      >
                        <Moon size={16} />
                        <span>{t.themeDark}</span>
                      </button>
                    </div>
                  </div>

                  {/* Accents Grid */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] pl-1">{t.colorPalette}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2">
                      {materialPalettes.map((palette) => (
                        <button
                          key={palette.id}
                          onClick={() => {
                            onPaletteChange(palette.id);
                            localStorage.setItem('linkerru_accent', palette.id);
                          }}
                          className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer text-left ${activePaletteId === palette.id ? 'border-[var(--accent)] bg-[var(--accent)]/10 font-black' : 'border-[var(--outline-var)] hover:border-[var(--outline)] bg-[var(--surface-dim)]'}`}
                        >
                          <div 
                            className="w-6 h-6 rounded-full border border-black/10 shrink-0 shadow-sm" 
                            style={{ backgroundColor: palette.primary }}
                          />
                          <span className="text-xs truncate font-bold text-[var(--on-surface)]">
                            {lang === 'ru' ? palette.nameRu : palette.nameEn}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Wallpapers */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-[var(--on-surface)] tracking-tight">{t.step3Title}</h3>
                  <p className="text-xs font-medium text-[var(--on-surface-var)] mt-1">{t.step3Desc}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wallpapers.map((wp) => (
                    <button
                      key={wp.id}
                      onClick={() => {
                        onWallpaperChange(wp.id);
                        localStorage.setItem('linkerru_wallpaper', wp.id);
                      }}
                      className={`p-4 rounded-3xl border-2 flex flex-col gap-3 transition-all text-left cursor-pointer ${mainWallpaper === wp.id ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm' : 'border-[var(--outline-var)] hover:border-[var(--outline)] bg-[var(--surface-dim)]'}`}
                    >
                      <div 
                        className="w-full h-24 rounded-2xl border border-black/10 relative overflow-hidden flex items-center justify-center shadow-inner"
                        style={{ background: wp.style }}
                      >
                        {mainWallpaper === wp.id && (
                          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow">
                            <Check size={13} strokeWidth={3} />
                          </div>
                        )}
                        <span className="text-[10px] font-black tracking-wider uppercase bg-black/50 text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                          {t.preview}
                        </span>
                      </div>
                      <div className="text-xs font-black text-[var(--on-surface)] pl-1">
                        {lang === 'ru' ? wp.nameRu : wp.nameEn}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Standby clock with Visual Previews */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-[var(--on-surface)] tracking-tight">{t.step4Title}</h3>
                  <p className="text-xs font-medium text-[var(--on-surface-var)] mt-1">{t.step4Desc}</p>
                </div>

                <div className="space-y-5">
                  {/* Clock type style selection */}
                  <div className="p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-3xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] pl-1">{t.clockStyle}</span>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => onClockTypeChange('digital')}
                        className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${clockType === 'digital' ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-[var(--surface)] text-[var(--on-surface-var)] border-[var(--outline-var)]'}`}
                      >
                        <Clock size={16} />
                        <span>{t.digital}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onClockTypeChange('analog')}
                        className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${clockType === 'analog' ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-[var(--surface)] text-[var(--on-surface-var)] border-[var(--outline-var)]'}`}
                      >
                        <Clock size={16} />
                        <span>{t.analog}</span>
                      </button>
                    </div>
                  </div>

                  {/* Clock visual variations preview cards */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] pl-1">{t.clockVar}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Variant 1 Card: Classic Info Container */}
                      <button
                        type="button"
                        onClick={() => onClockVariationChange(1)}
                        className={`p-4 rounded-3xl border-2 text-left flex flex-col justify-between h-36 transition-all cursor-pointer ${clockVariation === 1 ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md ring-2 ring-[var(--accent)]/20' : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--outline)]'}`}
                      >
                        <div className="w-full h-16 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] p-2.5 flex flex-col justify-center items-center shadow-inner">
                          <span className="text-xl font-black tracking-tight text-[var(--on-surface)] tabular-nums">12:45</span>
                          <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest mt-0.5">MON • 28 JUL</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-black text-[var(--on-surface)]">{t.var1}</span>
                          {clockVariation === 1 && <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>}
                        </div>
                      </button>

                      {/* Variant 2 Card: Minimalist Thin Typography */}
                      <button
                        type="button"
                        onClick={() => onClockVariationChange(2)}
                        className={`p-4 rounded-3xl border-2 text-left flex flex-col justify-between h-36 transition-all cursor-pointer ${clockVariation === 2 ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md ring-2 ring-[var(--accent)]/20' : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--outline)]'}`}
                      >
                        <div className="w-full h-16 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] p-2.5 flex items-center justify-center shadow-inner">
                          <span className="text-2xl font-light tracking-widest text-[var(--on-surface)] tabular-nums">12<span className="text-[var(--accent)] animate-pulse">:</span>45</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-black text-[var(--on-surface)]">{t.var2}</span>
                          {clockVariation === 2 && <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>}
                        </div>
                      </button>

                      {/* Variant 3 Card: Accent Ultra Large Digits */}
                      <button
                        type="button"
                        onClick={() => onClockVariationChange(3)}
                        className={`p-4 rounded-3xl border-2 text-left flex flex-col justify-between h-36 transition-all cursor-pointer ${clockVariation === 3 ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-md ring-2 ring-[var(--accent)]/20' : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--outline)]'}`}
                      >
                        <div className="w-full h-16 rounded-2xl bg-[var(--accent)] p-2.5 flex items-center justify-center shadow-inner text-white">
                          <span className="text-3xl font-black tracking-tighter tabular-nums">12:45</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-black text-[var(--on-surface)]">{t.var3}</span>
                          {clockVariation === 3 && <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0"><Check size={12} strokeWidth={3} /></div>}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Panic button */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-[var(--on-surface)] tracking-tight">{t.step5Title}</h3>
                  <p className="text-xs font-medium text-[var(--on-surface-var)] mt-1">{t.step5Desc}</p>
                </div>

                <div className="space-y-4">
                  {/* Switch to enable */}
                  <div 
                    onClick={() => setIsPanicEnabled(!isPanicEnabled)}
                    className={`p-5 rounded-3xl border-2 flex items-center gap-4 cursor-pointer transition-all ${isPanicEnabled ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm' : 'border-[var(--outline-var)] hover:border-[var(--outline)] bg-[var(--surface-dim)]'}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${isPanicEnabled ? 'bg-[var(--accent)] text-white' : 'border-2 border-[var(--outline-var)]'}`}>
                      {isPanicEnabled && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div className="flex flex-col text-xs leading-relaxed select-none">
                      <span className="font-black text-[var(--on-surface)]">{t.enablePanic}</span>
                    </div>
                  </div>

                  {/* Expand Panic configurations */}
                  <AnimatePresence>
                    {isPanicEnabled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 overflow-hidden"
                      >
                        {/* Combination Hotkey Field */}
                        <div className="flex flex-col gap-1.5 p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl">
                          <label className="text-[10px] font-black tracking-wider uppercase text-[var(--on-surface-var)]">
                            {t.panicKeyLabel}
                          </label>
                          <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--outline)] rounded-2xl px-4 py-3">
                            <ShieldAlert size={18} className="text-red-500 shrink-0 animate-pulse" />
                            <input 
                              type="text" 
                              value={localPanicKey} 
                              onKeyDown={handleKeyDown}
                              onChange={() => {}} // Controlled via KeyDown
                              placeholder={t.panicKeyPlaceholder}
                              className="bg-transparent border-none outline-none text-[var(--on-surface)] text-sm w-full font-black focus:ring-0 placeholder:text-[var(--on-surface-var)]/40 tracking-wider" 
                            />
                          </div>
                          <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider pl-1 mt-1">
                            {lang === 'ru' ? 'Нажмите комбинацию (например Ctrl+0 или Alt+P)' : 'Press combination on keyboard (e.g. Ctrl+0 or Alt+P)'}
                          </span>
                        </div>

                        {/* Sound Selection */}
                        <div className="flex flex-col gap-1.5 p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl">
                          <label className="text-[10px] font-black tracking-wider uppercase text-[var(--on-surface-var)]">
                            {t.panicSoundLabel}
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              value={panicSound}
                              onChange={(e) => setPanicSound(e.target.value)}
                              className="flex-1 bg-[var(--surface)] border border-[var(--outline)] rounded-2xl px-4 py-2.5 text-xs font-bold text-[var(--on-surface)] outline-none focus:border-[var(--accent)]"
                            >
                              {NOTIFICATION_SOUNDS.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={playPanicSoundPreview}
                              className="px-3.5 py-2.5 rounded-2xl bg-[var(--accent)] text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-sm"
                            >
                              <Play size={14} />
                              <span>{t.testSound}</span>
                            </button>
                          </div>
                        </div>

                        {/* Redirect URL Field */}
                        <div className="flex flex-col gap-1.5 p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl">
                          <label className="text-[10px] font-black tracking-wider uppercase text-[var(--on-surface-var)]">
                            {t.panicUrlLabel}
                          </label>
                          <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--outline)] rounded-2xl px-4 py-3">
                            <input 
                              type="url" 
                              value={localPanicUrl} 
                              onChange={e => setLocalPanicUrl(e.target.value)} 
                              placeholder={t.panicUrlPlaceholder}
                              className="bg-transparent border-none outline-none text-[var(--on-surface)] text-xs w-full font-bold focus:ring-0 placeholder:text-[var(--on-surface-var)]/40" 
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-[var(--outline-var)] bg-[var(--surface-dim)] flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 text-xs font-black text-[var(--on-surface-var)] py-3 px-5 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface)] hover:text-[var(--on-surface)] transition-colors cursor-pointer ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ArrowLeft size={15} />
            <span>{t.back}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkipStep}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--on-surface-var)] hover:text-[var(--on-surface)] py-3 px-4 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface)] transition-all cursor-pointer"
            >
              <SkipForward size={14} />
              <span>{t.skipStep}</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 text-xs font-black bg-[var(--accent)] text-white py-3 px-6 rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-md"
            >
              <span>{step === totalSteps ? t.finish : t.next}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

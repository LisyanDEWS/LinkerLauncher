import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  Sun, 
  Moon, 
  Palette, 
  Image as ImageIcon, 
  Clock, 
  ShieldAlert, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  Gamepad2,
  BellRing,
  HelpCircle
} from 'lucide-react';
import { materialPalettes } from '../data/themes';
import { Language, ThemeMode, Material3Palette } from '../types';

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
  const [localPanicKey, setLocalPanicKey] = useState(panicKey || 'Escape');
  const [localPanicUrl, setLocalPanicUrl] = useState(panicUrl || 'https://google.com');

  const selectedPalette = useMemo(() => {
    return materialPalettes.find(p => p.id === activePaletteId) || materialPalettes[0];
  }, [activePaletteId]);

  // Handle keypress capture for panic button
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.key) {
      setLocalPanicKey(e.key);
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
      } else {
        onPanicKeyChange('');
        localStorage.setItem('linkerru_panic_key', '');
      }
      localStorage.setItem('linkerru_onboarded', 'true');
      onClose();
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
      subtitle: 'Давайте быстро адаптируем платформу под ваши предпочтения.',
      next: 'Продолжить',
      back: 'Назад',
      finish: 'Завершить настройку',
      step: 'Шаг',
      of: 'из',
      
      // Step 1: Lang
      step1Title: 'Выберите язык интерфейса',
      step1Desc: 'Вы можете изменить язык в любое время в настройках.',
      langRu: 'Русский (RU)',
      langEn: 'English (EN)',

      // Step 2: Theme & Palette
      step2Title: 'Оформление и цветовая гамма',
      step2Desc: 'Выберите тему оформления и акцентную палитру. По умолчанию установлена минималистичная монохромная тема.',
      themeMode: 'Режим интерфейса',
      themeLight: 'Светлая тема',
      themeDark: 'Тёмная тема',
      colorPalette: 'Цветовая палитра',

      // Step 3: Wallpapers
      step3Title: 'Фоновые обои',
      step3Desc: 'Выберите фоновое оформление для рабочего стола. Обои автоматически адаптируются под выбранные цвета.',
      preview: 'Предпросмотр',

      // Step 4: Standby clock
      step4Title: 'Режим ожидания (Standby)',
      step4Desc: 'Настройте полноэкранные часы, которые появляются при простое или ручном запуске.',
      clockStyle: 'Стиль часов',
      digital: 'Цифровые',
      analog: 'Аналоговые',
      clockVar: 'Вариант отображения',
      var1: 'Классический (Инфо-блок)',
      var2: 'Минималистичный (Тонкий шрифт)',
      var3: 'Акцентный (Крупные цифры)',

      // Step 5: Panic button
      step5Title: 'Тревожная кнопка (Panic Button)',
      step5Desc: 'Позволяет мгновенно скрыть содержимое экрана и перенаправить вкладку на безопасный сайт при нажатии горячей клавиши.',
      enablePanic: 'Активировать тревожную кнопку',
      panicKeyLabel: 'Горячая клавиша для экстренного выхода',
      panicKeyPlaceholder: 'Нажмите любую клавишу здесь...',
      panicUrlLabel: 'Безопасный URL для перенаправления',
      panicUrlPlaceholder: 'Например, https://google.com',
    },
    en: {
      welcome: 'Initial Setup LinkerRu',
      subtitle: 'Let\'s quickly tailor the platform to your personal preferences.',
      next: 'Continue',
      back: 'Back',
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
      step2Desc: 'Choose your interface theme and color accents. Minimalist Monochrome is active by default.',
      themeMode: 'Interface Mode',
      themeLight: 'Light Theme',
      themeDark: 'Dark Theme',
      colorPalette: 'Color Palette',

      // Step 3: Wallpapers
      step3Title: 'Desktop Wallpaper',
      step3Desc: 'Select background styling for your screen. Wallpapers adapt automatically to your color scheme.',
      preview: 'Preview',

      // Step 4: Standby clock
      step4Title: 'Standby Clock Setup',
      step4Desc: 'Configure the fullscreen screen-saver clock displayed during idle time or launched manually.',
      clockStyle: 'Clock Style',
      digital: 'Digital',
      analog: 'Analog',
      clockVar: 'Clock Variant',
      var1: 'Classic (Information container)',
      var2: 'Minimalist (Thin typography)',
      var3: 'Accent Color (Ultra large numbers)',

      // Step 5: Panic button
      step5Title: 'Panic Button Emergency Exit',
      step5Desc: 'Instantly hides your screen content and redirects the tab to a safe website when your panic hotkey is pressed.',
      enablePanic: 'Enable Panic Button functionality',
      panicKeyLabel: 'Emergency Exit Hotkey',
      panicKeyPlaceholder: 'Press any key here...',
      panicUrlLabel: 'Safe Redirect Destination URL',
      panicUrlPlaceholder: 'E.g., https://google.com',
    }
  }[lang];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-[var(--surface)] border border-[var(--outline)] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col relative my-8"
        style={{
          boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5)'
        }}
      >
        {/* Top Progress bar */}
        <div className="h-1.5 w-full bg-[var(--outline-var)] flex">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className="flex-1 transition-all duration-300"
              style={{
                backgroundColor: i < step ? 'var(--on-surface)' : 'transparent',
                opacity: i < step ? 1 : 0
              }}
            />
          ))}
        </div>

        {/* Modal Header */}
        <div className="p-8 pb-4 border-b border-[var(--outline-var)] flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-[var(--on-surface-var)] opacity-60">
              {t.step} {step} {t.of} {totalSteps}
            </span>
            <h2 className="text-xl font-black text-[var(--on-surface)] mt-1 flex items-center gap-2">
              <Sparkles size={20} className="text-[var(--on-surface-var)] shrink-0" />
              <span>{t.welcome}</span>
            </h2>
          </div>
          <div className="bg-[var(--surface-dim)] px-3.5 py-1.5 rounded-full text-xs font-bold text-[var(--on-surface-var)] border border-[var(--outline-var)]">
            linkerru :re
          </div>
        </div>

        {/* Scrollable Step Content */}
        <div className="p-8 flex-1 min-h-[220px] sm:min-h-[340px] max-h-[50vh] overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-[var(--on-surface)] uppercase tracking-tight">{t.step1Title}</h3>
                  <p className="text-xs font-bold text-[var(--on-surface-var)] mt-1">{t.step1Desc}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      onLangChange('ru');
                      localStorage.setItem('linkerru_lang', 'ru');
                    }}
                    className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-[130px] cursor-pointer ${lang === 'ru' ? 'border-[var(--on-surface)] bg-[var(--surface-dim)]' : 'border-[var(--outline-var)] hover:border-[var(--on-surface-var)] bg-[var(--surface)]'}`}
                  >
                    <Languages size={24} className={lang === 'ru' ? 'text-[var(--on-surface)]' : 'text-[var(--on-surface-var)]'} />
                    <div>
                      <div className="text-sm font-black text-[var(--on-surface)]">{t.langRu}</div>
                      <div className="text-[10px] font-bold text-[var(--on-surface-var)] mt-0.5">Русский язык по умолчанию</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onLangChange('en');
                      localStorage.setItem('linkerru_lang', 'en');
                    }}
                    className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-[130px] cursor-pointer ${lang === 'en' ? 'border-[var(--on-surface)] bg-[var(--surface-dim)]' : 'border-[var(--outline-var)] hover:border-[var(--on-surface-var)] bg-[var(--surface)]'}`}
                  >
                    <Languages size={24} className={lang === 'en' ? 'text-[var(--on-surface)]' : 'text-[var(--on-surface-var)]'} />
                    <div>
                      <div className="text-sm font-black text-[var(--on-surface)]">{t.langEn}</div>
                      <div className="text-[10px] font-bold text-[var(--on-surface-var)] mt-0.5">English language default</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-[var(--on-surface)] uppercase tracking-tight">{t.step2Title}</h3>
                  <p className="text-xs font-bold text-[var(--on-surface-var)] mt-1">{t.step2Desc}</p>
                </div>

                <div className="space-y-4">
                  {/* Theme toggles */}
                  <div className="p-5 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">{t.themeMode}</span>
                    <div className="grid grid-cols-2 gap-3 mt-2.5">
                      <button
                        onClick={() => {
                          onThemeChange('light');
                          localStorage.setItem('linkerru_theme', 'light');
                        }}
                        className={`py-3.5 px-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${theme === 'light' ? 'bg-white text-black border-black shadow-sm' : 'bg-transparent text-[var(--on-surface-var)] border-[var(--outline)] hover:text-[var(--on-surface)]'}`}
                      >
                        <Sun size={15} />
                        <span>{t.themeLight}</span>
                      </button>

                      <button
                        onClick={() => {
                          onThemeChange('dark');
                          localStorage.setItem('linkerru_theme', 'dark');
                        }}
                        className={`py-3.5 px-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${theme === 'dark' ? 'bg-black text-white border-white shadow-sm' : 'bg-transparent text-[var(--on-surface-var)] border-[var(--outline)] hover:text-[var(--on-surface)]'}`}
                      >
                        <Moon size={15} />
                        <span>{t.themeDark}</span>
                      </button>
                    </div>
                  </div>

                  {/* Accents Grid */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] pl-1">{t.colorPalette}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {materialPalettes.map((palette) => (
                        <button
                          key={palette.id}
                          onClick={() => {
                            onPaletteChange(palette.id);
                            localStorage.setItem('linkerru_accent', palette.id);
                          }}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 cursor-pointer text-left ${activePaletteId === palette.id ? 'border-[var(--on-surface)] bg-[var(--surface-dim)] font-black' : 'border-[var(--outline-var)] hover:border-[var(--on-surface-var)] bg-[var(--surface)]'}`}
                        >
                          <div 
                            className="w-5 h-5 rounded-full border border-black/10 shrink-0" 
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

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-[var(--on-surface)] uppercase tracking-tight">{t.step3Title}</h3>
                  <p className="text-xs font-bold text-[var(--on-surface-var)] mt-1">{t.step3Desc}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wallpapers.map((wp) => (
                    <button
                      key={wp.id}
                      onClick={() => {
                        onWallpaperChange(wp.id);
                        localStorage.setItem('linkerru_wallpaper', wp.id);
                      }}
                      className={`p-4 rounded-2xl border-2 flex flex-col gap-3 transition-all text-left cursor-pointer ${mainWallpaper === wp.id ? 'border-[var(--on-surface)] bg-[var(--surface-dim)]' : 'border-[var(--outline-var)] hover:border-[var(--on-surface-var)] bg-[var(--surface)]'}`}
                    >
                      {/* Interactive thumbnail */}
                      <div 
                        className="w-full h-24 rounded-lg border border-black/10 relative overflow-hidden flex items-center justify-center"
                        style={{ background: wp.style }}
                      >
                        {mainWallpaper === wp.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center">
                            <Check size={12} className="stroke-[3]" />
                          </div>
                        )}
                        <span className="text-[10px] font-black tracking-wider uppercase bg-black/40 text-white px-2 py-0.5 rounded backdrop-blur-[2px]">
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

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-[var(--on-surface)] uppercase tracking-tight">{t.step4Title}</h3>
                  <p className="text-xs font-bold text-[var(--on-surface-var)] mt-1">{t.step4Desc}</p>
                </div>

                <div className="space-y-5">
                  {/* Clock type style selection */}
                  <div className="p-5 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">{t.clockStyle}</span>
                    <div className="grid grid-cols-2 gap-3 mt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          onClockTypeChange('digital');
                        }}
                        className={`py-3.5 px-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${clockType === 'digital' ? 'bg-black text-white border-black' : 'bg-transparent text-[var(--on-surface-var)] border-[var(--outline)] hover:text-[var(--on-surface)]'}`}
                      >
                        <Clock size={15} />
                        <span>{t.digital}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClockTypeChange('analog');
                        }}
                        className={`py-3.5 px-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${clockType === 'analog' ? 'bg-black text-white border-black' : 'bg-transparent text-[var(--on-surface-var)] border-[var(--outline)] hover:text-[var(--on-surface)]'}`}
                      >
                        <Clock size={15} />
                        <span>{t.analog}</span>
                      </button>
                    </div>
                  </div>

                  {/* Clock variations selection */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] pl-1">{t.clockVar}</span>
                    <div className="space-y-2">
                      {([
                        { id: 1, name: t.var1 },
                        { id: 2, name: t.var2 },
                        { id: 3, name: t.var3 }
                      ] as const).map((variation) => (
                        <button
                          key={variation.id}
                          type="button"
                          onClick={() => {
                            onClockVariationChange(variation.id);
                          }}
                          className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${clockVariation === variation.id ? 'border-[var(--on-surface)] bg-[var(--surface-dim)] font-black' : 'border-[var(--outline-var)] hover:border-[var(--outline)] bg-[var(--surface)]'}`}
                        >
                          <span className="text-xs font-bold text-[var(--on-surface)]">{variation.name}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${clockVariation === variation.id ? 'bg-black text-white' : 'border-[var(--outline)]'}`}>
                            {clockVariation === variation.id && <Check size={11} className="stroke-[3]" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-black text-[var(--on-surface)] uppercase tracking-tight">{t.step5Title}</h3>
                  <p className="text-xs font-bold text-[var(--on-surface-var)] mt-1">{t.step5Desc}</p>
                </div>

                <div className="space-y-4">
                  {/* Switch to enable */}
                  <div 
                    onClick={() => setIsPanicEnabled(!isPanicEnabled)}
                    className={`p-5 rounded-2xl border-2 flex items-start gap-4 cursor-pointer transition-all ${isPanicEnabled ? 'border-[var(--on-surface)] bg-[var(--surface-dim)]' : 'border-[var(--outline-var)] hover:border-[var(--outline)] bg-[var(--surface)]'}`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isPanicEnabled ? 'bg-black text-white' : 'border border-[var(--outline)]'}`}>
                      {isPanicEnabled && <Check size={12} className="stroke-[3]" />}
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
                        {/* Shortcut Key field */}
                        <div className="flex flex-col gap-1.5 p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-xl">
                          <label className="text-[10px] font-black tracking-wider uppercase text-[var(--on-surface-var)]">
                            {t.panicKeyLabel}
                          </label>
                          <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--outline)] rounded-xl px-3.5 py-2.5">
                            <ShieldAlert size={16} className="text-red-500 shrink-0 animate-pulse" />
                            <input 
                              type="text" 
                              value={localPanicKey} 
                              onKeyDown={handleKeyDown}
                              onChange={() => {}} // Controlled via KeyDown
                              placeholder={t.panicKeyPlaceholder}
                              className="bg-transparent border-none outline-none text-[var(--on-surface)] text-xs w-full font-bold focus:ring-0 placeholder:text-[var(--on-surface-var)]/40" 
                            />
                          </div>
                          <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">
                            {lang === 'ru' ? 'Просто нажмите нужную клавишу на клавиатуре' : 'Simply press the desired key on your keyboard'}
                          </span>
                        </div>

                        {/* Redirect URL field */}
                        <div className="flex flex-col gap-1.5 p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-xl">
                          <label className="text-[10px] font-black tracking-wider uppercase text-[var(--on-surface-var)]">
                            {t.panicUrlLabel}
                          </label>
                          <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--outline)] rounded-xl px-3.5 py-2.5">
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
        <div className="p-8 border-t border-[var(--outline-var)] bg-[var(--surface-dim)] flex justify-between items-center">
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 text-xs font-black text-[var(--on-surface-var)] py-3 px-5 rounded-xl border border-[var(--outline)] bg-[var(--surface)] hover:text-[var(--on-surface)] transition-colors cursor-pointer ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ArrowLeft size={14} />
            <span>{t.back}</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 text-xs font-black bg-black text-white py-3 px-6 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md"
          >
            <span>{step === totalSteps ? t.finish : t.next}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

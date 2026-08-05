import { CLICK_SOUNDS, NOTIFICATION_SOUNDS } from '../data/sounds';
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { useContainerSize } from '../hooks/useContainerSize';
import {
  X,
  Palette,
  Languages,
  Bell,
  Info,
  Search,
  Moon,
  Sun,
  Contrast,
  Volume2,
  VolumeX,
  ShieldCheck,
  Check,
  Image,
  CloudSun,
  Link2,
  ToggleLeft,
  ArrowLeft,
  User,
  Lock,
  Loader2,
  KeyRound,
  Edit2
} from 'lucide-react';
import { Shield, Wind, AlertTriangle, LogOut, Cpu } from 'lucide-react';
import { Language, ThemeMode, QuickLink, MAX_QUICK_LINKS, DEFAULT_QUICK_LINKS, ToggleId, TOGGLE_IDS, MAX_TOGGLES } from '../types';
import { translations } from '../data/translations';
import { materialPalettes } from '../data/themes';
import SquashToggle from './SquashToggle';
import { ColorPickerField } from './ColorPickerField';
import { pb } from '../lib/pocketbase';

const TOGGLE_LABELS: Record<ToggleId, { ru: string; en: string }> = {
  theme: { ru: 'Тема (Светлая/Темная)', en: 'Theme (Light/Dark)' },
  language: { ru: 'Язык', en: 'Language' },
  sound: { ru: 'Звук', en: 'Sound' },
  contrast: { ru: 'Контраст', en: 'Contrast' },
};

interface FullSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  activePaletteId: string;
  onPaletteChange: (paletteId: string) => void;
  isContrast: boolean;
  onContrastToggle: () => void;
  isToastEnabled: boolean;
  onToastToggle: () => void;
  isSoundEnabled: boolean;
  onSoundToggle: () => void;
  clickSound: string;
  onClickSoundChange: (profile: string) => void;
  notifySound: string;
  onNotifySoundChange: (profile: string) => void;
  brightness: number;
  onBrightnessChange: (val: number) => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  panicKey: string;
  onPanicKeyChange: (key: string) => void;
  panicUrl: string;
  onPanicUrlChange: (url: string) => void;
  isMobileLayout?: boolean;
  standbyBg: string;
  onStandbyBgChange: (bg: string) => void;
  fontFamily: string;
  onFontChange: (font: string) => void;
  mainWallpaper: string;
  onMainWallpaperChange: (w: string) => void;
  isAuthenticated: boolean;
  nickname: string;
  onNicknameChange: (newNick: string) => void;
  avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
  customLinks: QuickLink[];
  onLinksChange: (links: QuickLink[]) => void;
  activeToggles: ToggleId[];
  onTogglesChange: (toggles: ToggleId[]) => void;
  isOptimizedEngine: boolean;
  onOptimizedEngineToggle: () => void;
  initialTab?: Tab;
  embedded?: boolean;
  timeFormat?: '12h' | '24h';
  onTimeFormatChange?: (tf: '12h' | '24h') => void;
  tempUnit?: 'C' | 'F';
  onTempUnitChange?: (tu: 'C' | 'F') => void;
}

type Tab = 'appearance' | 'language' | 'notifications' | 'sound' | 'about' | 'security' | 'links' | 'toggles' | 'developer' | 'account';

export default function FullSettingsModal({
  isOpen,
  onClose: _onClose,
  lang,
  onLangChange,
  theme,
  onThemeToggle,
  activePaletteId,
  onPaletteChange,
  isContrast,
  onContrastToggle,
  isToastEnabled,
  onToastToggle,
  isSoundEnabled,
  onSoundToggle,
  clickSound,
  onClickSoundChange,
  notifySound,
  onNotifySoundChange,
  brightness,
  onBrightnessChange,
  volume,
  onVolumeChange,
  panicKey,
  onPanicKeyChange,
  panicUrl,
  onPanicUrlChange,
  isMobileLayout,
  standbyBg,
  onStandbyBgChange,
  fontFamily,
  onFontChange,
  mainWallpaper,
  onMainWallpaperChange,
  isAuthenticated,
  nickname,
  onNicknameChange,
  avatarUrl,
  onAvatarChange,
  customLinks,
  onLinksChange,
  activeToggles,
  onTogglesChange,
  isOptimizedEngine,
  onOptimizedEngineToggle,
  initialTab,
  embedded = false,
  timeFormat = '24h',
  onTimeFormatChange,
  tempUnit = 'C',
  onTempUnitChange,
}: FullSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'appearance');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileContent, setShowMobileContent] = useState(false);

  // Track the container (window manager) width to switch between
  // wide (iPadOS split-view) and narrow (iOS stack navigation) layouts.
  const { ref: containerRef, isNarrow } = useContainerSize();

  // When switching to narrow layout, reset to sidebar (master list) view.
  // When switching to wide layout, always show content panel.
  useEffect(() => {
    if (!isNarrow) {
      setShowMobileContent(true);
    } else {
      setShowMobileContent(false);
    }
  }, [isNarrow]);

  const t = translations[lang];

  // Auto-hide content when the modal opens, so user starts on sidebar on mobile
  useEffect(() => {
    if (isOpen) {
      setShowMobileContent(isNarrow ? false : true);
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab, isNarrow]);

  useEffect(() => {
    const handleOpenTab = (e: Event) => {
      const customE = e as CustomEvent<Tab>;
      setActiveTab(customE.detail);
      setShowMobileContent(true);
    };
    window.addEventListener('open_settings_tab', handleOpenTab);
    return () => window.removeEventListener('open_settings_tab', handleOpenTab);
  }, []);

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setShowMobileContent(true);
  };

  const [customPrimary, setCustomPrimary] = useState('#8B5CF6');
  const [customSecondary, setCustomSecondary] = useState('#A78BFA');
  const [customTertiary, setCustomTertiary] = useState('#6D28D9');

  const createCustomTheme = () => {
    const customPalette = {
      id: 'custom_user_theme',
      nameRu: 'Моя тема',
      nameEn: 'My Custom Theme',
      primary: customPrimary,
      secondary: customSecondary,
      tertiary: customTertiary,
      lightBg: '#F3F4F6',
      darkBg: '#111827'
    };
    const idx = materialPalettes.findIndex(p => p.id === 'custom_user_theme');
    if (idx >= 0) {
      materialPalettes[idx] = customPalette;
    } else {
      materialPalettes.push(customPalette);
    }
    localStorage.setItem('linkerru_custom_palette', JSON.stringify(customPalette));
    onPaletteChange('custom_user_theme');
  };

  useEffect(() => {
    const saved = localStorage.getItem('linkerru_custom_palette');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setCustomPrimary(p.primary || '#8B5CF6');
        setCustomSecondary(p.secondary || '#A78BFA');
        setCustomTertiary(p.tertiary || '#6D28D9');
      } catch {}
    }
  }, []);

  // Helper to retrieve the current active palette object
  const activePalette = useMemo(() => {
    return materialPalettes.find((p) => p.id === activePaletteId) || materialPalettes[0];
  }, [activePaletteId]);

  const backgrounds = useMemo(() => {
    const p1 = activePalette.primary;
    const p2 = activePalette.secondary;
    const p3 = activePalette.tertiary;

    return [
      { id: 'none', name: 'None', style: 'var(--bg)' },
      { id: 'gradient-1', name: 'Gradient 1', style: `linear-gradient(135deg, ${p1}, ${p2}, ${p3})` },
      { id: 'gradient-2', name: 'Gradient 2', style: `radial-gradient(circle at 10% 20%, ${p2} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3} 0%, transparent 50%), linear-gradient(135deg, ${p1}, var(--bg))` },
      { id: 'gradient-3', name: 'Gradient 3', style: `linear-gradient(to bottom right, ${p1} 0%, transparent 100%), linear-gradient(to top right, ${p3} 0%, transparent 100%), var(--bg)` },
      { id: 'gradient-4', name: 'Gradient 4', style: `conic-gradient(from 180deg at 50% 50%, ${p1} 0deg, ${p2} 120deg, ${p3} 240deg, ${p1} 360deg)` },
    ];
  }, [activePalette]);

  // List of all items for search indexing
  const searchableSettings = useMemo(() => {
    return [
      {
        id: 'theme_toggle',
        title: t.theme_toggle_label,
        desc: t.theme_desc,
        tab: 'appearance' as Tab,
        action: 'toggle_theme',
        icon: theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />,
        control: (
          <SquashToggle 
            checked={theme === 'dark'} 
            onChange={onThemeToggle} 
            color={activePalette.primary} 
          />
        ),
      },
      {
        id: 'contrast_toggle',
        title: t.contrast_label,
        desc: t.contrast_desc,
        tab: 'appearance' as Tab,
        action: 'toggle_contrast',
        icon: <Contrast size={18} />,
        control: (
          <SquashToggle 
            checked={isContrast} 
            onChange={onContrastToggle} 
            color={activePalette.primary} 
          />
        ),
      },
      {
        id: 'lang_selection',
        title: t.language_name,
        desc: t.language_desc,
        tab: 'language' as Tab,
        action: 'toggle_lang',
        icon: <Languages size={18} />,
        control: (
          <div className="flex bg-[var(--container)] border border-[var(--outline-var)] rounded-full p-0.5 gap-0.5">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onLangChange('en')}
              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                lang === 'en' ? 'text-[var(--surface)] shadow' : 'text-[var(--on-surface-var)]'
              }`}
              style={{ backgroundColor: lang === 'en' ? activePalette.primary : undefined }}
            >
              EN
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onLangChange('ru')}
              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                lang === 'ru' ? 'text-[var(--surface)] shadow' : 'text-[var(--on-surface-var)]'
              }`}
              style={{ backgroundColor: lang === 'ru' ? activePalette.primary : undefined }}
            >
              RU
            </motion.button>
          </div>
        ),
      },
      {
        id: 'toast_toggle',
        title: t.toast_enabled,
        desc: t.toast_desc,
        tab: 'notifications' as Tab,
        action: 'toggle_toast',
        icon: <Bell size={18} />,
        control: (
          <SquashToggle 
            checked={isToastEnabled} 
            onChange={onToastToggle} 
            color={activePalette.primary} 
          />
        ),
      },
      {
        id: 'sound_toggle',
        title: t.sound_effects,
        desc: t.sound_desc,
        tab: 'notifications' as Tab,
        action: 'toggle_sound',
        icon: isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />,
        control: (
          <SquashToggle 
            checked={isSoundEnabled} 
            onChange={onSoundToggle} 
            color={activePalette.primary} 
          />
        ),
      },
    ];
  }, [lang, theme, isContrast, isToastEnabled, isSoundEnabled, activePalette]);

  // Filtering search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchableSettings.filter(
      (item) => item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
    );
  }, [searchQuery, searchableSettings]);

  // Embedded mode: render content inline filling the window manager container.
  // No fixed overlay, no backdrop, no fullscreen/close buttons (window manager provides those).
  // Layout adapts to the container width via ResizeObserver (isNarrow state):
  //   - Wide (>= 580px): iPadOS-style split view (sidebar + content side-by-side)
  //   - Narrow (< 580px): iOS-style stack navigation (master list -> drill-down detail)
  if (embedded) {
    if (!isOpen) return null;
    return (
      <div
        ref={containerRef}
        className={`flex h-full w-full overflow-hidden bg-[var(--bg)] ${isNarrow ? 'flex-col' : 'flex-row'}`}
        id="full-settings-modal-container"
      >
            {/* LEFT SIDEBAR PANEL — master list in narrow mode, sidebar in wide mode */}
            <aside
              className={`bg-[var(--container)] border-[var(--outline-var)] flex-col p-4 shrink-0 ${
                isNarrow
                  ? `w-full h-full border-b ${showMobileContent ? 'hidden' : 'flex'}`
                  : `w-[250px] h-full border-r ${showMobileContent ? 'flex' : 'flex'}`
              }`}
              id="settings-sidebar"
            >
              {/* Search Bar */}
              <div className="relative mb-5" id="settings-search-wrapper">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-surface-var)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim() !== '') {
                      setShowMobileContent(true);
                    }
                  }}
                  placeholder={t.search_placeholder}
                  className="w-full text-xs font-semibold py-2.5 pl-10 pr-4 bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline)] rounded-2xl outline-none focus:border-[var(--on-surface)]"
                  id="settings-search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--outline)] hover:text-[var(--on-surface)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sidebar Tabs */}
              <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none pr-1" id="sidebar-nav-tabs">
                <span className="text-[10px] font-black tracking-widest text-[var(--on-surface-var)] uppercase pl-3 block mb-2">
                  {lang === 'ru' ? 'Аккаунт' : 'Account'}
                </span>

                <button
                  onClick={() => selectTab('account')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'account' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-account-btn"
                >
                  <User size={16} />
                  <span>{lang === 'ru' ? 'Профиль & Пароль' : 'Profile & Password'}</span>
                </button>

                <span className="text-[10px] font-black tracking-widest text-[var(--on-surface-var)] uppercase pl-3 block mt-5 mb-2">
                  {lang === 'ru' ? 'Общие' : 'General'}
                </span>

                <button
                  onClick={() => selectTab('appearance')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'appearance' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-appearance-btn"
                >
                  <Palette size={16} />
                  <span>{t.page_appearance}</span>
                </button>

                <button
                  onClick={() => selectTab('language')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'language' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-language-btn"
                >
                  <Languages size={16} />
                  <span>{t.page_language}</span>
                </button>

                <span className="text-[10px] font-black tracking-widest text-[var(--on-surface-var)] uppercase pl-3 block mt-5 mb-2">
                  {t.ph_news}
                </span>

                <button
                  onClick={() => selectTab('notifications')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'notifications' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-notifications-btn"
                >
                  <Bell size={16} />
                  <span>{t.page_notifications}</span>
                </button>
                <button
                  onClick={() => selectTab('sound')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'sound' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-sound-btn"
                >
                  <Volume2 size={16} />
                  <span>{lang === 'ru' ? 'Звук' : 'Sound'}</span>
                </button>

                <button
                  onClick={() => selectTab('security')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'security' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-security-btn"
                >
                  <ShieldCheck size={16} />
                  <span>{lang === 'ru' ? 'Безопасность' : 'Security'}</span>
                </button>

                <span className="text-[10px] font-black tracking-widest text-[var(--on-surface-var)] uppercase pl-3 block mt-5 mb-2">
                  {lang === 'ru' ? 'Дополнительно' : 'Extras'}
                </span>

                <button
                  onClick={() => selectTab('links')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'links' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-links-btn"
                >
                  <Link2 size={16} />
                  <span>{lang === 'ru' ? 'Ссылки' : 'Links'}</span>
                </button>

                <button
                  onClick={() => selectTab('toggles')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'toggles' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-toggles-btn"
                >
                  <ToggleLeft size={16} />
                  <span>{lang === 'ru' ? 'Переключатели' : 'Toggles'}</span>
                </button>

                <span className="text-[10px] font-black tracking-widest text-[var(--on-surface-var)] uppercase pl-3 block mt-5 mb-2">
                  {t.ph_support}
                </span>

                <button
                  onClick={() => selectTab('about')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'about' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-about-btn"
                >
                  <Info size={16} />
                  <span>{t.page_about}</span>
                </button>
                <button
                  onClick={() => selectTab('developer')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'developer' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-dev-btn"
                >
                  <AlertTriangle size={16} />
                  <span>{lang === 'ru' ? 'Dev опции' : 'Dev Options'}</span>
                </button>
              </div>

              {/* Developer branding in sidebar footer */}
              <div className="pt-4 border-t border-[var(--outline-var)] flex items-center justify-between text-[10px] font-black tracking-widest text-[var(--outline)] uppercase pl-1.5" id="sidebar-footer">
                <span>v1/262608</span>
                <span>stable</span>
              </div>
            </aside>

            {/* RIGHT MAIN CONTENT AREA — drill-down detail in narrow mode */}
            <main
              className={`flex-1 flex flex-col overflow-hidden bg-[var(--bg)] h-full ${
                isNarrow
                  ? (showMobileContent ? 'flex' : 'hidden')
                  : 'flex'
              }`}
              id="settings-content-wrapper"
            >
              {/* Header inside settings */}
              <header className="flex items-center justify-between p-6 pb-2 border-b border-[var(--outline-var)] flex-shrink-0" id="settings-content-header">
                <div className="flex items-center gap-3">
                  {/* Back button — only shown in narrow (iOS) mode */}
                  {isNarrow && showMobileContent && (
                    <button
                      onClick={() => setShowMobileContent(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)]"
                      title={lang === 'ru' ? 'Назад' : 'Back'}
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <h2 className="text-2xl font-extrabold tracking-tight text-[var(--on-surface)]">
                    {searchQuery ? (
                      <span className="text-sm font-semibold text-[var(--on-surface-var)] uppercase tracking-wider block mb-1">
                        {lang === 'ru' ? 'Результаты поиска' : 'Search results for'} &quot;{searchQuery}&quot;
                      </span>
                    ) : activeTab === 'account' ? (
                      lang === 'ru' ? 'Управление аккаунтом' : 'Account Management'
                    ) : activeTab === 'appearance' ? (
                      t.page_appearance
                    ) : activeTab === 'language' ? (
                      t.page_language
                    ) : activeTab === 'notifications' ? (
                      t.page_notifications
                    ) : activeTab === 'security' ? (
                      lang === 'ru' ? 'Безопасность' : 'Security'
                    ) : activeTab === 'links' ? (
                      lang === 'ru' ? 'Пользовательские ссылки' : 'Custom Links'
                    ) : activeTab === 'toggles' ? (
                      lang === 'ru' ? 'Настройка переключателей' : 'Quick Toggles Setup'
                    ) : (
                      t.page_about
                    )}
                  </h2>
                </div>
              </header>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-scroll p-6 space-y-6 scrollbar-thin" id="settings-content-scroll">
                {/* SEARCH RESULTS VIEW OVERRIDE */}
                {searchQuery.trim() !== '' ? (
                  <div className="space-y-3" id="search-results-list">
                    {searchResults.length === 0 ? (
                      <div className="text-xs text-[var(--outline)] italic py-10 text-center">
                        {lang === 'ru' ? 'Ничего не найдено' : 'No settings matching your search query'}
                      </div>
                    ) : (
                      searchResults.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                              {item.icon}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--on-surface)]">
                                {item.title}
                              </div>
                              <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                {item.desc}
                              </div>
                            </div>
                          </div>
                          <div>{item.control}</div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <>
                    {/* APPEARANCE TAB CONTENT */}
                    {activeTab === 'appearance' && (
                      <div className="space-y-6" id="page-appearance-view">
          {/* Lighting and Sound Controllers */}
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] mb-4 flex items-center gap-2 pl-1.5">
              <Sun size={14} />
              {lang === 'ru' ? 'Свет и Звук' : 'Lighting & Sound'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[var(--on-surface)] flex items-center gap-2">
                    <Sun size={16} className="text-[var(--on-surface-var)]" />
                    {lang === 'ru' ? 'Яркость' : 'Brightness'}
                  </span>
                  <span className="text-xs font-bold text-[var(--on-surface-var)] tabular-nums">{Math.round(brightness)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="1"
                  value={brightness}
                  onChange={(e) => onBrightnessChange(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none outline-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${activePaletteId !== 'none' ? 'var(--accent)' : 'var(--on-surface-var)'} ${brightness}%, var(--outline-var) ${brightness}%)`
                  }}
                />
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[var(--on-surface)] flex items-center gap-2">
                    {volume > 0 ? <Volume2 size={16} className="text-[var(--on-surface-var)]" /> : <VolumeX size={16} className="text-[var(--on-surface-var)]" />}
                    {lang === 'ru' ? 'Громкость' : 'Volume'}
                  </span>
                  <span className="text-xs font-bold text-[var(--on-surface-var)] tabular-nums">{Math.round(volume)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none outline-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${activePaletteId !== 'none' ? 'var(--accent)' : 'var(--on-surface-var)'} ${volume}%, var(--outline-var) ${volume}%)`
                  }}
                />
              </div>
            </div>
          </div>
                        {/* Theme, Contrast settings card group */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] pl-1.5">
                            {t.app_theme}
                          </h4>

                          {/* Theme Row */}
                          <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {t.theme_toggle_label}
                                </div>
                                <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  {t.theme_desc}
                                </div>
                              </div>
                            </div>
                            <SquashToggle 
                              checked={theme === 'dark'} 
                              onChange={onThemeToggle} 
                              color={activePalette.primary} 
                            />
                          </div>

                          {/* Contrast Row */}
                          <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                                <Contrast size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {t.contrast_label}
                                </div>
                                <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  {t.contrast_desc}
                                </div>
                              </div>
                            </div>
                            <SquashToggle 
                              checked={isContrast} 
                              onChange={onContrastToggle} 
                              color={activePalette.primary} 
                            />
                          </div>

                          {/* Main Wallpaper Row */}
                          <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3">
                            <div className="flex items-center gap-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                                <Image size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Обои' : 'Wallpapers'}
                                </div>
                                <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  {lang === 'ru' ? 'Установите фоновый градиент или цвет' : 'Set a background gradient or color'}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-5 gap-2 mt-2">
                              {backgrounds.map((bg) => (
                                <button
                                  key={bg.id}
                                  onClick={() => onMainWallpaperChange(bg.id)}
                                  className={`h-12 rounded-xl border-2 transition-all ${mainWallpaper === bg.id ? 'border-[var(--accent)] scale-95' : 'border-[var(--outline-var)] hover:border-[var(--outline)]'}`}
                                  style={{ background: bg.style }}
                                  title={bg.name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Theme Color Swatches Section */}
                        <div className="space-y-3" id="theme-engine-settings">
                          <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] pl-1.5">
                            {t.theme_engine_label}
                          </h4>

                          <div className="p-5 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--on-surface-var)]">
                              <Palette size={16} />
                              <span>{t.theme_engine_desc}</span>
                            </div>

                            {/* Color Grid list */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3" id="theme-color-palette-grid">
                              {materialPalettes.map((palette) => {
                                const isActive = palette.id === activePaletteId;
                                return (
                                  <button
                                    key={palette.id}
                                    onClick={() => onPaletteChange(palette.id)}
                                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between min-h-[95px] gap-3 transition-all relative hover:scale-[1.02] active:scale-95 ${
                                      isActive
                                        ? 'border-[var(--on-surface)] shadow-sm'
                                        : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:bg-[var(--container)]'
                                    }`}
                                    id={`swatch-item-${palette.id}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-extrabold text-[var(--on-surface)]">
                                        {lang === 'ru' ? palette.nameRu : palette.nameEn}
                                      </span>
                                      {isActive && (
                                        <Check
                                          size={14}
                                          className="text-[var(--on-surface)] font-bold"
                                          style={{ color: palette.primary }}
                                        />
                                      )}
                                    </div>

                                    {/* Swatch color combined stripes to preview tints */}
                                    <div className="flex h-5 w-full rounded-lg overflow-hidden border border-[var(--outline-var)]">
                                      <div
                                        className="flex-1"
                                        style={{ backgroundColor: palette.primary }}
                                        title="Primary Accent"
                                      />
                                      <div
                                        className="flex-1"
                                        style={{ backgroundColor: palette.secondary }}
                                        title="Secondary Accent"
                                      />
                                      <div
                                        className="flex-1"
                                        style={{ backgroundColor: palette.tertiary }}
                                        title="Tertiary Accent"
                                      />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Custom Theme Builder */}
                            <div className="mt-4 pt-4 border-t border-[var(--outline-var)] space-y-4">
                               <div className="text-xs font-bold text-[var(--on-surface)]">
                                 {lang === 'ru' ? 'Создать свою тему' : 'Create your own theme'}
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <ColorPickerField
                                    label="Primary (Hex)"
                                    value={customPrimary}
                                    onChange={setCustomPrimary}
                                  />
                                  <ColorPickerField
                                    label="Secondary (Hex)"
                                    value={customSecondary}
                                    onChange={setCustomSecondary}
                                  />
                                  <ColorPickerField
                                    label="Tertiary (Hex)"
                                    value={customTertiary}
                                    onChange={setCustomTertiary}
                                  />
                               </div>
                               <button 
                                 onClick={createCustomTheme} 
                                 className="w-full py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all text-white border border-white/10 hover:opacity-90 active:scale-[0.98]"
                                 style={{ backgroundColor: activePalette.primary }}
                               >
                                 {lang === 'ru' ? 'Сохранить и применить' : 'Save and Apply Theme'}
                               </button>
                            </div>

                          </div>
                        </div>

                        {/* Font Typography Section */}
                        <div className="space-y-3 mt-4" id="font-settings">
                          <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] pl-1.5">
                            Typography
                          </h4>

                          <div className="p-5 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--on-surface-var)]">
                              <Info size={16} />
                              <span>Select a primary font for the interface</span>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                              {[
                                { id: '"Space Grotesk", "Inter", sans-serif', name: 'Space Grotesk' },
                                { id: '"Inter", sans-serif', name: 'Inter' },
                                { id: '"Roboto", sans-serif', name: 'Roboto' },
                                { id: '"Open Sans", sans-serif', name: 'Open Sans' },
                                { id: '"Lato", sans-serif', name: 'Lato' },
                                { id: '"Montserrat", sans-serif', name: 'Montserrat' },
                                { id: '"Poppins", sans-serif', name: 'Poppins' },
                                { id: '"Nunito", sans-serif', name: 'Nunito' },
                                { id: '"JetBrains Mono", monospace', name: 'JetBrains Mono' },
                                { id: '"Playfair Display", serif', name: 'Playfair Display' },
                              ].map((font) => (
                                <button
                                  key={font.id}
                                  onClick={() => onFontChange(font.id)}
                                  className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-center items-start gap-1 hover:scale-[1.02] active:scale-95 ${
                                    fontFamily === font.id
                                      ? 'border-[var(--on-surface)] bg-[var(--container)]'
                                      : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:bg-[var(--container)]'
                                  }`}
                                  style={{ fontFamily: font.id }}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-sm font-bold text-[var(--on-surface)]">
                                      {font.name}
                                    </span>
                                    {fontFamily === font.id && (
                                      <Check size={14} className="text-[var(--on-surface)]" />
                                    )}
                                  </div>
                                  <span className="text-[10px] text-[var(--on-surface-var)]">
                                    The quick brown fox
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Standby Mode Background Section */}
                        {!isMobileLayout && (
                        <div className="space-y-3 mt-4" id="standby-bg-settings">
                          <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] pl-1.5">
                            Standby Mode
                          </h4>

                          <div className="p-5 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--on-surface-var)]">
                              <Info size={16} />
                              <span>Select a background style for the standby clock</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              {backgrounds.map((g) => (
                                <button
                                  key={g.id}
                                  onClick={() => onStandbyBgChange(g.id)}
                                  className={`relative h-16 rounded-2xl border-2 overflow-hidden transition-all hover:scale-105 active:scale-95 ${
                                    standbyBg === g.id ? 'border-[var(--on-surface)] shadow-md' : 'border-transparent'
                                  }`}
                                  style={{ background: g.style }}
                                >
                                  {standbyBg === g.id && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                      <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow-sm">
                                        <Check size={12} strokeWidth={4} />
                                      </div>
                                    </div>
                                  )}
                                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold text-white drop-shadow-md">
                                    {g.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        )}
                      </div>
                    )}

                    {/* LANGUAGE & REGIONAL FORMATS TAB CONTENT */}
                    {activeTab === 'language' && (
                      <div className="space-y-4" id="page-language-view">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] pl-1.5">
                          {t.page_language}
                        </h4>

                        <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                              <Languages size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--on-surface)]">
                                {t.language_name}
                              </div>
                              <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                {t.language_desc}
                              </div>
                            </div>
                          </div>

                          <div className="flex bg-[var(--container)] border border-[var(--outline-var)] rounded-full p-1 gap-1 relative" id="language-tab-switcher">
                            <button
                              onClick={() => onLangChange('en')}
                              className={`relative z-10 px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                                lang === 'en' ? 'text-white' : 'text-[var(--on-surface-var)]'
                              }`}
                            >
                              {lang === 'en' && (
                                <motion.div
                                  layoutId="lang-pill-settings"
                                  className="absolute inset-0 bg-[var(--accent)] rounded-xl shadow-sm -z-10"
                                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                              )}
                              English
                            </button>
                            <button
                              onClick={() => onLangChange('ru')}
                              className={`relative z-10 px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                                lang === 'ru' ? 'text-white' : 'text-[var(--on-surface-var)]'
                              }`}
                            >
                              {lang === 'ru' && (
                                <motion.div
                                  layoutId="lang-pill-settings"
                                  className="absolute inset-0 bg-[var(--accent)] rounded-xl shadow-sm -z-10"
                                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                              )}
                              Русский
                            </button>
                          </div>
                        </div>

                        {/* TIME FORMAT SETTING */}
                        <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                              <CloudSun size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--on-surface)]">
                                {lang === 'ru' ? 'Формат времени' : 'Time Format'}
                              </div>
                              <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                {lang === 'ru' ? 'Выбор 24-часового или 12-часового AM/PM формата' : 'Select 24-hour clock or 12-hour AM/PM clock'}
                              </div>
                            </div>
                          </div>

                          <div className="flex bg-[var(--container)] border border-[var(--outline-var)] rounded-full p-1 gap-1 relative">
                            <button
                              onClick={() => onTimeFormatChange?.('24h')}
                              className={`relative z-10 px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                                timeFormat === '24h' ? 'text-white' : 'text-[var(--on-surface-var)]'
                              }`}
                            >
                              {timeFormat === '24h' && (
                                <motion.div
                                  layoutId="time-pill-settings"
                                  className="absolute inset-0 bg-[var(--accent)] rounded-xl shadow-sm -z-10"
                                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                              )}
                              24h
                            </button>
                            <button
                              onClick={() => onTimeFormatChange?.('12h')}
                              className={`relative z-10 px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                                timeFormat === '12h' ? 'text-white' : 'text-[var(--on-surface-var)]'
                              }`}
                            >
                              {timeFormat === '12h' && (
                                <motion.div
                                  layoutId="time-pill-settings"
                                  className="absolute inset-0 bg-[var(--accent)] rounded-xl shadow-sm -z-10"
                                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                              )}
                              12h AM/PM
                            </button>
                          </div>
                        </div>

                        {/* TEMPERATURE UNIT SETTING */}
                        <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                              <Wind size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--on-surface)]">
                                {lang === 'ru' ? 'Единица температуры' : 'Temperature Unit'}
                              </div>
                              <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                {lang === 'ru' ? 'Шкала измерения температуры (Цельсий / Фаренгейт)' : 'Temperature scale (Celsius °C / Fahrenheit °F)'}
                              </div>
                            </div>
                          </div>

                          <div className="flex bg-[var(--container)] border border-[var(--outline-var)] rounded-full p-1 gap-1 relative">
                            <button
                              onClick={() => onTempUnitChange?.('C')}
                              className={`relative z-10 px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                                tempUnit === 'C' ? 'text-white' : 'text-[var(--on-surface-var)]'
                              }`}
                            >
                              {tempUnit === 'C' && (
                                <motion.div
                                  layoutId="temp-pill-settings"
                                  className="absolute inset-0 bg-[var(--accent)] rounded-xl shadow-sm -z-10"
                                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                              )}
                              °C
                            </button>
                            <button
                              onClick={() => onTempUnitChange?.('F')}
                              className={`relative z-10 px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                                tempUnit === 'F' ? 'text-white' : 'text-[var(--on-surface-var)]'
                              }`}
                            >
                              {tempUnit === 'F' && (
                                <motion.div
                                  layoutId="temp-pill-settings"
                                  className="absolute inset-0 bg-[var(--accent)] rounded-xl shadow-sm -z-10"
                                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                              )}
                              °F
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NOTIFICATIONS TAB CONTENT */}
                    {activeTab === 'notifications' && (
                      <div className="space-y-4" id="page-notifications-view">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] pl-1.5">
                          {t.notif_style}
                        </h4>

                        {/* Toast toggle */}
                        <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                              <Bell size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--on-surface)]">
                                {t.toast_enabled}
                              </div>
                              <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                {t.toast_desc}
                              </div>
                            </div>
                          </div>
                          <SquashToggle 
                            checked={isToastEnabled} 
                            onChange={onToastToggle} 
                            color={activePalette.primary} 
                          />
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'sound' && (
                      <div className="space-y-6" id="page-sound-view">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] pl-1.5">
                          {lang === 'ru' ? 'Звук и Уведомления' : 'Sound & Notifications'}
                        </h4>
                        
                        <div className="flex flex-col gap-3">
                          {/* Toast Toggle */}
                          <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                                <Bell size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {t.toast_enabled}
                                </div>
                                <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  {t.toast_desc}
                                </div>
                              </div>
                            </div>
                            <SquashToggle 
                              checked={isToastEnabled} 
                              onChange={onToastToggle} 
                              color={activePalette.primary} 
                            />
                          </div>

                          {/* Interactive Click Sound toggle */}
                          <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                                {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {t.sound_effects}
                                </div>
                                <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  {t.sound_desc}
                                </div>
                              </div>
                            </div>
                            <SquashToggle 
                              checked={isSoundEnabled} 
                              onChange={onSoundToggle} 
                              color={activePalette.primary} 
                            />
                          </div>
                        </div>

                        {/* Sound Selection Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Click Sound Selection */}
                          <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--accent)] border border-[var(--outline-var)]">
                                <Volume2 size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Звук клика' : 'Click Sound'}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {CLICK_SOUNDS.map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => onClickSoundChange(s.id)}
                                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                                    clickSound === s.id ? 'bg-[var(--surface-dim)] text-[var(--on-surface)] border border-[var(--outline)] shadow-sm' : 'border border-transparent text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-dim)]'
                                  }`}
                                >
                                  {s.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Notify Sound Selection */}
                          <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--accent)] border border-[var(--outline-var)]">
                                <Bell size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Звук уведомления' : 'Notification Sound'}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                              {NOTIFICATION_SOUNDS.map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => onNotifySoundChange(s.id)}
                                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all shrink-0 ${
                                    notifySound === s.id ? 'bg-[var(--surface-dim)] text-[var(--on-surface)] border border-[var(--outline)] shadow-sm' : 'border border-transparent text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-dim)]'
                                  }`}
                                >
                                  {s.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'security' && (
                      <div className="space-y-6" id="page-security-view">
                        <div className="p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl flex flex-col items-center justify-center text-center gap-4 py-12">
                          <div className="w-16 h-16 rounded-full bg-[var(--container)] text-[var(--accent)] flex items-center justify-center mb-2">
                            <Shield size={32} />
                          </div>
                          <h3 className="text-lg font-bold text-[var(--on-surface)]">
                            {lang === 'ru' ? 'Ваши данные в безопасности' : 'Your data is secure'}
                          </h3>
                          <p className="text-sm text-[var(--on-surface-var)] max-w-sm">
                            {lang === 'ru' ? 'Linker OS использует локальное хранилище для всех настроек. Ваши данные не отправляются на сторонние серверы.' : 'Linker OS uses local storage for all preferences. Your data is not sent to third-party servers.'}
                          </p>
                        </div>
                        
                        <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3">
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
                              <AlertTriangle size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--on-surface)]">
                                {lang === 'ru' ? 'Тревожная кнопка (Panic Button)' : 'Panic Button'}
                              </div>
                              <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                {lang === 'ru' ? 'Мгновенно закрыть приложение и открыть безопасный сайт. Рекомендуется использовать комбинацию клавиш (например, Shift+Escape) во избежание случайных нажатий.' : 'Instantly close the app and open a safe site. It is recommended to use a key combination (e.g. Shift+Escape) to avoid accidental triggers.'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 mt-2">
                            <label className="text-xs font-bold text-[var(--on-surface-var)]">
                              {lang === 'ru' ? 'Кнопка / Комбинация (кликните и нажмите)' : 'Key / Combination (click and press)'}
                            </label>
                            <input
                              type="text"
                              value={panicKey}
                              readOnly
                              onKeyDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const key = e.key;
                                if (key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') return;
                                const modifiers = [];
                                if (e.ctrlKey) modifiers.push('Ctrl');
                                if (e.altKey) modifiers.push('Alt');
                                if (e.shiftKey) modifiers.push('Shift');
                                if (e.metaKey) modifiers.push('Meta');
                                const combo = [...modifiers, key === ' ' ? 'Space' : key].join('+');
                                onPanicKeyChange(combo);
                              }}
                              className="w-full text-sm font-semibold py-2.5 px-4 bg-[var(--surface-dim)] text-[var(--on-surface)] border border-[var(--outline)] rounded-xl outline-none focus:border-[var(--on-surface)] cursor-pointer text-center tracking-wider"
                              placeholder={lang === 'ru' ? 'Нажмите комбинацию' : 'Press a combination'}
                            />
                          </div>

                          <div className="flex flex-col gap-2 mt-2">
                            <label className="text-xs font-bold text-[var(--on-surface-var)]">
                              {lang === 'ru' ? 'Сайт для перехода' : 'Safe Site URL'}
                            </label>
                            <input
                              type="url"
                              value={panicUrl}
                              onChange={(e) => onPanicUrlChange(e.target.value)}
                              className="w-full text-sm font-semibold py-2.5 px-4 bg-[var(--surface-dim)] text-[var(--on-surface)] border border-[var(--outline)] rounded-xl outline-none focus:border-[var(--on-surface)]"
                              placeholder="https://google.com"
                            />
                          </div>

                          <button onClick={() => window.location.replace(panicUrl || 'https://google.com')} className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-xs mt-2 hover:bg-red-600 transition-colors">
                            {lang === 'ru' ? 'АКТИВИРОВАТЬ ПАНИКУ (ТЕСТ)' : 'ACTIVATE PANIC (TEST)'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'links' && (
                      <div className="space-y-6" id="page-links-view">
                        <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold text-[var(--on-surface)]">
                              {lang === 'ru' ? 'Быстрые ссылки' : 'Quick Links'}
                            </div>
                            <span className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase tabular-nums">
                              {customLinks.length}/{MAX_QUICK_LINKS}
                            </span>
                          </div>

                          <p className="text-[11px] text-[var(--on-surface-var)]">
                            {lang === 'ru'
                              ? `Первые 2 ссылки — стандартные (редактируются, но не удаляются). Можно добавить до ${MAX_QUICK_LINKS - DEFAULT_QUICK_LINKS.length} своих.`
                              : `First 2 links are default (editable but not removable). You can add up to ${MAX_QUICK_LINKS - DEFAULT_QUICK_LINKS.length} custom ones.`}
                          </p>

                          <div className="flex flex-col gap-3">
                            {customLinks.map((link, idx) => {
                              const isDefault = idx < DEFAULT_QUICK_LINKS.length;
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={link.name}
                                    onChange={(e) => {
                                      const next = [...customLinks];
                                      next[idx] = { ...next[idx], name: e.target.value };
                                      onLinksChange(next);
                                    }}
                                    placeholder={lang === 'ru' ? 'Название' : 'Name'}
                                    className="flex-1 min-w-0 text-xs py-2 px-3 bg-[var(--surface-dim)] text-[var(--on-surface)] border border-[var(--outline)] rounded-xl outline-none focus:border-[var(--accent)]"
                                  />
                                  <input
                                    type="url"
                                    value={link.url}
                                    onChange={(e) => {
                                      const next = [...customLinks];
                                      next[idx] = { ...next[idx], url: e.target.value };
                                      onLinksChange(next);
                                    }}
                                    placeholder="https://"
                                    className="flex-[2] min-w-0 text-xs py-2 px-3 bg-[var(--surface-dim)] text-[var(--on-surface)] border border-[var(--outline)] rounded-xl outline-none focus:border-[var(--accent)]"
                                  />
                                  {isDefault ? (
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--outline)]" title={lang === 'ru' ? 'Нельзя удалить' : 'Cannot delete'}>
                                      <Lock size={13} />
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const next = customLinks.filter((_, i) => i !== idx);
                                        onLinksChange(next);
                                      }}
                                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                      title={lang === 'ru' ? 'Удалить' : 'Delete'}
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}

                            {customLinks.length < MAX_QUICK_LINKS && (
                              <button
                                onClick={() => {
                                  const next = [...customLinks, { name: '', url: 'https://' }];
                                  onLinksChange(next);
                                }}
                                className="w-full py-2.5 rounded-xl bg-[var(--surface-dim)] border border-dashed border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--surface)] transition-colors mt-2"
                              >
                                + {lang === 'ru' ? 'Добавить ссылку' : 'Add Link'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'toggles' && (
                      <div className="space-y-6" id="page-toggles-view">
                        <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold text-[var(--on-surface)]">
                              {lang === 'ru' ? 'Быстрые переключатели' : 'Quick Toggles'}
                            </div>
                            <span className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase tabular-nums">
                              {activeToggles.length}/{MAX_TOGGLES}
                            </span>
                          </div>

                          <p className="text-[11px] text-[var(--on-surface-var)]">
                            {lang === 'ru'
                              ? 'Включите или выключите переключатели, которые появятся на главной панели.'
                              : 'Enable or disable the toggles that appear on the home panel.'}
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            {TOGGLE_IDS.map((id) => {
                              const isActive = activeToggles.includes(id);
                              return (
                                <div key={id} className="flex items-center justify-between p-3 bg-[var(--surface-dim)] rounded-xl border border-[var(--outline-var)]">
                                  <span className="text-xs font-semibold text-[var(--on-surface)]">
                                    {lang === 'ru' ? TOGGLE_LABELS[id].ru : TOGGLE_LABELS[id].en}
                                  </span>
                                  <SquashToggle
                                    checked={isActive}
                                    onChange={() => {
                                      if (isActive) {
                                        onTogglesChange(activeToggles.filter((t) => t !== id));
                                      } else if (activeToggles.length < MAX_TOGGLES) {
                                        onTogglesChange([...activeToggles, id]);
                                      }
                                    }}
                                    color={activePalette.primary}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'developer' && (
                      <div className="flex flex-col gap-6 animate-fade-in pb-10" id="dev-options-tab">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-12 h-12 rounded-full bg-[var(--surface-dim)] border border-[var(--outline)] flex items-center justify-center text-[var(--on-surface)]">
                            <Cpu size={24} className="text-[var(--accent)]" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-[var(--on-surface)] uppercase tracking-tight">
                              {lang === 'ru' ? 'Опции разработчика' : 'Developer Options'}
                            </h3>
                            <p className="text-xs font-bold text-[var(--on-surface-var)] mt-1">
                              {lang === 'ru' ? 'Инструменты разработчика и оптимизация производительности' : 'Developer tools and performance optimization'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3" id="dev-danger-zone">
                          <h4 className="text-xs font-black uppercase tracking-widest text-red-500 pl-1.5">
                            {lang === 'ru' ? 'Опасная зона' : 'Danger Zone'}
                          </h4>
                          {/* Force Login Screen Card */}
                          <div className="p-5 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl space-y-4">
                             <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-black text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Принудительный выход' : 'Force Login Screen'}
                                </h4>
                                <p className="text-xs font-bold text-[var(--on-surface-var)]">
                                  {lang === 'ru' 
                                    ? 'Это действие мгновенно завершит текущую сессию и вернет вас на экран входа. Все ваши настройки, тема и кастомные ссылки будут сохранены.' 
                                    : 'This action will instantly log you out and return to the login screen. All your settings, theme, and custom links will be preserved.'}
                                </p>
                             </div>
                             <button
                               onClick={() => {
                                 if (window.confirm(lang === 'ru' ? 'Вы уверены, что хотите выйти на экран входа?' : 'Are you sure you want to log out to the login screen?')) {
                                   localStorage.removeItem('linkerru_auth');
                                   window.location.reload();
                                 }
                               }}
                               className="w-full py-4 bg-[var(--on-surface)]/5 hover:bg-[var(--on-surface)]/10 active:bg-[var(--on-surface)]/20 text-[var(--on-surface)] font-black rounded-xl border border-[var(--outline-var)] transition-all flex items-center justify-center gap-2"
                             >
                               <LogOut size={18} />
                               {lang === 'ru' ? 'ВЫЙТИ НА ЭКРАН ВХОДА' : 'FORCE TO LOGIN SCREEN'}
                             </button>
                          </div>

                          {/* Destroy Session Card */}
                          <div className="p-5 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl space-y-4">
                             <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-black text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Уничтожить сессию' : 'Destroy Session'}
                                </h4>
                                <p className="text-xs font-bold text-[var(--on-surface-var)]">
                                  {lang === 'ru' 
                                    ? 'Это действие удалит все локальные данные, настройки, кастомные ссылки, и сбросит приложение до заводских настроек. Отменить это действие невозможно.' 
                                    : 'This action will delete all local data, settings, custom links, and reset the app to factory defaults. This cannot be undone.'}
                                </p>
                             </div>
                             <button
                               onClick={() => {
                                 if (window.confirm(lang === 'ru' ? 'Вы уверены? Все данные будут удалены.' : 'Are you sure? All data will be deleted.')) {
                                   localStorage.clear();
                                   window.location.reload();
                                 }
                               }}
                               className="w-full py-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 active:bg-red-500/30 font-black rounded-xl border border-red-500/20 transition-all flex items-center justify-center gap-2"
                             >
                               <AlertTriangle size={18} />
                               {lang === 'ru' ? 'УНИЧТОЖИТЬ СЕССИЮ' : 'DESTROY SESSION'}
                             </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'account' && (
                      <div className="space-y-6" id="page-account-view">
                        <AccountTabContent
                          lang={lang}
                          nickname={nickname}
                          onNicknameChange={onNicknameChange}
                          avatarUrl={avatarUrl}
                          onAvatarChange={onAvatarChange}
                          isAuthenticated={isAuthenticated}
                        />
                      </div>
                    )}

                        {/* About Tab View */}
                    {activeTab === 'about' && (
                      <div className="space-y-6" id="page-about-view">
                        <div className="p-6 bg-[var(--surface)] border border-[var(--outline-var)] rounded-3xl flex flex-col items-center justify-center text-center gap-4 py-10 shadow-sm">
                          <img 
                            src={theme === 'dark' 
                              ? "https://github.com/user-attachments/assets/9fad2245-28d1-4b70-a3ee-74e3d8a757e6" 
                              : "https://github.com/user-attachments/assets/4d4a877a-6135-4dc5-82fc-d3705c8fc142"} 
                            alt="LinkerRu Logo" 
                            className={`w-20 h-20 object-contain drop-shadow-md rounded-2xl p-2 border border-[var(--outline-var)] ${theme === 'dark' ? 'bg-black' : 'bg-white'}`} 
                          />
                          <div>
                            <h3 className="text-2xl font-black text-[var(--on-surface)] tracking-tight">LinkerRu :Re</h3>
                            <p className="text-xs font-extrabold text-[var(--accent)] mt-1 tracking-widest uppercase bg-[var(--accent)]/10 px-3 py-1 rounded-full inline-block">
                              v1/262608
                            </p>
                          </div>
                          <p className="text-xs text-[var(--on-surface-var)] max-w-md font-semibold leading-relaxed">
                            {lang === 'ru' 
                              ? 'LinkerRu :Re — экспрессивная веб-операционная система Material 3 с интеграцией приложений, гибкой многооконной средой и возможностью кастомизации.' 
                              : 'LinkerRu :Re — Material 3 Expressive web operating system featuring windowed app manager, modular homes, and seamless customization.'}
                          </p>

                          <div className="w-full pt-4 border-t border-[var(--outline-var)] mt-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] block mb-3">
                              {lang === 'ru' ? 'Разработчик и Технологии' : 'Developer & Technologies'}
                            </span>
                            
                            <div className="p-3 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl flex items-center justify-center gap-3 mb-4">
                              <span className="text-xs font-black text-[var(--on-surface)]">
                                {lang === 'ru' ? 'Разработка:' : 'Developer:'} <span className="text-[var(--accent)]">Lisyan Tech Technologies</span>
                              </span>
                            </div>

                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] block mb-3">
                              {lang === 'ru' ? 'Благодарности и Сервисы (Credits)' : 'Credits & Integrated Services'}
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                              {/* Space Proxy Credit */}
                              <a 
                                href="https://gointospace.app/" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-3.5 bg-[var(--surface-dim)] hover:bg-[var(--surface)] border border-[var(--outline-var)] hover:border-[var(--accent)] rounded-2xl flex items-center gap-3 transition-all group"
                              >
                                <img 
                                  src="https://gointospace.app/assets/logo.webp" 
                                  alt="Space Proxy" 
                                  className="w-8 h-8 rounded-lg object-contain bg-black/80 p-1 shrink-0" 
                                />
                                <div>
                                  <div className="text-xs font-black text-[var(--on-surface)] group-hover:text-[var(--accent)] transition-colors">
                                    Space Proxy
                                  </div>
                                  <div className="text-[10px] font-bold text-[var(--on-surface-var)]">
                                    gointospace.app
                                  </div>
                                </div>
                              </a>

                              {/* Agno GPT Credit */}
                              <a 
                                href="https://agno.com/" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-3.5 bg-[var(--surface-dim)] hover:bg-[var(--surface)] border border-[var(--outline-var)] hover:border-[var(--accent)] rounded-2xl flex items-center gap-3 transition-all group"
                              >
                                <img 
                                  src="https://mintcdn.com/agno-v2/SgkhZ8Fg5uYnD8iq/logo/black.svg?fit=max&auto=format&n=SgkhZ8Fg5uYnD8iq&q=85&s=fbe4dbb306f50c4d379aff3861e202fa" 
                                  alt="Agno GPT" 
                                  className="w-8 h-8 rounded-lg object-contain bg-white p-1 shrink-0 border border-black/10" 
                                />
                                <div>
                                  <div className="text-xs font-black text-[var(--on-surface)] group-hover:text-[var(--accent)] transition-colors">
                                    Agno (for Agno GPT)
                                  </div>
                                  <div className="text-[10px] font-bold text-[var(--on-surface-var)]">
                                    agno.com
                                  </div>
                                </div>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>
      </div>
    );
  }

  // Non-embedded mode (legacy fixed overlay) — no longer used, settings opens via window manager
  return null;
}

function AccountTabContent({
  lang,
  nickname,
  onNicknameChange,
  avatarUrl,
  onAvatarChange,
  isAuthenticated
}: {
  lang: Language;
  nickname: string;
  onNicknameChange: (newNick: string) => void;
  avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
  isAuthenticated: boolean;
}) {
  const [nickInput, setNickInput] = useState(nickname);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarWorking, setIsAvatarWorking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setNickInput(nickname);
  }, [nickname]);

  const handleUpdateNickname = async () => {
    if (!nickInput.trim()) {
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Никнейм не может быть пустым' : 'Nickname cannot be empty'
      });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      onNicknameChange(nickInput.trim());
      // If user is authenticated, we also update it in PocketBase
      if (isAuthenticated && pb.authStore.record) {
        await pb.collection('users').update(pb.authStore.record.id, {
          nickname: nickInput.trim(),
        });
      }
      setMessage({
        type: 'success',
        text: lang === 'ru' ? 'Никнейм успешно обновлен!' : 'Nickname updated successfully!'
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Ошибка при сохранении' : 'Failed to save nickname'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pb.authStore.record) return;

    // 1. Show local preview first (Cache)
    const localUrl = URL.createObjectURL(file);
    onAvatarChange(localUrl);

    setIsAvatarWorking(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const record = await pb.collection('users').update(pb.authStore.record.id, formData);
      const url = pb.getFileUrl(record as any, record.avatar);
      
      // 2. Update with permanent URL (Cloud)
      onAvatarChange(url);
      
      setMessage({
        type: 'success',
        text: lang === 'ru' ? 'Аватар успешно обновлен!' : 'Avatar updated successfully!'
      });
    } catch (err) {
      console.error(err);
      // Revert to null or old if failed? For now just keep local until refresh if user prefers
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Ошибка загрузки аватара' : 'Failed to upload avatar'
      });
    } finally {
      setIsAvatarWorking(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!pb.authStore.record) return;

    setIsAvatarWorking(true);
    setMessage(null);
    try {
      await pb.collection('users').update(pb.authStore.record.id, {
        avatar: null
      });
      onAvatarChange(null);
      setMessage({
        type: 'success',
        text: lang === 'ru' ? 'Аватар удален' : 'Avatar removed'
      });
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Ошибка удаления аватара' : 'Failed to remove avatar'
      });
    } finally {
      setIsAvatarWorking(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Введите новый пароль' : 'Please enter a new password'
      });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Пароль должен быть не менее 6 символов' : 'Password must be at least 6 characters'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      if (pb.authStore.record) {
        await pb.collection('users').update(pb.authStore.record.id, {
          password: newPassword,
          passwordConfirm: confirmPassword,
        });
        setMessage({
          type: 'success',
          text: lang === 'ru' ? 'Пароль успешно изменен!' : 'Password updated successfully!'
        });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({
          type: 'error',
          text: lang === 'ru' ? 'Пользователь не найден' : 'User not found'
        });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Ошибка изменения пароля' : 'Failed to update password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner if message exists */}
      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* User Profile Info */}
      <div className="p-5 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[var(--accent)] to-[var(--on-surface)] p-0.5 shadow-sm overflow-hidden border border-[var(--outline)]">
              <div className="h-full w-full rounded-2xl bg-[var(--surface)] flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-[var(--on-surface-var)]" />
                )}
                {isAvatarWorking && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-white" />
                  </div>
                )}
              </div>
            </div>
            {isAuthenticated && (
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[var(--surface)] border border-[var(--outline)] shadow-sm flex items-center justify-center cursor-pointer hover:bg-[var(--container)] transition-colors text-[var(--on-surface)]">
                <Edit2 size={12} />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpdate} disabled={isAvatarWorking} />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-[var(--on-surface)] leading-tight truncate">
              {isAuthenticated ? nickname : (lang === 'ru' ? 'Гостевой аккаунт' : 'Guest Account')}
            </h4>
            <p className="text-[11px] text-[var(--on-surface-var)] font-semibold mt-0.5 truncate">
              {isAuthenticated ? pb.authStore.record?.email : 'guest@linker.os'}
            </p>
            {avatarUrl && (
              <button 
                onClick={handleAvatarRemove}
                disabled={isAvatarWorking}
                className="mt-2 text-[9px] font-black uppercase tracking-wider text-red-500 opacity-60 hover:opacity-100 transition-opacity"
              >
                {lang === 'ru' ? 'Удалить аватар' : 'Remove Avatar'}
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--outline-var)] pt-4 space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">
              {lang === 'ru' ? 'Имя профиля (Никнейм)' : 'Profile Nickname'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickInput}
                onChange={(e) => setNickInput(e.target.value)}
                className="flex-1 text-xs font-semibold px-4.5 py-3 bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline)] rounded-xl outline-none focus:border-[var(--on-surface)]"
                placeholder={lang === 'ru' ? 'Имя пользователя' : 'Username'}
                disabled={isLoading}
              />
              <button
                onClick={handleUpdateNickname}
                disabled={isLoading}
                className="px-5 py-3 rounded-xl text-xs font-black bg-[var(--accent)] text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{lang === 'ru' ? 'Сохранить' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Panel */}
      <div className="p-5 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl space-y-4">
        <h4 className="text-sm font-black text-[var(--on-surface)] flex items-center gap-2">
          <KeyRound size={16} className="text-[var(--on-surface-var)]" />
          <span>{lang === 'ru' ? 'Безопасность & Пароль' : 'Security & Password'}</span>
        </h4>

        {isAuthenticated ? (
          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">
                {lang === 'ru' ? 'Новый пароль' : 'New Password'}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs font-semibold px-4.5 py-3 bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline)] rounded-xl outline-none focus:border-[var(--on-surface)]"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">
                {lang === 'ru' ? 'Подтвердите пароль' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-xs font-semibold px-4.5 py-3 bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline)] rounded-xl outline-none focus:border-[var(--on-surface)]"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-xs font-black bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              <span>{lang === 'ru' ? 'Изменить пароль' : 'Update Password'}</span>
            </button>
          </form>
        ) : (
          <div className="pt-2 text-center py-6 px-4">
            <p className="text-xs font-bold text-[var(--on-surface-var)] max-w-sm mx-auto leading-relaxed">
              {lang === 'ru' 
                ? 'Смена пароля недоступна в гостевом режиме. Пожалуйста, откройте Linker R Launcher на ПК или переключитесь на десктопную версию для полноценной авторизации.' 
                : 'Password changing is not available in guest mode. Please launch Linker R Launcher on a desktop browser or PC mode to register and manage your account.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

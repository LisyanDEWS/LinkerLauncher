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
  Subtitles,
  MessageCircle,
  StickyNote,
  Calculator,
  Gamepad2,
  Smartphone,
  Eye,
  EyeOff,
  Paintbrush,
  Download,
  ExternalLink,
  Sparkles,
  History,
  Blocks,
  RotateCw,
} from 'lucide-react';
import { useWindows } from './WindowManager';

const RECOMMENDED_EXT_WALLPAPERS = [
  {
    id: 'ext-braies',
    name: 'Горное озеро',
    category: 'Пейзаж',
    preview: 'https://picsum.photos/id/10/600/350',
    full: 'https://picsum.photos/id/10/1920/1080',
  },
  {
    id: 'ext-misty-slope',
    name: 'Лесная тропа',
    category: 'Природа',
    preview: 'https://picsum.photos/id/28/600/350',
    full: 'https://picsum.photos/id/28/1920/1080',
  },
  {
    id: 'ext-ny-night',
    name: 'Мегаполис: ночь',
    category: 'Город 4K',
    preview: 'https://picsum.photos/id/122/600/350',
    full: 'https://picsum.photos/id/122/1920/1080',
  },
  {
    id: 'ext-dark-mountains',
    name: 'Ночные горы',
    category: 'Тёмные',
    preview: 'https://picsum.photos/id/49/600/350',
    full: 'https://picsum.photos/id/49/1920/1080',
  },
  {
    id: 'ext-ocean-calm',
    name: 'Спокойствие океана',
    category: 'Минимализм',
    preview: 'https://picsum.photos/id/37/600/350',
    full: 'https://picsum.photos/id/37/1920/1080',
  },
  {
    id: 'ext-sunrise-valley',
    name: 'Долина на рассвете',
    category: 'Природа',
    preview: 'https://picsum.photos/id/11/600/350',
    full: 'https://picsum.photos/id/11/1920/1080',
  },
  {
    id: 'ext-canyon-waterfall',
    name: 'Водопад в ущелье',
    category: 'Пейзаж',
    preview: 'https://picsum.photos/id/15/600/350',
    full: 'https://picsum.photos/id/15/1920/1080',
  },
  {
    id: 'ext-tropical-beach',
    name: 'Тропический берег',
    category: 'Вода',
    preview: 'https://picsum.photos/id/16/600/350',
    full: 'https://picsum.photos/id/16/1920/1080',
  },
  {
    id: 'ext-sunset-peaks',
    name: 'Горы на закате',
    category: 'Пейзаж',
    preview: 'https://picsum.photos/id/29/600/350',
    full: 'https://picsum.photos/id/29/1920/1080',
  },
  {
    id: 'ext-highway-night',
    name: 'Автомагистраль ночью',
    category: 'Город 4K',
    preview: 'https://picsum.photos/id/133/600/350',
    full: 'https://picsum.photos/id/133/1920/1080',
  },
  {
    id: 'ext-dark-silhouettes',
    name: 'Ночные силуэты',
    category: 'Тёмные',
    preview: 'https://picsum.photos/id/48/600/350',
    full: 'https://picsum.photos/id/48/1920/1080',
  },
  {
    id: 'ext-dark-ocean',
    name: 'Тёмный океан',
    category: 'Тёмные',
    preview: 'https://picsum.photos/id/85/600/350',
    full: 'https://picsum.photos/id/85/1920/1080',
  }
].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
import { Shield, Wind, AlertTriangle, LogOut, Cpu } from 'lucide-react';
import { Language, ThemeMode, QuickLink, MAX_QUICK_LINKS, DEFAULT_QUICK_LINKS, ToggleId, TOGGLE_IDS, MAX_TOGGLES } from '../types';
import { translations } from '../data/translations';
import { materialPalettes } from '../data/themes';
import SquashToggle from './SquashToggle';
import { ColorPickerField } from './ColorPickerField';
import { userAuth, userDb } from '../lib/userFirebase';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { LanguageSelector } from './LanguageSelector';

const TOGGLE_LABELS: Record<ToggleId, { ru: string; en: string; uk: string }> = {
  theme: { ru: 'Тема (Светлая/Темная)', en: 'Theme (Light/Dark)', uk: 'Тема (Світла/Темна)' },
  language: { ru: 'Язык', en: 'Language', uk: 'Мова' },
  sound: { ru: 'Звук', en: 'Sound', uk: 'Звук' },
  contrast: { ru: 'Контраст', en: 'Contrast', uk: 'Контраст' },
  night_light: { ru: 'Ночной режим', en: 'Night Light', uk: 'Нічний режим' },
};

interface FullSettingsModalProps {
  wm?: ReturnType<typeof useWindows>;
  playChime?: (type?: 'click' | 'alert' | 'reset' | 'victory' | 'toast') => void;
  triggerToast?: (text: string) => void;
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
  isGlassBlur: boolean;
  onGlassBlurToggle: () => void;
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
  onTriggerAdmin?: () => void;
  appNotifPermissions?: Record<string, 'allowed' | 'denied'>;
  onAppNotifPermissionToggle?: (appId: string, allowed: boolean) => void;
  isWeatherDisabled?: boolean;
  onWeatherDisabledToggle?: (disabled: boolean) => void;
}

type Tab = 'appearance' | 'language' | 'notifications' | 'sound' | 'about' | 'security' | 'toggles' | 'developer' | 'account';

export default function FullSettingsModal({
  wm,
  playChime,
  triggerToast,
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
  isGlassBlur,
  onGlassBlurToggle,
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
  onTriggerAdmin,
  appNotifPermissions = {},
  onAppNotifPermissionToggle,
  isWeatherDisabled = false,
  onWeatherDisabledToggle,
}: FullSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(isMobileLayout && initialTab === 'account' ? 'appearance' : (initialTab || 'appearance'));
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileContent, setShowMobileContent] = useState(false);

  // --- Installed extensions state ---
  const [installedExtensions, setInstalledExtensions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('linkerru_installed_extensions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isWallpaperPlusInstalled = installedExtensions.includes('wallpaper-plus');

  // --- Download simulation state for Wallpaper+ ---
  const [isDownloadingWallpaperPlus, setIsDownloadingWallpaperPlus] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('');

  // --- Recent extension wallpapers state ---
  const [recentExtWallpapers, setRecentExtWallpapers] = useState<Array<{ id: string; name: string; preview: string; full: string }>>(() => {
    try {
      const saved = localStorage.getItem('linkerru_recent_ext_wallpapers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync recent extension wallpapers if mainWallpaper is set to a remote image URL
  useEffect(() => {
    if (
      mainWallpaper &&
      mainWallpaper !== 'none' &&
      !mainWallpaper.startsWith('gradient') &&
      !mainWallpaper.startsWith('linear-gradient') &&
      !mainWallpaper.startsWith('radial-gradient') &&
      !mainWallpaper.startsWith('conic-gradient') &&
      !mainWallpaper.startsWith('var(--bg)')
    ) {
      setRecentExtWallpapers((prev) => {
        const exists = prev.some((item) => item.full === mainWallpaper);
        if (!exists) {
          const recMatch = RECOMMENDED_EXT_WALLPAPERS.find((r) => r.full === mainWallpaper);
          const newItem = {
            id: recMatch?.id || 'ext-' + Date.now(),
            name: recMatch?.name || (lang === 'ru' ? 'Обои из Wallpaper+' : 'Wallpaper+ Image'),
            preview: recMatch?.preview || mainWallpaper,
            full: mainWallpaper,
          };
          const updated = [newItem, ...prev].slice(0, 10);
          localStorage.setItem('linkerru_recent_ext_wallpapers', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [mainWallpaper, lang]);

  const handleInstallWallpaperPlus = (onFinished?: () => void) => {
    if (isDownloadingWallpaperPlus) return;
    playChime?.('click');
    setIsDownloadingWallpaperPlus(true);
    setDownloadProgress(0);
    setDownloadStatusText(lang === 'ru' ? 'Подключение к серверу...' : 'Connecting to server...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 12;
      if (progress < 40) {
        setDownloadStatusText(lang === 'ru' ? 'Загрузка 4K ресурсов Обои+...' : 'Downloading 4K Wallpaper+ assets...');
      } else if (progress < 80) {
        setDownloadStatusText(lang === 'ru' ? 'Распаковка библиотеки...' : 'Unpacking library...');
      } else if (progress < 100) {
        setDownloadStatusText(lang === 'ru' ? 'Регистрация манифеста...' : 'Registering manifest...');
      }

      if (progress >= 100) {
        progress = 100;
        setDownloadProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setIsDownloadingWallpaperPlus(false);
          setInstalledExtensions((prev) => {
            const next = Array.from(new Set([...prev, 'wallpaper-plus']));
            localStorage.setItem('linkerru_installed_extensions', JSON.stringify(next));
            return next;
          });
          playChime?.('victory');
          triggerToast?.(lang === 'ru' ? 'Расширение «Обои+» успешно установлено!' : '«Wallpaper+» extension installed!');
          onFinished?.();
        }, 300);
      } else {
        setDownloadProgress(progress);
      }
    }, 200);
  };

  const handleApplyExtWallpaper = (item: { id: string; name: string; preview: string; full: string }) => {
    onMainWallpaperChange(item.full);
    setRecentExtWallpapers((prev) => {
      const filtered = prev.filter((i) => i.full !== item.full && i.id !== item.id);
      const updated = [item, ...filtered].slice(0, 10);
      localStorage.setItem('linkerru_recent_ext_wallpapers', JSON.stringify(updated));
      return updated;
    });
    playChime?.('victory');
    triggerToast?.(lang === 'ru' ? 'Обои успешно применены!' : 'Wallpaper successfully applied!');
  };

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
        setActiveTab(isMobileLayout && initialTab === 'account' ? 'appearance' : initialTab);
      }
    }
  }, [isOpen, initialTab, isNarrow, isMobileLayout]);

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

  const [useDynamicTheme, setUseDynamicTheme] = useState(() => {
    return localStorage.getItem('linkerru_dynamic_theme') !== 'false';
  });

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
    return materialPalettes.find((p) => p.id === activePaletteId) || materialPalettes.find((p) => p.id === 'monochrome') || materialPalettes[0];
  }, [activePaletteId]);

  const backgrounds = useMemo(() => {
    const p1 = activePalette.primary;
    const p2 = activePalette.secondary;
    const p3 = activePalette.tertiary;

    if (theme === 'dark') {
      return [
        { id: 'none', name: 'None', style: `radial-gradient(ellipse at 50% -20%, color-mix(in srgb, ${p1} 22%, rgba(255, 255, 255, 0.12) 78%) 0%, transparent 65%), var(--bg)` },
        { id: 'gradient-1', name: 'Gradient 1', style: `radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.14) 0%, transparent 60%), linear-gradient(135deg, color-mix(in srgb, ${p1} 35%, #000 65%), color-mix(in srgb, ${p2} 25%, #000 75%), #060608)` },
        { id: 'gradient-2', name: 'Gradient 2', style: `radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.16) 0%, transparent 55%), radial-gradient(circle at 10% 20%, ${p2}40 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3}30 0%, transparent 50%), linear-gradient(135deg, ${p1}35, var(--bg))` },
        { id: 'gradient-3', name: 'Gradient 3', style: `radial-gradient(ellipse at 50% -10%, rgba(255, 255, 255, 0.18) 0%, transparent 60%), linear-gradient(to bottom right, ${p1}40 0%, transparent 100%), linear-gradient(to top right, ${p3}30 0%, transparent 100%), var(--bg)` },
        { id: 'gradient-4', name: 'Gradient 4', style: `radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.14) 0%, transparent 55%), conic-gradient(from 180deg at 50% 50%, ${p1}35 0deg, ${p2}25 120deg, ${p3}25 240deg, ${p1}35 360deg)` },
      ];
    }

    return [
      { id: 'none', name: 'None', style: 'var(--bg)' },
      { id: 'gradient-1', name: 'Gradient 1', style: `linear-gradient(135deg, ${p1}, ${p2}, ${p3})` },
      { id: 'gradient-2', name: 'Gradient 2', style: `radial-gradient(circle at 10% 20%, ${p2} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3} 0%, transparent 50%), linear-gradient(135deg, ${p1}, var(--bg))` },
      { id: 'gradient-3', name: 'Gradient 3', style: `linear-gradient(to bottom right, ${p1} 0%, transparent 100%), linear-gradient(to top right, ${p3} 0%, transparent 100%), var(--bg)` },
      { id: 'gradient-4', name: 'Gradient 4', style: `conic-gradient(from 180deg at 50% 50%, ${p1} 0deg, ${p2} 120deg, ${p3} 240deg, ${p1} 360deg)` },
    ];
  }, [activePalette, theme]);

  // Unified Wallpapers list: Recent items first, filled with Recommended items (no duplicates)
  const combinedWallpapers = useMemo(() => {
    const list: Array<{ id: string; name: string; category?: string; preview: string; full: string; isRecent: boolean }> = [];
    const seen = new Set<string>();

    for (const wp of recentExtWallpapers) {
      const key = wp.full || wp.id;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: wp.id,
          name: wp.name,
          category: wp.category || (lang === 'ru' ? 'Недавно' : 'Recent'),
          preview: wp.preview || wp.full,
          full: wp.full,
          isRecent: true,
        });
      }
    }

    for (const wp of RECOMMENDED_EXT_WALLPAPERS) {
      const key = wp.full || wp.id;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: wp.id,
          name: wp.name,
          category: wp.category,
          preview: wp.preview,
          full: wp.full,
          isRecent: false,
        });
      }
    }

    return list;
  }, [recentExtWallpapers, lang]);

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
          <LanguageSelector
            lang={lang}
            onLangChange={onLangChange}
            variant="compact"
            align="right"
          />
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
        className={`flex h-full w-full overflow-hidden bg-transparent ${isNarrow ? 'flex-col' : 'flex-row'}`}
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
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (val.trim() !== '') {
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
                {!isMobileLayout && (
                  <>
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
                  </>
                )}

                <span className="text-[10px] font-black tracking-widest text-[var(--on-surface-var)] uppercase pl-3 block mt-5 mb-2">
                  {lang === 'ru' ? (isMobileLayout ? 'Система' : 'Общие') : (isMobileLayout ? 'System' : 'General')}
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
                  onClick={() => selectTab('sound')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'sound' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-sound-btn"
                >
                  <Volume2 size={16} />
                  <span>{lang === 'ru' ? 'Звук и Уведомления' : 'Sound & Notifications'}</span>
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

                {!isMobileLayout && (
                  <>
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
                  </>
                )}

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

                {!isMobileLayout && (
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
                )}
              </div>

              {/* Developer branding in sidebar footer */}
              <div className="pt-4 border-t border-[var(--outline-var)] flex items-center justify-between text-[10px] font-black tracking-widest text-[var(--outline)] uppercase pl-1.5" id="sidebar-footer">
                <span>v1/262608</span>
                <span>stable</span>
              </div>
            </aside>

            {/* RIGHT MAIN CONTENT AREA — drill-down detail in narrow mode */}
            <main
              className={`flex-1 flex flex-col overflow-hidden bg-transparent h-full ${
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

                          {/* Glass Blur Row */}
                          <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                                <Sparkles size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Стеклянное размытие' : 'Glass Blur'}
                                </div>
                                <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  {lang === 'ru' ? 'Эффект матового стекла для карточек' : 'Frosted glass blur effect on cards'}
                                </div>
                              </div>
                            </div>
                            <SquashToggle
                              checked={isGlassBlur}
                              onChange={onGlassBlurToggle}
                              color={activePalette.primary}
                            />
                          </div>

                          {/* Main Wallpaper Row */}
                          {!isMobileLayout && (
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

                            {/* Standard Gradients Grid */}
                            <div className="grid grid-cols-5 gap-2 mt-1">
                              {backgrounds.map((bg) => (
                                <button
                                  key={bg.id}
                                  onClick={() => onMainWallpaperChange(bg.id)}
                                  className={`h-12 rounded-xl border-2 transition-all cursor-pointer ${mainWallpaper === bg.id ? 'border-[var(--accent)] scale-95 ring-2 ring-[var(--accent)]/20' : 'border-[var(--outline-var)] hover:border-[var(--outline)]'}`}
                                  style={{ background: bg.style }}
                                  title={bg.name}
                                />
                              ))}
                            </div>

                            {/* Single Unified Wallpapers Row (Recent + Recommended with uniform compact sizing) */}
                            <div className="flex flex-col gap-2 mt-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--on-surface)]">
                                  <Sparkles size={14} className="text-purple-500" />
                                  <span>
                                    {lang === 'ru'
                                      ? 'Недавно использованные и рекомендованные обои'
                                      : 'Recently used & recommended wallpapers'}
                                  </span>
                                </div>
                                {recentExtWallpapers.length > 0 && (
                                  <button
                                    onClick={() => {
                                      setRecentExtWallpapers([]);
                                      localStorage.removeItem('linkerru_recent_ext_wallpapers');
                                    }}
                                    className="text-[10px] font-bold text-[var(--on-surface-var)] hover:text-red-500 transition-colors cursor-pointer"
                                  >
                                    {lang === 'ru' ? 'Очистить историю' : 'Clear history'}
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                                {combinedWallpapers.map((wp) => {
                                  const isSelected = mainWallpaper === wp.full;
                                  return (
                                    <div
                                      key={wp.id}
                                      onClick={() => {
                                        if (!isWallpaperPlusInstalled && !wp.isRecent) {
                                          handleInstallWallpaperPlus(() => handleApplyExtWallpaper(wp));
                                        } else {
                                          handleApplyExtWallpaper(wp);
                                        }
                                      }}
                                      className={`group relative shrink-0 w-32 h-18 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                                        isSelected
                                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 scale-95'
                                          : 'border-[var(--outline-var)] hover:border-[var(--accent)] hover:scale-[1.02]'
                                      }`}
                                    >
                                      <img src={wp.preview} alt={wp.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-1.5 flex flex-col justify-end">
                                        <span className="text-[10px] font-extrabold text-white truncate drop-shadow">{wp.name}</span>
                                        <div className="flex items-center justify-between">
                                          {wp.category && (
                                            <span className="text-[8px] font-medium text-white/70 uppercase tracking-wider truncate max-w-[70px]">{wp.category}</span>
                                          )}
                                          {wp.isRecent && (
                                            <span className="text-[8px] font-bold text-amber-300 bg-black/40 px-1 rounded ml-auto">
                                              {lang === 'ru' ? 'Недавно' : 'Recent'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-sm">
                                          <Check size={10} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          )}
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

                            {/* Dynamic Theme Toggle */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-dim)] border border-[var(--outline-var)]">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Автоматическая тема из обоев' : 'Adaptive Theme from Wallpaper'}
                                </span>
                                <span className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  {lang === 'ru' ? 'Адаптировать акцентные цвета под текущие обои Wallpaper+' : 'Adapt accent colors to match the current Wallpaper+ background'}
                                </span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={useDynamicTheme}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    setUseDynamicTheme(val);
                                    localStorage.setItem('linkerru_dynamic_theme', String(val));
                                    if (val && materialPalettes.find(p => p.id === 'dynamic_wallpaper')) {
                                      onPaletteChange('dynamic_wallpaper');
                                    } else if (!val && activePaletteId === 'dynamic_wallpaper') {
                                      onPaletteChange('sage_khaki'); // fallback
                                    }
                                  }} 
                                />
                                <div className="w-9 h-5 bg-[var(--outline)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                              </label>
                            </div>

                            {/* Color Grid list */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3" id="theme-color-palette-grid">
                              {materialPalettes.map((palette) => {
                                if (palette.id === 'dynamic_wallpaper' && !useDynamicTheme) {
                                  return null;
                                }
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
                        {!isMobileLayout && (
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
                        )}

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

                          <LanguageSelector
                            lang={lang}
                            onLangChange={onLangChange}
                            variant="button"
                            align="right"
                            id="language-tab-switcher"
                          />
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
                              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                timeFormat === '24h' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                              }`}
                            >
                              24h
                            </button>
                            <button
                              onClick={() => onTimeFormatChange?.('12h')}
                              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                timeFormat === '12h' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                              }`}
                            >
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
                              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                tempUnit === 'C' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                              }`}
                            >
                              °C
                            </button>
                            <button
                              onClick={() => onTempUnitChange?.('F')}
                              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                tempUnit === 'F' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                              }`}
                            >
                              °F
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NOTIFICATIONS TAB CONTENT */}
                    {activeTab === 'notifications' && (
                      <div className="space-y-6" id="page-notifications-view">
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

                        {/* App Notifications Permissions List */}
                        <div className="space-y-3">
                          <div className="pl-1.5">
                            <h5 className="text-xs font-bold text-[var(--on-surface)]">
                              {lang === 'ru' ? 'Уведомления от приложений' : 'App Notifications'}
                            </h5>
                            <p className="text-[11px] text-[var(--on-surface-var)] mt-0.5">
                              {lang === 'ru'
                                ? 'Управляйте разрешениями на отправку уведомлений для внутренних приложений и расширений.'
                                : 'Manage notification permissions for internal apps and extensions.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { id: 'subconvert', name: 'Сабконверт', nameEn: 'SubConvert', Icon: Subtitles },
                              { id: 'weather', name: 'Погода', nameEn: 'Weather', Icon: CloudSun },
                              { id: 'lisyan', name: 'Lisyan Connect', nameEn: 'Lisyan Connect', Icon: MessageCircle },
                              { id: 'keeps', name: 'Заметки (Keeps)', nameEn: 'Notes (Keeps)', Icon: StickyNote },
                              { id: 'calculator', name: 'Калькулятор', nameEn: 'Calculator', Icon: Calculator },
                              { id: 'nexus', name: 'Nexus Game Box', nameEn: 'Nexus Game Box', Icon: Gamepad2 },
                              { id: 'extensions', name: 'Расширения', nameEn: 'Extensions', Icon: Blocks },
                            ].map((appItem) => {
                              const isAllowed = appNotifPermissions[appItem.id] !== 'denied';
                              const AppIcon = appItem.Icon;
                              return (
                                <div
                                  key={appItem.id}
                                  className="flex items-center justify-between p-3.5 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface-dim)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                                      <AppIcon size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-[var(--on-surface)]">
                                      {lang === 'ru' ? appItem.name : appItem.nameEn}
                                    </span>
                                  </div>
                                  <SquashToggle
                                    checked={isAllowed}
                                    onChange={() => {
                                      if (onAppNotifPermissionToggle) {
                                        onAppNotifPermissionToggle(appItem.id, !isAllowed);
                                      }
                                    }}
                                    color={activePalette.primary}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Device-Level System Notifications Section */}
                        <div className="p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-dim)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                                <Smartphone size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Системные уведомления устройства' : 'Device System Notifications'}
                                </div>
                                <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  {typeof window !== 'undefined' && 'Notification' in window
                                    ? Notification.permission === 'granted'
                                      ? (lang === 'ru' ? 'Разрешено в браузере' : 'Allowed in browser')
                                      : Notification.permission === 'denied'
                                      ? (lang === 'ru' ? 'Заблокировано в браузере' : 'Blocked in browser')
                                      : (lang === 'ru' ? 'Не запрошено' : 'Not requested')
                                    : (lang === 'ru' ? 'Не поддерживается' : 'Not supported')}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (typeof window !== 'undefined' && 'Notification' in window) {
                                  Notification.requestPermission();
                                }
                              }}
                              className="px-3.5 py-2 rounded-xl bg-[var(--surface-dim)] hover:bg-[var(--surface-bright)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface)] transition-all cursor-pointer"
                            >
                              {lang === 'ru' ? 'Настроить' : 'Configure'}
                            </button>
                          </div>
                          <p className="text-[11px] text-[var(--on-surface-var)] leading-normal pt-1 border-t border-[var(--outline-var)]/50">
                            {lang === 'ru'
                              ? 'Включение системных уведомлений устройства необязательно и никак не повлияет на стабильность и работу приложения.'
                              : 'Device notifications setting is optional and will not affect app stability or operation.'}
                          </p>
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
                    {activeTab === "toggles" && (
                    
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
                                    {TOGGLE_LABELS[id]?.[lang] || TOGGLE_LABELS[id]?.en || id}
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

                        {/* Disabled Components Section */}
                        <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold text-[var(--on-surface)]">
                              {lang === 'ru' ? 'Отключенные компоненты' : 'Disabled Components'}
                            </div>
                            <span className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase tabular-nums">
                              {isWeatherDisabled ? '1' : '0'}
                            </span>
                          </div>

                          <p className="text-[11px] text-[var(--on-surface-var)]">
                            {lang === 'ru'
                              ? 'Компоненты и виджеты, выключенные вручную. Вы можете повторно включить их отсюда.'
                              : 'Manually disabled components and widgets. You can re-enable them here.'}
                          </p>

                          {isWeatherDisabled ? (
                            <div className="flex items-center justify-between p-3.5 bg-[var(--surface-dim)] rounded-xl border border-[var(--outline-var)]">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                                  <CloudSun size={18} />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-[var(--on-surface)]">
                                    {lang === 'ru' ? 'Виджет погоды' : 'Weather Widget'}
                                  </div>
                                  <div className="text-[10px] text-[var(--on-surface-var)]">
                                    {lang === 'ru' ? 'Отображение погоды и температуры' : 'Weather and temperature display'}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (onWeatherDisabledToggle) {
                                    onWeatherDisabledToggle(false);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm cursor-pointer"
                              >
                                {lang === 'ru' ? 'Включить' : 'Enable'}
                              </button>
                            </div>
                          ) : (
                            <div className="p-4 bg-[var(--surface-dim)] rounded-xl border border-[var(--outline-var)] text-center text-xs text-[var(--on-surface-var)] font-medium">
                              {lang === 'ru' ? 'Нет отключенных компонентов' : 'No disabled components'}
                            </div>
                          )}
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
                    
                    {!isMobileLayout && activeTab === 'account' && (
                      <div className="space-y-6" id="page-account-view">
                        <AccountTabContent
                          lang={lang}
                          nickname={nickname}
                          onNicknameChange={onNicknameChange}
                          isAuthenticated={isAuthenticated}
                        />
                      </div>
                    )}

                        {/* About Tab View */}
                    {activeTab === 'about' && (
                      <div className="space-y-6" id="page-about-view">
                        <div className="p-6 bg-[var(--surface)] border border-[var(--outline-var)] rounded-3xl flex flex-col items-center justify-center text-center gap-4 py-10 shadow-sm">
                          <div
                            className={`w-20 h-20 rounded-full flex items-center justify-center p-3.5 drop-shadow-md border transition-all ${
                              theme === 'light'
                                ? 'bg-[var(--accent)] border-[var(--accent)]'
                                : 'bg-black border-[var(--outline-var)]'
                            }`}
                          >
                            <img 
                              src="https://github.com/user-attachments/assets/0964c230-e7dc-4cab-9983-1c2abe689206" 
                              alt="LinkerRu Logo" 
                              className={`w-full h-full object-contain ${
                                theme === 'light' ? 'brightness-0 invert' : 'brightness-0 invert'
                              }`} 
                            />
                          </div>
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

                          {/* GitHub Auto-Update Card */}
                          <div className="w-full p-4 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center shrink-0">
                                <RotateCw size={18} />
                              </div>
                              <div>
                                <div className="text-xs font-black text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Обновления из GitHub' : 'GitHub Auto-Updates'}
                                </div>
                                <div className="text-[11px] font-semibold text-[var(--on-surface-var)]">
                                  {lang === 'ru' ? 'Автоматическая перезагрузка и установка при выходе коммитов' : 'Auto-reloads and installs on new commits'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                type="button"
                                onClick={async () => {
                                  playChime('click');
                                  triggerToast?.(lang === 'ru' ? 'Проверка обновлений на GitHub...' : 'Checking GitHub for updates...');
                                  try {
                                    const res = await fetch(`https://api.github.com/repos/LisyanDEWS/LinkerLauncher/commits?per_page=1&_t=${Date.now()}`, {
                                      headers: { 'Accept': 'application/vnd.github+json' },
                                      cache: 'no-store',
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      if (Array.isArray(data) && data[0]?.sha) {
                                        const newSha = data[0].sha;
                                        const prevSha = localStorage.getItem('linkerru_last_commit_sha');
                                        if (prevSha && prevSha !== newSha) {
                                          let delayMs = 0;
                                          const dateStr = data[0].commit?.author?.date || data[0].commit?.committer?.date;
                                          if (dateStr) {
                                            const commitTimestamp = new Date(dateStr).getTime();
                                            if (!isNaN(commitTimestamp)) {
                                              const elapsed = Date.now() - commitTimestamp;
                                              const THREE_MINUTES_MS = 3 * 60 * 1000;
                                              if (elapsed < THREE_MINUTES_MS) {
                                                delayMs = THREE_MINUTES_MS - elapsed;
                                              }
                                            }
                                          }
                                          localStorage.setItem('linkerru_last_commit_sha', newSha);
                                          if (delayMs > 0) {
                                            const secLeft = Math.ceil(delayMs / 1000);
                                            triggerToast?.(lang === 'ru' ? `Найдено обновление. Установка через ${secLeft} сек...` : lang === 'uk' ? `Знайдено оновлення. Встановлення через ${secLeft} сек...` : `Update found. Installing in ${secLeft}s...`);
                                            setTimeout(() => {
                                              localStorage.setItem('linkerru_is_updating', 'true');
                                              window.location.reload();
                                            }, delayMs);
                                          } else {
                                            localStorage.setItem('linkerru_is_updating', 'true');
                                            window.location.reload();
                                          }
                                          return;
                                        }
                                        localStorage.setItem('linkerru_last_commit_sha', newSha);
                                      }
                                    }
                                    triggerToast?.(lang === 'ru' ? 'У вас установлена последняя версия!' : 'You have the latest version!');
                                  } catch {
                                    triggerToast?.(lang === 'ru' ? 'Система актуальна.' : 'System is up to date.');
                                  }
                                }}
                                className="px-3.5 py-1.5 rounded-full bg-[var(--accent)] text-[var(--on-accent)] text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                              >
                                <RotateCw size={13} />
                                {lang === 'ru' ? 'Проверить' : 'Check'}
                              </button>
                            </div>
                          </div>

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
                              {/* LinkerRoute Credit */}
                              <a 
                                href="https://gointospace.app/" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-3.5 bg-[var(--surface-dim)] hover:bg-[var(--surface)] border border-[var(--outline-var)] hover:border-[var(--accent)] rounded-2xl flex items-center gap-3 transition-all group"
                              >
                                <img 
                                  src="https://gointospace.app/assets/logo.webp" 
                                  alt="LinkerRoute" 
                                  className="w-8 h-8 rounded-lg object-contain bg-black/80 p-1 shrink-0" 
                                />
                                <div>
                                  <div className="text-xs font-black text-[var(--on-surface)] group-hover:text-[var(--accent)] transition-colors">
                                    LinkerRoute
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
  isAuthenticated
}: {
  lang: Language;
  nickname: string;
  onNicknameChange: (newNick: string) => void;
  isAuthenticated: boolean;
}) {
  const [nickInput, setNickInput] = useState(nickname);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      // If user is authenticated, we also update it in Firestore
      if (isAuthenticated && userAuth.currentUser) {
        const userDocRef = doc(userDb, 'users', userAuth.currentUser.uid);
        await updateDoc(userDocRef, {
          nickname: nickInput.trim(),
          updatedAt: Date.now()
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
      const user = userAuth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
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
      let errMsg = lang === 'ru' ? 'Ошибка изменения пароля' : 'Failed to update password';
      if (err.code === 'auth/requires-recent-login') {
        errMsg = lang === 'ru' 
          ? 'Для изменения пароля требуется выйти и войти заново.' 
          : 'This operation is sensitive and requires recent authentication. Please log out and log back in.';
      }
      setMessage({
        type: 'error',
        text: errMsg
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
          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--on-surface)] p-0.5 shadow-sm">
            <div className="h-full w-full rounded-full bg-[var(--surface)] flex items-center justify-center">
              <User size={20} className="text-[var(--on-surface-var)]" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-[var(--on-surface)] leading-tight">
              {isAuthenticated ? nickname : (lang === 'ru' ? 'Гостевой аккаунт' : 'Guest Account')}
            </h4>
            <p className="text-[11px] text-[var(--on-surface-var)] font-semibold mt-0.5">
              {isAuthenticated ? userAuth.currentUser?.email : 'guest@linker.os'}
            </p>
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

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { getGreeting } from '../data/greetings';
import { LogoWithLoader } from './LogoWithLoader';
import {
  Sun,
  Moon,
  Clock,
  Calendar as CalendarIcon,
  CloudSun,
  Settings,
  History,
  Globe,
  Lightbulb,
  Bot,
  Bell,
  Monitor,
  Search,
  Sparkles,
  Zap,
  ArrowUpRight,
  Battery,
  BatteryCharging,
  Languages,
  Volume2,
  Contrast,
} from 'lucide-react';
import { Language, ThemeMode, Material3Palette } from '../types';

/**
 * NextGenHome — a next-generation home screen for LinkerRu:Re.
 *
 * Design language:
 *  - Glassmorphic bento grid with depth and soft shadows
 *  - Animated aurora background driven by the active palette
 *  - Choreographed stagger entrance
 *  - Micro-interactions (hover lift, glow, magnetic feel)
 *  - Fully theme-aware (light/dark) via existing CSS variables
 *  - i18n (ru/en)
 *
 * The component is presentational: all actions are delegated to the parent
 * via the `NextGenHomeProps` callbacks so it can be dropped in without
 * touching business logic.
 */

export interface NextGenHomeProps {
  lang: Language;
  theme: ThemeMode;
  nickname: string;
  activePalette: Material3Palette;
  notifications: { id: string; title: string; message: string; read: boolean }[];
  battery: { level: number | null; charging: boolean | null };
  weather: { temp: number | null; code: number | null; city: string };
  // Toggles for quick-settings strip
  isSoundEnabled: boolean;
  isContrast: boolean;
  // Actions
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onToggleSound: () => void;
  onToggleContrast: () => void;
  onOpenClock: () => void;
  onOpenCalendar: () => void;
  onOpenWeather: () => void;
  onOpenServer: () => void;
  onOpenAgno: () => void;
  onOpenLisyan: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenChangelog: () => void;
  onOpenProfile: () => void;
  onSearch: (query: string) => void;
  isOptimizedEngine?: boolean;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const Grain = () => (
  <div 
    className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-multiply"
    style={{
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`
    }}
  />
);

export function NextGenHome(props: NextGenHomeProps) {
  const {
    lang,
    theme,
    nickname,
    activePalette,
    notifications,
    battery,
    weather,
    isSoundEnabled,
    isContrast,
    onToggleTheme,
    onToggleLang,
    onToggleSound,
    onToggleContrast,
    onOpenClock,
    onOpenCalendar,
    onOpenWeather,
    onOpenServer,
    onOpenAgno,
    onOpenLisyan,
    onOpenNotifications,
    onOpenSettings,
    onOpenChangelog,
    onOpenProfile,
    onSearch,
    isOptimizedEngine = false,
  } = props;

  const isDark = theme === 'dark';
  const t = useMemo(() => ({
    subtitle: lang === 'ru' ? 'Ваше единое цифровое пространство' : 'Your unified digital space',
    search: lang === 'ru' ? 'Поиск виджетов, приложений и ссылок…' : 'Search widgets, apps and links…',
    quickSettings: lang === 'ru' ? 'Быстрые настройки' : 'Quick settings',
    theme: lang === 'ru' ? (isDark ? 'Тёмная' : 'Светлая') : isDark ? 'Dark' : 'Light',
    lang_label: lang === 'ru' ? 'Русский' : 'English',
    sound: lang === 'ru' ? 'Звук' : 'Sound',
    contrast: lang === 'ru' ? 'Контраст' : 'Contrast',
    notifications: lang === 'ru' ? 'Уведомления' : 'Notifications',
    settings: lang === 'ru' ? 'Настройки' : 'Settings',
    profile: lang === 'ru' ? 'Профиль' : 'Profile',
    proxy: lang === 'ru' ? 'Прокси-хаб' : 'Proxy Hub',
    proxyDesc: lang === 'ru' ? 'Выберите сервер и маршрут трафика' : 'Pick a server and route your traffic',
    agno: lang === 'ru' ? 'Agno GPT' : 'Agno GPT',
    agnoDesc: lang === 'ru' ? 'ИИ-ассистент на базе OpenAI' : 'AI assistant powered by OpenAI',
    lisyan: lang === 'ru' ? 'Lisyan Connect' : 'Lisyan Connect',
    lisyanDesc: lang === 'ru' ? 'P2P-передача файлов без ограничений' : 'Limitless P2P file transfer',
    clock: lang === 'ru' ? 'Часы' : 'Clock',
    calendar: lang === 'ru' ? 'Календарь' : 'Calendar',
    weather: lang === 'ru' ? 'Погода' : 'Weather',
    changelog: lang === 'ru' ? 'Журнал изменений' : 'Changelog',
    open: lang === 'ru' ? 'Открыть' : 'Open',
    unread: lang === 'ru' ? 'непрочитанных' : 'unread',
    online: lang === 'ru' ? 'Онлайн' : 'Online',
    version: 'v1/262608',
    greeting: getGreeting(nickname, lang),
  }), [lang, isDark, nickname]);

  // Live clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const unread = notifications.filter(n => !n.read).length;

  // Search state
  const [query, setQuery] = useState('');

  // Aurora background derived from palette
  const aurora = useMemo(() => {
    const p1 = activePalette.primary;
    const p2 = activePalette.secondary;
    const p3 = activePalette.tertiary;
    return {
      '--aurora-1': p1,
      '--aurora-2': p2,
      '--aurora-3': p3,
    } as React.CSSProperties;
  }, [activePalette]);

  const glassSurface: React.CSSProperties = isDark
    ? {
        background: 'linear-gradient(to bottom, #1a1c18, #111310)',
        boxShadow: `
          0 45px 85px -20px rgba(0, 0, 0, 0.6),
          0 16px 32px -8px rgba(0, 0, 0, 0.4),
          inset 0 1px 1px rgba(255, 255, 255, 0.05),
          inset 0 -2px 4px rgba(0, 0, 0, 0.4)
        `,
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }
    : {
        background: 'linear-gradient(to bottom, #fcfaf7, #ece8de)',
        boxShadow: `
          0 45px 85px -20px rgba(40, 30, 10, 0.35),
          0 16px 32px -8px rgba(40, 30, 10, 0.15),
          inset 0 2px 1px rgba(255, 255, 255, 0.9),
          inset 0 -4px 8px rgba(60, 50, 30, 0.12)
        `,
        border: '1px solid rgba(255, 255, 255, 0.8)',
      };

  // Stagger entrance variants
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  return (
    <div
      style={aurora}
      className="relative min-h-screen w-full overflow-hidden font-sans text-[var(--on-surface)] transition-colors duration-500"
    >
      <Grain />
      {/* === AURORA BACKGROUND === */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {isOptimizedEngine ? (
          <>
            <div
              aria-hidden
              className="absolute -top-1/3 -left-1/4 h-[80vh] w-[80vh] rounded-full blur-[120px]"
              style={{
                background: 'radial-gradient(circle, var(--aurora-1) 0%, transparent 60%)',
                opacity: isDark ? 0.35 : 0.5,
              }}
            />
            <div
              aria-hidden
              className="absolute top-1/4 -right-1/4 h-[70vh] w-[70vh] rounded-full blur-[120px]"
              style={{
                background: 'radial-gradient(circle, var(--aurora-2) 0%, transparent 60%)',
                opacity: isDark ? 0.3 : 0.45,
              }}
            />
            <div
              aria-hidden
              className="absolute -bottom-1/4 left-1/3 h-[60vh] w-[60vh] rounded-full blur-[120px]"
              style={{
                background: 'radial-gradient(circle, var(--aurora-3) 0%, transparent 60%)',
                opacity: isDark ? 0.25 : 0.4,
              }}
            />
          </>
        ) : (
          <>
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: isDark ? 0.35 : 0.5 }}
              transition={{ duration: 1.2 }}
              className="absolute -top-1/3 -left-1/4 h-[80vh] w-[80vh] rounded-full blur-[120px]"
              style={{ background: 'radial-gradient(circle, var(--aurora-1) 0%, transparent 60%)' }}
            />
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: isDark ? 0.3 : 0.45, x: [0, 40, 0], y: [0, -30, 0] }}
              transition={{ opacity: { duration: 1.2 }, x: { duration: 18, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 22, repeat: Infinity, ease: 'easeInOut' } }}
              className="absolute top-1/4 -right-1/4 h-[70vh] w-[70vh] rounded-full blur-[120px]"
              style={{ background: 'radial-gradient(circle, var(--aurora-2) 0%, transparent 60%)' }}
            />
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: isDark ? 0.25 : 0.4, x: [0, -30, 0], y: [0, 40, 0] }}
              transition={{ opacity: { duration: 1.2 }, x: { duration: 26, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 20, repeat: Infinity, ease: 'easeInOut' } }}
              className="absolute -bottom-1/4 left-1/3 h-[60vh] w-[60vh] rounded-full blur-[120px]"
              style={{ background: 'radial-gradient(circle, var(--aurora-3) 0%, transparent 60%)' }}
            />
          </>
        )}
        {/* Subtle grain */}
        <div className={`absolute inset-0 bg-[radial-gradient(${isDark ? '#3f3f46' : '#e5e5e5'}_1px,transparent_1px)] [background-size:18px_18px] opacity-40`} />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8"
      >
        {/* === TOP BAR === */}
        <motion.header variants={item} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--outline)] shadow-sm"
              style={{ background: 'var(--surface)' }}
            >
              <Sparkles size={18} style={{ color: activePalette.primary }} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-var)]">
                LinkerRu <span className="opacity-50">:Re</span>
              </span>
              <span className="text-xs font-bold text-[var(--on-surface)]">{t.online}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenNotifications}
              aria-label={t.notifications}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--outline)] text-[var(--on-surface-var)] transition-colors hover:text-[var(--on-surface)]"
              style={{ background: 'var(--surface)' }}
            >
              <Bell size={18} />
              {unread > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black text-white shadow"
                  style={{ background: activePalette.primary }}
                >
                  {unread}
                </span>
              )}
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSettings}
              aria-label={t.settings}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--outline)] text-[var(--on-surface-var)] transition-colors hover:text-[var(--on-surface)]"
              style={{ background: 'var(--surface)' }}
            >
              <Settings size={18} />
            </motion.button>

            {/* Profile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenProfile}
              aria-label={t.profile}
              className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--outline)] px-2 pr-3 transition-colors"
              style={{ background: 'var(--surface)' }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black text-white"
                style={{ background: activePalette.primary }}
              >
                {nickname.charAt(0).toUpperCase()}
              </div>
              <span className="hidden text-xs font-bold text-[var(--on-surface)] sm:inline">@{nickname}</span>
            </motion.button>
          </div>
        </motion.header>

        {/* === HERO: GREETING + OMNIBOX === */}
        <motion.section variants={item} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7, ease: easeOut }}
              className="text-4xl font-black tracking-tighter md:text-6xl"
            >
              {t.greeting}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7, ease: easeOut }}
              className="text-sm font-semibold text-[var(--on-surface-var)] md:text-base"
            >
              {t.subtitle}
            </motion.p>
          </div>

          {/* Omnibox */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl">
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all focus-within:scale-[1.01]"
              style={glassSurface}
            >
              <Search size={18} className="shrink-0 text-[var(--on-surface-var)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search}
                className="w-full border-none bg-transparent text-sm font-medium outline-none placeholder:text-[var(--on-surface-var)]/60"
              />
              <kbd className="hidden shrink-0 rounded-md border border-[var(--outline)] bg-[var(--surface-dim)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--on-surface-var)] sm:inline">
                ↵
              </kbd>
            </div>
          </form>
        </motion.section>

        {/* === QUICK SETTINGS STRIP === */}
        <motion.section variants={item} className="flex flex-wrap gap-2">
          <QuickToggle active={isDark} activeColor={activePalette.primary} icon={isDark ? <Moon size={15} /> : <Sun size={15} />} label={t.theme} onClick={onToggleTheme} />
          <QuickToggle active={lang === 'ru'} activeColor={activePalette.primary} icon={<Languages size={15} />} label={t.lang_label} onClick={onToggleLang} />
          <QuickToggle active={isSoundEnabled} activeColor={activePalette.primary} icon={<Volume2 size={15} />} label={t.sound} onClick={onToggleSound} />
          <QuickToggle active={isContrast} activeColor={activePalette.primary} icon={<Contrast size={15} />} label={t.contrast} onClick={onToggleContrast} />
        </motion.section>

        {/* === BENTO GRID === */}
        <motion.main variants={item} className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {/* FEATURE TILE: Lisyan Connect (large) */}
          <BentoTile
            className="col-span-2 row-span-2 lg:col-span-3 lg:row-span-2"
            style={glassSurface}
            onClick={onOpenLisyan}
            accent={activePalette.primary}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border overflow-hidden transition-colors bg-black border-white/10`}>
                  <LogoWithLoader 
                    src="https://github.com/user-attachments/assets/21000db8-96f5-4673-867f-efaa8e98b55e" 
                    alt="Lisyan Connect" 
                    className="w-8 h-8 object-contain brightness-0 invert" 
                  />
                </div>
                <StatusDot color={activePalette.primary} />
              </div>
              <div className="mt-6">
                <h3 className="text-2xl font-black tracking-tight md:text-3xl">{t.lisyan}</h3>
                <p className="mt-1.5 max-w-xs text-sm font-semibold text-[var(--on-surface-var)]">{t.lisyanDesc}</p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white" style={{ background: activePalette.primary }}>
                  {t.open} <ArrowUpRight size={12} />
                </span>
                <PulseRing color={activePalette.primary} />
              </div>
            </div>
          </BentoTile>

          {/* LIVE CLOCK TILE */}
          <BentoTile className="col-span-2 lg:col-span-3" style={glassSurface} onClick={onOpenClock} accent={activePalette.primary}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--outline)]" style={{ background: 'var(--surface)' }}>
                  <Clock size={18} style={{ color: activePalette.primary }} />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)]">{t.clock}</span>
                  <span className="text-2xl font-black tabular-nums tracking-tight">{timeStr}</span>
                </div>
              </div>
              <span className="hidden text-right text-[11px] font-bold text-[var(--on-surface-var)] sm:block">{dateStr}</span>
            </div>
          </BentoTile>

          {/* AGNO GPT */}
          <BentoTile className="col-span-2 lg:col-span-2" style={glassSurface} onClick={onOpenAgno} accent={activePalette.primary}>
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--outline)]" style={{ background: 'var(--surface)' }}>
                  <Bot size={18} style={{ color: activePalette.primary }} />
                </div>
                <Sparkles size={16} className="text-[var(--on-surface-var)]" />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-black tracking-tight">{t.agno}</h3>
                <p className="mt-1 text-xs font-semibold text-[var(--on-surface-var)]">{t.agnoDesc}</p>
              </div>
            </div>
          </BentoTile>

          {/* PROXY HUB */}
          <BentoTile className="col-span-2 lg:col-span-2" style={glassSurface} onClick={onOpenServer} accent={activePalette.primary}>
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--outline)]" style={{ background: 'var(--surface)' }}>
                  <Globe size={18} style={{ color: activePalette.primary }} />
                </div>
                <Lightbulb size={16} style={{ color: activePalette.primary }} />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-black tracking-tight">{t.proxy}</h3>
                <p className="mt-1 text-xs font-semibold text-[var(--on-surface-var)]">{t.proxyDesc}</p>
              </div>
            </div>
          </BentoTile>

          {/* WEATHER */}
          <BentoTile className="col-span-1 lg:col-span-2" style={glassSurface} onClick={onOpenWeather} accent={activePalette.primary}>
            <div className="flex h-full flex-col justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--outline)]" style={{ background: 'var(--surface)' }}>
                <CloudSun size={18} style={{ color: activePalette.primary }} />
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)]">{t.weather}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tabular-nums tracking-tight">{weather.temp ?? '--'}°</span>
                </div>
                <span className="text-[11px] font-bold text-[var(--on-surface-var)]">{weather.city}</span>
              </div>
            </div>
          </BentoTile>

          {/* CALENDAR */}
          <BentoTile className="col-span-1 lg:col-span-1" style={glassSurface} onClick={onOpenCalendar} accent={activePalette.primary}>
            <div className="flex h-full flex-col justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--outline)]" style={{ background: 'var(--surface)' }}>
                <CalendarIcon size={18} style={{ color: activePalette.primary }} />
              </div>
              <div className="mt-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)]">{t.calendar}</span>
                <span className="block text-2xl font-black tabular-nums leading-none">{now.getDate()}</span>
              </div>
            </div>
          </BentoTile>

          {/* BATTERY / SYSTEM */}
          <BentoTile className="col-span-2 lg:col-span-2" style={glassSurface} onClick={onOpenSettings} accent={activePalette.primary}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--outline)]" style={{ background: 'var(--surface)' }}>
                  {battery.charging ? <BatteryCharging size={18} style={{ color: activePalette.primary }} /> : <Battery size={18} style={{ color: activePalette.primary }} />}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)]">{lang === 'ru' ? 'Питание' : 'Power'}</span>
                  <span className="text-xl font-black tabular-nums">{battery.level !== null ? Math.round(battery.level * 100) : '--'}%</span>
                </div>
              </div>
              {battery.charging && (
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }} className="text-[10px] font-black uppercase tracking-wider" style={{ color: activePalette.primary }}>
                  <Zap size={14} className="inline" /> {lang === 'ru' ? 'Заряд' : 'Charging'}
                </motion.span>
              )}
            </div>
          </BentoTile>

          {/* CHANGELOG */}
          <BentoTile className="col-span-2 lg:col-span-2" style={glassSurface} onClick={onOpenChangelog} accent={activePalette.primary}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--outline)]" style={{ background: 'var(--surface)' }}>
                  <History size={18} style={{ color: activePalette.primary }} />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)]">{t.changelog}</span>
                  <span className="text-base font-black">{t.version}</span>
                </div>
              </div>
              <ArrowUpRight size={16} className="text-[var(--on-surface-var)]" />
            </div>
          </BentoTile>
        </motion.main>

        {/* === FOOTER === */}
        <motion.footer variants={item} className="mt-auto flex items-center justify-between pt-4 text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)] opacity-60">
          <span>&copy; 2026 LinkerRu &middot; :Re</span>
          <span className="hidden sm:inline">NextGen Home · v1</span>
        </motion.footer>
      </motion.div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function BentoTile({
  children,
  className,
  style,
  onClick,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  accent?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -12, scale: 1.01, transition: { duration: 0.5, ease: [0.6, 0, 0.2, 1] } }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl p-5 transition-shadow ${className ?? ''}`}
      style={style}
    >
      {/* Accent glow on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1px ${accent}40, 0 0 40px -10px ${accent}60` }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

function QuickToggle({
  active,
  activeColor,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  activeColor: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-2 rounded-2xl border border-[var(--outline)] px-3 py-2 text-[11px] font-bold transition-colors"
      style={{
        background: active ? activeColor : 'var(--surface)',
        color: active ? '#ffffff' : 'var(--on-surface-var)',
        borderColor: active ? activeColor : 'var(--outline)',
      }}
    >
      {icon}
      <span className="uppercase tracking-wider">{label}</span>
    </motion.button>
  );
}

function StatusDot({ color }: { color: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-[var(--outline)] bg-[var(--surface)] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      Live
    </span>
  );
}

function PulseRing({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <motion.span
        animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inline-flex h-full w-full rounded-full"
        style={{ background: color }}
      />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: color }} />
    </span>
  );
}

/* ---------- i18n helpers ---------- */

function greetRu(nick: string): string {
  const h = new Date().getHours();
  if (h < 5) return `Доброй ночи, @${nick}`;
  if (h < 12) return `Доброе утро, @${nick}`;
  if (h < 18) return `Добрый день, @${nick}`;
  return `Добрый вечер, @${nick}`;
}

function greetEn(nick: string): string {
  const h = new Date().getHours();
  if (h < 5) return `Good night, @${nick}`;
  if (h < 12) return `Good morning, @${nick}`;
  if (h < 18) return `Good afternoon, @${nick}`;
  return `Good evening, @${nick}`;
}

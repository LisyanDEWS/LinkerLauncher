import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Settings as SettingsIcon,
  Monitor,
  Bot,
  Globe,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  CloudSun,
  History,
  Battery,
  BatteryCharging,
  ArrowRight,
  Search,
  Plus,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { Language, ThemeMode, Material3Palette } from '../types';

/**
 * ExpressiveHome — M3 Expressive platform launcher (v3).
 *
 * Design philosophy:
 *   This is NOT a bento grid. It is an organized OS-style launcher built for
 *   a platform that hosts multiple apps (messenger, proxy, AI, P2P, tools).
 *
 *   - Status bar: minimal system info (time, weather, battery, notifs)
 *   - Now card: a single focal "what's next" card with a contextual action
 *   - App sections: apps grouped by category (Communication / Intelligence /
 *     Tools / System) — not dumped into one grid
 *   - Dock: 4 primary pinned apps, always reachable
 *   - M3 Expressive: oversized display type, large soft shapes, spring physics
 *     with overshoot, shape morphing on press, bold accent usage
 *
 * Like NextGenHome, this is fully presentational — all actions are props.
 */

export interface ExpressiveHomeProps {
  lang: Language;
  theme: ThemeMode;
  nickname: string;
  activePalette: Material3Palette;
  notifications: { id: string; title: string; message: string; read: boolean }[];
  battery: { level: number | null; charging: boolean | null };
  // Actions
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
  onOpenHomePicker: () => void;
  onSearch: (q: string) => void;
}

const spring = { type: 'spring' as const, damping: 18, stiffness: 280 };
const springSoft = { type: 'spring' as const, damping: 24, stiffness: 220 };
const easeOut = [0.16, 1, 0.3, 1] as const;

export function ExpressiveHome(props: ExpressiveHomeProps) {
  const {
    lang,
    theme,
    nickname,
    activePalette,
    notifications,
    battery,
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
    onOpenHomePicker,
    onSearch,
  } = props;

  const isDark = theme === 'dark';
  const isRu = lang === 'ru';
  const accent = activePalette.primary;
  const unread = notifications.filter((n) => !n.read).length;

  const t = useMemo(
    () => ({
      greeting: isRu ? greetRu(nickname) : greetEn(nickname),
      subtitle: isRu ? 'Платформа готова к работе' : 'Platform ready',
      search: isRu ? 'Найти приложение…' : 'Find an app…',
      now: isRu ? 'Сейчас' : 'Now',
      nowAction: isRu ? 'Открыть Agno GPT' : 'Open Agno GPT',
      nowHint: isRu ? 'Продолжить диалог с ИИ-ассистентом' : 'Continue chatting with your AI assistant',
      sections: {
        comm: isRu ? 'Коммуникации' : 'Communication',
        intel: isRu ? 'Интеллект' : 'Intelligence',
        tools: isRu ? 'Инструменты' : 'Tools',
        system: isRu ? 'Система' : 'System',
      },
      apps: {
        lisyan: isRu ? 'Lisyan Connect' : 'Lisyan Connect',
        lisyanSub: isRu ? 'P2P-передача файлов' : 'P2P file transfer',
        messenger: isRu ? 'Мессенджер' : 'Messenger',
        messengerSub: isRu ? 'Скоро' : 'Coming soon',
        agno: isRu ? 'Agno GPT' : 'Agno GPT',
        agnoSub: isRu ? 'ИИ-ассистент' : 'AI assistant',
        clock: isRu ? 'Часы' : 'Clock',
        calendar: isRu ? 'Календарь' : 'Calendar',
        weather: isRu ? 'Погода' : 'Weather',
        proxy: isRu ? 'Прокси-хаб' : 'Proxy Hub',
        proxySub: isRu ? 'Маршрутизация трафика' : 'Traffic routing',
        settings: isRu ? 'Настройки' : 'Settings',
        changelog: isRu ? 'Журнал' : 'Changelog',
      },
      dock: isRu ? 'Док' : 'Dock',
      comingSoon: isRu ? 'Скоро' : 'Soon',
    }),
    [isRu, nickname],
  );

  // Live clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString(isRu ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  const [query, setQuery] = useState('');
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  // App definitions grouped by section
  const sections: {
    key: string;
    label: string;
    apps: AppDef[];
  }[] = [
    {
      key: 'comm',
      label: t.sections.comm,
      apps: [
        { id: 'lisyan', icon: <img src="https://github.com/user-attachments/assets/21000db8-96f5-4673-867f-efaa8e98b55e" alt="Lisyan" className="w-6.5 h-6.5 object-contain" />, label: t.apps.lisyan, sub: t.apps.lisyanSub, onClick: onOpenLisyan, accent: true, status: 'live' },
        { id: 'messenger', icon: <MessageSquare size={26} />, label: t.apps.messenger, sub: t.apps.messengerSub, onClick: () => {}, disabled: true, badge: t.comingSoon },
      ],
    },
    {
      key: 'intel',
      label: t.sections.intel,
      apps: [
        { id: 'agno', icon: <Bot size={26} />, label: t.apps.agno, sub: t.apps.agnoSub, onClick: onOpenAgno, accent: true, status: 'live' },
      ],
    },
    {
      key: 'tools',
      label: t.sections.tools,
      apps: [
        { id: 'clock', icon: <ClockIcon size={26} />, label: t.apps.clock, sub: timeStr, onClick: onOpenClock },
        { id: 'calendar', icon: <CalendarIcon size={26} />, label: t.apps.calendar, sub: dateStr, onClick: onOpenCalendar },
        { id: 'weather', icon: <CloudSun size={26} />, label: t.apps.weather, sub: isRu ? 'Открыть' : 'Open', onClick: onOpenWeather },
      ],
    },
    {
      key: 'system',
      label: t.sections.system,
      apps: [
        { id: 'proxy', icon: <Globe size={26} />, label: t.apps.proxy, sub: t.apps.proxySub, onClick: onOpenServer, status: 'live' },
        { id: 'settings', icon: <SettingsIcon size={26} />, label: t.apps.settings, sub: isRu ? 'Настроить' : 'Configure', onClick: onOpenSettings },
        { id: 'changelog', icon: <History size={26} />, label: t.apps.changelog, sub: 'v1/262608', onClick: onOpenChangelog },
      ],
    },
  ];

  // Dock apps (primary, always visible)
  const dockApps: AppDef[] = [
    { id: 'lisyan', icon: <img src="https://github.com/user-attachments/assets/21000db8-96f5-4673-867f-efaa8e98b55e" alt="Lisyan" className="w-6 h-6 object-contain" />, label: t.apps.lisyan, onClick: onOpenLisyan },
    { id: 'agno', icon: <Bot size={24} />, label: t.apps.agno, onClick: onOpenAgno },
    { id: 'proxy', icon: <Globe size={24} />, label: t.apps.proxy, onClick: onOpenServer },
    { id: 'settings', icon: <SettingsIcon size={24} />, label: t.apps.settings, onClick: onOpenSettings },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans text-[var(--on-surface)] transition-colors duration-500">
      {/* === M3 EXPRESSIVE BACKGROUND === */}
      {/* Bold accent-tinted gradient field, not a subtle aurora */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? `radial-gradient(ellipse 80% 50% at 50% 0%, ${accent}18 0%, transparent 60%), var(--bg)`
              : `radial-gradient(ellipse 80% 50% at 50% 0%, ${accent}15 0%, transparent 60%), var(--bg)`,
          }}
        />
        <div
          className="absolute -bottom-32 left-1/2 h-[40vh] w-[120vw] -translate-x-1/2 rounded-[50%] blur-[80px] opacity-30"
          style={{ background: accent }}
        />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-5 md:px-8 md:py-6">
        {/* === STATUS BAR === */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mb-6 flex items-center justify-between gap-3"
        >
          {/* Left: time + date */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenClock}
              className="flex items-center gap-2 rounded-full border border-[var(--outline)] bg-[var(--surface)] px-3.5 py-2 transition-colors hover:bg-[var(--surface-dim)] cursor-pointer"
            >
              <span className="text-sm font-black tabular-nums tracking-tight">{timeStr}</span>
              <span className="hidden text-[11px] font-bold text-[var(--on-surface-var)] sm:inline">{dateStr}</span>
            </button>
          </div>

          {/* Right: system indicators */}
          <div className="flex items-center gap-2">
            {/* Battery */}
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--outline)] bg-[var(--surface)] px-3 py-2">
              {battery.charging ? (
                <BatteryCharging size={14} style={{ color: accent }} />
              ) : (
                <Battery size={14} className="text-[var(--on-surface-var)]" />
              )}
              <span className="text-[11px] font-black tabular-nums">
                {battery.level !== null ? Math.round(battery.level * 100) : '--'}%
              </span>
            </div>

            {/* Notifications */}
            <button
              onClick={onOpenNotifications}
              aria-label={isRu ? 'Уведомления' : 'Notifications'}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-colors hover:text-[var(--on-surface)] cursor-pointer"
            >
              <Bell size={16} />
              {unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={spring}
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-black text-white"
                  style={{ background: accent }}
                >
                  {unread}
                </motion.span>
              )}
            </button>

            {/* Profile */}
            <button
              onClick={onOpenProfile}
              aria-label={isRu ? 'Профиль' : 'Profile'}
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white"
              style={{ background: accent }}
            >
              {nickname.charAt(0).toUpperCase()}
            </button>
          </div>
        </motion.header>

        {/* === HERO: GREETING + SEARCH === */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: easeOut }}
          className="mb-6 flex flex-col gap-4"
        >
          {/* M3 Expressive: oversized display type */}
          <div>
            <h1 className="text-4xl font-black leading-[0.95] tracking-tighter md:text-6xl">
              {t.greeting}
            </h1>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.15em] text-[var(--on-surface-var)]">
              {t.subtitle}
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-full max-w-xl">
            <motion.div
              whileFocus={{ scale: 1.01 }}
              className="flex items-center gap-3 rounded-full border border-[var(--outline)] bg-[var(--surface)] px-5 py-3.5 shadow-sm transition-colors focus-within:border-[var(--accent)]"
            >
              <Search size={18} className="shrink-0 text-[var(--on-surface-var)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search}
                className="w-full border-none bg-transparent text-sm font-medium outline-none placeholder:text-[var(--on-surface-var)]/60"
              />
            </motion.div>
          </form>
        </motion.section>

        {/* === NOW CARD (focal point) === */}
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, ...spring }}
          className="mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onOpenAgno}
            className="relative w-full overflow-hidden rounded-[2rem] p-6 text-left cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${activePalette.tertiary || accent} 100%)`,
              color: '#ffffff',
              boxShadow: `0 20px 50px -15px ${accent}80`,
            }}
          >
            {/* Decorative shape */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-[50%] bg-white/5" />

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                  {t.now}
                </span>
                <span className="text-xl font-black tracking-tight md:text-2xl">
                  {t.nowAction}
                </span>
                <span className="text-xs font-semibold opacity-80">{t.nowHint}</span>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <ArrowRight size={24} />
              </div>
            </div>
          </motion.button>
        </motion.section>

        {/* === APP SECTIONS === */}
        <div className="flex-1 flex flex-col gap-6">
          {sections.map((section, si) => (
            <motion.section
              key={section.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + si * 0.08, duration: 0.5, ease: easeOut }}
            >
              {/* Section label */}
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-var)]">
                  {section.label}
                </h2>
                <div className="h-px flex-1 bg-[var(--outline)]" />
              </div>
              {/* App row */}
              <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {section.apps.map((app, ai) => (
                  <React.Fragment key={app.id}>
                    <AppTile app={app} accent={accent} index={ai} />
                  </React.Fragment>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* === DOCK === */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, ...springSoft }}
          className="mt-8 sticky bottom-4 z-20"
        >
          <div className="mx-auto flex max-w-md items-center justify-between gap-2 rounded-[2rem] border border-[var(--outline)] bg-[var(--surface)] p-2.5 shadow-2xl">
            {dockApps.map((app) => (
              <React.Fragment key={app.id}>
                <DockButton app={app} accent={accent} />
              </React.Fragment>
            ))}
            {/* Home picker button */}
            <button
              onClick={onOpenHomePicker}
              aria-label={isRu ? 'Сменить дизайн дома' : 'Switch home design'}
              title={isRu ? 'Сменить дизайн дома' : 'Switch home design'}
              className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] text-[var(--on-surface-var)] transition-colors hover:bg-[var(--container)] hover:text-[var(--on-surface)] cursor-pointer"
            >
              <Plus size={22} />
            </button>
          </div>
        </motion.section>

        {/* === HOME PICKER FLOATING BUTTON (top-level, always visible) === */}
        <button
          onClick={onOpenHomePicker}
          className="fixed left-5 top-5 z-[90] flex items-center gap-1.5 rounded-full border border-[var(--outline)] bg-[var(--surface)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] shadow-md hover:text-[var(--on-surface)] transition-colors cursor-pointer"
        >
          <Sparkles size={11} />
          Expressive
        </button>
      </div>
    </div>
  );
}

/* ---------- Types ---------- */

interface AppDef {
  id: string;
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
  accent?: boolean;
  status?: 'live' | 'offline';
  disabled?: boolean;
  badge?: string;
}

/* ---------- Sub-components ---------- */

interface AppTileProps {
  app: AppDef;
  accent: string;
  index: number;
}

function AppTile({ app, accent, index }: AppTileProps) {
  if (app.disabled) {
    return (
      <div
        className="flex cursor-not-allowed flex-col items-center gap-2 rounded-[1.5rem] border border-dashed border-[var(--outline)] bg-[var(--surface-dim)] p-4 opacity-60"
        title={app.badge}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--container)] text-[var(--on-surface-var)]">
          {app.icon}
        </div>
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-[11px] font-black tracking-tight text-[var(--on-surface)]">{app.label}</span>
          {app.badge && (
            <span className="rounded-md border border-[var(--outline)] bg-[var(--surface)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">
              {app.badge}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.04 * index, ...spring }}
      whileHover={{ y: -3, scale: 1.03 }}
      whileTap={{ scale: 0.94, borderRadius: '1rem' }}
      onClick={app.onClick}
      className="group relative flex flex-col items-center gap-2 rounded-[1.5rem] border border-[var(--outline)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--on-surface-var)] cursor-pointer"
    >
      {/* Icon container — M3 Expressive: bold accent fill for primary apps */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
        style={{
          background: app.accent ? accent : 'var(--container)',
          color: app.accent ? '#ffffff' : 'var(--on-surface)',
          border: app.accent ? 'none' : '1px solid var(--outline)',
        }}
      >
        {app.icon}
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-[11px] font-black tracking-tight text-[var(--on-surface)]">{app.label}</span>
        {app.sub && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">
            {app.sub}
          </span>
        )}
      </div>
      {/* Live status dot */}
      {app.status === 'live' && (
        <span
          className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
        />
      )}
    </motion.button>
  );
}

interface DockButtonProps {
  app: AppDef;
  accent: string;
}

function DockButton({ app, accent }: DockButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={spring}
      onClick={app.onClick}
      aria-label={app.label}
      title={app.label}
      className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] text-white transition-colors cursor-pointer"
      style={{ background: accent }}
    >
      {app.icon}
    </motion.button>
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

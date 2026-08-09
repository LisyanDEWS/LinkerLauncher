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
  Search,
  Plus,
  Sparkles,
  MessageSquare,
  Calculator,
  ArrowUpRight,
} from 'lucide-react';
import { Language, ThemeMode, Material3Palette } from '../types';

/**
 * FusionHome — v4. True M3 Expressive bento grid.
 *
 * Distinct from ExpressiveHome (which is a uniform-section launcher):
 *   - Bento layout with VARIED tile sizes (large hero, wide, tall, small)
 *   - VARIED shapes (squircle, pill, rounded, superellipse feel)
 *   - Perfect grid fit — tiles interlock like a puzzle
 *   - Aurora background from NextGen + glass surfaces
 *   - Spring physics, asymmetric corner radii (M3 Expressive hallmark)
 *
 * Layout (12-col grid, 4 rows):
 *   Row 1: [Hero Now 4x2] [Clock 4x1] [Weather 4x1]
 *   Row 2: [Hero cont. ] [Agno 4x1]  [Lisyan 4x1]  -- wait, redo
 *
 * Actual bento (6-col, varied spans):
 *   ┌──────────────┬───────┬───────┐
 *   │  NOW (hero)  │ Clock │Weather│
 *   │   3 x 2      │ 3 x 1 │ 3 x 1 │
 *   │              ├───────┼───────┤
 *   │              │ Agno  │Lisyan │
 *   │              │ 3 x 1 │ 3 x 1 │
 *   ├──────┬───────┴───────┼───────┤
 *   │ Calc │  Calendar     │ Settings│
 *   │ 2x1  │  2 x 1        │  2 x 1  │
 *   └──────┴───────────────┴────────┘
 */

export interface FusionHomeProps {
  lang: Language;
  theme: ThemeMode;
  nickname: string;
  activePalette: Material3Palette;
  notifications: { id: string; title: string; message: string; read: boolean }[];
  battery: { level: number | null; charging: boolean | null };
  onOpenClock: () => void;
  onOpenCalendar: () => void;
  onOpenWeather: () => void;
  onOpenServer: () => void;
  onOpenAgno: () => void;
  onOpenLisyan: () => void;
  onOpenCalculator: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenChangelog: () => void;
  onOpenProfile: () => void;
  onOpenHomePicker: () => void;
  onSearch: (q: string) => void;
  isOptimizedEngine?: boolean;
}

const spring = { type: 'spring' as const, damping: 18, stiffness: 260 };
const easeOut = [0.16, 1, 0.3, 1] as const;

const Grain = () => (
  <div 
    className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-multiply"
    style={{
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`
    }}
  />
);

export function FusionHome(props: FusionHomeProps) {
  const {
    lang, theme, nickname, activePalette, notifications, battery,
    onOpenClock, onOpenCalendar, onOpenWeather, onOpenServer, onOpenAgno,
    onOpenLisyan, onOpenCalculator, onOpenNotifications, onOpenSettings,
    onOpenChangelog, onOpenProfile, onOpenHomePicker, onSearch,
    isOptimizedEngine = false,
  } = props;

  const isDark = theme === 'dark';
  const isRu = lang === 'ru';
  const accent = activePalette.primary;
  const accent2 = activePalette.secondary;
  const accent3 = activePalette.tertiary;
  const unread = notifications.filter((n) => !n.read).length;

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString(isRu ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const [query, setQuery] = useState('');
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const t = useMemo(() => ({
    greeting: isRu ? greetRu(nickname) : greetEn(nickname),
    subtitle: isRu ? 'Платформа готова' : 'Platform ready',
    search: isRu ? 'Поиск…' : 'Search…',
    now: isRu ? 'Сейчас' : 'Now',
    nowCta: isRu ? 'Открыть Agno GPT' : 'Open Agno GPT',
    nowHint: isRu ? 'ИИ-ассистент готов к диалогу' : 'AI assistant ready to chat',
    clock: isRu ? 'Часы' : 'Clock',
    weather: isRu ? 'Погода' : 'Weather',
    agno: 'Agno GPT',
    agnoSub: isRu ? 'ИИ-ассистент' : 'AI assistant',
    lisyan: 'Lisyan',
    lisyanSub: isRu ? 'P2P-файлы' : 'P2P files',
    calc: isRu ? 'Калькулятор' : 'Calculator',
    calendar: isRu ? 'Календарь' : 'Calendar',
    settings: isRu ? 'Настройки' : 'Settings',
    changelog: isRu ? 'Журнал' : 'Changelog',
    proxy: isRu ? 'Прокси' : 'Proxy',
    messenger: isRu ? 'Мессенджер' : 'Messenger',
    soon: isRu ? 'Скоро' : 'Soon',
    live: isRu ? 'Активно' : 'Live',
  }), [isRu, nickname]);

  const aurora = useMemo(() => ({
    '--aurora-1': accent,
    '--aurora-2': accent2,
    '--aurora-3': accent3,
  } as React.CSSProperties), [accent, accent2, accent3]);

  const glass: React.CSSProperties = isDark
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

  return (
    <div style={aurora} className="relative min-h-screen w-full overflow-hidden font-sans text-[var(--on-surface)]">
      <Grain />
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {isOptimizedEngine ? (
          <>
            <div
              aria-hidden
              className="absolute -top-1/4 -left-1/4 h-[70vh] w-[70vh] rounded-full blur-[140px]"
              style={{
                background: 'radial-gradient(circle, var(--aurora-1) 0%, transparent 60%)',
                opacity: isDark ? 0.35 : 0.5,
              }}
            />
            <div
              aria-hidden
              className="absolute top-1/3 -right-1/4 h-[60vh] w-[60vh] rounded-full blur-[140px]"
              style={{
                background: 'radial-gradient(circle, var(--aurora-2) 0%, transparent 60%)',
                opacity: isDark ? 0.3 : 0.45,
              }}
            />
            <div
              aria-hidden
              className="absolute -bottom-1/4 left-1/3 h-[50vh] w-[50vh] rounded-full blur-[140px]"
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
              className="absolute -top-1/4 -left-1/4 h-[70vh] w-[70vh] rounded-full blur-[140px]"
              style={{ background: 'radial-gradient(circle, var(--aurora-1) 0%, transparent 60%)' }}
            />
            <motion.div
              aria-hidden
              animate={{ x: [0, 50, 0], y: [0, -40, 0] }}
              transition={{ x: { duration: 20, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 24, repeat: Infinity, ease: 'easeInOut' } }}
              className="absolute top-1/3 -right-1/4 h-[60vh] w-[60vh] rounded-full blur-[140px]"
              style={{ background: 'radial-gradient(circle, var(--aurora-2) 0%, transparent 60%)', opacity: isDark ? 0.3 : 0.45 }}
            />
            <motion.div
              aria-hidden
              animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
              transition={{ x: { duration: 28, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 22, repeat: Infinity, ease: 'easeInOut' } }}
              className="absolute -bottom-1/4 left-1/3 h-[50vh] w-[50vh] rounded-full blur-[140px]"
              style={{ background: 'radial-gradient(circle, var(--aurora-3) 0%, transparent 60%)', opacity: isDark ? 0.25 : 0.4 }}
            />
          </>
        )}
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 md:px-8 md:py-6">
        {/* Status bar */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mb-5 flex items-center justify-between gap-3"
        >
          <button onClick={onOpenClock} className="flex items-center gap-2 rounded-full px-3.5 py-2 transition-colors hover:scale-[1.02]" style={glass}>
            <span className="text-sm font-black tabular-nums tracking-tight">{timeStr}</span>
            <span className="hidden text-[11px] font-bold text-[var(--on-surface-var)] sm:inline">{dateStr}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full px-3 py-2" style={glass}>
              {battery.charging ? <BatteryCharging size={14} style={{ color: accent }} /> : <Battery size={14} className="text-[var(--on-surface-var)]" />}
              <span className="text-[11px] font-black tabular-nums">{battery.level !== null ? Math.round(battery.level * 100) : '--'}%</span>
            </div>
            <button onClick={onOpenNotifications} className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--on-surface-var)] transition-colors hover:text-[var(--on-surface)] cursor-pointer" style={glass}>
              <Bell size={16} />
              {unread > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring} className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-black text-white" style={{ background: accent }}>{unread}</motion.span>}
            </button>
            <button onClick={onOpenProfile} className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: accent }}>{nickname.charAt(0).toUpperCase()}</button>
          </div>
        </motion.header>

        {/* Hero greeting + search */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7, ease: easeOut }} className="mb-5 flex flex-col gap-4">
          <div>
            <h1 className="text-4xl font-black leading-[0.95] tracking-tighter md:text-6xl">{t.greeting}</h1>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.15em] text-[var(--on-surface-var)]">{t.subtitle}</p>
          </div>
          <form onSubmit={handleSearch} className="relative w-full max-w-xl">
            <div className="flex items-center gap-3 rounded-full px-5 py-3.5 transition-all focus-within:scale-[1.01]" style={glass}>
              <Search size={18} className="shrink-0 text-[var(--on-surface-var)]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} className="w-full border-none bg-transparent text-sm font-medium outline-none placeholder:text-[var(--on-surface-var)]/60" />
            </div>
          </form>
        </motion.section>

        {/* ── BENTO GRID — M3 Expressive, varied shapes & sizes ── */}
        <div className="grid flex-1 grid-cols-6 gap-3 md:gap-4 auto-rows-[110px] md:auto-rows-[130px]">

          {/* HERO "Now" tile — 3 cols x 2 rows, accent gradient, squircle */}
          <BentoTile
            onClick={onOpenAgno}
            className="col-span-6 md:col-span-3 row-span-2"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accent3} 100%)`,
              color: '#fff',
              borderRadius: '2.5rem',
              boxShadow: `0 20px 50px -12px ${accent}70`,
            }}
            springDelay={0.2}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-[50%] bg-white/5" />
            <div className="relative z-10 flex h-full flex-col justify-between p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-sm">{t.now}</span>
                <ArrowUpRight size={22} className="opacity-80" />
              </div>
              <div>
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Bot size={28} />
                </div>
                <h3 className="text-2xl font-black tracking-tight md:text-3xl">{t.nowCta}</h3>
                <p className="mt-1 text-xs font-semibold opacity-80">{t.nowHint}</p>
              </div>
            </div>
          </BentoTile>

          {/* Clock tile — 3 cols x 1 row, glass, pill-ish */}
          <BentoTile
            onClick={onOpenClock}
            className="col-span-3 md:col-span-3 row-span-1"
            style={{ ...glass, borderRadius: '1.75rem' }}
            springDelay={0.28}
          >
            <div className="flex h-full items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'var(--container)', border: '1px solid var(--outline)' }}>
                  <ClockIcon size={20} style={{ color: accent }} />
                </div>
                <div>
                  <div className="text-2xl font-black tabular-nums tracking-tight">{timeStr}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">{t.clock}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[var(--on-surface-var)]">{dateStr}</span>
            </div>
          </BentoTile>

          {/* Weather tile — 3 cols x 1 row, accent-tinted glass */}
          <BentoTile
            onClick={onOpenWeather}
            className="col-span-3 md:col-span-3 row-span-1"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, ${accent2} 25%, var(--surface)) 0%, var(--surface) 100%)`,
              border: `1px solid color-mix(in srgb, ${accent2} 30%, var(--outline))`,
              borderRadius: '1.75rem',
            }}
            springDelay={0.34}
          >
            <div className="flex h-full items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: accent2 }}>
                  <CloudSun size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-lg font-black tracking-tight">{t.weather}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">{isRu ? 'Открыть' : 'Open'}</div>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-[var(--on-surface-var)]" />
            </div>
          </BentoTile>

          {/* Agno tile — 2 cols x 1 row, small, rounded */}
          <BentoTile
            onClick={onOpenAgno}
            className="col-span-2 row-span-1"
            style={{ ...glass, borderRadius: '1.5rem' }}
            springDelay={0.4}
          >
            <TileContent icon={<Bot size={20} style={{ color: accent }} />} label={t.agno} sub={t.agnoSub} status="live" statusColor={accent} />
          </BentoTile>

          {/* Lisyan tile — 2 cols x 1 row */}
          <BentoTile
            onClick={onOpenLisyan}
            className="col-span-2 row-span-1"
            style={{ ...glass, borderRadius: '1.5rem' }}
            springDelay={0.46}
          >
            <TileContent 
              icon={
                <div className={`w-7 h-7 rounded-xl border overflow-hidden flex items-center justify-center p-1 transition-colors ${
                  isDark ? 'bg-white border-white/20' : 'bg-black border-black/10'
                }`}>
                  <img 
                    src="https://github.com/user-attachments/assets/21000db8-96f5-4673-867f-efaa8e98b55e" 
                    alt="Lisyan" 
                    className={`w-full h-full object-contain ${isDark ? 'brightness-0' : 'brightness-0 invert'}`} 
                  />
                </div>
              } 
              label={t.lisyan} 
              sub={t.lisyanSub} 
              status="live" 
              statusColor={accent} 
            />
          </BentoTile>

          {/* Calculator tile — 2 cols x 1 row, distinct squircle */}
          <BentoTile
            onClick={onOpenCalculator}
            className="col-span-2 row-span-1"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)`,
              color: '#fff',
              borderRadius: '1.5rem',
            }}
            springDelay={0.52}
          >
            <div className="flex h-full flex-col justify-between p-4">
              <Calculator size={22} />
              <div>
                <div className="text-sm font-black">{t.calc}</div>
                <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">Material</div>
              </div>
            </div>
          </BentoTile>

          {/* Calendar tile — 3 cols x 1 row, wide */}
          <BentoTile
            onClick={onOpenCalendar}
            className="col-span-3 row-span-1"
            style={{ ...glass, borderRadius: '1.5rem' }}
            springDelay={0.58}
          >
            <div className="flex h-full items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'var(--container)', border: '1px solid var(--outline)' }}>
                <CalendarIcon size={20} style={{ color: accent }} />
              </div>
              <div>
                <div className="text-base font-black tracking-tight">{t.calendar}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">{now.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}</div>
              </div>
            </div>
          </BentoTile>

          {/* Settings tile — 3 cols x 1 row, wide */}
          <BentoTile
            onClick={onOpenSettings}
            className="col-span-3 row-span-1"
            style={{ ...glass, borderRadius: '1.5rem' }}
            springDelay={0.64}
          >
            <div className="flex h-full items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'var(--container)', border: '1px solid var(--outline)' }}>
                <SettingsIcon size={20} style={{ color: accent }} />
              </div>
              <div>
                <div className="text-base font-black tracking-tight">{t.settings}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">{isRu ? 'Настроить' : 'Configure'}</div>
              </div>
            </div>
          </BentoTile>

          {/* Proxy tile — 2 cols x 1 row */}
          <BentoTile
            onClick={onOpenServer}
            className="col-span-2 row-span-1"
            style={{ ...glass, borderRadius: '1.5rem' }}
            springDelay={0.7}
          >
            <TileContent icon={<Globe size={20} style={{ color: accent }} />} label={t.proxy} sub={isRu ? 'Маршрутизация' : 'Routing'} status="live" statusColor={accent} />
          </BentoTile>

          {/* Changelog tile — 2 cols x 1 row */}
          <BentoTile
            onClick={onOpenChangelog}
            className="col-span-2 row-span-1"
            style={{ ...glass, borderRadius: '1.5rem' }}
            springDelay={0.76}
          >
            <TileContent icon={<History size={20} style={{ color: accent }} />} label={t.changelog} sub="v1/262608" />
          </BentoTile>

          {/* Messenger tile — 2 cols x 1 row, disabled/coming-soon */}
          <div
            className="col-span-2 row-span-1 flex cursor-not-allowed flex-col justify-between rounded-[1.5rem] border border-dashed border-[var(--outline)] bg-[var(--surface-dim)] p-4 opacity-60"
          >
            <MessageSquare size={22} className="text-[var(--on-surface-var)]" />
            <div>
              <div className="text-sm font-black">{t.messenger}</div>
              <span className="mt-0.5 inline-block rounded-md border border-[var(--outline)] bg-[var(--surface)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[var(--on-surface-var)]">{t.soon}</span>
            </div>
          </div>
        </div>

        {/* Dock — glass, M3 pill */}
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, ...spring }} className="sticky bottom-4 z-20 mt-5">
          <div className="mx-auto flex max-w-md items-center justify-between gap-2 rounded-[2rem] p-2.5" style={glass}>
            {[
              { 
                icon: (
                  <div className={`w-6 h-6 rounded-lg border overflow-hidden flex items-center justify-center p-0.5 transition-colors ${
                    isDark ? 'bg-white border-white/20' : 'bg-black border-black/10'
                  }`}>
                    <img 
                      src="https://github.com/user-attachments/assets/21000db8-96f5-4673-867f-efaa8e98b55e" 
                      alt="Lisyan" 
                      className={`w-full h-full object-contain ${isDark ? 'brightness-0' : 'brightness-0 invert'}`} 
                    />
                  </div>
                ), 
                onClick: onOpenLisyan, 
                label: t.lisyan 
              },
              { icon: <Bot size={20} />, onClick: onOpenAgno, label: t.agno },
              { icon: <Calculator size={20} />, onClick: onOpenCalculator, label: t.calc },
              { icon: <SettingsIcon size={20} />, onClick: onOpenSettings, label: t.settings },
            ].map((d, i) => (
              <React.Fragment key={i}>
                <motion.button whileHover={{ y: -4, scale: 1.08 }} whileTap={{ scale: 0.92 }} transition={spring} onClick={d.onClick} aria-label={d.label} title={d.label} className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] text-white cursor-pointer" style={{ background: accent }}>
                  {d.icon}
                </motion.button>
              </React.Fragment>
            ))}
            <button onClick={onOpenHomePicker} aria-label={isRu ? 'Сменить дизайн' : 'Switch design'} title={isRu ? 'Сменить дизайн дома' : 'Switch home design'} className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] text-[var(--on-surface-var)] transition-colors hover:bg-[var(--container)] hover:text-[var(--on-surface)] cursor-pointer">
              <Plus size={22} />
            </button>
          </div>
        </motion.section>

        {/* Floating version badge */}
        <button onClick={onOpenHomePicker} className="fixed left-5 top-5 z-[90] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-colors cursor-pointer" style={glass}>
          <Sparkles size={11} />Fusion
        </button>
      </div>
    </div>
  );
}

/* ---------- Bento tile wrapper (spring entrance + hover) ---------- */
interface BentoTileProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
  springDelay?: number;
}

function BentoTile({ children, onClick, className, style, springDelay = 0 }: BentoTileProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: springDelay, ...spring }}
      whileHover={{ y: -12, scale: 1.01, transition: { duration: 0.5, ease: [0.6, 0, 0.2, 1] } }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`group relative overflow-hidden text-left cursor-pointer ${className ?? ''}`}
      style={style}
    >
      {children}
    </motion.button>
  );
}

/* ---------- Standard small tile content ---------- */
function TileContent({ icon, label, sub, status, statusColor }: { icon: React.ReactNode; label: string; sub?: string; status?: 'live'; statusColor?: string }) {
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-start justify-between">
        {icon}
        {status === 'live' && <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />}
      </div>
      <div>
        <div className="text-sm font-black tracking-tight">{label}</div>
        {sub && <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">{sub}</div>}
      </div>
    </div>
  );
}

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

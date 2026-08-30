import React, { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Layers,
  Sparkles,
  Palette,
  Clock,
  Maximize2,
  Check,
  RotateCcw,
  Sliders,
  Eye,
  Type,
  Layout,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Save,
  Trash2,
  Share2,
  Download,
  Upload,
  Calendar,
  CloudSun,
  Wifi,
  Power,
  Accessibility,
  ArrowRight,
} from 'lucide-react';
import { Language, Material3Palette } from '../types';

export interface LockScreenManagerAppProps {
  lang: Language;
  activePalette: Material3Palette;
  currentWallpaper: string;
  currentStandbyBg: string;
  onApplyToStandby: (bgUrl: string, designId?: number, customConfig?: any) => void;
  onApplyToHome: (bgUrl: string) => void;
  onApplyToBoth: (bgUrl: string, designId?: number, customConfig?: any) => void;
  onApplyThemePalette?: (paletteId: string) => void;
  triggerToast?: (message: string) => void;
  playChime?: (type?: 'click' | 'alert' | 'reset' | 'victory' | 'toast') => void;
}

export type LockCategory = 'all' | 'digital' | 'analog' | 'type' | 'playful';

export interface LockClockContext {
  now: Date;
  hh: string;
  h12: string;
  mm: string;
  ss: string;
  hours: number;
  minutes: number;
  seconds: number;
  ampm: string;
  weekday: string;
  weekdayShort: string;
  day: string;
  month: string;
  monthShort: string;
  dateLine: string;
}

export interface LockDesign {
  id: number;
  name: string;
  nameEn: string;
  font: string;
  cat: LockCategory;
  wallpaper: string;
  ink: 'light' | 'dark';
  blurbRu: string;
  blurbEn: string;
  accentPalette: string;
  render: (ctx: LockClockContext, isCustom?: boolean, customColor?: string) => ReactNode;
}

export interface CustomLockscreenConfig {
  id: string;
  name: string;
  layoutStyle: number; // 1 to 30 design base
  font: string;
  ink: 'light' | 'dark' | 'accent' | 'custom';
  customTextColor: string;
  wallpaper: string;
  pos: 'top' | 'center' | 'bottom' | 'left' | 'right';
  showLock: boolean;
  showChrome: boolean;
  showDate: boolean;
  showSeconds: boolean;
  showWidgets: boolean;
  fontSizeScale: number; // 0.8 to 1.4
  letterSpacing: number; // -10 to +10
  savedAt: number;
}

const CANVAS_W = 1280;
const CANVAS_H = 720;

export const LOCKSCREEN_WALLPAPERS: Record<string, { url: string; nameRu: string; nameEn: string; dominant: string; palette: string }> = {
  indigo: { url: '/images/wp-indigo.svg', nameRu: 'Индиго Аврора', nameEn: 'Deep Indigo', dominant: '#6366f1', palette: 'indigo_violet' },
  coral: { url: '/images/wp-coral.svg', nameRu: 'Коралловый закат', nameEn: 'Coral Sunset', dominant: '#ff6e64', palette: 'terracotta_sand' },
  sage: { url: '/images/wp-sage.svg', nameRu: 'Шалфей & Олива', nameEn: 'Calm Sage', dominant: '#82a087', palette: 'sage_khaki' },
  sunset: { url: '/images/wp-sunset.svg', nameRu: 'Закатный горизонт', nameEn: 'Sunset Glow', dominant: '#f58228', palette: 'terracotta_sand' },
  candy: { url: '/images/wp-candy.svg', nameRu: 'Леденцовые облака', nameEn: 'Candy Pastel', dominant: '#ffafcd', palette: 'lavender_orchid' },
  ocean: { url: '/images/wp-ocean.svg', nameRu: 'Океанская глубина', nameEn: 'Ocean Teal', dominant: '#0a5082', palette: 'ocean_teal' },
  sand: { url: '/images/wp-sand.svg', nameRu: 'Дюны Сахары', nameEn: 'Desert Sand', dominant: '#e1b98c', palette: 'terracotta_sand' },
  night: { url: '/images/wp-night.svg', nameRu: 'Ночной киберпанк', nameEn: 'Night Shift', dominant: '#00b4d7', palette: 'monochrome' },
  lime: { url: '/images/wp-lime.svg', nameRu: 'Электрик Лайм', nameEn: 'Electric Lime', dominant: '#a0e628', palette: 'forest_moss' },
  wine: { url: '/images/wp-wine.svg', nameRu: 'Бордо & Бархат', nameEn: 'Velvet Wine', dominant: '#821e3c', palette: 'lavender_orchid' },
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function buildLockCtx(now: Date, lang: Language): LockClockContext {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const isRu = lang === 'ru';
  const isUk = lang === 'uk';
  const locale = isRu ? 'ru-RU' : isUk ? 'uk-UA' : 'en-US';

  return {
    now,
    hh: pad(hours),
    h12: pad(hours % 12 || 12),
    mm: pad(minutes),
    ss: pad(seconds),
    hours,
    minutes,
    seconds,
    ampm: hours >= 12 ? 'PM' : 'AM',
    weekday: now.toLocaleDateString(locale, { weekday: 'long' }),
    weekdayShort: now.toLocaleDateString(locale, { weekday: 'short' }),
    day: String(now.getDate()),
    month: now.toLocaleDateString(locale, { month: 'long' }),
    monthShort: now.toLocaleDateString(locale, { month: 'short' }),
    dateLine: now.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  };
}

const NOM = [
  'двенадцать',
  'один',
  'два',
  'три',
  'четыре',
  'пять',
  'шесть',
  'семь',
  'восемь',
  'девять',
  'десять',
  'одиннадцать',
];

const GEN = [
  'двенадцатого',
  'первого',
  'второго',
  'третьего',
  'четвертого',
  'пятого',
  'шестого',
  'седьмого',
  'восьмого',
  'девятого',
  'десятого',
  'одиннадцатого',
];

function minuteNoun(n: number) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n100 >= 11 && n100 <= 14) return 'минут';
  if (n10 === 1) return 'минута';
  if (n10 >= 2 && n10 <= 4) return 'минуты';
  return 'минут';
}

function hourNoun(h12: number) {
  const n = h12 === 0 ? 12 : h12;
  if (n === 1) return 'час';
  if (n >= 2 && n <= 4) return 'часа';
  return 'часов';
}

function nextNom(next: number) {
  if (next === 1) return 'час';
  return NOM[next];
}

function ruWords(hours: number, minutes: number) {
  const h12 = hours % 12;
  const next = (h12 + 1) % 12;
  if (minutes === 0) return { a: NOM[h12], b: hourNoun(h12) };
  if (minutes === 15) return { a: 'четверть', b: GEN[next] };
  if (minutes === 30) return { a: 'половина', b: GEN[next] };
  if (minutes === 45) return { a: 'без четверти', b: nextNom(next) };
  if (minutes < 30) return { a: `${minutes} ${minuteNoun(minutes)}`, b: GEN[next] };
  const left = 60 - minutes;
  return { a: `без ${left}`, b: nextNom(next) };
}

function LockArea({
  children,
  pos = 'center',
  className = '',
}: {
  children: ReactNode;
  pos?: 'top' | 'center' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  const p = {
    top: 'items-center justify-start pt-[72px] text-center',
    center: 'items-center justify-center text-center',
    bottom: 'items-center justify-end pb-[110px] text-center',
    left: 'items-start justify-center pl-[88px] pr-10 text-left',
    right: 'items-end justify-center pr-[88px] pl-10 text-right',
  }[pos];
  return <div className={`flex h-full w-full flex-col ${p} ${className}`}>{children}</div>;
}

function LockGlyph({ dark = false, customColor }: { dark?: boolean; customColor?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`mb-4 opacity-85 ${customColor ? '' : dark ? 'text-neutral-900' : 'text-white'}`}
      style={{ color: customColor }}
    >
      <path d="M17 8h-1V6a4 4 0 10-8 0v2H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V10a2 2 0 00-2-2zM10 6a2 2 0 114 0v2h-4V6zm2 11.2a1.8 1.8 0 110-3.6 1.8 1.8 0 010 3.6z" />
    </svg>
  );
}

function LockChromeBar({ light, customColor }: { light: boolean; customColor?: string }) {
  const fg = customColor ? '' : light ? 'text-white' : 'text-neutral-900';
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-12 pb-8 ${fg}`}
      style={{ color: customColor }}
    >
      <div className="flex items-center gap-3 opacity-80">
        <div
          className={`grid h-11 w-11 place-items-center rounded-full ${
            light ? 'bg-white/18' : 'bg-black/15'
          }`}
        >
          <span className="font-bold text-sm">A</span>
        </div>
        <div className="text-left leading-tight">
          <div className="text-[15px] font-semibold">Alex</div>
          <div className="text-[11px] opacity-70">Нажмите клавишу, чтобы войти</div>
        </div>
      </div>
      <div className="flex items-center gap-5 opacity-85">
        <Wifi size={20} />
        <Accessibility size={20} />
        <Power size={20} />
      </div>
    </div>
  );
}

function AnalogClockFace({
  size,
  now,
  face = 'rgba(255,255,255,0.14)',
  hour = '#fff',
  minute = '#fff',
  second = '#ffb4ab',
  cap = '#ffb4ab',
  ticks = true,
  tick = 'rgba(255,255,255,0.45)',
  strokeFace = 'transparent',
  hourW = 7,
  minuteW = 4,
  secondW = 1.5,
  squircle = false,
}: {
  size: number;
  now: Date;
  face?: string;
  hour?: string;
  minute?: string;
  second?: string;
  cap?: string;
  ticks?: boolean;
  tick?: string;
  strokeFace?: string;
  hourW?: number;
  minuteW?: number;
  secondW?: number;
  squircle?: boolean;
}) {
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const hourA = (h + m / 60) * 30;
  const minA = (m + s / 60) * 6;
  const secA = s * 6;
  const c = size / 2;
  const r = c - 3;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {squircle ? (
        <rect
          x="4"
          y="4"
          width={size - 8}
          height={size - 8}
          rx={size * 0.28}
          fill={face}
          stroke={strokeFace}
          strokeWidth={2}
        />
      ) : (
        <circle cx={c} cy={c} r={r} fill={face} stroke={strokeFace} strokeWidth={2} />
      )}
      {ticks &&
        Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const inner = r - (i % 3 === 0 ? 18 : 10);
          const outer = r - 6;
          return (
            <line
              key={i}
              x1={c + Math.sin(a) * inner}
              y1={c - Math.cos(a) * inner}
              x2={c + Math.sin(a) * outer}
              y2={c - Math.cos(a) * outer}
              stroke={tick}
              strokeWidth={i % 3 === 0 ? 3 : 1.4}
              strokeLinecap="round"
            />
          );
        })}
      <g transform={`rotate(${hourA} ${c} ${c})`}>
        <line x1={c} y1={c + 10} x2={c} y2={c - r * 0.48} stroke={hour} strokeWidth={hourW} strokeLinecap="round" />
      </g>
      <g transform={`rotate(${minA} ${c} ${c})`}>
        <line x1={c} y1={c + 14} x2={c} y2={c - r * 0.7} stroke={minute} strokeWidth={minuteW} strokeLinecap="round" />
      </g>
      {secondW > 0 && (
        <g transform={`rotate(${secA} ${c} ${c})`}>
          <line x1={c} y1={c + 18} x2={c} y2={c - r * 0.78} stroke={second} strokeWidth={secondW} strokeLinecap="round" />
        </g>
      )}
      <circle cx={c} cy={c} r={Math.max(5, hourW * 0.85)} fill={cap} />
    </svg>
  );
}

function RingClockFace({ size, now }: { size: number; now: Date }) {
  const h = (now.getHours() % 12) / 12 + now.getMinutes() / 720;
  const m = now.getMinutes() / 60 + now.getSeconds() / 3600;
  const s = now.getSeconds() / 60;
  const c = size / 2;
  const rings = [
    { r: c - 14, p: h, color: '#d0bcff', w: 16 },
    { r: c - 40, p: m, color: '#efb8c8', w: 16 },
    { r: c - 66, p: s, color: '#a4f4d8', w: 12 },
  ];
  return (
    <svg width={size} height={size}>
      {rings.map((ring, i) => {
        const circ = 2 * Math.PI * ring.r;
        return (
          <g key={i}>
            <circle cx={c} cy={c} r={ring.r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={ring.w} />
            <circle
              cx={c}
              cy={c}
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.w}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - ring.p)}
              transform={`rotate(-90 ${c} ${c})`}
            />
          </g>
        );
      })}
    </svg>
  );
}

function SplitFlapDigit({ value }: { value: string }) {
  return (
    <div
      className="relative grid place-items-center overflow-hidden rounded-[28px] bg-[#2b2930] text-white shadow-[0_12px_0_#1a1820,0_18px_32px_rgba(0,0,0,0.35)]"
      style={{ width: 120, height: 160, fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 88 }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px bg-black/50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/6" />
      {value}
    </div>
  );
}

export const LOCK_DESIGNS: LockDesign[] = [
  {
    id: 1,
    name: 'Колосс',
    nameEn: 'Colossus',
    font: 'Outfit',
    cat: 'digital',
    wallpaper: LOCKSCREEN_WALLPAPERS.indigo.url,
    ink: 'light',
    blurbRu: 'Windows-колосс: час жирный, минуты светлые. Горизонтальный lock в духе Pixel × M3.',
    blurbEn: 'Horizontal colossus: bold hour, light minutes. Pixel × M3 Expressive style.',
    accentPalette: 'indigo_violet',
    render: (c, isCustom, customColor) => (
      <LockArea pos="left">
        <LockGlyph customColor={customColor} />
        <div style={{ fontFamily: 'Outfit, sans-serif', color: customColor || 'white' }}>
          <div className="flex items-end gap-6">
            <span style={{ fontSize: 220, fontWeight: 800, lineHeight: 0.8, letterSpacing: -10 }}>{c.hh}</span>
            <span style={{ fontSize: 220, fontWeight: 200, lineHeight: 0.8, letterSpacing: -10, opacity: 0.85 }}>
              {c.mm}
            </span>
          </div>
          <div className="mt-4 text-[22px] font-medium capitalize tracking-wide opacity-80">{c.dateLine}</div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 2,
    name: 'Мягкий серриф',
    nameEn: 'Soft Serif',
    font: 'Fraunces',
    cat: 'type',
    wallpaper: LOCKSCREEN_WALLPAPERS.sand.url,
    ink: 'dark',
    blurbRu: 'Fraunces optical size на широком холсте. Курсив минут — editorial lock для ПК.',
    blurbEn: 'Fraunces optical size with italic minutes. Elegant editorial lock for PC.',
    accentPalette: 'terracotta_sand',
    render: (c, isCustom, customColor) => (
      <LockArea pos="left">
        <LockGlyph dark customColor={customColor} />
        <div style={{ fontFamily: 'Fraunces, serif', color: customColor || '#171717' }}>
          <div className="flex items-baseline gap-4">
            <span
              style={{
                fontSize: 180,
                fontWeight: 600,
                lineHeight: 0.85,
                letterSpacing: -6,
                fontVariationSettings: '"SOFT" 70, "WONK" 1',
              }}
            >
              {c.hh}
            </span>
            <span
              style={{
                fontSize: 180,
                fontWeight: 400,
                fontStyle: 'italic',
                lineHeight: 0.85,
                letterSpacing: -6,
                opacity: 0.7,
              }}
            >
              {c.mm}
            </span>
          </div>
          <div className="mt-5 text-[16px] font-semibold uppercase tracking-[0.32em] opacity-55">
            {c.weekday} · {c.day} {c.month}
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 3,
    name: 'Dual Split',
    nameEn: 'Dual Split',
    font: 'Syne',
    cat: 'digital',
    wallpaper: LOCKSCREEN_WALLPAPERS.lime.url,
    ink: 'dark',
    blurbRu: 'Монитор делится пополам: час и минута. Syne ExtraBold на 16:9.',
    blurbEn: 'Screen split in half: hour on left, minute on right. Syne ExtraBold.',
    accentPalette: 'forest_moss',
    render: (c, isCustom, customColor) => (
      <div className="relative h-full">
        <div className="absolute inset-0 flex">
          <div className="w-1/2 bg-black/20" />
          <div className="w-1/2 bg-white/25" />
        </div>
        <div
          className="relative z-10 flex h-full items-center justify-center gap-10"
          style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: customColor || '#171717' }}
        >
          <span style={{ fontSize: 200, letterSpacing: -8 }}>{c.hh}</span>
          <div className="h-[220px] w-[4px] rounded-full bg-neutral-900/80" style={{ backgroundColor: customColor }} />
          <span style={{ fontSize: 200, letterSpacing: -8, opacity: 0.5 }}>{c.mm}</span>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    name: 'Пузыри',
    nameEn: 'Bubbles',
    font: 'Fredoka',
    cat: 'playful',
    wallpaper: LOCKSCREEN_WALLPAPERS.candy.url,
    ink: 'dark',
    blurbRu: 'Четыре контейнера M3 Expressive в ряд — разные радиусы, tertiary-палитра.',
    blurbEn: 'Four M3 Expressive pill shapes in a row with distinctive corner radii.',
    accentPalette: 'lavender_orchid',
    render: (c, isCustom, customColor) => {
      const digits = [c.hh[0], c.hh[1], c.mm[0], c.mm[1]];
      const radii = ['48px 18px 42px 20px', '50%', '20px 46px 18px 50px', '42px 42px 12px 42px'];
      const fills = ['#eaddff', '#ffd8e4', '#bcecde', '#ffddb5'];
      const inks = ['#21005d', '#633b48', '#003731', '#2a1800'];
      return (
        <LockArea pos="center">
          <LockGlyph dark customColor={customColor} />
          <div className="flex items-center gap-6">
            {digits.map((d, i) => (
              <div key={i} className="flex items-center gap-6">
                {i === 2 && (
                  <span className="text-[64px] font-bold text-neutral-800/40" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    :
                  </span>
                )}
                <div
                  className="grid h-[160px] w-[160px] place-items-center text-[72px] font-semibold shadow-lg"
                  style={{
                    borderRadius: radii[i],
                    background: fills[i],
                    color: inks[i],
                    fontFamily: 'Fredoka, sans-serif',
                  }}
                >
                  {d}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-[18px] font-semibold capitalize text-neutral-800/70" style={{ color: customColor }}>
            {c.dateLine}
          </div>
        </LockArea>
      );
    },
  },
  {
    id: 5,
    name: 'Слова',
    nameEn: 'Word Clock',
    font: 'Newsreader',
    cat: 'type',
    wallpaper: LOCKSCREEN_WALLPAPERS.wine.url,
    ink: 'light',
    blurbRu: 'Время прописью на широком экране. ПК читает вам lock screen вслух.',
    blurbEn: 'Spoken text clock on widescreen canvas. Reads the time aloud in editorial typography.',
    accentPalette: 'lavender_orchid',
    render: (c, isCustom, customColor) => {
      const w = ruWords(c.hours, c.minutes);
      return (
        <LockArea pos="left">
          <LockGlyph customColor={customColor} />
          <div style={{ fontFamily: 'Newsreader, serif', color: customColor || 'white' }}>
            <div className="text-[14px] font-medium uppercase tracking-[0.4em] opacity-55">сейчас</div>
            <div className="mt-2 flex flex-wrap items-end gap-5">
              <span style={{ fontSize: 92, fontWeight: 500, fontStyle: 'italic', lineHeight: 1, letterSpacing: -1 }}>
                {w.a}
              </span>
              <span style={{ fontSize: 92, fontWeight: 700, lineHeight: 1 }}>{w.b}</span>
            </div>
            <div className="mt-6 text-[22px] tabular-nums opacity-70">
              {c.hh}:{c.mm} · {c.dateLine}
            </div>
          </div>
        </LockArea>
      );
    },
  },
  {
    id: 6,
    name: 'Капсулы',
    nameEn: 'Pill Widgets',
    font: 'Plus Jakarta Sans',
    cat: 'playful',
    wallpaper: LOCKSCREEN_WALLPAPERS.sage.url,
    ink: 'dark',
    blurbRu: 'Нижняя панель виджетов: время, погода, календарь — expressive pills для десктопа.',
    blurbEn: 'Bottom widget dock with time, weather, and schedule in Expressive pills.',
    accentPalette: 'sage_khaki',
    render: (c) => (
      <LockArea pos="bottom">
        <div
          className="flex flex-wrap items-center justify-center gap-3"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          <div className="rounded-full bg-[#1b1b1f] px-10 py-4 text-white shadow-2xl">
            <span className="text-[52px] font-extrabold tracking-tight">
              {c.hh}:{c.mm}
            </span>
          </div>
          <div className="rounded-full bg-[#d0e8d4] px-7 py-4 text-[20px] font-bold text-[#16261a]">18° · Ясно</div>
          <div className="rounded-full bg-white/85 px-7 py-4 text-[18px] font-semibold capitalize text-neutral-800">
            {c.dateLine}
          </div>
          <div className="rounded-full bg-[#eaddff] px-7 py-4 text-[18px] font-bold text-[#21005d]">Событие · 18:00</div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 7,
    name: 'Призрак',
    nameEn: 'Hollow Ghost',
    font: 'Archivo Black',
    cat: 'digital',
    wallpaper: LOCKSCREEN_WALLPAPERS.night.url,
    ink: 'light',
    blurbRu: 'Hollow type на весь монитор: час обведён, минуты залиты.',
    blurbEn: 'Massive hollow outline type across screen: stroked hours, filled minutes.',
    accentPalette: 'monochrome',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <div className="flex items-center gap-6" style={{ fontFamily: 'Archivo Black, sans-serif', color: customColor || 'white' }}>
          <div className="outline-fill" style={{ fontSize: 220, lineHeight: 0.85, letterSpacing: -8 }}>
            {c.hh}
          </div>
          <div style={{ fontSize: 80, opacity: 0.4 }}>:</div>
          <div style={{ fontSize: 220, lineHeight: 0.85, letterSpacing: -8 }}>{c.mm}</div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 8,
    name: 'HUD Telemetry',
    nameEn: 'Cyber HUD',
    font: 'IBM Plex Mono',
    cat: 'digital',
    wallpaper: LOCKSCREEN_WALLPAPERS.night.url,
    ink: 'light',
    blurbRu: 'Системный lock инженера: телеметрия по углам, время как статус OK.',
    blurbEn: 'Engineer terminal HUD: system telemetry in corners, time as status matrix.',
    accentPalette: 'monochrome',
    render: (c) => (
      <div
        className="relative h-full p-12 text-lime-300"
        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
      >
        <div className="flex justify-between text-[13px] opacity-70">
          <span>LOCK//SYS · SESSION 0</span>
          <span>UTC+3 · {c.dateLine.toUpperCase()}</span>
        </div>
        <div className="flex h-[78%] items-center justify-center">
          <div className="text-center">
            <div className="text-[14px] tracking-[0.4em] opacity-60">SECURE · IDLE</div>
            <div className="text-[108px] font-semibold tracking-wider text-lime-200">
              {c.hh}:{c.mm}:{c.ss}
            </div>
          </div>
        </div>
        <div className="absolute bottom-28 left-12 grid grid-cols-2 gap-x-10 gap-y-1 text-[13px] opacity-80">
          <span>CPU</span>
          <span>12%</span>
          <span>NET</span>
          <span>LINKER-5G</span>
          <span>STATUS</span>
          <span>ONLINE</span>
        </div>
      </div>
    ),
  },
  {
    id: 9,
    name: 'Орбита',
    nameEn: 'Orbit Clock',
    font: 'Unbounded',
    cat: 'analog',
    wallpaper: LOCKSCREEN_WALLPAPERS.ocean.url,
    ink: 'light',
    blurbRu: 'Секундная орбита на десктопе. Unbounded в центре, 60 спутников по кругу.',
    blurbEn: '60 second planetary satellites revolving around central display typography.',
    accentPalette: 'ocean_teal',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <div className="relative h-[380px] w-[380px]">
          {Array.from({ length: 60 }).map((_, i) => {
            const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
            const active = i === c.seconds;
            const r = 176;
            return (
              <div
                key={i}
                className="absolute rounded-full bg-white transition-all duration-300"
                style={{
                  width: active ? 14 : i % 5 === 0 ? 6 : 3,
                  height: active ? 14 : i % 5 === 0 ? 6 : 3,
                  opacity: active ? 1 : i % 5 === 0 ? 0.75 : 0.3,
                  left: `calc(50% + ${Math.cos(a) * r}px)`,
                  top: `calc(50% + ${Math.sin(a) * r}px)`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: active ? (customColor || '#a5f3fc') : undefined,
                }}
              />
            );
          })}
          <div
            className="absolute inset-0 grid place-items-center"
            style={{ fontFamily: 'Unbounded, sans-serif', color: customColor || 'white' }}
          >
            <div>
              <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
                {c.hh}:{c.mm}
              </div>
              <div className="text-[14px] font-medium uppercase tracking-[0.28em] opacity-60 text-center">{c.weekday}</div>
            </div>
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 10,
    name: 'Обложка',
    nameEn: 'Editorial Cover',
    font: 'Playfair Display',
    cat: 'type',
    wallpaper: LOCKSCREEN_WALLPAPERS.sand.url,
    ink: 'dark',
    blurbRu: 'Lock screen как разворот журнала на мониторе: кикер, display, колонтитул.',
    blurbEn: 'Magazine spread layout: kicker, display numbers, italic rule and footer.',
    accentPalette: 'terracotta_sand',
    render: (c, isCustom, customColor) => (
      <LockArea pos="left">
        <div className="max-w-[920px]" style={{ fontFamily: 'Playfair Display, serif', color: customColor || '#171717' }}>
          <div
            className="text-[14px] font-semibold uppercase tracking-[0.42em] opacity-50"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            Desktop Lock · Edition 16 · 16:9
          </div>
          <div className="mt-4" style={{ fontSize: 140, fontWeight: 900, lineHeight: 0.85, letterSpacing: -4 }}>
            {c.hh}:{c.mm}
          </div>
          <div className="mt-3 italic" style={{ fontSize: 36, fontWeight: 600 }}>
            {c.weekday}
          </div>
          <div className="mt-8 h-px w-24 bg-neutral-900/35" style={{ backgroundColor: customColor }} />
          <div className="mt-3 text-[18px] capitalize opacity-70">
            {c.day} {c.month}
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 11,
    name: 'Наложение',
    nameEn: 'Collision Overlap',
    font: 'Bricolage Grotesque',
    cat: 'type',
    wallpaper: LOCKSCREEN_WALLPAPERS.sunset.url,
    ink: 'light',
    blurbRu: 'Минуты наезжают на час. Optical collision на широком кадре.',
    blurbEn: 'Minutes overlay colliding with hour digits with blend mode aesthetics.',
    accentPalette: 'terracotta_sand',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <div
          className="relative h-[280px] w-[980px]"
          style={{ fontFamily: 'Bricolage Grotesque, sans-serif', color: customColor || 'white' }}
        >
          <div
            className="absolute left-0 top-0"
            style={{ fontSize: 260, fontWeight: 800, lineHeight: 0.8, letterSpacing: -12, opacity: 0.95 }}
          >
            {c.hh}
          </div>
          <div
            className="absolute right-0 top-8 mix-blend-overlay"
            style={{ fontSize: 220, fontWeight: 800, lineHeight: 0.8, letterSpacing: -8, color: '#ffddb5' }}
          >
            {c.mm}
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 12,
    name: 'Climate Poster',
    nameEn: 'Climate Poster',
    font: 'Climate Crisis',
    cat: 'digital',
    wallpaper: LOCKSCREEN_WALLPAPERS.coral.url,
    ink: 'light',
    blurbRu: 'Climate Crisis растянут на всю ширину монитора. Плакатный lock.',
    blurbEn: 'Full bleed Climate Crisis typographic poster across the entire canvas.',
    accentPalette: 'terracotta_sand',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <div className="w-full px-10" style={{ fontFamily: 'Climate Crisis, sans-serif', color: customColor || 'white' }}>
          <div className="flex items-center justify-between" style={{ fontSize: 240, lineHeight: 0.72 }}>
            <span>{c.hh}</span>
            <span>{c.mm}</span>
          </div>
        </div>
        <div className="mt-6 text-[16px] font-medium uppercase tracking-[0.35em] text-white/70" style={{ color: customColor }}>
          {c.day} {c.month} · {c.weekday}
        </div>
      </LockArea>
    ),
  },
  {
    id: 13,
    name: 'Облако',
    nameEn: 'Cloud Morph',
    font: 'Comfortaa',
    cat: 'playful',
    wallpaper: LOCKSCREEN_WALLPAPERS.candy.url,
    ink: 'dark',
    blurbRu: 'Живой блоб по центру рабочего стола. Мягкая геометрия + Comfortaa.',
    blurbEn: 'Living fluid morphing blob floating in the center with rounded Comfortaa font.',
    accentPalette: 'lavender_orchid',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <div
          className="blob-morph floaty grid h-[340px] w-[340px] place-items-center bg-white/90 text-neutral-800 shadow-2xl"
          style={{ fontFamily: 'Comfortaa, sans-serif' }}
        >
          <div className="text-center">
            <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2, color: customColor }}>
              {c.hh}:{c.mm}
            </div>
            <div className="text-[16px] font-medium capitalize opacity-55">{c.weekday}</div>
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 14,
    name: 'Flip Flap',
    nameEn: 'Split Flap Board',
    font: 'Sora',
    cat: 'digital',
    wallpaper: LOCKSCREEN_WALLPAPERS.indigo.url,
    ink: 'light',
    blurbRu: 'Split-flap станционного табло. Карточки extra-large rounded — M3 на ПК.',
    blurbEn: 'Mechanical split-flap train station board tiles with M3 depth shadows.',
    accentPalette: 'indigo_violet',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <LockGlyph customColor={customColor} />
        <div className="flex items-center gap-3">
          <SplitFlapDigit value={c.hh[0]} />
          <SplitFlapDigit value={c.hh[1]} />
          <div className="px-2 text-6xl font-bold text-white/80" style={{ color: customColor }}>:</div>
          <SplitFlapDigit value={c.mm[0]} />
          <SplitFlapDigit value={c.mm[1]} />
        </div>
        <div className="mt-8 text-[16px] font-medium uppercase tracking-[0.28em] text-white/65" style={{ color: customColor }}>
          {c.weekday} {c.day} {c.month}
        </div>
      </LockArea>
    ),
  },
  {
    id: 15,
    name: 'Блоб Аналог',
    nameEn: 'Squircle Analog',
    font: 'Manrope',
    cat: 'analog',
    wallpaper: LOCKSCREEN_WALLPAPERS.sage.url,
    ink: 'dark',
    blurbRu: 'Аналог на squircle, цифры рядом. Толстые стрелки, tertiary-секундная.',
    blurbEn: 'Squircle face clock with thick expressive hands and bold digital counter alongside.',
    accentPalette: 'sage_khaki',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <div className="flex items-center gap-14">
          <AnalogClockFace
            size={320}
            now={c.now}
            face="rgba(255,255,255,0.72)"
            hour="#1a1c19"
            minute="#1a1c19"
            second="#9c4146"
            cap="#9c4146"
            tick="rgba(26,28,25,0.35)"
            squircle
            hourW={12}
            minuteW={7}
            secondW={2}
          />
          <div className="text-left text-neutral-900" style={{ fontFamily: 'Manrope, sans-serif', color: customColor }}>
            <div className="text-[72px] font-extrabold leading-none tracking-tight">
              {c.hh}:{c.mm}
            </div>
            <div className="mt-2 text-[20px] font-semibold capitalize opacity-60">{c.dateLine}</div>
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 16,
    name: 'Неон Ночь',
    nameEn: 'Cyber Neon',
    font: 'Orbitron',
    cat: 'analog',
    wallpaper: LOCKSCREEN_WALLPAPERS.night.url,
    ink: 'light',
    blurbRu: 'Ночной аналог для тёмной комнаты. Неоновый кап, Orbitron HUD.',
    blurbEn: 'Luminous midnight analog glowing with pulsed neon and Orbitron HUD.',
    accentPalette: 'monochrome',
    render: (c) => (
      <LockArea pos="center">
        <div className="flex items-center gap-16">
          <div className="glowpulse text-fuchsia-300">
            <AnalogClockFace
              size={300}
              now={c.now}
              face="rgba(8,8,12,0.45)"
              strokeFace="rgba(244,114,182,0.55)"
              hour="#f5d0fe"
              minute="#a5f3fc"
              second="#d9f99d"
              cap="#d9f99d"
              tick="rgba(255,255,255,0.28)"
              hourW={9}
              minuteW={4}
            />
          </div>
          <div className="text-left" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <div className="text-[18px] tracking-[0.4em] text-cyan-200/70">NIGHT SHIFT</div>
            <div className="mt-2 text-[56px] tracking-[0.12em] text-cyan-100">
              {c.hh}:{c.mm}:{c.ss}
            </div>
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 17,
    name: 'Курсив & Sans',
    nameEn: 'Italic Serif & Sans',
    font: 'Instrument Serif',
    cat: 'type',
    wallpaper: LOCKSCREEN_WALLPAPERS.wine.url,
    ink: 'light',
    blurbRu: 'Час — курсивный серриф, минуты — тихий sans. Двойной характер на 16:9.',
    blurbEn: 'High contrast pairing: italic editorial serif hour with quiet tracked sans minutes.',
    accentPalette: 'lavender_orchid',
    render: (c, isCustom, customColor) => (
      <LockArea pos="left">
        <LockGlyph customColor={customColor} />
        <div className="flex items-end gap-8" style={{ color: customColor || 'white' }}>
          <div
            style={{
              fontFamily: 'Instrument Serif, serif',
              fontStyle: 'italic',
              fontSize: 240,
              lineHeight: 0.78,
              letterSpacing: -6,
            }}
          >
            {c.hh}
          </div>
          <div
            className="mb-6"
            style={{
              fontFamily: 'Instrument Sans, sans-serif',
              fontWeight: 600,
              fontSize: 48,
              letterSpacing: 14,
              opacity: 0.75,
            }}
          >
            {c.mm}
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 18,
    name: 'Атлетик',
    nameEn: 'Athletic Jersey',
    font: 'Big Shoulders Display',
    cat: 'digital',
    wallpaper: LOCKSCREEN_WALLPAPERS.lime.url,
    ink: 'dark',
    blurbRu: 'Спортивный конденсед на всю ширину. Цифры как номер на майке.',
    blurbEn: 'Ultra condensed athletic display numbers reminiscent of vintage sports jerseys.',
    accentPalette: 'forest_moss',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <div className="w-full px-8" style={{ fontFamily: 'Big Shoulders Display, sans-serif', color: customColor || '#171717' }}>
          <div style={{ fontSize: 220, fontWeight: 800, lineHeight: 0.75, letterSpacing: -6, textAlign: 'center' }}>
            {c.hh}
            <span className="opacity-30">:</span>
            {c.mm}
          </div>
          <div
            className="mt-6 text-center text-[18px] font-bold uppercase tracking-[0.42em] opacity-55"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {c.weekday} {c.day} {c.month}
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 19,
    name: 'Стеклянный Док',
    nameEn: 'Glass Dock Widgets',
    font: 'Figtree',
    cat: 'playful',
    wallpaper: LOCKSCREEN_WALLPAPERS.ocean.url,
    ink: 'light',
    blurbRu: 'Стеклянные виджеты Windows-style: время, сообщения, календарь в ряд.',
    blurbEn: 'Frosted acrylic glass cards with time, chat and calendar events in a horizontal row.',
    accentPalette: 'ocean_teal',
    render: (c) => (
      <div className="flex h-full flex-col justify-end px-14 pb-[120px]" style={{ fontFamily: 'Figtree, sans-serif' }}>
        <div className="flex gap-4">
          <div className="min-w-[280px] rounded-[32px] bg-white/16 p-7 text-left text-white backdrop-blur-2xl shadow-xl">
            <div className="text-[56px] font-extrabold tracking-tight">
              {c.hh}:{c.mm}
            </div>
            <div className="text-[16px] capitalize opacity-75">{c.dateLine}</div>
          </div>
          <div className="flex-1 rounded-[32px] bg-white/14 p-6 text-left text-white backdrop-blur-2xl shadow-xl">
            <div className="text-[13px] font-bold uppercase tracking-[0.18em] opacity-60">Сообщения</div>
            <div className="mt-2 text-[22px] font-semibold">LinkerRu · Система готова к работе</div>
          </div>
          <div className="w-[260px] rounded-[32px] bg-white/14 p-6 text-left text-white backdrop-blur-2xl shadow-xl">
            <div className="text-[13px] font-bold uppercase tracking-[0.18em] opacity-60">Календарь</div>
            <div className="mt-2 text-[22px] font-semibold">Встреча · 18:00</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 20,
    name: 'Вертикальный Тотем',
    nameEn: 'Vertical Totem',
    font: 'Oswald',
    cat: 'digital',
    wallpaper: LOCKSCREEN_WALLPAPERS.coral.url,
    ink: 'light',
    blurbRu: 'Вертикальный тотем слева, остальной монитор — обои. Oswald ведёт глаз.',
    blurbEn: 'Vertical stacked dual-column numerals anchored to left margin.',
    accentPalette: 'terracotta_sand',
    render: (c, isCustom, customColor) => (
      <div className="flex h-full items-center pl-16">
        <div className="flex items-center gap-8" style={{ color: customColor || 'white' }}>
          <div
            className="flex flex-col items-center leading-none"
            style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 600 }}
          >
            {c.hh.split('').map((ch, i) => (
              <span key={i} style={{ fontSize: 120 }}>
                {ch}
              </span>
            ))}
          </div>
          <div className="h-[280px] w-px bg-white/40" style={{ backgroundColor: customColor }} />
          <div
            className="flex flex-col items-center leading-none opacity-70"
            style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 500 }}
          >
            {c.mm.split('').map((ch, i) => (
              <span key={i} style={{ fontSize: 120 }}>
                {ch}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 21,
    name: 'Морфинг Форм',
    nameEn: 'Shape Morph',
    font: 'Lexend',
    cat: 'playful',
    wallpaper: LOCKSCREEN_WALLPAPERS.sunset.url,
    ink: 'light',
    blurbRu: 'Циферблат внутри морфинга. Lexend держит читаемость на живой форме.',
    blurbEn: 'Dynamic pastel gradient morph shape hosting clean Lexend readability.',
    accentPalette: 'terracotta_sand',
    render: (c) => (
      <LockArea pos="center">
        <div
          className="blob-morph grid h-[360px] w-[360px] place-items-center bg-gradient-to-br from-[#ffb4ab] to-[#eaddff] text-neutral-900 shadow-2xl"
          style={{ fontFamily: 'Lexend, sans-serif' }}
        >
          <div className="text-center">
            <div className="text-[14px] font-semibold uppercase tracking-[0.24em] opacity-50">now</div>
            <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>
              {c.hh}:{c.mm}
            </div>
            <div className="text-[18px] font-medium opacity-60">{c.ss}s</div>
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 22,
    name: 'Утреннее Солнце',
    nameEn: 'Morning Sun',
    font: 'Nunito',
    cat: 'analog',
    wallpaper: LOCKSCREEN_WALLPAPERS.sand.url,
    ink: 'dark',
    blurbRu: 'Тёплый аналог без секундной суеты. Утренний lock для рабочего стола.',
    blurbEn: 'Warm amber glow clock face without rushing seconds. Serene morning mood.',
    accentPalette: 'terracotta_sand',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <div className="flex items-center gap-14">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-[#ffddb5]/70 blur-md" />
            <AnalogClockFace
              size={300}
              now={c.now}
              face="#fff8f0"
              hour="#4a2800"
              minute="#8b5000"
              second="#c46b2a"
              cap="#c46b2a"
              tick="rgba(74,40,0,0.28)"
              hourW={12}
              minuteW={7}
              secondW={0}
            />
          </div>
          <div className="text-left text-neutral-800" style={{ fontFamily: 'Nunito, sans-serif', color: customColor }}>
            <div className="text-[18px] font-bold uppercase tracking-[0.28em] opacity-50">добрый день</div>
            <div className="text-[64px] font-extrabold leading-none">
              {c.hh}:{c.mm}
            </div>
            <div className="mt-2 text-[20px] font-bold capitalize">
              {c.day} {c.month}
            </div>
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 23,
    name: 'Секунды-Герой',
    nameEn: 'Seconds Hero',
    font: 'Barlow Condensed',
    cat: 'digital',
    wallpaper: LOCKSCREEN_WALLPAPERS.indigo.url,
    ink: 'light',
    blurbRu: 'Инверсия иерархии на ПК: секунды — герой, часы шепчут.',
    blurbEn: 'Hierarchy inverted: pulsating seconds take center stage, hours remain subtle.',
    accentPalette: 'indigo_violet',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', color: customColor || 'white' }}>
          <div className="text-[22px] font-semibold tracking-[0.5em] opacity-60 text-center">
            {c.hh}:{c.mm}
          </div>
          <div className="tickpop text-center" style={{ fontSize: 280, fontWeight: 800, lineHeight: 0.82, letterSpacing: -8 }}>
            {c.ss}
          </div>
          <div className="text-[16px] uppercase tracking-[0.32em] opacity-50 text-center">seconds</div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 24,
    name: 'Бегущий Тикер',
    nameEn: 'Marquee Ticker',
    font: 'Chivo Mono',
    cat: 'digital',
    wallpaper: LOCKSCREEN_WALLPAPERS.lime.url,
    ink: 'dark',
    blurbRu: 'Бегущая строка во весь монитор, как городской LED над рабочим столом.',
    blurbEn: 'Widescreen looping LED electronic stock & status marquee above desk.',
    accentPalette: 'forest_moss',
    render: (c, isCustom, customColor) => (
      <div className="flex h-full flex-col justify-center">
        <div
          className="overflow-hidden bg-neutral-900 py-4 text-lime-300 shadow-xl"
          style={{ fontFamily: 'Chivo Mono, monospace', fontWeight: 600 }}
        >
          <div className="marquee-track text-[28px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="px-8">
                {c.hh}:{c.mm}:{c.ss} · {c.dateLine.toUpperCase()} · LINKERRU · LOCKED · ONLINE ·
              </span>
            ))}
          </div>
        </div>
        <div
          className="mt-10 text-center"
          style={{ fontFamily: 'Chivo Mono, monospace', fontSize: 96, fontWeight: 700, letterSpacing: -2, color: customColor || '#171717' }}
        >
          {c.hh}:{c.mm}
        </div>
      </div>
    ),
  },
  {
    id: 25,
    name: 'Дата-Герой',
    nameEn: 'Date Hero',
    font: 'DM Serif Display',
    cat: 'type',
    wallpaper: LOCKSCREEN_WALLPAPERS.wine.url,
    ink: 'light',
    blurbRu: 'Календарь важнее часов. День — display, время — сноска в углу.',
    blurbEn: 'Calendar hero: massive day numeral takes the lead, time sits quietly alongside.',
    accentPalette: 'lavender_orchid',
    render: (c, isCustom, customColor) => (
      <LockArea pos="left">
        <LockGlyph customColor={customColor} />
        <div style={{ color: customColor || 'white' }}>
          <div
            className="text-[16px] uppercase tracking-[0.32em] opacity-60"
            style={{ fontFamily: 'Instrument Sans, sans-serif' }}
          >
            {c.weekday}
          </div>
          <div className="flex items-end gap-8">
            <div
              style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: 240,
                lineHeight: 0.85,
                fontStyle: 'italic',
              }}
            >
              {c.day}
            </div>
            <div className="mb-6">
              <div className="text-[40px] capitalize" style={{ fontFamily: 'DM Serif Display, serif' }}>
                {c.month}
              </div>
              <div className="mt-2 text-[32px] font-medium tabular-nums opacity-80" style={{ fontFamily: 'Instrument Sans, sans-serif' }}>
                {c.hh}:{c.mm}
              </div>
            </div>
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 26,
    name: 'Чанки Постер',
    nameEn: 'Chunky Bowlby',
    font: 'Bowlby One',
    cat: 'playful',
    wallpaper: LOCKSCREEN_WALLPAPERS.candy.url,
    ink: 'dark',
    blurbRu: 'Максимально толстые буквы на весь экран. Детский постер, взрослый ПК.',
    blurbEn: 'Ultra heavy joyful block numbers across the canvas with playful wobble animations.',
    accentPalette: 'lavender_orchid',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <div className="wobble" style={{ fontFamily: 'Bowlby One, sans-serif', color: customColor || '#171717' }}>
          <div className="flex items-center gap-6" style={{ fontSize: 180, lineHeight: 0.85, letterSpacing: -4 }}>
            <span>{c.hh}</span>
            <span className="text-[#7a2e4a]">{c.mm}</span>
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 27,
    name: 'Гибрид Кольца',
    nameEn: 'Ring Progress Hybrid',
    font: 'Recursive',
    cat: 'analog',
    wallpaper: LOCKSCREEN_WALLPAPERS.ocean.url,
    ink: 'light',
    blurbRu: 'Кольца прогресса + цифра. Recursive — почти системный моно для десктопа.',
    blurbEn: 'Triple progress rings for hours/minutes/seconds surrounding digital readout.',
    accentPalette: 'ocean_teal',
    render: (c, isCustom, customColor) => (
      <LockArea pos="center">
        <div className="flex items-center gap-16">
          <div className="relative grid place-items-center">
            <RingClockFace size={340} now={c.now} />
            <div
              className="absolute"
              style={{ fontFamily: 'Recursive, sans-serif', fontWeight: 800, fontSize: 42, letterSpacing: -1, color: customColor || 'white' }}
            >
              {c.hh}:{c.mm}
            </div>
          </div>
          <div className="text-left" style={{ fontFamily: 'Recursive, sans-serif', color: customColor || 'white' }}>
            <div className="flex flex-col gap-3 text-[14px] uppercase tracking-[0.22em]">
              <span className="text-[#d0bcff]">час · {c.hh}</span>
              <span className="text-[#efb8c8]">мин · {c.mm}</span>
              <span className="text-[#a4f4d8]">сек · {c.ss}</span>
            </div>
            <div className="mt-6 text-[18px] capitalize opacity-70">{c.dateLine}</div>
          </div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 28,
    name: 'Спектр M3',
    nameEn: 'M3 Spectrum Fields',
    font: 'Bebas Neue',
    cat: 'digital',
    wallpaper: LOCKSCREEN_WALLPAPERS.sunset.url,
    ink: 'light',
    blurbRu: 'Горизонтальные цветовые поля M3 через весь монитор. Bebas как плакат.',
    blurbEn: 'Horizontal tonal color bands running across the display with Bebas display font.',
    accentPalette: 'terracotta_sand',
    render: (c, isCustom, customColor) => (
      <div className="relative h-full">
        <div className="absolute inset-x-0 top-[28%] flex h-52 flex-col opacity-90">
          {['#6750A4', '#7D5260', '#006A6A', '#7C5800', '#BA1A1A'].map((col) => (
            <div key={col} className="flex-1" style={{ background: col }} />
          ))}
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-white" style={{ color: customColor }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 180, letterSpacing: 6, lineHeight: 0.9 }}>
            {c.hh}:{c.mm}
          </div>
          <div className="text-[16px] uppercase tracking-[0.36em] opacity-85">{c.dateLine}</div>
        </div>
      </div>
    ),
  },
  {
    id: 29,
    name: 'Рукопись',
    nameEn: 'Handwritten Script',
    font: 'Caveat',
    cat: 'type',
    wallpaper: LOCKSCREEN_WALLPAPERS.sage.url,
    ink: 'dark',
    blurbRu: 'Рука на обоях рабочего стола. Несовершенство как выразительный жест.',
    blurbEn: 'Organic handwritten cursive gesture sketched over the wallpaper.',
    accentPalette: 'sage_khaki',
    render: (c, isCustom, customColor) => (
      <LockArea pos="left">
        <div style={{ fontFamily: 'Caveat, cursive', color: customColor || '#171717' }}>
          <div className="text-[28px] opacity-60">сейчас уже</div>
          <div style={{ fontSize: 160, fontWeight: 700, lineHeight: 0.85 }}>
            {c.hours}:{c.mm}
          </div>
          <svg width="420" height="28" className="-mt-2 opacity-50">
            <path d="M4 16 C120 2, 240 26, 410 12" fill="none" stroke="currentColor" strokeWidth="3" />
          </svg>
          <div className="text-[36px] capitalize opacity-70">{c.weekday}</div>
        </div>
      </LockArea>
    ),
  },
  {
    id: 30,
    name: 'Ступени',
    nameEn: 'Staggered Steps',
    font: 'Space Grotesk',
    cat: 'playful',
    wallpaper: LOCKSCREEN_WALLPAPERS.coral.url,
    ink: 'light',
    blurbRu: 'Цифры на разных базовых линиях. Ритм вместо сетки — на всю ширину ПК.',
    blurbEn: 'Digits dynamically staggered on alternating baselines creating visual jazz rhythm.',
    accentPalette: 'terracotta_sand',
    render: (c, isCustom, customColor) => {
      const digits = [c.hh[0], c.hh[1], c.mm[0], c.mm[1]];
      const sizes = [180, 120, 210, 96];
      const ys = [0, 36, -18, 48];
      return (
        <LockArea pos="center">
          <LockGlyph customColor={customColor} />
          <div className="flex items-end gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: customColor || 'white' }}>
            {digits.map((d, i) => (
              <span
                key={i}
                style={{
                  fontSize: sizes[i],
                  transform: `translateY(${ys[i]}px)`,
                  lineHeight: 1,
                  letterSpacing: -4,
                  opacity: i === 2 ? 1 : 0.82,
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </LockArea>
      );
    },
  },
];

const GOOGLE_FONTS_LIST = [
  'Outfit',
  'Fraunces',
  'Syne',
  'Fredoka',
  'Newsreader',
  'Plus Jakarta Sans',
  'Archivo Black',
  'IBM Plex Mono',
  'Unbounded',
  'Playfair Display',
  'Bricolage Grotesque',
  'Climate Crisis',
  'Comfortaa',
  'Sora',
  'Manrope',
  'Orbitron',
  'Instrument Serif',
  'Big Shoulders Display',
  'Figtree',
  'Oswald',
  'Lexend',
  'Nunito',
  'Barlow Condensed',
  'Chivo Mono',
  'DM Serif Display',
  'Bowlby One',
  'Recursive',
  'Bebas Neue',
  'Caveat',
  'Space Grotesk',
];

export function LockScreenManagerApp({
  lang,
  activePalette,
  currentWallpaper,
  currentStandbyBg,
  onApplyToStandby,
  onApplyToHome,
  onApplyToBoth,
  onApplyThemePalette,
  triggerToast,
  playChime,
}: LockScreenManagerAppProps) {
  const isRu = lang === 'ru';
  const isUk = lang === 'uk';

  const [activeTab, setActiveTab] = useState<'gallery' | 'builder' | 'saved'>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<'all' | LockCategory>('all');
  const [selectedDesignId, setSelectedDesignId] = useState<number | null>(1);
  const [immersiveDesign, setImmersiveDesign] = useState<LockDesign | null>(null);

  // Custom Lockscreen Builder State
  const [customConfig, setCustomConfig] = useState<CustomLockscreenConfig>(() => {
    const saved = localStorage.getItem('linkerru_custom_builder_lock');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      id: 'custom_default',
      name: isRu ? 'Мой локскрин' : 'My Lockscreen',
      layoutStyle: 1,
      font: 'Outfit',
      ink: 'light',
      customTextColor: '#ffffff',
      wallpaper: LOCKSCREEN_WALLPAPERS.indigo.url,
      pos: 'left',
      showLock: true,
      showChrome: true,
      showDate: true,
      showSeconds: false,
      showWidgets: true,
      fontSizeScale: 1.0,
      letterSpacing: 0,
      savedAt: Date.now(),
    };
  });

  const [savedLockscreens, setSavedLockscreens] = useState<CustomLockscreenConfig[]>(() => {
    const saved = localStorage.getItem('linkerru_custom_lockscreens');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Time state for live updates
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const ctx = useMemo(() => buildLockCtx(now, lang), [now, lang]);

  const filteredDesigns = useMemo(() => {
    if (selectedCategory === 'all') return LOCK_DESIGNS;
    return LOCK_DESIGNS.filter((d) => d.cat === selectedCategory);
  }, [selectedCategory]);

  const currentSelectedDesign = useMemo(() => {
    return LOCK_DESIGNS.find((d) => d.id === selectedDesignId) || LOCK_DESIGNS[0];
  }, [selectedDesignId]);

  const handleApplyDesignToStandby = (design: LockDesign) => {
    playChime?.('victory');
    localStorage.setItem('linkerru_standby_lock_design', String(design.id));
    localStorage.setItem('linkerru_standby_lock_custom', '');
    onApplyToStandby(design.wallpaper, design.id);
    triggerToast?.(
      isRu
        ? `Локскрин «${design.name}» установлен на экран часов!`
        : `Lockscreen "${design.nameEn}" set as Standby Clock!`
    );
  };

  const handleApplyDesignWallpaper = (design: LockDesign) => {
    playChime?.('victory');
    onApplyToHome(design.wallpaper);
    triggerToast?.(
      isRu ? 'Обои применены на главный экран!' : 'Wallpaper applied to Home Screen!'
    );
  };

  const handleApplyCustomLockscreen = () => {
    playChime?.('victory');
    localStorage.setItem('linkerru_standby_lock_design', 'custom');
    localStorage.setItem('linkerru_custom_builder_lock', JSON.stringify(customConfig));
    onApplyToStandby(customConfig.wallpaper, 999, customConfig);
    triggerToast?.(
      isRu
        ? 'Ваш кастомный локскрин установлен на экран часов!'
        : 'Your custom lockscreen set as Standby Clock!'
    );
  };

  const handleSaveCustomPreset = () => {
    const newPreset: CustomLockscreenConfig = {
      ...customConfig,
      id: 'custom_' + Date.now(),
      name: customConfig.name || (isRu ? `Локскрин #${savedLockscreens.length + 1}` : `Lockscreen #${savedLockscreens.length + 1}`),
      savedAt: Date.now(),
    };
    const updated = [newPreset, ...savedLockscreens.filter((s) => s.id !== newPreset.id)];
    setSavedLockscreens(updated);
    localStorage.setItem('linkerru_custom_lockscreens', JSON.stringify(updated));
    playChime?.('victory');
    triggerToast?.(isRu ? 'Локскрин сохранён в коллекцию!' : 'Lockscreen saved to presets!');
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedLockscreens.filter((s) => s.id !== id);
    setSavedLockscreens(updated);
    localStorage.setItem('linkerru_custom_lockscreens', JSON.stringify(updated));
    playChime?.('click');
    triggerToast?.(isRu ? 'Локскрин удалён' : 'Preset removed');
  };

  const handleLoadSaved = (preset: CustomLockscreenConfig) => {
    setCustomConfig(preset);
    setActiveTab('builder');
    playChime?.('click');
    triggerToast?.(isRu ? `Загружен «${preset.name}»` : `Loaded "${preset.name}"`);
  };

  const handleEditDesignInBuilder = (design: LockDesign) => {
    setCustomConfig({
      ...customConfig,
      layoutStyle: design.id,
      font: design.font,
      ink: design.ink,
      wallpaper: design.wallpaper,
      name: design.name,
    });
    setActiveTab('builder');
    playChime?.('click');
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--surface)] text-[var(--on-surface)]">
      {/* Top Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--outline-var)] px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm">
            <Lock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight">LockM</h2>
              <span className="rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-[10px] font-black text-[var(--accent)]">
                M3 Expressive
              </span>
            </div>
            <p className="text-xs text-[var(--on-surface-var)]">
              {isRu
                ? '30 экранов блокировки 16:9 и конструктор кастомных часов'
                : '30 16:9 Typography Lock Screens & Custom Clock Builder'}
            </p>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex items-center rounded-full border border-[var(--outline-var)] bg-[var(--container)] p-1">
          <button
            onClick={() => {
              setActiveTab('gallery');
              playChime?.('click');
            }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'gallery'
                ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-xs'
                : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
            }`}
          >
            <Layers size={14} />
            <span>{isRu ? 'Галерея 30' : 'Gallery 30'}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('builder');
              playChime?.('click');
            }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'builder'
                ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-xs'
                : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
            }`}
          >
            <Sliders size={14} />
            <span>{isRu ? 'Конструктор' : 'Builder'}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('saved');
              playChime?.('click');
            }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'saved'
                ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-xs'
                : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
            }`}
          >
            <Save size={14} />
            <span>
              {isRu ? 'Мои стили' : 'Saved'} ({savedLockscreens.length})
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {/* TAB 1: GALLERY OF 30 DESIGNS */}
        {activeTab === 'gallery' && (
          <div className="flex flex-col gap-6">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'all', labelRu: 'Все (30)', labelEn: 'All (30)' },
                    { id: 'digital', labelRu: 'Цифровые', labelEn: 'Digital' },
                    { id: 'analog', labelRu: 'Аналоговые', labelEn: 'Analog' },
                    { id: 'type', labelRu: 'Типографика', labelEn: 'Typography' },
                    { id: 'playful', labelRu: 'Игривые M3', labelEn: 'Playful M3' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.id);
                      playChime?.('click');
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                      selectedCategory === c.id
                        ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                        : 'border border-[var(--outline-var)] bg-[var(--container)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--container-high)]'
                    }`}
                  >
                    {isRu ? c.labelRu : c.labelEn}
                  </button>
                ))}
              </div>

              <span className="text-xs font-bold text-[var(--on-surface-var)]">
                {filteredDesigns.length} {isRu ? 'вариантов' : 'presets'}
              </span>
            </div>

            {/* Grid of Lock Screens */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredDesigns.map((design) => {
                const isSelected = selectedDesignId === design.id;
                return (
                  <div
                    key={design.id}
                    className={`group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--container)] shadow-lg'
                        : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--outline)] hover:shadow-md'
                    }`}
                  >
                    {/* 16:9 Laptop/Monitor Screen Mockup */}
                    <div
                      onClick={() => {
                        setSelectedDesignId(design.id);
                        playChime?.('click');
                      }}
                      className="relative aspect-video w-full cursor-pointer overflow-hidden bg-black"
                    >
                      {/* Background Wallpaper */}
                      <img
                        src={design.wallpaper}
                        alt={design.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div
                        className={`absolute inset-0 ${
                          design.ink === 'light'
                            ? 'bg-gradient-to-b from-black/35 via-transparent to-black/45'
                            : 'bg-gradient-to-b from-white/10 via-transparent to-black/15'
                        }`}
                      />

                      {/* Render Scale Frame */}
                      <div
                        className="pointer-events-none absolute inset-0 origin-top-left"
                        style={{
                          transform: 'scale(0.3125)',
                          width: `${CANVAS_W}px`,
                          height: `${CANVAS_H}px`,
                        }}
                      >
                        {design.render(ctx)}
                        <LockChromeBar light={design.ink === 'light'} />
                      </div>

                      {/* Corner Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-md">
                          #{pad(design.id)}
                        </span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                          {design.font}
                        </span>
                      </div>

                      {/* Fullscreen button overlay on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImmersiveDesign(design);
                          playChime?.('click');
                        }}
                        className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity backdrop-blur-md group-hover:opacity-100 hover:bg-black/80"
                        title={isRu ? 'Полноэкранный тест' : 'Fullscreen Preview'}
                      >
                        <Maximize2 size={14} />
                      </button>
                    </div>

                    {/* Card Body & Actions */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-extrabold text-[var(--on-surface)]">
                            {isRu ? design.name : design.nameEn}
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">
                            {design.cat}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--on-surface-var)] leading-relaxed">
                          {isRu ? design.blurbRu : design.blurbEn}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3.5 flex items-center gap-2 border-t border-[var(--outline-var)]/60 pt-3">
                        <button
                          onClick={() => handleApplyDesignToStandby(design)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-extrabold text-[var(--on-accent)] shadow-xs transition-opacity hover:opacity-90"
                        >
                          <Clock size={13} />
                          <span>{isRu ? 'На часы' : 'To Standby'}</span>
                        </button>
                        <button
                          onClick={() => handleApplyDesignWallpaper(design)}
                          className="flex items-center justify-center rounded-xl border border-[var(--outline-var)] bg-[var(--container)] p-2 text-[var(--on-surface)] hover:bg-[var(--container-high)]"
                          title={isRu ? 'Применить только обои' : 'Apply Wallpaper'}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleEditDesignInBuilder(design)}
                          className="flex items-center justify-center rounded-xl border border-[var(--outline-var)] bg-[var(--container)] p-2 text-[var(--on-surface)] hover:bg-[var(--container-high)]"
                          title={isRu ? 'Редактировать в конструкторе' : 'Edit in Builder'}
                        >
                          <Sliders size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: BUILD YOUR OWN LOCKSCREEN (BUILDER) */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Live 16:9 Canvas Preview */}
            <div className="flex flex-col gap-4 lg:col-span-7 xl:col-span-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--on-surface)]">
                    {isRu ? 'Интерактивный предпросмотр' : 'Live Lockscreen Preview'}
                  </h3>
                  <span className="text-xs text-[var(--on-surface-var)]">
                    16:9 Desktop Studio
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const base = LOCK_DESIGNS.find((d) => d.id === customConfig.layoutStyle) || LOCK_DESIGNS[0];
                      setImmersiveDesign(base);
                      playChime?.('click');
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--outline-var)] bg-[var(--container)] px-3 py-1.5 text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--container-high)]"
                  >
                    <Maximize2 size={13} />
                    <span>{isRu ? 'Полный экран' : 'Fullscreen'}</span>
                  </button>
                </div>
              </div>

              {/* Monitor Bezel Container */}
              <div className="w-full overflow-hidden rounded-[24px] border-[8px] border-[#16161a] bg-[#16161a] p-1 shadow-2xl">
                <div className="phone-shine relative aspect-video w-full overflow-hidden rounded-[16px] bg-black">
                  {/* Background Image / Wallpaper */}
                  <img
                    src={customConfig.wallpaper}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 ${
                      customConfig.ink === 'light'
                        ? 'bg-gradient-to-b from-black/35 via-transparent to-black/45'
                        : 'bg-gradient-to-b from-white/10 via-transparent to-black/15'
                    }`}
                  />

                  {/* Scaled Render */}
                  <div
                    className="absolute inset-0 origin-top-left"
                    style={{
                      transform: 'scale(0.55)',
                      width: `${CANVAS_W}px`,
                      height: `${CANVAS_H}px`,
                    }}
                  >
                    {(() => {
                      const base = LOCK_DESIGNS.find((d) => d.id === customConfig.layoutStyle) || LOCK_DESIGNS[0];
                      const customColor =
                        customConfig.ink === 'custom'
                          ? customConfig.customTextColor
                          : customConfig.ink === 'accent'
                          ? activePalette.primary
                          : undefined;
                      return base.render(ctx, true, customColor);
                    })()}
                    {customConfig.showChrome && (
                      <LockChromeBar light={customConfig.ink !== 'dark'} />
                    )}
                  </div>
                </div>
              </div>

              {/* Main Apply Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--outline-var)] bg-[var(--container)] p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customConfig.name}
                    onChange={(e) => setCustomConfig({ ...customConfig, name: e.target.value })}
                    placeholder={isRu ? 'Название локскрина' : 'Lockscreen Name'}
                    className="rounded-xl border border-[var(--outline-var)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--on-surface)] outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    onClick={handleSaveCustomPreset}
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--outline-var)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--container-high)]"
                    title={isRu ? 'Сохранить пресет' : 'Save preset'}
                  >
                    <Save size={14} />
                    <span>{isRu ? 'Сохранить' : 'Save'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onApplyToHome(customConfig.wallpaper);
                      playChime?.('victory');
                      triggerToast?.(isRu ? 'Обои применены на рабочий стол!' : 'Wallpaper applied to Home!');
                    }}
                    className="rounded-xl border border-[var(--outline-var)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--container-high)]"
                  >
                    {isRu ? 'Обои на экран' : 'Apply Wallpaper'}
                  </button>
                  <button
                    onClick={handleApplyCustomLockscreen}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-extrabold text-[var(--on-accent)] shadow-md hover:opacity-90"
                  >
                    <Clock size={14} />
                    <span>{isRu ? 'Установить локскрин' : 'Set as Lockscreen'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Customization Controls */}
            <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
              {/* Section 1: Clock Typography Style */}
              <div className="flex flex-col gap-3 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--on-surface-var)]">
                    {isRu ? '1. Выберите стиль часов (1–30)' : '1. Select Clock Style (1–30)'}
                  </span>
                  <span className="text-xs font-bold text-[var(--accent)]">
                    #{customConfig.layoutStyle}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                  {LOCK_DESIGNS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setCustomConfig({
                          ...customConfig,
                          layoutStyle: d.id,
                          font: d.font,
                          ink: d.ink,
                        });
                        playChime?.('click');
                      }}
                      className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all ${
                        customConfig.layoutStyle === d.id
                          ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs font-black'
                          : 'border border-[var(--outline-var)] bg-[var(--container)] text-[var(--on-surface)] hover:bg-[var(--container-high)]'
                      }`}
                    >
                      <span className="text-[11px] font-extrabold">{d.id}</span>
                      <span className="text-[8px] truncate w-full opacity-80">{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Wallpaper Background */}
              <div className="flex flex-col gap-3 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--on-surface-var)]">
                  {isRu ? '2. Обои локскрина' : '2. Lockscreen Wallpaper'}
                </span>

                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(LOCKSCREEN_WALLPAPERS).map(([key, item]) => {
                    const isSelected = customConfig.wallpaper === item.url;
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          setCustomConfig({ ...customConfig, wallpaper: item.url });
                          playChime?.('click');
                        }}
                        className={`relative aspect-video cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                          isSelected ? 'border-[var(--accent)] scale-105 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img src={item.url} alt={item.nameRu} className="h-full w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-0.5 text-center text-[7.5px] font-bold text-white truncate">
                          {isRu ? item.nameRu : item.nameEn}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Text Ink & Custom Color */}
              <div className="flex flex-col gap-3 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--on-surface-var)]">
                  {isRu ? '3. Цвет текста и контраст' : '3. Text Ink Mode'}
                </span>

                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'light', labelRu: 'Светлый', labelEn: 'Light' },
                      { id: 'dark', labelRu: 'Тёмный', labelEn: 'Dark' },
                      { id: 'accent', labelRu: 'Акцент', labelEn: 'Accent' },
                      { id: 'custom', labelRu: 'Свой HEX', labelEn: 'Custom' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setCustomConfig({ ...customConfig, ink: m.id });
                        playChime?.('click');
                      }}
                      className={`rounded-xl py-2 text-xs font-extrabold transition-all ${
                        customConfig.ink === m.id
                          ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                          : 'border border-[var(--outline-var)] bg-[var(--container)] text-[var(--on-surface)] hover:bg-[var(--container-high)]'
                      }`}
                    >
                      {isRu ? m.labelRu : m.labelEn}
                    </button>
                  ))}
                </div>

                {customConfig.ink === 'custom' && (
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="color"
                      value={customConfig.customTextColor}
                      onChange={(e) => setCustomConfig({ ...customConfig, customTextColor: e.target.value })}
                      className="h-9 w-12 rounded-lg border border-[var(--outline-var)] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={customConfig.customTextColor}
                      onChange={(e) => setCustomConfig({ ...customConfig, customTextColor: e.target.value })}
                      className="flex-1 rounded-xl border border-[var(--outline-var)] bg-[var(--surface)] px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Section 4: Chrome & Widgets Toggles */}
              <div className="flex flex-col gap-2 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--on-surface-var)] mb-1">
                  {isRu ? '4. Системные элементы' : '4. System Elements'}
                </span>

                <label className="flex items-center justify-between text-xs font-bold text-[var(--on-surface)] cursor-pointer py-1">
                  <span>{isRu ? 'Нижняя системная панель (Wi-Fi, Power)' : 'Bottom System Bar (Wi-Fi, Power)'}</span>
                  <input
                    type="checkbox"
                    checked={customConfig.showChrome}
                    onChange={(e) => setCustomConfig({ ...customConfig, showChrome: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)] cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SAVED PRESETS */}
        {activeTab === 'saved' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[var(--on-surface)]">
                {isRu ? 'Сохранённые кастомные локскрины' : 'Saved Custom Lock Screens'}
              </h3>
              <button
                onClick={() => {
                  setActiveTab('builder');
                  playChime?.('click');
                }}
                className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-extrabold text-[var(--on-accent)] shadow-xs"
              >
                <Sliders size={13} />
                <span>{isRu ? 'Создать новый' : 'Create New'}</span>
              </button>
            </div>

            {savedLockscreens.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--container)] text-[var(--on-surface-var)]">
                  <Save size={24} />
                </div>
                <h4 className="text-sm font-extrabold text-[var(--on-surface)]">
                  {isRu ? 'Нет сохранённых стилей' : 'No saved presets yet'}
                </h4>
                <p className="max-w-xs text-xs text-[var(--on-surface-var)]">
                  {isRu
                    ? 'Соберите свой уникальный экран в Конструкторе и сохраните его сюда для быстрого переключения.'
                    : 'Design your own unique lockscreen in Builder and save it here for fast switching.'}
                </p>
                <button
                  onClick={() => {
                    setActiveTab('builder');
                    playChime?.('click');
                  }}
                  className="mt-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-extrabold text-[var(--on-accent)]"
                >
                  {isRu ? 'Открыть Конструктор' : 'Open Builder'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {savedLockscreens.map((preset) => {
                  const base = LOCK_DESIGNS.find((d) => d.id === preset.layoutStyle) || LOCK_DESIGNS[0];
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleLoadSaved(preset)}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--outline-var)] bg-[var(--surface-dim)] transition-all hover:border-[var(--accent)] hover:shadow-lg cursor-pointer"
                    >
                      {/* Mini Preview */}
                      <div className="relative aspect-video w-full overflow-hidden bg-black">
                        <img
                          src={preset.wallpaper}
                          alt={preset.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div
                          className="absolute inset-0 origin-top-left"
                          style={{
                            transform: 'scale(0.3125)',
                            width: `${CANVAS_W}px`,
                            height: `${CANVAS_H}px`,
                          }}
                        >
                          {base.render(ctx, true, preset.ink === 'custom' ? preset.customTextColor : undefined)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4">
                        <div>
                          <h4 className="text-sm font-extrabold text-[var(--on-surface)]">{preset.name}</h4>
                          <span className="text-[10px] text-[var(--on-surface-var)]">
                            Базовый стиль #{preset.layoutStyle} · {preset.font}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyCustomLockscreen();
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] shadow-xs"
                            title={isRu ? 'Установить на часы' : 'Set as Lockscreen'}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSaved(preset.id, e)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--container)] text-[var(--on-surface-var)] hover:bg-rose-500 hover:text-white"
                            title={isRu ? 'Удалить' : 'Delete'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FULLSCREEN IMMERSIVE PREVIEW MODAL */}
      <AnimatePresence>
        {immersiveDesign && (
          <div className="fixed inset-0 z-[120] bg-black">
            {/* 16:9 Scaled full viewport canvas */}
            <div className="relative h-full w-full overflow-hidden">
              <img
                src={immersiveDesign.wallpaper}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className={`absolute inset-0 ${
                  immersiveDesign.ink === 'light'
                    ? 'bg-gradient-to-b from-black/35 via-transparent to-black/45'
                    : 'bg-gradient-to-b from-white/10 via-transparent to-black/15'
                }`}
              />

              {/* Full design render scaled to fit */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center"
                style={{
                  width: `${CANVAS_W}px`,
                  height: `${CANVAS_H}px`,
                  transform: `scale(${Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H)}) translate(-50%, -50%)`,
                }}
              >
                {immersiveDesign.render(ctx)}
                <LockChromeBar light={immersiveDesign.ink === 'light'} />
              </div>
            </div>

            {/* Top Toolbar */}
            <div className="absolute top-5 inset-x-5 flex items-center justify-between z-50">
              <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-white backdrop-blur-md border border-white/10">
                <span className="text-[11px] font-bold text-white/60">
                  #{pad(immersiveDesign.id)} · {immersiveDesign.font}
                </span>
                <span className="font-extrabold text-sm">
                  {isRu ? immersiveDesign.name : immersiveDesign.nameEn}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApplyDesignToStandby(immersiveDesign)}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-extrabold text-[var(--on-accent)] shadow-lg"
                >
                  <Clock size={14} />
                  <span>{isRu ? 'Установить на часы' : 'Set as Lockscreen'}</span>
                </button>
                <button
                  onClick={() => setImmersiveDesign(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black font-bold hover:bg-white/90 shadow-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Previous / Next buttons */}
            <button
              onClick={() => {
                const idx = filteredDesigns.findIndex((d) => d.id === immersiveDesign.id);
                const prev = filteredDesigns[(idx - 1 + filteredDesigns.length) % filteredDesigns.length];
                setImmersiveDesign(prev);
                playChime?.('click');
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/30 z-50"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => {
                const idx = filteredDesigns.findIndex((d) => d.id === immersiveDesign.id);
                const next = filteredDesigns[(idx + 1) % filteredDesigns.length];
                setImmersiveDesign(next);
                playChime?.('click');
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/30 z-50"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type Language = 'ru' | 'en' | 'uk';
export type ThemeMode = 'light' | 'dark';
export type ClockType = 'digital' | 'analog';

export interface Material3Palette {
  id: string;
  nameRu: string;
  nameEn: string;
  primary: string;      // Accent Color 1 (e.g. Sage Khaki)
  secondary: string;    // Accent Color 2 (e.g. Khaki Grey)
  tertiary: string;     // Accent Color 3 (e.g. Deep Haki Green)
  lightBg: string;      // Pastel background light (e.g. #F3F5F1)
  darkBg: string;       // Pastel background dark (e.g. #141713)
}

export interface WeatherDay {
  dayRu: string;
  dayEn: string;
  icon: string;
  low: number;
  high: number;
}

export interface WeatherHour {
  time: string;
  icon: string;
  temp: number;
}

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  titleRu: string;
  titleEn: string;
}

/** A single quick-link shown on the home screen panel. */
export interface QuickLink {
  name: string;
  url: string;
}

/** Maximum number of quick links allowed (2 default + 2 custom). */
export const MAX_QUICK_LINKS = 4;

/** The 2 default quick links — always present, editable but not deletable. */
export const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { name: 'Telegram', url: 'https://t.me/linkerru' },
  { name: 'SoundCloud', url: 'https://soundcloud.com' },
];

/** All available quick toggle ids. */
export const TOGGLE_IDS = ['theme', 'language', 'sound', 'contrast', 'night_light'] as const;
export type ToggleId = (typeof TOGGLE_IDS)[number];

/** Maximum number of toggles that can be active in the panel at once. */
export const MAX_TOGGLES = 5;

export type Language = 'ru' | 'en';
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

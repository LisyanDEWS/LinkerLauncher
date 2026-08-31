import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image,
  Sparkles,
  Search,
  Check,
  X,
  Clock,
  Layout,
  Maximize2,
  Layers,
  Palette,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { Language, ThemeMode, Material3Palette } from '../types';

export interface WallpaperItem {
  id: string;
  name: string;
  nameEn?: string;
  nameUk?: string;
  category: 'nature' | 'city' | 'dark' | 'water' | 'abstract' | 'gradient' | 'live_clock';
  categoryLabelRu: string;
  categoryLabelEn: string;
  categoryLabelUk: string;
  preview: string;
  full: string;
  resolution?: string;
  dominantColorHex: string;
  colorPaletteMatch?: string[]; // e.g. ['sage_khaki', 'true_olive', 'forest_moss', 'ocean_teal']
  isGradient?: boolean;
  isLive?: boolean;
  gradientId?: string;
  gradientStyle?: string;
}

export const WALLPAPER_CATALOG: WallpaperItem[] = [
  // --- Nature & Landscapes ---
  {
    id: 'p-10',
    name: 'Горное озеро',
    nameEn: 'Mountain Lake',
    nameUk: 'Гірське озеро',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/10/640/360',
    full: 'https://picsum.photos/id/10/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#4DB6AC',
    colorPaletteMatch: ['ocean_teal', 'sage_khaki', 'classic_slate'],
  },
  {
    id: 'p-11',
    name: 'Долина на рассвете',
    nameEn: 'Dawn Valley',
    nameUk: 'Долина на світанку',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/11/640/360',
    full: 'https://picsum.photos/id/11/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#8FA882',
    colorPaletteMatch: ['sage_khaki', 'true_olive', 'forest_moss'],
  },
  {
    id: 'p-15',
    name: 'Водопад в ущелье',
    nameEn: 'Waterfall Gorge',
    nameUk: 'Водоспад в ущелині',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/15/640/360',
    full: 'https://picsum.photos/id/15/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#22C55E',
    colorPaletteMatch: ['forest_moss', 'true_olive', 'sage_khaki'],
  },
  {
    id: 'p-16',
    name: 'Тропический берег',
    nameEn: 'Tropical Shore',
    nameUk: 'Тропічний берег',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/16/640/360',
    full: 'https://picsum.photos/id/16/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#80CBC4',
    colorPaletteMatch: ['ocean_teal', 'lavender_orchid', 'sage_khaki'],
  },
  {
    id: 'p-28',
    name: 'Лесная тропа',
    nameEn: 'Forest Path',
    nameUk: 'Лісова стежка',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/28/640/360',
    full: 'https://picsum.photos/id/28/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#15803D',
    colorPaletteMatch: ['forest_moss', 'true_olive', 'sage_khaki'],
  },
  {
    id: 'p-29',
    name: 'Горы на закате',
    nameEn: 'Sunset Mountains',
    nameUk: 'Гори на заході сонця',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/29/640/360',
    full: 'https://picsum.photos/id/29/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#D4A373',
    colorPaletteMatch: ['terracotta_sand', 'rose_gold', 'monochrome'],
  },
  {
    id: 'p-54',
    name: 'Зимний хребет',
    nameEn: 'Winter Ridge',
    nameUk: 'Зимовий хребет',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/54/640/360',
    full: 'https://picsum.photos/id/54/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#78909C',
    colorPaletteMatch: ['classic_slate', 'monochrome', 'ocean_teal'],
  },
  {
    id: 'p-58',
    name: 'Маяк на скалах',
    nameEn: 'Cliff Lighthouse',
    nameUk: 'Маяк на скелях',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/58/640/360',
    full: 'https://picsum.photos/id/58/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#37474F',
    colorPaletteMatch: ['classic_slate', 'monochrome', 'ocean_teal'],
  },
  {
    id: 'p-65',
    name: 'Заснеженные вершины',
    nameEn: 'Snowy Peaks',
    nameUk: 'Засніжені вершини',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/65/640/360',
    full: 'https://picsum.photos/id/65/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#78909C',
    colorPaletteMatch: ['classic_slate', 'monochrome'],
  },
  {
    id: 'p-76',
    name: 'Каменное ущелье',
    nameEn: 'Stone Gorge',
    nameUk: 'Кам\'яна ущелина',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/76/640/360',
    full: 'https://picsum.photos/id/76/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#8B5D33',
    colorPaletteMatch: ['terracotta_sand', 'rose_gold'],
  },
  {
    id: 'p-17',
    name: 'Бирюзовая лагуна',
    nameEn: 'Turquoise Lagoon',
    nameUk: 'Бірюзова лагуна',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/17/640/360',
    full: 'https://picsum.photos/id/17/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#006064',
    colorPaletteMatch: ['ocean_teal', 'sage_khaki'],
  },
  {
    id: 'p-18',
    name: 'Океанский прибой',
    nameEn: 'Ocean Surf',
    nameUk: 'Океанський прибій',
    category: 'nature',
    categoryLabelRu: 'Природа',
    categoryLabelEn: 'Nature',
    categoryLabelUk: 'Природа',
    preview: 'https://picsum.photos/id/18/640/360',
    full: 'https://picsum.photos/id/18/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#4DB6AC',
    colorPaletteMatch: ['ocean_teal', 'classic_slate'],
  },

  // --- Cities & Architecture ---
  {
    id: 'p-122',
    name: 'Мегаполис: ночь',
    nameEn: 'Night Metropolis',
    nameUk: 'Мегаполіс: ніч',
    category: 'city',
    categoryLabelRu: 'Город',
    categoryLabelEn: 'City',
    categoryLabelUk: 'Місто',
    preview: 'https://picsum.photos/id/122/640/360',
    full: 'https://picsum.photos/id/122/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#404040',
    colorPaletteMatch: ['monochrome', 'classic_slate', 'rose_gold'],
  },
  {
    id: 'p-133',
    name: 'Автомагистраль ночью',
    nameEn: 'Night Highway',
    nameUk: 'Автомагістраль уночі',
    category: 'city',
    categoryLabelRu: 'Город',
    categoryLabelEn: 'City',
    categoryLabelUk: 'Місто',
    preview: 'https://picsum.photos/id/133/640/360',
    full: 'https://picsum.photos/id/133/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#D4AF37',
    colorPaletteMatch: ['rose_gold', 'terracotta_sand'],
  },
  {
    id: 'p-142',
    name: 'Стеклянный небоскрёб',
    nameEn: 'Glass Skyscraper',
    nameUk: 'Скляний хмарочос',
    category: 'city',
    categoryLabelRu: 'Город',
    categoryLabelEn: 'City',
    categoryLabelUk: 'Місто',
    preview: 'https://picsum.photos/id/142/640/360',
    full: 'https://picsum.photos/id/142/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#80CBC4',
    colorPaletteMatch: ['ocean_teal', 'classic_slate'],
  },
  {
    id: 'p-164',
    name: 'Мост на рассвете',
    nameEn: 'Sunrise Bridge',
    nameUk: 'Міст на світанку',
    category: 'city',
    categoryLabelRu: 'Город',
    categoryLabelEn: 'City',
    categoryLabelUk: 'Місто',
    preview: 'https://picsum.photos/id/164/640/360',
    full: 'https://picsum.photos/id/164/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#CE93D8',
    colorPaletteMatch: ['lavender_orchid', 'terracotta_sand'],
  },
  {
    id: 'p-169',
    name: 'Историческая улица',
    nameEn: 'Historic Street',
    nameUk: 'Історична вулиця',
    category: 'city',
    categoryLabelRu: 'Город',
    categoryLabelEn: 'City',
    categoryLabelUk: 'Місто',
    preview: 'https://picsum.photos/id/169/640/360',
    full: 'https://picsum.photos/id/169/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#D4A373',
    colorPaletteMatch: ['terracotta_sand', 'rose_gold', 'true_olive'],
  },
  {
    id: 'p-175',
    name: 'Часовая башня',
    nameEn: 'Clock Tower',
    nameUk: 'Годинникова вежа',
    category: 'city',
    categoryLabelRu: 'Город',
    categoryLabelEn: 'City',
    categoryLabelUk: 'Місто',
    preview: 'https://picsum.photos/id/175/640/360',
    full: 'https://picsum.photos/id/175/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#78909C',
    colorPaletteMatch: ['classic_slate', 'monochrome'],
  },
  {
    id: 'p-200',
    name: 'Старый квартал',
    nameEn: 'Old Quarter',
    nameUk: 'Старий квартал',
    category: 'city',
    categoryLabelRu: 'Город',
    categoryLabelEn: 'City',
    categoryLabelUk: 'Місто',
    preview: 'https://picsum.photos/id/200/640/360',
    full: 'https://picsum.photos/id/200/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#7B8E6F',
    colorPaletteMatch: ['true_olive', 'sage_khaki', 'terracotta_sand'],
  },
  {
    id: 'p-214',
    name: 'Современный фасад',
    nameEn: 'Modern Facade',
    nameUk: 'Сучасний фасад',
    category: 'city',
    categoryLabelRu: 'Город',
    categoryLabelEn: 'City',
    categoryLabelUk: 'Місто',
    preview: 'https://picsum.photos/id/214/640/360',
    full: 'https://picsum.photos/id/214/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#90A4AE',
    colorPaletteMatch: ['classic_slate', 'monochrome'],
  },

  // --- Dark & OLED Deep Tones ---
  {
    id: 'p-48',
    name: 'Ночные силуэты',
    nameEn: 'Night Silhouettes',
    nameUk: 'Нічні силуети',
    category: 'dark',
    categoryLabelRu: 'Тёмные',
    categoryLabelEn: 'Dark & OLED',
    categoryLabelUk: 'Темні',
    preview: 'https://picsum.photos/id/48/640/360',
    full: 'https://picsum.photos/id/48/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#171717',
    colorPaletteMatch: ['monochrome', 'classic_slate'],
  },
  {
    id: 'p-49',
    name: 'Ночные горы',
    nameEn: 'Night Mountains',
    nameUk: 'Нічні гори',
    category: 'dark',
    categoryLabelRu: 'Тёмные',
    categoryLabelEn: 'Dark & OLED',
    categoryLabelUk: 'Темні',
    preview: 'https://picsum.photos/id/49/640/360',
    full: 'https://picsum.photos/id/49/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#26262c',
    colorPaletteMatch: ['monochrome', 'lavender_orchid'],
  },
  {
    id: 'p-57',
    name: 'Туманный лес',
    nameEn: 'Misty Deep Forest',
    nameUk: 'Туманний ліс',
    category: 'dark',
    categoryLabelRu: 'Тёмные',
    categoryLabelEn: 'Dark & OLED',
    categoryLabelUk: 'Темні',
    preview: 'https://picsum.photos/id/57/640/360',
    full: 'https://picsum.photos/id/57/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#3A4B32',
    colorPaletteMatch: ['true_olive', 'forest_moss', 'monochrome'],
  },
  {
    id: 'p-85',
    name: 'Тёмный океан',
    nameEn: 'Dark Ocean',
    nameUk: 'Темний океан',
    category: 'dark',
    categoryLabelRu: 'Тёмные',
    categoryLabelEn: 'Dark & OLED',
    categoryLabelUk: 'Темні',
    preview: 'https://picsum.photos/id/85/640/360',
    full: 'https://picsum.photos/id/85/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#006064',
    colorPaletteMatch: ['ocean_teal', 'monochrome'],
  },
  {
    id: 'p-96',
    name: 'Дорога в ночи',
    nameEn: 'Road at Night',
    nameUk: 'Дорога в ночі',
    category: 'dark',
    categoryLabelRu: 'Тёмные',
    categoryLabelEn: 'Dark & OLED',
    categoryLabelUk: 'Темні',
    preview: 'https://picsum.photos/id/96/640/360',
    full: 'https://picsum.photos/id/96/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#1a1a1e',
    colorPaletteMatch: ['monochrome', 'terracotta_sand'],
  },
  {
    id: 'p-106',
    name: 'Сумерки над холмами',
    nameEn: 'Twilight Hills',
    nameUk: 'Сутінки над пагорбами',
    category: 'dark',
    categoryLabelRu: 'Тёмные',
    categoryLabelEn: 'Dark & OLED',
    categoryLabelUk: 'Темні',
    preview: 'https://picsum.photos/id/106/640/360',
    full: 'https://picsum.photos/id/106/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#5E35B1',
    colorPaletteMatch: ['lavender_orchid', 'monochrome'],
  },
  {
    id: 'p-116',
    name: 'Тёмные сосны',
    nameEn: 'Dark Pines',
    nameUk: 'Темні сосни',
    category: 'dark',
    categoryLabelRu: 'Тёмные',
    categoryLabelEn: 'Dark & OLED',
    categoryLabelUk: 'Темні',
    preview: 'https://picsum.photos/id/116/640/360',
    full: 'https://picsum.photos/id/116/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#15803D',
    colorPaletteMatch: ['forest_moss', 'true_olive'],
  },
  {
    id: 'p-193',
    name: 'Глубокая тень',
    nameEn: 'Deep Shadows',
    nameUk: 'Глибока тінь',
    category: 'dark',
    categoryLabelRu: 'Тёмные',
    categoryLabelEn: 'Dark & OLED',
    categoryLabelUk: 'Темні',
    preview: 'https://picsum.photos/id/193/640/360',
    full: 'https://picsum.photos/id/193/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#171717',
    colorPaletteMatch: ['monochrome'],
  },

  // --- Minimalism & Textures ---
  {
    id: 'p-24',
    name: 'Книжная геометрия',
    nameEn: 'Geometry',
    nameUk: 'Геометрія',
    category: 'abstract',
    categoryLabelRu: 'Минимализм',
    categoryLabelEn: 'Minimal & Textures',
    categoryLabelUk: 'Мінімалізм',
    preview: 'https://picsum.photos/id/24/640/360',
    full: 'https://picsum.photos/id/24/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#D4A373',
    colorPaletteMatch: ['terracotta_sand', 'rose_gold', 'monochrome'],
  },
  {
    id: 'p-26',
    name: 'Текстура стали',
    nameEn: 'Steel Texture',
    nameUk: 'Текстура сталі',
    category: 'abstract',
    categoryLabelRu: 'Минимализм',
    categoryLabelEn: 'Minimal & Textures',
    categoryLabelUk: 'Мінімалізм',
    preview: 'https://picsum.photos/id/26/640/360',
    full: 'https://picsum.photos/id/26/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#78909C',
    colorPaletteMatch: ['classic_slate', 'monochrome'],
  },
  {
    id: 'p-36',
    name: 'Архитектурный минимализм',
    nameEn: 'Architectural Minimalism',
    nameUk: 'Архітектурний мінімалізм',
    category: 'abstract',
    categoryLabelRu: 'Минимализм',
    categoryLabelEn: 'Minimal & Textures',
    categoryLabelUk: 'Мінімалізм',
    preview: 'https://picsum.photos/id/36/640/360',
    full: 'https://picsum.photos/id/36/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#737373',
    colorPaletteMatch: ['monochrome', 'classic_slate'],
  },
  {
    id: 'p-42',
    name: 'Кофейная композиция',
    nameEn: 'Coffee Warmth',
    nameUk: 'Кавова композиція',
    category: 'abstract',
    categoryLabelRu: 'Минимализм',
    categoryLabelEn: 'Minimal & Textures',
    categoryLabelUk: 'Мінімалізм',
    preview: 'https://picsum.photos/id/42/640/360',
    full: 'https://picsum.photos/id/42/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#8B5D33',
    colorPaletteMatch: ['terracotta_sand', 'rose_gold'],
  },
  {
    id: 'p-64',
    name: 'Монохромная волна',
    nameEn: 'Monochrome Wave',
    nameUk: 'Монохромна хвиля',
    category: 'abstract',
    categoryLabelRu: 'Минимализм',
    categoryLabelEn: 'Minimal & Textures',
    categoryLabelUk: 'Мінімалізм',
    preview: 'https://picsum.photos/id/64/640/360',
    full: 'https://picsum.photos/id/64/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#404040',
    colorPaletteMatch: ['monochrome'],
  },
  {
    id: 'p-102',
    name: 'Малиновый закат',
    nameEn: 'Crimson Glow',
    nameUk: 'Малиновий захід',
    category: 'abstract',
    categoryLabelRu: 'Минимализм',
    categoryLabelEn: 'Minimal & Textures',
    categoryLabelUk: 'Мінімалізм',
    preview: 'https://picsum.photos/id/102/640/360',
    full: 'https://picsum.photos/id/102/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#CE93D8',
    colorPaletteMatch: ['lavender_orchid', 'rose_gold'],
  },
  {
    id: 'p-110',
    name: 'Световые линии',
    nameEn: 'Light Streaks',
    nameUk: 'Світлові лінії',
    category: 'abstract',
    categoryLabelRu: 'Минимализм',
    categoryLabelEn: 'Minimal & Textures',
    categoryLabelUk: 'Мінімалізм',
    preview: 'https://picsum.photos/id/110/640/360',
    full: 'https://picsum.photos/id/110/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#D4AF37',
    colorPaletteMatch: ['rose_gold', 'terracotta_sand'],
  },
  {
    id: 'p-160',
    name: 'Чистый горизонт',
    nameEn: 'Pure Horizon',
    nameUk: 'Чистий горизонт',
    category: 'abstract',
    categoryLabelRu: 'Минимализм',
    categoryLabelEn: 'Minimal & Textures',
    categoryLabelUk: 'Мінімалізм',
    preview: 'https://picsum.photos/id/160/640/360',
    full: 'https://picsum.photos/id/160/1920/1080',
    resolution: '3840 × 2160',
    dominantColorHex: '#8FA882',
    colorPaletteMatch: ['sage_khaki', 'ocean_teal'],
  },

  // --- Clock & Live Shaders & Gradients (Theme Dynamic) ---
  {
    id: 'theme',
    name: 'Адаптивная тема',
    nameEn: 'Adaptive Theme (Clock & Home)',
    nameUk: 'Адаптивна тема',
    category: 'live_clock',
    categoryLabelRu: 'Часы & Тема',
    categoryLabelEn: 'Clock & Theme',
    categoryLabelUk: 'Годинник & Тема',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><radialGradient id="th1" cx="50%" cy="0%" r="90%"><stop offset="0%" stop-color="%236366F1"/><stop offset="100%" stop-color="%231E1B4B"/></radialGradient></defs><rect width="100%" height="100%" fill="url(%23th1)"/></svg>',
    full: 'theme',
    resolution: 'System Dynamic',
    dominantColorHex: '#6366F1',
    isGradient: true,
    isLive: true,
    gradientId: 'theme',
    colorPaletteMatch: ['indigo_violet', 'classic_slate', 'lavender_orchid', 'monochrome'],
  },
  {
    id: 'animated-1',
    name: 'Шёлковые волны',
    nameEn: 'Silk Waves (Live Shader)',
    nameUk: 'Шовкові хвилі (Живі)',
    category: 'live_clock',
    categoryLabelRu: 'Живые обои',
    categoryLabelEn: 'Live Shader',
    categoryLabelUk: 'Живі шпалери',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="sw" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2322C55E"/><stop offset="100%" stop-color="%2315803D"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23sw)"/><path d="M0,180 Q160,80 320,180 T640,180 L640,360 L0,360 Z" fill="rgba(255,255,255,0.15)"/></svg>',
    full: 'animated-1',
    resolution: '60 FPS Live Shader',
    dominantColorHex: '#22C55E',
    isGradient: true,
    isLive: true,
    gradientId: 'animated-1',
    colorPaletteMatch: ['forest_moss', 'true_olive', 'sage_khaki', 'ocean_teal'],
  },
  {
    id: 'animated-2',
    name: 'Рифлёное стекло',
    nameEn: 'Fluted Glass (Live Shader)',
    nameUk: 'Рифлене скло (Живі)',
    category: 'live_clock',
    categoryLabelRu: 'Живые обои',
    categoryLabelEn: 'Live Shader',
    categoryLabelUk: 'Живі шпалери',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230D9488"/><stop offset="100%" stop-color="%23115E59"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23fg)"/><line x1="160" y1="0" x2="160" y2="360" stroke="rgba(255,255,255,0.2)" stroke-width="8"/><line x1="320" y1="0" x2="320" y2="360" stroke="rgba(255,255,255,0.2)" stroke-width="8"/><line x1="480" y1="0" x2="480" y2="360" stroke="rgba(255,255,255,0.2)" stroke-width="8"/></svg>',
    full: 'animated-2',
    resolution: '60 FPS Live Shader',
    dominantColorHex: '#0D9488',
    isGradient: true,
    isLive: true,
    gradientId: 'animated-2',
    colorPaletteMatch: ['ocean_teal', 'sage_khaki', 'monochrome'],
  },
  {
    id: 'animated-3',
    name: 'Ризо-дизеринг',
    nameEn: 'Riso Dither (Live Shader)',
    nameUk: 'Ризо-дизеринг (Живі)',
    category: 'live_clock',
    categoryLabelRu: 'Живые обои',
    categoryLabelEn: 'Live Shader',
    categoryLabelUk: 'Живі шпалери',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="rd" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%239333EA"/><stop offset="100%" stop-color="%23581C87"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23rd)"/><circle cx="320" cy="180" r="100" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="4" stroke-dasharray="8 8"/></svg>',
    full: 'animated-3',
    resolution: '60 FPS Live Shader',
    dominantColorHex: '#9333EA',
    isGradient: true,
    isLive: true,
    gradientId: 'animated-3',
    colorPaletteMatch: ['lavender_orchid', 'indigo_violet', 'rose_gold'],
  },
  {
    id: 'animated-4',
    name: 'Звёздное поле',
    nameEn: 'Starfield Cosmos (Live)',
    nameUk: 'Зоряне поле (Живі)',
    category: 'live_clock',
    categoryLabelRu: 'Живые обои',
    categoryLabelEn: 'Live Cosmos',
    categoryLabelUk: 'Живі шпалери',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="100%" height="100%" fill="%230a0a0f"/><circle cx="100" cy="80" r="2" fill="%23fff"/><circle cx="280" cy="140" r="1.5" fill="%23fff"/><circle cx="450" cy="70" r="2.5" fill="%23fff"/><circle cx="520" cy="220" r="1.8" fill="%23fff"/></svg>',
    full: 'animated-4',
    resolution: '60 FPS Live Cosmos',
    dominantColorHex: '#141218',
    isGradient: true,
    isLive: true,
    gradientId: 'animated-4',
    colorPaletteMatch: ['monochrome', 'classic_slate', 'indigo_violet'],
  },
  {
    id: 'blurred-wallpaper',
    name: 'Размытые обои',
    nameEn: 'Blurred Wallpaper',
    nameUk: 'Розмиті шпалери',
    category: 'live_clock',
    categoryLabelRu: 'Часы & Эффект',
    categoryLabelEn: 'Clock & Blur',
    categoryLabelUk: 'Годинник & Ефект',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="bw" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23374151"/><stop offset="100%" stop-color="%23111827"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23bw)"/><circle cx="320" cy="180" r="80" fill="rgba(255,255,255,0.1)" filter="blur(20px)"/></svg>',
    full: 'blurred-wallpaper',
    resolution: 'Dynamic Backdrop Blur',
    dominantColorHex: '#374151',
    isGradient: true,
    isLive: true,
    gradientId: 'blurred-wallpaper',
    colorPaletteMatch: ['classic_slate', 'monochrome'],
  },
  {
    id: 'gradient-1',
    name: 'Аврора Градиент',
    nameEn: 'Aurora Gradient',
    nameUk: 'Аврора Градієнт',
    category: 'gradient',
    categoryLabelRu: 'Градиенты',
    categoryLabelEn: 'Gradients',
    categoryLabelUk: 'Градієнти',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238FA882"/><stop offset="50%" stop-color="%23A3BA92"/><stop offset="100%" stop-color="%23435B37"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g1)"/></svg>',
    full: 'gradient-1',
    resolution: 'Vector Dynamic',
    dominantColorHex: '#8FA882',
    isGradient: true,
    gradientId: 'gradient-1',
    colorPaletteMatch: ['sage_khaki', 'true_olive', 'forest_moss', 'ocean_teal', 'lavender_orchid', 'terracotta_sand', 'classic_slate', 'rose_gold', 'monochrome'],
  },
  {
    id: 'gradient-2',
    name: 'Орбитальное свечение',
    nameEn: 'Orbital Glow',
    nameUk: 'Орбітальне сяйво',
    category: 'gradient',
    categoryLabelRu: 'Градиенты',
    categoryLabelEn: 'Gradients',
    categoryLabelUk: 'Градієнти',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><radialGradient id="r1" cx="20%" cy="30%" r="70%"><stop offset="0%" stop-color="%2380CBC4"/><stop offset="100%" stop-color="%23006064"/></radialGradient></defs><rect width="100%" height="100%" fill="url(%23r1)"/></svg>',
    full: 'gradient-2',
    resolution: 'Vector Dynamic',
    dominantColorHex: '#80CBC4',
    isGradient: true,
    gradientId: 'gradient-2',
    colorPaletteMatch: ['ocean_teal', 'sage_khaki', 'lavender_orchid', 'monochrome'],
  },
  {
    id: 'gradient-3',
    name: 'Линейный закат',
    nameEn: 'Linear Twilight',
    nameUk: 'Лінійний захід',
    category: 'gradient',
    categoryLabelRu: 'Градиенты',
    categoryLabelEn: 'Gradients',
    categoryLabelUk: 'Градієнти',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23B39DDB"/><stop offset="100%" stop-color="%235E35B1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g3)"/></svg>',
    full: 'gradient-3',
    resolution: 'Vector Dynamic',
    dominantColorHex: '#B39DDB',
    isGradient: true,
    gradientId: 'gradient-3',
    colorPaletteMatch: ['lavender_orchid', 'rose_gold', 'terracotta_sand'],
  },
  {
    id: 'gradient-4',
    name: 'Коническая призма',
    nameEn: 'Conic Prism',
    nameUk: 'Конічна призма',
    category: 'gradient',
    categoryLabelRu: 'Градиенты',
    categoryLabelEn: 'Gradients',
    categoryLabelUk: 'Градієнти',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23D4AF37"/><stop offset="50%" stop-color="%23E6C27A"/><stop offset="100%" stop-color="%238C6D1F"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g4)"/></svg>',
    full: 'gradient-4',
    resolution: 'Vector Dynamic',
    dominantColorHex: '#D4AF37',
    isGradient: true,
    gradientId: 'gradient-4',
    colorPaletteMatch: ['rose_gold', 'terracotta_sand', 'monochrome'],
  },
];

function LiveWallpaperPreview({
  gradientId,
  activePalette,
  dominantColorHex,
  isLarge = false,
}: {
  gradientId?: string;
  activePalette: Material3Palette;
  dominantColorHex: string;
  isLarge?: boolean;
}) {
  const p1 = activePalette.primary;
  const p2 = activePalette.secondary;
  const p3 = activePalette.tertiary;

  if (gradientId === 'animated-1') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-emerald-950/70">
        <div
          data-aifx="silk-waves"
          data-aifx-colors={`${p1},${p2},${p3}`}
          data-aifx-bg={p3}
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />
        <div className="absolute inset-0 opacity-70">
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 20% 50%, ${p1}70 0%, transparent 60%), radial-gradient(ellipse at 80% 60%, ${p2}60 0%, transparent 60%)`,
            }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    );
  }

  if (gradientId === 'animated-2') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-teal-950/70">
        <div
          data-aifx="fluted-glass"
          data-aifx-colors={`${p1},${p2},${p3},${p1}`}
          data-aifx-bg={p3}
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `repeating-linear-gradient(90deg, ${p1}25, ${p1}25 6px, transparent 6px, transparent 14px), linear-gradient(135deg, ${p1}40, ${p2}40)`,
          }}
        />
      </div>
    );
  }

  if (gradientId === 'animated-3') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-purple-950/70">
        <div
          data-aifx="dither"
          data-aifx-colors={`${p1},${p3},${p2},${p1}`}
          data-aifx-bg={p3}
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `radial-gradient(${p1} 1px, transparent 1px), radial-gradient(${p3} 1px, transparent 1px)`,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 4px 4px',
            backgroundColor: `${p2}30`,
          }}
        />
      </div>
    );
  }

  if (gradientId === 'animated-4') {
    const starCount = isLarge ? 45 : 18;
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #090914, #121226)' }}>
        <div
          data-aifx="starfield"
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: '70%',
            height: '70%',
            left: '15%',
            top: '10%',
            background: `radial-gradient(circle, ${p1}40 0%, transparent 65%)`,
            filter: isLarge ? 'blur(25px)' : 'blur(12px)',
          }}
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.95, 1.08, 0.95] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {Array.from({ length: starCount }).map((_, si) => {
          const size = 1 + (si % 3);
          const isAccent = si % 5 === 0;
          return (
            <motion.div
              key={si}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${(si * 53) % 100}%`,
                top: `${(si * 37) % 100}%`,
                background: isAccent ? p1 : si % 7 === 0 ? p3 : '#ffffff',
                boxShadow: `0 0 ${size * 2}px currentColor`,
              }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1.3, 0.6] }}
              transition={{ duration: 1.5 + (si % 3), repeat: Infinity, ease: 'easeInOut', delay: (si * 0.12) % 2 }}
            />
          );
        })}
      </div>
    );
  }

  if (gradientId === 'theme') {
    return (
      <div
        className="w-full h-full flex items-center justify-center relative overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${p1}40 0%, transparent 70%), var(--surface-dim)`,
        }}
      >
        <div className="flex flex-col items-center gap-1.5 z-10">
          <div className="w-8 h-8 rounded-full shadow-md flex items-center justify-center text-white" style={{ background: p1 }}>
            <Sparkles size={16} />
          </div>
          <span className="text-[10px] font-bold text-[var(--on-surface)]">Adaptive Theme</span>
        </div>
      </div>
    );
  }

  if (gradientId === 'blurred-wallpaper') {
    return (
      <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-zinc-900">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${p1}80, transparent 50%), radial-gradient(circle at 70% 70%, ${p2}70, transparent 50%), radial-gradient(circle at 50% 80%, ${p3}60, transparent 50%)`,
            filter: 'blur(16px)',
          }}
        />
        <div className="relative z-10 text-[10px] font-bold text-white/90 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md">
          Backdrop Blur
        </div>
      </div>
    );
  }

  if (gradientId === 'gradient-1') {
    return (
      <div
        className="w-full h-full"
        style={{ background: `linear-gradient(135deg, ${p1}, ${p2}, ${p3})` }}
      />
    );
  }

  if (gradientId === 'gradient-2') {
    return (
      <div
        className="w-full h-full"
        style={{
          background: `radial-gradient(circle at 10% 20%, ${p2} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3} 0%, transparent 50%), linear-gradient(135deg, ${p1}, var(--bg))`,
        }}
      />
    );
  }

  if (gradientId === 'gradient-3') {
    return (
      <div
        className="w-full h-full"
        style={{
          background: `linear-gradient(to bottom right, ${p1} 0%, transparent 100%), linear-gradient(to top right, ${p3} 0%, transparent 100%), var(--bg)`,
        }}
      />
    );
  }

  if (gradientId === 'gradient-4') {
    return (
      <div
        className="w-full h-full"
        style={{
          background: `conic-gradient(from 180deg at 50% 50%, ${p1} 0deg, ${p2} 120deg, ${p3} 240deg, ${p1} 360deg)`,
        }}
      />
    );
  }

  return <div className="w-full h-full" style={{ background: dominantColorHex }} />;
}

interface WallpaperManagerAppProps {
  lang: Language;
  theme?: ThemeMode;
  activePalette?: Material3Palette;
  activePaletteId?: string;
  currentWallpaper?: string;
  currentStandbyBg?: string;
  currentHomeWallpaper?: string;
  currentClockWallpaper?: string;
  onApplyToHome: (wallpaperUrl: string) => void;
  onApplyToClock: (standbyBg: string) => void;
  onApplyToBoth: (wallpaperUrl: string) => void;
  onEnableDynamicTheme?: () => void;
  playChime?: (type?: 'click' | 'alert' | 'reset' | 'victory' | 'toast') => void;
  triggerToast?: (text: string) => void;
  wm?: any;
}

const DEFAULT_FALLBACK_PALETTE: Material3Palette = {
  id: 'indigo_violet',
  nameRu: 'Индиго Фиалка',
  nameEn: 'Indigo Violet',
  primary: '#6366f1',
  secondary: '#8b5cf6',
  tertiary: '#a855f7',
  lightBg: '#F5F5FA',
  darkBg: '#121217',
};

export function WallpaperManagerApp({
  lang,
  theme = 'light',
  activePalette = DEFAULT_FALLBACK_PALETTE,
  activePaletteId = 'indigo_violet',
  currentWallpaper,
  currentStandbyBg,
  currentHomeWallpaper,
  currentClockWallpaper,
  onApplyToHome,
  onApplyToClock,
  onApplyToBoth,
  onEnableDynamicTheme,
  playChime,
  triggerToast,
  wm,
}: WallpaperManagerAppProps) {
  const effectiveCurrentHome = currentWallpaper || currentHomeWallpaper || '';
  const effectiveCurrentStandby = currentStandbyBg || currentClockWallpaper || '';
  const isRu = lang === 'ru';
  const isUk = lang === 'uk';

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperItem | null>(null);

  // Adaptive theme prompt dialog state
  const [showAdaptivePrompt, setShowAdaptivePrompt] = useState(false);
  const [pendingWallpaper, setPendingWallpaper] = useState<WallpaperItem | null>(null);

  // Dynamic Theme Matching: filter / rank wallpapers that complement activePaletteId
  const matchingWallpapers = useMemo(() => {
    return WALLPAPER_CATALOG.filter((wp) => {
      if (!wp.colorPaletteMatch || wp.colorPaletteMatch.length === 0) return true;
      return wp.colorPaletteMatch.includes(activePaletteId) || wp.colorPaletteMatch.includes('monochrome');
    });
  }, [activePaletteId]);

  const categories = useMemo(() => {
    const liveCount = WALLPAPER_CATALOG.filter(
      (w) =>
        w.category === 'live_clock' ||
        w.isLive ||
        w.gradientId?.startsWith('animated-') ||
        w.gradientId === 'theme' ||
        w.gradientId === 'blurred-wallpaper'
    ).length;

    const simpleGradientCount = WALLPAPER_CATALOG.filter(
      (w) =>
        (w.category === 'gradient' || w.isGradient) &&
        !w.isLive &&
        !w.gradientId?.startsWith('animated-') &&
        w.gradientId !== 'theme' &&
        w.gradientId !== 'blurred-wallpaper'
    ).length;

    const cityCount = WALLPAPER_CATALOG.filter((w) => w.category === 'city').length;
    const natureCount = WALLPAPER_CATALOG.filter((w) => w.category === 'nature' || w.category === 'water').length;
    const minimalCount = WALLPAPER_CATALOG.filter(
      (w) => w.category === 'abstract' || w.category === 'dark' || (w.category as any) === 'minimal'
    ).length;

    return [
      {
        id: 'all',
        label: isRu ? 'Все обои' : isUk ? 'Усі шпалери' : 'All Wallpapers',
        count: WALLPAPER_CATALOG.length,
      },
      {
        id: 'live',
        label: isRu ? 'Живые обои' : isUk ? 'Живі шпалери' : 'Live Wallpapers',
        icon: Sparkles,
        count: liveCount,
      },
      {
        id: 'gradient',
        label: isRu ? 'Простые градиенты' : isUk ? 'Прості градієнти' : 'Simple Gradients',
        count: simpleGradientCount,
      },
      {
        id: 'city',
        label: isRu ? 'Города' : isUk ? 'Міста' : 'Cities',
        count: cityCount,
      },
      {
        id: 'nature',
        label: isRu ? 'Природа' : isUk ? 'Природа' : 'Nature',
        count: natureCount,
      },
      {
        id: 'minimal',
        label: isRu ? 'Минималистичные' : isUk ? 'Мінімалістичні' : 'Minimalist',
        count: minimalCount,
      },
    ];
  }, [isRu, isUk]);

  const filteredWallpapers = useMemo(() => {
    let list = WALLPAPER_CATALOG;

    if (activeCategory === 'live') {
      list = WALLPAPER_CATALOG.filter(
        (w) =>
          w.category === 'live_clock' ||
          w.isLive ||
          w.gradientId?.startsWith('animated-') ||
          w.gradientId === 'theme' ||
          w.gradientId === 'blurred-wallpaper'
      );
    } else if (activeCategory === 'gradient') {
      list = WALLPAPER_CATALOG.filter(
        (w) =>
          (w.category === 'gradient' || w.isGradient) &&
          !w.isLive &&
          !w.gradientId?.startsWith('animated-') &&
          w.gradientId !== 'theme' &&
          w.gradientId !== 'blurred-wallpaper'
      );
    } else if (activeCategory === 'city') {
      list = WALLPAPER_CATALOG.filter((w) => w.category === 'city');
    } else if (activeCategory === 'nature') {
      list = WALLPAPER_CATALOG.filter((w) => w.category === 'nature' || w.category === 'water');
    } else if (activeCategory === 'minimal') {
      list = WALLPAPER_CATALOG.filter(
        (w) => w.category === 'abstract' || w.category === 'dark' || (w.category as any) === 'minimal'
      );
    } else if (activeCategory !== 'all') {
      list = WALLPAPER_CATALOG.filter((w) => w.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          (w.nameEn && w.nameEn.toLowerCase().includes(q)) ||
          (w.nameUk && w.nameUk.toLowerCase().includes(q)) ||
          w.categoryLabelRu.toLowerCase().includes(q) ||
          w.categoryLabelEn.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeCategory, searchQuery]);

  const handleSelect = (wp: WallpaperItem) => {
    playChime?.('click');
    setSelectedWallpaper(wp);
  };

  const handleApplyHome = (wp: WallpaperItem) => {
    playChime?.('victory');
    const targetVal = wp.gradientId || wp.full;
    onApplyToHome(targetVal);
    triggerToast?.(isRu ? 'Обои применены на главный экран!' : isUk ? 'Шпалери застосовано на головний екран!' : 'Wallpaper applied to Home Screen!');
    setSelectedWallpaper(null);

    // Prompt user whether to adapt the theme, instead of adapting automatically
    setPendingWallpaper(wp);
    setShowAdaptivePrompt(true);
  };

  const handleApplyClock = (wp: WallpaperItem) => {
    playChime?.('victory');
    const targetVal = wp.gradientId || wp.full;
    onApplyToClock(targetVal);
    triggerToast?.(isRu ? 'Обои применены для часов!' : isUk ? 'Шпалери застосовано для годинника!' : 'Wallpaper applied to Standby Clock!');
    setSelectedWallpaper(null);

    // Prompt user whether to adapt the theme, instead of adapting automatically
    setPendingWallpaper(wp);
    setShowAdaptivePrompt(true);
  };

  const handleApplyBoth = (wp: WallpaperItem) => {
    playChime?.('victory');
    const targetVal = wp.gradientId || wp.full;
    onApplyToBoth(targetVal);
    triggerToast?.(isRu ? 'Обои применены везде!' : isUk ? 'Шпалери застосовано всюди!' : 'Wallpaper applied everywhere!');
    setSelectedWallpaper(null);

    // Prompt user whether to adapt the theme, instead of adapting automatically
    setPendingWallpaper(wp);
    setShowAdaptivePrompt(true);
  };

  const handleConfirmAdaptive = () => {
    onEnableDynamicTheme?.();
    playChime?.('victory');
    triggerToast?.(isRu ? 'Тема адаптирована под обои!' : isUk ? 'Тему адаптовано під шпалери!' : 'Theme adapted to wallpaper!');
    setShowAdaptivePrompt(false);
    setPendingWallpaper(null);
  };

  const handleDismissAdaptive = () => {
    setShowAdaptivePrompt(false);
    setPendingWallpaper(null);
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--surface)] select-none overflow-hidden font-sans text-[var(--on-surface)]">
      {/* Top Header */}
      <div className="flex flex-col border-b border-[var(--outline-var)] bg-[var(--surface-dim)] px-4 py-3 shrink-0 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)] shadow-sm">
              <Image size={17} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-[var(--on-surface)]">
                {isRu ? 'Менеджер обоев' : isUk ? 'Менеджер шпалер' : 'Wallpaper Manager'}
              </h2>
              <span className="text-[10px] font-bold text-[var(--on-surface-var)]">
                {isRu ? 'Коллекция 4K обоев, живых шейдеров и тем для экрана и часов' : isUk ? 'Колекція 4K шпалер, живих шейдерів і тем для екрана та годинника' : '4K Wallpapers, Live Shaders & Clock themes'}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-44 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-var)] opacity-60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRu ? 'Поиск обоев...' : isUk ? 'Пошук шпалер...' : 'Search wallpapers...'}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface)] placeholder-[var(--on-surface-var)]/60 focus:outline-none focus:border-[var(--accent)] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--on-surface-var)] hover:text-[var(--on-surface)] cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Minimal Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  playChime?.('click');
                  setActiveCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm'
                    : 'bg-[var(--surface)] text-[var(--on-surface-var)] border border-[var(--outline-var)] hover:bg-[var(--container)] hover:text-[var(--on-surface)]'
                }`}
              >
                {Icon && <Icon size={12} className={isActive ? 'text-[var(--on-accent)]' : 'text-amber-500'} />}
                <span>{cat.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-black/20 text-[var(--on-accent)]' : 'bg-[var(--container-high)] text-[var(--on-surface-var)]'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wallpaper Cards Grid */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {filteredWallpapers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-[var(--on-surface-var)]">
            <Image size={36} className="opacity-30 mb-2" />
            <p className="text-xs font-bold">
              {isRu ? 'Обои не найдены' : isUk ? 'Шпалери не знайдено' : 'No wallpapers found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredWallpapers.map((wp) => {
              const isCurrentHome = effectiveCurrentHome === wp.full || (wp.isGradient && effectiveCurrentHome === wp.gradientId);
              const isCurrentClock = effectiveCurrentStandby === wp.full || effectiveCurrentStandby === wp.gradientId;

              return (
                <motion.div
                  key={wp.id}
                  layout
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(wp)}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer border border-[var(--outline-var)] shadow-sm transition-all aspect-[16/10] bg-[var(--surface-dim)] ${
                    isCurrentHome || isCurrentClock
                      ? 'ring-2 ring-[var(--accent)] border-[var(--accent)] shadow-md'
                      : 'hover:border-[var(--accent)] hover:shadow-md'
                  }`}
                >
                  {/* Wallpaper thumbnail */}
                  {wp.isGradient || wp.isLive ? (
                    <LiveWallpaperPreview
                      gradientId={wp.gradientId}
                      activePalette={activePalette}
                      dominantColorHex={wp.dominantColorHex}
                    />
                  ) : (
                    <img
                      src={wp.preview}
                      alt={wp.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}

                  {/* Gradient overlay for title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-end pointer-events-none">
                    <span className="text-xs font-bold text-white truncate drop-shadow-sm">
                      {isRu ? wp.name : isUk ? (wp.nameUk || wp.name) : (wp.nameEn || wp.name)}
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[9px] font-medium text-white/70">
                        {isRu ? wp.categoryLabelRu : isUk ? wp.categoryLabelUk : wp.categoryLabelEn}
                      </span>
                      {wp.resolution && (
                        <span className="text-[8px] font-mono font-bold text-white/60 bg-black/40 px-1 py-0.2 rounded">
                          {wp.resolution.includes('3840') ? '4K UHD' : wp.resolution}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active badges */}
                  {(isCurrentHome || isCurrentClock) && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-[var(--accent)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-10">
                      <Check size={10} strokeWidth={3} />
                      {isCurrentHome && isCurrentClock ? (
                        <span>{isRu ? 'Везде' : 'Active'}</span>
                      ) : isCurrentHome ? (
                        <span>{isRu ? 'Экран' : 'Home'}</span>
                      ) : (
                        <span>{isRu ? 'Часы' : 'Clock'}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Dialog / Popup when clicking any wallpaper */}
      <AnimatePresence>
        {selectedWallpaper && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWallpaper(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-5 shadow-2xl flex flex-col gap-4"
            >
              {/* Close icon */}
              <button
                onClick={() => setSelectedWallpaper(null)}
                className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-all cursor-pointer"
              >
                <X size={15} />
              </button>

              {/* Large Preview */}
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--outline-var)] bg-black/5">
                {selectedWallpaper.isGradient || selectedWallpaper.isLive ? (
                  <LiveWallpaperPreview
                    gradientId={selectedWallpaper.gradientId}
                    activePalette={activePalette}
                    dominantColorHex={selectedWallpaper.dominantColorHex}
                    isLarge={true}
                  />
                ) : (
                  <img
                    src={selectedWallpaper.full}
                    alt={selectedWallpaper.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-md">
                  {selectedWallpaper.resolution || 'Ultra HD'}
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--on-surface)]">
                    {isRu ? selectedWallpaper.name : isUk ? (selectedWallpaper.nameUk || selectedWallpaper.name) : (selectedWallpaper.nameEn || selectedWallpaper.name)}
                  </h3>
                  <p className="text-xs text-[var(--on-surface-var)]">
                    {isRu ? selectedWallpaper.categoryLabelRu : isUk ? selectedWallpaper.categoryLabelUk : selectedWallpaper.categoryLabelEn}
                  </p>
                </div>
                <div
                  className="w-5 h-5 rounded-full border border-[var(--outline-var)] shadow-inner"
                  style={{ background: selectedWallpaper.dominantColorHex }}
                  title="Dominant color"
                />
              </div>

              {/* 3 Application Actions (Home, Clock, Both) */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => handleApplyHome(selectedWallpaper)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all text-center gap-1.5 cursor-pointer group"
                >
                  <Layout size={18} className="text-[var(--accent)] group-hover:text-white transition-colors" />
                  <span className="text-xs font-bold leading-tight">
                    {isRu ? 'На главный экран' : isUk ? 'На головний екран' : 'Home Screen'}
                  </span>
                </button>

                <button
                  onClick={() => handleApplyClock(selectedWallpaper)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all text-center gap-1.5 cursor-pointer group"
                >
                  <Clock size={18} className="text-[var(--accent)] group-hover:text-white transition-colors" />
                  <span className="text-xs font-bold leading-tight">
                    {isRu ? 'Для часов' : isUk ? 'Для годинника' : 'Standby Clock'}
                  </span>
                </button>

                <button
                  onClick={() => handleApplyBoth(selectedWallpaper)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--accent)] text-[var(--on-accent)] hover:opacity-90 shadow-md transition-all text-center gap-1.5 cursor-pointer group"
                >
                  <Layers size={18} className="text-[var(--on-accent)]" />
                  <span className="text-xs font-extrabold leading-tight">
                    {isRu ? 'Везде (Оба)' : isUk ? 'Усюди (Обидва)' : 'Apply to Both'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adaptive Theme Prompt Pop-up */}
      <AnimatePresence>
        {showAdaptivePrompt && pendingWallpaper && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDismissAdaptive}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-5 shadow-2xl flex flex-col gap-4 text-center items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]">
                <Palette size={24} />
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-base font-extrabold text-[var(--on-surface)]">
                  {isRu ? 'Адаптивная тема' : isUk ? 'Адаптивна тема' : 'Adaptive Theme'}
                </h3>
                <p className="text-xs text-[var(--on-surface-var)] leading-relaxed max-w-[260px]">
                  {isRu
                    ? 'Хотите адаптировать акцентные цвета интерфейса под новые обои?'
                    : isUk
                    ? 'Бажаєте адаптувати акцентні кольори інтерфейсу під нові шпалери?'
                    : 'Would you like to adapt accent colors to match the new wallpaper?'}
                </p>
              </div>

              <div className="flex w-full items-center gap-2 pt-1">
                <button
                  onClick={handleDismissAdaptive}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface-var)] hover:bg-[var(--container)] transition-all cursor-pointer"
                >
                  {isRu ? 'Оставить текущую' : isUk ? 'Залишити поточну' : 'Keep current'}
                </button>
                <button
                  onClick={handleConfirmAdaptive}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] text-xs font-extrabold hover:opacity-90 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  {isRu ? 'Адаптировать' : isUk ? 'Адаптувати' : 'Adapt Theme'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

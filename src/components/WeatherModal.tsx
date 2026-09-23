import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  Snowflake,
  Wind,
  Droplets,
  MapPin,
  CalendarDays,
  CloudFog,
  CloudLightning,
  Compass,
  Search,
  Sunrise,
  Sunset,
  Eye,
  Gauge,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { fetchWeatherApi } from 'openmeteo';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  primaryColor: string;
  embeddedInWindow?: boolean;
}

interface DailyForecast {
  day: string;
  fullDate: string;
  maxTemp: number;
  minTemp: number;
  type: string;
  desc: string;
  uvIndex?: number;
}

interface HourlyItem {
  time: string;
  hour: number;
  temp: number;
  type: string;
  humidity: number;
}

const POPULAR_CITIES = [
  { nameRu: 'Москва', nameEn: 'Moscow', nameUk: 'Москва', lat: 55.7558, lon: 37.6173 },
  { nameRu: 'Санкт-Петербург', nameEn: 'St. Petersburg', nameUk: 'Санкт-Петербург', lat: 59.9343, lon: 30.3351 },
  { nameRu: 'Алматы', nameEn: 'Almaty', nameUk: 'Алмати', lat: 43.2389, lon: 76.8897 },
  { nameRu: 'Минск', nameEn: 'Minsk', nameUk: 'Мінськ', lat: 53.9045, lon: 27.5615 },
  { nameRu: 'Ташкент', nameEn: 'Tashkent', nameUk: 'Ташкент', lat: 41.2995, lon: 69.2401 },
  { nameRu: 'Лондон', nameEn: 'London', nameUk: 'Лондон', lat: 51.5074, lon: -0.1278 },
  { nameRu: 'Париж', nameEn: 'Paris', nameUk: 'Париж', lat: 48.8566, lon: 2.3522 },
  { nameRu: 'Нью-Йорк', nameEn: 'New York', nameUk: 'Нью-Йорк', lat: 40.7128, lon: -74.006 },
  { nameRu: 'Токио', nameEn: 'Tokyo', nameUk: 'Токіо', lat: 35.6762, lon: 139.6503 },
  { nameRu: 'Дубай', nameEn: 'Dubai', nameUk: 'Дубай', lat: 25.2048, lon: 55.2708 },
];

export default function WeatherModal({
  isOpen,
  onClose,
  lang,
  primaryColor,
  embeddedInWindow = false,
}: WeatherModalProps) {
  const isRu = lang === 'ru';
  const isUk = lang === 'uk';
  const t = translations[lang];

  const [unit, setUnit] = useState<'C' | 'F'>(() => {
    return (localStorage.getItem('linkerru_temp_unit') as 'C' | 'F') || 'C';
  });

  useEffect(() => {
    const syncUnit = () => {
      const saved = (localStorage.getItem('linkerru_temp_unit') as 'C' | 'F') || 'C';
      setUnit(saved);
    };
    syncUnit();
    window.addEventListener('linkerru_temp_unit_changed', syncUnit);
    return () => window.removeEventListener('linkerru_temp_unit_changed', syncUnit);
  }, []);

  // Location & Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ name: string; country?: string; lat: number; lon: number }[]>([]);
  const [cityName, setCityName] = useState<string>(() => {
    return localStorage.getItem('linkerru_cached_weather_city') || (isRu ? 'Москва' : 'Moscow');
  });

  // Weather Metrics State
  const [currentTempC, setCurrentTempC] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem('linkerru_cached_weather');
      if (cached) return JSON.parse(cached).currentTempC ?? null;
    } catch {}
    return null;
  });
  const [apparentTempC, setApparentTempC] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem('linkerru_cached_weather');
      if (cached) return JSON.parse(cached).windSpeed ?? null;
    } catch {}
    return null;
  });
  const [windDirection, setWindDirection] = useState<number>(0);
  const [humidity, setHumidity] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem('linkerru_cached_weather');
      if (cached) return JSON.parse(cached).humidity ?? null;
    } catch {}
    return null;
  });
  const [pressureHpa, setPressureHpa] = useState<number | null>(null);
  const [uvIndex, setUvIndex] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(0);

  const [hourlyData, setHourlyData] = useState<HourlyItem[]>(() => {
    try {
      const cached = localStorage.getItem('linkerru_cached_weather');
      if (cached) return JSON.parse(cached).hourlyData ?? [];
    } catch {}
    return [];
  });
  const [dailyData, setDailyData] = useState<DailyForecast[]>(() => {
    try {
      const cached = localStorage.getItem('linkerru_cached_weather');
      if (cached) return JSON.parse(cached).dailyData ?? [];
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(false);

  const lastCoordsRef = useRef<{ lat: number; lon: number } | null>(null);

  // Temperature Converter helper
  const convertTemp = (celsius: number | null | undefined) => {
    if (celsius === null || celsius === undefined || isNaN(celsius)) return '--';
    if (unit === 'C') return `${Math.round(celsius)}°`;
    return `${Math.round((celsius * 9) / 5 + 32)}°`;
  };

  // Weather description mapper
  const getWeatherInfo = (code: number) => {
    if (code === 0) {
      return {
        type: 'sun',
        desc: isRu ? 'Ясно и солнечно' : isUk ? 'Ясно та сонячно' : 'Clear sky',
        bgGlow: 'radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.15), transparent 70%)',
      };
    }
    if (code >= 1 && code <= 3) {
      return {
        type: 'cloudy_sun',
        desc: isRu ? 'Переменная облачность' : isUk ? 'Мінлива хмарність' : 'Partly cloudy',
        bgGlow: 'radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.12), transparent 70%)',
      };
    }
    if (code >= 45 && code <= 48) {
      return {
        type: 'fog',
        desc: isRu ? 'Туман' : isUk ? 'Туман' : 'Fog',
        bgGlow: 'radial-gradient(ellipse at top right, rgba(148, 163, 184, 0.15), transparent 70%)',
      };
    }
    if (code >= 51 && code <= 67) {
      return {
        type: 'rain',
        desc: isRu ? 'Дождь' : isUk ? 'Дощ' : 'Rain',
        bgGlow: 'radial-gradient(ellipse at top right, rgba(14, 165, 233, 0.18), transparent 70%)',
      };
    }
    if (code >= 71 && code <= 77) {
      return {
        type: 'snow',
        desc: isRu ? 'Снегопад' : isUk ? 'Снігопад' : 'Snowfall',
        bgGlow: 'radial-gradient(ellipse at top right, rgba(165, 243, 252, 0.2), transparent 70%)',
      };
    }
    if (code >= 80 && code <= 82) {
      return {
        type: 'rain',
        desc: isRu ? 'Ливень' : isUk ? 'Злива' : 'Heavy rain showers',
        bgGlow: 'radial-gradient(ellipse at top right, rgba(56, 189, 248, 0.22), transparent 70%)',
      };
    }
    if (code >= 85 && code <= 86) {
      return {
        type: 'snow',
        desc: isRu ? 'Метель' : isUk ? 'Завірюха' : 'Snow storm',
        bgGlow: 'radial-gradient(ellipse at top right, rgba(186, 230, 253, 0.22), transparent 70%)',
      };
    }
    if (code >= 95 && code <= 99) {
      return {
        type: 'thunder',
        desc: isRu ? 'Гроза' : isUk ? 'Гроза' : 'Thunderstorm',
        bgGlow: 'radial-gradient(ellipse at top right, rgba(168, 85, 247, 0.2), transparent 70%)',
      };
    }
    return {
      type: 'cloudy',
      desc: isRu ? 'Пасмурно' : isUk ? 'Хмарно' : 'Overcast',
      bgGlow: 'radial-gradient(ellipse at top right, rgba(100, 116, 139, 0.15), transparent 70%)',
    };
  };

  const currentWeatherMeta = useMemo(() => getWeatherInfo(weatherCode), [weatherCode, isRu, isUk]);

  const loadWeather = async (lat: number, lon: number, newCityName?: string) => {
    if (newCityName) {
      setCityName(newCityName);
      localStorage.setItem('linkerru_cached_weather_city', newCityName);
    }
    lastCoordsRef.current = { lat, lon };
    if (currentTempC === null) setLoading(true);

    try {
      const params = {
        latitude: lat,
        longitude: lon,
        current: [
          'temperature_2m',
          'apparent_temperature',
          'weather_code',
          'relative_humidity_2m',
          'wind_speed_10m',
          'wind_direction_10m',
          'surface_pressure',
        ],
        hourly: ['temperature_2m', 'relative_humidity_2m', 'weather_code'],
        daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'uv_index_max'],
        forecast_days: 7,
        timezone: 'auto',
      };

      const url = 'https://api.open-meteo.com/v1/forecast';
      const responses = await fetchWeatherApi(url, params);
      const response = responses[0];

      const current = response.current()!;
      const curTemp = current.variables(0)!.value();
      const appTemp = current.variables(1)!.value();
      const wCode = Math.round(current.variables(2)!.value());
      const humVal = Math.round(current.variables(3)!.value());
      const curWind = current.variables(4)!.value();
      const curWindDir = Math.round(current.variables(5)!.value());
      const curPress = Math.round(current.variables(6)!.value());

      setCurrentTempC(curTemp);
      setApparentTempC(appTemp);
      setWeatherCode(wCode);
      setHumidity(humVal);
      setWindSpeed(curWind);
      setWindDirection(curWindDir);
      setPressureHpa(curPress);

      const hourly = response.hourly()!;
      const utcOffsetSeconds = response.utcOffsetSeconds();
      const totalHours = Math.min(24, hourly.variables(0)!.valuesArray()?.length || 24);
      const timesArray = Array.from(
        { length: totalHours },
        (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
      );
      const tempsArray = hourly.variables(0)!.valuesArray() || [];
      const humidArray = hourly.variables(1)!.valuesArray() || [];
      const codesArray = hourly.variables(2)!.valuesArray() || [];

      const hData: HourlyItem[] = [];
      for (let i = 0; i < totalHours; i++) {
        const d = timesArray[i];
        const hour = d.getHours();
        const code = Math.round(codesArray[i] ?? 0);
        hData.push({
          time: `${String(hour).padStart(2, '0')}:00`,
          hour,
          temp: tempsArray[i],
          type: getWeatherInfo(code).type,
          humidity: Math.round(humidArray[i] ?? 50),
        });
      }
      setHourlyData(hData);

      const daily = response.daily()!;
      const dCodes = daily.variables(0)!.valuesArray() || [];
      const dMax = daily.variables(1)!.valuesArray() || [];
      const dMin = daily.variables(2)!.valuesArray() || [];
      const dUv = daily.variables(3)!.valuesArray() || [];

      if (dUv.length > 0) setUvIndex(Math.round(dUv[0]));

      const daysRu = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
      const daysUk = ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
      const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = isRu ? daysRu : isUk ? daysUk : daysEn;

      const dData: DailyForecast[] = [];
      for (let i = 0; i < Math.min(7, dMax.length); i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const code = Math.round(dCodes[i] ?? 0);
        const info = getWeatherInfo(code);

        dData.push({
          day: i === 0 ? (isRu ? 'Сегодня' : isUk ? 'Сьогодні' : 'Today') : days[d.getDay()],
          fullDate: d.toLocaleDateString(isRu ? 'ru-RU' : isUk ? 'uk-UA' : 'en-US', { day: 'numeric', month: 'short' }),
          maxTemp: dMax[i],
          minTemp: dMin[i],
          type: info.type,
          desc: info.desc,
          uvIndex: dUv[i] ? Math.round(dUv[i]) : undefined,
        });
      }
      setDailyData(dData);

      try {
        localStorage.setItem(
          'linkerru_cached_weather',
          JSON.stringify({
            currentTempC: curTemp,
            apparentTempC: appTemp,
            weatherCode: wCode,
            windSpeed: curWind,
            humidity: humVal,
            pressureHpa: curPress,
            hourlyData: hData,
            dailyData: dData,
            cachedAt: Date.now(),
          })
        );
      } catch {}
    } catch (e) {
      console.warn('Weather API fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Initial silent load via /api/geoip or custom city
  const fetchSilentLocation = async () => {
    const customCity = localStorage.getItem('linkerru_weather_custom_city');
    if (customCity) {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(customCity)}&count=1`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData?.results?.[0]) {
            const { latitude, longitude, name } = geoData.results[0];
            loadWeather(latitude, longitude, name || customCity);
            return;
          }
        }
      } catch {}
    }

    // Silent IP GeoIP — Zero user prompts
    try {
      const ipRes = await fetch('/api/geoip');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData?.latitude && ipData?.longitude) {
          const lat = Number(ipData.latitude);
          const lon = Number(ipData.longitude);
          const resolvedCity = ipData.city || (isRu ? 'Москва' : 'Moscow');
          loadWeather(lat, lon, resolvedCity);
          return;
        }
      }
    } catch {}

    // Fallback coordinates
    loadWeather(55.7558, 37.6173, isRu ? 'Москва' : isUk ? 'Київ' : 'London');
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchSilentLocation();

    // Auto-refresh every 30 minutes
    const timer = setInterval(() => {
      if (lastCoordsRef.current) {
        loadWeather(lastCoordsRef.current.lat, lastCoordsRef.current.lon);
      } else {
        fetchSilentLocation();
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Handle City Search
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery.trim())}&count=5`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.results) {
          setSearchResults(
            data.results.map((r: any) => ({
              name: r.name,
              country: r.country,
              lat: r.latitude,
              lon: r.longitude,
            }))
          );
        } else {
          setSearchResults([]);
        }
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCity = (city: { name: string; lat: number; lon: number }) => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    localStorage.setItem('linkerru_weather_custom_city', city.name);
    localStorage.setItem('linkerru_weather_location_mode', 'custom');
    loadWeather(city.lat, city.lon, city.name);
  };

  const getWeatherIcon = (type: string, size = 26) => {
    switch (type) {
      case 'sun':
        return <Sun size={size} className="text-amber-400 drop-shadow-sm" />;
      case 'cloudy_sun':
        return <CloudSun size={size} className="text-indigo-400 drop-shadow-sm" />;
      case 'cloudy':
        return <Cloud size={size} className="text-slate-400 drop-shadow-sm" />;
      case 'rain':
        return <CloudRain size={size} className="text-sky-400 drop-shadow-sm" />;
      case 'snow':
        return <Snowflake size={size} className="text-cyan-300 drop-shadow-sm" />;
      case 'fog':
        return <CloudFog size={size} className="text-slate-400 drop-shadow-sm" />;
      case 'thunder':
        return <CloudLightning size={size} className="text-purple-400 drop-shadow-sm" />;
      default:
        return <Sun size={size} className="text-amber-400 drop-shadow-sm" />;
    }
  };

  // Calculate week min and max for range bar
  const weekMin = dailyData.length ? Math.min(...dailyData.map((d) => d.minTemp)) : 0;
  const weekMax = dailyData.length ? Math.max(...dailyData.map((d) => d.maxTemp)) : 30;
  const weekSpread = Math.max(1, weekMax - weekMin);

  if (!isOpen) return null;

  const content = (
    <div
      className={`relative z-10 w-full h-full overflow-hidden flex flex-col p-4 md:p-5 gap-3.5 select-none font-sans ${
        embeddedInWindow
          ? 'bg-transparent text-[var(--on-surface)]'
          : 'rounded-[2.25rem] border border-[var(--outline-var)] bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] backdrop-blur-3xl shadow-2xl'
      }`}
      style={{
        backgroundImage: currentWeatherMeta.bgGlow,
      }}
    >
      {/* 1. EXPRESSIVE TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between gap-3 p-2.5 px-3.5 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/25 text-[var(--accent)]">
            {getWeatherIcon(currentWeatherMeta.type, 22)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-[var(--on-surface)] truncate tracking-tight">
                {cityName}
              </span>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-1 rounded-lg text-[var(--on-surface-var)] hover:text-[var(--accent)] hover:bg-[var(--container)] transition-colors cursor-pointer"
                title={isRu ? 'Поиск города' : 'Search City'}
              >
                <Search size={13} />
              </button>
            </div>
            <p className="text-[10px] text-[var(--on-surface-var)] font-bold truncate">
              {currentWeatherMeta.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Silent GeoIP auto-detect button */}
          <button
            onClick={() => {
              localStorage.removeItem('linkerru_weather_custom_city');
              localStorage.setItem('linkerru_weather_location_mode', 'auto');
              fetchSilentLocation();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-[var(--surface)] text-[var(--on-surface-var)] hover:text-[var(--accent)] border border-[var(--outline-var)] hover:bg-[var(--container)] transition-all cursor-pointer shadow-xs"
            title={isRu ? 'Автоопределение по IP' : 'Auto-detect via IP'}
          >
            <MapPin size={11} />
            <span className="hidden sm:inline">{isRu ? 'Авто' : 'Auto'}</span>
          </button>

          {/* Unit Switcher */}
          <div className="flex bg-[var(--surface)] border border-[var(--outline-var)] rounded-full p-0.5 shadow-xs">
            <button
              onClick={() => {
                setUnit('C');
                localStorage.setItem('linkerru_temp_unit', 'C');
                window.dispatchEvent(new Event('linkerru_temp_unit_changed'));
              }}
              className={`h-6 px-2 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                unit === 'C'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                  : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => {
                setUnit('F');
                localStorage.setItem('linkerru_temp_unit', 'F');
                window.dispatchEvent(new Event('linkerru_temp_unit_changed'));
              }}
              className={`h-6 px-2 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                unit === 'F'
                  ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                  : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
              }`}
            >
              °F
            </button>
          </div>

          {!embeddedInWindow && (
            <button
              onClick={onClose}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)] active:scale-95 cursor-pointer shadow-xs"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* SEARCH & POPULAR CITIES DRAWER */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-[var(--outline-var)] bg-[var(--container)] p-3 flex flex-col gap-2.5 shadow-md overflow-hidden shrink-0"
          >
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRu ? 'Введите город (напр. Санкт-Петербург, Сочи)...' : 'Enter city name...'}
                  className="w-full bg-[var(--surface)] text-xs font-semibold rounded-xl px-3 py-2 border border-[var(--outline-var)] text-[var(--on-surface)] placeholder:text-[var(--on-surface-var)]/60 focus:outline-hidden focus:border-[var(--accent)]"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-3.5 py-2 bg-[var(--accent)] text-[var(--on-accent)] text-xs font-bold rounded-xl shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                {isSearching ? <RefreshCw size={12} className="animate-spin" /> : isRu ? 'Найти' : 'Search'}
              </button>
            </form>

            {/* Quick Popular Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase tracking-wider shrink-0 mr-1">
                {isRu ? 'Популярные:' : 'Popular:'}
              </span>
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c.nameEn}
                  onClick={() => selectCity({ name: isRu ? c.nameRu : isUk ? c.nameUk : c.nameEn, lat: c.lat, lon: c.lon })}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline-var)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shrink-0 cursor-pointer"
                >
                  {isRu ? c.nameRu : isUk ? c.nameUk : c.nameEn}
                </button>
              ))}
            </div>

            {/* Results dropdown */}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pt-1 border-t border-[var(--outline-var)]/60">
                {searchResults.map((r, idx) => (
                  <button
                    key={`${r.name}-${idx}`}
                    onClick={() => selectCity(r)}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold text-left bg-[var(--surface)] text-[var(--on-surface)] hover:bg-[var(--surface-dim)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    <span>{r.name}</span>
                    <span className="text-[10px] text-[var(--on-surface-var)]">{r.country || ''}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN SCROLLABLE DASHBOARD */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0">
        {/* HERO CARD: Expressive Atmosphere & Temp */}
        <div className="p-4.5 rounded-3xl bg-[var(--container)] border border-[var(--outline-var)] flex flex-col justify-between relative overflow-hidden shadow-xs shrink-0">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)] block mb-1">
                {isRu ? 'Сейчас на улице' : 'Current Conditions'}
              </span>
              {loading ? (
                <div className="h-14 w-32 rounded-2xl bg-[var(--surface-dim)] animate-pulse my-1" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tight text-[var(--on-surface)] leading-none">
                    {convertTemp(currentTempC)}
                  </span>
                </div>
              )}
              {apparentTempC !== null && (
                <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--outline-var)] text-[10.5px] font-bold text-[var(--on-surface-var)]">
                  <span>{isRu ? 'Ощущается как' : 'Feels like'}</span>
                  <span className="text-[var(--on-surface)] font-black">{convertTemp(apparentTempC)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end">
              <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] shadow-sm">
                {getWeatherIcon(currentWeatherMeta.type, 40)}
              </div>
              <span className="text-xs font-black text-[var(--on-surface)] mt-2 text-right">
                {currentWeatherMeta.desc}
              </span>
            </div>
          </div>

          {/* Bottom row: Today's range & quick status */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--outline-var)]/70 relative z-10 text-[11px]">
            <span className="font-bold text-[var(--on-surface-var)]">
              {isRu ? 'Диапазон на сегодня' : "Today's Range"}
            </span>
            {dailyData.length > 0 && (
              <div className="flex items-center gap-2 font-black tabular-nums">
                <span className="text-[var(--on-surface-var)]">{convertTemp(dailyData[0].minTemp)}</span>
                <span className="text-[var(--outline-var)]">/</span>
                <span className="text-[var(--accent)] font-extrabold">{convertTemp(dailyData[0].maxTemp)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 24-HOUR HOURLY STRIP */}
        <div className="p-3.5 rounded-3xl bg-[var(--container)] border border-[var(--outline-var)] shadow-xs flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)]">
              {t.hourly_forecast}
            </span>
            <span className="text-[10px] font-bold text-[var(--on-surface-var)]">
              {isRu ? '24 часа' : '24 hours'}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {hourlyData.map((h, i) => {
              const isNow = i === 0;
              return (
                <div
                  key={`${h.time}-${i}`}
                  className={`min-w-[64px] flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all ${
                    isNow
                      ? 'bg-[var(--accent)]/12 border-[var(--accent)] shadow-xs text-[var(--on-surface)] font-black'
                      : 'bg-[var(--surface)] border-[var(--outline-var)] text-[var(--on-surface-var)]'
                  }`}
                >
                  <span className="text-[10px] font-black">{isNow ? (isRu ? 'Сейчас' : 'Now') : h.time}</span>
                  <div className="my-0.5">{getWeatherIcon(h.type, 20)}</div>
                  <span className="text-xs font-black text-[var(--on-surface)] tabular-nums">
                    {convertTemp(h.temp)}
                  </span>
                  <span className="text-[9px] font-semibold opacity-75">{h.humidity}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-DAY EXTENDED FORECAST WITH GRAPHICAL RANGE BAR */}
        <div className="p-4 rounded-3xl bg-[var(--container)] border border-[var(--outline-var)] shadow-xs flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)]">
              {t.weekly_forecast}
            </span>
            <span className="text-[10px] font-bold text-[var(--on-surface-var)]">
              {isRu ? 'Неделя' : 'Week'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {dailyData.map((d, idx) => {
              const leftPercent = Math.max(0, Math.min(100, ((d.minTemp - weekMin) / weekSpread) * 100));
              const rightPercent = Math.max(0, Math.min(100, ((d.maxTemp - weekMin) / weekSpread) * 100));
              const barWidth = Math.max(8, rightPercent - leftPercent);

              return (
                <div
                  key={`${d.day}-${idx}`}
                  className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)]/60 text-xs font-bold"
                >
                  <div className="w-16 min-w-[64px]">
                    <span className="block text-xs font-black text-[var(--on-surface)]">{d.day}</span>
                    <span className="text-[9.5px] text-[var(--on-surface-var)] font-semibold">{d.fullDate}</span>
                  </div>

                  <div className="flex items-center gap-2 w-28 min-w-[110px]">
                    {getWeatherIcon(d.type, 18)}
                    <span className="text-[10.5px] text-[var(--on-surface)] truncate font-semibold">{d.desc}</span>
                  </div>

                  {/* Graphical Range Bar */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[var(--on-surface-var)] w-7 text-right tabular-nums">
                      {convertTemp(d.minTemp)}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--surface-dim)] relative overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${barWidth}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-black text-[var(--on-surface)] w-7 tabular-nums">
                      {convertTemp(d.maxTemp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BENTO GRID: COMPREHENSIVE METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 pb-1">
          {/* 1. Wind & Compass */}
          <div className="p-3.5 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] flex flex-col justify-between gap-1 shadow-xs">
            <div className="flex items-center justify-between text-[var(--on-surface-var)]">
              <span className="text-[9.5px] font-black uppercase tracking-wider">{isRu ? 'Ветер' : 'Wind'}</span>
              <Wind size={14} className="text-[var(--accent)]" />
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-xl font-black text-[var(--on-surface)] tabular-nums">
                {windSpeed ? Math.round(windSpeed) : '--'}
              </span>
              <span className="text-[10px] font-bold text-[var(--on-surface-var)]">
                {isRu ? 'м/с' : 'm/s'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--on-surface-var)]">
              <Compass
                size={12}
                style={{ transform: `rotate(${windDirection}deg)` }}
                className="transition-transform duration-500 text-[var(--accent)]"
              />
              <span>{windDirection}°</span>
            </div>
          </div>

          {/* 2. Humidity */}
          <div className="p-3.5 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] flex flex-col justify-between gap-1 shadow-xs">
            <div className="flex items-center justify-between text-[var(--on-surface-var)]">
              <span className="text-[9.5px] font-black uppercase tracking-wider">{isRu ? 'Влажность' : 'Humidity'}</span>
              <Droplets size={14} className="text-sky-400" />
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-xl font-black text-[var(--on-surface)] tabular-nums">
                {humidity !== null ? `${humidity}%` : '--'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[var(--on-surface-var)] truncate">
              {humidity && humidity > 70 ? (isRu ? 'Влажно' : 'High') : (isRu ? 'Комфортно' : 'Optimal')}
            </span>
          </div>

          {/* 3. UV Index */}
          <div className="p-3.5 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] flex flex-col justify-between gap-1 shadow-xs">
            <div className="flex items-center justify-between text-[var(--on-surface-var)]">
              <span className="text-[9.5px] font-black uppercase tracking-wider">{isRu ? 'УФ-индекс' : 'UV Index'}</span>
              <Sun size={14} className="text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-xl font-black text-[var(--on-surface)] tabular-nums">
                {uvIndex !== null ? uvIndex : 1}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[var(--on-surface-var)] truncate">
              {(uvIndex || 1) <= 2 ? (isRu ? 'Низкий' : 'Low') : (isRu ? 'Умеренный' : 'Moderate')}
            </span>
          </div>

          {/* 4. Atmospheric Pressure */}
          <div className="p-3.5 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] flex flex-col justify-between gap-1 shadow-xs">
            <div className="flex items-center justify-between text-[var(--on-surface-var)]">
              <span className="text-[9.5px] font-black uppercase tracking-wider">{isRu ? 'Давление' : 'Pressure'}</span>
              <Gauge size={14} className="text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-xl font-black text-[var(--on-surface)] tabular-nums">
                {pressureHpa ? Math.round(pressureHpa * 0.750062) : '--'}
              </span>
              <span className="text-[10px] font-bold text-[var(--on-surface-var)]">
                {isRu ? 'мм' : 'mmHg'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[var(--on-surface-var)] truncate">
              {isRu ? 'В норме' : 'Normal'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (embeddedInWindow) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative z-10 w-full max-w-2xl h-[92vh] max-h-[760px]"
      >
        {content}
      </motion.div>
    </div>
  );
}

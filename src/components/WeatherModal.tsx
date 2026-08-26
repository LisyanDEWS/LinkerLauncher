import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, Cloud, CloudSun, CloudRain, Snowflake, Wind, Droplets, MapPin, CalendarDays, CloudFog, CloudLightning, Compass } from 'lucide-react';
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
  maxTemp: number;
  minTemp: number;
  type: string;
  desc: string;
}

export default function WeatherModal({ isOpen, onClose, lang, primaryColor, embeddedInWindow = false }: WeatherModalProps) {
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

  const t = translations[lang];

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [latStr, setLatStr] = useState('52.52');
  const [lonStr, setLonStr] = useState('13.41');
  const [cityName, setCityName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Real data state
  const [currentTempC, setCurrentTempC] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [hourlyData, setHourlyData] = useState<{ time: string; temp: number; type: string }[]>([]);
  const [dailyData, setDailyData] = useState<DailyForecast[]>([]);

  // Track last coordinates so the hourly auto-refresh uses the same location
  const lastCoordsRef = useRef<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchByLocation = async () => {
      const mode = localStorage.getItem('linkerru_weather_location_mode');
      const customCity = localStorage.getItem('linkerru_weather_custom_city');

      if (mode === 'custom' && customCity) {
        try {
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(customCity)}&count=1`);
          const geoData = await geoRes.json();
          if (geoData && geoData.results && geoData.results.length > 0) {
            const { latitude, longitude, name } = geoData.results[0];
            setLatStr(latitude.toString());
            setLonStr(longitude.toString());
            setCityName(name || customCity);
            lastCoordsRef.current = { lat: latitude, lon: longitude };
            loadWeather(latitude, longitude);
            return;
          }
        } catch (e) {
          console.warn('Failed custom city geocoding in modal:', e);
        }
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const newLat = pos.coords.latitude.toString();
            const newLon = pos.coords.longitude.toString();
            setLatStr(newLat);
            setLonStr(newLon);
            setCityName(lang === 'ru' ? 'Моё местоположение' : 'My location');
            lastCoordsRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            loadWeather(pos.coords.latitude, pos.coords.longitude);
          },
          (err) => {
            console.warn('Geolocation failed', err);
            const lat = Number(latStr) || 52.52;
            const lon = Number(lonStr) || 13.41;
            setCityName(lang === 'ru' ? 'Берлин' : 'Berlin');
            lastCoordsRef.current = { lat, lon };
            loadWeather(lat, lon);
          }
        );
      } else {
        const lat = Number(latStr) || 52.52;
        const lon = Number(lonStr) || 13.41;
        setCityName(lang === 'ru' ? 'Берлин' : 'Berlin');
        lastCoordsRef.current = { lat, lon };
        loadWeather(lat, lon);
      }
    };

    // Initial fetch
    fetchByLocation();

    // Auto-refresh every 1 hour (3600000 ms) using the same location
    const intervalId = setInterval(() => {
      const coords = lastCoordsRef.current;
      if (coords) {
        loadWeather(coords.lat, coords.lon);
      } else {
        fetchByLocation();
      }
    }, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isOpen]);

  const loadWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const params = {
        latitude: lat,
        longitude: lon,
        current: ["temperature_2m", "wind_speed_10m"],
        hourly: ["temperature_2m", "relative_humidity_2m", "wind_speed_10m"],
        daily: ["temperature_2m_max", "temperature_2m_min", "weather_code"],
        forecast_days: 7,
        timezone: 'auto',
      };
      const url = "https://api.open-meteo.com/v1/forecast";
      const responses = await fetchWeatherApi(url, params);
      const response = responses[0];

      const current = response.current()!;
      setCurrentTempC(current.variables(0)!.value());
      setWindSpeed(current.variables(1)!.value());

      const hourly = response.hourly()!;
      const utcOffsetSeconds = response.utcOffsetSeconds();

      // Taking 24 hours for full hourly scroll
      const hData = [];
      const totalHours = Math.min(24, hourly.variables(0)!.valuesArray()?.length || 24);
      const timesArray = Array.from(
        { length: totalHours },
        (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
      );
      const tempsArray = hourly.variables(0)!.valuesArray();
      const humidArray = hourly.variables(1)!.valuesArray();

      if (humidArray && humidArray.length > 0) {
        setHumidity(humidArray[0]);
      }

      for (let i = 0; i < totalHours; i++) {
        const timeStr = `${String(timesArray[i].getHours()).padStart(2, '0')}:00`;
        hData.push({
          time: timeStr,
          temp: tempsArray[i],
          type: tempsArray[i] < 0 ? 'snow' : (humidArray[i] > 85 ? 'rain' : 'cloudy_sun'),
        });
      }
      setHourlyData(hData);

      // 7-day forecast
      const daily = response.daily()!;
      const dMax = daily.variables(0)!.valuesArray();
      const dMin = daily.variables(1)!.valuesArray();
      const dCode = daily.variables(2)!.valuesArray();

      const days = lang === 'ru' ? ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'] : ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const dData: DailyForecast[] = [];
      for (let i = 0; i < Math.min(7, dMax.length); i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const code = dCode[i];
        let type = 'sun';
        let desc = lang === 'ru' ? 'Ясно' : 'Clear';
        if (code >= 1 && code <= 3) { type = 'cloudy_sun'; desc = lang === 'ru' ? 'Облачно' : 'Cloudy'; }
        if (code >= 45 && code <= 48) { type = 'cloudy'; desc = lang === 'ru' ? 'Туман' : 'Fog'; }
        if (code >= 51 && code <= 67) { type = 'rain'; desc = lang === 'ru' ? 'Дождь' : 'Rain'; }
        if (code >= 71 && code <= 77) { type = 'snow'; desc = lang === 'ru' ? 'Снег' : 'Snow'; }
        if (code >= 80 && code <= 99) { type = 'rain'; desc = lang === 'ru' ? 'Ливень' : 'Shower'; }

        dData.push({
          day: i === 0 ? (lang === 'ru' ? 'Сегодня' : 'Today') : `${days[d.getDay()]}`,
          maxTemp: dMax[i],
          minTemp: dMin[i],
          type,
          desc,
        });
      }
      setDailyData(dData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const convertTemp = (celsius: number | null) => {
    if (celsius === null) return '--';
    if (unit === 'C') return `${Math.round(celsius)}°`;
    return `${Math.round((celsius * 9) / 5 + 32)}°`;
  };

  const getWeatherIcon = (type: string, size = 24) => {
    switch (type) {
      case 'sun': return <Sun size={size} className="text-amber-400" />;
      case 'cloudy_sun': return <CloudSun size={size} className="text-amber-400" />;
      case 'cloudy': return <Cloud size={size} className="text-[var(--on-surface-var)]" />;
      case 'rain': return <CloudRain size={size} className="text-sky-400" />;
      case 'snow': return <Snowflake size={size} className="text-blue-300" />;
      case 'fog': return <CloudFog size={size} className="text-slate-400" />;
      case 'thunder': return <CloudLightning size={size} className="text-amber-500" />;
      default: return <Sun size={size} className="text-amber-400" />;
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`relative z-10 w-full h-full overflow-hidden flex flex-col p-4 md:p-5 gap-4 select-none font-sans ${
        embeddedInWindow
          ? 'bg-transparent text-[var(--on-surface)]'
          : 'rounded-[2.25rem] border border-[var(--outline-var)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] backdrop-blur-2xl'
      }`}
      style={
        embeddedInWindow
          ? {}
          : {
              borderColor: 'color-mix(in srgb, var(--accent) 15%, var(--outline-var))',
              boxShadow: '0 30px 60px -15px rgba(0,0,0,0.35), 0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent)',
            }
      }
    >
      {/* 1. TOP HEADER BAR: Smooth rounded pill card */}
      <div className="flex items-center justify-between gap-3 p-3 px-4 rounded-2xl bg-[var(--surface-dim)]/80 border border-[var(--outline-var)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs"
            style={{ background: primaryColor }}
          >
            <CloudSun size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold tracking-tight text-[var(--on-surface)] truncate">
              {t.weather_title}
            </h3>
            <p className="text-[11px] text-[var(--on-surface-var)] font-semibold truncate">
              {cityName || (lang === 'ru' ? 'Автоопределение' : 'Auto-detected')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Location settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              showSettings
                ? 'bg-[var(--accent)] text-white border-transparent shadow-xs'
                : 'bg-[var(--surface)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] border-[var(--outline-var)] hover:bg-[var(--container-high)]'
            }`}
            title={lang === 'ru' ? 'Настройки локации' : 'Location settings'}
          >
            <MapPin size={13} />
            <span className="hidden sm:inline">{lang === 'ru' ? 'Локация' : 'Location'}</span>
          </button>

          {/* Unit Switcher */}
          <div className="flex bg-[var(--surface)] border border-[var(--outline-var)] rounded-full p-0.5 shadow-xs">
            <button
              onClick={() => {
                setUnit('C');
                localStorage.setItem('linkerru_temp_unit', 'C');
                window.dispatchEvent(new Event('linkerru_temp_unit_changed'));
              }}
              className={`h-7 px-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                unit === 'C'
                  ? 'bg-[var(--on-surface)] text-[var(--surface)] shadow-xs scale-102'
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
              className={`h-7 px-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                unit === 'F'
                  ? 'bg-[var(--on-surface)] text-[var(--surface)] shadow-xs scale-102'
                  : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
              }`}
            >
              °F
            </button>
          </div>

          {!embeddedInWindow && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-red-500 hover:text-white hover:scale-105 active:scale-95 cursor-pointer shadow-xs ml-1"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Location Settings Collapsible Card */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[var(--container)] p-4 rounded-2xl border border-[var(--outline-var)] flex flex-col gap-3 shadow-sm shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--on-surface)] flex items-center gap-1.5">
                <Compass size={14} className="text-[var(--accent)]" />
                {lang === 'ru' ? 'Координаты погоды' : 'Weather Coordinates'}
              </span>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs font-bold text-[var(--on-surface-var)] hover:text-[var(--on-surface)] cursor-pointer"
              >
                {lang === 'ru' ? 'Закрыть' : 'Close'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">
                  Latitude
                </label>
                <input
                  type="text"
                  value={latStr}
                  onChange={(e) => setLatStr(e.target.value)}
                  className="bg-[var(--surface)] text-sm font-semibold rounded-xl px-3.5 py-2 border border-[var(--outline-var)] text-[var(--on-surface)] focus:outline-hidden focus:border-[var(--accent)]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">
                  Longitude
                </label>
                <input
                  type="text"
                  value={lonStr}
                  onChange={(e) => setLonStr(e.target.value)}
                  className="bg-[var(--surface)] text-sm font-semibold rounded-xl px-3.5 py-2 border border-[var(--outline-var)] text-[var(--on-surface)] focus:outline-hidden focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setShowSettings(false);
                loadWeather(Number(latStr), Number(lonStr));
              }}
              className="w-full text-white py-2.5 rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-98 transition-all cursor-pointer"
              style={{ background: primaryColor }}
            >
              {lang === 'ru' ? 'Обновить координаты' : 'Update Coordinates'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN BODY: Rounded cards grid without sharp dividers */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* LEFT COLUMN: Hero Temp + Quick Stats + Hourly (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-4 overflow-y-auto pr-0.5">
          {/* Hero Weather Card */}
          <div className="p-6 rounded-3xl bg-[var(--container)] border border-[var(--outline-var)] flex flex-col justify-between relative overflow-hidden shadow-xs shrink-0">
            {/* Subtle aesthetic backdrop glow */}
            <div
              className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: primaryColor }}
            />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--on-surface-var)] block mb-1">
                  {lang === 'ru' ? 'Текущая погода' : 'Current weather'}
                </span>
                {loading ? (
                  <div className="h-16 w-32 rounded-2xl bg-[var(--surface-dim)] animate-pulse my-1" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tracking-tighter text-[var(--on-surface)]">
                      {convertTemp(currentTempC)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end">
                <div className="p-3 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] shadow-xs">
                  {dailyData.length > 0 ? getWeatherIcon(dailyData[0].type, 38) : <Sun size={38} className="text-amber-400" />}
                </div>
                <span className="text-xs font-extrabold text-[var(--on-surface)] mt-2">
                  {dailyData.length > 0 ? dailyData[0].desc : (lang === 'ru' ? 'Ясно' : 'Clear')}
                </span>
              </div>
            </div>

            {/* Bottom info pills inside hero */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--outline-var)]/60 relative z-10">
              <span className="text-[11px] font-bold text-[var(--on-surface-var)]">
                {lang === 'ru' ? 'Сегодня:' : 'Today:'}
              </span>
              {dailyData.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-black text-[var(--on-surface)]">
                  <span className="text-[var(--on-surface-var)]">{convertTemp(dailyData[0].minTemp)}</span>
                  <span>/</span>
                  <span style={{ color: primaryColor }}>{convertTemp(dailyData[0].maxTemp)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {/* Wind Card */}
            <div className="p-4 rounded-2xl bg-[var(--surface-dim)]/80 border border-[var(--outline-var)] flex items-center gap-3.5 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-[var(--container)] border border-[var(--outline-var)] flex items-center justify-center shrink-0">
                <Wind size={18} className="text-sky-500" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] block truncate">
                  {lang === 'ru' ? 'Ветер' : 'Wind'}
                </span>
                {loading ? (
                  <div className="h-4 w-12 rounded bg-[var(--surface)] animate-pulse mt-1" />
                ) : (
                  <span className="text-sm font-black text-[var(--on-surface)] block truncate">
                    {windSpeed ? Math.round(windSpeed) : '--'} {lang === 'ru' ? 'м/с' : 'm/s'}
                  </span>
                )}
              </div>
            </div>

            {/* Humidity Card */}
            <div className="p-4 rounded-2xl bg-[var(--surface-dim)]/80 border border-[var(--outline-var)] flex items-center gap-3.5 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-[var(--container)] border border-[var(--outline-var)] flex items-center justify-center shrink-0">
                <Droplets size={18} className="text-blue-500" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] block truncate">
                  {lang === 'ru' ? 'Влажность' : 'Humidity'}
                </span>
                {loading ? (
                  <div className="h-4 w-12 rounded bg-[var(--surface)] animate-pulse mt-1" />
                ) : (
                  <span className="text-sm font-black text-[var(--on-surface)] block truncate">
                    {humidity ? Math.round(humidity) : '--'}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 24-Hour Forecast Card */}
          <div className="p-5 rounded-3xl bg-[var(--container)]/80 border border-[var(--outline-var)] shadow-xs flex flex-col gap-3 shrink-0">
            <span className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)]">
              {t.hourly_forecast}
            </span>

            {loading ? (
              <div className="flex gap-2.5 overflow-hidden py-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-w-[76px] flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)]/60 animate-pulse"
                  >
                    <div className="h-3 w-8 rounded bg-[var(--surface-dim)]" />
                    <div className="h-6 w-6 rounded-full bg-[var(--surface-dim)]" />
                    <div className="h-3 w-8 rounded bg-[var(--surface-dim)]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 select-none scrollbar-thin max-w-full touch-pan-x cursor-grab active:cursor-grabbing">
                {hourlyData.map((h, idx) => (
                  <div
                    key={idx}
                    className="min-w-[76px] flex-shrink-0 flex flex-col items-center justify-center gap-2 p-3 bg-[var(--surface)]/90 hover:bg-[var(--surface)] border border-[var(--outline-var)]/60 rounded-2xl hover:border-[var(--accent)]/50 transition-all hover:scale-103 shadow-2xs"
                  >
                    <span className="text-[10px] font-black text-[var(--on-surface-var)]">{h.time}</span>
                    <div className="my-0.5">{getWeatherIcon(h.type, 22)}</div>
                    <span className="text-xs font-black text-[var(--on-surface)]">{convertTemp(h.temp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 7-Day Forecast Rounded Container (5 cols on lg) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[var(--surface-dim)]/70 border border-[var(--outline-var)] flex flex-col gap-3 shadow-xs overflow-y-auto">
          <div className="flex items-center gap-2 pb-1">
            <div className="p-1.5 rounded-lg bg-[var(--container)] border border-[var(--outline-var)]">
              <CalendarDays size={14} style={{ color: primaryColor }} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface)]">
              {lang === 'ru' ? 'Прогноз на 7 дней' : '7-Day Forecast'}
            </h4>
          </div>

          {loading && dailyData.length === 0 ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] animate-pulse"
                >
                  <div className="h-3 w-10 rounded bg-[var(--surface-dim)]" />
                  <div className="h-5 w-5 rounded-full bg-[var(--surface-dim)]" />
                  <div className="flex-1 h-3 rounded bg-[var(--surface-dim)]" />
                  <div className="h-3 w-8 rounded bg-[var(--surface-dim)]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {dailyData.map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 px-3.5 bg-[var(--container)] hover:bg-[var(--container-high)] border border-[var(--outline-var)]/60 rounded-2xl transition-all shadow-2xs hover:scale-[1.01]"
                >
                  <span className="w-14 text-xs font-black text-[var(--on-surface)] shrink-0">{d.day}</span>
                  <div className="shrink-0">{getWeatherIcon(d.type, 20)}</div>
                  <span className="flex-1 text-[11px] font-bold text-[var(--on-surface-var)] truncate">{d.desc}</span>
                  <div className="flex items-center gap-1.5 text-xs font-black tabular-nums shrink-0">
                    <span className="text-[var(--on-surface-var)]">{convertTemp(d.minTemp)}</span>
                    <span className="text-[var(--outline-var)] font-normal">/</span>
                    <span className="text-[var(--on-surface)]">{convertTemp(d.maxTemp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (embeddedInWindow) {
    return modalContent;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(5px)' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative z-10 w-[840px] h-[600px] max-h-[90vh] overflow-hidden rounded-[2.25rem]"
        >
          {modalContent}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


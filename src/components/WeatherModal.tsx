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
  const [cityName, setCityName] = useState<string>(() => {
    try {
      const cached = localStorage.getItem('linkerru_cached_weather_city');
      return cached || '';
    } catch {
      return '';
    }
  });

  // Real data state with instant cache hydration
  const [currentTempC, setCurrentTempC] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem('linkerru_cached_weather');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.currentTempC ?? null;
      }
    } catch {}
    return null;
  });
  const [windSpeed, setWindSpeed] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem('linkerru_cached_weather');
      if (cached) return JSON.parse(cached).windSpeed ?? null;
    } catch {}
    return null;
  });
  const [humidity, setHumidity] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem('linkerru_cached_weather');
      if (cached) return JSON.parse(cached).humidity ?? null;
    } catch {}
    return null;
  });
  const [hourlyData, setHourlyData] = useState<{ time: string; temp: number; type: string }[]>(() => {
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
            const resolvedName = name || customCity;
            setCityName(resolvedName);
            localStorage.setItem('linkerru_cached_weather_city', resolvedName);
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
            const myLocName = lang === 'ru' ? 'Моё местоположение' : lang === 'uk' ? 'Моє місце розташування' : 'My location';
            setCityName(myLocName);
            localStorage.setItem('linkerru_cached_weather_city', myLocName);
            lastCoordsRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            loadWeather(pos.coords.latitude, pos.coords.longitude);
          },
          (err) => {
            console.warn('Geolocation failed or timed out', err);
            const lat = Number(latStr) || 52.52;
            const lon = Number(lonStr) || 13.41;
            const fallbackCity = lang === 'ru' ? 'Берлин' : lang === 'uk' ? 'Берлін' : 'Berlin';
            setCityName(fallbackCity);
            localStorage.setItem('linkerru_cached_weather_city', fallbackCity);
            lastCoordsRef.current = { lat, lon };
            loadWeather(lat, lon);
          },
          { timeout: 1500, maximumAge: 600000 }
        );
      } else {
        const lat = Number(latStr) || 52.52;
        const lon = Number(lonStr) || 13.41;
        const fallbackCity = lang === 'ru' ? 'Берлин' : lang === 'uk' ? 'Берлін' : 'Berlin';
        setCityName(fallbackCity);
        localStorage.setItem('linkerru_cached_weather_city', fallbackCity);
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
    if (currentTempC === null) {
      setLoading(true);
    }
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
      const curTemp = current.variables(0)!.value();
      const curWind = current.variables(1)!.value();
      setCurrentTempC(curTemp);
      setWindSpeed(curWind);

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

      let humVal: number | null = null;
      if (humidArray && humidArray.length > 0) {
        humVal = humidArray[0];
        setHumidity(humVal);
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

      const days = lang === 'ru' 
        ? ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'] 
        : lang === 'uk'
        ? ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']
        : ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const dData: DailyForecast[] = [];
      for (let i = 0; i < Math.min(7, dMax.length); i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const code = dCode[i];
        let type = 'sun';
        let desc = lang === 'ru' ? 'Ясно' : lang === 'uk' ? 'Ясно' : 'Clear';
        if (code >= 1 && code <= 3) { type = 'cloudy_sun'; desc = lang === 'ru' ? 'Облачно' : lang === 'uk' ? 'Хмарно' : 'Cloudy'; }
        if (code >= 45 && code <= 48) { type = 'cloudy'; desc = lang === 'ru' ? 'Туман' : lang === 'uk' ? 'Туман' : 'Fog'; }
        if (code >= 51 && code <= 67) { type = 'rain'; desc = lang === 'ru' ? 'Дождь' : lang === 'uk' ? 'Дощ' : 'Rain'; }
        if (code >= 71 && code <= 77) { type = 'snow'; desc = lang === 'ru' ? 'Снег' : lang === 'uk' ? 'Сніг' : 'Snow'; }
        if (code >= 80 && code <= 99) { type = 'rain'; desc = lang === 'ru' ? 'Ливень' : lang === 'uk' ? 'Злива' : 'Shower'; }

        dData.push({
          day: i === 0 ? (lang === 'ru' ? 'Сегодня' : lang === 'uk' ? 'Сьогодні' : 'Today') : `${days[d.getDay()]}`,
          maxTemp: dMax[i],
          minTemp: dMin[i],
          type,
          desc,
        });
      }
      setDailyData(dData);

      // Cache weather for fast instant display next time
      try {
        localStorage.setItem(
          'linkerru_cached_weather',
          JSON.stringify({
            currentTempC: curTemp,
            windSpeed: curWind,
            humidity: humVal,
            hourlyData: hData,
            dailyData: dData,
            cachedAt: Date.now(),
          })
        );
      } catch {}
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
      case 'sun': return <Sun size={size} className="text-[var(--on-surface)]" />;
      case 'cloudy_sun': return <CloudSun size={size} className="text-[var(--on-surface)]" />;
      case 'cloudy': return <Cloud size={size} className="text-[var(--on-surface-var)]" />;
      case 'rain': return <CloudRain size={size} className="text-[var(--on-surface)]" />;
      case 'snow': return <Snowflake size={size} className="text-[var(--on-surface)]" />;
      case 'fog': return <CloudFog size={size} className="text-[var(--on-surface-var)]" />;
      case 'thunder': return <CloudLightning size={size} className="text-[var(--on-surface)]" />;
      default: return <Sun size={size} className="text-[var(--on-surface)]" />;
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`relative z-10 w-full h-full overflow-hidden flex flex-col p-3.5 md:p-4 gap-3 select-none font-sans ${
        embeddedInWindow
          ? 'bg-transparent text-[var(--on-surface)]'
          : 'rounded-[2rem] border border-[var(--outline-var)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-2xl'
      }`}
      style={
        embeddedInWindow
          ? {}
          : {
              borderColor: 'var(--outline-var)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            }
      }
    >
      {/* 1. TOP HEADER BAR: rounded pill card with accent icon */}
      <div className="flex items-center justify-between gap-3 p-2.5 px-3.5 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/12 border border-[var(--accent)]/20 text-[var(--accent)] accent-bright">
            <CloudSun size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold tracking-tight text-[var(--on-surface)] truncate leading-tight">
              {t.weather_title}
            </h3>
            <p className="text-[10.5px] text-[var(--on-surface-var)] font-semibold truncate leading-tight">
              {cityName || (lang === 'ru' ? 'Автоопределение' : lang === 'uk' ? 'Автовизначення' : 'Auto-detected')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Location settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              showSettings
                ? 'bg-[var(--accent)] text-[var(--on-accent)] border-transparent shadow-xs'
                : 'bg-[var(--surface)] text-[var(--on-surface-var)] hover:text-[var(--accent)] border-[var(--outline-var)] hover:bg-[var(--container-high)]'
            }`}
            title={lang === 'ru' ? 'Настройки локации' : lang === 'uk' ? 'Налаштування локації' : 'Location settings'}
          >
            <MapPin size={12} />
            <span className="hidden sm:inline text-[11px]">{lang === 'ru' ? 'Локация' : lang === 'uk' ? 'Локація' : 'Location'}</span>
          </button>

          {/* Unit Switcher */}
          <div className="flex bg-[var(--surface)] border border-[var(--outline-var)] rounded-full p-0.5 shadow-xs">
            <button
              onClick={() => {
                setUnit('C');
                localStorage.setItem('linkerru_temp_unit', 'C');
                window.dispatchEvent(new Event('linkerru_temp_unit_changed'));
              }}
              className={`h-6.5 px-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
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
              className={`h-6.5 px-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
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
              className="flex h-7.5 w-7.5 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] active:scale-95 cursor-pointer shadow-xs ml-0.5"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Location Settings Collapsible Card */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[var(--container)] p-3.5 rounded-2xl border border-[var(--outline-var)] flex flex-col gap-2.5 shadow-sm shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--on-surface)] flex items-center gap-1.5">
                <Compass size={13} className="text-[var(--on-surface)]" />
                {lang === 'ru' ? 'Координаты погоды' : lang === 'uk' ? 'Координати погоди' : 'Weather Coordinates'}
              </span>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[11px] font-bold text-[var(--on-surface-var)] hover:text-[var(--on-surface)] cursor-pointer"
              >
                {lang === 'ru' ? 'Закрыть' : lang === 'uk' ? 'Закрити' : 'Close'}
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
                  className="bg-[var(--surface)] text-xs font-semibold rounded-xl px-3 py-1.5 border border-[var(--outline-var)] text-[var(--on-surface)] focus:outline-hidden focus:border-[var(--accent)]"
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
                  className="bg-[var(--surface)] text-xs font-semibold rounded-xl px-3 py-1.5 border border-[var(--outline-var)] text-[var(--on-surface)] focus:outline-hidden focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setShowSettings(false);
                loadWeather(Number(latStr), Number(lonStr));
              }}
              className="w-full bg-[var(--accent)] text-[var(--on-accent)] py-2 rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-98 transition-all cursor-pointer"
            >
              {lang === 'ru' ? 'Обновить координаты' : lang === 'uk' ? 'Оновити координати' : 'Update Coordinates'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN BODY: Responsive 2-column layout */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-3 min-h-0">
        {/* LEFT COLUMN: Hero Temp + Quick Stats + Hourly */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto pr-0.5">
          {/* Hero Weather Card */}
          <div className="p-4.5 md:p-5 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] flex flex-col justify-between relative overflow-hidden shadow-xs shrink-0">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-[var(--on-surface-var)] block mb-1">
                  {lang === 'ru' ? 'Текущая погода' : lang === 'uk' ? 'Поточна погода' : 'Current weather'}
                </span>
                {loading ? (
                  <div className="h-12 w-28 rounded-xl bg-[var(--surface-dim)] animate-pulse my-1" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter text-[var(--accent)] accent-bright">
                      {convertTemp(currentTempC)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end">
                <div className="p-2.5 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 shadow-xs">
                  {dailyData.length > 0 ? getWeatherIcon(dailyData[0].type, 32) : <Sun size={32} className="text-[var(--accent)] accent-bright" />}
                </div>
                <span className="text-xs font-extrabold text-[var(--on-surface)] mt-1.5">
                  {dailyData.length > 0 ? dailyData[0].desc : (lang === 'ru' ? 'Ясно' : lang === 'uk' ? 'Ясно' : 'Clear')}
                </span>
              </div>
            </div>

            {/* Bottom info row inside hero */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--outline-var)]/60 relative z-10 text-[11px]">
              <span className="font-bold text-[var(--on-surface-var)]">
                {lang === 'ru' ? 'Сегодня' : lang === 'uk' ? 'Сьогодні' : 'Today'}
              </span>
              {dailyData.length > 0 && (
                <div className="flex items-center gap-1.5 font-black tabular-nums">
                  <span className="text-[var(--on-surface-var)]">{convertTemp(dailyData[0].minTemp)}</span>
                  <span className="text-[var(--outline-var)]">/</span>
                  <span className="text-[var(--accent)] accent-bright">{convertTemp(dailyData[0].maxTemp)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards (Monochromatic) */}
          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            {/* Wind Card */}
            <div className="p-3 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] flex items-center gap-3 shadow-xs">
              <div className="h-8.5 w-8.5 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0 text-[var(--accent)] accent-bright">
                <Wind size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-[var(--on-surface-var)] block truncate">
                  {lang === 'ru' ? 'Ветер' : lang === 'uk' ? 'Вітер' : 'Wind'}
                </span>
                {loading ? (
                  <div className="h-3.5 w-10 rounded bg-[var(--surface)] animate-pulse mt-0.5" />
                ) : (
                  <span className="text-xs font-black text-[var(--on-surface)] block truncate tabular-nums">
                    {windSpeed ? Math.round(windSpeed) : '--'} {lang === 'ru' || lang === 'uk' ? 'м/с' : 'm/s'}
                  </span>
                )}
              </div>
            </div>

            {/* Humidity Card */}
            <div className="p-3 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] flex items-center gap-3 shadow-xs">
              <div className="h-8.5 w-8.5 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0 text-[var(--accent)] accent-bright">
                <Droplets size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-[var(--on-surface-var)] block truncate">
                  {lang === 'ru' ? 'Влажность' : lang === 'uk' ? 'Вологість' : 'Humidity'}
                </span>
                {loading ? (
                  <div className="h-3.5 w-10 rounded bg-[var(--surface)] animate-pulse mt-0.5" />
                ) : (
                  <span className="text-xs font-black text-[var(--on-surface)] block truncate tabular-nums">
                    {humidity ? Math.round(humidity) : '--'}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 24-Hour Forecast Card */}
          <div className="p-3.5 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] shadow-xs flex flex-col gap-2 shrink-0">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-[var(--on-surface-var)]">
              {t.hourly_forecast}
            </span>

            {loading ? (
              <div className="flex gap-2 overflow-hidden py-0.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-w-[68px] flex-shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)]/60 animate-pulse"
                  >
                    <div className="h-2.5 w-7 rounded bg-[var(--surface-dim)]" />
                    <div className="h-5 w-5 rounded-full bg-[var(--surface-dim)]" />
                    <div className="h-2.5 w-7 rounded bg-[var(--surface-dim)]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-0.5 pt-0.5 select-none scrollbar-thin max-w-full touch-pan-x cursor-grab active:cursor-grabbing">
                {hourlyData.map((h, idx) => (
                  <div
                    key={idx}
                    className="min-w-[68px] flex-shrink-0 flex flex-col items-center justify-center gap-1.5 p-2.5 bg-[var(--surface)] border border-[var(--outline-var)]/60 rounded-xl hover:border-[var(--accent)]/40 transition-all shadow-2xs"
                  >
                    <span className="text-[9.5px] font-black text-[var(--on-surface-var)]">{h.time}</span>
                    <div className="my-0.5">{getWeatherIcon(h.type, 18)}</div>
                    <span className="text-[11px] font-black text-[var(--on-surface)] tabular-nums">{convertTemp(h.temp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 7-Day Forecast Bounded Container */}
        <div className="w-full md:w-[300px] lg:w-[330px] p-3.5 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] flex flex-col gap-2.5 shadow-xs shrink-0 min-h-0 h-full max-h-full">
          <div className="flex items-center gap-2 pb-0.5 shrink-0">
            <div className="p-1 rounded-lg bg-[var(--accent)]/12 border border-[var(--accent)]/20 text-[var(--accent)] accent-bright">
              <CalendarDays size={13} />
            </div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--on-surface)]">
              {lang === 'ru' ? 'Прогноз на 7 дней' : lang === 'uk' ? 'Прогноз на 7 днів' : '7-Day Forecast'}
            </h4>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
            {loading && dailyData.length === 0 ? (
              <div className="flex flex-col gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--container)] border border-[var(--outline-var)] animate-pulse"
                  >
                    <div className="h-3 w-8 rounded bg-[var(--surface-dim)]" />
                    <div className="h-4 w-4 rounded-full bg-[var(--surface-dim)]" />
                    <div className="flex-1 h-3 rounded bg-[var(--surface-dim)]" />
                    <div className="h-3 w-7 rounded bg-[var(--surface-dim)]" />
                  </div>
                ))}
              </div>
            ) : (
              dailyData.map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2 px-3 bg-[var(--container)] hover:bg-[var(--container-high)] border border-[var(--outline-var)]/60 rounded-xl transition-all shadow-2xs"
                >
                  <span className="w-10 text-[11px] font-black text-[var(--on-surface)] shrink-0">{d.day}</span>
                  <div className="shrink-0">{getWeatherIcon(d.type, 16)}</div>
                  <span className="flex-1 text-[10.5px] font-bold text-[var(--on-surface-var)] truncate">{d.desc}</span>
                  <div className="flex items-center gap-1 text-[11px] font-black tabular-nums shrink-0">
                    <span className="text-[var(--on-surface-var)]">{convertTemp(d.minTemp)}</span>
                    <span className="text-[var(--outline-var)] font-normal">/</span>
                    <span className="text-[var(--accent)] accent-bright">{convertTemp(d.maxTemp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
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


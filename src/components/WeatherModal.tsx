import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, Cloud, CloudSun, CloudRain, Snowflake, Wind, Droplets, MapPin, CalendarDays } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { fetchWeatherApi } from 'openmeteo';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  primaryColor: string;
}

interface DailyForecast {
  day: string;
  maxTemp: number;
  minTemp: number;
  type: string;
  desc: string;
}

export default function WeatherModal({ isOpen, onClose, lang, primaryColor }: WeatherModalProps) {
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const t = translations[lang];

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [latStr, setLatStr] = useState('52.52');
  const [lonStr, setLonStr] = useState('13.41');
  const [loading, setLoading] = useState(false);

  // Real data state
  const [currentTempC, setCurrentTempC] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [hourlyData, setHourlyData] = useState<{ time: string, temp: number, type: string }[]>([]);
  const [dailyData, setDailyData] = useState<DailyForecast[]>([]);

  // Track last coordinates so the hourly auto-refresh uses the same location
  const lastCoordsRef = useRef<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchByLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const newLat = pos.coords.latitude.toString();
            const newLon = pos.coords.longitude.toString();
            setLatStr(newLat);
            setLonStr(newLon);
            lastCoordsRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            loadWeather(pos.coords.latitude, pos.coords.longitude);
          },
          (err) => {
            console.warn('Geolocation failed', err);
            const lat = Number(latStr) || 52.52;
            const lon = Number(lonStr) || 13.41;
            lastCoordsRef.current = { lat, lon };
            loadWeather(lat, lon);
          }
        );
      } else {
        const lat = Number(latStr) || 52.52;
        const lon = Number(lonStr) || 13.41;
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

      // Just taking the next 8 hours
      const hData = [];
      const timesArray = Array.from(
        { length: 8 },
        (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
      );
      const tempsArray = hourly.variables(0)!.valuesArray();
      const humidArray = hourly.variables(1)!.valuesArray();

      if (humidArray && humidArray.length > 0) {
        setHumidity(humidArray[0]);
      }

      for(let i=0; i<8; i++) {
        const timeStr = `${String(timesArray[i].getHours()).padStart(2, '0')}:00`;
        hData.push({
          time: timeStr,
          temp: tempsArray[i],
          type: tempsArray[i] < 0 ? 'snow' : (humidArray[i] > 85 ? 'rain' : 'cloudy_sun')
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
      case 'sun': return <Sun size={size} style={{ color: primaryColor }} />;
      case 'cloudy_sun': return <CloudSun size={size} style={{ color: primaryColor }} />;
      case 'cloudy': return <Cloud size={size} className="text-[var(--on-surface-var)]" />;
      case 'rain': return <CloudRain size={size} style={{ color: primaryColor }} />;
      case 'snow': return <Snowflake size={size} style={{ color: primaryColor }} />;
      default: return <Sun size={size} style={{ color: primaryColor }} />;
    }
  };

  if (!isOpen) return null;

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
          className="relative z-10 w-[820px] h-[600px] overflow-hidden rounded-[2rem] border bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] backdrop-blur-2xl flex flex-col"
          style={{
            borderColor: 'color-mix(in srgb, var(--accent) 15%, var(--outline-var))',
            boxShadow: '0 30px 60px -15px rgba(0,0,0,0.35), 0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent)',
          }}
        >
          {/* Top Bar — M3 Expressive header with gradient */}
          <div className="flex items-center justify-between p-6 pb-3 relative">
            <div className="absolute bottom-0 left-6 right-6 h-px" style={{ background: 'var(--outline-var)' }} />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem]" style={{ background: primaryColor }}>
                <CloudSun size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-[var(--on-surface)]">
                  {t.weather_title}
                </h3>
                <p className="text-xs text-[var(--on-surface-var)] font-semibold mt-0.5">
                  {t.weather_desc}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 relative">
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-red-500 hover:text-white hover:scale-105 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content — split horizontally into 2 sections on wide screens */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* LEFT SECTION: Current + Hourly */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 md:border-r border-[var(--outline-var)]">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  <MapPin size={12} /> {lang === 'ru' ? 'Настройки локации' : 'Location Settings'}
                </button>
              </div>

              <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[var(--container)] p-4 rounded-[1.25rem] border border-[var(--outline-var)] flex flex-col gap-3 overflow-hidden"
                >
                  <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">Lat</label>
                      <input type="text" value={latStr} onChange={e => setLatStr(e.target.value)} className="bg-[var(--surface)] text-sm rounded-xl px-3 py-2 border border-[var(--outline-var)] text-[var(--on-surface)]" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">Lon</label>
                      <input type="text" value={lonStr} onChange={e => setLonStr(e.target.value)} className="bg-[var(--surface)] text-sm rounded-xl px-3 py-2 border border-[var(--outline-var)] text-[var(--on-surface)]" />
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowSettings(false); loadWeather(Number(latStr), Number(lonStr)); }}
                    className="w-full text-white py-2.5 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                    style={{ background: primaryColor }}
                  >
                    {lang === 'ru' ? 'Обновить данные' : 'Update Data'}
                  </button>
                </motion.div>
              )}
              </AnimatePresence>

              {/* Temperature Unit Card — M3 Expressive */}
              <div className="flex justify-between items-center bg-[var(--container)] border border-[var(--outline-var)] rounded-[1.5rem] p-5">
                <div>
                  <span className="text-xs font-bold text-[var(--on-surface-var)] block mb-1">
                    {lang === 'ru' ? 'СЕЙЧАС' : 'CURRENT TEMPERATURE'}
                  </span>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="m3-skeleton h-10 w-24" />
                      <div className="m3-progress m3-progress-sm" />
                    </div>
                  ) : (
                    <span className="text-5xl font-black tracking-tighter text-[var(--on-surface)] select-none">
                      {convertTemp(currentTempC)}
                    </span>
                  )}
                </div>
                <div className="flex bg-[var(--surface)] border border-[var(--outline-var)] rounded-full p-1">
                  <button
                    onClick={() => setUnit('C')}
                    className={`h-8 w-8 rounded-full text-xs font-black transition-all ${unit === 'C' ? 'bg-[var(--on-surface)] text-[var(--surface)] shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'}`}
                  >°C</button>
                  <button
                    onClick={() => setUnit('F')}
                    className={`h-8 w-8 rounded-full text-xs font-black transition-all ${unit === 'F' ? 'bg-[var(--on-surface)] text-[var(--surface)] shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'}`}
                  >°F</button>
                </div>
              </div>

              {/* Extra Weather Info Grid — M3 Expressive rounded cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 bg-[var(--surface-dim)] rounded-[1.25rem] border border-[var(--outline-var)] flex flex-col items-center justify-center text-center">
                  <Wind size={16} className="text-[var(--on-surface-var)] mb-1" />
                  <span className="text-[10px] font-black text-[var(--on-surface-var)] uppercase tracking-wider mb-0.5">
                    {lang === 'ru' ? 'Ветер' : 'Wind'}
                  </span>
                  {loading ? (
                    <div className="m3-skeleton h-4 w-12" />
                  ) : (
                    <span className="text-xs font-bold text-[var(--on-surface)]">
                      {windSpeed ? Math.round(windSpeed) : '--'} {lang === 'ru' ? 'м/с' : 'm/s'}
                    </span>
                  )}
                </div>
                <div className="p-3.5 bg-[var(--surface-dim)] rounded-[1.25rem] border border-[var(--outline-var)] flex flex-col items-center justify-center text-center">
                  <Droplets size={16} className="text-[var(--on-surface-var)] mb-1" />
                  <span className="text-[10px] font-black text-[var(--on-surface-var)] uppercase tracking-wider mb-0.5">
                    {lang === 'ru' ? 'Влажность' : 'Humidity'}
                  </span>
                  {loading ? (
                    <div className="m3-skeleton h-4 w-12" />
                  ) : (
                    <span className="text-xs font-bold text-[var(--on-surface)]">
                      {humidity ? Math.round(humidity) : '--'}%
                    </span>
                  )}
                </div>
              </div>

              {/* Hourly Forecast — M3 Expressive */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] mb-3">
                  {t.hourly_forecast}
                </h4>
                {loading ? (
                  <div className="flex gap-2 overflow-hidden pb-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="min-w-[76px] flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-[1.25rem] border border-[var(--outline-var)]" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="m3-skeleton h-3 w-10" style={{ animationDelay: `${i * 80}ms` }} />
                        <div className="m3-skeleton h-6 w-6 rounded-full" style={{ animationDelay: `${i * 80}ms` }} />
                        <div className="m3-skeleton h-3 w-8" style={{ animationDelay: `${i * 80}ms` }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth select-none scrollbar-thin">
                    {hourlyData.map((h, idx) => (
                      <div
                        key={idx}
                        className="min-w-[76px] flex-shrink-0 flex flex-col items-center justify-center gap-2 p-3 bg-[var(--container)] border border-[var(--outline-var)] rounded-[1.25rem] m3-card-enter"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <span className="text-[10px] font-black text-[var(--on-surface-var)]">
                          {h.time}
                        </span>
                        <div className="my-1">{getWeatherIcon(h.type)}</div>
                        <span className="text-xs font-black text-[var(--on-surface)]">
                          {convertTemp(h.temp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SECTION: 7-Day Forecast — M3 Expressive */}
            <div className="md:w-[340px] shrink-0 overflow-y-auto p-6 pt-2 space-y-4 bg-[var(--surface-dim)] border-t md:border-t-0 border-[var(--outline-var)]">
              <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] mb-3 flex items-center gap-1.5 sticky top-0 bg-[var(--surface-dim)] py-2 -mt-2 z-10">
                <CalendarDays size={12} style={{ color: primaryColor }} />
                {lang === 'ru' ? 'Прогноз на 7 дней' : '7-day forecast'}
              </h4>
              {loading && dailyData.length === 0 ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-[1rem] border border-[var(--outline-var)]">
                      <div className="m3-skeleton h-3 w-14" style={{ animationDelay: `${i * 60}ms` }} />
                      <div className="m3-skeleton h-5 w-5 rounded-full" style={{ animationDelay: `${i * 60}ms` }} />
                      <div className="flex-1 m3-skeleton h-3 w-16" style={{ animationDelay: `${i * 60}ms` }} />
                      <div className="m3-skeleton h-3 w-8" style={{ animationDelay: `${i * 60}ms` }} />
                      <div className="m3-skeleton h-3 w-8" style={{ animationDelay: `${i * 60}ms` }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {dailyData.map((d, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-[var(--container)] border border-[var(--outline-var)] rounded-[1rem] m3-card-enter"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <span className="w-16 text-[11px] font-black text-[var(--on-surface)] shrink-0">{d.day}</span>
                      <div className="shrink-0">{getWeatherIcon(d.type, 20)}</div>
                      <span className="flex-1 text-[11px] font-bold text-[var(--on-surface-var)] truncate">{d.desc}</span>
                      <span className="text-[11px] font-black text-[var(--on-surface-var)] tabular-nums">{convertTemp(d.minTemp)}</span>
                      <span className="text-[11px] font-black text-[var(--on-surface)] tabular-nums">{convertTemp(d.maxTemp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

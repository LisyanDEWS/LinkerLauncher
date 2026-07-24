import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, Cloud, CloudSun, CloudRain, Snowflake, ExternalLink, Wind, Droplets, Thermometer, MapPin } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { fetchWeatherApi } from 'openmeteo';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  primaryColor: string;
  onOpenInLinkerRu?: () => void;
}

export default function WeatherModal({ isOpen, onClose, lang, primaryColor, onOpenInLinkerRu }: WeatherModalProps) {
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isAskingOpen, setIsAskingOpen] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const newLat = pos.coords.latitude.toString();
            const newLon = pos.coords.longitude.toString();
            setLatStr(newLat);
            setLonStr(newLon);
            loadWeather(pos.coords.latitude, pos.coords.longitude);
          },
          (err) => {
            console.warn('Geolocation failed', err);
            loadWeather(Number(latStr) || 52.52, Number(lonStr) || 13.41);
          }
        );
      } else {
        loadWeather(Number(latStr) || 52.52, Number(lonStr) || 13.41);
      }
    }
  }, [isOpen]);

  const loadWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const params = {
        latitude: lat,
        longitude: lon,
        current: ["temperature_2m", "wind_speed_10m"],
        hourly: ["temperature_2m", "relative_humidity_2m", "wind_speed_10m"]
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

  const getWeatherIcon = (type: string) => {
    switch (type) {
      case 'sun': return <Sun size={24} style={{ color: primaryColor }} />;
      case 'cloudy_sun': return <CloudSun size={24} style={{ color: primaryColor }} />;
      case 'cloudy': return <Cloud size={24} className="text-[var(--on-surface-var)]" />;
      case 'rain': return <CloudRain size={24} style={{ color: primaryColor }} />;
      case 'snow': return <Snowflake size={24} style={{ color: primaryColor }} />;
      default: return <Sun size={24} style={{ color: primaryColor }} />;
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
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(5px)' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-hidden rounded-3xl border border-[var(--outline-var)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur-xl shadow-2xl flex flex-col"
        >
          {/* Top Bar Buttons */}
          <div className="flex items-center justify-between p-6 pb-2 relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--container)] border border-[var(--outline-var)]">
                <CloudSun size={20} className="text-[var(--on-surface-var)]" />
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
              {isAskingOpen ? (
                <div className="absolute right-0 top-12 w-48 bg-[var(--surface)] border border-[var(--outline)] rounded-xl shadow-xl flex flex-col p-1 z-50">
                  <span className="text-xs font-bold text-[var(--on-surface-var)] px-3 pt-2 pb-1">{lang === 'ru' ? 'Открыть в:' : 'Open in:'}</span>
                  <button onClick={() => { setIsAskingOpen(false); onClose(); if (onOpenInLinkerRu) onOpenInLinkerRu(); }} className="text-left px-3 py-2 text-sm hover:bg-[var(--container)] rounded-lg transition-colors font-semibold">LinkerRu</button>
                  <button onClick={() => { 
                    setIsAskingOpen(false); 
                    const win = window.open('about:blank', '_blank');
                    if (win) {
                      win.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Weather App</title>
                          <style>
                            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #09090b; display: flex; align-items: center; justify-content: center; color: white; font-family: sans-serif; }
                          </style>
                        </head>
                        <body>
                          <iframe id="frame" src="https://lisyanweather.netlify.app" style="width: 100vw; height: 100vh; border: none;" allow="geolocation"></iframe>
                        </body>
                        </html>
                      `);
                    }
                  }} className="text-left px-3 py-2 text-sm hover:bg-[var(--container)] rounded-lg transition-colors font-semibold">about:blank</button>
                </div>
              ) : null}

              <button
                onClick={() => setIsAskingOpen(!isAskingOpen)}
                className="flex h-9 px-3 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--container)] text-[var(--on-surface)] transition-all hover:bg-[var(--surface-dim)] text-xs font-bold gap-1.5 shadow-sm"
              >
                <ExternalLink size={14} />
                {lang === 'ru' ? 'В приложении' : 'Open in app'}
              </button>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-red-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <MapPin size={12} /> {lang === 'ru' ? 'Настройки локации' : 'Location Settings'}
              </button>
            </div>
            
            {showSettings && (
              <div className="bg-[var(--container)] p-4 rounded-2xl border border-[var(--outline-var)] flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">Lat</label>
                    <input type="text" value={latStr} onChange={e => setLatStr(e.target.value)} className="bg-[var(--surface)] text-sm rounded-lg px-2 py-1.5 border border-[var(--outline-var)] text-[var(--on-surface)]" />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">Lon</label>
                    <input type="text" value={lonStr} onChange={e => setLonStr(e.target.value)} className="bg-[var(--surface)] text-sm rounded-lg px-2 py-1.5 border border-[var(--outline-var)] text-[var(--on-surface)]" />
                  </div>
                </div>
                <button 
                  onClick={() => { setShowSettings(false); loadWeather(Number(latStr), Number(lonStr)); }}
                  className="w-full bg-[var(--accent)] text-white py-2 rounded-xl text-xs font-bold shadow-sm hover:opacity-90"
                >
                  {lang === 'ru' ? 'Обновить данные' : 'Update Data'}
                </button>
              </div>
            )}

            {/* Temperature Unit Card */}
            <div className="flex justify-between items-center bg-[var(--container)] border border-[var(--outline-var)] rounded-2xl p-4">
              <div>
                <span className="text-xs font-bold text-[var(--on-surface-var)] block mb-1">
                  {lang === 'ru' ? 'СЕЙЧАС' : 'CURRENT TEMPERATURE'}
                </span>
                <span className="text-5xl font-black tracking-tighter text-[var(--on-surface)] select-none">
                  {loading ? '...' : convertTemp(currentTempC)}
                </span>
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

            {/* Extra Weather Info Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-[var(--surface-dim)] rounded-2xl border border-[var(--outline-var)] flex flex-col items-center justify-center text-center">
                <Wind size={16} className="text-[var(--on-surface-var)] mb-1" />
                <span className="text-[10px] font-black text-[var(--on-surface-var)] uppercase tracking-wider mb-0.5">
                  {lang === 'ru' ? 'Ветер' : 'Wind'}
                </span>
                <span className="text-xs font-bold text-[var(--on-surface)]">
                  {loading ? '...' : `${windSpeed ? Math.round(windSpeed) : '--'} ${lang === 'ru' ? 'м/с' : 'm/s'}`}
                </span>
              </div>
              <div className="p-3 bg-[var(--surface-dim)] rounded-2xl border border-[var(--outline-var)] flex flex-col items-center justify-center text-center">
                <Droplets size={16} className="text-[var(--on-surface-var)] mb-1" />
                <span className="text-[10px] font-black text-[var(--on-surface-var)] uppercase tracking-wider mb-0.5">
                  {lang === 'ru' ? 'Влажность' : 'Humidity'}
                </span>
                <span className="text-xs font-bold text-[var(--on-surface)]">
                  {loading ? '...' : `${humidity ? Math.round(humidity) : '--'}%`}
                </span>
              </div>
            </div>

            {/* Hourly Forecast */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] mb-3">
                {t.hourly_forecast}
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth select-none scrollbar-thin">
                {hourlyData.map((h, idx) => (
                  <div
                    key={idx}
                    className="min-w-[76px] flex-shrink-0 flex flex-col items-center justify-center gap-2 p-3 bg-[var(--container)] border border-[var(--outline-var)] rounded-2xl"
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
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

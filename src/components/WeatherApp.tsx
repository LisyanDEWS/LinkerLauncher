import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSun, Snowflake, Sun, Wind, Droplets, MapPin, Activity, CalendarDays, Maximize, Minimize, Settings } from 'lucide-react';
import { fetchWeatherApi } from 'openmeteo';

interface WeatherAppProps {
  primaryColor: string;
}

export default function WeatherApp({ primaryColor }: WeatherAppProps) {
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [loading, setLoading] = useState(true);
  const [latStr, setLatStr] = useState('35.05');
  const [lonStr, setLonStr] = useState('-80.85');
  const [locName, setLocName] = useState('Charlotte, North Carolina, United States');
  const [showSettings, setShowSettings] = useState(false);
  
  const [currentTempC, setCurrentTempC] = useState<number | null>(null);
  const [feelsLikeC, setFeelsLikeC] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [pressure, setPressure] = useState<number | null>(null);
  const [clouds, setClouds] = useState<number | null>(null);
  const [precipitation, setPrecipitation] = useState<number | null>(null);

  const [hourlyData, setHourlyData] = useState<{ time: string, temp: number, type: string, humidity: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ day: string, maxTemp: number, minTemp: number, type: string, desc: string }[]>([]);
  const [hourlyTrend, setHourlyTrend] = useState<number[]>([]);

  useEffect(() => {
    loadWeather(Number(latStr), Number(lonStr));
  }, []);

  const loadWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const params = {
        latitude: lat,
        longitude: lon,
        current: ["temperature_2m", "apparent_temperature", "relative_humidity_2m", "wind_speed_10m", "surface_pressure", "cloud_cover", "precipitation"],
        hourly: ["temperature_2m", "relative_humidity_2m"],
        daily: ["temperature_2m_max", "temperature_2m_min", "weather_code"],
        forecast_days: 10,
        timezone: "auto"
      };
      const url = "https://api.open-meteo.com/v1/forecast";
      const responses = await fetchWeatherApi(url, params);
      const response = responses[0];
      
      const current = response.current()!;
      setCurrentTempC(current.variables(0)!.value());
      setFeelsLikeC(current.variables(1)!.value());
      setHumidity(current.variables(2)!.value());
      setWindSpeed(current.variables(3)!.value());
      setPressure(current.variables(4)!.value());
      setClouds(current.variables(5)!.value());
      setPrecipitation(current.variables(6)!.value());

      const hourly = response.hourly()!;
      const hData = [];
      const trendData = [];
      const tempsArray = hourly.variables(0)!.valuesArray();
      const humidArray = hourly.variables(1)!.valuesArray();
      
      for(let i=0; i<24; i++) {
        trendData.push(tempsArray[i]);
      }
      setHourlyTrend(trendData);

      // get upcoming 8 hours
      const nowIdx = new Date().getHours();
      for(let i=nowIdx; i<nowIdx+8; i++) {
        hData.push({
          time: `${String(i%24).padStart(2, '0')}:00`,
          temp: tempsArray[i],
          type: tempsArray[i] < 0 ? 'snow' : (humidArray[i] > 85 ? 'rain' : 'cloudy_sun'),
          humidity: humidArray[i]
        });
      }
      setHourlyData(hData);

      const daily = response.daily()!;
      const dMax = daily.variables(0)!.valuesArray();
      const dMin = daily.variables(1)!.valuesArray();
      const dCode = daily.variables(2)!.valuesArray();
      
      const dData = [];
      const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
      for (let i = 0; i < Math.min(10, dMax.length); i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const code = dCode[i];
        let type = 'sun';
        let desc = 'Ясно';
        if (code >= 1 && code <= 3) { type = 'cloudy_sun'; desc = 'Пасмурно'; }
        if (code >= 45 && code <= 48) { type = 'cloudy'; desc = 'Туман'; }
        if (code >= 51 && code <= 67) { type = 'rain'; desc = 'Дождь'; }
        if (code >= 71 && code <= 77) { type = 'snow'; desc = 'Снег'; }
        if (code >= 80 && code <= 99) { type = 'rain'; desc = 'Ливень'; }

        dData.push({
          day: `${days[d.getDay()]} ${String(d.getMonth()+1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
          maxTemp: dMax[i],
          minTemp: dMin[i],
          type,
          desc
        });
      }
      setDailyData(dData);

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const convertTemp = (c: number | null) => {
    if (c === null) return '--';
    return unit === 'C' ? `${Math.round(c)}°` : `${Math.round((c * 9) / 5 + 32)}°`;
  };

  const getWeatherIcon = (type: string, size = 24) => {
    switch (type) {
      case 'sun': return <Sun size={size} style={{ color: primaryColor }} />;
      case 'cloudy_sun': return <CloudSun size={size} style={{ color: primaryColor }} />;
      case 'cloudy': return <Cloud size={size} className="text-gray-400" />;
      case 'rain': return <CloudRain size={size} style={{ color: primaryColor }} />;
      case 'snow': return <Snowflake size={size} style={{ color: primaryColor }} />;
      default: return <Sun size={size} style={{ color: primaryColor }} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface-dim)] text-[var(--on-surface)] overflow-y-auto overflow-x-hidden p-4 md:p-8 space-y-6">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--surface)] p-4 rounded-3xl border border-[var(--outline-var)] shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--surface-dim)]">
             <MapPin style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Погода</h1>
            <p className="text-xs text-[var(--on-surface-var)]">{locName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex bg-[var(--surface-dim)] rounded-full p-1 border border-[var(--outline-var)]">
              <button onClick={() => setUnit('C')} className={`w-10 h-10 rounded-full font-bold text-sm ${unit === 'C' ? 'bg-[var(--on-surface)] text-[var(--surface)]' : 'text-[var(--on-surface-var)]'}`}>°C</button>
              <button onClick={() => setUnit('F')} className={`w-10 h-10 rounded-full font-bold text-sm ${unit === 'F' ? 'bg-[var(--on-surface)] text-[var(--surface)]' : 'text-[var(--on-surface-var)]'}`}>°F</button>
           </div>
           <button onClick={() => setShowSettings(!showSettings)} className="w-12 h-12 rounded-full flex items-center justify-center border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors">
              <Settings size={20} />
           </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--outline-var)] shadow-sm flex gap-4 items-end">
           <div className="flex-1 space-y-1">
             <label className="text-xs font-bold text-[var(--on-surface-var)]">Широта (Lat)</label>
             <input value={latStr} onChange={e => setLatStr(e.target.value)} className="w-full bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-xl px-4 py-2" />
           </div>
           <div className="flex-1 space-y-1">
             <label className="text-xs font-bold text-[var(--on-surface-var)]">Долгота (Lon)</label>
             <input value={lonStr} onChange={e => setLonStr(e.target.value)} className="w-full bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-xl px-4 py-2" />
           </div>
           <div className="flex-1 space-y-1">
             <label className="text-xs font-bold text-[var(--on-surface-var)]">Название локации</label>
             <input value={locName} onChange={e => setLocName(e.target.value)} className="w-full bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-xl px-4 py-2" />
           </div>
           <button onClick={() => { setShowSettings(false); loadWeather(Number(latStr), Number(lonStr)); }} className="h-10 px-6 rounded-xl font-bold text-white shadow-sm" style={{ backgroundColor: primaryColor }}>Применить</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {/* Current weather card */}
           <div className="bg-[var(--surface)] rounded-3xl p-6 border border-[var(--outline-var)] shadow-sm">
             <div className="flex justify-between items-start mb-6">
               <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--on-surface-var)]">СЕЙЧАС</span>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-6xl font-black">{convertTemp(currentTempC)}</span>
                    {getWeatherIcon(dailyData[0]?.type || 'sun', 48)}
                  </div>
                  <p className="text-sm text-[var(--on-surface-var)] font-semibold mt-2">Ощущается {convertTemp(feelsLikeC)}</p>
               </div>
               <div className="text-right">
                  <div className="bg-[var(--surface-dim)] px-4 py-2 rounded-2xl border border-[var(--outline-var)] inline-block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)] block">Место</span>
                    <span className="text-sm font-semibold block mt-0.5">{locName}</span>
                    <span className="text-[10px] text-[var(--on-surface-var)]">{latStr}°, {lonStr}°</span>
                  </div>
               </div>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
               <div className="bg-[var(--surface-dim)] p-4 rounded-2xl">
                 <Droplets size={16} className="text-[var(--on-surface-var)] mb-2" />
                 <span className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase block mb-1">Влажность</span>
                 <span className="text-lg font-black">{humidity ? Math.round(humidity) : '--'}%</span>
               </div>
               <div className="bg-[var(--surface-dim)] p-4 rounded-2xl">
                 <Wind size={16} className="text-[var(--on-surface-var)] mb-2" />
                 <span className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase block mb-1">Ветер</span>
                 <span className="text-lg font-black">{windSpeed ? Math.round(windSpeed) : '--'} км/ч</span>
               </div>
               <div className="bg-[var(--surface-dim)] p-4 rounded-2xl">
                 <Activity size={16} className="text-[var(--on-surface-var)] mb-2" />
                 <span className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase block mb-1">Давление</span>
                 <span className="text-lg font-black">{pressure ? Math.round(pressure) : '--'} hPa</span>
               </div>
               <div className="bg-[var(--surface-dim)] p-4 rounded-2xl">
                 <Cloud size={16} className="text-[var(--on-surface-var)] mb-2" />
                 <span className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase block mb-1">Облака</span>
                 <span className="text-lg font-black">{clouds ? Math.round(clouds) : '--'}%</span>
               </div>
             </div>

             <div className="mt-8">
               <span className="text-xs font-bold uppercase tracking-widest text-[var(--on-surface-var)] mb-4 block">Тренд 24 Ч</span>
               <div className="h-24 flex items-end justify-between px-2 w-full gap-1">
                 {hourlyTrend.map((t, i) => (
                    <div key={i} className="flex-1 bg-[var(--surface-dim)] rounded-t-sm hover:bg-[var(--on-surface-var)] transition-colors" style={{ height: `${Math.max(10, (t / 40) * 100)}%` }}></div>
                 ))}
               </div>
             </div>
           </div>

           {/* Hourly forecast */}
           <div className="bg-[var(--surface)] rounded-3xl p-6 border border-[var(--outline-var)] shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--on-surface-var)] flex items-center gap-2">
                  <CalendarDays size={14} /> Почасовой прогноз
                </span>
                <span className="text-xs font-bold text-[var(--on-surface-var)]">СЛЕДУЮЩИЕ 24 ЧАСА →</span>
             </div>
             <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
                {hourlyData.map((h, i) => (
                  <div key={i} className="min-w-[70px] shrink-0 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl p-3 flex flex-col items-center">
                    <span className="text-[10px] font-bold mb-2">{h.time}</span>
                    {getWeatherIcon(h.type, 20)}
                    <span className="text-sm font-black mt-2">{convertTemp(h.temp)}</span>
                    <span className="text-[10px] text-[var(--on-surface-var)] mt-1">{Math.round(h.humidity)}%</span>
                  </div>
                ))}
             </div>
           </div>
        </div>

        {/* 10 days forecast list */}
        <div className="space-y-6">
          <div className="bg-[var(--surface)] rounded-3xl p-6 border border-[var(--outline-var)] shadow-sm">
             <span className="text-xs font-bold uppercase tracking-widest text-[var(--on-surface-var)] flex items-center gap-2 mb-4">
               <CalendarDays size={14} /> Прогноз на 10 дней
             </span>
             <div className="space-y-3">
               {dailyData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[var(--surface-dim)] rounded-2xl border border-[var(--outline-var)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--surface)] rounded-full flex items-center justify-center">
                        {getWeatherIcon(d.type, 18)}
                      </div>
                      <div>
                        <span className="text-xs font-black block">{d.day}</span>
                        <span className="text-[10px] text-[var(--on-surface-var)] font-semibold">{d.desc}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-[var(--on-surface-var)]">{convertTemp(d.minTemp)}</span>
                      <div className="w-12 h-1 bg-[var(--surface)] rounded-full overflow-hidden">
                         <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: primaryColor }}></div>
                      </div>
                      <span>{convertTemp(d.maxTemp)}</span>
                    </div>
                  </div>
               ))}
             </div>
          </div>
          
          <div className="bg-[var(--surface)] rounded-3xl p-6 border border-[var(--outline-var)] shadow-sm">
             <span className="text-xs font-bold uppercase tracking-widest text-[var(--on-surface-var)] mb-4 block">Детали сегодня</span>
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-[var(--surface-dim)] p-4 rounded-2xl">
                 <span className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase block mb-1">Осадки</span>
                 <span className="text-lg font-black">{precipitation ? precipitation : '0.0'} mm</span>
               </div>
               <div className="bg-[var(--surface-dim)] p-4 rounded-2xl">
                 <span className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase block mb-1">Часовой пояс</span>
                 <span className="text-sm font-black break-all">America/New_York</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

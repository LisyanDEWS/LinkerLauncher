import { LisyanConnectModal } from './components/LisyanConnectModal';
import { CLICK_SOUNDS, NOTIFICATION_SOUNDS } from './data/sounds';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun,
  Moon,
  Clock,
  Calendar as CalendarIcon,
  CloudSun,
  Settings,
  User,
  History,
  Globe,
  Lightbulb,
  FileText,
  Hourglass,
  Gamepad2,
  Lock,
  Link2,
  Copy,
  Newspaper,
  QrCode,
  ChevronRight,
  Trash2,
  Play,
  Square,
  Volume2,
  VolumeX,
  Send,
  Mail,
  RefreshCw,
  X,
  Maximize,
  Minimize,
  Bell,
  Bot,
  Battery,
  BatteryCharging,
  Zap,
  MapPin,
  Monitor,
  Shield,
  LogOut,
  Languages,
  Edit2
} from 'lucide-react';

import { Language, ThemeMode } from './types';
import { materialPalettes } from './data/themes';
import { translations } from './data/translations';

// Components
import ClockModal from './components/ClockModal';
import CalendarModal from './components/CalendarModal';
import WeatherModal from './components/WeatherModal';
import WeatherApp from './components/WeatherApp';
import SettingsModal from './components/SettingsModal';
import FullSettingsModal from './components/FullSettingsModal';
import ServerModal from './components/ServerModal';
import ChangelogModal from './components/ChangelogModal';
import StandbyClock from './components/StandbyClock';
import StandbySetupModal from './components/StandbySetupModal';
import NotificationsModal from './components/NotificationsModal';

export default function App() {
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; read: boolean }[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // --- Persistent States (localStorage) ---
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('linkerru_lang') as Language) || 'ru';
  });

  const [standbyBg, setStandbyBg] = useState<string>(() => {
    return localStorage.getItem('linkerru_standby_bg') || 'gradient-1';
  });

  const [mainWallpaper, setMainWallpaper] = useState<string>(() => {
    return localStorage.getItem('linkerru_wallpaper') || 'none';
  });

  const [fontFamily, setFontFamily] = useState<string>(() => {
    return localStorage.getItem('linkerru_font') || '"Space Grotesk", "Inter", sans-serif';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('linkerru_theme') as ThemeMode) || 'light';
  });

  const [activePaletteId, setActivePaletteId] = useState<string>(() => {
    return localStorage.getItem('linkerru_accent') || 'sage_khaki';
  });

  const [isContrast, setIsContrast] = useState<boolean>(() => {
    return localStorage.getItem('linkerru_contrast') === 'true';
  });

  const [isToastEnabled, setIsToastEnabled] = useState<boolean>(() => {
    return localStorage.getItem('linkerru_toast') !== 'false';
  });

  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('linkerru_sound') !== 'false';
  });

  const [soundVolume, setSoundVolume] = useState<number>(() => {
    return Number(localStorage.getItem('linkerru_sound_volume')) || 50;
  });

  const [brightness, setBrightness] = useState<number>(() => {
    return Number(localStorage.getItem('linkerru_brightness')) || 100;
  });

  const [clickSound, setClickSound] = useState<string>(() => {
    return localStorage.getItem('linkerru_click_sound') || 'tap';
  });
  const [notifySound, setNotifySound] = useState<string>(() => {
    return localStorage.getItem('linkerru_notify_sound') || 'opal_bell';
  });

  const [panicKey, setPanicKey] = useState<string>(() => {
    return localStorage.getItem('linkerru_panic_key') || '';
  });

  const [panicUrl, setPanicUrl] = useState<string>(() => {
    return localStorage.getItem('linkerru_panic_url') || 'https://google.com';
  });

  const [selectedServer, setSelectedServer] = useState<string>(() => {
    return localStorage.getItem('linkerru_server') || 'Server 1';
  });

  const [isAgnoOpen, setIsAgnoOpen] = useState(false);
  const [isLisyanConnectOpen, setIsLisyanConnectOpen] = useState(false);
  const [isAgnoFullscreen, setIsAgnoFullscreen] = useState(false);
  const [isWeatherAppOpen, setIsWeatherAppOpen] = useState(false);
    const [isWeatherAppFullscreen, setIsWeatherAppFullscreen] = useState(false);

  const defaultLinks = [
    { name: 'Telegram Version A', url: 'https://t.me/linkerru' },
    { name: 'SoundCloud', url: 'https://soundcloud.com' }
  ];
  const [customLinks, setCustomLinks] = useState<{name: string, url: string}[]>(() => {
    const s = localStorage.getItem('linkerru_links');
    return s ? JSON.parse(s) : defaultLinks;
  });

  const defaultToggles = ['theme', 'language', 'sound', 'contrast', 'proxy', 'terminal', 'dashboard'];
  const [activeToggles, setActiveToggles] = useState<string[]>(() => {
    const s = localStorage.getItem('linkerru_toggles');
    return s ? JSON.parse(s) : defaultToggles;
  });

  const [activeSupportQr, setActiveSupportQr] = useState<string | null>(null);

  useEffect(() => {
    const handleLinksChanged = () => {
      const s = localStorage.getItem('linkerru_links');
      if (s) setCustomLinks(JSON.parse(s));
    };
    const handleTogglesChanged = () => {
      const s = localStorage.getItem('linkerru_toggles');
      if (s) setActiveToggles(JSON.parse(s));
    };
    window.addEventListener('linkerru_links_changed', handleLinksChanged);
    window.addEventListener('linkerru_toggles_changed', handleTogglesChanged);
    return () => {
      window.removeEventListener('linkerru_links_changed', handleLinksChanged);
      window.removeEventListener('linkerru_toggles_changed', handleTogglesChanged);
    };
  }, []);

  // --- Modal Open States ---
  const [isClockOpen, setIsClockOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isFullSettingsOpen, setIsFullSettingsOpen] = useState(false);
  const [isServerOpen, setIsServerOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isStandbyOpen, setIsStandbyOpen] = useState(false);
  const [isStandbySetupOpen, setIsStandbySetupOpen] = useState(false);
  const [clockType, setClockType] = useState<'digital' | 'analog'>('digital');
  const [clockVariation, setClockVariation] = useState<1 | 2 | 3>(1);

  // --- Real-time time chips ---
  const [nowTime, setNowTime] = useState('--:--');
  const [nowDate, setNowDate] = useState('--.--');

  const [batteryLvl, setBatteryLvl] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: string, lon: string} | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // --- Toast Manager State ---
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(1500);
  const pomodoroIntervalRef = useRef<any>(null);

  const [gameVictory, setGameVictory] = useState(false);
  const [gameCards, setGameCards] = useState<{id: number, emoji: string, matched: boolean, flipped: boolean}[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  
  const baseEmojis = ['🌞', '🪐', '🚀', '🛸', '⭐', '☄️'];

  const t = translations[lang];

  useEffect(() => {
    const custom = localStorage.getItem('linkerru_custom_palette');
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        if (!materialPalettes.find(p => p.id === parsed.id)) {
          materialPalettes.push(parsed);
        }
      } catch (e) {}
    }
  }, []);

  const activePalette = useMemo(() => {
    const custom = localStorage.getItem('linkerru_custom_palette');
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        if (!materialPalettes.find(p => p.id === parsed.id)) {
          materialPalettes.push(parsed);
        }
      } catch (e) {}
    }
    return materialPalettes.find((p) => p.id === activePaletteId) || materialPalettes[0];
  }, [activePaletteId]);

  type ToastMessage = { id: string, text: string };
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const lastChimeRef = useRef(0);

  // --- Sound Engine (Chimes) ---
  const lastClickRef = useRef(0);
  const lastToastRef = useRef(0);
  const playChime = (type: 'click' | 'alert' | 'reset' | 'victory' | 'toast' = 'click') => {
    if (!isSoundEnabled || soundVolume === 0) return;
    const now = Date.now();
    
    if (type === 'click') {
      if (now - lastClickRef.current < 50) return;
      lastClickRef.current = now;
    } else {
      if (now - lastToastRef.current < 50) return;
      lastToastRef.current = now;
    }

    const playAudio = (fileId: string, type: 'click' | 'alert' | 'toast' | 'reset' | 'victory') => {
      let url = `/sounds/${fileId}.mp3`;
      if (type === 'click') {
         const found = CLICK_SOUNDS.find(s => s.id === fileId);
         if (found) url = found.url;
      } else {
         const found = NOTIFICATION_SOUNDS.find(s => s.id === fileId);
         if (found) url = found.url;
      }
      const audio = new Audio(url);
      audio.volume = soundVolume / 100;
      audio.play().catch(e => console.log('Audio play error:', e));
      if (fileId === 'iphone') {
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
        }, 2000);
      }
    };

    if (type === 'click') {
      playAudio(clickSound, type);
    } else {
      playAudio(notifySound, type);
    }
  };

  // --- Custom Toast Trigger ---
  const triggerToast = (text: string) => {
    if (!isToastEnabled) return;
    playChime('toast');
    const id = Date.now().toString() + Math.random().toString();
    setToasts(p => [...p, { id, text }]);
  };

  // --- PIPUN CONFIGS / CROSS-APP THEME SYNC ---
  useEffect(() => {
    // Stringified theme config for 'pipun' to read
    const themeStr = `LINKER-THEME=${theme.toUpperCase()}`;
    const message = {
      type: 'LINKER_CONFIG',
      theme,
      themeString: themeStr,
      palette: activePalette,
      userName: 'Guest User'
    };
    
    // Broadcast to all iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, '*');
      }
    });

    // Dispatch global window event
    window.dispatchEvent(new CustomEvent('linker-theme-change', { detail: message }));

    // Global variable
    (window as any).LINKER_THEME = theme.toUpperCase();
    (window as any).__LINKER_CONFIG = message;
  }, [theme, activePalette]);

  // --- Geolocation ---
  useEffect(() => {
    // Check if permission is already granted
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'prompt') {
          const asked = localStorage.getItem('askedLocation');
          if (!asked) {
            setShowLocationPrompt(true);
          }
        } else if (result.state === 'granted') {
           navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude.toString(), lon: pos.coords.longitude.toString() }),
            () => {}
          );
        }
      }).catch(() => {
        const asked = localStorage.getItem('askedLocation');
        if (!asked) {
          setShowLocationPrompt(true);
        }
      });
    } else {
      const asked = localStorage.getItem('askedLocation');
      if (!asked) {
        setShowLocationPrompt(true);
      }
    }
  }, []);

  const handleRequestLocation = () => {
    localStorage.setItem('askedLocation', 'true');
    setShowLocationPrompt(false);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude.toString(), lon: pos.coords.longitude.toString() }),
        () => {}
      );
    }
  };

  // --- Dynamic CSS variables mounting on :root ---
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--accent', activePalette.primary);
    root.style.setProperty('--on-accent', '#ffffff');
    root.style.setProperty('--accent-secondary', activePalette.secondary);
    root.style.setProperty('--accent-tertiary', activePalette.tertiary);

    if (theme === 'dark') {
      root.style.setProperty('--bg', '#09090b'); // Strict dark gray/black, no green tint
      root.style.setProperty('--surface', '#18181b');
      root.style.setProperty('--surface-dim', '#27272a');
      root.style.setProperty('--surface-bright', '#3f3f46');
      root.style.setProperty('--on-surface', '#fafafa');
      root.style.setProperty('--on-surface-var', '#a1a1aa');
      root.style.setProperty('--outline', '#52525b');
      root.style.setProperty('--outline-var', '#3f3f46');
      root.style.setProperty('--container', '#121212');
      root.style.setProperty('--container-high', '#27272a');
      root.style.setProperty('--card-bg', `color-mix(in srgb, #18181b 75%, ${activePalette.primary} 25%)`);
      root.style.setProperty('--panel-bg', `color-mix(in srgb, #18181b 85%, ${activePalette.primary} 15%)`);
      root.style.setProperty('--icon-tint', `color-mix(in srgb, #18181b 70%, ${activePalette.primary} 30%)`);
    } else {
      root.style.setProperty('--bg', '#fafafa'); // Strict light gray, no green tint
      root.style.setProperty('--surface', '#ffffff');
      root.style.setProperty('--surface-dim', '#f4f4f5');
      root.style.setProperty('--surface-bright', '#ffffff');
      root.style.setProperty('--on-surface', '#09090b');
      root.style.setProperty('--on-surface-var', '#71717a');
      root.style.setProperty('--outline', '#d4d4d8');
      root.style.setProperty('--outline-var', '#e4e4e7');
      root.style.setProperty('--container', '#f4f4f5');
      root.style.setProperty('--container-high', '#e4e4e7');
      root.style.setProperty('--card-bg', `color-mix(in srgb, #ffffff 70%, ${activePalette.primary} 30%)`);
      root.style.setProperty('--panel-bg', `color-mix(in srgb, #ffffff 80%, ${activePalette.primary} 20%)`);
      root.style.setProperty('--icon-tint', `color-mix(in srgb, #ffffff 70%, ${activePalette.primary} 30%)`);
    }

    if (isContrast) {
      root.style.setProperty('--outline', theme === 'dark' ? '#d4d4d8' : '#18181b');
      root.style.setProperty('--outline-var', theme === 'dark' ? '#a1a1aa' : '#3f3f46');
      root.style.setProperty('--on-surface-var', theme === 'dark' ? '#f4f4f5' : '#09090b');
      root.style.setProperty('--surface', theme === 'dark' ? '#000000' : '#ffffff');
      root.style.setProperty('--surface-dim', theme === 'dark' ? '#000000' : '#ffffff');
      root.style.setProperty('--card-bg', theme === 'dark' ? '#000000' : '#ffffff');
      root.style.setProperty('--panel-bg', theme === 'dark' ? '#000000' : '#ffffff');
      root.style.setProperty('--bg', theme === 'dark' ? '#000000' : '#ffffff');
    }

    root.style.setProperty('--font-sans', fontFamily);

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.backgroundColor = isContrast 
      ? (theme === 'dark' ? '#000000' : '#ffffff') 
      : (theme === 'dark' ? '#09090b' : '#fafafa');
  }, [theme, activePaletteId, isContrast, fontFamily]);

  // --- Notifications Setup ---
  useEffect(() => {
    const defaultNotifs = [
      {
        id: 'welcome',
        title: lang === 'ru' ? 'Добро пожаловать в LinkerRu' : 'Welcome to LinkerRu',
        message: lang === 'ru' ? 'Новое обновление установлено успешно.' : 'New update installed successfully.',
        read: false
      }
    ];

    let lastChargingState: boolean | null = null;
    let lastLevelState: number | null = null;

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLvl(battery.level);
        setIsCharging(battery.charging);
        lastChargingState = battery.charging;
        lastLevelState = battery.level;

        const updateBattery = (type: 'charging' | 'level' | 'init') => {
          let shouldNotify = false;
          let msg = '';
          
          if (type === 'charging') {
            msg = battery.charging ? (lang === 'ru' ? 'Устройство заряжается.' : 'Device is charging.') : (lang === 'ru' ? 'Зарядка отключена.' : 'Charger disconnected.');
            if (battery.charging !== lastChargingState) {
              shouldNotify = true;
            }
            lastChargingState = battery.charging;
          } else if (type === 'level') {
            msg = battery.level <= 0.2 ? (lang === 'ru' ? 'Низкий заряд батареи!' : 'Low battery!') : (lang === 'ru' ? `Уровень заряда: ${Math.round(battery.level * 100)}%` : `Battery level: ${Math.round(battery.level * 100)}%`);
            if (battery.level <= 0.2 && (lastLevelState === null || lastLevelState > 0.2)) {
              shouldNotify = true;
            }
            if (battery.level === 1 && lastLevelState !== 1) {
              shouldNotify = true;
              msg = lang === 'ru' ? 'Батарея полностью заряжена.' : 'Battery fully charged.';
            }
            lastLevelState = battery.level;
          }
            
          setNotifications(prev => {
            const hasBatt = prev.find(n => n.id === 'battery');
            const newNotif = {
              id: 'battery',
              title: lang === 'ru' ? 'Статус батареи' : 'Battery Status',
              message: battery.charging 
                ? (lang === 'ru' ? 'Устройство заряжается.' : 'Device is charging.')
                : (battery.level <= 0.2 ? (lang === 'ru' ? 'Низкий заряд батареи!' : 'Low battery!') : (lang === 'ru' ? `Уровень заряда: ${Math.round(battery.level * 100)}%` : `Battery level: ${Math.round(battery.level * 100)}%`)),
              read: false
            };
            if (hasBatt) {
              return prev.map(n => n.id === 'battery' ? newNotif : n);
            }
            return [newNotif, ...prev];
          });

          if (shouldNotify && type !== 'init') {
            triggerToast(msg);
          }
        };
        
        updateBattery('init');
        
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
          updateBattery('charging');
        });
        battery.addEventListener('levelchange', () => {
          setBatteryLvl(battery.level);
          updateBattery('level');
        });
      });
    }

    setNotifications(prev => {
      const hasWelcome = prev.find(n => n.id === 'welcome');
      if (hasWelcome) {
        // Just update the welcome language if it exists
        return prev.map(n => n.id === 'welcome' ? defaultNotifs[0] : n);
      }
      return [...defaultNotifs, ...prev];
    });
  }, [lang]);

  // --- Weather Startup Notification ---
  useEffect(() => {
    let mounted = true;
    const fetchWeatherForNotification = async () => {
      if (localStorage.getItem('linkerru_weather_notif') === 'false') return;
      
      const customLoc = localStorage.getItem('linkerru_weather_loc');
      let lat = '55.7558';
      let lon = '37.6173'; // Default Moscow
      
      if (customLoc) {
        try {
          const parsed = JSON.parse(customLoc);
          lat = parsed.lat;
          lon = parsed.lon;
        } catch (e) {}
      } else if (userLocation) {
        lat = userLocation.lat;
        lon = userLocation.lon;
      }
      
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
        if (!res.ok) return;
        const data = await res.json();
        const currentTemp = Math.round(data.current.temperature_2m);
        const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
        const minTemp = Math.round(data.daily.temperature_2m_min[0]);
        
        if (mounted) {
          const message = lang === 'ru' 
            ? `Температура сейчас: ${currentTemp}°C. Сегодня от ${minTemp}°C до ${maxTemp}°C.`
            : `Temperature now: ${currentTemp}°C. Today from ${minTemp}°C to ${maxTemp}°C.`;
            
          triggerToast(message);
          setNotifications(prev => [
            {
              id: `weather-${Date.now()}`,
              title: lang === 'ru' ? 'Сводка погоды' : 'Weather Summary',
              message,
              read: false
            },
            ...prev
          ]);
        }
      } catch (err) {
        // Silent catch
      }
    };
    
    // Slight delay so it doesn't overlap with welcome toast if any
    const timer = setTimeout(fetchWeatherForNotification, 2500);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [lang, userLocation]);


  // --- Idle Timer (5 minutes) ---
  useEffect(() => {
    let idleTimeout: NodeJS.Timeout;
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimeout);
      // 5 minutes = 300,000 ms
      idleTimeout = setTimeout(() => {
        if (!isStandbyOpen) {
          setIsStandbyOpen(true);
        }
      }, 300000);
    };

    // Initialize
    resetIdleTimer();

    // Event listeners
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetIdleTimer();
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      clearTimeout(idleTimeout);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isStandbyOpen]);

  // --- Real-time clock update loops ---
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const dD = String(d.getDate()).padStart(2, '0');
      const mM = String(d.getMonth() + 1).padStart(2, '0');

      setNowTime(`${hh}:${mm}`);
      setNowDate(`${dD}.${mM}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- State Synced Persisters ---
  const handleLangChange = (newLang: Language) => {
    playChime('click');
    setLang(newLang);
    localStorage.setItem('linkerru_lang', newLang);
  };

  const handleThemeToggle = () => {
    playChime('click');
    const nextTheme = theme === 'light' ? 'dark' : 'theme';
    const final = theme === 'light' ? 'dark' : 'light';
    setTheme(final);
    localStorage.setItem('linkerru_theme', final);
  };

  useEffect(() => {
    localStorage.setItem('linkerru_palette', activePalette.primary);
  }, [activePalette]);

  const handlePaletteChange = (paletteId: string) => {
    playChime('click');
    setActivePaletteId(paletteId);
    localStorage.setItem('linkerru_accent', paletteId);
  };

  const handleContrastToggle = () => {
    playChime('click');
    const next = !isContrast;
    setIsContrast(next);
    localStorage.setItem('linkerru_contrast', String(next));
  };

  const handleStandbyBgSave = (bg: string) => {
    playChime('click');
    setStandbyBg(bg);
    localStorage.setItem('linkerru_standby_bg', bg);
  };

  const handleFontChange = (font: string) => {
    playChime('click');
    setFontFamily(font);
    localStorage.setItem('linkerru_font', font);
  };

  const handleToastToggle = () => {
    playChime('click');
    const next = !isToastEnabled;
    setIsToastEnabled(next);
    localStorage.setItem('linkerru_toast', String(next));
  };

  const handleSoundToggle = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    localStorage.setItem('linkerru_sound', String(next));
    // Immediately play chime on enable to verify
    if (next) {
      setTimeout(() => playChime('click'), 100);
    }
  };

  const handleServerSelection = (srv: string) => {
    playChime('click');
    setSelectedServer(srv);
    localStorage.setItem('linkerru_server', srv);
    triggerToast(`${t.selected_label}: ${srv}`);
  };

  // --- Reset All Settings (Destroy Session) ---
  const handleDestroySession = () => {
    if (window.confirm(t.confirm_destroy)) {
      localStorage.clear();
      setLang('ru');
      setTheme('light');
      setActivePaletteId('sage_khaki');
      setIsContrast(false);
      setIsToastEnabled(true);
      setIsSoundEnabled(true);
      
      setPanicKey('');
      setPanicUrl('https://google.com');
      setSelectedServer('Server 1');
      setPomodoroRunning(false);
      setPomodoroTime(1500);
      setGameVictory(false);
      setGameCards(baseEmojis.map((emoji, idx) => ({ id: idx, emoji, flipped: false, matched: false })));
      setSelectedCards([]);

      playChime('reset');
      setTimeout(() => {
        triggerToast('сессия очищена / session destroyed');
      }, 200);
    }
  };

  // --- Copy Utility ---
  const handleCopyLink = (text: string) => {
    playChime('click');
    navigator.clipboard.writeText(text).catch(() => {});
    triggerToast(t.copied_toast);
    
    // Add to notifications center
    setNotifications(prev => {
      const newNotif = {
        id: `copy-${Date.now()}`,
        title: lang === 'ru' ? 'Ссылка скопирована' : 'Link Copied',
        message: t.copied_toast,
        read: false
      };
      return [newNotif, ...prev];
    });
  };

  // --- Pomodoro Ticker Effect ---
  useEffect(() => {
    if (pomodoroRunning) {
      pomodoroIntervalRef.current = setInterval(() => {
        setPomodoroTime((prev) => {
          if (prev <= 1) {
            setPomodoroRunning(false);
            if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
            playChime('victory');
            const msg = lang === 'ru' ? 'Время вышло! Отдохните.' : "Time is up! Take a break.";
            triggerToast(msg);
            setNotifications(p => [{
              id: `pomodoro-${Date.now()}`,
              title: lang === 'ru' ? 'Таймер Фокуса' : 'Focus Timer',
              message: msg,
              read: false
            }, ...p]);
            return 1500;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
    }
    return () => {
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
    };
  }, [pomodoroRunning]);

  // --- Panic Key Global Listener ---
  useEffect(() => {
    if (!panicKey || !panicUrl || isFullSettingsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let key = e.key;
      if (key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') return;
      
      const modifiers = [];
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.metaKey) modifiers.push('Meta');
      
      const combo = [...modifiers, key === ' ' ? 'Space' : key].join('+');
      
      if (combo === panicKey || e.key === panicKey) {
        window.location.replace(panicUrl);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panicKey, panicUrl, isFullSettingsOpen]);

  // --- Cross-window communication ---
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data === 'openNotifications') {
        setIsNotificationsOpen(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handlePomodoroAction = () => {
    playChime('click');
    setPomodoroRunning(!pomodoroRunning);
  };

  const formatPomodoroTime = () => {
    const mins = String(Math.floor(pomodoroTime / 60)).padStart(2, '0');
    const secs = String(pomodoroTime % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // --- Match Emojis Card Game logic ---
  const handleCardClick = (id: number) => {
    if (gameVictory) return;
    playChime('click');

    // Ignore if card already flipped/matched or 2 cards already open
    const card = gameCards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched || selectedCards.length >= 2) return;

    const newFlipped = gameCards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setGameCards(newFlipped);

    const nextSelected = [...selectedCards, id];
    setSelectedCards(nextSelected);

    // Check match if 2 open
    if (nextSelected.length === 2) {
      const [firstId, secondId] = nextSelected;
      const card1 = gameCards.find((c) => c.id === firstId);
      const card2 = gameCards.find((c) => c.id === secondId);

      if (card1 && card2 && card1.emoji === card2.emoji) {
        // Matched!
        setTimeout(() => {
          setGameCards((prev) =>
            prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, matched: true } : c))
          );
          setSelectedCards([]);
          // Check win
          const totalMatched = newFlipped.filter((c) => c.matched || c.id === firstId || c.id === secondId).length;
          if (totalMatched === baseEmojis.length) {
            setGameVictory(true);
            playChime('victory');
            triggerToast(lang === 'ru' ? 'Победа!' : 'You Won!');
          }
        }, 500);
      } else {
        // Unmatched flip back
        setTimeout(() => {
          setGameCards((prev) =>
            prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c))
          );
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const handleResetGame = () => {
    playChime('click');
    setGameVictory(false);
    setSelectedCards([]);
    // Shuffle cards
    const shuffled = [...baseEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({ id: idx, emoji, flipped: false, matched: false }));
    setGameCards(shuffled);
  };

  const getWallpaperStyle = () => {
    if (mainWallpaper === 'none') return 'var(--bg)';
    
    // We will use standard Hex/RGB colors of the current palette
    const p1 = activePalette.primary;
    const p2 = activePalette.secondary;
    const p3 = activePalette.tertiary;

    switch (mainWallpaper) {
      case 'gradient-1': return `linear-gradient(135deg, ${p1}, ${p2}, ${p3})`;
      case 'gradient-2': return `radial-gradient(circle at 10% 20%, ${p2} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3} 0%, transparent 50%), linear-gradient(135deg, ${p1}, var(--bg))`;
      case 'gradient-3': return `linear-gradient(to bottom right, ${p1} 0%, transparent 100%), linear-gradient(to top right, ${p3} 0%, transparent 100%), var(--bg)`;
      case 'gradient-4': return `conic-gradient(from 180deg at 50% 50%, ${p1} 0deg, ${p2} 120deg, ${p3} 240deg, ${p1} 360deg)`;
      default: return 'var(--bg)';
    }
  };

  return (
    <div
      className="min-h-screen text-[var(--on-surface)] p-5 transition-colors duration-300 md:p-8 flex flex-col justify-between font-sans selection:bg-[var(--accent)] selection:text-white"
      style={{ background: getWallpaperStyle() }}
      id="root-launcher-app"
    >
      <div className="fixed top-6 right-6 z-[100] pointer-events-auto flex flex-col items-end">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <motion.div
              layout
              key={toast.id}
              initial={{ x: 50, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ x: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ x: 50, opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="px-5 py-3.5 rounded-[1.75rem] flex items-center gap-4 relative overflow-hidden group mb-2"
              style={{
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)' 
                  : 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)',
                boxShadow: theme === 'dark' 
                  ? '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
                  : '0 20px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
                color: theme === 'dark' ? '#fff' : '#111'
              }}
            >
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                onAnimationComplete={() => setToasts(p => p.filter(t => t.id !== toast.id))}
                className="absolute bottom-0 left-0 h-1 opacity-50"
                style={{ backgroundColor: activePalette.primary }}
              />
              <div 
                className="w-10 h-10 rounded-[1rem] flex items-center justify-center shrink-0 relative z-10"
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.9)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)'
                }}
              >
                <Bell size={18} style={{ color: activePalette.primary }} />
              </div>
              <div className="flex flex-col pr-8 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-0.5">LinkerRu</span>
                <span className="text-[13px] font-bold leading-tight">{toast.text}</span>
              </div>
              <button 
                 onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} 
                 className="absolute top-1/2 -translate-y-1/2 right-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer p-1 z-10"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>


      {/* --- TOP HEADER NAVIGATION BAR --- */}
      <header className="flex justify-between items-center max-w-7xl mx-auto w-full mb-8 flex-wrap gap-4" id="app-topbar">
        <div className="flex gap-2.5 flex-wrap items-center">
          {/* Weather Pill */}
          <button
            onClick={() => {
              playChime('click');
              setIsWeatherOpen(true);
            }}
            className="flex items-center gap-2 bg-[var(--surface)] h-11 px-4 rounded-full text-xs font-bold text-[var(--on-surface-var)] transition-all hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] border border-[var(--outline-var)] shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
            id="topbar-weather-pill"
          >
            <CloudSun size={16} className="text-[var(--on-surface-var)]" />
            <span>21°C</span>
          </button>

          {/* Calendar Pill */}
          <button
            onClick={() => {
              playChime('click');
              setIsCalendarOpen(true);
            }}
            className="flex items-center gap-2 bg-[var(--surface)] h-11 px-4 rounded-full text-xs font-bold text-[var(--on-surface-var)] transition-all hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] border border-[var(--outline-var)] shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
            id="topbar-calendar-pill"
          >
            <CalendarIcon size={16} className="text-[var(--on-surface-var)]" />
            <span>{nowDate}</span>
          </button>

          {/* Battery Pill */}
          {batteryLvl !== null && (
            <div
              className="flex items-center gap-2 bg-[var(--surface)] h-11 px-4 rounded-full text-xs font-bold text-[var(--on-surface-var)] transition-all hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] border border-[var(--outline-var)] shadow-sm cursor-default"
              title={isCharging ? (lang === 'ru' ? 'Заряжается' : 'Charging') : (lang === 'ru' ? 'От батареи' : 'On battery')}
            >
              {isCharging ? <BatteryCharging size={16} className="text-green-500" /> : <Battery size={16} style={{ color: activePalette.primary }} />}
              <span className="tabular-nums font-extrabold">{Math.round(batteryLvl * 100)}%</span>
            </div>
          )}

          {/* Clock Pill */}
          <button
            onClick={() => {
              playChime('click');
              setIsClockOpen(true);
            }}
            className="flex items-center gap-2 bg-[var(--surface)] h-11 px-4 rounded-full text-xs font-bold text-[var(--on-surface-var)] transition-all hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] border border-[var(--outline-var)] shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
            id="topbar-clock-pill"
          >
            <Clock size={16} className="text-[var(--on-surface-var)]" />
            <span className="tabular-nums font-extrabold">{nowTime}</span>
          </button>
        </div>

        {/* Settings and Profile triggers */}
        <div className="flex gap-2.5 items-center">
          <button
            onClick={() => {
              playChime('click');
              setIsQuickSettingsOpen(true);
            }}
            className="flex items-center gap-2.5 bg-[var(--surface)] h-11 border border-[var(--outline-var)] pl-1.5 pr-4.5 rounded-full shadow-sm cursor-pointer transition-all hover:bg-[var(--surface-dim)] group hover:scale-[1.02] active:scale-95"
            id="topbar-settings-pill"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--container)] border border-[var(--outline-var)] flex items-center justify-center transition-all group-hover:bg-[var(--container-high)]">
              <Settings size={15} className="text-[var(--on-surface-var)]" />
            </div>
            <span className="text-xs font-black text-[var(--on-surface)] capitalize select-none">
              {t.settings_label}
            </span>
          </button>

          <button
            onClick={() => {
              playChime('click');
              setIsNotificationsOpen(true);
            }}
            className="w-11 h-11 relative rounded-full bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface-var)] transition-all hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] hover:scale-[1.02] active:scale-95 cursor-pointer"
            id="topbar-notifications"
          >
            <Bell size={18} />
            {notifications.filter(n => !n.read).length > 0 && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full border border-[var(--surface)]" style={{ backgroundColor: activePalette.primary }} />
            )}
          </button>
          <button
            onClick={() => {
              playChime('click');
              setIsFullSettingsOpen(true);
            }}
            className="w-11 h-11 rounded-full bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface-var)] transition-all hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] hover:scale-[1.02] active:scale-95 cursor-pointer"
            id="topbar-avatar"
            title={t.page_appearance}
          >
            <User size={18} />
          </button>
        </div>
      </header>

      {/* --- BRANDING HEADER AREA --- */}
      <section className="max-w-7xl mx-auto w-full mb-8 text-left" id="branding-heading">
        <span
          className="inline-flex items-center px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest bg-[var(--surface)] text-[var(--accent-tertiary)] border border-[var(--outline-var)] rounded-xl mb-4 select-none"
          id="branding-tag"
        >
          LinkerRu × Lisyan
        </span>
        <div className="mb-4 h-12 md:h-16 flex items-center gap-4" id="branding-title">
          <img 
            src={theme === 'dark' 
              ? "https://github.com/user-attachments/assets/9fad2245-28d1-4b70-a3ee-74e3d8a757e6" 
              : "https://github.com/user-attachments/assets/4d4a877a-6135-4dc5-82fc-d3705c8fc142"
            } 
            alt="LinkerRu Logo"
            className={`h-12 w-12 md:h-16 md:w-16 rounded-full object-cover transition-opacity border-2 border-[var(--outline-var)] shadow-sm ${theme === "dark" ? "bg-black" : "bg-white"}`}
            referrerPolicy="no-referrer"
          />
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--on-surface)]">
            LinkerRu:Re
          </h1>
        </div>
        <button
          onClick={() => {
            playChime('click');
            setIsChangelogOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--outline-var)] px-4 py-2.5 rounded-full text-xs font-black text-[var(--on-surface-var)] shadow-sm hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          id="version-pill"
        >
          <History size={14} />
          <span>v1/262608</span>
        </button>
      </section>

      {/* --- ROW 1: BENTO LAYOUT MAIN WIDGETS --- */}
      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="row1-bento-grid">
        {/* WIDGET 1: Proxy Server Hub selector */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[240px] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-default group relative" id="card-proxy-space">
          <div className="absolute top-6 right-6 flex items-center gap-2 text-[var(--accent)] hover:text-[var(--on-surface)] transition-colors cursor-pointer" title="Proxy Status: Online">
            <Lightbulb size={20} />
          </div>
          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl bg-[var(--accent)] border border-[var(--outline)] flex items-center justify-center shadow-inner">
              <Globe size={20} className="text-white" />
            </div>
          </div>
          <div className="flex-1 mt-5 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Space Proxy Hub</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {t.multi_server_desc}
            </p>
          </div>
          <div className="mt-4 flex items-end">
            <button
              onClick={() => {
                playChime('click');
                setIsServerOpen(true);
              }}
              className="w-full py-3 rounded-full text-xs font-extrabold text-[var(--surface)] transition-all hover:scale-[1.02] shadow-md hover:shadow-lg active:scale-95 cursor-pointer text-center"
              style={{ backgroundColor: activePalette.primary }}
              id="proxy-card-action-btn"
            >
              {t.select_server_label}
            </button>
          </div>
        </div>

        {/* WIDGET 2: Agno GPT */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[240px] transition-all hover:scale-[1.02] active:scale-[0.98] relative" id="card-agno-gpt">
          <div className="absolute top-6 right-6 flex items-center gap-2 text-[var(--accent)] hover:text-[var(--on-surface)] transition-colors cursor-pointer" title="Status: Online">
            <Lightbulb size={20} />
          </div>
          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl bg-[var(--accent)] border border-[var(--outline)] overflow-hidden flex items-center justify-center shadow-inner">
              <Bot size={20} className="text-white" />
            </div>
          </div>
          <div className="flex-1 mt-5 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Agno GPT</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {lang === 'ru' ? 'Персональный ИИ-ассистент на базе OpenAI' : 'Personal AI assistant powered by OPENAI'}
            </p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs font-bold text-[var(--on-surface-var)] mr-2">{lang === 'ru' ? 'Отрыть в:' : 'Open:'}</span>
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => {
                  playChime('click');
                  setIsAgnoOpen(true);
                }}
                className="flex-1 py-3 bg-[var(--container)] hover:bg-[var(--container-high)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-full text-[10px] font-black cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-95 px-1"
              >
                Linker.Ru
              </button>
              <button
                onClick={() => {
                  playChime('click');
                  const win = window.open('about:blank', '_blank');
                  if (win) {
                    win.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Agno GPT</title>
                        <style>
                          body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #09090b; display: flex; align-items: center; justify-content: center; color: white; font-family: sans-serif; }
                          .loader { border: 4px solid rgba(255,255,255,0.1); border-left-color: #fff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
                          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        </style>
                      </head>
                      <body>
                        <div id="bell" style="position:fixed; top:20px; right:20px; z-index:9999; background:rgba(255,255,255,0.1); padding:10px; border-radius:50%; cursor:pointer; border: 1px solid rgba(255,255,255,0.2); transition: all 0.2s;">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                        </div>
                        <div id="loader" class="loader"></div>
                        <iframe id="frame" src="https://agno-agent-ui.vercel.app/" style="width: 100vw; height: 100vh; border: none; display: none;"></iframe>
                        <script>
                          document.getElementById('bell').addEventListener('click', () => {
                            if (window.opener) {
                              window.opener.postMessage('openNotifications', '*');
                            }
                          });
                          document.getElementById('bell').addEventListener('mouseover', function() { this.style.background = 'rgba(255,255,255,0.2)' });
                          document.getElementById('bell').addEventListener('mouseout', function() { this.style.background = 'rgba(255,255,255,0.1)' });
                          setTimeout(() => {
                            document.getElementById('loader').style.display = 'none';
                            document.getElementById('frame').style.display = 'block';
                          }, 3000);
                        </script>
                      </body>
                      </html>
                    `);
                  }
                }}
                className="flex-1 py-3 bg-[var(--container)] hover:bg-[var(--container-high)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-full text-[10px] font-black cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-95 px-1"
              >
                about:blank
              </button>
            </div>
          </div>
        </div>

        {/* WIDGET 3: LinkerGAMES */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[240px] opacity-75 cursor-default relative" id="card-linkergames">
          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline)] flex items-center justify-center shadow-inner">
              <Gamepad2 size={20} className="text-[var(--on-surface)]" />
            </div>
            <div className="bg-[var(--surface)] border border-[var(--outline-var)] px-2.5 py-1 rounded-full text-[9px] font-bold text-[var(--on-surface-var)] uppercase tracking-wider">
              {lang === 'ru' ? 'В разработке' : 'Coming Soon'}
            </div>
          </div>
          <div className="flex-1 mt-5 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">LinkerGAMES</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {lang === 'ru' ? 'Игры и развлечения в будущих обновлениях.' : 'Games and entertainment in future updates.'}
            </p>
          </div>
          <div className="mt-4 flex items-end">
            <button
              disabled
              className="w-full py-3 rounded-full text-xs font-extrabold text-[var(--on-surface-var)] transition-all bg-[var(--surface-dim)] border border-[var(--outline-var)] cursor-not-allowed text-center"
              id="linkergames-action-btn"
            >
              {lang === 'ru' ? 'Ожидайте' : 'Coming Soon'}
            </button>
          </div>
        </div>

        {/* WIDGET 4: Lisyan Connect */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[240px] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative" id="card-lisyan-connect" onClick={() => { playChime('click'); setIsLisyanConnectOpen(true); }}>
          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl border border-[var(--outline)] overflow-hidden flex items-center justify-center shadow-inner" style={{ backgroundColor: activePalette.primary }}>
              <img src="https://github.com/user-attachments/assets/939c90aa-0efa-4e50-b886-007111d41fa3" alt="Lisyan Connect" className="w-full h-full object-cover p-1" />
            </div>
            <div className="bg-[var(--surface)] border border-[var(--outline-var)] px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ color: activePalette.primary }}>
              P2P
            </div>
          </div>
          <div className="flex-1 mt-5 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Lisyan Connect</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {lang === 'ru' ? 'Веб-сервис для быстрой, безопасной и анонимной P2P-передачи файлов.' : 'Web service for fast, secure and anonymous P2P file transfer.'}
            </p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2 flex-1">
              <button
                onClick={(e) => { e.stopPropagation(); playChime('click'); setIsLisyanConnectOpen(true); }}
                className="flex-1 py-3 rounded-full text-[10px] font-extrabold text-white transition-all text-center hover:opacity-90 active:scale-95"
                style={{ backgroundColor: activePalette.primary }}
              >
                {lang === 'ru' ? 'Открыть' : 'Open'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* --- ROW 2: EXTRA CARDS AND ACCENT PILLS BUTTONS --- */}
      <section className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4" id="row2-bento-grid">
        {/* LOCKED CARD 2 (was 6, now 5) */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px] opacity-75 transition-all hover:scale-[1.02] active:scale-[0.98]" id="card-locked-2">
          <div className="flex justify-between items-start">
            <div className="w-11 h-11 rounded-2xl bg-[var(--accent)] border border-[var(--outline)] flex items-center justify-center">
              <Lock size={20} className="text-white" />
            </div>
          </div>
          <div className="my-3">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">/{t.ph_soon}/</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold mt-1">
              /{t.ph_locked}/
            </p>
          </div>
          <button className="w-full py-3 bg-[var(--container)] text-[var(--on-surface-var)] border border-[var(--outline-var)] rounded-full text-xs font-black cursor-not-allowed select-none">
            /{t.ph_locked}/
          </button>
        </div>

        {/* WIDGET 5: App Launcher (was 5, now 6) */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col min-h-[240px] transition-all relative overflow-hidden" id="card-app-launcher">
          <div className="absolute top-6 right-6 flex items-center gap-2 text-[var(--accent)] hover:text-[var(--on-surface)] transition-colors cursor-pointer" title="Quick Apps">
            <Gamepad2 size={20} className="opacity-0" /> {/* Spacer */}
          </div>
          
          <div className="grid grid-cols-4 gap-3 my-auto pt-4" id="app-grid">
            {/* Weather App Shortcut */}
            <div className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => {
              playChime('click');
              setIsWeatherAppOpen(true);
            }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-white/10" style={{ backgroundColor: activePalette.primary }}>
                <CloudSun size={24} className="text-white" />
              </div>
              <span className="text-[9px] font-bold text-[var(--on-surface)]">Weather</span>
            </div>
            
            {/* Settings App Shortcut */}
            <div className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => {
              playChime('click');
              setIsFullSettingsOpen(true);
            }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-white/10 bg-[var(--surface-dim)]">
                <Settings size={24} className="text-[var(--on-surface)]" />
              </div>
              <span className="text-[9px] font-bold text-[var(--on-surface)]">Settings</span>
            </div>

            {/* Blank Placeholder Apps to match design */}
            <div className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => { playChime('click'); setIsLisyanConnectOpen(true); }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-white/10 overflow-hidden" style={{ backgroundColor: activePalette.primary }}>
                <img src="https://github.com/user-attachments/assets/939c90aa-0efa-4e50-b886-007111d41fa3" alt="Lisyan Connect" className="w-full h-full object-cover p-1" />
              </div>
              <span className="text-[9px] font-bold text-[var(--on-surface)]">Connect</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div>
            </div>
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div>
            </div>
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div>
            </div>
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div>
            </div>
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--outline)] text-center mt-auto pt-4">
            Quick Apps
          </span>
        </div>

        {/* PANEL: Link list with real working COPY buttons */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px] relative group" id="panel-links">
          <button 
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--surface)] rounded-full border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] text-[var(--on-surface)] shadow-sm z-10"
            title="Edit Links"
            onClick={() => {
              playChime('click');
              setIsFullSettingsOpen(true);
              // We need a way to open specific tab, but for now we'll dispatch an event
              setTimeout(() => window.dispatchEvent(new CustomEvent('open_settings_tab', { detail: 'links' })), 100);
            }}
          >
            <Edit2 size={14} />
          </button>
          <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider mb-4">
            <Link2 size={16} />
            <span>{t.ph_links}</span>
          </div>

          <div className="space-y-2.5 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
            {customLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playChime('click');
                    window.open(link.url, '_blank');
                  }}
                  className="flex-1 inline-flex items-center gap-2 px-4.5 py-3 rounded-full border border-[var(--outline)] text-xs font-bold text-[var(--on-surface)] hover:text-[var(--surface)] hover:border-transparent transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = activePalette.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Globe size={14} />
                  <span className="truncate max-w-[120px] text-left">{link.name}</span>
                </button>
                <button
                  onClick={() => handleCopyLink(link.url)}
                  className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-2xl border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-all cursor-pointer shadow-sm hover:scale-[1.05] active:scale-95"
                  title="Copy Link"
                >
                  <Copy size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="text-[9px] font-black tracking-widest text-[var(--outline)] uppercase text-center mt-4">
            {t.ph_community}
          </div>
        </div>

        {/* PANEL: Sound effects toggles and mode selectors */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px] relative group" id="panel-quicktoggles">
          <button 
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--surface)] rounded-full border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] text-[var(--on-surface)] shadow-sm z-10"
            title="Edit Toggles"
            onClick={() => {
              playChime('click');
              setIsFullSettingsOpen(true);
              setTimeout(() => window.dispatchEvent(new CustomEvent('open_settings_tab', { detail: 'toggles' })), 100);
            }}
          >
            <Edit2 size={14} />
          </button>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider">
              <span>{t.ph_toggles}</span>
            </div>
            <div className="text-[9px] font-black tracking-widest text-[var(--outline)] uppercase">
              quick toggles
            </div>
          </div>
          
          {/* Quick Toggles Grid (3x2) */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            {activeToggles.includes('theme') && (
              <button onClick={handleThemeToggle} className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 group">
                <div className="p-2 rounded-full transition-colors flex items-center justify-center" style={{ backgroundColor: theme === 'dark' ? activePalette.primary : 'var(--surface-dim)', color: theme === 'dark' ? 'white' : 'var(--on-surface)' }}>
                  {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">Theme</span>
                </div>
              </button>
            )}
            
            {activeToggles.includes('language') && (
              <button onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 group">
                <div className="p-2 rounded-full transition-colors flex items-center justify-center" style={{ backgroundColor: lang === 'ru' ? activePalette.primary : 'var(--surface-dim)', color: lang === 'ru' ? 'white' : 'var(--on-surface)' }}>
                  <Languages size={14} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">{lang === 'ru' ? 'Русский' : 'English'}</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">Language</span>
                </div>
              </button>
            )}

            {activeToggles.includes('sound') && (
              <button onClick={handleSoundToggle} className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 group">
                <div className="p-2 rounded-full transition-colors flex items-center justify-center" style={{ backgroundColor: isSoundEnabled ? activePalette.primary : 'var(--surface-dim)', color: isSoundEnabled ? 'white' : 'var(--on-surface)' }}>
                  {isSoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Sounds</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">{isSoundEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </button>
            )}
            
            {activeToggles.includes('contrast') && (
              <button onClick={handleContrastToggle} className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 group">
                <div className="p-2 rounded-full transition-colors flex items-center justify-center" style={{ backgroundColor: isContrast ? activePalette.primary : 'var(--surface-dim)', color: isContrast ? 'white' : 'var(--on-surface)' }}>
                  <Monitor size={14} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Contrast</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">{isContrast ? 'High' : 'Normal'}</span>
                </div>
              </button>
            )}
            
            {activeToggles.includes('privacy') && (
              <button className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 group">
                <div className="p-2 rounded-full transition-colors flex items-center justify-center" style={{ backgroundColor: activePalette.primary, color: 'white' }}>
                  <Shield size={14} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Privacy</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">Protected</span>
                </div>
              </button>
            )}

            {activeToggles.includes('proxy') && (
              <button className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 opacity-50 cursor-not-allowed">
                <div className="p-2 rounded-full bg-[var(--surface-dim)] text-[var(--on-surface-var)] flex items-center justify-center">
                  <Globe size={14} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Proxy</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">Offline</span>
                </div>
              </button>
            )}

            {activeToggles.includes('terminal') && (
              <button className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 opacity-50 cursor-not-allowed">
                <div className="p-2 rounded-full bg-[var(--surface-dim)] text-[var(--on-surface-var)] flex items-center justify-center">
                  <Monitor size={14} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Terminal</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">Locked</span>
                </div>
              </button>
            )}

            {activeToggles.includes('dashboard') && (
              <button className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 opacity-50 cursor-not-allowed">
                <div className="p-2 rounded-full bg-[var(--surface-dim)] text-[var(--on-surface-var)] flex items-center justify-center">
                  <Newspaper size={14} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Dashboard</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">System</span>
                </div>
              </button>
            )}
            
            <button className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 opacity-50 cursor-not-allowed">
              <div className="p-2 rounded-full bg-[var(--surface-dim)] text-[var(--on-surface-var)] flex items-center justify-center">
                <span className="text-xs font-bold">+</span>
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Add</span>
                <span className="text-[8px] text-[var(--on-surface-var)]">Shortcut</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* --- ROW 3: DETAILED FOOTER PANEL GROUPS --- */}
      <section className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4" id="row3-footer-grid">
        {/* COLUMN 1: Profile Details with real destroy action */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px]" id="panel-profile">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider">
              <User size={16} />
              <span>LinkerID</span>
            </div>
            <div className="text-[9px] font-black tracking-widest text-[var(--outline)] uppercase">
              Profile
            </div>
          </div>
          
          <div className="flex items-center gap-4 my-auto">
            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--on-surface)] p-0.5 shadow-sm">
              <div className="h-full w-full rounded-full bg-[var(--surface)] flex items-center justify-center overflow-hidden">
                <User size={24} className="text-[var(--on-surface-var)]" />
              </div>
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-black text-[var(--on-surface)] leading-tight">Guest User</span>
              <span className="text-[10px] text-[var(--on-surface-var)] font-semibold mt-0.5">guest@linker.os</span>
            </div>
            <button onClick={handleDestroySession} className="h-10 w-10 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface-var)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-sm" title={lang === 'ru' ? 'Выйти' : 'Log out'}>
              <LogOut size={16} />
            </button>
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            <button className="w-full py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--surface-dim)] transition-colors shadow-sm">
              {lang === 'ru' ? 'Управление аккаунтом' : 'Manage Account'}
            </button>
            <p className="text-[9px] text-[var(--on-surface-var)] text-center select-none font-semibold">
              {t.ph_danger_hint}
            </p>
          </div>
        </div>

        {/* COLUMN 2: News bullet notes */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px]" id="panel-news">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider mb-4">
            <Newspaper size={16} />
            <span>{t.ph_news}</span>
          </div>

          <p className="text-sm font-semibold text-[var(--on-surface)] leading-relaxed flex-1 overflow-y-auto pr-1 scrollbar-thin">
            {t.ph_news_text}
          </p>

          <div className="text-[10px] text-[var(--outline)] font-black uppercase mt-4 text-center">
            build stable · {lang === 'ru' ? 'актуально' : 'up to date'}
          </div>
        </div>

        {/* COLUMN 3: Support channels & contacts */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px]" id="panel-support">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider mb-3">
            <User size={16} />
            <span>{t.ph_support}</span>
          </div>

          <div className="flex gap-4 items-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface-var)] shadow-sm overflow-hidden">
              {activeSupportQr ? (
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(activeSupportQr)}&color=${theme==='dark'?'ffffff':'000000'}&bgcolor=${theme==='dark'?'1a1a1a':'f2f2f2'}`} alt="QR" className="w-full h-full object-cover" />
              ) : (
                <QrCode size={24} />
              )}
            </div>
            <div>
              <div className="text-xs font-black text-[var(--on-surface)]">
                {activeSupportQr === 'https://t.me/pubertatnyj' ? '@pubertatnyj' : activeSupportQr === 'mailto:lisyandews@gmail.com' ? 'lisyandews@gmail.com' : `/${t.ph_developer}/`}
              </div>
              <div className="text-[10px] text-[var(--on-surface-var)] font-semibold mt-0.5 leading-tight">
                {activeSupportQr ? (lang === 'ru' ? 'Отсканируйте код' : 'Scan the code') : 'Lisyan Dews Technologies'}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div
              onClick={() => {
                playChime('click');
                setActiveSupportQr('https://t.me/pubertatnyj');
              }}
              className="flex items-center justify-between p-3 bg-[var(--container)] hover:bg-[var(--container-high)] border border-[var(--outline-var)] rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            >
              <div className="flex items-center gap-3">
                <Send size={14} className="text-[var(--on-surface-var)]" />
                <div className="text-xs font-bold text-[var(--on-surface)]">
                  {t.ph_messenger} <span className="text-[10px] text-[var(--on-surface-var)] font-semibold">@pubertatnyj</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-[var(--outline)]" />
            </div>

            <div
              onClick={() => {
                playChime('click');
                setActiveSupportQr('mailto:lisyandews@gmail.com');
              }}
              className="flex items-center justify-between p-3 bg-[var(--container)] hover:bg-[var(--container-high)] border border-[var(--outline-var)] rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            >
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-[var(--on-surface-var)]" />
                <div className="text-xs font-bold text-[var(--on-surface)]">
                  {t.ph_mail} <span className="text-[10px] text-[var(--on-surface-var)] font-semibold">lisyandews@gmail.com</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-[var(--outline)]" />
            </div>
          </div>
        </div>
      </section>

      {/* --- SOUTHSIDE BOTTOM DRAGGABLE HANDLE DECORATION --- */}
      <footer className="w-full flex justify-center mt-12" id="app-bottombar">
        <div className="w-24 h-1 bg-[var(--outline)] rounded-full opacity-50 select-none pointer-events-none" />
      </footer>

      {/* --- ALL REGISTERED APPLICATION OVERLAYS --- */}
      
      {/* Floating Agno GPT Window */}
      <AnimatePresence>
        {isAgnoOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed z-[60] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-[var(--outline)] transition-all duration-300 ${isAgnoFullscreen ? 'inset-0 md:inset-0 rounded-none border-none' : 'inset-4 md:inset-10'}`}
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <div className="h-12 border-b border-[var(--outline-var)] flex items-center justify-between px-4 shrink-0" style={{ backgroundColor: 'var(--surface-dim)' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md overflow-hidden bg-[var(--surface)] border border-[var(--outline-var)] p-0.5">
                  <img src={theme === 'dark' ? "https://github.com/user-attachments/assets/708555b4-14a6-4f32-9240-5ecd928ec9fd" : "https://github.com/user-attachments/assets/6805ef80-9512-4954-9035-1b53133f26c1"} alt="Logo" className={`w-full h-full object-contain ${theme === "dark" ? "bg-black" : "bg-white"}`} />
                </div>
                <span className="text-xs font-black text-[var(--on-surface)]">Agno GPT</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-2" title="Online" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAgnoFullscreen(!isAgnoFullscreen)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
                  title={isAgnoFullscreen ? "Minimize" : "Maximize"}
                >
                  {isAgnoFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                </button>
                <button
                  onClick={() => setIsAgnoOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <iframe src="https://agno-agent-ui.vercel.app/" className="flex-1 w-full h-full border-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Weather App Window */}
      <AnimatePresence>
        <LisyanConnectModal
          isOpen={isLisyanConnectOpen}
          onClose={() => setIsLisyanConnectOpen(false)}
          lang={lang}
          theme={theme}
          primaryColor={activePalette.primary}
          onCopy={() => triggerToast(t.copied_toast)}
        />
      {isWeatherAppOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed z-[60] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-[var(--outline)] transition-all duration-300 ${isWeatherAppFullscreen ? 'inset-0 md:inset-0 rounded-none border-none' : 'inset-4 md:inset-10'}`}
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <div className="h-12 border-b border-[var(--outline-var)] flex items-center justify-between px-4 shrink-0" style={{ backgroundColor: 'var(--surface-dim)' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md overflow-hidden border border-[var(--outline-var)] flex items-center justify-center" style={{ backgroundColor: activePalette.primary }}>
                  <CloudSun size={14} className="text-white" />
                </div>
                <span className="text-xs font-black text-[var(--on-surface)]">Weather App</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-2" title="Online" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWeatherAppFullscreen(!isWeatherAppFullscreen)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
                  title={isWeatherAppFullscreen ? "Minimize" : "Maximize"}
                >
                  {isWeatherAppFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                </button>
                <button
                  onClick={() => {
                    playChime('click');
                    setIsWeatherAppOpen(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <WeatherApp primaryColor={activePalette.primary} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Permission Prompt */}
      <AnimatePresence>
        {showLocationPrompt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLocationPrompt(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-6 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--container)] flex items-center justify-center mb-4 text-[var(--accent)] border border-[var(--outline-var)]">
                <MapPin size={24} />
              </div>
              <h3 className="text-lg font-black text-[var(--on-surface)] mb-2">
                {lang === 'ru' ? 'Разрешить доступ к геопозиции?' : 'Allow location access?'}
              </h3>
              <p className="text-xs text-[var(--on-surface-var)] mb-6">
                {lang === 'ru' ? 'Это необходимо для более точного отображения погоды в виджете.' : 'This is required to display more accurate weather information in the widget.'}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    localStorage.setItem('askedLocation', 'true');
                    setShowLocationPrompt(false);
                  }}
                  className="flex-1 py-3 rounded-xl border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface-var)] hover:bg-[var(--container)] transition-colors"
                >
                  {lang === 'ru' ? 'Позже' : 'Later'}
                </button>
                <button
                  onClick={handleRequestLocation}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-[var(--surface)] transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: activePalette.primary }}
                >
                  {lang === 'ru' ? 'Разрешить' : 'Allow'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ClockModal
        isOpen={isClockOpen}
        onClose={() => {
          playChime('click');
          setIsClockOpen(false);
        }}
        lang={lang}
        activePalette={activePalette}
        onOpenStandbySetup={() => setIsStandbySetupOpen(true)}
        clockType={clockType}
        setClockType={setClockType}
        clockVariation={clockVariation}
        setClockVariation={setClockVariation}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => {
          playChime('click');
          setIsCalendarOpen(false);
        }}
        lang={lang}
        primaryColor={activePalette.primary}
      />

      <WeatherModal
        isOpen={isWeatherOpen}
        onClose={() => {
          playChime('click');
          setIsWeatherOpen(false);
        }}
        lang={lang}
        primaryColor={activePalette.primary}
        onOpenInLinkerRu={() => {
          playChime('click');
          setIsWeatherAppOpen(true);
        }}
      />

      <SettingsModal
        isOpen={isQuickSettingsOpen}
        onClose={() => {
          playChime('click');
          setIsQuickSettingsOpen(false);
        }}
        lang={lang}
        onLangChange={handleLangChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onOpenFullSettings={() => setIsFullSettingsOpen(true)}
        primaryColor={activePalette.primary}
        brightness={brightness}
        onBrightnessChange={(v) => {
          setBrightness(v);
          localStorage.setItem('linkerru_brightness', String(v));
        }}
        volume={soundVolume}
        onVolumeChange={(v) => {
          setSoundVolume(v);
          localStorage.setItem('linkerru_sound_volume', String(v));
        }}
      />

      <FullSettingsModal
        isOpen={isFullSettingsOpen}
        onClose={() => {
          playChime('click');
          setIsFullSettingsOpen(false);
        }}
        lang={lang}
        onLangChange={handleLangChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        activePaletteId={activePaletteId}
        onPaletteChange={handlePaletteChange}
        isContrast={isContrast}
        onContrastToggle={handleContrastToggle}
        isToastEnabled={isToastEnabled}
        onToastToggle={handleToastToggle}
        isSoundEnabled={isSoundEnabled}
        onSoundToggle={handleSoundToggle}
        clickSound={clickSound}
        notifySound={notifySound}
        panicKey={panicKey}
        onPanicKeyChange={(key) => {
          setPanicKey(key);
          localStorage.setItem('linkerru_panic_key', key);
        }}
        panicUrl={panicUrl}
        onPanicUrlChange={(url) => {
          setPanicUrl(url);
          localStorage.setItem('linkerru_panic_url', url);
        }}
        standbyBg={standbyBg}
        onStandbyBgChange={handleStandbyBgSave}
        fontFamily={fontFamily}
        onFontChange={handleFontChange}
        mainWallpaper={mainWallpaper}
        onMainWallpaperChange={(w) => {
          setMainWallpaper(w);
          localStorage.setItem('linkerru_wallpaper', w);
        }}
        brightness={brightness}
        onBrightnessChange={setBrightness}
        onClickSoundChange={(s) => {
          setClickSound(s);
          localStorage.setItem('linkerru_click_sound', s);
          const url = CLICK_SOUNDS.find(x => x.id === s)?.url;
          if (url && isSoundEnabled && soundVolume > 0) {
            const audio = new Audio(url);
            audio.volume = soundVolume / 100;
            audio.play().catch(e => console.log(e));
          }
        }}
        onNotifySoundChange={(s) => {
          setNotifySound(s);
          localStorage.setItem('linkerru_notify_sound', s);
          const url = NOTIFICATION_SOUNDS.find(x => x.id === s)?.url;
          if (url && isSoundEnabled && soundVolume > 0) {
            const audio = new Audio(url);
            audio.volume = soundVolume / 100;
            audio.play().catch(e => console.log(e));
            if (s === 'iphone') {
              setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
              }, 2000);
            }
          }
        }}
        volume={soundVolume}
        onVolumeChange={setSoundVolume}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => {
          playChime('click');
          setIsNotificationsOpen(false);
        }}
        lang={lang}
        notifications={notifications}
        onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
        onClearAll={() => setNotifications([])}
      />

      <ServerModal
        isOpen={isServerOpen}
        onClose={() => {
          playChime('click');
          setIsServerOpen(false);
        }}
        lang={lang}
        selectedServer={selectedServer}
        onSelectServer={handleServerSelection}
        primaryColor={activePalette.primary}
      />

      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => {
          playChime('click');
          setIsChangelogOpen(false);
        }}
        lang={lang}
      />

      <StandbySetupModal
        isOpen={isStandbySetupOpen}
        onClose={() => {
          playChime('click');
          setIsStandbySetupOpen(false);
        }}
        lang={lang}
        activePalette={activePalette}
        background={standbyBg}
        setBackground={handleStandbyBgSave}
        onLaunch={() => {
          playChime('click');
          setIsStandbySetupOpen(false);
          setIsStandbyOpen(true);
          try {
            document.documentElement.requestFullscreen();
          } catch (e) {
            console.error('Fullscreen request failed', e);
          }
        }}
      />

      
      
      <StandbyClock
        isOpen={isStandbyOpen}
        onClose={() => {
          playChime('click');
          setIsStandbyOpen(false);
          try {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            }
          } catch (e) {}
        }}
        lang={lang}
        activePalette={activePalette}
        background={standbyBg}
        onOpenSetup={() => {
          playChime('click');
          setIsStandbyOpen(false);
          setIsStandbySetupOpen(true);
          try {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            }
          } catch (e) {}
        }}
        clockType={clockType}
        clockVariation={clockVariation}
      />
      <div 
        className="pointer-events-none fixed inset-0 z-[9999]" 
        style={{ 
          backgroundColor: `rgba(0, 0, 0, ${1 - brightness / 100})`,
          transition: 'background-color 0.3s' 
        }} 
      />
    </div>
  );
}

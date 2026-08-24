import { ExtensionsManager } from './components/ExtensionsManager';
import { SubConvertApp } from './components/SubConvertApp';
import { LisyanConnectModal } from './components/LisyanConnectModal';
import { CLICK_SOUNDS, NOTIFICATION_SOUNDS } from './data/sounds';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { userAuth, userDb } from './lib/userFirebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  Sun,
  Moon, SunMoon,
  Clock,
  Calendar as CalendarIcon,
  CloudSun,
  Settings,
  Blocks,
  User,
  History,
  Globe,
  Gamepad2,
  Lock,
  Link2,
  Copy,
  Newspaper,
  QrCode,
  ChevronRight,
  Volume2,
  VolumeX,
  Send,
  Mail,
  X,
  Maximize,
  Minimize,
  Bell,
  Bot,
  Battery,
  BatteryCharging,
  MapPin,
  Monitor,
  LogOut,
  Languages,
  Edit2,
  Calculator,
  StickyNote,
  Sparkles,
  Server,
  ExternalLink,
  HelpCircle, MessageCircle,
  Subtitles,
  LayoutGrid,
} from 'lucide-react';

import { Language, ThemeMode, QuickLink, MAX_QUICK_LINKS, DEFAULT_QUICK_LINKS, ToggleId, TOGGLE_IDS, MAX_TOGGLES, Material3Palette } from './types';
import { materialPalettes } from './data/themes';
import { translations } from './data/translations';
import { getGreeting } from './data/greetings';

// Components
import ClockModal from './components/ClockModal';
import CalendarModal from './components/CalendarModal';
import WeatherModal from './components/WeatherModal';
import NexusGameBox from './components/NexusGameBox';
import SettingsModal from './components/SettingsModal';
import FullSettingsModal from './components/FullSettingsModal';
import { WeatherLocationErrorModal } from './components/WeatherLocationErrorModal';
import { AppNotifPromptModal } from './components/AppNotifPromptModal';
import { LoginScreen } from './components/LoginScreen';
import AppLoader from './components/AppLoader';
import { useWindows, WindowManagerLayer } from './components/WindowManager';
import { CalculatorApp } from './components/CalculatorApp';
import { KeepsApp } from './components/KeepsApp';
import ChangelogModal from './components/ChangelogModal';
import StandbyClock from './components/StandbyClock';
import StandbySetupModal from './components/StandbySetupModal';
import NotificationsModal from './components/NotificationsModal';
import OnboardingModal from './components/OnboardingModal';
import { SupportQRModal, CONTACTS } from './components/SupportApp';
import { LinkerRouteApp } from './components/LinkerRouteApp';
import ServerModal from './components/ServerModal';
import { AccountManagerModal } from './components/AccountManagerModal';
import { SpaceProxyCard } from './components/SpaceProxyCard';

export default function App() {
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; read: boolean }[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // OS-style window manager for popup apps (Agno, Settings, Lisyan, Weather, Calculator)
  const wm = useWindows();

  // --- Persistent States (localStorage) ---
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem('linkerru_lang') as Language;
    if (stored) return stored;
    return (navigator.language || navigator.languages?.[0] || 'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  });

  const [standbyBg, setStandbyBg] = useState<string>(() => {
    return localStorage.getItem('linkerru_standby_bg') || 'gradient-1';
  });

  const [mainWallpaper, setMainWallpaper] = useState<string>(() => {
    return localStorage.getItem('linkerru_wallpaper') || 'none';
  });

  const [dynamicPalette, setDynamicPalette] = useState<Material3Palette | null>(null);
  const [wallpaperLuminance, setWallpaperLuminance] = useState<number | null>(null);
  const [wallpaperHeaderAvgHex, setWallpaperHeaderAvgHex] = useState<string | null>(null);
  const [wallpaperTitleColor, setWallpaperTitleColor] = useState<string | null>(null);
  const [wallpaperApplyNonce, setWallpaperApplyNonce] = useState<number>(0);

  const [fontFamily, setFontFamily] = useState<string>(() => {
    return localStorage.getItem('linkerru_font') || '"Space Grotesk", "Inter", sans-serif';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('linkerru_theme') as ThemeMode) || 'light';
  });

  const [activePaletteId, setActivePaletteId] = useState<string>(() => {
    return localStorage.getItem('linkerru_accent') || 'monochrome';
  });

  const [isNightLight, setIsNightLight] = useState<boolean>(() => {
    return localStorage.getItem('linkerru_night_light') === 'true';
  });


  const [isContrast, setIsContrast] = useState<boolean>(() => {
    return localStorage.getItem('linkerru_contrast') === 'true';
  });

  const [isOptimizedEngine, setIsOptimizedEngine] = useState<boolean>(() => {
    return localStorage.getItem('linkerru_optimized_engine') === 'true';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('linkerru_auth') === 'true';
  });
  
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('linkerru_nickname') || 'Guest';
  });

  // ── Animated greeting: shows "LinkerRu:Re" on load, then transitions
  //    to a time-based greeting (e.g. "Good morning, Guest!") with animation.
  //    The transition is triggered AFTER the AppLoader finishes (via
  //    onLoaderComplete) so the greeting animation doesn't play under the
  //    loading overlay.
  const [greetingPhase, setGreetingPhase] = useState<'brand' | 'greeting'>('brand');
  const [greetingText, setGreetingText] = useState('');

  const onLoaderComplete = useCallback(() => {
    setGreetingText(getGreeting(nickname, lang));
    setGreetingPhase('greeting');
  }, [nickname, lang]);

  // Update greeting if language or nickname changes while greeting is shown
  useEffect(() => {
    if (greetingPhase === 'greeting') {
      setGreetingText(getGreeting(nickname, lang));
    }
  }, [lang, nickname, greetingPhase]);

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

  const [tabletChoice, setTabletChoice] = useState<'desktop' | 'mobile' | null>(() => {
    return localStorage.getItem('linkerru_tablet_choice') as 'desktop' | 'mobile' | null;
  });
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    return isMobile || (isTablet && tabletChoice === 'mobile');
  });
  const [showTabletPrompt, setShowTabletPrompt] = useState(() => {
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    return isTablet && !tabletChoice;
  });

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobileLayout(isMobile || (isTablet && tabletChoice === 'mobile'));
      if (isTablet && !tabletChoice) {
        setShowTabletPrompt(true);
      } else {
        setShowTabletPrompt(false);
      }
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [tabletChoice]);

  const [isAgnoOpen, setIsAgnoOpen] = useState(false);
  const [isAgnoFullscreen, setIsAgnoFullscreen] = useState(false);

  const [customLinks, setCustomLinks] = useState<QuickLink[]>(() => {
    const s = localStorage.getItem('linkerru_links');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_QUICK_LINKS);
      } catch {}
    }
    return DEFAULT_QUICK_LINKS;
  });

  const handleLinksChange = useCallback((newLinks: QuickLink[]) => {
    const clamped = newLinks.slice(0, MAX_QUICK_LINKS);
    setCustomLinks(clamped);
    localStorage.setItem('linkerru_links', JSON.stringify(clamped));
  }, []);

  const [activeToggles, setActiveToggles] = useState<ToggleId[]>(() => {
    const s = localStorage.getItem('linkerru_toggles');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: string) => (TOGGLE_IDS as readonly string[]).includes(t)).slice(0, MAX_TOGGLES) as ToggleId[];
        }
      } catch {}
    }
    return [...TOGGLE_IDS];
  });

  const handleTogglesChange = useCallback((next: ToggleId[]) => {
    const valid = next.filter((t) => (TOGGLE_IDS as readonly string[]).includes(t)).slice(0, MAX_TOGGLES) as ToggleId[];
    setActiveToggles(valid);
    localStorage.setItem('linkerru_toggles', JSON.stringify(valid));
  }, []);

  const [activeSupportQr, setActiveSupportQr] = useState<string | null>(null);

  useEffect(() => {
    const handleLinksChanged = () => {
      const s = localStorage.getItem('linkerru_links');
      if (s) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) setCustomLinks(parsed.slice(0, MAX_QUICK_LINKS));
        } catch {}
      }
    };
    const handleTogglesChanged = () => {
      const s = localStorage.getItem('linkerru_toggles');
      if (s) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) {
            setActiveToggles(parsed.filter((t: string) => (TOGGLE_IDS as readonly string[]).includes(t)).slice(0, MAX_TOGGLES) as ToggleId[]);
          }
        } catch {}
      }
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
  const [settingsInitialTab, setSettingsInitialTab] = useState<'appearance' | 'language' | 'notifications' | 'sound' | 'about' | 'security' | 'toggles' | 'developer' | 'account'>('appearance');
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [proxyInitialUrl, setProxyInitialUrl] = useState<string | undefined>(undefined);
  // Login screen preview overlay (dev tool — does NOT log out)
  const [isLoginPreviewOpen, setIsLoginPreviewOpen] = useState(false);
  const [isStandbyOpen, setIsStandbyOpen] = useState(false);
  const [isStandbySetupOpen, setIsStandbySetupOpen] = useState(false);
  const [clockType, setClockType] = useState<'digital' | 'analog'>(() => {
    return (localStorage.getItem('linkerru_clock_type') as 'digital' | 'analog') || 'digital';
  });
  const [clockVariation, setClockVariation] = useState<1 | 2 | 3>(() => {
    return (Number(localStorage.getItem('linkerru_clock_variation')) as 1 | 2 | 3) || 1;
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(() => {
    return (localStorage.getItem('linkerru_time_format') as '12h' | '24h') || '24h';
  });
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>(() => {
    return (localStorage.getItem('linkerru_temp_unit') as 'C' | 'F') || 'C';
  });

  // Home screen version (hotswappable). Migrated from the old boolean flag.

  // --- Real-time time chips ---
  const [nowTime, setNowTime] = useState('--:--');
  const [nowDate, setNowDate] = useState('--.--');

  const [batteryLvl, setBatteryLvl] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: string, lon: string} | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [topbarTemp, setTopbarTemp] = useState<number | null>(null);

  // Weather widget states & persistence
  const [isWeatherDisabled, setIsWeatherDisabled] = useState<boolean>(() => {
    return localStorage.getItem('linkerru_weather_disabled') === 'true';
  });
  const [weatherLocationMode, setWeatherLocationMode] = useState<'auto' | 'custom'>(() => {
    return (localStorage.getItem('linkerru_weather_location_mode') as 'auto' | 'custom') || 'auto';
  });
  const [weatherCustomCity, setWeatherCustomCity] = useState<string>(() => {
    return localStorage.getItem('linkerru_weather_custom_city') || '';
  });
  const [weatherError, setWeatherError] = useState<boolean>(false);
  const [isWeatherOptionsOpen, setIsWeatherOptionsOpen] = useState<boolean>(false);

  // App notification permissions state & prompt modal
  const [appNotifPermissions, setAppNotifPermissions] = useState<Record<string, 'allowed' | 'denied'>>(() => {
    try {
      const saved = localStorage.getItem('linkerru_app_notifications');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [pendingNotifPromptApp, setPendingNotifPromptApp] = useState<{ id: string; name: string } | null>(null);

  const handleAppNotifPermissionToggle = (appId: string, allowed: boolean) => {
    setAppNotifPermissions((prev) => {
      const updated = { ...prev, [appId]: allowed ? ('allowed' as const) : ('denied' as const) };
      localStorage.setItem('linkerru_app_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const checkAndPromptAppNotifPermission = (appId: string, appName: string) => {
    if (appNotifPermissions[appId] === undefined) {
      setPendingNotifPromptApp({ id: appId, name: appName });
    }
  };

  const handleEnableGeolocation = () => {
    setWeatherLocationMode('auto');
    localStorage.setItem('linkerru_weather_location_mode', 'auto');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m`);
            const data = await res.json();
            if (data && data.current && data.current.temperature_2m !== undefined) {
              setTopbarTemp(Math.round(data.current.temperature_2m));
              setWeatherError(false);
            } else {
              setWeatherError(true);
            }
          } catch (e) {
            setWeatherError(true);
          }
        },
        () => setWeatherError(true)
      );
    } else {
      setWeatherError(true);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('preload-no-transition');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const syncUnit = () => {
      const saved = (localStorage.getItem('linkerru_temp_unit') as 'C' | 'F') || 'C';
      setTempUnit(saved);
    };
    window.addEventListener('linkerru_temp_unit_changed', syncUnit);

    const fetchTopWeatherByCity = async (cityName: string) => {
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`);
        const geoData = await geoRes.json();
        if (geoData && geoData.results && geoData.results.length > 0) {
          const { latitude, longitude, name } = geoData.results[0];
          setWeatherCustomCity(name);
          localStorage.setItem('linkerru_weather_custom_city', name);
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
          const data = await res.json();
          if (data && data.current && data.current.temperature_2m !== undefined) {
            setTopbarTemp(Math.round(data.current.temperature_2m));
            setWeatherError(false);
          } else {
            setWeatherError(true);
          }
        } else {
          setWeatherError(true);
        }
      } catch (err) {
        console.warn('Failed custom city weather fetch:', err);
        setWeatherError(true);
      }
    };

    const fetchTopWeather = async (lat: string, lon: string) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`);
        const data = await res.json();
        if (data && data.current && data.current.temperature_2m !== undefined) {
          setTopbarTemp(Math.round(data.current.temperature_2m));
          setWeatherError(false);
        } else {
          setWeatherError(true);
        }
      } catch (err) {
        console.warn('Failed to fetch topbar weather', err);
        setWeatherError(true);
      }
    };

    const loadWeather = () => {
      if (weatherLocationMode === 'custom' && weatherCustomCity) {
        fetchTopWeatherByCity(weatherCustomCity);
        return;
      }
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchTopWeather(pos.coords.latitude.toString(), pos.coords.longitude.toString()),
          () => fetchTopWeatherByCity(weatherCustomCity || 'Москва')
        );
      } else {
        fetchTopWeatherByCity(weatherCustomCity || 'Москва');
      }
    };

    loadWeather();
    const interval = setInterval(loadWeather, 600000); // 10 minutes refresh

    return () => {
      window.removeEventListener('linkerru_temp_unit_changed', syncUnit);
      clearInterval(interval);
    };
  }, [isWeatherDisabled, weatherLocationMode, weatherCustomCity]);

  // --- Toast Manager State ---
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(1500);
  const pomodoroIntervalRef = useRef<any>(null);

  const [gameVictory, setGameVictory] = useState(false);
  const [gameCards, setGameCards] = useState<{id: number, emoji: string, matched: boolean, flipped: boolean}[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  
  const baseEmojis = ['🌞', '🪐', '🚀', '🛸', '⭐', '☄️'];

  const t = translations[lang];

  // --- Firebase User Settings Sync Engine ---
  const isSyncingFromCloud = useRef(false);

  const saveUserDataToFirebase = async (uid?: string, email?: string, nickNameOverride?: string) => {
    const currentUid = uid || userAuth.currentUser?.uid;
    if (!currentUid || isSyncingFromCloud.current) return;
    
    try {
      const userDocRef = doc(userDb, 'users', currentUid);
      
      const payload: any = {
        uid: currentUid,
        nickname: nickNameOverride || nickname,
        email: email || userAuth.currentUser?.email || '',
        settings: {
          lang,
          standby_bg: standbyBg,
          wallpaper: mainWallpaper,
          font: fontFamily,
          theme,
          accent: activePaletteId,
          contrast: isContrast,
          toast: isToastEnabled,
          sound: isSoundEnabled,
          sound_volume: soundVolume,
          brightness,
          click_sound: clickSound,
          notify_sound: notifySound,
          panic_key: panicKey,
          panic_url: panicUrl,
          server: selectedServer,
          tablet_choice: tabletChoice,
          clock_type: clockType,
          clock_variation: clockVariation,
          links: customLinks,
          toggles: activeToggles,
          optimized_engine: isOptimizedEngine,
          installed_extensions: (() => {
            try {
              const saved = localStorage.getItem('linkerru_installed_extensions');
              return saved ? JSON.parse(saved) : ['wallpaper-plus'];
            } catch {
              return ['wallpaper-plus'];
            }
          })()
        },
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, payload, { merge: true });
    } catch (err) {
      console.error("Error saving user settings to Firebase:", err);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(userAuth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        localStorage.setItem('linkerru_auth', 'true');
        
        try {
          // Fetch user data from Firestore
          const userDocRef = doc(userDb, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.nickname) {
              setNickname(data.nickname);
              localStorage.setItem('linkerru_nickname', data.nickname);
            }
            
            if (data.settings) {
              isSyncingFromCloud.current = true;
              const s = data.settings;
              
              if (s.lang) { setLang(s.lang); localStorage.setItem('linkerru_lang', s.lang); }
              if (s.standby_bg) { setStandbyBg(s.standby_bg); localStorage.setItem('linkerru_standby_bg', s.standby_bg); }
              if (s.wallpaper) { setMainWallpaper(s.wallpaper); localStorage.setItem('linkerru_wallpaper', s.wallpaper); }
              if (s.font) { setFontFamily(s.font); localStorage.setItem('linkerru_font', s.font); }
              if (s.theme) { setTheme(s.theme); localStorage.setItem('linkerru_theme', s.theme); }
              if (s.accent) { setActivePaletteId(s.accent); localStorage.setItem('linkerru_accent', s.accent); }
              if (s.contrast !== undefined) { setIsContrast(s.contrast); localStorage.setItem('linkerru_contrast', String(s.contrast)); }
              if (s.toast !== undefined) { setIsToastEnabled(s.toast); localStorage.setItem('linkerru_toast', String(s.toast)); }
              if (s.sound !== undefined) { setIsSoundEnabled(s.sound); localStorage.setItem('linkerru_sound', String(s.sound)); }
              if (s.sound_volume !== undefined) { setSoundVolume(s.sound_volume); localStorage.setItem('linkerru_sound_volume', String(s.sound_volume)); }
              if (s.brightness !== undefined) { setBrightness(s.brightness); localStorage.setItem('linkerru_brightness', String(s.brightness)); }
              if (s.click_sound) { setClickSound(s.click_sound); localStorage.setItem('linkerru_click_sound', s.click_sound); }
              if (s.notify_sound) { setNotifySound(s.notify_sound); localStorage.setItem('linkerru_notify_sound', s.notify_sound); }
              if (s.panic_key !== undefined) { setPanicKey(s.panic_key); localStorage.setItem('linkerru_panic_key', s.panic_key); }
              if (s.panic_url) { setPanicUrl(s.panic_url); localStorage.setItem('linkerru_panic_url', s.panic_url); }
              if (s.server) { setSelectedServer(s.server); localStorage.setItem('linkerru_server', s.server); }
              if (s.tablet_choice !== undefined) { setTabletChoice(s.tablet_choice); if(s.tablet_choice) localStorage.setItem('linkerru_tablet_choice', s.tablet_choice); else localStorage.removeItem('linkerru_tablet_choice'); }
              if (s.clock_type) { setClockType(s.clock_type); localStorage.setItem('linkerru_clock_type', s.clock_type); }
              if (s.clock_variation) { setClockVariation(s.clock_variation); localStorage.setItem('linkerru_clock_variation', String(s.clock_variation)); }
              if (s.links) {
                const parsedLinks = typeof s.links === 'string' ? JSON.parse(s.links) : s.links;
                if (Array.isArray(parsedLinks)) {
                  const clamped = parsedLinks.slice(0, MAX_QUICK_LINKS);
                  setCustomLinks(clamped);
                  localStorage.setItem('linkerru_links', JSON.stringify(clamped));
                }
              }
              if (s.toggles) {
                const parsedToggles = typeof s.toggles === 'string' ? JSON.parse(s.toggles) : s.toggles;
                if (Array.isArray(parsedToggles)) {
                   const valid = parsedToggles.filter((t: string) => (TOGGLE_IDS as readonly string[]).includes(t)).slice(0, MAX_TOGGLES) as ToggleId[];
                   setActiveToggles(valid);
                   localStorage.setItem('linkerru_toggles', JSON.stringify(valid));
                }
              }
              if (s.optimized_engine !== undefined) {
                const opt = s.optimized_engine === true || s.optimized_engine === 'true';
                setIsOptimizedEngine(opt);
                localStorage.setItem('linkerru_optimized_engine', String(opt));
              }
              if (s.installed_extensions) {
                try {
                  const exts = typeof s.installed_extensions === 'string' ? JSON.parse(s.installed_extensions) : s.installed_extensions;
                  if (Array.isArray(exts)) {
                    localStorage.setItem('linkerru_installed_extensions', JSON.stringify(exts));
                  }
                } catch { /* ignore */ }
              }
              
              isSyncingFromCloud.current = false;
            } else {
              // No settings in cloud, push local ones
              saveUserDataToFirebase(user.uid, user.email || '', data.nickname || nickname);
            }
          } else {
            // New user, create user record & save current local settings
            await setDoc(userDocRef, {
              uid: user.uid,
              nickname: nickname || 'Guest',
              email: user.email || '',
              updatedAt: serverTimestamp()
            });
            saveUserDataToFirebase(user.uid, user.email || '', nickname || 'Guest');
          }
        } catch (err) {
          console.error("Error loading user profile from Firebase:", err);
        }
      } else {
        setIsAuthenticated(false);
        localStorage.setItem('linkerru_auth', 'false');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isSyncingFromCloud.current) {
      const timeoutId = setTimeout(() => {
        saveUserDataToFirebase();
      }, 1000); // Debounce saves by 1 second so we don't spam writes
      return () => clearTimeout(timeoutId);
    }
  }, [
    isAuthenticated,
    lang,
    standbyBg,
    mainWallpaper,
    fontFamily,
    theme,
    activePaletteId,
    isContrast,
    isToastEnabled,
    isSoundEnabled,
    soundVolume,
    brightness,
    clickSound,
    notifySound,
    panicKey,
    panicUrl,
    selectedServer,
    tabletChoice,
    clockType,
    clockVariation,
    customLinks,
    activeToggles,
    nickname,
    isOptimizedEngine
  ]);

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
    if (activePaletteId === 'dynamic_wallpaper' && dynamicPalette) {
      return dynamicPalette;
    }
    const custom = localStorage.getItem('linkerru_custom_palette');
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        if (!materialPalettes.find(p => p.id === parsed.id)) {
          materialPalettes.push(parsed);
        }
      } catch (e) {}
    }
    return materialPalettes.find((p) => p.id === activePaletteId) || materialPalettes.find((p) => p.id === 'monochrome') || materialPalettes[0];
  }, [activePaletteId, dynamicPalette, wallpaperApplyNonce]);

  type ToastMessage = { id: string, text: string };
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const lastChimeRef = useRef(0);

  // --- Sound Engine (Chimes) ---
  const lastClickRef = useRef(0);
  const lastToastRef = useRef(0);
  const playChime = (type: 'click' | 'alert' | 'reset' | 'victory' | 'toast' = 'click') => {
    if (!isSoundEnabled || soundVolume === 0 || isMobileLayout) return;
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
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (fileId === 'iphone') {
            setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
            }, 2000);
          }
        }).catch(e => console.log('Audio play error:', e));
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

interface WallpaperAnalysis {
  dominantHex: string;
  headerAvgHex: string;
  headerLuminance: number;
  overallLuminance: number;
  titleSuggestedColor: string;
}

const getRelativeLuminance = (hex: string): number => {
  try {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16) || 0;
    const g = parseInt(clean.slice(2, 4), 16) || 0;
    const b = parseInt(clean.slice(4, 6), 16) || 0;
    const sRGB = [r / 255, g / 255, b / 255].map((val) =>
      val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  } catch {
    return 0.5;
  }
};

const getContrastRatio = (hex1: string, hex2: string): number => {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

const extractWallpaperAnalysis = (imageUrl: string): Promise<WallpaperAnalysis> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return reject('No canvas ctx');
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);
        
        const fullData = ctx.getImageData(0, 0, 64, 64).data;
        const headerData = ctx.getImageData(0, 0, 64, 20).data;

        // Sample top header area
        let hr = 0, hg = 0, hb = 0;
        const headerPixels = headerData.length / 4;
        for (let i = 0; i < headerData.length; i += 4) {
          hr += headerData[i];
          hg += headerData[i + 1];
          hb += headerData[i + 2];
        }
        hr = Math.floor(hr / headerPixels);
        hg = Math.floor(hg / headerPixels);
        hb = Math.floor(hb / headerPixels);
        const headerAvgHex = `#${((1 << 24) + (hr << 16) + (hg << 8) + hb).toString(16).slice(1)}`;
        const headerLuminance = (hr * 299 + hg * 587 + hb * 114) / 1000;

        // Sample precise area directly behind the main greeting title (y: 10%..28%, x: 4%..85%)
        let titleR = 0, titleG = 0, titleB = 0;
        let darkPixelCount = 0;
        let totalTitlePixels = 0;
        for (let y = 6; y <= 18; y++) {
          for (let x = 2; x <= 54; x++) {
            const idx = (y * 64 + x) * 4;
            const pr = fullData[idx];
            const pg = fullData[idx + 1];
            const pb = fullData[idx + 2];
            titleR += pr;
            titleG += pg;
            titleB += pb;
            const lum = (pr * 299 + pg * 587 + pb * 114) / 1000;
            if (lum < 135) {
              darkPixelCount++;
            }
            totalTitlePixels++;
          }
        }
        const titleLuminance = totalTitlePixels > 0 ? (titleR * 299 + titleG * 587 + titleB * 114) / (totalTitlePixels * 1000) : 128;
        const darkFraction = totalTitlePixels > 0 ? darkPixelCount / totalTitlePixels : 0;
        // If the title spans across dark elements or a dark background, title will be pure white; otherwise pure black
        const titleSuggestedColor = (darkFraction > 0.18 || titleLuminance < 135) ? '#ffffff' : '#09090b';

        // Sample dominant accent color
        let r = 0, g = 0, b = 0, count = 0;
        let or = 0, og = 0, ob = 0;
        const totalPixels = fullData.length / 4;
        for (let i = 0; i < fullData.length; i += 4) {
          or += fullData[i];
          og += fullData[i + 1];
          ob += fullData[i + 2];
          const brightness = (fullData[i] * 299 + fullData[i + 1] * 587 + fullData[i + 2] * 114) / 1000;
          if (brightness > 30 && brightness < 225) {
            r += fullData[i];
            g += fullData[i + 1];
            b += fullData[i + 2];
            count++;
          }
        }
        if (count === 0) {
          r = or; g = og; b = ob;
          count = totalPixels;
        }
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        const dominantHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        const overallLuminance = (Math.floor(or / totalPixels) * 299 + Math.floor(og / totalPixels) * 587 + Math.floor(ob / totalPixels) * 114) / 1000;

        resolve({
          dominantHex,
          headerAvgHex,
          headerLuminance,
          overallLuminance,
          titleSuggestedColor,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject('Image load failed');
    img.src = imageUrl;
  });
};

  // --- Wallpaper Analysis & Dynamic Theme Synchronizer ---
  useEffect(() => {
    let isMounted = true;
    if (!mainWallpaper || mainWallpaper === 'none') {
      setWallpaperLuminance(theme === 'dark' ? 20 : 220);
      setWallpaperHeaderAvgHex(theme === 'dark' ? '#08080a' : '#fafafa');
      setWallpaperTitleColor(theme === 'dark' ? '#ffffff' : '#09090b');
      return;
    }

    if (typeof mainWallpaper === 'string' && (
      mainWallpaper.startsWith('http://') ||
      mainWallpaper.startsWith('https://') ||
      mainWallpaper.startsWith('data:') ||
      mainWallpaper.startsWith('blob:') ||
      mainWallpaper.startsWith('url(')
    )) {
      const cleanUrl = mainWallpaper.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      extractWallpaperAnalysis(cleanUrl).then((analysis) => {
        if (!isMounted) return;
        setWallpaperLuminance(analysis.headerLuminance);
        setWallpaperHeaderAvgHex(analysis.headerAvgHex);
        setWallpaperTitleColor(analysis.titleSuggestedColor);

        const adjust = (color: string, amount: number) => {
          return '#' + color.replace(/^#/, '').replace(/../g, c => ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
        };

        const dynPalette: Material3Palette = {
          id: 'dynamic_wallpaper',
          nameRu: 'Адаптивная (Обои)',
          nameEn: 'Adaptive (Wallpaper)',
          primary: analysis.dominantHex,
          secondary: adjust(analysis.dominantHex, 25),
          tertiary: adjust(analysis.dominantHex, -25),
          lightBg: analysis.headerLuminance < 140 ? '#121212' : '#F5F5F5',
          darkBg: '#121212'
        };

        setDynamicPalette(dynPalette);

        const existingIdx = materialPalettes.findIndex(p => p.id === 'dynamic_wallpaper');
        if (existingIdx >= 0) {
          materialPalettes[existingIdx] = dynPalette;
        } else {
          materialPalettes.push(dynPalette);
        }

        const useDyn = localStorage.getItem('linkerru_dynamic_theme') !== 'false';
        if (useDyn) {
          setActivePaletteId('dynamic_wallpaper');
          localStorage.setItem('linkerru_accent', 'dynamic_wallpaper');
        }
      }).catch((err) => {
        console.warn('Failed to calculate wallpaper luminance:', err);
        if (isMounted) {
          setWallpaperLuminance(theme === 'dark' ? 30 : 200);
          setWallpaperHeaderAvgHex(theme === 'dark' ? '#121212' : '#f0f0f0');
          setWallpaperTitleColor(theme === 'dark' ? '#ffffff' : '#09090b');
        }
      });
    } else {
      setWallpaperLuminance(theme === 'dark' ? 30 : 200);
      setWallpaperHeaderAvgHex(theme === 'dark' ? '#121212' : '#f0f0f0');
      setWallpaperTitleColor(theme === 'dark' ? '#ffffff' : '#09090b');
    }

    return () => { isMounted = false; };
  }, [mainWallpaper, wallpaperApplyNonce, theme]);

  // --- Message Listener for Extension Events (e.g., Wallpaper+) ---
  useEffect(() => {
    const handleExtensionMessage = async (e: MessageEvent) => {
      if (e.data?.type === 'APPLY_WALLPAPER') {
        const url = e.data.payload;
        if (url) {
          setMainWallpaper(url);
          localStorage.setItem('linkerru_wallpaper', url);
          setWallpaperApplyNonce(prev => prev + 1);

          playChime('victory');
          triggerToast(lang === 'ru' ? 'Обои успешно применены!' : 'Wallpaper successfully applied!');
          saveUserDataToFirebase();
        }
      }
    };
    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, [lang]);

  // --- PIPUN CONFIGS / CROSS-APP THEME SYNC ---
  useEffect(() => {
    if (isMobileLayout) {
      if (theme !== 'light') {
        setTheme('light');
        localStorage.setItem('linkerru_theme', 'light');
      }
      if (activePaletteId !== 'monochrome') {
        setActivePaletteId('monochrome');
        localStorage.setItem('linkerru_accent', 'monochrome');
      }
    }
  }, [isMobileLayout, theme, activePaletteId]);

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
      // ── Section 1/4: BASE (deepest layer — page background, app canvas) ──
      root.style.setProperty('--bg', '#000000');
      root.style.setProperty('--surface-dim', '#060608');

      // ── Section 2/4: SURFACES (cards, panels, containers — layered elevation & glassy transparency) ──
      root.style.setProperty('--surface', '#0d0d10');
      root.style.setProperty('--surface-bright', '#141418');
      root.style.setProperty('--container', '#101014');
      root.style.setProperty('--container-high', '#18181f');
      root.style.setProperty('--card-bg', `color-mix(in srgb, color-mix(in srgb, #060608 85%, ${activePalette.primary} 15%) 65%, transparent)`);
      root.style.setProperty('--panel-bg', `color-mix(in srgb, color-mix(in srgb, #060608 90%, ${activePalette.primary} 10%) 60%, transparent)`);

      // ── Section 3/4: CONTENT & UNIFIED BUTTON TOKENS ──
      root.style.setProperty('--on-surface', '#ffffff');
      root.style.setProperty('--on-surface-var', '#a1a1aa');
      root.style.setProperty('--outline', '#222226');
      root.style.setProperty('--outline-var', '#2e2e36');
      root.style.setProperty('--icon-tint', `color-mix(in srgb, #0d0d10 60%, ${activePalette.primary} 40%)`);
      root.style.setProperty('--btn-bg', 'rgba(16, 16, 20, 0.85)');
      root.style.setProperty('--btn-hover', 'rgba(26, 26, 32, 0.95)');
      root.style.setProperty('--btn-border', 'rgba(255, 255, 255, 0.08)');

      // ── Section 4/4: ELEVATION (shadows — depth perception per M3 levels 1-3) ──
      root.style.setProperty('--shadow-1', '0 1px 2px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2)');
      root.style.setProperty('--shadow-2', '0 4px 12px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)');
      root.style.setProperty('--shadow-3', '0 10px 24px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.25)');
    } else {
      // ── Section 1/4: BASE ──
      root.style.setProperty('--bg', '#fafafa');
      root.style.setProperty('--surface-dim', '#f4f4f5');

      // ── Section 2/4: SURFACES ──
      root.style.setProperty('--surface', '#ffffff');
      root.style.setProperty('--surface-bright', '#ffffff');
      root.style.setProperty('--container', '#f4f4f5');
      root.style.setProperty('--container-high', '#e4e4e7');
      root.style.setProperty('--card-bg', `color-mix(in srgb, color-mix(in srgb, #ffffff 72%, ${activePalette.primary} 28%) 62%, transparent)`);
      root.style.setProperty('--panel-bg', `color-mix(in srgb, color-mix(in srgb, #ffffff 80%, ${activePalette.primary} 20%) 56%, transparent)`);

      // ── Section 3/4: CONTENT & UNIFIED BUTTON TOKENS ──
      root.style.setProperty('--on-surface', '#09090b');
      root.style.setProperty('--on-surface-var', '#52525b');
      root.style.setProperty('--outline', '#d4d4d8');
      root.style.setProperty('--outline-var', '#e4e4e7');
      root.style.setProperty('--icon-tint', `color-mix(in srgb, #ffffff 70%, ${activePalette.primary} 30%)`);
      root.style.setProperty('--btn-bg', 'rgba(244, 244, 245, 0.85)');
      root.style.setProperty('--btn-hover', 'rgba(228, 228, 231, 0.95)');
      root.style.setProperty('--btn-border', 'rgba(0, 0, 0, 0.08)');

      // ── Section 4/4: ELEVATION ──
      root.style.setProperty('--shadow-1', '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)');
      root.style.setProperty('--shadow-2', '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)');
      root.style.setProperty('--shadow-3', '0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.05)');
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

    // ── Section 5/5: ADAPTIVE ON-WALLPAPER CONTRAST ──
    const hasWallpaper = !!(mainWallpaper && mainWallpaper !== 'none');
    let titleColor = '#ffffff';

    if (hasWallpaper) {
      if (wallpaperTitleColor) {
        titleColor = wallpaperTitleColor;
      } else if (wallpaperLuminance !== null) {
        titleColor = wallpaperLuminance < 140 ? '#ffffff' : '#09090b';
      } else {
        titleColor = theme === 'dark' ? '#ffffff' : '#09090b';
      }
    } else {
      titleColor = theme === 'dark' ? '#ffffff' : '#09090b';
    }

    root.style.setProperty('--wallpaper-title-color', titleColor);
    root.style.setProperty('--on-wallpaper-surface', titleColor);

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.backgroundColor = isContrast 
      ? (theme === 'dark' ? '#000000' : '#ffffff') 
      : (theme === 'dark' ? '#09090b' : '#fafafa');
  }, [theme, activePalette, activePaletteId, isContrast, fontFamily, wallpaperLuminance, wallpaperHeaderAvgHex, mainWallpaper, wallpaperApplyNonce]);

  // --- Optimized Engine Effects ---
  useEffect(() => {
    if (isOptimizedEngine) {
      document.documentElement.classList.add('linkerru-optimized');
    } else {
      document.documentElement.classList.remove('linkerru-optimized');
    }
  }, [isOptimizedEngine]);

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

  // Dismiss standby mode whenever a window is opened
  useEffect(() => {
    const handleWinOpen = () => {
      setIsStandbyOpen(false);
    };
    window.addEventListener('linkerru_window_opened', handleWinOpen);
    return () => window.removeEventListener('linkerru_window_opened', handleWinOpen);
  }, []);

  // --- Idle Timer (5 minutes) ---
  useEffect(() => {
    let idleTimeout: NodeJS.Timeout;
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimeout);
      if (isMobileLayout) return; // Disable standby on mobile
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
  }, [isStandbyOpen, isMobileLayout]);

  // --- Real-time clock update loops ---
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const dD = String(d.getDate()).padStart(2, '0');
      const mM = String(d.getMonth() + 1).padStart(2, '0');

      if (timeFormat === '12h') {
        let hours = d.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const mm = String(d.getMinutes()).padStart(2, '0');
        setNowTime(`${hours}:${mm} ${ampm}`);
      } else {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        setNowTime(`${hh}:${mm}`);
      }
      setNowDate(`${dD}.${mM}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timeFormat]);

  const handleTimeFormatChange = (tf: '12h' | '24h') => {
    playChime('click');
    setTimeFormat(tf);
    localStorage.setItem('linkerru_time_format', tf);
    window.dispatchEvent(new Event('linkerru_time_format_changed'));
  };

  const handleTempUnitChange = (tu: 'C' | 'F') => {
    playChime('click');
    setTempUnit(tu);
    localStorage.setItem('linkerru_temp_unit', tu);
    window.dispatchEvent(new Event('linkerru_temp_unit_changed'));
  };

  // --- State Synced Persisters ---
  const handleLangChange = (newLang: Language) => {
    playChime('click');
    setLang(newLang);
    localStorage.setItem('linkerru_lang', newLang); window.dispatchEvent(new Event('linkerru_lang_changed'));
  };

  const handleThemeToggle = () => {
    playChime('click');
    const nextTheme = theme === 'light' ? 'dark' : 'theme';
    const final = theme === 'light' ? 'dark' : 'light';
    setTheme(final);
    localStorage.setItem('linkerru_theme', final);
  };

  const handleOpenSettings = (tab: 'appearance' | 'language' | 'notifications' | 'sound' | 'about' | 'security' | 'toggles' | 'developer' | 'account' = 'appearance') => {
    playChime('click');
    openSettingsWindow(tab);
  };

  // --- Window manager helpers (popup apps) ---
  // Check if a window app is minimized (running in background)
  const isMinimized = (id: string) => {
    const w = wm.windows.find((win) => win.id === id);
    return w ? w.isMinimized : false;
  };
  const agnoMinimized = isMinimized('agno');
  const lisyanMinimized = isMinimized('lisyan');
  const settingsMinimized = isMinimized('settings');
  const calculatorMinimized = isMinimized('calculator');
  const keepsMinimized = isMinimized('keeps');
  const extensionsMinimized = isMinimized('extensions');
  const proxyMinimized = isMinimized('proxy');

  const openAgnoWindow = () => {
    wm.open({
      id: 'agno',
      title: 'Agno GPT',
      icon: <Bot size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 900,
      initialHeight: 640,
      minWidth: 480,
      minHeight: 360,
      render: () => (
        <iframe
          src="https://agno-agent-ui.vercel.app/"
          className="h-full w-full border-none"
          title="Agno GPT"
        />
      ),
    });
  };

  const openSettingsWindow = (tab: 'appearance' | 'language' | 'notifications' | 'sound' | 'about' | 'security' | 'toggles' | 'developer' | 'account' = 'appearance') => {
    setSettingsInitialTab(tab);
    wm.open({
      id: 'settings',
      title: lang === 'ru' ? 'Настройки' : 'Settings',
      icon: <Settings size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 820,
      initialHeight: 620,
      minWidth: 420,
      minHeight: 360,
      render: () => (
        <div className="h-full w-full">
          <FullSettingsModal
            wm={wm}
            playChime={playChime}
            triggerToast={triggerToast}
            isOpen={true}
            embedded={true}
            onClose={() => wm.close('settings')}
            lang={lang}
            onLangChange={handleLangChange}
            theme={theme}
            onThemeToggle={handleThemeToggle}
            activePaletteId={activePaletteId}
            onPaletteChange={handlePaletteChange}
            isContrast={isContrast}
            onContrastToggle={handleContrastToggle}
            isToastEnabled={isToastEnabled}
            onToastToggle={() => { const n = !isToastEnabled; setIsToastEnabled(n); localStorage.setItem('linkerru_toast', String(n)); }}
            isSoundEnabled={isSoundEnabled}
            onSoundToggle={() => { const n = !isSoundEnabled; setIsSoundEnabled(n); localStorage.setItem('linkerru_sound', String(n)); }}
            clickSound={clickSound}
            onClickSoundChange={(s) => { setClickSound(s); localStorage.setItem('linkerru_click_sound', s); }}
            notifySound={notifySound}
            onNotifySoundChange={(s) => { setNotifySound(s); localStorage.setItem('linkerru_notify_sound', s); }}
            brightness={brightness}
            onBrightnessChange={(v) => { setBrightness(v); localStorage.setItem('linkerru_brightness', String(v)); }}
            volume={soundVolume}
            onVolumeChange={(v) => { setSoundVolume(v); localStorage.setItem('linkerru_sound_volume', String(v)); }}
            panicKey={panicKey}
            onPanicKeyChange={(k) => { setPanicKey(k); localStorage.setItem('linkerru_panic_key', k); }}
            panicUrl={panicUrl}
            onPanicUrlChange={(u) => { setPanicUrl(u); localStorage.setItem('linkerru_panic_url', u); }}
            isMobileLayout={isMobileLayout}
            standbyBg={standbyBg}
            onStandbyBgChange={(bg) => { setStandbyBg(bg); localStorage.setItem('linkerru_standby_bg', bg); }}
            fontFamily={fontFamily}
            onFontChange={(f) => { setFontFamily(f); localStorage.setItem('linkerru_font', f); }}
            mainWallpaper={mainWallpaper}
            onMainWallpaperChange={(wp) => { setMainWallpaper(wp); localStorage.setItem('linkerru_wallpaper', wp); setWallpaperApplyNonce(prev => prev + 1); }}
            isAuthenticated={isAuthenticated}
            nickname={nickname}
            onNicknameChange={(n) => { setNickname(n); localStorage.setItem('linkerru_nickname', n); }}
            activeToggles={activeToggles}
            onTogglesChange={handleTogglesChange}
            isOptimizedEngine={isOptimizedEngine}
            onOptimizedEngineToggle={() => {
              const n = !isOptimizedEngine;
              setIsOptimizedEngine(n);
              localStorage.setItem('linkerru_optimized_engine', String(n));
            }}
            initialTab={tab}
            timeFormat={timeFormat}
            onTimeFormatChange={handleTimeFormatChange}
            tempUnit={tempUnit}
            onTempUnitChange={handleTempUnitChange}
          />
        </div>
      ),
    });
  };

  const openAccountWindow = () => {
    playChime('click');
    wm.open({
      id: 'account',
      title: lang === 'ru' ? 'Менеджер аккаунта' : 'Account Manager',
      icon: <User size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 560,
      initialHeight: 600,
      minWidth: 360,
      minHeight: 380,
      render: () => (
        <AccountManagerModal
          lang={lang}
          nickname={nickname}
          onNicknameChange={(n) => {
            setNickname(n);
            localStorage.setItem('linkerru_nickname', n);
          }}
          isAuthenticated={isAuthenticated}
          onClose={() => wm.close('account')}
        />
      ),
    });
  };

  const openChangelogWindow = () => {
    wm.open({
      id: 'changelog',
      title: lang === 'ru' ? 'Журнал изменений' : 'Changelog',
      icon: <History size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      allowMaximize: false,
      initialWidth: 540,
      initialHeight: 580,
      minWidth: 360,
      minHeight: 380,
      render: () => <ChangelogModal lang={lang} embeddedInWindow={true} />,
    });
  };

  const handleOpenSubConvert = () => {
    playChime('click');
    wm.open({
      id: 'subconvert',
      title: 'SubConvert',
      icon: <Subtitles size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 860,
      initialHeight: 640,
      minWidth: 420,
      minHeight: 380,
      render: () => (
        <SubConvertApp
          lang={lang}
          theme={theme}
          activePalette={activePalette}
          playChime={playChime}
          triggerToast={triggerToast}
          openAgnoGPT={openAgnoWindow}
        />
      ),
    });
  };

  const handleOpenExtensions = () => {
    playChime('click');
    wm.open({
      id: 'extensions',
      title: lang === 'ru' ? 'Расширения' : 'Extensions',
      icon: <Blocks size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 700,
      initialHeight: 520,
      minWidth: 420,
      minHeight: 360,
      render: () => <ExtensionsManager lang={lang} wm={wm} playChime={playChime} triggerToast={triggerToast} />
    });
  };

  const openLisyanWindow = () => {
    checkAndPromptAppNotifPermission('lisyan', 'Lisyan Connect');
    wm.open({
      id: 'lisyan',
      title: 'Lisyan Connect',
      icon: (
        <div className="w-4 h-4 rounded flex items-center justify-center p-0.5 overflow-hidden">
          <img 
            src="https://github.com/user-attachments/assets/71a65dc6-fb8f-45fb-88a4-240d44cecee3" 
            alt="Lisyan Connect" 
            className="w-full h-full object-contain" 
          />
        </div>
      ),
      singleton: true,
      initialWidth: 880,
      initialHeight: 680,
      minWidth: 420,
      minHeight: 380,
      render: () => (
        <div className="wm-embedded h-full w-full">
          <LisyanConnectModal
            isOpen={true}
            onClose={() => wm.close('lisyan')}
            lang={lang}
            theme={theme}
            isMobileLayout={isMobileLayout}
          />
        </div>
      ),
    });
  };

  const [activeSupportContactId, setActiveSupportContactId] = useState<string | null>(null);

  const openCalculatorWindow = () => {
    checkAndPromptAppNotifPermission('calculator', 'Калькулятор');
    wm.open({
      id: 'calculator',
      title: lang === 'ru' ? 'Калькулятор' : 'Calculator',
      icon: <Calculator size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 380,
      initialHeight: 600,
      minWidth: 320,
      minHeight: 480,
      render: () => <CalculatorApp lang={lang} theme={theme} activePalette={activePalette} />,
    });
  };

  const openKeepsWindow = () => {
    checkAndPromptAppNotifPermission('keeps', 'Заметки');
    wm.open({
      id: 'keeps',
      title: lang === 'ru' ? 'Заметки' : 'Keeps',
      icon: <StickyNote size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 480,
      initialHeight: 620,
      minWidth: 340,
      minHeight: 420,
      render: () => <KeepsApp lang={lang} theme={theme} activePalette={activePalette} />,
    });
  };

  const openLinkerRoute = (url?: string) => {
    if (url) setProxyInitialUrl(url);
    const activeUrl = url || proxyInitialUrl;
    wm.open({
      id: 'proxy',
      title: 'Space Proxy Hub',
      icon: <Globe size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 900,
      initialHeight: 650,
      minWidth: 480,
      minHeight: 380,
      render: () => (
        <LinkerRouteApp
          initialUrl={activeUrl}
        />
      ),
    });
  };

  const openTelegramRouteWindow = () => {
    playChime('click');
    wm.open({
      id: 'telegramroute',
      title: 'Telegram Route',
      icon: <Send size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 960,
      initialHeight: 680,
      minWidth: 420,
      minHeight: 380,
      render: () => (
        <div className="flex h-full w-full flex-col bg-[var(--surface)] select-none overflow-hidden">
          <iframe
            src="https://marking-carriers-parenting-park.trycloudflare.com/"
            className="w-full h-full border-none bg-[var(--surface)]"
            title="Telegram Route Frame"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
            allow="fullscreen; autoplay; clipboard-read; clipboard-write"
          />
        </div>
      ),
    });
  };

  const openWeatherWindow = () => {
    if (isWeatherDisabled || weatherError) {
      setIsWeatherOptionsOpen(true);
      return;
    }
    wm.open({
      id: 'weather',
      title: lang === 'ru' ? 'Погода' : 'Weather',
      icon: <CloudSun size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 820,
      initialHeight: 600,
      minWidth: 420,
      minHeight: 400,
      render: () => (
        <WeatherModal
          isOpen={true}
          onClose={() => wm.close('weather')}
          lang={lang}
          primaryColor={activePalette.primary}
          embeddedInWindow={true}
        />
      ),
    });
  };

  const openNexusGameBox = () => {
    wm.open({
      id: 'nexusgamebox',
      title: 'Nexus Game Box',
      icon: (
        <div className={`w-4 h-4 rounded flex items-center justify-center p-0 ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}>
          <img 
            src="https://github.com/user-attachments/assets/98c31a64-a8ba-4c0e-a3de-c73f433e4863" 
            alt="Nexus Game Box" 
            className={`w-full h-full object-contain ${theme === 'dark' ? 'brightness-0' : 'brightness-0 invert'}`} 
          />
        </div>
      ),
      singleton: true,
      initialWidth: 1200,
      initialHeight: 800,
      minWidth: 480,
      minHeight: 400,
      render: () => (
        <NexusGameBox />
      ),
    });
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

  const handleNightLightToggle = () => {
    playChime('click');
    const next = !isNightLight;
    setIsNightLight(next);
    localStorage.setItem('linkerru_night_light', String(next));
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
      setIsAuthenticated(false);
      setNickname('Guest');

      signOut(userAuth).catch(console.error);

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
    if (!panicKey || !panicUrl || wm.windows.some(w => w.id === 'settings' && !w.isMinimized)) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let key = e.key;
      if (key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') return;
      
      const modifiers = [];
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.metaKey) modifiers.push('Meta');
      
      const keyFormatted = key === ' ' ? 'Space' : key.length === 1 ? key.toUpperCase() : key;
      const combo = [...modifiers, keyFormatted].join('+');
      
      const isMatch = combo.toLowerCase() === panicKey.toLowerCase() || 
                      key.toLowerCase() === panicKey.toLowerCase();

      if (isMatch) {
        const soundId = localStorage.getItem('linkerru_panic_sound');
        if (soundId) {
          const found = NOTIFICATION_SOUNDS.find(s => s.id === soundId);
          if (found) {
            const audio = new Audio(found.url);
            audio.volume = 0.8;
            audio.play().catch(() => {});
          }
        }
        window.location.replace(panicUrl);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panicKey, panicUrl, wm.windows]);

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
    if (isMobileLayout) return 'var(--bg)';
    
    // We will use standard Hex/RGB colors of the current palette
    const p1 = activePalette.primary;
    const p2 = activePalette.secondary;
    const p3 = activePalette.tertiary;

    if (theme === 'dark') {
      if (!mainWallpaper || mainWallpaper === 'none') {
        return `radial-gradient(ellipse at 50% -20%, color-mix(in srgb, ${p1} 22%, rgba(255, 255, 255, 0.12) 78%) 0%, transparent 65%), var(--bg)`;
      }

      switch (mainWallpaper) {
        case 'gradient-1':
          return `radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.14) 0%, transparent 60%), linear-gradient(135deg, color-mix(in srgb, ${p1} 35%, #000 65%), color-mix(in srgb, ${p2} 25%, #000 75%), #060608)`;
        case 'gradient-2':
          return `radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.16) 0%, transparent 55%), radial-gradient(circle at 10% 20%, ${p2}40 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3}30 0%, transparent 50%), linear-gradient(135deg, ${p1}35, var(--bg))`;
        case 'gradient-3':
          return `radial-gradient(ellipse at 50% -10%, rgba(255, 255, 255, 0.18) 0%, transparent 60%), linear-gradient(to bottom right, ${p1}40 0%, transparent 100%), linear-gradient(to top right, ${p3}30 0%, transparent 100%), var(--bg)`;
        case 'gradient-4':
          return `radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.14) 0%, transparent 55%), conic-gradient(from 180deg at 50% 50%, ${p1}35 0deg, ${p2}25 120deg, ${p3}25 240deg, ${p1}35 360deg)`;
        default: {
          if (typeof mainWallpaper === 'string' && (
            mainWallpaper.startsWith('http://') ||
            mainWallpaper.startsWith('https://') ||
            mainWallpaper.startsWith('data:') ||
            mainWallpaper.startsWith('blob:') ||
            mainWallpaper.startsWith('url(')
          )) {
            const cleanUrl = mainWallpaper.startsWith('url(') ? mainWallpaper : `url("${mainWallpaper}")`;
            return `radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.16) 0%, rgba(0, 0, 0, 0.55) 80%), ${cleanUrl} center / cover no-repeat fixed`;
          }
          return `radial-gradient(ellipse at 50% -20%, color-mix(in srgb, ${p1} 22%, rgba(255, 255, 255, 0.12) 78%) 0%, transparent 65%), var(--bg)`;
        }
      }
    } else {
      if (!mainWallpaper || mainWallpaper === 'none') return 'var(--bg)';

      switch (mainWallpaper) {
        case 'gradient-1': return `linear-gradient(135deg, ${p1}, ${p2}, ${p3})`;
        case 'gradient-2': return `radial-gradient(circle at 10% 20%, ${p2} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3} 0%, transparent 50%), linear-gradient(135deg, ${p1}, var(--bg))`;
        case 'gradient-3': return `linear-gradient(to bottom right, ${p1} 0%, transparent 100%), linear-gradient(to top right, ${p3} 0%, transparent 100%), var(--bg)`;
        case 'gradient-4': return `conic-gradient(from 180deg at 50% 50%, ${p1} 0deg, ${p2} 120deg, ${p3} 240deg, ${p1} 360deg)`;
        default: {
          if (typeof mainWallpaper === 'string' && (
            mainWallpaper.startsWith('http://') ||
            mainWallpaper.startsWith('https://') ||
            mainWallpaper.startsWith('data:') ||
            mainWallpaper.startsWith('blob:') ||
            mainWallpaper.startsWith('url(')
          )) {
            const cleanUrl = mainWallpaper.startsWith('url(') ? mainWallpaper : `url("${mainWallpaper}")`;
            return `linear-gradient(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.28)), ${cleanUrl} center / cover no-repeat fixed`;
          }
          return 'var(--bg)';
        }
      }
    }
  };

  if (!isAuthenticated && !isMobileLayout) {
    return (
      <LoginScreen
        onLogin={(nick, isSignup) => {
          setIsAuthenticated(true);
          localStorage.setItem('linkerru_auth', 'true');
          setNickname(nick);
          localStorage.setItem('linkerru_nickname', nick);
          playChime('click');
          // Onboarding now only fires after a fresh signup, not on every login
          if (isSignup && localStorage.getItem('linkerru_onboarded') !== 'true') {
            setIsOnboardingOpen(true);
          }
        }}
        lang={lang}
        onLangChange={setLang}
      />
    );
  }

  return (
    <>
      <AppLoader
        imageUrls={[
          "https://github.com/user-attachments/assets/0964c230-e7dc-4cab-9983-1c2abe689206",
          "https://github.com/user-attachments/assets/71a65dc6-fb8f-45fb-88a4-240d44cecee3",
          "https://github.com/user-attachments/assets/708555b4-14a6-4f32-9240-5ecd928ec9fd",
          "https://github.com/user-attachments/assets/6805ef80-9512-4954-9035-1b53133f26c1",
          "https://github.com/user-attachments/assets/98c31a64-a8ba-4c0e-a3de-c73f433e4863",
        ]}
        minDuration={2500}
        color={activePalette.primary}
        background={getWallpaperStyle()}
        brightness={brightness}
        onComplete={onLoaderComplete}
      />
      
      {isNightLight && (
        <div className="fixed inset-0 z-[9999] pointer-events-none bg-[#ffad33] opacity-[0.15] mix-blend-multiply" style={{ mixBlendMode: theme === 'dark' ? 'color-burn' : 'multiply' }} />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen text-[var(--on-surface)] p-5 transition-colors duration-300 md:p-8 flex flex-col justify-between font-sans selection:bg-[var(--accent)] selection:text-white"
        style={{ background: getWallpaperStyle() }}
        id="root-launcher-app"
      >
      <div className="fixed top-6 right-6 z-[100] pointer-events-auto flex flex-col items-end">
        <AnimatePresence mode="popLayout">
          {!isMobileLayout && toasts.map(toast => (
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


      {showTabletPrompt ? (
        <div className="flex flex-col flex-1 w-full max-w-sm mx-auto justify-center gap-6 p-4">
           <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[var(--on-surface)]">LinkerRu</h1>
            <p className="text-sm font-bold text-[var(--on-surface-var)] mt-1">{lang === 'ru' ? 'Выберите версию для планшета' : 'Select version for tablet'}</p>
          </div>
          <button onClick={() => {
            setTabletChoice('desktop');
            localStorage.setItem('linkerru_tablet_choice', 'desktop');
            setShowTabletPrompt(false);
            setIsMobileLayout(false);
          }} className="py-4 bg-[var(--surface-dim)] border border-[var(--outline)] rounded-2xl text-[var(--on-surface)] font-bold text-lg hover:bg-[var(--container)] transition-colors">
            {lang === 'ru' ? 'Настольная версия' : 'Desktop Version'}
          </button>
          <button onClick={() => {
            setTabletChoice('mobile');
            localStorage.setItem('linkerru_tablet_choice', 'mobile');
            setShowTabletPrompt(false);
            setIsMobileLayout(true);
          }} className="py-4 bg-[var(--surface-dim)] border border-[var(--outline)] rounded-2xl text-[var(--on-surface)] font-bold text-lg hover:bg-[var(--container)] transition-colors">
            {lang === 'ru' ? 'Мобильная версия' : 'Mobile Version'}
          </button>
        </div>
      ) : isMobileLayout ? (
        <div className="flex flex-col flex-1 w-full max-w-md mx-auto bg-[var(--surface)] text-[var(--on-surface)] relative overflow-hidden font-sans select-none min-h-screen">
          {/* Mobile Top Bar */}
          <div className="flex justify-between items-center px-6 pt-8 pb-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline)] p-2 shadow-sm flex items-center justify-center">
                <img
                  src="https://github.com/user-attachments/assets/0964c230-e7dc-4cab-9983-1c2abe689206"
                  alt="LinkerRu Logo"
                  className={`w-full h-full object-contain ${theme === 'light' ? 'brightness-0' : 'brightness-0 invert'}`}
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-[var(--on-surface)]">
                    LinkerRu <span className="text-[var(--on-surface-var)]">:MBL</span>
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--container)] border border-[var(--outline-var)] text-[var(--on-surface)]">
                    Mobile
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[var(--on-surface-var)] uppercase tracking-wider">
                  LISYAN X LINKERRU
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6 scrollbar-hide pb-28 relative z-10">
            
            {/* Hero Card: Lisyan Connect */}
            <div 
              onClick={() => { playChime('click'); openLisyanWindow(); }}
              className="w-full rounded-3xl bg-[var(--surface-dim)] border border-[var(--outline)] hover:border-[var(--on-surface)] p-6 flex flex-col gap-5 active:scale-[0.98] transition-all shadow-sm relative overflow-hidden group cursor-pointer"
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[var(--on-surface)] flex items-center justify-center text-[var(--surface)] shadow-md group-hover:scale-105 transition-transform">
                  <Monitor size={28} strokeWidth={2.2} />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)] tracking-wider">
                  P2P CONNECT
                </span>
              </div>

              <div className="flex flex-col gap-1 relative z-10">
                <h2 className="text-2xl font-black tracking-tight text-[var(--on-surface)]">
                  Lisyan Connect
                </h2>
                <p className="text-xs font-medium text-[var(--on-surface-var)] leading-relaxed">
                  {lang === 'ru'
                    ? 'Быстрая P2P передача файлов, синхронизация и беспроводное подключение устройств.'
                    : 'Fast P2P file transfer, device synchronization, and wireless link.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--outline-var)] flex items-center justify-between relative z-10">
                <span className="text-xs font-bold text-[var(--on-surface)] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {lang === 'ru' ? 'Открыть Connect' : 'Launch Connect'}
                </span>
                <div className="w-8 h-8 rounded-full bg-[var(--container)] flex items-center justify-center text-[var(--on-surface)] group-hover:bg-[var(--on-surface)] group-hover:text-[var(--surface)] transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>

            {/* Account Manager Card */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--on-surface-var)] pl-1">
                {lang === 'ru' ? 'Менеджер аккаунта' : 'Account Manager'}
              </span>

              <div 
                onClick={() => { playChime('click'); openAccountWindow(); }}
                className="p-5 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline)] hover:border-[var(--on-surface)] flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface)] shadow-sm">
                    <User size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-[var(--on-surface)]">
                      {isAuthenticated ? (nickname || 'User') : (lang === 'ru' ? 'Гостевой аккаунт' : 'Guest Account')}
                    </span>
                    <span className="text-xs font-semibold text-[var(--on-surface-var)] mt-0.5">
                      {isAuthenticated ? (userAuth.currentUser?.email || (lang === 'ru' ? 'Авторизован' : 'Logged in')) : (lang === 'ru' ? 'Нажмите для управления аккаунтом' : 'Tap to manage account')}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[var(--container)] flex items-center justify-center text-[var(--on-surface-var)] group-hover:text-[var(--on-surface)] group-hover:bg-[var(--surface)] transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Navigation Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--outline)] flex items-center justify-around px-8 z-50">
            <button 
              onClick={() => { playChime('click'); openLisyanWindow(); }}
              className="flex flex-col items-center gap-1 text-[var(--on-surface-var)] hover:text-[var(--on-surface)] active:scale-95 transition-all cursor-pointer"
            >
              <Monitor size={20} strokeWidth={2.2} />
              <span className="text-[10px] font-bold">Lisyan</span>
            </button>
            <button 
              onClick={() => { playChime('click'); handleOpenSettings('appearance'); }}
              className="flex flex-col items-center gap-1 text-[var(--on-surface-var)] hover:text-[var(--on-surface)] active:scale-95 transition-all cursor-pointer"
            >
              <Settings size={20} strokeWidth={2.2} />
              <span className="text-[10px] font-bold">{lang === 'ru' ? 'Настройки' : 'Settings'}</span>
            </button>
            <button 
              onClick={() => { playChime('click'); openAccountWindow(); }}
              className="flex flex-col items-center gap-1 text-[var(--on-surface-var)] hover:text-[var(--on-surface)] active:scale-95 transition-all cursor-pointer"
            >
              <User size={20} strokeWidth={2.2} />
              <span className="text-[10px] font-bold">{lang === 'ru' ? 'Аккаунт' : 'Account'}</span>
            </button>
          </div>

        </div>
      ) : (
        <>
      {/* --- TOP HEADER NAVIGATION BAR --- */}
      <header className="flex justify-between items-center max-w-7xl mx-auto w-full mb-8 flex-wrap gap-4" id="app-topbar">
        <div className="flex flex-wrap items-center gap-3">
          {/* Weather Pill */}
          <button
            onClick={() => {
              playChime('click');
              openWeatherWindow();
            }}
            className="group hidden md:flex items-center gap-2 bg-[var(--btn-bg)] h-11 px-4 rounded-full text-xs font-bold text-[var(--on-surface-var)] transition-all hover:bg-[var(--btn-hover)] hover:text-[var(--on-surface)] border border-[var(--btn-border)] shadow-md shadow-black/10 hover:shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer backdrop-blur-xl"
            id="topbar-weather-pill"
          >
            <motion.div
              id="topbar-weather-icon-wrapper"
              className="flex items-center justify-center origin-center"
              animate={{
                rotate: [-2, 3, -1, 2, -2],
                y: [0, -1, 0, -1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 7,
                ease: 'easeInOut',
              }}
              whileHover={{
                rotate: 20,
                scale: 1.2,
                transition: { type: 'spring', stiffness: 400, damping: 12 },
              }}
              whileTap={{
                scale: 0.88,
                rotate: -12,
              }}
            >
              <CloudSun size={16} className="text-[var(--on-surface-var)] group-hover:text-[var(--accent)] transition-colors" />
            </motion.div>
            <span>
              {topbarTemp !== null
                ? (tempUnit === 'F' ? `${Math.round((topbarTemp * 9 / 5) + 32)}°F` : `${topbarTemp}°C`)
                : (tempUnit === 'F' ? '--°F' : '--°C')}
            </span>
          </button>

          {/* Calendar Pill */}
          <button
            onClick={() => {
              playChime('click');
              setIsCalendarOpen(true);
            }}
            className="hidden md:flex items-center gap-2 bg-[var(--btn-bg)] h-11 px-4 rounded-full text-xs font-bold text-[var(--on-surface-var)] transition-all hover:bg-[var(--btn-hover)] hover:text-[var(--on-surface)] border border-[var(--btn-border)] shadow-md shadow-black/10 hover:shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer backdrop-blur-xl"
            id="topbar-calendar-pill"
          >
            <CalendarIcon size={16} className="text-[var(--on-surface-var)]" />
            <span>{nowDate}</span>
          </button>

          {/* Battery Pill */}
          {batteryLvl !== null && (
            <div
              className="hidden md:flex items-center gap-2 bg-[var(--btn-bg)] h-11 px-4 rounded-full text-xs font-bold text-[var(--on-surface-var)] transition-all hover:bg-[var(--btn-hover)] hover:text-[var(--on-surface)] border border-[var(--btn-border)] shadow-md shadow-black/10 cursor-default backdrop-blur-xl"
              title={isCharging ? (lang === 'ru' ? 'Заряжается' : 'Charging') : (lang === 'ru' ? 'От батареи' : 'On battery')}
            >
              {isCharging
                ? <BatteryCharging size={16} style={{ color: activePalette.primary }} />
                : <Battery size={16} style={{ color: activePalette.primary }} />}
              <span className="tabular-nums font-extrabold">{Math.round(batteryLvl * 100)}%</span>
            </div>
          )}

          {/* Clock Pill */}
          <button
            onClick={() => {
              playChime('click');
              setIsClockOpen(true);
            }}
            className="flex items-center gap-2 bg-[var(--btn-bg)] h-11 px-4 rounded-full text-xs font-bold text-[var(--on-surface-var)] transition-all hover:bg-[var(--btn-hover)] hover:text-[var(--on-surface)] border border-[var(--btn-border)] shadow-md shadow-black/10 hover:shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer backdrop-blur-xl"
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
            className="hidden md:flex items-center gap-2.5 bg-[var(--btn-bg)] h-11 border border-[var(--btn-border)] pl-1.5 pr-4.5 rounded-full shadow-sm cursor-pointer transition-all hover:bg-[var(--btn-hover)] group hover:scale-[1.02] active:scale-95 backdrop-blur-xl"
            id="topbar-settings-pill"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--container)] border border-[var(--btn-border)] flex items-center justify-center transition-all group-hover:bg-[var(--container-high)]">
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
            className="hidden md:flex w-11 h-11 relative rounded-full bg-[var(--btn-bg)] border border-[var(--btn-border)] items-center justify-center text-[var(--on-surface-var)] transition-all hover:bg-[var(--btn-hover)] hover:text-[var(--on-surface)] hover:scale-[1.02] active:scale-95 cursor-pointer backdrop-blur-xl"
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
              handleOpenSettings('account');
            }}
            className="flex items-center gap-2 md:w-11 md:h-11 h-11 px-4 md:px-0 rounded-full bg-[var(--btn-bg)] border border-[var(--btn-border)] justify-center text-[var(--on-surface-var)] transition-all hover:bg-[var(--btn-hover)] hover:text-[var(--on-surface)] hover:scale-[1.02] active:scale-95 cursor-pointer backdrop-blur-xl"
            id="topbar-avatar"
            title={lang === 'ru' ? 'Менеджер аккаунта' : 'Account Manager'}
          >
            <User size={18} />
            <span className="text-xs font-bold md:hidden">{lang === 'ru' ? 'Аккаунт' : 'Account'}</span>
          </button>
        </div>
      </header>

      {/* --- BRANDING HEADER AREA (Seamless & Cardless, adapts directly to wallpaper) --- */}
      <section className="max-w-7xl mx-auto w-full mb-8 text-left" id="branding-heading">
        <div className="flex items-center gap-2.5 mb-3">
          <span
            className="inline-flex items-center justify-center h-7 px-3.5 text-[10px] font-black uppercase tracking-widest bg-[var(--btn-bg)] text-[var(--accent)] border border-[var(--btn-border)] rounded-xl select-none backdrop-blur-md shadow-xs leading-none"
            id="branding-tag"
          >
            LinkerRu × Lisyan
          </span>
          <button
            onClick={() => {
              playChime('click');
              openChangelogWindow();
            }}
            className="inline-flex items-center justify-center gap-1.5 h-7 px-3.5 bg-[var(--btn-bg)] border border-[var(--btn-border)] rounded-xl text-[10px] font-black text-[var(--on-surface-var)] backdrop-blur-md shadow-xs hover:bg-[var(--btn-hover)] hover:text-[var(--on-surface)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer leading-none"
            id="version-pill"
          >
            <History size={12} />
            <span>v1/262608</span>
          </button>
        </div>
        <div className="flex items-center gap-4 min-h-[56px]" id="branding-title">
          <div
            className={`h-12 w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center transition-all border shadow-md p-2.5 ${
              theme === 'light'
                ? 'bg-[var(--accent)] border-[var(--accent)]'
                : 'bg-[#060608] border-[var(--btn-border)]'
            }`}
          >
            <img
              src="https://github.com/user-attachments/assets/0964c230-e7dc-4cab-9983-1c2abe689206"
              alt="LinkerRu Logo"
              className={`w-full h-full object-contain transition-all ${
                theme === 'light' ? 'brightness-0 invert' : 'brightness-0 invert'
              }`}
              referrerPolicy="no-referrer"
            />
          </div>
          <AnimatePresence mode="wait">
            {greetingPhase === 'brand' ? (
              <motion.h1
                key="brand"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, filter: 'blur(8px)', y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-6xl font-black tracking-tighter transition-colors duration-300"
                style={{
                  color: 'var(--wallpaper-title-color, var(--on-wallpaper-surface, var(--on-surface)))',
                }}
              >
                LinkerRu:Re
              </motion.h1>
            ) : (
              <motion.h1
                key="greeting"
                initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-3xl md:text-5xl font-black tracking-tight leading-tight transition-colors duration-300"
                style={{
                  color: 'var(--wallpaper-title-color, var(--on-wallpaper-surface, var(--on-surface)))',
                }}
              >
                {greetingText}
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* --- ROW 1: BENTO LAYOUT MAIN WIDGETS --- */}
      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="row1-bento-grid">
        {/* WIDGET 1: Space Proxy Hub */}
        <SpaceProxyCard
          lang={lang}
          theme={theme}
          activePalette={activePalette}
          proxyMinimized={proxyMinimized}
          onOpenHub={(url, serverName) => {
            if (serverName) handleServerSelection(serverName);
            openLinkerRoute(url);
          }}
          playChime={playChime}
        />

        {/* WIDGET 2: Agno GPT */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[250px] transition-all hover:scale-[1.02] active:scale-[0.98] relative" id="card-agno-gpt">
          {agnoMinimized && (
            <div className="running-pill"><span className="running-pill-dot" />{lang === 'ru' ? 'В фоне' : 'Running'}</div>
          )}
          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl border border-[var(--btn-border)] overflow-hidden flex items-center justify-center shadow-inner" style={{ backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary }}>
              <Bot size={20} className={theme === 'dark' ? 'text-[var(--on-surface)]' : 'text-white'} />
            </div>
          </div>
          <div className="flex-1 mt-3 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Agno GPT</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {lang === 'ru' ? 'Персональный ИИ-ассистент на базе OpenAI' : 'Personal AI assistant powered by OPENAI'}
            </p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => {
                  playChime('click');
                  openAgnoWindow();
                }}
                className="flex-1 py-3 rounded-full text-xs font-extrabold border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-center shadow-sm"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary,
                  borderColor: theme === 'dark' ? 'var(--btn-border)' : 'transparent',
                  color: theme === 'dark' ? 'var(--on-surface)' : '#ffffff',
                  boxShadow: theme === 'dark' ? undefined : `0 4px 12px ${activePalette.primary}40`
                }}
                id="agno-card-open-btn"
              >
                {lang === 'ru' ? 'Открыть' : 'Open'}
              </button>
            </div>
          </div>
        </div>

        {/* WIDGET 3: Lisyan Connect */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[250px] transition-all hover:scale-[1.02] active:scale-[0.98] relative" id="card-lisyan-connect">
          {lisyanMinimized && (
            <div className="running-pill"><span className="running-pill-dot" />{lang === 'ru' ? 'В фоне' : 'Running'}</div>
          )}
          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl border border-[var(--btn-border)] overflow-hidden flex items-center justify-center p-2 shadow-inner" style={{ backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary }}>
              <img 
                src="https://github.com/user-attachments/assets/71a65dc6-fb8f-45fb-88a4-240d44cecee3" 
                alt="Lisyan Connect" 
                className="w-full h-full object-contain brightness-0 invert" 
              />
            </div>
          </div>
          <div className="flex-1 mt-3 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Lisyan Connect</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {lang === 'ru' ? 'Веб-сервис для быстрой, безопасной и анонимной P2P-передачи файлов.' : 'Web service for fast, secure and anonymous P2P file transfer.'}
            </p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2 flex-1">
              <button
                className="flex-1 py-3 rounded-full text-xs font-extrabold border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-center shadow-sm"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary,
                  borderColor: theme === 'dark' ? 'var(--btn-border)' : 'transparent',
                  color: theme === 'dark' ? 'var(--on-surface)' : '#ffffff',
                  boxShadow: theme === 'dark' ? undefined : `0 4px 12px ${activePalette.primary}40`
                }}
                onClick={() => { playChime('click'); openLisyanWindow(); }}
              >
                {lang === 'ru' ? 'Открыть' : 'Open'}
              </button>
            </div>
          </div>
        </div>

        {/* WIDGET 4: Nexus Game Box NGB */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[250px] transition-all hover:scale-[1.02] active:scale-[0.98] relative" id="card-nexus-game-box">
          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl border border-[var(--btn-border)] overflow-hidden flex items-center justify-center p-0 shadow-inner" style={{ backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary }}>
              <img src="https://github.com/user-attachments/assets/98c31a64-a8ba-4c0e-a3de-c73f433e4863" alt="NGB" className="w-full h-full object-contain brightness-0 invert" />
            </div>
          </div>
          <div className="flex-1 mt-3 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Nexus Game Box</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {lang === 'ru' ? 'Сотни бесплатных браузерных игр.' : 'Hundreds of free browser games.'}
            </p>
          </div>
          <div className="mt-4 flex items-end">
            <button
              onClick={openNexusGameBox}
              className="w-full py-3 rounded-full text-xs font-extrabold border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-center shadow-sm"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary,
                borderColor: theme === 'dark' ? 'var(--btn-border)' : 'transparent',
                color: theme === 'dark' ? 'var(--on-surface)' : '#ffffff',
                boxShadow: theme === 'dark' ? undefined : `0 4px 12px ${activePalette.primary}40`
              }}
            >
              {lang === 'ru' ? 'Открыть' : 'Open'}
            </button>
          </div>
        </div>
      </main>

      {/* --- ROW 2: EXTRA CARDS AND ACCENT PILLS BUTTONS --- */}
      <section className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4" id="row2-bento-grid">
        {/* SUBCONVERT CARD (placed before Extensions) */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[250px] transition-all hover:scale-[1.02] active:scale-[0.98] relative" id="card-subconvert">
          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl border border-[var(--btn-border)] overflow-hidden flex items-center justify-center p-0 shadow-inner" style={{ backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary }}>
              <Subtitles size={22} className={theme === 'dark' ? 'text-[var(--on-surface)]' : 'text-white'} />
            </div>
          </div>
          <div className="flex-1 mt-3 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">
              SubConvert
            </h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {lang === 'ru'
                ? 'Конвертер YouTube-видео в субтитры и транскрипты (.txt, .srt, .json).'
                : 'YouTube video to subtitles converter (.txt, .srt, .json).'}
            </p>
          </div>
          <div className="mt-4 flex items-end">
            <button
              onClick={handleOpenSubConvert}
              className="w-full py-3 rounded-full text-xs font-extrabold border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-center shadow-sm"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary,
                borderColor: theme === 'dark' ? 'var(--btn-border)' : 'transparent',
                color: theme === 'dark' ? 'var(--on-surface)' : '#ffffff',
                boxShadow: theme === 'dark' ? undefined : `0 4px 12px ${activePalette.primary}40`
              }}
            >
              {lang === 'ru' ? 'Открыть' : 'Open'}
            </button>
          </div>
        </div>

        {/* TELEGRAM ROUTE CARD */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[250px] transition-all hover:scale-[1.02] active:scale-[0.98] relative" id="card-telegram-route">
          {isMinimized('telegramroute') && (
            <div className="running-pill"><span className="running-pill-dot" />{lang === 'ru' ? 'В фоне' : 'Running'}</div>
          )}
          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl border border-[var(--btn-border)] overflow-hidden flex items-center justify-center p-0 shadow-inner" style={{ backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary }}>
              <Send size={20} className={theme === 'dark' ? 'text-[var(--on-surface)]' : 'text-white'} />
            </div>
          </div>
          <div className="flex-1 mt-3 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">
              Telegram Route
            </h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {lang === 'ru'
                ? 'Безопасный веб-туннель и быстрая маршрутизация для Telegram и ботов.'
                : 'Secure web tunnel and fast routing for Telegram services & bots.'}
            </p>
          </div>
          <div className="mt-4 flex items-end">
            <button
              onClick={() => {
                playChime('click');
                openTelegramRouteWindow();
              }}
              className="w-full py-3 rounded-full text-xs font-extrabold border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-center shadow-sm"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary,
                borderColor: theme === 'dark' ? 'var(--btn-border)' : 'transparent',
                color: theme === 'dark' ? 'var(--on-surface)' : '#ffffff',
                boxShadow: theme === 'dark' ? undefined : `0 4px 12px ${activePalette.primary}40`
              }}
            >
              {lang === 'ru' ? 'Открыть' : 'Open'}
            </button>
          </div>
        </div>

        {/* WIDGET 5: App Launcher */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[250px] transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden" id="card-app-launcher">
          <div className="flex justify-between items-center h-[32px]">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider">
              <Gamepad2 size={16} />
              <span>{lang === 'ru' ? 'Приложения' : 'Quick Apps'}</span>
            </div>
            <span className="text-[10px] tabular-nums text-[var(--outline)] font-bold">4/4</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-between mt-2">
            <div className="grid grid-cols-4 gap-2" id="app-grid">
              {/* Weather App Shortcut */}
              <div className="relative flex flex-col items-center gap-1 cursor-pointer group" onClick={() => {
                playChime('click');
                openWeatherWindow();
              }}>
                {isMinimized('weather') && <div className="running-pill-mini" />}
                <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-[var(--btn-border)] bg-[var(--btn-bg)] group-hover:bg-[var(--btn-hover)]">
                  <motion.div
                    whileHover={{ rotate: 18, scale: 1.15 }}
                    whileTap={{ scale: 0.9, rotate: -10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <CloudSun size={18} className="text-[var(--on-surface)]" />
                  </motion.div>
                  {weatherError && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-black text-white border border-[var(--surface)] shadow-xs">!</span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-[var(--on-surface)] truncate w-full text-center">{lang === 'ru' ? 'Погода' : 'Weather'}</span>
              </div>

              {/* Extensions App Shortcut */}
              <div className="relative flex flex-col items-center gap-1 cursor-pointer group" onClick={() => {
                playChime('click');
                handleOpenExtensions();
              }}>
                {extensionsMinimized && <div className="running-pill-mini" />}
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-[var(--btn-border)] bg-[var(--btn-bg)] group-hover:bg-[var(--btn-hover)]">
                  <Blocks size={18} className="text-[var(--on-surface)]" />
                </div>
                <span className="text-[9px] font-bold text-[var(--on-surface)] truncate w-full text-center">{lang === 'ru' ? 'Расширения' : 'Extensions'}</span>
              </div>

              {/* Calculator App Shortcut */}
              <div className="relative flex flex-col items-center gap-1 cursor-pointer group" onClick={() => {
                playChime('click');
                openCalculatorWindow();
              }}>
                {calculatorMinimized && <div className="running-pill-mini" />}
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-[var(--btn-border)] bg-[var(--btn-bg)] group-hover:bg-[var(--btn-hover)]">
                  <Calculator size={18} className="text-[var(--on-surface)]" />
                </div>
                <span className="text-[9px] font-bold text-[var(--on-surface)] truncate w-full text-center">{lang === 'ru' ? 'Калькулятор' : 'Calc'}</span>
              </div>

              {/* Keeps App Shortcut */}
              <div className="relative flex flex-col items-center gap-1 cursor-pointer group" onClick={() => {
                playChime('click');
                openKeepsWindow();
              }}>
                {keepsMinimized && <div className="running-pill-mini" />}
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-[var(--btn-border)] bg-[var(--btn-bg)] group-hover:bg-[var(--btn-hover)]">
                  <StickyNote size={18} className="text-[var(--on-surface)]" />
                </div>
                <span className="text-[9px] font-bold text-[var(--on-surface)] truncate w-full text-center">{lang === 'ru' ? 'Заметки' : 'Keeps'}</span>
              </div>
            </div>

            {/* Pill under 4 apps */}
            <div className="mt-2 flex items-center justify-center">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--btn-bg)] border border-[var(--btn-border)] text-[8.5px] font-extrabold text-[var(--on-surface-var)] shadow-xs select-none">
                <Sparkles size={10} className="text-[var(--accent)] shrink-0" />
                <span className="truncate">{lang === 'ru' ? 'Скоро больше приложений...' : 'More apps coming soon...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL: Quick Toggles */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[250px] transition-all hover:scale-[1.02] active:scale-[0.98] relative group" id="panel-quicktoggles">
          <button
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--btn-bg)] rounded-full border border-[var(--btn-border)] hover:bg-[var(--btn-hover)] text-[var(--on-surface)] shadow-sm z-10"
            title={lang === 'ru' ? 'Изменить переключатели' : 'Edit Toggles'}
            onClick={() => {
              playChime('click');
              handleOpenSettings('toggles');
            }}
          >
            <Edit2 size={14} />
          </button>
          <div className="flex items-center justify-between h-[32px]">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider">
              <span>{t.ph_toggles}</span>
            </div>
            <span className="text-[10px] tabular-nums text-[var(--outline)]">{activeToggles.length}/{MAX_TOGGLES}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1 content-start mt-2">
            {activeToggles.length === 0 ? (
              <div className="col-span-2 flex items-center justify-center text-[11px] text-[var(--outline)] italic">
                {lang === 'ru' ? 'Нет переключателей' : 'No toggles'}
              </div>
            ) : (
              activeToggles.map((id) => {
                const cfg = {
                  theme: {
                    icon: theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />,
                    label: theme === 'dark' ? (lang === 'ru' ? 'Тёмная' : 'Dark') : (lang === 'ru' ? 'Светлая' : 'Light'),
                    sub: lang === 'ru' ? 'Тема' : 'Theme',
                    active: theme === 'dark',
                    onClick: handleThemeToggle,
                  },
                  language: {
                    icon: <Languages size={14} />,
                    label: lang === 'ru' ? 'Русский' : 'English',
                    sub: lang === 'ru' ? 'Язык' : 'Language',
                    active: lang === 'ru',
                    onClick: () => setLang(lang === 'ru' ? 'en' : 'ru'),
                  },
                  sound: {
                    icon: isSoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />,
                    label: lang === 'ru' ? 'Звук' : 'Sound',
                    sub: isSoundEnabled ? (lang === 'ru' ? 'Вкл' : 'On') : (lang === 'ru' ? 'Выкл' : 'Off'),
                    active: isSoundEnabled,
                    onClick: handleSoundToggle,
                  },
                  contrast: {
                    icon: <Monitor size={14} />,
                    label: lang === 'ru' ? 'Контраст' : 'Contrast',
                    sub: isContrast ? (lang === 'ru' ? 'Высокий' : 'High') : (lang === 'ru' ? 'Обычный' : 'Normal'),
                    active: isContrast,
                    onClick: handleContrastToggle,
                  },
                  night_light: {
                    icon: <SunMoon size={14} />,
                    label: lang === 'ru' ? 'Ночной' : 'Night Light',
                    sub: isNightLight ? (lang === 'ru' ? 'Вкл' : 'On') : (lang === 'ru' ? 'Выкл' : 'Off'),
                    active: isNightLight,
                    onClick: handleNightLightToggle,
                  },
                } as Record<string, any>;
                const activeCfg = cfg[id];

                return (
                  <button
                    key={id}
                    onClick={activeCfg.onClick}
                    className={`flex items-center gap-2 p-2 px-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                      activeCfg.active
                        ? 'bg-[var(--btn-hover)] text-[var(--on-surface)] border-2 border-[var(--on-surface)]/30 shadow-md'
                        : 'bg-[var(--btn-bg)] text-[var(--on-surface-var)] border border-[var(--btn-border)] hover:bg-[var(--btn-hover)] hover:text-[var(--on-surface)]'
                    }`}
                  >
                    <div className={`flex items-center justify-center shrink-0 w-7 h-7 rounded-xl ${
                      activeCfg.active ? 'bg-[var(--on-surface)]/15 text-[var(--on-surface)]' : 'bg-[var(--container)] text-[var(--on-surface-var)]'
                    }`}>
                      {activeCfg.icon}
                    </div>
                    <div className="flex flex-col items-start text-left min-w-0">
                      <span className={`text-[10px] font-extrabold leading-tight truncate w-full ${activeCfg.active ? 'text-[var(--on-surface)]' : 'text-[var(--on-surface-var)]'}`}>{activeCfg.label}</span>
                      <span className={`text-[8px] font-bold truncate w-full mt-0.5 ${activeCfg.active ? 'text-[var(--on-surface-var)]' : 'text-[var(--on-surface-var)]/60'}`}>{activeCfg.sub}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* --- ROW 3: DETAILED FOOTER PANEL GROUPS --- */}
      <section className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4" id="row3-footer-grid">
        {/* COLUMN 1: Profile Details with real destroy action */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px] transition-all hover:scale-[1.02] active:scale-[0.98]" id="panel-profile">
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
              <span className="text-sm font-black text-[var(--on-surface)] leading-tight">
                {isAuthenticated ? nickname : (lang === 'ru' ? 'Гостевой аккаунт' : 'Guest Account')}
              </span>
              <span className="text-[10px] text-[var(--on-surface-var)] font-semibold mt-0.5">
                {isAuthenticated ? userAuth.currentUser?.email : 'guest@linker.os'}
              </span>
            </div>
            <button onClick={handleDestroySession} className="h-10 w-10 rounded-2xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] border border-[var(--btn-border)] flex items-center justify-center text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-all shadow-sm cursor-pointer" title={lang === 'ru' ? 'Выйти' : 'Log out'}>
              <LogOut size={16} />
            </button>
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={() => { playChime('click'); handleOpenSettings('account'); }} className="w-full py-2.5 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] border border-[var(--btn-border)] text-xs font-bold text-[var(--on-surface)] transition-all shadow-sm hover:scale-[1.01] active:scale-98 cursor-pointer">
              {lang === 'ru' ? 'Управление аккаунтом' : 'Manage Account'}
            </button>
          </div>
        </div>

        {/* COLUMN 2: News bullet notes */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px] transition-all hover:scale-[1.02] active:scale-[0.98] relative" id="panel-news">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider mb-2">
            <Newspaper size={16} />
            <span>{t.ph_news}</span>
          </div>

          <div className="text-xs font-semibold text-[var(--on-surface)] leading-relaxed flex-1 flex flex-col justify-between">
            <p className="whitespace-pre-line opacity-90">
              {t.ph_news_bullets}
            </p>

            <div className="mt-3 pt-2 border-t border-[var(--outline-var)]/30 flex items-center gap-2 flex-wrap text-[var(--accent)] font-bold text-xs select-none">
              <span>{t.ph_news_channel_note}</span>
              <svg 
                className="w-10 h-5 text-[var(--accent)] shrink-0 animate-pulse transform translate-y-0.5" 
                viewBox="0 0 40 20" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                {/* Handwritten arrow pointing right to support panel channel */}
                <path d="M 2 12 Q 18 6 32 10" />
                <path d="M 24 4 L 34 10 L 26 16" />
              </svg>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Support channels & contacts */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col min-h-[220px] col-span-1 md:col-span-2 lg:col-span-1 transition-all hover:scale-[1.02] active:scale-[0.98]" id="panel-support">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider">
              <User size={16} />
              <span>{t.ph_support}</span>
            </div>
            <span className="text-[9px] font-black tracking-widest text-[var(--outline)] uppercase">
              Lisyan Dews Technologies
            </span>
          </div>

          <div className="flex flex-col gap-2 flex-1 justify-center">
            {CONTACTS.map(contact => {
              const Icon = contact.icon;
              return (
                <div
                  key={contact.id}
                  onClick={() => { playChime('click'); setActiveSupportContactId(contact.id); }}
                  className="flex items-center justify-between p-3 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] border border-[var(--btn-border)] rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[var(--btn-hover)] text-[var(--on-surface)] flex items-center justify-center shrink-0 border border-[var(--btn-border)]">
                      <Icon size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[var(--on-surface)] truncate">{contact.title}</span>
                      <span className="text-[10px] text-[var(--on-surface-var)] font-semibold truncate group-hover:text-[var(--on-surface)] transition-colors">{contact.value}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--on-surface-var)] group-hover:text-[var(--on-surface)] transition-colors shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- SOUTHSIDE BOTTOM DRAGGABLE HANDLE DECORATION --- */}
      <footer className="w-full flex justify-center mt-12" id="app-bottombar">
        <div className="w-24 h-1 bg-[var(--outline)] rounded-full opacity-50 select-none pointer-events-none" />
      </footer>
      </>
      )}

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

      {/* Lisyan Connect — now rendered via window manager only */}

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
        onOpenFullSettings={() => handleOpenSettings()}
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

      {/* Settings is now rendered via window manager */}

      {!isMobileLayout && (
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
      )}

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

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          setIsOnboardingOpen(false);
          playChime('toast');
        }}
        lang={lang}
        onLangChange={(l) => {
          setLang(l);
          localStorage.setItem('linkerru_lang', l); window.dispatchEvent(new Event('linkerru_lang_changed'));
        }}
        theme={theme}
        onThemeChange={(t) => {
          setTheme(t);
          localStorage.setItem('linkerru_theme', t);
        }}
        activePaletteId={activePaletteId}
        onPaletteChange={(id) => {
          setActivePaletteId(id);
          localStorage.setItem('linkerru_accent', id);
        }}
        mainWallpaper={mainWallpaper}
        onWallpaperChange={(w) => {
          setMainWallpaper(w);
          localStorage.setItem('linkerru_wallpaper', w);
          setWallpaperApplyNonce(prev => prev + 1);
        }}
        clockType={clockType}
        onClockTypeChange={(type) => {
          setClockType(type);
          localStorage.setItem('linkerru_clock_type', type);
        }}
        clockVariation={clockVariation}
        onClockVariationChange={(v) => {
          setClockVariation(v);
          localStorage.setItem('linkerru_clock_variation', String(v));
        }}
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
        fontFamily={fontFamily}
        onFontFamilyChange={handleFontChange}
        timeFormat={timeFormat}
        onTimeFormatChange={handleTimeFormatChange}
        tempUnit={tempUnit}
        onTempUnitChange={handleTempUnitChange}
      />

      <div
        className="pointer-events-none fixed inset-0 z-[9999]"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${1 - brightness / 100})`,
          transition: 'background-color 0.3s'
        }}
      />


      {/* OS-style window manager layer (popup apps) */}
      <WindowManagerLayer
        wm={wm}
        lang={lang}
        isOptimizedEngine={isOptimizedEngine}
        isMobileLayout={isMobileLayout}
        isStandbyOpen={isStandbyOpen}
        renderWindowContent={(id) => {
          switch (id) {
            case 'settings':
              return (
                <div className="h-full w-full">
                  <FullSettingsModal
                    wm={wm}
                    playChime={playChime}
                    triggerToast={triggerToast}
                    isOpen={true}
                    embedded={true}
                    onClose={() => wm.close('settings')}
                    lang={lang}
                    onLangChange={handleLangChange}
                    theme={theme}
                    onThemeToggle={handleThemeToggle}
                    activePaletteId={activePaletteId}
                    onPaletteChange={handlePaletteChange}
                    isContrast={isContrast}
                    onContrastToggle={handleContrastToggle}
                    isToastEnabled={isToastEnabled}
                    onToastToggle={() => {
                      const n = !isToastEnabled;
                      setIsToastEnabled(n);
                      localStorage.setItem('linkerru_toast', String(n));
                    }}
                    isSoundEnabled={isSoundEnabled}
                    onSoundToggle={() => {
                      const n = !isSoundEnabled;
                      setIsSoundEnabled(n);
                      localStorage.setItem('linkerru_sound', String(n));
                    }}
                    clickSound={clickSound}
                    onClickSoundChange={(s) => {
                      setClickSound(s);
                      localStorage.setItem('linkerru_click_sound', s);
                    }}
                    notifySound={notifySound}
                    onNotifySoundChange={(s) => {
                      setNotifySound(s);
                      localStorage.setItem('linkerru_notify_sound', s);
                    }}
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
                    panicKey={panicKey}
                    onPanicKeyChange={(k) => {
                      setPanicKey(k);
                      localStorage.setItem('linkerru_panic_key', k);
                    }}
                    panicUrl={panicUrl}
                    onPanicUrlChange={(u) => {
                      setPanicUrl(u);
                      localStorage.setItem('linkerru_panic_url', u);
                    }}
                    isMobileLayout={isMobileLayout}
                    standbyBg={standbyBg}
                    onStandbyBgChange={(bg) => {
                      setStandbyBg(bg);
                      localStorage.setItem('linkerru_standby_bg', bg);
                    }}
                    fontFamily={fontFamily}
                    onFontChange={(f) => {
                      setFontFamily(f);
                      localStorage.setItem('linkerru_font', f);
                    }}
                    mainWallpaper={mainWallpaper}
                    onMainWallpaperChange={(wp) => {
                      setMainWallpaper(wp);
                      localStorage.setItem('linkerru_wallpaper', wp);
                      setWallpaperApplyNonce(prev => prev + 1);
                    }}
                    isAuthenticated={isAuthenticated}
                    nickname={nickname}
                    onNicknameChange={(n) => {
                      setNickname(n);
                      localStorage.setItem('linkerru_nickname', n);
                    }}
                    activeToggles={activeToggles}
                    onTogglesChange={handleTogglesChange}
                    isOptimizedEngine={isOptimizedEngine}
            onOptimizedEngineToggle={() => {
                      const n = !isOptimizedEngine;
                      setIsOptimizedEngine(n);
                      localStorage.setItem('linkerru_optimized_engine', String(n));
                    }}
                    initialTab={settingsInitialTab}
                    timeFormat={timeFormat}
                    onTimeFormatChange={handleTimeFormatChange}
                    tempUnit={tempUnit}
                    onTempUnitChange={handleTempUnitChange}
                  />
                </div>
              );
            case 'changelog':
              return <ChangelogModal lang={lang} embeddedInWindow={true} />;
            case 'lisyan':
              return (
                <div className="wm-embedded h-full w-full">
                  <LisyanConnectModal
                    isOpen={true}
                    onClose={() => wm.close('lisyan')}
                    lang={lang}
                    theme={theme}
                    isMobileLayout={isMobileLayout}
                  />
                </div>
              );
            case 'calculator':
              return <CalculatorApp lang={lang} theme={theme} activePalette={activePalette} />;
            case 'keeps':
              return <KeepsApp lang={lang} theme={theme} activePalette={activePalette} />;
            case 'proxy':
              return <LinkerRouteApp />;
            case 'telegramroute':
              return (
                <div className="flex h-full w-full flex-col bg-[var(--surface)] select-none overflow-hidden">
                  <iframe
                    src="https://marking-carriers-parenting-park.trycloudflare.com/"
                    className="w-full h-full border-none bg-[var(--surface)]"
                    title="Telegram Route Frame"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
                    allow="fullscreen; autoplay; clipboard-read; clipboard-write"
                  />
                </div>
              );
            case 'weather':
              return (
                <WeatherModal
                  isOpen={true}
                  onClose={() => wm.close('weather')}
                  lang={lang}
                  primaryColor={activePalette.primary}
                  embeddedInWindow={true}
                />
              );
            case 'agno':
              return (
                <iframe
                  src="https://agno-agent-ui.vercel.app/"
                  className="h-full w-full border-none"
                  title="Agno GPT"
                />
              );
            default:
              return null;
          }
        }}
      />

      {/* Login screen PREVIEW overlay (dev tool — does NOT log out) */}
      <AnimatePresence>
        {isLoginPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300]"
          >
            <div className="absolute inset-0">
              <LoginScreen
                onLogin={() => { setIsLoginPreviewOpen(false); }}
                lang={lang}
                onLangChange={setLang}
              />
            </div>
            {/* Floating "back to app" bar — makes it clear this is a preview */}
            <motion.button
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onClick={() => setIsLoginPreviewOpen(false)}
              className="fixed bottom-6 left-1/2 z-[310] -translate-x-1/2 flex items-center gap-2 rounded-full border border-[var(--outline)] bg-[var(--surface)] px-5 py-3 text-xs font-black uppercase tracking-wider text-[var(--on-surface)] shadow-2xl hover:bg-[var(--container)] transition-colors cursor-pointer"
            >
              <X size={14} />
              {lang === 'ru' ? 'Вернуться в приложение' : 'Back to app'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      
      <AnimatePresence>
        {activeSupportContactId && (
          <SupportQRModal
            contactId={activeSupportContactId}
            onClose={() => setActiveSupportContactId(null)}
            lang={lang}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Weather Location / Options Modal */}
      <WeatherLocationErrorModal
        isOpen={isWeatherOptionsOpen}
        onClose={() => setIsWeatherOptionsOpen(false)}
        lang={lang}
        currentCity={weatherCustomCity}
        locationMode={weatherLocationMode}
        onEnableGeolocation={handleEnableGeolocation}
        onSetCustomCity={(city) => {
          setWeatherLocationMode('custom');
          setWeatherCustomCity(city);
          localStorage.setItem('linkerru_weather_location_mode', 'custom');
          localStorage.setItem('linkerru_weather_custom_city', city);
          setWeatherError(false);
        }}
        onDisableWidget={() => {
          setIsWeatherDisabled(true);
          localStorage.setItem('linkerru_weather_disabled', 'true');
        }}
      />

      {/* Internal App Notification Permission Prompt Modal */}
      <AppNotifPromptModal
        isOpen={!!pendingNotifPromptApp}
        appId={pendingNotifPromptApp?.id || ''}
        appName={pendingNotifPromptApp?.name || ''}
        lang={lang}
        onRespond={(appId, allowed) => {
          handleAppNotifPermissionToggle(appId, allowed);
          setPendingNotifPromptApp(null);
        }}
      />

      {/* Proxy Server Node Selector Modal */}
      <ServerModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        lang={lang}
        selectedServer={selectedServer}
        onSelectServer={handleServerSelection}
        primaryColor={activePalette.primary}
        onOpenHub={(url) => openLinkerRoute(url)}
      />

    </motion.div>
    </>
  );
}

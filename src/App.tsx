import { LisyanConnectModal } from './components/LisyanConnectModal';
import { CLICK_SOUNDS, NOTIFICATION_SOUNDS } from './data/sounds';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { userAuth, userDb } from './lib/userFirebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  Server
} from 'lucide-react';

import { Language, ThemeMode, QuickLink, MAX_QUICK_LINKS, DEFAULT_QUICK_LINKS, ToggleId, TOGGLE_IDS, MAX_TOGGLES } from './types';
import { materialPalettes } from './data/themes';
import { translations } from './data/translations';
import { getGreeting } from './data/greetings';

// Components
import ClockModal from './components/ClockModal';
import CalendarModal from './components/CalendarModal';
import WeatherModal from './components/WeatherModal';
import SettingsModal from './components/SettingsModal';
import FullSettingsModal from './components/FullSettingsModal';
import { LoginScreen } from './components/LoginScreen';
import AppLoader from './components/AppLoader';
import { useWindows, WindowManagerLayer } from './components/WindowManager';
import { CalculatorApp } from './components/CalculatorApp';
import { KeepsApp } from './components/KeepsApp';
import ServerModal from './components/ServerModal';
import ChangelogModal from './components/ChangelogModal';
import StandbyClock from './components/StandbyClock';
import StandbySetupModal from './components/StandbySetupModal';
import NotificationsModal from './components/NotificationsModal';
import OnboardingModal from './components/OnboardingModal';
import { SpaceProxyApp } from './components/SpaceProxyApp';

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

  const [fontFamily, setFontFamily] = useState<string>(() => {
    return localStorage.getItem('linkerru_font') || '"Space Grotesk", "Inter", sans-serif';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('linkerru_theme') as ThemeMode) || 'light';
  });

  const [activePaletteId, setActivePaletteId] = useState<string>(() => {
    return localStorage.getItem('linkerru_accent') || 'monochrome';
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
  const [settingsInitialTab, setSettingsInitialTab] = useState<'appearance' | 'language' | 'notifications' | 'sound' | 'about' | 'security' | 'links' | 'toggles' | 'developer' | 'account'>('appearance');
  const [isServerOpen, setIsServerOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
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

  // Home screen version (hotswappable). Migrated from the old boolean flag.

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
          optimized_engine: isOptimizedEngine
        },
        updatedAt: Date.now()
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
              updatedAt: Date.now()
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
      root.style.setProperty('--bg', '#08080a');
      root.style.setProperty('--surface-dim', '#0e0e11');

      // ── Section 2/4: SURFACES (cards, panels, containers — layered elevation) ──
      root.style.setProperty('--surface', '#151518');
      root.style.setProperty('--surface-bright', '#1e1e22');
      root.style.setProperty('--container', '#1a1a1e');
      root.style.setProperty('--container-high', '#26262c');
      root.style.setProperty('--card-bg', `color-mix(in srgb, #151518 78%, ${activePalette.primary} 22%)`);
      root.style.setProperty('--panel-bg', `color-mix(in srgb, #151518 86%, ${activePalette.primary} 14%)`);

      // ── Section 3/4: CONTENT (text, icons, outlines — contrast & readability) ──
      root.style.setProperty('--on-surface', '#fafafa');
      root.style.setProperty('--on-surface-var', '#b4b4c0');
      root.style.setProperty('--outline', '#34343a');
      root.style.setProperty('--outline-var', '#44444c');
      root.style.setProperty('--icon-tint', `color-mix(in srgb, #151518 60%, ${activePalette.primary} 40%)`);

      // ── Section 4/4: ELEVATION (shadows — depth perception per M3 levels 1-3) ──
      root.style.setProperty('--shadow-1', '0 1px 2px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.35)');
      root.style.setProperty('--shadow-2', '0 6px 16px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.35)');
      root.style.setProperty('--shadow-3', '0 16px 40px rgba(0,0,0,0.6), 0 6px 12px rgba(0,0,0,0.4)');
    } else {
      // ── Section 1/4: BASE ──
      root.style.setProperty('--bg', '#fafafa');
      root.style.setProperty('--surface-dim', '#f4f4f5');

      // ── Section 2/4: SURFACES ──
      root.style.setProperty('--surface', '#ffffff');
      root.style.setProperty('--surface-bright', '#ffffff');
      root.style.setProperty('--container', '#f4f4f5');
      root.style.setProperty('--container-high', '#e4e4e7');
      root.style.setProperty('--card-bg', `color-mix(in srgb, #ffffff 70%, ${activePalette.primary} 30%)`);
      root.style.setProperty('--panel-bg', `color-mix(in srgb, #ffffff 80%, ${activePalette.primary} 20%)`);

      // ── Section 3/4: CONTENT ──
      root.style.setProperty('--on-surface', '#09090b');
      root.style.setProperty('--on-surface-var', '#52525b');
      root.style.setProperty('--outline', '#d4d4d8');
      root.style.setProperty('--outline-var', '#e4e4e7');
      root.style.setProperty('--icon-tint', `color-mix(in srgb, #ffffff 70%, ${activePalette.primary} 30%)`);

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

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.backgroundColor = isContrast 
      ? (theme === 'dark' ? '#000000' : '#ffffff') 
      : (theme === 'dark' ? '#09090b' : '#fafafa');
  }, [theme, activePaletteId, isContrast, fontFamily]);

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

  const handleOpenSettings = (tab: 'appearance' | 'language' | 'notifications' | 'sound' | 'about' | 'security' | 'links' | 'toggles' | 'developer' | 'account' = 'appearance') => {
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

  const openSettingsWindow = (tab: 'appearance' | 'language' | 'notifications' | 'sound' | 'about' | 'security' | 'links' | 'toggles' | 'developer' | 'account' = 'appearance') => {
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
            onMainWallpaperChange={(wp) => { setMainWallpaper(wp); localStorage.setItem('linkerru_wallpaper', wp); }}
            isAuthenticated={isAuthenticated}
            nickname={nickname}
            onNicknameChange={(n) => { setNickname(n); localStorage.setItem('linkerru_nickname', n); }}
            customLinks={customLinks}
            onLinksChange={handleLinksChange}
            activeToggles={activeToggles}
            onTogglesChange={handleTogglesChange}
            isOptimizedEngine={isOptimizedEngine}
            onOptimizedEngineToggle={() => {
              const n = !isOptimizedEngine;
              setIsOptimizedEngine(n);
              localStorage.setItem('linkerru_optimized_engine', String(n));
            }}
            initialTab={tab}
          />
        </div>
      ),
    });
  };

  const openLisyanWindow = () => {
    wm.open({
      id: 'lisyan',
      title: 'Lisyan Connect',
      icon: <Monitor size={14} className="text-[var(--on-surface)]" />,
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
            isMobileLayout={isMobileLayout}
          />
        </div>
      ),
    });
  };

  const openCalculatorWindow = () => {
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

  const openProxyWindow = () => {
    wm.open({
      id: 'proxy',
      title: lang === 'ru' ? 'Прокси-сервер' : 'Space Proxy Hub',
      icon: <Globe size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 900,
      initialHeight: 650,
      minWidth: 480,
      minHeight: 380,
      render: () => (
        <SpaceProxyApp
          lang={lang}
          selectedServer={selectedServer}
          onSelectServer={handleServerSelection}
          activePalette={activePalette}
          theme={theme}
        />
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
    setIsServerOpen(false);
    setTimeout(() => {
      openProxyWindow();
    }, 100);
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
      
      const combo = [...modifiers, key === ' ' ? 'Space' : key].join('+');
      
      if (combo === panicKey || e.key === panicKey) {
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
          theme === 'dark'
            ? "https://github.com/user-attachments/assets/9fad2245-28d1-4b70-a3ee-74e3d8a757e6"
            : "https://github.com/user-attachments/assets/4d4a877a-6135-4dc5-82fc-d3705c8fc142",
          "https://github.com/user-attachments/assets/939c90aa-0efa-4e50-b886-007111d41fa3",
        ]}
        minDuration={2500}
        color={activePalette.primary}
        background={getWallpaperStyle()}
        brightness={brightness}
        onComplete={onLoaderComplete}
      />
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
        <div className="flex flex-col flex-1 w-full max-w-md mx-auto justify-center gap-8 p-6 font-sans">
          
          <div className="flex justify-between items-start mb-6">
             <div className="flex flex-col">
               <h1 className="text-4xl font-black text-[var(--on-surface)] tracking-tight">LinkerRu<span className="text-[var(--outline-high)]">:Mobile</span></h1>
               <div className="flex items-center gap-2 mt-2">
                 <span className="text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider bg-[var(--surface-dim)] px-2 py-1 rounded-md border border-[var(--outline)]">
                   v.1.1m
                 </span>
                 <span className="text-[10px] font-bold text-[var(--outline-high)]">LISYAN X LINKERRU</span>
               </div>
             </div>
             
          </div>
          
          <div
            className="group relative overflow-hidden rounded-[2rem] p-8 cursor-pointer active:scale-[0.98] transition-all shadow-xl bg-[var(--surface-dim)] border border-[var(--outline)]"
            onClick={() => { openLisyanWindow(); }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-[0.03] -mr-10 -mt-10 pointer-events-none bg-[var(--on-surface)]" />
            
            <div className="flex flex-col h-full relative z-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-md bg-[var(--on-surface)] text-[var(--surface)]">
                <img src="https://github.com/user-attachments/assets/939c90aa-0efa-4e50-b886-007111d41fa3" alt="Lisyan Connect Logo" className="w-10 h-10 object-contain invert-0 dark:invert" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                <Monitor size={32} className="hidden" />
              </div>
              
              <h3 className="text-3xl font-black text-[var(--on-surface)] mb-2 tracking-tight">Lisyan Connect</h3>
              <p className="text-sm font-semibold text-[var(--on-surface-var)] leading-relaxed">
                {lang === 'ru' ? 'Быстрая P2P передача файлов между устройствами без ограничений.' : 'Fast P2P file transfer between devices without limits.'}
              </p>
              
              <div className="mt-8 flex items-center gap-2 text-[var(--surface)] font-bold text-sm bg-[var(--on-surface)] self-start px-4 py-2 rounded-full border border-[var(--outline-var)] shadow-sm group-hover:opacity-90 transition-opacity">
                {lang === 'ru' ? 'Открыть приложение' : 'Open Application'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </div>
            </div>
          </div>
          
        </div>
      ) : (
        <>
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
              handleOpenSettings();
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
          <AnimatePresence mode="wait">
            {greetingPhase === 'brand' ? (
              <motion.h1
                key="brand"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, filter: 'blur(8px)', y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--on-surface)]"
              >
                LinkerRu:Re
              </motion.h1>
            ) : (
              <motion.h1
                key="greeting"
                initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-3xl md:text-5xl font-black tracking-tight text-[var(--on-surface)]"
              >
                {greetingText}
              </motion.h1>
            )}
          </AnimatePresence>
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
          {proxyMinimized && <div className="running-pill"><span className="running-pill-dot" />{lang === 'ru' ? 'В фоне' : 'Running'}</div>}
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
          <div className="mt-4 flex gap-2 items-end">
            <button
              onClick={() => {
                playChime('click');
                setIsServerOpen(true);
              }}
              className="flex-1 py-3 rounded-full text-[10px] font-extrabold text-[var(--surface)] transition-all hover:scale-[1.02] shadow-md hover:shadow-lg active:scale-95 cursor-pointer text-center"
              style={{ backgroundColor: activePalette.primary }}
              id="proxy-card-open-btn"
            >
              {lang === 'ru' ? 'Открыть' : 'Open'}
            </button>
          </div>
        </div>

        {/* WIDGET 2: Agno GPT */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[240px] transition-all hover:scale-[1.02] active:scale-[0.98] relative" id="card-agno-gpt">
          {agnoMinimized && (
            <div className="running-pill"><span className="running-pill-dot" />{lang === 'ru' ? 'В фоне' : 'Running'}</div>
          )}
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
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => {
                  playChime('click');
                  openAgnoWindow();
                }}
                className="flex-1 py-3 rounded-full text-[10px] font-extrabold text-[var(--surface)] transition-all cursor-pointer text-center"
                style={{ backgroundColor: activePalette.primary }}
                id="agno-card-open-btn"
              >
                {lang === 'ru' ? 'Открыть' : 'Open'}
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
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[240px] transition-all hover:scale-[1.02] active:scale-[0.98] relative" id="card-lisyan-connect">
          {lisyanMinimized && (
            <div className="running-pill"><span className="running-pill-dot" />{lang === 'ru' ? 'В фоне' : 'Running'}</div>
          )}
          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl border border-[var(--outline)] overflow-hidden flex items-center justify-center shadow-inner" style={{ backgroundColor: activePalette.primary }}>
              <img src="https://github.com/user-attachments/assets/939c90aa-0efa-4e50-b886-007111d41fa3" alt="Lisyan Connect" className="w-full h-full object-cover p-1" />
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
                className="flex-1 py-3 rounded-full text-[10px] font-extrabold text-[var(--surface)] transition-all cursor-pointer text-center"
                style={{ backgroundColor: activePalette.primary }}
                onClick={() => { openLisyanWindow(); }}
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
              setIsWeatherOpen(true);
            }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-white/10" style={{ backgroundColor: activePalette.primary }}>
                <CloudSun size={24} className="text-white" />
              </div>
              <span className="text-[9px] font-bold text-[var(--on-surface)]">Weather</span>
            </div>

            {/* Settings App Shortcut */}
            <div className="relative flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => {
              playChime('click');
              handleOpenSettings();
            }}>
              {settingsMinimized && <div className="running-pill-mini" />}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-white/10 bg-[var(--surface-dim)]">
                <Settings size={24} className="text-[var(--on-surface)]" />
              </div>
              <span className="text-[9px] font-bold text-[var(--on-surface)]">Settings</span>
            </div>

            {/* Calculator App Shortcut */}
            <div className="relative flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => {
              playChime('click');
              openCalculatorWindow();
            }}>
              {calculatorMinimized && <div className="running-pill-mini" />}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-white/10" style={{ backgroundColor: activePalette.primary }}>
                <Calculator size={24} className="text-white" />
              </div>
              <span className="text-[9px] font-bold text-[var(--on-surface)]">{lang === 'ru' ? 'Калькулятор' : 'Calculator'}</span>
            </div>

            {/* Keeps App Shortcut — local notes with image support (cache only) */}
            <div className="relative flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => {
              playChime('click');
              openKeepsWindow();
            }}>
              {keepsMinimized && <div className="running-pill-mini" />}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-white/10 bg-[var(--surface-dim)]">
                <StickyNote size={24} className="text-[var(--accent)]" />
              </div>
              <span className="text-[9px] font-bold text-[var(--on-surface)]">{lang === 'ru' ? 'Заметки' : 'Keeps'}</span>
            </div>

            {/* Blank Placeholder Apps to match design */}
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

        {/* PANEL: Quick Links — max 4 (2 default + 2 custom) */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px] relative group" id="panel-links">
          <button
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--surface)] rounded-full border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] text-[var(--on-surface)] shadow-sm z-10"
            title={lang === 'ru' ? 'Изменить ссылки' : 'Edit Links'}
            onClick={() => {
              playChime('click');
              handleOpenSettings('links');
            }}
          >
            <Edit2 size={14} />
          </button>
          <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider mb-4">
            <Link2 size={16} />
            <span>{t.ph_links}</span>
            <span className="ml-auto text-[10px] tabular-nums text-[var(--outline)]">{customLinks.length}/{MAX_QUICK_LINKS}</span>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {customLinks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[11px] text-[var(--outline)] italic">
                {lang === 'ru' ? 'Нет ссылок' : 'No links'}
              </div>
            ) : (
              customLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!link.url || link.url === 'https://') return;
                      playChime('click');
                      window.open(link.url, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex-1 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--outline)] text-xs font-bold text-[var(--on-surface)] transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 overflow-hidden"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = activePalette.primary;
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--on-surface)';
                      e.currentTarget.style.borderColor = 'var(--outline)';
                    }}
                    title={link.url}
                  >
                    <Globe size={13} className="shrink-0" />
                    <span className="truncate text-left">{link.name || (lang === 'ru' ? 'Без названия' : 'Untitled')}</span>
                  </button>
                  <button
                    onClick={() => handleCopyLink(link.url)}
                    className="h-9 w-9 shrink-0 flex items-center justify-center rounded-2xl border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                    title={lang === 'ru' ? 'Копировать' : 'Copy Link'}
                  >
                    <Copy size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="text-[9px] font-black tracking-widest text-[var(--outline)] uppercase text-center mt-3">
            {t.ph_community}
          </div>
        </div>

        {/* PANEL: Quick Toggles — max 4 (theme/language/sound/contrast) */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px] relative group" id="panel-quicktoggles">
          <button
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--surface)] rounded-full border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] text-[var(--on-surface)] shadow-sm z-10"
            title={lang === 'ru' ? 'Изменить переключатели' : 'Edit Toggles'}
            onClick={() => {
              playChime('click');
              handleOpenSettings('toggles');
            }}
          >
            <Edit2 size={14} />
          </button>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider">
              <span>{t.ph_toggles}</span>
            </div>
            <span className="text-[10px] tabular-nums text-[var(--outline)]">{activeToggles.length}/{MAX_TOGGLES}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1">
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
                    label: lang === 'ru' ? 'Звук' : 'Sounds',
                    sub: isSoundEnabled ? (lang === 'ru' ? 'Вкл' : 'Enabled') : (lang === 'ru' ? 'Выкл' : 'Disabled'),
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
                }[id];

                return (
                  <button
                    key={id}
                    onClick={cfg.onClick}
                    className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3"
                  >
                    <div
                      className="p-2 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: cfg.active ? activePalette.primary : 'var(--surface-dim)',
                        color: cfg.active ? '#fff' : 'var(--on-surface)',
                      }}
                    >
                      {cfg.icon}
                    </div>
                    <div className="flex flex-col items-start text-left min-w-0">
                      <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight truncate">{cfg.label}</span>
                      <span className="text-[8px] text-[var(--on-surface-var)] truncate">{cfg.sub}</span>
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
              <span className="text-sm font-black text-[var(--on-surface)] leading-tight">
                {isAuthenticated ? nickname : (lang === 'ru' ? 'Гостевой аккаунт' : 'Guest Account')}
              </span>
              <span className="text-[10px] text-[var(--on-surface-var)] font-semibold mt-0.5">
                {isAuthenticated ? userAuth.currentUser?.email : 'guest@linker.os'}
              </span>
            </div>
            <button onClick={handleDestroySession} className="h-10 w-10 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface-var)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-sm" title={lang === 'ru' ? 'Выйти' : 'Log out'}>
              <LogOut size={16} />
            </button>
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={() => { playChime('click'); handleOpenSettings('account'); }} className="w-full py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--surface-dim)] transition-colors shadow-sm">
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

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          setIsOnboardingOpen(false);
          playChime('toast');
        }}
        lang={lang}
        onLangChange={(l) => {
          setLang(l);
          localStorage.setItem('linkerru_lang', l);
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
      />

      <div
        className="pointer-events-none fixed inset-0 z-[9999]"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${1 - brightness / 100})`,
          transition: 'background-color 0.3s'
        }}
      />


      {/* OS-style window manager layer (popup apps) */}
      <WindowManagerLayer wm={wm} lang={lang} isOptimizedEngine={isOptimizedEngine} isMobileLayout={isMobileLayout} />

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
    </motion.div>
    </>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TRANSLATIONS, type Lang, type TranslationKey } from "../lib/i18n";
import { Language, ThemeMode } from "../../../types";

export type Theme = "light" | "dark";
export type ThemeSetting = "system" | "light" | "dark";

interface SettingsValue {
  lang: Language;
  theme: Theme;
  themeSetting: ThemeSetting;
  setLang: (l: Language) => void;
  setTheme: (t: ThemeSetting) => void;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsValue | null>(null);

// APP-ONLY language key — independent from system linkerru_lang
const LANG_KEY = "lisyan_ai_lang";
const LEGACY_LANG_KEY = "linkerru_lang";
const THEME_KEY = "lisyan_theme_mode";

interface SettingsProviderProps {
  children: ReactNode;
  parentLang?: Language;
  onParentLangChange?: (l: Language) => void;
  parentTheme?: ThemeMode;
}

export function SettingsProvider({
  children,
  parentLang,
  onParentLangChange, // kept for compatibility but NOT used for app-only behavior
  parentTheme,
}: SettingsProviderProps) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      // 1. Check app-specific key first (app-only)
      const savedApp = localStorage.getItem(LANG_KEY);
      if (savedApp === "ru" || savedApp === "en" || savedApp === "uk") return savedApp as Language;
      // 2. If parentLang provided and no app setting yet, use it as initial default (one-time)
      if (parentLang && (parentLang === "ru" || parentLang === "en" || parentLang === "uk")) {
        return parentLang;
      }
      // 3. Legacy migration: if old system key exists and app key doesn't, migrate it
      const legacy = localStorage.getItem(LEGACY_LANG_KEY);
      if (legacy === "ru" || legacy === "en" || legacy === "uk") {
        localStorage.setItem(LANG_KEY, legacy);
        return legacy as Language;
      }
    } catch {}
    return "ru";
  });

  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(() => {
    const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem("lisyan_theme");
    if (saved === "light" || saved === "dark" || saved === "system") return saved as ThemeSetting;
    return "system";
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    try {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    } catch {
      media.addListener(handler);
      return () => media.removeListener(handler);
    }
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "linkerru_theme" && e.newValue) {
        setSystemIsDark(e.newValue === "dark");
      }
    };
    const handleCustomThemeChange = () => {
      const current = localStorage.getItem("linkerru_theme");
      if (current === "dark" || current === "light") {
        setSystemIsDark(current === "dark");
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("linkerru_theme_changed", handleCustomThemeChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("linkerru_theme_changed", handleCustomThemeChange);
    };
  }, []);

  const theme: Theme = useMemo(() => {
    if (themeSetting === "light") return "light";
    if (themeSetting === "dark") return "dark";
    if (parentTheme) return parentTheme;
    const parentSaved = typeof window !== "undefined" ? localStorage.getItem("linkerru_theme") : null;
    if (parentSaved === "dark" || parentSaved === "light") return parentSaved as Theme;
    return systemIsDark ? "dark" : "light";
  }, [themeSetting, parentTheme, systemIsDark]);

  // NOTE: Removed parentLang sync effect — app-only language, changing it does NOT affect system
  // Previously this caused Lisyan AI toggle to change entire system language

  const setLang = useCallback(
    (l: Language) => {
      setLangState(l);
      try {
        localStorage.setItem(LANG_KEY, l);
        // Dispatch app-only event, NOT system-wide
        window.dispatchEvent(new CustomEvent("lisyan_ai_lang_changed", { detail: l }));
        // IMPORTANT: Do NOT call onParentLangChange — app-only behavior
        // onParentLangChange?.(l); // disabled for app-only
        // Do NOT dispatch linkerru_lang_changed — that would change whole system
      } catch {}
    },
    [],
  );

  const setTheme = useCallback((t: ThemeSetting) => {
    setThemeSetting(t);
    localStorage.setItem(THEME_KEY, t);
    localStorage.setItem("lisyan_theme", t);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => {
      const activeLang = TRANSLATIONS[lang] ? lang : "ru";
      return TRANSLATIONS[activeLang][key] || TRANSLATIONS.ru[key] || "";
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, theme, themeSetting, setLang, setTheme, t }),
    [lang, theme, themeSetting, setLang, setTheme, t],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

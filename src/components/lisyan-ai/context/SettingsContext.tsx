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

const LANG_KEY = "linkerru_lang";
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
  onParentLangChange,
  parentTheme,
}: SettingsProviderProps) {
  const [lang, setLangState] = useState<Language>(() => {
    if (parentLang) return parentLang;
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ru" || saved === "en" || saved === "uk") return saved as Language;
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

  // Track OS system theme changes
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

  // Sync theme when parent theme changes or storage events fire
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "linkerru_theme" && e.newValue) {
        // Trigger re-render
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

  // Compute resolved theme
  const theme: Theme = useMemo(() => {
    if (themeSetting === "light") return "light";
    if (themeSetting === "dark") return "dark";
    // If system mode, prefer parentTheme if explicitly given, otherwise check parent localStorage, then OS dark mode
    if (parentTheme) return parentTheme;
    const parentSaved = typeof window !== "undefined" ? localStorage.getItem("linkerru_theme") : null;
    if (parentSaved === "dark" || parentSaved === "light") return parentSaved as Theme;
    return systemIsDark ? "dark" : "light";
  }, [themeSetting, parentTheme, systemIsDark]);

  // Keep language in sync when parent props change
  useEffect(() => {
    if (parentLang && parentLang !== lang) {
      setLangState(parentLang);
    }
  }, [parentLang]);

  const setLang = useCallback(
    (l: Language) => {
      setLangState(l);
      localStorage.setItem(LANG_KEY, l);
      window.dispatchEvent(new Event("linkerru_lang_changed"));
      onParentLangChange?.(l);
    },
    [onParentLangChange],
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

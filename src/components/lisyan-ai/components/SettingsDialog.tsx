import React from "react";
import { Check, Globe, Laptop, Moon, Sun, X } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { Language } from "../../../types";
import { cn } from "../utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: Props) {
  const { lang, setLang, themeSetting, setTheme, t } = useSettings();

  if (!open) return null;

  const languages: { code: Language; label: string }[] = [
    { code: "ru", label: "Русский" },
    { code: "uk", label: "Українська" },
    { code: "en", label: "English" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md animate-pop overflow-y-auto rounded-t-3xl border border-[var(--s-line)] bg-[var(--s-surface-1)] p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[var(--s-on-brand-container)]">{t("settingsTitle")}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--s-brand)] transition hover:bg-[var(--s-surface-2)] active:scale-90 cursor-pointer"
            title={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Language */}
        <section className="mb-5">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--s-brand)]">
            <Globe className="h-3.5 w-3.5" />
            {t("language")}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {languages.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-xs font-bold transition active:scale-[0.97] cursor-pointer",
                  lang === code
                    ? "border-[var(--s-brand)] bg-[var(--s-brand-container)] text-[var(--s-on-brand-container)] shadow-sm"
                    : "border-[var(--s-line)] bg-[var(--s-surface-2)] text-[var(--s-ink-soft)] hover:bg-[var(--s-surface-3)]",
                )}
              >
                <span>{label}</span>
                {lang === code && <Check className="h-3.5 w-3.5 text-[var(--s-brand)]" />}
              </button>
            ))}
          </div>
        </section>

        {/* Theme */}
        <section className="mb-2">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--s-brand)]">
            <Sun className="h-3.5 w-3.5" />
            {t("theme")}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTheme("system")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-xs font-bold transition active:scale-[0.97] cursor-pointer",
                themeSetting === "system"
                  ? "border-[var(--s-brand)] bg-[var(--s-brand-container)] text-[var(--s-on-brand-container)] shadow-sm"
                  : "border-[var(--s-line)] bg-[var(--s-surface-2)] text-[var(--s-ink-soft)] hover:bg-[var(--s-surface-3)]",
              )}
            >
              <Laptop className="h-3.5 w-3.5" />
              {lang === "ru" ? "Система" : lang === "uk" ? "Система" : "System"}
            </button>
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-xs font-bold transition active:scale-[0.97] cursor-pointer",
                themeSetting === "light"
                  ? "border-[var(--s-brand)] bg-[var(--s-brand-container)] text-[var(--s-on-brand-container)] shadow-sm"
                  : "border-[var(--s-line)] bg-[var(--s-surface-2)] text-[var(--s-ink-soft)] hover:bg-[var(--s-surface-3)]",
              )}
            >
              <Sun className="h-3.5 w-3.5" />
              {t("light")}
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-xs font-bold transition active:scale-[0.97] cursor-pointer",
                themeSetting === "dark"
                  ? "border-[var(--s-brand)] bg-[var(--s-brand-container)] text-[var(--s-on-brand-container)] shadow-sm"
                  : "border-[var(--s-line)] bg-[var(--s-surface-2)] text-[var(--s-ink-soft)] hover:bg-[var(--s-surface-3)]",
              )}
            >
              <Moon className="h-3.5 w-3.5" />
              {t("dark")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

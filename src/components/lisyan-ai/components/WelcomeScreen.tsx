import React from "react";
import { Compass, ImageIcon, Lightbulb, NotebookPen } from "lucide-react";
import Logo from "./Logo";
import { useSettings } from "../context/SettingsContext";
import type { TranslationKey } from "../lib/i18n";

const SUGGESTIONS: {
  icon: typeof Lightbulb;
  title: TranslationKey;
  subtitle: TranslationKey;
  prompt: TranslationKey;
}[] = [
  { icon: Lightbulb, title: "s1t", subtitle: "s1s", prompt: "s1p" },
  { icon: NotebookPen, title: "s2t", subtitle: "s2s", prompt: "s2p" },
  { icon: Compass, title: "s3t", subtitle: "s3s", prompt: "s3p" },
  { icon: ImageIcon, title: "s4t", subtitle: "s4s", prompt: "s4p" },
];

export default function WelcomeScreen({ onPick }: { onPick: (text: string) => void }) {
  const { t } = useSettings();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-8 select-none">
      <div className="relative z-10 flex flex-col items-center text-center">
        <Logo className="h-16 w-16 animate-pop shadow-md" />
        <h1 className="mt-4 max-w-md text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--s-on-brand-container)]">
          {t("greeting")}
        </h1>
        <p className="mt-1.5 max-w-sm text-sm text-[var(--s-ink-soft)] leading-relaxed">{t("greetingSub")}</p>
      </div>

      <div className="relative z-10 mt-8 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s.title}
            onClick={() => onPick(t(s.prompt))}
            style={{ animationDelay: `${i * 80}ms` }}
            className="group flex animate-fade-up items-start gap-3 rounded-2xl sm:rounded-3xl border border-[var(--s-line)] bg-[var(--s-surface-1)]/90 p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[var(--s-brand)] hover:shadow-md cursor-pointer"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--s-brand-container)] text-[var(--s-brand)] transition group-hover:scale-105">
              <s.icon className="h-4.5 w-4.5" />
            </span>
            <span>
              <span className="block text-xs sm:text-sm font-bold text-[var(--s-on-brand-container)]">{t(s.title)}</span>
              <span className="block text-[11px] text-[var(--s-ink-faint)]">{t(s.subtitle)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

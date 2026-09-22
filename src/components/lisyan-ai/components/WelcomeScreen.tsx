import React, { useState, useEffect } from "react";
import Logo from "./Logo";
import { useSettings } from "../context/SettingsContext";

export default function WelcomeScreen({ onPick }: { onPick?: (text: string) => void }) {
  const { lang } = useSettings();
  const [userName, setUserName] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("linkerru_nickname");
      if (stored && stored.trim()) return stored.trim();
    } catch {}
    return lang === "ru" ? "Гость" : lang === "uk" ? "Гість" : "Guest";
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem("linkerru_nickname");
        if (stored && stored.trim()) {
          setUserName(stored.trim());
        }
      } catch {}
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("linkerru_nickname_changed", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("linkerru_nickname_changed", handleSync);
    };
  }, []);

  const getGreeting = () => {
    if (lang === "ru") return `Добро пожаловать, ${userName}!`;
    if (lang === "uk") return `Ласкаво просимо, ${userName}!`;
    return `Welcome, ${userName}!`;
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12 select-none">
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        <Logo className="h-20 w-20 animate-pop shadow-lg" />
        <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--s-on-brand-container)]">
          {getGreeting()}
        </h1>
        <p className="mt-2 text-sm text-[var(--s-ink-soft)] leading-relaxed">
          {lang === "ru"
            ? "Чем я могу вам помочь сегодня?"
            : lang === "uk"
            ? "Чим я можу допомогти вам сьогодні?"
            : "How can I help you today?"}
        </p>
      </div>
    </div>
  );
}

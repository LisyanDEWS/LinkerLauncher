import React, { useState, useMemo } from "react";
import { MessageSquarePlus, MessageSquareText, PanelLeftClose, Settings, Sparkles, Trash2, Search, X } from "lucide-react";
import Logo from "./Logo";
import { cn } from "../utils/cn";
import { useSettings } from "../context/SettingsContext";
import type { Chat } from "../types";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string;
  onSelectChat: (id: string, targetMessageId?: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onOpenSettings: () => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenSettings,
  open,
  onClose,
}: SidebarProps) {
  const { t, lang } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matches: { chat: Chat; matchedSnippet?: string; targetMessageId?: string }[] = [];

    for (const chat of chats) {
      const titleMatch = (chat.title || "").toLowerCase().includes(q);
      let matchedSnippet: string | undefined;
      let targetMessageId: string | undefined;

      for (const msg of chat.messages) {
        const text = (msg.content || "").toLowerCase();
        const idx = text.indexOf(q);
        if (idx !== -1) {
          const start = Math.max(0, idx - 25);
          const end = Math.min(msg.content.length, idx + q.length + 35);
          matchedSnippet = (start > 0 ? "…" : "") + msg.content.slice(start, end).trim() + (end < msg.content.length ? "…" : "");
          targetMessageId = msg.id;
          break;
        }
      }

      if (titleMatch || matchedSnippet) {
        matches.push({ chat, matchedSnippet, targetMessageId });
      }
    }

    return matches;
  }, [chats, searchQuery]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed z-40 flex h-full w-[280px] flex-col gap-3 border-r border-[var(--s-line)] bg-[var(--s-surface)] p-4 transition-transform duration-300 ease-out md:static md:translate-x-0 shrink-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <div className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <div className="leading-tight">
              <p className="font-extrabold tracking-tight text-[var(--s-on-brand-container)]">Lisyan AI</p>
              <p className="text-[11px] font-medium text-[var(--s-brand)]">{t("appTagline")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--s-brand)] transition hover:bg-[var(--s-surface-3)] active:scale-90 md:hidden cursor-pointer"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={onNewChat}
          className="group flex items-center justify-center gap-2 rounded-full bg-[var(--s-brand)] px-5 py-3.5 font-bold text-white shadow-md transition active:scale-[0.97] hover:opacity-90 cursor-pointer"
        >
          <MessageSquarePlus className="h-5 w-5 transition group-active:rotate-90" />
          {t("newChat")}
        </button>

        {/* Smart Chat Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--s-ink-faint)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === "ru" ? "Поиск по всем чатам..." : "Search chats & messages..."}
            className="w-full rounded-2xl border border-[var(--s-line)] bg-[var(--s-surface-2)] py-2 pl-9 pr-8 text-xs font-medium text-[var(--s-ink)] placeholder-[var(--s-ink-faint)] focus:border-[var(--s-brand)] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-[var(--s-ink-faint)] hover:text-[var(--s-ink)] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl bg-[var(--s-surface-2)] px-3 py-1.5 text-[var(--s-brand)]">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">
            {searchResults ? (lang === "ru" ? "Результаты поиска" : "Search Results") : t("history")}
          </span>
        </div>

        {/* Chat List or Search Results */}
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {searchResults !== null ? (
            searchResults.length > 0 ? (
              searchResults.map(({ chat, matchedSnippet, targetMessageId }) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id, targetMessageId)}
                  className={cn(
                    "group flex w-full flex-col gap-1 rounded-2xl px-3.5 py-2.5 text-left text-xs transition cursor-pointer border border-transparent",
                    chat.id === activeChatId
                      ? "bg-[var(--s-brand-container)] text-[var(--s-on-brand-container)] border-[var(--s-brand)]/20"
                      : "text-[var(--s-ink-soft)] hover:bg-[var(--s-surface-2)]",
                  )}
                >
                  <div className="flex items-center gap-2 font-bold truncate">
                    <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-[var(--s-brand)]" />
                    <span className="truncate">{chat.title || t("newChat")}</span>
                  </div>
                  {matchedSnippet && (
                    <p className="text-[11px] text-[var(--s-ink-faint)] leading-snug line-clamp-2 bg-[var(--s-surface-1)]/60 px-2 py-1 rounded-lg">
                      {matchedSnippet}
                    </p>
                  )}
                </button>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-xs text-[var(--s-ink-faint)]">
                {lang === "ru" ? "Ничего не найдено" : "No matching chats found"}
              </p>
            )
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-2xl px-3.5 py-3 text-left text-sm font-medium transition cursor-pointer",
                  chat.id === activeChatId
                    ? "bg-[var(--s-brand-container)] text-[var(--s-on-brand-container)] shadow-xs"
                    : "text-[var(--s-ink-soft)] hover:bg-[var(--s-surface-2)]",
                )}
              >
                <MessageSquareText className="h-4 w-4 shrink-0 opacity-70" />
                <span className="flex-1 truncate">{chat.title || t("newChat")}</span>
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="rounded-full p-1.5 opacity-0 transition hover:bg-[var(--s-surface-3)] group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-500" />
                </span>
              </button>
            ))
          )}
          {chats.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-[var(--s-ink-faint)]">{t("noChats")}</p>
          )}
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-sm font-semibold text-[var(--s-ink-soft)] transition hover:bg-[var(--s-surface-2)] active:scale-[0.98] cursor-pointer"
        >
          <Settings className="h-4.5 w-4.5 text-[var(--s-brand)]" />
          {t("settings")}
        </button>
      </aside>
    </>
  );
}

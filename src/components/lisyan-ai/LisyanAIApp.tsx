import React, { useEffect, useRef, useState, useCallback, useMemo, useTransition } from "react";
import { Menu, Settings as SettingsIcon, Zap } from "lucide-react";
import Sidebar from "./components/Sidebar";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";
import WelcomeScreen from "./components/WelcomeScreen";
import SettingsDialog from "./components/SettingsDialog";
import { OptimizationStatsModal } from "./components/OptimizationStatsModal";
import Logo from "./components/Logo";
import { sendChatRequest, initLrouteWarmup } from "./lib/chatApi";
import { routeRequest, isTinyQuestion } from "./lib/optimizer/smartRouter";
import { getRamCacheSync } from "./lib/optimizer/cacheEngine";
import { detectInputLanguage } from "./lib/languageDetector";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import type { AttachedFile, Chat, Message, ModelId } from "./types";
import { Language, ThemeMode } from "../../types";

const STORAGE_KEY = "lisyan_chats_v3";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeChat(modelId: ModelId = "lnv1", defaultTitle: string = "New Chat"): Chat {
  return { id: makeId(), title: defaultTitle, messages: [], modelId, createdAt: Date.now() };
}

function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [makeChat()];
}

function ChatApp() {
  const { lang, theme, t } = useSettings();
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [activeChatId, setActiveChatId] = useState(() => chats[0]?.id || "");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingText, setEditingText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeChat = useMemo(() => chats.find((c) => c.id === activeChatId) ?? chats[0] ?? makeChat(), [chats, activeChatId]);

  // --- Performance: pre-warm and preconnect ---
  useEffect(() => {
    initLrouteWarmup();
    try {
      const links = [
        { rel: 'preconnect', href: 'https://api.groq.com' },
        { rel: 'preconnect', href: 'https://api.cerebras.ai' },
        { rel: 'dns-prefetch', href: 'https://api.groq.com' },
      ];
      links.forEach(({ rel, href }) => {
        if (!document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
          const l = document.createElement('link');
          l.rel = rel;
          l.href = href;
          document.head.appendChild(l);
        }
      });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const id = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
      }, 300);
      return () => clearTimeout(id);
    } catch {}
  }, [chats]);

  useEffect(() => {
    const lastMsg = activeChat?.messages[activeChat?.messages.length - 1];
    const isTiny = lastMsg ? isTinyQuestion(lastMsg.content) : false;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: isTiny ? 'instant' as any : 'smooth',
    });
  }, [activeChat?.messages.length, activeChat?.messages[activeChat?.messages.length - 1]?.content]);

  const updateChat = useCallback((id: string, updater: (chat: Chat) => Chat) => {
    startTransition(() => {
      setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
    });
  }, []);

  const handleNewChat = useCallback(() => {
    const chat = makeChat(activeChat?.modelId ?? "lnv1", t("newChat"));
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setSidebarOpen(false);
  }, [activeChat?.modelId, t]);

  const handleDeleteChat = useCallback((id: string) => {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeChatId) {
        if (next.length > 0) setActiveChatId(next[0].id);
        else {
          const fresh = makeChat("lnv1", t("newChat"));
          setActiveChatId(fresh.id);
          return [fresh];
        }
      }
      return next;
    });
  }, [activeChatId, t]);

  const handleSend = useCallback(async (text: string, attachments: AttachedFile[] = []) => {
    const chatId = activeChatId;
    const currentChat = chats.find((c) => c.id === chatId) ?? activeChat;
    const initialModelId = currentChat?.modelId ?? "lnv1";
    const routingDecision = routeRequest(text, attachments, initialModelId);
    const activeModelId = routingDecision.modelId;

    const userMsg: Message = {
      id: makeId(),
      role: "user",
      content: text,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantId = makeId();

    // --- Ultra-fast path: check RAM cache synchronously with DETECTED language (app-only + question language) ---
    const detectedForCache = detectInputLanguage(text, lang);
    const ramHit = getRamCacheSync(text, activeModelId, detectedForCache.code);
    if (ramHit && attachments.length === 0) {
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: ramHit.response,
        modelId: activeModelId,
        streaming: false,
        sources: [],
      };
      const title = text.trim() ? (text.length > 32 ? text.slice(0, 32) + "…" : text) : t("newChat");
      setChats((prev) => prev.map((c) => c.id === chatId ? {
        ...c,
        title: c.messages.length === 0 ? title : c.title,
        messages: [...c.messages, userMsg, assistantMsg],
      } : c));
      return;
    }

    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      modelId: activeModelId,
      streaming: true,
      sources: [],
    };

    const title = text.trim()
      ? text.length > 32
        ? text.slice(0, 32) + "…"
        : text
      : attachments[0]?.name ?? t("newChat");

    setChats((prev) => prev.map((c) => c.id === chatId ? {
      ...c,
      title: c.messages.length === 0 ? title : c.title,
      messages: [...c.messages, userMsg, assistantMsg],
    } : c));

    setIsGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = [...(currentChat?.messages ?? []), userMsg];
      const full = await sendChatRequest(
        history,
        activeModelId,
        lang,
        controller.signal,
        (notice) => {
          if (isTinyQuestion(text)) {
            setChats((prev) => prev.map((c) => c.id === chatId ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantId ? { ...m, content: notice, streaming: true } : m,
              ),
            } : c));
          } else {
            updateChat(chatId, (c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantId ? { ...m, content: notice, streaming: true } : m,
              ),
            }));
          }
        },
        (sources) => {
          updateChat(chatId, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantId ? { ...m, sources } : m,
            ),
          }));
        }
      );

      setChats((prev) => prev.map((c) => c.id === chatId ? {
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId ? { ...m, content: full, streaming: false } : m,
        ),
      } : c));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setIsGenerating(false);
        return;
      }
      const message = error instanceof Error ? error.message : t("noAnswer");
      setChats((prev) => prev.map((c) => c.id === chatId ? {
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: `${t("apiError")}\n\n${message}`, streaming: false }
            : m,
        ),
      } : c));
    } finally {
      setIsGenerating(false);
    }
  }, [activeChat, activeChatId, chats, lang, t, updateChat]);

  const handleEditMessage = useCallback((msg: Message) => {
    const msgIdx = activeChat.messages.findIndex((m) => m.id === msg.id);
    if (msgIdx !== -1) {
      setEditingText(msg.content);
      const pruned = activeChat.messages.slice(0, msgIdx);
      updateChat(activeChatId, (c) => ({
        ...c,
        messages: pruned,
      }));
    }
  }, [activeChat.messages, activeChatId, updateChat]);

  const handleRegenerateMessage = useCallback(async (msg: Message) => {
    if (isGenerating) return;
    const msgIdx = activeChat.messages.findIndex((m) => m.id === msg.id);
    if (msgIdx === -1) return;

    const prevHistory = activeChat.messages.slice(0, msgIdx);
    const assistantId = msg.id;
    updateChat(activeChatId, (c) => ({
      ...c,
      messages: c.messages.map((m) =>
        m.id === assistantId ? { ...m, content: "", streaming: true, sources: [] } : m
      ),
    }));

    setIsGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const full = await sendChatRequest(
        prevHistory,
        msg.modelId ?? activeChat.modelId ?? "lnv1",
        lang,
        controller.signal,
        (notice) => {
          updateChat(activeChatId, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantId ? { ...m, content: notice, streaming: true } : m
            ),
          }));
        },
        (sources) => {
          updateChat(activeChatId, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantId ? { ...m, sources } : m
            ),
          }));
        }
      );

      setChats((prev) => prev.map((c) => c.id === activeChatId ? {
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId ? { ...m, content: full, streaming: false } : m
        ),
      } : c));
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        const errTxt = error instanceof Error ? error.message : t("noAnswer");
        setChats((prev) => prev.map((c) => c.id === activeChatId ? {
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantId ? { ...m, content: `${t("apiError")}\n\n${errTxt}`, streaming: false } : m
          ),
        } : c));
      }
    } finally {
      setIsGenerating(false);
    }
  }, [activeChat.messages, activeChat.modelId, activeChatId, isGenerating, lang, t, updateChat]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setChats((prev) => prev.map((c) => c.id === activeChatId ? {
      ...c,
      messages: c.messages.map((m) =>
        m.streaming ? { ...m, content: m.content || t("stopped"), streaming: false } : m,
      ),
    } : c));
  }, [activeChatId, t]);

  const handleSelectChat = useCallback((id: string, targetMessageId?: string) => {
    setActiveChatId(id);
    setSidebarOpen(false);
    if (targetMessageId) {
      setTimeout(() => {
        const el = document.getElementById(`msg-${targetMessageId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-[var(--s-brand)]", "rounded-3xl");
          setTimeout(() => el.classList.remove("ring-2", "ring-[var(--s-brand)]"), 2500);
        }
      }, 150);
    }
  }, []);

  return (
    <div
      data-lisyan-theme={theme}
      className={`lisyan-app flex h-full w-full overflow-hidden bg-[var(--s-surface)] text-[var(--s-ink)] relative font-sans ${theme === "dark" ? "dark" : ""}`}
    >
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => {
          setSettingsOpen(true);
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col h-full">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--s-line)] bg-[var(--s-surface)]/90 px-4 py-2.5 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--s-brand)] transition hover:bg-[var(--s-surface-2)] active:scale-90 md:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Logo className="h-7 w-7" />
              <span className="font-extrabold text-[var(--s-on-brand-container)] text-sm sm:text-base tracking-tight">Lisyan AI</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStatsOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-[var(--s-brand)]/10 px-3 py-1.5 text-xs font-bold text-[var(--s-brand)] transition hover:bg-[var(--s-brand)]/20 active:scale-95 cursor-pointer"
              title={lang === "ru" ? "Статистика оптимизации" : lang === "uk" ? "Статистика оптимізації" : "Optimization Stats"}
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span className="hidden sm:inline">Lroutev1 ⚡ Compound</span>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--s-brand)] transition hover:bg-[var(--s-surface-2)] active:scale-90 cursor-pointer"
              title={t("settings")}
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto custom-scrollbar will-change-scroll">
          {activeChat?.messages.length === 0 ? (
            <WelcomeScreen onPick={(p) => handleSend(p, [])} />
          ) : (
            <div className="mx-auto w-full max-w-3xl flex-1 space-y-5 py-5">
              {activeChat?.messages.map((m) => (
                <div id={`msg-${m.id}`} key={m.id} className="transition-all duration-200">
                  <MessageBubble
                    message={m}
                    onEdit={m.role === "user" ? handleEditMessage : undefined}
                    onRegenerate={m.role === "assistant" ? handleRegenerateMessage : undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </main>

        <div className="shrink-0 pt-2">
          <ChatInput
            onSend={handleSend}
            disabled={isGenerating}
            onStop={handleStop}
            initialText={editingText ?? undefined}
            onTextConsumed={() => setEditingText(null)}
          />
        </div>
      </div>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <OptimizationStatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
      />
    </div>
  );
}

export interface LisyanAIAppProps {
  lang?: Language;
  onLangChange?: (l: Language) => void;
  theme?: ThemeMode;
}

export function LisyanAIApp({ lang, onLangChange, theme }: LisyanAIAppProps) {
  return (
    <SettingsProvider parentLang={lang} onParentLangChange={onLangChange} parentTheme={theme}>
      <ChatApp />
    </SettingsProvider>
  );
}

export default LisyanAIApp;

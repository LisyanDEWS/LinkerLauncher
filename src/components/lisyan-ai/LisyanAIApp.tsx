import React, { useEffect, useRef, useState } from "react";
import { Menu, Settings as SettingsIcon, Zap } from "lucide-react";
import Sidebar from "./components/Sidebar";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";
import WelcomeScreen from "./components/WelcomeScreen";
import SettingsDialog from "./components/SettingsDialog";
import { OptimizationStatsModal } from "./components/OptimizationStatsModal";
import Logo from "./components/Logo";
import { sendChatRequest } from "./lib/chatApi";
import { routeRequest } from "./lib/optimizer/smartRouter";
import { getModel } from "./data/models";
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

  const activeChat = chats.find((c) => c.id === activeChatId) ?? chats[0] ?? makeChat();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch {}
  }, [chats]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeChat?.messages.length, activeChat?.messages[activeChat?.messages.length - 1]?.content]);

  const updateChat = (id: string, updater: (chat: Chat) => Chat) => {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  };

  const handleNewChat = () => {
    const chat = makeChat(activeChat?.modelId ?? "lnv1", t("newChat"));
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setSidebarOpen(false);
  };

  const handleDeleteChat = (id: string) => {
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
  };

  const handleSend = async (text: string, attachments: AttachedFile[] = []) => {
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

    updateChat(chatId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? title : c.title,
      messages: [...c.messages, userMsg, assistantMsg],
    }));

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
          updateChat(chatId, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantId ? { ...m, content: notice, streaming: true } : m,
            ),
          }));
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

      updateChat(chatId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId ? { ...m, content: full, streaming: false } : m,
        ),
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setIsGenerating(false);
        return;
      }
      const message = error instanceof Error ? error.message : t("noAnswer");
      updateChat(chatId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: `${t("apiError")}\n\n${message}`, streaming: false }
            : m,
        ),
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditMessage = (msg: Message) => {
    // Fill text into ChatInput and optionally prune messages from that point
    const msgIdx = activeChat.messages.findIndex((m) => m.id === msg.id);
    if (msgIdx !== -1) {
      setEditingText(msg.content);
      // Prune history to right before this prompt
      const pruned = activeChat.messages.slice(0, msgIdx);
      updateChat(activeChatId, (c) => ({
        ...c,
        messages: pruned,
      }));
    }
  };

  const handleRegenerateMessage = async (msg: Message) => {
    if (isGenerating) return;
    const msgIdx = activeChat.messages.findIndex((m) => m.id === msg.id);
    if (msgIdx === -1) return;

    // Find the previous user message
    const prevHistory = activeChat.messages.slice(0, msgIdx);
    const lastUserMsg = [...prevHistory].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

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

      updateChat(activeChatId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId ? { ...m, content: full, streaming: false } : m
        ),
      }));
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        const errTxt = error instanceof Error ? error.message : t("noAnswer");
        updateChat(activeChatId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantId ? { ...m, content: `${t("apiError")}\n\n${errTxt}`, streaming: false } : m
          ),
        }));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
    updateChat(activeChatId, (c) => ({
      ...c,
      messages: c.messages.map((m) =>
        m.streaming ? { ...m, content: m.content || t("stopped"), streaming: false } : m,
      ),
    }));
  };

  const handleSelectChat = (id: string, targetMessageId?: string) => {
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
  };

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
              <span className="hidden sm:inline">Lroutev1 Engine</span>
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

        <main ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto custom-scrollbar">
          {activeChat?.messages.length === 0 ? (
            <WelcomeScreen onPick={(p) => handleSend(p, [])} />
          ) : (
            <div className="mx-auto w-full max-w-3xl flex-1 space-y-5 py-5">
              {activeChat?.messages.map((m) => (
                <div id={`msg-${m.id}`} key={m.id} className="transition-all duration-300">
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ArrowLeft, ChevronRight } from 'lucide-react';
import { Language } from '../types';

interface SpaceProxyCardProps {
  lang: Language;
  theme: 'light' | 'dark';
  activePalette: {
    primary: string;
    secondary?: string;
    tertiary?: string;
  };
  proxyMinimized?: boolean;
  onOpenHub: (url: string, serverName: string) => void;
  playChime: (sound?: 'click' | 'alert' | 'reset' | 'victory' | 'toast') => void;
}

const DEFAULT_SERVERS: { id: string; nameRu: string; nameEn: string; url: string; subRu: string; subEn: string }[] = [
  {
    id: 'server-1',
    nameRu: 'Сервер 1',
    nameEn: 'Server 1',
    url: 'https://english.neeb.wtf/',
    subRu: 'Основной',
    subEn: 'Primary',
  },
  {
    id: 'server-2',
    nameRu: 'Сервер 2',
    nameEn: 'Server 2',
    url: 'https://math.soyescalahumana.cl/',
    subRu: 'Зеркало 2',
    subEn: 'Mirror 2',
  },
  {
    id: 'server-3',
    nameRu: 'Сервер 3',
    nameEn: 'Server 3',
    url: 'https://sp2.simplysweetcakesoc.com/',
    subRu: 'Зеркало 3',
    subEn: 'Mirror 3',
  },
];

export function SpaceProxyCard({
  lang,
  theme,
  activePalette,
  proxyMinimized,
  onOpenHub,
  playChime,
}: SpaceProxyCardProps) {
  const isRu = lang === 'ru';
  const [isSelectingServer, setIsSelectingServer] = useState(false);
  const [lastSelectedUrl, setLastSelectedUrl] = useState<string>(() => {
    return localStorage.getItem('linkerru_server_url') || 'https://english.neeb.wtf/';
  });
  const [clickCounts, setClickCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('linkerru_proxy_server_clicks');
      return saved ? JSON.parse(saved) : { 'server-1': 0, 'server-2': 0, 'server-3': 0 };
    } catch {
      return { 'server-1': 0, 'server-2': 0, 'server-3': 0 };
    }
  });

  // Calculate relative ranking based on click frequencies
  const counts = Object.values(clickCounts).map((v) => Number(v) || 0);
  const maxClicks = Math.max(1, ...counts);
  const totalClicks = counts.reduce((acc, curr) => acc + curr, 0);

  const getShadingStyle = (serverId: string) => {
    const count = Number(clickCounts[serverId]) || 0;
    if (totalClicks === 0) {
      if (serverId === 'server-1') {
        return theme === 'dark'
          ? {
              backgroundColor: 'color-mix(in srgb, var(--accent) 35%, var(--surface-dim))',
              borderColor: 'var(--accent)',
              color: 'var(--on-surface)',
            }
          : {
              backgroundColor: 'color-mix(in srgb, var(--accent) 85%, #000000)',
              borderColor: 'transparent',
              color: '#ffffff',
            };
      }
      return {
        backgroundColor: 'var(--container)',
        borderColor: 'var(--outline-var)',
        color: 'var(--on-surface)',
      };
    }

    const ratio = count / maxClicks; // 0.0 to 1.0

    if (theme === 'dark') {
      if (ratio >= 0.8) {
        return {
          backgroundColor: 'color-mix(in srgb, var(--accent) 45%, #050505)',
          borderColor: 'var(--accent)',
          color: '#ffffff',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
        };
      }
      if (ratio >= 0.4) {
        return {
          backgroundColor: 'color-mix(in srgb, var(--accent) 22%, var(--surface-dim))',
          borderColor: 'color-mix(in srgb, var(--accent) 40%, var(--outline))',
          color: 'var(--on-surface)',
        };
      }
      return {
        backgroundColor: 'var(--container)',
        borderColor: 'var(--outline-var)',
        color: 'var(--on-surface-var)',
      };
    } else {
      if (ratio >= 0.8) {
        return {
          backgroundColor: 'color-mix(in srgb, var(--accent) 85%, #000000)',
          borderColor: 'transparent',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        };
      }
      if (ratio >= 0.4) {
        return {
          backgroundColor: 'color-mix(in srgb, var(--accent) 35%, var(--surface))',
          borderColor: 'color-mix(in srgb, var(--accent) 50%, var(--outline))',
          color: 'var(--on-surface)',
        };
      }
      return {
        backgroundColor: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
        borderColor: 'var(--outline-var)',
        color: 'var(--on-surface)',
      };
    }
  };

  const handleSelectServer = (server: (typeof DEFAULT_SERVERS)[0]) => {
    playChime('click');
    const updated = {
      ...clickCounts,
      [server.id]: (clickCounts[server.id] || 0) + 1,
    };
    setClickCounts(updated);
    setLastSelectedUrl(server.url);
    try {
      localStorage.setItem('linkerru_proxy_server_clicks', JSON.stringify(updated));
      localStorage.setItem('linkerru_server_url', server.url);
      localStorage.setItem('linkerru_server', isRu ? server.nameRu : server.nameEn);
    } catch (e) {
      console.error(e);
    }

    onOpenHub(server.url, isRu ? server.nameRu : server.nameEn);
    setTimeout(() => {
      setIsSelectingServer(false);
    }, 350);
  };

  return (
    <div
      className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between h-[260px] min-h-[260px] max-h-[260px] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-default group relative overflow-hidden"
      id="card-linker-route"
    >
      {proxyMinimized && (
        <div className="running-pill">
          <span className="running-pill-dot" />
          {isRu ? 'В фоне' : 'Running'}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isSelectingServer ? (
          /* FRONT VIEW */
          <motion.div
            key="front"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col justify-between h-full w-full"
          >
            {/* Top row: Icon only */}
            <div className="flex justify-between items-start h-[44px]">
              <div
                className="w-11 h-11 rounded-2xl border border-[var(--btn-border)] flex items-center justify-center shadow-inner"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary,
                }}
              >
                <Globe
                  size={20}
                  className={theme === 'dark' ? 'text-[var(--on-surface)]' : 'text-white'}
                />
              </div>
            </div>

            {/* Middle: Title and description */}
            <div className="flex-1 mt-2 flex flex-col pr-2">
              <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">
                Space Proxy Hub
              </h3>
              <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
                {isRu
                  ? 'Современный, чистый веб-прокси — игры, приложения и безопасный доступ без ограничений.'
                  : 'Modern, clean web proxy — games, apps, and unrestricted browsing.'}
              </p>
            </div>

            {/* Bottom: Single Open Button */}
            <div className="mt-3">
              <button
                onClick={() => {
                  playChime('click');
                  setIsSelectingServer(true);
                }}
                className="w-full py-3.5 rounded-full text-xs font-extrabold border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-center shadow-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--btn-bg)' : activePalette.primary,
                  borderColor: theme === 'dark' ? 'var(--btn-border)' : 'transparent',
                  color: theme === 'dark' ? 'var(--on-surface)' : '#ffffff',
                  boxShadow:
                    theme === 'dark' ? undefined : `0 4px 12px ${activePalette.primary}40`,
                }}
                id="proxy-card-open-btn"
              >
                <span>{isRu ? 'Открыть' : 'Open'}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          /* SERVER SELECTION VIEW */
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col justify-between h-full w-full"
          >
            {/* Header with back button */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[var(--outline-var)]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playChime('click');
                    setIsSelectingServer(false);
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--container)] transition-colors cursor-pointer"
                  title={isRu ? 'Назад' : 'Back'}
                >
                  <ArrowLeft size={14} />
                </button>
                <span className="text-xs font-black text-[var(--on-surface)] tracking-tight">
                  {isRu ? 'Выберите сервер чтобы продолжить' : 'Select a server to continue'}
                </span>
              </div>
            </div>

            {/* 3 Server Buttons */}
            <div className="flex flex-col gap-2 my-auto">
              {DEFAULT_SERVERS.map((server) => {
                const style = getShadingStyle(server.id);
                const isSelectedPreviously = lastSelectedUrl === server.url;

                return (
                  <button
                    key={server.id}
                    onClick={() => handleSelectServer(server)}
                    className="w-full px-3.5 py-2 rounded-2xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                    style={style}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black truncate">
                          {isRu ? server.nameRu : server.nameEn}
                        </span>
                        {isSelectedPreviously && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-black/25 text-current shadow-xs">
                            {isRu ? 'Выбирали ранее' : 'Previously selected'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] opacity-80 truncate font-semibold mt-0.5">
                        {isRu ? server.subRu : server.subEn}
                      </span>
                    </div>

                    <ChevronRight size={14} className="shrink-0 opacity-70" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

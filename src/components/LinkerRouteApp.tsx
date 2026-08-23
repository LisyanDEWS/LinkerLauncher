import React, { useState } from 'react';
import { Language } from '../types';
import {
  Globe,
  RotateCw,
  ExternalLink,
  Shield,
  Server,
  ChevronDown,
  Search,
  Zap,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PROXY_SERVERS, ProxyServerNode } from './ServerModal';

interface LinkerRouteAppProps {
  lang: Language;
  selectedServer: string;
  onSelectServer: (server: string) => void;
  activePalette: any;
  theme: 'light' | 'dark';
  initialUrl?: string;
}

const PRESET_BOOKMARKS = [
  { name: 'Google', url: 'https://www.google.com/webhp?igu=1', icon: '🔍' },
  { name: 'Space Hub', url: 'https://gointospace.app/', icon: '🚀' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org/', icon: '📚' },
  { name: 'Nexus Games', url: 'https://nexus-game-box.vercel.app/', icon: '🎮' },
  { name: 'GitHub', url: 'https://github.com/', icon: '🐙' },
  { name: 'Discord Web', url: 'https://discord.com/app', icon: '💬' },
];

export function LinkerRouteApp({
  lang,
  selectedServer,
  onSelectServer,
  activePalette,
  theme,
  initialUrl,
}: LinkerRouteAppProps) {
  const isRu = lang === 'ru';
  
  // Find current server node or default
  const activeNode = PROXY_SERVERS.find(
    (s) => s.name === selectedServer || s.id === selectedServer
  ) || PROXY_SERVERS[0];

  const defaultBaseUrl = localStorage.getItem('linkerru_server_url') || activeNode.url;

  const [inputUrl, setInputUrl] = useState(initialUrl || defaultBaseUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl || defaultBaseUrl);
  const [iframeKey, setIframeKey] = useState(0);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = (targetUrl: string) => {
    let finalUrl = targetUrl.trim();
    if (!finalUrl) return;

    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = `https://${finalUrl}`;
      } else {
        // Search query
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}&igu=1`;
      }
    }

    setInputUrl(finalUrl);
    setCurrentUrl(finalUrl);
    setIsLoading(true);
    setIframeKey((k) => k + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate(inputUrl);
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((k) => k + 1);
  };

  const handleOpenExternal = () => {
    try {
      const win = window.open('about:blank', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Space Proxy Hub</title>
              <style>body, html { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#000; } iframe { width:100%; height:100%; border:none; }</style>
            </head>
            <body>
              <iframe src="${currentUrl}" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"></iframe>
            </body>
          </html>
        `);
        win.document.close();
      }
    } catch {
      window.open(currentUrl, '_blank');
    }
  };

  const handleSelectNode = (node: ProxyServerNode) => {
    onSelectServer(node.name);
    localStorage.setItem('linkerru_server_url', node.url);
    setIsServerDropdownOpen(false);
    handleNavigate(node.url);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[var(--surface)] text-[var(--on-surface)] select-none">
      {/* Top Address & Controls Toolbar */}
      <div className="flex flex-col gap-2 p-3 bg-[var(--surface-dim)] border-b border-[var(--outline-var)] shrink-0">
        <div className="flex items-center gap-2">
          {/* Node Selector Capsule */}
          <div className="relative">
            <button
              onClick={() => setIsServerDropdownOpen(!isServerDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] border border-[var(--btn-border)] text-xs font-bold transition-all shadow-xs cursor-pointer"
              title={isRu ? 'Выбрать серверный узел' : 'Switch proxy node'}
            >
              <Server size={14} className="text-[var(--accent)]" />
              <span className="max-w-[110px] truncate">{activeNode.name}</span>
              <span className="text-[10px] text-emerald-500 font-extrabold tabular-nums">
                {activeNode.basePing}ms
              </span>
              <ChevronDown size={12} className="text-[var(--on-surface-var)] opacity-70" />
            </button>

            {/* Server Dropdown Popover */}
            {isServerDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1.5 z-50 w-64 p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline)] shadow-2xl flex flex-col gap-1 backdrop-blur-md"
                style={{ background: 'color-mix(in srgb, var(--surface) 98%, transparent)' }}
              >
                <div className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--on-surface-var)] flex items-center justify-between">
                  <span>{isRu ? 'Серверные узлы' : 'Proxy Nodes'}</span>
                  <Zap size={10} className="text-[var(--accent)]" />
                </div>
                {PROXY_SERVERS.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      node.name === selectedServer || node.id === selectedServer
                        ? 'bg-[var(--surface-dim)] border border-[var(--accent)] text-[var(--accent)]'
                        : 'hover:bg-[var(--container)] text-[var(--on-surface)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{node.flag}</span>
                      <div className="min-w-0">
                        <span className="block truncate text-[11px] font-extrabold">{node.name}</span>
                        <span className="text-[9px] text-[var(--on-surface-var)]">{node.region}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-500 tabular-nums shrink-0 ml-2">
                      {node.basePing}ms
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <button
            onClick={handleReload}
            className="p-2 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] border border-[var(--btn-border)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-all cursor-pointer shrink-0"
            title={isRu ? 'Обновить страницу' : 'Reload frame'}
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin text-[var(--accent)]' : ''} />
          </button>

          {/* URL Search / Address Bar */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center relative">
            <div className="absolute left-3 text-[var(--on-surface-var)] pointer-events-none flex items-center">
              <Search size={13} />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder={isRu ? 'Введите URL или поисковый запрос...' : 'Enter URL or search...'}
              className="w-full pl-8 pr-20 py-1.5 rounded-xl bg-[var(--btn-bg)] border border-[var(--btn-border)] text-xs font-semibold text-[var(--on-surface)] placeholder-[var(--on-surface-var)]/60 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <div className="absolute right-1 flex items-center gap-1">
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white bg-[var(--accent)] hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                {isRu ? 'Перейти' : 'Go'}
              </button>
            </div>
          </form>

          {/* Open in Disguised Blank Tab */}
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] border border-[var(--btn-border)] text-xs font-bold text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-all cursor-pointer shrink-0 shadow-xs"
            title={isRu ? 'Открыть в скрытой вкладке (about:blank)' : 'Open in masked tab (about:blank)'}
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline text-[11px]">{isRu ? 'Вкладка' : 'New Tab'}</span>
          </button>
        </div>

        {/* Quick Access Bookmarks Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-[var(--on-surface-var)] pr-1.5 border-r border-[var(--outline-var)] shrink-0">
            <Layers size={11} className="text-[var(--accent)]" />
            <span>{isRu ? 'Закладки' : 'Quick'}</span>
          </div>

          {PRESET_BOOKMARKS.map((bm) => (
            <button
              key={bm.name}
              onClick={() => handleNavigate(bm.url)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] border border-[var(--btn-border)] text-xs font-semibold text-[var(--on-surface)] hover:text-[var(--accent)] transition-all cursor-pointer shrink-0"
            >
              <span>{bm.icon}</span>
              <span className="text-[10px] font-bold">{bm.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main iFrame Display Viewport */}
      <div className="relative flex-1 w-full h-full bg-[var(--surface-dim)] overflow-hidden">
        <iframe
          key={iframeKey}
          src={currentUrl}
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-none bg-[var(--surface)]"
          title="Space Proxy Hub Frame"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
          allow="fullscreen; autoplay; clipboard-read; clipboard-write"
        />

        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--accent)] animate-pulse" />
        )}
      </div>
    </div>
  );
}

export const SpaceProxyHubApp = LinkerRouteApp;

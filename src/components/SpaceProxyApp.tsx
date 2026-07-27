import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Server, ArrowLeft, RotateCw, ExternalLink, 
  Shield, Activity, Wifi, Home, Check, ChevronRight, Search 
} from 'lucide-react';
import { Language } from '../types';

interface SpaceProxyAppProps {
  lang: Language;
  selectedServer: string;
  onSelectServer: (server: string) => void;
  activePalette: any;
  theme: 'light' | 'dark';
}

interface PresetSite {
  nameRu: string;
  nameEn: string;
  url: string;
  descriptionRu: string;
  descriptionEn: string;
  iconColor: string;
}

export function SpaceProxyApp({
  lang,
  selectedServer,
  onSelectServer,
  activePalette,
  theme,
}: SpaceProxyAppProps) {
  const [urlInput, setUrlInput] = useState('');
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingLogs, setConnectingLogs] = useState<string[]>([]);
  const [simulatedPings, setSimulatedPings] = useState<Record<string, number>>({
    'Server 1': 42,
    'Server 2': 78,
    'Server 3': 115,
  });

  // Randomize pings slightly to look realistic
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedPings(prev => ({
        'Server 1': Math.max(30, prev['Server 1'] + Math.floor(Math.random() * 7) - 3),
        'Server 2': Math.max(65, prev['Server 2'] + Math.floor(Math.random() * 9) - 4),
        'Server 3': Math.max(100, prev['Server 3'] + Math.floor(Math.random() * 11) - 5),
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const servers = [
    { id: 'S1', name: 'Server 1', region: lang === 'ru' ? 'Нью-Йорк, США' : 'New York, USA', security: 'AES-256' },
    { id: 'S2', name: 'Server 2', region: lang === 'ru' ? 'Франкфурт, Германия' : 'Frankfurt, Germany', security: 'AES-256' },
    { id: 'S3', name: 'Server 3', region: lang === 'ru' ? 'Сингапур' : 'Singapore', security: 'AES-GCM' },
  ];

  const presetSites: PresetSite[] = [
    {
      nameRu: 'Википедия',
      nameEn: 'Wikipedia',
      url: 'https://en.m.wikipedia.org/',
      descriptionRu: 'Свободная энциклопедия в удобном мобильном формате.',
      descriptionEn: 'The free encyclopedia in a clean mobile view.',
      iconColor: '#3b82f6',
    },
    {
      nameRu: 'DuckDuckGo HTML',
      nameEn: 'DuckDuckGo HTML',
      url: 'https://html.duckduckgo.com/html/',
      descriptionRu: 'Поисковая система, не отслеживающая ваши данные.',
      descriptionEn: 'Privacy-focused search engine (HTML layout).',
      iconColor: '#10b981',
    },
    {
      nameRu: 'Карты OpenStreetMap',
      nameEn: 'OpenStreetMap',
      url: 'https://www.openstreetmap.org/export/embed.html',
      descriptionRu: 'Интерактивные открытые географические карты.',
      descriptionEn: 'Collaborative, open geographical maps.',
      iconColor: '#f59e0b',
    },
    {
      nameRu: 'Архив Интернета',
      nameEn: 'Internet Archive',
      url: 'https://archive.org/embed/',
      descriptionRu: 'Миллионы бесплатных книг, фильмов, ПО и музыки.',
      descriptionEn: 'Millions of free books, movies, software, and music.',
      iconColor: '#8b5cf6',
    },
    {
      nameRu: 'CodePen',
      nameEn: 'CodePen Sandbox',
      url: 'https://codepen.io/',
      descriptionRu: 'Песочница для фронтенд разработчиков.',
      descriptionEn: 'Social development environment for front-end.',
      iconColor: '#ec4899',
    }
  ];

  const handleLaunchUrl = (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    
    let formattedUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setIsConnecting(true);
    setConnectingLogs([]);
    
    const logs = lang === 'ru' ? [
      `[СИСТЕМА] Инициализация прокси-соединения...`,
      `[DNS] Поиск маршрута для ${new URL(formattedUrl).hostname || formattedUrl}...`,
      `[УЗЕЛ] Подключение через прокси ${selectedServer} (${simulatedPings[selectedServer]}мс)...`,
      `[ШИФРОВАНИЕ] Обмен ключами безопасности TLS...`,
      `[СТАТУС] Защищенный туннель построен успешно!`
    ] : [
      `[SYSTEM] Initializing proxy connection...`,
      `[DNS] Looking up route to ${new URL(formattedUrl).hostname || formattedUrl}...`,
      `[NODE] Routing through ${selectedServer} proxy (${simulatedPings[selectedServer]}ms)...`,
      `[CIPHER] Exchanging security keys over TLS...`,
      `[STATUS] Protected tunnel established successfully!`
    ];

    let currentLogIndex = 0;
    const logInterval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setConnectingLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(logInterval);
        setTimeout(() => {
          setIsConnecting(false);
          setActiveUrl(formattedUrl);
          setUrlInput(formattedUrl);
          setIframeKey(prev => prev + 1);
        }, 400);
      }
    }, 150);
  };

  const handleReload = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleGoHome = () => {
    setActiveUrl(null);
    setUrlInput('');
  };

  return (
    <div className="flex h-full w-full flex-col bg-[var(--surface-dim)] text-[var(--on-surface)] select-none">
      {/* --- TOP ADDRESS BAR --- */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--outline-var)] bg-[var(--surface)] p-3 shadow-sm">
        <div className="flex items-center gap-2">
          {activeUrl && (
            <button
              onClick={handleGoHome}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--container)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-colors cursor-pointer"
              title={lang === 'ru' ? 'На главную' : 'Back to Home'}
            >
              <Home size={15} />
            </button>
          )}
          <button
            onClick={handleReload}
            className={`flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--container)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-colors cursor-pointer ${activeUrl ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
            title={lang === 'ru' ? 'Обновить' : 'Reload'}
          >
            <RotateCw size={14} />
          </button>
        </div>

        {/* URL Input Area */}
        <form 
          className="flex flex-1 items-center gap-2 max-w-xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            handleLaunchUrl(urlInput);
          }}
        >
          <div className="relative flex-1 flex items-center">
            <Globe size={14} className="absolute left-3 text-[var(--on-surface-var)] opacity-60" />
            <input
              type="text"
              placeholder={lang === 'ru' ? 'Введите URL (например: wikipedia.org)...' : 'Enter URL (e.g. wikipedia.org)...'}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-full border border-[var(--outline)] bg-[var(--surface-dim)] text-xs font-semibold text-[var(--on-surface)] focus:border-[var(--on-surface)] focus:outline-none transition-all placeholder:opacity-50"
            />
          </div>
          <button
            type="submit"
            className="px-4 h-9 rounded-full text-xs font-black text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            style={{ backgroundColor: activePalette.primary }}
          >
            {lang === 'ru' ? 'Открыть' : 'Go'}
          </button>
        </form>

        {/* Server Dropdown Selector in top bar */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--outline-var)] bg-[var(--surface-dim)] text-[10px] font-black uppercase text-[var(--on-surface-var)]">
            <Server size={10} style={{ color: activePalette.primary }} />
            <span>{selectedServer}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* --- MAIN WINDOW CONTENT --- */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {isConnecting ? (
            /* --- CONNECTING ANIMATION LAYER --- */
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--surface-dim)] p-6"
            >
              <div className="flex flex-col items-center max-w-sm w-full">
                <div className="relative w-16 h-16 mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="w-full h-full rounded-full border-4 border-t-transparent border-[var(--outline-var)]"
                    style={{ borderTopColor: activePalette.primary }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield size={20} style={{ color: activePalette.primary }} />
                  </div>
                </div>
                
                <h4 className="text-sm font-black mb-1">
                  {lang === 'ru' ? 'Защита туннеля...' : 'Securing Tunnel...'}
                </h4>
                <p className="text-[10px] font-bold text-[var(--on-surface-var)] mb-6">
                  {lang === 'ru' ? `Маршрутизация через ${selectedServer}` : `Routing via ${selectedServer}`}
                </p>

                {/* Simulated Logs Terminal */}
                <div className="w-full bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 font-mono text-[9px] text-emerald-400 space-y-1.5 text-left h-36 overflow-y-auto shadow-inner">
                  {connectingLogs.map((log, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="leading-relaxed"
                    >
                      {log}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : activeUrl ? (
            /* --- IFRAME LAYER --- */
            <motion.div
              key="iframe"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="w-full h-full bg-white relative"
            >
              <iframe
                key={iframeKey}
                src={activeUrl}
                className="w-full h-full border-none"
                title="Space Proxy View"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
              {/* Shield Layer for click protection warning (X-Frame issue warning) */}
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-[10px] font-bold text-white flex items-center gap-2 select-none pointer-events-none">
                <Shield size={12} className="text-emerald-400" />
                <span>
                  {lang === 'ru' 
                    ? `Защищено через ${selectedServer}` 
                    : `Encrypted via ${selectedServer}`}
                </span>
              </div>
            </motion.div>
          ) : (
            /* --- HUB HOMEPAGE --- */
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between"
            >
              <div className="max-w-4xl mx-auto w-full">
                {/* Branding Block */}
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--surface)] border border-[var(--outline)] flex items-center justify-center shadow-md mb-4">
                    <Globe size={28} style={{ color: activePalette.primary }} />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mb-1">Space Proxy Hub</h3>
                  <p className="text-xs font-semibold text-[var(--on-surface-var)] max-w-md">
                    {lang === 'ru' 
                      ? 'Современный, быстрый веб-прокси прямо в вашей системе. Безопасный доступ, отсутствие рекламы.'
                      : 'Modern, fast web proxy built right into your environment. Secure browsing, ad-free.'}
                  </p>
                </div>

                {/* Server selection cards */}
                <div className="mb-8">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[var(--on-surface-var)] mb-3 flex items-center gap-2">
                    <Activity size={14} />
                    <span>{lang === 'ru' ? 'Доступные серверные узлы' : 'Available Server Nodes'}</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {servers.map((srv) => {
                      const isSelected = selectedServer === srv.name;
                      const ping = simulatedPings[srv.name] || 50;
                      let pingColor = 'text-emerald-500';
                      if (ping > 100) pingColor = 'text-amber-500';

                      return (
                        <button
                          key={srv.id}
                          onClick={() => {
                            onSelectServer(srv.name);
                          }}
                          className={`p-4 rounded-2xl border text-left flex flex-col justify-between min-h-[110px] transition-all cursor-pointer relative overflow-hidden group ${
                            isSelected
                              ? 'border-transparent shadow-md text-white'
                              : 'border-[var(--outline-var)] bg-[var(--surface)] hover:bg-[var(--surface-dim)] text-[var(--on-surface)]'
                          }`}
                          style={{
                            backgroundColor: isSelected ? activePalette.primary : undefined,
                          }}
                        >
                          <div className="flex justify-between items-start w-full mb-3">
                            <div className="flex items-center gap-2">
                              <Server size={14} className={isSelected ? 'text-white' : 'text-[var(--on-surface-var)]'} />
                              <span className="text-xs font-black">{srv.name}</span>
                            </div>
                            {isSelected && (
                              <div className="p-1 rounded-full bg-white/20 text-white">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          <div className="space-y-0.5 relative z-10">
                            <p className={`text-[10px] font-bold ${isSelected ? 'text-white/85' : 'text-[var(--on-surface-var)]'}`}>
                              {srv.region}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1 text-[9px] font-black">
                                <Wifi size={10} className={isSelected ? 'text-white/90' : 'opacity-70'} />
                                <span className={isSelected ? 'text-white/95' : pingColor}>{ping} ms</span>
                              </div>
                              <span className={`text-[9px] font-bold opacity-60 ${isSelected ? 'text-white/60' : ''}`}>
                                {srv.security}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preset launch sites */}
                <div className="mb-6">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[var(--on-surface-var)] mb-3 flex items-center gap-2">
                    <ExternalLink size={14} />
                    <span>{lang === 'ru' ? 'Быстрый запуск сайтов' : 'Fast App Launchers'}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {presetSites.map((site, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLaunchUrl(site.url)}
                        className="flex items-center justify-between p-4 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface)] hover:bg-[var(--surface-dim)] transition-all cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-3.5 pr-4 overflow-hidden">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-sm"
                            style={{ backgroundColor: site.iconColor }}
                          >
                            {site.nameEn.substring(0, 1)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-black leading-tight truncate">
                              {lang === 'ru' ? site.nameRu : site.nameEn}
                            </p>
                            <p className="text-[10px] font-bold text-[var(--on-surface-var)] leading-normal mt-0.5 truncate">
                              {lang === 'ru' ? site.descriptionRu : site.descriptionEn}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-[var(--on-surface-var)] opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informational Footer */}
              <div className="mt-8 border-t border-[var(--outline-var)] pt-4 text-center max-w-lg mx-auto">
                <p className="text-[10px] font-bold text-[var(--on-surface-var)] leading-relaxed">
                  {lang === 'ru'
                    ? 'Важная информация: Некоторые крупные веб-сайты блокируют встраивание во фреймы в целях безопасности. В этом случае вы можете использовать специализированные HTML/мобильные версии или веб-архивы.'
                    : 'Important notice: Some websites forbid loading inside an iframe due to security policies. In such cases, use lightweight HTML layouts or web archives for access.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

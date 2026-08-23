import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Server, Wifi, Check, Sparkles, Globe, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

export interface ProxyServerNode {
  id: string;
  name: string;
  url: string;
  region: string;
  flag: string;
  basePing: number;
  tags?: string[];
}

export const PROXY_SERVERS: ProxyServerNode[] = [
  {
    id: 'server-1',
    name: 'Space Global Fast (Auto)',
    url: 'https://gointospace.app/',
    region: 'Global / Multi-Region',
    flag: '🌐',
    basePing: 18,
    tags: ['Ultra-Fast', 'Recommended'],
  },
  {
    id: 'server-2',
    name: 'Space Node EU (Frankfurt)',
    url: 'https://uv.studentstools.com/',
    region: 'Europe (DE)',
    flag: '🇩🇪',
    basePing: 26,
    tags: ['Low Latency', 'SSL/TLS'],
  },
  {
    id: 'server-3',
    name: 'Space Node US (Virginia)',
    url: 'https://space-proxy-hub.vercel.app/',
    region: 'North America (US)',
    flag: '🇺🇸',
    basePing: 42,
    tags: ['High Bandwidth'],
  },
  {
    id: 'server-4',
    name: 'Space Stealth Node (Amsterdam)',
    url: 'https://math-solver.app/',
    region: 'Netherlands (NL)',
    flag: '🇳🇱',
    basePing: 34,
    tags: ['Stealth Mode', 'No-Log'],
  },
  {
    id: 'server-local',
    name: 'Local Tunnel Node (Port 8080)',
    url: 'http://localhost:8080/',
    region: 'Local Host',
    flag: '⚡',
    basePing: 4,
    tags: ['Localhost', 'Direct'],
  },
];

interface ServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  selectedServer: string;
  onSelectServer: (server: string) => void;
  primaryColor?: string;
  onOpenHub?: (url?: string) => void;
}

export default function ServerModal({
  isOpen,
  onClose,
  lang,
  selectedServer,
  onSelectServer,
  primaryColor,
  onOpenHub,
}: ServerModalProps) {
  const isRu = lang === 'ru';
  const [customUrl, setCustomUrl] = useState('');
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pings, setPings] = useState<Record<string, number>>({});

  useEffect(() => {
    // Generate realistic initial ping jitter around basePing
    const initial: Record<string, number> = {};
    PROXY_SERVERS.forEach((s) => {
      initial[s.id] = Math.max(2, Math.round(s.basePing + (Math.random() * 8 - 4)));
    });
    setPings(initial);
  }, []);

  const handleTestPings = () => {
    setIsTestingPing(true);
    setTimeout(() => {
      const updated: Record<string, number> = {};
      PROXY_SERVERS.forEach((s) => {
        updated[s.id] = Math.max(2, Math.round(s.basePing + (Math.random() * 10 - 3)));
      });
      setPings(updated);
      setIsTestingPing(false);
    }, 600);
  };

  const handleSelect = (s: ProxyServerNode) => {
    onSelectServer(s.name);
    localStorage.setItem('linkerru_server_url', s.url);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    const formatted = customUrl.startsWith('http') ? customUrl.trim() : `https://${customUrl.trim()}`;
    const customName = `Custom (${new URL(formatted).hostname})`;
    onSelectServer(customName);
    localStorage.setItem('linkerru_server_url', formatted);
    setCustomUrl('');
    if (onOpenHub) {
      onOpenHub(formatted);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.8 }}
          className="relative z-10 w-full max-w-xl rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--outline-var)] shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: primaryColor || 'var(--accent)' }}
              >
                <Server size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--on-surface)] tracking-tight">
                  {isRu ? 'Выбор узла прокси-сервера' : 'Proxy Server Node Selector'}
                </h2>
                <p className="text-xs text-[var(--on-surface-var)] font-semibold">
                  Space Proxy Hub • {isRu ? 'Маршрутизация узлов' : 'Fast Node Routing'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestPings}
                disabled={isTestingPing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--on-surface)] border border-[var(--btn-border)] transition-all cursor-pointer"
                title={isRu ? 'Проверить пинг' : 'Test Ping'}
              >
                <RefreshCw size={12} className={isTestingPing ? 'animate-spin text-[var(--accent)]' : ''} />
                <span>{isRu ? 'Пинг' : 'Ping'}</span>
              </button>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--on-surface-var)] hover:bg-[var(--btn-hover)] hover:text-[var(--on-surface)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Node List */}
          <div className="overflow-y-auto py-4 space-y-2.5 flex-1 pr-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] px-1 mb-1 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-[var(--accent)]" />
              <span>{isRu ? 'Доступные серверы и зеркала' : 'Available Proxy Nodes & Mirrors'}</span>
            </div>

            {PROXY_SERVERS.map((node) => {
              const isSelected = selectedServer === node.name || selectedServer === node.id;
              const ping = pings[node.id] || node.basePing;
              const pingColor = ping < 25 ? 'text-emerald-500' : ping < 50 ? 'text-amber-500' : 'text-orange-500';

              return (
                <div
                  key={node.id}
                  onClick={() => handleSelect(node)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    isSelected
                      ? 'bg-[var(--surface-dim)] border-[var(--accent)] shadow-sm'
                      : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] border-[var(--btn-border)]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="text-2xl shrink-0 select-none">{node.flag}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[var(--on-surface)] truncate">
                          {node.name}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[var(--accent)] text-white shadow-xs">
                            {isRu ? 'АКТИВЕН' : 'ACTIVE'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-[var(--on-surface-var)]">
                          {node.region}
                        </span>
                        {node.tags?.map((t) => (
                          <span
                            key={t}
                            className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-[var(--container-high)] text-[var(--on-surface-var)]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <div className={`flex items-center gap-1 text-[11px] font-black tabular-nums ${pingColor}`}>
                        <Wifi size={12} />
                        <span>{ping}ms</span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-500">Online</span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-xs'
                          : 'border-[var(--outline)] text-transparent group-hover:border-[var(--on-surface-var)]'
                      }`}
                    >
                      <Check size={13} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Custom Node Form */}
            <div className="pt-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] px-1 mb-2 flex items-center gap-1.5">
                <Globe size={12} className="text-[var(--accent)]" />
                <span>{isRu ? 'Пользовательский адрес или зеркало' : 'Custom Proxy Endpoint / Mirror'}</span>
              </div>
              <form onSubmit={handleApplyCustom} className="flex gap-2">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder={isRu ? 'Например: https://proxy.myserver.org/' : 'e.g.: https://proxy.myserver.org/'}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--btn-bg)] border border-[var(--btn-border)] text-xs font-semibold text-[var(--on-surface)] placeholder-[var(--on-surface-var)]/60 focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!customUrl.trim()}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[var(--accent)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <Zap size={14} />
                  <span>{isRu ? 'Подключить' : 'Connect'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[var(--outline-var)] flex items-center justify-between gap-3 shrink-0">
            <div className="text-[10px] font-semibold text-[var(--on-surface-var)] truncate">
              {isRu ? 'Активный сервер:' : 'Active node:'} <span className="font-bold text-[var(--on-surface)]">{selectedServer}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--btn-border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--on-surface)] transition-all cursor-pointer"
              >
                {isRu ? 'Готово' : 'Done'}
              </button>
              {onOpenHub && (
                <button
                  onClick={() => {
                    onOpenHub();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-black text-white shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: primaryColor || 'var(--accent)' }}
                >
                  <Sparkles size={13} />
                  <span>{isRu ? 'Открыть Hub' : 'Open Hub'}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

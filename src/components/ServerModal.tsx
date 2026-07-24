import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Server } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface ServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  selectedServer: string;
  onSelectServer: (server: string) => void;
  primaryColor: string;
}

export default function ServerModal({
  isOpen,
  onClose,
  lang,
  selectedServer,
  onSelectServer,
  primaryColor,
}: ServerModalProps) {
  const t = translations[lang];

  const servers = [
    { id: 'S1', name: 'Server 1' },
    { id: 'S2', name: 'Server 2' },
    { id: 'S3', name: 'Server 3' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            id="server-backdrop"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative z-10 w-full max-w-sm rounded-3xl border border-[var(--outline-var)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur-xl p-6 shadow-2xl flex flex-col"
            id="server-modal-inner"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black tracking-widest text-[var(--on-surface-var)] uppercase">
                {t.select_node_title}
              </span>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
                id="server-close-btn"
              >
                <X size={14} />
              </button>
            </div>

            {/* List */}
            <div className="space-y-2 mb-4" id="server-buttons-list">
              {servers.map((srv) => {
                const isSelected = selectedServer === srv.name;
                return (
                  <button
                    key={srv.id}
                    onClick={() => onSelectServer(srv.name)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between font-bold text-xs transition-all relative ${
                      isSelected
                        ? 'text-[var(--surface)] border-transparent shadow-md'
                        : 'border-[var(--outline-var)] bg-[var(--surface-dim)] hover:bg-[var(--container)] text-[var(--on-surface)]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? primaryColor : undefined,
                    }}
                    id={`server-item-${srv.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Server size={14} className={isSelected ? 'text-[var(--surface)]' : 'text-[var(--on-surface-var)]'} />
                      <span>{srv.name}</span>
                    </div>
                    {isSelected && (
                      <span
                        className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/25 text-[var(--surface)]"
                      >
                        {lang === 'ru' ? 'Последний' : 'Last Used'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Back Button */}
            <button
              onClick={onClose}
              className="w-full text-center text-xs font-extrabold text-[var(--on-surface-var)] hover:text-[var(--on-surface)] underline py-1"
              id="server-back-btn"
            >
              {t.back_label}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

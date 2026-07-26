import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface StandbySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activePalette: any;
  background: string;
  setBackground: (bg: string) => void;
  onLaunch: () => void;
}

export default function StandbySetupModal({ 
  isOpen, 
  onClose, 
  lang, 
  activePalette,
  background,
  setBackground,
  onLaunch
}: StandbySetupModalProps) {
  
  const p1 = activePalette.primary;
  const p2 = activePalette.secondary;
  const p3 = activePalette.tertiary;

  // Live clock for preview
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const gradients = [
    { id: 'theme', name: 'Theme', style: 'var(--bg)' },
    { id: 'gradient-1', name: 'Gradient 1', style: `linear-gradient(135deg, ${p1}, ${p2}, ${p3})` },
    { id: 'gradient-2', name: 'Gradient 2', style: `radial-gradient(circle at 10% 20%, ${p2} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3} 0%, transparent 50%), linear-gradient(135deg, ${p1}, var(--bg))` },
    { id: 'gradient-3', name: 'Gradient 3', style: `linear-gradient(to bottom right, ${p1} 0%, transparent 100%), linear-gradient(to top right, ${p3} 0%, transparent 100%), var(--bg)` },
    { id: 'gradient-4', name: 'Gradient 4', style: `conic-gradient(from 180deg at 50% 50%, ${p1} 0deg, ${p2} 120deg, ${p3} 240deg, ${p1} 360deg)` },
  ];

  const activeGradient = gradients.find((g) => g.id === background) || gradients[0];
  const previewTime = now.toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-[var(--outline-var)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur-xl p-6 shadow-2xl flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
            >
              <X size={18} />
            </button>

            {/* Title */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm font-extrabold tracking-widest uppercase text-[var(--on-surface)]">
                Standby Background
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-8">
              {gradients.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setBackground(g.id)}
                  className={`relative h-12 rounded-xl border-2 overflow-hidden transition-all ${
                    background === g.id ? 'border-[var(--on-surface)] scale-95 shadow-md' : 'border-[var(--outline-var)] hover:border-[var(--outline)]'
                  }`}
                  style={{ background: g.style }}
                  title={g.name}
                >
                  {background === g.id && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Check size={14} strokeWidth={4} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Live clock preview */}
            <div
              className="relative mb-5 flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-[var(--outline-var)]"
              style={{ background: activeGradient.style }}
            >
              <span className="text-3xl font-black tabular-nums tracking-tight text-white drop-shadow-lg">
                {previewTime}
              </span>
            </div>

            <button
              onClick={onLaunch}
              className="w-full py-3 rounded-full text-xs font-black bg-[var(--on-surface)] text-[var(--surface)] hover:bg-[var(--accent)] hover:text-white hover:scale-[1.01] active:scale-95 transition-all"
            >
              Launch Standby
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

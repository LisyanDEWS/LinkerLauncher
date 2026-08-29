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
  wallpaper?: string;
}

export default function StandbySetupModal({
  isOpen,
  onClose,
  lang,
  activePalette,
  background,
  setBackground,
  onLaunch,
  wallpaper
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

  const animatedGradients = [
    { id: 'animated-1', name: 'Silk Waves', style: 'var(--bg)' },
    { id: 'animated-2', name: 'Fluted Glass', style: 'var(--bg)' },
    { id: 'animated-3', name: 'Riso Dither', style: 'var(--bg)' },
    { id: 'animated-4', name: 'Starfield', style: 'var(--bg)' },
  ];

  const hasWallpaper = wallpaper && wallpaper !== 'none';
  const blurredWallpaper = { id: 'blurred-wallpaper', name: 'Blurred Wallpaper', style: hasWallpaper ? `url(${wallpaper})` : 'var(--bg)' };

  const allGradients = [...gradients, ...animatedGradients, blurredWallpaper];
  const activeGradient = allGradients.find((g) => g.id === background) || gradients[0];
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

            {/* Row 1: Static gradients */}
            <div className="grid grid-cols-5 gap-2 mb-2">
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

            {/* Row 2: Blurred wallpaper + animated gradients */}
            <div className="grid grid-cols-5 gap-2 mb-8">
              {/* Blurred wallpaper cell (1st) */}
              <button
                onClick={() => hasWallpaper && setBackground('blurred-wallpaper')}
                className={`relative h-12 rounded-xl border-2 overflow-hidden transition-all ${
                  !hasWallpaper ? 'opacity-40 cursor-not-allowed' : ''
                } ${
                  background === 'blurred-wallpaper' ? 'border-[var(--on-surface)] scale-95 shadow-md' : 'border-[var(--outline-var)] hover:border-[var(--outline)]'
                }`}
                style={hasWallpaper ? {
                  backgroundImage: `url(${wallpaper})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(8px) brightness(0.7)',
                } : { background: 'var(--surface-dim)' }}
                title={hasWallpaper ? 'Blurred Wallpaper' : 'No wallpaper set'}
              >
                {!hasWallpaper && (
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-[var(--on-surface-var)] text-center px-1">
                    No Image
                  </span>
                )}
                {background === 'blurred-wallpaper' && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Check size={14} strokeWidth={4} className="text-white" />
                  </div>
                )}
              </button>

              {/* Animated gradient cells (2nd-5th) — each with unique mini animation */}
              {animatedGradients.map((g, idx) => (
                <button
                  key={g.id}
                  onClick={() => setBackground(g.id)}
                  className={`relative h-12 rounded-xl border-2 overflow-hidden transition-all ${
                    background === g.id ? 'border-[var(--on-surface)] scale-95 shadow-md' : 'border-[var(--outline-var)] hover:border-[var(--outline)]'
                  }`}
                  style={{ background: g.style }}
                  title={g.name}
                >
                  {/* Animated-1: Silk Waves */}
                  {idx === 0 && (
                    <div
                      data-aifx="silk-waves"
                      data-aifx-colors={`${p1},${p2},${p3}`}
                      data-aifx-bg={p3}
                      className="absolute inset-0 pointer-events-none"
                      aria-hidden="true"
                    />
                  )}
                  {/* Animated-2: Fluted Glass */}
                  {idx === 1 && (
                    <div
                      data-aifx="fluted-glass"
                      data-aifx-colors={`${p1},${p2},${p3},${p1}`}
                      data-aifx-bg={p3}
                      className="absolute inset-0 pointer-events-none"
                      aria-hidden="true"
                    />
                  )}
                  {/* Animated-3: Riso Dither */}
                  {idx === 2 && (
                    <div
                      data-aifx="dither"
                      data-aifx-colors={`${p1},${p3},${p2},${p1}`}
                      data-aifx-bg={p3}
                      className="absolute inset-0 pointer-events-none"
                      aria-hidden="true"
                    />
                  )}
                  {/* Animated-4: starfield (mini preview) */}
                  {idx === 3 && (
                    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a, #111128)' }}>
                      {Array.from({ length: 20 }).map((_, si) => {
                        const size = 1 + (si % 3);
                        return (
                          <motion.div
                            key={si}
                            className="absolute rounded-full"
                            style={{
                              width: `${size}px`, height: `${size}px`,
                              left: `${(si * 47) % 100}%`,
                              top: `${(si * 31) % 100}%`,
                              background: si % 5 === 0 ? p1 : si % 7 === 0 ? p3 : '#ffffff',
                              boxShadow: `0 0 ${size * 2}px currentColor`,
                            }}
                            animate={{ opacity: [0.2, 1, 0.2], scale: [0.5, 1.3, 0.5] }}
                            transition={{ duration: 1.5 + (si % 3), repeat: Infinity, ease: 'easeInOut', delay: (si * 0.12) % 2 }}
                          />
                        );
                      })}
                      <motion.div
                        className="absolute rounded-full"
                        style={{ width: '60%', height: '60%', left: '20%', top: '20%', background: `radial-gradient(circle, ${p1}30 0%, transparent 60%)`, filter: 'blur(6px)' }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  )}
                  {background === g.id && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                      <Check size={14} strokeWidth={4} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Live clock preview */}
            <div
              className="relative mb-5 flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-[var(--outline-var)]"
              style={background === 'blurred-wallpaper' && hasWallpaper ? { background: 'var(--bg)' } : { background: activeGradient.style }}
            >
              {/* Blurred wallpaper inner layer (separate so border stays sharp) */}
              {background === 'blurred-wallpaper' && hasWallpaper && (
                <div
                  className="absolute inset-0 scale-110"
                  style={{
                    backgroundImage: `url(${wallpaper})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(12px) brightness(0.6)',
                  }}
                />
              )}
              {/* Animated preview — real AI Designer effects with accent colors */}
              {background === 'animated-1' && (
                <div
                  data-aifx="silk-waves"
                  data-aifx-colors={`${p1},${p2},${p3}`}
                  data-aifx-bg={p3}
                  className="absolute inset-0 pointer-events-none"
                  aria-hidden="true"
                />
              )}
              {background === 'animated-2' && (
                <div
                  data-aifx="fluted-glass"
                  data-aifx-colors={`${p1},${p2},${p3},${p1}`}
                  data-aifx-bg={p3}
                  className="absolute inset-0 pointer-events-none"
                  aria-hidden="true"
                />
              )}
              {background === 'animated-3' && (
                <div
                  data-aifx="dither"
                  data-aifx-colors={`${p1},${p3},${p2},${p1}`}
                  data-aifx-bg={p3}
                  className="absolute inset-0 pointer-events-none"
                  aria-hidden="true"
                />
              )}
              {background === 'animated-4' && (
                <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a, #111128)' }}>
                  {/* Nebula glow */}
                  <motion.div
                    className="absolute rounded-full"
                    style={{ width: '70%', height: '70%', left: '15%', top: '10%', background: `radial-gradient(circle, ${p1}25 0%, transparent 60%)`, filter: 'blur(20px)' }}
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute rounded-full"
                    style={{ width: '50%', height: '50%', right: '10%', bottom: '10%', background: `radial-gradient(circle, ${p3}20 0%, transparent 60%)`, filter: 'blur(15px)' }}
                    animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  {/* Stars */}
                  {Array.from({ length: 60 }).map((_, si) => {
                    const size = 1 + (si % 4);
                    const isAccent = si % 6 === 0;
                    return (
                      <motion.div
                        key={si}
                        className="absolute rounded-full"
                        style={{
                          width: `${size}px`, height: `${size}px`,
                          left: `${(si * 67) % 100}%`,
                          top: `${(si * 43) % 100}%`,
                          background: isAccent ? p1 : si % 9 === 0 ? p3 : '#ffffff',
                          boxShadow: `0 0 ${size * 3}px currentColor`,
                        }}
                        animate={{ opacity: [0.15, 1, 0.15], scale: [0.5, 1.4, 0.5] }}
                        transition={{ duration: 1.5 + (si % 4), repeat: Infinity, ease: 'easeInOut', delay: (si * 0.08) % 4 }}
                      />
                    );
                  })}
                  {/* Shooting star */}
                  <motion.div
                    className="absolute rounded-full"
                    style={{ width: '2px', height: '2px', background: '#fff', boxShadow: '0 0 6px #fff, -20px 0 10px rgba(255,255,255,0.4)' }}
                    animate={{ left: ['-10%', '110%'], top: ['20%', '40%'], opacity: [0, 1, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', repeatDelay: 4 }}
                  />
                </div>
              )}
              <span className="relative z-10 text-3xl font-black tabular-nums tracking-tight text-white drop-shadow-lg">
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize, Settings } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface StandbyClockProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activePalette: any;
  background: string;
  onOpenSetup: () => void;
  clockType: 'digital' | 'analog';
  clockVariation: 1 | 2 | 3;
  wallpaper?: string;
}

export default function StandbyClock({ isOpen, onClose, lang, activePalette, background, onOpenSetup, clockType, clockVariation, wallpaper }: StandbyClockProps) {
  const primaryColor = activePalette.primary;
  const [time, setTime] = useState<Date>(new Date());
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hide controls after a few seconds of no interaction.
  // Dismiss standby on click anywhere or Escape key.
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handleClick = () => {
      onClose();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove);
      // Delay click listener so the launching click doesn't immediately close standby
      const clickDelay = setTimeout(() => {
        window.addEventListener('click', handleClick);
      }, 500);
      window.addEventListener('keydown', handleKey);
      timeout = setTimeout(() => setShowControls(false), 3000);
      // Lock scroll and smoothly hide scrollbar
      document.documentElement.classList.add('standby-active');
      return () => {
        clearTimeout(clickDelay);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleClick);
        window.removeEventListener('keydown', handleKey);
        clearTimeout(timeout);
        document.documentElement.classList.remove('standby-active');
      };
    }
  }, [isOpen, onClose]);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');

  const isTheme = background === 'theme';
  const isAnimated = background.startsWith('animated-');
  const isBlurredWallpaper = background === 'blurred-wallpaper' && wallpaper && wallpaper !== 'none';

  const getBackgroundStyle = () => {
    if (isTheme) return 'var(--bg)';
    if (background === 'blurred-wallpaper') return 'var(--bg)';

    const p1 = activePalette.primary;
    const p2 = activePalette.secondary;
    const p3 = activePalette.tertiary;

    switch (background) {
      case 'gradient-1': return `linear-gradient(135deg, ${p1}, ${p2}, ${p3})`;
      case 'gradient-2': return `radial-gradient(circle at 10% 20%, ${p2} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3} 0%, transparent 50%), linear-gradient(135deg, ${p1}, var(--bg))`;
      case 'gradient-3': return `linear-gradient(to bottom right, ${p1} 0%, transparent 100%), linear-gradient(to top right, ${p3} 0%, transparent 100%), var(--bg)`;
      case 'gradient-4': return `conic-gradient(from 180deg at 50% 50%, ${p1} 0deg, ${p2} 120deg, ${p3} 240deg, ${p1} 360deg)`;
      case 'animated-1': return 'var(--bg)';
      case 'animated-2': return 'var(--bg)';
      case 'animated-3': return 'var(--bg)';
      case 'animated-4': return 'var(--bg)';
      default: return background;
    }
  };

  const backgroundStyle = getBackgroundStyle();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          style={{ background: backgroundStyle }}
          id="standby-clock-container"
        >
          {/* Blurred wallpaper background */}
          {isBlurredWallpaper && (
            <div
              className="absolute inset-0 scale-125"
              style={{
                backgroundImage: `url(${wallpaper})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(60px) brightness(0.5) saturate(1.2)',
              }}
            />
          )}

          {/* Animated backgrounds — AI Designer effects with accent colors */}
          {background === 'animated-1' && (
            /* Silk Waves */
            <div
              data-aifx="silk-waves"
              data-aifx-colors={`${activePalette.primary},${activePalette.secondary},${activePalette.tertiary}`}
              data-aifx-bg={activePalette.tertiary}
              className="absolute inset-0 -z-10 pointer-events-none"
              aria-hidden="true"
            />
          )}

          {background === 'animated-2' && (
            /* Fluted Glass */
            <div
              data-aifx="fluted-glass"
              data-aifx-colors={`${activePalette.primary},${activePalette.secondary},${activePalette.tertiary},${activePalette.primary}`}
              data-aifx-bg={activePalette.tertiary}
              className="absolute inset-0 -z-10 pointer-events-none"
              aria-hidden="true"
            />
          )}

          {background === 'animated-3' && (
            /* Riso Dither */
            <div
              data-aifx="dither"
              data-aifx-colors={`${activePalette.primary},${activePalette.tertiary},${activePalette.secondary},${activePalette.primary}`}
              data-aifx-bg={activePalette.tertiary}
              className="absolute inset-0 -z-10 pointer-events-none"
              aria-hidden="true"
            />
          )}

          {background === 'animated-4' && (
            /* Starfield — AI Designer effect */
            <>
              <div
                data-aifx="starfield"
                className="absolute inset-0 -z-10 pointer-events-none"
                aria-hidden="true"
              />
              {/* Remove AI Designer watermark badge if injected */}
              <style>{`[data-aifx-wm] { display: none !important; }`}</style>
            </>
          )}

          {/* Animated overlay gradient to simulate slow changing */}
          <motion.div
            className={`absolute inset-0 opacity-40 mix-blend-overlay ${isTheme ? 'hidden' : ''}`}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 60%)',
              backgroundSize: '200% 200%'
            }}
          />

          {/* Clock Display Area */}
          <div className="relative z-10 w-full flex items-center justify-center">
            {clockType === 'digital' ? (
              <div 
                className={`text-[18vw] font-black tracking-tighter tabular-nums select-none ${isTheme ? 'text-[var(--on-surface)] drop-shadow-sm' : 'text-white mix-blend-screen drop-shadow-2xl'} ${
                    clockVariation === 1
                      ? ''
                      : clockVariation === 2
                      ? 'font-mono tracking-normal'
                      : 'font-light tracking-widest'
                }`}
                style={{ color: clockVariation === 3 && isTheme ? primaryColor : undefined }}
              >
                {hours}<span className="opacity-50 animate-pulse">:</span>{minutes}
              </div>
            ) : (
              <div
                  className={`relative w-[60vh] h-[60vh] rounded-full border-[1.5vh] flex items-center justify-center transition-all ${
                    clockVariation === 2
                      ? 'border-none shadow-inner bg-black/20'
                      : clockVariation === 3
                      ? 'border-2 bg-transparent'
                      : 'bg-black/10'
                  }`}
                  style={{ 
                    borderColor: clockVariation === 3 && isTheme ? primaryColor : (isTheme ? 'var(--outline)' : 'rgba(255,255,255,0.2)'),
                    backgroundColor: clockVariation === 1 && isTheme ? 'var(--container)' : (clockVariation === 2 && isTheme ? 'var(--surface-dim)' : undefined)
                  }}
                >
                  {clockVariation !== 2 && (
                    <>
                      <div className="absolute top-4 w-3 h-3 rounded-full" style={{ backgroundColor: isTheme ? 'var(--on-surface-var)' : 'rgba(255,255,255,0.5)' }} />
                      <div className="absolute bottom-4 w-3 h-3 rounded-full" style={{ backgroundColor: isTheme ? 'var(--on-surface-var)' : 'rgba(255,255,255,0.5)' }} />
                      <div className="absolute left-4 w-3 h-3 rounded-full" style={{ backgroundColor: isTheme ? 'var(--on-surface-var)' : 'rgba(255,255,255,0.5)' }} />
                      <div className="absolute right-4 w-3 h-3 rounded-full" style={{ backgroundColor: isTheme ? 'var(--on-surface-var)' : 'rgba(255,255,255,0.5)' }} />
                    </>
                  )}
                  {/* Center Dot */}
                  <div
                    className="absolute w-6 h-6 rounded-full z-10"
                    style={{ backgroundColor: isTheme ? primaryColor : '#fff' }}
                  />
                  {/* Hour Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
                    style={{
                      width: '1.5vh',
                      height: '15vh',
                      marginLeft: '-0.75vh',
                      transform: `rotate(${(time.getHours() % 12) * 30 + time.getMinutes() * 0.5}deg)`,
                      backgroundColor: clockVariation === 2 && isTheme ? 'var(--on-surface-var)' : (isTheme ? 'var(--on-surface)' : 'rgba(255,255,255,0.9)'),
                    }}
                  />
                  {/* Minute Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
                    style={{
                      width: '1vh',
                      height: '22vh',
                      marginLeft: '-0.5vh',
                      transform: `rotate(${time.getMinutes() * 6 + time.getSeconds() * 0.1}deg)`,
                      backgroundColor: clockVariation === 2 && isTheme ? 'var(--outline)' : (isTheme ? 'var(--on-surface)' : 'rgba(255,255,255,0.7)'),
                    }}
                  />
                  {/* Second Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
                    style={{
                      width: '0.5vh',
                      height: '25vh',
                      marginLeft: '-0.25vh',
                      transform: `rotate(${time.getSeconds() * 6}deg)`,
                      backgroundColor: clockVariation === 3 && isTheme ? primaryColor : (isTheme ? 'var(--accent-tertiary)' : 'rgba(255,255,255,0.5)'),
                    }}
                  />
              </div>
            )}
          </div>

          {/* Controls Overlay */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-6 right-6 flex items-center gap-4 z-20"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenSetup(); }}
                  className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition-all border ${isTheme ? 'bg-[var(--surface-dim)] text-[var(--on-surface)] border-[var(--outline)] hover:bg-[var(--container)]' : 'bg-black/30 text-white border-white/10 hover:bg-black/50'}`}
                  title="Standby Settings"
                >
                  <Settings size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition-all border ${isTheme ? 'bg-[var(--surface-dim)] text-[var(--on-surface)] border-[var(--outline)] hover:bg-[var(--container)]' : 'bg-black/30 text-white border-white/10 hover:bg-black/50'}`}
                  title="Exit Standby"
                >
                  <X size={24} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

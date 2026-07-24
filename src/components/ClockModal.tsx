import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Maximize } from 'lucide-react';
import { Language, ClockType } from '../types';
import { translations } from '../data/translations';

interface ClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activePalette: any;
  onOpenStandbySetup: () => void;
  clockType: 'digital' | 'analog';
  setClockType: (type: 'digital' | 'analog') => void;
  clockVariation: 1 | 2 | 3;
  setClockVariation: (val: 1 | 2 | 3) => void;
}

export default function ClockModal({ isOpen, onClose, lang, activePalette, onOpenStandbySetup, clockType, setClockType, clockVariation: variation, setClockVariation: setVariation }: ClockModalProps) {

  const [time, setTime] = useState<Date>(new Date());

  const t = translations[lang];

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  // Calculate degrees for analog clock hands
  const secDeg = time.getSeconds() * 6;
  const minDeg = time.getMinutes() * 6 + time.getSeconds() * 0.1;
  const hrDeg = (time.getHours() % 12) * 30 + time.getMinutes() * 0.5;

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
            id="clock-backdrop"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[var(--outline-var)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur-xl p-6 shadow-2xl flex flex-col items-center justify-between min-h-[400px]"
            id="clock-modal-container"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
              id="clock-close-btn"
            >
              <X size={18} />
            </button>

            {/* Title */}
            <div className="flex items-center gap-2 mt-2">
              <Clock size={20} className="text-[var(--on-surface-var)]" />
              <span className="text-xs font-extrabold tracking-widest uppercase text-[var(--on-surface-var)]">
                {t.clock_desc}
              </span>
            </div>

            {/* Selector Segment */}
            <div className="flex bg-[var(--container)] p-1 rounded-full border border-[var(--outline-var)] w-fit my-4" id="clock-type-tabs">
              <button
                onClick={() => setClockType('digital')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  clockType === 'digital'
                    ? 'bg-[var(--on-surface)] text-[var(--surface)] shadow-md'
                    : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                }`}
                id="clock-tab-digital"
              >
                {t.clock_digital}
              </button>
              <button
                onClick={() => setClockType('analog')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  clockType === 'analog'
                    ? 'bg-[var(--on-surface)] text-[var(--surface)] shadow-md'
                    : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                }`}
                id="clock-tab-analog"
              >
                {t.clock_analog}
              </button>
            </div>

            {/* Display Area */}
            <div className="flex-1 flex items-center justify-center w-full min-h-[180px]" id="clock-display-panel">
              {clockType === 'digital' ? (
                <div
                  className={`text-6xl font-extrabold tracking-tight tabular-nums select-none ${
                    variation === 1
                      ? 'text-[var(--on-surface)]'
                      : variation === 2
                      ? 'font-mono text-5xl font-medium tracking-wide text-[var(--on-surface-var)]'
                      : 'font-light tracking-widest text-7xl text-[var(--accent)]'
                  }`}
                  style={{ color: variation === 3 ? activePalette.primary : undefined }}
                  id="clock-digital-face"
                >
                  {hours}:{minutes}:{seconds}
                </div>
              ) : (
                <div
                  className={`relative w-48 h-48 rounded-full border-4 border-[var(--outline)] bg-[var(--container)] flex items-center justify-center transition-all ${
                    variation === 2
                      ? 'border-none bg-[var(--surface-dim)] shadow-inner'
                      : variation === 3
                      ? 'border-2 bg-transparent'
                      : ''
                  }`}
                  style={{ borderColor: variation === 3 ? activePalette.primary : undefined }}
                  id="clock-analog-face"
                >
                  {/* Hour increments indicators for Style 1 & 3 */}
                  {variation !== 2 && (
                    <>
                      <div className="absolute top-2 w-1.5 h-1.5 rounded-full bg-[var(--on-surface-var)]" />
                      <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-[var(--on-surface-var)]" />
                      <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-[var(--on-surface-var)]" />
                      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[var(--on-surface-var)]" />
                    </>
                  )}

                  {/* Center Dot */}
                  <div
                    className="absolute w-3 h-3 rounded-full bg-[var(--on-surface)] z-10"
                    style={{ backgroundColor: activePalette.primary }}
                  />

                  {/* Hour Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full bg-[var(--on-surface)]"
                    style={{
                      width: '6px',
                      height: '42px',
                      marginLeft: '-3px',
                      transform: `rotate(${hrDeg}deg)`,
                      backgroundColor: variation === 2 ? 'var(--on-surface-var)' : undefined,
                    }}
                    id="hand-hour"
                  />

                  {/* Minute Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full bg-[var(--on-surface)]"
                    style={{
                      width: '4px',
                      height: '60px',
                      marginLeft: '-2px',
                      transform: `rotate(${minDeg}deg)`,
                      backgroundColor: variation === 2 ? 'var(--outline)' : undefined,
                    }}
                    id="hand-minute"
                  />

                  {/* Second Hand */}
                  <div
                    className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
                    style={{
                      width: '2px',
                      height: '68px',
                      marginLeft: '-1px',
                      transform: `rotate(${secDeg}deg)`,
                      backgroundColor: variation === 3 ? activePalette.primary : 'var(--accent-tertiary)',
                    }}
                    id="hand-second"
                  />
                </div>
              )}
            </div>

            {/* Variations switcher */}
            <div className="flex items-center gap-3 mt-4 mb-2" id="clock-variation-dots">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => setVariation(num as 1 | 2 | 3)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    variation === num
                      ? 'scale-125'
                      : 'bg-[var(--outline)] hover:bg-[var(--on-surface-var)]'
                  }`}
                  style={{
                    backgroundColor: variation === num ? activePalette.primary : undefined,
                  }}
                  title={`Style ${num}`}
                  id={`clock-var-dot-${num}`}
                />
              ))}
            </div>

            {/* Standby Fullscreen button */}
            <button
              onClick={() => {
                onClose();
                onOpenStandbySetup();
              }}
              className="mt-2 w-full py-2.5 rounded-2xl text-xs font-bold bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline)] hover:bg-[var(--surface-dim)] hover:border-[var(--on-surface-var)] transition-all flex items-center justify-center gap-2"
            >
              <Maximize size={14} />
              <span>Standby Mode</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

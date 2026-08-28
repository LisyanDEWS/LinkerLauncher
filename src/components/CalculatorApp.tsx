import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, History, X, Trash2 } from 'lucide-react';
import { Language, ThemeMode, Material3Palette } from '../types';

/**
 * CalculatorApp — Material 3 styled basic calculator.
 * Inspired by the Android AOSP calculator: large display, 5-column grid,
 * accent operator buttons, rounded M3 shapes, haptic-style spring feedback.
 *
 * Layout adapts to window width:
 *  - Narrow (< 560px): single column, calculator only. History via toggle button.
 *  - Wide (>= 560px): two columns — calculator on left, history panel on right.
 *
 * Syncs with theme (light/dark), language (ru/en), and active palette.
 */

interface CalculatorAppProps {
  lang: Language;
  theme: ThemeMode;
  activePalette: Material3Palette;
}

type Op = '+' | '-' | '×' | '÷' | null;

interface HistoryEntry {
  id: number;
  expression: string;
  result: string;
}

export function CalculatorApp({ lang, activePalette }: CalculatorAppProps) {
  const isRu = lang === 'ru';
  const isUk = lang === 'uk';
  const accent = activePalette.primary;

  const [display, setDisplay] = useState('0');
  const [previous, setPrevious] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [historyLine, setHistoryLine] = useState<string>('');
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyIdRef = useRef(0);

  // Track container width to switch between single/two-column layout
  const containerRef = useRef<HTMLDivElement>(null);
  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsWide(entry.contentRect.width >= 560);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const t = isRu
    ? {
        clear: 'C',
        delete: '⌫',
        equals: '=',
        history: 'История',
        clearHistory: 'Очистить',
        historyTitle: 'История',
        historyEmpty: 'Здесь появятся ваши вычисления',
      }
    : isUk
    ? {
        clear: 'C',
        delete: '⌫',
        equals: '=',
        history: 'Історія',
        clearHistory: 'Очистити',
        historyTitle: 'Історія',
        historyEmpty: 'Тут з\'являться ваші обчислення',
      }
    : {
        clear: 'C',
        delete: '⌫',
        equals: '=',
        history: 'History',
        clearHistory: 'Clear',
        historyTitle: 'History',
        historyEmpty: 'Your calculations will appear here',
      };

  const pushHistory = (expression: string, result: string) => {
    historyIdRef.current += 1;
    setHistory((prev) => [{ id: historyIdRef.current, expression, result }, ...prev].slice(0, 100));
  };

  const inputDigit = (d: string) => {
    if (waitingForOperand || justEvaluated) {
      setDisplay(d);
      setWaitingForOperand(false);
      if (justEvaluated) {
        setHistoryLine('');
        setJustEvaluated(false);
      } else if (op && previous !== null) {
        setHistoryLine(`${formatNumber(previous)} ${op} ${d}`);
      }
    } else {
      const newDisplay = display === '0' ? d : display + d;
      setDisplay(newDisplay);
      if (op && previous !== null) {
        setHistoryLine(`${formatNumber(previous)} ${op} ${newDisplay}`);
      }
    }
  };

  const inputDot = () => {
    if (waitingForOperand || justEvaluated) {
      setDisplay('0.');
      setWaitingForOperand(false);
      if (justEvaluated) {
        setHistoryLine('');
        setJustEvaluated(false);
      } else if (op && previous !== null) {
        setHistoryLine(`${formatNumber(previous)} ${op} 0.`);
      }
      return;
    }
    if (!display.includes('.')) {
      const newDisplay = display + '.';
      setDisplay(newDisplay);
      if (op && previous !== null) {
        setHistoryLine(`${formatNumber(previous)} ${op} ${newDisplay}`);
      }
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setPrevious(null);
    setOp(null);
    setWaitingForOperand(false);
    setJustEvaluated(false);
    setHistoryLine('');
  };

  const deleteLast = () => {
    if (waitingForOperand || justEvaluated) return;
    const newDisplay = display.length > 1 ? display.slice(0, -1) : '0';
    setDisplay(newDisplay);
    if (op && previous !== null) {
      if (newDisplay === '0') {
        setHistoryLine(`${formatNumber(previous)} ${op}`);
      } else {
        setHistoryLine(`${formatNumber(previous)} ${op} ${newDisplay}`);
      }
    }
  };

  const toggleSign = () => {
    if (display === '0') return;
    const newDisplay = display.startsWith('-') ? display.slice(1) : '-' + display;
    setDisplay(newDisplay);
    if (op && previous !== null) {
      setHistoryLine(`${formatNumber(previous)} ${op} ${newDisplay}`);
    }
  };

  const percent = () => {
    const v = parseFloat(display);
    if (isNaN(v)) return;
    const res = v / 100;
    const resStr = formatNumber(res);
    setDisplay(resStr);
    if (op && previous !== null) {
      setHistoryLine(`${formatNumber(previous)} ${op} ${resStr}`);
    }
  };

  const compute = (a: number, b: number, operator: Op): number => {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const formatNumber = (n: number): string => {
    if (!isFinite(n) || isNaN(n)) return 'Error';
    const s = parseFloat(n.toPrecision(12)).toString();
    return s;
  };

  const performOp = (nextOp: Op) => {
    const inputValue = parseFloat(display);
    if (isNaN(inputValue)) return;

    if (waitingForOperand && op !== null) {
      setOp(nextOp);
      if (previous !== null) {
        setHistoryLine(`${formatNumber(previous)} ${nextOp}`);
      }
      return;
    }

    if (previous === null) {
      setPrevious(inputValue);
      setHistoryLine(`${formatNumber(inputValue)} ${nextOp}`);
    } else if (op) {
      const result = compute(previous, inputValue, op);
      const resultStr = formatNumber(result);
      setDisplay(resultStr);
      setPrevious(result);
      pushHistory(`${formatNumber(previous)} ${op} ${formatNumber(inputValue)}`, resultStr);
      setHistoryLine(`${resultStr} ${nextOp}`);
    }

    setWaitingForOperand(true);
    setJustEvaluated(false);
    setOp(nextOp);
  };

  const sqrt = () => {
    const v = parseFloat(display);
    if (isNaN(v) || v < 0) {
      setDisplay('Error');
      return;
    }
    const res = Math.sqrt(v);
    const resStr = formatNumber(res);
    setHistoryLine(`√(${formatNumber(v)}) =`);
    pushHistory(`√(${formatNumber(v)})`, resStr);
    setDisplay(resStr);
    setJustEvaluated(true);
  };

  const equals = () => {
    if (op === null || previous === null) return;
    const inputValue = parseFloat(display);
    if (isNaN(inputValue)) return;
    const result = compute(previous, inputValue, op);
    const resultStr = formatNumber(result);
    const expr = `${formatNumber(previous)} ${op} ${formatNumber(inputValue)} =`;
    setHistoryLine(expr);
    pushHistory(`${formatNumber(previous)} ${op} ${formatNumber(inputValue)}`, resultStr);
    setDisplay(resultStr);
    setPrevious(null);
    setOp(null);
    setWaitingForOperand(false);
    setJustEvaluated(true);
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      if (k >= '0' && k <= '9') inputDigit(k);
      else if (k === '.') inputDot();
      else if (k === '+') performOp('+');
      else if (k === '-') performOp('-');
      else if (k === '*') performOp('×');
      else if (k === '/') { e.preventDefault(); performOp('÷'); }
      else if (k === 'Enter' || k === '=') { e.preventDefault(); equals(); }
      else if (k === 'Backspace') deleteLast();
      else if (k === 'Escape') clearAll();
      else if (k === '%') percent();
      else if (k === 'r' || k === 'R') sqrt();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [display, previous, op, waitingForOperand, justEvaluated]);

  // Display formatting for readability
  const formattedDisplay = useMemo(() => {
    if (display === 'Error') return display;
    const [intPart, decPart] = display.split('.');
    const neg = intPart.startsWith('-');
    const absInt = neg ? intPart.slice(1) : intPart;
    const grouped = absInt.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '-' : '') + grouped + (decPart !== undefined ? '.' + decPart : '');
  }, [display]);

  // Button layout — Android AOSP style
  const buttons: { label: string; type: 'num' | 'op' | 'fn' | 'eq'; action: () => void; span?: boolean }[][] = [
    [
      { label: t.clear, type: 'fn', action: clearAll },
      { label: '√', type: 'fn', action: sqrt },
      { label: '%', type: 'fn', action: percent },
      { label: '÷', type: 'op', action: () => performOp('÷') },
    ],
    [
      { label: '7', type: 'num', action: () => inputDigit('7') },
      { label: '8', type: 'num', action: () => inputDigit('8') },
      { label: '9', type: 'num', action: () => inputDigit('9') },
      { label: '×', type: 'op', action: () => performOp('×') },
    ],
    [
      { label: '4', type: 'num', action: () => inputDigit('4') },
      { label: '5', type: 'num', action: () => inputDigit('5') },
      { label: '6', type: 'num', action: () => inputDigit('6') },
      { label: '−', type: 'op', action: () => performOp('-') },
    ],
    [
      { label: '1', type: 'num', action: () => inputDigit('1') },
      { label: '2', type: 'num', action: () => inputDigit('2') },
      { label: '3', type: 'num', action: () => inputDigit('3') },
      { label: '+', type: 'op', action: () => performOp('+') },
    ],
    [
      { label: '0', type: 'num', action: () => inputDigit('0') },
      { label: '.', type: 'num', action: inputDot },
      { label: '±', type: 'fn', action: toggleSign },
      { label: '=', type: 'eq', action: equals },
    ],
  ];

  const activeOp = op;
  const showSidePanel = isWide || showHistory;

  return (
    <div ref={containerRef} className="flex h-full w-full bg-transparent font-sans select-none overflow-hidden">
      {/* Calculator column */}
      <div className={`flex flex-col h-full min-h-0 overflow-hidden ${showSidePanel ? 'flex-1' : 'w-full'}`}>
        {/* Top bar — history toggle button */}
        <div className="flex items-center justify-end px-4 py-2 shrink-0 relative">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={`flex h-7 w-7 items-center justify-center rounded-xl border transition-colors cursor-pointer ${showHistory ? 'text-white' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'}`}
            style={{
              background: showHistory ? accent : 'var(--container)',
              borderColor: 'var(--outline)',
            }}
            title={t.history}
          >
            <History size={14} />
          </button>
        </div>

        {/* Display area */}
        <div className="flex flex-1 min-h-0 flex-col justify-end px-5 py-3 overflow-hidden">
          {/* History line */}
          <AnimatePresence mode="wait">
            {historyLine && (
              <motion.div
                key={historyLine}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-1 flex items-center justify-end gap-2 text-right"
              >
                <span className="text-sm md:text-base font-medium text-[var(--on-surface-var)] opacity-80 truncate text-right">
                  {historyLine}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Main display — M3 expressive oversized type with dynamic size */}
          <motion.div
            key={formattedDisplay}
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`text-right font-bold tabular-nums tracking-tight text-[var(--on-surface)] truncate ${
              formattedDisplay.length > 14
                ? 'text-xl md:text-2xl'
                : formattedDisplay.length > 10
                ? 'text-2xl md:text-3xl'
                : formattedDisplay.length > 7
                ? 'text-3xl md:text-4xl'
                : 'text-4xl md:text-5xl'
            }`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formattedDisplay}
          </motion.div>
        </div>

        {/* Button grid — M3 responsive fluid layout */}
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-1.5 md:gap-2 p-3 md:p-4 pb-4 md:pb-5">
          {buttons.map((row, ri) => (
            <div key={ri} className="grid grid-cols-4 gap-1.5 md:gap-2 flex-1 min-h-0">
              {row.map((btn, bi) => {
                const isOp = btn.type === 'op';
                const isActiveOp = isOp && activeOp === btn.label.replace('−', '-');
                return (
                  <motion.button
                    key={`${ri}-${bi}`}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                    onClick={btn.action}
                    className={`relative flex h-full min-h-[36px] items-center justify-center rounded-[1.25rem] text-xl md:text-2xl font-semibold font-sans transition-colors cursor-pointer ${
                      btn.span ? 'col-span-2' : ''
                    }`}
                    style={getButtonStyle(btn.type, isActiveOp, accent)}
                  >
                    {btn.label}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* History side panel — shown when wide or toggled */}
      <AnimatePresence>
        {showSidePanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isWide ? '320px' : '100%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="shrink-0 overflow-hidden border-l bg-[var(--surface-dim)]"
            style={{ borderColor: 'var(--outline-var)' }}
          >
            <div className="flex h-full w-[320px] flex-col">
              {/* History header with M3 divider */}
              <div className="flex items-center justify-between px-4 py-3 shrink-0 relative">
                <div className="absolute bottom-0 left-4 right-4 h-px" style={{ background: 'var(--outline-var)' }} />
                <div className="flex items-center gap-2">
                  <History size={15} style={{ color: accent }} />
                  <span className="text-xs font-black text-[var(--on-surface)]">{t.historyTitle}</span>
                </div>
                <div className="flex items-center gap-1">
                  {history.length > 0 && (
                    <button
                      onClick={() => setHistory([])}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title={t.clearHistory}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {!isWide && (
                    <button
                      onClick={() => setShowHistory(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="Close"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* History list */}
              <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
                {history.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[var(--container)] border border-[var(--outline-var)]">
                      <History size={24} className="text-[var(--outline)]" />
                    </div>
                    <p className="text-xs font-bold text-[var(--on-surface-var)]">{t.historyEmpty}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {history.map((h) => (
                      <motion.button
                        key={h.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setDisplay(h.result)}
                        className="flex flex-col items-end gap-0.5 rounded-[1rem] border border-[var(--outline-var)] bg-[var(--surface)] p-2.5 text-right transition-colors hover:bg-[var(--container)] cursor-pointer"
                      >
                        <span className="text-[10px] font-medium text-[var(--on-surface-var)] truncate w-full text-right">
                          {h.expression}
                        </span>
                        <span className="text-sm font-black text-[var(--on-surface)] tabular-nums">
                          = {h.result}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getButtonStyle(
  type: 'num' | 'op' | 'fn' | 'eq',
  isActiveOp: boolean,
  accent: string,
): React.CSSProperties {
  const commonStyle: React.CSSProperties = {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    height: '100%',
    minHeight: '36px',
  };

  // Numbers — surface container, subtle
  if (type === 'num') {
    return {
      ...commonStyle,
      background: 'var(--surface)',
      color: 'var(--on-surface)',
      border: '1px solid var(--outline)',
    };
  }
  // Functions (C, ±, %) — dimmed container
  if (type === 'fn') {
    return {
      ...commonStyle,
      background: 'var(--container)',
      color: 'var(--on-surface-var)',
      border: '1px solid var(--outline)',
    };
  }
  // Operators — accent fill when active, otherwise accent-tinted
  if (type === 'op') {
    return {
      ...commonStyle,
      background: isActiveOp ? accent : `color-mix(in srgb, ${accent} 15%, var(--surface))`,
      color: isActiveOp ? '#ffffff' : accent,
      border: isActiveOp ? 'none' : `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
      fontWeight: 600,
    };
  }
  // Equals — solid accent
  return {
    ...commonStyle,
    background: accent,
    color: '#ffffff',
    border: 'none',
    fontWeight: 700,
    boxShadow: `0 4px 16px -4px ${accent}80`,
  };
}

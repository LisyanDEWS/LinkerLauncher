import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bookmark,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Monitor,
  Apple,
  Chrome,
  Terminal,
  Calculator,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Language } from '../types';

interface BookmarkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  triggerToast?: (text: string) => void;
  playChime?: (type?: 'click' | 'alert' | 'reset' | 'victory' | 'toast') => void;
}

export const DESMOS_BOOKMARKLET_CODE = `javascript:(function(){if(document.getElementById('linker-stealth-pill'))return;var b=document.createElement('div');b.id='linker-stealth-pill';b.style.position='fixed';b.style.bottom='24px';b.style.right='24px';b.style.zIndex='2147483647';b.style.background='#121217';b.style.color='#ffffff';b.style.borderRadius='28px';b.style.boxShadow='0 20px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.15)';b.style.padding='14px 18px';b.style.display='flex';b.style.flexDirection='column';b.style.gap='10px';b.style.fontFamily='system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';b.style.userSelect='none';b.style.minWidth='230px';b.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><div style="display:flex;align-items:center;gap:8px;"><div style="width:28px;height:28px;border-radius:10px;background:#6366f1;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#fff;box-shadow:0 2px 8px rgba(99,102,241,0.5);">L</div><div style="display:flex;flex-direction:column;"><span style="font-weight:800;font-size:13px;letter-spacing:-0.2px;line-height:1.2;">LinkerRu :Re</span><span style="font-size:10px;opacity:0.65;font-weight:600;">Stealth Launcher</span></div></div><button id="linker-close-pill" style="background:transparent;border:none;color:#fff;opacity:0.6;font-size:16px;cursor:pointer;padding:2px 6px;line-height:1;">✕</button></div><button id="linker-launch-btn" style="width:100%;padding:10px 14px;border-radius:14px;background:#6366f1;color:#fff;border:none;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(99,102,241,0.4);"><span>🚀 Запустить в about:blank</span></button>';document.body.appendChild(b);document.getElementById('linker-close-pill').onclick=function(){b.remove();};document.getElementById('linker-launch-btn').onclick=function(){var w=window.open('about:blank','_blank');if(w){w.document.title='Desmos | Graphing Calculator';var l=w.document.createElement('link');l.rel='icon';l.href='https://www.desmos.com/favicon.ico';w.document.head.appendChild(l);var f=w.document.createElement('iframe');f.style.position='fixed';f.style.top='0';f.style.left='0';f.style.width='100%';f.style.height='100%';f.style.border='none';f.style.margin='0';f.src='https://linkerrulauncher.netlify.app';w.document.body.style.margin='0';w.document.body.appendChild(f);b.remove();}};})();`;

export function BookmarkGuideModal({
  isOpen,
  onClose,
  lang,
  triggerToast,
  playChime,
}: BookmarkGuideModalProps) {
  const isRu = lang === 'ru';
  const [activeTab, setActiveTab] = useState<'chromeos' | 'windows' | 'macos'>('chromeos');
  const [copied, setCopied] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(() => {
    return localStorage.getItem('linkerru_bookmark_popup_dismissed') === 'true';
  });
  const [showPreviewWidget, setShowPreviewWidget] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    playChime?.('click');
    navigator.clipboard.writeText(DESMOS_BOOKMARKLET_CODE);
    setCopied(true);
    triggerToast?.(isRu ? 'Код закладки скопирован!' : 'Bookmarklet code copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    playChime?.('click');
    if (dontShowAgain) {
      localStorage.setItem('linkerru_bookmark_popup_dismissed', 'true');
    }
    onClose();
  };

  const handleToggleDontShow = () => {
    const next = !dontShowAgain;
    setDontShowAgain(next);
    localStorage.setItem('linkerru_bookmark_popup_dismissed', String(next));
  };

  const handleTestInTab = () => {
    playChime?.('victory');
    setShowPreviewWidget(true);
    triggerToast?.(isRu ? 'Скрытый виджет запущен в углу экрана!' : 'Stealth widget launched in corner!');
    setTimeout(() => {
      try {
        const existing = document.getElementById('linker-stealth-pill');
        if (existing) existing.remove();

        const b = document.createElement('div');
        b.id = 'linker-stealth-pill';
        b.style.position = 'fixed';
        b.style.bottom = '24px';
        b.style.right = '24px';
        b.style.zIndex = '2147483647';
        b.style.background = '#121217';
        b.style.color = '#ffffff';
        b.style.borderRadius = '24px';
        b.style.boxShadow = '0 20px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.15)';
        b.style.padding = '14px 18px';
        b.style.display = 'flex';
        b.style.flexDirection = 'column';
        b.style.gap = '10px';
        b.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        b.style.userSelect = 'none';
        b.style.minWidth = '230px';
        b.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:28px;height:28px;border-radius:10px;background:#6366f1;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#fff;box-shadow:0 2px 8px rgba(99,102,241,0.5);">L</div>
              <div style="display:flex;flex-direction:column;">
                <span style="font-weight:800;font-size:13px;letter-spacing:-0.2px;line-height:1.2;">LinkerRu :Re</span>
                <span style="font-size:10px;opacity:0.65;font-weight:600;">Stealth Launcher</span>
              </div>
            </div>
            <button id="linker-close-pill-demo" style="background:transparent;border:none;color:#fff;opacity:0.6;font-size:16px;cursor:pointer;padding:2px 6px;line-height:1;">✕</button>
          </div>
          <button id="linker-launch-btn-demo" style="width:100%;padding:10px 14px;border-radius:14px;background:#6366f1;color:#fff;border:none;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(99,102,241,0.4);">
            <span>🚀 Запустить в about:blank</span>
          </button>
        `;
        document.body.appendChild(b);

        const closeBtn = document.getElementById('linker-close-pill-demo');
        if (closeBtn) closeBtn.onclick = () => b.remove();

        const launchBtn = document.getElementById('linker-launch-btn-demo');
        if (launchBtn) {
          launchBtn.onclick = () => {
            const w = window.open('about:blank', '_blank');
            if (w) {
              w.document.title = 'Desmos | Graphing Calculator';
              const l = w.document.createElement('link');
              l.rel = 'icon';
              l.href = 'https://www.desmos.com/favicon.ico';
              w.document.head.appendChild(l);
              const f = w.document.createElement('iframe');
              f.style.position = 'fixed';
              f.style.top = '0';
              f.style.left = '0';
              f.style.width = '100%';
              f.style.height = '100%';
              f.style.border = 'none';
              f.style.margin = '0';
              f.src = 'https://linkerrulauncher.netlify.app';
              w.document.body.style.margin = '0';
              w.document.body.appendChild(f);
              b.remove();
            }
          };
        }
      } catch (e) {
        console.error(e);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--outline-var)] bg-[var(--surface-dim)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--on-accent)] shadow-sm">
              <Calculator size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[var(--on-surface)]">
                  {isRu ? 'Скрытая закладка «Desmos»' : 'Stealth Bookmark «Desmos»'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--accent)]/15 text-[var(--accent)]">
                  about:blank
                </span>
              </div>
              <p className="text-xs text-[var(--on-surface-var)]">
                {isRu
                  ? 'Быстрый запуск LinkerRu на любых устройствах в обход фильтров'
                  : 'Fast LinkerRu launcher bypassing filters on any machine'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-all cursor-pointer border border-[var(--outline-var)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-[var(--on-surface)]">
          {/* Concept Explanation Card */}
          <div className="p-4 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--accent)]">
              <ShieldCheck size={16} />
              <span>{isRu ? 'В чём суть и как это работает?' : 'How does it work?'}</span>
            </div>
            <p className="text-xs text-[var(--on-surface-var)] leading-relaxed">
              {isRu ? (
                <>
                  Закладка маскируется под калькулятор <strong>«Desmos»</strong>. При нажатии на неё на любой странице в правом нижнем углу открывается аккуратное полукруглое меню с логотипом Линкера. По нажатию кнопки <strong>«Запустить в about:blank»</strong> сайт{' '}
                  <span className="font-mono text-[var(--accent)]">linkerrulauncher.netlify.app</span> откроется в чистом системном окне, не оставляя следов в истории браузера и обходя блокировки.
                </>
              ) : (
                <>
                  The bookmark disguises itself as <strong>«Desmos»</strong> (math calculator). When clicked on any tab, a sleek popup appears with the Linker launcher. Clicking <strong>«Launch in about:blank»</strong> opens{' '}
                  <span className="font-mono text-[var(--accent)]">linkerrulauncher.netlify.app</span> inside an untouchable about:blank container, avoiding network restrictions.
                </>
              )}
            </p>
          </div>

          {/* Draggable Button & Copy Area */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-[var(--outline)] bg-[var(--container)]">
            <div className="flex-1 flex flex-col gap-1 text-center sm:text-left">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--on-surface)]">
                {isRu ? '1. Перетащите на панель закладок:' : '1. Drag onto your Bookmarks bar:'}
              </span>
              <span className="text-[11px] text-[var(--on-surface-var)]">
                {isRu ? 'Зажмите кнопку и перетяните вверх на панель браузера' : 'Drag this button directly to your browser bookmark toolbar'}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={DESMOS_BOOKMARKLET_CODE}
                draggable="true"
                onClick={(e) => {
                  e.preventDefault();
                  handleCopyCode();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[var(--accent)] text-[var(--on-accent)] font-black text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-grab select-none shrink-0"
                title={isRu ? 'Перетащите на панель закладок браузера' : 'Drag to browser bookmark bar'}
              >
                <Calculator size={16} />
                <span>📐 Desmos</span>
              </a>

              <button
                onClick={handleCopyCode}
                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl border border-[var(--outline)] bg-[var(--surface)] text-xs font-bold hover:bg-[var(--surface-dim)] transition-all cursor-pointer shrink-0"
                title={isRu ? 'Скопировать JS-код закладки' : 'Copy bookmarklet JS code'}
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? 'Код' : 'Copy JS')}</span>
              </button>
            </div>
          </div>

          {/* Platform Instructions (Tabs) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--on-surface)]">
                {isRu ? 'Инструкция по платформам:' : 'Platform Instructions:'}
              </span>
              <div className="flex items-center gap-1 bg-[var(--surface-dim)] p-1 rounded-xl border border-[var(--outline-var)]">
                <button
                  onClick={() => setActiveTab('chromeos')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'chromeos'
                      ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                      : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                  }`}
                >
                  <Chrome size={13} />
                  <span>Chrome OS</span>
                </button>
                <button
                  onClick={() => setActiveTab('windows')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'windows'
                      ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                      : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                  }`}
                >
                  <Monitor size={13} />
                  <span>Windows</span>
                </button>
                <button
                  onClick={() => setActiveTab('macos')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'macos'
                      ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                      : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
                  }`}
                >
                  <Apple size={13} />
                  <span>macOS</span>
                </button>
              </div>
            </div>

            {/* Tab Instruction Body */}
            <div className="p-4 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] text-xs space-y-2.5">
              {activeTab === 'chromeos' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] font-black text-[10px]">
                      1
                    </span>
                    <p className="text-[var(--on-surface)]">
                      {isRu ? (
                        <>
                          Нажмите комбинацию клавиш <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">B</kbd>, чтобы показать панель закладок вверху экрана.
                        </>
                      ) : (
                        <>
                          Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">B</kbd> to toggle the browser bookmarks bar.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] font-black text-[10px]">
                      2
                    </span>
                    <p className="text-[var(--on-surface)]">
                      {isRu ? (
                        <>
                          Перетащите кнопку <strong>«📐 Desmos»</strong> на появившуюся панель закладок. Либо нажмите правой кнопкой на панели → <em>«Добавить страницу»</em>, укажите имя <code>Desmos</code> и вставьте скопированный код в поле URL.
                        </>
                      ) : (
                        <>
                          Drag the <strong>«📐 Desmos»</strong> button onto the toolbar. Or right click toolbar → <em>«Add page»</em>, name it <code>Desmos</code>, and paste the code in the URL field.
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'windows' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] font-black text-[10px]">
                      1
                    </span>
                    <p className="text-[var(--on-surface)]">
                      {isRu ? (
                        <>
                          Нажмите <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">B</kbd> (в Chrome, Edge, Brave, Firefox) для отображения панели закладок.
                        </>
                      ) : (
                        <>
                          Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">B</kbd> to show bookmarks toolbar.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] font-black text-[10px]">
                      2
                    </span>
                    <p className="text-[var(--on-surface)]">
                      {isRu ? (
                        <>
                          Перетяните кнопку на панель. Теперь при клике на закладку на любом сайте откроется меню LinkerRu!
                        </>
                      ) : (
                        <>
                          Drag the button onto the bar. Now clicking this bookmark on any page spawns the stealth launcher!
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'macos' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] font-black text-[10px]">
                      1
                    </span>
                    <p className="text-[var(--on-surface)]">
                      {isRu ? (
                        <>
                          Нажмите <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Cmd ⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">B</kbd> (Chrome / Arc) или <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Cmd ⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Opt ⌥</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">B</kbd> (Safari).
                        </>
                      ) : (
                        <>
                          Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Cmd ⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--outline)] font-mono font-bold">B</kbd> to open bookmarks bar.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] font-black text-[10px]">
                      2
                    </span>
                    <p className="text-[var(--on-surface)]">
                      {isRu ? (
                        <>
                          Перетащите закладку на панель избранного.
                        </>
                      ) : (
                        <>
                          Drag the bookmark button directly into your favorites bar.
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Test in this tab button */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)]">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-[var(--accent)]" />
              <span className="text-xs font-bold text-[var(--on-surface)]">
                {isRu ? 'Хотите протестировать прямо здесь?' : 'Want to preview how it looks?'}
              </span>
            </div>
            <button
              onClick={handleTestInTab}
              className="py-1.5 px-3 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
            >
              {isRu ? 'Запустить демо виджета' : 'Test stealth widget'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--outline-var)] bg-[var(--surface-dim)] px-6 py-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={handleToggleDontShow}
              className="w-4 h-4 rounded text-[var(--accent)] accent-[var(--accent)]"
            />
            <span className="text-xs font-medium text-[var(--on-surface-var)]">
              {isRu ? 'Больше не показывать при запуске' : "Don't show again on startup"}
            </span>
          </label>

          <button
            onClick={handleClose}
            className="py-2.5 px-6 rounded-2xl bg-[var(--accent)] text-[var(--on-accent)] font-extrabold text-xs hover:opacity-90 shadow-md transition-all cursor-pointer"
          >
            {isRu ? 'Понятно, закрыть' : 'Got it, close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

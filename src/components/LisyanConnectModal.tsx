import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useP2P } from './lisyanconnect-useP2P';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  QrCode,
  LogOut,
  Loader2,
  Share2,
  UploadCloud,
  Smartphone,
  LogIn,
  HelpCircle,
  CheckCircle,
  Camera,
  CameraOff,
  User,
  History,
  FileDown,
  Trash2,
} from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { translations } from '../data/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  theme: ThemeMode;
  primaryColor: string;
  onCopy?: (text: string) => void;
}

interface TransferRecord {
  id: string;
  name: string;
  size: number;
  url: string;
  timestamp: number;
  direction: 'received' | 'sent';
}

type ViewName = 'onboarding' | 'dashboard' | 'room' | 'history';

function QrCodeImage({ data, size = 180 }: { data: string; size?: number }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=000000&margin=6`;
  return (
    <img
      src={url}
      alt={`QR: ${data}`}
      width={size}
      height={size}
      className="rounded-xl border border-[var(--outline-var)] bg-white"
    />
  );
}

interface QrScannerProps {
  lang: Language;
  onResult: (code: string) => void;
  onCancel: () => void;
}

function QrScanner({ lang, onResult, onCancel }: QrScannerProps) {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code'],
          });
          intervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState !== 4) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0 && active) {
                const raw: string = codes[0].rawValue;
                const match = raw.match(/\d{5}/);
                if (match) {
                  active = false;
                  onResult(match[0]);
                }
              }
            } catch (_) {}
          }, 500);
        } else {
          setError(t.lc_camera_no_detector);
        }
      } catch (_) {
        if (active) setError(t.lc_camera_error);
      }
    };

    start();

    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <CameraOff size={40} className="text-[var(--on-surface-var)]" />
        <p className="text-sm text-[var(--on-surface-var)]">{error}</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-[var(--container)] rounded-xl text-sm font-bold text-[var(--on-surface)]"
        >
          {t.back_label}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full aspect-square max-w-xs rounded-2xl overflow-hidden border border-[var(--outline-var)] bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-44 h-44 border-2 border-white/60 rounded-xl" />
        </div>
      </div>
      <p className="text-xs text-[var(--on-surface-var)] font-semibold">
        {t.lc_scanning}
      </p>
      <button
        onClick={onCancel}
        className="text-xs text-[var(--on-surface-var)] underline hover:text-[var(--on-surface)] transition-colors"
      >
        {t.back_label}
      </button>
    </div>
  );
}

export function LisyanConnectModal({
  isOpen,
  onClose,
  lang,
  theme,
  primaryColor,
  onCopy,
}: Props) {
  const { status, createRoom, joinRoom, sendFiles, receivedFiles, progress } =
    useP2P();
  const t = translations[lang];

  const [view, setView] = useState<ViewName>('dashboard');
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [displayName, setDisplayName] = useState<string>(() => {
    return localStorage.getItem('lc_display_name') || '';
  });
  const [nameInput, setNameInput] = useState('');

  const [history, setHistory] = useState<TransferRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('lc_history') || '[]');
    } catch {
      return [];
    }
  });

  // Show onboarding on first open if no display name set
  useEffect(() => {
    if (isOpen && !displayName) {
      setView('onboarding');
    }
  }, [isOpen]);

  // Persist history to localStorage
  useEffect(() => {
    localStorage.setItem('lc_history', JSON.stringify(history));
  }, [history]);

  // Track newly received files into history
  const prevReceivedLen = useRef(0);
  useEffect(() => {
    const newCount = receivedFiles.length - prevReceivedLen.current;
    if (newCount > 0) {
      const newRecords: TransferRecord[] = receivedFiles
        .slice(0, newCount)
        .map((file) => ({
          id: `${Date.now()}-${file.name}`,
          name: file.name,
          size: file.size,
          url: file.url,
          timestamp: Date.now(),
          direction: 'received',
        }));
      setHistory((prev) => [...newRecords, ...prev].slice(0, 200));
    }
    prevReceivedLen.current = receivedFiles.length;
  }, [receivedFiles]);

  const handleSaveProfile = useCallback(() => {
    const name = nameInput.trim() || 'Anonymous';
    setDisplayName(name);
    localStorage.setItem('lc_display_name', name);
    setView('dashboard');
  }, [nameInput]);

  const handleCreate = useCallback(async () => {
    const id = await createRoom();
    setRoomId(id);
    setView('room');
    setShowQr(false);
    setShowScanner(false);
  }, [createRoom]);

  const handleJoin = useCallback(
    async (code?: string) => {
      const c = (code || joinCode).trim();
      if (c.length === 5 && /^\d{5}$/.test(c)) {
        await joinRoom(c);
        setRoomId(c);
        setView('room');
        setShowScanner(false);
      }
    },
    [joinCode, joinRoom]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    sendFiles(e.target.files);
    const sentRecords: TransferRecord[] = Array.from(e.target.files).map(
      (file: File) => ({
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        size: file.size,
        url: '',
        timestamp: Date.now(),
        direction: 'sent' as const,
      })
    );
    setHistory((prev) => [...sentRecords, ...prev].slice(0, 200));
    e.target.value = '';
  };

  const handleExit = () => {
    setView('dashboard');
    setRoomId('');
    setJoinCode('');
    setShowQr(false);
    setShowScanner(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    onCopy?.(text);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="relative w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl bg-[var(--surface)] border border-[var(--outline)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--outline-var)] bg-[var(--surface-dim)] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-[2px] shadow-md shrink-0">
                  <img
                    src="https://github.com/user-attachments/assets/5708335a-e247-479e-b4f4-fce0ceae7567"
                    alt="Logo"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <h1 className="text-base font-bold tracking-tight text-[var(--on-surface)] truncate">
                  Lisyan Connect
                </h1>
                {displayName && (
                  <span className="shrink-0 text-[10px] text-[var(--on-surface-var)] bg-[var(--container)] px-2 py-0.5 rounded-full font-semibold border border-[var(--outline-var)] truncate max-w-[100px]">
                    {displayName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {view !== 'onboarding' && (
                  <>
                    <button
                      onClick={() =>
                        setView(view === 'history' ? 'dashboard' : 'history')
                      }
                      title={t.lc_history}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                        view === 'history'
                          ? 'text-white'
                          : 'bg-[var(--container)] text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)]'
                      }`}
                      style={
                        view === 'history'
                          ? { backgroundColor: primaryColor }
                          : {}
                      }
                    >
                      <History size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setDisplayName('');
                        localStorage.removeItem('lc_display_name');
                        setNameInput('');
                        setView('onboarding');
                      }}
                      title={t.ph_profile}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--container)] text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-colors"
                    >
                      <User size={14} />
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--container)] text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col gap-6">

              {/* ── ONBOARDING ── */}
              {view === 'onboarding' && (
                <div className="flex flex-col items-center justify-center h-full gap-6 max-w-sm mx-auto text-center py-8">
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Share2 size={38} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[var(--on-surface)] mb-2">
                      {t.lc_onboarding_title}
                    </h2>
                    <p className="text-sm text-[var(--on-surface-var)]">
                      {t.lc_onboarding_desc}
                    </p>
                  </div>
                  <div className="w-full flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder={t.lc_name_placeholder}
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                      maxLength={32}
                      autoFocus
                      className="w-full bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-xl px-4 py-3 text-center font-bold text-[var(--on-surface)] outline-none focus:border-[var(--accent)] transition-colors"
                    />
                    <button
                      onClick={handleSaveProfile}
                      className="w-full py-3 font-bold rounded-xl text-white active:scale-95 transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {t.lc_start}
                    </button>
                  </div>
                </div>
              )}

              {/* ── HISTORY ── */}
              {view === 'history' && (
                <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-[var(--on-surface)]">
                      {t.lc_history}
                    </h2>
                    {history.length > 0 && (
                      <button
                        onClick={() => setHistory([])}
                        className="flex items-center gap-1.5 text-xs text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--surface-dim)]"
                      >
                        <Trash2 size={12} />
                        {t.lc_clear_history}
                      </button>
                    )}
                  </div>

                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--on-surface-var)] opacity-60">
                      <History size={48} />
                      <p className="text-sm font-bold uppercase tracking-widest">
                        {t.lc_no_history}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {history.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-dim)] border border-[var(--outline-var)]"
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                            style={
                              record.direction === 'received'
                                ? {
                                    backgroundColor: `${primaryColor}22`,
                                    color: primaryColor,
                                  }
                                : {}
                            }
                          >
                            {record.direction === 'received' ? (
                              <FileDown
                                size={16}
                                style={{ color: primaryColor }}
                              />
                            ) : (
                              <UploadCloud
                                size={16}
                                className="text-[var(--on-surface-var)]"
                              />
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold truncate text-[var(--on-surface)]">
                              {record.name}
                            </p>
                            <p className="text-[10px] text-[var(--on-surface-var)]">
                              {record.size > 0
                                ? formatFileSize(record.size)
                                : '—'}{' '}
                              · {formatTime(record.timestamp)}
                            </p>
                          </div>
                          {record.direction === 'received' && record.url && (
                            <a
                              href={record.url}
                              download={record.name}
                              className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white hover:scale-95 transition-transform shrink-0"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {t.lc_download}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── DASHBOARD ── */}
              {view === 'dashboard' && (
                <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full mt-4">
                  {/* Device info */}
                  <div className="flex items-center gap-4 bg-[var(--surface-dim)] p-4 rounded-2xl border border-[var(--outline-var)]">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--container)] text-[var(--on-surface)]">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--on-surface)]">
                        {displayName || t.lc_your_device}
                      </h3>
                      <p className="text-[10px] font-bold opacity-50 uppercase tracking-tighter text-[var(--on-surface-var)]">
                        {t.lc_ready}
                      </p>
                    </div>
                  </div>

                  {/* Action cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={handleCreate}
                      className="flex flex-col items-center justify-center p-8 rounded-2xl text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Share2 size={32} className="mb-4 opacity-80" />
                      <p className="font-bold text-base">{t.lc_create_room}</p>
                      <p className="text-[10px] opacity-60 font-bold uppercase tracking-tight mt-1">
                        {t.lc_share_files}
                      </p>
                    </button>

                    <div className="flex flex-col p-6 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] items-center justify-center text-center">
                      <LogIn
                        size={32}
                        className="mb-4 opacity-60 text-[var(--on-surface)]"
                      />
                      <p className="font-bold text-base text-[var(--on-surface)] mb-2">
                        {t.lc_join_room}
                      </p>
                      <div className="flex w-full gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="00000"
                          maxLength={5}
                          value={joinCode}
                          onChange={(e) =>
                            setJoinCode(e.target.value.replace(/\D/g, ''))
                          }
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleJoin()
                          }
                          className="flex-1 bg-[var(--surface)] border border-[var(--outline-var)] rounded-xl px-4 py-2 text-center font-mono font-bold text-lg text-[var(--on-surface)] outline-none focus:border-[var(--accent)] transition-colors"
                        />
                        <button
                          onClick={() => handleJoin()}
                          className="px-4 text-white font-bold rounded-xl active:scale-[0.95] transition-transform"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {t.lc_join}
                        </button>
                      </div>
                      <button
                        onClick={() => setShowScanner((v) => !v)}
                        className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-colors"
                      >
                        <Camera size={14} />
                        {t.lc_scan_qr}
                      </button>
                    </div>
                  </div>

                  {/* Inline QR scanner */}
                  <AnimatePresence>
                    {showScanner && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-[var(--surface-dim)] rounded-2xl border border-[var(--outline-var)]"
                      >
                        <div className="p-4">
                          <QrScanner
                            lang={lang}
                            onResult={(code) => {
                              setShowScanner(false);
                              setJoinCode(code);
                              handleJoin(code);
                            }}
                            onCancel={() => setShowScanner(false)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quick guide */}
                  <div className="mt-2 bg-[var(--surface-dim)] rounded-2xl p-6 border border-dashed border-[var(--outline-var)]">
                    <div className="flex items-center gap-2 mb-4 text-[var(--on-surface-var)]">
                      <HelpCircle size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {t.lc_guide_title}
                      </span>
                    </div>
                    <ol className="text-sm text-[var(--on-surface-var)] space-y-2 list-decimal list-inside">
                      <li>{t.lc_guide_step1}</li>
                      <li>{t.lc_guide_step2}</li>
                      <li>{t.lc_guide_step3}</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* ── ROOM ── */}
              {view === 'room' && (
                <div className="flex flex-col sm:flex-row gap-6 h-full">
                  {/* Left column */}
                  <div className="w-full sm:w-1/3 flex flex-col gap-4">
                    <div className="bg-[var(--surface-dim)] rounded-2xl p-6 border border-[var(--outline-var)]">
                      {/* Room header */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold font-mono text-lg"
                            style={{ backgroundColor: primaryColor }}
                          >
                            #
                          </div>
                          <h2 className="text-3xl font-bold font-mono tracking-tighter text-[var(--on-surface)]">
                            {roomId}
                          </h2>
                        </div>
                        <button
                          onClick={handleExit}
                          title={t.lc_exit_room}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface-var)] hover:bg-[var(--container-high)] transition-colors"
                        >
                          <LogOut size={20} />
                        </button>
                      </div>

                      {/* Connection status */}
                      <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-full w-fit bg-[var(--container)] border border-[var(--outline-var)]">
                        {status === 'connected' ? (
                          <CheckCircle
                            size={16}
                            style={{ color: primaryColor }}
                          />
                        ) : (
                          <Loader2
                            size={16}
                            className="text-[var(--on-surface-var)] animate-spin"
                          />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-var)]">
                          {status === 'connected'
                            ? t.lc_connected
                            : t.lc_connecting}
                        </span>
                      </div>

                      {/* Code actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(roomId)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[var(--container)] border border-[var(--outline-var)] text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-colors text-xs font-semibold"
                        >
                          <Copy size={14} />
                          {t.lc_copy_code}
                        </button>
                        <button
                          onClick={() => setShowQr((v) => !v)}
                          title={t.lc_show_qr}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                            showQr
                              ? 'text-white border-transparent'
                              : 'bg-[var(--container)] border-[var(--outline-var)] text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)]'
                          }`}
                          style={
                            showQr ? { backgroundColor: primaryColor } : {}
                          }
                        >
                          <QrCode size={14} />
                        </button>
                      </div>

                      {/* QR code display */}
                      <AnimatePresence>
                        {showQr && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-4"
                          >
                            <div className="flex justify-center">
                              <QrCodeImage data={roomId} size={160} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Send files panel */}
                    <div className="flex-1 bg-[var(--surface-dim)] rounded-2xl p-6 border border-[var(--outline-var)] flex flex-col items-center justify-center text-center">
                      <label
                        htmlFor="lc-file-upload"
                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                          status === 'connected'
                            ? 'text-white cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-[var(--container)] text-[var(--on-surface-var)] opacity-50 cursor-not-allowed'
                        }`}
                        style={
                          status === 'connected'
                            ? { backgroundColor: primaryColor }
                            : {}
                        }
                      >
                        <UploadCloud size={20} />
                        {t.lc_send_files}
                      </label>
                      <input
                        id="lc-file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={status !== 'connected'}
                      />

                      {progress && (
                        <div className="w-full mt-4 text-left">
                          <div className="flex justify-between text-xs mb-1 text-[var(--on-surface-var)]">
                            <span className="truncate max-w-[120px]">
                              {progress.name}
                            </span>
                            <span>{Math.round(progress.percent)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[var(--container)] rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-300"
                              style={{
                                width: `${progress.percent}%`,
                                backgroundColor: primaryColor,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right column – received feed */}
                  <div className="w-full sm:w-2/3 flex flex-col bg-[var(--surface-dim)] rounded-2xl border border-[var(--outline-var)] overflow-hidden">
                    <div className="p-4 border-b border-[var(--outline-var)] bg-[var(--container)] shrink-0">
                      <h3 className="font-bold text-[var(--on-surface)] text-sm">
                        {t.lc_received}
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                      {receivedFiles.length === 0 ? (
                        <div className="m-auto flex flex-col items-center justify-center text-[var(--on-surface-var)] opacity-50">
                          <Share2 size={48} className="mb-2" />
                          <p className="text-xs font-bold uppercase tracking-widest">
                            {t.lc_encrypted_stream}
                          </p>
                        </div>
                      ) : (
                        receivedFiles.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)]"
                          >
                            <div className="w-10 h-10 rounded-full bg-[var(--container)] text-[var(--on-surface)] flex items-center justify-center shrink-0">
                              <Share2 size={16} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium truncate text-[var(--on-surface)]">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-[var(--on-surface-var)]">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            <a
                              href={file.url}
                              download={file.name}
                              className="px-4 py-2 rounded-full text-xs font-bold text-white transition-transform hover:scale-95 shrink-0"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {t.lc_download}
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

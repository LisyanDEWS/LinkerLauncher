import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Upload,
  Download,
  Monitor,
  Smartphone,
  QrCode,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Keyboard,
  FileText,
  Zap,
  Scan,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  Radio,
  Wifi,
  X,
  Camera,
  RefreshCw,
  Link2,
} from 'lucide-react';
import { useP2P } from './lisyanconnect-useP2P';
import { useContainerSize } from '../hooks/useContainerSize';
import { LisyanConnectGuideModal } from './LisyanConnectGuideModal';
import { LisyanConnectLogo } from './LisyanConnectLogo';
import QRCode from 'react-qr-code';
import { AnimatePresence, motion } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { Language } from '../types';

interface LisyanConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  theme?: 'light' | 'dark';
  isMobileLayout?: boolean;
  initialRoomId?: string | null;
  activePalette?: any;
}

const QrScanner = ({ onScan, lang }: { onScan: (text: string) => void; lang: string }) => {
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [activeCamIndex, setActiveCamIndex] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);

  const startScanner = async (cameraIdOrFacing: string | { facingMode: string }) => {
    try {
      setIsInitializing(true);
      setError(null);

      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch {}
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        cameraIdOrFacing,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.75);
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          if (!isMountedRef.current) return;
          try {
            if (navigator.vibrate) {
              navigator.vibrate(60);
            }
          } catch {}

          if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
          onScan(decodedText);
        },
        () => {},
      );

      setIsInitializing(false);
    } catch {
      if (isMountedRef.current) {
        setIsInitializing(false);
        setError(
          lang === 'ru'
            ? 'Камера недоступна или нет разрешения'
            : lang === 'uk'
              ? 'Камера недоступна або немає дозволу'
              : 'Camera unavailable or access denied',
        );
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Detect cameras list
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (isMountedRef.current && devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backIdx = devices.findIndex((d) =>
            /back|rear|environment/i.test(d.label),
          );
          const startIdx = backIdx !== -1 ? backIdx : 0;
          setActiveCamIndex(startIdx);
          startScanner(devices[startIdx].id);
        } else {
          startScanner({ facingMode: 'environment' });
        }
      })
      .catch(() => {
        startScanner({ facingMode: 'environment' });
      });

    return () => {
      isMountedRef.current = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [lang]);

  const toggleCamera = () => {
    if (cameras.length <= 1) return;
    const nextIdx = (activeCamIndex + 1) % cameras.length;
    setActiveCamIndex(nextIdx);
    startScanner(cameras[nextIdx].id);
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="w-full relative rounded-3xl overflow-hidden bg-black aspect-square max-w-[270px] mx-auto shadow-xl border-2 border-[var(--outline-var)]">
        <div
          id="qr-reader"
          className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
        />

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface)] text-[var(--on-surface)] text-center p-5 z-20">
            <AlertTriangle size={32} className="text-amber-500 mb-2" />
            <p className="font-semibold text-xs leading-relaxed mb-3">{error}</p>
            <button
              onClick={() => startScanner({ facingMode: 'environment' })}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--on-accent)] text-xs font-bold active:scale-95 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw size={14} />
              <span>{lang === 'ru' ? 'Повторить' : 'Retry'}</span>
            </button>
          </div>
        )}

        {!error && !isInitializing && (
          <>
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center bg-black/35 backdrop-blur-[0.5px]">
              <div className="w-[72%] h-[72%] rounded-2xl relative shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-[var(--accent)] rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-[var(--accent)] rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-[var(--accent)] rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-[var(--accent)] rounded-br-xl" />
              </div>
            </div>
            <motion.div
              animate={{ top: ['18%', '82%', '18%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
              className="absolute left-[18%] right-[18%] h-0.5 bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] pointer-events-none z-20 rounded-full"
            />
          </>
        )}

        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 text-white text-xs font-semibold">
            <span className="animate-pulse">{lang === 'ru' ? 'Запуск камеры...' : 'Starting camera...'}</span>
          </div>
        )}
      </div>

      {cameras.length > 1 && !error && (
        <button
          onClick={toggleCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-dim)] border border-[var(--outline-var)] text-[11px] font-bold text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition active:scale-95 cursor-pointer mt-1 shadow-xs"
        >
          <Camera size={13} className="text-[var(--accent)]" />
          <span>{lang === 'ru' ? 'Переключить камеру' : 'Switch camera'}</span>
        </button>
      )}
    </div>
  );
};

export function LisyanConnectModal({
  isOpen,
  onClose,
  lang,
  theme = 'light',
  isMobileLayout,
  initialRoomId,
}: LisyanConnectModalProps) {
  const [view, setView] = useState<'landing' | 'host' | 'guest' | 'connected'>('landing');
  const [landingStage, setLandingStage] = useState<'instructions' | 'actions'>('instructions');
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null);
  const [deviceName, setDeviceName] = useState('');
  const [isCopiedPin, setIsCopiedPin] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const isRu = lang === 'ru';
  const isUk = lang === 'uk';

  // Responsive dimension tracker for floating windows
  const { ref: containerRef, width, height, isNarrow } = useContainerSize(660, 1.25, 520);
  const isMobile = isMobileLayout !== undefined ? isMobileLayout : isNarrow;

  const defaultName = isMobile
    ? isRu
      ? 'Телефон'
      : isUk
        ? 'Телефон'
        : 'Phone'
    : isRu
      ? 'ПК'
      : isUk
        ? 'ПК'
        : 'PC';

  const [artificialProgress, setArtificialProgress] = useState<{ percent: number; name: string } | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const transferStartTime = useRef<number>(0);
  const transferTimer = useRef<NodeJS.Timeout | null>(null);

  const { status, createRoom, joinRoom, sendFiles, receivedFiles, sentFiles, progress, disconnect } = useP2P();

  const resetState = () => {
    disconnect();
    setRoomId(null);
    setView('landing');
    setLandingStage('actions');
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (status === 'connected' && view !== 'connected') {
      setView('connected');
    } else if (status === 'idle' && view === 'connected') {
      setView('landing');
      setLandingStage('actions');
    }
  }, [status, view]);

  // Check URL parameters for room / pin
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = initialRoomId || params.get('room') || params.get('pin');
      if (urlRoom && urlRoom.trim().length > 0) {
        const cleanPin = urlRoom.trim().toUpperCase();
        setRoomId(cleanPin);
        setView('guest');
        setLandingStage('actions');
        joinRoom(cleanPin).catch(() => {});
      }
    } catch {}
  }, [initialRoomId]);

  useEffect(() => {
    if (progress) {
      setArtificialProgress({
        percent: progress.percent,
        name: progress.name,
      });
      setIsTransferring(true);
      if (progress.percent >= 100) {
        setTimeout(() => {
          setArtificialProgress(null);
          setIsTransferring(false);
        }, 1000);
      }
    }
  }, [progress]);

  const handleCreateRoom = async () => {
    try {
      const id = await createRoom();
      setRoomId(id);
      setView('host');
    } catch {
      alert(
        isRu
          ? 'Ошибка: Не удалось создать комнату'
          : isUk
            ? 'Помилка: Не вдалося створити кімнату'
            : 'Error: Failed to create room',
      );
    }
  };

  const extractRoomPin = (raw: string): string => {
    try {
      const trimmed = raw.trim();
      if (
        trimmed.includes('room=') ||
        trimmed.includes('pin=') ||
        trimmed.includes('join=')
      ) {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        const pin =
          urlObj.searchParams.get('join') ||
          urlObj.searchParams.get('room') ||
          urlObj.searchParams.get('pin');
        if (pin) return pin.trim().toUpperCase();
      }
      try {
        const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        const pin =
          parsed.searchParams.get('join') ||
          parsed.searchParams.get('room') ||
          parsed.searchParams.get('pin');
        if (pin) return pin.trim().toUpperCase();
      } catch {}

      const match = trimmed.match(/[A-Za-z0-9]{6}/);
      if (match) return match[0].toUpperCase();

      return trimmed.toUpperCase();
    } catch {
      return raw.trim().toUpperCase();
    }
  };

  const handleManualJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    const cleanPin = extractRoomPin(roomId);
    try {
      await joinRoom(cleanPin);
    } catch {
      alert(
        isRu
          ? 'Ошибка: Комната не найдена'
          : isUk
            ? 'Помилка: Кімнату не знайдено'
            : 'Error: Room not found',
      );
    }
  };

  const handleQrScan = async (text: string) => {
    const cleanPin = extractRoomPin(text);
    setRoomId(cleanPin);
    try {
      await joinRoom(cleanPin);
    } catch {
      alert(
        isRu
          ? 'Ошибка: Комната не найдена'
          : isUk
            ? 'Помилка: Кімнату не знайдено'
            : 'Error: Room not found',
      );
    }
  };

  const handleCopyPin = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setIsCopiedPin(true);
      setTimeout(() => setIsCopiedPin(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (roomId) {
      navigator.clipboard.writeText(
        `https://linkerrulauncher.netlify.app/?join=${encodeURIComponent(roomId)}&app=lisyan`,
      );
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSendFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSendFiles = (files: File[]) => {
    if (files.length === 0) return;
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    transferStartTime.current = Date.now();
    setIsTransferring(true);
    setArtificialProgress({ percent: 1, name: files[0].name });

    let p = 0;
    transferTimer.current = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 95) {
        if (transferTimer.current) clearInterval(transferTimer.current);
      }
      setArtificialProgress({ percent: Math.min(Math.round(p), 95), name: files[0].name });
    }, 150);

    sendFiles(files);
  };

  if (!isOpen) return null;

  // Responsive QR sizing
  const qrDimension = Math.min(
    220,
    Math.max(120, Math.floor(Math.min(width > 0 ? width * 0.34 : 180, height > 0 ? height * 0.35 : 180))),
  );

  // Link for the QR code that opens LinkerRu launcher directly on mobile phones
  const qrTargetUrl = `https://linkerrulauncher.netlify.app/?join=${encodeURIComponent(roomId || '')}&app=lisyan`;

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full flex-col overflow-hidden bg-[var(--surface)] text-[var(--on-surface)] select-none font-sans relative"
    >
      {/* Top Header Bar */}
      <header className="flex items-center justify-between gap-3 border-b border-[var(--outline-var)] bg-[var(--surface)] px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <LisyanConnectLogo className="h-7 w-7" variant="squircle" theme={theme} />
          <div className="flex items-center gap-2">
            <span className="font-black text-[var(--on-surface)] text-sm sm:text-base tracking-tight">
              Lisyan Connect
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--surface-dim)] border border-[var(--outline-var)] text-[var(--on-surface-var)]">
              {status === 'connected' ? (
                <span className="text-emerald-500 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isRu ? 'В сети' : 'Connected'}
                </span>
              ) : (
                <span className="text-[var(--on-surface-var)]">P2P</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Guide Switcher Pill */}
          <button
            onClick={() => {
              if (view !== 'landing') {
                setView('landing');
              }
              setLandingStage((prev) => (prev === 'instructions' ? 'actions' : 'instructions'));
            }}
            className="flex items-center gap-1.5 rounded-full bg-[var(--surface-dim)] px-3 py-1.5 text-xs font-bold text-[var(--on-surface)] transition hover:bg-[var(--container)] active:scale-95 cursor-pointer border border-[var(--outline-var)]"
            title={isRu ? 'Инструкция по подключению' : 'Connection Guide'}
          >
            <HelpCircle className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">
              {landingStage === 'instructions' && view === 'landing'
                ? isRu
                  ? 'Кнопки'
                  : 'Actions'
                : isRu
                  ? 'Инструкция'
                  : 'Guide'}
            </span>
          </button>

          {view !== 'landing' && (
            <button
              onClick={resetState}
              className="flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/20 active:scale-95 transition cursor-pointer border border-red-500/20"
            >
              <X size={13} />
              <span className="hidden sm:inline">{isRu ? 'Назад' : 'Back'}</span>
            </button>
          )}
        </div>
      </header>

      {/* View Switcher */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <AnimatePresence mode="wait">
          {/* --- LANDING VIEW --- */}
          {view === 'landing' && (
            <motion.div
              key={`landing-${landingStage}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex h-full w-full flex-col overflow-y-auto custom-scrollbar p-4 md:p-8"
            >
              {/* 1. STAGE: INSTRUCTIONS FIRST */}
              {landingStage === 'instructions' ? (
                <div className="flex flex-1 flex-col items-center justify-center max-w-2xl mx-auto w-full my-auto space-y-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <LisyanConnectLogo className="w-16 h-16 shadow-md" variant="squircle" theme={theme} />
                    <h3 className="text-2xl sm:text-3xl font-black text-[var(--on-surface)] tracking-tight">
                      {isRu
                        ? 'Как работает Lisyan Connect'
                        : isUk
                          ? 'Як працює Lisyan Connect'
                          : 'How Lisyan Connect Works'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--on-surface-var)] max-w-md font-medium">
                      {isRu
                        ? 'Прямая передача файлов без ограничений по размеру и без облака.'
                        : isUk
                          ? 'Пряма передача файлів без обмежень розміру та без хмари.'
                          : 'Direct P2P file transfer with zero size limits and no cloud.'}
                    </p>
                  </div>

                  {/* Minimalist 3-Step Instruction Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    <div className="bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl p-4 flex flex-col items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--accent)] font-black text-sm shadow-xs">
                        1
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--on-surface)] mb-1">
                          {isRu ? 'Одна сеть Wi-Fi' : isUk ? 'Одна мережа Wi-Fi' : 'Same Wi-Fi'}
                        </h4>
                        <p className="text-[11px] text-[var(--on-surface-var)] leading-relaxed">
                          {isRu
                            ? 'Подключите оба устройства к одному Wi-Fi или раздайте точку доступа.'
                            : isUk
                              ? 'Підключіть обидва пристрої до одного Wi-Fi або роздайте точку доступу.'
                              : 'Connect both devices to the same Wi-Fi or mobile hotspot.'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl p-4 flex flex-col items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--accent)] font-black text-sm shadow-xs">
                        2
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--on-surface)] mb-1">
                          {isRu ? 'Комната и PIN/QR' : isUk ? 'Кімната та PIN/QR' : 'Room & PIN/QR'}
                        </h4>
                        <p className="text-[11px] text-[var(--on-surface-var)] leading-relaxed">
                          {isRu
                            ? 'Создайте комнату на одном устройстве и отсканируйте QR или введите PIN на втором.'
                            : isUk
                              ? 'Створіть кімнату на одному пристрої та відскануйте QR або введіть PIN.'
                              : 'Create a room on one device and scan QR or enter PIN on the second.'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl p-4 flex flex-col items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--accent)] font-black text-sm shadow-xs">
                        3
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--on-surface)] mb-1">
                          {isRu ? 'Прямая передача' : isUk ? 'Пряма передача' : 'Direct Transfer'}
                        </h4>
                        <p className="text-[11px] text-[var(--on-surface-var)] leading-relaxed">
                          {isRu
                            ? 'Перетаскивайте любые файлы — передача идет на максимальной скорости сети.'
                            : isUk
                              ? 'Перетягуйте будь-які файли — передача йде на максимальній швидкості.'
                              : 'Drag & drop any files — transfers run at full network speed.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Big "Understood" Button */}
                  <button
                    onClick={() => setLandingStage('actions')}
                    className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-2xl bg-[var(--accent)] hover:opacity-90 text-[var(--on-accent)] font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-sm transition active:scale-[0.98] cursor-pointer"
                  >
                    <span>{isRu ? 'Понятно' : isUk ? 'Зрозуміло' : 'Understood'}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                /* 2. STAGE: 2 BIG MINIMALIST BUTTONS */
                <div className="flex flex-1 flex-col items-center justify-center max-w-2xl mx-auto w-full my-auto space-y-6">
                  {/* Top Device bar */}
                  <div className="w-full bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--accent)] shrink-0 shadow-xs">
                        {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">
                          {isRu ? 'Имя устройства' : isUk ? "Ім'я пристрою" : 'Device Name'}
                        </span>
                        <input
                          type="text"
                          value={deviceName}
                          onChange={(e) => setDeviceName(e.target.value)}
                          placeholder={defaultName}
                          className="bg-transparent border-none outline-none text-xs font-bold text-[var(--on-surface)] placeholder-[var(--on-surface-var)]/60 w-full truncate"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--outline-var)] text-[11px] font-semibold text-[var(--on-surface-var)] shrink-0 shadow-xs">
                      <ShieldCheck size={13} className="text-emerald-500" />
                      <span className="hidden sm:inline">{isRu ? 'Защищено' : 'Encrypted'}</span>
                    </div>
                  </div>

                  {/* 2 Big Minimalist Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    {/* 1. Create Room Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateRoom}
                      className="group flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-[var(--surface-dim)] hover:bg-[var(--surface)] border border-[var(--outline-var)] hover:border-[var(--accent)] text-[var(--on-surface)] shadow-xs hover:shadow-md transition-all cursor-pointer text-left h-44 sm:h-52"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] group-hover:border-[var(--accent)] flex items-center justify-center text-[var(--accent)] transition-colors shadow-xs">
                          <QrCode size={24} />
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--outline-var)] text-[var(--on-surface-var)] text-[10px] font-black uppercase tracking-wider shadow-xs">
                          {isRu ? 'Создать' : 'Create'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg sm:text-xl font-black text-[var(--on-surface)] group-hover:text-[var(--accent)] tracking-tight leading-tight transition-colors">
                          {isRu ? 'Создать комнату' : isUk ? 'Створити кімнату' : 'Create Room'}
                        </h4>
                        <p className="text-xs text-[var(--on-surface-var)] font-medium leading-relaxed">
                          {isRu
                            ? 'Получить PIN и QR для второго устройства'
                            : isUk
                              ? 'Отримати PIN і QR для іншого пристрою'
                              : 'Generate PIN and QR for second device'}
                        </p>
                      </div>
                    </motion.button>

                    {/* 2. Connect / Join Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('guest')}
                      className="group flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-[var(--surface-dim)] hover:bg-[var(--surface)] border border-[var(--outline-var)] hover:border-[var(--accent)] text-[var(--on-surface)] shadow-xs hover:shadow-md transition-all cursor-pointer text-left h-44 sm:h-52"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] group-hover:border-[var(--accent)] flex items-center justify-center text-[var(--accent)] transition-colors shadow-xs">
                          <Scan size={24} />
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--outline-var)] text-[var(--on-surface-var)] text-[10px] font-black uppercase tracking-wider shadow-xs">
                          {isRu ? 'Подключиться' : 'Join'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg sm:text-xl font-black text-[var(--on-surface)] group-hover:text-[var(--accent)] tracking-tight leading-tight transition-colors">
                          {isRu ? 'Подключиться' : isUk ? 'Підключитися' : 'Connect to Room'}
                        </h4>
                        <p className="text-xs text-[var(--on-surface-var)] font-medium leading-relaxed">
                          {isRu
                            ? 'Ввести 6-значный PIN или отсканировать QR'
                            : isUk
                              ? 'Ввести 6-значний PIN або відсканувати QR'
                              : 'Enter 6-digit PIN or scan QR code'}
                        </p>
                      </div>
                    </motion.button>
                  </div>

                  {/* Bottom Helper Bar */}
                  <div className="flex items-center justify-between w-full px-2 text-[11px] text-[var(--on-surface-var)]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Wifi size={13} className="text-[var(--accent)]" />
                      <span>{isRu ? 'Локальная сеть WebRTC' : 'Local WebRTC network'}</span>
                    </div>
                    <button
                      onClick={() => setLandingStage('instructions')}
                      className="font-bold text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      {isRu ? 'Как это работает?' : isUk ? 'Як це працює?' : 'How does it work?'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* --- HOST VIEW (QR & PIN Waiting Screen) --- */}
          {view === 'host' && (
            <motion.div
              key="host"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex h-full w-full flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto"
            >
              <div className="max-w-md w-full flex flex-col items-center text-center space-y-5">
                <div className="flex flex-col items-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 text-xs font-bold mb-3 animate-pulse">
                    <Radio size={14} className="animate-spin" />
                    <span>{isRu ? 'Ожидание подключения...' : 'Waiting for connection...'}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[var(--on-surface)] tracking-tight">
                    {isRu ? 'Сканируйте для передачи' : 'Scan to Connect'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--on-surface-var)] font-medium max-w-sm mt-1">
                    {isRu
                      ? 'Наведите камеру смартфона на QR-код для открытия linkerrulauncher.netlify.app'
                      : 'Point your phone camera at the QR code to open linkerrulauncher.netlify.app'}
                  </p>
                </div>

                {/* Main QR Card */}
                <div className="bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-3xl p-6 sm:p-8 w-full shadow-md flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                  {/* Scalable QR Code Box with Direct Web Link */}
                  <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-[var(--outline-var)] flex items-center justify-center shrink-0">
                    <QRCode value={qrTargetUrl} size={qrDimension} className="rounded-lg" />
                  </div>

                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-1">
                      {isRu ? 'Код подключения' : 'Connection PIN'}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-3xl sm:text-4xl font-mono font-black text-[var(--on-surface)] tracking-widest bg-[var(--surface)] px-4 py-2 rounded-xl border border-[var(--outline-var)] shadow-inner">
                        {roomId}
                      </div>
                      <button
                        onClick={handleCopyPin}
                        className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--on-surface)] transition active:scale-90 cursor-pointer shadow-xs"
                        title={isRu ? 'Скопировать PIN' : 'Copy PIN'}
                      >
                        {isCopiedPin ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] hover:border-[var(--accent)] text-[11px] font-bold text-[var(--on-surface)] transition active:scale-95 cursor-pointer shadow-xs"
                      >
                        {isCopiedLink ? (
                          <>
                            <Check size={13} className="text-emerald-500" />
                            <span className="text-emerald-500">
                              {isRu ? 'Ссылка скопирована' : 'Link copied'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Link2 size={13} className="text-[var(--accent)]" />
                            <span>{isRu ? 'Скопировать ссылку' : 'Copy link'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isCopiedPin && (
                      <span className="text-[11px] font-bold text-emerald-500 mb-2">
                        {isRu ? 'PIN скопирован в буфер' : 'PIN copied to clipboard'}
                      </span>
                    )}
                    <p className="text-[11px] text-[var(--on-surface-var)] font-medium leading-relaxed">
                      {isRu
                        ? 'Сессия завершится автоматически после отключения.'
                        : 'Session will terminate when either device disconnects.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetState}
                  className="px-6 py-2.5 rounded-full bg-[var(--surface-dim)] border border-[var(--outline-var)] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-xs font-bold text-[var(--on-surface-var)] transition active:scale-95 cursor-pointer shadow-xs"
                >
                  {isRu ? 'Отменить ожидание' : 'Cancel waiting'}
                </button>
              </div>
            </motion.div>
          )}

          {/* --- GUEST VIEW (Scan & PIN Join Screen) --- */}
          {view === 'guest' && (
            <motion.div
              key="guest"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex h-full w-full flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto"
            >
              <div className="max-w-sm w-full flex flex-col items-center space-y-4">
                <div className="w-full flex items-center justify-between">
                  <button
                    onClick={() => setView('landing')}
                    className="p-2 rounded-xl bg-[var(--surface-dim)] border border-[var(--outline-var)] hover:text-[var(--accent)] text-[var(--on-surface-var)] transition active:scale-90 cursor-pointer shadow-xs"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h3 className="text-xl font-black text-[var(--on-surface)] tracking-tight">
                    {isRu ? 'Подключение к комнате' : 'Connect to Room'}
                  </h3>
                  <div className="w-10 h-10 shrink-0" />
                </div>

                {isMobile ? (
                  <div className="w-full flex flex-col items-center">
                    <QrScanner
                      lang={lang}
                      onScan={(text) => {
                        handleQrScan(text);
                      }}
                    />

                    <div className="flex items-center w-full max-w-xs my-4 gap-3 opacity-40">
                      <div className="flex-1 h-px bg-[var(--outline-var)]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)]">
                        {isRu ? 'ИЛИ ВВЕДИТЕ PIN' : 'OR ENTER PIN'}
                      </span>
                      <div className="flex-1 h-px bg-[var(--outline-var)]" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-2" />
                )}

                {/* PIN Input Form */}
                <form onSubmit={handleManualJoin} className="w-full flex flex-col gap-3">
                  <div className="text-center">
                    <p className="text-xs font-medium text-[var(--on-surface-var)]">
                      {isRu
                        ? 'Введите 6-значный PIN с экрана принимающего устройства'
                        : 'Enter the 6-character PIN shown on the other device'}
                    </p>
                  </div>

                  <input
                    type="text"
                    maxLength={10}
                    value={roomId || ''}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="w-full bg-[var(--surface-dim)] border-2 border-[var(--outline-var)] focus:border-[var(--accent)] rounded-2xl py-3.5 text-center font-mono text-2xl font-black tracking-widest text-[var(--on-surface)] outline-none transition uppercase shadow-inner"
                  />

                  <button
                    type="submit"
                    disabled={!roomId || roomId.length < 3}
                    className="w-full py-4 rounded-2xl bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--on-accent)] font-extrabold text-sm shadow-sm transition active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>{isRu ? 'Подключиться' : 'Connect'}</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* --- CONNECTED VIEW (File Transfer Dashboard) --- */}
          {view === 'connected' && (
            <motion.div
              key="connected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full w-full flex-col overflow-hidden"
            >
              {/* Channel Status Bar */}
              <header className="px-4 py-2.5 bg-[var(--surface-dim)] border-b border-[var(--outline-var)] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-[var(--on-surface)] tracking-tight truncate">
                      {isRu ? 'Защищённый канал P2P' : 'Secure P2P Channel'}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--on-surface-var)] truncate">
                      <span className="text-[var(--on-surface)]">{deviceName || defaultName}</span>
                      <span>•</span>
                      <span className="font-mono text-[var(--accent)]">{roomId}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetState}
                  className="text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl transition-colors active:scale-95 border border-red-500/20 shrink-0 cursor-pointer"
                >
                  {isRu ? 'Завершить' : 'Disconnect'}
                </button>
              </header>

              {/* Transfer Workspace */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
                {/* Send Box */}
                <div className="flex flex-col rounded-3xl bg-[var(--surface-dim)] border border-[var(--outline-var)] p-4 overflow-hidden shadow-xs">
                  <div className="flex items-center gap-2 pb-3 border-b border-[var(--outline-var)] px-1 shrink-0">
                    <Upload size={16} className="text-[var(--accent)]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[var(--on-surface)]">
                      {isRu ? 'Отправка файлов' : 'Send files'}
                    </h4>
                  </div>

                  <div className="flex-1 flex flex-col justify-center my-3 relative min-h-[140px]">
                    <label
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6 group cursor-pointer transition-all ${
                        isDraggingOver
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 scale-[0.99]'
                          : 'border-[var(--outline-var)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--surface-dim)]'
                      } ${artificialProgress ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-[var(--surface-dim)] group-hover:bg-[var(--accent)] group-hover:text-[var(--on-accent)] text-[var(--accent)] border border-[var(--outline-var)] flex items-center justify-center mb-3 transition-colors shadow-xs">
                        <Upload size={24} />
                      </div>
                      <span className="font-bold text-sm text-[var(--on-surface)] mb-1 text-center">
                        {isRu ? 'Выберите или перетащите файлы' : 'Select or drop files'}
                      </span>
                      <span className="text-[11px] text-[var(--on-surface-var)] font-medium text-center">
                        {isRu ? 'Без ограничений по размеру' : 'Zero size limits, full Wi-Fi speed'}
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => e.target.files && handleSendFiles(Array.from(e.target.files))}
                        className="hidden"
                      />
                    </label>

                    {/* Progress Overlay */}
                    {artificialProgress && (
                      <div className="absolute inset-0 bg-[var(--surface)]/90 backdrop-blur-xs rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-[var(--outline-var)]">
                        <Zap size={28} className="text-[var(--accent)] mb-2 animate-bounce" />
                        <span className="font-black text-sm text-[var(--on-surface)]">
                          {isRu ? 'Передача файла...' : 'Transferring file...'}
                        </span>
                        <div className="w-48 bg-[var(--surface-dim)] h-2 rounded-full mt-3 overflow-hidden border border-[var(--outline-var)]">
                          <div
                            className="bg-[var(--accent)] h-full transition-all duration-150 rounded-full"
                            style={{ width: `${artificialProgress.percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-[var(--accent)] font-bold mt-2">
                          {artificialProgress.percent}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sent Files Log */}
                  <div className="h-28 overflow-y-auto space-y-1.5 custom-scrollbar pr-1 shrink-0">
                    <span className="text-[10px] font-black uppercase text-[var(--on-surface-var)] tracking-wider">
                      {isRu ? 'Отправлено в этой сессии' : 'Sent in this session'} ({sentFiles.length})
                    </span>
                    {sentFiles.length === 0 ? (
                      <div className="text-xs text-[var(--on-surface-var)] opacity-50 italic py-2 text-center">
                        {isRu ? 'Файлы пока не отправлялись' : 'No files sent yet'}
                      </div>
                    ) : (
                      sentFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs p-2 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)]"
                        >
                          <div className="flex items-center gap-2 truncate min-w-0 pr-2">
                            <FileText size={14} className="text-[var(--accent)] shrink-0" />
                            <span className="truncate font-medium text-[var(--on-surface)]">{f.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-emerald-500 font-bold text-[11px]">
                            <CheckCircle2 size={13} />
                            <span>{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Received Box */}
                <div className="flex flex-col rounded-3xl bg-[var(--surface-dim)] border border-[var(--outline-var)] p-4 overflow-hidden shadow-xs">
                  <div className="flex items-center gap-2 pb-3 border-b border-[var(--outline-var)] px-1 shrink-0">
                    <Download size={16} className="text-[var(--accent)]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[var(--on-surface)]">
                      {isRu ? 'Полученные файлы' : 'Received files'}
                    </h4>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar my-2 space-y-2 pr-1 relative">
                    {receivedFiles.length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--on-surface-var)] opacity-60 p-4">
                        <div className="w-14 h-14 border-2 border-dashed border-[var(--outline-var)] rounded-2xl flex items-center justify-center mb-2 animate-pulse">
                          <Download size={22} className="text-[var(--accent)]" />
                        </div>
                        <span className="text-xs font-semibold">
                          {isRu ? 'Ожидание файлов от собеседника...' : 'Waiting for incoming files...'}
                        </span>
                      </div>
                    ) : (
                      receivedFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:border-[var(--accent)] transition-colors group shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-xl bg-[var(--surface-dim)] flex items-center justify-center text-[var(--accent)] shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-bold text-[var(--on-surface)] truncate">
                                {f.name}
                              </span>
                              <span className="block text-[10px] text-[var(--on-surface-var)] font-medium">
                                {(f.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                          <a
                            href={f.url}
                            download={f.name}
                            className="w-9 h-9 bg-[var(--surface-dim)] group-hover:bg-[var(--accent)] group-hover:text-[var(--on-accent)] text-[var(--on-surface)] rounded-xl flex items-center justify-center transition-colors shrink-0 border border-[var(--outline-var)] group-hover:border-transparent active:scale-95 shadow-xs"
                            title={isRu ? 'Скачать' : 'Download'}
                          >
                            <Download size={16} />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <LisyanConnectGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onDontShowAgain={() => setIsGuideOpen(false)}
        lang={lang}
      />
    </div>
  );
}

export default LisyanConnectModal;

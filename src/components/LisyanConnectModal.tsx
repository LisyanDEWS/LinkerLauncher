import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Upload, Download, Info, File, Monitor, Smartphone, Laptop, Lock, QrCode, AlertTriangle } from 'lucide-react';
import { useP2P } from './lisyanconnect-useP2P';
import { useContainerSize } from '../hooks/useContainerSize';
import QRCode from 'react-qr-code';
import { AnimatePresence, motion } from 'motion/react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface LisyanConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ru' | 'en';
  isMobileLayout?: boolean;
}

const QrScanner = ({ onScan }: { onScan: (text: string) => void }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render((text) => {
      scanner.clear().catch(()=>{});
      onScan(text);
    }, () => {});
    return () => {
      scanner.clear().catch(()=>{});
    };
  }, [onScan]);
  return <div id="qr-reader" className="w-full bg-white rounded-2xl overflow-hidden text-black" />;
};

export function LisyanConnectModal({ isOpen, onClose, lang, isMobileLayout }: LisyanConnectModalProps) {
  const [view, setView] = useState<'landing' | 'host' | 'guest' | 'connected'>('landing');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState<'pc' | 'laptop' | 'phone' | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Responsive: detect container width to switch between mobile/desktop layout.
  // Uses the shared useContainerSize hook with a 640px breakpoint.
  const { ref: containerRef, isNarrow } = useContainerSize(640);
  const isMobile = isMobileLayout !== undefined ? isMobileLayout : isNarrow;

  const [artificialProgress, setArtificialProgress] = useState<{percent: number, name: string} | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const transferStartTime = useRef<number>(0);
  const transferTimer = useRef<NodeJS.Timeout | null>(null);

  const { status, createRoom, joinRoom, sendFiles, receivedFiles, sentFiles, progress } = useP2P();

  useEffect(() => {
    if (!isOpen) {
      resetState();
    } else {
      if (isMobile) {
        setDeviceType('phone');
      }
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (status === 'connected' && view !== 'connected') {
      setView('connected');
    } else if (status === 'idle' && view === 'connected') {
      setView('landing');
    }
  }, [status, view]);

  useEffect(() => {
    if (progress) {
      if (!isTransferring) {
        setIsTransferring(true);
        transferStartTime.current = Date.now();
      }
      setArtificialProgress(progress);
    } else if (isTransferring) {
      const elapsed = Date.now() - transferStartTime.current;
      if (elapsed < 3000) {
        const remaining = 3000 - elapsed;

        setArtificialProgress(prev => {
          const p = Math.max(prev?.percent || 0, 99);
          return { percent: 100, name: prev?.name || 'File' };
        });

        transferTimer.current = setTimeout(() => {
          setIsTransferring(false);
          setArtificialProgress(null);
        }, remaining);
      } else {
        setIsTransferring(false);
        setArtificialProgress(null);
      }
    }
    return () => {
      if (transferTimer.current) clearTimeout(transferTimer.current);
    };
  }, [progress, isTransferring]);

  const resetState = () => {
    setView('landing');
    setRoomId(null);
    setDeviceName('');
    setDeviceType(null);
    setShowScanner(false);
  };

  const handleCreateRoom = async () => {
    if (!deviceName || !deviceType) {
      alert(lang === 'ru' ? 'Выберите устройство и введите имя' : 'Select device and enter name');
      return;
    }
    const id = await createRoom();
    setRoomId(id);
    setView('host');
  };

  const handleJoinSubmit = async () => {
    if (!roomId) return;
    try {
      await joinRoom(roomId.toUpperCase());
    } catch (e) {
      alert(lang === 'ru' ? 'Ошибка: Комната не найдена' : 'Error: Room not found');
      setRoomId('');
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col bg-[var(--surface)] overflow-hidden">
      {/* CONTENT — header removed, window manager provides the title bar */}
      <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'} flex flex-col relative overflow-hidden`}>
        <AnimatePresence mode="wait">

          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={isMobile ? "flex flex-col h-full overflow-y-auto" : "flex flex-row h-full w-full divide-x divide-[var(--outline)]"}
            >
              {!isMobile && (
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center overflow-y-auto">
                  <div className="w-20 h-20 bg-[var(--surface-dim)] rounded-3xl flex items-center justify-center text-[var(--on-surface)] mb-8 shadow-sm border border-[var(--outline)]">
                    <Monitor size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-[var(--on-surface)] mb-4 tracking-tight">
                    {lang === 'ru' ? 'Откройте LinkerRu везде' : 'Open LinkerRu anywhere'}
                  </h2>
                  <p className="text-base font-bold text-[var(--on-surface-var)] max-w-md mx-auto mb-8">
                    {lang === 'ru'
                      ? 'Lisyan Connect позволяет передавать файлы напрямую между устройствами. Чтобы открыть на телефоне, отсканируйте код или введите адрес:'
                      : 'Lisyan Connect allows direct file transfer between devices. To open on phone, scan the code or enter this address:'}
                  </p>
                  <div className="bg-white p-4 rounded-3xl mb-4 shadow-sm">
                    <QRCode value={'https://linkerrulauncher.netlify.app/'} size={160} />
                  </div>
                  <code className="text-sm font-mono font-bold bg-[var(--surface-dim)] px-4 py-2.5 rounded-xl text-[var(--on-surface-var)] border border-[var(--outline)]">
                    linkerrulauncher.netlify.app
                  </code>
                </div>
              )}

              <div className={isMobile ? "flex flex-col h-full overflow-y-auto" : "flex-1 p-8 flex flex-col justify-center relative overflow-y-auto"}>
                <div className="mb-6 max-w-lg mx-auto w-full bg-[var(--surface-dim)] border border-[var(--outline)] rounded-2xl p-4 flex items-start gap-3">
                  <div className="text-[var(--on-surface-var)] shrink-0 mt-0.5">
                    <AlertTriangle size={18} />
                  </div>
                  <p className="text-sm font-bold text-[var(--on-surface-var)]">
                    {lang === 'ru' ? 'Lisyan Connect может не работать в публичных или школьных Wi-Fi сетях (из-за ограничений WebRTC). Рекомендуется использовать мобильную точку доступа или мобильный интернет.' : 'Lisyan Connect may not work on public or school Wi-Fi networks (due to WebRTC restrictions). It is recommended to use a mobile hotspot or cellular data.'}
                  </p>
                </div>

                <div className="space-y-5 max-w-md mx-auto w-full">
                  {!isMobile && (
                  <div className="space-y-2.5">
                    <label className="text-sm font-black text-[var(--on-surface-var)] uppercase ml-1">{lang === 'ru' ? 'Тип устройства' : 'Device Type'}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'pc', icon: Monitor, label: 'PC' },
                        { id: 'laptop', icon: Laptop, label: 'Laptop' },
                        { id: 'phone', icon: Smartphone, label: 'Phone' }
                      ].map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setDeviceType(type.id as any)}
                            className={`flex flex-col items-center justify-center py-5 rounded-2xl border-2 transition-all ${deviceType === type.id ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-md' : 'border-[var(--outline)] bg-[var(--surface-dim)] text-[var(--on-surface-var)] hover:border-[var(--outline-high)]'}`}
                          >
                            <Icon size={28} />
                            <span className="text-sm font-bold mt-2">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  )}

                  <div className="space-y-2.5">
                    <label className="text-sm font-black text-[var(--on-surface-var)] uppercase ml-1">{lang === 'ru' ? 'Имя устройства' : 'Device Name'}</label>
                    <input
                      type="text"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder={lang === 'ru' ? 'Введите имя...' : 'Enter name...'}
                      className="w-full bg-[var(--surface-dim)] border border-[var(--outline)] rounded-xl px-4 py-3.5 text-[var(--on-surface)] text-base font-semibold outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>

                  <div className="pt-3 flex flex-col gap-3">
                    <button
                      onClick={handleCreateRoom}
                      disabled={!deviceName || (!isMobile && !deviceType)}
                      className="w-full py-4 bg-[var(--accent)] text-white font-black rounded-xl active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:active:scale-100 text-base"
                    >
                      {lang === 'ru' ? 'Создать комнату' : 'Create Room'}
                    </button>
                    <button
                      onClick={() => setView('guest')}
                      className="w-full py-4 bg-[var(--surface-dim)] text-[var(--on-surface)] font-black rounded-xl border border-[var(--outline)] hover:bg-[var(--container)] active:scale-95 transition-all text-base"
                    >
                      {lang === 'ru' ? 'Подключиться к комнате' : 'Join a Room'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'host' && (
            <motion.div
              key="host"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center h-full text-center overflow-y-auto p-4"
            >
              <div className="w-20 h-20 bg-[var(--accent)] rounded-full flex items-center justify-center text-white mb-8 animate-pulse shadow-lg shadow-[var(--accent)]/20">
                <Monitor size={40} />
              </div>
              <h3 className="text-2xl font-black text-[var(--on-surface)] mb-3">
                {lang === 'ru' ? 'Ожидание подключения' : 'Waiting for connection'}
              </h3>
              <p className="text-sm font-bold text-[var(--on-surface-var)] max-w-sm mx-auto mb-8">
                {lang === 'ru' ? 'Введите этот ID на другом устройстве для подключения' : 'Enter this ID on another device to connect'}
              </p>

              <div className="bg-[var(--surface-dim)] border border-[var(--outline)] rounded-3xl p-8 mb-8 relative group">
                <div className="text-5xl font-mono font-black text-[var(--on-surface)] tracking-widest uppercase">
                  {roomId}
                </div>
              </div>

              <button
                onClick={resetState}
                className="px-8 py-3 rounded-full border border-[var(--outline)] text-[var(--on-surface-var)] text-sm font-bold hover:bg-[var(--surface-dim)] transition-colors"
              >
                {lang === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
            </motion.div>
          )}

          {view === 'guest' && (
            <motion.div
              key="guest"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col items-center justify-center h-full max-w-md mx-auto w-full overflow-y-auto p-4"
            >
              <div className="w-20 h-20 bg-[var(--surface-dim)] border border-[var(--outline)] rounded-full flex items-center justify-center text-[var(--on-surface)] mb-8">
                <Lock size={40} />
              </div>

              <h3 className="text-2xl font-black text-[var(--on-surface)] mb-3">
                {lang === 'ru' ? 'Подключение' : 'Connect'}
              </h3>
              <p className="text-sm font-bold text-[var(--on-surface-var)] max-w-sm mx-auto mb-8 text-center">
                {lang === 'ru' ? 'Введите ID комнаты для подключения' : 'Enter Room ID to connect'}
              </p>

              {showScanner ? (
                <div className="w-full mb-4">
                  <QrScanner onScan={(text) => {
                    setRoomId(text);
                    setShowScanner(false);
                    joinRoom(text).catch(() => alert('Room not found'));
                  }} />
                  <button onClick={() => setShowScanner(false)} className="w-full mt-4 py-3.5 bg-[var(--surface-dim)] text-[var(--on-surface)] font-bold rounded-xl">
                    {lang === 'ru' ? 'Отмена сканирования' : 'Cancel Scan'}
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Room ID"
                    value={roomId || ''}
                    onChange={e => setRoomId(e.target.value.toUpperCase())}
                    className="w-full bg-[var(--surface-dim)] border border-[var(--outline)] rounded-xl px-4 py-4 text-center font-mono text-2xl font-black text-[var(--on-surface)] outline-none focus:border-[var(--accent)] transition-colors mb-4 uppercase tracking-widest"
                    maxLength={6}
                  />
                  <button
                    onClick={handleJoinSubmit}
                    disabled={!roomId}
                    className="w-full py-4 bg-[var(--on-surface)] text-[var(--surface)] font-black rounded-xl active:scale-95 transition-all shadow-md disabled:opacity-50 text-base"
                  >
                    {lang === 'ru' ? 'Подключиться' : 'Join Room'}
                  </button>
                  {isMobile && (
                    <button
                      onClick={() => setShowScanner(true)}
                      className="w-full py-4 mt-3 bg-[var(--surface-dim)] border border-[var(--outline)] text-[var(--on-surface)] font-black rounded-xl active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 text-base"
                    >
                      <QrCode size={20} /> {lang === 'ru' ? 'Сканировать QR' : 'Scan QR'}
                    </button>
                  )}
                </>
              )}

              {!showScanner && (
                <button
                  onClick={resetState}
                  className="mt-5 text-[var(--on-surface-var)] text-xs font-bold hover:text-[var(--on-surface)] transition-colors"
                >
                  {lang === 'ru' ? 'Назад' : 'Back'}
                </button>
              )}
            </motion.div>
          )}

          {view === 'connected' && (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col w-full h-full max-w-6xl mx-auto overflow-y-auto"
            >
              <div className={`flex items-center justify-between bg-[var(--surface-dim)] border border-[var(--outline)] ${isMobile ? 'mb-3 p-3 rounded-xl' : 'mb-5 p-5 rounded-2xl'}`}>
                <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
                  <div className={`bg-[var(--accent)] rounded-full flex items-center justify-center text-white shadow-sm ${isMobile ? 'w-10 h-10' : 'w-14 h-14'}`}>
                    <CheckCircle2 size={isMobile ? 20 : 28} />
                  </div>
                  <div>
                    <h4 className={`${isMobile ? 'text-base' : 'text-xl'} font-black text-[var(--on-surface)] tracking-tight`}>
                      {lang === 'ru' ? 'Соединение установлено' : 'Connected'}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-[var(--on-surface-var)] font-bold">P2P WebRTC • </span>
                      <div className="flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1 rounded-full border border-[var(--outline)] shadow-sm">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                         <span className="text-[11px] font-black text-[var(--on-surface)] tracking-wide">
                           {deviceType ? deviceType.toUpperCase() : 'GUEST'} {deviceName ? `(${deviceName})` : ''}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={isMobile ? "flex flex-col gap-3 flex-1" : "grid grid-cols-2 gap-5 flex-1 min-h-0"}>
                {/* UPLOAD SECTION */}
                <div className={`flex flex-col bg-[var(--surface-dim)] border border-[var(--outline)] relative overflow-hidden shrink-0 ${isMobile ? 'rounded-xl p-3' : 'rounded-2xl p-5'}`}>
                  <h4 className="font-black text-[var(--on-surface)] mb-4 flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}">
                    <Upload size={isMobile ? 16 : 20} />
                    {lang === 'ru' ? 'Отправка' : 'Sending'}
                  </h4>

                  <label
                    htmlFor="file-upload"
                    className={`flex-1 min-h-[140px] border-2 border-dashed border-[var(--outline-var)] rounded-xl bg-[var(--surface)] flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--container)] transition-colors ${artificialProgress ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} bg-[var(--container)] rounded-full flex items-center justify-center mb-4 text-[var(--on-surface)]`}>
                      <Upload size={isMobile ? 24 : 32} />
                    </div>
                    <h4 className={`font-black text-[var(--on-surface)] mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                      {lang === 'ru' ? 'Выберите файл' : 'Select a file'}
                    </h4>
                    <p className="text-sm font-bold text-[var(--on-surface-var)]">
                      {lang === 'ru' ? 'Нажмите чтобы выбрать файл' : 'Click to select a file'}
                    </p>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          sendFiles(e.target.files);
                        }
                      }}
                    />
                  </label>

                  {/* Transferring Progress */}
                  <AnimatePresence>
                    {artificialProgress && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-4 left-4 right-4 bg-[var(--surface)] rounded-xl p-3 border border-[var(--outline)] shadow-lg"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-[var(--on-surface)] truncate max-w-[200px]">{artificialProgress.name}</span>
                          <span className="text-xs font-black text-[var(--accent)]">{Math.round(artificialProgress.percent || 0)}%</span>
                        </div>
                        <div className="w-full bg-[var(--surface-dim)] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[var(--accent)] h-full transition-all duration-300 rounded-full"
                            style={{ width: `${artificialProgress.percent || 0}%` }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sent Files */}
                  {sentFiles.length > 0 && (
                    <div className="mt-4 flex-1 max-h-[30vh] overflow-y-auto space-y-2 pr-1">
                      <h5 className="text-xs font-bold text-[var(--on-surface-var)] mb-2">{lang === 'ru' ? 'Отправленные файлы' : 'Sent Files'}</h5>
                      {sentFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--outline)] p-2.5 rounded-xl">
                          <div className="w-9 h-9 bg-[var(--surface-dim)] text-[var(--on-surface)] rounded-lg flex items-center justify-center shrink-0">
                            <CheckCircle2 size={16} className="text-green-500" />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-[var(--on-surface)] truncate">{f.name}</p>
                            <p className="text-[10px] font-bold text-[var(--on-surface-var)]">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RECEIVE SECTION */}
                <div className={`flex flex-col bg-[var(--surface-dim)] border border-[var(--outline)] flex-1 ${isMobile ? 'rounded-xl p-3' : 'rounded-2xl p-5'}`}>
                  <h4 className={`font-black text-[var(--on-surface)] mb-4 flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    <Download size={isMobile ? 16 : 20} />
                    {lang === 'ru' ? 'Получение' : 'Receiving'}
                  </h4>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
                    {receivedFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-[var(--on-surface-var)] min-h-[140px]">
                        <Info size={28} className="mb-3 opacity-50" />
                        <span className="text-sm font-bold">{lang === 'ru' ? 'Ожидание файлов...' : 'Waiting for files...'}</span>
                      </div>
                    ) : (
                      receivedFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-[var(--surface)] border border-[var(--outline)] p-2.5 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 bg-[var(--surface-dim)] text-[var(--on-surface)] rounded-lg flex items-center justify-center shrink-0">
                              <File size={16} />
                            </div>
                            <div className="truncate pr-4">
                              <p className="text-sm font-bold text-[var(--on-surface)] truncate">{f.name}</p>
                              <p className="text-[10px] font-bold text-[var(--on-surface-var)]">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <a
                            href={f.url}
                            download={f.name}
                            className="bg-[var(--on-surface)] text-[var(--surface)] px-3 py-1.5 rounded-full text-xs font-black hover:scale-105 active:scale-95 transition-transform shrink-0"
                          >
                            {lang === 'ru' ? 'Сохранить' : 'Save'}
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
      </div>
    </div>
  );
}

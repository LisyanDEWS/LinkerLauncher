import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Upload, Download, Monitor, Smartphone, QrCode, AlertTriangle, ArrowRight, ArrowLeft, Keyboard, FileText, Zap, Scan } from 'lucide-react';
import { useP2P } from './lisyanconnect-useP2P';
import { useContainerSize } from '../hooks/useContainerSize';
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
}

const QrScanner = ({ onScan, lang }: { onScan: (text: string) => void, lang: string }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;
    html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        html5QrCode.stop().then(() => {
          onScan(decodedText);
        }).catch(() => {
          onScan(decodedText);
        });
      },
      () => {} // ignore warnings
    ).catch((err) => {
      setError(lang === 'ru' ? 'Камера не найдена или нет доступа' : 'Camera not found or access denied');
    });
    
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(()=>{});
      }
    };
  }, [onScan, lang]);

  return (
    <div className="w-full relative rounded-[2rem] overflow-hidden bg-black aspect-square max-w-[300px] mx-auto shadow-2xl border-4 border-[var(--surface-dim)]">
      <div id="qr-reader" className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>video]:scale-110" />
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface)] text-[var(--on-surface)] text-center p-6 z-20">
          <AlertTriangle size={36} className="text-red-500 mb-3" />
          <p className="font-bold text-sm leading-relaxed">{error}</p>
        </div>
      )}
      
      {!error && (
        <>
          {/* Dark overlay with transparent hole */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="w-[70%] h-[70%] rounded-3xl relative shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]">
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
            </div>
          </div>
          {/* Laser scanning animation */}
          <motion.div 
            animate={{ top: ['20%', '80%', '20%'] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-[20%] right-[20%] h-0.5 bg-green-500 shadow-[0_0_15px_3px_rgba(34,197,94,0.6)] pointer-events-none z-20 rounded-full" 
          />
        </>
      )}
    </div>
  );
};

export function LisyanConnectModal({ isOpen, onClose, lang, theme = 'light', isMobileLayout }: LisyanConnectModalProps) {
  const [view, setView] = useState<'landing' | 'host' | 'guest' | 'connected'>('landing');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('');
  
  // Responsive detection
  const { ref: containerRef, isNarrow } = useContainerSize(640);
  const isMobile = isMobileLayout !== undefined ? isMobileLayout : isNarrow;

  const defaultName = isMobile ? (lang === 'ru' ? 'Мой Телефон' : 'My Phone') : (lang === 'ru' ? 'Мой ПК' : 'My PC');

  const [artificialProgress, setArtificialProgress] = useState<{percent: number, name: string} | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const transferStartTime = useRef<number>(0);
  const transferTimer = useRef<NodeJS.Timeout | null>(null);

  const { status, createRoom, joinRoom, sendFiles, receivedFiles, sentFiles, progress, disconnect } = useP2P();

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
        setArtificialProgress(prev => ({ percent: 100, name: prev?.name || 'File' }));
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
    disconnect();
  };

  const handleCreateRoom = async () => {
    const finalDeviceName = deviceName.trim() || defaultName;
    setDeviceName(finalDeviceName); // Set it in state so it shows correctly later
    const id = await createRoom();
    setRoomId(id);
    setView('host');
  };

  const handleJoinSubmit = async () => {
    if (!roomId) return;
    try {
      const finalDeviceName = deviceName.trim() || defaultName;
      setDeviceName(finalDeviceName);
      await joinRoom(roomId.toUpperCase());
    } catch (e) {
      alert(lang === 'ru' ? 'Ошибка: Комната не найдена' : 'Error: Room not found');
      setRoomId('');
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col bg-[var(--surface)] overflow-hidden">
      <AnimatePresence mode="wait">
        
        {/* --- LANDING VIEW --- */}
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex h-full w-full"
          >
            {!isMobile ? (
              <div className="flex flex-row h-full w-full">
                {/* Left Panel - Branding */}
                <div className="w-[45%] bg-[var(--surface-dim)] p-12 flex flex-col justify-between border-r border-[var(--outline)] relative overflow-hidden">
                   <div className="relative z-10 mt-8">
                     <div className="w-16 h-16 bg-[var(--accent)] border border-[var(--accent)] rounded-[1.5rem] flex items-center justify-center mb-8 shadow-lg shadow-[var(--accent)]/20 overflow-hidden p-3 text-white">
                        <img 
                          src="https://github.com/user-attachments/assets/71a65dc6-fb8f-45fb-88a4-240d44cecee3" 
                          alt="Lisyan Connect Logo" 
                          className="w-full h-full object-contain brightness-0 invert" 
                        />
                     </div>
                     <h2 className="text-5xl font-black text-[var(--on-surface)] mb-6 tracking-tight leading-[1.1]">
                       {lang === 'ru' ? 'Прямая передача' : 'Direct transfer'}
                     </h2>
                     <p className="text-lg font-bold text-[var(--on-surface-var)] mb-12 max-w-sm leading-relaxed">
                       {lang === 'ru' ? 'Сквозное шифрование, максимальная скорость по Wi-Fi и отсутствие облака посередине.' : 'End-to-end encryption, maximum Wi-Fi speed, and no cloud servers in the middle.'}
                     </p>
                   </div>
                   
                   {/* Device Name Config */}
                   <div className="relative z-10 bg-[var(--surface)] p-4 rounded-3xl border border-[var(--outline)] shadow-sm flex items-center gap-4 group focus-within:border-[var(--accent)] transition-colors">
                     <div className="w-12 h-12 bg-[var(--surface-dim)] rounded-2xl flex items-center justify-center text-[var(--on-surface)] border border-[var(--outline)] shrink-0">
                        <Monitor size={20} />
                     </div>
                     <div className="flex-1 overflow-hidden">
                       <div className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)] mb-1">
                         {lang === 'ru' ? 'Имя вашего устройства' : 'Your Device Name'}
                       </div>
                       <input 
                          type="text"
                          value={deviceName}
                          onChange={e => setDeviceName(e.target.value)}
                          placeholder={defaultName}
                          className="w-full bg-transparent border-none outline-none text-[var(--on-surface)] font-black text-lg placeholder-[var(--on-surface-var)] truncate"
                       />
                     </div>
                   </div>
                   
                   {/* Decorative background */}
                   <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[var(--accent)]/15 rounded-full blur-3xl pointer-events-none" />
                </div>
                
                {/* Right Panel - Actions */}
                <div className="w-[55%] p-12 flex flex-col justify-center gap-6 relative bg-[var(--surface)]">
                   <button onClick={handleCreateRoom} className="group flex items-center gap-6 p-8 rounded-[2rem] border-2 border-[var(--outline)] bg-[var(--surface)] hover:bg-[var(--surface-dim)] hover:border-[var(--accent)] transition-all cursor-pointer text-left shadow-sm hover:shadow-xl active:scale-[0.98]">
                      <div className="w-20 h-20 bg-[var(--surface-dim)] group-hover:bg-[var(--accent)] text-[var(--on-surface)] group-hover:text-white rounded-[1.5rem] flex items-center justify-center transition-all shrink-0">
                         <QrCode size={36} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-[var(--on-surface)] mb-2 group-hover:text-[var(--accent)] transition-colors">{lang === 'ru' ? 'Создать комнату' : 'Create Room'}</h3>
                         <p className="text-sm font-bold text-[var(--on-surface-var)] leading-relaxed max-w-xs">{lang === 'ru' ? 'Сгенерировать PIN и QR-код для подключения телефона или ПК' : 'Generate PIN and QR code to connect your phone or another PC'}</p>
                      </div>
                   </button>
                   
                   <button onClick={() => setView('guest')} className="group flex items-center gap-6 p-8 rounded-[2rem] border-2 border-[var(--outline)] bg-[var(--surface)] hover:bg-[var(--surface-dim)] hover:border-[var(--accent)] transition-all cursor-pointer text-left shadow-sm hover:shadow-xl active:scale-[0.98]">
                      <div className="w-20 h-20 bg-[var(--surface-dim)] group-hover:bg-[var(--accent)] text-[var(--on-surface)] group-hover:text-white rounded-[1.5rem] flex items-center justify-center transition-all shrink-0">
                         <Scan size={36} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-[var(--on-surface)] mb-2 group-hover:text-[var(--accent)] transition-colors">{lang === 'ru' ? 'Подключиться' : 'Connect'}</h3>
                         <p className="text-sm font-bold text-[var(--on-surface-var)] leading-relaxed max-w-xs">{lang === 'ru' ? 'Ввести PIN или отсканировать QR для подключения к другой комнате' : 'Enter PIN or scan QR code to join an existing room'}</p>
                      </div>
                   </button>
                   
                   <div className="absolute bottom-8 left-12 right-12 flex items-start gap-3 opacity-60">
                      <AlertTriangle size={16} className="text-[var(--on-surface-var)] shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-[var(--on-surface-var)] leading-tight">
                        {lang === 'ru' ? 'P2P соединения могут блокироваться в корпоративных или публичных Wi-Fi сетях.' : 'P2P connections might be blocked on corporate or public Wi-Fi networks.'}
                      </p>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full w-full bg-transparent p-5 overflow-y-auto pb-8">
                <div className="flex items-center gap-4 mb-8 mt-2 px-2">
                  <div className="w-12 h-12 bg-[var(--accent)] border border-[var(--accent)] rounded-[1rem] flex items-center justify-center shadow-lg shadow-[var(--accent)]/20 overflow-hidden p-2.5 shrink-0 text-white">
                    <img 
                      src="https://github.com/user-attachments/assets/71a65dc6-fb8f-45fb-88a4-240d44cecee3" 
                      alt="Lisyan Connect Logo" 
                      className="w-full h-full object-contain brightness-0 invert" 
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[var(--on-surface)] tracking-tight leading-none mb-1">
                      Lisyan Connect
                    </h2>
                       <p className="text-xs font-bold text-[var(--on-surface-var)]">
                         {lang === 'ru' ? 'Прямая передача файлов' : 'Direct file transfer'}
                       </p>
                    </div>
                 </div>
                 
                 <div className="bg-[var(--surface-dim)] p-3 rounded-[1.5rem] border border-[var(--outline)] flex items-center gap-3 mb-8 shadow-sm focus-within:border-[var(--accent)] transition-colors">
                     <div className="w-10 h-10 bg-[var(--surface)] rounded-xl flex items-center justify-center text-[var(--on-surface)] border border-[var(--outline)] shrink-0">
                        <Smartphone size={18} />
                     </div>
                     <div className="flex-1 overflow-hidden">
                       <div className="text-[9px] font-black uppercase tracking-widest text-[var(--on-surface-var)] mb-0.5">
                         {lang === 'ru' ? 'Ваше имя' : 'Your Name'}
                       </div>
                       <input 
                          type="text"
                          value={deviceName}
                          onChange={e => setDeviceName(e.target.value)}
                          placeholder={defaultName}
                          className="w-full bg-transparent border-none outline-none text-[var(--on-surface)] font-black text-sm placeholder-[var(--on-surface-var)] truncate"
                       />
                     </div>
                 </div>
                 
                 <div className="flex flex-col gap-4 flex-1">
                     <button onClick={() => setView('guest')} className="group bg-[var(--accent)] text-white p-6 rounded-[2rem] border border-[var(--accent)] transition-all cursor-pointer text-left shadow-lg shadow-[var(--accent)]/20 active:scale-[0.98]">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                             <Scan size={28} />
                          </div>
                          <h3 className="text-xl font-black">{lang === 'ru' ? 'Подключиться' : 'Connect'}</h3>
                        </div>
                        <p className="text-sm font-bold text-white/80 leading-relaxed pr-4">{lang === 'ru' ? 'Отсканировать QR-код с экрана ПК или ввести PIN вручную' : 'Scan QR code from PC screen or enter PIN manually'}</p>
                     </button>
                     
                     <button onClick={handleCreateRoom} className="group bg-[var(--surface)] p-6 rounded-[2rem] border-2 border-[var(--outline)] hover:bg-[var(--surface-dim)] transition-all cursor-pointer text-left shadow-sm active:scale-[0.98]">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-[var(--surface-dim)] group-hover:bg-[var(--accent)] text-[var(--on-surface)] group-hover:text-white transition-colors rounded-2xl flex items-center justify-center shrink-0">
                             <QrCode size={28} />
                          </div>
                          <h3 className="text-xl font-black text-[var(--on-surface)] group-hover:text-[var(--accent)] transition-colors">{lang === 'ru' ? 'Создать' : 'Host Room'}</h3>
                        </div>
                        <p className="text-sm font-bold text-[var(--on-surface-var)] leading-relaxed pr-4">{lang === 'ru' ? 'Сгенерировать PIN и QR для другого устройства' : 'Generate PIN and QR for another device'}</p>
                     </button>
                 </div>
              </div>
            )}
          </motion.div>
        )}

        {/* --- HOST VIEW (WAITING) --- */}
        {view === 'host' && (
          <motion.div
            key="host"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col h-full w-full bg-transparent relative overflow-y-auto"
          >
            <div className="p-6 md:p-10 max-w-4xl mx-auto w-full flex flex-col items-center justify-center min-h-full py-12">
               <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--accent)]/10 text-[var(--accent)] rounded-3xl mb-6 shadow-inner relative">
                     <div className="absolute inset-0 bg-[var(--accent)]/20 rounded-3xl animate-ping" />
                     <QrCode size={36} />
                  </div>
                  <h3 className="text-3xl md:text-5xl font-black text-[var(--on-surface)] tracking-tight mb-4">
                     {lang === 'ru' ? 'Сканируйте для подключения' : 'Scan to connect'}
                  </h3>
                  <p className="text-[var(--on-surface-var)] font-bold text-base max-w-md mx-auto">
                     {lang === 'ru' ? 'Наведите камеру смартфона на QR-код или введите PIN вручную на другом устройстве.' : 'Point your smartphone camera at the QR code or enter PIN manually on another device.'}
                  </p>
               </div>
               
               <div className="bg-[var(--surface-dim)] border border-[var(--outline)] rounded-[3rem] p-6 md:p-10 w-full max-w-3xl flex flex-col md:flex-row items-center gap-8 md:gap-14 shadow-2xl">
                  <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm shrink-0 border border-black/5">
                     <QRCode value={roomId || ''} size={isMobile ? 180 : 240} className="rounded-xl" />
                  </div>
                  <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
                     <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
                        {lang === 'ru' ? 'Ваш уникальный PIN' : 'Your unique PIN'}
                     </div>
                     <div className="text-5xl md:text-7xl font-mono font-black text-[var(--on-surface)] tracking-widest uppercase mb-8 bg-[var(--surface)] px-8 py-5 rounded-[2rem] border-2 border-[var(--outline)] shadow-inner">
                        {roomId}
                     </div>
                     <button onClick={resetState} className="px-8 py-4 rounded-full bg-[var(--surface)] border border-[var(--outline)] text-[var(--on-surface-var)] hover:text-red-500 font-black text-sm hover:bg-red-500/10 hover:border-red-500/30 transition-all active:scale-95 shadow-sm">
                        {lang === 'ru' ? 'Отменить ожидание' : 'Cancel waiting'}
                     </button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {/* --- GUEST VIEW (SCAN/JOIN) --- */}
        {view === 'guest' && (
          <motion.div
            key="guest"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full w-full bg-transparent relative overflow-y-auto"
          >
            <div className="p-6 md:p-10 max-w-2xl mx-auto w-full flex flex-col items-center justify-center min-h-full py-12">
               <div className="flex items-center justify-between w-full mb-8">
                  <button onClick={resetState} className="w-12 h-12 bg-[var(--surface-dim)] rounded-full flex items-center justify-center text-[var(--on-surface)] border border-[var(--outline)] hover:bg-[var(--outline)] transition-colors active:scale-95 shrink-0">
                     <ArrowLeft size={20} />
                  </button>
                  <h3 className="text-2xl font-black text-[var(--on-surface)] tracking-tight">
                     {lang === 'ru' ? 'Подключение' : 'Connect'}
                  </h3>
                  <div className="w-12 h-12 shrink-0" />
               </div>

               {isMobile ? (
                  <div className="w-full flex flex-col items-center mb-8">
                     <QrScanner onScan={(text) => {
                        setRoomId(text);
                        joinRoom(text).catch(() => alert(lang === 'ru' ? 'Ошибка: Комната не найдена' : 'Error: Room not found'));
                     }} lang={lang} />
                     
                     <div className="flex items-center w-full max-w-sm mt-10 mb-6 gap-4 opacity-50">
                        <div className="flex-1 h-px bg-[var(--on-surface)]" />
                        <span className="text-[var(--on-surface)] text-[10px] font-black uppercase tracking-widest">{lang === 'ru' ? 'ИЛИ ВВЕДИТЕ PIN' : 'OR ENTER PIN'}</span>
                        <div className="flex-1 h-px bg-[var(--on-surface)]" />
                     </div>
                  </div>
               ) : (
                  <div className="w-32 h-32 bg-[var(--surface-dim)] rounded-[2.5rem] flex items-center justify-center text-[var(--on-surface-var)] mb-12 shadow-inner border border-[var(--outline)]">
                    <Keyboard size={56} />
                  </div>
               )}
               
               <div className="w-full max-w-md flex flex-col gap-4">
                  {!isMobile && (
                    <div className="text-center mb-2">
                       <h4 className="font-black text-[var(--on-surface)] text-xl">{lang === 'ru' ? 'Введите PIN' : 'Enter PIN'}</h4>
                       <p className="text-sm font-bold text-[var(--on-surface-var)]">{lang === 'ru' ? 'PIN код указан на экране другого устройства' : 'PIN code is shown on the other device screen'}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                     <input 
                        type="text" 
                        placeholder="PIN" 
                        maxLength={6} 
                        value={roomId || ''} 
                        onChange={e => setRoomId(e.target.value.toUpperCase())}
                        className="flex-1 bg-[var(--surface-dim)] border-2 border-[var(--outline)] rounded-[1.5rem] px-6 py-5 text-center font-mono text-3xl font-black text-[var(--on-surface)] uppercase tracking-[0.3em] outline-none focus:border-[var(--accent)] transition-all shadow-inner placeholder:text-[var(--outline-high)]" 
                     />
                     <button 
                        disabled={!roomId || roomId.length < 2} 
                        onClick={handleJoinSubmit}
                        className="w-20 bg-[var(--accent)] text-white rounded-[1.5rem] flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-[var(--accent)]/20"
                     >
                        <ArrowRight size={32} />
                     </button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {/* --- CONNECTED VIEW (FILE TRANSFER) --- */}
        {view === 'connected' && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full w-full bg-transparent overflow-hidden"
          >
            {/* Header banner */}
            <div className={`px-6 py-4 bg-[var(--surface-dim)] border-b border-[var(--outline)] flex items-center justify-between shrink-0 ${isMobile ? 'flex-col gap-4' : ''}`}>
               <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-[1rem] flex items-center justify-center relative shrink-0">
                     <div className="absolute inset-0 bg-green-500/20 rounded-[1rem] animate-ping" />
                     <CheckCircle2 size={24} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                     <h4 className="text-base font-black text-[var(--on-surface)] tracking-tight truncate">
                       {lang === 'ru' ? 'Защищённое P2P-соединение' : 'Secure P2P Connection'}
                     </h4>
                     <p className="text-[10px] md:text-xs font-bold text-[var(--on-surface-var)] uppercase tracking-wider truncate">
                       <span className="text-[var(--on-surface)]">{deviceName || 'DEVICE'}</span> <span className="opacity-50 mx-1.5">•</span> <span className="font-mono text-[var(--accent)]">{roomId}</span>
                     </p>
                  </div>
                  {!isMobile && (
                     <button onClick={resetState} className="text-xs font-black text-red-500 bg-red-500/10 hover:bg-red-500/20 px-5 py-3 rounded-xl transition-colors active:scale-95 border border-red-500/20 ml-auto shrink-0">
                       {lang === 'ru' ? 'Завершить' : 'Disconnect'}
                     </button>
                  )}
               </div>
               {isMobile && (
                  <button onClick={resetState} className="w-full text-xs font-black text-red-500 bg-red-500/10 px-5 py-3 rounded-xl transition-colors active:scale-95 border border-red-500/20 text-center">
                    {lang === 'ru' ? 'Завершить сеанс' : 'Disconnect session'}
                  </button>
               )}
            </div>

            <div className={`flex-1 overflow-hidden p-4 md:p-8 gap-4 md:gap-8 ${isMobile ? 'flex flex-col' : 'grid grid-cols-2 max-w-7xl mx-auto w-full'}`}>
               
               {/* Sending Area */}
               <div className="flex flex-col bg-[var(--surface-dim)] border border-[var(--outline)] rounded-[2rem] p-2 overflow-hidden shadow-sm h-full">
                  <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--outline)]">
                     <div className="flex items-center gap-2">
                        <Upload size={18} className="text-[var(--on-surface-var)]" />
                        <h4 className="text-sm font-black text-[var(--on-surface)] uppercase tracking-widest">{lang === 'ru' ? 'Отправка' : 'Send'}</h4>
                     </div>
                  </div>
                  
                  <div className="p-3 md:p-5 flex-1 flex flex-col gap-4 overflow-hidden relative">
                     <label htmlFor="file-upload" className={`flex-1 border-2 border-dashed border-[var(--outline-high)] rounded-[1.5rem] bg-[var(--surface)] hover:bg-[var(--surface-dim)] hover:border-[var(--accent)] transition-all flex flex-col items-center justify-center p-6 group cursor-pointer relative overflow-hidden ${artificialProgress ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-16 h-16 bg-[var(--surface-dim)] border border-[var(--outline)] text-[var(--on-surface)] rounded-[1.2rem] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[var(--accent)] group-hover:text-white transition-all shadow-sm">
                          <Upload size={32} />
                        </div>
                        <h4 className="font-black text-[var(--on-surface)] mb-1 text-center text-lg">{lang === 'ru' ? 'Выберите файлы' : 'Select files'}</h4>
                        <p className="text-xs font-bold text-[var(--on-surface-var)] text-center">{lang === 'ru' ? 'Нажмите для выбора' : 'Tap to select'}</p>
                        <input type="file" id="file-upload" className="hidden" multiple onChange={(e) => { if(e.target.files) sendFiles(e.target.files); }} />
                     </label>
                     
                     {/* Progress overlay */}
                     <AnimatePresence>
                       {artificialProgress && (
                         <motion.div
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0 }}
                           className="absolute inset-x-4 bottom-4 md:bottom-5 bg-[var(--surface)] border border-[var(--outline)] rounded-2xl p-4 shadow-xl z-10"
                         >
                           <div className="flex justify-between items-center mb-3">
                             <span className="text-sm font-bold text-[var(--on-surface)] truncate max-w-[70%]">{artificialProgress.name}</span>
                             <span className="text-sm font-black text-[var(--accent)]">{Math.round(artificialProgress.percent || 0)}%</span>
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
                     
                     {/* Sent Files List */}
                     {sentFiles.length > 0 && (
                       <div className="h-[35%] min-h-[100px] overflow-y-auto pr-2 space-y-2 pb-2">
                         {sentFiles.map((f, i) => (
                           <div key={i} className="bg-[var(--surface)] border border-[var(--outline)] p-3 rounded-2xl flex items-center gap-3">
                             <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center shrink-0">
                               <CheckCircle2 size={20} />
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
               </div>
               
               {/* Receiving Area */}
               <div className="flex flex-col bg-[var(--surface-dim)] border border-[var(--outline)] rounded-[2rem] p-2 overflow-hidden shadow-sm h-full relative">
                  <div className="px-5 py-4 flex items-center gap-2 border-b border-[var(--outline)]">
                     <Download size={18} className="text-[var(--on-surface-var)]" />
                     <h4 className="text-sm font-black text-[var(--on-surface)] uppercase tracking-widest">{lang === 'ru' ? 'Получено' : 'Received'}</h4>
                  </div>
                  
                  <div className="p-3 md:p-5 flex-1 overflow-y-auto space-y-3 pb-2 relative">
                     {receivedFiles.length === 0 ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--on-surface-var)] opacity-60">
                         <div className="w-20 h-20 border-4 border-dashed border-[var(--outline-high)] rounded-full flex items-center justify-center mb-4 animate-[spin_12s_linear_infinite]">
                           <Download size={28} className="animate-[spin_12s_linear_infinite_reverse]" />
                         </div>
                         <span className="text-sm font-bold">{lang === 'ru' ? 'Ожидание файлов...' : 'Waiting for files...'}</span>
                       </div>
                     ) : (
                       receivedFiles.map((f, i) => (
                          <div key={i} className="group bg-[var(--surface)] border border-[var(--outline)] p-3 md:p-4 rounded-[1.5rem] flex items-center gap-4 hover:border-[var(--accent)] transition-all shadow-sm relative overflow-hidden">
                            <div className="w-12 h-12 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl flex items-center justify-center shrink-0">
                               <FileText size={24} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <h5 className="text-sm font-black text-[var(--on-surface)] truncate">{f.name}</h5>
                              <p className="text-xs font-bold text-[var(--on-surface-var)] mt-0.5">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <a href={f.url} download={f.name} className="w-12 h-12 bg-[var(--surface-dim)] group-hover:bg-[var(--accent)] group-hover:text-white text-[var(--on-surface)] rounded-2xl flex items-center justify-center transition-colors shrink-0 shadow-sm border border-[var(--outline)] group-hover:border-transparent active:scale-95">
                              <Download size={20} />
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
  );
}

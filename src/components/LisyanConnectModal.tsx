import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Scan, Upload, File, CheckCircle2, Loader2, ArrowLeft, Download, Maximize, Smartphone, Share2, Info } from 'lucide-react';
import { useP2P } from './lisyanconnect-useP2P';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { AnimatePresence, motion } from 'motion/react';

interface LisyanConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ru' | 'en';
}

export function LisyanConnectModal({ isOpen, onClose, lang }: LisyanConnectModalProps) {
  const [view, setView] = useState<'landing' | 'host' | 'guest' | 'connected'>('landing');
  const [roomId, setRoomId] = useState<string | null>(null);
  
  const { status, createRoom, joinRoom, sendFiles, receivedFiles, progress } = useP2P();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (status === 'connected' && view !== 'connected') {
      setView('connected');
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    } else if (status === 'idle') {
      if (view === 'connected') setView('landing');
    }
  }, [status, view]);

  const resetState = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setView('landing');
    setRoomId(null);
  };

  const handleCreateRoom = async () => {
    setView('host');
    const id = await createRoom();
    setRoomId(id);
  };

  const handleScanRoom = () => {
    setView('guest');
  };

  useEffect(() => {
    if (view === 'guest' && !scannerRef.current) {
      setTimeout(() => {
        scannerRef.current = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        scannerRef.current.render(onScanSuccess, onScanFailure);
      }, 100);
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [view]);

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setRoomId(decodedText);
    try {
      await joinRoom(decodedText);
    } catch (e) {
      console.error(e);
      alert('Failed to join room');
      setView('landing');
    }
  };

  const onScanFailure = (error: any) => {
    // Ignore frequent scan failures
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl h-[85vh] bg-[#F2F6EE] rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative border border-[var(--outline-var)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <div className="flex items-center gap-4">
            {view !== 'landing' && (
              <button 
                onClick={resetState}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
              >
                <ArrowLeft size={20} className="text-gray-800" />
              </button>
            )}
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Lisyan Connect
              <div className="bg-[#D3E0C5] text-[#2D4A22] text-[10px] uppercase font-bold px-2 py-1 rounded-full">
                P2P
              </div>
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm text-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <AnimatePresence mode="wait">
            {view === 'landing' && (
              <motion.div 
                key="landing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col flex-1 gap-6 justify-center"
              >
                <div className="text-center mb-4">
                  <div className="w-24 h-24 bg-[#D3E0C5] text-[#2D4A22] rounded-[32px] mx-auto flex items-center justify-center mb-6 shadow-sm">
                    <Smartphone size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {lang === 'ru' ? 'Быстрая передача файлов' : 'Fast File Transfer'}
                  </h3>
                  <p className="text-gray-600 text-sm max-w-xs mx-auto">
                    {lang === 'ru' ? 'Прямое P2P соединение между устройствами через WebRTC. Без серверов.' : 'Direct P2P connection between devices via WebRTC. No servers.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleCreateRoom}
                    className="bg-white hover:bg-gray-50 border border-gray-200 p-6 rounded-[28px] flex flex-col items-center gap-4 transition-all shadow-sm active:scale-95"
                  >
                    <div className="w-14 h-14 bg-[#E5F0D9] text-[#2D4A22] rounded-[20px] flex items-center justify-center">
                      <QrCode size={24} />
                    </div>
                    <span className="font-bold text-gray-900">
                      {lang === 'ru' ? 'Поделиться' : 'Share Files'}
                    </span>
                  </button>

                  <button 
                    onClick={handleScanRoom}
                    className="bg-[#2D4A22] hover:bg-[#233b1a] text-white p-6 rounded-[28px] flex flex-col items-center gap-4 transition-all shadow-sm active:scale-95"
                  >
                    <div className="w-14 h-14 bg-white/20 rounded-[20px] flex items-center justify-center">
                      <Scan size={24} />
                    </div>
                    <span className="font-bold">
                      {lang === 'ru' ? 'Сканировать' : 'Scan QR'}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'host' && (
              <motion.div 
                key="host"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col flex-1 items-center justify-center text-center gap-6"
              >
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center">
                  <h3 className="font-bold text-gray-900 text-lg mb-6">
                    {lang === 'ru' ? 'Отсканируйте код для подключения' : 'Scan code to connect'}
                  </h3>
                  
                  {roomId ? (
                    <div className="p-4 bg-white rounded-3xl border border-gray-100 mb-6">
                      <QRCode value={roomId} size={200} fgColor="#2D4A22" />
                    </div>
                  ) : (
                    <div className="w-[232px] h-[232px] bg-gray-50 rounded-3xl mb-6 flex items-center justify-center">
                      <Loader2 size={32} className="animate-spin text-gray-400" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                    <Loader2 size={16} className="animate-spin text-[#2D4A22]" />
                    <span>{lang === 'ru' ? 'Ожидание устройства...' : 'Waiting for device...'}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'guest' && (
              <motion.div 
                key="guest"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col flex-1 items-center justify-center gap-6"
              >
                <div className="w-full max-w-sm bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden p-2">
                  <div id="reader" className="w-full rounded-[24px] overflow-hidden bg-gray-900 min-h-[300px]"></div>
                </div>
                <p className="text-gray-600 font-medium text-center">
                  {lang === 'ru' ? 'Наведите камеру на QR-код' : 'Point your camera at the QR code'}
                </p>
                <div className="w-full max-w-sm">
                  <p className="text-xs text-center text-gray-400 mb-2">{lang === 'ru' ? 'Или вставьте код комнаты:' : 'Or paste room code:'}</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Room ID"
                      value={roomId || ''}
                      onChange={e => setRoomId(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-center font-mono text-sm text-gray-900 outline-none focus:border-[#2D4A22]"
                    />
                    <button 
                      onClick={() => roomId && joinRoom(roomId)}
                      className="px-4 bg-[#2D4A22] text-white font-bold rounded-xl active:scale-95"
                    >
                      {lang === 'ru' ? 'Войти' : 'Join'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'connected' && (
              <motion.div 
                key="connected"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col flex-1"
              >
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex-1 flex flex-col">
                  
                  <div className="flex items-center justify-between mb-6 bg-[#E5F0D9] p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2D4A22] rounded-full flex items-center justify-center text-white shadow-sm">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#2D4A22]">
                          {lang === 'ru' ? 'Соединение установлено' : 'Connected'}
                        </h4>
                        <p className="text-xs text-[#2D4A22]/70 font-medium">
                          WebRTC P2P Data Channel
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label 
                      htmlFor="file-upload" 
                      className={`border-2 border-dashed border-[#D3E0C5] rounded-[28px] p-8 bg-[#F2F6EE]/50 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F2F6EE] transition-colors ${progress ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-[#2D4A22]">
                        <Upload size={28} />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">
                        {lang === 'ru' ? 'Выберите файл' : 'Select a file'}
                      </h4>
                      <p className="text-sm text-gray-500 text-center">
                        {lang === 'ru' ? 'Нажмите чтобы выбрать файл для отправки' : 'Click to select a file to send'}
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

                    {progress && (
                      <div className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{progress.name}</span>
                          <span className="text-sm font-bold text-[#2D4A22]">{Math.round(progress.percent)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-[#2D4A22] h-full transition-all duration-300 rounded-full" 
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex-1 flex flex-col">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Download size={18} className="text-[#2D4A22]" />
                        {lang === 'ru' ? 'Полученные файлы' : 'Received Files'}
                      </h4>
                      
                      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {receivedFiles.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                            <Info size={24} className="mb-2 opacity-50" />
                            <span className="text-sm">{lang === 'ru' ? 'Пусто' : 'Empty'}</span>
                          </div>
                        ) : (
                          receivedFiles.map((f, i) => (
                            <div key={i} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-2xl shadow-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 bg-[#F2F6EE] text-[#2D4A22] rounded-xl flex items-center justify-center shrink-0">
                                  <File size={18} />
                                </div>
                                <div className="truncate pr-4">
                                  <p className="text-sm font-bold text-gray-900 truncate">{f.name}</p>
                                  <p className="text-xs text-gray-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
                              <a 
                                href={f.url} 
                                download={f.name}
                                className="bg-[#2D4A22] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#233b1a] shrink-0"
                              >
                                {lang === 'ru' ? 'Сохранить' : 'Save'}
                              </a>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

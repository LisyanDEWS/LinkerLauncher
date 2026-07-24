import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  File,
  Laptop,
  Loader2,
  Monitor,
  QrCode,
  Smartphone,
  Upload,
  X,
} from 'lucide-react';
import { useP2P } from './lisyanconnect-useP2P';
import QRCode from 'react-qr-code';
import { AnimatePresence, motion } from 'motion/react';

interface LisyanConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ru' | 'en';
}

type ConnectView = 'setup' | 'actions' | 'create' | 'connect' | 'connected';
type DeviceType = 'pc' | 'laptop' | 'phone';

const DEVICE_TYPES: { key: DeviceType; icon: React.ReactNode; ru: string; en: string }[] = [
  { key: 'pc', icon: <Monitor size={18} />, ru: 'ПК', en: 'PC' },
  { key: 'laptop', icon: <Laptop size={18} />, ru: 'Ноутбук', en: 'Laptop' },
  { key: 'phone', icon: <Smartphone size={18} />, ru: 'Телефон', en: 'Phone' },
];

export function LisyanConnectModal({ isOpen, onClose, lang }: LisyanConnectModalProps) {
  const [view, setView] = useState<ConnectView>('setup');
  const [roomId, setRoomId] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('');
  const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
  const [joinError, setJoinError] = useState<string>('');

  const { status, createRoom, joinRoom, sendFiles, receivedFiles, progress } = useP2P();

  const isConnectedView = view === 'connected';

  const resetState = () => {
    setView('setup');
    setRoomId('');
    setJoinCode('');
    setJoinError('');
    setDeviceName('');
    setDeviceType(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (status === 'connected') {
      setView('connected');
    } else if (status === 'idle' && view === 'connected') {
      setView('actions');
    }
  }, [status, view]);

  const handleCreateRoom = async () => {
    setView('create');
    setRoomId('');
    try {
      const id = await createRoom();
      setRoomId(id);
    } catch (e) {
      console.error(e);
      setView('actions');
    }
  };

  const handleJoinRoom = async () => {
    const code = joinCode.trim();
    if (!code) {
      setJoinError(lang === 'ru' ? 'Введите код комнаты' : 'Enter room code');
      return;
    }

    setJoinError('');
    try {
      await joinRoom(code);
      setRoomId(code);
    } catch (e) {
      console.error(e);
      setJoinError(lang === 'ru' ? 'Комната не найдена или недоступна' : 'Room not found or unavailable');
    }
  };

  const handleBack = () => {
    if (view === 'actions') {
      setView('setup');
    } else if (view === 'create' || view === 'connect') {
      setView('actions');
    }
  };

  const canContinueFromSetup = deviceName.trim().length > 0 && deviceType !== null;

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex ${isConnectedView ? 'p-0' : 'items-center justify-center p-4'} bg-black/60 backdrop-blur-sm`}>
      <div
        className={`w-full overflow-hidden flex flex-col border border-[var(--outline-var)] shadow-2xl ${isConnectedView ? 'h-full rounded-none bg-[var(--surface)]' : 'max-w-3xl h-[88vh] rounded-[32px] bg-[var(--surface)]'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--outline-var)] bg-[var(--surface-dim)]">
          <div className="flex items-center gap-3 min-w-0">
            {(view === 'actions' || view === 'create' || view === 'connect') && (
              <button
                onClick={handleBack}
                className="w-9 h-9 rounded-full border border-[var(--outline-var)] bg-[var(--surface)] flex items-center justify-center text-[var(--on-surface-var)] hover:text-[var(--on-surface)]"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-lg md:text-xl font-black text-[var(--on-surface)] tracking-tight">Lisyan Connect</h2>
              <p className="text-xs text-[var(--on-surface-var)]">
                {isConnectedView
                  ? (lang === 'ru' ? 'Полноэкранный режим комнаты' : 'Fullscreen room mode')
                  : (lang === 'ru' ? 'Передача файлов между устройствами' : 'File transfer between devices')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[var(--outline-var)] bg-[var(--surface)] flex items-center justify-center text-[var(--on-surface-var)] hover:text-[var(--on-surface)]"
            aria-label="Close Lisyan Connect"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            {view === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto flex flex-col gap-6"
              >
                <div className="rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-6">
                  <h3 className="text-xl font-bold text-[var(--on-surface)] mb-2">
                    {lang === 'ru' ? 'Настройте устройство' : 'Set up your device'}
                  </h3>
                  <p className="text-sm text-[var(--on-surface-var)] mb-5">
                    {lang === 'ru'
                      ? 'Введите имя устройства и выберите тип, чтобы продолжить.'
                      : 'Enter a device name and choose a type to continue.'}
                  </p>

                  <label className="text-sm font-semibold text-[var(--on-surface)] block mb-2">
                    {lang === 'ru' ? 'Имя устройства' : 'Device name'}
                  </label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder={lang === 'ru' ? 'Например: Рабочий ПК' : 'For example: Work PC'}
                    className="w-full bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl px-4 py-3 text-[var(--on-surface)] outline-none focus:border-[var(--accent)]"
                  />

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-[var(--on-surface)] mb-2">{lang === 'ru' ? 'Тип устройства' : 'Device type'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {DEVICE_TYPES.map((typeOption) => (
                        <button
                          key={typeOption.key}
                          onClick={() => setDeviceType(typeOption.key)}
                          className={`rounded-2xl border px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${deviceType === typeOption.key ? 'border-[var(--accent)] text-[var(--on-surface)] bg-[var(--container)]' : 'border-[var(--outline-var)] text-[var(--on-surface-var)] bg-[var(--surface)] hover:text-[var(--on-surface)]'}`}
                        >
                          {typeOption.icon}
                          <span>{lang === 'ru' ? typeOption.ru : typeOption.en}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setView('actions')}
                    disabled={!canContinueFromSetup}
                    className="w-full mt-6 py-3 rounded-2xl font-extrabold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {lang === 'ru' ? 'Продолжить' : 'Continue'}
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'actions' && (
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto flex flex-col gap-4"
              >
                <div className="rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-6">
                  <h3 className="text-xl font-bold text-[var(--on-surface)]">
                    {lang === 'ru' ? 'Выберите действие' : 'Choose an action'}
                  </h3>
                  <p className="text-sm text-[var(--on-surface-var)] mt-2 mb-5">
                    {lang === 'ru'
                      ? `Устройство: ${deviceName} · ${DEVICE_TYPES.find((d) => d.key === deviceType)?.ru ?? ''}`
                      : `Device: ${deviceName} · ${DEVICE_TYPES.find((d) => d.key === deviceType)?.en ?? ''}`}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleCreateRoom}
                      className="rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-4 text-left hover:border-[var(--accent)] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white" style={{ backgroundColor: 'var(--accent)' }}>
                        <QrCode size={18} />
                      </div>
                      <p className="font-bold text-[var(--on-surface)]">{lang === 'ru' ? 'Создать комнату' : 'Create room'}</p>
                      <p className="text-xs text-[var(--on-surface-var)] mt-1">
                        {lang === 'ru' ? 'Показать QR и код комнаты' : 'Show QR and room code'}
                      </p>
                    </button>

                    <button
                      onClick={() => setView('connect')}
                      className="rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-4 text-left hover:border-[var(--accent)] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white" style={{ backgroundColor: 'var(--accent)' }}>
                        <ArrowLeft size={18} />
                      </div>
                      <p className="font-bold text-[var(--on-surface)]">{lang === 'ru' ? 'Подключиться к комнате' : 'Connect to room'}</p>
                      <p className="text-xs text-[var(--on-surface-var)] mt-1">
                        {lang === 'ru' ? 'Ввод кода комнаты вручную' : 'Join by typing room code'}
                      </p>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="max-w-xl mx-auto"
              >
                <div className="rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-6 flex flex-col items-center">
                  <h3 className="text-xl font-bold text-[var(--on-surface)] mb-2">
                    {lang === 'ru' ? 'Создана новая комната' : 'New room created'}
                  </h3>
                  <p className="text-sm text-[var(--on-surface-var)] mb-6 text-center">
                    {lang === 'ru'
                      ? 'Покажите QR-код или сообщите код комнаты другому участнику.'
                      : 'Share this QR code or room code with the other participant.'}
                  </p>

                  {roomId ? (
                    <div className="p-4 rounded-2xl bg-white border border-[var(--outline-var)] mb-4">
                      <QRCode value={roomId} size={210} fgColor="#2D4A22" />
                    </div>
                  ) : (
                    <div className="w-[242px] h-[242px] rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] flex items-center justify-center mb-4">
                      <Loader2 size={28} className="animate-spin text-[var(--on-surface-var)]" />
                    </div>
                  )}

                  <div className="w-full max-w-sm rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] px-4 py-3 text-center">
                    <p className="text-xs text-[var(--on-surface-var)] mb-1">{lang === 'ru' ? 'Код комнаты' : 'Room code'}</p>
                    <p className="font-mono text-base font-bold text-[var(--on-surface)] break-all">{roomId || '...'}</p>
                  </div>

                  <p className="text-xs text-[var(--on-surface-var)] mt-4">
                    {lang === 'ru' ? 'Ожидание подключения…' : 'Waiting for connection…'}
                  </p>
                </div>
              </motion.div>
            )}

            {view === 'connect' && (
              <motion.div
                key="connect"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="max-w-xl mx-auto"
              >
                <div className="rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-6">
                  <h3 className="text-xl font-bold text-[var(--on-surface)] mb-2">
                    {lang === 'ru' ? 'Подключиться к комнате' : 'Connect to room'}
                  </h3>
                  <p className="text-sm text-[var(--on-surface-var)] mb-4">
                    {lang === 'ru' ? 'Введите код комнаты для подключения.' : 'Type the room code to join.'}
                  </p>

                  <input
                    type="text"
                    placeholder={lang === 'ru' ? 'Код комнаты' : 'Room code'}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="w-full bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl px-4 py-3 text-[var(--on-surface)] outline-none focus:border-[var(--accent)]"
                  />

                  {joinError && <p className="text-xs text-red-500 mt-2">{joinError}</p>}

                  <button
                    onClick={handleJoinRoom}
                    className="w-full mt-4 py-3 rounded-2xl font-extrabold text-white"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {lang === 'ru' ? 'Подключиться' : 'Connect'}
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'connected' && (
              <motion.div
                key="connected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col"
              >
                <div className="rounded-3xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-4 md:p-5 mb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: 'var(--accent)' }}>
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-base font-bold text-[var(--on-surface)]">{lang === 'ru' ? 'Вы в комнате' : 'You are in room'}</p>
                        <p className="text-xs text-[var(--on-surface-var)]">
                          {lang === 'ru' ? `${deviceName} (${DEVICE_TYPES.find((d) => d.key === deviceType)?.ru ?? ''})` : `${deviceName} (${DEVICE_TYPES.find((d) => d.key === deviceType)?.en ?? ''})`}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-mono text-[var(--on-surface)] rounded-full border border-[var(--outline-var)] px-3 py-1 bg-[var(--surface)]">
                      {lang === 'ru' ? 'Комната' : 'Room'}: {roomId || '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                  <div className="rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-5 flex flex-col">
                    <h4 className="font-bold text-[var(--on-surface)] mb-3">{lang === 'ru' ? 'Отправка файлов' : 'Send files'}</h4>
                    <label
                      htmlFor="file-upload"
                      className={`border-2 border-dashed rounded-2xl p-8 flex-1 min-h-[220px] bg-[var(--surface-dim)] flex flex-col items-center justify-center cursor-pointer transition-colors border-[var(--outline-var)] hover:border-[var(--accent)] ${progress ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="w-14 h-14 rounded-full bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center mb-3 text-[var(--on-surface)]">
                        <Upload size={24} />
                      </div>
                      <p className="font-bold text-[var(--on-surface)]">{lang === 'ru' ? 'Выбрать файл' : 'Select files'}</p>
                      <p className="text-xs text-[var(--on-surface-var)] mt-1 text-center">
                        {lang === 'ru' ? 'Нажмите, чтобы отправить файлы участникам комнаты.' : 'Click to send files to room members.'}
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
                      <div className="mt-4 rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-3">
                        <div className="flex justify-between text-xs text-[var(--on-surface-var)] mb-2">
                          <span className="truncate mr-2">{progress.name}</span>
                          <span className="font-bold text-[var(--on-surface)]">{Math.round(progress.percent)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--surface)] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${progress.percent}%`, backgroundColor: 'var(--accent)' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-5 flex flex-col min-h-0">
                    <h4 className="font-bold text-[var(--on-surface)] mb-3 flex items-center gap-2">
                      <Download size={16} />
                      {lang === 'ru' ? 'Полученные файлы' : 'Received files'}
                    </h4>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {receivedFiles.length === 0 ? (
                        <div className="h-full min-h-[220px] rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] flex items-center justify-center text-sm text-[var(--on-surface-var)]">
                          {lang === 'ru' ? 'Файлы пока не получены' : 'No files received yet'}
                        </div>
                      ) : (
                        receivedFiles.map((f, i) => (
                          <div key={i} className="rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface)]">
                                <File size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[var(--on-surface)] truncate">{f.name}</p>
                                <p className="text-xs text-[var(--on-surface-var)]">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <a
                              href={f.url}
                              download={f.name}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap"
                              style={{ backgroundColor: 'var(--accent)' }}
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
    </div>
  );
}

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, QrCode, UploadCloud, Globe, Smartphone, X, Check, ExternalLink } from 'lucide-react';
import { LisyanConnectLogo } from './LisyanConnectLogo';
import { Language } from '../types';

interface LisyanConnectGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
  lang: Language;
}

export const HIDE_GUIDE_STORAGE_KEY = 'linkerru_lisyanconnect_hide_guide';

export function LisyanConnectGuideModal({
  isOpen,
  onClose,
  onDontShowAgain,
  lang,
}: LisyanConnectGuideModalProps) {
  const isRu = lang === 'ru';
  const isUk = lang === 'uk';

  const steps = [
    {
      number: '1',
      icon: Globe,
      title: isRu
        ? 'Открытие приложения'
        : isUk
          ? 'Відкриття додатку'
          : 'Open the Application',
      content: (
        <div className="space-y-2">
          <p className="text-xs text-[var(--on-surface-var)] leading-relaxed">
            {isRu ? (
              <>
                Откройте приложение <strong>Lisyan Connect</strong> через{' '}
                <a
                  href="https://desmoss.netlify.app"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[var(--accent)] underline inline-flex items-center gap-0.5"
                >
                  desmoss.netlify.app <ExternalLink size={10} />
                </a>{' '}
                и запустите <strong>LinkerRu :Re</strong>, затем выберите приложение Lisyan Connect.
              </>
            ) : isUk ? (
              <>
                Відкрийте додаток <strong>Lisyan Connect</strong> через{' '}
                <a
                  href="https://desmoss.netlify.app"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[var(--accent)] underline inline-flex items-center gap-0.5"
                >
                  desmoss.netlify.app <ExternalLink size={10} />
                </a>{' '}
                і запустіть <strong>LinkerRu :Re</strong>, потім оберіть Lisyan Connect.
              </>
            ) : (
              <>
                Open <strong>Lisyan Connect</strong> via{' '}
                <a
                  href="https://desmoss.netlify.app"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[var(--accent)] underline inline-flex items-center gap-0.5"
                >
                  desmoss.netlify.app <ExternalLink size={10} />
                </a>{' '}
                and launch <strong>LinkerRu :Re</strong>, then choose the Lisyan Connect app.
              </>
            )}
          </p>
          <div className="rounded-xl bg-[var(--surface-dim)] p-2.5 border border-[var(--outline-var)] text-[11px] text-[var(--on-surface-var)]">
            <span className="font-bold text-[var(--on-surface)] flex items-center gap-1 mb-1">
              <Smartphone size={12} className="text-[var(--accent)]" />
              {isRu ? 'Для смартфонов и быстрого доступа:' : isUk ? 'Для смартфонів та швидкого доступу:' : 'For Mobile & Quick Access:'}
            </span>
            {isRu ? (
              <>
                Если вы делитесь с телефона или вам не нужна дополнительная безопасность, откройте приложение через{' '}
                <a
                  href="https://linkerRulauncher.netlify.app"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[var(--accent)] underline inline-flex items-center gap-0.5"
                >
                  linkerRulauncher.netlify.app <ExternalLink size={9} />
                </a>{' '}
                или отсканируйте QR-код.
              </>
            ) : isUk ? (
              <>
                Якщо ви ділитесь з телефону або вам не потрібна додаткова безпека, відкрийте додаток через{' '}
                <a
                  href="https://linkerRulauncher.netlify.app"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[var(--accent)] underline inline-flex items-center gap-0.5"
                >
                  linkerRulauncher.netlify.app <ExternalLink size={9} />
                </a>{' '}
                або відскануйте QR-код.
              </>
            ) : (
              <>
                If sharing from a phone or if you don&apos;t need extra sandboxing, open via{' '}
                <a
                  href="https://linkerRulauncher.netlify.app"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[var(--accent)] underline inline-flex items-center gap-0.5"
                >
                  linkerRulauncher.netlify.app <ExternalLink size={9} />
                </a>{' '}
                or scan the QR code.
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      number: '2',
      icon: Wifi,
      title: isRu
        ? 'Подключение к сети (Wi-Fi / данные)'
        : isUk
          ? 'Підключення до мережі (Wi-Fi / дані)'
          : 'Network Connection (Wi-Fi / Cellular)',
      content: (
        <p className="text-xs text-[var(--on-surface-var)] leading-relaxed">
          {isRu
            ? 'Подсоедините оба девайса к Wi-Fi или мобильным данным. Учтите: это не должен быть публичный Wi-Fi (в публичных/корпоративных сетях P2P может блокироваться), но если сработало — пользуйтесь!'
            : isUk
              ? 'Підключіть обидва девайси до Wi-Fi або мобільного інтернету. Зверніть увагу: це не має бути публічний Wi-Fi (у публічних мережах P2P може блокуватися), але якщо спрацювало — користуйтеся!'
              : 'Connect both devices to Wi-Fi or cellular data. Note: Avoid public Wi-Fi (P2P might be blocked on restrictive/public networks), but if it connects — enjoy!'}
        </p>
      ),
    },
    {
      number: '3',
      icon: QrCode,
      title: isRu
        ? 'Создание комнаты или подключение'
        : isUk
          ? 'Створення кімнати або підключення'
          : 'Create Room or Connect',
      content: (
        <p className="text-xs text-[var(--on-surface-var)] leading-relaxed">
          {isRu
            ? 'Создайте комнату на одном устройстве или подключитесь к другому девайсу через короткий PIN-код или сканирование QR-кода камерой.'
            : isUk
              ? 'Створіть кімнату на одному пристрої або підключіться до іншого девайсу за допомогою короткого PIN-коду чи сканування QR-коду камерою.'
              : 'Create a room on one device or join another device via the short PIN code or by scanning the QR code with your camera.'}
        </p>
      ),
    },
    {
      number: '4',
      icon: UploadCloud,
      title: isRu
        ? 'Прямая передача файлов'
        : isUk
          ? 'Пряма передача файлів'
          : 'Direct File Sharing',
      content: (
        <p className="text-xs text-[var(--on-surface-var)] leading-relaxed">
          {isRu
            ? 'Делитесь файлами любого размера и формата на максимальной скорости напрямую (P2P WebRTC) со сквозным шифрованием без ограничений!'
            : isUk
              ? 'Діліться файлами будь-якого розміру та формату на максимальній швидкості напряму (P2P WebRTC) з наскрізним шифруванням без обмежень!'
              : 'Share files of any size and format at maximum speed directly (P2P WebRTC) with end-to-end encryption and zero cloud limits!'}
        </p>
      ),
    },
  ];

  if (typeof document === 'undefined') return null;

  return (
    <AnimatePresence>
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-6 sm:p-7 text-[var(--on-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--outline-var)] shrink-0">
                <div className="flex items-center gap-3">
                  <LisyanConnectLogo className="w-11 h-11" variant="squircle" />
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-[var(--on-surface)]">
                      {isRu ? 'Инструкция к Lisyan Connect' : isUk ? 'Інструкція до Lisyan Connect' : 'Lisyan Connect Guide'}
                    </h3>
                    <p className="text-xs font-semibold text-[var(--on-surface-var)]">
                      {isRu ? 'Быстрый старт по шагам' : isUk ? 'Швидкий старт по кроках' : 'Step-by-step Quickstart'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] transition cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Steps List */}
              <div className="overflow-y-auto space-y-3 pt-4 pr-1 custom-scrollbar flex-1">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.number}
                      className="rounded-2xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-3.5 flex items-start gap-3.5 transition-all hover:border-[var(--accent)]"
                    >
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] text-[var(--accent)] shadow-xs font-black text-sm">
                          <Icon size={18} />
                        </div>
                        <span className="text-[10px] font-black text-[var(--on-surface-var)] opacity-80">
                          #{step.number}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-xs font-black text-[var(--on-surface)] tracking-tight">
                          {step.title}
                        </h4>
                        {step.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-[var(--outline-var)] flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 mt-3">
                <button
                  onClick={onDontShowAgain}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-bold border border-[var(--outline-var)] text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] transition active:scale-95 cursor-pointer text-center"
                >
                  {isRu ? 'Я понял, больше не показывать' : isUk ? 'Зрозуміло, більше не показувати' : "Got it, don't show again"}
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-extrabold bg-[var(--accent)] text-[var(--on-accent)] shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  {isRu ? 'Я понял' : isUk ? 'Я зрозумів' : 'Got it'}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
    </AnimatePresence>
  );
}


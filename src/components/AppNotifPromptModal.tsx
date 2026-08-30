import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ShieldAlert, Check, X } from 'lucide-react';
import { Language } from '../types';

interface AppNotifPromptModalProps {
  isOpen: boolean;
  appId: string;
  appName: string;
  lang: Language;
  onRespond: (appId: string, allowed: boolean) => void;
}

export const AppNotifPromptModal: React.FC<AppNotifPromptModalProps> = ({
  isOpen,
  appId,
  appName,
  lang,
  onRespond,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[360] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="relative w-full max-w-sm rounded-3xl border border-[var(--outline-var)] bg-[var(--surface)] p-6 shadow-2xl text-center flex flex-col items-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20 mb-4 shadow-sm">
            <Bell size={24} />
          </div>

          <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight mb-1">
            {lang === 'ru' ? 'Разрешение на уведомления' : 'Notification Permission'}
          </h3>

          <p className="text-xs text-[var(--on-surface-var)] leading-relaxed mb-6">
            {lang === 'ru' ? (
              <>
                Приложение <span className="font-extrabold text-[var(--on-surface)]">«{appName}»</span> запрашивает разрешение на отправку внутренних уведомлений.
              </>
            ) : (
              <>
                App <span className="font-extrabold text-[var(--on-surface)]">{appName}</span> is requesting permission to send internal notifications.
              </>
            )}
          </p>

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => onRespond(appId, false)}
              className="flex-1 py-3 rounded-2xl border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)] transition-all cursor-pointer"
            >
              {lang === 'ru' ? 'Запретить' : 'Deny'}
            </button>
            <button
              onClick={() => onRespond(appId, true)}
              className="flex-1 py-3 rounded-2xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer"
            >
              {lang === 'ru' ? 'Разрешить' : 'Allow'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

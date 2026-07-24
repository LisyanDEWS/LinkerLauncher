import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2 } from 'lucide-react';
import { Language } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  notifications: { id: string; title: string; message: string; read: boolean }[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  lang,
  notifications,
  onMarkAsRead,
  onClearAll
}: NotificationsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center p-4 md:p-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto"
          />

          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm bg-[var(--surface)] border border-[var(--outline-var)] shadow-2xl rounded-3xl overflow-hidden pointer-events-auto mt-2"
          >
            <div className="p-4 border-b border-[var(--outline-var)] flex items-center justify-between bg-[var(--surface-dim)]">
              <span className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)]">
                {lang === 'ru' ? 'Уведомления' : 'Notifications'}
              </span>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button 
                    onClick={onClearAll}
                    className="p-1.5 rounded-full text-[var(--on-surface-var)] hover:bg-[var(--container)] hover:text-[var(--on-surface)] transition-colors"
                    title={lang === 'ru' ? 'Очистить все' : 'Clear all'}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-[var(--container)] text-[var(--on-surface-var)] hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] border border-[var(--outline-var)] transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-[var(--outline)] text-xs font-semibold">
                  {lang === 'ru' ? 'Нет новых уведомлений' : 'No new notifications'}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-3 rounded-2xl border transition-all ${n.read ? 'border-transparent bg-transparent opacity-70' : 'border-[var(--outline-var)] bg-[var(--container)]'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className={`text-xs font-bold mb-1 ${n.read ? 'text-[var(--on-surface-var)]' : 'text-[var(--on-surface)]'}`}>
                            {n.title}
                          </div>
                          <div className="text-[10px] text-[var(--on-surface-var)] leading-relaxed">
                            {n.message}
                          </div>
                        </div>
                        {!n.read && (
                          <button 
                            onClick={() => onMarkAsRead(n.id)}
                            className="shrink-0 text-[10px] font-black uppercase bg-[var(--surface)] border border-[var(--outline-var)] px-2 py-1 rounded-lg hover:bg-[var(--container-high)] transition-colors"
                          >
                            {lang === 'ru' ? 'Прочитано' : 'Mark Read'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

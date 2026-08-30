import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';
import { Mail, Send, HelpCircle, Code, ChevronRight, User, X } from 'lucide-react';
import { Language } from '../types';

interface SupportQRModalProps {
  contactId: string | null;
  onClose: () => void;
  lang: Language;
  theme?: 'light' | 'dark';
}

export type SupportContact = {
  id: string;
  type: 'telegram_user' | 'telegram_channel' | 'email';
  title: string;
  value: string;
  link: string;
  icon: React.ElementType;
  description_ru: string;
  description_en: string;
};

export const CONTACTS: SupportContact[] = [
  {
    id: 'dev',
    type: 'telegram_user',
    title: 'Developer',
    value: '@pubertatnyj',
    link: 'https://t.me/pubertatnyj',
    icon: User,
    description_ru: 'Связь с разработчиком',
    description_en: 'Contact the developer',
  },
  {
    id: 'channel',
    type: 'telegram_channel',
    title: 'LinkerRu Channel',
    value: 't.me/linkerRu',
    link: 'https://t.me/linkerRu',
    icon: Send,
    description_ru: 'Официальный Telegram канал',
    description_en: 'Official Telegram channel',
  },
  {
    id: 'email',
    type: 'email',
    title: 'Email Support',
    value: 'lisyandews@gmail.com',
    link: 'mailto:lisyandews@gmail.com',
    icon: Mail,
    description_ru: 'Вопросы и предложения',
    description_en: 'Questions and suggestions',
  }
];

export function SupportQRModal({ contactId, onClose, lang, theme = 'light' }: SupportQRModalProps) {
  const activeContact = contactId ? CONTACTS.find(c => c.id === contactId) : null;
  const isRu = lang === 'ru';

  if (!activeContact) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm bg-[var(--surface)] border border-[var(--outline)] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
      >
        <div className="flex h-12 items-center justify-between border-b border-[var(--outline-var)] bg-[var(--surface-dim)] px-4">
          <div className="font-bold text-sm text-[var(--on-surface)] tracking-tight">{activeContact.title}</div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-red-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--surface)]">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] mb-4 shadow-inner">
              <activeContact.icon size={24} />
            </div>
            <h2 className="text-xl font-black text-[var(--on-surface)] tracking-tight mb-2">
              {isRu ? activeContact.description_ru : activeContact.description_en}
            </h2>
            <p className="text-xs font-bold text-[var(--on-surface-var)]">
              {isRu ? 'Отсканируйте код или нажмите' : 'Scan the code or click'}
            </p>
          </div>

          <a 
            href={activeContact.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-[var(--surface-dim)] p-6 rounded-[2rem] border border-[var(--outline)] shadow-xl hover:shadow-2xl hover:border-[var(--accent)] transition-all cursor-pointer active:scale-95 flex flex-col items-center w-full"
          >
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-black/5">
              <QRCode 
                value={activeContact.link} 
                size={160}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
                className="rounded-xl"
              />
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 bg-[var(--surface)] px-4 py-2 rounded-full border border-[var(--outline)] shadow-sm group-hover:bg-[var(--accent)] group-hover:text-white group-hover:border-[var(--accent)] transition-colors w-full">
              <span className="font-mono font-bold text-xs truncate">
                {activeContact.value}
              </span>
              <ChevronRight size={14} className="shrink-0" />
            </div>
          </a>
          
          <div className="mt-8 text-[9px] font-black uppercase tracking-widest text-[var(--on-surface-var)] opacity-50 flex items-center gap-2">
            <Code size={10} />
            Lisyan Support
          </div>
        </div>
      </motion.div>
    </div>
  );
}

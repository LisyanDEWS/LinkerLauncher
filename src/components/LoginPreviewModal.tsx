import { useState } from 'react';
import { motion } from 'motion/react';
import { X, User, Lock } from 'lucide-react';
import { Language } from '../types';

interface LoginPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  primaryColor: string;
}

export default function LoginPreviewModal({ isOpen, onClose, lang, primaryColor }: LoginPreviewModalProps) {
  const [isRegister, setIsRegister] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        className="relative z-10 w-full max-w-4xl rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--outline-var)] bg-[var(--surface-dim)]">
          <div>
            <h3 className="text-sm font-black tracking-widest uppercase text-[var(--on-surface)]">
              {lang === 'ru' ? 'Предпросмотр входа' : 'Login Preview'}
            </h3>
            <p className="text-[10px] font-bold text-[var(--on-surface-var)] mt-1">
              {lang === 'ru' ? 'демо-режим • user228' : 'preview mode • user228'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[var(--outline-var)] bg-[var(--surface)] flex items-center justify-center text-[var(--on-surface-var)] hover:text-[var(--on-surface)]"
          >
            <X size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-[var(--outline-var)] bg-[var(--surface)]">
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)]">
                {isRegister ? (lang === 'ru' ? 'Регистрация' : 'Register') : (lang === 'ru' ? 'Вход' : 'Sign in')}
              </span>
              <h4 className="text-2xl font-black mt-2 text-[var(--on-surface)]">
                {isRegister ? (lang === 'ru' ? 'Создать аккаунт' : 'Create account') : (lang === 'ru' ? 'С возвращением' : 'Welcome back')}
              </h4>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--outline)] bg-[var(--surface-dim)]">
                <User size={16} className="text-[var(--on-surface-var)]" />
                <input
                  readOnly
                  value="user228"
                  className="w-full bg-transparent outline-none text-sm font-bold text-[var(--on-surface)]"
                />
              </label>
              <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--outline)] bg-[var(--surface-dim)]">
                <Lock size={16} className="text-[var(--on-surface-var)]" />
                <input
                  readOnly
                  value="user228"
                  className="w-full bg-transparent outline-none text-sm font-bold text-[var(--on-surface)]"
                />
              </label>
              {isRegister && (
                <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--outline)] bg-[var(--surface-dim)]">
                  <Lock size={16} className="text-[var(--on-surface-var)]" />
                  <input
                    readOnly
                    value="user228"
                    className="w-full bg-transparent outline-none text-sm font-bold text-[var(--on-surface)]"
                  />
                </label>
              )}
            </div>

            <button
              className="w-full mt-5 py-3 rounded-2xl text-xs font-black tracking-wider uppercase text-[var(--surface)]"
              style={{ backgroundColor: primaryColor }}
            >
              {isRegister ? (lang === 'ru' ? 'Создать user228' : 'Create user228') : (lang === 'ru' ? 'Войти как user228' : 'Sign in as user228')}
            </button>

            <button
              onClick={() => setIsRegister((v) => !v)}
              className="w-full mt-3 py-2.5 rounded-2xl text-xs font-bold border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)]"
            >
              {isRegister
                ? (lang === 'ru' ? 'Уже есть аккаунт user228' : 'Already have user228')
                : (lang === 'ru' ? 'Создать аккаунт user228' : 'Create user228 account')}
            </button>
          </div>

          <div className="p-6 md:p-8 bg-[var(--surface-dim)]">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)]">
              {lang === 'ru' ? 'Демо профиль' : 'Demo profile'}
            </span>
            <div className="mt-4 rounded-2xl border border-[var(--outline)] bg-[var(--surface)] p-4">
              <div className="text-base font-black text-[var(--on-surface)]">user228</div>
              <div className="text-xs font-semibold text-[var(--on-surface-var)] mt-1">user228@linker.local</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold text-[var(--on-surface-var)]">
                <div className="rounded-xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-2">ID: user228</div>
                <div className="rounded-xl border border-[var(--outline-var)] bg-[var(--surface-dim)] p-2">
                  {lang === 'ru' ? 'Статус: Preview' : 'Status: Preview'}
                </div>
              </div>
            </div>
            <p className="text-xs font-semibold text-[var(--on-surface-var)] mt-4">
              {lang === 'ru'
                ? 'Экран используется как интегрированный предпросмотр логина/регистрации в монохромной теме.'
                : 'This is an integrated monochrome login/register preview inside the app.'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

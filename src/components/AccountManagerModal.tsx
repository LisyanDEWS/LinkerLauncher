import React, { useState, useEffect } from 'react';
import { User, KeyRound, Lock, Loader2, Check, ShieldCheck, LogOut, Mail, AlertCircle } from 'lucide-react';
import { userAuth, userDb } from '../lib/userFirebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, signOut } from 'firebase/auth';
import type { Language } from '../types';

interface AccountManagerModalProps {
  lang: Language;
  nickname: string;
  onNicknameChange: (newNick: string) => void;
  isAuthenticated: boolean;
  onClose?: () => void;
}

export function AccountManagerModal({
  lang,
  nickname,
  onNicknameChange,
  isAuthenticated,
  onClose,
}: AccountManagerModalProps) {
  const [nickInput, setNickInput] = useState(nickname);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setNickInput(nickname);
  }, [nickname]);

  const handleUpdateNickname = async () => {
    if (!nickInput.trim()) {
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Никнейм не может быть пустым' : 'Nickname cannot be empty',
      });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      onNicknameChange(nickInput.trim());
      if (isAuthenticated && userAuth.currentUser) {
        const userDocRef = doc(userDb, 'users', userAuth.currentUser.uid);
        await updateDoc(userDocRef, {
          nickname: nickInput.trim(),
          updatedAt: Date.now(),
        });
      }
      setMessage({
        type: 'success',
        text: lang === 'ru' ? 'Никнейм успешно обновлен!' : 'Nickname updated successfully!',
      });
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Ошибка при сохранении' : 'Failed to save nickname',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Введите новый пароль' : 'Please enter a new password',
      });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Пароль должен быть не менее 6 символов' : 'Password must be at least 6 characters',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: lang === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const user = userAuth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        setMessage({
          type: 'success',
          text: lang === 'ru' ? 'Пароль успешно изменен!' : 'Password updated successfully!',
        });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({
          type: 'error',
          text: lang === 'ru' ? 'Пользователь не найден' : 'User not found',
        });
      }
    } catch (err: unknown) {
      console.error(err);
      let errMsg = lang === 'ru' ? 'Ошибка изменения пароля' : 'Failed to update password';
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'auth/requires-recent-login') {
        errMsg =
          lang === 'ru'
            ? 'Для изменения пароля требуется выйти и войти заново.'
            : 'This operation is sensitive and requires recent authentication. Please log out and log back in.';
      }
      setMessage({
        type: 'error',
        text: errMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(userAuth);
      if (onClose) onClose();
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-transparent text-[var(--on-surface)] p-6 space-y-6 select-none font-sans scrollbar-thin">
      {/* Top Header Card */}
      <div className="p-6 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-3xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 shadow-sm">
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
          <div className="h-16 w-16 rounded-2xl bg-[var(--container)] border border-[var(--outline)] flex items-center justify-center text-[var(--on-surface)] shadow-sm shrink-0">
            <User size={28} />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h3 className="text-lg font-black text-[var(--on-surface)] tracking-tight">
                {isAuthenticated ? (nickname || 'User') : (lang === 'ru' ? 'Гостевой аккаунт' : 'Guest Account')}
              </h3>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                isAuthenticated 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-[var(--surface)] border-[var(--outline-var)] text-[var(--on-surface-var)]'
              }`}>
                {isAuthenticated ? (lang === 'ru' ? 'Активен' : 'Verified') : (lang === 'ru' ? 'Гость' : 'Guest')}
              </span>
            </div>
            <p className="text-xs font-semibold text-[var(--on-surface-var)] flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Mail size={12} />
              <span>{isAuthenticated ? (userAuth.currentUser?.email || 'user@linker.os') : 'guest@linker.os'}</span>
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--container)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface)] transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            <LogOut size={14} />
            <span>{lang === 'ru' ? 'Выйти' : 'Sign Out'}</span>
          </button>
        )}
      </div>

      {/* Alert Banner if message exists */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
          }`}
        >
          <AlertCircle size={16} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Nickname Editor */}
      <div className="p-5 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[var(--on-surface-var)]" />
          <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)]">
            {lang === 'ru' ? 'Имя пользователя (Никнейм)' : 'Profile Nickname'}
          </h4>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={nickInput}
            onChange={(e) => setNickInput(e.target.value)}
            className="flex-1 text-xs font-bold px-4 py-3 bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-xl outline-none focus:border-[var(--on-surface)] transition-colors"
            placeholder={lang === 'ru' ? 'Введите никнейм' : 'Enter nickname'}
            disabled={isLoading}
          />
          <button
            onClick={handleUpdateNickname}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl text-xs font-black bg-[var(--on-surface)] text-[var(--surface)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            <span>{lang === 'ru' ? 'Сохранить' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Security & Password Change */}
      <div className="p-5 bg-[var(--surface-dim)] border border-[var(--outline-var)] rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-[var(--on-surface-var)]" />
          <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)]">
            {lang === 'ru' ? 'Безопасность и Пароль' : 'Security & Password'}
          </h4>
        </div>

        {isAuthenticated ? (
          <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] pl-1">
                {lang === 'ru' ? 'Новый пароль' : 'New Password'}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs font-bold px-4 py-3 bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-xl outline-none focus:border-[var(--on-surface)] transition-colors"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--on-surface-var)] pl-1">
                {lang === 'ru' ? 'Подтвердите пароль' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-xs font-bold px-4 py-3 bg-[var(--surface)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-xl outline-none focus:border-[var(--on-surface)] transition-colors"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-xs font-black bg-[var(--on-surface)] text-[var(--surface)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              <span>{lang === 'ru' ? 'Изменить пароль' : 'Update Password'}</span>
            </button>
          </form>
        ) : (
          <div className="pt-2 text-center py-6 px-4">
            <p className="text-xs font-semibold text-[var(--on-surface-var)] max-w-sm mx-auto leading-relaxed">
              {lang === 'ru'
                ? 'Смена пароля недоступна в гостевом режиме. Пожалуйста, откройте Linker R Launcher на ПК или переключитесь на десктопную версию для полноценной авторизации.'
                : 'Password changing is not available in guest mode. Please launch Linker R Launcher on a desktop browser or PC mode to register and manage your account.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

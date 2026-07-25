import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Check, ArrowLeft, Loader2, Shield } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (nickname: string) => void;
  lang: 'ru' | 'en';
  onLangChange: (lang: 'ru' | 'en') => void;
}

export function LoginScreen({ onLogin, lang, onLangChange }: LoginScreenProps) {
  const [selection, setSelection] = useState<'login' | 'signup' | null>(null);
  const [signupStep, setSignupStep] = useState<number>(1);
  const [accepted, setAccepted] = useState<boolean>(false);
  
  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupUser, setSignupUser] = useState('');

  // Success states
  const [isSuccess, setIsSuccess] = useState(false);
  const [loadingDone, setLoadingDone] = useState(false);
  const [successData, setSuccessData] = useState({ title: '', subtitle: '', letter: '' });

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastShow, setIsToastShow] = useState(false);

  // Privacy modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Error shake triggers
  const [errorField, setErrorField] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastShow(true);
    setTimeout(() => setIsToastShow(false), 3000);
  };

  const triggerErr = (fieldId: string) => {
    setErrorField(fieldId);
    setTimeout(() => setErrorField(null), 400);
  };

  // Translations
  const t = {
    ru: {
      infoText: 'Выберите действие',
      backBtn: 'Вернуться',
      loginTitle: 'Вход в аккаунт',
      loginSubtitle: 'Добро пожаловать в LinkerRu',
      lblEmail: 'Электронная почта',
      plEmail: 'name@domain.com',
      lblPass: 'Пароль',
      plPass: 'Введите ваш пароль',
      txtLogin: 'Войти',
      signupTitle: 'Регистрация',
      signupSubtitle: 'Создать новый аккаунт',
      hintStep2: 'Имя профиля и соглашение',
      lblUser: 'Имя пользователя',
      plUser: 'латиница и цифры, от 6 симв.',
      txtNext: 'Далее',
      txtBack: 'Назад',
      txtSignup: 'Зарегистрироваться',
      acceptTerms: 'Я согласен с условиями',
      privacyPolicy: 'Политикой конфиденциальности',
      errReq: 'Пожалуйста, заполните все поля',
      errEmail: 'Неверный формат электронной почты',
      errPass: 'Пароль должен содержать минимум 7 символов',
      errUser: 'Имя пользователя: мин. 6 символов (только буквы и цифры)',
      errCheck: 'Необходимо согласиться с политикой конфиденциальности',
      redirecting: 'Успешный вход! Загрузка платформы...'
    },
    en: {
      infoText: 'Select action',
      backBtn: 'Go back',
      loginTitle: 'Sign In',
      loginSubtitle: 'Welcome to LinkerRu',
      lblEmail: 'Email Address',
      plEmail: 'name@domain.com',
      lblPass: 'Password',
      plPass: 'Enter your password',
      txtLogin: 'Sign In',
      signupTitle: 'Create Account',
      signupSubtitle: 'Get started with LinkerRu',
      hintStep2: 'Choose profile name & terms',
      lblUser: 'Username',
      plUser: 'alphanumeric, min 6 chars',
      txtNext: 'Continue',
      txtBack: 'Back',
      txtSignup: 'Create Account',
      acceptTerms: 'I accept the terms and',
      privacyPolicy: 'Privacy Policy',
      errReq: 'Please fill out all required fields',
      errEmail: 'Invalid email address format',
      errPass: 'Password must be at least 7 characters long',
      errUser: 'Username must be at least 6 alphanumeric characters',
      errCheck: 'Please accept the privacy policy to proceed',
      redirecting: 'Welcome back! Loading platform...'
    }
  }[lang];

  // Actions
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) { triggerErr('login-email'); showToast(t.errReq); return; }
    if (!loginPass.trim()) { triggerErr('login-pass'); showToast(t.errReq); return; }
    
    const nick = loginEmail.split('@')[0] || 'User';
    triggerSuccess(`welcome back, @${nick}`, `@${nick}`, nick.charAt(0).toUpperCase(), nick);
  };

  const handleSignupNext = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signupEmail.trim()) { triggerErr('signup-email'); showToast(t.errReq); return; }
    if (!emailRegex.test(signupEmail)) { triggerErr('signup-email'); showToast(t.errEmail); return; }
    if (signupPass.length < 7) { triggerErr('signup-pass'); showToast(t.errPass); return; }

    setSignupStep(2);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userRegex = /^[a-zA-Z0-9]{6,}$/;
    if (!userRegex.test(signupUser)) { triggerErr('signup-user'); showToast(t.errUser); return; }
    if (!accepted) { triggerErr('signup-cb'); showToast(t.errCheck); return; }

    triggerSuccess(`hello there, @${signupUser}`, `@${signupUser}`, signupUser.charAt(0).toUpperCase(), signupUser);
  };

  const triggerSuccess = (title: string, subtitle: string, letter: string, finalNick: string) => {
    setSuccessData({ title, subtitle, letter });
    setIsSuccess(true);
    setLoadingDone(false);

    // Wait 1.5 seconds displaying spinner, then change to check/logo, and log in automatically
    setTimeout(() => {
      setLoadingDone(true);
      showToast(t.redirecting);
      setTimeout(() => {
        onLogin(finalNick);
      }, 1000);
    }, 1500);
  };

  const resetSelection = () => {
    setSelection(null);
    setIsSuccess(false);
    setLoadingDone(false);
    setSignupStep(1);
    setAccepted(false);
    setLoginEmail(''); setLoginPass('');
    setSignupEmail(''); setSignupPass(''); setSignupUser('');
  };

  // FORCE LIGHT MONOCHROME PALETTE LOCALLY
  const lightMonoThemeVars = {
    '--bg': '#F5F5F5',
    '--surface': '#FFFFFF',
    '--surface-dim': '#F9F9F9',
    '--surface-bright': '#FFFFFF',
    '--on-surface': '#171717',
    '--on-surface-var': '#737373',
    '--outline': '#E5E5E5',
    '--outline-var': '#F5F5F5',
    '--container': '#F5F5F5',
    '--container-high': '#E5E5E5',
    '--accent': '#171717',
    '--on-accent': '#FFFFFF',
  } as React.CSSProperties;

  return (
    <div 
      style={lightMonoThemeVars}
      className="bg-[var(--bg)] min-h-screen w-full flex flex-col items-center justify-between font-sans text-[var(--on-surface)] select-none overflow-x-hidden relative"
    >
      {/* Decorative background grids/patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:16px_16px] opacity-70 pointer-events-none z-0" />

      {/* Top Header Controls */}
      <header className="w-full max-w-6xl px-6 py-6 flex justify-between items-center z-20 relative">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shadow-sm">
            <img 
              src="https://github.com/user-attachments/assets/32281ac0-dadc-4bc4-b254-8c97f9d30bd8" 
              alt="Logo" 
              className="w-6 h-6 object-contain rounded-full brightness-0 invert" 
            />
          </div>
          <span className="text-sm font-black tracking-wider uppercase text-[var(--on-surface)]">
            LinkerRu <span className="text-xs font-medium lowercase opacity-50">:re</span>
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="flex bg-[var(--surface)] rounded-2xl p-1 border border-[var(--outline)] shadow-sm">
            <button 
              onClick={() => onLangChange('en')}
              className={`px-4 py-1.5 rounded-xl text-[11px] font-bold tracking-wider cursor-pointer transition-all ${lang === 'en' ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'}`}>
              EN
            </button>
            <button 
              onClick={() => onLangChange('ru')}
              className={`px-4 py-1.5 rounded-xl text-[11px] font-bold tracking-wider cursor-pointer transition-all ${lang === 'ru' ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'}`}>
              RU
            </button>
          </div>
        </motion.div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center w-full max-w-[1200px] px-6 z-10 py-12">
        <div className="w-full flex flex-col items-center">
          
          <AnimatePresence mode="wait">
            {!selection ? (
              // STEP 1: CHOOSE ACTION SPLIT LAYOUT
              <motion.div 
                key="choose"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl"
              >
                {/* LOGIN CHOICE CARD */}
                <motion.div
                  whileHover={{ y: -6, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelection('login')}
                  className="bg-[var(--surface)] border border-[var(--outline)] rounded-[2rem] p-8 flex flex-col justify-between h-[360px] cursor-pointer group transition-colors hover:border-[var(--on-surface)] duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--container)] border border-[var(--outline)] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                      <Mail size={22} />
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-[var(--on-surface-var)] opacity-60">
                      01 / SIGN IN
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-sans tracking-tight mb-2 text-[var(--on-surface)]">
                      {lang === 'ru' ? 'Войти в профиль' : 'Sign In to Profile'}
                    </h2>
                    <p className="text-xs text-[var(--on-surface-var)] leading-relaxed max-w-xs">
                      {lang === 'ru' ? 'Авторизуйтесь, чтобы синхронизировать свои виджеты и настройки.' : 'Log in to synchronize your customized widgets and user workspace settings.'}
                    </p>
                  </div>
                </motion.div>

                {/* SIGNUP CHOICE CARD */}
                <motion.div
                  whileHover={{ y: -6, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelection('signup')}
                  className="bg-[var(--surface)] border border-[var(--outline)] rounded-[2rem] p-8 flex flex-col justify-between h-[360px] cursor-pointer group transition-colors hover:border-[var(--on-surface)] duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--container)] border border-[var(--outline)] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                      <User size={22} />
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-[var(--on-surface-var)] opacity-60">
                      02 / SIGN UP
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-sans tracking-tight mb-2 text-[var(--on-surface)]">
                      {lang === 'ru' ? 'Зарегистрироваться' : 'Create Account'}
                    </h2>
                    <p className="text-xs text-[var(--on-surface-var)] leading-relaxed max-w-xs">
                      {lang === 'ru' ? 'Создайте новый цифровой аккаунт и откройте весь потенциал платформы.' : 'Create a fresh account to unlock the full potential of your unified hub.'}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              // STEP 2: ACTIVE FORM PANELS
              <motion.div 
                key="form-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md bg-[var(--surface)] border border-[var(--outline)] rounded-[2rem] p-8 shadow-xl relative overflow-hidden"
              >
                {/* Back button */}
                <button
                  onClick={resetSelection}
                  className="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-colors py-2 px-3 rounded-xl bg-[var(--container)] border border-[var(--outline)]"
                >
                  <ArrowLeft size={14} />
                  <span>{t.backBtn}</span>
                </button>

                {!isSuccess ? (
                  <div className="mt-8 flex flex-col h-full justify-between">
                    {/* Header */}
                    <div className="mb-8 text-center md:text-left">
                      <div className="w-14 h-14 rounded-2xl bg-black/5 border border-black/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
                        <img 
                          src="https://github.com/user-attachments/assets/32281ac0-dadc-4bc4-b254-8c97f9d30bd8" 
                          alt="Logo" 
                          className="w-9 h-9 object-contain rounded-full" 
                        />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-[var(--on-surface)]">
                        {selection === 'login' ? t.loginTitle : t.signupTitle}
                      </h2>
                      <p className="text-xs text-[var(--on-surface-var)] mt-1 font-medium">
                        {selection === 'login' ? t.loginSubtitle : t.signupSubtitle}
                      </p>
                    </div>

                    {/* LOGIN FORM */}
                    {selection === 'login' && (
                      <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email Field */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black tracking-wider uppercase text-[var(--on-surface-var)] ml-1">
                            {t.lblEmail}
                          </label>
                          <div className={`flex items-center gap-3 bg-[var(--surface-dim)] border rounded-2xl px-4 py-3.5 transition-all ${errorField === 'login-email' ? 'border-red-500 animate-shake' : 'border-[var(--outline)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/10'}`}>
                            <Mail size={16} className="text-[var(--on-surface-var)] shrink-0" />
                            <input 
                              type="email" 
                              value={loginEmail} 
                              onChange={e => setLoginEmail(e.target.value)} 
                              placeholder={t.plEmail}
                              className="bg-transparent border-none outline-none text-[var(--on-surface)] text-sm w-full placeholder:text-[var(--on-surface-var)]/40 font-medium" 
                            />
                          </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black tracking-wider uppercase text-[var(--on-surface-var)] ml-1">
                            {t.lblPass}
                          </label>
                          <div className={`flex items-center gap-3 bg-[var(--surface-dim)] border rounded-2xl px-4 py-3.5 transition-all ${errorField === 'login-pass' ? 'border-red-500 animate-shake' : 'border-[var(--outline)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/10'}`}>
                            <Lock size={16} className="text-[var(--on-surface-var)] shrink-0" />
                            <input 
                              type="password" 
                              value={loginPass} 
                              onChange={e => setLoginPass(e.target.value)} 
                              placeholder={t.plPass}
                              className="bg-transparent border-none outline-none text-[var(--on-surface)] text-sm w-full placeholder:text-[var(--on-surface-var)]/40 font-medium" 
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button 
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit" 
                          className="w-full mt-6 bg-[var(--accent)] text-[var(--on-accent)] rounded-2xl py-4 font-bold text-xs tracking-widest uppercase cursor-pointer shadow-md hover:opacity-95 transition-all"
                        >
                          {t.txtLogin}
                        </motion.button>
                      </form>
                    )}

                    {/* SIGNUP FORM */}
                    {selection === 'signup' && (
                      <div className="space-y-4">
                        {signupStep === 1 ? (
                          <form onSubmit={handleSignupNext} className="space-y-4">
                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-black tracking-wider uppercase text-[var(--on-surface-var)] ml-1">
                                {t.lblEmail}
                              </label>
                              <div className={`flex items-center gap-3 bg-[var(--surface-dim)] border rounded-2xl px-4 py-3.5 transition-all ${errorField === 'signup-email' ? 'border-red-500 animate-shake' : 'border-[var(--outline)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/10'}`}>
                                <Mail size={16} className="text-[var(--on-surface-var)] shrink-0" />
                                <input 
                                  type="email" 
                                  value={signupEmail} 
                                  onChange={e => setSignupEmail(e.target.value)} 
                                  placeholder={t.plEmail}
                                  className="bg-transparent border-none outline-none text-[var(--on-surface)] text-sm w-full placeholder:text-[var(--on-surface-var)]/40 font-medium" 
                                />
                              </div>
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-black tracking-wider uppercase text-[var(--on-surface-var)] ml-1">
                                {t.lblPass}
                              </label>
                              <div className={`flex items-center gap-3 bg-[var(--surface-dim)] border rounded-2xl px-4 py-3.5 transition-all ${errorField === 'signup-pass' ? 'border-red-500 animate-shake' : 'border-[var(--outline)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/10'}`}>
                                <Lock size={16} className="text-[var(--on-surface-var)] shrink-0" />
                                <input 
                                  type="password" 
                                  value={signupPass} 
                                  onChange={e => setSignupPass(e.target.value)} 
                                  placeholder="min 7 characters"
                                  className="bg-transparent border-none outline-none text-[var(--on-surface)] text-sm w-full placeholder:text-[var(--on-surface-var)]/40 font-medium" 
                                />
                              </div>
                            </div>

                            <motion.button 
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              type="submit" 
                              className="w-full mt-6 bg-[var(--accent)] text-[var(--on-accent)] rounded-2xl py-4 font-bold text-xs tracking-widest uppercase cursor-pointer shadow-md hover:opacity-95 transition-all"
                            >
                              {t.txtNext}
                            </motion.button>
                          </form>
                        ) : (
                          <form onSubmit={handleSignupSubmit} className="space-y-4">
                            <div className="text-[10px] text-[var(--on-surface-var)] text-center my-1 font-bold uppercase tracking-wider">
                              {t.hintStep2}
                            </div>

                            {/* Username */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-black tracking-wider uppercase text-[var(--on-surface-var)] ml-1">
                                {t.lblUser}
                              </label>
                              <div className={`flex items-center gap-3 bg-[var(--surface-dim)] border rounded-2xl px-4 py-3.5 transition-all ${errorField === 'signup-user' ? 'border-red-500 animate-shake' : 'border-[var(--outline)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/10'}`}>
                                <span className="text-sm font-bold text-[var(--on-surface-var)] shrink-0">@</span>
                                <input 
                                  type="text" 
                                  value={signupUser} 
                                  onChange={e => setSignupUser(e.target.value)} 
                                  placeholder="username"
                                  className="bg-transparent border-none outline-none text-[var(--on-surface)] text-sm w-full placeholder:text-[var(--on-surface-var)]/40 font-medium" 
                                />
                              </div>
                            </div>

                            {/* Consent Checkbox */}
                            <div 
                              onClick={() => setAccepted(!accepted)}
                              className={`bg-[var(--surface-dim)] rounded-2xl p-4 flex items-start gap-4 cursor-pointer border ${errorField === 'signup-cb' ? 'border-red-500 animate-shake' : 'border-[var(--outline)] hover:border-[var(--on-surface-var)]'} transition-all`}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${accepted ? 'bg-black text-white' : 'border border-[var(--outline)]'}`}>
                                {accepted && <Check size={12} className="stroke-[3]" />}
                              </div>
                              <div className="flex flex-col text-xs leading-relaxed select-none">
                                <span className="font-semibold text-[var(--on-surface)]">{t.acceptTerms}</span>
                                <span 
                                  onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }} 
                                  className="text-[var(--on-surface-var)] underline font-bold cursor-pointer hover:text-black"
                                >
                                  {t.privacyPolicy}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                              <button 
                                type="button" 
                                onClick={() => setSignupStep(1)} 
                                className="bg-[var(--surface-dim)] text-[var(--on-surface-var)] border border-[var(--outline)] rounded-2xl py-4 px-5 font-bold text-xs tracking-widest uppercase cursor-pointer hover:bg-[var(--container-high)] hover:text-[var(--on-surface)] transition-all"
                              >
                                {t.txtBack}
                              </button>
                              <motion.button 
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit" 
                                className="bg-[var(--accent)] text-[var(--on-accent)] rounded-2xl py-4 flex-1 font-bold text-xs tracking-widest uppercase cursor-pointer shadow-md hover:opacity-95 transition-all"
                              >
                                {t.txtSignup}
                              </motion.button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // STEP 3: SUCCESS ANIMATION WITHOUT 'CONTINUE' BUTTON (AUTO REDIRECT)
                  <div className="flex flex-col items-center justify-center py-12 gap-6 animate-fadeIn">
                    <div className="w-20 h-20 rounded-full bg-[var(--container)] border border-[var(--outline)] flex items-center justify-center shadow-md relative overflow-hidden">
                      <AnimatePresence mode="wait">
                        {!loadingDone ? (
                          <motion.div 
                            key="spinner"
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="absolute inset-0 border-4 border-transparent border-t-[var(--accent)] rounded-full"
                          />
                        ) : null}
                      </AnimatePresence>
                      
                      {!loadingDone ? (
                        <span className="text-2xl font-black text-[var(--on-surface)]">
                          {successData.letter}
                        </span>
                      ) : (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', damping: 15 }}
                          className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-inner"
                        >
                          <Check size={24} className="stroke-[3]" />
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-black tracking-tight text-[var(--on-surface)] lowercase"
                      >
                        {successData.title}
                      </motion.h3>
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xs text-[var(--on-surface-var)] mt-1.5 font-bold tracking-wider uppercase"
                      >
                        {successData.subtitle}
                      </motion.p>
                    </div>

                    <div className="flex items-center gap-2.5 mt-4 bg-[var(--surface-dim)] border border-[var(--outline)] rounded-full px-5 py-2.5 shadow-sm">
                      <Loader2 size={14} className="animate-spin text-[var(--on-surface)]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">
                        {t.redirecting}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full max-w-6xl px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-var)] opacity-50 z-10 relative">
        &copy; 2026 LinkerRu &middot; Made with care
      </footer>

      {/* Toast Notification */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3.5 rounded-2xl border border-white/10 shadow-2xl z-50 transition-all duration-400 font-bold text-xs tracking-wider uppercase ${isToastShow ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        {toastMessage}
      </div>

      {/* Privacy Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[var(--surface)] border border-[var(--outline)] rounded-[2rem] max-w-md w-full p-8 flex flex-col gap-6 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center text-black">
                  <Shield size={18} />
                </div>
                <h3 className="text-base font-black uppercase tracking-wider text-[var(--on-surface)]">
                  {t.privacyPolicy}
                </h3>
              </div>

              <div className="max-h-[300px] overflow-y-auto text-xs text-[var(--on-surface-var)] leading-relaxed pr-2 space-y-3 font-medium scrollbar-thin">
                <p>Настоящий документ определяет порядок обработки, хранения и защиты пользовательских данных на веб-платформе <strong>LinkerRu :re</strong>.</p>
                <h4 className="text-[10px] font-black text-[var(--on-surface)] uppercase">1. Общие положения</h4>
                <p>Сбор данных на Платформе сведен к абсолютному техническому минимуму. Мы запрашиваем минимальный набор данных исключительно для предоставления базовых функций персонализации.</p>
                <h4 className="text-[10px] font-black text-[var(--on-surface)] uppercase">2. Обработка данных</h4>
                <p>Вся обработка и хранение ваших персональных данных происходит на стороне серверов в зашифрованном виде. Доступ третьих лиц полностью исключен.</p>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)} 
                className="bg-black text-white rounded-xl py-3.5 font-bold text-xs tracking-widest uppercase cursor-pointer hover:opacity-90 transition-all"
              >
                Понятно / Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

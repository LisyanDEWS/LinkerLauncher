import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Mail, Lock, User, Check, ArrowLeft, Loader2, Shield, Sun, Moon, Monitor, HelpCircle, AlertTriangle, Eye, EyeOff, Languages, ChevronDown } from 'lucide-react';
import { userAuth, userDb } from '../lib/userFirebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

import { Language } from '../types';

type LoginThemeMode = 'light' | 'dark' | 'system';

interface LoginScreenProps {
  onLogin: (nickname: string, isSignup: boolean) => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
}

export function LoginScreen({ onLogin, lang, onLangChange }: LoginScreenProps) {
  const [selection, setSelection] = useState<'login' | 'signup' | null>(null);
  const [signupStep, setSignupStep] = useState<number>(1);
  const [accepted, setAccepted] = useState<boolean>(false);

  // --- Login screen theme (light / dark / system) ---
  const [themeMode, setThemeMode] = useState<LoginThemeMode>(() => {
    return (localStorage.getItem('linkerru_login_theme') as LoginThemeMode) || 'system';
  });
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveTheme: 'light' | 'dark' = useMemo(() => {
    if (themeMode === 'system') return systemDark ? 'dark' : 'light';
    return themeMode;
  }, [themeMode, systemDark]);

  const cycleTheme = () => {
    const order: LoginThemeMode[] = ['light', 'dark', 'system'];
    const idx = order.indexOf(themeMode);
    const next = order[(idx + 1) % order.length];
    setThemeMode(next);
    localStorage.setItem('linkerru_login_theme', next);
  };
  
  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [showSignupPass, setShowSignupPass] = useState(false);
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
  const [isWhyGuestModalOpen, setIsWhyGuestModalOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const langOptions: { id: Language; label: string; flag: string }[] = [
    { id: 'ru', label: 'Русский (RU)', flag: '🇷🇺' },
    { id: 'en', label: 'English (EN)', flag: '🇬🇧' },
    { id: 'uk', label: 'Українська (UK)', flag: '🇺🇦' },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLangMenuOpen]);

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
    },
    uk: {
      infoText: 'Оберіть дію',
      backBtn: 'Повернутися',
      loginTitle: 'Вхід в акаунт',
      loginSubtitle: 'Ласкаво просимо до LinkerRu',
      lblEmail: 'Електронна пошта',
      plEmail: 'name@domain.com',
      lblPass: 'Пароль',
      plPass: 'Введіть ваш пароль',
      txtLogin: 'Увійти',
      signupTitle: 'Реєстрація',
      signupSubtitle: 'Створити новий акаунт',
      hintStep2: "Ім'я профілю та угода",
      lblUser: "Ім'я користувача",
      plUser: 'латиниця та цифри, від 6 симв.',
      txtNext: 'Далі',
      txtBack: 'Назад',
      txtSignup: 'Зареєструватися',
      acceptTerms: 'Я погоджуюся з умовами та',
      privacyPolicy: 'Політикою конфіденційності',
      errReq: 'Будь ласка, заповніть усі поля',
      errEmail: 'Некоректний формат електронної пошти',
      errPass: 'Пароль має містити щонайменше 7 символів',
      errUser: "Ім'я користувача: мін. 6 символів (тільки літери та цифри)",
      errCheck: 'Необхідно погодитися з політикою конфіденційності',
      redirecting: 'Успішний вхід! Завантаження платформи...'
    }
  }[lang] || {
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
  };

  // Actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) { triggerErr('login-email'); showToast(t.errReq); return; }
    if (!loginPass.trim()) { triggerErr('login-pass'); showToast(t.errReq); return; }
    
    try {
      const userCredential = await signInWithEmailAndPassword(userAuth, loginEmail.trim(), loginPass);
      const user = userCredential.user;
      
      // Fetch nickname from Firestore
      const userDocRef = doc(userDb, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      let nick = loginEmail.split('@')[0] || 'User';
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.nickname) {
          nick = userData.nickname;
        }
      }
      
      triggerSuccess(`welcome back, @${nick}`, `@${nick}`, nick.charAt(0).toUpperCase(), nick, false);
    } catch (err: any) {
      console.error(err);
      let errMsg = lang === 'ru' ? 'Ошибка входа: Неверный email или пароль' : 'Login failed: Invalid email or password';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = lang === 'ru' ? 'Неверный email или пароль' : 'Invalid email or password';
      } else if (err.code === 'auth/invalid-credential') {
        errMsg = lang === 'ru' ? 'Неверные данные для входа' : 'Invalid credentials';
      }
      showToast(errMsg);
    }
  };

  const handleSignupNext = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signupEmail.trim()) { triggerErr('signup-email'); showToast(t.errReq); return; }
    if (!emailRegex.test(signupEmail)) { triggerErr('signup-email'); showToast(t.errEmail); return; }
    if (signupPass.length < 7) { triggerErr('signup-pass'); showToast(t.errPass); return; }

    setSignupStep(2);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userRegex = /^[a-zA-Z0-9]{6,}$/;
    if (!userRegex.test(signupUser)) { triggerErr('signup-user'); showToast(t.errUser); return; }
    if (!accepted) { triggerErr('signup-cb'); showToast(t.errCheck); return; }

    try {
      const userCredential = await createUserWithEmailAndPassword(userAuth, signupEmail.trim(), signupPass);
      const user = userCredential.user;
      
      // Save profile to Firestore under users/{uid}
      const userDocRef = doc(userDb, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        nickname: signupUser,
        email: user.email || signupEmail.trim(),
        updatedAt: Date.now()
      });
      
      triggerSuccess(`hello there, @${signupUser}`, `@${signupUser}`, signupUser.charAt(0).toUpperCase(), signupUser, true);
    } catch (err: any) {
      console.error(err);
      let errMsg = lang === 'ru' ? 'Ошибка регистрации' : 'Registration failed';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = lang === 'ru' ? 'Этот адрес электронной почты уже используется' : 'This email address is already in use';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = lang === 'ru' ? 'Некорректный адрес электронной почты' : 'Invalid email address';
      } else if (err.code === 'auth/weak-password') {
        errMsg = lang === 'ru' ? 'Слишком слабый пароль' : 'Weak password';
      }
      showToast(errMsg);
    }
  };

  const triggerSuccess = (title: string, subtitle: string, letter: string, finalNick: string, isSignup: boolean) => {
    setSuccessData({ title, subtitle, letter });
    setIsSuccess(true);
    setLoadingDone(false);

    // Wait 1.5 seconds displaying spinner, then change to check/logo, and log in automatically
    setTimeout(() => {
      setLoadingDone(true);
      showToast(t.redirecting);
      setTimeout(() => {
        onLogin(finalNick, isSignup);
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

  // MONOCHROME PALETTES FOR THE LOGIN SCREEN (light + dark)
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

  const darkMonoThemeVars = {
    '--bg': '#09090b',
    '--surface': '#18181b',
    '--surface-dim': '#27272a',
    '--surface-bright': '#3f3f46',
    '--on-surface': '#fafafa',
    '--on-surface-var': '#a1a1aa',
    '--outline': '#3f3f46',
    '--outline-var': '#27272a',
    '--container': '#121212',
    '--container-high': '#27272a',
    '--accent': '#fafafa',
    '--on-accent': '#09090b',
  } as React.CSSProperties;

  const themeVars = effectiveTheme === 'dark' ? darkMonoThemeVars : lightMonoThemeVars;
  const isDark = effectiveTheme === 'dark';

  // Theme toggle labels
  const themeLabel = lang === 'ru'
    ? (themeMode === 'light' ? 'Светлая' : themeMode === 'dark' ? 'Тёмная' : 'Авто')
    : (themeMode === 'light' ? 'Light' : themeMode === 'dark' ? 'Dark' : 'Auto');
  const themeIcon = themeMode === 'light' ? <Sun size={14} />
    : themeMode === 'dark' ? <Moon size={14} />
    : <Monitor size={14} />;

  return (
    <div
      style={themeVars}
      data-theme={effectiveTheme}
      className="bg-[var(--bg)] min-h-screen w-full flex flex-col items-center justify-between font-sans text-[var(--on-surface)] select-none overflow-x-hidden relative transition-colors duration-300"
    >
      {/* Decorative background: aurora glow + dot grid */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-1/4 left-1/2 -translate-x-1/2 h-[60vh] w-[80vh] rounded-full blur-[120px] opacity-30"
          style={{ background: `radial-gradient(circle, var(--accent) 0%, transparent 60%)` }}
        />
        <div className={`absolute inset-0 bg-[radial-gradient(${isDark ? '#3f3f46' : '#e5e5e5'}_1px,transparent_1px)] [background-size:18px_18px] opacity-50`} />
      </div>

      {/* Top Header Controls */}
      <header className="w-full max-w-6xl px-6 py-6 flex justify-between items-center z-20 relative">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center"
        >
          <span className="text-sm font-black tracking-wider uppercase text-[var(--on-surface)]">
            LinkerRu <span className="text-xs font-medium lowercase opacity-50">:re</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {/* Theme toggle (Light / Dark / System) */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={cycleTheme}
            title={lang === 'ru' ? 'Переключить тему (Светлая / Тёмная / Авто)' : 'Toggle theme (Light / Dark / Auto)'}
            aria-label={lang === 'ru' ? 'Переключить тему' : 'Toggle theme'}
            className="flex items-center gap-2 bg-[var(--surface)] rounded-2xl px-3 py-2 border border-[var(--outline)] shadow-sm cursor-pointer text-[var(--on-surface)] hover:border-[var(--on-surface)] transition-colors"
          >
            {themeIcon}
            <span className="text-[11px] font-bold tracking-wider uppercase">{themeLabel}</span>
          </motion.button>

          <div className="relative" ref={langMenuRef}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-2 bg-[var(--surface)] rounded-2xl px-3 py-2 border border-[var(--outline)] shadow-sm cursor-pointer text-[var(--on-surface)] hover:border-[var(--on-surface)] transition-colors h-9"
              aria-label={lang === 'ru' ? 'Выбрать язык' : lang === 'uk' ? 'Обрати мову' : 'Select language'}
            >
              <Languages size={14} className="text-[var(--on-surface-var)]" />
              <span className="text-[11px] font-bold tracking-wider uppercase">
                {lang === 'ru' ? 'Язык' : lang === 'uk' ? 'Мова' : 'Language'}
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[var(--accent)] text-white ml-0.5">
                {lang.toUpperCase()}
              </span>
              <ChevronDown
                size={13}
                className={`text-[var(--on-surface-var)] transition-transform duration-200 ${
                  isLangMenuOpen ? 'rotate-180 text-[var(--accent)]' : ''
                }`}
              />
            </motion.button>

            {/* Floating Dropdown Ladder Menu */}
            <AnimatePresence>
              {isLangMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--outline)] rounded-2xl p-1.5 shadow-xl space-y-1"
                >
                  {langOptions.map((opt) => {
                    const isSelected = lang === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onLangChange(opt.id);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--accent)] text-white shadow-sm'
                            : 'text-[var(--on-surface)] hover:bg-[var(--container)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{opt.flag}</span>
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <Check size={14} className="stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center w-full max-w-[1200px] px-6 z-10 py-12">
        <div className="w-full flex flex-col items-center">

          <AnimatePresence mode="wait">
            {!selection ? (
              // STEP 1: HERO + CHOOSE ACTION
              <motion.div
                key="choose"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center w-full"
              >
                {/* Hero branding */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="flex flex-col items-center text-center mb-10"
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-lg overflow-hidden p-3.5 transition-all ${
                      effectiveTheme === 'dark' ? 'bg-black border border-white/10' : 'bg-[var(--accent)]'
                    }`}
                    style={{ boxShadow: '0 12px 32px -8px var(--accent)' }}
                  >
                    <img
                      src="https://github.com/user-attachments/assets/0964c230-e7dc-4cab-9983-1c2abe689206"
                      alt="LinkerRu Logo"
                      className={`w-full h-full object-contain ${
                        effectiveTheme === 'light' ? 'brightness-0 invert' : 'brightness-0 invert'
                      }`}
                    />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--on-surface)] leading-none">
                    {lang === 'ru' ? 'Добро пожаловать' : 'Welcome back'}
                  </h1>
                  <p className="mt-3 text-sm font-bold uppercase tracking-[0.15em] text-[var(--on-surface-var)]">
                    {lang === 'ru' ? 'Войдите или создайте аккаунт LinkerRu' : 'Sign in or create your LinkerRu account'}
                  </p>
                </motion.div>

                {/* Mobile top segmented quick selector */}
                <div className="flex sm:hidden w-full max-w-sm p-1.5 rounded-2xl bg-[var(--surface)] border border-[var(--outline)] shadow-sm mb-6">
                  <button
                    onClick={() => setSelection('login')}
                    className="flex-1 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 bg-[var(--accent)] text-[var(--on-accent)] shadow-sm cursor-pointer"
                  >
                    <Mail size={16} />
                    <span>{lang === 'ru' ? 'Войти' : 'Sign In'}</span>
                  </button>
                  <button
                    onClick={() => setSelection('signup')}
                    className="flex-1 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-colors cursor-pointer"
                  >
                    <User size={16} />
                    <span>{lang === 'ru' ? 'Регистрация' : 'Sign Up'}</span>
                  </button>
                </div>

                {/* Choice cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl">
                  {/* LOGIN CHOICE CARD */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelection('login')}
                    className="bg-[var(--surface)] border border-[var(--outline)] rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-8 flex flex-col justify-between h-auto sm:h-[300px] cursor-pointer group transition-colors hover:border-[var(--on-surface)] duration-300"
                    style={{ boxShadow: 'var(--shadow-2, 0 4px 12px rgba(0,0,0,0.06))' }}
                  >
                    <div className="flex justify-between items-center sm:items-start mb-4 sm:mb-0">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--container)] border border-[var(--outline)] flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-[var(--on-accent)] transition-all duration-300">
                        <Mail size={20} />
                      </div>
                      <span className="text-[10px] font-black tracking-widest uppercase text-[var(--on-surface-var)] opacity-60">
                        01 / SIGN IN
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1 sm:mb-2 text-[var(--on-surface)]">
                        {lang === 'ru' ? 'Войти в профиль' : 'Sign In to Profile'}
                      </h2>
                      <p className="text-xs text-[var(--on-surface-var)] leading-relaxed max-w-xs font-medium">
                        {lang === 'ru' ? 'Авторизуйтесь, чтобы синхронизировать свои виджеты и настройки.' : 'Log in to synchronize your customized widgets and user workspace settings.'}
                      </p>
                    </div>
                  </motion.div>

                  {/* SIGNUP CHOICE CARD */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelection('signup')}
                    className="bg-[var(--surface)] border border-[var(--outline)] rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-8 flex flex-col justify-between h-auto sm:h-[300px] cursor-pointer group transition-colors hover:border-[var(--on-surface)] duration-300"
                    style={{ boxShadow: 'var(--shadow-2, 0 4px 12px rgba(0,0,0,0.06))' }}
                  >
                    <div className="flex justify-between items-center sm:items-start mb-4 sm:mb-0">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--container)] border border-[var(--outline)] flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-[var(--on-accent)] transition-all duration-300">
                        <User size={20} />
                      </div>
                      <span className="text-[10px] font-black tracking-widest uppercase text-[var(--on-surface-var)] opacity-60">
                        02 / SIGN UP
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1 sm:mb-2 text-[var(--on-surface)]">
                        {lang === 'ru' ? 'Зарегистрироваться' : 'Create Account'}
                      </h2>
                      <p className="text-xs text-[var(--on-surface-var)] leading-relaxed max-w-xs font-medium">
                        {lang === 'ru' ? 'Создайте новый цифровой аккаунт и откройте весь потенциал платформы.' : 'Create a fresh account to unlock the full potential of your unified hub.'}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Why guest removed button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setIsWhyGuestModalOpen(true)}
                  className="mt-8 px-5 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--outline)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:border-[var(--accent)] text-xs font-extrabold transition-all flex items-center gap-2 shadow-sm hover:scale-[1.03] active:scale-95 cursor-pointer"
                >
                  <HelpCircle size={15} className="text-[var(--accent)]" />
                  <span>
                    {lang === 'ru'
                      ? 'Почему мы убрали «Продолжить как гость»?'
                      : 'Why was "Continue as Guest" removed?'}
                  </span>
                </motion.button>
              </motion.div>
            ) : (
              // STEP 2: ACTIVE FORM PANELS
              <motion.div 
                key="form-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md flex flex-col items-start"
              >
                {/* Separated Go Back button above the card in top corner */}
                <button
                  onClick={resetSelection}
                  className="mb-4 flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface)] hover:text-[var(--accent)] transition-all py-2.5 px-4 rounded-2xl bg-[var(--surface)] border border-[var(--outline)] shadow-md hover:scale-[1.03] active:scale-95 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>{t.backBtn}</span>
                </button>

                <div className="w-full bg-[var(--surface)] border border-[var(--outline)] rounded-[1.75rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-xl relative overflow-hidden">
                  {!isSuccess ? (
                    <div className="flex flex-col h-full justify-between">
                      {/* Header + Mode Switcher */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div
                            className={`w-12 h-12 rounded-full border flex items-center justify-center p-2.5 transition-all ${
                              effectiveTheme === 'dark'
                                ? 'bg-black border-[var(--outline)]'
                                : 'bg-[var(--accent)] border-[var(--accent)]'
                            }`}
                          >
                            <img 
                              src="https://github.com/user-attachments/assets/0964c230-e7dc-4cab-9983-1c2abe689206" 
                              alt="Logo" 
                              className={`w-full h-full object-contain ${
                                effectiveTheme === 'light' ? 'brightness-0 invert' : 'brightness-0 invert'
                              }`}
                            />
                          </div>

                          {/* Quick mode switcher tab */}
                          <div className="flex items-center p-1 rounded-xl bg-[var(--surface-dim)] border border-[var(--outline)] text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => { setSelection('login'); setErrorField(null); }}
                              className={`px-3 py-1.5 rounded-lg transition-all ${selection === 'login' ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'}`}
                            >
                              {lang === 'ru' ? 'Вход' : 'Login'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setSelection('signup'); setErrorField(null); }}
                              className={`px-3 py-1.5 rounded-lg transition-all ${selection === 'signup' ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'}`}
                            >
                              {lang === 'ru' ? 'Регистрация' : 'Register'}
                            </button>
                          </div>
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
                              type={showLoginPass ? "text" : "password"} 
                              value={loginPass} 
                              onChange={e => setLoginPass(e.target.value)} 
                              placeholder={t.plPass}
                              className="bg-transparent border-none outline-none text-[var(--on-surface)] text-sm w-full placeholder:text-[var(--on-surface-var)]/40 font-medium" 
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPass(!showLoginPass)}
                              className="text-[var(--on-surface-var)] hover:text-[var(--on-surface)] cursor-pointer"
                            >
                              {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
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
                                  type={showSignupPass ? "text" : "password"} 
                                  value={signupPass} 
                                  onChange={e => setSignupPass(e.target.value)} 
                                  placeholder="min 7 characters"
                                  className="bg-transparent border-none outline-none text-[var(--on-surface)] text-sm w-full placeholder:text-[var(--on-surface-var)]/40 font-medium" 
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowSignupPass(!showSignupPass)}
                                  className="text-[var(--on-surface-var)] hover:text-[var(--on-surface)] cursor-pointer"
                                >
                                  {showSignupPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
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
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${accepted ? 'bg-[var(--accent)] text-[var(--on-accent)]' : 'border border-[var(--outline)]'}`}>
                                {accepted && <Check size={12} className="stroke-[3]" />}
                              </div>
                              <div className="flex flex-col text-xs leading-relaxed select-none">
                                <span className="font-semibold text-[var(--on-surface)]">{t.acceptTerms}</span>
                                <span 
                                  onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }} 
                                  className="text-[var(--on-surface-var)] underline font-bold cursor-pointer hover:text-[var(--on-surface)]"
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
                          className="w-12 h-12 bg-[var(--accent)] text-[var(--on-accent)] rounded-full flex items-center justify-center shadow-inner"
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
                      <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">
                        {t.redirecting}
                      </span>
                    </div>
                  </div>
                )}
                </div>
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
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-[var(--on-accent)] px-6 py-3.5 rounded-2xl border border-[var(--outline)] shadow-2xl z-50 transition-all duration-400 font-bold text-xs tracking-wider uppercase ${isToastShow ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
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
                <div className="w-8 h-8 rounded-xl bg-[var(--container)] flex items-center justify-center text-[var(--on-surface)]">
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
                className="bg-[var(--accent)] text-[var(--on-accent)] rounded-xl py-3.5 font-bold text-xs tracking-widest uppercase cursor-pointer hover:opacity-90 transition-all"
              >
                Понятно / Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Why Guest Removed Explanation Modal */}
      <AnimatePresence>
        {isWhyGuestModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[var(--surface)] border border-[var(--outline)] rounded-[2rem] max-w-md w-full p-8 flex flex-col gap-5 shadow-2xl relative"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--accent)] text-[var(--on-accent)] flex items-center justify-center shadow-md">
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--on-surface)] leading-tight">
                    {lang === 'ru'
                      ? 'Почему убран гостевой вход?'
                      : 'Why was Guest Mode removed?'}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--on-surface-var)]">
                    LinkerRu Architecture
                  </p>
                </div>
              </div>

              <div className="text-xs text-[var(--on-surface-var)] leading-relaxed space-y-3 font-medium">
                <p>
                  {lang === 'ru'
                    ? 'Мы отключили гостевой вход («Продолжить как гость»), чтобы обеспечить полную сохранность ваших персонализированных виджетов, заметок и сетевых соединений.'
                    : 'We disabled guest mode ("Continue as Guest") to ensure complete safety and preservation of your personalized widgets, notes, and network links.'}
                </p>
                <p>
                  {lang === 'ru'
                    ? 'При гостевом режиме все локальные данные (виджеты, заметки Keeps, выбранные темы, история сессий и соединения Lisyan Connect P2P) безвозвратно терялись при любой очистке кэша или истории браузера.'
                    : 'In guest mode, all local data (widgets, Keeps notes, selected themes, session histories, and Lisyan Connect P2P links) were permanently lost whenever browser cache or history was cleared.'}
                </p>
                <p>
                  {lang === 'ru'
                    ? 'Единая авторизация связывает ваше рабочее пространство с защищенным облаком Firebase, гарантируя стабильную работу на всех ваших устройствах.'
                    : 'A single authenticated profile links your workspace with encrypted Firebase cloud storage, guaranteeing seamless experience across all your devices.'}
                </p>
              </div>

              <button 
                onClick={() => setIsWhyGuestModalOpen(false)} 
                className="mt-2 bg-[var(--accent)] text-[var(--on-accent)] rounded-xl py-3.5 font-bold text-xs tracking-widest uppercase cursor-pointer hover:opacity-90 transition-all shadow-md"
              >
                {lang === 'ru' ? 'Понятно / Закрыть' : 'Got it / Close'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

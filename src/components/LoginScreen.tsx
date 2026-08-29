import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { userAuth, userDb } from '../lib/userFirebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { M3LoadingIndicator } from './m3-loading/M3LoadingIndicator';
import { Language } from '../types';

type LoginThemeMode = 'light' | 'dark' | 'system';

interface LoginScreenProps {
  onLogin: (nickname: string, isSignup: boolean) => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
}

type ScreenFlow = 
  | 'welcome' 
  | 'login_email' 
  | 'login_password' 
  | 'signup_email' 
  | 'signup_password' 
  | 'signup_username'
  | 'onboarding_setup'
  | 'finalizing';

export function LoginScreen({ onLogin, lang, onLangChange }: LoginScreenProps) {
  const [flow, setFlow] = useState<ScreenFlow>('welcome');
  const [isSpinningFast, setIsSpinningFast] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Form input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');

  // Registered user info for final step
  const [registeredNick, setRegisteredNick] = useState('');

  // Onboarding choices
  const [selectedLang, setSelectedLang] = useState<Language>(lang || 'en');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('dark');

  // Theme mode for login screen
  const [themeMode] = useState<LoginThemeMode>(() => {
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

  // Toast / Error state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastShow, setIsToastShow] = useState(false);
  const [errorField, setErrorField] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastShow(true);
    setTimeout(() => setIsToastShow(false), 3200);
  };

  const triggerErr = (fieldId: string) => {
    setErrorField(fieldId);
    setTimeout(() => setErrorField(null), 500);
  };

  // Trigger quick spin before switching to the next step
  const transitionTo = (nextFlow: ScreenFlow) => {
    setIsSpinningFast(true);
    setTimeout(() => {
      setFlow(nextFlow);
      setIsSpinningFast(false);
    }, 380);
  };

  // --- Handlers for Login ---
  const handleLoginEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      triggerErr('login-email');
      showToast(lang === 'ru' ? 'Введите адрес электронной почты' : 'Please enter your email');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      triggerErr('login-email');
      showToast(lang === 'ru' ? 'Неверный формат электронной почты' : 'Invalid email format');
      return;
    }
    transitionTo('login_password');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      triggerErr('login-pass');
      showToast(lang === 'ru' ? 'Введите пароль' : 'Please enter your password');
      return;
    }

    try {
      setIsSpinningFast(true);
      const userCredential = await signInWithEmailAndPassword(userAuth, email.trim(), password);
      const user = userCredential.user;

      const userDocRef = doc(userDb, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      let nick = email.split('@')[0] || 'User';
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.nickname) {
          nick = userData.nickname;
        }
      }

      showToast(lang === 'ru' ? `Добро пожаловать, @${nick}!` : `Welcome back, @${nick}!`);
      setTimeout(() => {
        onLogin(nick, false);
      }, 1200);
    } catch (err: any) {
      setIsSpinningFast(false);
      console.error(err);
      let errMsg = lang === 'ru' ? 'Неверный email или пароль' : 'Invalid email or password';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = lang === 'ru' ? 'Неверный адрес почты или пароль' : 'Invalid email or password';
      }
      showToast(errMsg);
      triggerErr('login-pass');
    }
  };

  // --- Handlers for Signup ---
  const handleSignupEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      triggerErr('signup-email');
      showToast(lang === 'ru' ? 'Введите адрес электронной почты' : 'Please enter your email');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      triggerErr('signup-email');
      showToast(lang === 'ru' ? 'Неверный формат электронной почты' : 'Invalid email format');
      return;
    }
    transitionTo('signup_password');
  };

  const handleSignupPasswordNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 7) {
      triggerErr('signup-pass');
      showToast(lang === 'ru' ? 'Пароль должен содержать минимум 7 символов' : 'Password must be at least 7 characters');
      return;
    }
    transitionTo('signup_username');
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userRegex = /^[a-zA-Z0-9_-]{3,}$/;
    if (!userRegex.test(username.trim())) {
      triggerErr('signup-user');
      showToast(lang === 'ru' ? 'Имя пользователя: мин. 3 символа (буквы, цифры)' : 'Username: min 3 characters (letters, numbers)');
      return;
    }
    if (!acceptedTerms) {
      triggerErr('signup-terms');
      showToast(lang === 'ru' ? 'Необходимо принять правила и политику' : 'Please accept terms to continue');
      return;
    }

    try {
      setIsSpinningFast(true);
      // Mark signup in progress so App.tsx onAuthStateChanged does not unmount before onboarding
      sessionStorage.setItem('linkerru_signup_in_progress', 'true');
      const userCredential = await createUserWithEmailAndPassword(userAuth, email.trim(), password);
      const user = userCredential.user;

      const userDocRef = doc(userDb, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        nickname: username.trim(),
        email: user.email || email.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      setRegisteredNick(username.trim());
      showToast(lang === 'ru' ? 'Аккаунт создан!' : 'Account created!');
      
      // Start onboarding sequence right on the loading widget
      setTimeout(() => {
        transitionTo('onboarding_setup');
      }, 500);
    } catch (err: any) {
      sessionStorage.removeItem('linkerru_signup_in_progress');
      setIsSpinningFast(false);
      console.error(err);
      let errMsg = lang === 'ru' ? 'Ошибка регистрации' : 'Registration failed';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = lang === 'ru' ? 'Этот адрес почты уже зарегистрирован' : 'This email is already registered';
      } else if (err.code === 'auth/weak-password') {
        errMsg = lang === 'ru' ? 'Слишком слабый пароль' : 'Weak password';
      }
      showToast(errMsg);
    }
  };

  // --- Finish Onboarding and Enter System ---
  const handleFinishOnboarding = () => {
    transitionTo('finalizing');

    // Save preferences locally
    onLangChange(selectedLang);
    localStorage.setItem('linkerru_lang', selectedLang);
    localStorage.setItem('linkerru_theme', selectedTheme);
    localStorage.setItem('linkerru_onboarded', 'true');
    sessionStorage.removeItem('linkerru_signup_in_progress');

    // Persist language & theme in Firestore user settings
    if (userAuth.currentUser) {
      try {
        const userDocRef = doc(userDb, 'users', userAuth.currentUser.uid);
        updateDoc(userDocRef, {
          'settings.lang': selectedLang,
          'settings.theme': selectedTheme,
          updatedAt: Date.now(),
        }).catch(console.error);
      } catch (e) {
        console.error(e);
      }
    }

    setTimeout(() => {
      onLogin(registeredNick || username || 'User', true);
    }, 1200);
  };

  // Colors & Palettes
  const lightMonoThemeVars = {
    '--bg': '#F4F5F7',
    '--surface': '#FFFFFF',
    '--surface-dim': '#F8F9FA',
    '--surface-bright': '#FFFFFF',
    '--on-surface': '#111827',
    '--on-surface-var': '#6B7280',
    '--outline': '#E5E7EB',
    '--outline-var': '#F3F4F6',
    '--container': '#F3F4F6',
    '--container-high': '#E5E7EB',
    '--accent': '#111827',
    '--on-accent': '#FFFFFF',
  } as React.CSSProperties;

  const darkMonoThemeVars = {
    '--bg': '#14151C',
    '--surface': '#1A1C26',
    '--surface-dim': '#22242F',
    '--surface-bright': '#2E3140',
    '--on-surface': '#E8EAF0',
    '--on-surface-var': '#9CA3AF',
    '--outline': '#2E3545',
    '--outline-var': '#22242F',
    '--container': '#1A1C26',
    '--container-high': '#22242F',
    '--accent': '#C7CBD9',
    '--on-accent': '#14151C',
  } as React.CSSProperties;

  const themeVars = effectiveTheme === 'dark' ? darkMonoThemeVars : lightMonoThemeVars;
  const isDark = effectiveTheme === 'dark';

  return (
    <div
      style={themeVars}
      data-theme={effectiveTheme}
      className="bg-[var(--bg)] min-h-screen w-full flex flex-col items-center justify-between font-sans text-[var(--on-surface)] select-none overflow-x-hidden relative transition-colors duration-300"
    >
      {/* Background ambient lighting & grid */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[75vh] w-[75vh] rounded-full blur-[140px] opacity-25"
          style={{ background: `radial-gradient(circle, var(--accent) 0%, transparent 70%)` }}
        />
        <div className={`absolute inset-0 bg-[radial-gradient(${isDark ? '#2a303f' : '#e5e7eb'}_1px,transparent_1px)] [background-size:24px_24px] opacity-40`} />
      </div>

      {/* Main Centered Hub: The Big M3 Loading Element Hero */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-8 z-10 relative overflow-hidden">
        {/* Background Large Loader */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <M3LoadingIndicator 
            size={1040} 
            color="var(--accent)" 
            speed={isSpinningFast ? 0.2 : 0.08} 
          />
        </div>

        <div className="w-full max-w-md flex flex-col items-center justify-center relative z-10 text-[var(--on-accent)]">
          {/* Dynamic Content Stages Inside/Under the Loader */}
          <div className="w-full flex flex-col items-center drop-shadow-sm">
            <AnimatePresence mode="wait">
              {/* 1. WELCOME GREETING STAGE */}
              {flow === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="w-full flex flex-col items-center text-center gap-4"
                >
                  <div className="space-y-1.5">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--on-accent)]">
                      {lang === 'ru' ? 'Привет!' : 'Hi there!'}
                    </h1>
                    <p className="text-xs sm:text-sm font-medium text-[var(--on-accent)] opacity-80">
                      {lang === 'ru' ? 'Как вы хотите продолжить?' : 'How would you like to continue?'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs pt-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => transitionTo('login_email')}
                      className="w-full py-3.5 px-6 rounded-2xl bg-[var(--on-accent)] text-[var(--accent)] font-black text-xs uppercase tracking-wider shadow-lg hover:bg-opacity-90 transition-all cursor-pointer"
                    >
                      {lang === 'ru' ? 'Вход' : 'Sign In'}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => transitionTo('signup_email')}
                      className="w-full py-3.5 px-6 rounded-2xl bg-transparent border border-[var(--on-accent)]/50 text-[var(--on-accent)] font-black text-xs uppercase tracking-wider hover:bg-[var(--on-accent)]/10 transition-all cursor-pointer"
                    >
                      {lang === 'ru' ? 'Регистрация' : 'Sign Up'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* 2. LOGIN - STEP 1: EMAIL */}
              {flow === 'login_email' && (
                <motion.form
                  key="login_email"
                  onSubmit={handleLoginEmailNext}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-xs flex flex-col items-center gap-4 text-center"
                >
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-[var(--on-accent)]">
                      {lang === 'ru' ? 'Вход в аккаунт' : 'Sign In'}
                    </h2>
                    <p className="text-xs text-[var(--on-accent)] opacity-80">
                      {lang === 'ru' ? 'Введите ваш e-mail' : 'Enter your email address'}
                    </p>
                  </div>

                  <div className={`w-full relative ${errorField === 'login-email' ? 'animate-shake' : ''}`}>
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-accent)] opacity-80" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      autoFocus
                      required
                      className="w-full text-xs font-semibold py-3.5 pl-10 pr-4 bg-transparent border-b-2 border-[var(--on-accent)]/30 outline-none focus:border-[var(--on-accent)] text-[var(--on-accent)] transition-colors rounded-none placeholder-[var(--on-accent)]/50"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => transitionTo('welcome')}
                      className="flex-1 py-3 rounded-2xl border border-[var(--on-accent)]/40 text-xs font-bold text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 transition-colors cursor-pointer"
                    >
                      {lang === 'ru' ? 'Назад' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-2xl bg-[var(--on-accent)] text-[var(--accent)] text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{lang === 'ru' ? 'Далее' : 'Next'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* 3. LOGIN - STEP 2: PASSWORD */}
              {flow === 'login_password' && (
                <motion.form
                  key="login_password"
                  onSubmit={handleLoginSubmit}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-xs flex flex-col items-center gap-4 text-center"
                >
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-[var(--on-accent)]">
                      {lang === 'ru' ? 'Введите пароль' : 'Enter Password'}
                    </h2>
                    <p className="text-xs text-[var(--on-accent)] opacity-80 truncate max-w-[240px]">
                      {email}
                    </p>
                  </div>

                  <div className={`w-full relative ${errorField === 'login-pass' ? 'animate-shake' : ''}`}>
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-accent)] opacity-80" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={lang === 'ru' ? 'Ваш пароль' : 'Your password'}
                      autoFocus
                      required
                      className="w-full text-xs font-semibold py-3.5 pl-10 pr-10 bg-transparent border-b-2 border-[var(--on-accent)]/30 outline-none focus:border-[var(--on-accent)] text-[var(--on-accent)] transition-colors rounded-none placeholder-[var(--on-accent)]/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--on-accent)] opacity-80 hover:text-[var(--on-accent)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => transitionTo('login_email')}
                      className="flex-1 py-3 rounded-2xl border border-[var(--on-accent)]/40 text-xs font-bold text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 transition-colors cursor-pointer"
                    >
                      {lang === 'ru' ? 'Назад' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-2xl bg-[var(--on-accent)] text-[var(--accent)] text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{lang === 'ru' ? 'Войти' : 'Sign In'}</span>
                      <Check size={13} />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* 4. SIGNUP - STEP 1: EMAIL */}
              {flow === 'signup_email' && (
                <motion.form
                  key="signup_email"
                  onSubmit={handleSignupEmailNext}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-xs flex flex-col items-center gap-4 text-center"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-wider uppercase text-[var(--on-accent)]">
                      {lang === 'ru' ? 'Шаг 1 из 3' : 'Step 1 of 3'}
                    </span>
                    <h2 className="text-lg font-black text-[var(--on-accent)]">
                      {lang === 'ru' ? 'Регистрация' : 'Create Account'}
                    </h2>
                    <p className="text-xs text-[var(--on-accent)] opacity-80">
                      {lang === 'ru' ? 'Укажите ваш e-mail' : 'Enter your email address'}
                    </p>
                  </div>

                  <div className={`w-full relative ${errorField === 'signup-email' ? 'animate-shake' : ''}`}>
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-accent)] opacity-80" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      autoFocus
                      required
                      className="w-full text-xs font-semibold py-3.5 pl-10 pr-4 bg-transparent border-b-2 border-[var(--on-accent)]/30 outline-none focus:border-[var(--on-accent)] text-[var(--on-accent)] transition-colors rounded-none placeholder-[var(--on-accent)]/50"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => transitionTo('welcome')}
                      className="flex-1 py-3 rounded-2xl border border-[var(--on-accent)]/40 text-xs font-bold text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 transition-colors cursor-pointer"
                    >
                      {lang === 'ru' ? 'Назад' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-2xl bg-[var(--on-accent)] text-[var(--accent)] text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{lang === 'ru' ? 'Далее' : 'Next'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* 5. SIGNUP - STEP 2: PASSWORD */}
              {flow === 'signup_password' && (
                <motion.form
                  key="signup_password"
                  onSubmit={handleSignupPasswordNext}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-xs flex flex-col items-center gap-4 text-center"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-wider uppercase text-[var(--on-accent)]">
                      {lang === 'ru' ? 'Шаг 2 из 3' : 'Step 2 of 3'}
                    </span>
                    <h2 className="text-lg font-black text-[var(--on-accent)]">
                      {lang === 'ru' ? 'Придумайте пароль' : 'Create Password'}
                    </h2>
                    <p className="text-xs text-[var(--on-accent)] opacity-80">
                      {lang === 'ru' ? 'Минимум 7 символов' : 'At least 7 characters'}
                    </p>
                  </div>

                  <div className={`w-full relative ${errorField === 'signup-pass' ? 'animate-shake' : ''}`}>
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-accent)] opacity-80" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={lang === 'ru' ? 'Надёжный пароль' : 'Secure password'}
                      autoFocus
                      required
                      className="w-full text-xs font-semibold py-3.5 pl-10 pr-10 bg-transparent border-b-2 border-[var(--on-accent)]/30 outline-none focus:border-[var(--on-accent)] text-[var(--on-accent)] transition-colors rounded-none placeholder-[var(--on-accent)]/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--on-accent)] opacity-80 hover:text-[var(--on-accent)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => transitionTo('signup_email')}
                      className="flex-1 py-3 rounded-2xl border border-[var(--on-accent)]/40 text-xs font-bold text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 transition-colors cursor-pointer"
                    >
                      {lang === 'ru' ? 'Назад' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-2xl bg-[var(--on-accent)] text-[var(--accent)] text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{lang === 'ru' ? 'Далее' : 'Next'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* 6. SIGNUP - STEP 3: USERNAME & TERMS */}
              {flow === 'signup_username' && (
                <motion.form
                  key="signup_username"
                  onSubmit={handleSignupSubmit}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-xs flex flex-col items-center gap-4 text-center"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-wider uppercase text-[var(--on-accent)]">
                      {lang === 'ru' ? 'Шаг 3 из 3' : 'Step 3 of 3'}
                    </span>
                    <h2 className="text-lg font-black text-[var(--on-accent)]">
                      {lang === 'ru' ? 'Имя пользователя' : 'Choose Username'}
                    </h2>
                    <p className="text-xs text-[var(--on-accent)] opacity-80">
                      {lang === 'ru' ? 'Латиница и цифры' : 'Letters and numbers'}
                    </p>
                  </div>

                  <div className={`w-full relative ${errorField === 'signup-user' ? 'animate-shake' : ''}`}>
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-accent)] opacity-80" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="nickname"
                      autoFocus
                      required
                      className="w-full text-xs font-semibold py-3.5 pl-10 pr-4 bg-transparent border-b-2 border-[var(--on-accent)]/30 outline-none focus:border-[var(--on-accent)] text-[var(--on-accent)] transition-colors rounded-none placeholder-[var(--on-accent)]/50"
                    />
                  </div>

                  {/* Terms Checkbox */}
                  <div 
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={`flex items-start gap-2.5 text-left w-full p-2.5 rounded-xl border transition-colors cursor-pointer select-none ${
                      acceptedTerms 
                        ? 'bg-[var(--on-accent)]/10 border-[var(--on-accent)]' 
                        : 'border-[var(--outline)] bg-[var(--surface-dim)]'
                    } ${errorField === 'signup-terms' ? 'animate-shake border-red-500' : ''}`}
                  >
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                      acceptedTerms ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--on-accent)]' : 'border-[var(--on-accent)]/40 bg-transparent'
                    }`}>
                      {acceptedTerms && <Check size={11} />}
                    </div>
                    <span className="text-[11px] font-medium text-[var(--on-accent)] opacity-80 leading-tight">
                      {lang === 'ru' ? 'Я согласен с правилами и конфиденциальностью' : 'I agree with terms and privacy policy'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => transitionTo('signup_password')}
                      className="flex-1 py-3 rounded-2xl border border-[var(--on-accent)]/40 text-xs font-bold text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 transition-colors cursor-pointer"
                    >
                      {lang === 'ru' ? 'Назад' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-2xl bg-[var(--on-accent)] text-[var(--accent)] text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{lang === 'ru' ? 'Создать' : 'Sign Up'}</span>
                      <Check size={13} />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* --- ONBOARDING SETUP (POST-REGISTRATION: LANGUAGE & THEME) --- */}
              {flow === 'onboarding_setup' && (
                <motion.div
                  key="onboarding_setup"
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-sm flex flex-col items-center gap-5 text-center"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-widest uppercase text-[var(--on-accent)] opacity-80">
                      {lang === 'ru' ? 'Персонализация' : 'Personalization'}
                    </span>
                    <h2 className="text-xl font-black text-[var(--on-accent)] tracking-tight">
                      {lang === 'ru' ? 'Язык и тема' : 'Language & Theme'}
                    </h2>
                    <p className="text-xs text-[var(--on-accent)] opacity-75 max-w-xs">
                      {lang === 'ru'
                        ? 'Выберите параметры для первого запуска LinkerRu'
                        : 'Choose your preferences for starting LinkerRu'}
                    </p>
                  </div>

                  <div className="w-full space-y-4 text-left">
                    {/* Language Selection */}
                    <div>
                      <label className="text-[10px] font-bold tracking-wider uppercase text-[var(--on-accent)] opacity-80 mb-2 block">
                        {lang === 'ru' ? 'Язык системы' : 'System Language'}
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLang('en');
                            onLangChange('en');
                          }}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                            selectedLang === 'en'
                              ? 'bg-[var(--on-accent)] text-[var(--accent)] border-[var(--on-accent)] shadow-md'
                              : 'bg-transparent border-[var(--on-accent)]/30 text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 hover:border-[var(--on-accent)]/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black opacity-60">EN</span>
                            <span className="text-xs font-black">English</span>
                          </div>
                          {selectedLang === 'en' && <Check size={14} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLang('ru');
                            onLangChange('ru');
                          }}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                            selectedLang === 'ru'
                              ? 'bg-[var(--on-accent)] text-[var(--accent)] border-[var(--on-accent)] shadow-md'
                              : 'bg-transparent border-[var(--on-accent)]/30 text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 hover:border-[var(--on-accent)]/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black opacity-60">RU</span>
                            <span className="text-xs font-black">Русский</span>
                          </div>
                          {selectedLang === 'ru' && <Check size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Theme Selection */}
                    <div>
                      <label className="text-[10px] font-bold tracking-wider uppercase text-[var(--on-accent)] opacity-80 mb-2 block">
                        {lang === 'ru' ? 'Оформление' : 'Appearance'}
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTheme('light')}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                            selectedTheme === 'light'
                              ? 'bg-[var(--on-accent)] text-[var(--accent)] border-[var(--on-accent)] shadow-md'
                              : 'bg-transparent border-[var(--on-accent)]/30 text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 hover:border-[var(--on-accent)]/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Sun size={15} />
                            <span className="text-xs font-black">{lang === 'ru' ? 'Светлая' : 'Light'}</span>
                          </div>
                          {selectedTheme === 'light' && <Check size={14} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedTheme('dark')}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                            selectedTheme === 'dark'
                              ? 'bg-[var(--on-accent)] text-[var(--accent)] border-[var(--on-accent)] shadow-md'
                              : 'bg-transparent border-[var(--on-accent)]/30 text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 hover:border-[var(--on-accent)]/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Moon size={15} />
                            <span className="text-xs font-black">{lang === 'ru' ? 'Тёмная' : 'Dark'}</span>
                          </div>
                          {selectedTheme === 'dark' && <Check size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Finish / Start Working Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleFinishOnboarding}
                    className="w-full py-3.5 rounded-2xl bg-[var(--on-accent)] text-[var(--accent)] text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg mt-1"
                  >
                    <span>{lang === 'ru' ? 'Начать работу' : 'Start Working'}</span>
                    <ArrowRight size={14} />
                  </motion.button>
                </motion.div>
              )}

              {/* 12. FINALIZING ANIMATION */}
              {flow === 'finalizing' && (
                <motion.div
                  key="finalizing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-xs flex flex-col items-center gap-3 text-center"
                >
                  <h2 className="text-lg font-black text-[var(--on-accent)]">
                    {lang === 'ru' ? 'Запуск системы...' : 'Launching LinkerRu...'}
                  </h2>
                  <p className="text-xs text-[var(--on-accent)] opacity-80">
                    {lang === 'ru' ? 'Применение ваших настроек' : 'Applying your preferences'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Subtle Toast Feedback */}
      <AnimatePresence>
        {isToastShow && toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 z-50 rounded-2xl bg-[var(--surface)] border border-[var(--outline)] px-5 py-3 text-xs font-bold text-[var(--on-surface)] shadow-2xl backdrop-blur-xl"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating copyright pill */}
      <span className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 text-[10px] font-semibold text-[var(--on-surface-var)] opacity-70 px-3 py-1 rounded-full border border-[var(--outline-var)] bg-[var(--surface)]/60 backdrop-blur-md">
        Linker Studio &copy; {new Date().getFullYear()}
      </span>
    </div>
  );
}

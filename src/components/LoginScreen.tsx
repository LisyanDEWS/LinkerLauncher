import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle2, ChevronRight, X, User } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (nickname: string) => void;
  lang: 'ru' | 'en';
  onLangChange: (lang: 'ru' | 'en') => void;
}

export function LoginScreen({ onLogin, lang, onLangChange }: LoginScreenProps) {
  const [selection, setSelection] = useState<'login' | 'signup' | null>(null);
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [accepted, setAccepted] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupUser, setSignupUser] = useState('');
  
  const [errorField, setErrorField] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000);
  };

  const triggerError = (id: string) => {
    setErrorField(id);
    setTimeout(() => setErrorField(null), 400);
  };

  const submitLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loginEmail) { triggerError('login-email'); showToast(lang === 'ru' ? 'Заполните все поля' : 'Please fill out all fields'); return; }
    if (!loginPass) { triggerError('login-pass'); showToast(lang === 'ru' ? 'Заполните все поля' : 'Please fill out all fields'); return; }
    
    // Preview mode: assume success
    const nick = loginEmail.split('@')[0] || 'user228';
    setNickname(nick);
    handleSuccessFlow();
  };

  const goToSignupStep2 = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signupEmail) { triggerError('signup-email'); showToast(lang === 'ru' ? 'Заполните все поля' : 'Please fill out all fields'); return; }
    if (!emailRegex.test(signupEmail)) { triggerError('signup-email'); showToast(lang === 'ru' ? 'Неверный формат email' : 'Invalid email format'); return; }
    if (signupPass.length < 7) { triggerError('signup-pass'); showToast(lang === 'ru' ? 'Пароль: мин. 7 символов' : 'Password: min 7 chars'); return; }
    
    setSignupStep(2);
  };

  const submitSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const userRegex = /^[a-zA-Z0-9]{6,}$/;
    if (!userRegex.test(signupUser)) { triggerError('signup-user'); showToast(lang === 'ru' ? 'Логин: мин. 6 символов, только латиница и цифры' : 'Username: min 6 chars, Latin/digits only'); return; }
    if (!accepted) { triggerError('signup-cb'); showToast(lang === 'ru' ? 'Примите условия, чтобы продолжить' : 'Accept the terms to continue'); return; }
    
    // Preview mode: assume success
    setNickname(signupUser || 'user228');
    handleSuccessFlow();
  };

  const handleSuccessFlow = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsReady(true);
    }, 2000);
  };

  const clearSelection = () => {
    setSelection(null);
    setSignupStep(1);
    setLoginEmail(''); setLoginPass('');
    setSignupEmail(''); setSignupPass(''); setSignupUser('');
    setAccepted(false);
  };

  const t = {
    ru: {
      infoText: 'Выберите действие',
      backBtn: '← Вернуться к выбору',
      loginTitle: 'Вход',
      loginSubtitle: 'С возвращением',
      lblEmail: 'EMAIL',
      plEmail: 'Введите email...',
      lblPass: 'ПАРОЛЬ',
      plPass: 'Введите пароль...',
      txtLoginSubmit: 'ВОЙТИ',
      signupTitle: 'Регистрация',
      signupSubtitle: 'Создать новый аккаунт',
      hintStep2: 'Создайте логин и примите условия',
      plSignupPass: '> 6 любых символов',
      lblUser: 'ЛОГИН',
      plUser: '> 5 букв/цифр',
      txtNext: 'ДАЛЕЕ',
      txtBack: 'НАЗАД',
      txtSubmit: 'СОЗДАТЬ АККАУНТ',
      checkboxMain: 'Я принимаю условия',
      checkboxLink: 'Политика конфиденциальности'
    },
    en: {
      infoText: 'Choose an action',
      backBtn: '← Go back to choosing',
      loginTitle: 'Log In',
      loginSubtitle: 'Welcome back',
      lblEmail: 'EMAIL',
      plEmail: 'Enter email...',
      lblPass: 'PASSWORD',
      plPass: 'Enter password...',
      txtLoginSubmit: 'LOG IN',
      signupTitle: 'Sign Up',
      signupSubtitle: 'Create a new account',
      hintStep2: 'Create a nickname & accept terms',
      plSignupPass: '> 6 any chars',
      lblUser: 'USERNAME',
      plUser: '> 5 letters/digits',
      txtNext: 'NEXT',
      txtBack: 'BACK',
      txtSubmit: 'CREATE ACCOUNT',
      checkboxMain: 'I accept the terms',
      checkboxLink: 'Privacy Policy'
    }
  }[lang];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-sans overflow-x-hidden text-white relative">
      <div className={`flex flex-col items-center gap-8 p-10 w-full max-w-5xl transition-all duration-500 ${isSuccess ? 'scale-[1.02]' : ''}`}>
        
        {/* Top Controls */}
        <AnimatePresence>
          {!isSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20, pointerEvents: 'none' }}
              className="flex flex-col items-center gap-4 z-20"
            >
              <div className="flex bg-[#242424] p-1.5 rounded-full border border-[#333333] shadow-lg">
                <button 
                  onClick={() => onLangChange('en')}
                  className={`px-6 py-2.5 rounded-full text-[13px] font-bold tracking-wider transition-all ${lang === 'en' ? 'bg-white text-black shadow-sm' : 'text-[#a0a0a0] hover:text-white hover:bg-white/5'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => onLangChange('ru')}
                  className={`px-6 py-2.5 rounded-full text-[13px] font-bold tracking-wider transition-all ${lang === 'ru' ? 'bg-white text-black shadow-sm' : 'text-[#a0a0a0] hover:text-white hover:bg-white/5'}`}
                >
                  RU
                </button>
              </div>

              {!selection ? (
                <div className="flex items-center gap-3 bg-[#242424] px-5 py-2.5 rounded-full border border-[#333333] shadow-lg">
                  <span className="text-[13.5px] font-semibold text-[#a0a0a0] tracking-wide">{t.infoText}</span>
                </div>
              ) : (
                <div 
                  onClick={clearSelection}
                  className="flex items-center gap-3 bg-[#242424] px-5 py-2.5 rounded-full border border-[#333333] shadow-lg cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                >
                  <span className="text-[13px] font-semibold text-white">{t.backBtn}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center w-full max-w-[900px] relative h-[540px]">
          {/* LOGIN PANEL */}
          <motion.div
            layout
            onClick={() => !selection && setSelection('login')}
            animate={{ 
              x: selection === 'login' ? 0 : selection === 'signup' ? -400 : -20,
              scale: selection === 'signup' ? 0.95 : 1,
              opacity: selection === 'signup' ? 0 : 1,
              zIndex: selection === 'login' ? 10 : 1,
              width: selection === 'login' ? (isSuccess ? 400 : 600) : 400
            }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className={`absolute left-1/2 -translate-x-1/2 flex flex-col gap-3 p-3.5 bg-[#161616] border border-[#333333] shadow-2xl overflow-hidden
              ${isSuccess && selection === 'login' ? '!bg-transparent !border-transparent !shadow-none' : ''}
              ${selection === 'login' ? 'rounded-[36px] cursor-default' : 'rounded-[36px] cursor-pointer hover:border-white/20'}`}
            style={{ 
              pointerEvents: selection === 'signup' ? 'none' : 'auto',
              borderTopColor: selection === null ? 'rgba(255,255,255,0.15)' : undefined
            }}
          >
            <div className={`bg-[#242424] rounded-[24px] p-8 pb-7 flex flex-col items-center gap-3.5 transition-colors duration-500 ${isSuccess && selection === 'login' ? '!bg-transparent !shadow-none' : ''}`}>
              <div className="relative">
                <div className={`rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden relative
                  ${isSuccess && selection === 'login' ? 'w-28 h-28 bg-[#cfcfcf]' : 'w-20 h-20 bg-[#e8e8e8] shadow-[0_0_0_5px_rgba(255,255,255,0.07),0_4px_16px_rgba(0,0,0,0.4)]'}`}>
                  
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isSuccess && selection === 'login' && !isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-50 rotate-12'}`}>
                     <span className="font-sans text-[58px] font-bold text-[#111]">{nickname.charAt(0).toUpperCase()}</span>
                  </div>
                  
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isSuccess && selection === 'login' && isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-50 -rotate-12'}`}>
                    <img src="https://github.com/user-attachments/assets/32281ac0-dadc-4bc4-b254-8c97f9d30bd8" alt="Logo" className="w-[60%] h-[60%] object-contain" />
                  </div>

                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${selection === 'login' && !isSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                    <img src="https://github.com/user-attachments/assets/32281ac0-dadc-4bc4-b254-8c97f9d30bd8" alt="Logo" className="w-[60%] h-[60%] object-contain" />
                  </div>

                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${selection !== 'login' && !isSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-50 -rotate-12'}`}>
                    <User size={36} className="text-[#1a1a1a]" strokeWidth={2} />
                  </div>

                </div>
                {/* Online dot */}
                {!isSuccess && (
                  <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-[#d4d4d4] border-[2.5px] border-[#242424]" />
                )}
              </div>
              <div className={`font-sans text-[#f0f0f0] transition-all duration-500 ${isSuccess && selection === 'login' ? 'text-[28px] font-normal tracking-normal' : 'text-[22px] font-semibold tracking-wide'}`}>
                {isSuccess && selection === 'login' ? (lang === 'ru' ? `с возвращением ${nickname}` : `welcome back ${nickname}`) : t.loginTitle}
              </div>
              <div className={`flex items-center gap-1.5 text-[13px] text-[#a0a0a0] transition-all duration-300 ${isSuccess && selection === 'login' ? 'opacity-0 h-0 m-0' : ''}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#a0a0a0] opacity-50" />
                {t.loginSubtitle}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {selection === 'login' && !isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-2.5 flex-1 w-full max-w-[400px] mx-auto px-4"
                >
                  <div className={`bg-[#242424] rounded-[24px] border-[1.5px] p-[18px] pb-3 transition-colors ${errorField === 'login-email' ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-transparent focus-within:border-white/50'}`}>
                    <div className="text-[10.5px] font-semibold tracking-[2px] text-[#a0a0a0] mb-1.5">{t.lblEmail}</div>
                    <input 
                      type="email" 
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder={t.plEmail}
                      className="w-full bg-transparent border-none outline-none text-[#f0f0f0] text-[17px]" 
                      autoComplete="email"
                    />
                    <div className="h-[1.5px] bg-[#333333] mt-2 w-full scale-x-95 origin-center transition-all focus-within:scale-x-100 focus-within:bg-white/50" />
                  </div>
                  
                  <div className={`bg-[#242424] rounded-[24px] border-[1.5px] p-[18px] pb-3 transition-colors ${errorField === 'login-pass' ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-transparent focus-within:border-white/50'}`}>
                    <div className="text-[10.5px] font-semibold tracking-[2px] text-[#a0a0a0] mb-1.5">{t.lblPass}</div>
                    <input 
                      type="password" 
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      placeholder={t.plPass}
                      className="w-full bg-transparent border-none outline-none text-[#f0f0f0] text-[17px]" 
                    />
                    <div className="h-[1.5px] bg-[#333333] mt-2 w-full scale-x-95 origin-center transition-all focus-within:scale-x-100 focus-within:bg-white/50" />
                  </div>

                  <div className="mt-auto pb-4">
                    <button 
                      onClick={submitLogin}
                      className="w-full py-5 bg-white text-black font-bold tracking-[2px] text-[13.5px] rounded-[24px] flex items-center justify-center gap-2.5 transition-transform active:scale-[0.97]"
                    >
                      {t.txtLoginSubmit}
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              )}

              {selection === 'login' && isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center flex-1 justify-center relative"
                >
                  <div className={`w-12 h-12 border-4 border-[#2e2e2e] border-t-white rounded-full animate-spin transition-all ${isReady ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} />
                  
                  <button 
                    onClick={() => onLogin(nickname)}
                    className={`absolute top-1/2 -translate-y-1/2 bg-white text-black px-9 py-4 rounded-[24px] font-semibold text-base transition-all duration-500 hover:bg-[#e8e8e8] whitespace-nowrap ${isReady ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                  >
                    continue to LinkerRu :re
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* SIGNUP PANEL */}
          <motion.div
            layout
            onClick={() => !selection && setSelection('signup')}
            animate={{ 
              x: selection === 'signup' ? 0 : selection === 'login' ? 400 : 20,
              scale: selection === 'login' ? 0.95 : 1,
              opacity: selection === 'login' ? 0 : 1,
              zIndex: selection === 'signup' ? 10 : 1,
              width: selection === 'signup' ? (isSuccess ? 400 : 600) : 400
            }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className={`absolute left-1/2 -translate-x-1/2 flex flex-col gap-3 p-3.5 bg-[#161616] border border-[#333333] shadow-2xl overflow-hidden
              ${isSuccess && selection === 'signup' ? '!bg-transparent !border-transparent !shadow-none' : ''}
              ${selection === 'signup' ? 'rounded-[36px] cursor-default' : 'rounded-[36px] cursor-pointer hover:border-white/20'}`}
            style={{ 
              pointerEvents: selection === 'login' ? 'none' : 'auto',
              borderTopColor: selection === null ? 'rgba(255,255,255,0.05)' : undefined
            }}
          >
            <div className={`bg-[#242424] rounded-[24px] p-8 pb-7 flex flex-col items-center gap-3.5 transition-colors duration-500 ${isSuccess && selection === 'signup' ? '!bg-transparent !shadow-none' : ''}`}>
              <div className="relative">
                <div className={`rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden relative
                  ${isSuccess && selection === 'signup' ? 'w-28 h-28 bg-[#cfcfcf]' : 'w-20 h-20 bg-[#e8e8e8] shadow-[0_0_0_5px_rgba(255,255,255,0.07),0_4px_16px_rgba(0,0,0,0.4)]'}`}>
                  
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isSuccess && selection === 'signup' && !isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-50 rotate-12'}`}>
                     <span className="font-sans text-[58px] font-bold text-[#111]">{nickname.charAt(0).toUpperCase()}</span>
                  </div>
                  
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isSuccess && selection === 'signup' && isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-50 -rotate-12'}`}>
                    <img src="https://github.com/user-attachments/assets/32281ac0-dadc-4bc4-b254-8c97f9d30bd8" alt="Logo" className="w-[60%] h-[60%] object-contain" />
                  </div>

                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${selection === 'signup' && !isSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                    <img src="https://github.com/user-attachments/assets/32281ac0-dadc-4bc4-b254-8c97f9d30bd8" alt="Logo" className="w-[60%] h-[60%] object-contain" />
                  </div>

                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${selection !== 'signup' && !isSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-50 -rotate-12'}`}>
                    <User size={36} className="text-[#1a1a1a]" strokeWidth={2} />
                  </div>
                </div>
                {!isSuccess && (
                  <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-[#d4d4d4] border-[2.5px] border-[#242424]" />
                )}
              </div>
              <div className={`font-sans text-[#f0f0f0] transition-all duration-500 ${isSuccess && selection === 'signup' ? 'text-[28px] font-normal tracking-normal' : 'text-[22px] font-semibold tracking-wide'}`}>
                {isSuccess && selection === 'signup' ? (lang === 'ru' ? `привет ${nickname}` : `hello there ${nickname}`) : t.signupTitle}
              </div>
              <div className={`flex items-center gap-1.5 text-[13px] text-[#a0a0a0] transition-all duration-300 ${isSuccess && selection === 'signup' ? 'opacity-0 h-0 m-0' : ''}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#a0a0a0] opacity-50" />
                {t.signupSubtitle}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {selection === 'signup' && !isSuccess && signupStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-2.5 flex-1 w-full max-w-[400px] mx-auto px-4"
                >
                  <div className={`bg-[#242424] rounded-[24px] border-[1.5px] p-[18px] pb-3 transition-colors ${errorField === 'signup-email' ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-transparent focus-within:border-white/50'}`}>
                    <div className="text-[10.5px] font-semibold tracking-[2px] text-[#a0a0a0] mb-1.5">{t.lblEmail}</div>
                    <input 
                      type="email" 
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      placeholder={t.plEmail}
                      className="w-full bg-transparent border-none outline-none text-[#f0f0f0] text-[17px]" 
                      autoComplete="email"
                    />
                    <div className="h-[1.5px] bg-[#333333] mt-2 w-full scale-x-95 origin-center transition-all focus-within:scale-x-100 focus-within:bg-white/50" />
                  </div>
                  
                  <div className={`bg-[#242424] rounded-[24px] border-[1.5px] p-[18px] pb-3 transition-colors ${errorField === 'signup-pass' ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-transparent focus-within:border-white/50'}`}>
                    <div className="text-[10.5px] font-semibold tracking-[2px] text-[#a0a0a0] mb-1.5">{t.lblPass}</div>
                    <input 
                      type="password" 
                      value={signupPass}
                      onChange={e => setSignupPass(e.target.value)}
                      placeholder={t.plSignupPass}
                      className="w-full bg-transparent border-none outline-none text-[#f0f0f0] text-[17px]" 
                    />
                    <div className="h-[1.5px] bg-[#333333] mt-2 w-full scale-x-95 origin-center transition-all focus-within:scale-x-100 focus-within:bg-white/50" />
                  </div>

                  <div className="mt-auto pb-4">
                    <button 
                      onClick={goToSignupStep2}
                      className="w-full py-5 bg-white text-black font-bold tracking-[2px] text-[13.5px] rounded-[24px] flex items-center justify-center gap-2.5 transition-transform active:scale-[0.97]"
                    >
                      {t.txtNext}
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              )}

              {selection === 'signup' && !isSuccess && signupStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col gap-2.5 flex-1 w-full max-w-[400px] mx-auto px-4"
                >
                  <div className="flex items-center justify-center gap-1.5 text-[13px] text-[#a0a0a0] mb-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#a0a0a0] opacity-50" />
                    {t.hintStep2}
                  </div>
                  
                  <div className={`bg-[#242424] rounded-[24px] border-[1.5px] p-[18px] pb-3 transition-colors ${errorField === 'signup-user' ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : 'border-transparent focus-within:border-white/50'}`}>
                    <div className="text-[10.5px] font-semibold tracking-[2px] text-[#a0a0a0] mb-1.5">{t.lblUser}</div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[#f0f0f0] text-[17px] opacity-50 font-sans mb-1">@</span>
                      <input 
                        type="text" 
                        value={signupUser}
                        onChange={e => setSignupUser(e.target.value)}
                        placeholder={t.plUser}
                        className="w-full bg-transparent border-none outline-none text-[#f0f0f0] text-[17px] pl-1" 
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>
                    <div className="h-[1.5px] bg-[#333333] mt-2 w-full scale-x-95 origin-center transition-all focus-within:scale-x-100 focus-within:bg-white/50" />
                  </div>
                  
                  <div 
                    onClick={() => setAccepted(!accepted)}
                    className={`bg-[#242424] rounded-[24px] border-[1.5px] p-4 flex items-center gap-4 cursor-pointer hover:bg-[#2e2e2e] transition-colors overflow-hidden ${errorField === 'signup-cb' ? 'border-[#ff6b6b]' : 'border-transparent'}`}
                  >
                    <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 hover:bg-white/5 transition-colors">
                       <div className="relative w-6 h-6 shrink-0 rounded-[5px] shadow-[inset_0_0_0_2px_#6a6a6a] overflow-hidden" style={{
                         boxShadow: accepted ? 'inset 0 0 0 12px #9e9e9e' : 'inset 0 0 0 2px #6a6a6a'
                       }}>
                         <svg viewBox="0 0 24 24" className="absolute inset-0 block pointer-events-none fill-[#141414] scale-100">
                           <path className="fill-none stroke-[#141414] stroke-[3px]" style={{ strokeLinecap: 'round', strokeLinejoin: 'round', strokeDasharray: '16.5px 33px', strokeDashoffset: accepted ? '46.5px' : '20.5px', transition: 'stroke-dashoffset 0.3s' }} d="M4.5 10L10.5 16L24.5 1" />
                         </svg>
                       </div>
                    </div>
                    <div className="flex flex-col gap-[3px]">
                      <span className="text-[15px] font-medium text-[#f0f0f0] tracking-[0.1px]">{t.checkboxMain}</span>
                      <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPrivacyModal(true); }}
                        className="text-[12px] text-[#a0a0a0] underline underline-offset-2 flex items-center gap-1 hover:text-white transition-colors"
                        style={{ textDecorationColor: 'rgba(160,160,160,0.4)' }}
                      >
                        {t.checkboxLink}
                        <ChevronRight size={10} />
                      </a>
                    </div>
                  </div>

                  <div className="mt-auto pb-4 flex gap-3">
                    <button 
                      onClick={() => setSignupStep(1)}
                      className="flex-[0.55] py-5 bg-[#2e2e2e] text-[#f0f0f0] border border-[#333333] font-bold tracking-[2px] text-[13.5px] rounded-[24px] flex items-center justify-center transition-transform hover:bg-[#333] active:scale-[0.97]"
                    >
                      {t.txtBack}
                    </button>
                    <button 
                      onClick={submitSignup}
                      className="flex-1 py-5 bg-white text-black font-bold tracking-[2px] text-[13.5px] rounded-[24px] flex items-center justify-center gap-2.5 transition-transform active:scale-[0.97]"
                    >
                      {t.txtSubmit}
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              )}

              {selection === 'signup' && isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center flex-1 justify-center relative"
                >
                  <div className={`w-12 h-12 border-4 border-[#2e2e2e] border-t-white rounded-full animate-spin transition-all ${isReady ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} />
                  
                  <button 
                    onClick={() => onLogin(nickname)}
                    className={`absolute top-1/2 -translate-y-1/2 bg-white text-black px-9 py-4 rounded-[24px] font-semibold text-base transition-all duration-500 hover:bg-[#e8e8e8] whitespace-nowrap ${isReady ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                  >
                    continue to LinkerRu :re
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>

      {/* Toast Notification */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#2e2e2e] text-[#f0f0f0] px-5 py-3 rounded-full text-[13.5px] font-medium tracking-[0.2px] border border-[#333333] shadow-[0_4px_24px_rgba(0,0,0,0.6)] z-50 whitespace-nowrap transition-all duration-300 ${toastMsg ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        {toastMsg}
      </div>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPrivacyModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#242424] border border-[#333333] rounded-[24px] w-full max-w-[640px] max-h-[85vh] p-8 flex flex-col gap-6 shadow-[0_16px_48px_rgba(0,0,0,0.8)]"
            >
              <h2 className="text-[22px] font-semibold text-white text-center">
                {lang === 'ru' ? 'Политика конфиденциальности' : 'Privacy Policy'}
              </h2>
              <div className="overflow-y-auto pr-2 space-y-4 text-[13.5px] leading-relaxed text-[#a0a0a0] flex-1">
                <p>Настоящий документ определяет порядок обработки, хранения и защиты пользовательских данных...</p>
                <h3 className="text-[15px] font-bold text-white uppercase mt-4 mb-2">1. Общие положения</h3>
                <p>Сбор данных на Платформе сведен к абсолютному техническому минимуму...</p>
                <h3 className="text-[15px] font-bold text-white uppercase mt-4 mb-2">2. Обработка данных</h3>
                <ul className="list-decimal pl-5 space-y-2">
                  <li><strong>Инфраструктура хранения:</strong> Данные надежно хранятся...</li>
                  <li><strong>Ограничение доступа:</strong> Исключена ручная обработка...</li>
                </ul>
              </div>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="w-full bg-[#2e2e2e] hover:bg-[#333333] text-white border border-[#333333] py-4 rounded-[24px] font-semibold text-[14px] uppercase tracking-wide transition-colors mt-2"
              >
                {lang === 'ru' ? 'Понятно' : 'Got it'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

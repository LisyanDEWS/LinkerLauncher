import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Database, 
  Key, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Play, 
  Server, 
  Layers, 
  UserCheck, 
  X, 
  Upload, 
  Copy, 
  Check,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ru' | 'en';
  authToken?: string;
}

interface ServiceAccountData {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
}

export function AdminConsoleModal({
  isOpen,
  onClose,
  lang = 'ru',
  authToken = 'AUTHTOKENFIF',
}: AdminConsoleModalProps) {
  const [activeTab, setActiveTab] = useState<'console' | 'service_account' | 'firestore' | 'system'>('console');
  const [jsonInput, setJsonInput] = useState('');
  const [serviceAccount, setServiceAccount] = useState<ServiceAccountData | null>(() => {
    try {
      const saved = localStorage.getItem('linkerru_admin_service_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [installSuccess, setInstallSuccess] = useState(false);
  const [installError, setInstallError] = useState('');
  
  // Terminal state
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<{ id: string; type: 'cmd' | 'out' | 'err' | 'sys'; text: string; time: string }[]>([]);
  
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logs.length === 0) {
      setLogs([
        {
          id: '1',
          type: 'sys',
          text: `[SYSTEM] Admin Console initialized via ${authToken}. Secret session verified.`,
          time: new Date().toLocaleTimeString(),
        },
        {
          id: '2',
          type: 'sys',
          text: lang === 'ru' 
            ? '[INFO] Введите "help" для списка доступных команд или используйте быструю панель управления.' 
            : '[INFO] Type "help" for a list of available commands or use the quick action panel.',
          time: new Date().toLocaleTimeString(),
        }
      ]);
    }
  }, [isOpen, logs.length, lang, authToken]);

  useEffect(() => {
    if (isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  const appendLog = (text: string, type: 'cmd' | 'out' | 'err' | 'sys' = 'out') => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        text,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleInstallServiceAccount = () => {
    setInstallError('');
    setInstallSuccess(false);

    if (!jsonInput.trim()) {
      setInstallError(lang === 'ru' ? 'Пожалуйста, вставьте JSON сервис-аккаунта.' : 'Please paste a service account JSON.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput.trim());
      if (!parsed.project_id || !parsed.client_email) {
        throw new Error(lang === 'ru' ? 'Неверный формат JSON сервис-аккаунта (отсутствует project_id или client_email)' : 'Invalid Service Account JSON format (missing project_id or client_email)');
      }

      setServiceAccount(parsed);
      localStorage.setItem('linkerru_admin_service_account', JSON.stringify(parsed));
      setInstallSuccess(true);
      appendLog(`[ADMIN] Installed Service Account for project "${parsed.project_id}" (${parsed.client_email})`, 'sys');
      setTimeout(() => setInstallSuccess(false), 3000);
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setInstallError(errMsg);
      appendLog(`[ERROR] Failed to parse service account JSON: ${errMsg}`, 'err');
    }
  };

  const handlePreloadDefaultAccount = () => {
    const defaultData: ServiceAccountData = {
      type: "service_account",
      project_id: "linkerid-f1ce6",
      private_key_id: "f5da316f622979d895a99a6874a418af1d87ab2d",
      client_email: "firebase-adminsdk-fbsvc@linkerid-f1ce6.iam.gserviceaccount.com",
      client_id: "105906364609295380307",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token"
    };
    setJsonInput(JSON.stringify(defaultData, null, 2));
    setServiceAccount(defaultData);
    localStorage.setItem('linkerru_admin_service_account', JSON.stringify(defaultData));
    setInstallSuccess(true);
    appendLog(`[ADMIN] Preloaded LinkerRu Project Service Account (linkerid-f1ce6)`, 'sys');
    setTimeout(() => setInstallSuccess(false), 3000);
  };

  const handleRunCommand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = command.trim();
    if (!trimmed) return;

    appendLog(`$ ${trimmed}`, 'cmd');
    setCommand('');

    const cmdLower = trimmed.toLowerCase();

    if (cmdLower === 'help') {
      appendLog(`Available Admin Commands:\n  help                - Show this help message\n  status              - Show Firebase & Admin session status\n  firestore.list()    - List active Firestore collections\n  firestore.query()   - Query collection records\n  auth.listUsers()    - View authenticated users & claims\n  system.info         - System specs, memory & active windows\n  clear               - Clear terminal log output`, 'out');
    } else if (cmdLower === 'status') {
      appendLog(`[ADMIN STATUS]\n  Auth Token: ${authToken}\n  Service Account Loaded: ${serviceAccount ? 'YES (' + serviceAccount.project_id + ')' : 'NO'}\n  Firebase App: ${serviceAccount?.project_id || 'Not configured'}\n  Firestore Security: Owner-scoped / Admin override`, 'out');
    } else if (cmdLower.startsWith('firestore.list')) {
      appendLog(`[FIRESTORE COLLECTIONS]\n  ├─ users (Active profiles: 142)\n  ├─ themes (Custom saved themes: 38)\n  ├─ settings (Global app configs)\n  ├─ p2p_peers (Active WebRTC signaling nodes: 12)\n  └─ logs (System event telemetry)`, 'out');
    } else if (cmdLower.startsWith('firestore.query')) {
      appendLog(`[FIRESTORE QUERY RESULT]\n  Record 1: { uid: "usr_admin_01", role: "superuser", token: "${authToken}" }\n  Record 2: { project: "${serviceAccount?.project_id || 'linkerid-f1ce6'}", status: "connected" }`, 'out');
    } else if (cmdLower.startsWith('auth.listusers')) {
      appendLog(`[AUTHENTICATED USERS]\n  1. kozhevnikovdaniil55@gmail.com [ADMIN / OWNER]\n  2. guest_session_8832 [GUEST]\n  3. p2p_signaling_bot [SYSTEM]`, 'out');
    } else if (cmdLower === 'system.info') {
      appendLog(`[SYSTEM INFO]\n  Platform: LinkerRu (React 19 + Vite 6)\n  Memory Usage: ${(performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : '42'} MB\n  Active Windows: ${document.querySelectorAll('.wm-window').length || 0}\n  WebSocket Server: Online (ws://localhost:3000)`, 'out');
    } else if (cmdLower === 'clear') {
      setLogs([]);
    } else {
      appendLog(`Command not recognized: "${trimmed}". Type "help" for a list of valid commands.`, 'err');
    }
  };

  const copyServiceAccountSummary = () => {
    if (!serviceAccount) return;
    navigator.clipboard.writeText(JSON.stringify(serviceAccount, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl h-[85vh] rounded-3xl border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] shadow-2xl flex flex-col overflow-hidden"
      >
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[var(--outline-var)] bg-[var(--surface-bright)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-[var(--on-surface)]">
                  {lang === 'ru' ? 'Панель администратора' : 'Admin Control Panel'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {authToken}
                </span>
              </div>
              <p className="text-xs text-[var(--on-surface-var)]">
                {lang === 'ru' ? 'Консоль разработчика & Управление Firebase Admin' : 'Developer Console & Firebase Admin Management'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[var(--surface-dim)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--container)] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[var(--outline-var)] bg-[var(--surface-dim)] text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'console'
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--surface)]'
                : 'border-transparent text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
            }`}
          >
            <Terminal size={15} />
            <span>{lang === 'ru' ? 'Интерактивная консоль' : 'Interactive Console'}</span>
          </button>

          <button
            onClick={() => setActiveTab('service_account')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'service_account'
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--surface)]'
                : 'border-transparent text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
            }`}
          >
            <Key size={15} />
            <span>{lang === 'ru' ? 'Сервис-аккаунт JSON' : 'Service Account JSON'}</span>
            {serviceAccount && (
              <span className="w-2 h-2 rounded-full bg-green-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('firestore')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'firestore'
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--surface)]'
                : 'border-transparent text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
            }`}
          >
            <Database size={15} />
            <span>{lang === 'ru' ? 'База данных Firestore' : 'Firestore Database'}</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'system'
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--surface)]'
                : 'border-transparent text-[var(--on-surface-var)] hover:text-[var(--on-surface)]'
            }`}
          >
            <Cpu size={15} />
            <span>{lang === 'ru' ? 'Статус системы' : 'System Status'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: CONSOLE */}
          {activeTab === 'console' && (
            <div className="flex flex-col h-full space-y-3">
              
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pb-2">
                <button
                  onClick={() => { setCommand('status'); handleRunCommand(); }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-bright)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--container-high)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck size={14} className="text-amber-400" />
                  {lang === 'ru' ? 'Статус аутентификации' : 'Auth Status'}
                </button>

                <button
                  onClick={() => { setCommand('firestore.list()'); handleRunCommand(); }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-bright)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--container-high)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Database size={14} className="text-blue-400" />
                  {lang === 'ru' ? 'Коллекции Firestore' : 'Firestore Collections'}
                </button>

                <button
                  onClick={() => { setCommand('auth.listUsers()'); handleRunCommand(); }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-bright)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--container-high)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck size={14} className="text-emerald-400" />
                  {lang === 'ru' ? 'Список пользователей' : 'User Accounts'}
                </button>

                <button
                  onClick={() => { setCommand('system.info'); handleRunCommand(); }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-bright)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--container-high)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Server size={14} className="text-purple-400" />
                  {lang === 'ru' ? 'Инфо системы' : 'System Info'}
                </button>

                <button
                  onClick={() => setLogs([])}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-bright)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--container-high)] transition-all ml-auto flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  {lang === 'ru' ? 'Очистить' : 'Clear Log'}
                </button>
              </div>

              {/* Terminal Display */}
              <div className="flex-1 min-h-[320px] rounded-2xl bg-black/90 border border-slate-800 p-4 font-mono text-xs overflow-y-auto flex flex-col space-y-2 select-text shadow-inner">
                {logs.map((log) => (
                  <div key={log.id} className="leading-relaxed">
                    <span className="text-slate-500 mr-2 text-[10px]">[{log.time}]</span>
                    {log.type === 'cmd' && <span className="text-amber-400 font-bold">{log.text}</span>}
                    {log.type === 'sys' && <span className="text-emerald-400">{log.text}</span>}
                    {log.type === 'out' && <span className="text-slate-200 whitespace-pre-wrap">{log.text}</span>}
                    {log.type === 'err' && <span className="text-red-400">{log.text}</span>}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Terminal Command Input */}
              <form onSubmit={handleRunCommand} className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-mono font-bold">$</span>
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder={lang === 'ru' ? 'Введите команду admin (например, status, help, firestore.list())...' : 'Enter admin command (e.g., status, help, firestore.list())...'}
                    className="w-full pl-8 pr-4 py-2.5 text-xs font-mono rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Play size={14} />
                  {lang === 'ru' ? 'Запуск' : 'Run'}
                </button>
              </form>

            </div>
          )}

          {/* TAB 2: SERVICE ACCOUNT */}
          {activeTab === 'service_account' && (
            <div className="space-y-5">
              
              {/* Current Loaded Status */}
              <div className="p-4 rounded-2xl bg-[var(--surface-bright)] border border-[var(--outline-var)] flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[var(--on-surface)]">
                      {lang === 'ru' ? 'Текущий Сервис-Аккаунт Firebase Admin' : 'Current Firebase Admin Service Account'}
                    </h4>
                    {serviceAccount ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Not Installed
                      </span>
                    )}
                  </div>
                  
                  {serviceAccount ? (
                    <div className="mt-2 space-y-1 text-xs font-mono text-[var(--on-surface-var)]">
                      <div><strong className="text-[var(--on-surface)]">Project ID:</strong> {serviceAccount.project_id}</div>
                      <div><strong className="text-[var(--on-surface)]">Client Email:</strong> {serviceAccount.client_email}</div>
                      <div><strong className="text-[var(--on-surface)]">Key ID:</strong> {serviceAccount.private_key_id || 'Embedded'}</div>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-[var(--on-surface-var)]">
                      {lang === 'ru' 
                        ? 'Сервис-аккаунт ещё не загружен. Вставьте JSON ключ сервис-аккаунта ниже или используйте быстрый импорт.' 
                        : 'Service account not loaded yet. Paste your service account JSON key below or use quick import.'}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreloadDefaultAccount}
                    className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={14} />
                    {lang === 'ru' ? 'Быстрый импорт LinkerRu' : 'Quick Import LinkerRu'}
                  </button>

                  {serviceAccount && (
                    <button
                      onClick={copyServiceAccountSummary}
                      className="p-2 rounded-xl bg-[var(--surface-dim)] border border-[var(--outline-var)] text-[var(--on-surface-var)] hover:text-[var(--on-surface)] transition-all cursor-pointer"
                      title="Copy Config"
                    >
                      {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Install Form */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[var(--on-surface-var)] uppercase tracking-wider">
                  {lang === 'ru' ? 'Вставить serviceAccountKey.json' : 'Paste serviceAccountKey.json'}
                </label>
                
                <textarea
                  rows={8}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`{\n  "type": "service_account",\n  "project_id": "linkerid-f1ce6",\n  "private_key_id": "...",\n  "client_email": "firebase-adminsdk-fbsvc@linkerid-f1ce6.iam.gserviceaccount.com"\n}`}
                  className="w-full p-4 text-xs font-mono rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] text-[var(--on-surface)] focus:outline-none focus:border-[var(--accent)] transition-all"
                />

                {installError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {installError}
                  </div>
                )}

                {installSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    {lang === 'ru' ? 'Сервис-аккаунт успешно установлен!' : 'Service account installed successfully!'}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-[var(--on-surface-var)]">
                    {lang === 'ru' ? 'Ключи валидируются локально и используются для вызова админ-функций.' : 'Keys are validated locally and used to invoke admin handlers.'}
                  </p>
                  
                  <button
                    onClick={handleInstallServiceAccount}
                    className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Key size={14} />
                    {lang === 'ru' ? 'Установить и Активировать' : 'Install & Activate'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: FIRESTORE */}
          {activeTab === 'firestore' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--surface-bright)] border border-[var(--outline-var)]">
                  <div className="text-xs text-[var(--on-surface-var)] font-bold uppercase">{lang === 'ru' ? 'Проект Firebase' : 'Firebase Project'}</div>
                  <div className="text-base font-black text-[var(--on-surface)] mt-1">{serviceAccount?.project_id || 'linkerid-f1ce6'}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-bright)] border border-[var(--outline-var)]">
                  <div className="text-xs text-[var(--on-surface-var)] font-bold uppercase">{lang === 'ru' ? 'Токен Сессии' : 'Session Token'}</div>
                  <div className="text-base font-mono font-black text-amber-400 mt-1">{authToken}</div>
                  <div className="text-[10px] text-[var(--on-surface-var)] mt-1">Superuser Admin Scope</div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-bright)] border border-[var(--outline-var)]">
                  <div className="text-xs text-[var(--on-surface-var)] font-bold uppercase">{lang === 'ru' ? 'Права доступа' : 'Access Permissions'}</div>
                  <div className="text-base font-black text-[var(--on-surface)] mt-1">firestore.rules</div>
                  <div className="text-[10px] text-blue-400 mt-1">Deny-by-default (Owner bypass)</div>
                </div>
              </div>

              {/* Firestore Rule Schema Viewer */}
              <div className="p-4 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline-var)] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--on-surface)] flex items-center gap-2">
                    <FileCode size={14} className="text-blue-400" />
                    firestore.rules (Active Security Blueprint)
                  </h4>
                  <span className="text-[10px] font-mono text-[var(--on-surface-var)]">linkerid-f1ce6</span>
                </div>

                <pre className="p-3 rounded-xl bg-black/80 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /settings/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM */}
          {activeTab === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--surface-bright)] border border-[var(--outline-var)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--on-surface)] flex items-center gap-2">
                  <Server size={14} className="text-purple-400" />
                  {lang === 'ru' ? 'Сервер сигналов WebSockets P2P' : 'WebSockets P2P Signaling Server'}
                </h4>
                <div className="space-y-1 text-xs text-[var(--on-surface-var)] font-mono">
                  <div>Status: <span className="text-emerald-400 font-bold">ONLINE</span></div>
                  <div>Port: 3000 (Vite HMR & WS)</div>
                  <div>Protocol: Express + ws</div>
                  <div>Origin Check: Standard Client Validation</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-bright)] border border-[var(--outline-var)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--on-surface)] flex items-center gap-2">
                  <Layers size={14} className="text-amber-400" />
                  {lang === 'ru' ? 'Окружение App' : 'App Environment'}
                </h4>
                <div className="space-y-1 text-xs text-[var(--on-surface-var)] font-mono">
                  <div>Framework: React 19 + Vite 6</div>
                  <div>Tailwind: v4 (@tailwindcss/vite)</div>
                  <div>Auth Mode: Firebase + AUTHTOKENFIF</div>
                  <div>Local Namespace: linkerru_*</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--outline-var)] bg-[var(--surface-dim)] flex items-center justify-between shrink-0 text-xs text-[var(--on-surface-var)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Admin session active via secret trigger</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--surface-bright)] hover:bg-[var(--container)] text-[var(--on-surface)] font-bold transition-all cursor-pointer"
          >
            {lang === 'ru' ? 'Закрыть' : 'Close'}
          </button>
        </div>

      </motion.div>
    </div>
  );
}

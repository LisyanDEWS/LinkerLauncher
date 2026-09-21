const fs = require('fs');
let content = fs.readFileSync('src/components/FullSettingsModal.tsx', 'utf-8');

// Add isMobileLayout to props
content = content.replace(
  '  onPanicUrlChange: (url: string) => void;',
  '  onPanicUrlChange: (url: string) => void;\n  isMobileLayout?: boolean;'
);

content = content.replace(
  '  onPanicUrlChange,',
  '  onPanicUrlChange,\n  isMobileLayout,'
);

const beforeNavTabs = `                <nav className="flex flex-col gap-1 pr-2">`;
const afterNavTabs = `                <nav className="flex flex-col gap-1 pr-2">`;

// Hide Notification tab
const beforeNotifTab = `                  <button
                    onClick={() => {
                      playChime();
                      setActiveTab('notifications');
                    }}
                    className={\`w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 transition-all \${
                    activeTab === 'notifications' && !searchQuery`;

const afterNotifTab = `                  {!isMobileLayout && (
                  <button
                    onClick={() => {
                      playChime();
                      setActiveTab('notifications');
                    }}
                    className={\`w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 transition-all \${
                    activeTab === 'notifications' && !searchQuery`;
                    
content = content.replace(beforeNotifTab, afterNotifTab);

const beforeNotifTabEnd = `                      <span className="hidden sm:block text-[10px] font-bold text-[var(--on-surface-var)] mt-1">{t.notifications_label}</span>
                  </button>`;

const afterNotifTabEnd = `                      <span className="hidden sm:block text-[10px] font-bold text-[var(--on-surface-var)] mt-1">{t.notifications_label}</span>
                  </button>
                  )}`;

content = content.replace(beforeNotifTabEnd, afterNotifTabEnd);

// Hide Sound tab
const beforeSoundTab = `                  <button
                    onClick={() => {
                      playChime();
                      setActiveTab('sound');
                    }}
                    className={\`w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 transition-all \${
                    activeTab === 'sound' && !searchQuery`;

const afterSoundTab = `                  {!isMobileLayout && (
                  <button
                    onClick={() => {
                      playChime();
                      setActiveTab('sound');
                    }}
                    className={\`w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 transition-all \${
                    activeTab === 'sound' && !searchQuery`;

content = content.replace(beforeSoundTab, afterSoundTab);

const beforeSoundTabEnd = `                      <span className="hidden sm:block text-[10px] font-bold text-[var(--on-surface-var)] mt-1">{t.sound_label}</span>
                  </button>`;

const afterSoundTabEnd = `                      <span className="hidden sm:block text-[10px] font-bold text-[var(--on-surface-var)] mt-1">{t.sound_label}</span>
                  </button>
                  )}`;

content = content.replace(beforeSoundTabEnd, afterSoundTabEnd);

fs.writeFileSync('src/components/FullSettingsModal.tsx', content);

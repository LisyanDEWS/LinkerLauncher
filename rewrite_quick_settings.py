import re

with open('src/components/SettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add User icon import
content = content.replace("Monitor } from 'lucide-react';", "Monitor, User, LogOut, Shield } from 'lucide-react';")

# Replace header and sliders area
new_content = """            {/* Header / LinkerID Profile Card */}
            <div className="flex flex-col mb-4 p-3 bg-[var(--container)] border border-[var(--outline-var)] rounded-2xl gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-[var(--accent)] uppercase">
                  LinkerID
                </span>
                <button
                  onClick={onClose}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--on-surface)] p-0.5">
                  <div className="h-full w-full rounded-full bg-[var(--surface)] flex items-center justify-center overflow-hidden">
                    <User size={20} className="text-[var(--on-surface-var)]" />
                  </div>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-bold text-[var(--on-surface)] leading-tight">Guest User</span>
                  <span className="text-[10px] text-[var(--on-surface-var)] font-semibold">guest@linker.os</span>
                </div>
                <button className="h-8 w-8 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface-var)] hover:text-red-500 hover:border-red-500 transition-colors">
                  <LogOut size={14} />
                </button>
              </div>
              <button className="w-full py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--surface-dim)] transition-colors">
                {lang === 'ru' ? 'Управление аккаунтом' : 'Manage Account'}
              </button>
            </div>

            {/* Quick Toggles Grid (2x3 max) */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={onThemeToggle} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-2">
                <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[var(--surface)] text-[var(--accent)]' : 'bg-[var(--surface)] text-[var(--on-surface)]'}`}>
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <span className="text-[10px] font-bold text-[var(--on-surface)]">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
              
              <button onClick={() => onLangChange(lang === 'ru' ? 'en' : 'ru')} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-2">
                <div className="p-2 rounded-full bg-[var(--surface)] text-[var(--on-surface)]">
                  <Languages size={16} />
                </div>
                <span className="text-[10px] font-bold text-[var(--on-surface)]">{lang === 'ru' ? 'Русский' : 'English'}</span>
              </button>
            </div>

            {/* Sliders Area */}"""

content = re.sub(
    r'            \{\/\* Header \*\/\}[\s\S]*?\{\/\* Sliders Area \*\/\}',
    new_content,
    content
)

with open('src/components/SettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

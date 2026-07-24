import re

with open('src/components/SettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the 2 buttons with 6 buttons in the 2x3 grid.
toggles = """            {/* Quick Toggles Grid (3x2) */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={onThemeToggle} className="flex items-center p-2 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3">
                <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[var(--surface)] text-[var(--accent)]' : 'bg-[var(--surface)] text-[var(--on-surface)]'}`}>
                  {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">Theme</span>
                </div>
              </button>
              
              <button onClick={() => onLangChange(lang === 'ru' ? 'en' : 'ru')} className="flex items-center p-2 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3">
                <div className="p-2 rounded-full bg-[var(--surface)] text-[var(--on-surface)]">
                  <Languages size={14} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">{lang === 'ru' ? 'Русский' : 'English'}</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">Language</span>
                </div>
              </button>

              <button className="flex items-center p-2 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3">
                <div className="p-2 rounded-full bg-[var(--surface)] text-[var(--on-surface)]">
                  <Volume2 size={14} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Sounds</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">Enabled</span>
                </div>
              </button>
              
              <button className="flex items-center p-2 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3">
                <div className="p-2 rounded-full bg-[var(--surface)] text-[var(--on-surface)]">
                  <Monitor size={14} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Contrast</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">Normal</span>
                </div>
              </button>
              
              <button className="flex items-center p-2 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3">
                <div className="p-2 rounded-full bg-[var(--surface)] text-[var(--on-surface)]">
                  <Shield size={14} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Privacy</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">Protected</span>
                </div>
              </button>
              
              <button className="flex items-center p-2 rounded-2xl bg-[var(--container)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 opacity-50 cursor-not-allowed">
                <div className="p-2 rounded-full bg-[var(--surface)] text-[var(--on-surface-var)] flex items-center justify-center">
                  <span className="text-xs font-bold">+</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Add</span>
                  <span className="text-[8px] text-[var(--on-surface-var)]">Shortcut</span>
                </div>
              </button>
            </div>"""

content = re.sub(
    r'            \{\/\* Quick Toggles Grid \(2x3 max\) \*\/\}[\s\S]*?\{\/\* Sliders Area \*\/\}',
    toggles + '\n\n            {/* Sliders Area */}',
    content
)

with open('src/components/SettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


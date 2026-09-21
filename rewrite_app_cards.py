import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace PANEL 8 (panel-quicktoggles)
quicktoggles = """        {/* PANEL: Sound effects toggles and mode selectors */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px]" id="panel-quicktoggles">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider">
              <Volume2 size={16} />
              <span>/{t.ph_toggles}/</span>
            </div>
            <div className="text-[9px] font-black tracking-widest text-[var(--outline)] uppercase">
              stable runtime
            </div>
          </div>
          
          {/* Quick Toggles Grid (3x2) */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <button onClick={handleThemeToggle} className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 group">
              <div className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-[var(--on-surface)] text-[var(--surface)]' : 'bg-[var(--surface-dim)] text-[var(--on-surface)] group-hover:bg-[var(--container)]'}`}>
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
                <span className="text-[8px] text-[var(--on-surface-var)]">Theme</span>
              </div>
            </button>
            
            <button onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 group">
              <div className="p-2 rounded-full bg-[var(--surface-dim)] text-[var(--on-surface)] group-hover:bg-[var(--container)] transition-colors">
                <Languages size={14} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">{lang === 'ru' ? 'Русский' : 'English'}</span>
                <span className="text-[8px] text-[var(--on-surface-var)]">Language</span>
              </div>
            </button>

            <button onClick={handleSoundToggle} className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 group">
              <div className={`p-2 rounded-full transition-colors ${isSoundEnabled ? 'bg-[var(--on-surface)] text-[var(--surface)]' : 'bg-[var(--surface-dim)] text-[var(--on-surface)] group-hover:bg-[var(--container)]'}`}>
                {isSoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Sounds</span>
                <span className="text-[8px] text-[var(--on-surface-var)]">{isSoundEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </button>
            
            <button onClick={handleContrastToggle} className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 group">
              <div className={`p-2 rounded-full transition-colors ${isContrast ? 'bg-[var(--on-surface)] text-[var(--surface)]' : 'bg-[var(--surface-dim)] text-[var(--on-surface)] group-hover:bg-[var(--container)]'}`}>
                <Monitor size={14} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Contrast</span>
                <span className="text-[8px] text-[var(--on-surface-var)]">{isContrast ? 'High' : 'Normal'}</span>
              </div>
            </button>
            
            <button className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 group">
              <div className="p-2 rounded-full bg-[var(--on-surface)] text-[var(--surface)] transition-colors">
                <Shield size={14} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Privacy</span>
                <span className="text-[8px] text-[var(--on-surface-var)]">Protected</span>
              </div>
            </button>
            
            <button className="flex items-center p-2 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] hover:bg-[var(--surface-dim)] transition-colors gap-3 opacity-50 cursor-not-allowed">
              <div className="p-2 rounded-full bg-[var(--surface-dim)] text-[var(--on-surface-var)] flex items-center justify-center">
                <span className="text-xs font-bold">+</span>
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold text-[var(--on-surface)] leading-tight">Add</span>
                <span className="text-[8px] text-[var(--on-surface-var)]">Shortcut</span>
              </div>
            </button>
          </div>
        </div>"""

content = re.sub(
    r'        \{\/\* PANEL: Sound effects toggles and mode selectors \*\/\}[\s\S]*?        <\/div>',
    quicktoggles,
    content
)


# Replace PANEL 9 (panel-profile)
profile = """        {/* COLUMN 1: Profile Details with real destroy action */}
        <div className="panel panel-bg-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px]" id="panel-profile">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--on-surface-var)] uppercase tracking-wider">
              <User size={16} />
              <span>LinkerID</span>
            </div>
            <div className="text-[9px] font-black tracking-widest text-[var(--outline)] uppercase">
              Profile
            </div>
          </div>
          
          <div className="flex items-center gap-4 my-auto">
            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--on-surface)] p-0.5 shadow-sm">
              <div className="h-full w-full rounded-full bg-[var(--surface)] flex items-center justify-center overflow-hidden">
                <User size={24} className="text-[var(--on-surface-var)]" />
              </div>
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-black text-[var(--on-surface)] leading-tight">Guest User</span>
              <span className="text-[10px] text-[var(--on-surface-var)] font-semibold mt-0.5">guest@linker.os</span>
            </div>
            <button onClick={handleDestroySession} className="h-10 w-10 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)] flex items-center justify-center text-[var(--on-surface-var)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500 transition-colors shadow-sm" title={lang === 'ru' ? 'Выйти' : 'Log out'}>
              <LogOut size={16} />
            </button>
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            <button className="w-full py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--outline-var)] text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--surface-dim)] transition-colors shadow-sm">
              {lang === 'ru' ? 'Управление аккаунтом' : 'Manage Account'}
            </button>
            <p className="text-[9px] text-[var(--on-surface-var)] text-center select-none font-semibold">
              {t.ph_danger_hint}
            </p>
          </div>
        </div>"""

content = re.sub(
    r'        \{\/\* COLUMN 1: Profile Details with real destroy action \*\/\}[\s\S]*?        <\/div>',
    profile,
    content
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

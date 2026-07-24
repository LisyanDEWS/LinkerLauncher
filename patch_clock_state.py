import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

state_inject = """  const [isStandbySetupOpen, setIsStandbySetupOpen] = useState(false);
  const [clockType, setClockType] = useState<'digital' | 'analog'>('digital');
  const [clockVariation, setClockVariation] = useState<1 | 2 | 3>(1);"""
content = content.replace('  const [isStandbySetupOpen, setIsStandbySetupOpen] = useState(false);', state_inject)

clock_modal_render = """      <ClockModal
        isOpen={isClockOpen}
        onClose={() => {
          playChime('click');
          setIsClockOpen(false);
        }}
        lang={lang}
        primaryColor={activePalette.primary}
        onOpenStandbySetup={() => {
          setIsStandbySetupOpen(true);
        }}
        clockType={clockType}
        setClockType={setClockType}
        clockVariation={clockVariation}
        setClockVariation={setClockVariation}
      />"""

content = re.sub(r'      <ClockModal.*?onOpenStandbySetup=\{\(\) => \{\n          setIsStandbySetupOpen\(true\);\n        \}\}\n      />', clock_modal_render, content, flags=re.DOTALL)

standby_clock_render = """      <StandbyClock
        isOpen={isStandbyOpen}
        onClose={() => {
          playChime('click');
          setIsStandbyOpen(false);
          try {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            }
          } catch (e) {}
        }}
        lang={lang}
        primaryColor={activePalette.primary}
        background={standbyBg}
        onOpenSetup={() => {
          playChime('click');
          setIsStandbySetupOpen(true);
        }}
        clockType={clockType}
        clockVariation={clockVariation}
      />"""

content = re.sub(r'      <StandbyClock.*?setIsStandbySetupOpen\(true\);\n        \}\}\n      />', standby_clock_render, content, flags=re.DOTALL)

# Add Linker-Theme postMessage to iframe and window config
config_script = """  // --- PIPUN CONFIGS / CROSS-APP THEME SYNC ---
  useEffect(() => {
    const message = {
      type: 'LINKER_CONFIG',
      theme,
      palette: activePalette
    };
    
    // Broadcast to all iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, '*');
      }
    });

    // Also attach to window for any child components or scripts
    (window as any).__LINKER_CONFIG = message;
  }, [theme, activePalette]);"""

content = re.sub(r'  // --- Geolocation ---', config_script + '\n\n  // --- Geolocation ---', content)

# 5. Fix Quick Apps: add Settings App
quick_apps_replace = """          <div className="grid grid-cols-4 gap-3 my-auto pt-4" id="app-grid">
            {/* Weather App Shortcut */}
            <div className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => {
              playChime('click');
              setIsWeatherAppOpen(true);
            }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-white/10" style={{ backgroundColor: activePalette.primary }}>
                <CloudSun size={24} className="text-white" />
              </div>
              <span className="text-[9px] font-bold text-[var(--on-surface)]">Weather</span>
            </div>
            
            {/* Settings App Shortcut */}
            <div className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => {
              playChime('click');
              setIsFullSettingsOpen(true);
            }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-white/10 bg-[var(--surface-dim)]">
                <Settings size={24} className="text-[var(--on-surface)]" />
              </div>
              <span className="text-[9px] font-bold text-[var(--on-surface)]">Settings</span>
            </div>

            {/* Blank Placeholder Apps to match design */}
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div>
            </div>
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div>
            </div>
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div>
            </div>
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div>
            </div>
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div>
            </div>
            <div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div>
            </div>
          </div>"""

content = re.sub(r'          <div className="grid grid-cols-4 gap-3 my-auto pt-4" id="app-grid">.*?          </div>', quick_apps_replace, content, flags=re.DOTALL)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


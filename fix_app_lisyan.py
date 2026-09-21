import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import { LisyanConnectModal } from './components/LisyanConnectModal';\n"
if "LisyanConnectModal" not in content:
    content = import_stmt + content

# Add state
state_pattern = r'const \[isAgnoOpen, setIsAgnoOpen\] = useState\(false\);'
state_replacement = r'const [isAgnoOpen, setIsAgnoOpen] = useState(false);\n  const [isLisyanConnectOpen, setIsLisyanConnectOpen] = useState(false);'
content = re.sub(state_pattern, state_replacement, content)

# Find Lisyan Connect card and replace buttons
widget4_pattern = re.compile(r'\{/\* WIDGET 4: Lisyan Connect \*/\}.*?</button>\s*</div>\s*</div>\s*</div>', re.DOTALL)
widget4_replacement = r'''{/* WIDGET 4: Lisyan Connect */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[240px] transition-all hover:scale-[1.02] active:scale-[0.98] relative" id="card-lisyan-connect">
          <div className="absolute top-6 right-6 flex items-center gap-2 text-[var(--accent)] hover:text-[var(--on-surface)] transition-colors cursor-pointer" title="Status: Online">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_8px_currentColor]"></div>
          </div>
          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl border border-[var(--outline)] overflow-hidden flex items-center justify-center shadow-inner" style={{ backgroundColor: activePalette.primary }}>
              <img src="https://github.com/user-attachments/assets/939c90aa-0efa-4e50-b886-007111d41fa3" alt="Lisyan Connect" className="w-full h-full object-cover p-1" />
            </div>
          </div>
          <div className="flex-1 mt-5 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Lisyan Connect</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {lang === 'ru' ? 'Веб-сервис для быстрой, безопасной и анонимной P2P-передачи файлов.' : 'Web service for fast, secure and anonymous P2P file transfer.'}
            </p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs font-bold text-[var(--on-surface-var)] mr-2">{lang === 'ru' ? 'Отрыть в:' : 'Open:'}</span>
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => {
                  playChime('click');
                  setIsLisyanConnectOpen(true);
                }}
                className="flex-1 py-3 bg-[var(--container)] hover:bg-[var(--container-high)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-full text-[10px] font-black cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-95 px-1"
              >
                Linker.Ru
              </button>
            </div>
          </div>
        </div>'''
content = re.sub(widget4_pattern, widget4_replacement, content)

# Add Modal
modal_insertion_point = r'\{isWeatherAppOpen && \('
modal_replacement = r'''<LisyanConnectModal isOpen={isLisyanConnectOpen} onClose={() => setIsLisyanConnectOpen(false)} />
      {isWeatherAppOpen && ('''
content = re.sub(modal_insertion_point, modal_replacement, content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

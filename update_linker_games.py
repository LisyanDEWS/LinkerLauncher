import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

games_widget = """        {/* WIDGET 3: LinkerGAMES */}
        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[240px] opacity-75 cursor-default relative" id="card-linkergames">
          <div className="flex justify-between items-start">
            <div className="w-11 h-11 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline)] flex items-center justify-center shadow-inner">
              <Gamepad2 size={20} className="text-[var(--on-surface)]" />
            </div>
            <div className="bg-[var(--surface)] border border-[var(--outline-var)] px-2.5 py-1 rounded-full text-[9px] font-bold text-[var(--on-surface-var)] uppercase tracking-wider">
              {lang === 'ru' ? 'В разработке' : 'Coming Soon'}
            </div>
          </div>

          <div className="space-y-1 my-5 pr-12">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">LinkerGAMES</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed">
              {lang === 'ru' ? 'Игры и развлечения в будущих обновлениях.' : 'Games and entertainment in future updates.'}
            </p>
          </div>

          <button
            disabled
            className="w-full py-3 rounded-full text-xs font-extrabold text-[var(--on-surface-var)] transition-all bg-[var(--surface-dim)] border border-[var(--outline-var)] cursor-not-allowed text-center"
            id="linkergames-action-btn"
          >
            {lang === 'ru' ? 'Ожидайте' : 'Coming Soon'}
          </button>
        </div>"""

content = re.sub(r'        \{\/\* WIDGET 3: Pomodoro Focus Timer countdown \*\/\}.*?        </div>', games_widget, content, flags=re.DOTALL)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

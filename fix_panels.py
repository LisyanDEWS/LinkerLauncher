import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the grid 5 cols
content = content.replace('grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="row1-bento-grid"', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" id="row1-bento-grid"')

# Space Proxy Hub
proxy_old = """          <div className="flex justify-between items-start">
            <div className="w-11 h-11 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline)] flex items-center justify-center shadow-inner">
              <Globe size={20} className="text-[var(--on-surface)]" />
            </div>
          </div>
          <div className="space-y-1 my-5 pr-12">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Space Proxy Hub</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed">
              {t.multi_server_desc}
            </p>
          </div>
          <button"""

proxy_new = """          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline)] flex items-center justify-center shadow-inner">
              <Globe size={20} className="text-[var(--on-surface)]" />
            </div>
          </div>
          <div className="flex-1 mt-5 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Space Proxy Hub</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {t.multi_server_desc}
            </p>
          </div>
          <div className="mt-4 flex items-end">
          <button"""
content = content.replace(proxy_old, proxy_new)
content = content.replace('id="proxy-card-action-btn"\n          >\n            {t.select_server_label}\n          </button>', 'id="proxy-card-action-btn"\n          >\n            {t.select_server_label}\n          </button>\n          </div>')


# Agno GPT
agno_old = """          <div className="flex justify-between items-start">
            <div className="w-11 h-11 rounded-2xl bg-[var(--accent)] border border-[var(--outline)] overflow-hidden flex items-center justify-center shadow-inner">
              <Bot size={20} className="text-white" />
            </div>
          </div>
          <div className="space-y-1 my-5 pr-12">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Agno GPT</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed">
              {lang === 'ru' ? 'Персональный ИИ-ассистент на базе OpenAI' : 'Personal AI assistant powered by OPENAI'}
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto">"""

agno_new = """          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl bg-[var(--accent)] border border-[var(--outline)] overflow-hidden flex items-center justify-center shadow-inner">
              <Bot size={20} className="text-white" />
            </div>
          </div>
          <div className="flex-1 mt-5 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Agno GPT</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {lang === 'ru' ? 'Персональный ИИ-ассистент на базе OpenAI' : 'Personal AI assistant powered by OPENAI'}
            </p>
          </div>
          <div className="flex items-center justify-between mt-4">"""
content = content.replace(agno_old, agno_new)

# LinkerGAMES
games_old = """          <div className="flex justify-between items-start">
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
          <button"""

games_new = """          <div className="flex justify-between items-start h-[44px]">
            <div className="w-11 h-11 rounded-2xl bg-[var(--surface-dim)] border border-[var(--outline)] flex items-center justify-center shadow-inner">
              <Gamepad2 size={20} className="text-[var(--on-surface)]" />
            </div>
            <div className="bg-[var(--surface)] border border-[var(--outline-var)] px-2.5 py-1 rounded-full text-[9px] font-bold text-[var(--on-surface-var)] uppercase tracking-wider">
              {lang === 'ru' ? 'В разработке' : 'Coming Soon'}
            </div>
          </div>
          <div className="flex-1 mt-5 flex flex-col pr-8">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">LinkerGAMES</h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">
              {lang === 'ru' ? 'Игры и развлечения в будущих обновлениях.' : 'Games and entertainment in future updates.'}
            </p>
          </div>
          <div className="mt-4 flex items-end">
          <button"""
content = content.replace(games_old, games_new)
content = content.replace('id="linkergames-action-btn"\n          >\n            {lang === \'ru\' ? \'Ожидайте\' : \'Coming Soon\'}\n          </button>\n        </div>\n        {/* WIDGET 4: App Launcher */}', 'id="linkergames-action-btn"\n          >\n            {lang === \'ru\' ? \'Ожидайте\' : \'Coming Soon\'}\n          </button>\n          </div>\n        </div>\n\n        {/* WIDGET 4: Lisyan Connect */}\n        <div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[240px] transition-all hover:scale-[1.02] active:scale-[0.98] relative" id="card-lisyan-connect">\n          <div className="absolute top-6 right-6 flex items-center gap-2 text-[var(--accent)] hover:text-[var(--on-surface)] transition-colors cursor-pointer" title="Status: Online">\n            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_8px_currentColor]"></div>\n          </div>\n          <div className="flex justify-between items-start h-[44px]">\n            <div className="w-11 h-11 rounded-2xl bg-white border border-[var(--outline)] overflow-hidden flex items-center justify-center shadow-inner">\n              <img src="https://github.com/user-attachments/assets/939c90aa-0efa-4e50-b886-007111d41fa3" alt="Lisyan Connect" className="w-full h-full object-cover p-1" />\n            </div>\n          </div>\n          <div className="flex-1 mt-5 flex flex-col pr-8">\n            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">Lisyan Connect</h3>\n            <p className="text-xs text-[var(--on-surface-var)] font-semibold leading-relaxed mt-1 flex-1">\n              {lang === \'ru\' ? \'Веб-сервис для быстрой, безопасной и анонимной P2P-передачи файлов между любыми устройствами прямо через браузер.\' : \'Web service for fast, secure and anonymous P2P file transfer between any devices right in your browser.\'}\n            </p>\n          </div>\n          <div className="flex items-center justify-between mt-4">\n            <span className="text-xs font-bold text-[var(--on-surface-var)] mr-2">{lang === \'ru\' ? \'Отрыть в:\' : \'Open:\'}</span>\n            <div className="flex gap-2 flex-1">\n              <button\n                onClick={() => {\n                  playChime(\'click\');\n                  setIsLisyanConnectOpen(true);\n                }}\n                className="flex-1 py-3 bg-[var(--container)] hover:bg-[var(--container-high)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-full text-[10px] font-black cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-95 px-1"\n              >\n                Linker.Ru\n              </button>\n              <button\n                onClick={() => {\n                  playChime(\'click\');\n                  const win = window.open(\'about:blank\', \'_blank\');\n                  if (win) {\n                    win.document.write(`\n                        <!DOCTYPE html>\n                        <html>\n                        <head>\n                          <title>Lisyan Connect</title>\n                          <style>\n                            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #000; }\n                          </style>\n                        </head>\n                        <body>\n                          <iframe src="${window.location.origin}/apps/lisyan-connect.html" style="width: 100vw; height: 100vh; border: none;" allow="camera; microphone; clipboard-write"></iframe>\n                        </body>\n                        </html>\n                    `);\n                  }\n                }}\n                className="flex-1 py-3 bg-[var(--container)] hover:bg-[var(--container-high)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-full text-[10px] font-black cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-95 px-1"\n              >\n                about:blank\n              </button>\n            </div>\n          </div>\n        </div>\n\n        {/* WIDGET 5: App Launcher */}')


# Remove Lisyan Connect shortcut from the mini App Launcher
lc_shortcut_pattern = r'\{\/\* Lisyan Connect Shortcut \*\/\}.*?<\/div>\s*<\/div>'
lc_repl = r'<div className="flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed"><div className="w-12 h-12 rounded-2xl bg-[var(--surface-dim)] flex items-center justify-center border border-[var(--outline-var)]"></div></div>'
content = re.sub(lc_shortcut_pattern, lc_repl, content, flags=re.DOTALL)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

security_about = """                    )}
                    
                    {activeTab === 'security' && (
                      <div className="space-y-6" id="page-security-view">
                        <div className="p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl flex flex-col items-center justify-center text-center gap-4 py-12">
                          <div className="w-16 h-16 rounded-full bg-[var(--container)] text-[var(--accent)] flex items-center justify-center mb-2">
                            <Shield size={32} />
                          </div>
                          <h3 className="text-lg font-bold text-[var(--on-surface)]">
                            {lang === 'ru' ? 'Ваши данные в безопасности' : 'Your data is secure'}
                          </h3>
                          <p className="text-sm text-[var(--on-surface-var)] max-w-sm">
                            {lang === 'ru' ? 'Linker OS использует локальное хранилище для всех настроек. Ваши данные не отправляются на сторонние серверы.' : 'Linker OS uses local storage for all preferences. Your data is not sent to third-party servers.'}
                          </p>
                          <button className="mt-4 px-6 py-2 rounded-xl bg-[var(--accent)] text-white font-bold text-sm hover:opacity-90 transition-opacity">
                            {lang === 'ru' ? 'Политика конфиденциальности' : 'Privacy Policy'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'about' && (
                      <div className="space-y-6" id="page-about-view">
                        <div className="p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl flex flex-col items-center justify-center text-center gap-4 py-12">
                          <div className="w-20 h-20 rounded-3xl bg-[var(--accent)] text-white flex items-center justify-center shadow-lg mb-2">
                            <Wind size={40} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-[var(--on-surface)]">Linker OS</h3>
                            <p className="text-sm font-bold text-[var(--accent)] mt-1">Version 1.0.0 (Build 42)</p>
                          </div>
                          <p className="text-sm text-[var(--on-surface-var)] max-w-sm mt-2">
                            {lang === 'ru' ? 'Linker OS - это экспериментальная операционная система в браузере, созданная с фокусом на дизайн и удобство.' : 'Linker OS is an experimental browser-based operating system built with a focus on design and usability.'}
                          </p>
                          <div className="flex gap-4 mt-6">
                            <button className="px-4 py-2 rounded-xl bg-[var(--container)] text-[var(--on-surface)] font-bold text-xs hover:bg-[var(--surface-dim)] transition-colors border border-[var(--outline-var)]">
                              {lang === 'ru' ? 'Проверить обновления' : 'Check for Updates'}
                            </button>
                            <button className="px-4 py-2 rounded-xl bg-[var(--container)] text-[var(--on-surface)] font-bold text-xs hover:bg-[var(--surface-dim)] transition-colors border border-[var(--outline-var)]">
                              {lang === 'ru' ? 'Лицензии' : 'Licenses'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
"""

content = re.sub(
    r'                    \)\}\s*<\/>\s*\)\}\s*<\/div>\s*<\/main>',
    security_about + '              </div>\n            </main>',
    content
)

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

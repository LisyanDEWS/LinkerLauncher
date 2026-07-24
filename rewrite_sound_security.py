import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_str = "import { CLICK_SOUNDS, NOTIFICATION_SOUNDS } from '../data/sounds';\n"
if "import { CLICK_SOUNDS" not in content:
    content = content.replace("import React,", import_str + "import React,")


# Replace page-sound-view contents
sound_view_pattern = r'<div className="space-y-6" id="page-sound-view">.*?(?=                    \{activeTab === \'language\' && \()'
sound_view_replacement = """<div className="space-y-6" id="page-sound-view">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] pl-1.5">
                          {lang === 'ru' ? 'Звук и Уведомления' : 'Sound & Notifications'}
                        </h4>
                        
                        <div className="flex flex-col gap-3">
                          {/* Toast Toggle */}
                          <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                                <Bell size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {t.toast_enabled}
                                </div>
                                <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  {t.toast_desc}
                                </div>
                              </div>
                            </div>
                            <SquashToggle 
                              checked={isToastEnabled} 
                              onChange={onToastToggle} 
                              color={activePalette.primary} 
                            />
                          </div>

                          {/* Interactive Click Sound toggle */}
                          <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                                {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {t.sound_effects}
                                </div>
                                <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  {t.sound_desc}
                                </div>
                              </div>
                            </div>
                            <SquashToggle 
                              checked={isSoundEnabled} 
                              onChange={onSoundToggle} 
                              color={activePalette.primary} 
                            />
                          </div>
                        </div>

                        {/* Sound Selection Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Click Sound Selection */}
                          <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--accent)] border border-[var(--outline-var)]">
                                <Volume2 size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Звук клика' : 'Click Sound'}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {CLICK_SOUNDS.map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => onClickSoundChange(s.id)}
                                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                                    clickSound === s.id ? 'bg-[var(--surface-dim)] text-[var(--on-surface)] border border-[var(--outline)] shadow-sm' : 'border border-transparent text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-dim)]'
                                  }`}
                                >
                                  {s.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Notify Sound Selection */}
                          <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--accent)] border border-[var(--outline-var)]">
                                <Bell size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  {lang === 'ru' ? 'Звук уведомления' : 'Notification Sound'}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                              {NOTIFICATION_SOUNDS.map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => onNotifySoundChange(s.id)}
                                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all shrink-0 ${
                                    notifySound === s.id ? 'bg-[var(--surface-dim)] text-[var(--on-surface)] border border-[var(--outline)] shadow-sm' : 'border border-transparent text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-dim)]'
                                  }`}
                                >
                                  {s.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
"""

content = re.sub(sound_view_pattern, sound_view_replacement, content, flags=re.DOTALL)

# Let's also remove the toast toggle from the "notifications" tab since we moved it to "sound & notifications"
notif_tab_pattern = r'<div className="space-y-6" id="page-notifications-view">.*?<SquashToggle \n\s*checked=\{isToastEnabled\}.*?/>\n\s*</div>'
notif_tab_repl = r'<div className="space-y-6" id="page-notifications-view">\n                        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] pl-1.5">\n                          {t.page_notifications}\n                        </h4>\n                        <div className="p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">\n                          <p className="text-sm text-[var(--on-surface-var)]">{lang === "ru" ? "Управление уведомлениями теперь находится во вкладке Звук." : "Notification management is now located in the Sound tab."}</p>\n                        </div>'
content = re.sub(notif_tab_pattern, notif_tab_repl, content, flags=re.DOTALL)


# Replace page-security-view contents to add panic button
security_view_pattern = r'<div className="space-y-6" id="page-security-view">.*?<div className="p-4 bg-\[var\(--surface\)\] border border-\[var\(--outline-var\)\] rounded-2xl flex flex-col items-center justify-center text-center gap-4 py-12">.*?</div>\s*</div>'

security_view_replacement = """<div className="space-y-6" id="page-security-view">
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
                        </div>
                        
                        <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3">
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                              <AlertTriangle size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--on-surface)]">
                                {lang === 'ru' ? 'Тревожная кнопка (Panic Button)' : 'Panic Button'}
                              </div>
                              <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                {lang === 'ru' ? 'Мгновенно закрыть приложение и открыть безопасный сайт' : 'Instantly close the app and open a safe site'}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => window.location.replace('https://google.com')} className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-xs mt-2 hover:bg-red-600 transition-colors">
                            {lang === 'ru' ? 'АКТИВИРОВАТЬ ПАНИКУ' : 'ACTIVATE PANIC'}
                          </button>
                        </div>
                      </div>"""

content = re.sub(security_view_pattern, security_view_replacement, content, flags=re.DOTALL)


with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

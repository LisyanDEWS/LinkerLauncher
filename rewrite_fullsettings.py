import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """                        {/* Click Sound Selection */}
                        <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                              <Volume2 size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--on-surface)]">
                                {lang === 'ru' ? 'Звук клика' : 'Click Sound'}
                              </div>
                              <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                {lang === 'ru' ? 'Звук при взаимодействии' : 'Sound played on interactions'}
                              </div>
                            </div>
                          </div>
                          <div className="flex bg-[var(--container)] border border-[var(--outline-var)] rounded-full p-0.5 gap-0.5">
                            {['mouse_click', 'futuristic', 'tap'].map(s => (
                              <button
                                key={s}
                                onClick={() => onClickSoundChange(s)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                                  clickSound === s ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-dim)]'
                                }`}
                              >
                                {s.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl mt-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--on-surface)] border border-[var(--outline-var)]">
                              <Volume2 size={18} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--on-surface)]">
                                {lang === 'ru' ? 'Звук уведомлений' : 'Notification Sound'}
                              </div>
                              <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                {lang === 'ru' ? 'Звук при оповещениях' : 'Sound played on alerts'}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap bg-[var(--container)] border border-[var(--outline-var)] rounded-xl p-1 gap-1 max-w-[200px] justify-end">
                            {['opal_bell', 'sticks', 'mallet', 'end', 'duet', 'pipes', 'ping', 'iphone'].map(s => (
                              <button
                                key={s}
                                onClick={() => onNotifySoundChange(s)}
                                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                                  notifySound === s ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-dim)]'
                                }`}
                              >
                                {s.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>"""

content = re.sub(
    r'                        \{\/\* Sound Profile Selection \*\/\}.*?                            \}\)\}\s+<\/div>\s+<\/div>',
    replacement,
    content,
    flags=re.DOTALL
)

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

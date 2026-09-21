import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Clean up SettingsModal
settings_modal = r'(<SettingsModal[^>]*?)(onClickSoundChange=\{[\s\S]*?onNotifySoundChange=\{[\s\S]*?\})\s*'
content = re.sub(settings_modal, r'\1', content)

# Check if FullSettingsModal has onClickSoundChange, if not add it
if 'onClickSoundChange={' not in content:
    content = content.replace('volume={soundVolume}', 
'''onClickSoundChange={(s) => {
          setClickSound(s);
          localStorage.setItem('linkerru_click_sound', s);
        }}
        onNotifySoundChange={(s) => {
          setNotifySound(s);
          localStorage.setItem('linkerru_notify_sound', s);
        }}
        volume={soundVolume}''')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    fs_content = f.read()

start = fs_content.find('{/* Sound Profile Selection */}')
end = fs_content.find('{/* App Language */}', start)

replacement = """                        {/* Click Sound Selection */}
                        <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3">
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--accent)] border border-[var(--outline-var)]">
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
                          <div className="flex flex-wrap gap-2">
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
                        
                        {/* Notification Sound Selection */}
                        <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3 mt-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--container)] text-[var(--accent)] border border-[var(--outline-var)]">
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
                          <div className="flex flex-wrap gap-2">
                            {['opal_bell', 'sticks', 'mallet', 'end', 'duet', 'pipes', 'ping', 'iphone'].map(s => (
                              <button
                                key={s}
                                onClick={() => onNotifySoundChange(s)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                                  notifySound === s ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm' : 'text-[var(--on-surface-var)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-dim)]'
                                }`}
                              >
                                {s.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        """

fs_content = fs_content[:start] + replacement + fs_content[end:]

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(fs_content)

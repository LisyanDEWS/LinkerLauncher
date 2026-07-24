import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('  soundProfile: string;\n  onSoundProfileChange: (profile: string) => void;', 
'''  clickSound: string;
  onClickSoundChange: (profile: string) => void;
  notifySound: string;
  onNotifySoundChange: (profile: string) => void;''')

content = content.replace('  soundProfile,\n  onSoundProfileChange,', 
'''  clickSound,
  onClickSoundChange,
  notifySound,
  onNotifySoundChange,''')

# We also need to change the UI for it
ui_replacement = """                          {/* UI Sound Types Row */}
                          <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-[var(--container)] flex items-center justify-center flex-shrink-0 text-[var(--accent)] border border-[var(--outline-var)]">
                                <MonitorSpeaker size={20} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  Click Sound
                                </div>
                                <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  Sound played on interactions
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {['mouse_click', 'futuristic', 'tap'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => onClickSoundChange(s)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    clickSound === s ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-dim)] text-[var(--on-surface)] hover:bg-[var(--container)]'
                                  }`}
                                >
                                  {s.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-[var(--container)] flex items-center justify-center flex-shrink-0 text-[var(--accent)] border border-[var(--outline-var)]">
                                <Volume2 size={20} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[var(--on-surface)]">
                                  Notification Sound
                                </div>
                                <div className="text-xs text-[var(--on-surface-var)] mt-0.5">
                                  Sound played on alerts
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {['opal_bell', 'sticks', 'mallet', 'end', 'duet', 'pipes', 'ping', 'iphone'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => onNotifySoundChange(s)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    notifySound === s ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-dim)] text-[var(--on-surface)] hover:bg-[var(--container)]'
                                  }`}
                                >
                                  {s.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>"""

# Replace the existing "UI Sound Profile" row
content = re.sub(
    r'                          \{\/\* UI Sound Profile Row \*\/\}.*?                          </div>\s+</div>',
    ui_replacement,
    content,
    flags=re.DOTALL
)

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

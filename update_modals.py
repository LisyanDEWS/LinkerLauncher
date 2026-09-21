import re

with open('src/components/SettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# SettingsModal (Quick Settings) -> Add Silent Mode
replace_silent = """      <div className="flex items-center justify-between mb-4 mt-6">
        <span className="text-sm font-bold text-[var(--on-surface)]">
          {lang === 'ru' ? 'Тихий режим' : 'Silent Mode'}
        </span>
        <button
          onClick={() => {
            const el = document.getElementById('volume-slider') as HTMLInputElement;
            if (el) {
               if (volume > 0) {
                 onVolumeChange(0);
                 el.value = '0';
               } else {
                 onVolumeChange(1);
                 el.value = '1';
               }
            } else {
               onVolumeChange(volume > 0 ? 0 : 1);
            }
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            volume === 0 ? 'bg-[var(--accent)]' : 'bg-[var(--surface-dim)]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              volume === 0 ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>"""

# Find where to put it. Let's put it before the Volume slider.
content = re.sub(r'      \{/\* Volume \*/\}', replace_silent + '\n\n      {/* Volume */}', content)

with open('src/components/SettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    f_content = f.read()

# 1. Rename "Live Wallpapers" to "Wallpapers"
f_content = f_content.replace("{lang === 'ru' ? 'Живые обои' : 'Live Wallpapers'}", "{lang === 'ru' ? 'Обои' : 'Wallpapers'}")

# 2. Add volume and brightness sliders. We need to pass them in props first.
f_content = f_content.replace('  soundProfile: string;\n  onSoundProfileChange: (profile: string) => void;', '  soundProfile: string;\n  onSoundProfileChange: (profile: string) => void;\n  brightness: number;\n  onBrightnessChange: (val: number) => void;\n  volume: number;\n  onVolumeChange: (val: number) => void;')
f_content = f_content.replace('  soundProfile,\n  onSoundProfileChange', '  soundProfile,\n  onSoundProfileChange,\n  brightness,\n  onBrightnessChange,\n  volume,\n  onVolumeChange')

sliders_html = """          {/* Lighting and Sound Controllers */}
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] mb-4 flex items-center gap-2">
              <Sun size={14} />
              {lang === 'ru' ? 'Свет и Звук' : 'Lighting & Sound'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl bg-[var(--surface-dim)] border border-[var(--outline-var)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[var(--on-surface)] flex items-center gap-2">
                    <Sun size={16} className="text-[var(--on-surface-var)]" />
                    {lang === 'ru' ? 'Яркость' : 'Brightness'}
                  </span>
                  <span className="text-xs font-bold text-[var(--on-surface-var)] tabular-nums">{Math.round(brightness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={brightness}
                  onChange={(e) => onBrightnessChange(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none outline-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${activePaletteId !== 'none' ? 'var(--accent)' : 'var(--on-surface-var)'} ${brightness * 100}%, var(--outline-var) ${brightness * 100}%)`
                  }}
                />
              </div>

              <div className="p-4 rounded-3xl bg-[var(--surface-dim)] border border-[var(--outline-var)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[var(--on-surface)] flex items-center gap-2">
                    {volume > 0 ? <Volume2 size={16} className="text-[var(--on-surface-var)]" /> : <VolumeX size={16} className="text-[var(--on-surface-var)]" />}
                    {lang === 'ru' ? 'Громкость' : 'Volume'}
                  </span>
                  <span className="text-xs font-bold text-[var(--on-surface-var)] tabular-nums">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none outline-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${activePaletteId !== 'none' ? 'var(--accent)' : 'var(--on-surface-var)'} ${volume * 100}%, var(--outline-var) ${volume * 100}%)`
                  }}
                />
              </div>
            </div>
          </div>"""

# Insert before "Appearance" section
f_content = re.sub(r'          \{/\* Appearance \*/\}', sliders_html + '\n\n          {/* Appearance */}', f_content)

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(f_content)


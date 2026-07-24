import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

sliders_html = """          {/* Lighting and Sound Controllers */}
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] mb-4 flex items-center gap-2 pl-1.5">
              <Sun size={14} />
              {lang === 'ru' ? 'Свет и Звук' : 'Lighting & Sound'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[var(--on-surface)] flex items-center gap-2">
                    <Sun size={16} className="text-[var(--on-surface-var)]" />
                    {lang === 'ru' ? 'Яркость' : 'Brightness'}
                  </span>
                  <span className="text-xs font-bold text-[var(--on-surface-var)] tabular-nums">{Math.round(brightness)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="1"
                  value={brightness}
                  onChange={(e) => onBrightnessChange(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none outline-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${activePaletteId !== 'none' ? 'var(--accent)' : 'var(--on-surface-var)'} ${brightness}%, var(--outline-var) ${brightness}%)`
                  }}
                />
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--outline-var)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[var(--on-surface)] flex items-center gap-2">
                    {volume > 0 ? <Volume2 size={16} className="text-[var(--on-surface-var)]" /> : <VolumeX size={16} className="text-[var(--on-surface-var)]" />}
                    {lang === 'ru' ? 'Громкость' : 'Volume'}
                  </span>
                  <span className="text-xs font-bold text-[var(--on-surface-var)] tabular-nums">{Math.round(volume)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none outline-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${activePaletteId !== 'none' ? 'var(--accent)' : 'var(--on-surface-var)'} ${volume}%, var(--outline-var) ${volume}%)`
                  }}
                />
              </div>
            </div>
          </div>"""

content = re.sub(
    r'(                    \{activeTab === \'appearance\' && \(\n                      <div className="space-y-6" id="page-appearance-view">)',
    r'\1\n' + sliders_html,
    content,
    flags=re.DOTALL
)

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

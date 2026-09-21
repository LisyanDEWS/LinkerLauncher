import re

with open('src/components/SettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove it from where it is now
content = re.sub(
    r'      <div className="flex items-center justify-between mb-4 mt-6">.*?      </div>\n\n              \{\/\* Volume Vertical Slider \*\/\}',
    r'              {/* Volume Vertical Slider */}',
    content,
    flags=re.DOTALL
)

# 2. Put it after the sliders container (which ends around line 118 with `</div>`)
# Wait, let's just insert it after the sliders container:
replace_silent = """            {/* Silent Mode Toggle */}
            <div className="flex items-center justify-between mb-4 mt-6 px-4">
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
                       onVolumeChange(100);
                       el.value = '100';
                     }
                  } else {
                     onVolumeChange(volume > 0 ? 0 : 100);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  volume === 0 ? 'bg-[var(--accent)]' : 'bg-[var(--surface-dim)]'
                }`}
                style={{ backgroundColor: volume === 0 ? primaryColor : undefined }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[var(--surface)] transition-transform shadow-sm ${
                    volume === 0 ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>"""

content = content.replace('            {/* Language Selection Segment */}', replace_silent + '\n\n            {/* Language Selection Segment */}')

with open('src/components/SettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

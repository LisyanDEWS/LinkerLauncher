import re

with open('src/components/SettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

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
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              volume === 0 ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>"""

content = content.replace('{/* Volume Vertical Slider */}', replace_silent + '\n\n              {/* Volume Vertical Slider */}')

with open('src/components/SettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

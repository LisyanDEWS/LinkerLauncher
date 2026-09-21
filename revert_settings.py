import re

with open('src/components/SettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

original_header = """            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black tracking-widest text-[var(--on-surface-var)] uppercase">
                {t.quick_settings_title}
              </span>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
                id="quick-settings-close"
              >
                <X size={14} />
              </button>
            </div>

            {/* Sliders Area */}"""

content = re.sub(
    r'            \{\/\* Header / LinkerID Profile Card \*\/\}[\s\S]*?\{\/\* Sliders Area \*\/\}',
    original_header,
    content
)

with open('src/components/SettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

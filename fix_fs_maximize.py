import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Maximize icon import
if 'Maximize' not in content:
    content = content.replace('X,', 'X,\n  Maximize,\n  Minimize,')

# Add fullscreen toggle logic
maximize_btn = """              <button
                onClick={() => {
                  try {
                    const el = document.getElementById('full-settings-modal-container');
                    if (el) {
                      if (!document.fullscreenElement) {
                        el.requestFullscreen();
                      } else {
                        document.exitFullscreen();
                      }
                    }
                  } catch(e) {}
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--outline-var)] bg-[var(--surface)] text-[var(--on-surface-var)] transition-all hover:bg-[var(--container)] hover:text-[var(--on-surface)]"
              >
                <Maximize size={16} />
              </button>
              <button
                onClick={onClose}"""

content = content.replace('              <button\n                onClick={onClose}', maximize_btn)

# Make sure to handle fullscreen element class changes
content = content.replace('max-w-4xl max-h-[85vh]', 'max-w-4xl max-h-[85vh] fullscreen:max-w-none fullscreen:max-h-screen fullscreen:w-screen fullscreen:h-screen fullscreen:rounded-none fullscreen:border-none')

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Lisyan Connect card's logo background
content = content.replace(
    '<div className="w-11 h-11 rounded-2xl bg-white border border-[var(--outline)] overflow-hidden flex items-center justify-center shadow-inner">',
    '<div className="w-11 h-11 rounded-2xl border border-[var(--outline)] overflow-hidden flex items-center justify-center shadow-inner" style={{ backgroundColor: activePalette.primary }}>'
)

# Replace Lisyan Connect card buttons
# Currently it has:
# onClick={() => { playChime('click'); setIsLisyanConnectOpen(true); }} ... Linker.Ru
# and the about:blank button using document.write

new_buttons = r'''onClick={() => {
                  playChime('click');
                  window.open('/apps/lisyan-connect.html', '_blank');
                }}
                className="flex-1 py-3 bg-[var(--container)] hover:bg-[var(--container-high)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-full text-[10px] font-black cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-95 px-1"
              >
                Linker.Ru
              </button>
              <button
                onClick={() => {
                  playChime('click');
                  const win = window.open('about:blank', '_blank');
                  if (win) {
                    win.document.write('<!DOCTYPE html><html><head><title>Loading...</title><style>body{background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;}</style></head><body>Loading...</body></html>');
                    fetch('/apps/lisyan-connect.html')
                      .then(r => r.text())
                      .then(html => {
                        win.document.open();
                        win.document.write(html);
                        win.document.close();
                      });
                  }
                }}
                className="flex-1 py-3 bg-[var(--container)] hover:bg-[var(--container-high)] text-[var(--on-surface)] border border-[var(--outline-var)] rounded-full text-[10px] font-black cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-95 px-1"
              >
                about:blank'''

# Find the specific block for Lisyan Connect buttons
# We need to find the <button onClick={... setIsLisyanConnectOpen(true) ... Linker.Ru ... and the about:blank button.
pattern_btns = re.compile(r'onClick=\{\(\) => \{\s*playChime\(\'click\'\);\s*setIsLisyanConnectOpen\(true\);\s*\}\}.*?about:blank\s*</button>', re.DOTALL)
content = re.sub(pattern_btns, new_buttons, content)

# Remove the LisyanConnectModal logic
content = re.sub(r'const \[isLisyanConnectOpen, setIsLisyanConnectOpen\] = useState\(false\);\n', '', content)

modal_pattern = re.compile(r'\{/\* Floating Lisyan Connect Window \*/\}.*?\{isLisyanConnectOpen && \(.*?</AnimatePresence>', re.DOTALL)
content = re.sub(modal_pattern, '', content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

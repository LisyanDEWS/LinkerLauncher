import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

linked_script = """  // --- LINKED CONFIGS / CROSS-APP THEME SYNC ---
  useEffect(() => {
    // Stringified theme config for 'linked' to read
    const themeStr = `LINKER-THEME=${theme.toUpperCase()}`;
    const message = {
      type: 'LINKER_CONFIG',
      theme,
      themeString: themeStr,
      palette: activePalette
    };
    
    // Broadcast to all iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, '*');
      }
    });

    // Dispatch global window event
    window.dispatchEvent(new CustomEvent('linker-theme-change', { detail: message }));

    // Global variable
    (window as any).LINKER_THEME = theme.toUpperCase();
    (window as any).__LINKER_CONFIG = message;
  }, [theme, activePalette]);"""

# We look for the old "PIPUN CONFIGS" block or the new "LINKED CONFIGS" block to make it idempotent
content = re.sub(
    r'(?:  // --- PIPUN CONFIGS / CROSS-APP THEME SYNC ---|  // --- LINKED CONFIGS / CROSS-APP THEME SYNC ---).*?  \}, \[theme, activePalette\]\);',
    linked_script,
    content,
    flags=re.DOTALL
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const beforeEffectTheme = `  useEffect(() => {
    if (isMobileLayout && theme !== 'light') {
      setTheme('light');
      localStorage.setItem('linkerru_theme', 'light');
    }
  }, [isMobileLayout, theme]);`;

const afterEffectTheme = `  useEffect(() => {
    if (isMobileLayout) {
      if (theme !== 'light') {
        setTheme('light');
        localStorage.setItem('linkerru_theme', 'light');
      }
      if (activePaletteId !== 'monochrome') {
        setActivePaletteId('monochrome');
        localStorage.setItem('linkerru_accent', 'monochrome');
      }
    }
  }, [isMobileLayout, theme, activePaletteId]);`;

content = content.replace(beforeEffectTheme, afterEffectTheme);
fs.writeFileSync('src/App.tsx', content);

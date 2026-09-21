const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const hookAnchor = `  // 1. Theme Setup (Light/Dark)`;
const listener = `  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'APPLY_WALLPAPER') {
        const url = e.data.payload;
        setMainWallpaper(url);
        localStorage.setItem('linkerru_wallpaper', url);
        playChime('victory');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [playChime]);

  // 1. Theme Setup (Light/Dark)`;

content = content.replace(hookAnchor, listener);
fs.writeFileSync('src/App.tsx', content);
console.log('patched 3');

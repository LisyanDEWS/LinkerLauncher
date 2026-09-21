const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add imports
content = content.replace("import { LisyanConnectModal }", "import { ExtensionsManager } from './components/ExtensionsManager';\nimport { LisyanConnectModal }");
content = content.replace("Settings,", "Settings,\n  Blocks,\n  Puzzle,");

// 2. Add handleOpenExtensions
const proxyHandler = `  const handleOpenProxy = () => {`;
const extHandler = `
  const handleOpenExtensions = () => {
    playChime('click');
    wm.open({
      id: 'extensions',
      title: lang === 'ru' ? 'Расширения' : 'Extensions',
      icon: <Puzzle size={14} className="text-[var(--on-surface)]" />,
      singleton: true,
      initialWidth: 700,
      initialHeight: 520,
      minWidth: 420,
      minHeight: 360,
      render: () => <ExtensionsManager lang={lang} wm={wm} />
    });
  };

  const handleOpenProxy = () => {`;
content = content.replace(proxyHandler, extHandler);

// 3. Add window event listener for APPLY_WALLPAPER in the same useEffect that has other things, 
// or just as a new useEffect.
const useEffectHooks = `  // 1. Theme Setup (Light/Dark)`;
const wallpaperListener = `  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'APPLY_WALLPAPER') {
        const url = e.data.payload;
        setMainWallpaper(url);
        localStorage.setItem('linkerru_wallpaper', url);
        playChime('success');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [playChime]);

  // 1. Theme Setup (Light/Dark)`;
content = content.replace(useEffectHooks, wallpaperListener);

// 4. Update row2-bento-grid locked card
const oldExtCardStart = `<div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px] opacity-75 transition-all hover:scale-[1.02] active:scale-[0.98]" id="card-locked-2">`;
const oldExtCardEnd = `          </button>\n        </div>`;

// We need to replace the content of card-locked-2
const oldCardRegex = /<div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-\[220px\] opacity-75 transition-all hover:scale-\[1\.02\] active:scale-\[0\.98\]" id="card-locked-2">[\s\S]*?<\/button>\n\s*<\/div>/;

const newCard = `<div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-[220px] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group" id="card-locked-2" onClick={handleOpenExtensions}>
          <div className="flex justify-between items-start">
            <div className="w-11 h-11 rounded-2xl border border-[var(--outline)] overflow-hidden flex items-center justify-center p-0 text-white" style={{ backgroundColor: activePalette.primary }}>
              <Puzzle size={24} />
            </div>
            <div className="w-8 h-8 rounded-full border border-[var(--outline)] flex items-center justify-center bg-[var(--surface)] text-[var(--on-surface)] opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={14} />
            </div>
          </div>
          <div className="my-3">
            <h3 className="text-base font-black text-[var(--on-surface)] tracking-tight">
              {lang === 'ru' ? 'Расширения' : 'Extensions'}
            </h3>
            <p className="text-xs text-[var(--on-surface-var)] font-semibold mt-1">
              {lang === 'ru' ? 'Менеджер расширений' : 'Extensions Manager'}
            </p>
          </div>
          <button className="w-full py-3 bg-[var(--accent)] text-white border border-[var(--accent)] rounded-full text-xs font-black select-none pointer-events-none shadow-sm shadow-[var(--accent)]/20">
            {lang === 'ru' ? 'Открыть' : 'Open'}
          </button>
        </div>`;

content = content.replace(oldCardRegex, newCard);

fs.writeFileSync('src/App.tsx', content);
console.log('patched');

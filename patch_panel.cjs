const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// First check imports
if (!content.includes('SunMoon')) {
    content = content.replace('MessageCircle,', 'MessageCircle, SunMoon,');
}

// Ensure isNightLight state exists
if (!content.includes('const [isNightLight')) {
    content = content.replace(
        /const \[isContrast, setIsContrast\] = useState<boolean>\(\(\) => \{/,
        `const [isNightLight, setIsNightLight] = useState<boolean>(() => {
    return localStorage.getItem('linkerru_night_light') === 'true';
  });
  const handleNightLightToggle = useCallback(() => {
    setIsNightLight(v => {
      const next = !v;
      localStorage.setItem('linkerru_night_light', String(next));
      if (next) playChime('click');
      return next;
    });
  }, [playChime]);

  const [isContrast, setIsContrast] = useState<boolean>(() => {`
    );
}

// Redesign Quick Toggles mapping and rendering
const startMarker = '<div className="grid grid-cols-2 gap-2 flex-1">';
const endMarker = '</div>\n        </div>';

const startIndex = content.indexOf(startMarker);
if (startIndex !== -1) {
    const nextPanelIndex = content.indexOf('</div>\n        </div>\n\n        {/* WIDGET 7:', startIndex);
    
    // We will do a regex replacement for the grid rendering.
    const newGrid = `<div className="grid grid-cols-2 gap-3 flex-1 content-start mt-2">
            {activeToggles.length === 0 ? (
              <div className="col-span-2 flex items-center justify-center text-[11px] text-[var(--outline)] italic">
                {lang === 'ru' ? 'Нет переключателей' : 'No toggles'}
              </div>
            ) : (
              activeToggles.map((id) => {
                const cfg = {
                  theme: {
                    icon: theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />,
                    label: theme === 'dark' ? (lang === 'ru' ? 'Тёмная' : 'Dark') : (lang === 'ru' ? 'Светлая' : 'Light'),
                    sub: lang === 'ru' ? 'Тема' : 'Theme',
                    active: theme === 'dark',
                    onClick: handleThemeToggle,
                  },
                  language: {
                    icon: <Languages size={16} />,
                    label: lang === 'ru' ? 'Русский' : 'English',
                    sub: lang === 'ru' ? 'Язык' : 'Language',
                    active: lang === 'ru',
                    onClick: () => setLang(lang === 'ru' ? 'en' : 'ru'),
                  },
                  sound: {
                    icon: isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />,
                    label: lang === 'ru' ? 'Звук' : 'Sound',
                    sub: isSoundEnabled ? (lang === 'ru' ? 'Вкл' : 'On') : (lang === 'ru' ? 'Выкл' : 'Off'),
                    active: isSoundEnabled,
                    onClick: handleSoundToggle,
                  },
                  contrast: {
                    icon: <Monitor size={16} />,
                    label: lang === 'ru' ? 'Контраст' : 'Contrast',
                    sub: isContrast ? (lang === 'ru' ? 'Высокий' : 'High') : (lang === 'ru' ? 'Обычный' : 'Normal'),
                    active: isContrast,
                    onClick: handleContrastToggle,
                  },
                  night_light: {
                    icon: <SunMoon size={16} />,
                    label: lang === 'ru' ? 'Ночной' : 'Night Light',
                    sub: isNightLight ? (lang === 'ru' ? 'Вкл' : 'On') : (lang === 'ru' ? 'Выкл' : 'Off'),
                    active: isNightLight,
                    onClick: handleNightLightToggle,
                  },
                }[id as keyof typeof cfg];

                return (
                  <button
                    key={id}
                    onClick={cfg.onClick}
                    className={\`flex items-center gap-3 p-3.5 rounded-[28px] border border-[var(--outline-var)] transition-all hover:scale-[1.02] active:scale-[0.98] \${
                      cfg.active
                        ? 'text-[var(--surface)] shadow-md border-transparent'
                        : 'bg-[var(--surface)] text-[var(--on-surface)] hover:bg-[var(--container-high)]'
                    }\`}
                    style={cfg.active ? { backgroundColor: activePalette.primary } : undefined}
                  >
                    <div className={\`flex items-center justify-center shrink-0 w-8 h-8 rounded-full \${
                      cfg.active ? 'bg-white/20 text-white' : 'bg-[var(--container)] text-[var(--on-surface-var)]'
                    }\`}>
                      {cfg.icon}
                    </div>
                    <div className="flex flex-col items-start text-left min-w-0">
                      <span className={\`text-[12px] font-black leading-tight truncate w-full \${cfg.active ? 'text-white' : 'text-[var(--on-surface)]'}\`}>{cfg.label}</span>
                      <span className={\`text-[9px] font-bold truncate w-full mt-0.5 \${cfg.active ? 'text-white/80' : 'text-[var(--on-surface-var)]'}\`}>{cfg.sub}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>`;
          
    const oldRegex = /<div className="grid grid-cols-2 gap-2 flex-1">[\s\S]*?\}\)\s*\)\}\s*<\/div>/;
    content = content.replace(oldRegex, newGrid);
}

fs.writeFileSync('src/App.tsx', content);
console.log('patched');

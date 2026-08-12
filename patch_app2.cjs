const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const anchor = `  const openLisyanWindow = () => {`;
const extHandler = `  const handleOpenExtensions = () => {
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

  const openLisyanWindow = () => {`;
content = content.replace(anchor, extHandler);

fs.writeFileSync('src/App.tsx', content);
console.log('patched 2');

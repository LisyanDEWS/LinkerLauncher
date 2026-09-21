const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const overlayStr = `
      <Grain />
      {isNightLight && (
        <div className="fixed inset-0 z-[9999] pointer-events-none bg-[#ffad33] opacity-[0.15] mix-blend-multiply" style={{ mixBlendMode: theme === 'dark' ? 'color-burn' : 'multiply' }} />
      )}
`;

content = content.replace('<Grain />', overlayStr);
fs.writeFileSync('src/App.tsx', content);
console.log('patched');

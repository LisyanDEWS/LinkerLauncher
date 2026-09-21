const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const beforeRender = `<LisyanConnectModal isOpen={isLisyanConnectOpen} onClose={() => setIsLisyanConnectOpen(false)} lang={lang} isMobileLayout={isMobileLayout} />`;
const afterRender = `{isLisyanConnectOpen && <LisyanConnectModal isOpen={isLisyanConnectOpen} onClose={() => setIsLisyanConnectOpen(false)} lang={lang} isMobileLayout={isMobileLayout} />}`;

content = content.replace(beforeRender, afterRender);
fs.writeFileSync('src/App.tsx', content);

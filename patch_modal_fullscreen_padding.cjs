const fs = require('fs');
let content = fs.readFileSync('src/components/LisyanConnectModal.tsx', 'utf-8');

const beforeMobileClass = `      className={isMobile 
        ? \`fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 \${isFullscreen ? 'bg-[var(--bg)]' : 'bg-black/40 backdrop-blur-md'}\`
        : \`fixed z-[200] flex flex-col overflow-hidden shadow-2xl border border-[var(--outline)] bg-[var(--surface)] transition-all duration-300 \${isFullscreen ? 'inset-0 rounded-none border-none' : 'inset-10 rounded-3xl'}\`
      }`;

const afterMobileClass = `      className={isMobile 
        ? \`fixed inset-0 z-[200] flex items-center justify-center \${isFullscreen ? 'p-0 bg-[var(--bg)]' : 'p-4 sm:p-6 bg-black/40 backdrop-blur-md'}\`
        : \`fixed z-[200] flex flex-col overflow-hidden shadow-2xl border border-[var(--outline)] bg-[var(--surface)] transition-all duration-300 \${isFullscreen ? 'inset-0 rounded-none border-none' : 'inset-10 rounded-3xl'}\`
      }`;

content = content.replace(beforeMobileClass, afterMobileClass);
fs.writeFileSync('src/components/LisyanConnectModal.tsx', content);

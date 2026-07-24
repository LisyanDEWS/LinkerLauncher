const fs = require('fs');
let content = fs.readFileSync('src/components/LisyanConnectModal.tsx', 'utf-8');

const beforeInnerClass = `      <div className={isMobile 
        ? \`flex flex-col bg-[var(--surface)] border border-[var(--outline)] shadow-2xl transition-all duration-500 overflow-hidden \${isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-xl rounded-3xl h-[85vh] max-h-[800px]'}\`
        : "flex flex-col h-full w-full"
      }>`;

const afterInnerClass = `      <div 
        className={isMobile 
          ? \`flex flex-col bg-[var(--surface)] shadow-2xl transition-all duration-500 overflow-hidden \${isFullscreen ? 'w-full h-full rounded-none border-none pb-4 pt-[max(env(safe-area-inset-top),_16px)]' : 'w-full max-w-xl rounded-3xl border border-[var(--outline)] h-[85vh] max-h-[800px]'}\`
          : "flex flex-col h-full w-full"
        }
      >`;

content = content.replace(beforeInnerClass, afterInnerClass);
fs.writeFileSync('src/components/LisyanConnectModal.tsx', content);

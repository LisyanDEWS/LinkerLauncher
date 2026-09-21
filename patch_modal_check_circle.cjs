const fs = require('fs');
let content = fs.readFileSync('src/components/LisyanConnectModal.tsx', 'utf-8');

const beforeHeaderContent = `                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--accent)] rounded-full flex items-center justify-center text-white shadow-sm">
                      <CheckCircle2 size={24} />
                    </div>`;

const afterHeaderContent = `                  <div className={\`flex items-center \${isMobile ? 'gap-3' : 'gap-4'}\`}>
                    <div className={\`bg-[var(--accent)] rounded-full flex items-center justify-center text-white shadow-sm \${isMobile ? 'w-10 h-10' : 'w-12 h-12'}\`}>
                      <CheckCircle2 size={isMobile ? 20 : 24} />
                    </div>`;

content = content.replace(beforeHeaderContent, afterHeaderContent);
fs.writeFileSync('src/components/LisyanConnectModal.tsx', content);

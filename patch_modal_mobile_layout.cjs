const fs = require('fs');
let content = fs.readFileSync('src/components/LisyanConnectModal.tsx', 'utf-8');

const beforeConnectedGrid = `                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[400px]">
                  {/* UPLOAD SECTION */}
                  <div className="flex flex-col bg-[var(--surface-dim)] border border-[var(--outline)] rounded-3xl p-6 relative overflow-hidden">`;

const afterConnectedGrid = `                <div className={isMobile ? "flex flex-col gap-4 flex-1 h-full overflow-y-auto pb-6" : "grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[400px]"}>
                  {/* UPLOAD SECTION */}
                  <div className={\`flex flex-col bg-[var(--surface-dim)] border border-[var(--outline)] relative overflow-hidden shrink-0 \${isMobile ? 'rounded-2xl p-4' : 'rounded-3xl p-6'}\`}>`;

const beforeReceiveSection = `                  {/* RECEIVE SECTION */}
                  <div className="flex flex-col bg-[var(--surface-dim)] border border-[var(--outline)] rounded-3xl p-6">`;

const afterReceiveSection = `                  {/* RECEIVE SECTION */}
                  <div className={\`flex flex-col bg-[var(--surface-dim)] border border-[var(--outline)] flex-1 \${isMobile ? 'rounded-2xl p-4' : 'rounded-3xl p-6'}\`}>`;

const beforeHeaderSection = `                <div className="flex items-center justify-between mb-6 bg-[var(--surface-dim)] p-4 rounded-3xl border border-[var(--outline)]">`;
const afterHeaderSection = `                <div className={\`flex items-center justify-between bg-[var(--surface-dim)] border border-[var(--outline)] \${isMobile ? 'mb-4 p-3 rounded-2xl' : 'mb-6 p-4 rounded-3xl'}\`}>`;

content = content.replace(beforeConnectedGrid, afterConnectedGrid);
content = content.replace(beforeReceiveSection, afterReceiveSection);
content = content.replace(beforeHeaderSection, afterHeaderSection);
fs.writeFileSync('src/components/LisyanConnectModal.tsx', content);

const fs = require('fs');
let content = fs.readFileSync('src/components/LisyanConnectModal.tsx', 'utf-8');

const beforeConnected = `                    <div>
                      <h4 className="text-lg font-black text-[var(--on-surface)] tracking-tight">
                        {lang === 'ru' ? 'Соединение установлено' : 'Connected'}
                      </h4>
                      <p className="text-xs text-[var(--on-surface-var)] font-bold mt-0.5">
                        P2P WebRTC • {deviceType ? deviceType.toUpperCase() : 'GUEST'} {deviceName ? \`(\${deviceName})\` : ''}
                      </p>
                    </div>`;

const afterConnected = `                    <div>
                      <h4 className="text-lg font-black text-[var(--on-surface)] tracking-tight">
                        {lang === 'ru' ? 'Соединение установлено' : 'Connected'}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-[var(--on-surface-var)] font-bold">P2P WebRTC • </span>
                        <div className="flex items-center gap-1.5 bg-[var(--surface)] px-2 py-0.5 rounded-full border border-[var(--outline)] shadow-sm">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                           <span className="text-[10px] font-black text-[var(--on-surface)] tracking-wide">
                             {deviceType ? deviceType.toUpperCase() : 'GUEST'} {deviceName ? \`(\${deviceName})\` : ''}
                           </span>
                        </div>
                      </div>
                    </div>`;

content = content.replace(beforeConnected, afterConnected);
fs.writeFileSync('src/components/LisyanConnectModal.tsx', content);

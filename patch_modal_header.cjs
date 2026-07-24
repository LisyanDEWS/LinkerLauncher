const fs = require('fs');
let content = fs.readFileSync('src/components/LisyanConnectModal.tsx', 'utf-8');

const beforeHeader = `        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--outline-var)] bg-[var(--surface-dim)] shrink-0">
          <div className="flex flex-col">
            <span className="text-sm font-black text-[var(--on-surface)] uppercase tracking-widest flex items-center gap-2">
              <Monitor size={16} /> LISYAN CONNECT
            </span>
            <span className="text-[10px] font-bold text-[var(--on-surface-var)]">
              {lang === 'ru' ? 'P2P ПЕРЕДАЧА ФАЙЛОВ' : 'P2P FILE TRANSFER'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isMobile && (
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--container)] transition-colors text-[var(--on-surface-var)]">
                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--container)] transition-colors text-[var(--on-surface)] bg-[var(--container-high)]">
              <X size={14} />
            </button>
          </div>
        </div>`;

const afterHeader = `        {/* HEADER */}
        <div className={\`flex items-center justify-between border-b border-[var(--outline-var)] shrink-0 \${isMobile ? 'p-3 bg-[var(--surface)]' : 'p-4 bg-[var(--surface-dim)]'}\`}>
          <div className="flex flex-col">
            <span className={\`font-black text-[var(--on-surface)] uppercase tracking-widest flex items-center gap-2 \${isMobile ? 'text-xs' : 'text-sm'}\`}>
              <Monitor size={isMobile ? 14 : 16} /> LISYAN CONNECT
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-[var(--on-surface-var)]">
              {lang === 'ru' ? 'P2P ПЕРЕДАЧА ФАЙЛОВ' : 'P2P FILE TRANSFER'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isMobile && (
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--container)] transition-colors text-[var(--on-surface-var)]">
                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--surface-dim)] transition-colors text-[var(--on-surface)] bg-[var(--surface-dim)]">
              <X size={14} />
            </button>
          </div>
        </div>`;

content = content.replace(beforeHeader, afterHeader);
fs.writeFileSync('src/components/LisyanConnectModal.tsx', content);

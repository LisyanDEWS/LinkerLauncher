const fs = require('fs');
const content = fs.readFileSync('src/components/WindowManager.tsx', 'utf-8');

// The new implementation of WindowManagerLayer and WindowFrame
const newImpl = `
export function WindowManagerLayer({
  wm,
  lang,
  isOptimizedEngine = false,
  isMobileLayout = false,
  isStandbyOpen = false,
  renderWindowContent,
}: WindowManagerLayerProps) {
  if (isStandbyOpen) return null;

  return (
    <AnimatePresence>
      {wm.windows.map((win) => (
        <React.Fragment key={win.id}>
          <WindowFrame
            win={win}
            lang={lang}
            onClose={() => wm.close(win.id)}
            renderWindowContent={renderWindowContent}
            isMobileLayout={isMobileLayout}
          />
        </React.Fragment>
      ))}
    </AnimatePresence>
  );
}

function WindowFrame({
  win,
  lang,
  onClose,
  renderWindowContent,
  isMobileLayout,
}: any) {
  const isRu = lang === 'ru';
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative z-10 flex flex-col overflow-hidden bg-[var(--surface)] border border-[var(--outline)] shadow-2xl"
        style={{
          width: isMobileLayout ? '92vw' : Math.min(win.initialWidth, 1000),
          height: isMobileLayout ? '85vh' : Math.min(win.initialHeight, 800),
          borderRadius: '1.5rem',
        }}
      >
        {!win.hideTitleBar && (
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--outline-var)] bg-[var(--surface-dim)] px-4 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[var(--on-surface-var)] [&>svg]:h-4 [&>svg]:w-4">{win.icon}</span>
              <span className="font-bold text-[var(--on-surface)] text-sm tracking-tight">{win.title}</span>
            </div>
            <div className="flex items-center gap-2">
              {win.headerActions}
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--on-surface-var)] hover:bg-red-500 hover:text-white transition-colors"
                title={isRu ? 'Закрыть' : 'Close'}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="relative flex-1 overflow-auto bg-[var(--surface)]">
          {renderWindowContent ? (renderWindowContent(win.id) ?? win.render()) : win.render()}
        </div>
      </motion.div>
    </div>
  );
}
`;

const startIndex = content.indexOf('export function WindowManagerLayer');
if (startIndex !== -1) {
    const finalContent = content.substring(0, startIndex) + newImpl;
    fs.writeFileSync('src/components/WindowManager.tsx', finalContent);
    console.log('Patched');
} else {
    console.log('Not found');
}

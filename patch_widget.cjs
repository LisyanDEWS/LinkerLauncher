const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const widgetCode = `
      {/* Floating Support Chat Widget */}
      <AnimatePresence>
        {isSupportChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 z-[400] w-[360px] h-[500px] shadow-2xl rounded-3xl overflow-hidden border border-[var(--outline)]"
          >
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setIsSupportChatOpen(false)}
                className="bg-[var(--surface-dim)]/80 backdrop-blur p-2 rounded-full text-[var(--on-surface-var)] hover:bg-[var(--outline)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <SupportApp lang={lang} theme={theme} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isSupportChatOpen && (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        onClick={() => { playChime('click'); setIsSupportChatOpen(true); }}
        className="fixed bottom-6 right-6 z-[400] h-14 w-14 rounded-full bg-[var(--accent)] text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        title="Support"
      >
        <MessageCircle size={24} />
      </motion.button>
      )}
`;

content = content.replace("    </motion.div>\n    </>\n  );\n}", widgetCode + "\n    </motion.div>\n    </>\n  );\n}");

fs.writeFileSync('src/App.tsx', content);
console.log('Patched widget');

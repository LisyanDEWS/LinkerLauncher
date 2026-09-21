import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_tab = """                </button>
                <button
                  onClick={() => {
                    setActiveTab('sound');
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === 'sound' && !searchQuery
                      ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-sm'
                      : 'text-[var(--on-surface-var)] hover:bg-[var(--surface-dim)] hover:text-[var(--on-surface)]'
                  }`}
                  id="tab-sound-btn"
                >
                  <Volume2 size={16} />
                  <span>{lang === 'ru' ? 'Звук' : 'Sound'}</span>
                </button>"""

content = content.replace('                </button>\n\n                <button\n                  onClick={() => {\n                    setActiveTab(\'security\');', new_tab + '\n\n                <button\n                  onClick={() => {\n                    setActiveTab(\'security\');')

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the separator between notifications and sound
pattern = r'                        </div>\s*\{/\* Interactive Click Sound toggle \*/\}'

replacement = """                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'sound' && (
                      <div className="space-y-6" id="page-sound-view">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-var)] pl-1.5">
                          {lang === 'ru' ? 'Звук' : 'Sound'}
                        </h4>
                        
                        {/* Interactive Click Sound toggle */}"""

content = re.sub(pattern, replacement, content)

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

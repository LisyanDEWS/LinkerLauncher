import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will find the end of the notifications tab and append the other tabs and closing tags.
# Let's find: onClick={() => onNotifySoundChange(s)} ... </button> ))} </div> </div>

end_of_notifications = r'''                              </button>
                            \)\)\}
                        <\/div>
                      <\/div>
                    \)\}'''

replacement = '''                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'language' && (
                      <div className="space-y-6" id="page-language-view">
                        <div className="flex flex-col p-4 bg-[var(--surface)] border border-[var(--outline-var)] rounded-2xl gap-3">
                          <div className="text-sm font-bold text-[var(--on-surface)]">
                            {lang === 'ru' ? 'Язык приложения' : 'App Language'}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => onLangChange('en')} className={`px-4 py-2 rounded-xl text-sm font-bold ${lang === 'en' ? 'bg-[var(--on-surface)] text-[var(--surface)]' : 'bg-[var(--surface-dim)] text-[var(--on-surface)]'}`}>English</button>
                            <button onClick={() => onLangChange('ru')} className={`px-4 py-2 rounded-xl text-sm font-bold ${lang === 'ru' ? 'bg-[var(--on-surface)] text-[var(--surface)]' : 'bg-[var(--surface-dim)] text-[var(--on-surface)]'}`}>Русский</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}'''

# Replace the messy end with a clean one
content = re.sub(
    r'                              <\/button>\s*\}\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/>\s*\)\}\s*<\/div>\s*<\/main>\s*<\/motion\.div>\s*<\/div>\s*\)\}\s*<\/AnimatePresence>\s*\)\;\s*\}\s*$',
    replacement,
    content,
    flags=re.DOTALL
)

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

ending = """                        </div>
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
}
"""

content = re.sub(
    r'                          <\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/main>\s*<\/motion\.div>\s*<\/div>\s*\)\}\s*<\/AnimatePresence>\s*\)\;\s*\}\s*$',
    ending,
    content,
    flags=re.DOTALL
)

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

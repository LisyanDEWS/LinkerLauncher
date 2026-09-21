import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

ending = """                      </div>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
"""

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content.strip() + '\n' + ending)

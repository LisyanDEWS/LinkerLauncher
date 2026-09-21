import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('hover:bg-red-500/10 hover:text-red-500 hover:border-red-500', 'hover:text-[var(--accent)] hover:border-[var(--accent)]')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/SettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('hover:text-red-500 hover:border-red-500', 'hover:text-[var(--accent)] hover:border-[var(--accent)]')

with open('src/components/SettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix playChime type
content = content.replace("const playChime = (type: 'click' | 'alert' | 'reset' = 'click') => {", "const playChime = (type: 'click' | 'alert' | 'reset' | 'victory' | 'toast' = 'click') => {")

# Add useMemo to imports if missing
if 'useMemo' not in content[:500]:
    content = content.replace('useState, useEffect, useRef', 'useState, useEffect, useRef, useMemo')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    f_content = f.read()

# Fix Duplicate identifier 'Maximize'
f_content = f_content.replace('  Maximize,\n  Minimize,\n', '')

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f_content = f_content.replace('X,\n  Maximize,\n  Minimize,', 'X,')
    f.write(f_content)


import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the hardcoded array in standby backgrounds with `backgrounds`
pattern = r'\{\[\s*\{ id: \'theme\', name: \'Theme\', style: \'var\(--bg\)\' \},\s*\{ id: \'gradient-1\', name: \'Aurora\', style: \'linear-gradient\(135deg, #1e3a8a, #4c1d95, #9d174d\)\' \},\s*\{ id: \'gradient-2\', name: \'Ocean\', style: \'linear-gradient\(135deg, #064e3b, #0f766e, #1d4ed8\)\' \},\s*\{ id: \'gradient-3\', name: \'Sunset\', style: \'linear-gradient\(135deg, #7f1d1d, #c2410c, #ca8a04\)\' \},\s*\{ id: \'gradient-4\', name: \'Midnight\', style: \'linear-gradient\(135deg, #171717, #262626, #404040\)\' \},\s*\]\.map\(\(g\) => \('
replacement = r'{backgrounds.map((g) => ('

content = re.sub(pattern, replacement, content)

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

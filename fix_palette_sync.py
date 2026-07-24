import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find useEffect for activePaletteId and update it to also save linkerru_palette
pattern = re.compile(r'(useEffect\(\(\) => \{\n\s*localStorage\.setItem\(\'linkerru_accent\', activePaletteId\);\n\s*\}\, \[activePaletteId\]\);)', re.DOTALL)
replacement = r'''useEffect(() => {
    localStorage.setItem('linkerru_accent', activePaletteId);
    localStorage.setItem('linkerru_palette', activePalette.primary);
  }, [activePaletteId, activePalette]);'''

content = re.sub(pattern, replacement, content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

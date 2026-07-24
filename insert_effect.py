import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'const handlePaletteChange = \(paletteId: string\) => \{'
replacement = r'''useEffect(() => {
    localStorage.setItem('linkerru_palette', activePalette.primary);
  }, [activePalette]);

  const handlePaletteChange = (paletteId: string) => {'''

content = re.sub(pattern, replacement, content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

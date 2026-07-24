import re

with open('src/components/StandbySetupModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """  const p1 = activePalette.primary;
  const p2 = activePalette.secondary;
  const p3 = activePalette.tertiary;

  const gradients = [
    { id: 'theme', name: 'Theme', style: 'var(--bg)' },
    { id: 'gradient-1', name: 'Aurora', style: `linear-gradient(135deg, ${p1}, ${p2}, ${p3})` },
    { id: 'gradient-2', name: 'Ocean', style: `radial-gradient(circle at 10% 20%, ${p2} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3} 0%, transparent 50%), linear-gradient(135deg, ${p1}, var(--bg))` },
    { id: 'gradient-3', name: 'Sunset', style: `linear-gradient(to bottom right, ${p1} 0%, transparent 100%), linear-gradient(to top right, ${p3} 0%, transparent 100%), var(--bg)` },
    { id: 'gradient-4', name: 'Midnight', style: `conic-gradient(from 180deg at 50% 50%, ${p1} 0deg, ${p2} 120deg, ${p3} 240deg, ${p1} 360deg)` },
  ];"""

content = re.sub(
    r'  const gradients = \[.*?\];',
    replacement,
    content,
    flags=re.DOTALL
)

with open('src/components/StandbySetupModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

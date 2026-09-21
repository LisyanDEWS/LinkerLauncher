import re

with open('src/components/StandbyClock.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'  const getBackgroundStyle = \(\) \=\> \{.*?  const backgroundStyle = getBackgroundStyle\(\);',
    '''  const getBackgroundStyle = () => {
    if (background === 'theme') return 'var(--bg)';
        
    const p1 = activePalette.primary;
    const p2 = activePalette.secondary;
    const p3 = activePalette.tertiary;

    switch (background) {
      case 'gradient-1': return `linear-gradient(135deg, ${p1}, ${p2}, ${p3})`;
      case 'gradient-2': return `radial-gradient(circle at 10% 20%, ${p2} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3} 0%, transparent 50%), linear-gradient(135deg, ${p1}, var(--bg))`;
      case 'gradient-3': return `linear-gradient(to bottom right, ${p1} 0%, transparent 100%), linear-gradient(to top right, ${p3} 0%, transparent 100%), var(--bg)`;
      case 'gradient-4': return `conic-gradient(from 180deg at 50% 50%, ${p1} 0deg, ${p2} 120deg, ${p3} 240deg, ${p1} 360deg)`;
      default: return background;
    }
  };

  const backgroundStyle = getBackgroundStyle();''',
    content,
    flags=re.DOTALL
)

with open('src/components/StandbyClock.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

import re

def update_file(filepath, pattern, replacement):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_file('src/components/StandbySetupModal.tsx', 
    r'interface StandbySetupModalProps \{.*?\}',
    '''interface StandbySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activePalette: any;
  background: string;
  setBackground: (bg: string) => void;
  onLaunch: () => void;
}'''
)

update_file('src/components/StandbySetupModal.tsx',
    r'export default function StandbySetupModal\(\{.*?\}\: StandbySetupModalProps\) \{',
    '''export default function StandbySetupModal({ 
  isOpen, 
  onClose, 
  lang, 
  activePalette,
  background,
  setBackground,
  onLaunch
}: StandbySetupModalProps) {'''
)

update_file('src/components/StandbySetupModal.tsx',
    r'    const gradients = \[.*?\];',
    '''  const p1 = activePalette.primary;
  const p2 = activePalette.secondary;
  const p3 = activePalette.tertiary;

  const gradients = [
    { id: 'theme', name: 'Theme', style: 'var(--bg)' },
    { id: 'gradient-1', name: 'Aurora', style: `linear-gradient(135deg, ${p1}, ${p2}, ${p3})` },
    { id: 'gradient-2', name: 'Ocean', style: `radial-gradient(circle at 10% 20%, ${p2} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${p3} 0%, transparent 50%), linear-gradient(135deg, ${p1}, var(--bg))` },
    { id: 'gradient-3', name: 'Sunset', style: `linear-gradient(to bottom right, ${p1} 0%, transparent 100%), linear-gradient(to top right, ${p3} 0%, transparent 100%), var(--bg)` },
    { id: 'gradient-4', name: 'Midnight', style: `conic-gradient(from 180deg at 50% 50%, ${p1} 0deg, ${p2} 120deg, ${p3} 240deg, ${p1} 360deg)` },
  ];'''
)

update_file('src/components/StandbyClock.tsx',
    r'interface StandbyClockProps \{.*?\}',
    '''interface StandbyClockProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activePalette: any;
  background: string;
  onOpenSetup: () => void;
  clockType: 'digital' | 'analog';
  clockVariation: 1 | 2 | 3;
}'''
)

update_file('src/components/StandbyClock.tsx',
    r'export default function StandbyClock\(\{.*?\}\: StandbyClockProps\) \{',
    '''export default function StandbyClock({ isOpen, onClose, lang, activePalette, background, onOpenSetup, clockType, clockVariation }: StandbyClockProps) {
  const primaryColor = activePalette.primary;'''
)

update_file('src/components/StandbyClock.tsx',
    r'  const getBackgroundStyle = \(\) \=\> \{.*?  \};',
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
  };'''
)

# Fix App.tsx calls
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

app_content = app_content.replace('primaryColor={activePalette.primary}', 'activePalette={activePalette}')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_content)


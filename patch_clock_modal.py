import re

with open('src/components/ClockModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

props_replace = """interface ClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  primaryColor: string;
  onOpenStandbySetup: () => void;
  clockType: 'digital' | 'analog';
  setClockType: (type: 'digital' | 'analog') => void;
  clockVariation: 1 | 2 | 3;
  setClockVariation: (var: 1 | 2 | 3) => void;
}

export default function ClockModal({ isOpen, onClose, lang, primaryColor, onOpenStandbySetup, clockType, setClockType, clockVariation: variation, setClockVariation: setVariation }: ClockModalProps) {"""

content = re.sub(r'interface ClockModalProps \{.*?export default function ClockModal\(\{ isOpen, onClose, lang, primaryColor, onOpenStandbySetup \}: ClockModalProps\) \{', props_replace, content, flags=re.DOTALL)

# Remove internal state
content = re.sub(r'  const \[clockType, setClockType\] = useState<ClockType>\(\'digital\'\);\n  const \[variation, setVariation\] = useState<1 \| 2 \| 3>\(1\);', '', content)

with open('src/components/ClockModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

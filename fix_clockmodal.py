import re

with open('src/components/ClockModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('primaryColor: string;', 'activePalette: any;')
content = content.replace('primaryColor,', 'activePalette,')
content = content.replace('primaryColor}', 'activePalette.primary}')
content = content.replace('primaryColor :', 'activePalette.primary :')
content = content.replace('style={{ backgroundColor: primaryColor }}', 'style={{ backgroundColor: activePalette.primary }}')
content = content.replace('style={{ borderColor: primaryColor }}', 'style={{ borderColor: activePalette.primary }}')

with open('src/components/ClockModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace /{t.ph_toggles}/ with {t.ph_toggles}
content = content.replace('/{t.ph_toggles}/', '{t.ph_toggles}')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/data/translations.ts', 'r', encoding='utf-8') as f:
    t_content = f.read()

t_content = t_content.replace('ph_toggles: "переключатели",', 'ph_toggles: "Быстрые настройки",')
t_content = t_content.replace('ph_toggles: "quick toggles",', 'ph_toggles: "Quick Toggles",')

with open('src/data/translations.ts', 'w', encoding='utf-8') as f:
    f.write(t_content)


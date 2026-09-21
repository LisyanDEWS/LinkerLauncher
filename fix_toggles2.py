import re
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Volume2 and ensure text is clean
content = content.replace('<Volume2 size={16} />\n              <span>{t.ph_toggles}</span>', '<span>{t.ph_toggles}</span>')

# Also, there's a literal "quick toggles" on line 1236
# let's just make sure it stays or change it to just QUICK TOGGLES
# wait, the original user request: "also rename remove /переключатели/ quick toggles and icon rename to just quick toggles"
# they meant "remove /переключатели/ and the icon, rename to just 'quick toggles'"
# Okay, so I will remove the Volume2 icon.

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

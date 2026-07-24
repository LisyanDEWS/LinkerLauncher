import re
with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("['mouse_click', 'futuristic', 'tap']", "['mouse_click', 'futuristic', 'tap', 'ping', 'iphone']")

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will find <SettingsModal and remove onClickSoundChange and onNotifySoundChange
settings_modal = r'(<SettingsModal[^>]*?)(onClickSoundChange=\{[\s\S]*?onNotifySoundChange=\{[\s\S]*?localStorage\.setItem\(\'linkerru_notify_sound\', s\);\n        \}\})\s*'
content = re.sub(settings_modal, r'\1', content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

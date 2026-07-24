import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix modals
modals_to_fix = [
    'CalendarModal',
    'WeatherModal',
    'SettingsModal',
    'ServerModal',
]

for modal in modals_to_fix:
    # We will use regex to find <ModalName ... activePalette={activePalette} ... />
    # and replace activePalette={activePalette} with primaryColor={activePalette.primary}
    pattern = r'(\<' + modal + r'\b[^>]*?)activePalette=\{activePalette\}'
    content = re.sub(pattern, r'\1primaryColor={activePalette.primary}', content, flags=re.DOTALL)

# Also fix FullSettingsModalProps left over
content = content.replace('onSoundProfileChange={(p) => {\n          setSoundProfile(p);\n          localStorage.setItem(\'linkerru_sound_profile\', p);\n        }}', '')
content = content.replace('soundProfile={soundProfile}', '')

# If there are still setSoundProfile calls anywhere, remove them
content = re.sub(r'setSoundProfile\([^)]*\);', '', content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    full_settings = f.read()

# Remove the Sound Profile Selection entirely if it's still there
full_settings = re.sub(
    r'                        \{\/\* Sound Profile Selection \*\/\}.*?                            \}\)\}\s+<\/div>\s+<\/div>',
    '',
    full_settings,
    flags=re.DOTALL
)

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(full_settings)


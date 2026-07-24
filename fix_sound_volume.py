import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove my injected volume state
content = re.sub(r'  const \[volume, setVolume\] = useState<number>\(\(\) => \{\n    return Number\(localStorage\.getItem\(\'linkerru_volume\'\) \|\| \'1\'\);\n  \}\);\n', '', content)

# 2. Remove the duplicated volume prop in SettingsModal
content = re.sub(
    r'        volume=\{volume\}\n        onVolumeChange=\{\(v\) => \{\n          setVolume\(v\);\n          localStorage\.setItem\(\'linkerru_volume\', String\(v\)\);\n        \}\}\n        volume=\{soundVolume\}',
    r'        volume={soundVolume}',
    content
)

# 3. Use soundVolume in FullSettingsModal instead of volume
content = content.replace('volume={volume}', 'volume={soundVolume}')
content = content.replace('onVolumeChange={setVolume}', 'onVolumeChange={setSoundVolume}')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

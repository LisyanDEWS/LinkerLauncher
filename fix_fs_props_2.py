import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'      <FullSettingsModal\n(.*?onMainWallpaperChange=\{\(w\) => \{.*?\}\}\n)      />',
    r'      <FullSettingsModal\n\1        brightness={brightness}\n        onBrightnessChange={setBrightness}\n        volume={volume}\n        onVolumeChange={setVolume}\n      />',
    content,
    flags=re.DOTALL
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

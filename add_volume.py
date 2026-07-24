import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

volume_state = """
  const [volume, setVolume] = useState<number>(() => {
    return Number(localStorage.getItem('linkerru_volume') || '1');
  });"""

content = re.sub(
    r'(  const \[brightness, setBrightness\] = useState<number>\(\(\) => \{\n.*?  \}\);)',
    r'\1' + volume_state,
    content,
    flags=re.DOTALL
)

settings_modal_props = """        brightness={brightness}
        onBrightnessChange={(v) => {
          setBrightness(v);
          localStorage.setItem('linkerru_brightness', String(v));
        }}
        volume={volume}
        onVolumeChange={(v) => {
          setVolume(v);
          localStorage.setItem('linkerru_volume', String(v));
        }}"""

content = re.sub(
    r'        brightness=\{brightness\}\n        onBrightnessChange=\{\(v\) => \{\n          setBrightness\(v\);\n          localStorage\.setItem\(\'linkerru_brightness\', String\(v\)\);\n        \}\}',
    settings_modal_props,
    content,
    flags=re.DOTALL
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


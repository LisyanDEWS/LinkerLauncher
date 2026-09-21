import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if i + 1 == 39 and "VolumeX" in line:
        lines[i] = "  Monitor,\n"
        break

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

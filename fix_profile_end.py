import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# let's write it carefully
with open('src/App.tsx', 'w', encoding='utf-8') as f:
    for i, line in enumerate(lines):
        if i + 1 == 1337 and "</p>" in line:
            continue
        if i + 1 == 1338 and "</div>" in line:
            f.write("        </div>\n")
            continue
        f.write(line)

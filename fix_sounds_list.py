with open('src/data/sounds.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_click = "{ id: 'minimal_click', name: 'Minimal Click', url: 'https://actions.google.com/sounds/v1/ui/click.ogg' }"

if "minimal_click" not in content:
    content = content.replace("];\n\nexport const NOTIFICATION_SOUNDS", "  , " + new_click + "\n];\n\nexport const NOTIFICATION_SOUNDS")

with open('src/data/sounds.ts', 'w', encoding='utf-8') as f:
    f.write(content)

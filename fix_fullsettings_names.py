with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("name: 'Aurora'", "name: 'Gradient 1'")
content = content.replace("name: 'Ocean'", "name: 'Gradient 2'")
content = content.replace("name: 'Sunset'", "name: 'Gradient 3'")
content = content.replace("name: 'Midnight'", "name: 'Gradient 4'")

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

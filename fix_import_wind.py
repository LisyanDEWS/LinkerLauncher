import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("} , Wind from 'lucide-react';", "} from 'lucide-react';\nimport { Wind } from 'lucide-react';")

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

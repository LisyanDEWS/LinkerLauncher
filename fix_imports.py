import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { Wind } from 'lucide-react';\n", "")

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content.replace("import { Shield } from 'lucide-react';", "import { Shield, Wind } from 'lucide-react';"))

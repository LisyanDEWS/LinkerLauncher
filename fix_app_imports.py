import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add VolumeX, Shield, LogOut, Languages to lucide-react imports if not present
new_imports = "  MapPin,\n  VolumeX,\n  Shield,\n  LogOut,\n  Languages\n} from 'lucide-react';"
content = re.sub(r'  MapPin\n\} from \'lucide-react\';', new_imports, content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

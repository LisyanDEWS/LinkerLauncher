import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove <LisyanConnectModal ... />
content = re.sub(r'<LisyanConnectModal.*?/>', '', content, flags=re.DOTALL)

# Remove import LisyanConnectModal
content = re.sub(r'import LisyanConnectModal from \'\./components/LisyanConnectModal\';\n', '', content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

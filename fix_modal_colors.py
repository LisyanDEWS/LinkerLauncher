import re

with open('src/components/LisyanConnectModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('bg-[var(--primary)]', 'bg-[var(--accent)]')
content = content.replace('text-[var(--primary)]', 'text-[var(--accent)]')
content = content.replace('border-[var(--primary)]', 'border-[var(--accent)]')
content = content.replace('text-[var(--on-primary)]', 'text-white')

with open('src/components/LisyanConnectModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

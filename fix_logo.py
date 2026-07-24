import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will find the LinkerRu Logo and Agno GPT logo
content = content.replace('className="h-12 w-12 md:h-16 md:w-16 rounded-full object-cover transition-opacity border-2 border-[var(--outline-var)] shadow-sm"',
'className={`h-12 w-12 md:h-16 md:w-16 rounded-full object-cover transition-opacity border-2 border-[var(--outline-var)] shadow-sm ${theme === "dark" ? "bg-black" : "bg-white"}`}')

content = content.replace('className="w-full h-full object-contain"',
'className={`w-full h-full object-contain ${theme === "dark" ? "bg-black" : "bg-white"}`}')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


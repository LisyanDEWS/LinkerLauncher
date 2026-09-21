import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

# Fix Inputs
content = re.sub(
    r'className="w-full text-xs font-semibold py-3\.5 pl-10 pr-4 bg-\[var\(--surface\)\] border border-\[var\(--outline\)\] rounded-2xl outline-none focus:border-\[var\(--accent\)\] text-\[var\(--on-accent\)\] shadow-xs transition-colors"',
    'className="w-full text-xs font-semibold py-3.5 pl-10 pr-4 bg-transparent border-b-2 border-[var(--on-accent)]/30 outline-none focus:border-[var(--on-accent)] text-[var(--on-accent)] transition-colors rounded-none placeholder-[var(--on-accent)]/50"',
    content
)
content = re.sub(
    r'className="w-full text-xs font-semibold py-3\.5 pl-10 pr-10 bg-\[var\(--surface\)\] border border-\[var\(--outline\)\] rounded-2xl outline-none focus:border-\[var\(--accent\)\] text-\[var\(--on-accent\)\] shadow-xs transition-colors"',
    'className="w-full text-xs font-semibold py-3.5 pl-10 pr-10 bg-transparent border-b-2 border-[var(--on-accent)]/30 outline-none focus:border-[var(--on-accent)] text-[var(--on-accent)] transition-colors rounded-none placeholder-[var(--on-accent)]/50"',
    content
)

# Fix Secondary button
content = re.sub(
    r'className="w-full py-3\.5 px-6 rounded-2xl bg-\[var\(--surface\)\] border border-\[var\(--outline\)\] text-\[var\(--on-accent\)\] font-black text-xs uppercase tracking-wider hover:bg-\[var\(--container\)\] transition-all cursor-pointer"',
    'className="w-full py-3.5 px-6 rounded-2xl bg-transparent border border-[var(--on-accent)]/50 text-[var(--on-accent)] font-black text-xs uppercase tracking-wider hover:bg-[var(--on-accent)]/10 transition-all cursor-pointer"',
    content
)

# Fix Back button
content = re.sub(
    r'className="flex-1 py-3 rounded-2xl border border-\[var\(--outline\)\] text-xs font-bold text-\[var\(--on-accent\)\] opacity-80 hover:bg-\[var\(--container\)\] transition-colors cursor-pointer"',
    'className="flex-1 py-3 rounded-2xl border border-[var(--on-accent)]/40 text-xs font-bold text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 transition-colors cursor-pointer"',
    content
)

# Also fix the eye icon
content = content.replace('text-[var(--on-surface-var)] hover:text-[var(--on-surface)]', 'text-[var(--on-accent)]/60 hover:text-[var(--on-accent)]')

# Replace onboarding cards background colors
content = re.sub(
    r'bg-\[var\(--surface\)\] border-\[var\(--outline-var\)\] hover:border-\[var\(--accent\)\]/50 text-\[var\(--on-accent\)\] opacity-80',
    'bg-transparent border-[var(--on-accent)]/30 hover:border-[var(--on-accent)]/60 text-[var(--on-accent)]',
    content
)

content = re.sub(
    r'bg-\[var\(--container\)\] border-\[var\(--accent\)\] text-\[var\(--on-accent\)\]',
    'bg-[var(--on-accent)]/10 border-[var(--on-accent)] text-[var(--on-accent)]',
    content
)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)

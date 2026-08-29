import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

# Replace any lingering bg-[var(--surface)] within the main block (between <main and </main>)
main_start = content.find('<main')
main_end = content.find('</main>')

if main_start != -1 and main_end != -1:
    main_content = content[main_start:main_end]

    # Theme selection cards
    main_content = main_content.replace(
        "bg-[var(--surface)] border-[var(--outline)] text-[var(--on-accent)] hover:border-[var(--accent)]",
        "bg-transparent border-[var(--on-accent)]/30 text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 hover:border-[var(--on-accent)]/60"
    )

    # Font selection cards
    main_content = main_content.replace(
        "bg-[var(--surface)] border-[var(--outline)] hover:border-[var(--accent)]/50 text-[var(--on-accent)] opacity-80",
        "bg-transparent border-[var(--on-accent)]/30 hover:bg-[var(--on-accent)]/10 hover:border-[var(--on-accent)]/60 text-[var(--on-accent)]"
    )
    
    # Checkbox for terms
    main_content = main_content.replace(
        "border-[var(--outline)] bg-[var(--surface)]",
        "border-[var(--on-accent)]/40 bg-transparent"
    )
    main_content = main_content.replace(
        "bg-[var(--surface)] border-[var(--accent)]",
        "bg-[var(--on-accent)]/10 border-[var(--on-accent)]"
    )

    # Arrow buttons in clock selection
    main_content = main_content.replace(
        "bg-[var(--surface)] border border-[var(--outline)] flex items-center justify-center text-[var(--on-accent)] shadow-sm hover:bg-[var(--accent)] hover:text-[var(--on-accent)]",
        "bg-[var(--on-accent)]/20 border border-[var(--on-accent)]/40 flex items-center justify-center text-[var(--on-accent)] hover:bg-[var(--on-accent)]/40"
    )

    # Clock background
    main_content = main_content.replace(
        "border-2 border-[var(--on-surface)] bg-[var(--surface)]",
        "border-2 border-[var(--on-accent)] bg-[var(--accent)]"
    )

    content = content[:main_start] + main_content + content[main_end:]

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)

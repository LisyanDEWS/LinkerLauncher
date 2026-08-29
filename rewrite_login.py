import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

# 1. Modify the layout structure to make M3LoadingIndicator the background
old_layout = """      {/* Main Centered Hub: The Big M3 Loading Element Hero */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md flex flex-col items-center justify-center relative">
          {/* Centered Large M3 Loading Element — Pure Minimalist & Expressive Matte Finish */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="relative w-36 h-36 md:w-40 md:h-40 flex items-center justify-center">
              {/* Fluid M3 shape morphing canvas — pure matte vector */}
              <M3LoadingIndicator 
                size={136} 
                color="var(--accent)" 
                speed={isSpinningFast ? 3.6 : 0.95} 
              />
            </div>
          </div>

          {/* Dynamic Content Stages Inside/Under the Loader */}
          <div className="w-full flex flex-col items-center">"""

new_layout = """      {/* Main Centered Hub: The Big M3 Loading Element Hero */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-8 z-10 relative overflow-hidden">
        {/* Background Large Loader */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <M3LoadingIndicator 
            size={560} 
            color="var(--accent)" 
            speed={isSpinningFast ? 0.2 : 0.08} 
          />
        </div>

        <div className="w-full max-w-md flex flex-col items-center justify-center relative z-10 text-[var(--on-accent)]">
          {/* Dynamic Content Stages Inside/Under the Loader */}
          <div className="w-full flex flex-col items-center drop-shadow-sm">"""

content = content.replace(old_layout, new_layout)

# 2. Replace colors in all forms (flow === ...) up to the AnimatePresence end
# We can do some targeted regex replacements for the text colors inside the main block.
# Only replace inside the <main> block
main_start = content.find('<main')
main_end = content.find('</main>')

if main_start != -1 and main_end != -1:
    main_content = content[main_start:main_end]

    # Typography
    main_content = main_content.replace('text-[var(--on-surface)]', 'text-[var(--on-accent)]')
    main_content = main_content.replace('text-[var(--on-surface-var)]', 'text-[var(--on-accent)] opacity-80')
    main_content = main_content.replace('text-[var(--accent)]', 'text-[var(--on-accent)]')
    
    # Inputs
    # "bg-[var(--surface)] border border-[var(--outline)] rounded-2xl outline-none focus:border-[var(--accent)] text-[var(--on-surface)] shadow-xs transition-colors"
    # to "bg-transparent border-b-2 border-[var(--on-accent)]/30 outline-none focus:border-[var(--on-accent)] text-[var(--on-accent)] transition-colors rounded-none px-2"
    input_old_regex = r'bg-\[var\(--surface\)\] border border-\[var\(--outline\)\] rounded-2xl outline-none focus:border-\[var\(--accent\)\] text-\[var\(--on-surface\)\] shadow-xs transition-colors'
    input_new = 'bg-transparent border-b-2 border-[var(--on-accent)]/30 outline-none focus:border-[var(--on-accent)] text-[var(--on-accent)] transition-colors rounded-none px-2'
    main_content = re.sub(input_old_regex, input_new, main_content)

    # Secondary button (outline)
    btn_sec_old = r'bg-\[var\(--surface\)\] border border-\[var\(--outline\)\] text-\[var\(--on-surface\)\] font-black text-xs uppercase tracking-wider hover:bg-\[var\(--container\)\] transition-all cursor-pointer'
    btn_sec_new = 'bg-transparent border border-[var(--on-accent)]/50 text-[var(--on-accent)] font-black text-xs uppercase tracking-wider hover:bg-[var(--on-accent)]/10 transition-all cursor-pointer'
    main_content = re.sub(btn_sec_old, btn_sec_new, main_content)

    # Primary button
    btn_prim_old = r'bg-\[var\(--accent\)\] text-\[var\(--on-accent\)\] font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-90 transition-all cursor-pointer'
    btn_prim_new = 'bg-[var(--on-accent)] text-[var(--accent)] font-black text-xs uppercase tracking-wider shadow-lg hover:bg-opacity-90 transition-all cursor-pointer'
    main_content = re.sub(btn_prim_old, btn_prim_new, main_content)
    
    # The smaller buttons inside forms
    # Back button
    btn_back_old = r'border border-\[var\(--outline\)\] text-xs font-bold text-\[var\(--on-surface-var\)\] hover:bg-\[var\(--container\)\] transition-colors cursor-pointer'
    btn_back_new = 'border border-[var(--on-accent)]/40 text-xs font-bold text-[var(--on-accent)] hover:bg-[var(--on-accent)]/10 transition-colors cursor-pointer'
    main_content = re.sub(btn_back_old, btn_back_new, main_content)

    # Submit button
    btn_submit_old = r'bg-\[var\(--accent\)\] text-\[var\(--on-accent\)\] text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer'
    btn_submit_new = 'bg-[var(--on-accent)] text-[var(--accent)] text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer'
    main_content = re.sub(btn_submit_old, btn_submit_new, main_content)

    # Onboarding cards / active states
    # Unselected card
    card_unsel_old = r'bg-\[var\(--surface\)\] border-\[var\(--outline-var\)\] hover:border-\[var\(--accent\)\]\/50 text-\[var\(--on-surface-var\)\]'
    card_unsel_new = 'bg-transparent border-[var(--on-accent)]/30 hover:border-[var(--on-accent)]/60 text-[var(--on-accent)]/80'
    main_content = re.sub(card_unsel_old, card_unsel_new, main_content)

    # Selected card
    card_sel_old = r'bg-\[var\(--container\)\] border-\[var\(--accent\)\] text-\[var\(--accent\)\]'
    card_sel_new = 'bg-[var(--on-accent)]/10 border-[var(--on-accent)] text-[var(--on-accent)]'
    main_content = re.sub(card_sel_old, card_sel_new, main_content)
    
    # Toggle switch background
    main_content = main_content.replace('bg-[var(--outline-var)]', 'bg-[var(--on-accent)]/30')
    # main_content = main_content.replace('bg-[var(--accent)]', 'bg-[var(--on-accent)]') # Wait, this might affect everything
    
    # Let's write main_content back
    content = content[:main_start] + main_content + content[main_end:]

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)

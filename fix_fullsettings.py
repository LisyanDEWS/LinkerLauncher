import re

with open('src/components/FullSettingsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the second language tab
content = re.sub(r'                    \{activeTab === \'language\' && \(\s*<div className="space-y-6" id="page-language-view">\s*<div className="flex flex-col p-4 bg-\[var\(--surface\)\] border border-\[var\(--outline-var\)\] rounded-2xl gap-3">\s*<div className="text-sm font-bold text-\[var\(--on-surface\)\]">\s*\{lang === \'ru\' \? \'Язык приложения\' : \'App Language\'\}\s*</div>\s*<div className="flex gap-2">\s*<button onClick=\{[^}]+\} className=\{[^}]+\}>English</button>\s*<button onClick=\{[^}]+\} className=\{[^}]+\}>Русский</button>\s*</div>\s*</div>\s*</div>\s*\)\}\s*', '', content)

# 2. Rename Linker OS to Linker R Launcher
content = content.replace('Linker OS', 'Linker R Launcher')
content = content.replace('LinkerOS', 'Linker R Launcher')

# 3. Remove update/license buttons
content = re.sub(r'<div className="flex gap-4 mt-6">\s*<button className="px-4 py-2 rounded-xl bg-\[var\(--container\)\] text-\[var\(--on-surface\)\] font-bold text-xs hover:bg-\[var\(--surface-dim\)\] transition-colors border border-\[var\(--outline-var\)\]">\s*\{lang === \'ru\' \? \'Проверить обновления\' : \'Check for Updates\'\}\s*</button>\s*<button className="px-4 py-2 rounded-xl bg-\[var\(--container\)\] text-\[var\(--on-surface\)\] font-bold text-xs hover:bg-\[var\(--surface-dim\)\] transition-colors border border-\[var\(--outline-var\)\]">\s*\{lang === \'ru\' \? \'Лицензии\' : \'Licenses\'\}\s*</button>\s*</div>', '', content)

# 4. Fix color swatches rendering ("the cards are slightly misaligned ... the 'Shaveling hacks' and the color palette are too close to the letters. All palettes should always be at the bottom")
# change `flex-col gap-2.5` to `flex-col justify-between min-h-[90px]`
content = content.replace('flex-col gap-2.5 transition-all relative', 'flex-col justify-between min-h-[95px] gap-3 transition-all relative')

with open('src/components/FullSettingsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

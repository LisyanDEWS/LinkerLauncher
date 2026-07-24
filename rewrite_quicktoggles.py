import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# For Theme toggle
content = re.sub(
    r'<div className={`p-2 rounded-full transition-colors \$\{theme === \'dark\' \? \'bg-\[var\(--on-surface\)\] text-\[var\(--surface\)\]\' : \'bg-\[var\(--surface-dim\)\] text-\[var\(--on-surface\)\] group-hover:bg-\[var\(--container\)\]\'\}`}>\s*\{theme === \'dark\' \? <Moon size=\{14\} /> : <Sun size=\{14\} />\}\s*</div>',
    """<div className="p-2 rounded-full transition-colors flex items-center justify-center" style={{ backgroundColor: theme === 'dark' ? activePalette.primary : 'var(--surface-dim)', color: theme === 'dark' ? 'white' : 'var(--on-surface)' }}>
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              </div>""",
    content
)

# For Language toggle
content = re.sub(
    r'<div className="p-2 rounded-full bg-\[var\(--surface-dim\)\] text-\[var\(--on-surface\)\] group-hover:bg-\[var\(--container\)\] transition-colors">\s*<Languages size=\{14\} />\s*</div>',
    """<div className="p-2 rounded-full transition-colors flex items-center justify-center" style={{ backgroundColor: lang === 'ru' ? activePalette.primary : 'var(--surface-dim)', color: lang === 'ru' ? 'white' : 'var(--on-surface)' }}>
                <Languages size={14} />
              </div>""",
    content
)

# For Sound toggle
content = re.sub(
    r'<div className={`p-2 rounded-full transition-colors \$\{isSoundEnabled \? \'bg-\[var\(--on-surface\)\] text-\[var\(--surface\)\]\' : \'bg-\[var\(--surface-dim\)\] text-\[var\(--on-surface\)\] group-hover:bg-\[var\(--container\)\]\'\}`}>\s*\{isSoundEnabled \? <Volume2 size=\{14\} /> : <VolumeX size=\{14\} />\}\s*</div>',
    """<div className="p-2 rounded-full transition-colors flex items-center justify-center" style={{ backgroundColor: isSoundEnabled ? activePalette.primary : 'var(--surface-dim)', color: isSoundEnabled ? 'white' : 'var(--on-surface)' }}>
                {isSoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </div>""",
    content
)

# For Contrast toggle
content = re.sub(
    r'<div className={`p-2 rounded-full transition-colors \$\{isContrast \? \'bg-\[var\(--on-surface\)\] text-\[var\(--surface\)\]\' : \'bg-\[var\(--surface-dim\)\] text-\[var\(--on-surface\)\] group-hover:bg-\[var\(--container\)\]\'\}`}>\s*<Monitor size=\{14\} />\s*</div>',
    """<div className="p-2 rounded-full transition-colors flex items-center justify-center" style={{ backgroundColor: isContrast ? activePalette.primary : 'var(--surface-dim)', color: isContrast ? 'white' : 'var(--on-surface)' }}>
                <Monitor size={14} />
              </div>""",
    content
)

# For Privacy toggle (we don't have a state for this, it's just visually on, maybe use activePalette.primary always?)
content = re.sub(
    r'<div className="p-2 rounded-full bg-\[var\(--on-surface\)\] text-\[var\(--surface\)\] transition-colors">\s*<Shield size=\{14\} />\s*</div>',
    """<div className="p-2 rounded-full transition-colors flex items-center justify-center" style={{ backgroundColor: activePalette.primary, color: 'white' }}>
                <Shield size={14} />
              </div>""",
    content
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

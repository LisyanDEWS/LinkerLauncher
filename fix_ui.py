import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix grid columns for Row 1
content = re.sub(
    r'<main className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" id="row1-bento-grid">',
    r'<main className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="row1-bento-grid">',
    content
)

# 2. Extract Quick Apps panel
quick_apps_pattern = r'\{\/\* WIDGET 5: App Launcher \*\/\}\s*<div className="card panel-gradient rounded-3xl p-6 flex flex-col min-h-\[240px\] transition-all relative overflow-hidden" id="card-app-launcher">.*?<\/span>\s*<\/div>'
quick_apps_match = re.search(quick_apps_pattern, content, re.DOTALL)
if quick_apps_match:
    quick_apps_html = quick_apps_match.group(0)
    # Remove from row 1
    content = content.replace(quick_apps_html, '')
    
    # Replace Locked Card 1 in row 2
    locked_card_1_pattern = r'\{\/\* LOCKED CARD 1 \*\/\}\s*<div className="card panel-gradient rounded-3xl p-6 flex flex-col justify-between min-h-\[220px\] opacity-75 transition-all hover:scale-\[1\.02\] active:scale-\[0\.98\]" id="card-locked-1">.*?<\/button>\s*<\/div>'
    
    content = re.sub(locked_card_1_pattern, quick_apps_html, content, flags=re.DOTALL)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// replace rounded-full with rounded-2xl in panel-links
const oldLink = `className="flex-1 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--outline)] text-xs font-bold text-[var(--on-surface)] transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 overflow-hidden"`;
const newLink = `className="flex-1 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[var(--outline)] text-xs font-bold text-[var(--on-surface)] transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 overflow-hidden"`;
content = content.replace(oldLink, newLink);

fs.writeFileSync('src/App.tsx', content);
console.log('patched');

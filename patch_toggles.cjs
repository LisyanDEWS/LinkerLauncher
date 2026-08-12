const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldGridStart = `<div className="grid grid-cols-2 gap-3 flex-1 content-start mt-2">`;
const newGridStart = `<div className="grid grid-cols-2 gap-2 flex-1 content-start mt-2">`;
content = content.replace(oldGridStart, newGridStart);

content = content.replaceAll('<Moon size={16} />', '<Moon size={14} />');
content = content.replaceAll('<Sun size={16} />', '<Sun size={14} />');
content = content.replaceAll('<Languages size={16} />', '<Languages size={14} />');
content = content.replaceAll('<Volume2 size={16} />', '<Volume2 size={14} />');
content = content.replaceAll('<VolumeX size={16} />', '<VolumeX size={14} />');
content = content.replaceAll('<Monitor size={16} />', '<Monitor size={14} />');
content = content.replaceAll('<SunMoon size={16} />', '<SunMoon size={14} />');

const oldBtn = `className={\`flex items-center gap-3 p-3.5 rounded-[28px] border border-[var(--outline-var)] transition-all hover:scale-[1.02] active:scale-[0.98] \${`;
const newBtn = `className={\`flex items-center gap-2 p-2 px-3 rounded-2xl border border-[var(--outline-var)] transition-all hover:scale-[1.02] active:scale-[0.98] \${`;
content = content.replace(oldBtn, newBtn);

const oldIconBox = `<div className={\`flex items-center justify-center shrink-0 w-8 h-8 rounded-full \${`;
const newIconBox = `<div className={\`flex items-center justify-center shrink-0 w-7 h-7 rounded-xl \${`;
content = content.replace(oldIconBox, newIconBox);

const oldTitle = `className={\`text-[12px] font-black leading-tight truncate w-full \${activeCfg.active ? 'text-white' : 'text-[var(--on-surface)]'}\`}`;
const newTitle = `className={\`text-[10px] font-extrabold leading-tight truncate w-full \${activeCfg.active ? 'text-white' : 'text-[var(--on-surface)]'}\`}`;
content = content.replace(oldTitle, newTitle);

const oldSub = `className={\`text-[9px] font-bold truncate w-full mt-0.5 \${activeCfg.active ? 'text-white/80' : 'text-[var(--on-surface-var)]'}\`}`;
const newSub = `className={\`text-[8px] font-bold truncate w-full mt-0.5 \${activeCfg.active ? 'text-white/80' : 'text-[var(--on-surface-var)]'}\`}`;
content = content.replace(oldSub, newSub);

fs.writeFileSync('src/App.tsx', content);
console.log('patched');

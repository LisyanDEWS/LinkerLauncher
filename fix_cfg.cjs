const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /\} as any;\n                const activeCfg = cfgMap\[id as keyof typeof cfgMap\];/;
content = content.replace(regex, `} as Record<string, any>;\n                const activeCfg = cfg[id];`);

content = content.replaceAll('cfg.active', 'activeCfg.active');
content = content.replaceAll('cfg.onClick', 'activeCfg.onClick');
content = content.replaceAll('cfg.icon', 'activeCfg.icon');
content = content.replaceAll('cfg.label', 'activeCfg.label');
content = content.replaceAll('cfg.sub', 'activeCfg.sub');

fs.writeFileSync('src/App.tsx', content);
console.log('fixed cfg');

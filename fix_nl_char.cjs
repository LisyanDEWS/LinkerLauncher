const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace('\\n  const handleNightLightToggle', '\n  const handleNightLightToggle');
fs.writeFileSync('src/App.tsx', content);

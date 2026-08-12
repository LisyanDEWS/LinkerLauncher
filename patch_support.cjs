const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace openSupportWindow
content = content.replace(
  /const openSupportWindow = \(\) => {[\s\S]*?render: \(\) => <SupportApp[^>]*>,\s*\}\);\s*\};/m,
  "const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);\n  const openSupportWindow = () => setIsSupportChatOpen(true);"
);

// We need to make sure useState is used for isSupportChatOpen.
// Let's add it near other states.
// Actually, I can just place the useState inside the main App function.
// Let's see if there's a better way. The above replace puts it inside App function! (openSupportWindow is inside App).
// Let's verify.
fs.writeFileSync('src/App.tsx', content);
console.log('Patched');

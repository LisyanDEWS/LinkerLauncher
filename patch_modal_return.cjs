const fs = require('fs');
let content = fs.readFileSync('src/components/LisyanConnectModal.tsx', 'utf-8');

const beforeReturn = `  if (!isOpen) return null;

  return (
    <motion.div`;

const afterReturn = `  return (
    <motion.div`;

content = content.replace(beforeReturn, afterReturn);
fs.writeFileSync('src/components/LisyanConnectModal.tsx', content);

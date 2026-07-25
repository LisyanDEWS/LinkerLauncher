const fs = require('fs');
let content = fs.readFileSync('src/components/lisyanconnect-useP2P.ts', 'utf-8');

const targetSend = `      if (!e.target?.result || !ch.current) return;
      ch.current.send(e.target.result as ArrayBuffer);
      offset += (e.target.result as ArrayBuffer).byteLength;`;

const replacementSend = `      if (!e.target?.result || !ch.current) return;
      try {
        ch.current.send(e.target.result as ArrayBuffer);
        offset += (e.target.result as ArrayBuffer).byteLength;
      } catch (err) {
        console.error("WebRTC send error:", err);
        setTimeout(readSlice, 100);
        return;
      }`;

content = content.replace(targetSend, replacementSend);
fs.writeFileSync('src/components/lisyanconnect-useP2P.ts', content);

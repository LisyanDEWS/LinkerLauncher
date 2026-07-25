const fs = require('fs');
let content = fs.readFileSync('src/components/lisyanconnect-useP2P.ts', 'utf-8');

const targetBuffer = `            if (offset < file.size) {
        if (ch.current.bufferedAmount > 2000000) {
          setTimeout(readSlice, 20);
        } else {
          readSlice();
        }
      } else {`;

const replacementBuffer = `            if (offset < file.size) {
        const sendNext = () => {
          if (!ch.current) return;
          if (ch.current.bufferedAmount > 2000000) {
            setTimeout(sendNext, 50);
          } else {
            readSlice();
          }
        };
        sendNext();
      } else {`;

content = content.replace(targetBuffer, replacementBuffer);
fs.writeFileSync('src/components/lisyanconnect-useP2P.ts', content);

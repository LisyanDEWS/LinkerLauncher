const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
let depth = 0;
for(let i=0; i<content.length; i++) {
  if (content[i] === '{') depth++;
  else if (content[i] === '}') {
    depth--;
    if (depth < 0) {
      console.log(`Extra closing brace found at line ${content.substring(0, i).split('\n').length}`);
      break;
    }
  }
}
console.log('Final depth:', depth);

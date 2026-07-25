const fs = require('fs');
let content = fs.readFileSync('src/components/lisyanconnect-useP2P.ts', 'utf-8');

content = content.replace(
  "import { collection, doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';",
  "import { collection, doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';"
);

// Host candidates
content = content.replace(
  /getDoc\(roomRef\)\.then\(\(snap\) => \{\s+if \(\!snap\.exists\(\)\) return;\s+const currentCandidates = snap\.data\(\)\.hostCandidates \|\| \[\];\s+updateDoc\(roomRef, \{\s+hostCandidates: \[\.\.\.currentCandidates, event\.candidate\.toJSON\(\)\]\s+\}\);\s+\}\);/g,
  "updateDoc(roomRef, { hostCandidates: arrayUnion(event.candidate.toJSON()) });"
);

// Guest candidates
content = content.replace(
  /getDoc\(roomRef\)\.then\(\(snap\) => \{\s+if \(\!snap\.exists\(\)\) return;\s+const currentCandidates = snap\.data\(\)\.guestCandidates \|\| \[\];\s+updateDoc\(roomRef, \{\s+guestCandidates: \[\.\.\.currentCandidates, event\.candidate\.toJSON\(\)\]\s+\}\);\s+\}\);/g,
  "updateDoc(roomRef, { guestCandidates: arrayUnion(event.candidate.toJSON()) });"
);

fs.writeFileSync('src/components/lisyanconnect-useP2P.ts', content);

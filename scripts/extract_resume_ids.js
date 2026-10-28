const fs = require('fs');
const content = fs.readFileSync('disheera/client/resume-builder.html', 'utf8');
const idMatches = content.matchAll(/id=["']([^"']+)["']/g);
const ids = Array.from(idMatches, m => m[1]);
console.log('Total IDs in resume-builder.html:', ids.length);
console.log(JSON.stringify(ids, null, 2));

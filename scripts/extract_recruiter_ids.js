const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../client/recruiter-dashboard.html');
const content = fs.readFileSync(filePath, 'utf8');
const idRegex = /id=["']([^"']+)["']/g;
const ids = new Set();
let match;
while ((match = idRegex.exec(content)) !== null) {
  ids.add(match[1]);
}

console.log('Total unique IDs in recruiter-dashboard.html:', ids.size);
console.log(JSON.stringify(Array.from(ids).sort(), null, 2));

function extractIds(file) {
  const p = path.join(__dirname, '../client/js', file);
  if (!fs.existsSync(p)) return [];
  const src = fs.readFileSync(p, 'utf8');
  const re = /getElementById\(['"]([^'"]+)['"]\)/g;
  const s = new Set();
  let m;
  while ((m = re.exec(src)) !== null) s.add(m[1]);
  return Array.from(s).sort();
}

console.log('\n--- recruiter.js IDs ---');
console.log(extractIds('recruiter.js'));

console.log('\n--- tpo-cockpit.js IDs ---');
console.log(extractIds('tpo-cockpit.js'));


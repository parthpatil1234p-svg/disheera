/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const fs = require('fs');
const path = require('path');

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules') walk(p);
    } else if (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.svg')) {
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes('height="auto"') || content.includes("height='auto'") || content.includes('height: auto') || content.includes('height:auto')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('<svg') && (line.includes('height="auto"') || line.includes("height='auto'"))) {
            console.log(`[SVG MATCH] ${p}:${idx + 1} -> ${line.trim()}`);
          }
        });
      }
    }
  }
}

walk('client');
console.log('Search complete.');

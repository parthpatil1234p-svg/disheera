/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const fs = require('fs');
const path = require('path');

const cssFiles = [
  'tokens.css', 'base.css', 'layout.css', 'components.css',
  'pages.css', 'three.css', 'notch-navbar.css', 'scroll-dissolve.css'
];

const fontSizes = new Set();
const colors = new Set();
const radii = new Set();
const buttonStyles = new Set();

cssFiles.forEach(file => {
  const p = path.join('client/css', file);
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');

  // Extract font-sizes
  const fsMatches = content.matchAll(/font-size:\s*([^;!}\n]+)/g);
  for (const m of fsMatches) {
    fontSizes.add(m[1].trim());
  }

  // Extract text colors
  const colMatches = content.matchAll(/(?:^|;|\s)color:\s*([^;!}\n]+)/g);
  for (const m of colMatches) {
    colors.add(m[1].trim());
  }

  // Extract border radii
  const radMatches = content.matchAll(/border-radius:\s*([^;!}\n]+)/g);
  for (const m of radMatches) {
    radii.add(m[1].trim());
  }
});

console.log('Distinct font-sizes count:', fontSizes.size);
console.log('Font-sizes:', Array.from(fontSizes).sort());

console.log('\nDistinct colors count:', colors.size);
console.log('Colors:', Array.from(colors).sort());

console.log('\nDistinct radii count:', radii.size);
console.log('Radii:', Array.from(radii).sort());

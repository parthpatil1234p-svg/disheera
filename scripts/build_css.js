/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '../client/css');

const imports = [
  'tokens.css',
  'base.css',
  'layout.css',
  'components.css',
  'pages.css',
  'three.css',
  'roadmap.css',
  'dashboard.css',
  'chat.css',
  'radial-glow-button.css',
  'notch-navbar.css',
  'animated-icons.css',
  'typing-character-fx.css',
  'quiz.css',
  'scroll-dissolve.css',
  'usability-overrides.css'
];

let bundledParts = ['/* Disheera — Consolidated Production Stylesheet */\n'];

for (const f of imports) {
  const filePath = path.join(cssDir, f);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanLines = content.splitlines ? content.splitlines() : content.split('\n');
    const filtered = cleanLines.filter(l => !l.trim().startsWith('@import'));
    bundledParts.push(`/* --- Module: ${f} --- */\n` + filtered.join('\n') + '\n');
  }
}

const fullBundle = bundledParts.join('\n');
fs.writeFileSync(path.join(cssDir, 'style.bundle.css'), fullBundle, 'utf8');

// For style.min.css, we also append usability-overrides to existing style.min.css if needed,
// or minify the fullBundle
fs.writeFileSync(path.join(cssDir, 'style.css'), fullBundle, 'utf8');

// Append usability-overrides to style.min.css
const usabilityContent = fs.readFileSync(path.join(cssDir, 'usability-overrides.css'), 'utf8');
let currentMin = fs.readFileSync(path.join(cssDir, 'style.min.css'), 'utf8');
if (!currentMin.includes('Floto Usability Heuristics Normalization')) {
  currentMin += '\n/* Floto Usability Heuristics Normalization */\n' + usabilityContent;
  fs.writeFileSync(path.join(cssDir, 'style.min.css'), currentMin, 'utf8');
} else {
  // Update it
  const idx = currentMin.indexOf('/* Floto Usability Heuristics Normalization */');
  currentMin = currentMin.substring(0, idx) + '/* Floto Usability Heuristics Normalization */\n' + usabilityContent;
  fs.writeFileSync(path.join(cssDir, 'style.min.css'), currentMin, 'utf8');
}

console.log(`Successfully compiled CSS bundle: ${fullBundle.length} bytes`);

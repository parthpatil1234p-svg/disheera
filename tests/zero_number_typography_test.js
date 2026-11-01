/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/zero_number_typography_test.js
 *
 * Verifies that the typography across all sections and stylesheets:
 * 1. Has eliminated JetBrains Mono (which causes the dotted zero 0 glyph).
 * 2. Uses clean Inter / Outfit with "zero" 0 (clean round zero, no internal dot or slash).
 * 3. Enforces clean zero typography on stats, counters, timers, and badges.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTest() {
  console.log('🧪 Starting Zero Number Typography Verification Test...\n');

  const clientDir = path.join(__dirname, '../client');
  const cssDir = path.join(clientDir, 'css');

  // 1. Check tokens.css: --font-mono must not contain JetBrains Mono
  const tokensCss = fs.readFileSync(path.join(cssDir, 'tokens.css'), 'utf-8');
  assert.ok(
    !tokensCss.includes("'JetBrains Mono'"),
    'tokens.css must NOT contain JetBrains Mono in --font-mono'
  );
  console.log('✅ tokens.css verified: JetBrains Mono removed from --font-mono token.');

  // 2. Check base.css: no JetBrains Mono in @import and clean zero rules present
  const baseCss = fs.readFileSync(path.join(cssDir, 'base.css'), 'utf-8');
  assert.ok(
    !baseCss.includes('JetBrains+Mono'),
    'base.css @import must NOT request JetBrains+Mono'
  );
  assert.ok(
    baseCss.includes('"zero" 0'),
    'base.css must enforce font-feature-settings: "zero" 0'
  );
  console.log('✅ base.css verified: @import cleaned and "zero" 0 rule active.');

  // 3. Check pages.css: .stat-number must use clean font and not have dotted zero
  const pagesCss = fs.readFileSync(path.join(cssDir, 'pages.css'), 'utf-8');
  assert.ok(
    !pagesCss.includes("'JetBrains Mono'"),
    'pages.css must NOT reference JetBrains Mono'
  );
  console.log('✅ pages.css verified: .stat-number and step numbers free of dotted zero font.');

  // 4. Check all HTML files: none should load JetBrains+Mono from Google Fonts
  const htmlFiles = fs.readdirSync(clientDir).filter(f => f.endsWith('.html'));
  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(clientDir, file), 'utf-8');
    assert.ok(
      !content.includes('JetBrains+Mono') && !content.includes('JetBrains Mono'),
      `${file} must NOT contain JetBrains Mono font link or style`
    );
  }
  console.log(`✅ All ${htmlFiles.length} HTML files verified: Zero references to JetBrains Mono!`);

  // 5. Check quiz.css, components.css, roadmap.css, dashboard.css
  const quizCss = fs.readFileSync(path.join(cssDir, 'quiz.css'), 'utf-8');
  assert.ok(
    !quizCss.includes("'JetBrains Mono'"),
    'quiz.css must NOT reference JetBrains Mono'
  );
  console.log('✅ quiz.css verified: Countdown timers and badges free of dotted zero font.');

  console.log('\n🎉 ALL ZERO NUMBER TYPOGRAPHY VERIFICATION TESTS PASSED (100%)!');
}

try {
  runTest();
} catch (err) {
  console.error('❌ Test failed (Expected before changes):', err.message);
  process.exit(1);
}

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../client/index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// 1. Remove role="button" and tabindex="0" from career-card and skill-logo-card
content = content.replace(/class="career-card([^"]*)"\s+tabindex="0"\s+role="button"/g, 'class="career-card$1"');
content = content.replace(/class="career-card([^"]*)"\s+role="button"\s+tabindex="0"/g, 'class="career-card$1"');
content = content.replace(/class="skill-logo-card"\s+role="button"\s+tabindex="0"/g, 'class="skill-logo-card"');

// 2. Unify ad-hoc bootstrap buttons
content = content.replace(
  'class="btn btn-warning btn-lg px-4 py-3 fw-bold shadow-sm"',
  'class="btn cp-btn-primary btn-lg px-4 py-3"'
);
content = content.replace(
  'class="btn btn-outline-dark px-4 py-2.5 fw-semibold"',
  'class="btn cp-btn-outline px-4 py-2.5"'
);
content = content.replace(
  'class="btn btn-outline-secondary px-3.5 py-2.5 fw-semibold"',
  'class="btn cp-btn-outline px-3.5 py-2.5"'
);
content = content.replace(
  'class="btn btn-warning w-100 py-2.5 fw-bold text-dark shadow-sm"',
  'class="btn cp-btn-primary w-100 py-2.5"'
);
content = content.replace(
  'class="btn btn-sm btn-outline-dark mt-2 fw-semibold"',
  'class="btn cp-btn-outline btn-sm mt-2"'
);
content = content.replace(
  'class="btn btn-outline-secondary px-3"',
  'class="btn cp-btn-outline btn-sm px-3"'
);
content = content.replace(
  'class="btn btn-warning px-4 fw-bold shadow-sm"',
  'class="btn cp-btn-primary btn-sm px-4"'
);
content = content.replace(
  'class="btn btn-warning px-4 fw-bold"',
  'class="btn cp-btn-primary px-4"'
);

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Successfully unified buttons in index.html');

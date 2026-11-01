/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const fs = require('fs');
const content = fs.readFileSync('disheera/client/assessment.html', 'utf8');
const idMatches = content.matchAll(/id=["']([^"']+)["']/g);
const ids = Array.from(idMatches, m => m[1]);
console.log('Total IDs:', ids.length);
console.log(JSON.stringify(ids, null, 2));

const formInputs = Array.from(content.matchAll(/name=["']([^"']+)["']/g), m => m[1]);
console.log('Form inputs:', formInputs);

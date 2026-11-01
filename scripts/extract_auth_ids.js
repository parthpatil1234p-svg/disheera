/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const fs = require('fs');

const login = fs.readFileSync('disheera/client/login.html', 'utf8');
const loginIds = Array.from(login.matchAll(/id=["']([^"']+)["']/g), m => m[1]);
console.log('Login IDs:', loginIds);

const reg = fs.readFileSync('disheera/client/register.html', 'utf8');
const regIds = Array.from(reg.matchAll(/id=["']([^"']+)["']/g), m => m[1]);
console.log('Register IDs count:', regIds.length);
console.log('Register IDs:', regIds);

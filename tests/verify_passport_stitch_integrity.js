/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '../client/passport.html');
const content = fs.readFileSync(htmlPath, 'utf8');

const expectedIds = [
  "btnSharePassport",
  "passportLoading",
  "passportError",
  "passportErrorTitle",
  "passportErrorMessage",
  "passportContent",
  "pAvatar",
  "pName",
  "pCredentialStatusBadge",
  "pStream",
  "pDegreeBranch",
  "pCollege",
  "pGradYear",
  "btnContactCandidateWa",
  "pLedgerHash",
  "pTimestamp",
  "mReadiness",
  "mVerifiedSkills",
  "mProjects",
  "pSkillsSummary",
  "pSkillsChipsContainer",
  "qrCodeCanvas",
  "pPassportUrl",
  "btnDownloadQr",
  "pProjectsContainer"
];

let missing = [];
for (const id of expectedIds) {
  const re = new RegExp(`id=["']${id}["']`);
  if (!re.test(content)) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.error(`FAILED: ${missing.length} missing IDs in passport.html:`, missing);
  process.exit(1);
} else {
  console.log(`SUCCESS: All ${expectedIds.length} expected DOM IDs verified in passport.html!`);
}

// Light theme verification
assert(!content.includes('bg-[#0f172a]'), 'Dark background #0f172a detected');
assert(!content.includes('bg-[#0b1120]'), 'Dark background #0b1120 detected');
assert(!content.includes('bg-[#111827]'), 'Dark background #111827 detected');

console.log('SUCCESS: Light Theme constraints verified in passport.html!');

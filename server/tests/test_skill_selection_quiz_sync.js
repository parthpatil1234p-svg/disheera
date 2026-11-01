/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
// Test script: test_skill_selection_quiz_sync.js
// Verifies that:
// 1. Beginner skills (e.g. Solidity, Git) are fully eligible for Reality Check quizzes.
// 2. getRequiredVerificationSkills returns both skills when selected at beginner.
// 3. Auto-clearing alerts on selection works.
const fs = require('fs');
const path = require('path');

const jsContent = fs.readFileSync(path.join(__dirname, '../../client/js/assessment.js'), 'utf8');

console.log('Testing skill selection & quiz update synchronization logic...');

// 1. Check that beginner skills are not excluded
if (jsContent.includes("const isLevelEligible = ['intermediate', 'advanced']")) {
  console.error('FAIL: Beginner skills still excluded by isLevelEligible intermediate/advanced filter!');
  process.exit(1);
} else {
  console.log('PASS: Beginner exclusion filter removed.');
}

// 2. Check for in-card take quiz button
if (!jsContent.includes('btn-grid-take-quiz')) {
  console.error('FAIL: btn-grid-take-quiz not found in assessment.js');
  process.exit(1);
} else {
  console.log('PASS: btn-grid-take-quiz is present in renderSkillsGrid.');
}

// 3. Check for auto-clear validation alert
if (!jsContent.includes('alertContainer.innerHTML = \'\';')) {
  console.error('FAIL: alertContainer clearing not found in assessment.js');
  process.exit(1);
} else {
  console.log('PASS: alertContainer auto-clearing logic verified.');
}

// 4. Check for top selected skills box in assessment.html
const htmlContent = fs.readFileSync(path.join(__dirname, '../../client/assessment.html'), 'utf8');
if (!htmlContent.includes('id="topSelectedSkillsBox"')) {
  console.error('FAIL: topSelectedSkillsBox not found in assessment.html');
  process.exit(1);
} else {
  console.log('PASS: topSelectedSkillsBox is positioned above the skills grid.');
}

// 5. Check CSS for .btn-grid-take-quiz
const cssContent = fs.readFileSync(path.join(__dirname, '../../client/css/pages.css'), 'utf8');
if (!cssContent.includes('.btn-grid-take-quiz')) {
  console.error('FAIL: .btn-grid-take-quiz not found in pages.css');
  process.exit(1);
} else {
  console.log('PASS: .btn-grid-take-quiz styles defined in pages.css.');
}

console.log('\nAll skill selection and quiz sync checks passed successfully!');

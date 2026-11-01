/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * test_mobile_optimization.js
 * Verification suite for mobile responsiveness and viewport integrity.
 */

const fs = require('fs');
const path = require('path');

const CLIENT_DIR = path.join(__dirname, '..', 'client');
const CSS_DIR = path.join(CLIENT_DIR, 'css');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('=== 1. VERIFYING VIEWPORT META TAGS IN ALL CLIENT HTML FILES ===');
const htmlFiles = fs.readdirSync(CLIENT_DIR).filter(f => f.endsWith('.html'));

for (const htmlFile of htmlFiles) {
  const content = fs.readFileSync(path.join(CLIENT_DIR, htmlFile), 'utf8');
  const hasViewport = /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width[^"']*["']\s*\/?>/i.test(content);
  assert(hasViewport, `${htmlFile} contains valid responsive viewport meta tag`);
}

console.log('\n=== 2. VERIFYING RESPONSIVE RULES IN NOTCH-NAVBAR.CSS ===');
const notchCss = fs.readFileSync(path.join(CSS_DIR, 'notch-navbar.css'), 'utf8');
assert(notchCss.includes('@media (max-width: 575.98px)'), 'notch-navbar.css contains @media (max-width: 575.98px) block');
assert(notchCss.includes('@media (max-width: 380px)'), 'notch-navbar.css contains @media (max-width: 380px) block');
assert(notchCss.includes('#authNavActions .nav-role-chip'), 'notch-navbar.css hides .nav-role-chip on mobile');
assert(notchCss.includes('clamp(1rem, 4.2vw, 1.2rem)'), 'notch-navbar.css uses fluid typography for brand title');

console.log('\n=== 3. VERIFYING OTP SCALING IN COMPONENTS.CSS ===');
const compCss = fs.readFileSync(path.join(CSS_DIR, 'components.css'), 'utf8');
assert(compCss.includes('@media (max-width: 440px)'), 'components.css scales OTP inputs under 440px');
assert(compCss.includes('@media (max-width: 350px)'), 'components.css scales OTP inputs under 350px');
assert(compCss.includes('width: 38px;'), 'components.css scales OTP digit width to 38px on small screens');
assert(compCss.includes('width: 32px;'), 'components.css scales OTP digit width to 32px on ultra-narrow screens (320px)');

console.log('\n=== 4. VERIFYING ASSESSMENT STEPPER & FORMS IN PAGES.CSS ===');
const pagesCss = fs.readFileSync(path.join(CSS_DIR, 'pages.css'), 'utf8');
assert(pagesCss.includes('.step-nav-mobile'), 'pages.css styles .step-nav-mobile');
assert(pagesCss.includes('@media (max-width: 991.98px)'), 'pages.css includes tablet/mobile breakpoint for assessment stepper');
assert(pagesCss.includes('.step-nav-desktop {\n    display: none !important;'), 'pages.css hides .step-nav-desktop on < 992px');
assert(pagesCss.includes('.auth-form-card {\n    padding: 1.25rem 0.85rem !important;'), 'pages.css optimizes auth-form-card padding on mobile');
assert(pagesCss.includes('grid-template-columns: repeat(3, 1fr) !important;'), 'pages.css organizes hero-stats into 3-column grid on mobile');
assert(pagesCss.includes('.recommendation-card {\n    padding: 1.25rem 0.95rem !important;'), 'pages.css scales recommendation-card padding on mobile');

console.log('\n=== 5. VERIFYING ROADMAP TIMELINE IN ROADMAP.CSS ===');
const roadmapCss = fs.readFileSync(path.join(CSS_DIR, 'roadmap.css'), 'utf8');
assert(roadmapCss.includes('.roadmap-timeline {\n    padding-left: 0 !important;'), 'roadmap.css removes timeline indentation on mobile');
assert(roadmapCss.includes('.roadmap-timeline::before {\n    display: none !important;'), 'roadmap.css hides timeline vertical line on mobile');
assert(roadmapCss.includes('.week-card {\n    padding: 1.15rem 0.85rem !important;'), 'roadmap.css adjusts week-card padding on mobile');

console.log('\n=== 6. VERIFYING RESUME PREVIEW CHAMBER IN RESUME-TEMPLATES.CSS ===');
const resumeCss = fs.readFileSync(path.join(CSS_DIR, 'resume-templates.css'), 'utf8');
assert(resumeCss.includes('@media (max-width: 991.98px)'), 'resume-templates.css has mobile/tablet breakpoint for preview chamber');
assert(resumeCss.includes('position: static !important;'), 'resume-templates.css removes sticky constraint from preview chamber on mobile');
assert(resumeCss.includes('@media (max-width: 575.98px)'), 'resume-templates.css has mobile header bar and padding rules');

console.log('\n=== 7. VERIFYING QUIZ STEPPER IN QUIZ.CSS ===');
const quizCss = fs.readFileSync(path.join(CSS_DIR, 'quiz.css'), 'utf8');
assert(quizCss.includes('@media (max-width: 575.98px)'), 'quiz.css has mobile breakpoint');
assert(quizCss.includes('width: 18px;'), 'quiz.css scales step dot width down to 18px on mobile');

console.log('\n=== 8. VERIFYING RECRUITER DASHBOARD MOBILE POLISH ===');
const recruiterHtml = fs.readFileSync(path.join(CLIENT_DIR, 'recruiter-dashboard.html'), 'utf8');
assert(recruiterHtml.includes('.recruiter-portal-page .navbar-brand .badge {\n          display: none !important;'), 'recruiter-dashboard.html hides redundant brand badge on mobile');
assert(recruiterHtml.includes('.recruiter-hero-card {\n          padding: 1.25rem 1rem !important;'), 'recruiter-dashboard.html adjusts hero card padding on mobile');

console.log(`\n======================================================`);
console.log(`RESULT: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log(`======================================================`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

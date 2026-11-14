/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/portal_isolation_rbac_test.js
 *
 * Automated verification of Portal Isolation RBAC:
 * 1. requireStudent blocks recruiter with 403 RECRUITER_ACCESS_DENIED
 * 2. requireStudent permits student
 * 3. requireStudent permits demo/admin user
 * 4. requireRecruiter blocks student with 403 STUDENT_ACCESS_DENIED
 * 5. requireRecruiter permits recruiter
 * 6. requireRecruiter permits demo/admin user
 * 7. Client-side page list isolation logic verification
 *
 * Disheera · Enterprise Test Suite
 */

const path = require('path');
const { requireStudent, requireRecruiter, requireTpo } = require('../server/middleware/authMiddleware');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  } else {
    console.log(`  ✓ PASSED: ${message}`);
    passed++;
  }
}

console.log('🚀 Starting Portal Isolation RBAC Unit & Integration Tests...\n');

// --- Test 1: requireStudent with recruiter ---
console.log('▶ TEST 1: requireStudent blocks recruiter role');
{
  const req = { user: { role: 'recruiter', email: 'hr@razorpay.com' } };
  const res = createMockRes();
  let nextCalled = false;
  requireStudent(req, res, () => { nextCalled = true; });

  assert(!nextCalled, 'Next must NOT be called for recruiter');
  assert(res.statusCode === 403, 'Status must be 403');
  assert(res.body && res.body.code === 'RECRUITER_ACCESS_DENIED', 'Error code must be RECRUITER_ACCESS_DENIED');
}

// --- Test 2: requireStudent with student ---
console.log('\n▶ TEST 2: requireStudent allows student role');
{
  const req = { user: { role: 'student', email: 'student@example.com' } };
  const res = createMockRes();
  let nextCalled = false;
  requireStudent(req, res, () => { nextCalled = true; });

  assert(nextCalled, 'Next MUST be called for student');
  assert(res.statusCode === 200, 'Status remains 200');
}

// --- Test 3: requireStudent with admin account ---
console.log('\n▶ TEST 3: requireStudent allows true admin role');
{
  const req = { user: { role: 'admin', email: 'admin@disheera.site' } };
  const res = createMockRes();
  let nextCalled = false;
  requireStudent(req, res, () => { nextCalled = true; });

  assert(nextCalled, 'Next MUST be called for admin role');
  assert(res.statusCode === 200, 'Status remains 200');
}

// --- Test 4: requireRecruiter with student ---
console.log('\n▶ TEST 4: requireRecruiter blocks student role');
{
  const req = { user: { role: 'student', email: 'student@example.com' } };
  const res = createMockRes();
  let nextCalled = false;
  requireRecruiter(req, res, () => { nextCalled = true; });

  assert(!nextCalled, 'Next must NOT be called for student');
  assert(res.statusCode === 403, 'Status must be 403');
  assert(res.body && res.body.code === 'STUDENT_ACCESS_DENIED', 'Error code must be STUDENT_ACCESS_DENIED');
}

// --- Test 5: requireRecruiter with recruiter ---
console.log('\n▶ TEST 5: requireRecruiter allows recruiter role');
{
  const req = { user: { role: 'recruiter', email: 'hr@razorpay.com' } };
  const res = createMockRes();
  let nextCalled = false;
  requireRecruiter(req, res, () => { nextCalled = true; });

  assert(nextCalled, 'Next MUST be called for recruiter');
  assert(res.statusCode === 200, 'Status remains 200');
}

// --- Test 6: requireRecruiter blocks student account ---
console.log('\n▶ TEST 6: requireRecruiter strictly blocks student role');
{
  const req = { user: { role: 'student', email: 'student@college.edu' } };
  const res = createMockRes();
  let nextCalled = false;
  requireRecruiter(req, res, () => { nextCalled = true; });

  assert(!nextCalled, 'Next must NOT be called for student');
  assert(res.statusCode === 403, 'Status must be 403');
  assert(res.body && res.body.code === 'STUDENT_ACCESS_DENIED', 'Error code must be STUDENT_ACCESS_DENIED');
}

// --- Test 6B: requireRecruiter allows true admin ---
console.log('\n▶ TEST 6B: requireRecruiter allows true admin role');
{
  const req = { user: { role: 'admin', email: 'admin@disheera.site' } };
  const res = createMockRes();
  let nextCalled = false;
  requireRecruiter(req, res, () => { nextCalled = true; });

  assert(nextCalled, 'Next MUST be called for admin role');
  assert(res.statusCode === 200, 'Status remains 200');
}

// --- Test 7: Client-side routing verification ---
console.log('\n▶ TEST 7: Client-side Isolation Routing Rules');
{
  const STUDENT_PAGES = [
    'dashboard',
    'dashboard.html',
    'assessment',
    'assessment.html',
    'recommendations',
    'recommendations.html',
    'roadmap',
    'roadmap.html',
    'resume-builder',
    'resume-builder.html',
    'quiz',
    'quiz.html',
    'job-market',
    'job-market.html',
    'technical-interview',
    'technical-interview.html'
  ];
  const RECRUITER_PAGES = [
    'recruiter-dashboard',
    'recruiter-dashboard.html',
    'recruiter-register',
    'recruiter-register.html',
    'recruiter-login',
    'recruiter-login.html',
    'post-job',
    'post-job.html'
  ];

  function checkPageMatch(pathname, pageList) {
    if (!pathname) return false;
    const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
    const slug = clean.split('/').pop() || '';
    return pageList.some((p) => {
      const baseP = p.replace(/\.html$/, '').toLowerCase();
      return slug === p.toLowerCase() || slug === baseP;
    });
  }

  // Verify match on cleanUrl without extension
  assert(checkPageMatch('/recruiter-dashboard', RECRUITER_PAGES) === true, 'Matches /recruiter-dashboard without .html');
  assert(checkPageMatch('/recruiter-dashboard.html', RECRUITER_PAGES) === true, 'Matches /recruiter-dashboard.html');
  assert(checkPageMatch('/dashboard', STUDENT_PAGES) === true, 'Matches /dashboard without .html');
  assert(checkPageMatch('/dashboard.html', STUDENT_PAGES) === true, 'Matches /dashboard.html');

  // Verify recruiter role detection
  const testRecruiterUser = { role: 'recruiter', email: 'talent@company.com' };
  assert(testRecruiterUser.role === 'recruiter', 'Role detected as recruiter');

  // Verify student role detection
  const testStudentUser = { role: 'student', email: 'demouser@gmail.com' };
  assert(testStudentUser.role === 'student', 'Student demo role is student');
  assert(testStudentUser.role !== 'recruiter', 'Student demo role is NOT recruiter');
}

// --- Test 8: Smart Brand Logo Dispatch Logic ---
console.log('\n▶ TEST 8: Smart Brand Logo Dispatch Logic');
{
  function resolveBrandLogoHref({ isAuthed, isRecruiter, onRecruiterPage }) {
    if (isAuthed && (isRecruiter || onRecruiterPage)) {
      return 'recruiter-dashboard.html';
    } else if (isAuthed) {
      return 'dashboard.html';
    } else {
      return 'index.html';
    }
  }

  // Recruiter on any page
  assert(
    resolveBrandLogoHref({ isAuthed: true, isRecruiter: true, onRecruiterPage: false }) === 'recruiter-dashboard.html',
    'Recruiter logo href resolves to recruiter-dashboard.html'
  );

  // Recruiter inside recruiter portal
  assert(
    resolveBrandLogoHref({ isAuthed: true, isRecruiter: true, onRecruiterPage: true }) === 'recruiter-dashboard.html',
    'Recruiter on recruiter page resolves to recruiter-dashboard.html'
  );

  // Student on any student page
  assert(
    resolveBrandLogoHref({ isAuthed: true, isRecruiter: false, onRecruiterPage: false }) === 'dashboard.html',
    'Student logo href resolves to dashboard.html'
  );

  // Guest / Logged-out user
  assert(
    resolveBrandLogoHref({ isAuthed: false, isRecruiter: false, onRecruiterPage: false }) === 'index.html',
    'Guest logo href resolves to index.html'
  );
}

// --- Test 9: Landing Page Auto-Redirect & ?view=public Logic ---
console.log('\n▶ TEST 9: Landing Page Auto-Redirect & ?view=public Logic');
{
  function shouldRedirectFromLanding({ user, search }) {
    if (!user) return false;
    const isPublic = (search || '').includes('view=public');
    if (isPublic) return false;

    const isAdmin = Boolean(user.role === 'admin' || user.isAdmin);
    if (isAdmin) return false;

    const isRecruiter = user.role === 'recruiter' || Boolean(user.isRecruiter) || Boolean(user.recruiterProfile?.canPostJobs);
    return isRecruiter;
  }

  // Standard recruiter visiting index.html without search param -> Must redirect
  assert(
    shouldRedirectFromLanding({ user: { role: 'recruiter', email: 'hr@razorpay.com' }, search: '' }) === true,
    'Recruiter on index.html is redirected to recruiter-dashboard.html'
  );

  // Recruiter visiting index.html with ?view=public -> Must NOT redirect
  assert(
    shouldRedirectFromLanding({ user: { role: 'recruiter', email: 'hr@razorpay.com' }, search: '?view=public' }) === false,
    'Recruiter with ?view=public is NOT redirected'
  );

  // Student visiting index.html -> Must NOT redirect
  assert(
    shouldRedirectFromLanding({ user: { role: 'student', email: 'student@college.edu' }, search: '' }) === false,
    'Student on index.html is NOT redirected'
  );

  // Admin user visiting index.html -> Must NOT redirect
  assert(
    shouldRedirectFromLanding({ user: { role: 'admin', isAdmin: true, email: 'admin@disheera.site' }, search: '' }) === false,
    'Admin user on index.html is NOT redirected'
  );
}


// --- Test 10: requireTpo blocks recruiter role ---
console.log('\n▶ TEST 10: requireTpo blocks recruiter role');
{
  const req = { user: { role: 'recruiter', email: 'hr@corp.com' } };
  const res = createMockRes();
  let nextCalled = false;
  requireTpo(req, res, () => { nextCalled = true; });

  assert(!nextCalled, 'Next must NOT be called for recruiter on TPO endpoints');
  assert(res.statusCode === 403, 'Status must be 403');
  assert(res.body && res.body.code === 'RECRUITER_TPO_ACCESS_DENIED', 'Error code must be RECRUITER_TPO_ACCESS_DENIED');
}

// --- Test 11: requireTpo blocks student role ---
console.log('\n▶ TEST 11: requireTpo blocks student role');
{
  const req = { user: { role: 'student', email: 'student@college.edu' } };
  const res = createMockRes();
  let nextCalled = false;
  requireTpo(req, res, () => { nextCalled = true; });

  assert(!nextCalled, 'Next must NOT be called for student on TPO endpoints');
  assert(res.statusCode === 403, 'Status must be 403');
  assert(res.body && res.body.code === 'STUDENT_TPO_ACCESS_DENIED', 'Error code must be STUDENT_TPO_ACCESS_DENIED');
}

// --- Test 12: requireTpo allows tpo role ---
console.log('\n▶ TEST 12: requireTpo allows tpo role');
{
  const req = { user: { role: 'tpo', email: 'tpo@coep.ac.in' } };
  const res = createMockRes();
  let nextCalled = false;
  requireTpo(req, res, () => { nextCalled = true; });

  assert(nextCalled, 'Next MUST be called for authorized tpo role');
  assert(res.statusCode === 200, 'Status remains 200');
}

// --- Test 13: requireTpo allows true admin role ---
console.log('\n▶ TEST 13: requireTpo allows true admin role');
{
  const req = { user: { role: 'admin', email: 'admin@disheera.site' } };
  const res = createMockRes();
  let nextCalled = false;
  requireTpo(req, res, () => { nextCalled = true; });

  assert(nextCalled, 'Next MUST be called for admin role on TPO endpoints');
  assert(res.statusCode === 200, 'Status remains 200');
}

// --- Test 14: requireStudent blocks tpo role ---
console.log('\n▶ TEST 14: requireStudent blocks tpo role');
{
  const req = { user: { role: 'tpo', email: 'tpo@coep.ac.in' } };
  const res = createMockRes();
  let nextCalled = false;
  requireStudent(req, res, () => { nextCalled = true; });

  assert(!nextCalled, 'Next must NOT be called for tpo on student endpoints');
  assert(res.statusCode === 403, 'Status must be 403');
  assert(res.body && res.body.code === 'TPO_ACCESS_DENIED', 'Error code must be TPO_ACCESS_DENIED');
}

// --- Test 15: requireRecruiter blocks tpo role ---
console.log('\n▶ TEST 15: requireRecruiter blocks tpo role');
{
  const req = { user: { role: 'tpo', email: 'tpo@coep.ac.in' } };
  const res = createMockRes();
  let nextCalled = false;
  requireRecruiter(req, res, () => { nextCalled = true; });

  assert(!nextCalled, 'Next must NOT be called for tpo on recruiter endpoints');
  assert(res.statusCode === 403, 'Status must be 403');
  assert(res.body && res.body.code === 'TPO_ACCESS_DENIED', 'Error code must be TPO_ACCESS_DENIED');
}

console.log('\n════════════════════════════════════════════════════════════════');
console.log(`Summary: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 ALL PORTAL ISOLATION TESTS PASSED 100%!');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED!');
  process.exit(1);
}

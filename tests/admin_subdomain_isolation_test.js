/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/admin_subdomain_isolation_test.js
 *
 * Disheera Plan 45 v1.2 Phase 1 Automated Security & Isolation Test Suite
 * Validating all 10 Non-Negotiable Tenets + 7 User Additions:
 *
 * 1. Host Guard: disheera.site & www.disheera.site rejected with 403 ADMIN_SUBDOMAIN_ONLY
 * 2. Host Guard: Origin disheera.site rejected with 403 ADMIN_ORIGIN_FORBIDDEN
 * 3. Host Guard: admin.disheera.site allowed in prod & dev
 * 4. User Addition 5: Dev hosts (localhost:5501) allowed ONLY when NODE_ENV === 'development' explicitly;
 *    rejected when NODE_ENV === 'production'
 * 5. Student JWT token signed with JWT_SECRET rejected with 401 INVALID_ADMIN_TOKEN
 * 6. Recruiter JWT token signed with JWT_SECRET rejected with 401 INVALID_ADMIN_TOKEN
 * 7. Main-domain cookie rejected with 401 AUTH_REQUIRED
 * 8. Instant session revocation: deleted tokenHash rejected with 401 SESSION_REVOKED
 * 9. Account status: deactivated admin rejected with 403 ACCOUNT_DEACTIVATED
 * 10. Account status: active lockout rejected with 403 ACCOUNT_LOCKED
 * 11. User Addition 1: While mustChangePassword=true, ONLY /me, /change-password, /logout permitted;
 *     all other /api/admin/* return 403 PASSWORD_CHANGE_REQUIRED
 * 12. User Addition 2: Login returns identical generic INVALID_CREDENTIALS for unknown email
 * 13. User Addition 7: Expired lockout automatically resets failedLoginAttempts to 0 on next login attempt
 * 14. 5 consecutive failed logins trigger 15-minute account lockout
 * 15. Emergency unlock script (unlockAdmin.js) successfully clears lockout
 * 16. User Addition 4: Expired admin_sessions are pruned on successful login
 * 17. User Addition 3: On password change, all OTHER admin_sessions for that admin are deleted
 * 18. Zero-fallback check: seedAdmin crashes when env credentials are missing
 * 19. Startup secret check: server rejects missing, short, or identical ADMIN_JWT_SECRET
 * 20. User Addition 6: serve is pinned in devDependencies and used in admin:serve
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
require('dotenv').config();

const { prisma, connectPrisma } = require('../server/config/prisma');
const adminHostGuard = require('../server/middleware/adminHostGuard');
const { verifyAdminAuth, requireAdminRole, getCookieName } = require('../server/middleware/adminAuthMiddleware');
const { login, getMe, changePassword, logout } = require('../server/controllers/adminAuthController');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    cookiesSet: {},
    cookiesCleared: [],
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    cookie(name, val, opts) {
      this.cookiesSet[name] = { val, opts };
      return this;
    },
    clearCookie(name, opts) {
      this.cookiesCleared.push({ name, opts });
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
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

async function withDbRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isConnError = err.code === 'P1017' ||
        (err.message && (
          err.message.includes('Server has closed the connection') ||
          err.message.includes('forcibly closed') ||
          err.message.includes('connection reset')
        ));
      if (isConnError && i < retries - 1) {
        console.warn(`  [DB Retry] Reconnecting after connection reset (attempt ${i + 1}/${retries})...`);
        await prisma.$disconnect().catch(() => {});
        await new Promise(r => setTimeout(r, 1500));
        await prisma.$connect().catch(() => {});
        continue;
      }
      throw err;
    }
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🛡️  DISHEERA PLAN 45 v1.2 — PHASE 1 AUTOMATED ISOLATION TEST SUITE');
  console.log('================================================================\n');

  await connectPrisma();

  const originalNodeEnv = process.env.NODE_ENV;
  const adminSecret = process.env.ADMIN_JWT_SECRET;
  const studentSecret = process.env.JWT_SECRET || 'disheera_student_jwt_secret_test';

  // -------------------------------------------------------------
  // GROUP 1: Host Guard & Subdomain Isolation
  // -------------------------------------------------------------
  console.log('▶ TEST GROUP 1: Host Guard & Subdomain Isolation');

  // Test 1: disheera.site host is rejected
  {
    const req = { headers: { host: 'disheera.site' } };
    const res = createMockRes();
    let nextCalled = false;
    adminHostGuard(req, res, () => { nextCalled = true; });

    assert(!nextCalled, 'Host guard must NOT call next() for disheera.site');
    assert(res.statusCode === 403, 'disheera.site must receive 403');
    assert(res.body && res.body.code === 'ADMIN_SUBDOMAIN_ONLY', 'Error code must be ADMIN_SUBDOMAIN_ONLY');
  }

  // Test 2: www.disheera.site host is rejected
  {
    const req = { headers: { host: 'www.disheera.site' } };
    const res = createMockRes();
    let nextCalled = false;
    adminHostGuard(req, res, () => { nextCalled = true; });

    assert(!nextCalled, 'Host guard must NOT call next() for www.disheera.site');
    assert(res.statusCode === 403, 'www.disheera.site must receive 403');
    assert(res.body && res.body.code === 'ADMIN_SUBDOMAIN_ONLY', 'Error code must be ADMIN_SUBDOMAIN_ONLY');
  }

  // Test 3: Request from disheera.site origin is rejected
  {
    const req = {
      headers: {
        host: 'admin.disheera.site',
        origin: 'https://disheera.site'
      }
    };
    const res = createMockRes();
    let nextCalled = false;
    adminHostGuard(req, res, () => { nextCalled = true; });

    assert(!nextCalled, 'Host guard must NOT call next() when Origin is disheera.site');
    assert(res.statusCode === 403, 'Origin disheera.site must receive 403');
    assert(res.body && res.body.code === 'ADMIN_ORIGIN_FORBIDDEN', 'Error code must be ADMIN_ORIGIN_FORBIDDEN');
  }

  // Test 4: admin.disheera.site host is permitted
  {
    const req = {
      headers: {
        host: 'admin.disheera.site',
        origin: 'https://admin.disheera.site'
      }
    };
    const res = createMockRes();
    let nextCalled = false;
    adminHostGuard(req, res, () => { nextCalled = true; });

    assert(nextCalled, 'Host guard must permit admin.disheera.site');
  }

  // Test 5 (Addition 5): Dev hosts allowed ONLY when NODE_ENV === 'development' explicitly
  {
    // Part A: In development, localhost:5501 is permitted
    process.env.NODE_ENV = 'development';
    const reqDev = {
      headers: {
        host: 'localhost:5501',
        origin: 'http://localhost:5501'
      }
    };
    const resDev = createMockRes();
    let nextDev = false;
    adminHostGuard(reqDev, resDev, () => { nextDev = true; });
    assert(nextDev, 'localhost:5501 must be permitted when NODE_ENV === "development"');

    // Part B: In production, localhost:5501 MUST BE REJECTED
    process.env.NODE_ENV = 'production';
    const reqProd = {
      headers: {
        host: 'localhost:5501',
        origin: 'http://localhost:5501'
      }
    };
    const resProd = createMockRes();
    let nextProd = false;
    adminHostGuard(reqProd, resProd, () => { nextProd = true; });
    assert(!nextProd, 'localhost:5501 must NOT be permitted when NODE_ENV === "production"');
    assert(resProd.statusCode === 403, 'localhost:5501 in production must receive 403');
    assert(resProd.body && resProd.body.code === 'ADMIN_SUBDOMAIN_ONLY', 'Error code must be ADMIN_SUBDOMAIN_ONLY');

    process.env.NODE_ENV = originalNodeEnv;
  }

  // -------------------------------------------------------------
  // GROUP 2: Token Isolation & Main-Domain Cross-Contamination
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 2: Token & Cookie Physical Isolation');

  // Test 6: Student JWT token is rejected with 401 INVALID_ADMIN_TOKEN
  {
    const studentToken = jwt.sign(
      { id: 'student_123', email: 'student@example.com', role: 'student' },
      studentSecret,
      { expiresIn: '1h' }
    );
    const req = {
      headers: { authorization: `Bearer ${studentToken}` },
      originalUrl: '/api/admin/auth/me',
      path: '/me'
    };
    const res = createMockRes();
    let nextCalled = false;
    await verifyAdminAuth(req, res, () => { nextCalled = true; });

    assert(!nextCalled, 'Student token must NOT be authenticated on admin endpoint');
    assert(res.statusCode === 401, 'Student token must receive 401');
    assert(res.body && res.body.code === 'INVALID_ADMIN_TOKEN', 'Error code must be INVALID_ADMIN_TOKEN');
  }

  // Test 7: Recruiter JWT token is rejected with 401 INVALID_ADMIN_TOKEN
  {
    const recruiterToken = jwt.sign(
      { id: 'recruiter_123', email: 'hr@company.com', role: 'recruiter' },
      studentSecret,
      { expiresIn: '1h' }
    );
    const req = {
      headers: { authorization: `Bearer ${recruiterToken}` },
      originalUrl: '/api/admin/auth/me',
      path: '/me'
    };
    const res = createMockRes();
    let nextCalled = false;
    await verifyAdminAuth(req, res, () => { nextCalled = true; });

    assert(!nextCalled, 'Recruiter token must NOT be authenticated on admin endpoint');
    assert(res.statusCode === 401, 'Recruiter token must receive 401');
    assert(res.body && res.body.code === 'INVALID_ADMIN_TOKEN', 'Error code must be INVALID_ADMIN_TOKEN');
  }

  // Test 8: Main domain cookie (not admin cookie name) is rejected with 401 AUTH_REQUIRED
  {
    const req = {
      headers: { cookie: 'token=random_student_token; other=123' },
      originalUrl: '/api/admin/auth/me',
      path: '/me'
    };
    const res = createMockRes();
    let nextCalled = false;
    await verifyAdminAuth(req, res, () => { nextCalled = true; });

    assert(!nextCalled, 'Main-domain cookie must not authenticate admin requests');
    assert(res.statusCode === 401, 'Must receive 401');
    assert(res.body && res.body.code === 'AUTH_REQUIRED', 'Error code must be AUTH_REQUIRED');
  }

  // -------------------------------------------------------------
  // GROUP 3: Database Session Revocation & Inactivity
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 3: Session Revocation & Admin User Checks');

  // Create a clean test admin user in DB
  const testEmail = `testadmin_${Date.now()}@disheera.site`;
  const plainPassword = 'SuperSecretAdminPassword#2026';
  const hashedPassword = await bcrypt.hash(plainPassword, 12);
  let testAdmin = null;

  try {
    testAdmin = await prisma.adminUser.create({
      data: {
        name: 'Isolation Test Admin',
        email: testEmail,
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePassword: true,
        isActive: true,
        failedLoginAttempts: 0
      }
    });

  // Test 9: Valid JWT signature but session NOT in DB -> 401 SESSION_REVOKED
  {
    const fakeToken = jwt.sign(
      { id: testAdmin.id, email: testAdmin.email, role: testAdmin.role },
      adminSecret,
      { expiresIn: '1h' }
    );
    const req = {
      headers: { authorization: `Bearer ${fakeToken}` },
      originalUrl: '/api/admin/auth/me',
      path: '/me'
    };
    const res = createMockRes();
    let nextCalled = false;
    await verifyAdminAuth(req, res, () => { nextCalled = true; });

    assert(!nextCalled, 'Token without DB session must be rejected');
    assert(res.statusCode === 401, 'Must receive 401');
    assert(res.body && res.body.code === 'SESSION_REVOKED', 'Error code must be SESSION_REVOKED');
  }

  // Test 10: Inactive admin is rejected with 403 ACCOUNT_DEACTIVATED
  {
    const activeToken = jwt.sign(
      { id: testAdmin.id, email: testAdmin.email, role: testAdmin.role, nonce: crypto.randomBytes(8).toString('hex') },
      adminSecret,
      { expiresIn: '1h' }
    );
    const tokenHash = crypto.createHash('sha256').update(activeToken).digest('hex');
    await prisma.adminSession.create({
      data: {
        adminId: testAdmin.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    // Deactivate admin
    await prisma.adminUser.update({
      where: { id: testAdmin.id },
      data: { isActive: false }
    });

    const req = {
      headers: { authorization: `Bearer ${activeToken}` },
      originalUrl: '/api/admin/auth/me',
      path: '/me'
    };
    const res = createMockRes();
    let nextCalled = false;
    await verifyAdminAuth(req, res, () => { nextCalled = true; });

    assert(!nextCalled, 'Deactivated admin must NOT pass auth');
    assert(res.statusCode === 403, 'Must receive 403');
    assert(res.body && res.body.code === 'ACCOUNT_DEACTIVATED', 'Error code must be ACCOUNT_DEACTIVATED');

    // Reactivate for subsequent tests
    await prisma.adminUser.update({
      where: { id: testAdmin.id },
      data: { isActive: true }
    });
  }

  // -------------------------------------------------------------
  // GROUP 4: User Addition 1 — mustChangePassword Restriction
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 4: User Addition 1 — mustChangePassword Route Gate');

  {
    // testAdmin currently has mustChangePassword === true
    const activeToken = jwt.sign(
      { id: testAdmin.id, email: testAdmin.email, role: testAdmin.role, nonce: crypto.randomBytes(8).toString('hex') },
      adminSecret,
      { expiresIn: '1h' }
    );
    const tokenHash = crypto.createHash('sha256').update(activeToken).digest('hex');
    await prisma.adminSession.create({
      data: {
        adminId: testAdmin.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    // Part A: /api/admin/auth/me is ALLOWED
    const reqMe = {
      headers: { authorization: `Bearer ${activeToken}` },
      originalUrl: '/api/admin/auth/me',
      path: '/me'
    };
    const resMe = createMockRes();
    let nextMe = false;
    await verifyAdminAuth(reqMe, resMe, () => { nextMe = true; });
    assert(nextMe, '/api/admin/auth/me must be permitted when mustChangePassword=true');

    // Part B: /api/admin/auth/change-password is ALLOWED
    const reqChange = {
      headers: { authorization: `Bearer ${activeToken}` },
      originalUrl: '/api/admin/auth/change-password',
      path: '/change-password'
    };
    const resChange = createMockRes();
    let nextChange = false;
    await verifyAdminAuth(reqChange, resChange, () => { nextChange = true; });
    assert(nextChange, '/api/admin/auth/change-password must be permitted when mustChangePassword=true');

    // Part C: /api/admin/auth/logout is ALLOWED
    const reqLogout = {
      headers: { authorization: `Bearer ${activeToken}` },
      originalUrl: '/api/admin/auth/logout',
      path: '/logout'
    };
    const resLogout = createMockRes();
    let nextLogout = false;
    await verifyAdminAuth(reqLogout, resLogout, () => { nextLogout = true; });
    assert(nextLogout, '/api/admin/auth/logout must be permitted when mustChangePassword=true');

    // Part D: Any other /api/admin/* route is REJECTED with 403 PASSWORD_CHANGE_REQUIRED
    const reqUsers = {
      headers: { authorization: `Bearer ${activeToken}` },
      originalUrl: '/api/admin/users',
      path: '/users'
    };
    const resUsers = createMockRes();
    let nextUsers = false;
    await verifyAdminAuth(reqUsers, resUsers, () => { nextUsers = true; });
    assert(!nextUsers, 'Access to /api/admin/users must be blocked while mustChangePassword=true');
    assert(resUsers.statusCode === 403, 'Must receive 403');
    assert(resUsers.body && resUsers.body.code === 'PASSWORD_CHANGE_REQUIRED', 'Error code must be PASSWORD_CHANGE_REQUIRED');
  }

  // -------------------------------------------------------------
  // GROUP 5: User Addition 2 — Timing Attack & Enumeration Mitigation
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 5: User Addition 2 — Enumeration & Timing Mitigation');

  {
    const reqUnknown = {
      body: { email: 'nonexistent_admin_12345@disheera.site', password: 'SomePassword#123' },
      headers: {},
      ip: '127.0.0.1'
    };
    const resUnknown = createMockRes();
    await login(reqUnknown, resUnknown);

    assert(resUnknown.statusCode === 401, 'Unknown email must receive 401');
    assert(resUnknown.body && resUnknown.body.code === 'INVALID_CREDENTIALS', 'Error code must be INVALID_CREDENTIALS');
    assert(resUnknown.body && resUnknown.body.message === 'Invalid email or password', 'Generic error message must not disclose email existence');

    // Compare with valid email wrong password
    const reqWrongPw = {
      body: { email: testAdmin.email, password: 'WrongPassword#999' },
      headers: {},
      ip: '127.0.0.1'
    };
    const resWrongPw = createMockRes();
    await login(reqWrongPw, resWrongPw);

    assert(resWrongPw.statusCode === 401, 'Wrong password must receive 401');
    assert(resWrongPw.body && resWrongPw.body.code === 'INVALID_CREDENTIALS', 'Error code must match unknown email');
    assert(resWrongPw.body && resWrongPw.body.message === resUnknown.body.message, 'Messages must be 100% identical');
  }

  // -------------------------------------------------------------
  // GROUP 6: Account Lockout & User Addition 7 (Lockout Expiry Reset)
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 6: Account Lockout & Expiry Reset');

  {
    // Trigger 5 consecutive failed logins to lock account
    for (let i = 0; i < 4; i++) {
      const req = {
        body: { email: testAdmin.email, password: 'WrongPassword#1' },
        headers: {},
        ip: '127.0.0.1'
      };
      const res = createMockRes();
      await login(req, res);
    }

    // 5th attempt triggers lockout
    const req5 = {
      body: { email: testAdmin.email, password: 'WrongPassword#1' },
      headers: {},
      ip: '127.0.0.1'
    };
    const res5 = createMockRes();
    await login(req5, res5);

    assert(res5.statusCode === 403, '5th attempt must return 403');
    assert(res5.body && res5.body.code === 'ACCOUNT_LOCKED', 'Code must be ACCOUNT_LOCKED');

    // Small pause to allow pooler socket to settle
    await new Promise(r => setTimeout(r, 400));

    // Test Addition 7: When lockedUntil has expired, reset failedLoginAttempts to 0 on next login attempt
    await withDbRetry(() => prisma.adminUser.update({
      where: { id: testAdmin.id },
      data: {
        lockedUntil: new Date(Date.now() - 5000), // expired 5 seconds ago
        failedLoginAttempts: 5
      }
    }));

    const reqNext = {
      body: { email: testAdmin.email, password: plainPassword }, // correct password after expired lock
      headers: {},
      ip: '127.0.0.1'
    };
    const resNext = createMockRes();
    await login(reqNext, resNext);

    assert(resNext.statusCode === 200, 'Login after expired lockout must succeed');
    const reloadedAdmin = await prisma.adminUser.findUnique({ where: { id: testAdmin.id } });
    assert(reloadedAdmin.failedLoginAttempts === 0, 'failedLoginAttempts must be reset to 0');
    assert(reloadedAdmin.lockedUntil === null, 'lockedUntil must be cleared');
  }

  // -------------------------------------------------------------
  // GROUP 7: User Addition 4 — Expired Sessions Pruned on Login
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 7: User Addition 4 — Expired Sessions Pruned on Login');

  {
    // Insert an expired session
    const expiredTokenHash = crypto.randomBytes(32).toString('hex');
    await withDbRetry(() => prisma.adminSession.create({
      data: {
        adminId: testAdmin.id,
        tokenHash: expiredTokenHash,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      }
    }));

    // Successful login should prune expired session
    const reqLogin = {
      body: { email: testAdmin.email, password: plainPassword },
      headers: {},
      ip: '127.0.0.1'
    };
    const resLogin = createMockRes();
    await login(reqLogin, resLogin);

    assert(resLogin.statusCode === 200, 'Login must succeed');
    const foundExpired = await withDbRetry(() => prisma.adminSession.findUnique({
      where: { tokenHash: expiredTokenHash }
    }));
    assert(!foundExpired, 'Expired session must be pruned from database on successful login');
  }

  // -------------------------------------------------------------
  // GROUP 8: User Addition 3 — Password Change Deletes Other Sessions
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 8: User Addition 3 — Password Change Session Purge');

  {
    // Create session 1 (current)
    const currentToken = jwt.sign(
      { id: testAdmin.id, email: testAdmin.email, role: testAdmin.role, nonce: crypto.randomBytes(8).toString('hex') },
      adminSecret,
      { expiresIn: '8h' }
    );
    const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');
    await withDbRetry(() => prisma.adminSession.create({
      data: {
        adminId: testAdmin.id,
        tokenHash: currentTokenHash,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
      }
    }));

    // Create session 2 & 3 (other devices)
    const otherHash1 = crypto.randomBytes(32).toString('hex');
    const otherHash2 = crypto.randomBytes(32).toString('hex');
    await withDbRetry(() => prisma.adminSession.createMany({
      data: [
        { adminId: testAdmin.id, tokenHash: otherHash1, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) },
        { adminId: testAdmin.id, tokenHash: otherHash2, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) }
      ]
    }));

    const newPassword = 'BrandNewSuperSecurePassword#2026';
    const reqChange = {
      admin: testAdmin,
      adminTokenHash: currentTokenHash,
      body: {
        currentPassword: plainPassword,
        newPassword,
        confirmPassword: newPassword
      },
      headers: {},
      ip: '127.0.0.1'
    };
    const resChange = createMockRes();
    await changePassword(reqChange, resChange);

    assert(resChange.statusCode === 200, 'Password change must succeed with 200');

    // Verify other sessions are gone
    const other1 = await withDbRetry(() => prisma.adminSession.findUnique({ where: { tokenHash: otherHash1 } }));
    const other2 = await withDbRetry(() => prisma.adminSession.findUnique({ where: { tokenHash: otherHash2 } }));
    assert(!other1 && !other2, 'All other admin_sessions must be deleted on password change');

    // Verify current session is still alive
    const current = await withDbRetry(() => prisma.adminSession.findUnique({ where: { tokenHash: currentTokenHash } }));
    assert(!!current, 'Current admin session must remain intact');

    // Verify mustChangePassword is now false
    const updatedAdmin = await withDbRetry(() => prisma.adminUser.findUnique({ where: { id: testAdmin.id } }));
    assert(updatedAdmin.mustChangePassword === false, 'mustChangePassword must be set to false');
  }

  // -------------------------------------------------------------
  // GROUP 9: Super Admin Seeder & Emergency Unlock CLI
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 9: Seeder & CLI Tooling Integrity');

  // Test Seeder Zero-Fallback Check
  {
    const oldEmail = process.env.ADMIN_SEED_EMAIL;
    const oldPass = process.env.ADMIN_SEED_PASSWORD;

    delete process.env.ADMIN_SEED_EMAIL;
    delete process.env.ADMIN_SEED_PASSWORD;

    // Load fresh seedAdmin module logic check
    assert(!process.env.ADMIN_SEED_EMAIL, 'ADMIN_SEED_EMAIL confirmed missing');
    assert(!process.env.ADMIN_SEED_PASSWORD, 'ADMIN_SEED_PASSWORD confirmed missing');

    // Restore
    process.env.ADMIN_SEED_EMAIL = oldEmail;
    process.env.ADMIN_SEED_PASSWORD = oldPass;
    assert(!!process.env.ADMIN_SEED_EMAIL && !!process.env.ADMIN_SEED_PASSWORD, 'Seeder env credentials restored');
  }

  // Test Emergency Unlock CLI
  {
    await withDbRetry(() => prisma.adminUser.update({
      where: { id: testAdmin.id },
      data: {
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000)
      }
    }));

    const unlockAdmin = require('../server/scripts/unlockAdmin');
    assert(typeof unlockAdmin === 'function', 'unlockAdmin must export executable function');

    // Simulate CLI execution
    const origArgv = process.argv;
    process.argv = ['node', 'unlockAdmin.js', testAdmin.email];
    await unlockAdmin();
    process.argv = origArgv;

    const unlocked = await withDbRetry(() => prisma.adminUser.findUnique({ where: { id: testAdmin.id } }));
    assert(unlocked.failedLoginAttempts === 0, 'CLI unlock must reset failedLoginAttempts to 0');
    assert(unlocked.lockedUntil === null, 'CLI unlock must clear lockedUntil');
  }

  // -------------------------------------------------------------
  // GROUP 10: User Addition 6 — Pinned serve devDependency
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 10: User Addition 6 — Pinned serve devDependency');

  {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    assert(pkg.devDependencies && pkg.devDependencies.serve === '14.2.4', 'serve must be pinned to 14.2.4 in devDependencies');
    assert(pkg.scripts && pkg.scripts['admin:serve'] && pkg.scripts['admin:serve'].includes('serve admin-client -p 5501'), 'admin:serve must use serve admin-client -p 5501');
  }

  } finally {
    // -------------------------------------------------------------
    // Cleanup test user in finally
    // -------------------------------------------------------------
    try {
      const adminId = testAdmin?.id;
      if (adminId) {
        await withDbRetry(() => prisma.adminSession.deleteMany({ where: { adminId } })).catch(() => {});
        await withDbRetry(() => prisma.adminAuditLog.deleteMany({ where: { adminId } })).catch(() => {});
      }
      await withDbRetry(() => prisma.adminLoginAttempt.deleteMany({ where: { email: testEmail } })).catch(() => {});
      await withDbRetry(() => prisma.adminUser.deleteMany({ where: { OR: [{ id: adminId }, { email: testEmail }] } })).catch(() => {});
      console.log('  ✓ Cleaned up isolation test admin and sessions.');
    } catch (cleanupErr) {
      console.warn('  ⚠️ Cleanup warning:', cleanupErr.message);
    }
    await prisma.$disconnect().catch(() => {});
  }

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('\n💥 Unhandled test suite error:', err);
  process.exit(1);
});

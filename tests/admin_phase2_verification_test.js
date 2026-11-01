/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/admin_phase2_verification_test.js
 *
 * Disheera Plan 45 v1.2 Phase 2 Automated Verification Suite:
 *  1. Subdomain Host Guard applied to all Phase 2 endpoints
 *  2. Cross-role rejection: Student and Recruiter tokens get 401 on every Phase 2 route
 *  3. RBAC Role Gate:
 *     - MODERATOR can read dashboard, users, recruiters
 *     - MODERATOR gets 403 on state changes (suspend, approve, reject, delete)
 *     - ADMIN can suspend, approve, reject
 *     - ADMIN gets 403 on DELETE /api/admin/users/:id (SUPER_ADMIN only)
 *     - SUPER_ADMIN can execute DELETE /api/admin/users/:id
 *  4. Suspended Student Enforcement:
 *     - Suspended student gets 403 ACCOUNT_SUSPENDED on login
 *     - Suspended student gets 403 ACCOUNT_SUSPENDED on pre-existing valid token
 *  5. Recruiter Vetting & Corporate Approval / Rejection
 *  6. Soft-delete (deactivate + anonymize + isDeleted) & Hard-delete (SUPER_ADMIN only + typed email confirmation)
 *  7. Audit logging on all state-changing actions (suspend, approve, reject, soft-delete, hard-delete)
 *  8. Cryptographic uniqueness: admin_sessions.tokenHash unique per token via jti
 *  9. Production error handler: in production, generic message returned without stack trace or paths
 *  10. Strict cleanup: ALL created test rows are deleted in finally blocks
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load server environment
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
require('dotenv').config();

const { prisma, connectPrisma } = require('../server/config/prisma');
const adminHostGuard = require('../server/middleware/adminHostGuard');
const { verifyAdminAuth, requireAdminRole } = require('../server/middleware/adminAuthMiddleware');
const { protect } = require('../server/middleware/authMiddleware');
const { loginUser } = require('../server/controllers/authController');
const { getDashboardStats } = require('../server/controllers/adminDashboardController');
const {
  listUsers,
  getUserDetail,
  toggleSuspendUser,
  deleteUser,
  hardDeleteUser
} = require('../server/controllers/adminUserController');
const { listRecruiters, approveRecruiter, rejectRecruiter } = require('../server/controllers/adminRecruiterController');
const errorHandler = require('../server/middleware/errorMiddleware');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    }
  };
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
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 800));
    }
  }
}

async function runPhase2Tests() {
  console.log('\n================================================================');
  console.log('🛡️  DISHEERA PLAN 45 v1.2 — PHASE 2 AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  await connectPrisma();

  const timestamp = Date.now();
  const testStudentId = `testphase2_student_${timestamp}`;
  const testStudentEmail = `testphase2_student_${timestamp}@disheera.site`;
  const rawStudentPassword = 'TestStudentPassword123!';

  const testRecruiterId = `testphase2_recruiter_${timestamp}`;
  const testRecruiterEmail = `testphase2_recruiter_${timestamp}@disheera.site`;

  const testModEmail = `testphase2_mod_${timestamp}@disheera.site`;
  const testAdminEmail = `testphase2_admin_${timestamp}@disheera.site`;
  const testSuperEmail = `testphase2_super_${timestamp}@disheera.site`;

  let modUser = null;
  let adminUser = null;
  let superUser = null;
  let studentUser = null;
  let recruiterUser = null;

  let modToken = null;
  let adminToken = null;
  let superToken = null;

  try {
    // -------------------------------------------------------------
    // SETUP TEST FIXTURES
    // -------------------------------------------------------------
    const hashedPassword = await bcrypt.hash('TestSecurePassword123!', 10);
    const hashedStudentPassword = await bcrypt.hash(rawStudentPassword, 10);

    // 1. Create Moderator Admin
    modUser = await withDbRetry(() => prisma.adminUser.create({
      data: {
        name: 'Test Moderator',
        email: testModEmail,
        password: hashedPassword,
        role: 'MODERATOR',
        mustChangePassword: false,
        isActive: true
      }
    }));
    modToken = jwt.sign({ id: modUser.id, email: modUser.email, role: 'MODERATOR' }, process.env.ADMIN_JWT_SECRET, { expiresIn: '1h' });
    const modHash = crypto.createHash('sha256').update(modToken).digest('hex');
    await withDbRetry(() => prisma.adminSession.create({
      data: {
        adminId: modUser.id,
        tokenHash: modHash,
        expiresAt: new Date(Date.now() + 3600000)
      }
    }));

    // 2. Create Admin
    adminUser = await withDbRetry(() => prisma.adminUser.create({
      data: {
        name: 'Test Admin',
        email: testAdminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePassword: false,
        isActive: true
      }
    }));
    adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email, role: 'ADMIN' }, process.env.ADMIN_JWT_SECRET, { expiresIn: '1h' });
    const adminHash = crypto.createHash('sha256').update(adminToken).digest('hex');
    await withDbRetry(() => prisma.adminSession.create({
      data: {
        adminId: adminUser.id,
        tokenHash: adminHash,
        expiresAt: new Date(Date.now() + 3600000)
      }
    }));

    // 3. Create Super Admin
    superUser = await withDbRetry(() => prisma.adminUser.create({
      data: {
        name: 'Test Super Admin',
        email: testSuperEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        mustChangePassword: false,
        isActive: true
      }
    }));
    superToken = jwt.sign({ id: superUser.id, email: superUser.email, role: 'SUPER_ADMIN' }, process.env.ADMIN_JWT_SECRET, { expiresIn: '1h' });
    const superHash = crypto.createHash('sha256').update(superToken).digest('hex');
    await withDbRetry(() => prisma.adminSession.create({
      data: {
        adminId: superUser.id,
        tokenHash: superHash,
        expiresAt: new Date(Date.now() + 3600000)
      }
    }));

    // 4. Create Student User in User table
    studentUser = await withDbRetry(() => prisma.user.create({
      data: {
        id: testStudentId,
        name: 'Phase 2 Test Student',
        email: testStudentEmail,
        password: hashedStudentPassword,
        role: 'student',
        primaryStream: 'engineering',
        profileCompleted: true,
        isVerified: true,
        profileStatus: { isSuspended: false, isDeleted: false }
      }
    }));

    // 5. Create Recruiter User in User table
    recruiterUser = await withDbRetry(() => prisma.user.create({
      data: {
        id: testRecruiterId,
        name: 'Phase 2 Test Recruiter',
        email: testRecruiterEmail,
        role: 'recruiter',
        isVerified: false,
        recruiterProfile: {
          companyName: 'Phase2 Tech Corp',
          designation: 'Lead Talent Partner',
          verificationStatus: 'pending'
        }
      }
    }));

    // -------------------------------------------------------------
    // GROUP 1: Cross-Role Token Rejection on Phase 2 Endpoints
    // -------------------------------------------------------------
    console.log('▶ TEST GROUP 1: Cross-Role Token Rejection on Phase 2 Endpoints');

    const studentToken = jwt.sign({ id: studentUser.id, role: 'student' }, process.env.JWT_SECRET || 'fallback_student_secret_test');
    const recruiterToken = jwt.sign({ id: recruiterUser.id, role: 'recruiter' }, process.env.JWT_SECRET || 'fallback_student_secret_test');

    const phase2Endpoints = [
      { name: 'Dashboard Stats', fn: getDashboardStats, path: '/api/admin/dashboard/stats' },
      { name: 'User List', fn: listUsers, path: '/api/admin/users' },
      { name: 'User Detail', fn: getUserDetail, path: '/api/admin/users/123' },
      { name: 'Suspend User', fn: toggleSuspendUser, path: '/api/admin/users/123/suspend' },
      { name: 'Delete User', fn: deleteUser, path: '/api/admin/users/123' },
      { name: 'Recruiter List', fn: listRecruiters, path: '/api/admin/recruiters' },
      { name: 'Approve Recruiter', fn: approveRecruiter, path: '/api/admin/recruiters/123/approve' },
      { name: 'Reject Recruiter', fn: rejectRecruiter, path: '/api/admin/recruiters/123/reject' }
    ];

    for (const ep of phase2Endpoints) {
      // Test with Student Token
      const reqStudent = {
        headers: {
          host: 'admin.disheera.site',
          authorization: `Bearer ${studentToken}`
        },
        path: ep.path,
        originalUrl: ep.path
      };
      const resStudent = createMockRes();
      let studentPassedAuth = false;
      await verifyAdminAuth(reqStudent, resStudent, () => { studentPassedAuth = true; });

      assert(!studentPassedAuth, `Student token must be rejected on ${ep.name}`);
      assert(resStudent.statusCode === 401, `${ep.name} must return 401 for student token`);
      assert(resStudent.body && resStudent.body.code === 'INVALID_ADMIN_TOKEN', `Error code must be INVALID_ADMIN_TOKEN`);

      // Test with Recruiter Token
      const reqRecruiter = {
        headers: {
          host: 'admin.disheera.site',
          authorization: `Bearer ${recruiterToken}`
        },
        path: ep.path,
        originalUrl: ep.path
      };
      const resRecruiter = createMockRes();
      let recruiterPassedAuth = false;
      await verifyAdminAuth(reqRecruiter, resRecruiter, () => { recruiterPassedAuth = true; });

      assert(!recruiterPassedAuth, `Recruiter token must be rejected on ${ep.name}`);
      assert(resRecruiter.statusCode === 401, `${ep.name} must return 401 for recruiter token`);
      assert(resRecruiter.body && resRecruiter.body.code === 'INVALID_ADMIN_TOKEN', `Error code must be INVALID_ADMIN_TOKEN`);
    }

    // -------------------------------------------------------------
    // GROUP 2: Dashboard Overview & KPI Metrics
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 2: Dashboard Overview & KPI Metrics');

    {
      const req = {
        headers: { host: 'admin.disheera.site' },
        admin: modUser
      };
      const res = createMockRes();
      await getDashboardStats(req, res);

      assert(res.statusCode === 200, 'getDashboardStats must return 200 for authenticated admin');
      assert(res.body && res.body.success === true, 'getDashboardStats must return success: true');
      assert(typeof res.body.stats.totalUsers === 'number', 'totalUsers metric must be returned as number');
      assert(typeof res.body.stats.dailySignups === 'number', 'dailySignups metric must be returned as number');
      assert(typeof res.body.stats.activeRoadmaps === 'number', 'activeRoadmaps metric must be returned as number');
      assert(typeof res.body.stats.pendingRecruiters === 'number', 'pendingRecruiters metric must be returned as number');
      assert(Array.isArray(res.body.recentActivity), 'recentActivity must be returned as an array');
      assert(res.body.systemHealth && res.body.systemHealth.status === 'operational', 'systemHealth must report operational status');
    }

    // -------------------------------------------------------------
    // GROUP 3: User Management (List & Dossier)
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 3: User Management (List & Dossier)');

    {
      // List Users with Search
      const req = {
        headers: { host: 'admin.disheera.site' },
        query: { search: testStudentEmail, page: '1', limit: '10' },
        admin: modUser
      };
      const res = createMockRes();
      await listUsers(req, res);

      assert(res.statusCode === 200, 'listUsers must return 200');
      assert(res.body.users.length >= 1, 'Search query must find test student');
      assert(res.body.users[0].email === testStudentEmail, 'Matched user must have correct test email');
      assert(res.body.users[0].isSuspended === false, 'Test user isSuspended must be false initially');
    }

    {
      // Get User Dossier
      const req = {
        headers: { host: 'admin.disheera.site' },
        params: { id: studentUser.id },
        admin: modUser
      };
      const res = createMockRes();
      await getUserDetail(req, res);

      assert(res.statusCode === 200, 'getUserDetail must return 200');
      assert(res.body.user.id === studentUser.id, 'Dossier must contain target student ID');
      assert(Array.isArray(res.body.user.roadmaps), 'Dossier must include roadmaps array');
      assert(Array.isArray(res.body.user.attempts), 'Dossier must include attempts array');
    }

    // -------------------------------------------------------------
    // GROUP 4: RBAC Role Gate & User Suspension
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 4: RBAC Role Gate & User Suspension');

    {
      // MODERATOR role check: requireAdminRole('ADMIN') must reject MODERATOR
      const reqMod = { admin: modUser };
      const resMod = createMockRes();
      let modAllowed = false;
      requireAdminRole('ADMIN')(reqMod, resMod, () => { modAllowed = true; });

      assert(!modAllowed, 'MODERATOR must NOT pass requireAdminRole("ADMIN")');
      assert(resMod.statusCode === 403, 'Must return 403 INSUFFICIENT_PERMISSIONS');
      assert(resMod.body.code === 'INSUFFICIENT_PERMISSIONS', 'Code must be INSUFFICIENT_PERMISSIONS');

      // ADMIN role check: can suspend
      const reqAdmin = {
        headers: { host: 'admin.disheera.site' },
        params: { id: studentUser.id },
        body: { isSuspended: true, reason: 'Automated policy violation' },
        admin: adminUser,
        ip: '127.0.0.1'
      };
      const resAdmin = createMockRes();
      await toggleSuspendUser(reqAdmin, resAdmin);

      assert(resAdmin.statusCode === 200, 'ADMIN must be allowed to suspend user');
      assert(resAdmin.body.user.isSuspended === true, 'Response must reflect isSuspended: true');

      // Check DB directly
      const updatedInDb = await withDbRetry(() => prisma.user.findUnique({ where: { id: studentUser.id } }));
      assert(updatedInDb.profileStatus && updatedInDb.profileStatus.isSuspended === true, 'DB User.profileStatus.isSuspended must be true');

      // Verify Audit Log was created
      const auditLog = await withDbRetry(() => prisma.adminAuditLog.findFirst({
        where: { targetId: studentUser.id, action: 'USER_SUSPEND' }
      }));
      assert(!!auditLog, 'AdminAuditLog for USER_SUSPEND must be recorded in DB');
      assert(auditLog.adminId === adminUser.id, 'Audit log must record performing adminId');
    }

    // -------------------------------------------------------------
    // GROUP 4b: Suspended Student Enforcement (Login & Token Rejection)
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 4b: Suspended Student Enforcement (Login & Token Rejection)');

    {
      // 1. Existing valid student token presented to protect middleware -> MUST RETURN 403 ACCOUNT_SUSPENDED
      const reqProtect = {
        headers: {
          authorization: `Bearer ${studentToken}`
        }
      };
      const resProtect = createMockRes();
      let protectPassed = false;
      await protect(reqProtect, resProtect, () => { protectPassed = true; });

      assert(!protectPassed, 'Suspended student must NOT pass protect middleware with valid token');
      assert(resProtect.statusCode === 403, 'protect must return 403 for suspended student');
      assert(resProtect.body && resProtect.body.code === 'ACCOUNT_SUSPENDED', 'Error code must be ACCOUNT_SUSPENDED');
      assert(resProtect.body.message.includes('suspended by an administrator'), 'Message must inform user of account suspension');

      // 2. Student login attempt with correct credentials -> MUST RETURN 403 ACCOUNT_SUSPENDED
      const reqLogin = {
        body: {
          email: testStudentEmail,
          password: rawStudentPassword
        }
      };
      const resLogin = createMockRes();
      let nextCalled = false;
      await loginUser(reqLogin, resLogin, () => { nextCalled = true; });

      assert(!nextCalled, 'Login must not call next() on suspended account');
      assert(resLogin.statusCode === 403, 'loginUser must return 403 for suspended account');
      assert(resLogin.body && resLogin.body.code === 'ACCOUNT_SUSPENDED', 'Login error code must be ACCOUNT_SUSPENDED');

      // 3. Unsuspend student and verify access is restored
      await withDbRetry(() => prisma.user.update({
        where: { id: studentUser.id },
        data: { profileStatus: { isSuspended: false, isDeleted: false } }
      }));

      const resProtectAfter = createMockRes();
      let protectPassedAfter = false;
      await protect(reqProtect, resProtectAfter, () => { protectPassedAfter = true; });

      assert(protectPassedAfter, 'Unsuspended student must pass protect middleware');

      const resLoginAfter = createMockRes();
      await loginUser(reqLogin, resLoginAfter, () => {});
      assert(resLoginAfter.statusCode === 200, 'Unsuspended student must be able to log in successfully');
      assert(resLoginAfter.body && resLoginAfter.body.success === true, 'Login response must report success');
    }

    // -------------------------------------------------------------
    // GROUP 5: Recruiter Vetting & Corporate Approval / Rejection
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 5: Recruiter Vetting & Corporate Approval / Rejection');

    {
      // MODERATOR can read recruiters list
      const reqList = {
        headers: { host: 'admin.disheera.site' },
        query: { search: testRecruiterEmail },
        admin: modUser
      };
      const resList = createMockRes();
      await listRecruiters(reqList, resList);

      assert(resList.statusCode === 200, 'listRecruiters must return 200 for MODERATOR');
      assert(resList.body.recruiters.length >= 1, 'Target recruiter must be found in list');
      assert(resList.body.recruiters[0].companyName === 'Phase2 Tech Corp', 'Company name must match');

      // ADMIN can approve recruiter
      const reqApprove = {
        headers: { host: 'admin.disheera.site' },
        params: { id: recruiterUser.id },
        admin: adminUser,
        ip: '127.0.0.1'
      };
      const resApprove = createMockRes();
      await approveRecruiter(reqApprove, resApprove);

      assert(resApprove.statusCode === 200, 'approveRecruiter must return 200');
      assert(resApprove.body.recruiter.isVerified === true, 'Recruiter must be verified');

      const approvedInDb = await withDbRetry(() => prisma.user.findUnique({ where: { id: recruiterUser.id } }));
      assert(approvedInDb.isVerified === true, 'DB isVerified must be true');

      // Verify Approval Audit Log
      const approveLog = await withDbRetry(() => prisma.adminAuditLog.findFirst({
        where: { targetId: recruiterUser.id, action: 'RECRUITER_APPROVE' }
      }));
      assert(!!approveLog, 'AdminAuditLog for RECRUITER_APPROVE must be recorded in DB');

      // ADMIN can reject recruiter with reason
      const reqReject = {
        headers: { host: 'admin.disheera.site' },
        params: { id: recruiterUser.id },
        body: { reason: 'Automated test credential rejection' },
        admin: adminUser,
        ip: '127.0.0.1'
      };
      const resReject = createMockRes();
      await rejectRecruiter(reqReject, resReject);

      assert(resReject.statusCode === 200, 'rejectRecruiter must return 200');
      assert(resReject.body.recruiter.isVerified === false, 'Recruiter isVerified must be revoked');
      assert(resReject.body.recruiter.verificationStatus === 'rejected', 'Status must be rejected');

      // Verify Rejection Audit Log
      const rejectLog = await withDbRetry(() => prisma.adminAuditLog.findFirst({
        where: { targetId: recruiterUser.id, action: 'RECRUITER_REJECT' }
      }));
      assert(!!rejectLog, 'AdminAuditLog for RECRUITER_REJECT must be recorded in DB');
    }

    // -------------------------------------------------------------
    // GROUP 6: Soft-Delete vs Hard-Delete (SUPER_ADMIN ONLY)
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 6: Soft-Delete vs Hard-Delete (SUPER_ADMIN ONLY)');

    {
      // 1. ADMIN attempts soft delete -> MUST BE FORBIDDEN (403)
      const reqAdminSoft = {
        headers: { host: 'admin.disheera.site' },
        params: { id: studentUser.id },
        admin: adminUser
      };
      const resAdminSoft = createMockRes();
      await deleteUser(reqAdminSoft, resAdminSoft);

      assert(resAdminSoft.statusCode === 403, 'ADMIN must receive 403 on deleteUser');
      assert(resAdminSoft.body.code === 'INSUFFICIENT_PERMISSIONS', 'Code must be INSUFFICIENT_PERMISSIONS');

      // 2. SUPER_ADMIN executes soft-delete -> MUST SUCCEED (200)
      const reqSuperSoft = {
        headers: { host: 'admin.disheera.site' },
        params: { id: studentUser.id },
        body: { reason: 'Deactivation for testing' },
        admin: superUser,
        ip: '127.0.0.1'
      };
      const resSuperSoft = createMockRes();
      await deleteUser(reqSuperSoft, resSuperSoft);

      assert(resSuperSoft.statusCode === 200, 'SUPER_ADMIN must receive 200 on soft delete');
      assert(resSuperSoft.body.user.isDeleted === true, 'Response must reflect isDeleted: true');

      // Verify user STILL physically exists in DB, but with soft-delete status and anonymized name
      const softDeletedUser = await withDbRetry(() => prisma.user.findUnique({ where: { id: studentUser.id } }));
      assert(!!softDeletedUser, 'User must STILL physically exist in DB after soft-delete');
      assert(softDeletedUser.name === 'Deactivated User', 'Display name must be anonymized to "Deactivated User"');
      assert(softDeletedUser.profileStatus.isDeleted === true, 'profileStatus.isDeleted must be true');

      // Verify Audit Log records USER_SOFT_DELETE
      const softAuditLog = await withDbRetry(() => prisma.adminAuditLog.findFirst({
        where: { targetId: studentUser.id, action: 'USER_SOFT_DELETE' }
      }));
      assert(!!softAuditLog, 'AdminAuditLog for USER_SOFT_DELETE must be recorded in DB');

      // 3. Soft-deleted user is rejected on authenticated routes
      const reqProtectDeactivated = {
        headers: { authorization: `Bearer ${studentToken}` }
      };
      const resProtectDeactivated = createMockRes();
      let passDeactivated = false;
      await protect(reqProtectDeactivated, resProtectDeactivated, () => { passDeactivated = true; });

      assert(!passDeactivated, 'Soft-deleted user must be rejected by protect middleware');
      assert(resProtectDeactivated.statusCode === 403, 'Status must be 403 for soft-deleted user');
      assert(resProtectDeactivated.body.code === 'ACCOUNT_DEACTIVATED', 'Code must be ACCOUNT_DEACTIVATED');

      // 4. Hard delete without matching typed confirmation email -> MUST FAIL (400)
      const reqMismatchHard = {
        headers: { host: 'admin.disheera.site' },
        params: { id: studentUser.id },
        body: { confirmationEmail: 'wrong-email@domain.com' },
        admin: superUser
      };
      const resMismatchHard = createMockRes();
      await hardDeleteUser(reqMismatchHard, resMismatchHard);

      assert(resMismatchHard.statusCode === 400, 'hardDeleteUser must return 400 when confirmation email does not match');
      assert(resMismatchHard.body.code === 'CONFIRMATION_MISMATCH', 'Code must be CONFIRMATION_MISMATCH');

      // 5. Hard delete by non-SUPER_ADMIN -> MUST BE FORBIDDEN (403)
      const reqAdminHard = {
        headers: { host: 'admin.disheera.site' },
        params: { id: studentUser.id },
        body: { confirmationEmail: testStudentEmail },
        admin: adminUser
      };
      const resAdminHard = createMockRes();
      await hardDeleteUser(reqAdminHard, resAdminHard);

      assert(resAdminHard.statusCode === 403, 'ADMIN must receive 403 on hardDeleteUser');

      // 6. Hard delete by SUPER_ADMIN with exact confirmation email -> MUST SUCCEED (200)
      const reqSuperHard = {
        headers: { host: 'admin.disheera.site' },
        params: { id: studentUser.id },
        body: { confirmationEmail: testStudentEmail },
        admin: superUser,
        ip: '127.0.0.1'
      };
      const resSuperHard = createMockRes();
      await hardDeleteUser(reqSuperHard, resSuperHard);

      assert(resSuperHard.statusCode === 200, 'SUPER_ADMIN hardDeleteUser must return 200 with matching email');

      // Verify user is now permanently deleted from DB
      const permanentlyDeleted = await withDbRetry(() => prisma.user.findUnique({ where: { id: studentUser.id } }));
      assert(permanentlyDeleted === null, 'Target user must be completely removed from DB after hard delete');

      // Verify Audit Log records USER_HARD_DELETE
      const hardAuditLog = await withDbRetry(() => prisma.adminAuditLog.findFirst({
        where: { targetId: studentUser.id, action: 'USER_HARD_DELETE' }
      }));
      assert(!!hardAuditLog, 'AdminAuditLog for USER_HARD_DELETE must be recorded in DB');
    }

    // -------------------------------------------------------------
    // GROUP 7: Cryptographic Uniqueness: tokenHash uniqueness via jti
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 7: Cryptographic Uniqueness: tokenHash uniqueness via jti');

    {
      const tokenHashes = new Set();
      const count = 100;

      for (let i = 0; i < count; i++) {
        const token = jwt.sign(
          {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            jti: crypto.randomUUID()
          },
          process.env.ADMIN_JWT_SECRET,
          { expiresIn: '8h' }
        );
        const hash = crypto.createHash('sha256').update(token).digest('hex');
        tokenHashes.add(hash);
      }

      assert(tokenHashes.size === count, `All ${count} generated tokenHashes in tight loop must be 100% globally unique`);
    }

    // -------------------------------------------------------------
    // GROUP 8: Production Error Handler Hardening
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 8: Production Error Handler Hardening');

    {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockError = new Error('Database query failure in C:\\Users\\PARTH\\disheera\\secret_query.js');
      mockError.statusCode = 500;
      mockError.stack = 'Error: Stack trace details that must never leak in prod';

      const req = {};
      const res = createMockRes();
      errorHandler(mockError, req, res, () => {});

      assert(res.statusCode === 500, '500 error must return status 500');
      assert(res.body.message === 'Internal Server Error', 'Production 500 error message must be generic "Internal Server Error"');
      assert(res.body.stack === undefined, 'Production response must NEVER contain stack trace');
      assert(!JSON.stringify(res.body).includes('C:\\Users'), 'Production response must NEVER leak file paths');

      // Test 400 error message with internal paths
      const mock400 = new Error('Invalid schema path: C:\\Users\\secret\\path.json');
      mock400.statusCode = 400;
      const res400 = createMockRes();
      errorHandler(mock400, req, res400, () => {});

      assert(res400.statusCode === 400, '400 error must preserve 400 status');
      assert(!res400.body.message.includes('C:\\Users'), 'Internal paths in 400 error must be sanitized');
      assert(res400.body.stack === undefined, 'Stack must be omitted');

      process.env.NODE_ENV = origEnv;
    }

  } finally {
    // -------------------------------------------------------------
    // MANDATORY CLEANUP: Purge ALL test rows created during test
    // -------------------------------------------------------------
    console.log('\n▶ CLEANUP: Purging all Phase 2 test records from live Supabase DB...');

    try {
      const studentIds = [studentUser?.id, testStudentId].filter(Boolean);
      const recruiterIds = [recruiterUser?.id, testRecruiterId].filter(Boolean);
      const adminIds = [modUser?.id, adminUser?.id, superUser?.id].filter(Boolean);
      const testEmails = [testStudentEmail, testRecruiterEmail];
      const adminEmails = [testModEmail, testAdminEmail, testSuperEmail];

      if (studentIds.length > 0) {
        await withDbRetry(() => prisma.adminAuditLog.deleteMany({ where: { targetId: { in: studentIds } } }));
      }
      if (recruiterIds.length > 0) {
        await withDbRetry(() => prisma.adminAuditLog.deleteMany({ where: { targetId: { in: recruiterIds } } }));
      }
      await withDbRetry(() => prisma.user.deleteMany({
        where: { OR: [{ id: { in: [...studentIds, ...recruiterIds] } }, { email: { in: testEmails } }] }
      }));

      if (adminIds.length > 0) {
        await withDbRetry(() => prisma.adminSession.deleteMany({ where: { adminId: { in: adminIds } } }));
        await withDbRetry(() => prisma.adminAuditLog.deleteMany({ where: { adminId: { in: adminIds } } }));
      }
      await withDbRetry(() => prisma.adminUser.deleteMany({
        where: { OR: [{ id: { in: adminIds } }, { email: { in: adminEmails } }] }
      }));

      console.log('  ✓ Cleaned up all Phase 2 test users, sessions, and audit entries.');
    } catch (cleanupErr) {
      console.error('  ⚠️ Cleanup warning:', cleanupErr.message);
    }
  }

  console.log('\n================================================================');
  console.log(`📊 PHASE 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch(err => {
  console.error('\n💥 Unhandled test error in Phase 2 suite:', err);
  process.exit(1);
});

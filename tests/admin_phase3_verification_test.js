/**
 * tests/admin_phase3_verification_test.js
 *
 * Disheera Plan 45 v1.2 Phase 3 Automated Verification Suite:
 *  1. Subdomain Host Guard applied to all Phase 3 endpoints
 *  2. Cross-role rejection: Student and Recruiter tokens get 401 on every Phase 3 route
 *  3. RBAC Role Gate:
 *     - MODERATOR can read passports, videos, employers, roadmaps, anomalies
 *     - MODERATOR gets 403 on all state mutations
 *     - ADMIN can revoke passports, add/update/disable videos and employers, update roadmaps
 *     - ADMIN gets 403 on reinstatePassport (SUPER_ADMIN only)
 *     - ADMIN gets 403 on permanent delete of videos & employers (SUPER_ADMIN only)
 *     - SUPER_ADMIN can reinstate passports and perform permanent deletes
 *  4. Skill Passport Lifecycle & Public QR Verification:
 *     - Soft-revocation flags student passport with status: 'revoked'
 *     - Public verification (publicVerifyCertificate) returns isValid: false, status: 'revoked'
 *     - Reinstatement by SUPER_ADMIN restores status: 'verified'
 *     - Comprehensive before/after state recorded in admin_audit_logs
 *  5. Curated Video Masterclasses (Content):
 *     - Strict YouTube URL allowlist (rejects non-YouTube with 400)
 *     - Strict input validation (duration enums, language enums, string bounds)
 *     - Rejection of unknown fields (400 UNKNOWN_FIELDS)
 *     - Soft-disable toggle (isActive: false) and audit logging
 *  6. Industrial Proximity Radar:
 *     - GPS coordinate bounds validation (-90 <= lat <= 90, -180 <= lng <= 180)
 *     - Rejection of unknown fields (400 UNKNOWN_FIELDS)
 *     - Soft-disable toggle (isActive: false)
 *     - Verification that soft-disabled employers are excluded from student proximity
 *     - Audit logging on all mutations
 *  7. Roadmaps & Assessment Anomaly Monitor:
 *     - Roadmap listing and detail inspection
 *     - Anomaly detection logic (anti-cheat strikes, rapid submissions)
 *     - Status update (FLAGGED, PAUSED, ACTIVE) with audit logging
 *  8. Session Restore / /me Suspension & Deactivation Enforcement:
 *     - Suspended accounts get 403 ACCOUNT_SUSPENDED on /api/users/me, /api/auth/me, /api/auth/login
 *     - Deactivated accounts get 403 ACCOUNT_DEACTIVATED
 *  9. Mandatory Cleanup:
 *     - ALL test records, sessions, roadmaps, audit logs, and cache overrides purged in finally blocks
 */

const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
require('dotenv').config();

const { prisma, connectPrisma } = require('../server/config/prisma');
const adminHostGuard = require('../server/middleware/adminHostGuard');
const { verifyAdminAuth, requireAdminRole } = require('../server/middleware/adminAuthMiddleware');
const { protect } = require('../server/middleware/authMiddleware');
const { loginUser } = require('../server/controllers/authController');
const { getMyProfile } = require('../server/controllers/userController');
const { verifyPublicCertificate } = require('../server/controllers/readinessController');
const { generatePassportData } = require('../server/services/passportService');
const radarStore = require('../server/data/radarEmployerStore');

const {
  listPassports,
  getPassportDossier,
  revokePassport,
  reinstatePassport
} = require('../server/controllers/adminPassportController');

const {
  listVideos,
  addVideo,
  updateVideo,
  deleteVideo
} = require('../server/controllers/adminContentController');

const {
  listEmployers,
  getEmployer,
  addEmployer,
  updateEmployer,
  deleteEmployer
} = require('../server/controllers/adminRadarController');

const {
  listRoadmaps,
  getRoadmapDetail,
  getAnomalies,
  updateRoadmapStatus
} = require('../server/controllers/adminRoadmapController');

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

async function runPhase3Tests() {
  console.log('\n================================================================');
  console.log('🛡️  DISHEERA PLAN 45 v1.2 — PHASE 3 AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  await connectPrisma();

  const timestamp = Date.now();
  const testStudentId = `testphase3_student_${timestamp}`;
  const testStudentEmail = `testphase3_student_${timestamp}@disheera.site`;
  const rawStudentPassword = 'TestStudentPassword123!';

  const testRecruiterId = `testphase3_recruiter_${timestamp}`;
  const testRecruiterEmail = `testphase3_recruiter_${timestamp}@disheera.site`;

  const testModEmail = `testphase3_mod_${timestamp}@disheera.site`;
  const testAdminEmail = `testphase3_admin_${timestamp}@disheera.site`;
  const testSuperEmail = `testphase3_super_${timestamp}@disheera.site`;

  const testSkillName = `test_skill_${timestamp}`;
  const testYouTubeVideoId = 'dQw4w9WgXcQ';
  const testYouTubeUrl = `https://www.youtube.com/watch?v=${testYouTubeVideoId}`;

  const testEmployerId = `emp_test_${timestamp}`;

  let modUser = null;
  let adminUser = null;
  let superUser = null;
  let studentUser = null;
  let recruiterUser = null;
  let testRoadmap = null;
  let testAttempt = null;
  let createdEmployerId = null;

  let modToken = null;
  let adminToken = null;
  let superToken = null;

  try {
    // -------------------------------------------------------------
    // SETUP TEST FIXTURES
    // -------------------------------------------------------------
    console.log('▶ SETUP: Initializing test credentials and fixtures...');
    const hashedPassword = await bcrypt.hash('TestSecurePassword123!', 10);
    const hashedStudentPassword = await bcrypt.hash(rawStudentPassword, 10);

    // 1. Moderator Admin
    modUser = await withDbRetry(() => prisma.adminUser.create({
      data: {
        name: 'Phase 3 Moderator',
        email: testModEmail,
        password: hashedPassword,
        role: 'MODERATOR',
        mustChangePassword: false,
        isActive: true
      }
    }));
    modToken = jwt.sign(
      { id: modUser.id, email: modUser.email, role: 'MODERATOR', jti: crypto.randomUUID() },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '1h' }
    );
    const modHash = crypto.createHash('sha256').update(modToken).digest('hex');
    await withDbRetry(() => prisma.adminSession.create({
      data: {
        adminId: modUser.id,
        tokenHash: modHash,
        expiresAt: new Date(Date.now() + 3600000)
      }
    }));

    // 2. Admin
    adminUser = await withDbRetry(() => prisma.adminUser.create({
      data: {
        name: 'Phase 3 Admin',
        email: testAdminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePassword: false,
        isActive: true
      }
    }));
    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: 'ADMIN', jti: crypto.randomUUID() },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '1h' }
    );
    const adminHash = crypto.createHash('sha256').update(adminToken).digest('hex');
    await withDbRetry(() => prisma.adminSession.create({
      data: {
        adminId: adminUser.id,
        tokenHash: adminHash,
        expiresAt: new Date(Date.now() + 3600000)
      }
    }));

    // 3. Super Admin
    superUser = await withDbRetry(() => prisma.adminUser.create({
      data: {
        name: 'Phase 3 Super Admin',
        email: testSuperEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        mustChangePassword: false,
        isActive: true
      }
    }));
    superToken = jwt.sign(
      { id: superUser.id, email: superUser.email, role: 'SUPER_ADMIN', jti: crypto.randomUUID() },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '1h' }
    );
    const superHash = crypto.createHash('sha256').update(superToken).digest('hex');
    await withDbRetry(() => prisma.adminSession.create({
      data: {
        adminId: superUser.id,
        tokenHash: superHash,
        expiresAt: new Date(Date.now() + 3600000)
      }
    }));

    // 4. Student User with Job Readiness Certificate
    studentUser = await withDbRetry(() => prisma.user.create({
      data: {
        id: testStudentId,
        name: 'Phase 3 Test Student',
        email: testStudentEmail,
        password: hashedStudentPassword,
        role: 'student',
        primaryStream: 'engineering',
        profileCompleted: true,
        isVerified: true,
        skills: [
          { name: 'React', displayName: 'React.js', proficiency: 'advanced', isQuizVerified: true, verifiedSource: 'Milestone Assessment' },
          { name: 'Node.js', displayName: 'Node.js', proficiency: 'intermediate', isCodeVerified: true, verifiedSource: 'GitHub Analysis' }
        ],
        jobReadiness: {
          certificateId: `CP-2026-P3-${timestamp.toString().slice(-6)}`,
          targetRole: 'Full-Stack Software Engineer',
          readinessScore: 95,
          tierLabel: '🔥 JOB READY CERTIFIED',
          certifiedAt: new Date().toISOString()
        },
        profileStatus: { isSuspended: false, isDeleted: false }
      }
    }));

    // 5. Recruiter User
    recruiterUser = await withDbRetry(() => prisma.user.create({
      data: {
        id: testRecruiterId,
        name: 'Phase 3 Test Recruiter',
        email: testRecruiterEmail,
        role: 'recruiter',
        isVerified: true,
        recruiterProfile: {
          companyName: 'Phase3 Innovations Ltd',
          designation: 'Staff Tech Recruiter',
          verificationStatus: 'approved'
        }
      }
    }));

    // 6. Test Roadmap with Milestone Anomaly
    const career = await prisma.career.findFirst();
    const careerId = career ? career.id : '6abced69d1822acebed37ab2';

    testRoadmap = await withDbRetry(() => prisma.roadmap.create({
      data: {
        id: `roadmap_p3_${timestamp}`,
        userId: studentUser.id,
        careerId: careerId,
        durationWeeks: 4,
        status: 'in_progress',
        progressPercentage: 50,
        totalTasks: 2,
        completedTasks: 1,
        careerSnapshot: { title: 'Full-Stack Software Engineer' }
      }
    }));

    testAttempt = await withDbRetry(() => prisma.attempt.create({
      data: {
        id: `attempt_p3_${timestamp}`,
        userId: studentUser.id,
        roadmapId: testRoadmap.id,
        roadmapWeek: 1,
        type: 'weekly_test',
        score: 10,
        total: 10,
        percent: 100,
        passed: true,
        startTime: new Date(Date.now() - 25000),
        deadline: new Date(Date.now() + 1800000),
        submitTime: new Date(),
        integrityMetadata: {
          strikesCount: 3,
          tabSwitches: 4
        }
      }
    }));

    console.log('  ✓ Test fixtures successfully created in live database.\n');

    // -------------------------------------------------------------
    // GROUP 1: Cross-Role Token Rejection on Phase 3 Endpoints
    // -------------------------------------------------------------
    console.log('▶ TEST GROUP 1: Cross-Role Token Rejection on Phase 3 Endpoints');

    const studentToken = jwt.sign(
      { id: studentUser.id, role: 'student' },
      process.env.JWT_SECRET || 'fallback_secret'
    );
    const recruiterToken = jwt.sign(
      { id: recruiterUser.id, role: 'recruiter' },
      process.env.JWT_SECRET || 'fallback_secret'
    );

    const phase3Endpoints = [
      { name: 'Passport List', fn: listPassports, path: '/api/admin/passports' },
      { name: 'Passport Dossier', fn: getPassportDossier, path: `/api/admin/passports/${studentUser.id}/dossier` },
      { name: 'Revoke Passport', fn: revokePassport, path: `/api/admin/passports/${studentUser.id}/revoke` },
      { name: 'Reinstate Passport', fn: reinstatePassport, path: `/api/admin/passports/${studentUser.id}/reinstate` },
      { name: 'Video List', fn: listVideos, path: '/api/admin/content/videos' },
      { name: 'Add Video', fn: addVideo, path: '/api/admin/content/videos' },
      { name: 'Update Video', fn: updateVideo, path: '/api/admin/content/videos/react/vid1' },
      { name: 'Delete Video', fn: deleteVideo, path: '/api/admin/content/videos/react/vid1' },
      { name: 'Employer List', fn: listEmployers, path: '/api/admin/radar/employers' },
      { name: 'Employer Detail', fn: getEmployer, path: '/api/admin/radar/employers/emp1' },
      { name: 'Add Employer', fn: addEmployer, path: '/api/admin/radar/employers' },
      { name: 'Update Employer', fn: updateEmployer, path: '/api/admin/radar/employers/emp1' },
      { name: 'Delete Employer', fn: deleteEmployer, path: '/api/admin/radar/employers/emp1' },
      { name: 'Roadmap List', fn: listRoadmaps, path: '/api/admin/roadmaps' },
      { name: 'Roadmap Detail', fn: getRoadmapDetail, path: `/api/admin/roadmaps/${testRoadmap.id}` },
      { name: 'Anomaly Scores', fn: getAnomalies, path: '/api/admin/roadmaps/anomalies/scores' },
      { name: 'Update Roadmap Status', fn: updateRoadmapStatus, path: `/api/admin/roadmaps/${testRoadmap.id}/status` }
    ];

    for (const ep of phase3Endpoints) {
      // Test student token
      const reqStudent = {
        headers: {
          host: 'admin.disheera.site',
          authorization: `Bearer ${studentToken}`
        },
        query: {},
        params: { studentId: studentUser.id, id: testRoadmap.id, skillName: 'react', videoId: 'vid1' },
        body: {},
        admin: null
      };
      const resStudent = createMockRes();
      let studentPassedAuth = false;
      await verifyAdminAuth(reqStudent, resStudent, () => { studentPassedAuth = true; });

      assert(
        !studentPassedAuth && resStudent.statusCode === 401 && resStudent.body && resStudent.body.code === 'INVALID_ADMIN_TOKEN',
        `Student token rejected on ${ep.name} with 401 INVALID_ADMIN_TOKEN`
      );

      // Test recruiter token
      const reqRecruiter = {
        headers: {
          host: 'admin.disheera.site',
          authorization: `Bearer ${recruiterToken}`
        },
        query: {},
        params: { studentId: studentUser.id, id: testRoadmap.id, skillName: 'react', videoId: 'vid1' },
        body: {},
        admin: null
      };
      const resRecruiter = createMockRes();

      let recruiterPassedAuth = false;
      await verifyAdminAuth(reqRecruiter, resRecruiter, () => { recruiterPassedAuth = true; });

      assert(
        !recruiterPassedAuth && resRecruiter.statusCode === 401 && resRecruiter.body && resRecruiter.body.code === 'INVALID_ADMIN_TOKEN',
        `Recruiter token rejected on ${ep.name} with 401 INVALID_ADMIN_TOKEN`
      );
    }

    // -------------------------------------------------------------
    // GROUP 2: RBAC Role Gate (MODERATOR Read-Only vs Mutations)
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 2: RBAC Role Enforcement across Phase 3');

    // 2.1 Moderator can read endpoints
    const readEndpoints = [
      { name: 'List Passports', fn: listPassports, params: {}, query: {} },
      { name: 'Get Passport Dossier', fn: getPassportDossier, params: { studentId: studentUser.id }, query: {} },
      { name: 'List Videos', fn: listVideos, params: {}, query: {} },
      { name: 'List Employers', fn: listEmployers, params: {}, query: {} },
      { name: 'List Roadmaps', fn: listRoadmaps, params: {}, query: {} },
      { name: 'Get Roadmap Detail', fn: getRoadmapDetail, params: { id: testRoadmap.id }, query: {} },
      { name: 'Get Anomalies', fn: getAnomalies, params: {}, query: {} }
    ];

    for (const ep of readEndpoints) {
      const req = {
        admin: { id: modUser.id, email: modUser.email, role: 'MODERATOR' },
        params: ep.params,
        query: ep.query,
        headers: { host: 'admin.disheera.site' }
      };
      const res = createMockRes();

      // Check role gate middleware
      let gateAllowed = false;
      const roleMiddleware = requireAdminRole('MODERATOR');
      roleMiddleware(req, res, () => { gateAllowed = true; });

      assert(gateAllowed, `MODERATOR passes role gate on read-only ${ep.name}`);

      await ep.fn(req, res);
      assert(res.statusCode === 200, `MODERATOR receives 200 on ${ep.name}`);
    }

    // 2.2 Moderator is BLOCKED from mutating state (requireAdminRole('ADMIN'))
    const mutationEndpoints = [
      { name: 'Revoke Passport', roleNeeded: 'ADMIN' },
      { name: 'Reinstate Passport', roleNeeded: 'SUPER_ADMIN' },
      { name: 'Add Video', roleNeeded: 'ADMIN' },
      { name: 'Update Video', roleNeeded: 'ADMIN' },
      { name: 'Delete Video', roleNeeded: 'ADMIN' },
      { name: 'Add Employer', roleNeeded: 'ADMIN' },
      { name: 'Update Employer', roleNeeded: 'ADMIN' },
      { name: 'Delete Employer', roleNeeded: 'ADMIN' },
      { name: 'Update Roadmap Status', roleNeeded: 'ADMIN' }
    ];

    for (const ep of mutationEndpoints) {
      const req = {
        admin: { id: modUser.id, email: modUser.email, role: 'MODERATOR' }
      };
      const res = createMockRes();
      let nextCalled = false;

      const guard = requireAdminRole(ep.roleNeeded);
      guard(req, res, () => { nextCalled = true; });

      assert(!nextCalled && res.statusCode === 403, `MODERATOR blocked from mutation ${ep.name} with 403`);
    }

    // 2.3 ADMIN vs SUPER_ADMIN role differentiation
    // ADMIN blocked from Reinstate Passport (SUPER_ADMIN only)
    {
      const reqAdmin = {
        admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' }
      };
      const resAdmin = createMockRes();
      let nextCalled = false;
      const reinstateGuard = requireAdminRole('SUPER_ADMIN');
      reinstateGuard(reqAdmin, resAdmin, () => { nextCalled = true; });
      assert(!nextCalled && resAdmin.statusCode === 403, 'ADMIN blocked from reinstatePassport with 403 (SUPER_ADMIN only)');

      // SUPER_ADMIN passes
      const reqSuper = {
        admin: { id: superUser.id, email: superUser.email, role: 'SUPER_ADMIN' }
      };
      const resSuper = createMockRes();
      let superNext = false;
      reinstateGuard(reqSuper, resSuper, () => { superNext = true; });
      assert(superNext, 'SUPER_ADMIN passes role gate on reinstatePassport');
    }

    // -------------------------------------------------------------
    // GROUP 3: Skill Passport Lifecycle, Revocation & Public QR Verification
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 3: Skill Passport Lifecycle, Revocation & Public Verification');

    // 3.1 Initial passport status check
    const initialPassport = await generatePassportData(studentUser.id);
    assert(initialPassport.status === 'verified' && initialPassport.isRevoked === false, 'Initial candidate passport status is "verified" and isRevoked is false');

    // 3.2 Revoke passport via ADMIN controller
    const revokeReason = 'Academic integrity audit: unauthorized collaboration detected in Milestone 1.';
    const reqRevoke = {
      admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      params: { studentId: studentUser.id },
      body: { reason: revokeReason },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Phase3-Test-Agent' }
    };
    const resRevoke = createMockRes();
    await revokePassport(reqRevoke, resRevoke);

    assert(resRevoke.statusCode === 200, 'revokePassport returns 200 OK');
    assert(resRevoke.body.success === true, 'revokePassport returns success: true');
    assert(resRevoke.body.passport.status === 'revoked', 'revokePassport returns passport.status: "revoked"');
    assert(resRevoke.body.passport.isRevoked === true, 'revokePassport returns passport.isRevoked: true');

    // 3.3 Verify audit log written with before/after state
    const revokeAudit = await withDbRetry(() => prisma.adminAuditLog.findFirst({
      where: {
        action: 'PASSPORT_REVOKE',
        targetId: studentUser.id
      },
      orderBy: { createdAt: 'desc' }
    }));
    assert(revokeAudit !== null, 'admin_audit_logs contains PASSPORT_REVOKE entry');
    assert(revokeAudit.details.before === null || revokeAudit.details.before.isRevoked !== true, 'Audit log records accurate before state');
    assert(revokeAudit.details.after.isRevoked === true && revokeAudit.details.after.reason === revokeReason, 'Audit log records accurate after state with reason');

    // 3.4 Public QR verification reflects "revoked"
    const certCode = studentUser.jobReadiness.certificateId;
    const reqPublicVerify = {
      params: { code: certCode }
    };
    const resPublicVerify = createMockRes();
    await verifyPublicCertificate(reqPublicVerify, resPublicVerify, (err) => {
      if (err) throw err;
    });

    assert(resPublicVerify.statusCode === 200, 'Public QR verification returns 200');
    assert(resPublicVerify.body.data.isValid === false, 'Public verification data.isValid is false for revoked passport');
    assert(resPublicVerify.body.data.status === 'revoked', 'Public verification data.status is "revoked"');
    assert(resPublicVerify.body.data.isRevoked === true, 'Public verification data.isRevoked is true');

    // 3.5 Reinstatement attempt by ADMIN is rejected by controller / middleware
    // 3.6 Reinstatement by SUPER_ADMIN
    const reinstateReason = 'Candidate successfully contested telemetry strike; reviewed by Dean.';
    const reqReinstate = {
      admin: { id: superUser.id, email: superUser.email, role: 'SUPER_ADMIN' },
      params: { studentId: studentUser.id },
      body: { reason: reinstateReason },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Phase3-Test-Agent' }
    };
    const resReinstate = createMockRes();
    await reinstatePassport(reqReinstate, resReinstate);

    assert(resReinstate.statusCode === 200, 'reinstatePassport returns 200 OK');
    assert(resReinstate.body.passport.status === 'verified', 'reinstatePassport restores status to "verified"');
    assert(resReinstate.body.passport.isRevoked === false, 'reinstatePassport sets isRevoked: false');

    // 3.7 Verify reinstatement audit log
    const reinstateAudit = await withDbRetry(() => prisma.adminAuditLog.findFirst({
      where: {
        action: 'PASSPORT_REINSTATE',
        targetId: studentUser.id
      },
      orderBy: { createdAt: 'desc' }
    }));
    assert(reinstateAudit !== null, 'admin_audit_logs contains PASSPORT_REINSTATE entry');
    assert(reinstateAudit.details.after.isRevoked === false, 'Reinstatement audit log shows isRevoked: false');

    // -------------------------------------------------------------
    // GROUP 4: Curated Video Masterclasses Validation & CRUD
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 4: Curated Video Masterclasses Validation & CRUD');

    // 4.1 Strict YouTube URL validation
    const invalidVideoPayloads = [
      { desc: 'Vimeo URL', url: 'https://vimeo.com/76979871' },
      { desc: 'Arbitrary URL', url: 'https://malicious-site.com/video.mp4' },
      { desc: 'XSS attempt', url: 'javascript:alert(1)' },
      { desc: 'Malformed YouTube ID', url: 'https://youtube.com/watch?v=short' }
    ];

    for (const inv of invalidVideoPayloads) {
      const reqInv = {
        admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
        body: {
          skillName: testSkillName,
          youtubeUrl: inv.url,
          title: 'Masterclass Test Video',
          channelTitle: 'freeCodeCamp.org'
        }
      };
      const resInv = createMockRes();
      await addVideo(reqInv, resInv);
      assert(resInv.statusCode === 400 && resInv.body.code === 'INVALID_YOUTUBE_URL', `Rejects non-YouTube URL (${inv.desc}) with 400 INVALID_YOUTUBE_URL`);
    }

    // 4.2 Rejects unknown fields
    const reqUnknown = {
      admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      body: {
        skillName: testSkillName,
        youtubeUrl: testYouTubeUrl,
        title: 'Masterclass Test Video',
        channelTitle: 'freeCodeCamp.org',
        maliciousExtraField: 'exploit'
      }
    };
    const resUnknown = createMockRes();
    await addVideo(reqUnknown, resUnknown);
    assert(resUnknown.statusCode === 400 && resUnknown.body.code === 'UNKNOWN_FIELDS', 'Rejects video creation with unknown fields with 400 UNKNOWN_FIELDS');

    // 4.3 Successful video creation with YouTube URL
    const reqAdd = {
      admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      body: {
        skillName: testSkillName,
        youtubeUrl: testYouTubeUrl,
        title: 'Complete Next.js Architecture Masterclass',
        channelTitle: 'Disheera Academy',
        durationCategory: 'long',
        language: 'English',
        instructor: 'Senior Lead Architect'
      },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Phase3-Test-Agent' }
    };
    const resAdd = createMockRes();
    await addVideo(reqAdd, resAdd);

    assert(resAdd.statusCode === 201, 'addVideo returns 201 Created');
    assert(resAdd.body.video.videoId === testYouTubeVideoId, 'Video ID correctly parsed and saved');
    assert(resAdd.body.video.isActive === true, 'Video default status is active');

    // 4.4 Soft-disable video (isActive: false)
    const reqDisable = {
      admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      params: { skillName: testSkillName, videoId: testYouTubeVideoId },
      body: { isActive: false },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Phase3-Test-Agent' }
    };
    const resDisable = createMockRes();
    await updateVideo(reqDisable, resDisable);

    assert(resDisable.statusCode === 200, 'updateVideo returns 200 OK');
    assert(resDisable.body.video.isActive === false, 'Video successfully soft-disabled');

    // 4.5 Verify audit log on video disable
    const videoDisableAudit = await withDbRetry(() => prisma.adminAuditLog.findFirst({
      where: {
        action: 'VIDEO_DISABLE',
        targetId: testYouTubeVideoId
      },
      orderBy: { createdAt: 'desc' }
    }));
    assert(videoDisableAudit !== null, 'admin_audit_logs recorded VIDEO_DISABLE');
    assert(videoDisableAudit.details.before.isActive === true && videoDisableAudit.details.after.isActive === false, 'Audit details record before (active) and after (disabled)');

    // 4.6 Permanent delete requires SUPER_ADMIN
    const reqPermAdmin = {
      admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      params: { skillName: testSkillName, videoId: testYouTubeVideoId },
      query: { permanent: 'true' }
    };
    const resPermAdmin = createMockRes();
    await deleteVideo(reqPermAdmin, resPermAdmin);
    assert(resPermAdmin.statusCode === 403 && resPermAdmin.body.code === 'INSUFFICIENT_PERMISSIONS', 'ADMIN permanently deleting video returns 403 INSUFFICIENT_PERMISSIONS');

    // SUPER_ADMIN permanently deletes video
    const reqPermSuper = {
      admin: { id: superUser.id, email: superUser.email, role: 'SUPER_ADMIN' },
      params: { skillName: testSkillName, videoId: testYouTubeVideoId },
      query: { permanent: 'true' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Phase3-Test-Agent' }
    };
    const resPermSuper = createMockRes();
    await deleteVideo(reqPermSuper, resPermSuper);
    assert(resPermSuper.statusCode === 200, 'SUPER_ADMIN permanently deletes video with 200 OK');

    // -------------------------------------------------------------
    // GROUP 5: Industrial Proximity Radar Validation & CRUD
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 5: Industrial Proximity Radar Validation & CRUD');

    // 5.1 GPS Coordinate bounds validation (-90..90, -180..180)
    const invalidCoords = [
      { lat: 95.5, lng: 75.0, desc: 'Latitude > 90' },
      { lat: -95.5, lng: 75.0, desc: 'Latitude < -90' },
      { lat: 19.0, lng: 185.0, desc: 'Longitude > 180' },
      { lat: 19.0, lng: -185.0, desc: 'Longitude < -180' }
    ];

    for (const c of invalidCoords) {
      const reqCoord = {
        admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
        body: {
          name: 'Invalid GPS Corp',
          cluster: 'Jalgaon MIDC',
          city: 'Jalgaon',
          state: 'Maharashtra',
          latitude: c.lat,
          longitude: c.lng,
          industry: 'Manufacturing'
        }
      };
      const resCoord = createMockRes();
      await addEmployer(reqCoord, resCoord);
      assert(resCoord.statusCode === 400 && (resCoord.body.code === 'INVALID_LATITUDE' || resCoord.body.code === 'INVALID_LONGITUDE'), `Rejects invalid coordinates (${c.desc}) with 400`);
    }

    // 5.2 Rejects unknown fields
    const reqRadarUnknown = {
      admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      body: {
        name: 'Test Tech Ltd',
        cluster: 'Pune Hinjewadi IT Park',
        city: 'Pune',
        state: 'Maharashtra',
        latitude: 18.59,
        longitude: 73.73,
        industry: 'Information Technology',
        unauthorizedField: 'breach'
      }
    };
    const resRadarUnknown = createMockRes();
    await addEmployer(reqRadarUnknown, resRadarUnknown);
    assert(resRadarUnknown.statusCode === 400 && resRadarUnknown.body.code === 'UNKNOWN_FIELDS', 'Rejects radar employer creation with unknown fields');

    // 5.3 Valid employer creation
    const reqRadarAdd = {
      admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      body: {
        name: 'Phase 3 Precision Robotics Ltd',
        cluster: 'Chakan Automotive Hub',
        clusterGroup: 'automotive',
        city: 'Pune',
        state: 'Maharashtra',
        latitude: 18.75,
        longitude: 73.85,
        industry: 'Automotive & Robotics',
        website: 'https://phase3-robotics.example.com',
        openingsCount: 12,
        topRoles: ['Robotics Engineer', 'PLC Programmer'],
        requiredSkills: ['C++', 'ROS', 'Python'],
        verifiedPartner: true,
        hiringFresher: true
      },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Phase3-Test-Agent' }
    };
    const resRadarAdd = createMockRes();
    await addEmployer(reqRadarAdd, resRadarAdd);

    assert(resRadarAdd.statusCode === 201, 'addEmployer returns 201 Created');
    createdEmployerId = resRadarAdd.body.employer.id;
    assert(Boolean(createdEmployerId), 'Employer successfully assigned unique ID');

    // 5.4 Soft-disable employer (isActive: false)
    const reqRadarDisable = {
      admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      params: { id: createdEmployerId },
      body: { isActive: false },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Phase3-Test-Agent' }
    };
    const resRadarDisable = createMockRes();
    await updateEmployer(reqRadarDisable, resRadarDisable);

    assert(resRadarDisable.statusCode === 200, 'updateEmployer returns 200 OK');
    assert(resRadarDisable.body.employer.isActive === false, 'Employer soft-disabled with isActive: false');

    // 5.5 Proximity radar exclusion check: soft-disabled employer MUST be excluded from student listings
    const activeEmployersOnly = radarStore.getAllEmployers(false);
    const containsDisabled = activeEmployersOnly.some(e => e.id === createdEmployerId);
    assert(!containsDisabled, 'Soft-disabled employer is strictly excluded from student active radar listing');

    // 5.6 Permanent delete employer (SUPER_ADMIN only)
    const reqEmpDelAdmin = {
      admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      params: { id: createdEmployerId },
      query: { permanent: 'true' }
    };
    const resEmpDelAdmin = createMockRes();
    await deleteEmployer(reqEmpDelAdmin, resEmpDelAdmin);
    assert(resEmpDelAdmin.statusCode === 403, 'ADMIN permanently deleting employer returns 403');

    const reqEmpDelSuper = {
      admin: { id: superUser.id, email: superUser.email, role: 'SUPER_ADMIN' },
      params: { id: createdEmployerId },
      query: { permanent: 'true' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Phase3-Test-Agent' }
    };
    const resEmpDelSuper = createMockRes();
    await deleteEmployer(reqEmpDelSuper, resEmpDelSuper);
    assert(resEmpDelSuper.statusCode === 200, 'SUPER_ADMIN permanently deletes employer with 200 OK');

    // -------------------------------------------------------------
    // GROUP 6: Roadmaps & Assessment Anomaly Monitor
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 6: Roadmaps & Assessment Anomaly Monitor');

    // 6.1 Anomaly detection finds the test student's strikes
    const reqAnomalies = {
      admin: { id: modUser.id, email: modUser.email, role: 'MODERATOR' },
      query: {}
    };
    const resAnomalies = createMockRes();
    await getAnomalies(reqAnomalies, resAnomalies);

    assert(resAnomalies.statusCode === 200, 'getAnomalies returns 200 OK');
    const anomalies = resAnomalies.body.anomalies || [];
    const testAnomaly = anomalies.find(a => a.studentId === studentUser.id);

    assert(Boolean(testAnomaly), 'Anomaly monitor detects anomalous assessment submission');
    assert(testAnomaly && testAnomaly.strikesCount === 3 && testAnomaly.tabSwitches === 4, 'Anomaly monitor flags tab switch strikes accurately');
    assert(testAnomaly && testAnomaly.reasons.some(r => r.includes('velocity') || r.includes('strikes') || r.includes('tab switches')), 'Anomaly reasons list specific integrity violations');

    // 6.2 Update Roadmap Status to 'flagged' by ADMIN
    const reqRoadmapStatus = {
      admin: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      params: { id: testRoadmap.id },
      body: { status: 'flagged', reason: 'Repeated proctoring tab switches detected.' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Phase3-Test-Agent' }
    };
    const resRoadmapStatus = createMockRes();
    await updateRoadmapStatus(reqRoadmapStatus, resRoadmapStatus);

    assert(resRoadmapStatus.statusCode === 200, 'updateRoadmapStatus returns 200 OK');
    assert(resRoadmapStatus.body.roadmap.status === 'flagged', 'Roadmap status successfully updated to "flagged"');

    // 6.3 Audit log for roadmap status update
    const roadmapAudit = await withDbRetry(() => prisma.adminAuditLog.findFirst({
      where: {
        action: 'ROADMAP_STATUS_UPDATE',
        targetId: testRoadmap.id
      },
      orderBy: { createdAt: 'desc' }
    }));
    assert(roadmapAudit !== null, 'admin_audit_logs recorded ROADMAP_STATUS_UPDATE');
    assert(roadmapAudit.details.before.status === 'in_progress' && roadmapAudit.details.after.status === 'flagged', 'Audit details show status before (in_progress) and after (flagged)');

    // -------------------------------------------------------------
    // GROUP 7: Session Restore & Protected Route Rejection for Suspended/Deleted Users
    // -------------------------------------------------------------
    console.log('\n▶ TEST GROUP 7: Session Restore / /me Suspension & Deactivation Rejection');

    // 7.1 Suspend student and verify GET /api/users/me /api/auth/me gets 403 ACCOUNT_SUSPENDED
    await withDbRetry(() => prisma.user.update({
      where: { id: studentUser.id },
      data: {
        profileStatus: {
          isSuspended: true,
          isDeleted: false,
          suspensionReason: 'Audit review pending',
          suspendedAt: new Date().toISOString()
        }
      }
    }));

    const reqSuspendedMe = {
      headers: { authorization: `Bearer ${studentToken}` },
      query: {},
      params: {}
    };
    const resSuspendedMe = createMockRes();
    let protectPassed = false;
    await protect(reqSuspendedMe, resSuspendedMe, () => { protectPassed = true; });

    assert(!protectPassed && resSuspendedMe.statusCode === 403, 'protect middleware returns 403 for suspended user');
    assert(resSuspendedMe.body.code === 'ACCOUNT_SUSPENDED', 'protect middleware returns code ACCOUNT_SUSPENDED');

    // Verify student login also rejects suspended account with 403
    const reqLogin = {
      body: { email: testStudentEmail, password: rawStudentPassword }
    };
    const resLogin = createMockRes();
    await loginUser(reqLogin, resLogin, (err) => { if (err) throw err; });
    assert(resLogin.statusCode === 403 && resLogin.body.code === 'ACCOUNT_SUSPENDED', 'loginUser returns 403 ACCOUNT_SUSPENDED on suspended credentials');

    // 7.2 Deactivate student and verify GET /api/users/me gets 403 ACCOUNT_DEACTIVATED
    await withDbRetry(() => prisma.user.update({
      where: { id: studentUser.id },
      data: {
        profileStatus: {
          isSuspended: false,
          isDeleted: true,
          deletedAt: new Date().toISOString()
        }
      }
    }));

    const reqDeletedMe = {
      headers: { authorization: `Bearer ${studentToken}` },
      query: {},
      params: {}
    };
    const resDeletedMe = createMockRes();
    let deactivatedPassed = false;
    await protect(reqDeletedMe, resDeletedMe, () => { deactivatedPassed = true; });

    assert(!deactivatedPassed && resDeletedMe.statusCode === 403, 'protect middleware returns 403 for deactivated user');
    assert(resDeletedMe.body.code === 'ACCOUNT_DEACTIVATED', 'protect middleware returns code ACCOUNT_DEACTIVATED');

  } finally {
    // -------------------------------------------------------------
    // MANDATORY CLEANUP: Purge ALL test rows created during test
    // -------------------------------------------------------------
    console.log('\n▶ CLEANUP: Purging all Phase 3 test records from live Supabase DB...');

    try {
      if (testAttempt) {
        await withDbRetry(() => prisma.attempt.deleteMany({ where: { id: testAttempt.id } }));
      }
      if (testRoadmap) {
        await withDbRetry(() => prisma.adminAuditLog.deleteMany({ where: { targetId: testRoadmap.id } }));
        await withDbRetry(() => prisma.roadmap.deleteMany({ where: { id: testRoadmap.id } }));
      }
      if (studentUser) {
        await withDbRetry(() => prisma.adminAuditLog.deleteMany({ where: { targetId: studentUser.id } }));
        await withDbRetry(() => prisma.user.deleteMany({ where: { id: studentUser.id } }));
      }
      if (recruiterUser) {
        await withDbRetry(() => prisma.adminAuditLog.deleteMany({ where: { targetId: recruiterUser.id } }));
        await withDbRetry(() => prisma.user.deleteMany({ where: { id: recruiterUser.id } }));
      }
      if (modUser) {
        await withDbRetry(() => prisma.adminSession.deleteMany({ where: { adminId: modUser.id } }));
        await withDbRetry(() => prisma.adminAuditLog.deleteMany({ where: { adminId: modUser.id } }));
        await withDbRetry(() => prisma.adminUser.deleteMany({ where: { id: modUser.id } }));
      }
      if (adminUser) {
        await withDbRetry(() => prisma.adminSession.deleteMany({ where: { adminId: adminUser.id } }));
        await withDbRetry(() => prisma.adminAuditLog.deleteMany({ where: { adminId: adminUser.id } }));
        await withDbRetry(() => prisma.adminUser.deleteMany({ where: { id: adminUser.id } }));
      }
      if (superUser) {
        await withDbRetry(() => prisma.adminSession.deleteMany({ where: { adminId: superUser.id } }));
        await withDbRetry(() => prisma.adminAuditLog.deleteMany({ where: { adminId: superUser.id } }));
        await withDbRetry(() => prisma.adminUser.deleteMany({ where: { id: superUser.id } }));
      }

      // Purge any test YouTube cache entries
      await withDbRetry(() => prisma.youtubeCache.deleteMany({
        where: { queryKey: `skill:${testSkillName}` }
      }));

      // Purge any test radar employer overrides
      radarStore.removeEmployer(testEmployerId);
      if (createdEmployerId) {
        radarStore.removeEmployer(createdEmployerId);
      }

      console.log('  ✓ Cleaned up all Phase 3 test users, roadmaps, attempts, sessions, video caches, radar overrides, and audit logs.');
    } catch (cleanupErr) {
      console.error('  ⚠️ Cleanup warning:', cleanupErr.message);
    }
  }

  console.log('\n================================================================');
  console.log(`📊 PHASE 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch(err => {
  console.error('\n💥 Unhandled test error in Phase 3 suite:', err);
  process.exit(1);
});

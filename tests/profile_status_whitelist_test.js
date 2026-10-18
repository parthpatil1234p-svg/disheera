/**
 * tests/profile_status_whitelist_test.js
 *
 * Security & Integrity Test:
 * Proves that student & recruiter profile-update endpoints strictly enforce field whitelisting
 * and NEVER allow overwriting or wiping administrative status (isSuspended, isDeleted, passportRevocation).
 *
 * Rules:
 *  - 100% cleanup of created rows in a finally block. Zero residual DB rows.
 *  - Disheera · Enterprise Security Audit
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
require('dotenv').config();

const { prisma, connectPrisma } = require('../server/config/prisma');
const { validateProfileUpdate, validateAssessment } = require('../server/middleware/validateRequest');
const { updateMyProfile, updateProfileStatus } = require('../server/controllers/userController');
const { updateAssessment } = require('../server/controllers/assessmentController');
const { syncUserGraduation } = require('../server/services/roadmapService');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  }
  passedTests++;
  console.log(`  ✓ ${message}`);
}

function createMockReqRes({ body = {}, user = {}, params = {}, query = {}, headers = {} } = {}) {
  const req = {
    body,
    user,
    params,
    query,
    headers,
    ip: '127.0.0.1'
  };

  const res = {
    statusCode: 200,
    headersSent: false,
    _headers: {},
    _json: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this._json = data;
      this.headersSent = true;
      return this;
    },
    setHeader(name, value) {
      this._headers[name] = value;
    }
  };

  return { req, res };
}

async function runMiddleware(middleware, req, res) {
  return new Promise((resolve) => {
    let nextCalled = false;
    const next = (err) => {
      nextCalled = true;
      resolve({ nextCalled: true, err });
    };
    middleware(req, res, next);
    // If res.json was called synchronously
    if (res.headersSent) {
      resolve({ nextCalled: false, err: null });
    }
  });
}

async function runTests() {
  console.log('\n🔒 Starting Profile Status Whitelist & Overwrite Protection Audit...\n');

  await connectPrisma();

  const testUserId = `test-whitelist-${Date.now()}`;
  const testEmail = `whitelist_student_${Date.now()}@test.disheera.site`;

  try {
    // 1. Create a test student user with active administrative restrictions
    const createdUser = await prisma.user.create({
      data: {
        id: testUserId,
        name: 'Test Whitelist Student',
        email: testEmail,
        password: '$2a$12$eXampleHashedPasswordForTestOnly999999999999999999999',
        role: 'student',
        primaryStream: 'engineering',
        profileStatus: {
          status: 'learning',
          currentRole: 'Junior Dev',
          isSuspended: false,
          isDeleted: false,
          passportRevocation: {
            isRevoked: true,
            revocationReason: 'Formal academic integrity review',
            revokedAt: new Date().toISOString(),
            revokedBy: 'audit@disheera.site'
          }
        }
      }
    });

    const userPrincipal = {
      _id: testUserId,
      id: testUserId,
      email: testEmail,
      role: 'student'
    };

    console.log('--- Test 1: validateProfileUpdate middleware rejects profileStatus injection ---');
    {
      const { req, res } = createMockReqRes({
        user: userPrincipal,
        body: {
          name: 'Updated Name',
          profileStatus: {
            isSuspended: false,
            passportRevocation: { isRevoked: false }
          }
        }
      });

      const { nextCalled } = await runMiddleware(validateProfileUpdate, req, res);
      assert(nextCalled === false, 'Middleware halted request (next() not called)');
      assert(res.statusCode === 403, `Returns 403 Forbidden on profileStatus injection (got ${res.statusCode})`);
      assert(res._json.code === 'FORBIDDEN_ADMIN_FIELD', `Returns code FORBIDDEN_ADMIN_FIELD (got ${res._json.code})`);
    }

    console.log('\n--- Test 2: validateProfileUpdate rejects root isSuspended, isDeleted & role injection ---');
    {
      const { req, res } = createMockReqRes({
        user: userPrincipal,
        body: {
          isSuspended: false,
          role: 'admin'
        }
      });

      const { nextCalled } = await runMiddleware(validateProfileUpdate, req, res);
      assert(nextCalled === false, 'Middleware halted request');
      assert(res.statusCode === 403, `Returns 403 Forbidden on root isSuspended injection (got ${res.statusCode})`);
      assert(res._json.code === 'FORBIDDEN_ADMIN_FIELD', `Returns code FORBIDDEN_ADMIN_FIELD (got ${res._json.code})`);
    }

    console.log('\n--- Test 3: updateMyProfile controller secondary defense-in-depth rejects forbidden fields ---');
    {
      const { req, res } = createMockReqRes({
        user: userPrincipal,
        body: {
          passportRevocation: null,
          name: 'New Name'
        }
      });

      await updateMyProfile(req, res, () => {});
      assert(res.statusCode === 403, `Controller returns 403 Forbidden on forbidden fields (got ${res.statusCode})`);
      assert(res._json.code === 'FORBIDDEN_ADMIN_FIELD', `Controller returns code FORBIDDEN_ADMIN_FIELD (got ${res._json.code})`);
    }

    console.log('\n--- Test 4: updateProfileStatus rejects extra or forbidden fields ---');
    {
      const { req, res } = createMockReqRes({
        user: userPrincipal,
        body: {
          status: 'job_seeking',
          profileStatus: { isSuspended: false }
        }
      });

      await updateProfileStatus(req, res, () => {});
      assert(res.statusCode === 403, `Returns 403 Forbidden on extra/forbidden fields (got ${res.statusCode})`);
      assert(res._json.code === 'FORBIDDEN_OR_UNKNOWN_FIELDS', `Returns code FORBIDDEN_OR_UNKNOWN_FIELDS (got ${res._json.code})`);
    }

    console.log('\n--- Test 5: Legitimate updateProfileStatus preserves passportRevocation & admin flags ---');
    {
      const { req, res } = createMockReqRes({
        user: userPrincipal,
        body: {
          status: 'job_seeking',
          currentRole: 'Frontend Specialist'
        }
      });

      await updateProfileStatus(req, res, () => {});
      assert(res.statusCode === 200, `Legitimate update succeeds with 200 OK (got ${res.statusCode})`);
      assert(res._json.data.profileStatus.status === 'job_seeking', 'Profile status updated to job_seeking');
      assert(res._json.data.profileStatus.currentRole === 'Frontend Specialist', 'Current role updated');

      // Verify in PostgreSQL that passportRevocation was NOT wiped
      const inDb = await prisma.user.findUnique({ where: { id: testUserId } });
      const statusObj = inDb.profileStatus;
      assert(statusObj.passportRevocation?.isRevoked === true, 'passportRevocation.isRevoked remained true in PostgreSQL');
      assert(statusObj.passportRevocation?.revokedBy === 'audit@disheera.site', 'Revocation author metadata preserved');
    }

    console.log('\n--- Test 6: validateAssessment rejects administrative field injection ---');
    {
      const { req, res } = createMockReqRes({
        user: userPrincipal,
        body: {
          education: { course: 'B.Tech' },
          interests: ['web development'],
          skills: [{ name: 'javascript', proficiency: 'intermediate' }],
          profileStatus: { isSuspended: false }
        }
      });

      const { nextCalled } = await runMiddleware(validateAssessment, req, res);
      assert(nextCalled === false, 'validateAssessment halted request');
      assert(res.statusCode === 403, `Assessment returns 403 Forbidden on profileStatus injection (got ${res.statusCode})`);
      assert(res._json.code === 'FORBIDDEN_ADMIN_FIELD', `Returns code FORBIDDEN_ADMIN_FIELD (got ${res._json.code})`);
    }

    console.log('\n--- Test 7: updateAssessment controller defense-in-depth rejects forbidden fields ---');
    {
      const { req, res } = createMockReqRes({
        user: userPrincipal,
        body: {
          education: { course: 'B.Tech' },
          isSuspended: false
        }
      });

      await updateAssessment(req, res, () => {});
      assert(res.statusCode === 403, `updateAssessment returns 403 Forbidden (got ${res.statusCode})`);
      assert(res._json.code === 'FORBIDDEN_ADMIN_FIELD', `Returns code FORBIDDEN_ADMIN_FIELD (got ${res._json.code})`);
    }

    console.log('\n--- Test 8: syncUserGraduation preserves existing passportRevocation & security state ---');
    {
      await syncUserGraduation(testUserId, {
        id: 'roadmap-mock-grad-123',
        totalTasks: 20,
        durationWeeks: 4,
        careerSnapshot: {
          title: 'Full Stack Engineer',
          slug: 'full-stack-engineer'
        }
      });

      const graduatedUser = await prisma.user.findUnique({ where: { id: testUserId } });
      const statusObj = graduatedUser.profileStatus;
      assert(statusObj.status === 'graduated', 'Graduation status set to graduated');
      assert(statusObj.currentRole === 'Full Stack Engineer', 'Current role set to graduated role');
      assert(statusObj.passportRevocation?.isRevoked === true, 'passportRevocation survived graduation without being wiped');
      assert(statusObj.passportRevocation?.revocationReason === 'Formal academic integrity review', 'Revocation reason intact');
    }

    console.log(`\n========================================================`);
    console.log(`✅ AUDIT PASSED: ${passedTests}/${totalTests} checks passed successfully.`);
    console.log(`========================================================\n`);
  } finally {
    // Mandatory cleanup: Delete all rows created during the test
    console.log('🧹 Cleaning up test user from live database...');
    try {
      await prisma.user.deleteMany({ where: { id: testUserId } });
      console.log('✓ Cleanup complete (0 residual rows).');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }
}

runTests().catch(err => {
  console.error('\n💥 Test suite failed:', err);
  process.exit(1);
});

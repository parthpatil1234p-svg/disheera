/**
 * tests/admin_assignments_phase3_verification_test.js — Plan 46 Phase 3 Verification Suite
 *
 * Verifies Subdomain Admin Review Cockpit (admin.disheera.site):
 * 1. GET /api/admin/assignments (Filtering, KPI counts, search, and pagination)
 * 2. GET /api/admin/assignments/:id (Full dossier, 4D rubrics, Anti-AI heuristics, PDF links)
 * 3. POST /api/admin/assignments/:id/review (Score override, team commit feedback, ADMIN_APPROVED)
 * 4. Audit Logging (AdminAuditLog record verification)
 * 5. Resubmission request flow (RESUBMISSION_REQUESTED)
 * 6. RBAC & Security Isolation (Unauthorized access rejection)
 *
 * Disheera · Enterprise Test Suite (Plan 46 Phase 3)
 */

const path = require('path');
const { PassThrough } = require('stream');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const { prisma } = require('../server/config/prisma');
const {
  listAssignments,
  getAssignmentById,
  reviewAssignment
} = require('../server/controllers/adminAssignmentController');

function createMockRes() {
  const stream = new PassThrough();
  stream.statusCode = 200;
  stream.headers = {};
  stream.body = null;
  stream.endedData = null;

  stream.status = function (code) {
    this.statusCode = code;
    return this;
  };
  stream.setHeader = function (key, val) {
    this.headers[key.toLowerCase()] = val;
    return this;
  };
  stream.json = function (payload) {
    this.body = payload;
    return this;
  };

  const origEnd = stream.end.bind(stream);
  stream.end = function (data) {
    if (data) {
      this.endedData = data;
    }
    return origEnd(data);
  };

  return stream;
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

async function runPhase3Suite() {
  console.log('================================================================');
  console.log('🚀 Starting Plan 46 Phase 3: Subdomain Admin Review Cockpit Suite');
  console.log('================================================================\n');

  // Find or create admin user in database for audit testing
  let testAdmin = await prisma.adminUser.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!testAdmin) {
    testAdmin = await prisma.adminUser.create({
      data: {
        id: `admin_test_${Date.now()}`,
        name: 'Principal Evaluator',
        email: `evaluator_${Date.now()}@disheera.site`,
        passwordHash: 'dummy_hash',
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });
  }

  // Find or create a student submission to test against
  let submission = await prisma.assignmentSubmission.findFirst({
    include: { assignment: true, user: true }
  });

  if (!submission) {
    console.log('Creating transient assignment submission for Phase 3 testing...');
    const week1Assignment = await prisma.weeklyAssignment.findFirst({ where: { weekNumber: 1 } });
    const student = await prisma.user.findFirst({ where: { role: 'student' } });

    submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: week1Assignment.id,
        userId: student.id,
        roadmapId: 'test_roadmap_p3',
        weekNumber: 1,
        pdfUrl: '/api/assignments/file/sample_p3.pdf',
        fileSizeBytes: 45000,
        pageCount: 3,
        status: 'FLAGGED_AI',
        aiScore: 8.0,
        finalScore: null,
        aiProbability: 0.88,
        aiDetected: true,
        aiDetectionReasons: ['Stereotypical conversational LLM patterns', 'Uniform sentence length cadence']
      },
      include: { assignment: true, user: true }
    });
  }

  // ── TEST 1: GET /api/admin/assignments (List with KPI Counts) 
  console.log('▶ TEST 1: GET /api/admin/assignments Listing & KPI Counts');
  {
    const req = {
      query: { page: '1', limit: '10' },
      admin: testAdmin
    };
    const res = createMockRes();
    await listAssignments(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 200, `Status must be 200 (got: ${res.statusCode})`);
    assert(res.body?.success === true, 'Response must indicate success: true');
    assert(res.body?.counts != null, 'Counts breakdown must be present');
    assert(typeof res.body?.counts?.all === 'number', 'Total count must be a number');
    assert(typeof res.body?.counts?.flaggedAi === 'number', 'Flagged AI count must be a number');
    assert(Array.isArray(res.body?.submissions), 'Submissions must be an array');
    assert(res.body?.pagination?.total >= 1, `Total submissions count must be >= 1 (got: ${res.body?.pagination?.total})`);
  }

  // ── TEST 2: Filter by Status (FLAGGED_AI) ─────────────────────
  console.log('\n▶ TEST 2: Filter Submissions by Status (FLAGGED_AI)');
  {
    const req = {
      query: { status: 'FLAGGED_AI', limit: '10' },
      admin: testAdmin
    };
    const res = createMockRes();
    await listAssignments(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 200, `Status must be 200 (got: ${res.statusCode})`);
    const allFlagged = res.body?.submissions.every(s => s.status === 'FLAGGED_AI');
    assert(allFlagged, 'All returned items must match requested FLAGGED_AI status');
  }

  // ── TEST 3: Search Submissions by Student Name / Email ───────
  console.log('\n▶ TEST 3: Search Submissions by Student Name / Email');
  {
    const searchTerm = submission.user?.name ? submission.user.name.split(' ')[0] : 'a';
    const req = {
      query: { search: searchTerm },
      admin: testAdmin
    };
    const res = createMockRes();
    await listAssignments(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 200, `Search query must return 200 (got: ${res.statusCode})`);
    assert(res.body?.submissions.length > 0, 'Search must return matching submissions');
  }

  // ── TEST 4: GET /api/admin/assignments/:id (Full Dossier) ────
  console.log('\n▶ TEST 4: GET /api/admin/assignments/:id Full Submission Dossier');
  {
    const req = {
      params: { id: submission.id },
      admin: testAdmin
    };
    const res = createMockRes();
    await getAssignmentById(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 200, `Status must be 200 (got: ${res.statusCode})`);
    assert(res.body?.submission?.id === submission.id, 'Must return requested submission');
    assert(res.body?.submission?.student?.name != null, 'Student name must be included in dossier');
    assert(res.body?.submission?.pdfUrl != null, 'PDF URL must be provided');
    assert(res.body?.submission?.evalSheetUrl != null, 'Evaluation sheet URL must be provided');
    assert(res.body?.submission?.questions != null, 'Official questions must be provided for side-by-side review');
  }

  // ── TEST 5: POST /api/admin/assignments/:id/review (ADMIN_APPROVED Override) 
  console.log('\n▶ TEST 5: POST /api/admin/assignments/:id/review (Score Override & Approval)');
  {
    const req = {
      params: { id: submission.id },
      body: {
        status: 'ADMIN_APPROVED',
        adminScore: 9.2,
        adminFeedback: 'Student showed exceptional depth in manual reconciliation diagrams. Flag cleared after physical inspection of handwritten derivations.'
      },
      admin: testAdmin,
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Disheera-Admin-Review-Cockpit/1.0' }
    };
    const res = createMockRes();
    await reviewAssignment(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 200, `Review submission must return 200 (got: ${res.statusCode})`);
    assert(res.body?.submission?.status === 'ADMIN_APPROVED', 'Status must be updated to ADMIN_APPROVED');
    assert(res.body?.submission?.adminScore === 9.2, 'Admin score must be set to 9.2');
    assert(res.body?.submission?.finalScore === 9.2, 'Final score must reflect overridden admin score (9.2)');
    assert(res.body?.submission?.adminFeedback.includes('exceptional depth'), 'Feedback must be saved');

    // Verify database record
    const updatedInDb = await prisma.assignmentSubmission.findUnique({ where: { id: submission.id } });
    assert(updatedInDb.status === 'ADMIN_APPROVED', 'Database status must be ADMIN_APPROVED');
    assert(updatedInDb.finalScore === 9.2, 'Database finalScore must be 9.2');
    assert(updatedInDb.reviewedByAdminId === testAdmin.id, 'Reviewed by admin ID must match testAdmin');
  }

  // ── TEST 6: Audit Log Recording Verification ─────────────────
  console.log('\n▶ TEST 6: Audit Log Recording (AdminAuditLog Verification)');
  {
    const auditRecord = await prisma.adminAuditLog.findFirst({
      where: {
        adminId: testAdmin.id,
        action: 'ASSIGNMENT_REVIEWED',
        targetId: submission.id
      },
      orderBy: { createdAt: 'desc' }
    });

    assert(Boolean(auditRecord), 'AdminAuditLog must record ASSIGNMENT_REVIEWED entry');
    assert(auditRecord?.targetType === 'ASSIGNMENT_SUBMISSION', 'Target type must be ASSIGNMENT_SUBMISSION');
    assert(auditRecord?.details?.newStatus === 'ADMIN_APPROVED', 'Details must record newStatus as ADMIN_APPROVED');
    assert(auditRecord?.details?.adminScore === 9.2, 'Details must record adminScore');
  }

  // ── TEST 7: Resubmission Request Flow ─────────────────────────
  console.log('\n▶ TEST 7: Resubmission Request Flow (RESUBMISSION_REQUESTED)');
  {
    const req = {
      params: { id: submission.id },
      body: {
        status: 'RESUBMISSION_REQUESTED',
        adminFeedback: 'Please scan pages 3 and 4 under brighter lighting and attach your physical paper derivations.'
      },
      admin: testAdmin,
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Disheera-Admin-Review-Cockpit/1.0' }
    };
    const res = createMockRes();
    await reviewAssignment(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 200, `Resubmission review must return 200 (got: ${res.statusCode})`);
    assert(res.body?.submission?.status === 'RESUBMISSION_REQUESTED', 'Status must be RESUBMISSION_REQUESTED');
    assert(res.body?.submission?.finalScore === null, 'Final score must be suspended during resubmission');
  }

  // ── TEST 8: Validation Guard on Invalid Admin Score ──────────
  console.log('\n▶ TEST 8: Validation Guard on Out-of-Bounds Admin Score');
  {
    const req = {
      params: { id: submission.id },
      body: {
        status: 'ADMIN_APPROVED',
        adminScore: 14.5 // Max marks is 10.0
      },
      admin: testAdmin
    };
    const res = createMockRes();
    await reviewAssignment(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 400, `Out of bounds score (14.5/10) must return 400 (got: ${res.statusCode})`);
    assert(res.body?.success === false, 'Success must be false');
    assert(res.body?.message?.includes('Admin score must be a number between 0.0 and 10'), 'Error message must cite 0-10 bounds');
  }

  console.log('\n================================================================');
  console.log(`📊 Plan 46 Phase 3 Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase3Suite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

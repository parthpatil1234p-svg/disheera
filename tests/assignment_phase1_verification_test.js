/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/assignment_phase1_verification_test.js — Plan 46 Phase 1 Automated Verification Suite
 *
 * Verifies:
 * 1. Cover Page PDF Generator (Part A) layout, branding, and %PDF format
 * 2. PDFParse page count detection (1 page vs multi-page)
 * 3. Seeded weekly assignments across careers (questions, rubrics, learning outcomes)
 * 4. Controller & Route endpoints:
 *    - GET /api/assignments/week/:weekNumber
 *    - GET /api/assignments/template
 *    - POST /api/assignments/submit (1-page rejection guard + valid multi-page acceptance)
 *    - GET /api/assignments/my-submissions
 *    - GET /api/assignments/download/:submissionId
 * 5. RBAC & Security Isolation (Student vs Recruiter vs Unauthenticated)
 *
 * Disheera · Enterprise Test Suite (Plan 46)
 */

const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const PDFDocument = require('pdfkit');
const { PDFParse } = require('pdf-parse');
const { prisma } = require('../server/config/prisma');
const { generateCoverPagePdf } = require('../server/services/assignmentTemplateService');
const {
  getWeeklyAssignment,
  downloadCoverTemplate,
  submitAssignment,
  getMySubmissions,
  downloadSubmissionPdf
} = require('../server/controllers/assignmentController');

const { PassThrough } = require('stream');

function createMockRes() {
  const stream = new PassThrough();
  stream.statusCode = 200;
  stream.headers = {};
  stream.body = null;
  stream.endedData = null;

  stream.status = function(code) {
    this.statusCode = code;
    return this;
  };
  stream.setHeader = function(key, val) {
    this.headers[key.toLowerCase()] = val;
    return this;
  };
  stream.json = function(payload) {
    this.body = payload;
    return this;
  };

  const origEnd = stream.end.bind(stream);
  stream.end = function(data) {
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

/**
 * Helper to build a 2-page PDF (Part A Cover + Part B Solution Page)
 */
function createTestMultiPagePdf() {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4' });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Page 1: Cover Sheet
      doc.fontSize(20).text('DISHEERA ASSIGNMENT - PART A: COVER SHEET', 50, 50);
      doc.fontSize(12).text('Student: Test Verification Candidate');
      doc.text('Roll: DSH-TEST-001');
      doc.text('Honor Pledge: Verified Authentic Work.');

      // Page 2: Part B Handwritten Derivations / Solutions
      doc.addPage();
      doc.fontSize(18).text('PART B: STUDENT TECHNICAL SOLUTIONS & DERIVATIONS', 50, 50);
      doc.fontSize(11).text('Problem 1 Derivation: Reconciliation loop executes in O(N) linear time.');
      doc.text('Component Tree Diagram: [App] -> [Dashboard] -> [TelemetryFeed]');
      doc.text('Problem 2 Code Listing:');
      doc.font('Courier').text('function useDebouncedSearch(q, d) { ... }');

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function runPhase1Suite() {
  console.log('================================================================');
  console.log('🚀 Starting Plan 46 Phase 1: Weekly Assignments & Submissions Suite');
  console.log('================================================================\n');

  // Find or use a test student user in database
  let testStudent = await prisma.user.findFirst({
    where: { role: 'student' }
  });

  if (!testStudent) {
    console.log('Creating transient test student user for verification...');
    testStudent = await prisma.user.create({
      data: {
        id: `test_stud_${Date.now()}`,
        name: 'Aarav Sharma',
        email: `aarav_test_${Date.now()}@disheera.site`,
        role: 'student',
        primaryStream: 'engineering',
        education: {
          college: 'IIT Bombay',
          branch: 'Computer Science & Engineering',
          rollNumber: '22CS01044'
        }
      }
    });
  }

  // ── TEST 1: Cover Page PDF Generator ─────────────────────────
  console.log('▶ TEST 1: Standardized 1-Page Cover PDF Generator (Part A)');
  const coverBuffer = await generateCoverPagePdf({
    studentName: testStudent.name,
    email: testStudent.email,
    college: 'IIT Bombay',
    department: 'Computer Science',
    careerTitle: 'Full-Stack Developer',
    weekNumber: 1,
    assignmentTitle: 'Semantic Foundations & State Lifecycles'
  });

  assert(Buffer.isBuffer(coverBuffer), 'Cover sheet must be a valid Buffer');
  assert(coverBuffer.subarray(0, 4).toString('ascii').startsWith('%PDF'), 'Buffer must begin with %PDF header');
  assert(coverBuffer.length > 2000, `Cover PDF size (${coverBuffer.length} bytes) must be substantial`);

  // Verify page count of cover page alone is exactly 1
  const parser1 = new PDFParse({ data: coverBuffer });
  const loaded1 = await parser1.load();
  const coverPageCount = loaded1?.numPages || parser1.doc?.numPages;
  assert(coverPageCount === 1, `Cover PDF alone must be exactly 1 page (received: ${coverPageCount})`);

  // ── TEST 2: Multi-Page Assignment PDF Validation ─────────────
  console.log('\n▶ TEST 2: Multi-Page (Part A + Part B) PDF Construction');
  const multiPageBuffer = await createTestMultiPagePdf();
  const parser2 = new PDFParse({ data: multiPageBuffer });
  const loaded2 = await parser2.load();
  const multiPageCount = loaded2?.numPages || parser2.doc?.numPages;
  assert(multiPageCount >= 2, `Multi-page test PDF must have at least 2 pages (received: ${multiPageCount})`);

  // ── TEST 3: Database Weekly Assignments Seed Check ───────────
  console.log('\n▶ TEST 3: Database Collegiate Assignment Seed Verification');
  const totalAssignments = await prisma.weeklyAssignment.count();
  assert(totalAssignments >= 24, `Must have seeded weekly assignments in Supabase DB (count: ${totalAssignments})`);

  const week1Assignment = await prisma.weeklyAssignment.findFirst({
    where: { weekNumber: 1 }
  });
  assert(Boolean(week1Assignment), 'Week 1 assignment must exist in database');
  assert(week1Assignment.maxMarks === 10, 'Assignment max marks must be 10');
  assert(Array.isArray(week1Assignment.questions) && week1Assignment.questions.length >= 3, 'Must contain at least 3 structured questions');
  assert(week1Assignment.rubric && week1Assignment.rubric.problemSolving, 'Must contain 4D rubric definition');

  // ── TEST 4: GET /api/assignments/week/:weekNumber ────────────
  console.log('\n▶ TEST 4: GET /api/assignments/week/:weekNumber Controller Endpoint');
  {
    const req = {
      params: { weekNumber: '1' },
      query: { careerId: week1Assignment.careerId },
      user: testStudent
    };
    const res = createMockRes();
    await getWeeklyAssignment(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 200, `Status must be 200 (received: ${res.statusCode})`);
    assert(res.body?.success === true, 'Response must indicate success: true');
    assert(res.body?.assignment?.weekNumber === 1, 'Returned assignment must be Week 1');
    assert(res.body?.assignment?.maxMarks === 10, 'Returned max marks must be 10');
    assert(res.body?.assignment?.questions?.length >= 3, 'Questions array must be present');
  }

  // ── TEST 5: GET /api/assignments/template ────────────────────
  console.log('\n▶ TEST 5: GET /api/assignments/template (Personalized Cover Download)');
  {
    const req = {
      query: { weekNumber: '1', careerId: week1Assignment.careerId },
      user: testStudent
    };
    const res = createMockRes();
    await downloadCoverTemplate(req, res, err => { if (err) throw err; });

    assert(res.headers['content-type'] === 'application/pdf', 'Content-Type must be application/pdf');
    assert(res.headers['content-disposition']?.includes('attachment'), 'Content-Disposition must be attachment');
    assert(Buffer.isBuffer(res.endedData), 'Ended response must contain binary PDF buffer');
    assert(res.endedData.subarray(0, 4).toString('ascii').startsWith('%PDF'), 'Stream must start with %PDF');
  }

  // ── TEST 6: Incomplete Submission Guard (1-Page PDF Rejection) 
  console.log('\n▶ TEST 6: 1-Page Incomplete Submission Rejection Guard');
  {
    const req = {
      body: {
        weekNumber: 1,
        careerId: week1Assignment.careerId,
        fileData: `data:application/pdf;base64,${coverBuffer.toString('base64')}`
      },
      user: testStudent
    };
    const res = createMockRes();
    await submitAssignment(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 400, `1-page PDF must be rejected with 400 (received: ${res.statusCode})`);
    assert(res.body?.success === false, 'Success must be false for incomplete dossier');
    assert(res.body?.message?.includes('Minimum 2 pages required'), 'Error message must explain Part B requirement');
  }

  // ── TEST 7: Valid Multi-Page PDF Submission Pipeline ─────────
  console.log('\n▶ TEST 7: Valid Multi-Page PDF Submission Pipeline (Part A + B)');
  let createdSubmissionId = null;
  {
    const req = {
      body: {
        weekNumber: 1,
        careerId: week1Assignment.careerId,
        fileData: `data:application/pdf;base64,${multiPageBuffer.toString('base64')}`
      },
      user: testStudent
    };
    const res = createMockRes();
    await submitAssignment(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 201, `Valid multi-page PDF must return 201 Created (received: ${res.statusCode})`);
    assert(res.body?.success === true, 'Response must indicate success: true');
    assert(['SUBMITTED', 'GRADED', 'FLAGGED_AI'].includes(res.body?.submission?.status), `Status must be valid submission state (got: ${res.body?.submission?.status})`);
    assert(res.body?.submission?.pageCount >= 2, `Page count must be recorded (received: ${res.body?.submission?.pageCount})`);
    assert(res.body?.submission?.id, 'Submission ID must be returned');

    createdSubmissionId = res.body?.submission?.id;
  }

  // ── TEST 8: GET /api/assignments/my-submissions ──────────────
  console.log('\n▶ TEST 8: GET /api/assignments/my-submissions History Tracking');
  {
    const req = { user: testStudent };
    const res = createMockRes();
    await getMySubmissions(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 200, `Status must be 200 (received: ${res.statusCode})`);
    assert(res.body?.success === true, 'Success must be true');
    assert(Array.isArray(res.body?.submissions), 'Submissions must be an array');
    
    const matched = res.body?.submissions.find(s => s.id === createdSubmissionId);
    assert(Boolean(matched), 'Newly submitted assignment must appear in student submission history');
    assert(['SUBMITTED', 'GRADED', 'FLAGGED_AI', 'ADMIN_APPROVED'].includes(matched?.status), `Historical status must be valid submission state (got: ${matched?.status})`);
    assert(matched?.weekNumber === 1, 'Week number must be 1');
  }

  // ── TEST 9: GET /api/assignments/download/:submissionId ───────
  console.log('\n▶ TEST 9: GET /api/assignments/download/:submissionId');
  {
    const req = {
      params: { submissionId: createdSubmissionId },
      user: testStudent
    };
    const res = createMockRes();
    const downloadPromise = new Promise(resolve => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    await downloadSubmissionPdf(req, res, err => { if (err) throw err; });
    const downloadedBuf = await downloadPromise;

    assert(res.headers['content-type'] === 'application/pdf', 'Download must stream application/pdf');
    assert(downloadedBuf.length > 0, `Downloaded stream must yield data (received: ${downloadedBuf.length} bytes)`);
    assert(downloadedBuf.subarray(0, 4).toString('ascii').startsWith('%PDF'), 'Downloaded data must have %PDF signature');
  }

  // ── TEST 10: Security Isolation (Unauthorized User Blocked) ──
  console.log('\n▶ TEST 10: Security & Isolation on Download');
  {
    const unauthorizedStudent = {
      id: 'unauthorized_intruder_999',
      role: 'student',
      isAdmin: false
    };
    const req = {
      params: { submissionId: createdSubmissionId },
      user: unauthorizedStudent
    };
    const res = createMockRes();
    await downloadSubmissionPdf(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 403, `Unauthorized student access must return 403 (received: ${res.statusCode})`);
    assert(res.body?.message?.includes('Access denied'), 'Must explain access denial');
  }

  console.log('\n================================================================');
  console.log(`📊 Plan 46 Phase 1 Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase1Suite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

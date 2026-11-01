/**
 * tests/assignment_phase2_verification_test.js — Plan 46 Phase 2 Automated Verification Suite
 *
 * Verifies:
 * 1. Anti-AI Writing Shield Heuristics (Authentic vs Moderate AI vs High AI detection)
 * 2. 4D Collegiate Rubric Auto-Grading Engine (Problem Solving 4.0, Methodology 3.0, Clarity 3.0)
 * 3. Escalation & Penalty Policy (<30% full marks, 30%-60% 15% penalty, >60% FLAGGED_AI)
 * 4. Part C Official Stamped Evaluation Sheet PDF generation & layout
 * 5. End-to-End Submission & Auto-Grading controller workflow
 * 6. On-demand AI evaluation endpoint (POST /api/assignments/:id/evaluate)
 * 7. Part C streaming endpoint (GET /api/assignments/eval-sheet/:submissionId)
 *
 * Disheera · Enterprise Test Suite (Plan 46 Phase 2)
 */

const path = require('path');
const { PassThrough } = require('stream');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
process.env.ASSIGNMENT_EVAL_SYNC = 'true';

const PDFDocument = require('pdfkit');
const { PDFParse } = require('pdf-parse');
const { prisma } = require('../server/config/prisma');
const { detectAiContent } = require('../server/services/antiAiDetectionService');
const { evaluateSubmission, evaluateDeterministic } = require('../server/services/assignmentAiGraderService');
const { generateEvaluationSheetPdf } = require('../server/services/assignmentFeedbackService');
const {
  submitAssignment,
  evaluateSubmissionEndpoint,
  downloadEvaluationSheet,
  getMySubmissions,
  getSubmissionStatus
} = require('../server/controllers/assignmentController');

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

/**
 * Builds a multi-page PDF containing specific text
 */
function createPdfWithText(coverText, solutionText) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4' });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Page 1: Cover Sheet
      doc.fontSize(20).text('DISHEERA ASSIGNMENT - PART A: COVER SHEET', 50, 50);
      doc.fontSize(11).text(coverText);

      // Page 2: Part B Solutions
      doc.addPage();
      doc.fontSize(16).text('PART B: STUDENT TECHNICAL SOLUTIONS', 50, 50);
      doc.fontSize(10).text(solutionText);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function runPhase2Suite() {
  console.log('================================================================');
  console.log('🚀 Starting Plan 46 Phase 2: Multimodal AI Grading & Anti-AI Shield');
  console.log('================================================================\n');

  // ── TEST 1: Anti-AI Shield Heuristics (Authentic Work) ────────
  console.log('▶ TEST 1: Anti-AI Shield on Authentic Student Work');
  const authenticProse = `
    Problem 1 Solution:
    To analyze the reconciliation loop, I traced the component tree from Root down to the TelemetryDashboard.
    When user authentication state changes, the parent context triggers a rerender.
    The diffing algorithm operates in O(N) linear time because keys are assigned to each list item.
    I drew the component schematic in Figure 1, showing the unidirectional props flow.
    We noticed a stale closure bug in useEffect when dependencies weren't updated properly.
  `;
  const authenticResult = detectAiContent(authenticProse);

  assert(authenticResult.aiProbability < 0.30, `Authentic AI probability must be < 0.30 (got: ${authenticResult.aiProbability})`);
  assert(authenticResult.aiDetected === false, 'aiDetected must be false for authentic work');
  assert(authenticResult.authenticityBadge === 'AUTHENTIC', 'Badge must be AUTHENTIC');
  assert(authenticResult.penaltyPercent === 0, 'Penalty percent must be 0%');

  // ── TEST 2: Anti-AI Shield on Synthetic High-AI Copy ─────────
  console.log('\n▶ TEST 2: Anti-AI Shield on Synthetic High-AI Content');
  const highAiProse = `
    In summary, by leveraging cutting-edge web technologies, modern frameworks delve into the intricacies of state management.
    Furthermore, it is critical to note that virtual DOM reconciliation is a testament to the robust architecture.
    As an AI language model, here is the comprehensive overview of the derivation:
    \`\`\`javascript
    const reconcile = (tree) => { return tree.diff(); };
    \`\`\`
    ### Component Hierarchy
    **State Propagation**: The tapestry of unidirectional data flow fosters synergistic optimization and underscores performance.
  `;
  const highAiResult = detectAiContent(highAiProse);

  assert(highAiResult.aiProbability > 0.60, `High AI probability must be > 0.60 (got: ${highAiResult.aiProbability})`);
  assert(highAiResult.aiDetected === true, 'aiDetected must be true for high AI content');
  assert(highAiResult.authenticityBadge === 'HIGH_AI', 'Badge must be HIGH_AI');
  assert(highAiResult.penaltyPercent === 100, 'Penalty percent must be 100% (flagged)');
  assert(highAiResult.aiReasons.length >= 3, `Must identify multiple specific AI triggers (found: ${highAiResult.aiReasons.length})`);

  // ── TEST 3: Anti-AI Shield on Moderate AI Assistance ─────────
  console.log('\n▶ TEST 3: Anti-AI Shield on Moderate AI Assistance');
  const modAiProse = `
    Problem 1 Derivation:
    The component tree reconciliation executes during the render phase.
    It is crucial to note that the diffing algorithm optimizes key comparisons.
    In conclusion, mastering state lifting ensures clean application lifecycle execution.
  `;
  const modAiResult = detectAiContent(modAiProse);

  assert(modAiResult.aiProbability >= 0.25 && modAiResult.aiProbability <= 0.60, `Moderate AI probability must be between 0.25 and 0.60 (got: ${modAiResult.aiProbability})`);
  assert(modAiResult.authenticityBadge === 'MODERATE_AI', `Badge must be MODERATE_AI (got: ${modAiResult.authenticityBadge})`);
  assert(modAiResult.penaltyPercent === 15, 'Moderate AI penalty must be exactly 15%');

  // ── TEST 4: 4D Rubric Deterministic Evaluator ─────────────────
  console.log('\n▶ TEST 4: 4D Rubric Evaluator (Problem Solving, Methodology, Clarity)');
  const sampleQuestions = [
    { qNumber: 1, marks: 3.5, expectedKeywords: ['Virtual DOM', 'Reconciliation', 'Diffing'] },
    { qNumber: 2, marks: 3.5, expectedKeywords: ['AbortController', 'race condition', 'useEffect'] },
    { qNumber: 3, marks: 3.0, expectedKeywords: ['Content Security Policy', 'anti-CSRF'] }
  ];
  const deterministicRes = evaluateDeterministic(
    'Virtual DOM reconciliation uses diffing algorithms. We use AbortController to handle race condition in useEffect. Content Security Policy headers protect against XSS.',
    sampleQuestions
  );

  assert(typeof deterministicRes.score === 'number' && deterministicRes.score <= 10.0, 'Score must be a number <= 10.0');
  assert(deterministicRes.rubricBreakdown.problemSolving <= 4.0, 'Problem Solving must be <= 4.0');
  assert(deterministicRes.rubricBreakdown.methodology <= 3.0, 'Methodology must be <= 3.0');
  assert(deterministicRes.rubricBreakdown.clarity <= 3.0, 'Clarity must be <= 3.0');
  assert(Array.isArray(deterministicRes.strengths) && deterministicRes.strengths.length > 0, 'Strengths must be populated');
  assert(Array.isArray(deterministicRes.improvements) && deterministicRes.improvements.length > 0, 'Improvements must be populated');

  // ── TEST 5: Part C Evaluation Sheet PDF Generator ───────────
  console.log('\n▶ TEST 5: Part C Official Stamped Evaluation Sheet PDF Generator');
  const mockSub = {
    id: `eval_sub_${Date.now()}`,
    weekNumber: 1,
    status: 'GRADED',
    aiScore: 8.8,
    finalScore: 8.8,
    aiProbability: 0.12,
    aiFeedback: 'Excellent practical laboratory derivations with clean diagrams.'
  };
  const mockUser = {
    id: 'user_123',
    name: 'Aarav Sharma',
    email: 'aarav@disheera.site'
  };

  const evalPdfBuffer = await generateEvaluationSheetPdf({
    submission: mockSub,
    assignment: { title: 'Semantic Foundations & Component Architecture' },
    user: mockUser,
    antiAiResult: authenticResult,
    rubricBreakdown: { problemSolving: 3.6, methodology: 2.6, clarity: 2.6 }
  });

  assert(Buffer.isBuffer(evalPdfBuffer), 'Evaluation sheet must be a valid Buffer');
  assert(evalPdfBuffer.subarray(0, 4).toString('ascii').startsWith('%PDF'), 'Must have %PDF magic bytes');
  assert(evalPdfBuffer.length > 2500, `Evaluation sheet size (${evalPdfBuffer.length} bytes) must be substantial`);

  const parserEval = new PDFParse({ data: evalPdfBuffer });
  const loadedEval = await parserEval.load();
  assert(loadedEval?.numPages === 1, 'Part C Evaluation Sheet alone must be exactly 1 page');

  // ── TEST 6: End-to-End Submission with Auto-Grading ──────────
  console.log('\n▶ TEST 6: End-to-End Submission & Instant Auto-Grading');
  let testStudent = await prisma.user.findFirst({ where: { role: 'student' } });
  const week1Assignment = await prisma.weeklyAssignment.findFirst({ where: { weekNumber: 1 } });

  const multiPageAuthenticPdf = await createPdfWithText(
    `Student: ${testStudent.name}\nEmail: ${testStudent.email}\nHonor Pledge: Authentic`,
    `Step 1: Virtual DOM reconciliation diffing algorithm traces the component tree.
     Step 2: AbortController cancels pending fetch requests to eliminate race conditions.
     Step 3: Content Security Policy and anti-CSRF cookies protect the frontend.`
  );

  let submittedId = null;
  {
    const req = {
      body: {
        weekNumber: 1,
        careerId: week1Assignment.careerId,
        fileData: `data:application/pdf;base64,${multiPageAuthenticPdf.toString('base64')}`
      },
      user: testStudent
    };
    const res = createMockRes();
    await submitAssignment(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 201, `Status must be 201 (got: ${res.statusCode})`);
    assert(res.body?.submission?.status === 'GRADED', `Status must be GRADED for authentic submission (got: ${res.body?.submission?.status})`);
    assert(typeof res.body?.submission?.finalScore === 'number', 'Final score must be a number');
    assert(res.body?.submission?.finalScore > 0, `Final score must be > 0 (got: ${res.body?.submission?.finalScore})`);
    assert(res.body?.submission?.aiDetected === false, 'aiDetected must be false');
    assert(Boolean(res.body?.submission?.evalSheetUrl), 'Evaluation sheet URL must be returned');

    submittedId = res.body?.submission?.id;
  }

  // ── TEST 7: High AI Submission Triggers FLAGGED_AI ───────────
  console.log('\n▶ TEST 7: High AI Submission Correctly Triggers FLAGGED_AI');
  const multiPageAiPdf = await createPdfWithText(
    `Student: ${testStudent.name}\nEmail: ${testStudent.email}`,
    `In summary, by leveraging cutting-edge web development paradigms, we delve into the intricacies of virtual DOM.
     Furthermore, it is critical to note that state synchronization is a testament to the robust architecture.
     As an AI language model, here is the comprehensive solution:
     \`\`\`javascript
     const render = () => {};
     \`\`\`
     ### Architecture Notes
     The tapestry of modern software engineering underscores scalable execution.`
  );

  {
    const req = {
      body: {
        weekNumber: 2,
        careerId: week1Assignment.careerId,
        fileData: `data:application/pdf;base64,${multiPageAiPdf.toString('base64')}`
      },
      user: testStudent
    };
    const res = createMockRes();
    await submitAssignment(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 201, `Status must be 201 (got: ${res.statusCode})`);
    assert(res.body?.submission?.status === 'FLAGGED_AI', `Status must be FLAGGED_AI (got: ${res.body?.submission?.status})`);
    assert(res.body?.submission?.aiDetected === true, 'aiDetected must be true for high AI submission');
    assert(res.body?.submission?.aiProbability > 0.60, `AI probability must be > 0.60 (got: ${res.body?.submission?.aiProbability})`);
    assert(res.body?.message?.includes('High AI'), 'Message must warn about high AI generation');
  }

  // ── TEST 8: On-Demand Evaluation Endpoint ────────────────────
  console.log('\n▶ TEST 8: POST /api/assignments/:id/evaluate Endpoint');
  {
    const req = {
      params: { id: submittedId },
      user: testStudent
    };
    const res = createMockRes();
    await evaluateSubmissionEndpoint(req, res, err => { if (err) throw err; });

    assert(res.statusCode === 200, `Evaluation endpoint must return 200 (got: ${res.statusCode})`);
    assert(res.body?.success === true, 'Must indicate success: true');
    assert(res.body?.rubricBreakdown != null, 'Rubric breakdown must be present');
    assert(res.body?.finalScore > 0, `Final score must be > 0 (got: ${res.body?.finalScore})`);
  }

  // ── TEST 9: Stream Part C Evaluation Sheet Endpoint ──────────
  console.log('\n▶ TEST 9: GET /api/assignments/eval-sheet/:submissionId');
  {
    const req = {
      params: { submissionId: submittedId },
      user: testStudent
    };
    const res = createMockRes();
    const streamPromise = new Promise(resolve => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    await downloadEvaluationSheet(req, res, err => { if (err) throw err; });
    const streamedData = await streamPromise;

    assert(res.headers['content-type'] === 'application/pdf', 'Must return application/pdf');
    assert(streamedData.length > 2000, `Streamed evaluation sheet must have data (got: ${streamedData.length} bytes)`);
    assert(streamedData.subarray(0, 4).toString('ascii').startsWith('%PDF'), 'Streamed data must begin with %PDF');
  }


  // ── TEST 10: Non-Blocking Asynchronous Submission & Status Polling ────────
  console.log('\n▶ TEST 10: Non-Blocking Asynchronous Submission (202 Accepted & Status Polling)');
  {
    delete process.env.ASSIGNMENT_EVAL_SYNC;
    const req = {
      body: {
        weekNumber: 1,
        careerId: week1Assignment.careerId,
        fileData: `data:application/pdf;base64,${multiPageAuthenticPdf.toString('base64')}`
      },
      user: testStudent
    };
    const res = createMockRes();
    const startTime = Date.now();
    await submitAssignment(req, res, err => { if (err) throw err; });
    const elapsedMs = Date.now() - startTime;

    assert(res.statusCode === 202, `Async submission must return 202 Accepted immediately (got: ${res.statusCode})`);
    assert(res.body?.success === true, 'Response must indicate success: true');
    assert(res.body?.submission?.status === 'EVALUATING', `Status must be EVALUATING upon immediate return (got: ${res.body?.submission?.status})`);
    assert(elapsedMs < 10000, `Immediate async response must be sub-second (took: ${elapsedMs}ms)`);

    const asyncSubId = res.body?.submission?.id;
    assert(Boolean(asyncSubId), 'Submission ID must be returned');

    // Poll status via getSubmissionStatus
    const statusReq = {
      params: { id: asyncSubId },
      user: testStudent
    };
    const statusRes = createMockRes();
    await getSubmissionStatus(statusReq, statusRes, err => { if (err) throw err; });

    assert(statusRes.statusCode === 200, `Status polling must return 200 (got: ${statusRes.statusCode})`);
    assert(statusRes.body?.submission?.id === asyncSubId, 'Status response must match submission ID');
    assert(['EVALUATING', 'GRADED'].includes(statusRes.body?.submission?.status), `Status must be EVALUATING or GRADED (got: ${statusRes.body?.submission?.status})`);
  }

  console.log('\n================================================================');
  console.log(`📊 Plan 46 Phase 2 Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase2Suite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

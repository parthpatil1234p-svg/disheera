/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * test_resume_authenticity.js
 * Comprehensive unit and integration test suite for the Resume Authenticity
 * & Non-Resume Content Guard (Document Classification Gate).
 *
 * Disheera · Enterprise Test Suite
 */

const http = require('http');
const {
  detectNonResumeBlacklist,
  evaluateResumeStructure,
  verifyResumeContent,
  verifyResumeText,
} = require('../server/services/resumeAuthenticityService');

// Minimal PDF generator helper
function createTestPdf(text) {
  const sanitized = text.replace(/[\r\n]+/g, ' ').replace(/[()\\]/g, '');
  const streamContent = `BT /F1 10 Tf 20 750 Td (${sanitized}) Tj ET`;
  const streamBuf = Buffer.from(streamContent, 'utf-8');
  const len = streamBuf.length;

  const header = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length ${len} >>\nstream\n`;
  const footer = `\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000330 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF`;

  return Buffer.concat([Buffer.from(header, 'utf-8'), streamBuf, Buffer.from(footer, 'utf-8')]);
}

function requestJson(path, method, payload, token = '') {
  return new Promise((resolve, reject) => {
    const data = payload ? JSON.stringify(payload) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Resume Authenticity & Document Classification Gate Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failed++;
    }
  }

  // ── TEST 1: Blacklist Category Detection ─────────────────────
  console.log('▶ TEST 1: Deterministic Blacklist Category Detection');

  const billSample = 'MAHADISCOM Electricity Bill Consumer No 1029384756 Meter No 992837 Units Consumed 450 kWh Due Date: 28/09/2026 Total Amount Due: Rs 2450 GSTIN: 27AAAAA0000A1Z5';
  const billHit = detectNonResumeBlacklist(billSample);
  assert(billHit !== null && billHit.code === 'NON_RESUME_INVOICE_OR_BILL', 'Correctly flagged Electricity Bill / Invoice');

  const aadhaarSample = 'Unique Identification Authority of India UIDAI Government of India My Aadhaar Mera Aadhaar Meri Pehchan Aadhaar No: 9948 2938 1029 Enrollment No: 1234/12345/12345';
  const aadhaarHit = detectNonResumeBlacklist(aadhaarSample);
  assert(aadhaarHit !== null && aadhaarHit.code === 'NON_RESUME_GOVERNMENT_ID', 'Correctly flagged Government Identity Document (Aadhaar)');

  const examSample = 'University Semester Examination Question Paper Time Allowed: 3 Hours Max Marks: 100 Answer any five questions. All questions carry equal marks. Q.1 is compulsory. Hall Ticket No: 2026-CS-091';
  const examHit = detectNonResumeBlacklist(examSample);
  assert(examHit !== null && examHit.code === 'NON_RESUME_EXAM_PAPER', 'Correctly flagged Academic Examination Question Paper');

  const menuSample = 'The Royal Feast Appetizers: Paneer Tikka, Crispy Corn. Main Course: Dal Makhani, Paneer Butter Masala, Butter Naan. Desserts: Gulab Jamun, Vanilla Ice Cream. Table # 4 Order # 981';
  const menuHit = detectNonResumeBlacklist(menuSample);
  assert(menuHit !== null && menuHit.code === 'NON_RESUME_MENU_OR_ORDER', 'Correctly flagged Restaurant Menu / Food Order');

  const ticketSample = 'Flight Ticket Boarding Pass PNR No: W8291X Seat: 14B Gate: A12 Airline Booking Reference Passenger Name: Suyog Pawar Flight No: 6E-204';
  const ticketHit = detectNonResumeBlacklist(ticketSample);
  assert(ticketHit !== null && ticketHit.code === 'NON_RESUME_TRAVEL_TICKET', 'Correctly flagged Boarding Pass / Travel Ticket');

  const medicalSample = 'Metropolis Diagnostic Report Patient Name: John Doe Clinical Pathology Investigation Report Reference Range Fasting Blood Sugar 95 mg/dL Treating Physician Dr Sharma';
  const medicalHit = detectNonResumeBlacklist(medicalSample);
  assert(medicalHit !== null && medicalHit.code === 'NON_RESUME_MEDICAL_REPORT', 'Correctly flagged Medical Diagnostic Report');

  const validResumeSample = 'Aarav Sharma Email: aarav.sharma@gmail.com Phone: 9876543210 Education: B.Tech Computer Science Engineering from Demo Institute of Technology 2026 Technical Skills: JavaScript, React, Node.js, Python, MongoDB, Git Projects: Full-Stack E-Commerce Web Application built with React and Express Summary: Passionate software engineer seeking frontend roles.';
  const resumeHit = detectNonResumeBlacklist(validResumeSample);
  assert(resumeHit === null, 'Authentic resume does NOT trigger blacklist');

  // ── TEST 2: Structural Anatomy Scoring ───────────────────────
  console.log('\n▶ TEST 2: Structural Anatomy Whitelist Scoring');
  const structure = evaluateResumeStructure(validResumeSample);
  assert(structure.score >= 45, `Authentic resume scored high structural points (${structure.score} >= 45)`);
  assert(structure.hasContact === true, 'Contact details detected (email/phone)');
  assert(structure.hasCredentials === true, 'Academic credentials detected (B.Tech)');
  assert(structure.hasVerbs === true, 'Action verbs detected (built)');
  assert(structure.matchedSections.length >= 3, `Matched standard sections (${structure.matchedSections.join(', ')})`);

  // ── TEST 3: In-Memory Buffer Verification (pdf-parse) ────────
  console.log('\n▶ TEST 3: Buffer Verification & Classification Gate');

  // 3A: Bill PDF Buffer
  const billPdf = createTestPdf(billSample);
  const billVerification = await verifyResumeContent(billPdf, 'application/pdf', 'Electricity_Bill.pdf');
  assert(billVerification.isValid === false, 'Electricity Bill PDF rejected');
  assert(billVerification.code === 'NON_RESUME_INVOICE_OR_BILL', 'Reason code matches INVOICE_OR_BILL');

  // 3B: Exam Question Paper PDF Buffer
  const examPdf = createTestPdf(examSample);
  const examVerification = await verifyResumeContent(examPdf, 'application/pdf', 'Semester_Exam_Paper.pdf');
  assert(examVerification.isValid === false, 'Exam Question Paper PDF rejected');
  assert(examVerification.code === 'NON_RESUME_EXAM_PAPER', 'Reason code matches EXAM_PAPER');

  // 3C: Insufficient text (blank/scanned page)
  const shortPdf = createTestPdf('Hello world');
  const shortVerification = await verifyResumeContent(shortPdf, 'application/pdf', 'blank.pdf');
  assert(shortVerification.isValid === false, 'Short/blank PDF rejected');
  assert(shortVerification.code === 'INSUFFICIENT_TEXT', 'Reason code matches INSUFFICIENT_TEXT');

  // 3D: Authentic Student Resume PDF Buffer
  const resumePdf = createTestPdf(validResumeSample);
  const resumeVerification = await verifyResumeContent(resumePdf, 'application/pdf', 'Aarav_Sharma_Resume.pdf');
  assert(resumeVerification.isValid === true, 'Authentic Student Resume PDF accepted');
  assert(resumeVerification.detectedType === 'resume', 'Detected type is resume');

  // ── TEST 4: Direct Text Analysis Rejection Gate ──────────────
  console.log('\n▶ TEST 4: Direct Text Verification Gate (verifyResumeText)');
  const billTextResult = verifyResumeText(billSample);
  assert(billTextResult.isValid === false, 'Bill text rejected by verifyResumeText');

  const resumeTextResult = verifyResumeText(validResumeSample);
  assert(resumeTextResult.isValid === true, 'Resume text accepted by verifyResumeText');

  // ── TEST 5: HTTP API Integration: POST /api/users/resume ────
  console.log('\n▶ TEST 5: HTTP API Pre-Upload Rejection Gate (POST /api/users/resume)');

  // Log in as demo user to get JWT
  const loginRes = await requestJson('/api/auth/login', 'POST', {
    email: 'demouser@gmail.com',
    password: 'demo123',
  });

  if (!loginRes.body.data?.token) {
    throw new Error('Could not log in as demouser@gmail.com for API tests');
  }
  const token = loginRes.body.data.token;
  console.log('  ✓ Authenticated as Demo User for API integration tests');

  // 5A: Try uploading electricity bill PDF
  const billBase64 = `data:application/pdf;base64,${billPdf.toString('base64')}`;
  const uploadBillRes = await requestJson('/api/users/resume', 'POST', {
    fileData: billBase64,
    fileName: 'Electricity_Bill_September.pdf',
  }, token);

  assert(uploadBillRes.status === 422, `Bill upload returned HTTP 422 Unprocessable Entity (got ${uploadBillRes.status})`);
  assert(uploadBillRes.body.success === false, 'Upload response success: false');
  assert(uploadBillRes.body.code === 'NON_RESUME_INVOICE_OR_BILL', 'Upload error code indicates NON_RESUME_INVOICE_OR_BILL');
  assert(uploadBillRes.body.message.includes('Utility Bill / Invoice'), 'Upload error message clearly names the rejected document');

  // 5B: Try uploading authentic resume PDF
  const resumeBase64 = `data:application/pdf;base64,${resumePdf.toString('base64')}`;
  const uploadResumeRes = await requestJson('/api/users/resume', 'POST', {
    fileData: resumeBase64,
    fileName: 'Aarav_Sharma_Resume.pdf',
  }, token);

  assert(uploadResumeRes.status === 200, `Authentic resume upload returned HTTP 200 (got ${uploadResumeRes.status})`);
  assert(uploadResumeRes.body.success === true, 'Authentic resume upload succeeded');
  assert(Boolean(uploadResumeRes.body.data?.resumeUrl), 'Resume URL generated in Cloudinary for authentic resume');

  // ── TEST 6: HTTP API Rejection on POST /api/resume/analyze ───
  console.log('\n▶ TEST 6: HTTP API Rejection on POST /api/resume/analyze with non-resume text');
  const analyzeBillRes = await requestJson('/api/resume/analyze', 'POST', {
    resumeText: billSample,
    targetCareer: 'Full-Stack Developer',
  }, token);

  assert(analyzeBillRes.status === 422, `Analyze bill text returned HTTP 422 (got ${analyzeBillRes.status})`);
  assert(analyzeBillRes.body.success === false, 'Analyze bill response success: false');
  assert(analyzeBillRes.body.code === 'NON_RESUME_INVOICE_OR_BILL', 'Analyze bill error code indicates NON_RESUME_INVOICE_OR_BILL');

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉 ALL RESUME AUTHENTICITY GUARD TESTS PASSED 100%!');
  } else {
    throw new Error(`${failed} tests failed!`);
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test execution error:', err);
  process.exit(1);
});

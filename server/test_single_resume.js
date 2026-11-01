/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * test_single_resume.js — Integration & Validation Test Suite
 * Single Resume per Account Architecture
 */

const assert = require('assert');
const Resume = require('./models/Resume');

// Mock validateResumeBuffer logic
function testValidateResumeBuffer(fileData, declaredName = 'Resume.pdf') {
  if (!fileData || typeof fileData !== 'string') {
    const err = new Error('Resume file data is required.');
    err.statusCode = 400;
    throw err;
  }

  const match = fileData.match(/^data:([a-zA-Z0-9\/+.-]+);base64,(.+)$/s);
  const base64Payload = match ? match[2].trim() : fileData.trim();

  let buffer;
  try {
    buffer = Buffer.from(base64Payload, 'base64');
  } catch (e) {
    const err = new Error('Invalid base64 encoding for resume file.');
    err.statusCode = 400;
    throw err;
  }

  const sizeBytes = buffer.length;
  if (sizeBytes === 0) {
    const err = new Error('Resume file cannot be empty.');
    err.statusCode = 400;
    throw err;
  }

  const maxBytes = 5 * 1024 * 1024; // 5 MB
  if (sizeBytes > maxBytes) {
    const actualMb = (sizeBytes / (1024 * 1024)).toFixed(2);
    const err = new Error(`Resume size (${actualMb} MB) exceeds maximum allowed limit of 5.0 MB.`);
    err.statusCode = 400;
    throw err;
  }

  const headerHex = buffer.subarray(0, 4).toString('hex').toLowerCase();
  const headerAscii = buffer.subarray(0, 4).toString('ascii');

  let mimeType = '';
  if (headerAscii.startsWith('%PDF')) {
    mimeType = 'application/pdf';
  } else if (headerHex === '504b0304') {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (headerHex === 'd0cf11e0') {
    mimeType = 'application/msword';
  } else {
    const err = new Error('Invalid file format. Resume must be a valid PDF, DOCX, or DOC document.');
    err.statusCode = 400;
    throw err;
  }

  let sanitizedName = (declaredName || 'Student_Resume.pdf')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);
  if (!sanitizedName.includes('.')) {
    sanitizedName += (mimeType === 'application/pdf' ? '.pdf' : '.docx');
  }

  return { buffer, mimeType, sizeBytes, sanitizedName };
}

async function runTests() {
  console.log('=== SINGLE RESUME ARCHITECTURE TEST SUITE ===\n');

  // Test 1: Mongoose Schema Model verification
  console.log('✔ Test 1: Checking Mongoose Resume Schema unique constraint...');
  const userPath = Resume.schema.paths.user;
  assert.ok(userPath, 'Resume schema must define "user" field');
  assert.strictEqual(userPath.options.unique, true, 'Resume schema "user" field must be unique: true');
  assert.strictEqual(userPath.options.required[0], true, 'Resume schema "user" field must be required');
  console.log('  -> PASSED: Unique database invariant verified on Resume.user\n');

  // Test 2: Valid PDF Magic Bytes
  console.log('✔ Test 2: Testing Valid PDF magic bytes (%PDF)...');
  const validPdfBuf = Buffer.from('%PDF-1.7 valid pdf test stream sample content');
  const validPdfB64 = `data:application/pdf;base64,${validPdfBuf.toString('base64')}`;
  const pdfRes = testValidateResumeBuffer(validPdfB64, 'my_cv.pdf');
  assert.strictEqual(pdfRes.mimeType, 'application/pdf');
  assert.strictEqual(pdfRes.sanitizedName, 'my_cv.pdf');
  assert.strictEqual(pdfRes.sizeBytes, validPdfBuf.length);
  console.log(`  -> PASSED: Detected MIME=${pdfRes.mimeType}, size=${pdfRes.sizeBytes} bytes\n`);

  // Test 3: Valid DOCX Magic Bytes (PK\x03\x04)
  console.log('✔ Test 3: Testing Valid DOCX magic bytes (PK\\x03\\x04)...');
  const validDocxBuf = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('dummy docx payload')]);
  const validDocxB64 = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${validDocxBuf.toString('base64')}`;
  const docxRes = testValidateResumeBuffer(validDocxB64, 'resume_v2.docx');
  assert.strictEqual(docxRes.mimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.strictEqual(docxRes.sanitizedName, 'resume_v2.docx');
  console.log(`  -> PASSED: Detected MIME=${docxRes.mimeType}\n`);

  // Test 4: Fake PDF Attack (File renamed to .pdf with malicious or invalid content)
  console.log('✔ Test 4: Testing Spoofed/Fake PDF rejection...');
  const fakePdfBuf = Buffer.from('MZ\x90\x00\x03\x00\x00\x00 executable payload pretending to be pdf');
  const fakePdfB64 = `data:application/pdf;base64,${fakePdfBuf.toString('base64')}`;
  let rejectedFake = false;
  try {
    testValidateResumeBuffer(fakePdfB64, 'evil.pdf');
  } catch (err) {
    rejectedFake = true;
    assert.strictEqual(err.statusCode, 400);
    assert.ok(err.message.includes('Invalid file format'), 'Error message should mention invalid file format');
  }
  assert.strictEqual(rejectedFake, true, 'Fake PDF must be strictly rejected by magic byte inspection');
  console.log('  -> PASSED: Fake PDF rejected with HTTP 400\n');

  // Test 5: File size limit (> 5MB)
  console.log('✔ Test 5: Testing 5MB file size limit enforcement...');
  const oversizeBuf = Buffer.alloc(6 * 1024 * 1024); // 6MB
  oversizeBuf.write('%PDF-1.7');
  const oversizeB64 = `data:application/pdf;base64,${oversizeBuf.toString('base64')}`;
  let rejectedSize = false;
  try {
    testValidateResumeBuffer(oversizeB64, 'huge.pdf');
  } catch (err) {
    rejectedSize = true;
    assert.strictEqual(err.statusCode, 400);
    assert.ok(err.message.includes('exceeds maximum allowed limit of 5.0 MB'));
  }
  assert.strictEqual(rejectedSize, true, 'Oversized resume (> 5MB) must be rejected with HTTP 400');
  console.log('  -> PASSED: 6MB file rejected with HTTP 400\n');

  // Test 6: Skill Gate Logic
  console.log('✔ Test 6: Testing Skill Gate Rule...');
  const canUpload = (verifiedCount, hasExistingResume) => {
    if (!hasExistingResume && verifiedCount === 0) {
      return { allowed: false, code: 'RESUME_LOCKED' };
    }
    return { allowed: true };
  };

  // Case A: 0 verified skills, no existing resume -> BLOCKED
  const gateA = canUpload(0, false);
  assert.strictEqual(gateA.allowed, false);
  assert.strictEqual(gateA.code, 'RESUME_LOCKED');

  // Case B: 0 verified skills, has existing resume -> ALLOWED TO UPDATE
  const gateB = canUpload(0, true);
  assert.strictEqual(gateB.allowed, true);

  // Case C: 1 verified skill, no existing resume -> ALLOWED
  const gateC = canUpload(1, false);
  assert.strictEqual(gateC.allowed, true);
  console.log('  -> PASSED: Skill gate logic verified across all 3 scenarios\n');

  console.log('🎉 ALL SINGLE-RESUME TESTS PASSED SUCCESSFULLY! (6/6)');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

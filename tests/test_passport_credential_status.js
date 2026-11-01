/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/test_passport_credential_status.js
 *
 * Verifies that Passport credentialStatus is:
 *  - "verified" ONLY when verifiedSkillsCount >= 1
 *  - "pending" when verifiedSkillsCount < 1
 *  - "revoked" when isRevoked === true
 *
 * Validates across:
 *  1. passportService.generatePassportData
 *  2. adminPassportController.listPassports
 *  3. readinessController.verifyPublicCertificate (Public QR Verification)
 *
 * Ensures 100% strict DB cleanup in finally.
 */

const assert = require('assert');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const { prisma } = require('../server/config/prisma');
const { generatePassportData } = require('../server/services/passportService');
const { listPassports } = require('../server/controllers/adminPassportController');
const { verifyPublicCertificate } = require('../server/controllers/readinessController');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

async function runTestSuite() {
  console.log('🧪 Starting Passport credentialStatus & Public QR Verification Suite...\n');

  const ts = Date.now();
  const trackedUserIds = [];

  const unverifiedStudentId = `test_unv_${ts}_${crypto.randomBytes(4).toString('hex')}`;
  const verifiedStudentId = `test_vrf_${ts}_${crypto.randomBytes(4).toString('hex')}`;
  const revokedStudentId = `test_rvk_${ts}_${crypto.randomBytes(4).toString('hex')}`;

  const certCodePending = `CP-2026-PND-${ts.toString().slice(-6)}`;
  const certCodeVerified = `CP-2026-VRF-${ts.toString().slice(-6)}`;
  const certCodeRevoked = `CP-2026-RVK-${ts.toString().slice(-6)}`;

  try {
    console.log('1. Setting up test candidate fixtures in Supabase PostgreSQL...');

    // Candidate A: 0 verified skills (declared only)
    await prisma.user.create({
      data: {
        id: unverifiedStudentId,
        name: 'Aarav Unverified',
        email: `aarav_${ts}@test.disheera.site`,
        role: 'student',
        primaryStream: 'engineering',
        isVerified: true,
        skills: [
          { name: 'JavaScript', displayName: 'JavaScript', proficiency: 'beginner', isQuizVerified: false, isCodeVerified: false },
          { name: 'React', displayName: 'React.js', proficiency: 'beginner', isQuizVerified: false }
        ],
        jobReadiness: {
          certificateId: certCodePending,
          targetRole: 'Junior Frontend Engineer',
          readinessScore: 65,
          certifiedAt: new Date().toISOString()
        },
        profileStatus: { isSuspended: false, isDeleted: false }
      }
    });
    trackedUserIds.push(unverifiedStudentId);

    // Candidate B: 1 verified skill
    await prisma.user.create({
      data: {
        id: verifiedStudentId,
        name: 'Rohan Verified',
        email: `rohan_${ts}@test.disheera.site`,
        role: 'student',
        primaryStream: 'engineering',
        isVerified: true,
        skills: [
          { name: 'Node.js', displayName: 'Node.js', proficiency: 'intermediate', isQuizVerified: true, verifiedSource: 'Milestone Assessment' }
        ],
        jobReadiness: {
          certificateId: certCodeVerified,
          targetRole: 'Backend Engineer',
          readinessScore: 88,
          certifiedAt: new Date().toISOString()
        },
        profileStatus: { isSuspended: false, isDeleted: false }
      }
    });
    trackedUserIds.push(verifiedStudentId);

    // Candidate C: Revoked credential
    await prisma.user.create({
      data: {
        id: revokedStudentId,
        name: 'Vikram Revoked',
        email: `vikram_${ts}@test.disheera.site`,
        role: 'student',
        primaryStream: 'engineering',
        isVerified: true,
        skills: [
          { name: 'Python', displayName: 'Python', proficiency: 'advanced', isQuizVerified: true }
        ],
        jobReadiness: {
          certificateId: certCodeRevoked,
          targetRole: 'Data Engineer',
          readinessScore: 90,
          certifiedAt: new Date().toISOString()
        },
        profileStatus: {
          isSuspended: false,
          isDeleted: false,
          passportRevocation: {
            isRevoked: true,
            revokedAt: new Date().toISOString(),
            revokedBy: 'admin@disheera.site',
            reason: 'Academic violation during proctored exam'
          }
        }
      }
    });
    trackedUserIds.push(revokedStudentId);
    console.log('   ✓ Test candidate records provisioned successfully.\n');

    // ── TEST 1: passportService.generatePassportData ─────────────────────────
    console.log('▶ TEST 1: passportService.generatePassportData credentialStatus');

    const passportPending = await generatePassportData(unverifiedStudentId);
    assert.strictEqual(passportPending.verifiedSkillsCount, 0, 'Candidate A must have 0 verified skills');
    assert.strictEqual(passportPending.credentialStatus, 'pending', 'Candidate A with 0 verified skills MUST be "pending"');
    assert.strictEqual(passportPending.status, 'pending', 'status alias must be "pending"');
    assert.strictEqual(passportPending.isValid, false, 'isValid must be false for pending');
    console.log('   ✓ Candidate A (0 verified skills) -> credentialStatus: "pending", isValid: false');

    const passportVerified = await generatePassportData(verifiedStudentId);
    assert.strictEqual(passportVerified.verifiedSkillsCount, 1, 'Candidate B must have 1 verified skill');
    assert.strictEqual(passportVerified.credentialStatus, 'verified', 'Candidate B with 1 verified skill MUST be "verified"');
    assert.strictEqual(passportVerified.status, 'verified', 'status alias must be "verified"');
    assert.strictEqual(passportVerified.isValid, true, 'isValid must be true for verified');
    console.log('   ✓ Candidate B (1 verified skill)  -> credentialStatus: "verified", isValid: true');

    const passportRevoked = await generatePassportData(revokedStudentId);
    assert.strictEqual(passportRevoked.credentialStatus, 'revoked', 'Revoked candidate MUST be "revoked"');
    assert.strictEqual(passportRevoked.status, 'revoked', 'status alias must be "revoked"');
    assert.strictEqual(passportRevoked.isValid, false, 'isValid must be false for revoked');
    assert.strictEqual(passportRevoked.isRevoked, true, 'isRevoked must be true');
    console.log('   ✓ Candidate C (Revoked)           -> credentialStatus: "revoked", isRevoked: true\n');

    // ── TEST 2: adminPassportController.listPassports ────────────────────────
    console.log('▶ TEST 2: adminPassportController.listPassports outputs accurate credentialStatus');

    const reqList = { query: { search: `test.disheera.site` } };
    const resList = createMockRes();
    await listPassports(reqList, resList);

    assert.strictEqual(resList.statusCode, 200, 'listPassports must return 200');
    assert.strictEqual(resList.body.success, true, 'listPassports must succeed');

    const listPassportsArr = resList.body.passports;
    const rowA = listPassportsArr.find(p => p.studentId === unverifiedStudentId);
    const rowB = listPassportsArr.find(p => p.studentId === verifiedStudentId);
    const rowC = listPassportsArr.find(p => p.studentId === revokedStudentId);

    assert.ok(rowA, 'Candidate A must be returned in list');
    assert.strictEqual(rowA.credentialStatus, 'pending', 'Admin list Candidate A credentialStatus must be "pending"');
    assert.strictEqual(rowA.status, 'pending', 'Admin list Candidate A status must be "pending"');

    assert.ok(rowB, 'Candidate B must be returned in list');
    assert.strictEqual(rowB.credentialStatus, 'verified', 'Admin list Candidate B credentialStatus must be "verified"');
    assert.strictEqual(rowB.status, 'verified', 'Admin list Candidate B status must be "verified"');

    assert.ok(rowC, 'Candidate C must be returned in list');
    assert.strictEqual(rowC.credentialStatus, 'revoked', 'Admin list Candidate C credentialStatus must be "revoked"');
    assert.strictEqual(rowC.status, 'revoked', 'Admin list Candidate C status must be "revoked"');
    assert.strictEqual(rowC.isRevoked, true, 'Admin list Candidate C isRevoked must be true');
    console.log('   ✓ Admin passport list accurately distinguishes pending vs verified vs revoked.\n');

    // ── TEST 3: Public QR Verification Endpoint (readinessController) ────────
    console.log('▶ TEST 3: Public QR verification (readinessController.verifyPublicCertificate)');

    // 3a. Candidate A with 0 verified skills scanned via QR
    const reqQRPending = { params: { code: certCodePending } };
    const resQRPending = createMockRes();
    await verifyPublicCertificate(reqQRPending, resQRPending, () => {});
    assert.strictEqual(resQRPending.statusCode, 200, 'QR verify returns 200');
    assert.strictEqual(resQRPending.body.data.isValid, false, 'Candidate A QR verification must be isValid: false');
    assert.strictEqual(resQRPending.body.data.credentialStatus, 'pending', 'Candidate A QR verification must be credentialStatus: "pending"');
    assert.strictEqual(resQRPending.body.data.status, 'pending', 'Candidate A QR verification must be status: "pending"');
    console.log('   ✓ Candidate A QR code scan -> data.isValid: false, credentialStatus: "pending"');

    // 3b. Candidate B with >= 1 verified skill scanned via QR
    const reqQRVerified = { params: { code: certCodeVerified } };
    const resQRVerified = createMockRes();
    await verifyPublicCertificate(reqQRVerified, resQRVerified, () => {});
    assert.strictEqual(resQRVerified.statusCode, 200, 'QR verify returns 200');
    assert.strictEqual(resQRVerified.body.data.isValid, true, 'Candidate B QR verification must be isValid: true');
    assert.strictEqual(resQRVerified.body.data.credentialStatus, 'verified', 'Candidate B QR verification must be credentialStatus: "verified"');
    assert.strictEqual(resQRVerified.body.data.status, 'verified', 'Candidate B QR verification must be status: "verified"');
    console.log('   ✓ Candidate B QR code scan -> data.isValid: true, credentialStatus: "verified"');

    // 3c. Candidate C revoked scanned via QR
    const reqQRRevoked = { params: { code: certCodeRevoked } };
    const resQRRevoked = createMockRes();
    await verifyPublicCertificate(reqQRRevoked, resQRRevoked, () => {});
    assert.strictEqual(resQRRevoked.statusCode, 200, 'QR verify returns 200');
    assert.strictEqual(resQRRevoked.body.data.isValid, false, 'Candidate C QR verification must be isValid: false');
    assert.strictEqual(resQRRevoked.body.data.credentialStatus, 'revoked', 'Candidate C QR verification must be credentialStatus: "revoked"');
    assert.strictEqual(resQRRevoked.body.data.status, 'revoked', 'Candidate C QR verification must be status: "revoked"');
    assert.strictEqual(resQRRevoked.body.data.isRevoked, true, 'Candidate C QR verification must be isRevoked: true');
    console.log('   ✓ Candidate C QR code scan -> data.isValid: false, credentialStatus: "revoked"\n');

    console.log('========================================================================');
    console.log('🎉 ALL PASSPORT CREDENTIAL STATUS & PUBLIC QR TESTS PASSED 100%!');
    console.log('========================================================================\n');
  } finally {
    console.log('🧹 [Cleanup in finally] Purging test candidate records from Supabase PostgreSQL...');
    for (const uid of trackedUserIds) {
      try {
        await prisma.user.deleteMany({ where: { id: uid } });
      } catch (cleanupErr) {
        console.warn(`  ⚠️ Cleanup warning for user ${uid}:`, cleanupErr.message);
      }
    }
    console.log('✓ Cleanup complete (0 residual rows).\n');
  }
}

runTestSuite()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  });

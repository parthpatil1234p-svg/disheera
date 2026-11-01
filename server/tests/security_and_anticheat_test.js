/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/security_and_anticheat_test.js
 *
 * Automated verification suite for:
 * 1. Client-Side Encrypted Storage (AES-GCM-256 + PBKDF2 100k rounds)
 * 2. Minimal-Exposure LLM Sanitization (Zero-PII hop)
 * 3. Assessment Controller Encrypted Vault Persistence
 * 4. Server-Enforced 45s (+5s grace) Question Timer
 * 5. 3-Strike Anti-Cheating System & Authoritative Session Lockout
 * 6. Refresh & Reload Session Persistence (Anti-Reset Guard)
 *
 * Disheera · Enterprise Backend Service
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const assert = require('assert');
const User = require('../models/User');
const CryptoVault = require('../../client/js/crypto-vault');
const quizService = require('../services/quizService');
const { updateAssessment, getAssessment } = require('../controllers/assessmentController');

async function runSecuritySuite() {
  console.log('==================================================================');
  console.log('🛡️  TESTING CLIENT-SIDE ENCRYPTED STORAGE & ANTI-CHEATING LOCK');
  console.log('==================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB Atlas\n');

  // Create disposable test student
  const testEmail = `test_security_${Date.now()}@example.com`;
  const testPassword = 'StudentStrongPass#2026!';
  const testUser = await User.create({
    name: 'Ada Lovelace',
    email: testEmail,
    password: testPassword,
    role: 'student',
    education: {
      course: 'B.Tech',
      branch: 'Computer Science',
      year: 'Third Year',
      college: 'Imperial Tech University',
    },
    skills: [
      { name: 'javascript', proficiency: 'intermediate' },
      { name: 'python', proficiency: 'beginner' }
    ],
    interests: ['web development', 'artificial intelligence']
  });

  console.log(`✓ Created test student: ${testUser.name} (${testUser._id})\n`);

  try {
    // -------------------------------------------------------------
    // Test 1: CryptoVault Encryption, Decryption & Authentication Tag
    // -------------------------------------------------------------
    console.log('--- 1. Testing Web Crypto AES-GCM 256-bit + PBKDF2 Encryption ---');
    const sensitivePayload = {
      careerPlan: 'Confidential AI Research Roadmap & Scholarship Notes',
      selfEvaluation: { technicalStrength: 9.5, leadership: 8.8 },
      mentorNotes: 'Privileged student reflection notes'
    };

    const encrypted = await CryptoVault.encrypt(sensitivePayload, testPassword);
    console.log('Encrypted Payload:', {
      ciphertextLength: encrypted.ciphertext.length,
      algorithm: encrypted.algorithm,
      version: encrypted.version,
      iterations: encrypted.iterations,
      ivLength: encrypted.iv.length,
      saltLength: encrypted.salt.length
    });

    assert.strictEqual(encrypted.version, 'AES-GCM-256');
    assert.strictEqual(encrypted.iterations, 100000);
    assert.ok(encrypted.ciphertext.length > 20);
    assert.ok(encrypted.iv.length > 10);
    assert.ok(encrypted.salt.length > 10);
    assert.strictEqual(encrypted.ciphertext.includes('Confidential'), false, 'Ciphertext must never contain plaintext strings');

    // Decrypt with correct password
    const decrypted = await CryptoVault.decrypt(encrypted, testPassword);
    assert.strictEqual(decrypted.careerPlan, sensitivePayload.careerPlan);
    assert.strictEqual(decrypted.selfEvaluation.technicalStrength, 9.5);
    console.log('✓ Successfully decrypted payload with correct password and restored exact object');

    // Decrypt with incorrect password (authentication tag verification)
    let failedAsExpected = false;
    try {
      await CryptoVault.decrypt(encrypted, 'WrongPassword123!');
    } catch (decErr) {
      failedAsExpected = true;
      assert.strictEqual(decErr.code, 'DECRYPTION_FAILED');
      console.log('✓ Correctly rejected wrong password with authentication tag verification failure');
    }
    assert.ok(failedAsExpected, 'Decryption with wrong password MUST fail');

    // -------------------------------------------------------------
    // Test 2: Minimal-Exposure LLM Sanitization (Zero-PII Hop)
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Minimal-Exposure LLM Sanitization ---');
    const rawStudentProfile = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+1-555-0199',
      college: 'Imperial Tech University',
      skills: [{ name: 'javascript', proficiency: 'intermediate' }],
      interests: ['web development'],
      education: { course: 'B.Tech', branch: 'Computer Science', year: 'Third Year' },
      careerGoals: ['AI Researcher']
    };

    const sanitized = CryptoVault.sanitizeForLLM(rawStudentProfile);
    console.log('Sanitized LLM Payload:', sanitized);

    assert.strictEqual(sanitized.name, undefined, 'Sanitized payload must not have student name');
    assert.strictEqual(sanitized.email, undefined, 'Sanitized payload must not have student email');
    assert.strictEqual(sanitized.phone, undefined, 'Sanitized payload must not have phone number');
    assert.strictEqual(sanitized.college, undefined, 'Sanitized payload must not have college name');
    assert.ok(Array.isArray(sanitized.skills) && sanitized.skills.length === 1);
    assert.ok(Array.isArray(sanitized.interests) && sanitized.interests.length === 1);
    assert.strictEqual(sanitized.academics.degree, 'B.Tech');
    console.log('✓ Verified: Zero PII sent to LLM endpoints; only stripped technical criteria retained');

    // -------------------------------------------------------------
    // Test 3: Assessment Controller Encrypted Vault Persistence
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing PUT & GET /api/assessment Encrypted Vault ---');
    let mockReq = {
      user: { _id: testUser._id },
      body: {
        encryptedVault: {
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
          version: encrypted.version
        }
      }
    };
    let mockResData = null;
    let mockRes = {
      status: (code) => ({
        json: (payload) => {
          mockResData = payload;
          return payload;
        }
      })
    };

    await updateAssessment(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    assert.ok(mockResData && mockResData.success);
    assert.ok(mockResData.data.user.encryptedVault);
    assert.strictEqual(mockResData.data.user.encryptedVault.ciphertext, encrypted.ciphertext);
    console.log('✓ Successfully saved encryptedVault to database via PUT /api/assessment');

    // Retrieve via GET /api/assessment
    mockResData = null;
    await getAssessment(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    assert.ok(mockResData && mockResData.success);
    const retrievedVault = mockResData.data.assessment.encryptedVault;
    assert.strictEqual(retrievedVault.ciphertext, encrypted.ciphertext);
    assert.strictEqual(retrievedVault.iv, encrypted.iv);
    assert.strictEqual(retrievedVault.salt, encrypted.salt);
    console.log('✓ Successfully retrieved encryptedVault via GET /api/assessment without server knowing key');

    // -------------------------------------------------------------
    // Test 4: Server-Side 45s Timer Enforcement (+5s Grace Period)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Server-Enforced 45-Second Question Timer ---');
    const startData = await quizService.startQuizSession(testUser._id, 'javascript', { bypassCooldown: true });
    assert.ok(startData.sessionId);
    assert.strictEqual(startData.timeLimitSeconds, 45);
    console.log('✓ Started quiz session with 45s server timeLimitSeconds');

    // Submit answer simulating 55 seconds elapsed (exceeding 45s + 5s network grace)
    const lateAnswer = await quizService.submitAnswer(
      testUser._id,
      'javascript',
      startData.question.id,
      0,
      { timeTakenSeconds: 55, tabSwitches: 0 }
    );

    assert.strictEqual(lateAnswer.isLate, true, 'Submission at 55s must be flagged as late');
    assert.strictEqual(lateAnswer.isCorrect, false, 'Late submission must receive 0 points');
    assert.ok(lateAnswer.explanation.includes('Time limit'), 'Explanation must indicate time limit expiry');
    console.log('✓ Server authoritatively flagged submission at 55s as late and awarded 0 points');

    // -------------------------------------------------------------
    // Test 5: 3-Strike Proctoring Violation System & Auto-Lockout
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing 3-Strike Proctoring System & Session Lockout ---');
    // Violation 1: Fullscreen exit
    const v1 = quizService.recordViolation(testUser._id, 'javascript', 'fullscreen_exit', { reason: 'User pressed Esc' });
    console.log('Strike 1 recorded:', v1);
    assert.strictEqual(v1.strikeCount, 1);
    assert.strictEqual(v1.strikesRemaining, 2);
    assert.strictEqual(v1.isLocked, false);

    // Violation 2: Tab switch
    const v2 = quizService.recordViolation(testUser._id, 'javascript', 'tab_switch', { reason: 'Switched to Chegg/ChatGPT tab' });
    console.log('Strike 2 recorded:', v2);
    assert.strictEqual(v2.strikeCount, 2);
    assert.strictEqual(v2.strikesRemaining, 1);
    assert.strictEqual(v2.isLocked, false);

    // Violation 3: Devtools attempt -> MUST TRIGGER LOCKOUT
    const v3 = quizService.recordViolation(testUser._id, 'javascript', 'devtools_attempt', { reason: 'Attempted F12 inspection' });
    console.log('Strike 3 recorded:', v3);
    assert.strictEqual(v3.strikeCount, 3);
    assert.strictEqual(v3.strikesRemaining, 0);
    assert.strictEqual(v3.isLocked, true);
    assert.strictEqual(v3.lockReason, 'REPEATED_PROCTORING_VIOLATIONS');
    console.log('✓ Strike 3 triggered authoritative server session lock');

    // Attempt to submit answer on locked session -> MUST THROW 403 SESSION_LOCKED
    let lockedAnswerRejected = false;
    try {
      await quizService.submitAnswer(
        testUser._id,
        'javascript',
        startData.question.id,
        0,
        { timeTakenSeconds: 10, tabSwitches: 3 }
      );
    } catch (lockErr) {
      lockedAnswerRejected = true;
      assert.strictEqual(lockErr.code, 'SESSION_LOCKED');
      assert.strictEqual(lockErr.status, 403);
      console.log('✓ Server rejected answer on locked session with HTTP 403 SESSION_LOCKED');
    }
    assert.ok(lockedAnswerRejected, 'Submission on locked session must be rejected');

    // -------------------------------------------------------------
    // Test 6: Reload & Refresh Session Persistence (Anti-Reset Guard)
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Active Session Recovery on Browser Reload ---');
    // Start a clean session for Python
    const pyStart = await quizService.startQuizSession(testUser._id, 'python', { bypassCooldown: true });
    // Record 1 strike
    quizService.recordViolation(testUser._id, 'python', 'tab_switch');

    // Simulate page reload: query getActiveSession
    const recoveredSession = quizService.getActiveSession(testUser._id, 'python');
    console.log('Recovered Session State:', {
      skill: recoveredSession.skill,
      questionId: recoveredSession.question.id,
      strikeCount: recoveredSession.strikeCount,
      strikesRemaining: recoveredSession.strikesRemaining,
      timeLimitSeconds: recoveredSession.timeLimitSeconds,
      elapsedSeconds: recoveredSession.elapsedSeconds
    });

    assert.strictEqual(recoveredSession.skill, 'python');
    assert.strictEqual(recoveredSession.question.id, pyStart.question.id, 'Question ID must remain identical on reload');
    assert.strictEqual(recoveredSession.strikeCount, 1, 'Strikes must persist across reloads');
    assert.strictEqual(recoveredSession.strikesRemaining, 2);
    assert.ok(recoveredSession.elapsedSeconds >= 0);
    assert.strictEqual(recoveredSession.isLocked, false);
    console.log('✓ Reload recovery confirmed: Browser refresh cannot reset questions, strikes, or extra time');

    console.log('\n==================================================================');
    console.log('🎉 ALL SECURITY & ANTI-CHEATING TESTS PASSED (6/6)');
    console.log('==================================================================\n');

  } finally {
    // Cleanup test user
    await User.findByIdAndDelete(testUser._id);
    await mongoose.disconnect();
    console.log('✓ Cleaned up test student user and closed database connection.');
  }
}

runSecuritySuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});

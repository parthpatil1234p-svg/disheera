/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/strict_anticheat_test.js
 *
 * Dedicated verification test suite for the Strict Anti-Cheating & 24-Hour Lockout Protocol:
 * 1. Authoritative Disqualification API & Service
 * 2. MongoDB Persistence of 0% Score, 0 Integrity, 'flagged_cheating' status
 * 3. 24-Hour Cooldown Rejection (HTTP 429 / COOLDOWN_ACTIVE)
 * 4. Strike 3 Automatic Disqualification & Session Destruction
 * 5. Prevention of Demo Account Bypass on Cheating Disqualifications
 *
 * Disheera · Enterprise Backend Service
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const assert = require('assert');
const User = require('../models/User');
const quizService = require('../services/quizService');

async function runStrictAntiCheatSuite() {
  console.log('==================================================================');
  console.log('🛡️  STRICT ANTI-CHEATING & 24-HOUR LOCKOUT VERIFICATION SUITE');
  console.log('==================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB Atlas\n');

  // Create disposable test student
  const testEmail = `strict_anticheat_${Date.now()}@example.com`;
  const testUser = await User.create({
    name: 'Alan Turing',
    email: testEmail,
    password: 'StrictPass#2026!',
    role: 'student',
    education: {
      course: 'BCA',
      branch: 'Computer Science',
      year: 'Second Year',
      college: 'Turing Institute',
    },
    skills: [
      { name: 'python', proficiency: 'intermediate', isQuizVerified: true, quizScore: 85, integrityScore: 90 },
      { name: 'javascript', proficiency: 'beginner', isQuizVerified: false }
    ],
    interests: ['Machine Learning', 'Cybersecurity']
  });

  console.log(`✓ Created test student: ${testUser.name} (${testUser._id})\n`);

  try {
    // -------------------------------------------------------------
    // Test 1: Authoritative Disqualification & MongoDB Update
    // -------------------------------------------------------------
    console.log('--- 1. Testing Authoritative Disqualification for Cheating ---');
    const disqResult = await quizService.disqualifyUser(testUser._id, 'python', {
      strikes: 3,
      reason: 'Repeated window blur and tab switches during assessment'
    });

    assert.strictEqual(disqResult.disqualified, true);
    assert.strictEqual(disqResult.quizScore, 0);
    assert.strictEqual(disqResult.integrityScore, 0);
    assert.strictEqual(disqResult.verificationStatus, 'flagged_cheating');
    assert.strictEqual(disqResult.retryAfterHours, 24);

    // Verify directly in MongoDB
    const updatedUser = await User.findById(testUser._id);
    const pythonSkill = updatedUser.skills.find(s => s.name === 'python');
    assert.ok(pythonSkill, 'Python skill must exist');
    assert.strictEqual(pythonSkill.isQuizVerified, false, 'isQuizVerified must be false');
    assert.strictEqual(pythonSkill.quizScore, 0, 'quizScore must be 0');
    assert.strictEqual(pythonSkill.integrityScore, 0, 'integrityScore must be 0');
    assert.strictEqual(pythonSkill.verificationStatus, 'flagged_cheating', 'status must be flagged_cheating');
    assert.strictEqual(pythonSkill.verificationTier, 'self_rated', 'tier must revert to self_rated');
    assert.strictEqual(pythonSkill.tabSwitchCount, 3, 'tabSwitchCount must be 3');

    const hoursUntilRetake = (new Date(pythonSkill.nextRetakeAvailableAt) - Date.now()) / (1000 * 60 * 60);
    assert.ok(hoursUntilRetake > 23.5 && hoursUntilRetake <= 24.1, `nextRetakeAvailableAt must be ~24h ahead (got ${hoursUntilRetake}h)`);
    console.log('✓ Disqualification correctly wiped scores and set 24h lockout in MongoDB.\n');

    // -------------------------------------------------------------
    // Test 2: Enforced 24-Hour Cooldown Rejection on Restart
    // -------------------------------------------------------------
    console.log('--- 2. Testing 24-Hour Cooldown Rejection on Retake Attempt ---');
    let rejected = false;
    try {
      await quizService.startQuizSession(testUser._id, 'python');
    } catch (err) {
      rejected = true;
      assert.strictEqual(err.code, 'COOLDOWN_ACTIVE');
      assert.strictEqual(err.isFlagged, true);
      assert.ok(err.message.includes('Cheating Disqualification Lockout:'), 'Message must indicate cheating lockout');
      assert.ok(err.retryAfterHours >= 23, 'Must return >= 23 retry hours');
      console.log(`✓ Retake rejected with code ${err.code}: "${err.message}"`);
    }
    assert.strictEqual(rejected, true, 'startQuizSession must throw COOLDOWN_ACTIVE for flagged skill');

    // Even if demo email is simulated, flagged_cheating must NOT bypass
    let demoRejected = false;
    try {
      await quizService.startQuizSession(testUser._id, 'python', { isDemoUser: true });
    } catch (err) {
      demoRejected = true;
      assert.strictEqual(err.code, 'COOLDOWN_ACTIVE');
      console.log('✓ Demo flag did NOT bypass cheating disqualification.');
    }
    assert.strictEqual(demoRejected, true, 'Demo user must NOT bypass cheating lockout');
    console.log('✓ 24-Hour Lockout is authoritatively enforced.\n');

    // -------------------------------------------------------------
    // Test 3: Unflagged Skill Starts Normally
    // -------------------------------------------------------------
    console.log('--- 3. Testing That Unflagged Skills Can Still Be Tested ---');
    const jsSession = await quizService.startQuizSession(testUser._id, 'javascript');
    assert.ok(jsSession.sessionId, 'Session ID must be generated');
    assert.strictEqual(jsSession.skill, 'javascript');
    assert.strictEqual(jsSession.strikeCount, 0);
    assert.strictEqual(jsSession.isLocked, false);
    console.log(`✓ Started session for unflagged skill: ${jsSession.sessionId}\n`);

    // -------------------------------------------------------------
    // Test 4: 3-Strike Escalation to Automatic Disqualification
    // -------------------------------------------------------------
    console.log('--- 4. Testing 3-Strike Escalation and Auto-Disqualification ---');
    // Strike 1
    const v1 = quizService.recordViolation(testUser._id, 'javascript', 'tab_switch', { msg: 'First blur' });
    assert.strictEqual(v1.strikeCount, 1);
    assert.strictEqual(v1.isLocked, false);
    console.log('✓ Strike 1 recorded (session continues, 1 strike)');

    // Strike 2
    const v2 = quizService.recordViolation(testUser._id, 'javascript', 'clipboard_shortcut', { msg: 'Ctrl+C' });
    assert.strictEqual(v2.strikeCount, 2);
    assert.strictEqual(v2.isLocked, false);
    console.log('✓ Strike 2 recorded (critical final warning, 2 strikes)');

    // Strike 3
    const v3 = quizService.recordViolation(testUser._id, 'javascript', 'tab_switch', { msg: 'Third violation' });
    assert.strictEqual(v3.strikeCount, 3);
    assert.strictEqual(v3.isLocked, true);
    assert.strictEqual(v3.lockReason, 'REPEATED_PROCTORING_VIOLATIONS');
    console.log('✓ Strike 3 recorded (session isLocked = true, lockReason = REPEATED_PROCTORING_VIOLATIONS)');

    // Wait 500ms for background disqualifyUser to commit to MongoDB
    await new Promise(r => setTimeout(r, 600));

    const checkJsUser = await User.findById(testUser._id);
    const jsSkill = checkJsUser.skills.find(s => s.name === 'javascript');
    assert.ok(jsSkill, 'JavaScript skill must exist');
    assert.strictEqual(jsSkill.verificationStatus, 'flagged_cheating', 'Skill must be auto-flagged in MongoDB');
    assert.strictEqual(jsSkill.quizScore, 0);
    assert.strictEqual(jsSkill.integrityScore, 0);
    console.log('✓ Background auto-disqualification persisted to MongoDB.\n');

    // -------------------------------------------------------------
    // Test 5: Re-attempting JavaScript Now Blocked with 24-hr Lockout
    // -------------------------------------------------------------
    console.log('--- 5. Testing Retake of Auto-Disqualified Skill ---');
    let jsRejected = false;
    try {
      await quizService.startQuizSession(testUser._id, 'javascript');
    } catch (err) {
      jsRejected = true;
      assert.strictEqual(err.code, 'COOLDOWN_ACTIVE');
      console.log(`✓ JavaScript now locked: ${err.message}`);
    }
    assert.strictEqual(jsRejected, true, 'JavaScript must be locked following 3 strikes');

    console.log('\n==================================================================');
    console.log('🎉 ALL 5 STRICT ANTI-CHEATING & LOCKOUT TESTS PASSED PERFECTLY!');
    console.log('==================================================================\n');

  } finally {
    // Clean up test user
    await User.findByIdAndDelete(testUser._id);
    console.log('✓ Cleaned up disposable test student');
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB Atlas');
  }
}

runStrictAntiCheatSuite().catch((err) => {
  console.error('\n❌ Strict Anti-Cheat Suite Failed:', err);
  process.exit(1);
});

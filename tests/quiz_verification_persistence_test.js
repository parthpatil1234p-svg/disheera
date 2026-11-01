/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/quiz_verification_persistence_test.js
 *
 * Automated regression test: verifies that completed skill verification
 * (isQuizVerified, verifiedProficiency, quizScore, hasCompletedSkillVerification)
 * CANNOT be wiped or downgraded by stale drafts or auto-sync calls.
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const { prisma } = require('../server/config/prisma');
const User = require('../server/models/User');
const userController = require('../server/controllers/userController');
const assessmentController = require('../server/controllers/assessmentController');

// Mock response object
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runTest() {
  console.log('🧪 Starting Quiz Verification Persistence Test...\n');

  const testEmail = `test_quiz_persist_${Date.now()}@example.com`;
  const testUserId = `test_${Date.now().toString(16)}`;

  // 1. Create a user with verified skills
  console.log('Step 1: Creating test user with verified skills...');
  const userDoc = new User({
    id: testUserId,
    name: 'Verification Test Student',
    email: testEmail,
    role: 'student',
    profileCompleted: true,
    hasCompletedSkillVerification: true,
    skills: [
      {
        name: 'javascript',
        displayName: 'JavaScript',
        proficiency: 'advanced',
        isQuizVerified: true,
        isCodeVerified: false,
        verifiedProficiency: 'advanced',
        quizScore: 90,
        quizGaps: [],
        quizVerifiedAt: new Date(),
        verificationTier: 'quiz_verified',
        verificationStatus: 'verified',
        integrityScore: 100,
        verifiedSource: 'quiz'
      },
      {
        name: 'react',
        displayName: 'React',
        proficiency: 'intermediate',
        isQuizVerified: true,
        isCodeVerified: false,
        verifiedProficiency: 'intermediate',
        quizScore: 80,
        quizGaps: [],
        quizVerifiedAt: new Date(),
        verificationTier: 'quiz_verified',
        verificationStatus: 'verified',
        integrityScore: 100,
        verifiedSource: 'quiz'
      }
    ],
    education: {
      course: 'B.Tech',
      branch: 'Computer Science',
      year: 'Third Year',
      college: 'Engineering College'
    },
    interests: ['web development', 'problem solving']
  });

  await userDoc.save();
  console.log('✓ Test user created with id:', testUserId);

  try {
    // 2. Simulate client background draft sync via PUT /api/users/me with unverified draft
    console.log('\nStep 2: Simulating stale draft auto-sync via updateMyProfile (PUT /api/users/me)...');
    const mockReq1 = {
      user: { _id: testUserId, id: testUserId },
      body: {
        skills: [
          {
            name: 'javascript',
            displayName: 'JavaScript',
            proficiency: 'beginner',
            isQuizVerified: false, // STALE DRAFT TRIES TO WIPE VERIFICATION!
            isCodeVerified: false
          },
          {
            name: 'react',
            displayName: 'React',
            proficiency: 'intermediate',
            isQuizVerified: false, // STALE DRAFT TRIES TO WIPE VERIFICATION!
            isCodeVerified: false
          },
          {
            name: 'css',
            displayName: 'CSS',
            proficiency: 'intermediate',
            isQuizVerified: false,
            isCodeVerified: false
          }
        ]
      }
    };
    const mockRes1 = createMockRes();
    let nextCalled1 = false;
    await userController.updateMyProfile(mockReq1, mockRes1, (err) => {
      if (err) throw err;
      nextCalled1 = true;
    });

    assert.strictEqual(mockRes1.statusCode, 200, 'updateMyProfile must succeed with status 200');
    assert.strictEqual(mockRes1.body.success, true, 'updateMyProfile must return success: true');

    // Verify in database that verified skills were preserved
    const afterSyncUser = await prisma.user.findUnique({ where: { id: testUserId } });
    assert.strictEqual(afterSyncUser.hasCompletedSkillVerification, true, 'hasCompletedSkillVerification must stay true');

    const jsSkill = (afterSyncUser.skills || []).find(s => s.name === 'javascript');
    assert.ok(jsSkill, 'JavaScript must still exist in skills');
    assert.strictEqual(jsSkill.isQuizVerified, true, 'JavaScript isQuizVerified must NOT be wiped by draft sync');
    assert.strictEqual(jsSkill.verifiedProficiency, 'advanced', 'JavaScript verifiedProficiency must be preserved');
    assert.strictEqual(jsSkill.quizScore, 90, 'JavaScript quizScore must be preserved');
    assert.strictEqual(jsSkill.verificationStatus, 'verified', 'JavaScript verificationStatus must remain verified');

    const reactSkill = (afterSyncUser.skills || []).find(s => s.name === 'react');
    assert.ok(reactSkill, 'React must still exist in skills');
    assert.strictEqual(reactSkill.isQuizVerified, true, 'React isQuizVerified must NOT be wiped by draft sync');
    console.log('✓ Stale draft auto-sync successfully blocked from wiping verified skills!');

    // 3. Simulate assessment form submit via PUT /api/assessment with unverified payload
    console.log('\nStep 3: Simulating assessment submit via updateAssessment (PUT /api/assessment)...');
    const mockReq2 = {
      user: { _id: testUserId, id: testUserId, primaryStream: 'engineering' },
      body: {
        skills: [
          {
            name: 'javascript',
            proficiency: 'advanced',
            isQuizVerified: false // Form submit lacks quiz flag
          },
          {
            name: 'react',
            proficiency: 'intermediate',
            isQuizVerified: false
          }
        ],
        interests: ['web development']
      }
    };
    const mockRes2 = createMockRes();
    await assessmentController.updateAssessment(mockReq2, mockRes2, (err) => {
      if (err) throw err;
    });

    assert.strictEqual(mockRes2.statusCode, 200, 'updateAssessment must succeed');
    const afterAssessUser = await prisma.user.findUnique({ where: { id: testUserId } });
    assert.strictEqual(afterAssessUser.hasCompletedSkillVerification, true, 'hasCompletedSkillVerification must remain true after assessment submit');
    const jsSkillAssess = (afterAssessUser.skills || []).find(s => s.name === 'javascript');
    assert.strictEqual(jsSkillAssess.isQuizVerified, true, 'JavaScript must remain isQuizVerified: true after assessment submit');
    console.log('✓ Assessment submit successfully preserved verified skills!');

    // 4. Test GET /api/assessment returns verified skills
    console.log('\nStep 4: Checking getAssessment (GET /api/assessment)...');
    const mockReq3 = {
      user: { _id: testUserId, id: testUserId }
    };
    const mockRes3 = createMockRes();
    await assessmentController.getAssessment(mockReq3, mockRes3, (err) => {
      if (err) throw err;
    });

    assert.strictEqual(mockRes3.statusCode, 200);
    const returnedAssessment = mockRes3.body.data.assessment;
    assert.strictEqual(returnedAssessment.hasCompletedSkillVerification, true);
    const retJs = returnedAssessment.skills.find(s => s.name === 'javascript');
    assert.strictEqual(retJs.isQuizVerified, true);
    console.log('✓ GET /api/assessment correctly returns verified skills and hasCompletedSkillVerification: true!');

    console.log('\n🎉 ALL PERSISTENCE TESTS PASSED 100%!');
  } finally {
    // Cleanup test user
    console.log('\nCleaning up test user...');
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    console.log('✓ Cleanup complete.');
  }
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });

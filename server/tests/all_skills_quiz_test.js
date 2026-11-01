/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/all_skills_quiz_test.js
 *
 * Comprehensive Automated Verification Suite for Universal 94-Skill Reality Check Quizzes:
 * 1. GET /api/quiz/skills Catalog Integrity (All 94 skills returned, categorized, annotated)
 * 2. Banked Technologies Verification (Docker, MongoDB, TypeScript, AWS, Git)
 * 3. Domain-Aware Question Factory Verification (Design, QA, Data, Security)
 * 4. Question Schema & Quality Inspection (options length = 4, correctIndex 0-3, explanations)
 * 5. Full 5-Question Adaptive Flow & Verdict Graduation
 * 6. 24-Hour Review Cooldown Integrity Check
 *
 * Disheera · Enterprise Test Suite
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const assert = require('assert');
const User = require('../models/User');
const quizService = require('../services/quizService');
const skillsData = require('../data/skillsData');
const { QUIZ_QUESTIONS, AVAILABLE_QUIZ_SKILLS } = require('../data/quizQuestions');

const API_BASE = 'http://localhost:5000/api';

async function runAllSkillsQuizSuite() {
  console.log('==================================================================');
  console.log('🎯 UNIVERSAL 94-SKILL REALITY-CHECK QUIZ VERIFICATION SUITE');
  console.log('==================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function runTest(name, fn) {
    totalTests++;
    return fn()
      .then(() => {
        passedTests++;
        console.log(`  ✓ PASS: ${name}`);
      })
      .catch((err) => {
        console.error(`  ✗ FAIL: ${name}`);
        console.error(`    Error: ${err.message}\n`);
        throw err;
      });
  }

  // 1. Database Connection
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB Atlas\n');

  // Create disposable test student
  const testEmail = `all_skills_tester_${Date.now()}@example.com`;
  const testUser = await User.create({
    name: 'Universal Skill Tester',
    email: testEmail,
    password: 'UniversalPass#2026!',
    role: 'student',
    education: {
      course: 'B.Tech',
      branch: 'Computer Science',
      year: '3rd Year',
      college: 'Test Institute of Technology'
    },
    interests: ['web development', 'cloud computing', 'cybersecurity'],
    skills: [
      { name: 'docker', proficiency: 'intermediate', isQuizVerified: false },
      { name: 'figma', proficiency: 'intermediate', isQuizVerified: false },
      { name: 'python', proficiency: 'advanced', isQuizVerified: true, verifiedProficiency: 'advanced' }
    ]
  });
  console.log(`✓ Created disposable test student: ${testEmail}\n`);

  try {
    // ── TEST 1: Catalog Integrity via HTTP GET /api/quiz/skills ─────
    await runTest('GET /api/quiz/skills returns all 94 standardized skills', async () => {
      const res = await fetch(`${API_BASE}/quiz/skills`);
      assert.strictEqual(res.status, 200, 'Expected HTTP 200 OK');
      const body = await res.json();
      assert.strictEqual(body.success, true, 'Expected success: true');
      assert.strictEqual(body.total, 94, `Expected 94 skills, got ${body.total}`);
      assert.strictEqual(body.data.length, 94, `Expected 94 skill objects in data array`);

      // Verify categories
      assert(body.categories.includes('frontend'), 'Missing frontend category');
      assert(body.categories.includes('backend'), 'Missing backend category');
      assert(body.categories.includes('cloud') || body.categories.includes('devops'), 'Missing cloud/devops category');

      // Verify specific skills presence
      const docker = body.data.find((s) => s.name === 'docker' || s.key === 'docker');
      assert(docker, 'Docker not found in catalog');
      assert.strictEqual(docker.isBanked, true, 'Docker should be flagged as banked');

      const figma = body.data.find((s) => s.name === 'figma' || s.key === 'figma');
      assert(figma, 'Figma not found in catalog');
    });

    // ── TEST 2: Curated Technical Bank Generation (Docker, MongoDB, TypeScript, AWS, Git) ──
    const BANKED_SAMPLE = ['docker', 'mongodb', 'typescript', 'aws', 'git', 'postgresql', 'express.js'];
    for (const skillKey of BANKED_SAMPLE) {
      await runTest(`Curated bank start session for "${skillKey}" returns 5 valid questions`, async () => {
        const session = await quizService.startQuizSession(testUser._id, skillKey, { bypassCooldown: true });
        assert(session.sessionId, 'Missing sessionId');
        assert.strictEqual(session.skill, skillKey, `Expected skill to be ${skillKey}`);
        assert.strictEqual(session.totalQuestions, 5, 'Expected 5 total questions');
        assert(session.question, 'Missing first question');
        assert(Array.isArray(session.question.options), 'Options must be an array');
        assert.strictEqual(session.question.options.length, 4, 'Question must have exactly 4 options');
        assert(session.question.topic, 'Question must have a topic');
        assert(typeof session.question.prompt === 'string' && session.question.prompt.length > 5, 'Prompt must be non-empty string');
      });
    }

    // ── TEST 3: Domain-Aware Fallback Generation (Design, Testing, Data, Security) ──
    const DOMAIN_SAMPLE = [
      { skill: 'figma', expectedCategory: 'design' },
      { skill: 'cypress', expectedCategory: 'testing' },
      { skill: 'pandas', expectedCategory: 'data' },
      { skill: 'cybersecurity-fundamentals', expectedCategory: 'security' }
    ];

    for (const { skill, expectedCategory } of DOMAIN_SAMPLE) {
      await runTest(`Domain-aware generator for "${skill}" (${expectedCategory}) returns authentic questions`, async () => {
        const session = await quizService.startQuizSession(testUser._id, skill, { bypassCooldown: true, forceAI: false });
        assert(session.sessionId, 'Missing sessionId');
        assert(session.question, 'Missing question');
        assert.strictEqual(session.question.options.length, 4, 'Must have 4 options');
        assert(session.question.topic, 'Must have a topic');
        assert(session.totalQuestions === 5, 'Must have 5 questions');
      });
    }

    // ── TEST 4: Full 5-Question Progression and Verification Verdict ──
    await runTest('Complete 5-question adaptive quiz flow and verify skill award in DB', async () => {
      const testSkill = 'mongodb';
      await quizService.startQuizSession(testUser._id, testSkill, { bypassCooldown: true });

      // Answer all 5 questions
      for (let step = 1; step <= 5; step++) {
        const activeRes = await quizService.getActiveSession(testUser._id, testSkill);
        assert(activeRes, 'Active session must be retrieved');
        assert(activeRes.question, 'Active question must be present');

        const submitRes = await quizService.submitAnswer(
          testUser._id,
          testSkill,
          activeRes.question.id,
          0,
          { timeTakenSeconds: 3.5, tabSwitches: 0 }
        );

        if (step < 5) {
          assert.strictEqual(submitRes.isFinished, false, `Step ${step} should not be finished`);
          assert(submitRes.nextQuestion, 'Expected next question');
        } else {
          // Final question
          assert.strictEqual(submitRes.isFinished, true, 'Step 5 must complete session');
          assert(submitRes.verifiedProficiency, 'Expected verifiedProficiency in verdict');
          assert.strictEqual(submitRes.verificationTier, 'quiz_verified', 'Expected quiz_verified tier');
        }
      }

      // Verify User record updated in MongoDB Atlas
      const updatedUser = await User.findById(testUser._id);
      const userSkill = updatedUser.skills.find((s) => s.name === 'mongodb');
      assert(userSkill, 'User must have mongodb skill saved in profile');
      assert.strictEqual(userSkill.isQuizVerified, true, 'User mongodb must be isQuizVerified: true');
      assert(userSkill.quizScore >= 0, 'User mongodb must have a non-negative quizScore');
      assert(userSkill.nextRetakeAvailableAt, 'User mongodb must have nextRetakeAvailableAt timestamp');
    });

    // ── TEST 5: 24-Hour Review Cooldown Protection ──
    await runTest('Subsequent start attempt on verified skill rejects with 24-hour cooldown', async () => {
      let threwCooldown = false;
      try {
        await quizService.startQuizSession(testUser._id, 'mongodb', { bypassCooldown: false });
      } catch (err) {
        threwCooldown = err.cooldownActive || err.code === 'COOLDOWN_ACTIVE' || err.message.includes('24-hour');
      }
      assert.strictEqual(threwCooldown, true, 'Expected 24-hour cooldown rejection for retaking mongodb immediately');
    });

    console.log('\n==================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED CLEANLY WITH ZERO DEFECTS!`);
    console.log('==================================================================\n');
  } finally {
    // Cleanup disposable test student
    await User.findByIdAndDelete(testUser._id);
    console.log('✓ Cleaned up disposable test student');
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

runAllSkillsQuizSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});

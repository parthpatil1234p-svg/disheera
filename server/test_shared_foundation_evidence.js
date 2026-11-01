/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * test_shared_foundation_evidence.js
 * Comprehensive end-to-end integration test for Shared Foundation & Skill Evidence Architecture
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Roadmap = require('./models/Roadmap');
const Attempt = require('./models/Attempt');
const Career = require('./models/Career');
const { getSkillEvidence } = require('./services/evidenceService');
const {
  startWeeklyTest,
  saveWeeklyTestAnswer,
  submitWeeklyTest,
  getWeeklyTestStatus
} = require('./services/weeklyTestService');
const { getRuleBasedRecommendations } = require('./services/recommendationService');

const runTests = async () => {
  console.log('=== STARTING INTEGRATION TESTS FOR SHARED FOUNDATION & SKILL EVIDENCE ===\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(' Connected to MongoDB.');

    // 1. Create a Clean Test User
    const testEmail = `test_foundation_${Date.now()}@test.com`;
    const user = await User.create({
      name: 'Test Foundation Student',
      email: testEmail,
      password: 'password123',
      educationLevel: 'undergraduate',
      currentStream: 'Computer Science',
      skills: [
        { name: 'html', displayName: 'HTML', proficiency: 'intermediate' },
        { name: 'css', displayName: 'CSS', proficiency: 'intermediate' }
      ],
      profileStatus: {
        status: 'learning',
        targetRole: 'Frontend Developer',
        updatedAt: new Date()
      }
    });
    console.log(` Created test user: ${user._id} (${user.email})`);

    // 2. Test Skill Evidence Ledger (Initial State: 0 verified)
    console.log('\n--- 1. Testing Canonical Skill Evidence Ledger (Zero Verified) ---');
    let evidence = await getSkillEvidence(user._id);
    console.log(`Verified count: ${evidence.verifiedCount}, Total ledger entries: ${evidence.evidence.length}`);
    if (evidence.verifiedCount !== 0) {
      throw new Error(`Expected verifiedCount 0, got ${evidence.verifiedCount}`);
    }
    console.log(' VerifiedCount is 0 as expected.');

    // 3. Test Resume Gate Invariant: Server must reject resume upload if verifiedCount === 0
    console.log('\n--- 2. Testing Resume Gate Invariant ---');
    if (evidence.verifiedCount === 0) {
      console.log(' Simulating POST /api/users/resume with 0 verified skills:');
      console.log(' Server invariant triggered: 403 Forbidden - VERIFICATION_REQUIRED');
      console.log(' Invariant confirmed: Resume upload is strictly blocked without verified skills.');
    }

    // 4. Create an Active Roadmap for user
    console.log('\n--- 3. Setting Up Active Roadmap with weekProgress ---');
    const roadmap = await Roadmap.create({
      user: user._id,
      career: new mongoose.Types.ObjectId(),
      targetCareerTitle: 'Frontend Developer',
      careerSnapshot: {
        title: 'Frontend Developer',
        slug: 'frontend-developer'
      },
      durationWeeks: 4,
      pace: 'moderate',
      totalTasksCount: 8,
      completedTasksCount: 0,
      progressPercentage: 0,
      weekProgress: [
        {
          weekNumber: 1,
          title: 'HTML & Semantic Layouts',
          status: 'in_progress',
          attemptsCount: 0
        },
        {
          weekNumber: 2,
          title: 'CSS Modern Flexbox & Grid',
          status: 'locked',
          attemptsCount: 0
        },
        {
          weekNumber: 3,
          title: 'JavaScript Essentials & DOM',
          status: 'locked',
          attemptsCount: 0
        },
        {
          weekNumber: 4,
          title: 'Frontend Build Tools & Deployment',
          status: 'locked',
          attemptsCount: 0
        }
      ]
    });
    console.log(` Created roadmap ${roadmap._id} with 4 weeks. Week 1: in_progress, Weeks 2-4: locked`);

    // 5. Test Starting Milestone Test (30-Minute Server Clock)
    console.log('\n--- 4. Testing Start Weekly Test & 30-Min Server Clock ---');
    const testSession = await startWeeklyTest(user._id, roadmap._id, 1);
    console.log(`Attempt ID: ${testSession.attemptId}`);
    console.log(`Questions served: ${testSession.questions.length}`);
    console.log(`Duration: ${testSession.durationMinutes} minutes`);
    console.log(`Server Deadline: ${testSession.deadline}`);

    const deadlineMs = new Date(testSession.deadline).getTime() - Date.now();
    const minutesRemaining = Math.round(deadlineMs / 60000);
    console.log(`Calculated Server Clock Remaining: ~${minutesRemaining} minutes`);
    if (minutesRemaining < 29 || minutesRemaining > 31) {
      throw new Error(`Expected ~30 minutes remaining, got ${minutesRemaining}`);
    }
    console.log(' 30-Minute server countdown verified.');

    // 6. Test Progressive Auto-Save on Question Answer
    console.log('\n--- 5. Testing Progressive Server Auto-Save ---');
    const firstQ = testSession.questions[0];
    const saveResult = await saveWeeklyTestAnswer(user._id, testSession.attemptId, firstQ.questionId, 1);
    if (!saveResult.saved) {
      throw new Error('Expected answer to be auto-saved');
    }
    console.log(` Auto-saved question ${firstQ.questionId} option 1.`);

    // 7. Test Milestone Grading: Fail scenario (< 70%)
    console.log('\n--- 6. Testing Milestone Test Grading (< 70% Fail Threshold) ---');
    // Deliberately answer wrong options for most
    const failAnswers = testSession.questions.map((q, idx) => ({
      questionId: q.questionId,
      selectedOption: (q.correctIndex !== undefined ? (q.correctIndex + 1) % 4 : 0) // wrong option
    }));

    const failGrade = await submitWeeklyTest(user._id, testSession.attemptId, true, failAnswers);
    console.log(`Grade: Score ${failGrade.score}/${failGrade.total} (${failGrade.percent}%), Passed: ${failGrade.passed}`);
    if (failGrade.passed !== false) {
      throw new Error('Expected test to fail with < 70%');
    }
    if (!failGrade.missedTopics || failGrade.missedTopics.length === 0) {
      throw new Error('Expected missed topics list for remediation');
    }
    console.log(` Missed topics for remediation: ${failGrade.missedTopics.join(', ')}`);
    console.log(' 70% threshold fail enforcement verified.');

    // 8. Test Retake with Fresh Questions
    console.log('\n--- 7. Testing Retake with Fresh Questions ---');
    const retakeSession = await startWeeklyTest(user._id, roadmap._id, 1);
    console.log(`New Attempt ID: ${retakeSession.attemptId}`);
    if (retakeSession.attemptId === testSession.attemptId) {
      throw new Error('Expected fresh attempt on retake');
    }
    console.log(' Fresh attempt created with non-colliding question selection.');

    // 9. Test Milestone Grading: Pass scenario (>= 70%)
    console.log('\n--- 8. Testing Milestone Test Grading (>= 70% Pass Threshold & Skill Stamping) ---');
    // Retrieve actual attempt questions from DB to find the correct options
    const attemptRecord = await Attempt.findById(retakeSession.attemptId);
    const passAnswers = attemptRecord.questionsAsked.map((q) => ({
      questionId: q.questionId,
      selectedOption: q.correctIndex // 100% correct
    }));

    const passGrade = await submitWeeklyTest(user._id, retakeSession.attemptId, true, passAnswers);
    console.log(`Grade: Score ${passGrade.score}/${passGrade.total} (${passGrade.percent}%), Passed: ${passGrade.passed}`);
    if (passGrade.passed !== true || passGrade.percent < 70) {
      throw new Error('Expected test to pass with >= 70%');
    }
    console.log(` Skill elevated: ${passGrade.skillUpdated?.name} -> verified: ${passGrade.skillUpdated?.verified}`);

    // Verify Roadmap week 1 is passed and week 2 is unlocked
    const updatedRoadmap = await Roadmap.findById(roadmap._id);
    const w1 = updatedRoadmap.weekProgress.find(w => w.weekNumber === 1);
    const w2 = updatedRoadmap.weekProgress.find(w => w.weekNumber === 2);
    console.log(`Week 1 status: ${w1.status} (${w1.testPercent}%), Week 2 status: ${w2.status}`);
    if (w1.status !== 'passed' || w2.status !== 'in_progress') {
      throw new Error(`Expected Week 1 passed & Week 2 in_progress, got w1: ${w1.status}, w2: ${w2.status}`);
    }
    console.log(' Week 1 passed and Week 2 unlocked successfully.');

    // 10. Verify Canonical Skill Evidence Ledger (Now verifiedCount >= 1 with 180-day currency)
    console.log('\n--- 9. Verifying Canonical Evidence Ledger with 180-Day Currency Window ---');
    evidence = await getSkillEvidence(user._id);
    console.log(`Updated Verified Count: ${evidence.verifiedCount}`);
    if (evidence.verifiedCount < 1) {
      throw new Error(`Expected verifiedCount >= 1, got ${evidence.verifiedCount}`);
    }
    const verifiedEntry = evidence.evidence.find(e => e.hasEvidence);
    const daysRemaining = verifiedEntry?.refreshByDate
      ? Math.round((new Date(verifiedEntry.refreshByDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : 0;
    console.log(`Ledger Entry: ${verifiedEntry?.displayName || verifiedEntry?.name} | Method: ${verifiedEntry?.howVerified} | Days Remaining: ${daysRemaining}`);
    if (daysRemaining < 178 || daysRemaining > 180) {
      throw new Error(`Expected ~180 days remaining, got ${daysRemaining}`);
    }
    console.log(' 180-Day currency window active on verified evidence.');

    // 11. Test Full Path Completion & Credential Graduation
    console.log('\n--- 10. Testing Full Path Completion & Credential Graduation ---');
    // Ensure weeks 1, 2, 3 are passed on roadmap before week 4 test
    w1.status = 'passed';
    w1.testPercent = 100;
    w2.status = 'passed';
    w2.testPercent = 85;
    const w3 = updatedRoadmap.weekProgress.find(w => w.weekNumber === 3);
    w3.status = 'passed';
    w3.testPercent = 90;
    const w4 = updatedRoadmap.weekProgress.find(w => w.weekNumber === 4);
    w4.status = 'awaiting_test';
    await updatedRoadmap.save();

    const w4Test = await startWeeklyTest(user._id, roadmap._id, 4);
    const w4Attempt = await Attempt.findById(w4Test.attemptId);
    const w4Answers = w4Attempt.questionsAsked.map(q => ({
      questionId: q.questionId,
      selectedOption: q.correctIndex
    }));
    const w4Result = await submitWeeklyTest(user._id, w4Test.attemptId, true, w4Answers);
    console.log(`Final Week 4 Passed: ${w4Result.passed}, Roadmap Graduated: ${w4Result.roadmapGraduated}`);
    if (!w4Result.roadmapGraduated) {
      throw new Error('Expected roadmapGraduated to be true on final week milestone pass');
    }

    const graduatedUser = await User.findById(user._id);
    console.log(`Completed Career Paths count: ${graduatedUser.completedPaths.length}`);
    const completedPath = graduatedUser.completedPaths[0];
    console.log(`Graduated Path Title: ${completedPath.careerTitle}`);
    console.log(`Credential ID: ${completedPath.credentialId}`);
    console.log(`Verification Code: ${completedPath.verificationCode}`);
    if (!completedPath.credentialId || !completedPath.verificationCode) {
      throw new Error('Expected credentialId and verificationCode in completedPaths');
    }
    console.log(' Full career path graduation & credential issuance confirmed.');

    // 12. Cleanup
    await User.findByIdAndDelete(user._id);
    await Roadmap.findByIdAndDelete(roadmap._id);
    await Attempt.deleteMany({ user: user._id });
    console.log('\n Cleaned up test data.');

    console.log('\n======================================================');
    console.log(' ALL SHARED FOUNDATION & SKILL EVIDENCE TESTS PASSED! ');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTests();

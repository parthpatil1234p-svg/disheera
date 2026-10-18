/**
 * weekly_milestone_anticheat_test.js
 * 
 * End-to-end automated verification test for Weekly Milestone Strict Anti-Cheat Lockdown:
 * 1. Test initiation (30-minute countdown clock, 10 curated questions)
 * 2. Strike 1 focus loss violation (-120s penalty deducted from server deadline)
 * 3. Strike 2 focus loss violation (-180s penalty deducted from server deadline, total -300s)
 * 4. Strike 3 immediate termination & disqualification (0% score, disqualified_cheating status)
 * 5. 24-hour retake lockout enforcement (HTTP 403 COOLDOWN_ACTIVE on restart attempt)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const { prisma } = require('../config/prisma');
const User = require('../models/User');
const Career = require('../models/Career');
const Roadmap = require('../models/Roadmap');
const Attempt = require('../models/Attempt');
const {
  startWeeklyTest,
  recordWeeklyTestViolation,
  disqualifyWeeklyTest
} = require('../services/weeklyTestService');

async function runAntiCheatLockdownTest() {
  console.log('================================================================');
  console.log('🧪 RUNNING: Weekly Milestone Strict Anti-Cheat Lockdown Test');
  console.log('================================================================\n');

  await connectDB();
  console.log('✓ Connected to Supabase PostgreSQL (0% MongoDB)');

  const testEmail = 'anticheat_test_student@example.com';
  let user = null;
  let roadmap = null;

  try {
    // 1. Setup test user
    user = await User.findOne({ email: testEmail });
    if (!user) {
      user = await User.create({
        name: 'Anti-Cheat Test Student',
        email: testEmail,
        password: 'Password123!',
        role: 'student',
        isSkillVerified: true,
        skills: [{ name: 'JavaScript', proficiency: 'beginner', verified: true }]
      });
    }
    console.log(`✓ Test user verified: ${user._id} (${user.email})`);

    // 2. Setup test career
    let career = await Career.findOne();
    if (!career) {
      career = await Career.create({
        title: 'Full Stack Engineer',
        slug: 'full-stack-engineer',
        category: 'development',
        shortDescription: 'Build full stack web apps',
        longDescription: 'Build full stack web applications end-to-end',
        active: true
      });
    }

    // 3. Setup test roadmap
    roadmap = await Roadmap.findOne({ user: user._id, status: 'active' });
    if (!roadmap) {
      roadmap = await Roadmap.create({
        user: user._id,
        career: career._id,
        careerSnapshot: {
          title: career.title,
          slug: career.slug,
          shortDescription: career.shortDescription || 'Full stack engineering'
        },
        durationWeeks: 4,
        status: 'active',
        weekProgress: [
          {
            weekNumber: 1,
            title: 'Week 1 Milestone: Web Foundations',
            status: 'awaiting_test',
            attemptsCount: 0,
            cooldownUntil: null
          },
          {
            weekNumber: 2,
            title: 'Week 2 Milestone: Backend & APIs',
            status: 'locked',
            attemptsCount: 0,
            cooldownUntil: null
          }
        ]
      });
    } else {
      // Reset week 1 state for clean test run
      roadmap.weekProgress[0].status = 'awaiting_test';
      roadmap.weekProgress[0].cooldownUntil = null;
      roadmap.weekProgress[0].attemptsCount = 0;
      await roadmap.save();
    }
    console.log(`✓ Active test roadmap verified: ${roadmap._id}`);

    // Clean up any stale in-progress attempts for this user/week
    await Attempt.deleteMany({ user: user._id, roadmap: roadmap._id, roadmapWeek: 1 });

    // ========================================================================
    // Step 1: Start 30-Minute Milestone Test
    // ========================================================================
    console.log('\n--- Step 1: Initiating Week 1 Milestone Test ---');
    const startResult = await startWeeklyTest(user._id, roadmap._id, 1);

    if (!startResult || !startResult.attemptId) {
      throw new Error('Failed to initiate weekly milestone test: attemptId missing');
    }
    console.log(`✓ Test session started: Attempt ${startResult.attemptId}`);
    console.log(`  Duration: ${startResult.durationMinutes} minutes`);
    console.log(`  Questions curated: ${startResult.questions.length}`);
    console.log(`  Initial Deadline: ${new Date(startResult.deadline).toISOString()}`);

    if (startResult.durationMinutes !== 30) {
      throw new Error(`Expected 30-minute duration, got ${startResult.durationMinutes}`);
    }
    if (startResult.questions.length !== 10) {
      throw new Error(`Expected 10 questions, got ${startResult.questions.length}`);
    }

    const initialDeadlineMs = new Date(startResult.deadline).getTime();

    // ========================================================================
    // Step 2: Strike 1 Violation (-120s penalty)
    // ========================================================================
    console.log('\n--- Step 2: Triggering Strike 1 (Tab switch / blur) ---');
    const strike1Result = await recordWeeklyTestViolation(
      user._id,
      startResult.attemptId,
      'tab_switch',
      120,
      'User switched away from assessment tab to inspect external source'
    );

    console.log(`✓ Strike 1 recorded: Strikes count = ${strike1Result.strikesCount}`);
    console.log(`  Penalty applied: -${strike1Result.penaltySeconds}s (-2:00)`);
    console.log(`  New Deadline: ${new Date(strike1Result.deadline).toISOString()}`);

    if (strike1Result.strikesCount !== 1) {
      throw new Error(`Expected strikesCount = 1, got ${strike1Result.strikesCount}`);
    }

    const postStrike1DeadlineMs = new Date(strike1Result.deadline).getTime();
    const deductedS1 = Math.round((initialDeadlineMs - postStrike1DeadlineMs) / 1000);
    console.log(`  Verified server time reduction: ${deductedS1} seconds`);
    if (deductedS1 !== 120) {
      throw new Error(`Expected 120s deduction, got ${deductedS1}s`);
    }

    // ========================================================================
    // Step 3: Strike 2 Violation (-180s penalty, total -300s)
    // ========================================================================
    console.log('\n--- Step 3: Triggering Strike 2 (DevTools / Copy-Paste attempt) ---');
    const strike2Result = await recordWeeklyTestViolation(
      user._id,
      startResult.attemptId,
      'devtools_opened',
      180,
      'Developer Tools / Console window opened during active test'
    );

    console.log(`✓ Strike 2 recorded: Strikes count = ${strike2Result.strikesCount}`);
    console.log(`  Penalty applied: -${strike2Result.penaltySeconds}s (-3:00)`);
    console.log(`  New Deadline: ${new Date(strike2Result.deadline).toISOString()}`);

    if (strike2Result.strikesCount !== 2) {
      throw new Error(`Expected strikesCount = 2, got ${strike2Result.strikesCount}`);
    }

    const postStrike2DeadlineMs = new Date(strike2Result.deadline).getTime();
    const totalDeducted = Math.round((initialDeadlineMs - postStrike2DeadlineMs) / 1000);
    console.log(`  Cumulative verified server time reduction: ${totalDeducted} seconds (-5:00)`);
    if (totalDeducted !== 300) {
      throw new Error(`Expected 300s cumulative deduction, got ${totalDeducted}s`);
    }

    // ========================================================================
    // Step 4: Strike 3 Disqualification & Immediate Termination
    // ========================================================================
    console.log('\n--- Step 4: Triggering Strike 3 (Disqualification & 0% Score) ---');
    const disqualifyResult = await disqualifyWeeklyTest(
      user._id,
      startResult.attemptId,
      'Exceeded 3 focus loss proctoring violations'
    );

    console.log(`✓ Disqualification processed:`);
    console.log(`  Status: ${disqualifyResult.status}`);
    console.log(`  Score: ${disqualifyResult.score}% (Passed: ${disqualifyResult.passed})`);
    console.log(`  Cooldown duration: ${disqualifyResult.cooldownHours} hours`);
    console.log(`  Cooldown expires at: ${new Date(disqualifyResult.cooldownUntil).toISOString()}`);

    if (disqualifyResult.status !== 'disqualified_cheating') {
      throw new Error(`Expected status 'disqualified_cheating', got ${disqualifyResult.status}`);
    }
    if (disqualifyResult.score !== 0 || disqualifyResult.passed !== false) {
      throw new Error(`Expected score 0 and passed false`);
    }

    // Verify roadmap week progress was locked in MongoDB
    const updatedRoadmap = await Roadmap.findById(roadmap._id);
    const week1Wp = updatedRoadmap.weekProgress.find((w) => w.weekNumber === 1);
    if (!week1Wp.cooldownUntil || new Date(week1Wp.cooldownUntil).getTime() <= Date.now()) {
      throw new Error('Roadmap weekProgress.cooldownUntil was not set properly in DB');
    }
    console.log(`✓ MongoDB verification: Roadmap Week 1 cooldownUntil = ${week1Wp.cooldownUntil.toISOString()}`);

    // ========================================================================
    // Step 5: Verify 24-Hour Cooldown Enforced on Retake Attempt
    // ========================================================================
    console.log('\n--- Step 5: Verifying 24-Hour Retake Lockout (HTTP 403) ---');
    let lockoutTriggered = false;
    try {
      await startWeeklyTest(user._id, roadmap._id, 1);
    } catch (lockoutErr) {
      if (lockoutErr.code === 'COOLDOWN_ACTIVE' && lockoutErr.statusCode === 403) {
        lockoutTriggered = true;
        console.log(`✓ Retake rejected as expected with HTTP 403 COOLDOWN_ACTIVE`);
        console.log(`  Error Message: "${lockoutErr.message}"`);
        console.log(`  Cooldown active until: ${lockoutErr.cooldownUntil}`);
      } else {
        throw lockoutErr;
      }
    }

    if (!lockoutTriggered) {
      throw new Error('CRITICAL VULNERABILITY: Test retake was NOT blocked during active 24h cooldown!');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 5 ANTI-CHEAT LOCKDOWN TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    console.log('🧹 [Cleanup in finally] Purging anticheat test user, roadmaps, and attempts...');
    try {
      if (user?._id) {
        await Attempt.deleteMany({ user: user._id }).catch(() => {});
        await Roadmap.deleteMany({ user: user._id }).catch(() => {});
        await User.deleteOne({ _id: user._id }).catch(() => {});
      }
      await User.deleteOne({ email: testEmail }).catch(() => {});
      console.log('  ✓ Cleaned up anticheat test user and records.');
    } catch (cleanupErr) {
      console.warn('  ⚠️ Cleanup warning:', cleanupErr.message);
    }
    await prisma.$disconnect().catch(() => {});
    console.log('Database connection closed.');
  }
}

runAntiCheatLockdownTest();

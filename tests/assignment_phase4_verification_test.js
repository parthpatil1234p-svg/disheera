/**
 * tests/assignment_phase4_verification_test.js — Plan 46 Phase 4 Automated Verification Suite
 *
 * Verifies:
 * 1. Cumulative Merit Score (CMS) 4D Formula Weightage:
 *    CMS = (Assignments * 0.40) + (Quizzes * 0.30) + (Progress * 0.20) + (Consistency * 0.10)
 * 2. Dynamic Rank Assignment (1st to Nth) and Topper Crests (Gold #1, Silver #2, Bronze #3, Top 10)
 * 3. Partner Tech Internship Rewards seeding & student eligibility evaluation
 * 4. Leaderboard Controller & Route Endpoints:
 *    - GET /api/leaderboard (public & authenticated)
 *    - GET /api/leaderboard/rewards (with eligibility crest mapping)
 *    - GET /api/leaderboard/my-standing (student breakdown & rewards)
 *    - POST /api/leaderboard/recalculate (global recalculation)
 * 5. Client Modules syntax & presence (assignmentModal.js, leaderboardView.js)
 *
 * Disheera · Enterprise Test Suite (Plan 46 Phase 4)
 */

const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const fs = require('fs');
const { prisma } = require('../server/config/prisma');
const leaderboardService = require('../server/services/leaderboardService');
const leaderboardController = require('../server/controllers/leaderboardController');

// Mock Express Response
function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, val) {
      this.headers[key.toLowerCase()] = val;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

let testPassed = 0;
let testFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testFailed++;
  }
}

async function runPhase4Verification() {
  console.log('================================================================');
  console.log('🚀 Plan 46 Phase 4: Cumulative Merit Score & Dynamic Leaderboard Suite');
  console.log('================================================================\n');

  try {
    // -----------------------------------------------------------------
    // Section 1: Client Modules Integrity & Syntax Validation
    // -----------------------------------------------------------------
    console.log('--- Section 1: Client Modules Files & Structure ---');
    const assignmentModalPath = path.join(__dirname, '../client/js/modules/assignmentModal.js');
    const leaderboardViewPath = path.join(__dirname, '../client/js/modules/leaderboardView.js');

    assert(fs.existsSync(assignmentModalPath), 'client/js/modules/assignmentModal.js exists');
    assert(fs.existsSync(leaderboardViewPath), 'client/js/modules/leaderboardView.js exists');

    const modalContent = fs.readFileSync(assignmentModalPath, 'utf8');
    assert(modalContent.includes('weeklyAssignmentModal'), 'assignmentModal.js contains weeklyAssignmentModal definition');
    assert(modalContent.includes('window.assignmentModal'), 'assignmentModal.js exports window.assignmentModal');
    assert(modalContent.includes('downloadCoverTemplate'), 'assignmentModal.js implements cover download pipeline');
    assert(modalContent.includes('submitAssignmentPdf'), 'assignmentModal.js implements PDF submit handler');

    const lbContent = fs.readFileSync(leaderboardViewPath, 'utf8');
    assert(lbContent.includes('leaderboardModal'), 'leaderboardView.js contains leaderboardModal definition');
    assert(lbContent.includes('window.leaderboardView'), 'leaderboardView.js exports window.leaderboardView');
    assert(lbContent.includes('renderPodium'), 'leaderboardView.js implements Top 3 Podium renderer');
    assert(lbContent.includes('renderRewards'), 'leaderboardView.js implements partner tech internship grid');

    // -----------------------------------------------------------------
    // Section 2: Partner Tech Internship Rewards Seeding
    // -----------------------------------------------------------------
    console.log('\n--- Section 2: Partner Tech Internship Rewards Seeding ---');
    await leaderboardService.seedInternshipRewards();

    const rewards = await prisma.internshipReward.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    assert(rewards.length >= 6, `At least 6 partner internship rewards seeded (Found: ${rewards.length})`);
    
    const companyNames = rewards.map(r => r.companyName);
    assert(companyNames.some(c => c.includes('Razorpay')), 'Razorpay Software internship present');
    assert(companyNames.some(c => c.includes('CRED')), 'CRED Technologies distributed systems internship present');
    assert(companyNames.some(c => c.includes('Postman')), 'Postman API developer internship present');
    assert(companyNames.some(c => c.includes('Swiggy')), 'Swiggy Cloud & DevOps internship present');
    assert(companyNames.some(c => c.includes('Zerodha')), 'Zerodha fintech internship present');
    assert(companyNames.some(c => c.includes('Zomato')), 'Zomato mobile & frontend internship present');

    const goldReward = rewards.find(r => r.eligibilityCrest === 'GOLD');
    assert(Boolean(goldReward), 'Gold Crest reward identified');

    // -----------------------------------------------------------------
    // Section 3: Cumulative Merit Score (CMS) Math & Engine
    // -----------------------------------------------------------------
    console.log('\n--- Section 3: CMS Calculation Engine ---');

    // Find or create test student
    let student = await prisma.user.findFirst({
      where: { role: 'student', email: 'kajimew275@blobapps.com' }
    });

    if (!student) {
      student = await prisma.user.findFirst({ where: { role: 'student' } });
    }

    assert(Boolean(student), `Found active student for testing CMS: ${student?.email}`);

    const meritScore = await leaderboardService.calculateMeritScoreForStudent(student.id);
    assert(Boolean(meritScore), 'StudentMeritScore record created/updated');
    assert(typeof meritScore.totalMeritScore === 'number', `totalMeritScore is a valid number: ${meritScore.totalMeritScore}`);
    assert(meritScore.totalMeritScore >= 0 && meritScore.totalMeritScore <= 100, 'totalMeritScore is bounded in [0, 100]');

    // Formula verification: CMS = (A * 0.4) + (Q * 0.3) + (P * 0.2) + (C * 0.1)
    const expectedCms = +(
      (meritScore.assignmentMarks * 0.40) +
      (meritScore.quizMarks * 0.30) +
      (meritScore.progressMarks * 0.20) +
      (meritScore.consistencyMarks * 0.10)
    ).toFixed(1);

    assert(
      Math.abs(meritScore.totalMeritScore - expectedCms) < 0.2,
      `CMS strictly matches 4D weighted formula (${meritScore.totalMeritScore} vs expected ${expectedCms})`
    );

    // -----------------------------------------------------------------
    // Section 4: Global Leaderboard & Dynamic Ranking
    // -----------------------------------------------------------------
    console.log('\n--- Section 4: Global Leaderboard & Dynamic Ranking ---');

    const processedStudents = await leaderboardService.recalculateGlobalLeaderboard();
    assert(processedStudents >= 1, `Global leaderboard recalculated (${processedStudents} students ranked)`);

    const leaderboardData = await leaderboardService.getLeaderboardData({
      currentUserId: student.id,
      limit: 20
    });

    assert(leaderboardData.success === true, 'getLeaderboardData returns success');
    assert(Array.isArray(leaderboardData.rankings), 'rankings is an array');
    assert(Array.isArray(leaderboardData.top3), 'top3 podium is an array');
    assert(leaderboardData.top3.length <= 3, `top3 podium contains at most 3 toppers (${leaderboardData.top3.length})`);

    // Verify ordering
    let isSorted = true;
    for (let i = 1; i < leaderboardData.rankings.length; i++) {
      if (leaderboardData.rankings[i].totalMeritScore > leaderboardData.rankings[i - 1].totalMeritScore) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Rankings are strictly ordered by totalMeritScore descending');

    // Verify podium designations
    if (leaderboardData.top3.length > 0) {
      const top1 = leaderboardData.top3[0];
      assert(top1.rank === 1, 'Top 1 is rank 1');
      if (top1.totalMeritScore > 0) {
        assert(top1.topperBadge === 'GOLD', 'Rank 1 receives GOLD topper badge');
      }
    }
    if (leaderboardData.top3.length > 1) {
      const top2 = leaderboardData.top3[1];
      assert(top2.rank === 2, 'Top 2 is rank 2');
      if (top2.totalMeritScore > 0) {
        assert(top2.topperBadge === 'SILVER', 'Rank 2 receives SILVER topper badge');
      }
    }
    if (leaderboardData.top3.length > 2) {
      const top3 = leaderboardData.top3[2];
      assert(top3.rank === 3, 'Top 3 is rank 3');
      if (top3.totalMeritScore > 0) {
        assert(top3.topperBadge === 'BRONZE', 'Rank 3 receives BRONZE topper badge');
      }
    }

    // Current user context
    assert(Boolean(leaderboardData.currentUser), 'currentUser standing present in payload');
    assert(leaderboardData.currentUser.studentId === student.id, 'currentUser matches requested student ID');

    // -----------------------------------------------------------------
    // Section 5: Leaderboard Controller Endpoints
    // -----------------------------------------------------------------
    console.log('\n--- Section 5: Leaderboard Controller Endpoints ---');

    // 5.1 GET /api/leaderboard (Public)
    {
      const req = { query: { limit: '10' }, user: null };
      const res = createMockRes();
      await leaderboardController.getLeaderboard(req, res);

      assert(res.statusCode === 200, 'GET /api/leaderboard returns HTTP 200');
      assert(res.body.success === true, 'GET /api/leaderboard body.success is true');
      assert(res.body.rankings.length <= 10, 'Limit query parameter honored');
    }

    // 5.2 GET /api/leaderboard/rewards
    {
      const req = { user: { id: student.id } };
      const res = createMockRes();
      await leaderboardController.getInternshipRewards(req, res);

      assert(res.statusCode === 200, 'GET /api/leaderboard/rewards returns HTTP 200');
      assert(res.body.success === true, 'GET /api/leaderboard/rewards body.success is true');
      assert(res.body.rewards.length >= 6, 'Rewards array contains all opportunities');
      assert(typeof res.body.rewards[0].isEligible === 'boolean', 'Each reward includes isEligible boolean');
    }

    // 5.3 GET /api/leaderboard/my-standing (Authenticated)
    {
      const req = { user: { id: student.id } };
      const res = createMockRes();
      await leaderboardController.getMyMeritStanding(req, res);

      assert(res.statusCode === 200, 'GET /api/leaderboard/my-standing returns HTTP 200');
      assert(res.body.success === true, 'GET /api/leaderboard/my-standing body.success is true');
      assert(Boolean(res.body.standing), 'Standing object returned');
      assert(Boolean(res.body.standing.breakdown.assignments), 'Assignments breakdown present');
      assert(Boolean(res.body.standing.breakdown.quizzes), 'Quizzes breakdown present');
      assert(Boolean(res.body.standing.breakdown.roadmapProgress), 'Progress breakdown present');
      assert(Boolean(res.body.standing.breakdown.consistency), 'Consistency breakdown present');
      assert(res.body.standing.breakdown.assignments.weightage === '40%', 'Assignments weight is 40%');
      assert(res.body.standing.breakdown.quizzes.weightage === '30%', 'Quizzes weight is 30%');
      assert(res.body.standing.breakdown.roadmapProgress.weightage === '20%', 'Progress weight is 20%');
      assert(res.body.standing.breakdown.consistency.weightage === '10%', 'Consistency weight is 10%');
    }

    // 5.4 GET /api/leaderboard/my-standing (Unauthenticated Guard)
    {
      const req = { user: null };
      const res = createMockRes();
      await leaderboardController.getMyMeritStanding(req, res);

      assert(res.statusCode === 401, 'GET /api/leaderboard/my-standing without user returns HTTP 401');
      assert(res.body.success === false, 'Unauthenticated response success is false');
    }

    // 5.5 POST /api/leaderboard/recalculate
    {
      const req = { user: { id: student.id, role: 'admin' } };
      const res = createMockRes();
      await leaderboardController.recalculateLeaderboard(req, res);

      assert(res.statusCode === 200, 'POST /api/leaderboard/recalculate returns HTTP 200');
      assert(res.body.success === true, 'POST /api/leaderboard/recalculate body.success is true');
      assert(typeof res.body.studentsProcessed === 'number', 'studentsProcessed count returned');
    }

    // -----------------------------------------------------------------
    // Section 6: End-to-End Summary
    // -----------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`Phase 4 Verification Suite Finished: ${testPassed} Passed, ${testFailed} Failed`);
    console.log('================================================================');

    if (testFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal unhandled error during Phase 4 verification:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Verification();

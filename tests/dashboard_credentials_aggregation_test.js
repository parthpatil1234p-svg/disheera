/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/dashboard_credentials_aggregation_test.js
 *
 * Automated regression test: verifies that completed roadmaps automatically
 * populate as verified Graduation Credentials on the dashboard alongside active roadmaps,
 * and upcoming tasks are served without "All tasks completed" false alarms.
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const { prisma } = require('../server/config/prisma');
const User = require('../server/models/User');
const Career = require('../server/models/Career');
const Roadmap = require('../server/models/Roadmap');
const RoadmapTask = require('../server/models/RoadmapTask');
const dashboardController = require('../server/controllers/dashboardController');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
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
  console.log('🧪 Starting Dashboard Credentials & Active Roadmaps Aggregation Test...\n');

  const testUserId = `test_dash_${Date.now().toString(16)}`;
  const testEmail = `test_dash_${Date.now()}@example.com`;
  const activeRoadmapId = `act_${Date.now().toString(16)}`;
  const completedRoadmapId = `comp_${Date.now().toString(16)}`;

  try {
    // 1. Create a test student user with EMPTY completedPaths
    console.log('Step 1: Creating test user with empty completedPaths...');
    const user = new User({
      id: testUserId,
      name: 'Graduation Test Scholar',
      email: testEmail,
      role: 'student',
      profileCompleted: true,
      hasCompletedSkillVerification: true,
      education: { course: 'B.Tech', branch: 'Computer Science', year: 'Final Year', college: 'Tech University' },
      interests: ['mobile development', 'full stack'],
      skills: [
        { name: 'flutter', displayName: 'Flutter', proficiency: 'advanced', isQuizVerified: true },
        { name: 'react', displayName: 'React', proficiency: 'intermediate', isQuizVerified: true }
      ],
      completedPaths: [] // Deliberately empty to test auto-aggregation & self-healing
    });
    await user.save();
    console.log('✓ User created with 0 completedPaths:', testUserId);

    // Fetch careers
    let mobileCareer = await Career.findOne({ slug: 'mobile-app-developer' });
    if (!mobileCareer) mobileCareer = await Career.findOne({ active: true });
    let frontCareer = await Career.findOne({ slug: 'front-end-developer' });
    if (!frontCareer) frontCareer = mobileCareer;

    // 2. Create a COMPLETED roadmap with 100% progress
    console.log('Step 2: Creating completed roadmap record...');
    const completedRoadmap = await Roadmap.create({
      id: completedRoadmapId,
      user: testUserId,
      career: mobileCareer._id,
      status: 'completed',
      durationWeeks: 4,
      totalTasks: 4,
      completedTasks: 4,
      progressPercentage: 100,
      startedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      completedAt: new Date(),
      careerSnapshot: {
        slug: mobileCareer.slug || 'mobile-app-developer',
        title: mobileCareer.title || 'Mobile App Developer',
        shortDescription: 'Build native and cross-platform mobile apps',
        requiredSkills: ['flutter', 'dart', 'firebase']
      }
    });

    // Create completed tasks with skillName
    for (let i = 1; i <= 4; i++) {
      await RoadmapTask.create({
        id: `c_task_${i}_${Date.now().toString(16)}`,
        roadmap: completedRoadmap._id,
        title: `Mobile Task ${i}`,
        description: `Learn mobile development module ${i}`,
        weekNumber: i,
        order: 1,
        skillName: i % 2 === 0 ? 'flutter' : 'dart',
        completed: true,
        completedAt: new Date()
      });
    }
    console.log('✓ Completed roadmap and 4 tasks saved');

    // 3. Create an ACTIVE roadmap with pending tasks
    console.log('Step 3: Creating active roadmap with pending tasks...');
    const activeRoadmap = await Roadmap.create({
      id: activeRoadmapId,
      user: testUserId,
      career: frontCareer._id,
      status: 'active',
      durationWeeks: 4,
      totalTasks: 4,
      completedTasks: 0,
      progressPercentage: 0,
      startedAt: new Date(),
      careerSnapshot: {
        slug: frontCareer.slug || 'front-end-developer',
        title: frontCareer.title || 'Front-End Developer',
        shortDescription: 'Build accessible, responsive web applications'
      }
    });

    for (let i = 1; i <= 4; i++) {
      await RoadmapTask.create({
        id: `a_task_${i}_${Date.now().toString(16)}`,
        roadmap: activeRoadmap._id,
        title: `Front-End Task ${i}`,
        description: `Learn front-end module ${i}`,
        weekNumber: i,
        order: 1,
        skillName: 'react',
        completed: false
      });
    }
    console.log('✓ Active roadmap and 4 tasks saved');

    // 4. Invalidate cache and call getDashboard
    console.log('Step 4: Calling dashboardController.getDashboard...');
    dashboardController.invalidateDashboardCache(testUserId);

    const req = {
      user: { _id: testUserId, id: testUserId, role: 'student' },
      query: {}
    };
    const res = createMockRes();
    await dashboardController.getDashboard(req, res, (err) => {
      if (err) throw err;
    });

    assert.strictEqual(res.statusCode, 200, 'Dashboard endpoint should respond with 200');
    assert.strictEqual(res.body?.success, true, 'Response must have success: true');

    const data = res.body?.data;
    assert.ok(data, 'Dashboard data must exist');

    // 5. Assert that completedPaths contains the completed roadmap credential
    console.log('Step 5: Verifying completed credentials aggregation...');
    assert.ok(Array.isArray(data.user?.completedPaths), 'user.completedPaths must be an array');
    assert.strictEqual(data.user.completedPaths.length, 1, 'Should have exactly 1 completed path aggregated');

    const cred = data.user.completedPaths[0];
    assert.strictEqual(cred.role, 'Mobile App Developer', 'Role must match completed roadmap');
    assert.strictEqual(cred.status, 'graduated', 'Status must be graduated');
    assert.ok(cred.credentialId, 'Credential ID must be generated');
    assert.ok(cred.verificationCode, 'Verification code must be generated');
    assert.ok(Array.isArray(cred.skillsGained) && cred.skillsGained.length > 0, 'skillsGained must be populated');
    console.log('✓ Verified credential generated:', {
      role: cred.role,
      credentialId: cred.credentialId,
      skillsGained: cred.skillsGained
    });

    // 6. Assert that activeRoadmap and upcomingTasks are present
    console.log('Step 6: Verifying active roadmap & upcoming tasks coexistence...');
    assert.strictEqual(data.activeRoadmap?.career?.title, 'Front-End Developer', 'Active roadmap must be Front-End Developer');
    assert.ok(Array.isArray(data.upcomingTasks), 'upcomingTasks must be an array');
    assert.strictEqual(data.upcomingTasks.length > 0, true, 'upcomingTasks must NOT be empty');
    assert.strictEqual(data.upcomingTasks[0].title, 'Front-End Task 1', 'First upcoming task must match');
    assert.ok(data.nextAction?.actionUrl === 'roadmap.html', 'Next action URL should guide to roadmap.html');
    console.log('✓ Active roadmap and upcoming tasks correctly resolved');

    // 7. Verify DB persistence sync
    console.log('Step 7: Verifying user.completedPaths was synced to database...');
    const updatedUser = await User.findById(testUserId).lean();
    assert.strictEqual(updatedUser.completedPaths?.length, 1, 'Database user record must now have completedPaths persisted');
    console.log('✓ Completed path safely persisted in DB');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! (100% Verified)');
  } finally {
    // Cleanup test data
    console.log('Cleaning up test records...');
    await RoadmapTask.deleteMany({ roadmap: { $in: [activeRoadmapId, completedRoadmapId] } }).catch(() => {});
    await Roadmap.deleteMany({ _id: { $in: [activeRoadmapId, completedRoadmapId] } }).catch(() => {});
    await User.deleteOne({ _id: testUserId }).catch(() => {});
    dashboardController.invalidateDashboardCache(testUserId);
    console.log('✓ Test cleanup complete.');
  }
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/roadmap_tasks_persistence_test.js
 *
 * Automated regression test: verifies that active roadmaps always contain
 * and self-heal tasks, preventing empty "0 of 0 tasks finished" states.
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const { prisma } = require('../server/config/prisma');
const User = require('../server/models/User');
const Career = require('../server/models/Career');
const Roadmap = require('../server/models/Roadmap');
const RoadmapTask = require('../server/models/RoadmapTask');
const roadmapController = require('../server/controllers/roadmapController');

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
  console.log('🧪 Starting Roadmap Tasks Persistence & Self-Healing Test...\n');

  const testUserId = `test_u_${Date.now().toString(16)}`;
  const testEmail = `test_roadmap_${Date.now()}@example.com`;

  let roadmap = null;

  try {
    // 1. Create a test student user
    console.log('Step 1: Creating test user...');
    const user = new User({
      id: testUserId,
      name: 'Roadmap Test Student',
      email: testEmail,
      role: 'student',
      profileCompleted: true,
      hasCompletedSkillVerification: true,
      education: { course: 'BCA', branch: 'CS', year: 'Third Year', college: 'Demo' },
      interests: ['web development', 'problem solving'],
      skills: [
        { name: 'javascript', displayName: 'JavaScript', proficiency: 'intermediate', isQuizVerified: true },
        { name: 'react', displayName: 'React', proficiency: 'intermediate', isQuizVerified: true }
      ]
    });
    await user.save();
    console.log('✓ User created:', testUserId);

    // 2. Fetch or create a test career
    let career = await Career.findOne({ slug: 'front-end-developer' })
      .populate({ path: 'requiredSkills.skill', select: 'name displayName category description' });
    if (!career) {
      career = await Career.findOne({ active: true })
        .populate({ path: 'requiredSkills.skill', select: 'name displayName category description' });
    }
    assert.ok(career, 'At least one active career must exist');

    // 3. Create an active roadmap with intentionally 0 tasks (simulating the bug/desync)
    console.log('\nStep 2: Creating an active roadmap with 0 tasks (simulating empty state)...');
    roadmap = await Roadmap.create({
      user: testUserId,
      career: career._id,
      careerSnapshot: {
        title: career.title,
        slug: career.slug,
        shortDescription: career.shortDescription || 'Front-End Development Track'
      },
      durationWeeks: 4,
      status: 'active',
      totalTasks: 0,
      completedTasks: 0,
      progressPercentage: 0,
      startedAt: new Date()
    });

    const initialTasksCount = await RoadmapTask.countDocuments({ roadmap: roadmap._id });
    assert.strictEqual(initialTasksCount, 0, 'Roadmap starts with 0 tasks');
    console.log('✓ Verified roadmap starts with 0 tasks');
    // 4. Call getCurrentRoadmap (GET /api/roadmaps/current)
    console.log('\nStep 3: Calling getCurrentRoadmap to trigger self-healing...');
    const mockReq = {
      user: { _id: testUserId, id: testUserId },
      query: {}
    };
    const mockRes = createMockRes();

    await roadmapController.getCurrentRoadmap(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    assert.strictEqual(mockRes.statusCode, 200, 'getCurrentRoadmap must return HTTP 200');
    assert.strictEqual(mockRes.body.success, true, 'getCurrentRoadmap must return success: true');

    const responseData = mockRes.body.data;
    assert.ok(responseData.hasRoadmap, 'hasRoadmap must be true');
    assert.ok(Array.isArray(responseData.tasks), 'tasks must be an array');
    assert.ok(responseData.tasks.length > 0, `tasks must be populated (received ${responseData.tasks.length} tasks)`);
    assert.ok(Array.isArray(responseData.weeks), 'weeks must be an array');
    assert.strictEqual(responseData.weeks.length, 4, 'weeks count must match durationWeeks (4)');

    // Ensure every week has tasks
    responseData.weeks.forEach(w => {
      assert.ok(w.tasks.length > 0, `Week ${w.weekNumber} must have tasks, got 0`);
      console.log(`  ✓ Week ${w.weekNumber} has ${w.tasks.length} tasks`);
    });

    // 5. Verify tasks are now permanently saved in DB
    console.log('\nStep 4: Verifying tasks are now permanently stored in DB...');
    const dbTasksCount = await RoadmapTask.countDocuments({ roadmap: roadmap._id });
    assert.strictEqual(dbTasksCount, responseData.tasks.length, 'Database tasks count must match response tasks');
    console.log(`✓ Confirmed ${dbTasksCount} tasks are permanently persisted in Supabase PostgreSQL!`);

    console.log('\n🎉 ALL ROADMAP TASKS PERSISTENCE TESTS PASSED 100%!');
  } finally {
    // Cleanup
    console.log('\nCleaning up test data...');
    if (roadmap?._id) {
      await RoadmapTask.deleteMany({ roadmap: roadmap._id }).catch(() => {});
      await Roadmap.findByIdAndDelete(roadmap._id).catch(() => {});
    }
    await User.findByIdAndDelete(testUserId).catch(() => {});
    console.log('✓ Cleanup complete.');
  }
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });

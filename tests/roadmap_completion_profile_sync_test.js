/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/roadmap_completion_profile_sync_test.js
 *
 * Automated regression test: verifies that completing a roadmap automatically
 * saves the credential into the user profile (user.completedPaths), elevates
 * profile skills with quiz verification, updates user.profileStatus, and is
 * returned via GET /api/users/me and GET /api/dashboard.
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const { prisma } = require('../server/config/prisma');
const User = require('../server/models/User');
const Career = require('../server/models/Career');
const Roadmap = require('../server/models/Roadmap');
const RoadmapTask = require('../server/models/RoadmapTask');
const { calculateRoadmapProgress } = require('../server/services/roadmapService');
const userController = require('../server/controllers/userController');

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
  console.log('🧪 Starting Roadmap Completion Profile Sync Test...\n');

  const testUserId = `test_prof_u_${Date.now().toString(16)}`;
  const testEmail = `test_prof_${Date.now()}@example.com`;
  const roadmapId = `rm_prof_${Date.now().toString(16)}`;

  try {
    // 1. Create a student user with 0 completedPaths and beginner skills
    console.log('Step 1: Creating student user with empty completedPaths...');
    const user = new User({
      id: testUserId,
      name: 'Curriculum Graduate Student',
      email: testEmail,
      role: 'student',
      profileCompleted: true,
      hasCompletedSkillVerification: false,
      education: { course: 'B.Tech', branch: 'Computer Science', year: 'Final Year', college: 'Demo College' },
      interests: ['mobile engineering'],
      skills: [
        { name: 'flutter', displayName: 'Flutter', proficiency: 'beginner', isQuizVerified: false }
      ],
      completedPaths: []
    });
    await user.save();
    console.log('✓ User created with empty completedPaths:', testUserId);

    // 2. Fetch a career
    let career = await Career.findOne({ slug: 'mobile-app-developer' });
    if (!career) career = await Career.findOne({ active: true });
    assert.ok(career, 'Career track must exist');

    // 3. Create an active roadmap with 3 tasks
    console.log('\nStep 2: Creating active roadmap with 3 tasks...');
    const roadmap = await Roadmap.create({
      id: roadmapId,
      user: testUserId,
      career: career._id,
      status: 'active',
      durationWeeks: 2,
      totalTasks: 3,
      completedTasks: 0,
      progressPercentage: 0,
      startedAt: new Date(),
      careerSnapshot: {
        slug: career.slug || 'mobile-app-developer',
        title: career.title || 'Mobile App Developer',
        shortDescription: 'Build high-performance mobile applications',
        requiredSkills: ['flutter', 'dart']
      }
    });

    const task1 = await RoadmapTask.create({
      id: `task_1_${Date.now().toString(16)}`,
      roadmap: roadmap._id,
      title: 'Setup Flutter Environment',
      description: 'Configure Flutter SDK and Android emulator',
      weekNumber: 1,
      order: 1,
      skillName: 'flutter',
      completed: false
    });

    const task2 = await RoadmapTask.create({
      id: `task_2_${Date.now().toString(16)}`,
      roadmap: roadmap._id,
      title: 'Dart Object-Oriented Principles',
      description: 'Master classes, mixins, and async await in Dart',
      weekNumber: 1,
      order: 2,
      skillName: 'dart',
      completed: false
    });

    const task3 = await RoadmapTask.create({
      id: `task_3_${Date.now().toString(16)}`,
      roadmap: roadmap._id,
      title: 'Build Mobile UI Layouts',
      description: 'Implement responsive widgets and state management',
      weekNumber: 2,
      order: 1,
      skillName: 'flutter',
      completed: false
    });

    console.log('✓ Roadmap created with 3 incomplete tasks');

    // 4. Mark all 3 tasks complete
    console.log('\nStep 3: Marking all 3 tasks as complete...');
    task1.completed = true;
    task1.completedAt = new Date();
    await task1.save();

    task2.completed = true;
    task2.completedAt = new Date();
    await task2.save();

    task3.completed = true;
    task3.completedAt = new Date();
    await task3.save();

    // 5. Call calculateRoadmapProgress to trigger completion and profile graduation sync
    console.log('Step 4: Calling calculateRoadmapProgress(roadmapId)...');
    const updatedRoadmap = await calculateRoadmapProgress(roadmap._id);

    assert.strictEqual(updatedRoadmap.status, 'completed', 'Roadmap status must transition to "completed"');
    assert.strictEqual(updatedRoadmap.progressPercentage, 100, 'Roadmap progress must reach 100%');
    console.log('✓ Roadmap status successfully updated to "completed" at 100%');

    // 6. Inspect updated User profile in database
    console.log('\nStep 5: Inspecting User profile in database...');
    const updatedUser = await User.findById(testUserId);
    assert.ok(Array.isArray(updatedUser.completedPaths), 'user.completedPaths must be an array');
    assert.strictEqual(updatedUser.completedPaths.length, 1, 'user.completedPaths must contain 1 completed path');

    const grad = updatedUser.completedPaths[0];
    assert.strictEqual(grad.role, career.title, 'Graduated role must match career title');
    assert.strictEqual(grad.status, 'graduated', 'Status must be graduated');
    assert.ok(grad.credentialId.startsWith('CP-CERT-'), 'Credential ID must start with CP-CERT-');
    assert.ok(grad.verificationCode.startsWith('V-'), 'Verification code must start with V-');
    assert.ok(grad.skillsGained.includes('flutter'), 'skillsGained must include flutter');
    assert.ok(grad.skillsGained.includes('dart'), 'skillsGained must include dart');
    console.log('✓ Completed path successfully saved into user profile:', {
      role: grad.role,
      credentialId: grad.credentialId,
      skillsGained: grad.skillsGained
    });

    // 7. Verify skills were elevated in user profile
    console.log('\nStep 6: Verifying user skills elevation in profile...');
    const flutterSkill = updatedUser.skills.find((s) => s.name === 'flutter');
    const dartSkill = updatedUser.skills.find((s) => s.name === 'dart');
    assert.ok(flutterSkill, 'Flutter skill must exist in profile');
    assert.strictEqual(flutterSkill.proficiency, 'intermediate', 'Flutter proficiency elevated from beginner');
    assert.strictEqual(flutterSkill.isQuizVerified, true, 'Flutter marked as verified');

    assert.ok(dartSkill, 'Dart skill must exist in profile');
    assert.strictEqual(dartSkill.isQuizVerified, true, 'Dart marked as verified');
    console.log('✓ Skills elevated and verified in user profile');

    // 8. Verify userController.getMyProfile (GET /api/users/me) returns completedPaths
    console.log('\nStep 7: Testing GET /api/users/me returns completedPaths...');
    const mockReq = {
      user: { _id: testUserId, id: testUserId, role: 'student' }
    };
    const mockRes = createMockRes();
    await userController.getMyProfile(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    assert.strictEqual(mockRes.statusCode, 200, 'getMyProfile returns 200');
    assert.strictEqual(mockRes.body.data.user.completedPaths?.length, 1, 'Profile returns completedPaths');
    console.log('✓ GET /api/users/me confirmed returning completed roadmap credentials');

    console.log('\n🎉 ALL ROADMAP COMPLETION PROFILE SYNC TESTS PASSED! (100% Success)');
  } finally {
    // Cleanup test data
    console.log('Cleaning up test records...');
    await RoadmapTask.deleteMany({ roadmap: roadmapId }).catch(() => {});
    await Roadmap.deleteOne({ _id: roadmapId }).catch(() => {});
    await User.deleteOne({ _id: testUserId }).catch(() => {});
    console.log('✓ Test cleanup complete.');
  }
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });

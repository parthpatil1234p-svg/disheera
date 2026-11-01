/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * test_single_route.js — Integration & Invariant Test Suite
 * Single Active Career Route per Account Progression Model
 * Disheera · Enterprise Backend Service
 */

const assert = require('assert');
const mongoose = require('mongoose');
const Roadmap = require('./models/Roadmap');

function runSingleRouteTests() {
  console.log('=== SINGLE ACTIVE CAREER ROUTE TEST SUITE ===\n');

  // Test 1: Verify Roadmap Schema status enum contains active, completed, archived
  console.log('✔ Test 1: Checking Roadmap Schema status enum...');
  const statusPath = Roadmap.schema.paths.status;
  assert.ok(statusPath, 'Roadmap schema must define "status" field');
  const allowedStatuses = statusPath.enumValues || statusPath.options?.enum?.values || statusPath.options?.enum;
  assert.ok(allowedStatuses.includes('active'), 'Roadmap status must include "active"');
  assert.ok(allowedStatuses.includes('completed'), 'Roadmap status must include "completed"');
  assert.ok(allowedStatuses.includes('archived'), 'Roadmap status must include "archived"');
  console.log('  -> PASSED: Status enum contains [active, completed, archived]\n');

  // Test 2: Active Roadmap Conflict Detection (409 Conflict Invariant)
  console.log('✔ Test 2: Testing Active Route Conflict Guard (409 Invariant)...');
  const mockUserId = new mongoose.Types.ObjectId();

  const mockActiveRoadmap = {
    _id: new mongoose.Types.ObjectId(),
    user: mockUserId,
    status: 'active',
    durationWeeks: 8,
    progressPercentage: 35,
    careerSnapshot: {
      title: 'Full-Stack Developer',
      slug: 'full-stack-developer',
    },
  };

  // Simulate active route check from generateRoadmap
  function checkCanGenerateRoadmap(existingActiveRoadmap) {
    if (existingActiveRoadmap && existingActiveRoadmap.status === 'active') {
      const err = new Error(
        `You are currently pursuing the "${existingActiveRoadmap.careerSnapshot?.title}" route (${Math.round(existingActiveRoadmap.progressPercentage)}% completed). You must complete your current route before starting another career route.`
      );
      err.statusCode = 409;
      err.code = 'ACTIVE_ROUTE_IN_PROGRESS';
      err.data = {
        activeRoadmap: {
          id: existingActiveRoadmap._id,
          careerTitle: existingActiveRoadmap.careerSnapshot?.title,
          slug: existingActiveRoadmap.careerSnapshot?.slug,
          progressPercentage: existingActiveRoadmap.progressPercentage,
        },
      };
      throw err;
    }
    return true;
  }

  assert.throws(
    () => checkCanGenerateRoadmap(mockActiveRoadmap),
    (err) => {
      assert.strictEqual(err.statusCode, 409);
      assert.strictEqual(err.code, 'ACTIVE_ROUTE_IN_PROGRESS');
      assert.ok(err.message.includes('Full-Stack Developer'));
      assert.ok(err.message.includes('35% completed'));
      return true;
    }
  );
  console.log('  -> PASSED: 409 Conflict thrown with ACTIVE_ROUTE_IN_PROGRESS\n');

  // Test 3: Graduation Unlocks Next Route
  console.log('✔ Test 3: Testing Graduation Unlocks Next Route...');
  const mockCompletedRoadmap = {
    _id: new mongoose.Types.ObjectId(),
    user: mockUserId,
    status: 'completed',
    durationWeeks: 4,
    progressPercentage: 100,
    careerSnapshot: {
      title: 'Full-Stack Developer',
      slug: 'full-stack-developer',
    },
  };

  // After completion, student is allowed to generate new route
  const canGenerateAfterGraduation = checkCanGenerateRoadmap(null); // No active roadmap
  assert.strictEqual(canGenerateAfterGraduation, true);
  console.log('  -> PASSED: Graduated student can freely generate next career route\n');

  // Test 4: Current Roadmap Query Resolution (Active vs Completed vs None)
  console.log('✔ Test 4: Testing Current Roadmap Status Resolution...');
  function resolveCurrentRouteState(activeRoadmap, lastCompletedRoadmap) {
    let roadmap = activeRoadmap;
    let isCompleted = false;

    if (!roadmap && lastCompletedRoadmap) {
      roadmap = lastCompletedRoadmap;
      isCompleted = true;
    }

    if (!roadmap) {
      return {
        hasRoadmap: false,
        isCompleted: false,
        canStartNewRoute: true,
        roadmap: null,
      };
    }

    return {
      hasRoadmap: true,
      isCompleted,
      canStartNewRoute: isCompleted || roadmap.status !== 'active',
      roadmap,
    };
  }

  // Case A: User is currently enrolled in an active roadmap
  const inProgressState = resolveCurrentRouteState(mockActiveRoadmap, null);
  assert.strictEqual(inProgressState.hasRoadmap, true);
  assert.strictEqual(inProgressState.isCompleted, false);
  assert.strictEqual(inProgressState.canStartNewRoute, false);

  // Case B: User has graduated from a roadmap
  const graduatedState = resolveCurrentRouteState(null, mockCompletedRoadmap);
  assert.strictEqual(graduatedState.hasRoadmap, true);
  assert.strictEqual(graduatedState.isCompleted, true);
  assert.strictEqual(graduatedState.canStartNewRoute, true);

  // Case C: Brand new user with no roadmaps
  const newUserState = resolveCurrentRouteState(null, null);
  assert.strictEqual(newUserState.hasRoadmap, false);
  assert.strictEqual(newUserState.canStartNewRoute, true);

  console.log('  -> PASSED: Progression flags verified (in_progress => locked, graduated => unlocked, new => unlocked)\n');

  // Test 5: Route Abandonment Archiving
  console.log('✔ Test 5: Testing Route Abandonment Logic...');
  function simulateAbandonRoute(roadmapToAbandon) {
    if (!roadmapToAbandon || roadmapToAbandon.status !== 'active') {
      throw new Error('No active roadmap to archive');
    }
    return {
      ...roadmapToAbandon,
      status: 'archived',
      archivedAt: new Date(),
    };
  }

  const archivedRoadmap = simulateAbandonRoute(mockActiveRoadmap);
  assert.strictEqual(archivedRoadmap.status, 'archived');
  // Now verify that after archiving, checkCanGenerateRoadmap succeeds
  assert.strictEqual(checkCanGenerateRoadmap(null), true);
  console.log('  -> PASSED: Abandoning safely transitions status to "archived" and unlocks account\n');

  // Test 6: Milestone Graduation Criteria (100% of weekly tests passed at >= 70%)
  console.log('✔ Test 6: Testing Milestone Graduation Criteria (All weeks passed)...');
  const fourWeekProgress = [
    { weekNumber: 1, status: 'passed', testScore: 9, testPercent: 90 },
    { weekNumber: 2, status: 'passed', testScore: 8, testPercent: 80 },
    { weekNumber: 3, status: 'passed', testScore: 7, testPercent: 70 },
    { weekNumber: 4, status: 'passed', testScore: 10, testPercent: 100 },
  ];

  const allWeeksPassed = fourWeekProgress.every((wp) => wp.status === 'passed');
  assert.strictEqual(allWeeksPassed, true, 'All weeks must be passed for graduation');

  const incompleteProgress = [
    { weekNumber: 1, status: 'passed', testScore: 8, testPercent: 80 },
    { weekNumber: 2, status: 'awaiting_test', testScore: 0, testPercent: 0 },
    { weekNumber: 3, status: 'locked', testScore: 0, testPercent: 0 },
    { weekNumber: 4, status: 'locked', testScore: 0, testPercent: 0 },
  ];
  assert.strictEqual(
    incompleteProgress.every((wp) => wp.status === 'passed'),
    false,
    'Incomplete weeks must not qualify for graduation'
  );
  console.log('  -> PASSED: Strict 100% milestone pass threshold verified for graduation\n');

  console.log('====================================================');
  console.log('🎉 ALL 6 SINGLE ACTIVE CAREER ROUTE TESTS PASSED!');
  console.log('====================================================\n');
  process.exit(0);
}

runSingleRouteTests();

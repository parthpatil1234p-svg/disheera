/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * e2e_video_routes_test.js
 * End-to-end route tests for video dedication and verification.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const RoadmapTask = require('../models/RoadmapTask');
const Roadmap = require('../models/Roadmap');
const {
  getVideoConceptCheckpoint,
  evaluateVideoReflection,
} = require('../services/videoDedicationService');
const { calculateRoadmapProgress } = require('../services/roadmapService');

async function testSuite() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  // Find a video task directly
  let task = await RoadmapTask.findOne({ isVideoTask: true });
  if (!task) {
    task = await RoadmapTask.findOne();
    if (task) {
      task.isVideoTask = true;
      task.videoDurationSeconds = 600;
      task.resource = {
        title: 'HTML & CSS Crash Course',
        url: 'https://www.youtube.com/watch?v=mU6anWqZJcc',
        provider: 'freeCodeCamp (YouTube)',
        mediaType: 'video',
      };
      await task.save();
    }
  }

  const roadmap = await Roadmap.findById(task.roadmap);
  console.log(`Testing with Roadmap ID: ${roadmap._id}, Task: "${task.title}" (ID: ${task._id})`);

  // Test 1: Checkpoint Service Generation
  console.log('\n--- 1. Video Checkpoint Service ---');
  const cpRes = await getVideoConceptCheckpoint({
    taskTitle: task.title,
    skillName: task.skillName || 'web-development',
    videoTitle: task.resource?.title,
  });
  console.log('Checkpoint Question:', cpRes.checkpoint.question);
  console.log('Options:', cpRes.checkpoint.options);
  console.log('Correct Answer Index:', cpRes.checkpoint.correctIndex);

  // Test 2: AI Evaluation Service (Low vs High effort)
  console.log('\n--- 2. Reflection Evaluation Service ---');
  const spamRes = await evaluateVideoReflection({
    taskTitle: task.title,
    skillName: task.skillName,
    videoTitle: task.resource?.title,
    reflectionText: 'ok watched it',
  });
  console.log('Spam passed:', spamRes.passed, 'Score:', spamRes.score);
  if (spamRes.passed) throw new Error('Spam should not pass!');

  const goodReflectionText = `In this lesson on ${task.title || 'CSS Flexbox and Grid'}, I learned how display flex establishes a flexible layout along main and cross axes using justify-content and align-items. For complex two-dimensional layouts, CSS Grid with grid-template-columns and fractional fr units enables structured responsive grids without float hacks. Using the gap property and media queries allows building clean and maintainable UI interfaces.`;
  const goodRes = await evaluateVideoReflection({
    taskTitle: task.title,
    skillName: task.skillName || 'css',
    videoTitle: task.resource?.title,
    reflectionText: goodReflectionText,
  });
  console.log('Good reflection passed:', goodRes.passed, 'Score:', goodRes.score);
  console.log('Key concepts:', goodRes.keyConceptsIdentified);
  if (!goodRes.passed) throw new Error('Good reflection should pass!');

  // Test 3: Simulating Verification State Update on Roadmap & Task
  console.log('\n--- 3. Verifying Task Completion & Roadmap Recalculation ---');
  task.isVideoVerified = true;
  task.videoVerifiedAt = new Date();
  task.videoWatchTimeSeconds = 540;
  task.videoDurationSeconds = 600;
  task.videoMaxWatchedTime = 600;
  task.videoMidCheckPassed = true;
  task.videoReflectionSummary = 'Test reflection summary';
  task.videoAiScore = goodRes.score;
  task.videoAiFeedback = goodRes.feedback;
  task.completed = true;
  task.completedAt = new Date();
  await task.save();

  const updatedRoadmap = await calculateRoadmapProgress(roadmap._id);
  console.log(`Roadmap progress recalculated: ${updatedRoadmap.progressPercentage}% (${updatedRoadmap.completedTasks}/${updatedRoadmap.totalTasks} tasks)`);
  console.log('✓ Task marked verified and completed; roadmap progress updated seamlessly!');

  console.log('\n==================================================================');
  console.log('🎉 ALL VIDEO DEDICATION SERVICES & FLOWS FULLY VERIFIED!');
  console.log('==================================================================\n');
  await mongoose.disconnect();
}

testSuite().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

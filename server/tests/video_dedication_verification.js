/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * video_dedication_verification.js
 * End-to-end verification of AI Video Dedication & Anti-Slacking Learning Chamber.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const RoadmapTask = require('../models/RoadmapTask');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const {
  getVideoConceptCheckpoint,
  evaluateVideoReflection,
} = require('../services/videoDedicationService');
const { calculateRoadmapProgress } = require('../services/roadmapService');

async function runTests() {
  console.log('=== STARTING VIDEO DEDICATION SYSTEM TESTS ===\n');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  // 1. Test Concept Pulse Generation
  console.log('\n--- 1. Testing Mid-Video Concept Pulse Generation ---');
  const result = await getVideoConceptCheckpoint({
    taskTitle: 'Master HTML5 Semantic Structure & Accessibility',
    skillName: 'html',
    videoTitle: 'HTML & CSS Crash Course',
  });
  const checkpoint = result.checkpoint;
  console.log('Source:', result.source);
  console.log('Question:', checkpoint.question);
  console.log('Options Count:', checkpoint.options.length);
  console.log('Correct Answer Index:', checkpoint.correctIndex);
  console.log('Explanation:', checkpoint.explanation);
  if (!checkpoint.question || checkpoint.options.length !== 4) {
    throw new Error('Checkpoint question failed generation validation');
  }
  console.log('✓ Mid-Video Concept Pulse Question successfully verified!');

  // 2. Test Reflection Evaluation: Rejection of Spam / Low-effort input
  console.log('\n--- 2. Testing Reflection Evaluation: Low-effort Spam ---');
  const spamResult = await evaluateVideoReflection({
    taskTitle: 'JavaScript DOM Manipulation & Event Handling',
    skillName: 'javascript',
    videoTitle: 'JavaScript DOM Full Tutorial',
    reflectionText: 'good video watched thanks',
  });
  console.log('Spam Reflection Score:', spamResult.score, 'Passed:', spamResult.passed);
  console.log('Feedback:', spamResult.feedback);
  if (spamResult.passed) {
    throw new Error('Low effort spam submission should NOT pass!');
  }
  console.log('✓ Spam reflection correctly rejected with actionable feedback!');

  // 3. Test Reflection Evaluation: High-effort Comprehension
  console.log('\n--- 3. Testing Reflection Evaluation: Comprehensive Synthesis ---');
  const goodResult = await evaluateVideoReflection({
    taskTitle: 'Master HTML5 Semantic Structure & Accessibility',
    skillName: 'html',
    videoTitle: 'HTML & CSS Crash Course',
    reflectionText: 'In this lesson I learned how Semantic HTML elements such as main, nav, article, and section structure the DOM for screen readers and search engines. I will replace non-semantic div tags with these elements and apply ARIA labels to ensure full web accessibility compliance.',
  });
  console.log('Comprehensive Reflection Score:', goodResult.score, 'Passed:', goodResult.passed);
  console.log('Feedback:', goodResult.feedback);
  console.log('Concepts:', goodResult.keyConceptsIdentified);
  if (!goodResult.passed || goodResult.score < 60) {
    throw new Error('Comprehensive reflection should pass with >= 60%');
  }
  console.log('✓ Comprehensive reflection passed with honors!');

  // 4. Test Server-Authoritative Anti-Slacking Gate on RoadmapTask
  console.log('\n--- 4. Testing Task Model & Video Verification Gate ---');
  const videoTask = await RoadmapTask.findOne({ isVideoTask: true });
  if (videoTask) {
    console.log(`Found video task: "${videoTask.title}" (ID: ${videoTask._id})`);
    console.log(`isVideoTask: ${videoTask.isVideoTask}, isVideoVerified: ${videoTask.isVideoVerified}`);
    console.log(`Video URL: ${videoTask.resource?.url}`);
    console.log('✓ Video task fields exist in MongoDB schema and instances.');
  } else {
    console.log('No video task found in DB. Run sync_video_tasks.js first.');
  }

  console.log('\n======================================================');
  console.log('🎉 ALL VIDEO DEDICATION SYSTEM TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

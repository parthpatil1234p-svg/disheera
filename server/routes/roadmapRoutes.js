/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/roadmapRoutes.js — Roadmap & Task Execution Endpoints
 *
 * Mounted at: /api/roadmaps (in server.js)
 *
 * All routes require authentication:
 *   POST   /api/roadmaps/generate          → generateRoadmap
 *   GET    /api/roadmaps/current           → getCurrentRoadmap
 *   PATCH  /api/roadmaps/tasks/:taskId/toggle → toggleTask
 *   DELETE /api/roadmaps/current           → archiveRoadmap
 */

const express = require('express');
const router = express.Router();
const { protect, requireSkillVerification, requireStudent } = require('../middleware/authMiddleware');
const {
  validateRoadmapGeneration,
  validateTaskId,
} = require('../middleware/validateRequest');
const {
  generateRoadmap,
  getCurrentRoadmap,
  toggleTask,
  abandonRoadmap,
  resumeRoadmap,
  archiveRoadmap,
  linkProjectRepo,
  startWeeklyTestController,
  saveWeeklyTestAnswerController,
  submitWeeklyTestController,
  getWeeklyTestStatusController,
  recordWeeklyTestViolationController,
  disqualifyWeeklyTestController,
  completeWeekMilestoneController,
  getVideoCheckpointController,
  verifyVideoLearningController,
  triggerStreakNudgeTestController,
  getDeveloperRoadmapTracks,
  getDeveloperRoadmapBySlug,
  getDeveloperRoadmapTopicGuide,
} = require('../controllers/roadmapController');

// Interactive Developer Roadmap Explorer (nilbuild/developer-roadmap standards)
router.get('/developer-explorer/tracks', getDeveloperRoadmapTracks);
router.get('/developer-explorer/:slug', getDeveloperRoadmapBySlug);
router.get('/developer-explorer/topic/:nodeId', getDeveloperRoadmapTopicGuide);

router.use(protect, requireStudent);

router.post('/generate', requireSkillVerification, validateRoadmapGeneration, generateRoadmap);
router.get('/current', requireSkillVerification, getCurrentRoadmap);
router.post('/nudge/test', protect, triggerStreakNudgeTestController);
router.patch('/tasks/:taskId/toggle', protect, validateTaskId, toggleTask);
router.post('/tasks/:taskId/link-repo', protect, validateTaskId, linkProjectRepo);
router.get('/tasks/:taskId/video-checkpoint', protect, validateTaskId, getVideoCheckpointController);
router.post('/tasks/:taskId/verify-video', protect, validateTaskId, verifyVideoLearningController);
router.post('/current/abandon', protect, abandonRoadmap);
router.post('/:id/resume', protect, resumeRoadmap);
router.delete('/current', protect, archiveRoadmap);

// Weekly Milestone Tests (Server-clock 30-min timer & 70% threshold)
router.post('/:id/weeks/:weekNumber/test/start', protect, startWeeklyTestController);
router.post('/test/save-answer', protect, saveWeeklyTestAnswerController);
router.post('/test/submit', protect, submitWeeklyTestController);
router.get('/test/:attemptId/status', protect, getWeeklyTestStatusController);
router.post('/test/violation', protect, recordWeeklyTestViolationController);
router.post('/test/disqualify', protect, disqualifyWeeklyTestController);
router.post('/:id/weeks/:weekNumber/complete', protect, completeWeekMilestoneController);

module.exports = router;

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/assignmentRoutes.js — Weekly Assignments & AI Grading Routes (Plan 46)
 *
 * Mounted at: /api/assignments
 *
 * Disheera Technologies Inc.
 */

const express = require('express');
const router = express.Router();
const { protect, requireStudent } = require('../middleware/authMiddleware');
const {
  getWeeklyAssignment,
  downloadCoverTemplate,
  submitAssignment,
  evaluateSubmissionEndpoint,
  getMySubmissions,
  downloadSubmissionPdf,
  downloadEvaluationSheet,
  getSubmissionStatus
} = require('../controllers/assignmentController');

// All assignment endpoints require authentication and student role (or admin)
router.use(protect, requireStudent);

// 1. Fetch weekly questions & rubrics
router.get('/week/:weekNumber', getWeeklyAssignment);

// 2. Download personalized 1-page Part A Cover Page PDF
router.get('/template', downloadCoverTemplate);

// 3. Submit standardized assignment PDF (Part A + Part B) & trigger auto-grader
router.post('/submit', submitAssignment);

// 4. Trigger on-demand AI evaluation / re-grading
router.post('/:id/evaluate', evaluateSubmissionEndpoint);

// 5. View personal submission history & marks
router.get('/my-submissions', getMySubmissions);

// 6. Download / view submitted assignment PDF
router.get('/download/:submissionId', downloadSubmissionPdf);

// 7. Download Part C Official Stamped Evaluation Sheet PDF
router.get('/eval-sheet/:submissionId', downloadEvaluationSheet);

// 8. Poll submission evaluation status & marks in real-time
router.get('/status/:id', getSubmissionStatus);

module.exports = router;

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
  getMySubmissions,
  downloadSubmissionPdf
} = require('../controllers/assignmentController');

// All assignment endpoints require authentication and student role (or admin)
router.use(protect, requireStudent);

// 1. Fetch weekly questions & rubrics
router.get('/week/:weekNumber', getWeeklyAssignment);

// 2. Download personalized 1-page Part A Cover Page PDF
router.get('/template', downloadCoverTemplate);

// 3. Submit standardized assignment PDF (Part A + Part B)
router.post('/submit', submitAssignment);

// 4. View personal submission history & marks
router.get('/my-submissions', getMySubmissions);

// 5. Download / view submitted assignment PDF
router.get('/download/:submissionId', downloadSubmissionPdf);

module.exports = router;

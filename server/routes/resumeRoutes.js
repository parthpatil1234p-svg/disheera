/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/resumeRoutes.js — AI Resume ATS Evaluation Endpoints
 *
 * Mounted at: /api/resume
 */

const express = require('express');
const router = express.Router();
const { protect, requireStudent } = require('../middleware/authMiddleware');
const {
  analyzeResume,
  getResumeAnalysis,
  getBuiltResume,
  saveBuiltResume,
  resetBuiltResume,
  loadSampleResume,
  improveResumeText,
  matchResumeToJob,
} = require('../controllers/resumeController');

router.use(protect, requireStudent);

// ATS Analysis Endpoints
router.post('/analyze', analyzeResume);
router.get('/analysis', getResumeAnalysis);

// Resume Builder Draft & AI Endpoints
router.get('/builder', getBuiltResume);
router.post('/builder', saveBuiltResume);
router.post('/builder/clear', resetBuiltResume);
router.post('/builder/sample', loadSampleResume);
router.post('/improve-text', improveResumeText);
router.post('/match-job', matchResumeToJob);

module.exports = router;

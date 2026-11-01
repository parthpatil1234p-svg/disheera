/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/interviewRoutes.js — AI Mock Technical Interview Endpoints
 *
 * Mounted at: /api/interview
 */

const express = require('express');
const router = express.Router();
const { protect, requireStudent } = require('../middleware/authMiddleware');
const {
  startInterview,
  evaluateAnswer,
  finalizeInterview,
  getInterviewStatus
} = require('../controllers/interviewController');

router.use(protect, requireStudent);

router.post('/start', startInterview);
router.post('/evaluate', evaluateAnswer);
router.post('/finalize', finalizeInterview);
router.get('/status', getInterviewStatus);

module.exports = router;

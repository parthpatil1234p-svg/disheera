/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/recommendationRoutes.js — Recommendation Engine Endpoint
 *
 * Mounted at: /api/recommendations (in server.js)
 *
 * Protected routes:
 *   POST /api/recommendations/generate → protect → getRecommendations
 */

const express = require('express');
const router = express.Router();
const { protect, requireSkillVerification, requireStudent } = require('../middleware/authMiddleware');
const { getRecommendations } = require('../controllers/recommendationController');

router.post('/generate', protect, requireStudent, requireSkillVerification, getRecommendations);

module.exports = router;

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
const { protect } = require('../middleware/authMiddleware');
const { getRecommendations } = require('../controllers/recommendationController');

router.post('/generate', protect, getRecommendations);

module.exports = router;

/**
 * routes/dashboardRoutes.js — Unified Student Dashboard Endpoint
 *
 * Mounted at: /api/dashboard (in server.js)
 *
 * Protected route:
 *   GET /api/dashboard → protect → getDashboard
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboard } = require('../controllers/dashboardController');

router.get('/', protect, getDashboard);

module.exports = router;

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
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
const { protect, requireSkillVerification, requireStudent } = require('../middleware/authMiddleware');
const { getDashboard } = require('../controllers/dashboardController');

router.get('/', protect, requireStudent, requireSkillVerification, getDashboard);

module.exports = router;

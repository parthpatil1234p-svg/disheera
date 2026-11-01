/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminDashboardRoutes.js — Admin Dashboard Routes
 * Mounted at: /api/admin/dashboard
 */

const express = require('express');
const router = express.Router();
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');
const { getDashboardStats } = require('../controllers/adminDashboardController');

// All dashboard routes require authenticated admin (MODERATOR or above)
router.use(verifyAdminAuth);
router.use(requireAdminRole('MODERATOR'));

router.get('/stats', getDashboardStats);

module.exports = router;

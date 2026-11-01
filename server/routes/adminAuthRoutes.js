/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminAuthRoutes.js — Disheera Subdomain Admin Authentication Routes
 *
 * Mounted at: /api/admin/auth
 */

const express = require('express');
const router = express.Router();
const {
  adminLoginLimiter,
  login,
  getMe,
  changePassword,
  logout
} = require('../controllers/adminAuthController');
const { verifyAdminAuth } = require('../middleware/adminAuthMiddleware');

// Public to admin subdomain with dedicated rate limiter
router.post('/login', adminLoginLimiter, login);

// Authenticated admin endpoints
router.get('/me', verifyAdminAuth, getMe);
router.post('/change-password', verifyAdminAuth, changePassword);
router.post('/logout', verifyAdminAuth, logout);

module.exports = router;

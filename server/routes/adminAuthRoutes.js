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

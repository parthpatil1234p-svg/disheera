/**
 * adminSystemRoutes.js — Operational Health & Telemetry Routes
 *
 * Mounted at: /api/admin/system
 *
 * Disheera · Enterprise Administration Service
 */

const express = require('express');
const router = express.Router();
const {
  getSystemHealth,
  getSystemMetrics
} = require('../controllers/adminSystemController');
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');

// All system telemetry routes require admin authentication & at least MODERATOR role
router.use(verifyAdminAuth);
router.use(requireAdminRole('MODERATOR'));

// GET /api/admin/system/health — DB ping latency, process uptime, memory
router.get('/health', getSystemHealth);

// GET /api/admin/system/metrics — Service counts & active sessions
router.get('/metrics', getSystemMetrics);

module.exports = router;

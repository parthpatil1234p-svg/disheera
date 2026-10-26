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
  getSystemMetrics,
  getInfrastructureTelemetry,
  getAdminMaintenanceConfig,
  updateAdminMaintenanceConfig
} = require('../controllers/adminSystemController');
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');

// All system telemetry routes require admin authentication & at least MODERATOR role
router.use(verifyAdminAuth);
router.use(requireAdminRole('MODERATOR'));

// GET /api/admin/system/health — DB ping latency, process uptime, memory
router.get('/health', getSystemHealth);

// GET /api/admin/system/metrics — Service counts & active sessions
router.get('/metrics', getSystemMetrics);

// GET /api/admin/system/infrastructure — Live Distributed Cluster Telemetry (Vercel + Render + Supabase)
router.get('/infrastructure', getInfrastructureTelemetry);

// GET /api/admin/system/maintenance — Retrieve current maintenance mode state
router.get('/maintenance', getAdminMaintenanceConfig);

// POST /api/admin/system/maintenance — Toggle maintenance mode (Requires ADMIN or SUPER_ADMIN)
router.post('/maintenance', requireAdminRole('ADMIN'), updateAdminMaintenanceConfig);

module.exports = router;

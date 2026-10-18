/**
 * adminRoadmapRoutes.js — Student Roadmap & Milestone Assessment Routes
 *
 * All routes guarded by adminHostGuard, adminAuth, and requireAdminRole.
 * Mutations require ADMIN or higher.
 * Disheera · Enterprise Administration Service
 */

const express = require('express');
const router = express.Router();
const {
  listRoadmaps,
  getRoadmapDetail,
  getAnomalies,
  updateRoadmapStatus
} = require('../controllers/adminRoadmapController');
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');
const adminHostGuard = require('../middleware/adminHostGuard');

router.use(adminHostGuard);
router.use(verifyAdminAuth);

// Read-only (MODERATOR, ADMIN, SUPER_ADMIN)
router.get('/', requireAdminRole('MODERATOR'), listRoadmaps);
router.get('/anomalies/scores', requireAdminRole('MODERATOR'), getAnomalies);
router.get('/:id', requireAdminRole('MODERATOR'), getRoadmapDetail);

// Mutations (ADMIN, SUPER_ADMIN)
router.patch('/:id/status', requireAdminRole('ADMIN'), updateRoadmapStatus);

module.exports = router;

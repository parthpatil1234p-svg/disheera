/**
 * adminContentRoutes.js — Curated Masterclass Content Routes
 *
 * All routes guarded by adminHostGuard, adminAuth, and requireAdminRole.
 * Mutations require ADMIN or higher; Permanent deletes require SUPER_ADMIN.
 * Disheera · Enterprise Administration Service
 */

const express = require('express');
const router = express.Router();
const {
  listVideos,
  addVideo,
  updateVideo,
  deleteVideo
} = require('../controllers/adminContentController');
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');
const adminHostGuard = require('../middleware/adminHostGuard');

router.use(adminHostGuard);
router.use(verifyAdminAuth);

// Read-only (MODERATOR, ADMIN, SUPER_ADMIN)
router.get('/videos', requireAdminRole('MODERATOR'), listVideos);

// Mutations (ADMIN, SUPER_ADMIN)
router.post('/videos', requireAdminRole('ADMIN'), addVideo);
router.patch('/videos/:skillName/:videoId', requireAdminRole('ADMIN'), updateVideo);
router.delete('/videos/:skillName/:videoId', requireAdminRole('ADMIN'), deleteVideo);

module.exports = router;

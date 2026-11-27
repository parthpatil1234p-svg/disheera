/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminCallsRoutes.js — Voice Support Cockpit Routes (Plan 47 Phase 4)
 * Mounted at: /api/admin/calls
 *
 * Disheera · Enterprise Administration Service
 */

const express = require('express');
const router = express.Router();
const voiceSupportService = require('../services/browserVoiceSupportService');
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');

// All voice cockpit routes require admin authentication & at least MODERATOR role
router.use(verifyAdminAuth);
router.use(requireAdminRole('MODERATOR'));

/**
 * @route   GET /api/admin/calls
 * @desc    Get paginated call logs with transcripts, recording URLs, and ticket metadata
 * @access  Admin (Moderator+)
 */
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query;
    const logsData = await voiceSupportService.getCallLogs({ page, limit, search, status });
    return res.status(200).json({
      success: true,
      data: logsData,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

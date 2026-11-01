/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminRecruiterRoutes.js — Admin Recruiter Management Routes
 * Mounted at: /api/admin/recruiters
 */

const express = require('express');
const router = express.Router();
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');
const {
  listRecruiters,
  approveRecruiter,
  rejectRecruiter
} = require('../controllers/adminRecruiterController');

// All routes require authenticated admin
router.use(verifyAdminAuth);

// List recruiters (MODERATOR and above)
router.get('/', requireAdminRole('MODERATOR'), listRecruiters);

// Approve recruiter (ADMIN and above)
router.post('/:id/approve', requireAdminRole('ADMIN'), approveRecruiter);

// Reject recruiter (ADMIN and above)
router.post('/:id/reject', requireAdminRole('ADMIN'), rejectRecruiter);

module.exports = router;

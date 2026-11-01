/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/adminAssignmentRoutes.js — Subdomain Admin Assignment Review Routes (Plan 46)
 *
 * Mounted at: /api/admin/assignments
 *
 * Disheera Technologies Inc.
 */

const express = require('express');
const router = express.Router();
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');
const {
  listAssignments,
  getAssignmentById,
  reviewAssignment
} = require('../controllers/adminAssignmentController');

// All admin assignment routes require authenticated AdminUser (MODERATOR or above)
router.use(verifyAdminAuth);
router.use(requireAdminRole('MODERATOR'));

// 1. List and filter student assignments with KPI counts
router.get('/', listAssignments);

// 2. Fetch full submission dossier for review
router.get('/:id', getAssignmentById);

// 3. Commit review, override marks, and set status (ADMIN_APPROVED / RESUBMISSION_REQUESTED)
router.post('/:id/review', reviewAssignment);

module.exports = router;

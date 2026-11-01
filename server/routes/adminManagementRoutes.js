/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminManagementRoutes.js — Super Admin Management Routes
 *
 * Mounted at: /api/admin/admins
 * Accessible exclusively to SUPER_ADMIN.
 *
 * Disheera · Enterprise Administration Service
 */

const express = require('express');
const router = express.Router();
const {
  listAdmins,
  createAdmin,
  toggleAdminActive,
  updateAdminRole
} = require('../controllers/adminManagementController');
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');

// All admin management routes require admin authentication & SUPER_ADMIN role
router.use(verifyAdminAuth);
router.use(requireAdminRole('SUPER_ADMIN'));

// GET /api/admin/admins — List all administrative accounts
router.get('/', listAdmins);

// POST /api/admin/admins — Create new admin/moderator with one-time temporary password
router.post('/', createAdmin);

// PATCH /api/admin/admins/:id/toggle-active — Activate/deactivate admin & revoke sessions
router.patch('/:id/toggle-active', toggleAdminActive);

// PATCH /api/admin/admins/:id/role — Change role & revoke sessions
router.patch('/:id/role', updateAdminRole);

module.exports = router;

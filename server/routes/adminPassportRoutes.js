/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminPassportRoutes.js — Skill Passport Administration Routes
 *
 * All routes guarded by adminHostGuard, adminAuth, and requireAdminRole.
 * Mutations require ADMIN or higher; Reinstatement requires SUPER_ADMIN.
 * Disheera · Enterprise Administration Service
 */

const express = require('express');
const router = express.Router();
const {
  listPassports,
  getPassportDossier,
  revokePassport,
  reinstatePassport
} = require('../controllers/adminPassportController');
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');
const adminHostGuard = require('../middleware/adminHostGuard');

// Host guard on all passport admin routes
router.use(adminHostGuard);
router.use(verifyAdminAuth);

// Read-only endpoints (MODERATOR, ADMIN, SUPER_ADMIN)
router.get('/', requireAdminRole('MODERATOR'), listPassports);
router.get('/:studentId', requireAdminRole('MODERATOR'), getPassportDossier);

// Mutation: Revoke credential (ADMIN, SUPER_ADMIN)
router.post('/:studentId/revoke', requireAdminRole('ADMIN'), revokePassport);

// Mutation: Reinstate revoked credential (SUPER_ADMIN ONLY)
router.post('/:studentId/reinstate', requireAdminRole('SUPER_ADMIN'), reinstatePassport);

module.exports = router;

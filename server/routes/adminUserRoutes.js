/**
 * adminUserRoutes.js — Admin User Management Routes
 * Mounted at: /api/admin/users
 */

const express = require('express');
const router = express.Router();
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');
const {
  listUsers,
  getUserDetail,
  toggleSuspendUser,
  deleteUser,
  hardDeleteUser
} = require('../controllers/adminUserController');

// All routes require authenticated admin
router.use(verifyAdminAuth);

// Read user lists & dossiers (MODERATOR and above)
router.get('/', requireAdminRole('MODERATOR'), listUsers);
router.get('/:id', requireAdminRole('MODERATOR'), getUserDetail);

// Suspend / Unsuspend user (ADMIN and above)
router.patch('/:id/suspend', requireAdminRole('ADMIN'), toggleSuspendUser);

// Soft delete / deactivate user account (SUPER_ADMIN only)
router.delete('/:id', requireAdminRole('SUPER_ADMIN'), deleteUser);

// Permanent hard delete requiring typed confirmation email (SUPER_ADMIN only)
router.post('/:id/hard-delete', requireAdminRole('SUPER_ADMIN'), hardDeleteUser);
router.delete('/:id/hard', requireAdminRole('SUPER_ADMIN'), hardDeleteUser);

module.exports = router;

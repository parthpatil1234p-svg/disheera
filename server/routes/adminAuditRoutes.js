/**
 * adminAuditRoutes.js — Immutable Enterprise Audit Log Viewer Routes
 *
 * Mounted at: /api/admin/audit-logs
 * Strictly read-only: No POST, PATCH, PUT, or DELETE routes exist.
 *
 * Disheera · Enterprise Administration Service
 */

const express = require('express');
const router = express.Router();
const {
  listAuditLogs,
  listActionTypes,
  getAuditLog
} = require('../controllers/adminAuditController');
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');

// All audit viewer routes require admin authentication & at least MODERATOR role
router.use(verifyAdminAuth);
router.use(requireAdminRole('MODERATOR'));

// GET /api/admin/audit-logs/actions — Distinct action types for dropdown filter
router.get('/actions', listActionTypes);

// GET /api/admin/audit-logs — Paginated list of audit records
router.get('/', listAuditLogs);

// GET /api/admin/audit-logs/:id — Single audit record details
router.get('/:id', getAuditLog);

module.exports = router;

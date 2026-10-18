/**
 * adminRadarRoutes.js — Industrial Proximity Radar Routes
 *
 * All routes guarded by adminHostGuard, adminAuth, and requireAdminRole.
 * Mutations require ADMIN or higher.
 * Disheera · Enterprise Administration Service
 */

const express = require('express');
const router = express.Router();
const {
  listEmployers,
  getEmployer,
  addEmployer,
  updateEmployer,
  deleteEmployer
} = require('../controllers/adminRadarController');
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');
const adminHostGuard = require('../middleware/adminHostGuard');

router.use(adminHostGuard);
router.use(verifyAdminAuth);

// Read-only (MODERATOR, ADMIN, SUPER_ADMIN)
router.get('/employers', requireAdminRole('MODERATOR'), listEmployers);
router.get('/employers/:id', requireAdminRole('MODERATOR'), getEmployer);

// Mutations (ADMIN, SUPER_ADMIN)
router.post('/employers', requireAdminRole('ADMIN'), addEmployer);
router.patch('/employers/:id', requireAdminRole('ADMIN'), updateEmployer);
router.delete('/employers/:id', requireAdminRole('ADMIN'), deleteEmployer);

module.exports = router;

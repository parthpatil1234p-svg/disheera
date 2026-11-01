/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminAlertRoutes.js — WhatsApp & n8n Alert Broadcast Routes
 *
 * Mounted at: /api/admin/alerts
 * Dispatches broadcast notifications with confirmation gates and audit tracking.
 *
 * Disheera · Enterprise Administration Service
 */

const express = require('express');
const router = express.Router();
const {
  getRecipientCount,
  broadcastAlert,
  getAlertHistory
} = require('../controllers/adminAlertController');
const { verifyAdminAuth, requireAdminRole } = require('../middleware/adminAuthMiddleware');

// All alert routes require admin authentication
router.use(verifyAdminAuth);

// GET /api/admin/alerts/recipients-count — Preview eligible recipient count
router.get('/recipients-count', requireAdminRole('MODERATOR'), getRecipientCount);

// GET /api/admin/alerts/history — Past broadcast logs
router.get('/history', requireAdminRole('MODERATOR'), getAlertHistory);

// POST /api/admin/alerts/broadcast — Simulate dryRun or execute live broadcast
router.post('/broadcast', requireAdminRole('MODERATOR'), broadcastAlert);

module.exports = router;

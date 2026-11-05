/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/campusRoutes.js - Routes for College Placement Cell (TPO) Partnerships & Campus OS
 *
 * Disheera · Enterprise Backend Service
 */

const express = require('express');
const router = express.Router();
const {
  submitDemoRequest,
  voiceAiWebhook,
  getCampusLeads,
  getCampusStats,
  getTpoCohortAnalytics,
  getCohortStudents,
  exportCohortCsv,
} = require('../controllers/campusController');

// ── Public Routes ─────────────────────────────────────────────
router.post('/demo-request', submitDemoRequest);
router.post('/voice-ai-webhook', voiceAiWebhook);
router.get('/stats', getCampusStats);
router.get('/tpo-analytics', getTpoCohortAnalytics);
router.get('/cohort-students', getCohortStudents);
router.get('/export-roster-csv', exportCohortCsv);

// ── Pipeline Review Routes ────────────────────────────────────
router.get('/leads', getCampusLeads);

module.exports = router;

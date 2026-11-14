/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/tpoRoutes.js — Campus TPO Cockpit & College OS Endpoints
 *
 * Mounted at: /api/campus/tpo (in server.js)
 *
 * Disheera Technologies Inc.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const tpoAuthController = require('../controllers/tpoAuthController');
const tpoDashboardController = require('../controllers/tpoDashboardController');

// ── Public Authentication & Registry Discovery ─────────────
router.get('/aishe-lookup', tpoAuthController.aisheLookup);
router.post('/register', tpoAuthController.registerTpo);
router.post('/login', tpoAuthController.loginTpo);

// ── Protected Institutional Operations (TPO Access) ─────────
router.post('/verify-otp', protect, tpoAuthController.verifyOtp);
router.get('/profile', protect, tpoAuthController.getProfile);
router.get('/dashboard-telemetry', protect, tpoDashboardController.getDashboardTelemetry);
router.post('/invite-link', protect, tpoDashboardController.generateInviteLink);
router.post('/upload-roster', protect, tpoDashboardController.uploadStudentRoster);

// ── Admin Verification Gate ────────────────────────────────
router.post('/admin/approve', tpoAuthController.approveTpo);

module.exports = router;

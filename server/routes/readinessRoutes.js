/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/readinessRoutes.js — Job Readiness Index & Certificate Routes
 *
 * Mounted at: /api/readiness
 */

const express = require('express');
const router = express.Router();
const { protect, requireStudent } = require('../middleware/authMiddleware');
const { getReadinessStatus, getCertificate, getJobReadyCheck, verifyPublicCertificate } = require('../controllers/readinessController');

// 1. Public Unauthenticated Certificate Verification (Recruiters, LinkedIn, QR Scanners)
router.get('/public-verify/:code', (req, res, next) => {
  req.credentialLookupId = req.params?.code;
  return verifyPublicCertificate(req, res, next);
});
router.post('/public-verify', (req, res, next) => {
  req.credentialLookupId = req.body?.code || req.body?.id || req.body?.serialNumber || req.body?.certificateId || req.body?.certId;
  return verifyPublicCertificate(req, res, next);
});

// 2. Protected Student Routes
router.use(protect, requireStudent);

router.get('/status', getReadinessStatus);
router.get('/certificate', getCertificate);
router.get('/job-ready-check', getJobReadyCheck);

module.exports = router;

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
router.get('/public-verify/:certificateId', verifyPublicCertificate);
router.post('/public-verify', verifyPublicCertificate);

// 2. Protected Student Routes
router.use(protect, requireStudent);

router.get('/status', getReadinessStatus);
router.get('/certificate', getCertificate);
router.get('/job-ready-check', getJobReadyCheck);

module.exports = router;

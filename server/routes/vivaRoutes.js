/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/vivaRoutes.js — API Routes for Code-Grounded Voice Viva Proctoring
 * Disheera · Enterprise Backend Service
 */

const express = require('express');
const router = express.Router();
const vivaController = require('../controllers/vivaController');
const { protect, requireStudent } = require('../middleware/authMiddleware');

// Mount protected endpoints with student role enforcement
router.post('/generate', protect, requireStudent, vivaController.generateViva);
router.post('/evaluate', protect, requireStudent, vivaController.evaluateAnswer);
router.get('/status', protect, requireStudent, vivaController.getVivaStatus);

// Public / demo evaluation endpoint for pre-flight testing and simulation
router.post('/demo-evaluate', vivaController.evaluateAnswer);

module.exports = router;

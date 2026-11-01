/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/assessmentRoutes.js — Student Assessment Endpoint
 *
 * Mounted at: /api/assessment (in server.js)
 *
 * Protected routes:
 *   PUT /api/assessment → protect → validateAssessment → updateAssessment
 */

const express = require('express');
const router = express.Router();
const { protect, requireStudent } = require('../middleware/authMiddleware');
const { validateAssessment } = require('../middleware/validateRequest');
const { updateAssessment, getAssessment } = require('../controllers/assessmentController');

router.use(protect, requireStudent);

router.get('/', getAssessment);
router.put('/', validateAssessment, updateAssessment);
router.post('/', validateAssessment, updateAssessment);

module.exports = router;

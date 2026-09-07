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
const { protect } = require('../middleware/authMiddleware');
const { validateAssessment } = require('../middleware/validateRequest');
const { updateAssessment } = require('../controllers/assessmentController');

router.put('/', protect, validateAssessment, updateAssessment);
router.post('/', protect, validateAssessment, updateAssessment);

module.exports = router;

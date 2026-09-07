/**
 * routes/careerRoutes.js — Career Directory Endpoints
 *
 * Mounted at: /api/careers (in server.js)
 *
 * Public routes:
 *   GET /api/careers        → getCareers (optional query: ?category= & ?search=)
 *   GET /api/careers/:slug  → getCareerBySlug
 */

const express = require('express');
const router = express.Router();
const { getCareers, getCareerBySlug } = require('../controllers/careerController');

router.get('/', getCareers);
router.get('/:slug', getCareerBySlug);

module.exports = router;

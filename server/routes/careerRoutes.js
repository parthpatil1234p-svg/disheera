/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
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
const {
  getCareers,
  getCareerBySlug,
  getRegionalCareers,
  getRegionalCompanies,
  detectLocation,
} = require('../controllers/careerController');

router.get('/regional', getRegionalCareers);
router.get('/regional/detect-location', detectLocation);
router.get('/regional/companies', getRegionalCompanies);
router.get('/', getCareers);
router.get('/:slug', getCareerBySlug);

module.exports = router;


/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/skillRoutes.js — Skill Catalog & Lightcast Taxonomy API Routes
 *
 * Implements Plan #39: Lightcast Taxonomy Routing
 * Endpoints:
 *   GET  /api/skills                  (public — list active skills, filter by category/search/type)
 *   GET  /api/skills/search           (public — real-time autocomplete with alias matching)
 *   GET  /api/skills/resolve          (public — canonical alias resolver)
 *   GET  /api/skills/taxonomy/tree    (public — 3-level hierarchical category tree)
 *   GET  /api/skills/taxonomy/summary (public — taxonomy domain counts & classification summary)
 *   GET  /api/skills/related/:slug    (public — adjacent skills in same cluster)
 *   POST /api/skills/custom           (protected — register custom skill to catalog)
 */

const express = require('express');
const router = express.Router();
const {
  getSkills,
  searchSkillsApi,
  resolveSkillApi,
  getTaxonomyTreeApi,
  getTaxonomySummaryApi,
  getRelatedSkillsApi,
  addCustomSkill,
} = require('../controllers/skillController');
const { protect } = require('../middleware/authMiddleware');

// Lightcast Taxonomy specialized endpoints (must be declared before /:slug routes)
router.get('/search', searchSkillsApi);
router.get('/resolve', resolveSkillApi);
router.get('/taxonomy/tree', getTaxonomyTreeApi);
router.get('/taxonomy/summary', getTaxonomySummaryApi);
router.get('/related/:slug', getRelatedSkillsApi);

// Public catalog listing with optional category & search filters
router.get('/', getSkills);

// Protected custom skill registration
router.post('/custom', protect, addCustomSkill);

module.exports = router;

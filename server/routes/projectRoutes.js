/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * projectRoutes.js - Routes for Practical Project Verification
 * Mounted at /api/projects
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  submitProject,
  getMyProjects,
  getProjectById
} = require('../controllers/projectController');

router.post('/submit', protect, submitProject);
router.get('/my-projects', protect, getMyProjects);
router.get('/:id', protect, getProjectById);

module.exports = router;

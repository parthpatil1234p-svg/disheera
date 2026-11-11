/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * passportRoutes.js - Public Skill Passport Routes
 * Mounted at /api/passport
 */

const express = require('express');
const router = express.Router();
const { getPassportById } = require('../controllers/passportController');

// Public route for recruiters & public verification
router.get('/verify/:id', getPassportById);
router.get('/:id', getPassportById);

module.exports = router;

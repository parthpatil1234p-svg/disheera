/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/evidenceRoutes.js — Canonical Skill Evidence API
 *
 * Mounted at: /api/skills/evidence (in server.js)
 * Single source of truth for the Skill Evidence Ledger, Dashboard Table,
 * Interactive Chips, and Resume Gatekeeper.
 */

const express = require('express');
const router = express.Router();
const { protect, requireStudent } = require('../middleware/authMiddleware');
const { getSkillEvidence } = require('../services/evidenceService');

/**
 * GET /api/skills/evidence
 * Returns the authenticated user's canonical skill evidence ledger.
 */
router.get('/', protect, requireStudent, async (req, res, next) => {
  try {
    const evidenceData = await getSkillEvidence(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Skill evidence ledger retrieved successfully',
      data: evidenceData,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

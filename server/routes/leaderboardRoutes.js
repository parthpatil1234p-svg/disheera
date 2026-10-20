/**
 * routes/leaderboardRoutes.js — Dynamic Leaderboard & Cumulative Merit Score Routes (Plan 46 Phase 4)
 *
 * Exposes:
 * - GET  /api/leaderboard           — Public/Student ranked leaderboard with Top 3 podium
 * - GET  /api/leaderboard/rewards   — Curated Partner Tech Internships & student eligibility
 * - GET  /api/leaderboard/my-standing — Protected student CMS breakdown & rankings
 * - POST /api/leaderboard/recalculate — Admin/automated trigger to recalculate national ranks
 *
 * Disheera Technologies Inc.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prisma');
const { protect, authorize } = require('../middleware/authMiddleware');
const leaderboardController = require('../controllers/leaderboardController');

/**
 * Optional authentication middleware:
 * Populates req.user if a valid Bearer token is provided, but allows unauthenticated visitors.
 */
async function optionalAuth(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.id) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, name: true, email: true, role: true, isVerified: true }
        });
        if (user) {
          req.user = user;
        }
      }
    } catch (_) {
      // Ignore token verification errors in optional auth
    }
    next();
  } catch (err) {
    next();
  }
}

// ── Public / Semi-Public Endpoints ────────────────────────────
// Global and Career-Track Leaderboard with Top 3 Podium
router.get('/', optionalAuth, leaderboardController.getLeaderboard);

// Partner Tech Internship & Placement Rewards
router.get('/rewards', optionalAuth, leaderboardController.getInternshipRewards);

// ── Authenticated Student Endpoints ───────────────────────────
// Individual Student Merit Score Breakdown
router.get('/my-standing', protect, leaderboardController.getMyMeritStanding);

// ── System / Admin Endpoints ──────────────────────────────────
// Recalculate Global Leaderboard (Admin or Protected System Role)
router.post('/recalculate', protect, authorize('admin'), leaderboardController.recalculateLeaderboard);

module.exports = router;

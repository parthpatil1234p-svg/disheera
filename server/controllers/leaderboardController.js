/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/leaderboardController.js — Cumulative Merit Score & Dynamic Leaderboard Controller (Plan 46 Phase 4)
 *
 * Implements:
 * - Public & authenticated Cumulative Merit Score (CMS) Leaderboards
 * - Real-time Top 3 Podium (Gold, Silver, Bronze) and Career Track filtering
 * - Partner Tech Internship Rewards catalog & student eligibility matching
 * - Personalized student merit standing & score breakdown (40% Assignments, 30% Quizzes, 20% Progress, 10% Consistency)
 * - Admin/system trigger for recalculating global ranks
 *
 * Disheera Technologies Inc.
 */

const { prisma } = require('../config/prisma');
const leaderboardService = require('../services/leaderboardService');

/**
 * Helper to determine eligible crest levels for a given topper badge or rank.
 */
function getEligibleCrests(topperBadge, currentRank) {
  const crests = [];
  if (topperBadge === 'GOLD' || currentRank === 1) {
    crests.push('GOLD', 'SILVER', 'BRONZE', 'TOP_10');
  } else if (topperBadge === 'SILVER' || currentRank === 2) {
    crests.push('SILVER', 'BRONZE', 'TOP_10');
  } else if (topperBadge === 'BRONZE' || currentRank === 3) {
    crests.push('BRONZE', 'TOP_10');
  } else if (topperBadge === 'TOP_10' || (currentRank > 0 && currentRank <= 10)) {
    crests.push('TOP_10');
  }
  return crests;
}

/**
 * GET /api/leaderboard
 * Fetches the ranked leaderboard, Top 3 podium, and optional current user standing.
 */
async function getLeaderboard(req, res, next) {
  try {
    const { careerId, limit } = req.query;
    const currentUserId = req.user?.id || null;
    const parsedLimit = Math.min(100, Math.max(5, parseInt(limit, 10) || 50));

    const data = await leaderboardService.getLeaderboardData({
      careerId,
      currentUserId,
      limit: parsedLimit
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error('[leaderboardController.getLeaderboard] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve leaderboard data.',
      error: error.message
    });
  }
}

/**
 * GET /api/leaderboard/rewards
 * Lists curated partner tech internships and placement opportunities.
 */
async function getInternshipRewards(req, res, next) {
  try {
    await leaderboardService.seedInternshipRewards();

    const rewards = await prisma.internshipReward.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    let userBadge = null;
    let userRank = null;
    let eligibleCrests = [];

    if (req.user?.id) {
      const merit = await prisma.studentMeritScore.findUnique({
        where: { userId: req.user.id }
      });
      if (merit) {
        userBadge = merit.topperBadge;
        userRank = merit.currentRank;
        eligibleCrests = getEligibleCrests(userBadge, userRank);
      }
    }

    const decoratedRewards = rewards.map(r => ({
      ...r,
      isEligible: eligibleCrests.includes(r.eligibilityCrest)
    }));

    return res.status(200).json({
      success: true,
      totalRewards: rewards.length,
      userBadge,
      userRank,
      rewards: decoratedRewards
    });
  } catch (error) {
    console.error('[leaderboardController.getInternshipRewards] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve internship rewards.',
      error: error.message
    });
  }
}

/**
 * GET /api/leaderboard/my-standing
 * Returns the authenticated student's individual CMS breakdown and eligibility.
 */
async function getMyMeritStanding(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view merit standing.'
      });
    }

    const meritRecord = await leaderboardService.calculateMeritScoreForStudent(userId);
    const eligibleCrests = getEligibleCrests(meritRecord.topperBadge, meritRecord.currentRank);

    const eligibleRewards = await prisma.internshipReward.findMany({
      where: {
        isActive: true,
        eligibilityCrest: { in: eligibleCrests.length > 0 ? eligibleCrests : ['NONE'] }
      }
    });

    return res.status(200).json({
      success: true,
      standing: {
        totalMeritScore: meritRecord.totalMeritScore,
        currentRank: meritRecord.currentRank,
        isTopper: meritRecord.isTopper,
        topperBadge: meritRecord.topperBadge,
        breakdown: {
          assignments: {
            marks: meritRecord.assignmentMarks,
            weightage: '40%',
            weightedContribution: +(meritRecord.assignmentMarks * 0.40).toFixed(1)
          },
          quizzes: {
            marks: meritRecord.quizMarks,
            weightage: '30%',
            weightedContribution: +(meritRecord.quizMarks * 0.30).toFixed(1)
          },
          roadmapProgress: {
            marks: meritRecord.progressMarks,
            weightage: '20%',
            weightedContribution: +(meritRecord.progressMarks * 0.20).toFixed(1)
          },
          consistency: {
            marks: meritRecord.consistencyMarks,
            weightage: '10%',
            weightedContribution: +(meritRecord.consistencyMarks * 0.10).toFixed(1)
          }
        },
        lastCalculatedAt: meritRecord.lastCalculatedAt
      },
      eligibleRewardsCount: eligibleRewards.length,
      eligibleRewards
    });
  } catch (error) {
    console.error('[leaderboardController.getMyMeritStanding] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student merit standing.',
      error: error.message
    });
  }
}

/**
 * POST /api/leaderboard/recalculate
 * Triggers full recalculation of Cumulative Merit Scores and national ranks.
 */
async function recalculateLeaderboard(req, res, next) {
  try {
    const processedCount = await leaderboardService.recalculateGlobalLeaderboard();

    return res.status(200).json({
      success: true,
      message: 'Global leaderboard and merit scores recalculated successfully.',
      studentsProcessed: processedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[leaderboardController.recalculateLeaderboard] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to recalculate leaderboard.',
      error: error.message
    });
  }
}

module.exports = {
  getLeaderboard,
  getInternshipRewards,
  getMyMeritStanding,
  recalculateLeaderboard
};

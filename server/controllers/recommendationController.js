/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/recommendationController.js — Recommendation Engine Endpoint
 *
 * generateRecommendations  POST /api/recommendations/generate  (protected)
 *
 * Checks if user profile satisfies requirements, loads active careers with populated skills,
 * executes recommendation algorithm, and returns top 3 ranked recommendations.
 */

const User = require('../models/User');
const Career = require('../models/Career');
const Skill = require('../models/Skill');
const Roadmap = require('../models/Roadmap');
const { cacheManager } = require('../utils/cacheManager');
const { generateRecommendations } = require('../services/recommendationService');
const { syncUserGraduation } = require('../services/roadmapService');
const { enrichRecommendationsWithAI } = require('../services/careerInsightService');

async function getCachedActiveCareers() {
  return await cacheManager.wrap('careers:active:all', 3600, async () => {
    return await Career.find({ active: true })
      .select('-__v')
      .populate({
        path: 'requiredSkills.skill',
        select: 'name displayName category description',
      })
      .lean();
  });
}

// ── generateRecommendations ────────────────────────────────────
/**
 * POST /api/recommendations/generate
 * Protected route — computes personalized career recommendations
 */
const getRecommendations = async (req, res, next) => {
  try {
    // 1. Fetch fresh user document
    const user = await User.findById(req.user._id).select('-password').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // 2. Validate profile completeness
    const hasEducation =
      user.education &&
      user.education.course &&
      typeof user.education.course === 'string' &&
      user.education.course.trim() !== '';

    const hasInterest = Array.isArray(user.interests) && user.interests.length > 0;
    const hasSkill = Array.isArray(user.skills) && user.skills.length > 0;

    if (!hasEducation || !hasInterest || !hasSkill) {
      return res.status(400).json({
        success: false,
        message:
          'Please complete your profile with education, at least one interest, and at least one skill before generating recommendations',
      });
    }

    // 3. Load active careers (fast cached in memory)
    const careers = await getCachedActiveCareers();

    if (!careers || careers.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No active career profiles available in the system. Please run database seed.',
      });
    }

    // 4. Auto-sync any completed roadmaps into user profile to ensure verified credentials and skills are elevated
    const completedRoadmaps = await Roadmap.find({
      user: req.user._id,
      status: 'completed',
    });

    const userCompletedSlugs = new Set();
    const completedRoadmapsMap = {};
    let userUpdated = false;

    for (const cr of completedRoadmaps) {
      const slug = (cr.careerSnapshot?.slug || '').toLowerCase().trim();
      const rId = cr._id || cr.id;
      if (slug) {
        userCompletedSlugs.add(slug);
        completedRoadmapsMap[slug] = rId;
      }
      const hasCompletedPath = Array.isArray(user.completedPaths) && user.completedPaths.some(
        cp => String(cp.roadmap || '') === String(rId) || (cp.slug || '').toLowerCase().trim() === slug
      );
      if (!hasCompletedPath) {
        await syncUserGraduation(req.user._id, cr);
        userUpdated = true;
      }
    }

    if (Array.isArray(user.completedPaths)) {
      user.completedPaths.forEach(cp => {
        const s = (cp.slug || cp.role || cp.careerTitle || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').trim();
        if (s) {
          userCompletedSlugs.add(s);
          if (cp.roadmap && !completedRoadmapsMap[s]) {
            completedRoadmapsMap[s] = cp.roadmap;
          }
        }
      });
    }

    const targetUser = userUpdated ? await User.findById(req.user._id).select('-password').lean() : user;

    // 5. Generate Top recommendations using our deterministic mathematical engine (default 5, up to 15)
    const limit = Math.min(Math.max(parseInt(req.body.limit || req.query.limit || 5, 10), 1), 15);
    const baseRecommendations = generateRecommendations(targetUser, careers, limit, {
      completedSlugs: userCompletedSlugs,
      completedRoadmapsMap,
    });
    const crossTrackDiscovery = baseRecommendations.crossTrackDiscovery || null;

    // 5b. Enrich with AI-Powered Career Fit Brief & Market Insights
    const recommendations = await enrichRecommendationsWithAI(baseRecommendations, targetUser);

    // 6. Structure profile summary for response
    const profileSummary = {
      education: {
        course: targetUser.education?.course || '',
        branch: targetUser.education?.branch || '',
        year: targetUser.education?.year || '',
        college: targetUser.education?.college || '',
      },
      interests: targetUser.interests || [],
      skills: (targetUser.skills || []).map((s) => ({
        name: s.name,
        displayName: s.displayName || s.name,
        proficiency: s.proficiency,
      })),
    };

    res.status(200).json({
      success: true,
      message: 'Career recommendations generated successfully',
      data: {
        generatedAt: new Date().toISOString(),
        profileSummary,
        recommendations,
        crossTrackDiscovery,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
};

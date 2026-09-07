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
const { generateRecommendations } = require('../services/recommendationService');

// ── generateRecommendations ────────────────────────────────────
/**
 * POST /api/recommendations/generate
 * Protected route — computes personalized career recommendations
 */
const getRecommendations = async (req, res, next) => {
  try {
    // 1. Fetch fresh user document
    const user = await User.findById(req.user._id).select('-password');

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

    // 3. Load active careers with populated skills
    const careers = await Career.find({ active: true })
      .select('-__v')
      .populate({
        path: 'requiredSkills.skill',
        select: 'name displayName category description',
      });

    if (!careers || careers.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No active career profiles available in the system. Please run database seed.',
      });
    }

    // 4. Generate Top 3 recommendations using our deterministic mathematical engine
    const recommendations = generateRecommendations(user, careers, 3);

    // 5. Structure profile summary for response
    const profileSummary = {
      education: {
        course: user.education.course || '',
        branch: user.education.branch || '',
        year: user.education.year || '',
        college: user.education.college || '',
      },
      interests: user.interests || [],
      skills: (user.skills || []).map((s) => ({
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
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
};

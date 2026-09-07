/**
 * controllers/careerController.js — Career Catalog Endpoints
 *
 * getCareers       GET /api/careers       (public, query: category, search)
 * getCareerBySlug  GET /api/careers/:slug (public)
 */

const Career = require('../models/Career');
const Skill = require('../models/Skill');

// ── getCareers ─────────────────────────────────────────────────
/**
 * GET /api/careers
 * Returns all active careers.
 * Supports query params:
 *   - category: filter by career category (e.g. "development", "data")
 *   - search: fuzzy search across title, shortDescription, and interestTags
 */
const getCareers = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    const query = { active: true };

    // Filter by category
    if (category && typeof category === 'string' && category.trim() !== '') {
      query.category = category.trim().toLowerCase();
    }

    // Filter by search keyword
    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: regex },
        { shortDescription: regex },
        { interestTags: regex },
      ];
    }

    const careers = await Career.find(query)
      .select('-__v')
      .populate({
        path: 'requiredSkills.skill',
        select: 'name displayName category description',
      })
      .sort({ title: 1 });

    res.status(200).json({
      success: true,
      count: careers.length,
      data: { careers },
    });
  } catch (error) {
    next(error);
  }
};

// ── getCareerBySlug ────────────────────────────────────────────
/**
 * GET /api/careers/:slug
 * Returns a single active career by its URL-friendly slug.
 */
const getCareerBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid career slug is required',
      });
    }

    const career = await Career.findOne({
      slug: slug.trim().toLowerCase(),
      active: true,
    })
      .select('-__v')
      .populate({
        path: 'requiredSkills.skill',
        select: 'name displayName category description',
      });

    if (!career) {
      return res.status(404).json({
        success: false,
        message: `Career with slug "${slug}" not found or is currently inactive`,
      });
    }

    res.status(200).json({
      success: true,
      data: { career },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCareers,
  getCareerBySlug,
};

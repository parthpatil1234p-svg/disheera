/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/skillController.js — Standardized Skill Catalog & Lightcast Taxonomy Engine
 *
 * Implements Plan #39: Lightcast Skills Taxonomy Endpoints
 * Endpoints:
 *  - GET  /api/skills                 (public — list skills, filter by category/search/type)
 *  - GET  /api/skills/search          (public — real-time autocomplete with alias matching)
 *  - GET  /api/skills/resolve         (public — canonical alias resolver)
 *  - GET  /api/skills/taxonomy/tree   (public — 3-level hierarchical category tree)
 *  - GET  /api/skills/taxonomy/summary(public — taxonomy domain counts & classification summary)
 *  - GET  /api/skills/related/:slug   (public — adjacent skills in same cluster)
 *  - POST /api/skills/custom          (protected — register custom skill to catalog)
 *
 * 100% Pure Supabase PostgreSQL via Prisma Client · 0% MongoDB Footprint
 * Disheera Technologies Inc.
 */

const Skill = require('../models/Skill');
const skillsData = require('../data/skillsData');
const { cacheManager } = require('../utils/cacheManager');
const {
  resolveCanonicalSkill,
  searchSkills,
  getRelatedSkills,
  getTaxonomyTree,
  getTaxonomySummary,
} = require('../services/skillTaxonomyService');

/**
 * GET /api/skills
 * Returns active skills matching optional filters.
 * Query params:
 *   - category: filter by category or domain
 *   - search: search by name, displayName, or aliases
 *   - type: filter by skill type ('specialized' | 'software' | 'common')
 *   - limit: maximum number of records
 */
const getSkills = async (req, res, next) => {
  try {
    const { category, search, type, limit } = req.query;

    // Fast path: if search query or type filter provided, use taxonomy search engine
    if (search || type) {
      const results = await searchSkills(search || '', {
        category,
        type,
        limit: limit ? parseInt(limit, 10) : 100,
      });

      res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=3600');
      return res.status(200).json({
        success: true,
        count: results.length,
        data: { skills: results },
      });
    }

    const normCategory = (category && typeof category === 'string') ? category.trim().toLowerCase() : '';
    const normLimit = limit ? parseInt(limit, 10) : 0;
    const cacheKey = `skills:list:${normCategory}:${normLimit}`;

    const skills = await cacheManager.wrap(cacheKey, 3600, async () => {
      const query = { active: true };
      if (normCategory) {
        query.category = normCategory;
      }

      let dbSkills = [];
      try {
        dbSkills = await Skill.find(query).select('-__v').sort({ category: 1, displayName: 1 }).lean();
      } catch (dbErr) {
        console.warn('⚠️ [SkillController] Database Skill fetch failed, falling back to static catalog:', dbErr.message);
      }

      // Fallback to static seed data if DB collection empty or offline
      if (!dbSkills || dbSkills.length === 0) {
        let staticList = [...skillsData];
        if (normCategory) {
          staticList = staticList.filter((s) => s.category.toLowerCase() === normCategory);
        }
        dbSkills = staticList;
      }

      if (normLimit > 0) {
        dbSkills = dbSkills.slice(0, normLimit);
      }

      return dbSkills;
    });

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({
      success: true,
      count: skills.length,
      data: { skills },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/skills/search
 * Fast autocomplete search using Lightcast aliases and taxonomy index
 */
const searchSkillsApi = async (req, res, next) => {
  try {
    const { q, category, type, limit } = req.query;
    const results = await searchSkills(q || '', {
      category,
      type,
      limit: limit ? parseInt(limit, 10) : 25,
    });

    res.status(200).json({
      success: true,
      count: results.length,
      query: q || '',
      data: { skills: results },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/skills/resolve
 * Canonical alias resolver: maps "reactjs", "postgres", "k8s" to official Lightcast record
 */
const resolveSkillApi = async (req, res, next) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "name" is required',
      });
    }

    const canonical = await resolveCanonicalSkill(name);
    if (!canonical) {
      return res.status(404).json({
        success: false,
        message: `No canonical skill resolved for "${name}"`,
      });
    }

    res.status(200).json({
      success: true,
      rawInput: name,
      data: { skill: canonical },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/skills/taxonomy/tree
 * Returns 3-level hierarchical category tree (Category -> Subcategory -> Skills)
 */
const getTaxonomyTreeApi = async (req, res, next) => {
  try {
    const tree = await cacheManager.wrap('taxonomy:tree', 3600, () => getTaxonomyTree());
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({
      success: true,
      data: { tree },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/skills/taxonomy/summary
 * Returns overview statistics of the Lightcast taxonomy catalog
 */
const getTaxonomySummaryApi = async (req, res, next) => {
  try {
    const summary = await cacheManager.wrap('taxonomy:summary', 3600, () => getTaxonomySummary());
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/skills/related/:slug
 * Recommends adjacent skills within the same subcategory cluster
 */
const getRelatedSkillsApi = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { limit } = req.query;
    const cacheKey = `skills:related:${String(slug).toLowerCase()}:${limit || 6}`;
    const related = await cacheManager.wrap(cacheKey, 3600, () =>
      getRelatedSkills(slug, limit ? parseInt(limit, 10) : 6)
    );

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({
      success: true,
      targetSkill: slug,
      count: related.length,
      data: { relatedSkills: related },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/skills/custom
 * Register a student's custom skill into the skill catalog.
 */
const addCustomSkill = async (req, res, next) => {
  try {
    const { name, displayName, category, description, type } = req.body;

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Skill display name is required',
      });
    }

    const cleanDisplayName = displayName.trim();
    const cleanName = (name && typeof name === 'string' && name.trim())
      ? name.trim().toLowerCase()
      : cleanDisplayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const validCategories = [
      'Information Technology',
      'Business & Management',
      'Finance & Accounting',
      'Marketing & Communications',
      'Design & Creative',
      'Common & Professional Skills',
      'frontend',
      'backend',
      'database',
      'data',
      'design',
      'security',
      'cloud',
      'soft-skill',
      'tool',
      'other',
    ];

    const cleanCategory = validCategories.find(c => c.toLowerCase() === String(category).toLowerCase()) || 'other';

    // Check if skill already exists in DB
    let existingSkill = await Skill.findOne({ name: cleanName });
    if (existingSkill) {
      return res.status(200).json({
        success: true,
        message: 'Skill already exists in catalog',
        data: { skill: existingSkill },
      });
    }

    const newSkill = await Skill.create({
      name: cleanName,
      displayName: cleanDisplayName,
      category: cleanCategory,
      subcategory: 'Custom User Skills',
      type: type || 'specialized',
      aliases: [cleanName, cleanDisplayName.toLowerCase()],
      description: (description && typeof description === 'string') ? description.slice(0, 300) : `Custom skill: ${cleanDisplayName}`,
      active: true,
    });

    // Invalidate taxonomy and catalog caches
    cacheManager.del('taxonomy:tree');
    cacheManager.del('taxonomy:summary');
    cacheManager.delPrefix('skills:list:');
    cacheManager.delPrefix('skills:related:');

    res.status(201).json({
      success: true,
      message: 'Custom skill registered successfully',
      data: { skill: newSkill },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSkills,
  searchSkillsApi,
  resolveSkillApi,
  getTaxonomyTreeApi,
  getTaxonomySummaryApi,
  getRelatedSkillsApi,
  addCustomSkill,
};

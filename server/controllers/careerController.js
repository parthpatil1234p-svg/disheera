/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/careerController.js - Career Catalog Endpoints
 *
 * getCareers       GET /api/careers       (public, query: category, search)
 * getCareerBySlug  GET /api/careers/:slug (public)
 */

const Career = require('../models/Career');
const Skill = require('../models/Skill');
const { cacheManager } = require('../utils/cacheManager');
const regionalCareersData = require('../data/regionalCareersData');
const regionalCompaniesData = require('../data/regionalCompaniesData');

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
    const { category, search, domain } = req.query;

    const normCategory = (category && typeof category === 'string') ? category.trim().toLowerCase() : '';
    const normSearch = (search && typeof search === 'string') ? search.trim().toLowerCase() : '';
    const normDomain = (domain && typeof domain === 'string') ? domain.trim().toLowerCase() : '';
    const cacheKey = `careers:list:${normDomain}:${normCategory}:${normSearch}`;

    const careers = await cacheManager.wrap(cacheKey, 3600, async () => {
      const query = { active: true };

      // Filter by domain (engineering, business, marketing, creative)
      if (normDomain) {
        query.domain = normDomain;
      }

      // Filter by category
      if (normCategory) {
        query.category = normCategory;
      }

      // Filter by search keyword
      if (normSearch) {
        const regex = new RegExp(normSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [
          { title: regex },
          { shortDescription: regex },
          { interestTags: regex },
        ];
      }

      return await Career.find(query)
        .select('-__v')
        .populate({
          path: 'requiredSkills.skill',
          select: 'name displayName category description',
        })
        .sort({ title: 1 })
        .lean();
    });

    // Public Edge CDN caching header: 5 mins browser, 1 hour CDN edge, stale-while-revalidate 1 day
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');

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

    const normSlug = slug.trim().toLowerCase();
    const cacheKey = `career:slug:${normSlug}`;

    const career = await cacheManager.wrap(cacheKey, 3600, async () => {
      return await Career.findOne({
        slug: normSlug,
        active: true,
      })
        .select('-__v')
        .populate({
          path: 'requiredSkills.skill',
          select: 'name displayName category description',
        })
        .lean();
    });

    let resolvedCareer = career;
    if (!resolvedCareer) {
      // Check regional careers catalog fallback
      const reg = regionalCareersData.find((c) => c.slug === normSlug || c.id === normSlug);
      if (reg) {
        resolvedCareer = reg;
      }
    }

    if (!resolvedCareer) {
      return res.status(404).json({
        success: false,
        message: `Career with slug "${slug}" not found or is currently inactive`,
      });
    }

    // Public Edge CDN caching header
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');

    res.status(200).json({
      success: true,
      data: { career: resolvedCareer },
    });
  } catch (error) {
    next(error);
  }
};

// ── getRegionalCareers ─────────────────────────────────────────
/**
 * GET /api/careers/regional
 * Returns specialized Maharashtra / Jalgaon regional industrial career tracks
 */
const getRegionalCareers = async (req, res, next) => {
  try {
    const { stream } = req.query;
    let list = regionalCareersData;
    if (stream && typeof stream === 'string') {
      const normStream = stream.trim().toLowerCase();
      list = list.filter((c) => c.primaryStream === normStream || c.primaryStream === 'cross');
    }

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({
      success: true,
      count: list.length,
      data: {
        regionalHub: 'North Maharashtra (Jalgaon, Khandesh, Aurangabad & Nashik)',
        careers: list,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── getRegionalCompanies ───────────────────────────────────────
/**
 * GET /api/careers/regional/companies
 * Returns verified regional employers with live GPS Haversine proximity, cluster groups, and filters
 */
const getRegionalCompanies = async (req, res, next) => {
  try {
    const {
      lat,
      lng,
      maxDistanceKm,
      cluster,
      city,
      state,
      verifiedOnly,
      hiringFresher,
      search
    } = req.query;

    const hasCoords = lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
    let userLat = hasCoords ? Number(lat) : null;
    let userLng = hasCoords ? Number(lng) : null;
    let locationSource = hasCoords ? 'gps' : 'hub';

    // Auto-detect from Vercel edge headers if client didn't supply lat/lng
    if (!hasCoords && req.headers['x-vercel-ip-latitude'] && req.headers['x-vercel-ip-longitude']) {
      const vLat = Number(req.headers['x-vercel-ip-latitude']);
      const vLng = Number(req.headers['x-vercel-ip-longitude']);
      if (!isNaN(vLat) && !isNaN(vLng)) {
        userLat = vLat;
        userLng = vLng;
        locationSource = 'vercel-edge-ip';
      }
    }

    const companies = regionalCompaniesData.getCompaniesByProximity({
      userLat,
      userLng,
      maxDistanceKm,
      cluster,
      city,
      state,
      verifiedOnly: verifiedOnly === 'true',
      hiringFresher: hiringFresher === 'true',
      search
    });

    // Detect nearest cluster name from the closest employer
    const nearestClusterName = companies.length > 0 ? companies[0].cluster : 'Pan-India Industrial Network';
    const edgeCity = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null;

    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=86400');
    res.status(200).json({
      success: true,
      count: companies.length,
      data: {
        referenceCity: city || (locationSource === 'gps' ? 'Live GPS Location' : (edgeCity || 'Jalgaon')),
        detectedCoordinates: (userLat != null && userLng != null) ? { lat: userLat, lng: userLng } : null,
        locationSource,
        nearestClusterName,
        totalInRadiusCount: companies.length,
        companies,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/careers/regional/detect-location
 * Extracts user coordinates and city from Vercel edge IP headers or fallback hub
 */
const detectLocation = async (req, res, next) => {
  try {
    const vLat = req.headers['x-vercel-ip-latitude'];
    const vLng = req.headers['x-vercel-ip-longitude'];
    const vCity = req.headers['x-vercel-ip-city'];
    const vRegion = req.headers['x-vercel-ip-country-region'];
    const vCountry = req.headers['x-vercel-ip-country'];

    if (vLat && vLng && !isNaN(Number(vLat)) && !isNaN(Number(vLng))) {
      return res.status(200).json({
        success: true,
        source: 'vercel-edge-ip',
        data: {
          lat: Number(vLat),
          lng: Number(vLng),
          city: vCity ? decodeURIComponent(vCity) : 'Local Region',
          region: vRegion ? decodeURIComponent(vRegion) : 'India',
          country: vCountry || 'IN',
        }
      });
    }

    // Default reference coordinates (Khandesh & MIDC Jalgaon, Maharashtra)
    return res.status(200).json({
      success: true,
      source: 'default-hub',
      data: {
        lat: 21.0077,
        lng: 75.5626,
        city: 'Jalgaon',
        region: 'MH',
        country: 'IN',
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCareers,
  getCareerBySlug,
  getRegionalCareers,
  getRegionalCompanies,
  detectLocation,
};

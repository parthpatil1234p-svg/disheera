/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/skillTaxonomyService.js — Canonical Skill Alias Resolver & Taxonomy Tree
 *
 * Implements Plan #39: Lightcast Skills Taxonomy Service
 * Provides:
 *   1. O(1) in-memory Canonical Alias Resolution (e.g. "ReactJS" -> "react")
 *   2. Fuzzy & prefix search with category / type filtering
 *   3. Subcategory-based adjacent skill cluster recommendations
 *   4. Hierarchical taxonomy tree (Category -> Subcategory -> Skills)
 *
 * 100% Pure Supabase PostgreSQL via Prisma Client · Zero MongoDB Architecture
 * Disheera Technologies Inc.
 */

const path = require('path');
const fs = require('fs');
const { prisma } = require('../config/prisma');

// In-memory alias dictionary: alias -> canonical Skill object
let aliasMap = new Map();
// In-memory canonical map: slug -> canonical Skill object
let canonicalMap = new Map();
// Cache timestamp
let lastLoadedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

/**
 * Normalizes user text for robust comparison
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[._\-\\/+]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Initializes or refreshes in-memory alias dictionary from Supabase or local curated JSON
 */
async function loadTaxonomyCache(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && canonicalMap.size > 0 && now - lastLoadedAt < CACHE_TTL_MS) {
    return;
  }

  try {
    let dbSkills = [];
    try {
      dbSkills = await prisma.skill.findMany({
        where: { active: true },
        select: {
          id: true,
          lightcastId: true,
          name: true,
          displayName: true,
          type: true,
          category: true,
          subcategory: true,
          aliases: true,
          description: true,
        },
      });
    } catch (dbErr) {
      console.warn('⚠️ [TaxonomyService] Database skill fetch failed, fallback to local curated JSON:', dbErr.message);
    }

    // Fallback to local JSON if DB is offline or empty
    if (!dbSkills || dbSkills.length === 0) {
      const jsonPath = path.join(__dirname, '../data/lightcast_curated_skills.json');
      if (fs.existsSync(jsonPath)) {
        dbSkills = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      }
    }

    const newAliasMap = new Map();
    const newCanonicalMap = new Map();

    for (const skill of dbSkills) {
      newCanonicalMap.set(skill.name.toLowerCase(), skill);

      // Register skill name and displayName
      newAliasMap.set(skill.name.toLowerCase(), skill);
      newAliasMap.set(cleanText(skill.name), skill);
      newAliasMap.set(skill.displayName.toLowerCase(), skill);
      newAliasMap.set(cleanText(skill.displayName), skill);

      // Register all configured aliases
      const aliases = Array.isArray(skill.aliases) ? skill.aliases : [];
      for (const alias of aliases) {
        if (typeof alias === 'string' && alias.trim()) {
          newAliasMap.set(alias.toLowerCase().trim(), skill);
          newAliasMap.set(cleanText(alias), skill);
        }
      }
    }

    aliasMap = newAliasMap;
    canonicalMap = newCanonicalMap;
    lastLoadedAt = now;
  } catch (err) {
    console.error('❌ [TaxonomyService] Failed to load taxonomy cache:', err.message);
  }
}

/**
 * Resolves raw input string to its canonical Skill object.
 * Example: "ReactJS", "react.js", "React" -> { name: "react", displayName: "React (JavaScript Library)", ... }
 * Returns null if no match found.
 */
async function resolveCanonicalSkill(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  await loadTaxonomyCache();

  const rawLower = rawInput.toLowerCase().trim();
  if (aliasMap.has(rawLower)) {
    return aliasMap.get(rawLower);
  }

  const cleaned = cleanText(rawInput);
  if (aliasMap.has(cleaned)) {
    return aliasMap.get(cleaned);
  }

  // Common suffix / prefix stripping (e.g. "react framework", "node js developer")
  const stripped = cleaned
    .replace(/\b(library|framework|runtime|language|development|sdk|technology)\b/g, '')
    .trim();
  if (stripped && aliasMap.has(stripped)) {
    return aliasMap.get(stripped);
  }

  return null;
}

/**
 * Searches skills with prefix, substring, and alias matching.
 * Query options:
 *   - query: string
 *   - category: string (optional)
 *   - subcategory: string (optional)
 *   - type: string (optional: specialized, software, common)
 *   - limit: number (default 20)
 */
async function searchSkills(query = '', options = {}) {
  await loadTaxonomyCache();
  const qClean = cleanText(query);
  const { category, subcategory, type, limit = 20 } = options;

  const results = [];
  const seenNames = new Set();

  for (const skill of canonicalMap.values()) {
    if (category && skill.category.toLowerCase() !== category.toLowerCase()) {
      continue;
    }
    if (subcategory && skill.subcategory && skill.subcategory.toLowerCase() !== subcategory.toLowerCase()) {
      continue;
    }
    if (type && skill.type && skill.type.toLowerCase() !== type.toLowerCase()) {
      continue;
    }

    if (!qClean) {
      results.push(skill);
      seenNames.add(skill.name);
      if (results.length >= limit) break;
      continue;
    }

    // Check exact match
    const nameClean = cleanText(skill.name);
    const displayClean = cleanText(skill.displayName);
    const aliases = Array.isArray(skill.aliases) ? skill.aliases : [];

    let score = 0;
    if (nameClean === qClean || displayClean === qClean) {
      score = 100;
    } else if (nameClean.startsWith(qClean) || displayClean.startsWith(qClean)) {
      score = 75;
    } else if (nameClean.includes(qClean) || displayClean.includes(qClean)) {
      score = 50;
    } else {
      for (const al of aliases) {
        const alClean = cleanText(al);
        if (alClean === qClean) {
          score = 90;
          break;
        }
        if (alClean.startsWith(qClean)) {
          score = 65;
          break;
        }
        if (alClean.includes(qClean)) {
          score = 40;
          break;
        }
      }
    }

    if (score > 0 && !seenNames.has(skill.name)) {
      results.push({ ...skill, _score: score });
      seenNames.add(skill.name);
    }
  }

  // Sort by match score descending, then by displayName
  results.sort((a, b) => {
    if (b._score !== a._score) return (b._score || 0) - (a._score || 0);
    return a.displayName.localeCompare(b.displayName);
  });

  return results.slice(0, limit).map(({ _score, ...rest }) => rest);
}

/**
 * Recommends related / adjacent skills in the same taxonomy subcategory.
 * E.g. For 'react' -> returns ['next.js', 'typescript', 'tailwind-css', 'redux']
 */
async function getRelatedSkills(skillSlug, limit = 5) {
  await loadTaxonomyCache();
  const canonical = await resolveCanonicalSkill(skillSlug);
  if (!canonical || !canonical.subcategory) {
    return [];
  }

  const related = [];
  for (const skill of canonicalMap.values()) {
    if (skill.name !== canonical.name && skill.subcategory === canonical.subcategory) {
      related.push(skill);
    }
    if (related.length >= limit) break;
  }

  return related;
}

/**
 * Constructs hierarchical taxonomy tree (Category -> Subcategories -> Skills)
 */
async function getTaxonomyTree() {
  await loadTaxonomyCache();
  const tree = {};

  for (const skill of canonicalMap.values()) {
    const cat = skill.category || 'General';
    const subcat = skill.subcategory || 'Other';

    if (!tree[cat]) {
      tree[cat] = {
        name: cat,
        subcategories: {},
      };
    }

    if (!tree[cat].subcategories[subcat]) {
      tree[cat].subcategories[subcat] = {
        name: subcat,
        skills: [],
      };
    }

    tree[cat].subcategories[subcat].skills.push({
      lightcastId: skill.lightcastId,
      name: skill.name,
      displayName: skill.displayName,
      type: skill.type,
      description: skill.description,
    });
  }

  return tree;
}

/**
 * Returns taxonomy overview summary with category counts
 */
async function getTaxonomySummary() {
  await loadTaxonomyCache();
  const categories = {};
  const types = { specialized: 0, software: 0, common: 0 };

  for (const skill of canonicalMap.values()) {
    categories[skill.category] = (categories[skill.category] || 0) + 1;
    if (types[skill.type] !== undefined) {
      types[skill.type]++;
    }
  }

  return {
    totalSkills: canonicalMap.size,
    categories,
    types,
  };
}

// Preload taxonomy cache on startup
loadTaxonomyCache().catch(() => {});

module.exports = {
  resolveCanonicalSkill,
  searchSkills,
  getRelatedSkills,
  getTaxonomyTree,
  getTaxonomySummary,
  loadTaxonomyCache,
};

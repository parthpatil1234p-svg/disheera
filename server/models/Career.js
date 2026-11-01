/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/Career.js — Pure Prisma ORM Career Model
 *
 * Implements Mongoose-compatible interface for Career directory & recommendations.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel, prisma } = require('./prismaBase');

async function populateRequiredSkills(careers, populates) {
  const needsSkillPopulate = populates.some(
    (p) => (p.path || p) === 'requiredSkills.skill' || (p.path || p) === 'requiredSkills'
  );

  if (!needsSkillPopulate) return;

  // Collect all skill IDs across careers
  const skillIdSet = new Set();
  for (const c of careers) {
    if (Array.isArray(c.requiredSkills)) {
      for (const item of c.requiredSkills) {
        if (item && item.skill && typeof item.skill === 'string') {
          skillIdSet.add(item.skill);
        }
      }
    }
  }

  if (skillIdSet.size === 0) return;

  const skills = await prisma.skill.findMany({
    where: { id: { in: Array.from(skillIdSet) } },
  });

  const skillMap = new Map();
  for (const s of skills) {
    skillMap.set(s.id, { ...s, _id: s.id });
  }

  for (const c of careers) {
    if (Array.isArray(c.requiredSkills)) {
      c.requiredSkills = c.requiredSkills.map((item) => {
        if (item && item.skill && typeof item.skill === 'string' && skillMap.has(item.skill)) {
          return {
            ...item,
            skill: skillMap.get(item.skill),
          };
        }
        return item;
      });
    }
  }
}

const Career = createPrismaModel('Career', {}, {
  postProcess: populateRequiredSkills,
});

module.exports = Career;

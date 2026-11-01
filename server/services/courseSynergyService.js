/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/courseSynergyService.js — Evaluates course relation & synergy for dual active roadmaps
 *
 * Rules:
 * 1. Same Primary Domain (e.g. engineering == engineering)
 * 2. Cross-domain synergy pairs:
 *    - engineering <-> creative (e.g. Web Dev + UI/UX Design)
 *    - engineering <-> business (e.g. Software/Data + Product Management)
 *    - business <-> marketing (e.g. Business Ops + Digital Marketing)
 * 3. Shared required skill overlap >= 2
 *
 * Disheera · Enterprise Backend Service
 */

function isRelatedCourse(careerA, careerB) {
  if (!careerA || !careerB) return false;

  const domainA = (careerA.domain || careerA.primaryStream || 'engineering').toLowerCase().trim();
  const domainB = (careerB.domain || careerB.primaryStream || 'engineering').toLowerCase().trim();

  // 1. Same Primary Domain
  if (domainA === domainB) return true;

  // 2. Defined Synergistic Cross-Domain Pairs
  const SYNERGY_PAIRS = [
    ['engineering', 'creative'],
    ['engineering', 'business'],
    ['business', 'marketing'],
  ];
  const isSynergisticDomain = SYNERGY_PAIRS.some(
    ([d1, d2]) => (domainA === d1 && domainB === d2) || (domainA === d2 && domainB === d1)
  );
  if (isSynergisticDomain) return true;

  // 3. Shared Skill Overlap >= 2
  const getSkills = (c) => (c.requiredSkills || []).map(rs => 
    (rs.skill?.name || rs.skillName || rs.name || (typeof rs.skill === 'string' ? rs.skill : '')).toLowerCase().trim()
  ).filter(Boolean);

  const skillsA = getSkills(careerA);
  const skillsB = getSkills(careerB);
  const shared = skillsA.filter(s => skillsB.includes(s));

  return shared.length >= 2;
}

module.exports = { isRelatedCourse };

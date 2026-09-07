/**
 * services/recommendationService.js — Career Recommendation & Skill-Gap Analysis Engine
 *
 * Deterministic, mathematical recommendation engine.
 * Computes:
 *   Career Match Score = (Skill Match × 0.60) + (Interest Match × 0.25) + (Education Match × 0.15)
 *
 * Rules:
 *  - 100% backend-computed; no external AI APIs.
 *  - Categorizes required skills into matchedSkills, weakSkills, missingSkills.
 *  - Generates deterministic natural language explanations.
 *  - Sorts by finalScore descending (tie-break by skillMatch).
 *  - Returns top 3 recommendations by default.
 */

// Importance weight points mapping
const IMPORTANCE_WEIGHTS = {
  high: 3,
  medium: 2,
  low: 1,
};

// Proficiency numeric score mapping
const PROFICIENCY_VALUES = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

/**
 * Normalizes a string for robust matching: trimmed, lowercase, stripped of excessive punctuation
 */
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.trim().toLowerCase();
};

/**
 * Calculates Skill Match score (0–100) and classifies skills into matched, weak, and missing
 */
const calculateSkillScore = (userSkillsMap, careerRequiredSkills) => {
  if (!careerRequiredSkills || careerRequiredSkills.length === 0) {
    return {
      skillScore: 0,
      matchedSkills: [],
      weakSkills: [],
      missingSkills: [],
    };
  }

  let totalImportanceWeights = 0;
  let totalWeightedEarnedPoints = 0;

  const matchedSkills = [];
  const weakSkills = [];
  const missingSkills = [];

  careerRequiredSkills.forEach((reqSkill) => {
    // Populated skill object from Mongoose
    const skillDoc = reqSkill.skill || {};
    const skillName = normalizeText(skillDoc.name || '');
    const displayName = skillDoc.displayName || skillName || 'Unknown Skill';
    const category = skillDoc.category || 'other';

    const importance = normalizeText(reqSkill.importance) || 'medium';
    const requiredProficiency = normalizeText(reqSkill.requiredProficiency) || 'beginner';

    const importanceWeight = IMPORTANCE_WEIGHTS[importance] || 2;
    const requiredProficiencyValue = PROFICIENCY_VALUES[requiredProficiency] || 1;

    totalImportanceWeights += importanceWeight;

    // Check if user has this skill (lookup by normalized name)
    const userSkill = userSkillsMap.get(skillName);

    if (!userSkill) {
      // User does NOT have this required skill
      missingSkills.push({
        name: skillName,
        displayName,
        category,
        importance,
        requiredProficiency,
      });
    } else {
      const userProficiency = normalizeText(userSkill.proficiency) || 'beginner';
      const userProficiencyValue = PROFICIENCY_VALUES[userProficiency] || 1;

      // Ratio capped at 1.0 (over-qualification does not artificially inflate score)
      const proficiencyRatio = Math.min(userProficiencyValue / requiredProficiencyValue, 1);
      const weightedEarned = importanceWeight * proficiencyRatio;
      totalWeightedEarnedPoints += weightedEarned;

      const skillDetail = {
        name: skillName,
        displayName,
        category,
        importance,
        requiredProficiency,
        userProficiency,
      };

      if (userProficiencyValue >= requiredProficiencyValue) {
        matchedSkills.push(skillDetail);
      } else {
        weakSkills.push(skillDetail);
      }
    }
  });

  const skillScore =
    totalImportanceWeights > 0
      ? (totalWeightedEarnedPoints / totalImportanceWeights) * 100
      : 0;

  return {
    skillScore: Math.min(Math.max(skillScore, 0), 100),
    matchedSkills,
    weakSkills,
    missingSkills,
  };
};

/**
 * Calculates Interest Match score (0–100)
 */
const calculateInterestScore = (userInterestsSet, careerInterestTags) => {
  if (!careerInterestTags || careerInterestTags.length === 0) {
    return 50; // Neutral fallback when career has no tags defined
  }

  let matchesCount = 0;
  careerInterestTags.forEach((tag) => {
    const normalizedTag = normalizeText(tag);
    if (userInterestsSet.has(normalizedTag)) {
      matchesCount++;
    }
  });

  const ratio = matchesCount / careerInterestTags.length;
  return Math.min(Math.max(ratio * 100, 0), 100);
};

/**
 * Calculates Education Match score (0–100)
 */
const calculateEducationScore = (education, educationPreferences) => {
  if (!education || (!education.course && !education.branch)) {
    return 50; // Neutral fallback
  }

  if (!educationPreferences || educationPreferences.length === 0) {
    return 50; // Neutral fallback
  }

  const courseNorm = normalizeText(education.course || '');
  const branchNorm = normalizeText(education.branch || '');
  const combinedUserEdu = `${courseNorm} ${branchNorm}`.trim();

  if (!combinedUserEdu) return 50;

  // Check if any career education preference matches user's course or branch
  const isMatch = educationPreferences.some((pref) => {
    const prefNorm = normalizeText(pref);
    return (
      combinedUserEdu.includes(prefNorm) ||
      prefNorm.includes(courseNorm) ||
      (branchNorm && prefNorm.includes(branchNorm))
    );
  });

  return isMatch ? 100 : 50;
};

/**
 * Generates deterministic natural language explanation without any external AI API
 */
const generateExplanation = (careerTitle, finalScore, matchedSkills, missingSkills, weakSkills) => {
  let tonePrefix = '';
  if (finalScore >= 75) {
    tonePrefix = `Strong match for your profile with a high ${finalScore}% alignment.`;
  } else if (finalScore >= 50) {
    tonePrefix = `Good potential match (${finalScore}%) based on your current background.`;
  } else {
    tonePrefix = `Emerging opportunity (${finalScore}% match) with a clear roadmap of skills to build.`;
  }

  let matchedText = '';
  if (matchedSkills.length > 0) {
    const sampleNames = matchedSkills.slice(0, 3).map((s) => s.displayName).join(', ');
    matchedText = ` You already have strong competence in ${sampleNames}.`;
  } else {
    matchedText = ` You have relevant interests aligned with this role.`;
  }

  let nextFocusText = '';
  const priorities = [...weakSkills, ...missingSkills].filter((s) => s.importance === 'high');
  const targetFocus = priorities.length > 0 ? priorities : [...weakSkills, ...missingSkills];

  if (targetFocus.length > 0) {
    const focusNames = targetFocus.slice(0, 2).map((s) => s.displayName).join(' and ');
    nextFocusText = ` To become fully job-ready as a ${careerTitle}, focus next on mastering ${focusNames}.`;
  } else {
    nextFocusText = ` You meet all core requirements for entry-level ${careerTitle} roles!`;
  }

  return `${tonePrefix}${matchedText}${nextFocusText}`;
};

/**
 * Main recommendation generator function
 *
 * @param {Object} user - User document containing education, interests, skills
 * @param {Array} careers - Array of active Career documents with populated requiredSkills.skill
 * @param {Number} [limit=3] - Maximum number of recommendations to return
 * @returns {Array} Ranked recommendations with score breakdowns and skill gaps
 */
const generateRecommendations = (user, careers, limit = 3) => {
  // 1. Prepare User Data Lookups
  const userSkillsMap = new Map();
  if (Array.isArray(user.skills)) {
    user.skills.forEach((s) => {
      const name = normalizeText(s.name);
      if (name) {
        userSkillsMap.set(name, {
          name,
          displayName: s.displayName || s.name,
          proficiency: normalizeText(s.proficiency) || 'beginner',
        });
      }
    });
  }

  const userInterestsSet = new Set();
  if (Array.isArray(user.interests)) {
    user.interests.forEach((i) => {
      const normalized = normalizeText(i);
      if (normalized) userInterestsSet.add(normalized);
    });
  }

  const userEducation = user.education || {};

  // 2. Score Each Active Career
  const scoredCareers = careers.map((career) => {
    // A. Skill Match (60%)
    const { skillScore, matchedSkills, weakSkills, missingSkills } =
      calculateSkillScore(userSkillsMap, career.requiredSkills);

    // B. Interest Match (25%)
    const interestScore = calculateInterestScore(userInterestsSet, career.interestTags);

    // C. Education Match (15%)
    const educationScore = calculateEducationScore(userEducation, career.educationPreferences);

    // D. Weighted Final Score (0–100)
    const rawFinalScore =
      skillScore * 0.6 + interestScore * 0.25 + educationScore * 0.15;
    const finalScore = Math.min(Math.max(Math.round(rawFinalScore), 0), 100);

    const scoreBreakdown = {
      skillMatch: Math.round(skillScore),
      interestMatch: Math.round(interestScore),
      educationMatch: Math.round(educationScore),
    };

    // E. Why Recommended Explanation
    const whyRecommended = generateExplanation(
      career.title,
      finalScore,
      matchedSkills,
      missingSkills,
      weakSkills
    );

    return {
      career: {
        id: career._id,
        title: career.title,
        slug: career.slug,
        shortDescription: career.shortDescription,
        category: career.category,
        icon: career.icon,
        color: career.color,
      },
      finalScore,
      scoreBreakdown,
      whyRecommended,
      matchedSkills,
      weakSkills,
      missingSkills,
    };
  });

  // 3. Sort by finalScore desc (tie-break by skillMatch desc)
  scoredCareers.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    return b.scoreBreakdown.skillMatch - a.scoreBreakdown.skillMatch;
  });

  // 4. Assign ranks and limit results
  const topRecommendations = scoredCareers.slice(0, limit).map((rec, index) => ({
    rank: index + 1,
    ...rec,
  }));

  return topRecommendations;
};

module.exports = {
  generateRecommendations,
  calculateSkillScore,
  calculateInterestScore,
  calculateEducationScore,
};

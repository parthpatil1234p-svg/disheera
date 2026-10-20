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

      // 4-Tier Skill Passport confidence weight (Pillar 7)
      // Tier 0: Self-rated (0.70)
      // Tier 1: Quiz-verified (0.85; 0.75 if unconfirmed telemetry)
      // Tier 2: GitHub Code-verified AST scan (1.00)
      // Tier 3: Spoken Interview-verified (1.05)
      let confidenceWeight = 0.70;
      let passportTier = userSkill.verificationTier || 'self_rated';
      const status = userSkill.verificationStatus || 'verified';

      if (userSkill.isCodeVerified || passportTier === 'project_verified') {
        passportTier = 'project_verified';
        confidenceWeight = 1.00;
      } else if (passportTier === 'interview_verified') {
        confidenceWeight = 1.05;
      } else if (userSkill.isQuizVerified || passportTier === 'quiz_verified') {
        passportTier = 'quiz_verified';
        confidenceWeight = status === 'unconfirmed' ? 0.75 : 0.85;
      }

      // Ratio capped at 1.0 (over-qualification does not artificially inflate score)
      const proficiencyRatio = Math.min(userProficiencyValue / requiredProficiencyValue, 1);
      const weightedEarned = importanceWeight * proficiencyRatio * confidenceWeight;
      totalWeightedEarnedPoints += weightedEarned;

      const skillDetail = {
        name: skillName,
        displayName,
        category,
        importance,
        requiredProficiency,
        userProficiency,
        isQuizVerified: Boolean(userSkill.isQuizVerified),
        isCodeVerified: Boolean(userSkill.isCodeVerified),
        verificationTier: passportTier,
        verificationStatus: status,
        selfRatedProficiency: userSkill.selfRatedProficiency || null,
        quizGaps: Array.isArray(userSkill.quizGaps) ? userSkill.quizGaps : [],
        confidenceScore: Math.round(confidenceWeight * 100),
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
const generateRecommendations = (user, careers, limit = 3, meta = {}) => {
  const completedSlugs = meta.completedSlugs || new Set();
  const completedRoadmapsMap = meta.completedRoadmapsMap || {};

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
          selfRatedProficiency: s.selfRatedProficiency || null,
          isQuizVerified: Boolean(s.isQuizVerified),
          isCodeVerified: Boolean(s.isCodeVerified),
          verifiedProficiency: s.verifiedProficiency || null,
          quizScore: s.quizScore != null ? s.quizScore : null,
          quizGaps: Array.isArray(s.quizGaps) ? s.quizGaps : [],
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

  // 2. Resolve Primary Stream
  let primaryStream = normalizeText(user.primaryStream || user.stream || (user.education && user.education.stream) || '');
  if (primaryStream === 'tech') primaryStream = 'engineering';
  if (!primaryStream) {
    const course = normalizeText(userEducation?.course || '');
    const cleanCourse = course.replace(/[^a-z0-9]/g, '');
    if (cleanCourse.includes('bba') || cleanCourse.includes('bcom') || cleanCourse.includes('mba') || cleanCourse.includes('finance') || cleanCourse.includes('economics') || cleanCourse.includes('commerce')) {
      primaryStream = 'business';
    } else if (cleanCourse.includes('marketing') || cleanCourse.includes('comm') || cleanCourse.includes('media')) {
      primaryStream = 'marketing';
    } else if (cleanCourse.includes('design') || cleanCourse.includes('arts') || cleanCourse.includes('animation') || cleanCourse.includes('finearts')) {
      primaryStream = 'creative';
    } else if (cleanCourse.includes('bca') || cleanCourse.includes('btech') || cleanCourse.includes('mca') || cleanCourse.includes('cs') || cleanCourse.includes('engineering')) {
      primaryStream = 'engineering';
    }
  }

  // 3. Strict Candidate Stream Isolation:
  // If the user selected a dedicated primary stream (engineering, business, marketing, creative),
  // candidate careers MUST be strictly restricted to that stream only.
  // Foreign stream careers are never scored or suggested.
  let candidateCareers = careers;
  if (primaryStream && primaryStream !== 'cross') {
    const streamFiltered = careers.filter((c) => {
      const cDomain = normalizeText(c.domain || 'engineering');
      return cDomain === primaryStream;
    });
    if (streamFiltered.length > 0) {
      candidateCareers = streamFiltered;
    }
  }

  // 4. Score Each Active Candidate Career
  const scoredCareers = candidateCareers.map((career) => {
    // A. Skill Match (60%)
    const { skillScore, matchedSkills, weakSkills, missingSkills } =
      calculateSkillScore(userSkillsMap, career.requiredSkills);

    // B. Interest Match (25%)
    const interestScore = calculateInterestScore(userInterestsSet, career.interestTags);

    // C. Education Match (15%)
    const educationScore = calculateEducationScore(userEducation, career.educationPreferences);

    // D. Weighted Final Score (0–100)
    let rawFinalScore =
      skillScore * 0.6 + interestScore * 0.25 + educationScore * 0.15;

    // Domain alignment weighting
    const careerDomain = normalizeText(career.domain || 'engineering');
    if (primaryStream && primaryStream !== 'cross') {
      if (careerDomain === primaryStream) {
        rawFinalScore = Math.min(100, rawFinalScore * 1.15 + 5);
      }
    }

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

    // F. Rule-Based Skill Coverage Ratio & Status-Aware Heading (Pillar 5)
    const totalRequired = Array.isArray(career.requiredSkills) ? career.requiredSkills.length : 1;
    const verifiedMatchingCount = [...matchedSkills, ...weakSkills].filter((s) =>
      s.isQuizVerified || s.isCodeVerified || s.verificationTier === 'project_verified' ||
      s.verificationTier === 'interview_verified' || s.verificationTier === 'quiz_verified'
    ).length;
    const coverageRatio = Math.min(100, Math.round((verifiedMatchingCount / Math.max(1, totalRequired)) * 100));

    const profileStatus = user?.profileStatus?.status || 'learning';
    const currentRole = normalizeText(user?.profileStatus?.currentRole || '');
    let sectionHeading = 'Your next path';

    if (profileStatus === 'working') {
      if (currentRole && normalizeText(career.title).includes(currentRole)) {
        sectionHeading = 'Grow in your role';
      } else if (coverageRatio >= 40) {
        sectionHeading = 'Explore a switch';
      } else {
        sectionHeading = 'Explore alternative career';
      }
    } else if (profileStatus === 'job_seeking') {
      sectionHeading = "Roles you're closest to";
    } else {
      sectionHeading = 'Your next path';
    }

    const estimatedWeeks = Math.max(2, missingSkills.length * 2);
    const careerSlugNorm = normalizeText(career.slug);
    const careerTitleNorm = normalizeText(career.title);
    const isGraduated = completedSlugs.has(careerSlugNorm) || completedSlugs.has(careerTitleNorm);
    const completedRoadmapId = completedRoadmapsMap[careerSlugNorm] || null;

    return {
      career: {
        id: career._id,
        title: career.title,
        slug: career.slug,
        shortDescription: career.shortDescription,
        category: career.category,
        domain: careerDomain,
        icon: career.icon,
        color: career.color,
      },
      finalScore,
      coverageRatio,
      sectionHeading: isGraduated ? 'Graduated Pathway' : sectionHeading,
      isGraduated: Boolean(isGraduated),
      isCompleted: Boolean(isGraduated),
      completedRoadmapId,
      estimatedWeeks,
      verifiedSkillsCount: verifiedMatchingCount,
      totalRequiredSkillsCount: totalRequired,
      scoreBreakdown,
      whyRecommended,
      matchedSkills,
      weakSkills,
      missingSkills,
    };
  });

  // 5. Sort by recommendation priority:
  // Non-graduated active learning targets are prioritized at the top of recommendations!
  // Completed/graduated tracks are achievements, not new courses to enroll in.
  scoredCareers.sort((a, b) => {
    if (a.isGraduated !== b.isGraduated) {
      return a.isGraduated ? 1 : -1;
    }
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    return b.scoreBreakdown.skillMatch - a.scoreBreakdown.skillMatch;
  });

  // 6. Assign ranks and limit results
  const topRecommendations = scoredCareers.slice(0, limit).map((rec, index) => ({
    rank: index + 1,
    ...rec,
  }));

  // 7. Intelligent Alternative Cross-Track Discovery Bridge
  // STRICT RULE: Only compute and provide bridge if user selected 'cross' (cross-disciplinary stream).
  // When a student selected a dedicated stream (business, marketing, creative, or engineering),
  // crossTrackDiscovery is strictly null to ensure 100% pure focus on their chosen stream.
  let crossTrackDiscovery = null;
  if (primaryStream === 'cross') {
    const topDomain = topRecommendations[0]?.career?.domain || 'engineering';
    const crossTrackCandidate = scoredCareers.find(c => c.career.domain !== topDomain && c.finalScore >= 15);
    if (crossTrackCandidate) {
      const domainNames = {
        engineering: 'Engineering & Technology',
        business: 'Business & Finance',
        marketing: 'Digital Marketing & Growth',
        creative: 'Design & Creative',
      };
      const targetDomainLabel = domainNames[crossTrackCandidate.career.domain] || crossTrackCandidate.career.domain;
      const bridgeReason = crossTrackCandidate.career.domain === 'business'
        ? 'Transfer your analytical problem-solving into revenue, finance & operational leadership.'
        : crossTrackCandidate.career.domain === 'marketing'
        ? 'Apply technical and analytical reasoning to run algorithmic growth and conversion architectures.'
        : crossTrackCandidate.career.domain === 'creative'
        ? 'Combine structural thinking with spatial brand & visual asset storytelling.'
        : 'Bridge domain and analytical principles with software automation and engineering scalability.';

      crossTrackDiscovery = {
        career: crossTrackCandidate.career,
        finalScore: crossTrackCandidate.finalScore,
        matchScore: crossTrackCandidate.finalScore,
        scoreBreakdown: crossTrackCandidate.scoreBreakdown,
        bridgeReason: bridgeReason,
        note: `💡 Cross-Domain Discovery: Because of your transferable problem-solving & analytical skills, you also match ${crossTrackCandidate.finalScore}% with ${crossTrackCandidate.career.title} in the ${targetDomainLabel} track.`,
        matchedSkills: crossTrackCandidate.matchedSkills.map(s => s.displayName || s.name),
        gapSkills: crossTrackCandidate.missingSkills.slice(0, 3).map(s => s.displayName || s.name),
      };
    }
  }
  topRecommendations.crossTrackDiscovery = crossTrackDiscovery;

  return topRecommendations;
};

module.exports = {
  generateRecommendations,
  getRuleBasedRecommendations: generateRecommendations,
  calculateSkillScore,
  calculateInterestScore,
  calculateEducationScore,
};

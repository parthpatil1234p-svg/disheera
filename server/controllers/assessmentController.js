/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/assessmentController.js — Student Profile Assessment Endpoints
 *
 * updateAssessment  PUT /api/assessment  (protected)
 *
 * Saves student academics, interests, current skills (with proficiency levels),
 * and career goals.
 * Computes profileCompleted = true when minimum requirements are satisfied.
 */

const User = require('../models/User');
const { normalizeSkillKey } = require('../data/quizQuestions');
const { cacheManager } = require('../utils/cacheManager');

const ALLOWED_ASSESSMENT_FIELDS = [
  'name',
  'education',
  'interests',
  'skills',
  'careerGoals',
  'hasCompletedSkillVerification',
  'primaryStream',
  'encryptedVault'
];

const FORBIDDEN_ADMIN_FIELDS = [
  'profileStatus',
  'isSuspended',
  'isDeleted',
  'passportRevocation',
  'suspensionReason',
  'suspendedAt',
  'role',
  'isAdmin',
  'isVerified',
  'jobReadiness',
  'adminRole',
  'failedLoginAttempts',
  'lockedUntil',
];

// ── Authoritative Skill-to-Stream Map for Server-Side Enforcement ──
const SKILL_STREAM_MAP = {
  // Frontend
  'html': ['engineering', 'marketing'],
  'css': ['engineering'],
  'javascript': ['engineering'],
  'responsive-design': ['engineering'],
  'react': ['engineering'],
  'bootstrap': ['engineering'],
  'typescript': ['engineering'],
  'next.js': ['engineering'],
  'tailwind-css': ['engineering'],
  'flutter': ['engineering'],

  // Backend
  'node.js': ['engineering'],
  'express.js': ['engineering'],
  'rest-apis': ['engineering'],
  'authentication': ['engineering'],
  'python': ['engineering'],
  'fastapi': ['engineering'],
  'graphql': ['engineering'],
  'java': ['engineering'],
  'spring-boot': ['engineering'],
  'kafka': ['engineering'],
  'csharp': ['engineering'],
  'cpp': ['engineering'],

  // Database
  'mongodb': ['engineering'],
  'sql': ['engineering', 'business'],
  'mysql': ['engineering'],
  'database-design': ['engineering'],
  'postgresql': ['engineering'],
  'redis': ['engineering'],

  // Data & Analytics
  'excel': ['business', 'marketing', 'engineering'],
  'statistics': ['business', 'engineering', 'marketing'],
  'power-bi': ['business', 'engineering', 'marketing'],
  'data-visualization': ['business', 'engineering', 'marketing'],
  'data-cleaning': ['business', 'engineering'],
  'pandas': ['engineering'],

  // AI & ML
  'langchain': ['engineering'],
  'generative-ai': ['engineering'],
  'pytorch': ['engineering'],
  'tensorflow': ['engineering'],
  'scikit-learn': ['engineering'],
  'deep-learning': ['engineering'],
  'natural-language-processing': ['engineering'],

  // Security
  'networking': ['engineering'],
  'linux': ['engineering'],
  'cybersecurity-fundamentals': ['engineering'],
  'ethical-hacking': ['engineering'],
  'owasp-basics': ['engineering'],

  // Cloud & DevOps
  'docker': ['engineering'],
  'kubernetes': ['engineering'],
  'aws': ['engineering'],
  'terraform': ['engineering'],
  'firebase': ['engineering'],

  // Mobile
  'react-native': ['engineering'],
  'dart': ['engineering'],

  // QA & Testing
  'cypress': ['engineering'],
  'selenium': ['engineering'],
  'playwright': ['engineering'],
  'postman': ['engineering'],

  // Gaming
  'unity': ['engineering'],
  'unreal-engine': ['engineering'],

  // Web3 & Blockchain
  'solidity': ['engineering'],
  'web3js': ['engineering'],
  'smart-contracts': ['engineering'],

  // Tools & CI/CD
  'git': ['engineering'],
  'github': ['engineering'],
  'ci-cd': ['engineering'],

  // Product & Agile
  'agile-scrum': ['business', 'engineering'],
  'product-management': ['business', 'engineering'],
  'user-stories': ['business', 'engineering'],

  // Finance & Business Operations
  'financial-modeling': ['business'],
  'dcf-valuation': ['business'],
  'accounting': ['business'],
  'business-operations': ['business'],
  'management-consulting': ['business'],
  'market-research': ['business', 'marketing', 'creative'],

  // Digital Marketing
  'meta-ads': ['marketing'],
  'google-ads': ['marketing'],
  'seo': ['marketing'],
  'content-marketing': ['marketing', 'creative'],
  'social-media-growth': ['marketing'],
  'google-analytics': ['marketing'],

  // Creative, Media & Design
  'brand-identity': ['creative', 'marketing'],
  'adobe-illustrator': ['creative'],
  'motion-graphics': ['creative'],
  'copywriting': ['creative', 'marketing'],
  'blender': ['creative'],
  'typography': ['creative'],
  'figma': ['creative', 'engineering'],
  'wireframing': ['creative', 'engineering'],
  'prototyping': ['creative', 'engineering'],
  'user-research': ['creative', 'engineering'],
  'visual-design': ['creative', 'marketing', 'engineering'],

  // Universal Soft Skills
  'problem-solving': ['engineering', 'business', 'marketing', 'creative', 'cross'],
  'communication': ['engineering', 'business', 'marketing', 'creative', 'cross'],
  'teamwork': ['engineering', 'business', 'marketing', 'creative', 'cross'],
};

const INTEREST_STREAM_MAP = {
  // Engineering
  'web development': ['engineering'],
  'app development': ['engineering'],
  'artificial intelligence': ['engineering'],
  'cybersecurity': ['engineering'],
  'cloud computing': ['engineering'],
  'backend engineering': ['engineering'],
  'data science': ['engineering'],
  'qa testing': ['engineering'],
  'gaming': ['engineering'],
  'blockchain': ['engineering'],
  'cloud security': ['engineering'],
  'product management': ['engineering', 'business'],

  // Business
  'financial modeling': ['business'],
  'finance': ['business'],
  'valuation': ['business'],
  'business operations': ['business'],
  'management consulting': ['business'],
  'business strategy': ['business'],

  // Marketing
  'digital marketing': ['marketing'],
  'advertising': ['marketing'],
  'seo': ['marketing'],
  'content marketing': ['marketing', 'creative'],
  'social media': ['marketing'],
  'viral growth': ['marketing'],

  // Creative
  'design': ['creative', 'engineering'],
  'branding': ['creative', 'marketing'],
  'motion graphics': ['creative'],
  '3d modeling': ['creative'],
  'copywriting': ['creative', 'marketing'],
  'visual storytelling': ['creative'],

  // Transferable Cross-Domain
  'data analysis': ['engineering', 'business'],
  'market research': ['business', 'marketing'],
  'problem solving': ['engineering', 'business', 'marketing', 'creative', 'cross'],
};

const isSkillAllowedForStream = (skillKey, stream) => {
  if (!stream || stream === 'cross') return true;
  const canonical = (skillKey || '').trim().toLowerCase();
  const allowed = SKILL_STREAM_MAP[canonical];
  if (allowed) {
    return allowed.includes(stream);
  }
  // Custom skills that don't match any known skill are permitted
  return true;
};

const isInterestAllowedForStream = (interestKey, stream) => {
  if (!stream || stream === 'cross') return true;
  const canonical = (interestKey || '').trim().toLowerCase();
  const allowed = INTEREST_STREAM_MAP[canonical];
  if (allowed) {
    return allowed.includes(stream);
  }
  return true;
};

// ── updateAssessment ───────────────────────────────────────────
/**
 * PUT /api/assessment
 * Updates user assessment data and sets profileCompleted flag.
 */
const updateAssessment = async (req, res, next) => {
  try {
    const forbiddenFound = Object.keys(req.body).find(
      (k) => FORBIDDEN_ADMIN_FIELDS.includes(k) || k.startsWith('profileStatus.') || k.startsWith('passportRevocation.')
    );
    if (forbiddenFound) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ADMIN_FIELD',
        message: `Modification of administrative field "${forbiddenFound}" is strictly prohibited.`,
      });
    }

    const updates = {};
    ALLOWED_ASSESSMENT_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No assessment data provided to update',
      });
    }

    if (updates.name && typeof updates.name === 'string') {
      updates.name = updates.name.trim();
    }

    const activeStream = updates.primaryStream || (req.user && req.user.primaryStream) || 'cross';

    // Fetch authoritative existing user from DB to preserve verified skill credentials
    const existingUser = await User.findById(req.user._id);
    const existingDbSkills = Array.isArray(existingUser?.skills) ? existingUser.skills : [];
    const existingDbMap = new Map();
    existingDbSkills.forEach((s) => {
      const k = normalizeSkillKey(s.name || '');
      if (k) existingDbMap.set(k, s);
    });

    // Standardize skills casing and preserve verification status with canonical deduplication
    if (Array.isArray(updates.skills)) {
      const skillsMap = new Map();
      updates.skills.forEach((s) => {
        const rawName = typeof s.name === 'string' ? s.name.trim().toLowerCase() : '';
        if (!rawName || rawName.includes('@') || rawName.includes('.com') || rawName.length > 30) return;
        const canonicalKey = normalizeSkillKey(rawName);

        const existingDb = existingDbMap.get(canonicalKey);
        const isQuizVerified = Boolean(s.isQuizVerified || existingDb?.isQuizVerified);
        const isCodeVerified = Boolean(s.isCodeVerified || existingDb?.isCodeVerified);

        const formatted = {
          name: canonicalKey,
          displayName: typeof s.displayName === 'string' && s.displayName.trim() ? s.displayName.trim() : (existingDb?.displayName || s.name || '').trim(),
          proficiency: typeof s.proficiency === 'string' ? s.proficiency.trim().toLowerCase() : (existingDb?.proficiency || 'beginner'),
          isCodeVerified,
          verifiedSource: s.verifiedSource || existingDb?.verifiedSource || (isQuizVerified ? 'quiz' : (isCodeVerified ? 'github' : '')),
          selfRatedProficiency: s.selfRatedProficiency || existingDb?.selfRatedProficiency || null,
          isQuizVerified,
          verifiedProficiency: s.verifiedProficiency || existingDb?.verifiedProficiency || null,
          quizScore: Math.max(Number(s.quizScore) || 0, Number(existingDb?.quizScore) || 0),
          quizGaps: Array.isArray(s.quizGaps) && s.quizGaps.length ? s.quizGaps : (existingDb?.quizGaps || []),
          quizVerifiedAt: s.quizVerifiedAt ? new Date(s.quizVerifiedAt) : (existingDb?.quizVerifiedAt ? new Date(existingDb.quizVerifiedAt) : (isQuizVerified ? new Date() : null)),
          verificationTier: s.verificationTier || existingDb?.verificationTier || (isCodeVerified ? 'project_verified' : isQuizVerified ? 'quiz_verified' : 'self_rated'),
          verificationStatus: s.verificationStatus || existingDb?.verificationStatus || (isQuizVerified || isCodeVerified ? 'verified' : 'unverified'),
          integrityScore: typeof s.integrityScore === 'number' ? s.integrityScore : (existingDb?.integrityScore ?? 100),
          nextRetakeAvailableAt: s.nextRetakeAvailableAt ? new Date(s.nextRetakeAvailableAt) : (existingDb?.nextRetakeAvailableAt ? new Date(existingDb.nextRetakeAvailableAt) : null),
          quizAttemptsCount: typeof s.quizAttemptsCount === 'number' ? s.quizAttemptsCount : (existingDb?.quizAttemptsCount || 0),
          lastQuizAttemptAt: s.lastQuizAttemptAt ? new Date(s.lastQuizAttemptAt) : (existingDb?.lastQuizAttemptAt ? new Date(existingDb.lastQuizAttemptAt) : null),
          tabSwitchCount: typeof s.tabSwitchCount === 'number' ? s.tabSwitchCount : (existingDb?.tabSwitchCount || 0),
          velocityAnomalyCount: typeof s.velocityAnomalyCount === 'number' ? s.velocityAnomalyCount : (existingDb?.velocityAnomalyCount || 0),
        };

        if (!skillsMap.has(canonicalKey)) {
          skillsMap.set(canonicalKey, formatted);
        } else {
          // Merge: keep verified status if any is verified
          const existing = skillsMap.get(canonicalKey);
          if (formatted.isQuizVerified) existing.isQuizVerified = true;
          if (formatted.isCodeVerified) existing.isCodeVerified = true;
          if (formatted.verifiedProficiency) existing.verifiedProficiency = formatted.verifiedProficiency;
          if (formatted.verificationTier) existing.verificationTier = formatted.verificationTier;
          if (formatted.verificationStatus) existing.verificationStatus = formatted.verificationStatus;
          if (formatted.integrityScore) existing.integrityScore = formatted.integrityScore;
          if (formatted.nextRetakeAvailableAt) existing.nextRetakeAvailableAt = formatted.nextRetakeAvailableAt;
          if (formatted.proficiency === 'advanced' || (!existing.proficiency && formatted.proficiency)) {
            existing.proficiency = formatted.proficiency;
          }
        }
      });
      updates.skills = Array.from(skillsMap.values());
    }

    // Standardize interests casing
    if (Array.isArray(updates.interests)) {
      updates.interests = updates.interests.map((i) =>
        typeof i === 'string' ? i.trim().toLowerCase() : ''
      ).filter(Boolean);
    }

    // Strict Section-Based Architecture: Purge cross-stream contamination
    if (activeStream && activeStream !== 'cross') {
      if (Array.isArray(updates.skills)) {
        updates.skills = updates.skills.filter((s) => isSkillAllowedForStream(s.name, activeStream));
      }
      if (Array.isArray(updates.interests)) {
        updates.interests = updates.interests.filter((i) => isInterestAllowedForStream(i, activeStream));
      }
    }

    // Determine profileCompleted status
    const hasEducation =
      updates.education &&
      updates.education.course &&
      typeof updates.education.course === 'string' &&
      updates.education.course.trim() !== '';

    const hasInterest = Array.isArray(updates.interests) && updates.interests.length > 0;
    const hasSkill = Array.isArray(updates.skills) && updates.skills.length > 0;

    // Process Client-Side Encrypted Vault payload if provided
    if (updates.encryptedVault && typeof updates.encryptedVault === 'object') {
      updates.encryptedVault = {
        ciphertext: typeof updates.encryptedVault.ciphertext === 'string' ? updates.encryptedVault.ciphertext : null,
        iv: typeof updates.encryptedVault.iv === 'string' ? updates.encryptedVault.iv : null,
        salt: typeof updates.encryptedVault.salt === 'string' ? updates.encryptedVault.salt : null,
        version: updates.encryptedVault.version || 'AES-GCM-256',
        algorithm: updates.encryptedVault.algorithm || 'AES-GCM',
        iterations: updates.encryptedVault.iterations || 100000,
        updatedAt: new Date()
      };
    }

    updates.profileCompleted = Boolean(hasEducation && hasInterest && hasSkill);

    // Persist one-time skill verification completion for account
    if (req.body.hasCompletedSkillVerification || existingUser?.hasCompletedSkillVerification || (Array.isArray(updates.skills) && updates.skills.some((s) => s.isQuizVerified || s.isCodeVerified))) {
      updates.hasCompletedSkillVerification = true;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    cacheManager.invalidateUser(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Assessment saved successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/assessment
 * Retrieves current student's assessment profile, verified skills, and encryptedVault.
 */
const getAssessment = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      'name education interests skills careerGoals profileCompleted hasCompletedSkillVerification primaryStream encryptedVault githubProfile githubRepos'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        assessment: {
          name: user.name || '',
          education: user.education || {},
          interests: user.interests || [],
          skills: user.skills || [],
          careerGoals: user.careerGoals || [],
          profileCompleted: Boolean(user.profileCompleted),
          hasCompletedSkillVerification: Boolean(user.hasCompletedSkillVerification),
          primaryStream: user.primaryStream || 'engineering',
          encryptedVault: user.encryptedVault || null,
          githubProfile: user.githubProfile || null,
          githubRepos: user.githubRepos || [],
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateAssessment,
  getAssessment,
};

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/evidenceService.js — Canonical Skill Evidence Engine
 *
 * Implements the single source of truth for skill verification audit trails.
 * Combines User.skills, GitHub AST evidence, Adaptive Skill Check attempts,
 * and Weekly Roadmap milestone tests into a unified evidence ledger.
 *
 * Consumed by:
 *  - Dashboard Evidence Table & Interactive Chips
 *  - Resume Upload Gatekeeper (requires verifiedCount >= 1)
 *  - Job Readiness Certificate Generator
 *  - Recommendation Coverage Formula
 */

const User = require('../models/User');
const Attempt = require('../models/Attempt');

/**
 * Returns the canonical evidence ledger for a given student user ID.
 * @param {string|ObjectId} userId
 * @returns {Promise<Object>}
 */
async function getSkillEvidence(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error('User not found');
  }

  // Fetch all completed test attempts for this student, ordered newest first
  const attempts = await Attempt.find({ user: userId, status: 'completed' })
    .sort({ createdAt: -1 })
    .lean();

  const userSkills = Array.isArray(user.skills) ? user.skills : [];

  const evidence = userSkills.map((skill) => {
    const skillNameLower = (skill.name || '').trim().toLowerCase();

    // Find any direct attempts for this skill or attempts that covered this skill in weekly tests
    const skillAttempts = attempts.filter((a) => {
      const matchDirect = (a.skill || '').trim().toLowerCase() === skillNameLower;
      const matchTopic = Array.isArray(a.topicTags) && a.topicTags.some(t => t.toLowerCase() === skillNameLower);
      return matchDirect || matchTopic;
    });

    const latest = skillAttempts[0] || null;

    const isVerified = Boolean(
      skill.isQuizVerified ||
      skill.isCodeVerified ||
      (latest && latest.passed)
    );

    let method = skill.howVerified || 'self_rated';
    if (skill.isCodeVerified) {
      method = 'github_repo';
    } else if (latest?.type === 'weekly_test') {
      method = 'weekly_test';
    } else if (skill.isQuizVerified || latest?.type === 'skill_check') {
      method = 'skill_check';
    }

    const verifiedDate = skill.quizVerifiedAt || latest?.submitTime || (skill.isCodeVerified ? user.updatedAt : null);
    
    // 180-day skill evidence currency refresh window
    const refreshByDate = verifiedDate
      ? new Date(new Date(verifiedDate).getTime() + 180 * 24 * 60 * 60 * 1000)
      : null;
    const isRefreshNeeded = refreshByDate && (Date.now() > new Date(refreshByDate).getTime());

    let status = 'self_rated';
    if (isRefreshNeeded) {
      status = 'refresh_needed';
    } else if (method === 'weekly_test') {
      status = 'test_verified';
    } else if (method === 'skill_check' || method === 'github_repo') {
      status = 'quiz_verified';
    }

    const methodLabels = {
      weekly_test: 'Weekly Test',
      skill_check: 'Adaptive Skill Check',
      github_repo: 'GitHub Code AST',
      interview: 'Mock Interview Chamber',
      self_rated: 'Self-Rated',
    };

    let latestResult = 'No test taken';
    if (latest) {
      latestResult = `${latest.score} of ${latest.total} (${latest.percent}%)`;
    } else if (typeof skill.quizScore === 'number' && skill.quizScore > 0) {
      latestResult = `${skill.quizScore} / 5 pts`;
    } else if (skill.isCodeVerified) {
      latestResult = 'Repo Code AST Verified';
    }

    return {
      name: skill.name,
      displayName: skill.displayName || skill.name,
      category: skill.category || 'tool',
      claimedLevel: skill.selfRatedProficiency || skill.proficiency || 'intermediate',
      verifiedLevel: isVerified ? (skill.verifiedProficiency || skill.proficiency) : null,
      howVerified: method,
      methodLabel: methodLabels[method] || 'Self-Rated',
      latestResult,
      verifiedDate,
      refreshByDate,
      status,
      attemptsCount: skillAttempts.length,
      hasEvidence: isVerified,
      missedTopics: latest?.missedTopics || skill.quizGaps || [],
    };
  });

  const verifiedCount = evidence.filter((e) => e.hasEvidence).length;

  return {
    userId: user._id,
    userName: user.name,
    primaryStream: user.primaryStream || 'engineering',
    totalSkills: evidence.length,
    verifiedCount,
    evidence,
  };
}

module.exports = {
  getSkillEvidence,
};

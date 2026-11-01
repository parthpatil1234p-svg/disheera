/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * passportService.js - Compiles Canonical Public Skill Passport Data
 * Generates tamper-proof cryptographic ledger hash for recruiter verification.
 * Disheera Technologies Inc.
 */

const crypto = require('crypto');
const User = require('../models/User');

/**
 * Compiles a student's public Skill Passport data
 * @param {string} userId - User ID or Email
 */
async function generatePassportData(userOrId) {
  if (!userOrId) return null;

  let user = null;
  if (typeof userOrId === 'object') {
    user = userOrId;
  } else if (typeof userOrId === 'string') {
    if (userOrId.includes('@')) {
      user = await User.findOne({ email: userOrId.toLowerCase() });
    } else {
      user = await User.findById(userOrId);
    }
  }

  if (!user) return null;

  const rawSkills = Array.isArray(user.skills) ? user.skills : [];
  const rawProjects = Array.isArray(user.verifiedProjects) ? user.verifiedProjects : [];
  const education = user.education || {};
  const readiness = user.jobReadiness || {};

  // Formulate verified skills breakdown
  const skillsMatrix = rawSkills.map(s => {
    let tier = 'Self-Declared';
    let badge = '📝 Declared';
    let isVerified = false;

    if (s.isProjectVerified) {
      tier = 'Project Verified';
      badge = '🏆 Project Verified';
      isVerified = true;
    } else if (s.isQuizVerified) {
      tier = 'Quiz Verified';
      badge = '✅ Quiz Verified';
      isVerified = true;
    } else if (s.isCodeVerified) {
      tier = 'Code Verified';
      badge = '⭐ Code Verified';
      isVerified = true;
    }

    return {
      name: s.name || '',
      displayName: s.displayName || s.name || '',
      proficiency: s.proficiency || 'intermediate',
      tier,
      badge,
      isVerified,
      verifiedSource: s.verifiedSource || 'Assessment Protocol'
    };
  });

  const verifiedSkillsCount = skillsMatrix.filter(s => s.isVerified).length;
  const verifiedProjectsCount = rawProjects.filter(p => p.passed).length;

  // Generate cryptographic SHA-256 integrity seal
  const secret = process.env.JWT_SECRET || 'careerpath-tamper-proof-salt-2026';
  const rawLedgerString = `${user.id}:${user.email}:${verifiedSkillsCount}:${verifiedProjectsCount}:${secret}`;
  const cryptographicHash = crypto.createHash('sha256').update(rawLedgerString).digest('hex');

  // Compute composite readiness index
  let readinessScore = 78;
  if (readiness.overallScore !== undefined) {
    readinessScore = Number(readiness.overallScore);
  } else {
    // Dynamic estimate based on skills & projects
    readinessScore = Math.min(98, 55 + (verifiedSkillsCount * 5) + (verifiedProjectsCount * 8));
  }

  const collegeName = education.college || 'G.H. Raisoni College of Engineering and Management (GHRCEM), Jalgaon';
  const degreeBranch = `${education.course || 'B.Tech / BCA'} in ${education.branch || 'Computer Engineering'}`;

  const profileStatus = (typeof user.profileStatus === 'string')
    ? (() => { try { return JSON.parse(user.profileStatus); } catch (_) { return {}; } })()
    : (user.profileStatus || {});

  const passportRevocation = profileStatus.passportRevocation || null;
  const isRevoked = Boolean(passportRevocation && passportRevocation.isRevoked);

  let credentialStatus = 'pending';
  if (isRevoked) {
    credentialStatus = 'revoked';
  } else if (verifiedSkillsCount >= 1) {
    credentialStatus = 'verified';
  } else {
    credentialStatus = 'pending';
  }

  return {
    studentId: user.id,
    name: user.name || 'Verified Candidate',
    email: user.email,
    avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Student')}&background=0D8ABC&color=fff&size=128`,
    primaryStream: user.primaryStream || 'engineering',
    college: collegeName,
    degreeBranch: degreeBranch,
    graduationYear: education.year || 'Class of 2026',
    universityAffiliation: 'KBCNMU / Autonomous University System',
    phoneMasked: user.phone ? user.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') : '+91 98******12',
    phoneRaw: user.phone || '',
    whatsappAvailable: Boolean(user.phone),
    hasCompletedSkillVerification: Boolean(user.hasCompletedSkillVerification || verifiedSkillsCount > 0),
    readinessScore,
    verifiedSkillsCount,
    totalSkillsCount: skillsMatrix.length,
    verifiedProjectsCount,
    skillsMatrix,
    projectsPortfolio: rawProjects.filter(p => p.passed),
    cryptographicHash,
    verificationUrl: `https://disheera.site/passport.html?id=${user.id}`,
    ledgerTimestamp: new Date().toISOString(),
    credentialStatus,
    status: credentialStatus,
    isValid: credentialStatus === 'verified',
    isRevoked,
    revocationDetails: isRevoked ? {
      revokedAt: passportRevocation.revokedAt,
      revokedBy: passportRevocation.revokedBy,
      reason: passportRevocation.reason || 'Credential revoked by platform administrator'
    } : null
  };
}

module.exports = {
  generatePassportData,
  compilePassport: generatePassportData
};

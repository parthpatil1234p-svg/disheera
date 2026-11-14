/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * middleware/authMiddleware.js — JWT Authentication & Role Guards
 *
 * Exports two middleware functions:
 *
 *  protect          — Verifies the Bearer JWT in the Authorization header.
 *                     Attaches the authenticated user to req.user.
 *                     Use on any route that requires login.
 *
 *  authorize(roles) — Factory that returns a middleware checking req.user.role.
 *                     Use AFTER protect for admin-only routes.
 *
 * Usage:
 *   const { protect, authorize } = require('../middleware/authMiddleware');
 *
 *   router.get('/me',        protect,                  getMyProfile);
 *   router.get('/admin',     protect, authorize('admin'), adminOnly);
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── protect ────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    // 1. Read token from Authorization header or query parameter (for direct file downloads)
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // 3. Verify the token — this throws if invalid or expired
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Distinguish expired vs truly invalid
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
      });
    }

    // 4. Load the user from DB (excludes password via model's select:false)
    const user = await User.findById(decoded.id);

    if (!user) {
      // Token was valid but the account no longer exists
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    // 4b. Enforce account status (suspension & deactivation)
    const profileStatus = (typeof user.profileStatus === 'string')
      ? (() => { try { return JSON.parse(user.profileStatus); } catch (_) { return {}; } })()
      : (user.profileStatus || {});
    const recruiterProfile = (typeof user.recruiterProfile === 'string')
      ? (() => { try { return JSON.parse(user.recruiterProfile); } catch (_) { return {}; } })()
      : (user.recruiterProfile || {});

    const isDeleted = Boolean(profileStatus.isDeleted || recruiterProfile.isDeleted || user.isDeleted);
    const isSuspended = Boolean(profileStatus.isSuspended || recruiterProfile.isSuspended || user.isSuspended);

    if (isDeleted) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Your account has been deactivated.',
      });
    }

    if (isSuspended) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended by an administrator. Please contact support.',
        suspensionReason: profileStatus.suspensionReason || recruiterProfile.suspensionReason || null,
        suspendedAt: profileStatus.suspendedAt || recruiterProfile.suspendedAt || null,
      });
    }

    // 4c. Enforce email verification (admin accounts are exempt)
    const isAdmin = user.role === 'admin' || user.isAdmin;
    if (!user.isVerified && !isAdmin) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Your email address is not verified. Please verify your email before accessing protected resources.',
      });
    }

    // 5. Attach user to the request object for downstream handlers
    req.user = user;
    next();
  } catch (error) {
    // Unexpected server error — pass to global error handler
    next(error);
  }
};

// ── authorize ──────────────────────────────────────────────────
/**
 * Role-based access guard. Must be used AFTER protect.
 *
 * @param {...string} roles - Allowed roles, e.g. authorize('admin')
 * @returns Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

// ── requireSkillVerification ────────────────────────────────────
/**
 * requireSkillVerification — Ensures user has completed "Prove your skills"
 * Blocks access to dashboard telemetry, recommendations, and roadmaps until verified.
 */
const requireSkillVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
    });
  }

  // Admin accounts have all features completely unlocked
  const isAdmin = Boolean(req.user.role === 'admin' || req.user.isAdmin);
  if (isAdmin) {
    return next();
  }

  // Non-engineering tracks (business, marketing, creative) do not require technical code verification
  if (req.user.primaryStream && req.user.primaryStream !== 'engineering' && req.user.primaryStream !== 'cross') {
    return next();
  }

  const isVerified = Boolean(
    req.user.hasCompletedSkillVerification ||
    (Array.isArray(req.user.skills) && req.user.skills.some((s) => s.isQuizVerified || s.isCodeVerified))
  );

  if (!isVerified) {
    return res.status(403).json({
      success: false,
      requiresSkillVerification: true,
      message: 'Skill verification required. Please complete "Prove your skills" in your assessment to unlock this section.',
      redirectUrl: 'assessment.html#proveSkillsPanel',
    });
  }

  next();
};

// ── requireVerifiedRecruiter ──────────────────────────────────
/**
 * requireVerifiedRecruiter — Ensures user is an authorized, corporate-verified recruiter.
 */
const requireVerifiedRecruiter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'tpo') {
    return res.status(403).json({
      success: false,
      code: 'TPO_ACCESS_DENIED',
      message: 'Access denied. Institutional TPO accounts cannot access corporate recruiter hiring workflows. Please use your Campus TPO Cockpit.',
    });
  }

  if (req.user.role !== 'recruiter') {
    return res.status(403).json({
      success: false,
      code: 'STUDENT_ACCESS_DENIED',
      message: 'Access denied. Recruiter account required.',
    });
  }

  const profile = req.user.recruiterProfile;
  if (!profile || profile.verificationStatus !== 'verified' || !profile.canPostJobs) {
    return res.status(403).json({
      success: false,
      message: 'Recruiter verification pending. You must verify your corporate email OTP before posting jobs.',
    });
  }

  next();
};

// ── requireStudent ─────────────────────────────────────────────
/**
 * requireStudent — Ensures authenticated user has student access.
 * Blocks recruiters from accessing student learning, roadmap, and assessment endpoints.
 */
const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'recruiter') {
    return res.status(403).json({
      success: false,
      code: 'RECRUITER_ACCESS_DENIED',
      message: 'Access denied. Recruiter accounts cannot access student learning and roadmap resources. Please use the Recruiter Portal.',
    });
  }

  if (req.user.role === 'tpo') {
    return res.status(403).json({
      success: false,
      code: 'TPO_ACCESS_DENIED',
      message: 'Access denied. Institutional TPO accounts cannot access student learning and roadmap resources. Please use your Campus TPO Cockpit.',
    });
  }


  next();
};

// ── requireRecruiter ───────────────────────────────────────────
/**
 * requireRecruiter — Ensures authenticated user has recruiter access.
 * Blocks students from accessing recruiter management endpoints.
 */
const requireRecruiter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'tpo') {
    return res.status(403).json({
      success: false,
      code: 'TPO_ACCESS_DENIED',
      message: 'Access denied. Institutional TPO accounts cannot access corporate recruiter hiring workflows. Please use your Campus TPO Cockpit.',
    });
  }

  if (req.user.role !== 'recruiter') {
    return res.status(403).json({
      success: false,
      code: 'STUDENT_ACCESS_DENIED',
      message: 'Access denied. Student accounts cannot access the company recruiter portal.',
    });
  }

  next();
};

// ── requireTpo ─────────────────────────────────────────────────
/**
 * requireTpo — Ensures authenticated user has institutional TPO access.
 * Strictly blocks students and recruiters from accessing college TPO Cockpit and telemetry.
 */
const requireTpo = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'recruiter') {
    return res.status(403).json({
      success: false,
      code: 'RECRUITER_TPO_ACCESS_DENIED',
      message: 'Access denied. Corporate recruiter accounts cannot access the institutional Campus TPO Cockpit. Please use the Recruiter Portal.',
    });
  }

  if (req.user.role !== 'tpo') {
    return res.status(403).json({
      success: false,
      code: 'STUDENT_TPO_ACCESS_DENIED',
      message: 'Access denied. Student accounts cannot access the institutional Campus TPO Cockpit. Please use your Student Dashboard.',
    });
  }

  next();
};

module.exports = {
  protect,
  authorize,
  requireSkillVerification,
  requireVerifiedRecruiter,
  requireStudent,
  requireRecruiter,
  requireTpo,
};


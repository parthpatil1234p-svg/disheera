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

  if (req.user.role !== 'recruiter') {
    return res.status(403).json({
      success: false,
      code: 'STUDENT_ACCESS_DENIED',
      message: 'Access denied. Student accounts cannot access the company recruiter portal.',
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
};


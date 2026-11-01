/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminAuthMiddleware.js — Disheera Dedicated Admin Authentication & RBAC
 *
 * Layers of defense:
 *  1. Extracts cookie (__Host-disheera_admin_session in prod, disheera_admin_session in dev)
 *     or Authorization: Bearer <token>.
 *  2. Cryptographic signature check via ADMIN_JWT_SECRET (strictly distinct from student JWT_SECRET).
 *  3. Instant session revocation check: looks up SHA-256 tokenHash in prisma.adminSession.
 *  4. AdminUser status check: isActive, lockedUntil.
 *  5. Password Change Gate: While mustChangePassword=true, ONLY /auth/me, /auth/change-password,
 *     and /auth/logout are permitted. All other /api/admin/* routes return 403 PASSWORD_CHANGE_REQUIRED.
 *  6. RBAC Role enforcement: SUPER_ADMIN > ADMIN > MODERATOR.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../config/prisma');

const ROLE_HIERARCHY = {
  SUPER_ADMIN: 3,
  ADMIN: 2,
  MODERATOR: 1,
};

function getCookieName() {
  return process.env.NODE_ENV === 'production'
    ? '__Host-disheera_admin_session'
    : 'disheera_admin_session';
}

function extractToken(req) {
  const cookieName = getCookieName();

  // 1. Check req.cookies if cookie-parser is installed
  if (req.cookies && req.cookies[cookieName]) {
    return req.cookies[cookieName];
  }

  // 2. Parse raw Cookie header
  const rawCookieHeader = req.headers.cookie;
  if (rawCookieHeader) {
    const cookies = rawCookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${cookieName}=`)) {
        return decodeURIComponent(cookie.substring(cookieName.length + 1));
      }
    }
  }

  // 3. Check Authorization: Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

async function verifyAdminAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Admin authentication required.'
      });
    }

    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret || secret.length < 32) {
      console.error('[FATAL] ADMIN_JWT_SECRET is missing or too short during token verification.');
      return res.status(500).json({
        success: false,
        code: 'SERVER_MISCONFIGURED',
        message: 'Administrative authentication service configuration error.'
      });
    }

    // 1. Verify JWT signature with dedicated admin secret
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_ADMIN_TOKEN',
        message: 'Invalid or expired admin token.'
      });
    }

    // Ensure token belongs to an admin role
    if (!decoded || !decoded.role || !ROLE_HIERARCHY[decoded.role]) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_ADMIN_TOKEN',
        message: 'Supplied token does not have admin permissions.'
      });
    }

    // 2. Check active session in DB (SHA-256 token hash)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await prisma.adminSession.findUnique({
      where: { tokenHash }
    });

    if (!session || new Date(session.expiresAt) <= new Date()) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_REVOKED',
        message: 'Admin session is invalid, expired, or has been revoked.'
      });
    }

    // 3. Fetch Admin User from DB
    const admin = await prisma.adminUser.findUnique({
      where: { id: session.adminId }
    });

    if (!admin || !admin.isActive) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'This admin account is inactive or has been deactivated.'
      });
    }

    // Check account lockout
    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      const remainingSec = Math.ceil((new Date(admin.lockedUntil) - new Date()) / 1000);
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_LOCKED',
        message: `Account is temporarily locked. Try again in ${remainingSec} seconds.`,
        lockedUntil: admin.lockedUntil
      });
    }

    // 4. Must Change Password Guard
    // When mustChangePassword=true, the session may ONLY call /auth/me, /auth/change-password, /auth/logout
    if (admin.mustChangePassword) {
      const allowedPaths = [
        '/api/admin/auth/me',
        '/api/admin/auth/change-password',
        '/api/admin/auth/logout'
      ];
      const normalizedUrl = req.originalUrl.split('?')[0].replace(/\/+$/, '');
      const isAllowed = allowedPaths.includes(normalizedUrl) ||
        ['/me', '/change-password', '/logout'].includes(req.path);

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'Password change is required before accessing other administrative resources.'
        });
      }
    }

    // Attach verified admin & session to request
    req.admin = admin;
    req.adminSession = session;
    req.adminToken = token;
    req.adminTokenHash = tokenHash;

    next();
  } catch (error) {
    console.error('[AdminAuthMiddleware Error]:', error);
    return res.status(500).json({
      success: false,
      code: 'AUTH_INTERNAL_ERROR',
      message: 'Failed to authenticate administrative request.'
    });
  }
}

/**
 * Role authorization guard
 * @param {string|string[]} allowedRoles - minimum role required or array of allowed roles
 */
function requireAdminRole(minOrRoles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Admin authentication required.'
      });
    }

    const currentRank = ROLE_HIERARCHY[req.admin.role] || 0;

    if (Array.isArray(minOrRoles)) {
      if (minOrRoles.includes(req.admin.role)) {
        return next();
      }
    } else if (typeof minOrRoles === 'string') {
      const requiredRank = ROLE_HIERARCHY[minOrRoles] || 999;
      if (currentRank >= requiredRank) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'You do not have the required role to perform this action.'
    });
  };
}

module.exports = {
  verifyAdminAuth,
  adminAuth: verifyAdminAuth,
  requireAdminRole,
  getCookieName,
  ROLE_HIERARCHY
};

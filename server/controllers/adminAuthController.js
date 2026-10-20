/**
 * adminAuthController.js — Subdomain Admin Authentication Controller
 *
 * Implements:
 * 1. IP-level rate limiting (20 req / 15 min on /auth/login ONLY).
 * 2. Constant-time dummy bcrypt comparison for non-existent emails to prevent
 *    user enumeration and timing attacks.
 * 3. Lockout expiration reset: resets failedLoginAttempts to 0 on next login attempt
 *    once lockedUntil has expired.
 * 4. Account lockout: 5 consecutive failures triggers 15-minute lock.
 * 5. Expired session cleanup: pruned on every successful login.
 * 6. Session revocation: SHA-256 tokenHash tracked in admin_sessions.
 * 7. Password change: terminates all OTHER admin_sessions for that admin, sets mustChangePassword=false.
 * 8. Strict host-only cookie issuance.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { prisma } = require('../config/prisma');
const { getCookieName } = require('../middleware/adminAuthMiddleware');

// Precomputed 12-round bcrypt hash for dummy compare to defeat timing attacks & user enumeration
const DUMMY_BCRYPT_HASH = bcrypt.hashSync('timing_mitigation_salt_token_2026', 12);

// Tier 1 IP rate-limiter applied ONLY to /api/admin/auth/login
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // max 20 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
    message: 'Too many admin login attempts from this IP. Please wait 15 minutes.'
  }
});

async function logLoginAttempt(email, ipAddress, success, reason = null) {
  try {
    await prisma.adminLoginAttempt.create({
      data: {
        email: email || 'unknown',
        ipAddress: ipAddress || '0.0.0.0',
        success,
        reason
      }
    });
  } catch (err) {
    console.error('[AdminLoginAttempt Log Error]:', err.message);
  }
}

function getClientIp(req) {
  if (req.headers && req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for'].split(',')[0].trim();
  }
  if (req.ip) return req.ip;
  if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
  return '0.0.0.0';
}

/**
 * POST /api/admin/auth/login
 */
async function login(req, res) {
  const { email, password } = req.body;
  const ip = getClientIp(req);

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Email and password are required.'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail }
    });

    // Timing attack & enumeration defense: If admin does not exist, run dummy bcrypt compare
    if (!admin) {
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
      await logLoginAttempt(normalizedEmail, ip, false, 'INVALID_CREDENTIALS');
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Account lockout verification & expiration check
    if (admin.lockedUntil) {
      const lockDate = new Date(admin.lockedUntil);
      if (lockDate > new Date()) {
        const remainingSec = Math.ceil((lockDate - new Date()) / 1000);
        await logLoginAttempt(normalizedEmail, ip, false, 'ACCOUNT_LOCKED');
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_LOCKED',
          message: `Account is temporarily locked due to multiple failed login attempts. Try again in ${remainingSec} seconds.`,
          lockedUntil: admin.lockedUntil
        });
      } else {
        // Lockout period has expired: reset failedLoginAttempts to 0 and clear lockedUntil
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null
          }
        });
        admin.failedLoginAttempts = 0;
        admin.lockedUntil = null;
      }
    }

    // Password verification
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      const failedAttempts = (admin.failedLoginAttempts || 0) + 1;
      let newLockedUntil = null;

      // Lock account for 15 minutes after 5 consecutive failures
      if (failedAttempts >= 5) {
        newLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil: newLockedUntil
        }
      });

      await logLoginAttempt(normalizedEmail, ip, false, 'INVALID_CREDENTIALS');

      if (failedAttempts >= 5) {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_LOCKED',
          message: 'Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.',
          lockedUntil: newLockedUntil
        });
      }

      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      await logLoginAttempt(normalizedEmail, ip, false, 'INACTIVE_ACCOUNT');
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Admin account has been deactivated.'
      });
    }

    // Prune all expired admin sessions on each successful login
    await prisma.adminSession.deleteMany({
      where: {
        expiresAt: { lte: new Date() }
      }
    });

    // Reset failed login counter and update last login metadata
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: typeof ip === 'string' ? ip.split(',')[0].trim() : '0.0.0.0'
      }
    });

    // Sign dedicated Admin JWT
    const secret = process.env.ADMIN_JWT_SECRET;
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        jti: crypto.randomUUID()
      },
      secret,
      { expiresIn: '8h' }
    );

    // Compute SHA-256 token hash for instant revocation tracking
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        tokenHash,
        ipAddress: typeof ip === 'string' ? ip.split(',')[0].trim() : '0.0.0.0',
        userAgent: req.headers['user-agent'] || null,
        expiresAt
      }
    });

    // Log successful attempt
    await logLoginAttempt(normalizedEmail, ip, true);

    // Issue environment-aware host-only cookie
    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = getCookieName();

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        mustChangePassword: admin.mustChangePassword
      }
    });
  } catch (err) {
    console.error('[Admin Login Error]:', err);
    return res.status(500).json({
      success: false,
      code: 'LOGIN_INTERNAL_ERROR',
      message: 'An error occurred during authentication.'
    });
  }
}

/**
 * GET /api/admin/auth/me
 */
async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    admin: {
      id: req.admin.id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      mustChangePassword: req.admin.mustChangePassword,
      lastLoginAt: req.admin.lastLoginAt,
      createdAt: req.admin.createdAt
    }
  });
}

/**
 * POST /api/admin/auth/change-password
 */
async function changePassword(req, res) {
  const currentPassword = req.body.currentPassword || req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const confirmPassword = req.body.confirmPassword;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_FIELDS',
      message: 'Current password and new password are required.'
    });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      code: 'PASSWORD_MISMATCH',
      message: 'New password and confirmation do not match.'
    });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 10) {
    return res.status(400).json({
      success: false,
      code: 'WEAK_PASSWORD',
      message: 'New password must be at least 10 characters long.'
    });
  }

  try {
    const isOldValid = await bcrypt.compare(currentPassword, req.admin.password);
    if (!isOldValid) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password does not match.'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and set mustChangePassword to false
    await prisma.adminUser.update({
      where: { id: req.admin.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false
      }
    });

    // Delete all other admin_sessions for that admin (keep current session alive)
    await prisma.adminSession.deleteMany({
      where: {
        adminId: req.admin.id,
        tokenHash: {
          not: req.adminTokenHash
        }
      }
    });

    // Audit log entry
    const ip = getClientIp(req);
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'PASSWORD_CHANGE',
        targetType: 'AUTH',
        targetId: req.admin.id,
        ipAddress: typeof ip === 'string' ? ip.split(',')[0].trim() : '0.0.0.0',
        userAgent: (req.headers && req.headers['user-agent']) || null,
        details: { timestamp: new Date() }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. All other active sessions have been terminated.'
    });
  } catch (err) {
    console.error('[Admin Change Password Error]:', err);
    return res.status(500).json({
      success: false,
      code: 'CHANGE_PASSWORD_ERROR',
      message: 'Failed to update admin password.'
    });
  }
}

/**
 * POST /api/admin/auth/logout
 */
async function logout(req, res) {
  try {
    if (req.adminTokenHash) {
      await prisma.adminSession.deleteMany({
        where: { tokenHash: req.adminTokenHash }
      });
    }

    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = getCookieName();

    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/'
    });

    return res.status(200).json({
      success: true,
      message: 'Admin session terminated successfully.'
    });
  } catch (err) {
    console.error('[Admin Logout Error]:', err);
    return res.status(500).json({
      success: false,
      code: 'LOGOUT_ERROR',
      message: 'Failed to terminate admin session.'
    });
  }
}

module.exports = {
  adminLoginLimiter,
  login,
  getMe,
  changePassword,
  logout
};

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
    // 1. Read the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // 2. Extract the raw token string (strip "Bearer ")
    const token = authHeader.split(' ')[1];

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

module.exports = { protect, authorize };

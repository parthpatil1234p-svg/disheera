/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * middleware/passwordResetRateLimiter.js — IP-Level Rate Limiter for Password Reset
 * Enforces: Maximum 3 password reset / resend OTP requests per 30 minutes per IP address.
 * Disheera · Enterprise Account Security
 */

const rateLimit = require('express-rate-limit');

/**
 * Extracts true client IP address safely considering reverse proxies (Vercel, Render)
 */
function getClientIp(req) {
  if (req.headers && req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for'].split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * 30-minute window, maximum 3 requests per IP.
 * Strict IP-level tracking for both OTP requests and reset attempts.
 */
const passwordResetRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes window
  max: 3, // Maximum 3 attempts per 30 minutes per IP
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    return `pwd_reset_ip_${ip}`;
  },
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      rateLimited: true,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset requests from this network. For security reasons, maximum 3 attempts are allowed per 30 minutes. Please try again after 30 minutes.',
    });
  },
});

module.exports = {
  passwordResetRateLimiter,
  getClientIp,
};

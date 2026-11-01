/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * middleware/otpRateLimiter.js — Balanced OTP Rate Limiting
 * Enforces: Maximum 5 OTP sends per 5 minutes per email/IP.
 * Disheera · Enterprise Backend Service
 */

const rateLimit = require('express-rate-limit');

/**
 * 5-minute window, maximum 5 OTP requests.
 * Tracked per email address (case-insensitive & trimmed) with IP fallback.
 */
const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Maximum 5 OTPs allowed per 5 minutes
  skipFailedRequests: true, // Only successful OTP dispatches count (< 400 status)
  keyGenerator: (req) => {
    const rawEmail = req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : '';
    return rawEmail ? `otp_email_${rawEmail}` : `otp_ip_${req.ip}`;
  },
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      rateLimited: true,
      message: 'Too many OTP requests. Maximum 5 verification codes allowed per 5 minutes. Please wait before requesting another code.',
    });
  },
});

module.exports = otpRateLimiter;

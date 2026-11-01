/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/authRoutes.js — Authentication Endpoints
 *
 * Mounted at: /api/auth  (in server.js)
 *
 * Routes:
 *   POST /api/auth/register     → validateRegister → registerUser
 *   POST /api/auth/verify-otp   → verifyOtp
 *   POST /api/auth/resend-otp   → resendOtp
 *   POST /api/auth/login        → validateLogin    → loginUser
 */

const express = require('express');

const {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  googleAuth,
  getGoogleConfig,
  githubAuth,
  connectGitHub,
  getGitHubConfig,
  forgotPassword,
  resetPassword,
  checkPhoneAvailability,
} = require('../controllers/authController');
const { getMyProfile } = require('../controllers/userController');
const { validateRegister, validateLogin } = require('../middleware/validateRequest');
const { protect } = require('../middleware/authMiddleware');
const otpRateLimiter = require('../middleware/otpRateLimiter');
const { passwordResetRateLimiter } = require('../middleware/passwordResetRateLimiter');

const router = express.Router();

// POST /api/auth/check-phone (Live 1:1 mobile number availability pre-check)
router.post('/check-phone', checkPhoneAvailability);

// POST /api/auth/register (max 2 OTP sends per 5 mins per email)
router.post('/register', otpRateLimiter, validateRegister, registerUser);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/auth/resend-otp (max 2 OTP sends per 5 mins per email)
router.post('/resend-otp', otpRateLimiter, resendOtp);

// POST /api/auth/login
router.post('/login', validateLogin, loginUser);

// POST /api/auth/forgot-password (request password reset OTP & 1-click token — max 3 attempts per 30 mins per IP)
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);

// POST /api/auth/reset-password (verify token/OTP and update password — max 3 attempts per 30 mins per IP)
router.post('/reset-password', passwordResetRateLimiter, resetPassword);

// GET /api/auth/me — Session restore / verify current user profile
router.get('/me', protect, getMyProfile);

// POST /api/auth/google — Google OAuth2 Sign-In & Sign-Up
router.post('/google', googleAuth);

// GET /api/auth/google/config — Public Google Client ID
router.get('/google/config', getGoogleConfig);

// POST /api/auth/github — Disabled (Direct GitHub login disabled; students sign in via Email/Google)
router.post('/github', githubAuth);

// POST /api/auth/github/connect — Connect & analyze GitHub study repos for logged-in user
router.post('/github/connect', protect, connectGitHub);

// POST /api/auth/github/sync — Synchronize GitHub study repos via auth system
router.post('/github/sync', protect, connectGitHub);

// GET /api/auth/github/config — Public GitHub Client ID
router.get('/github/config', getGitHubConfig);

module.exports = router;

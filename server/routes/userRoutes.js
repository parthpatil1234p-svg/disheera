/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/userRoutes.js — User Profile Endpoints
 *
 * Mounted at: /api/users  (in server.js)
 *
 * All routes require a valid JWT (protect middleware).
 *
 * Routes:
 *   GET /api/users/me   → protect → getMyProfile
 *   PUT /api/users/me   → protect → validateProfileUpdate → updateMyProfile
 */

const express = require('express');

const {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  getMyResume,
  uploadResume,
  deleteMyResume,
  viewResume,
  downloadResume,
  getResumePreview,
  updateProfileStatus,
  sendLinkPhoneOtp,
  verifyLinkPhoneOtp,
} = require('../controllers/userController');
const { protect }                        = require('../middleware/authMiddleware');
const { validateProfileUpdate }          = require('../middleware/validateRequest');

const router = express.Router();

// All routes below this line require authentication
router.use(protect);

// GET /api/users/me
router.get('/me', getMyProfile);

// PUT /api/users/me
router.put('/me', validateProfileUpdate, updateMyProfile);

// PUT /api/users/profile-status (Update Learning / Job Seeking / Working Status)
router.put('/profile-status', updateProfileStatus);

// POST /api/users/link-phone/send-otp (Send WhatsApp OTP to link phone)
router.post('/link-phone/send-otp', sendLinkPhoneOtp);

// POST /api/users/link-phone/verify-otp (Verify WhatsApp OTP and link phone)
router.post('/link-phone/verify-otp', verifyLinkPhoneOtp);

// POST /api/users/avatar (Cloudinary Media Upload)
router.post('/avatar', uploadAvatar);

// GET /api/users/resume (Single-resume status, metadata & skill lock gate)
router.get('/resume', getMyResume);

// POST /api/users/resume (Strict single-resume upload/replace pipeline)
router.post('/resume', uploadResume);

// DELETE /api/users/resume (Delete stored resume & reset user pointers)
router.delete('/resume', deleteMyResume);

// GET /api/users/resume/view (Streams inline PDF for browser viewing)
router.get('/resume/view', viewResume);

// GET /api/users/resume/download (Triggers direct file download)
router.get('/resume/download', downloadResume);

// GET /api/users/resume/preview (Returns preview image URL & metadata)
router.get('/resume/preview', getResumePreview);

module.exports = router;

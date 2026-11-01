/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/chatRoutes.js — AI Career Mentor Chat Endpoints
 * Protected by JWT authentication and dedicated rate limiting.
 * Disheera · Enterprise Backend Service
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');
const { handleChatMessage } = require('../controllers/chatController');

// Dedicated Chat Rate Limiter: 20 messages per 15-minute window per authenticated user
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?._id?.toString() || 'authenticated_user',
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI Career Mentor is currently cooling down. You have reached your 20-message limit for this 15-minute window. Please wait a few minutes before continuing.',
  },
});

// POST /api/chat/message and POST /api/chat (protected with rate limiting)
router.post('/message', protect, chatLimiter, handleChatMessage);
router.post('/', protect, chatLimiter, handleChatMessage);

module.exports = router;

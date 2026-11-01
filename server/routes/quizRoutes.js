/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/quizRoutes.js - API Routes for Adaptive Skill Reality-Check Quiz
 *
 * Disheera · Enterprise Backend Service
 */

const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, requireStudent } = require('../middleware/authMiddleware');

// Optional auth for skill catalog lookup
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (_) {}
  next();
};

// Skill catalog is publicly accessible with user personalization if logged in
router.get('/skills', optionalAuth, quizController.getAvailableSkills);

// In-Browser "Fix-the-Bug" Proof-of-Work Chamber endpoints
router.get('/code-challenges', optionalAuth, quizController.getCodeChallenges);
router.post('/verify-code-solution', optionalAuth, quizController.verifyCodeSolution);

// All subsequent quiz endpoints require JWT authentication and student access
router.use(protect, requireStudent);

router.get('/status', quizController.getQuizStatus);
router.get('/providers', quizController.getQuizProviders);
router.get('/active-session', quizController.getActiveSession);
router.post('/start', quizController.startQuiz);
router.post('/answer', quizController.submitAnswer);
router.post('/violation', quizController.recordViolation);
router.post('/disqualify', quizController.disqualifyUser);

module.exports = router;

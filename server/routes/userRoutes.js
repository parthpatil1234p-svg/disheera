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

const { getMyProfile, updateMyProfile }  = require('../controllers/userController');
const { protect }                        = require('../middleware/authMiddleware');
const { validateProfileUpdate }          = require('../middleware/validateRequest');

const router = express.Router();

// All routes below this line require authentication
router.use(protect);

// GET /api/users/me
router.get('/me', getMyProfile);

// PUT /api/users/me
router.put('/me', validateProfileUpdate, updateMyProfile);

module.exports = router;

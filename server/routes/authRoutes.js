/**
 * routes/authRoutes.js — Authentication Endpoints
 *
 * Mounted at: /api/auth  (in server.js)
 *
 * Routes:
 *   POST /api/auth/register   → validateRegister → registerUser
 *   POST /api/auth/login      → validateLogin    → loginUser
 */

const express = require('express');

const { registerUser, loginUser }      = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validateRequest');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegister, registerUser);

// POST /api/auth/login
router.post('/login', validateLogin, loginUser);

module.exports = router;

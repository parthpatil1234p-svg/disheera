/**
 * controllers/authController.js — Register & Login
 *
 * registerUser  POST /api/auth/register
 * loginUser     POST /api/auth/login
 *
 * Security rules enforced:
 *  - Duplicate email → 409 (handled by errorMiddleware via Mongoose code 11000)
 *  - Wrong email or password → identical 401 (prevents user enumeration)
 *  - Password never returned in any response
 *  - Use select('+password') ONLY for login comparison, nowhere else
 */

const User          = require('../models/User');
const generateToken = require('../utils/generateToken');

// ── Helper: shape the user object returned in responses ───────
// Never include password, __v, or other internal fields.
const formatUser = (user) => ({
  id:               user._id,
  name:             user.name,
  email:            user.email,
  role:             user.role,
  profileCompleted: user.profileCompleted,
});

// ── registerUser ───────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Body: { name, email, password }
 *
 * Creates a new user and returns a JWT token.
 * Duplicate email → Mongoose throws code 11000 → errorMiddleware returns 409.
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Create the user — password hashing happens in the pre-save hook
    const user = await User.create({
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      password, // plain text here; bcrypt hook runs before .save()
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user:  formatUser(user),
        token,
      },
    });
  } catch (error) {
    // Pass to global error handler (handles duplicate key, validation errors, etc.)
    next(error);
  }
};

// ── loginUser ──────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * Verifies credentials and returns a JWT token.
 * Returns the SAME 401 message for unknown email and wrong password
 * to prevent user enumeration attacks.
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user — include password field (excluded by default in the model)
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    // 2. If user not found OR password doesn't match → same generic 401
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 3. Generate token and respond
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user:  formatUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser };

/**
 * utils/generateToken.js — JWT Token Generator
 *
 * Creates a signed JSON Web Token for an authenticated user.
 *
 * Payload: { id, role }
 * Secret:  JWT_SECRET environment variable
 * Expiry:  JWT_EXPIRES_IN environment variable (default: 7d)
 *
 * Usage:
 *   const generateToken = require('../utils/generateToken');
 *   const token = generateToken(user);
 */

const jwt = require('jsonwebtoken');

/**
 * @param {Object} user - Mongoose user document (must have _id and role)
 * @returns {string} Signed JWT token string
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id:   user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

module.exports = generateToken;

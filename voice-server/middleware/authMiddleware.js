/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Standalone Voice AI Support Microservice Authentication Guard
 */

const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: Authentication token required for Voice Support.',
      });
    }

    const secret = process.env.JWT_SECRET || 'disheera_jwt_secret_dev_key';
    const decoded = jwt.verify(token, secret);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
}

module.exports = { protect };

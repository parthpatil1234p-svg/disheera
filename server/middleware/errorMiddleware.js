/**
 * middleware/errorMiddleware.js — Global Error Handler
 *
 * This must be the LAST middleware registered in server.js.
 * Express identifies it as an error handler because it has 4 parameters (err, req, res, next).
 *
 * Handles:
 *  - Mongoose duplicate key error (code 11000) → 409
 *  - Mongoose validation errors                → 400
 *  - JWT invalid token                         → 401
 *  - JWT expired token                         → 401
 *  - All other errors                          → error.statusCode or 500
 *
 * Stack traces are shown in development only.
 *
 * Response shape:
 *  { "success": false, "message": "Human-readable error message" }
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message    = err.message    || 'Internal Server Error';

  // ── Mongoose Duplicate Key (e.g. duplicate email) ────────────
  if (err.code === 11000) {
    statusCode = 409;
    message    = 'An account with this email already exists';
  }

  // ── Mongoose Validation Error ─────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    // Collect all Mongoose validation messages into one readable string
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('. ');
  }

  // ── Mongoose CastError (invalid ObjectId format) ─────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid value for field: ${err.path}`;
  }

  // ── JWT Errors (shouldn't reach here normally — authMiddleware
  //    handles these, but kept as a safety net) ─────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Session expired. Please log in again.';
  }

  // ── Build response ────────────────────────────────────────────
  const response = {
    success: false,
    message,
  };

  // Include stack trace in development only — never in production
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

/**
 * server.js — CareerPath AI Express Entry Point
 *
 * What this file does:
 *  1. Loads environment variables from .env
 *  2. Creates the Express application
 *  3. Applies middleware (CORS, JSON parsing)
 *  4. Mounts routes
 *  5. Starts listening on the configured port
 *
 * Run with:  node server.js
 * Dev mode:  npm run dev  (uses nodemon for auto-restart)
 */

// ── Load environment variables first (before anything else) ──
const dotenv = require('dotenv');
dotenv.config();

// ── Core dependencies ──────────────────────────────────────────
const express = require('express');
const cors    = require('cors');

// ── Database connection (placeholder — wired in Step 2) ───────
// const connectDB = require('./config/db');

// ── Initialize Express app ────────────────────────────────────
const app = express();

// ============================================================
// Middleware
// ============================================================

/**
 * CORS — Allow requests from the frontend.
 * In development: accepts all origins.
 * In production: restrict to your Vercel URL via CLIENT_URL env var.
 */
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

/**
 * JSON Body Parser — Parse incoming request bodies as JSON.
 * Limits payload to 10mb (useful for optional resume uploads later).
 */
app.use(express.json({ limit: '10mb' }));

/**
 * URL-encoded body parser — For HTML form submissions.
 */
app.use(express.urlencoded({ extended: true }));

// ============================================================
// Database Connection (uncomment in Step 2)
// ============================================================
// connectDB();

// ============================================================
// Routes
// ============================================================

/**
 * GET /api/health
 * A simple health-check endpoint.
 * Use this to verify the server is running and reachable.
 * Test: GET http://localhost:5000/api/health
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareerPath AI Server is running ✅',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    team: '404 Brain Not Found',
  });
});

/**
 * Route Placeholders — These will be wired in later steps.
 *
 * Step 2: Authentication routes
 * app.use('/api/auth', require('./routes/authRoutes'));
 *
 * Step 3: User profile routes
 * app.use('/api/profile', require('./routes/profileRoutes'));
 *
 * Step 4: Career data routes
 * app.use('/api/careers', require('./routes/careerRoutes'));
 *
 * Step 5: Career recommendation engine
 * app.use('/api/recommend', require('./routes/recommendRoutes'));
 *
 * Step 6: Roadmap generation and task tracking
 * app.use('/api/roadmap', require('./routes/roadmapRoutes'));
 *
 * Step 7: Progress tracking
 * app.use('/api/progress', require('./routes/progressRoutes'));
 */

// ============================================================
// 404 Handler — catch-all for unknown routes
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================
// Global Error Handler — catches errors from all routes
// ============================================================
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================
// Start Server
// ============================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 CareerPath AI Server started!');
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('👥 Team: 404 Brain Not Found · Hack2Ignite 2026–27');
  console.log('');
});

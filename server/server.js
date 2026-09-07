/**
 * server.js — CareerPath AI Express Entry Point (Step 2)
 *
 * Startup order:
 *  1. Load .env
 *  2. Connect to MongoDB
 *  3. Apply security & utility middleware (helmet, cors, rate-limit, morgan)
 *  4. Mount API routes
 *  5. 404 handler
 *  6. Global error handler
 *  7. Start listening
 */

// ── 1. Environment variables must be loaded FIRST ────────────
require('dotenv').config();

// ── Core imports ──────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ── Internal imports ──────────────────────────────────────────
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const careerRoutes = require('./routes/careerRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorMiddleware');

// ── 2. Connect to MongoDB Atlas ───────────────────────────────
connectDB();

// ── 3. Create Express app ─────────────────────────────────────
const app = express();

// ── Security: Helmet sets sensible HTTP headers ───────────────
app.use(helmet());

// ── CORS: Allow requests from the frontend origin ─────────────
// In development: CLIENT_URL is http://localhost:5500 (Live Server)
// In production:  CLIENT_URL is your Vercel URL
const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    const configuredClient = process.env.CLIENT_URL;
    const allowedLocal = ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'];

    if (
      process.env.NODE_ENV === 'development' ||
      !configuredClient ||
      configuredClient === '*' ||
      origin === configuredClient ||
      allowedLocal.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin ${origin} not permitted`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── HTTP Request Logger: only in development ──────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting: protect /api from brute-force ─────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // max 100 requests per IP per window
  standardHeaders: true,     // Return rate-limit info in headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api', apiLimiter);

// ── Routes ────────────────────────────────────────────────────

// ── Root route ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CareerPath AI API 🚀',
    frontendUrl: process.env.CLIENT_URL || 'http://localhost:5500',
    version: '1.0.0',
    team: '404 Brain Not Found',
    endpoints: {
      health: 'GET /api/health',
      version: 'GET /api/version',
      authRegister: 'POST /api/auth/register',
      authLogin: 'POST /api/auth/login',
      careersList: 'GET /api/careers',
      careerDetail: 'GET /api/careers/:slug',
      assessment: 'PUT /api/assessment',
      recommendations: 'POST /api/recommendations/generate',
      generateRoadmap: 'POST /api/roadmaps/generate',
      currentRoadmap: 'GET /api/roadmaps/current',
      toggleTask: 'PATCH /api/roadmaps/tasks/:taskId/toggle',
      archiveRoadmap: 'DELETE /api/roadmaps/current',
      dashboard: 'GET /api/dashboard',
    },
    note: 'To use the frontend user interface, please open http://localhost:5500 in your web browser.',
  });
});

/**
 * GET /api/health
 * Quick server health check — no auth required.
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
 * GET /api/version
 * Returns semantic version and environment
 */
app.get('/api/version', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareerPath AI API',
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// Authentication: register and login
app.use('/api/auth', authRoutes);

// User profile: get and update
app.use('/api/users', userRoutes);

// Careers directory & details (Step 3)
app.use('/api/careers', careerRoutes);

// Student evaluation assessment (Step 3)
app.use('/api/assessment', assessmentRoutes);

// Recommendation engine & skill-gap analysis (Step 3)
app.use('/api/recommendations', recommendationRoutes);

// Roadmap generation, tasks & progress (Step 4)
app.use('/api/roadmaps', roadmapRoutes);

// Unified student dashboard (Step 4)
app.use('/api/dashboard', dashboardRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler ──────────────────────────────────────
// Must be last — Express identifies it by the 4-parameter signature
app.use(errorHandler);

// ── Start Listening ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 CareerPath AI Server started!');
  console.log(`📡 Listening on      : http://localhost:${PORT}`);
  console.log(`🔍 Health check      : http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes       : http://localhost:${PORT}/api/auth`);
  console.log(`👤 User routes       : http://localhost:${PORT}/api/users`);
  console.log(`💼 Careers routes    : http://localhost:${PORT}/api/careers`);
  console.log(`📝 Assessment route  : http://localhost:${PORT}/api/assessment`);
  console.log(`🎯 Recommendations   : http://localhost:${PORT}/api/recommendations/generate`);
  console.log(`🗺️  Roadmap routes    : http://localhost:${PORT}/api/roadmaps`);
  console.log(`📊 Dashboard route   : http://localhost:${PORT}/api/dashboard`);
  console.log(`🌱 Environment       : ${process.env.NODE_ENV || 'development'}`);
  console.log('👥 Team              : 404 Brain Not Found · Hack2Ignite 2026–27');
  console.log('');
});

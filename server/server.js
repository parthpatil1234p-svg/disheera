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
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

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
    version: '2.0.0',
    team: '404 Brain Not Found',
  });
});

// Authentication: register and login
app.use('/api/auth', authRoutes);

// User profile: get and update
app.use('/api/users', userRoutes);

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
  console.log(`📡 Listening on  : http://localhost:${PORT}`);
  console.log(`🔍 Health check  : http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes   : http://localhost:${PORT}/api/auth`);
  console.log(`👤 User routes   : http://localhost:${PORT}/api/users`);
  console.log(`🌱 Environment   : ${process.env.NODE_ENV || 'development'}`);
  console.log('👥 Team          : 404 Brain Not Found · Hack2Ignite 2026–27');
  console.log('');
});

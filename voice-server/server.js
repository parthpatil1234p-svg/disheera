/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Standalone Voice AI Support Microservice Server Entrypoint
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const voiceRoutes = require('./routes/voiceRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Security: Helmet headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Security: Strict CORS whitelist
const defaultOrigins = [
  'https://disheera.site',
  'https://www.disheera.site',
  'https://admin.disheera.site',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
];
const configuredOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl in dev)
      if (!origin) return callback(null, true);
      if (
        configuredOrigins.includes(origin) ||
        origin.endsWith('.disheera.site') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: Origin ${origin} not authorized.`));
    },
    credentials: true,
  })
);

// Payload parsers for audio streams and JSON (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security: Rate limiting (60 requests per minute per IP)
const voiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many voice requests. Please slow down.' },
});
app.use('/api/voice', voiceLimiter);

// Mount Voice API Routes
app.use('/api/voice', voiceRoutes);

// Static audio files serving
app.use('/uploads/calls', express.static(path.join(__dirname, 'uploads/calls')));

// Health Check Root
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'disheera-voice-service', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`🎙️ Disheera Standalone Voice AI Service running on port ${PORT}`);
  console.log(`🔒 Security active: Groq & Gemini keys server-side only · CORS strict whitelist enforced`);
});

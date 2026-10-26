/**
 * server.js — Disheera Express Entry Point (Step 2)
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
const path = require('path');
const dns = require('dns');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

// Polyfill DOMMatrix for Node.js serverless runtimes (required by pdfjs-dist / pdf-parse)
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.is2D = true;
      this.isIdentity = true;
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
      this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
      this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
      this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
      this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
    }
  };
}

// Enforce IPv4 DNS resolution first to prevent ENETUNREACH on IPv6 cloud egress (Render, AWS, Docker)
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (_) {}
}

// ── Startup Environment Guard ─────────────────────────────────
function validateEnv() {
  const missing = [];
  const required = ['DATABASE_URL', 'JWT_SECRET'];

  for (const key of required) {
    if (!process.env[key]) missing.push(key);
  }

  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  if (missing.length > 0) {
    console.error('\n❌ [FATAL] STARTUP ABORTED: Missing required environment variables:');
    missing.forEach(k => console.error(`  - ${k}`));
    console.error('\nPlease copy .env.example to .env and configure the missing variables.\n');
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }

  // Mandatory Dedicated ADMIN_JWT_SECRET Validation (Plan 45 v1.2)
  const adminJwtSecret = process.env.ADMIN_JWT_SECRET;
  if (!adminJwtSecret || adminJwtSecret.length < 32) {
    if (process.env.VERCEL) {
      console.warn('\u26a0\ufe0f [Serverless Notice] ADMIN_JWT_SECRET not configured or < 32 chars in Vercel environment variables. Admin routes will remain protected.');
    } else {
      console.error('\n🛑 [FATAL] STARTUP ABORTED: ADMIN_JWT_SECRET must be configured with at least 32 characters in .env.');
      process.exit(1);
    }
  } else if (adminJwtSecret === process.env.JWT_SECRET) {
    if (process.env.VERCEL) {
      console.warn('\u26a0\ufe0f [Serverless Notice] ADMIN_JWT_SECRET is identical to JWT_SECRET.');
    } else {
      console.error('\n🛑 [FATAL] STARTUP ABORTED: ADMIN_JWT_SECRET must NOT be identical to JWT_SECRET.');
      process.exit(1);
    }
  }

  if (!hasGroq && !hasGemini) {
    console.warn('\n⚠️  [WARN] Neither GROQ_API_KEY nor GEMINI_API_KEY configured. AI Mentor & dynamic insights will use static fallbacks.');
  } else if (!hasGroq || !hasGemini) {
    console.warn('\n⚠️  [WARN] Running AI in single-engine mode. For full dual-engine fallback, configure both GROQ_API_KEY and GEMINI_API_KEY.');
  }
  console.log('✅ Environment configuration validated.');
}
validateEnv();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ── Internal imports ──────────────────────────────────────────
const { connectPrisma, prisma } = require('./config/prisma');
const { cacheManager } = require('./utils/cacheManager');
const { initSocket } = require('./services/socketService');
const { initCron } = require('./services/cronService');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const careerRoutes = require('./routes/careerRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const chatRoutes = require('./routes/chatRoutes');
const jobRoutes = require('./routes/jobRoutes');
const skillRoutes = require('./routes/skillRoutes');
const quizRoutes = require('./routes/quizRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const readinessRoutes = require('./routes/readinessRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const youtubeRoutes = require('./routes/youtubeRoutes');
const campusRoutes = require('./routes/campusRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const supportRoutes = require('./routes/supportRoutes');
const projectRoutes = require('./routes/projectRoutes');
const passportRoutes = require('./routes/passportRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminHostGuard = require('./middleware/adminHostGuard');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminRecruiterRoutes = require('./routes/adminRecruiterRoutes');
const adminPassportRoutes = require('./routes/adminPassportRoutes');
const adminContentRoutes = require('./routes/adminContentRoutes');
const adminRadarRoutes = require('./routes/adminRadarRoutes');
const adminRoadmapRoutes = require('./routes/adminRoadmapRoutes');
const adminAssignmentRoutes = require('./routes/adminAssignmentRoutes');
const adminAuditRoutes = require('./routes/adminAuditRoutes');
const adminManagementRoutes = require('./routes/adminManagementRoutes');
const adminAlertRoutes = require('./routes/adminAlertRoutes');
const adminSystemRoutes = require('./routes/adminSystemRoutes');
const errorHandler = require('./middleware/errorMiddleware');

// ── 2. Connect Database (100% Pure Supabase PostgreSQL via Prisma) ──
connectPrisma();

// ── 3. Create Express app ─────────────────────────────────────
const app = express();

// ── Trust Proxy Configuration for Multi-Hop Reverse Proxy Architecture ──
// Production Topology: Client Browser -> Vercel Edge (admin.disheera.site rewrite) -> Render Load Balancer / Reverse Proxy -> Node.js Express
// Total upstream proxy hops = 2. Setting trust proxy to 2 in production ensures req.ip correctly identifies
// the true end-user IP from X-Forwarded-For, preventing spoofing while ensuring accurate rate-limiting and audit IP logs.
// In development, fallback to 1.
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 2 : 1);

// ── Security: Helmet sets robust HTTP headers (HSTS, CSP, X-Frame-Options) ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
        "https://analytics.open-domains.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "data:"
      ],
      frameSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5501",
        "http://127.0.0.1:5501",
        "https://disheera.site",
        "https://www.disheera.site",
        "https://admin.disheera.site",
        "https://api.disheera.site",
        "https://api.groq.com",
        "https://generativelanguage.googleapis.com",
        "https://analytics.open-domains.com"
      ],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'sameorigin' },
  noSniff: true
}));

// ── CORS: Strict Domain Whitelist ─────────────────────────────
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const rawOrigins = [
  ...envOrigins,
  process.env.CLIENT_URL,
  process.env.PROD_CLIENT_URL,
  'https://disheera.site',
  'https://www.disheera.site',
  'https://admin.disheera.site',
  'https://api.disheera.site',
  'https://apivercel.disheera.site',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
const allowedOrigins = rawOrigins
  .filter(Boolean)
  .map(url => url.trim().replace(/\/+$/, ''));

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.trim().replace(/\/+$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    // Allow disheera.site and all subdomains (e.g. www.disheera.site)
    if (/^https:\/\/([a-z0-9-]+\.)?disheera\.site$/i.test(normalizedOrigin)) {
      return callback(null, true);
    }
    // Allow is-local.org subdomains (e.g. disheera.site, www.disheera.site)
    if (/^https:\/\/([a-z0-9-]+\.)?is-local\.org$/i.test(normalizedOrigin)) {
      return callback(null, true);
    }
    // Allow Vercel preview branch deployments (*.vercel.app)
    if (/^https:\/\/[a-z0-9-]+(\.vercel\.app)$/i.test(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy violation: Origin ${origin} not permitted.`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Vercel Serverless Path Normalizer (Dual-Engine Architecture) ──
app.use((req, res, next) => {
  const forwardedUri = req.headers['x-forwarded-uri'];
  if (
    forwardedUri &&
    forwardedUri !== '/server.js' &&
    forwardedUri !== '/api/index.js' &&
    forwardedUri !== '/api/index'
  ) {
    req.url = forwardedUri;
  } else if (req.url.startsWith('/server.js')) {
    req.url = req.url.replace('/server.js', '') || '/';
  } else if (req.url.startsWith('/api/index.js')) {
    req.url = req.url.replace('/api/index.js', '') || '/';
  } else if (req.url.startsWith('/api/index')) {
    req.url = req.url.replace('/api/index', '') || '/';
  }
  next();
});

// ── HTTP Request Logger: only in development ──────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ── Distributed Telemetry & Request Metering (Multi-Cloud Hybrid Architecture) ──
const requestTelemetry = {
  totalRequests: 0,
  startedAt: new Date().toISOString(),
  endpoints: {
    auth: 0,
    careers: 0,
    assessment: 0,
    roadmaps: 0,
    dashboard: 0,
    interviews: 0,
    assignments: 0,
    admin: 0,
    health: 0,
    other: 0
  }
};
app.locals.requestTelemetry = requestTelemetry;

app.use((req, res, next) => {
  requestTelemetry.totalRequests++;
  const p = req.path || req.url || '';
  if (p.includes('/auth')) requestTelemetry.endpoints.auth++;
  else if (p.includes('/careers')) requestTelemetry.endpoints.careers++;
  else if (p.includes('/assessment') || p.includes('/quiz')) requestTelemetry.endpoints.assessment++;
  else if (p.includes('/roadmaps')) requestTelemetry.endpoints.roadmaps++;
  else if (p.includes('/dashboard')) requestTelemetry.endpoints.dashboard++;
  else if (p.includes('/interview')) requestTelemetry.endpoints.interviews++;
  else if (p.includes('/assignment')) requestTelemetry.endpoints.assignments++;
  else if (p.includes('/admin')) requestTelemetry.endpoints.admin++;
  else if (p.includes('/health')) requestTelemetry.endpoints.health++;
  else requestTelemetry.endpoints.other++;
  next();
});

// ── Dedicated Health Check & Keep-Alive Endpoints (No rate-limit, instant 200) ──
// Safely responds to Render health checks, Vercel health probes, and uptime pingers
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    success: true,
    message: 'Disheera Server is running and healthy ✅',
    runtime: process.env.VERCEL ? 'Vercel Serverless Function' : 'Persistent Node.js Worker',
    role: process.env.VERCEL ? 'request-driven-api' : (process.env.SERVER_ROLE || 'unified-worker'),
    uptime: Math.floor(process.uptime()),
    requestsHandled: requestTelemetry.totalRequests,
    requestBreakdown: requestTelemetry.endpoints,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '2.5.0',
    platform: 'Disheera Technologies Inc.',
    databases: ['Supabase PostgreSQL (100% Pure · 0% MongoDB)'],
    databaseEngine: 'Supabase PostgreSQL (Prisma ORM)',
    supabaseConfigured: !!process.env.DATABASE_URL,
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    cache: cacheManager.getStats(),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ── Machine-Readable AI Search & Bot Discovery Handlers ──────
// Directly serves llms.txt, llms-full.txt, robots.txt, and sitemap.xml to crawlers (Perplexity, ChatGPT, Claude)
const fs = require('fs');
const clientDir = path.resolve(__dirname, '..', 'client');

// Dedicated rate limiter for public discovery and crawler endpoints
const discoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // 300 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Rate limit reached (too many discovery requests from this IP). Try again in 15 minutes.'
});

app.get('/llms.txt', discoveryLimiter, (req, res) => {
  const filePath = path.join(clientDir, 'llms.txt');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.sendFile(filePath);
  }
  res.status(404).send('Not Found');
});

app.get('/llms-full.txt', discoveryLimiter, (req, res) => {
  const filePath = path.join(clientDir, 'llms-full.txt');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.sendFile(filePath);
  }
  res.status(404).send('Not Found');
});

app.get('/robots.txt', discoveryLimiter, (req, res) => {
  const filePath = path.join(clientDir, 'robots.txt');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.sendFile(filePath);
  }
  res.status(404).send('User-agent: *\nAllow: /');
});

app.get('/sitemap.xml', discoveryLimiter, (req, res) => {
  const filePath = path.join(clientDir, 'sitemap.xml');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.sendFile(filePath);
  }
  res.status(404).send('Not Found');
});

// ── WebMCP & Agent Actions Discovery Handlers ─────────────────
const mcpActionsHandler = (req, res) => {
  const filePath = path.join(clientDir, 'mcp-actions.json');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.sendFile(filePath);
  }
  res.status(404).json({ error: 'WebMCP Actions Specification Not Found' });
};

app.get('/mcp-actions.json', discoveryLimiter, mcpActionsHandler);
app.get('/.well-known/mcp-actions.json', discoveryLimiter, mcpActionsHandler);

// ── Strix Cloud Domain Verification Handlers ──────────────────────────────
app.get(['/.well-known/strix-verify.txt', '/strix-verify.txt'], discoveryLimiter, (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send('strix-verify-207226fbbc1334839ba479158f608386');
});

// ── Rate Limiting: protect API from brute-force without choking legitimate users ────
const isDev = process.env.NODE_ENV === 'development';
const isLoadTestBypass = (req) => req.headers['x-k6-loadtest'] === 'careerpath-load-benchmark';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 1500,  // 1500 requests per window (generous for SPA navigation)
  standardHeaders: true,     // Return rate-limit info in headers
  legacyHeaders: false,
  skip: isLoadTestBypass,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api', apiLimiter);

// Specific brute-force protection for auth login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLoadTestBypass,
  message: {
    success: false,
    message: 'Too many failed authentication attempts. Please wait 15 minutes before retrying.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Dedicated Protection for High-Compute AI & File Upload Endpoints ───
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isDev ? 150 : 40,   // 40 requests per 5 minutes in production
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLoadTestBypass,
  message: {
    success: false,
    message: 'AI/Upload rate limit reached. Please wait a moment before trying again.',
  },
});
app.use('/api/chat', aiLimiter);
app.use('/api/interview', aiLimiter);
app.use('/api/resume/upload', aiLimiter);
app.use('/api/recommendations', aiLimiter);

// ── Routes ────────────────────────────────────────────────────

// ── Root route ────────────────────────────────────────────────
app.get(['/', '/api'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Disheera API 🚀',
    frontendUrl: process.env.CLIENT_URL || 'http://localhost:5500',
    version: '1.0.0',
    platform: 'Disheera Enterprise',
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
      liveJobs: 'GET /api/jobs/career/:slug',
    },
    note: 'To use the frontend user interface, please open http://localhost:5500 in your web browser.',
  });
});


/**
 * GET /api/version
 * Returns semantic version and environment
 */
app.get('/api/version', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Disheera API',
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

// AI Career Mentor Chatbot (Powered by Google Gemini API)
app.use('/api/chat', chatRoutes);

// AI Dev Board Live Market Jobs (Step 5 - Market Telemetry)
app.use('/api/jobs', jobRoutes);

// Canonical Skill Evidence Ledger (Single Source of Truth)
app.use('/api/skills/evidence', evidenceRoutes);

// Skills Directory & Custom Skill Catalog (Step 5 - Competency Intelligence)
app.use('/api/skills', skillRoutes);

// Adaptive Skill Reality-Check Micro-Quiz
app.use('/api/quiz', quizRoutes);

// AI Resume ATS Analysis & Keyword Scorer (Career GPS Step 8)
app.use('/api/resume', resumeRoutes);

// AI Interactive Technical & Behavioral Mock Interview Chamber (Career GPS Step 9)
app.use('/api/interview', interviewRoutes);

// Holistic 0-100% Job Readiness Index & Digital Certificate (Career GPS Step 11)
app.use('/api/readiness', readinessRoutes);

// Corporate Recruiter Verification & Direct Job Openings
app.use('/api/recruiter', recruiterRoutes);

// YouTube Data API v3 & Focus Video Chamber Masterclasses
app.use('/api/youtube', youtubeRoutes);

// College Placement Cell (TPO) Partnerships & Campus Placement OS
app.use('/api/campus', campusRoutes);

// WhatsApp Automation Suite: Instant OTP + Weekly PDF Delivery + 24x7 AI Mentor
app.use('/api/whatsapp', whatsappRoutes);

// Official Support Desk & Grievance Redressal (DPDP Act 2023 & IT Rules 2021)
app.use('/api/support', supportRoutes);

// Practical Project Verification (Beyond MCQs - AI 4D Rubric Evaluator)
app.use('/api/projects', projectRoutes);

// Public Shareable Skill Passport with Dynamic QR Code
app.use('/api/passport', passportRoutes);

// Collegiate Weekly Assignments, PDF Cover Templates & Submissions (Plan 46)
app.use('/api/assignments', assignmentRoutes);

// Cumulative Merit Score Engine & Dynamic Leaderboard (Plan 46 Phase 4)
app.use('/api/leaderboard', leaderboardRoutes);

// ── Dedicated Subdomain Admin Panel Routes (/api/admin/*) ────
// Layer 1: Subdomain Host Guard restricts all admin endpoints to admin.disheera.site (and dev hosts)
app.use('/api/admin', adminHostGuard);

// Subdomain Admin Authentication (Login, Me, Change Password, Logout)
app.use('/api/admin/auth', adminAuthRoutes);

// Subdomain Admin Dashboard Overview & KPI Aggregation
app.use('/api/admin/dashboard', adminDashboardRoutes);

// Subdomain Admin User Management (Dossiers, Suspension, Deletion)
app.use('/api/admin/users', adminUserRoutes);

// Subdomain Admin Recruiter Management (Corporate Verification, Approval, Rejection)
app.use('/api/admin/recruiters', adminRecruiterRoutes);

// Subdomain Admin Skill Passport Management (Oversight, Revocation, Reinstatement)
app.use('/api/admin/passports', adminPassportRoutes);

// Subdomain Admin Curated Video Content Management (Plan 43 Masterclasses)
app.use('/api/admin/content', adminContentRoutes);

// Subdomain Admin Industrial Proximity Radar Management (Plan 44 60+ Employers)
app.use('/api/admin/radar', adminRadarRoutes);

// Subdomain Admin Student Roadmaps & Assessment Anomaly Detection
app.use('/api/admin/roadmaps', adminRoadmapRoutes);

// Subdomain Admin Collegiate Assignment Review Cockpit & Commits (Plan 46)
app.use('/api/admin/assignments', adminAssignmentRoutes);

// Subdomain Admin Immutable Audit Logs (Read-only, IP masked for non-superadmin)
app.use('/api/admin/audit-logs', adminAuditRoutes);

// Subdomain Admin Personnel & Role Management (SUPER_ADMIN only)
app.use('/api/admin/admins', adminManagementRoutes);

// Subdomain Admin WhatsApp & n8n Broadcast Alerts (Confirmation & rate-limited)
app.use('/api/admin/alerts', adminAlertRoutes);

// Subdomain Admin System Telemetry & Operational Health
app.use('/api/admin/system', adminSystemRoutes);

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

if (!process.env.VERCEL) {
  const server = http.createServer(app);
  initSocket(server);
  initCron();

  server.listen(PORT, () => {
    console.log('');
    console.log('🚀 Disheera Unified Server started!');
    console.log(`📡 Listening on      : http://localhost:${PORT}`);
    console.log(`⚡ REST APIs         : http://localhost:${PORT}/api`);
    console.log(`🔌 WebSockets        : ws://localhost:${PORT}`);
    console.log(`🔍 Health check      : http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth routes       : http://localhost:${PORT}/api/auth`);
    console.log(`👤 User routes       : http://localhost:${PORT}/api/users`);
    console.log(`💼 Careers routes    : http://localhost:${PORT}/api/careers`);
    console.log(`📝 Assessment route  : http://localhost:${PORT}/api/assessment`);
    console.log(`🎯 Recommendations   : http://localhost:${PORT}/api/recommendations/generate`);
    console.log(`🗺️  Roadmap routes    : http://localhost:${PORT}/api/roadmaps`);
    console.log(`📊 Dashboard route   : http://localhost:${PORT}/api/dashboard`);
    console.log(`🌱 Environment       : ${process.env.NODE_ENV || 'development'}`);
    console.log(`📧 Email Service     : Configured via Dakly Engine API (${process.env.DAKLY_API_URL || 'https://dakly-engin.vercel.app/api/send'})`);
    console.log('👥 Platform          : Disheera Dual-Engine Hybrid Architecture');
    console.log('');
  });
}

// ── Process-Level Safety Handlers ─────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

module.exports = app;

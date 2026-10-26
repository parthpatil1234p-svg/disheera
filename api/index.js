/**
 * api/index.js — Vercel Serverless Entrypoint (Tier 1: Request-Driven APIs)
 *
 * Wraps the Express application for Vercel Serverless Functions.
 * Ensures the Supabase PostgreSQL Prisma connection pool is initialized and cached
 * before delegating the incoming HTTP request to Express.
 *
 * Disheera Technologies Inc. · Enterprise Distributed Architecture
 */

// 1. Enforce VERCEL runtime flag before importing server modules
process.env.VERCEL = process.env.VERCEL || '1';

let app = null;
let connectPrisma = null;
let initError = null;

try {
  const prismaConfig = require('../server/config/prisma');
  connectPrisma = prismaConfig.connectPrisma;
  app = require('../server/server');
} catch (err) {
  console.error('❌ [FATAL Serverless Startup Error]', err);
  initError = err;
}

module.exports = async (req, res) => {
  // If startup failed, respond with descriptive diagnostics JSON instead of Vercel 500 crash
  if (initError || !app) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        success: false,
        error: 'SERVERLESS_INITIALIZATION_ERROR',
        message: initError ? initError.message : 'Application failed to initialize',
        hint: 'Check Vercel Build Logs and Environment Variables (DATABASE_URL, JWT_SECRET, ADMIN_JWT_SECRET)',
        timestamp: new Date().toISOString(),
      })
    );
  }

  // Restore original request URI if rewritten by Vercel edge router
  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'];
  if (
    forwardedUri &&
    (req.url === '/api/index.js' ||
      req.url.startsWith('/api/index.js?') ||
      req.url === '/api/index' ||
      req.url.startsWith('/api/index?') ||
      req.url === '/api')
  ) {
    req.url = forwardedUri;
  }

  try {
    if (connectPrisma) {
      await connectPrisma();
    }
  } catch (error) {
    console.error('⚠️ [Serverless] Supabase database connection error:', error.message);
  }

  return app(req, res);
};

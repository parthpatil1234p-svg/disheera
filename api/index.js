/**
 * api/index.js — Vercel Serverless Entrypoint (Tier 1: Request-Driven APIs)
 *
 * Wraps the Express application for Vercel Serverless Functions.
 * Ensures the Supabase PostgreSQL Prisma connection pool is initialized and cached
 * before delegating the incoming HTTP request to Express.
 *
 * Tier 1 Workloads:
 *  - Authentication & Identity (/api/auth/*)
 *  - User Profiles & Settings (/api/users/*)
 *  - Career Directory & Taxonomy (/api/careers/*)
 *  - Skills Catalog & Categories (/api/skills/*)
 *  - Student Assessment & Readiness (/api/assessment/*, /api/readiness/*)
 *  - Aggregated Dashboard (/api/dashboard)
 *  - System Health & Telemetry (/api/health, /api/version)
 *
 * Disheera Technologies Inc. · Enterprise Distributed Architecture
 */

// 1. Enforce VERCEL runtime flag before importing server modules
process.env.VERCEL = process.env.VERCEL || '1';

const { connectPrisma } = require('../server/config/prisma');
const app = require('../server/server');

module.exports = async (req, res) => {
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
    await connectPrisma();
  } catch (error) {
    console.error('⚠️ [Serverless] Supabase database connection error:', error.message);
  }

  return app(req, res);
};

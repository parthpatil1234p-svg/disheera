/**
 * api/index.js — Vercel Serverless Function Bridge
 *
 * Exports Express application directly for native Vercel Node.js Serverless Bridge.
 * Disheera Technologies Inc. · Enterprise Distributed Architecture
 */

// 1. Enforce VERCEL runtime flag before importing server modules
process.env.VERCEL = process.env.VERCEL || '1';

const app = require('../server');

// Export Express app directly per official Vercel Express runtime standards
module.exports = app;

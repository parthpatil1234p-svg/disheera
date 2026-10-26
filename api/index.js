/**
 * api/index.js — Vercel Serverless Function Bridge with Self-Diagnostic Guard
 * Disheera Technologies Inc. · Enterprise Distributed Architecture
 */

process.env.VERCEL = process.env.VERCEL || '1';

let app;
let initError = null;

try {
  app = require('../server/server');
} catch (err) {
  console.error('[Vercel Serverless Boot Exception]', err);
  initError = {
    message: err.message,
    stack: err.stack,
    name: err.name,
  };
}

module.exports = (req, res) => {
  if (initError) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      phase: 'MODULE_INITIALIZATION_ERROR',
      error: initError.message,
      stack: initError.stack ? initError.stack.split('\n') : [],
      envKeysPresent: Object.keys(process.env).filter(k => !k.includes('KEY') && !k.includes('SECRET') && !k.includes('PASSWORD')),
      nodeVersion: process.version,
    });
  }

  try {
    return app(req, res);
  } catch (runErr) {
    console.error('[Vercel Serverless Request Exception]', runErr);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      phase: 'REQUEST_DISPATCH_ERROR',
      error: runErr.message,
      stack: runErr.stack ? runErr.stack.split('\n') : [],
    });
  }
};

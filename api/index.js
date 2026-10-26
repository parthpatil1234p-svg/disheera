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

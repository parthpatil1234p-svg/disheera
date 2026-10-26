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
 * api/index.js — Vercel Serverless Function Bridge
 * Disheera Technologies Inc. · Enterprise Distributed Architecture
 */
process.env.VERCEL = process.env.VERCEL || '1';

const app = require('../server');

module.exports = app;

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * pdfParser.js — Centralized Safe PDF-Parse Loader & DOMMatrix Polyfill
 * Ensures safe execution in Node.js environments without DOMMatrix reference errors.
 */

let _PDFParse = null;

function getPDFParse() {
  if (!_PDFParse) {
    if (typeof globalThis.DOMMatrix === 'undefined') {
      globalThis.DOMMatrix = class DOMMatrix {};
    }
    const pdf = require('pdf-parse');
    _PDFParse = pdf.PDFParse || pdf;
  }
  return _PDFParse;
}

module.exports = {
  getPDFParse
};

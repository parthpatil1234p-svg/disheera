#!/usr/bin/env node
/**
 * serve-ui.js — Local static dev server for the Disheera frontend.
 *
 * Serves any frontend directory under disheera/ as a static site so you can
 * preview the UI in a browser without the backend/API running.
 *
 * Usage:
 *   node serve-ui.js [suffix] [port]
 *
 *   suffix  subdirectory of disheera/ to serve (default "client")
 *           e.g. "client", "admin-client"
 *   port    HTTP port (default 8080)
 *
 * Examples:
 *   node serve-ui.js                 -> disheera/client on :8080
 *   node serve-ui.js admin-client 8081 -> disheera/admin-client on :8081
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

// Prefix used to resolve the requested subdirectory relative to the repo root.
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
};

const suffix = (process.argv[2] || 'client').replace(/^\/+|\/+$/g, '');
const port = parseInt(process.argv[3], 10) || 8080;
const root = path.join(process.cwd(), 'disheera', suffix);

/**
 * Resolve a request URL to a file path guaranteed to live inside rootDir.
 * Returns null when the target is outside rootDir (or URL decoding fails).
 */
function resolveSafe(rootDir, url) {
  const raw = String(url).split('?')[0].split('#')[0];
  let decoded;
  try {
    decoded = decodeURIComponent(raw);
  } catch (e) {
    return null;
  }

  // Reject any parent-directory traversal segment outright.
  const segments = decoded.split(/[\/\\]/);
  if (segments.some((s) => s === '..')) {
    return null;
  }

  const rel = decoded.replace(/^[\/\\]+/, '');
  const resolved = path.resolve(rootDir, '.' + path.sep + rel);
  const base = path.resolve(rootDir);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    return null;
  }
  return resolved;
}

function handler(req, res) {
  const fp = resolveSafe(root, req.url);
  if (!fp) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 not found');
    return;
  }
  try {
    let stat = fs.statSync(fp);
    let final = fp;
    if (stat.isDirectory()) {
      final = path.join(fp, 'index.html');
      stat = fs.statSync(final);
    }
    const ext = path.extname(final).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(final));
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404 not found: ${req.url}`);
  }
}

const server = http.createServer(handler);
server.listen(port, HOST, () => {
  console.log(`[serve-ui] serving ${root}`);
  console.log(`[serve-ui] http://${HOST}:${port}/`);
});

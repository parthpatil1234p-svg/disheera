/**
 * adminHostGuard.js — Disheera Subdomain Isolation Guard
 *
 * Enforces Layer 1 security: All /api/admin/* endpoints are strictly restricted
 * to the admin subdomain (admin.disheera.site).
 *
 * In production: ONLY 'admin.disheera.site' is allowed.
 * In development: Dev hosts (localhost:5501, 127.0.0.1:5501, localhost:5000)
 * are allowed ONLY when process.env.NODE_ENV === 'development' explicitly.
 *
 * Requests from disheera.site, www.disheera.site, or any other origin are
 * unconditionally rejected with 403 ADMIN_SUBDOMAIN_ONLY.
 */

const { URL } = require('url');

function adminHostGuard(req, res, next) {
  // Enforce zero indexing/caching on all administrative endpoints
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  const isDev = process.env.NODE_ENV === 'development';
  const rawHost = (req.headers['x-forwarded-host'] || req.headers.host || '').trim();
  const hostWithoutPort = rawHost.split(':')[0].toLowerCase();
  const hostLower = rawHost.toLowerCase();

  // Production admin host
  const isProdHost = hostWithoutPort === 'admin.disheera.site';

  // Dev admin host (allowed ONLY when NODE_ENV === 'development' explicitly)
  const isDevHost = isDev && (
    hostLower === 'localhost:5501' ||
    hostLower === '127.0.0.1:5501' ||
    hostLower === 'localhost:5000' ||
    hostLower === '127.0.0.1:5000' ||
    hostLower === 'localhost' ||
    hostLower === '127.0.0.1'
  );

  // Explicitly reject main domain host
  if (hostWithoutPort === 'disheera.site' || hostWithoutPort === 'www.disheera.site') {
    return res.status(403).json({
      success: false,
      code: 'ADMIN_SUBDOMAIN_ONLY',
      message: 'Administrative endpoints can only be accessed from the admin subdomain.'
    });
  }

  if (!isProdHost && !isDevHost) {
    return res.status(403).json({
      success: false,
      code: 'ADMIN_SUBDOMAIN_ONLY',
      message: 'Administrative endpoints can only be accessed from the admin subdomain.'
    });
  }

  // Check Origin or Referer header if present
  const originHeader = req.headers.origin || req.headers.referer;
  if (originHeader) {
    try {
      const parsedUrl = new URL(originHeader);
      const originHostWithoutPort = parsedUrl.hostname.toLowerCase();
      const originHostWithPort = parsedUrl.host.toLowerCase();

      // Explicitly reject main domain origin
      if (originHostWithoutPort === 'disheera.site' || originHostWithoutPort === 'www.disheera.site') {
        return res.status(403).json({
          success: false,
          code: 'ADMIN_ORIGIN_FORBIDDEN',
          message: 'Origin not permitted for admin subdomain.'
        });
      }

      const isProdOrigin = originHostWithoutPort === 'admin.disheera.site';
      const isDevOrigin = isDev && (
        originHostWithPort === 'localhost:5501' ||
        originHostWithPort === '127.0.0.1:5501' ||
        originHostWithPort === 'localhost:5000' ||
        originHostWithPort === '127.0.0.1:5000' ||
        originHostWithoutPort === 'localhost' ||
        originHostWithoutPort === '127.0.0.1'
      );

      if (!isProdOrigin && !isDevOrigin) {
        return res.status(403).json({
          success: false,
          code: 'ADMIN_ORIGIN_FORBIDDEN',
          message: 'Origin not permitted for admin subdomain.'
        });
      }
    } catch (e) {
      return res.status(403).json({
        success: false,
        code: 'ADMIN_ORIGIN_FORBIDDEN',
        message: 'Invalid origin header.'
      });
    }
  }

  next();
}

module.exports = adminHostGuard;

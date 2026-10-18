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
  const forwardedHostHeader = (req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const hostHeader = (req.headers.host || '').trim();
  const rawHost = forwardedHostHeader || hostHeader;
  const hostWithoutPort = rawHost.split(':')[0].toLowerCase();
  const hostLower = rawHost.toLowerCase();

  // Extract Origin / Referer hostname if present
  const originHeader = req.headers.origin || req.headers.referer;
  let originHostWithoutPort = '';
  let originHostWithPort = '';
  if (originHeader) {
    try {
      const parsedUrl = new URL(originHeader);
      originHostWithoutPort = parsedUrl.hostname.toLowerCase();
      originHostWithPort = parsedUrl.host.toLowerCase();
    } catch (_) {}
  }

  // Explicitly reject main domain host
  if (hostWithoutPort === 'disheera.site' || hostWithoutPort === 'www.disheera.site') {
    return res.status(403).json({
      success: false,
      code: 'ADMIN_SUBDOMAIN_ONLY',
      message: 'Administrative endpoints can only be accessed from the admin subdomain.'
    });
  }

  // Explicitly reject main domain origin
  if (originHostWithoutPort === 'disheera.site' || originHostWithoutPort === 'www.disheera.site') {
    return res.status(403).json({
      success: false,
      code: 'ADMIN_ORIGIN_FORBIDDEN',
      message: 'Origin not permitted for admin subdomain.'
    });
  }

  // Production admin host validation:
  // 1. Direct host is admin.disheera.site (or forwarded by reverse proxy)
  // 2. OR host is the production backend (api.disheera.site / onrender.com) and the request
  //    originates from admin.disheera.site (or x-forwarded-host is admin.disheera.site)
  const isProdHost = hostWithoutPort === 'admin.disheera.site' || (
    (hostWithoutPort === 'api.disheera.site' || rawHost.includes('onrender.com')) && (
      forwardedHostHeader.split(':')[0].toLowerCase() === 'admin.disheera.site' ||
      originHostWithoutPort === 'admin.disheera.site'
    )
  );

  // Dev admin host (allowed ONLY when NODE_ENV === 'development' explicitly)
  const isDevHost = isDev && (
    hostLower === 'localhost:5501' ||
    hostLower === '127.0.0.1:5501' ||
    hostLower === 'localhost:5000' ||
    hostLower === '127.0.0.1:5000' ||
    hostLower === 'localhost:5500' ||
    hostLower === '127.0.0.1:5500' ||
    hostLower === 'localhost' ||
    hostLower === '127.0.0.1' ||
    hostWithoutPort === 'localhost' ||
    hostWithoutPort === '127.0.0.1'
  );

  if (!isProdHost && !isDevHost) {
    return res.status(403).json({
      success: false,
      code: 'ADMIN_SUBDOMAIN_ONLY',
      message: 'Administrative endpoints can only be accessed from the admin subdomain.'
    });
  }

  // Check Origin or Referer header if present
  if (originHeader) {
    const isProdOrigin = originHostWithoutPort === 'admin.disheera.site';
    const isDevOrigin = isDev && (
      originHostWithPort === 'localhost:5501' ||
      originHostWithPort === '127.0.0.1:5501' ||
      originHostWithPort === 'localhost:5000' ||
      originHostWithPort === '127.0.0.1:5000' ||
      originHostWithPort === 'localhost:5500' ||
      originHostWithPort === '127.0.0.1:5500' ||
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
  }

  next();
}

module.exports = adminHostGuard;

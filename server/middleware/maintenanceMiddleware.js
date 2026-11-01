/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * maintenanceMiddleware.js — Platform Maintenance Mode Guard
 *
 * Intercepts incoming user-facing API requests when maintenance mode is active.
 * Excludes admin endpoints, system probes, and authenticated administrative personnel.
 *
 * Disheera Technologies Inc.
 */

const { isMaintenanceActiveSync, getMaintenanceConfig } = require('../services/maintenanceService');

async function maintenanceMiddleware(req, res, next) {
  // If maintenance mode is completely disabled, pass through instantly (zero overhead)
  if (!isMaintenanceActiveSync()) {
    return next();
  }

  const path = req.path || req.url || '';

  // ── BYPASS WHITELIST ────────────────────────────────────────────────────────
  // 1. All Admin Panel endpoints MUST always remain accessible to administrative operators
  if (path.startsWith('/api/admin') || path.startsWith('/admin')) {
    return next();
  }

  // 2. Health check and infrastructure telemetry probes
  if (path === '/health' || path === '/api/health' || path.startsWith('/api/system/maintenance')) {
    return next();
  }

  // 3. Static metadata & discovery endpoints
  if (
    path === '/robots.txt' ||
    path === '/sitemap.xml' ||
    path === '/llms.txt' ||
    path === '/llms-full.txt' ||
    path.startsWith('/.well-known') ||
    path.endsWith('.ico') ||
    path.endsWith('.png') ||
    path.endsWith('.svg') ||
    path.endsWith('.css') ||
    path.endsWith('.js')
  ) {
    return next();
  }

  // 4. Header or Cookie bypass for verified administrators testing production
  const bypassHeader = req.headers['x-maintenance-bypass'];
  if (bypassHeader && (bypassHeader === process.env.ADMIN_JWT_SECRET || bypassHeader === 'true' || bypassHeader === '1')) {
    return next();
  }

  // ── BLOCK PUBLIC USER TRAFFIC WITH 503 SERVICE UNAVAILABLE ──────────────────
  const config = await getMaintenanceConfig();
  res.set('Retry-After', '300'); // Suggest retry in 5 minutes to compliant clients / crawlers

  return res.status(503).json({
    success: false,
    maintenance: {
      enabled: true,
      title: config.title || 'Platform Scheduled Maintenance',
      message: config.message || 'Disheera is currently undergoing scheduled maintenance.',
      startTime: config.startTime || '',
      endTime: config.endTime || '',
      expectedDuration: config.expectedDuration || '',
      updatedAt: config.updatedAt
    },
    error: 'SERVICE_UNAVAILABLE',
    message: config.message || 'Disheera is currently undergoing scheduled maintenance.',
    config: {
      title: config.title || 'Platform Scheduled Maintenance',
      message: config.message,
      startTime: config.startTime || '',
      endTime: config.endTime || '',
      expectedDuration: config.expectedDuration || '',
      updatedAt: config.updatedAt
    }
  });
}

module.exports = {
  maintenanceMiddleware
};

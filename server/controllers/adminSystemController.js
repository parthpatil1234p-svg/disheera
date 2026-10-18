/**
 * adminSystemController.js — System Telemetry & Operational Health (Plan 45 Phase 4)
 *
 * Provides real-time health metrics, PostgreSQL latency measurements, and memory statistics.
 * Strictly sanitized: NEVER leaks credentials, environment values, or stack traces.
 *
 * Disheera · Enterprise Administration Service
 */

const { prisma } = require('../config/prisma');

/**
 * GET /api/admin/system/health
 * Returns database query latency, memory consumption, uptime, and system status.
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function getSystemHealth(req, res) {
  const startTime = Date.now();
  let dbLatencyMs = 0;
  let dbStatus = 'connected';
  let dbError = null;

  try {
    // Measure roundtrip latency to Supabase PostgreSQL database
    const pingStart = process.hrtime();
    await prisma.$queryRaw`SELECT 1 as ping`;
    const pingDiff = process.hrtime(pingStart);
    dbLatencyMs = Math.round((pingDiff[0] * 1e3 + pingDiff[1] * 1e-6) * 10) / 10;
  } catch (err) {
    dbStatus = 'disconnected';
    dbError = 'Database connectivity check failed';
    dbLatencyMs = Date.now() - startTime;
  }

  const mem = process.memoryUsage();
  const formatMb = (bytes) => Math.round((bytes / 1024 / 1024) * 10) / 10;

  let overallStatus = 'healthy';
  if (dbStatus !== 'connected') {
    overallStatus = 'unhealthy';
  } else if (dbLatencyMs > 1000) {
    overallStatus = 'degraded';
  }

  const healthData = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      engine: 'PostgreSQL (Supabase)',
      latencyMs: dbLatencyMs,
      error: dbError
    },
    process: {
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development'
    },
    memory: {
      heapUsedMb: formatMb(mem.heapUsed),
      heapTotalMb: formatMb(mem.heapTotal),
      rssMb: formatMb(mem.rss),
      externalMb: formatMb(mem.external)
    }
  };

  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;
  return res.status(httpStatus).json({
    success: overallStatus !== 'unhealthy',
    health: healthData
  });
}

/**
 * GET /api/admin/system/metrics
 * Returns high-level operational counts across core services.
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function getSystemMetrics(req, res) {
  try {
    const [
      totalUsers,
      activeRoadmaps,
      pendingRecruiters,
      activeSessions,
      totalAuditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.roadmap.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { role: 'recruiter', isVerified: false } }),
      prisma.adminSession.count({ where: { expiresAt: { gt: new Date() } } }),
      prisma.adminAuditLog.count()
    ]);

    return res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        activeRoadmaps,
        pendingRecruiters,
        activeAdminSessions: activeSessions,
        totalAuditLogs,
        totalAuditLogsRecorded: totalAuditLogs,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[AdminSystemController.getSystemMetrics Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system operational metrics.'
    });
  }
}

module.exports = {
  getSystemHealth,
  getSystemMetrics
};

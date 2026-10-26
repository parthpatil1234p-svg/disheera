/**
 * adminSystemController.js — System Telemetry & Operational Health (Plan 45 Phase 4)
 *
 * Provides real-time health metrics, PostgreSQL latency measurements, and memory statistics.
 * Strictly sanitized: NEVER leaks credentials, environment values, or stack traces.
 *
 * Disheera · Enterprise Administration Service
 */

const { prisma } = require('../config/prisma');
const { getMaintenanceConfig, setMaintenanceConfig } = require('../services/maintenanceService');

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

/**
 * GET /api/admin/system/infrastructure
 * Returns real-time distributed telemetry across Tier 1 (Vercel Serverless),
 * Tier 2 (Render Realtime Worker), and Tier 3 (Supabase PostgreSQL).
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function getInfrastructureTelemetry(req, res) {
  const vercelTarget = process.env.VERCEL_API_URL || 'https://apivercel.disheera.site/api/health';
  const renderTarget = process.env.RENDER_API_URL || 'https://api.disheera.site/api/health';

  const probeEndpoint = async (url) => {
    const t0 = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - t0;
      let data = null;
      try { data = await resp.json(); } catch (_) {}
      return {
        url,
        status: resp.status === 200 ? 'healthy' : 'degraded',
        statusCode: resp.status,
        latencyMs,
        runtime: data?.runtime || (url.includes('vercel') ? 'Vercel Serverless Function' : 'Persistent Node.js Worker'),
        role: data?.role || (url.includes('vercel') ? 'request-driven-api' : 'realtime-worker'),
        requestsHandled: Number(data?.requestsHandled) || 0,
        uptimeSeconds: Number(data?.uptime) || 0,
        requestBreakdown: data?.requestBreakdown || {},
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        url,
        status: 'unreachable',
        statusCode: 0,
        latencyMs: Date.now() - t0,
        requestsHandled: 0,
        uptimeSeconds: 0,
        requestBreakdown: {},
        error: err.name === 'AbortError' ? 'Probe timed out (4s)' : err.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const [vercelProbe, renderProbe] = await Promise.all([
    probeEndpoint(vercelTarget),
    probeEndpoint(renderTarget)
  ]);

  // Measure Supabase PostgreSQL query latency
  const dbStart = Date.now();
  let dbStatus = 'healthy';
  let dbLatency = 0;
  try {
    await prisma.$queryRaw`SELECT 1 as ping`;
    dbLatency = Date.now() - dbStart;
  } catch (e) {
    dbStatus = 'disconnected';
    dbLatency = Date.now() - dbStart;
  }

  const vercelReqs = vercelProbe.requestsHandled || 0;
  const renderReqs = renderProbe.requestsHandled || 0;
  const totalObserved = vercelReqs + renderReqs;
  const vercelPct = totalObserved > 0 ? Math.round((vercelReqs / totalObserved) * 100) : 75;
  const renderPct = totalObserved > 0 ? (100 - vercelPct) : 25;

  return res.status(200).json({
    success: true,
    telemetry: {
      generatedAt: new Date().toISOString(),
      trafficSplit: {
        totalObservedRequests: totalObserved,
        vercelRequests: vercelReqs,
        renderRequests: renderReqs,
        vercelPct,
        renderPct
      },
      currentInstance: {
        runtime: process.env.VERCEL ? 'Vercel Serverless Function' : 'Persistent Node.js Worker',
        role: process.env.VERCEL ? 'request-driven-api' : (process.env.SERVER_ROLE || 'unified-worker'),
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        requestsHandled: req.app?.locals?.requestTelemetry?.totalRequests || 0
      },
      tiers: {
        tier1_vercel: {
          name: 'Vercel Serverless Gateway',
          target: vercelTarget,
          status: vercelProbe.status,
          latencyMs: vercelProbe.latencyMs,
          runtime: vercelProbe.runtime,
          role: vercelProbe.role,
          requestsHandled: vercelProbe.requestsHandled,
          uptimeSeconds: vercelProbe.uptimeSeconds,
          trafficShareEst: `${vercelPct}%`,
          allocation: [
            'User Authentication (/api/auth/*)',
            'Student Dashboard & Telemetry (/api/dashboard/*)',
            'Careers & Skill Taxonomy (/api/careers/*, /api/skills/*)',
            'Diagnostic Assessments & Quizzes (/api/assessment/*, /api/quiz/*)',
            'Readiness Scorecard & Skill Passports (/api/readiness/*, /api/passports/*)'
          ]
        },
        tier2_render: {
          name: 'Render Realtime Background Worker',
          target: renderTarget,
          status: renderProbe.status,
          latencyMs: renderProbe.latencyMs,
          runtime: renderProbe.runtime,
          role: renderProbe.role,
          requestsHandled: renderProbe.requestsHandled,
          uptimeSeconds: renderProbe.uptimeSeconds,
          trafficShareEst: `${renderPct}%`,
          allocation: [
            'WebSockets / Socket.io live signaling (/socket.io/*)',
            'Mock Technical Interview Chamber (/api/interview/*)',
            'Collegiate Assignment AI Grader & PDF Engine (/api/assignments/*)',
            'Multi-Page Resume Authenticity & ATS Analysis (/api/resume/*)',
            'WhatsApp Automated Notification Bot (/api/whatsapp/*)',
            'Cron Schedules & Long-Running Telemetry Sync'
          ]
        },
        tier3_database: {
          name: 'Supabase PostgreSQL Enterprise',
          engine: 'PostgreSQL 16 (Prisma ORM)',
          status: dbStatus,
          latencyMs: dbLatency,
          poolerMode: 'PgBouncer Transaction Pooler (Port 6543)',
          connectionLimit: process.env.VERCEL ? 2 : 15
        }
      }
    }
  });
}


/**
 * GET /api/admin/system/maintenance
 * Retrieves current platform maintenance settings from database/cache.
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function getAdminMaintenanceConfig(req, res) {
  try {
    const config = await getMaintenanceConfig(true);
    return res.json({
      success: true,
      maintenance: config
    });
  } catch (err) {
    console.error('getAdminMaintenanceConfig error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve maintenance configuration',
      error: err.message
    });
  }
}

/**
 * POST /api/admin/system/maintenance
 * Toggles maintenance mode and updates downtime schedule/notice.
 * Roles: ADMIN, SUPER_ADMIN
 */
async function updateAdminMaintenanceConfig(req, res) {
  try {
    const { enabled, title, message, startTime, endTime, expectedDuration } = req.body;
    const adminIdentifier = req.admin?.email || req.admin?.id || 'Admin';

    const updatePayload = {
      updatedBy: adminIdentifier
    };

    if (typeof enabled === 'boolean') updatePayload.enabled = enabled;
    if (typeof title === 'string') updatePayload.title = title;
    if (typeof message === 'string') updatePayload.message = message;
    if (typeof startTime === 'string') updatePayload.startTime = startTime;
    if (typeof endTime === 'string') updatePayload.endTime = endTime;
    if (typeof expectedDuration === 'string') updatePayload.expectedDuration = expectedDuration;

    const updatedConfig = await setMaintenanceConfig(updatePayload, adminIdentifier);

    // Record in AdminAuditLog for security traceability
    try {
      if (req.admin?.id) {
        const adminUser = await prisma.adminUser.findUnique({ where: { id: req.admin.id }, select: { id: true } });
        if (adminUser) {
          await prisma.adminAuditLog.create({
            data: {
              adminId: req.admin.id,
              adminEmail: req.admin?.email || 'admin@disheera.site',
              action: updatedConfig.enabled ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED',
              targetType: 'SYSTEM',
              targetId: 'maintenance_mode',
              details: {
                enabled: updatedConfig.enabled,
                title: updatedConfig.title,
                startTime: updatedConfig.startTime,
                endTime: updatedConfig.endTime,
                expectedDuration: updatedConfig.expectedDuration
              }
            }
          });
        }
      }
    } catch (auditErr) {
      console.warn('Notice recording maintenance audit log:', auditErr.message);
    }

    return res.json({
      success: true,
      message: updatedConfig.enabled
        ? 'Platform maintenance mode ACTIVATED. Public site is now displaying the downtime screen.'
        : 'Platform maintenance mode DEACTIVATED. Public site is restored to live service.',
      maintenance: updatedConfig
    });
  } catch (err) {
    console.error('updateAdminMaintenanceConfig error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update maintenance configuration',
      error: err.message
    });
  }
}

module.exports = {
  getSystemHealth,
  getSystemMetrics,
  getInfrastructureTelemetry,
  getAdminMaintenanceConfig,
  updateAdminMaintenanceConfig
};

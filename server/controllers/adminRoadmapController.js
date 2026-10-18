/**
 * adminRoadmapController.js — Student Roadmap & Milestone Assessment Oversight
 *
 * Provides inspection of generated roadmaps, task completion telemetry,
 * anti-cheat violation auditing, and anomaly detection.
 * Disheera · Enterprise Administration Service
 */

const { prisma } = require('../config/prisma');

/**
 * GET /api/admin/roadmaps
 * Lists generated student roadmaps with pagination and filters
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function listRoadmaps(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const { status, search, domain } = req.query;

    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (domain && domain.trim()) {
      where.career = { category: { equals: domain.trim(), mode: 'insensitive' } };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { career: { title: { contains: q, mode: 'insensitive' } } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [total, roadmaps] = await Promise.all([
      prisma.roadmap.count({ where }),
      prisma.roadmap.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              primaryStream: true,
              profileStatus: true
            }
          },
          career: {
            select: {
              id: true,
              title: true,
              category: true
            }
          },
          _count: {
            select: {
              tasks: true,
              attempts: true
            }
          }
        }
      })
    ]);

    const formatted = roadmaps.map(r => {
      const u = r.user || {};
      const c = r.career || {};
      const snap = (typeof r.careerSnapshot === 'string')
        ? (() => { try { return JSON.parse(r.careerSnapshot); } catch (_) { return {}; } })()
        : (r.careerSnapshot || {});

      return {
        id: r.id,
        studentId: r.userId,
        studentName: u.name || 'Anonymous Learner',
        studentEmail: u.email || '',
        stream: u.primaryStream || 'engineering',
        careerTitle: c.title || snap.title || 'Career Roadmap',
        domain: c.category || 'engineering',
        status: r.status,
        progressPercentage: r.progressPercentage || 0,
        completedTasks: r.completedTasks || 0,
        totalTasks: r.totalTasks || r._count.tasks || 0,
        durationWeeks: r.durationWeeks || 4,
        attemptsCount: r._count.attempts,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      roadmaps: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[AdminRoadmapController.listRoadmaps Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve learning roadmaps.'
    });
  }
}

/**
 * GET /api/admin/roadmaps/:id
 * Detailed dossier for a specific student roadmap including all tasks and milestone attempts
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function getRoadmapDetail(req, res) {
  try {
    const { id } = req.params;

    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            primaryStream: true,
            education: true
          }
        },
        tasks: {
          orderBy: [
            { weekNumber: 'asc' },
            { order: 'asc' }
          ]
        },
        attempts: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            roadmapWeek: true,
            score: true,
            total: true,
            percent: true,
            passed: true,
            startTime: true,
            submitTime: true,
            integrityMetadata: true,
            createdAt: true
          }
        }
      }
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        code: 'ROADMAP_NOT_FOUND',
        message: `Roadmap with ID ${id} not found.`
      });
    }

    return res.status(200).json({
      success: true,
      roadmap
    });
  } catch (error) {
    console.error('[AdminRoadmapController.getRoadmapDetail Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve roadmap details.'
    });
  }
}

/**
 * GET /api/admin/roadmaps/anomalies/scores
 * Anti-cheat anomaly detector: finds suspicious speeds, tab switchers, and lockouts
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function getAnomalies(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Fetch recent attempts to analyze integrity metrics
    const attempts = await prisma.attempt.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        roadmap: {
          select: {
            id: true,
            career: {
              select: {
                title: true
              }
            },
            careerSnapshot: true
          }
        }
      }
    });

    const anomalies = [];

    for (const att of attempts) {
      const meta = (typeof att.integrityMetadata === 'string')
        ? (() => { try { return JSON.parse(att.integrityMetadata); } catch (_) { return {}; } })()
        : (att.integrityMetadata || {});

      const reasons = [];

      // 1. Strikes check
      if (meta.strikesCount && meta.strikesCount >= 2) {
        reasons.push(`${meta.strikesCount} anti-cheat proctor strikes recorded`);
      }

      // 2. Tab switches check
      if (meta.tabSwitches && meta.tabSwitches >= 3) {
        reasons.push(`${meta.tabSwitches} window blur / tab switches detected`);
      }

      // 3. Suspicious completion speed: >80% score in < 60 seconds
      if (att.startTime && att.submitTime) {
        const durationSec = Math.round((new Date(att.submitTime).getTime() - new Date(att.startTime).getTime()) / 1000);
        if (durationSec > 0 && durationSec < 60 && att.percent >= 80) {
          reasons.push(`Suspicious completion velocity: ${att.percent}% score in only ${durationSec}s`);
        }
      }

      // 4. Copy-paste detected
      if (meta.copyPasteDetected || meta.pasteCount > 0) {
        reasons.push(`Clipboard paste activity detected during assessment`);
      }

      if (reasons.length > 0) {
        const snap = (typeof att.roadmap?.careerSnapshot === 'string')
          ? (() => { try { return JSON.parse(att.roadmap.careerSnapshot); } catch (_) { return {}; } })()
          : (att.roadmap?.careerSnapshot || {});
        const resolvedTitle = att.roadmap?.career?.title || snap.title || att.skill || 'General Assessment';

        anomalies.push({
          attemptId: att.id,
          studentId: att.userId,
          studentName: att.user?.name || 'Candidate',
          studentEmail: att.user?.email || '',
          careerTitle: resolvedTitle,
          weekNumber: att.roadmapWeek || null,
          score: att.score,
          total: att.total,
          percent: att.percent,
          passed: att.passed,
          strikesCount: meta.strikesCount || 0,
          tabSwitches: meta.tabSwitches || 0,
          reasons,
          severity: reasons.length >= 2 ? 'HIGH' : 'MEDIUM',
          recordedAt: att.createdAt
        });
      }
    }

    const total = anomalies.length;
    const paginated = anomalies.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      anomalies: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[AdminRoadmapController.getAnomalies Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessment anomalies.'
    });
  }
}

/**
 * PATCH /api/admin/roadmaps/:id/status
 * Updates roadmap status (active, paused, flagged)
 * Roles: ADMIN, SUPER_ADMIN
 */
async function updateRoadmapStatus(req, res) {
  try {
    const { id } = req.params;

    const allowedKeys = ['status', 'flagReason', 'reason'];
    const extraKeys = Object.keys(req.body).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'UNKNOWN_FIELDS',
        message: `Unknown fields not permitted: ${extraKeys.join(', ')}`
      });
    }

    const { status, flagReason, reason } = req.body;
    const effectiveReason = (flagReason || reason || '').trim() || null;

    const validStatuses = ['active', 'in_progress', 'paused', 'completed', 'flagged'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${validStatuses.join(', ')}.`
      });
    }

    if (effectiveReason && (typeof effectiveReason !== 'string' || effectiveReason.length > 250)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_FLAG_REASON',
        message: 'Flag reason must be a string up to 250 characters.'
      });
    }

    const before = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, name: true } },
        career: { select: { title: true } }
      }
    });

    if (!before) {
      return res.status(404).json({
        success: false,
        code: 'ROADMAP_NOT_FOUND',
        message: `Roadmap with ID ${id} not found.`
      });
    }

    const snap = (typeof before.careerSnapshot === 'string')
      ? (() => { try { return JSON.parse(before.careerSnapshot); } catch (_) { return {}; } })()
      : (before.careerSnapshot || {});
    const resolvedCareerTitle = before.career?.title || snap.title || 'Roadmap';

    const [after] = await prisma.$transaction([
      prisma.roadmap.update({
        where: { id },
        data: { status }
      }),
      prisma.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          adminEmail: req.admin.email,
          action: 'ROADMAP_STATUS_UPDATE',
          targetType: 'SYSTEM',
          targetId: id,
          details: {
            roadmapId: id,
            studentEmail: before.user?.email,
            careerTitle: resolvedCareerTitle,
            before: { status: before.status },
            after: { status, flagReason: effectiveReason }
          },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: `Roadmap status updated to ${status}.`,
      roadmap: {
        id: after.id,
        status: after.status,
        updatedAt: after.updatedAt
      }
    });
  } catch (error) {
    console.error('[AdminRoadmapController.updateRoadmapStatus Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update roadmap status.'
    });
  }
}

module.exports = {
  listRoadmaps,
  getRoadmapDetail,
  getAnomalies,
  updateRoadmapStatus
};

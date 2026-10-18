/**
 * adminAuditController.js — Immutable Enterprise Audit Log Viewer (Plan 45 Phase 4)
 *
 * Provides a read-only, paginated, and filtered view of all administrative state mutations.
 * Audit rows are strictly immutable (no update or delete endpoints exist).
 *
 * IP Privacy:
 *  - SUPER_ADMIN: views full, unmasked IP addresses.
 *  - ADMIN & MODERATOR: views truncated/masked IP addresses (e.g. 192.168.***.***).
 *
 * Disheera · Enterprise Administration Service
 */

const { prisma } = require('../config/prisma');

/**
 * Masks an IP address to preserve privacy for non-superadmin roles
 * @param {string} ip
 * @returns {string}
 */
function maskIpAddress(ip) {
  if (!ip || typeof ip !== 'string') return null;
  const trimmed = ip.trim();

  // IPv4 or IPv4-mapped IPv6
  if (trimmed.includes('.')) {
    const parts = trimmed.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
  }

  // IPv6
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    return `${parts.slice(0, 2).join(':')}:****:****`;
  }

  return '***.***.***.***';
}

/**
 * GET /api/admin/audit-logs
 * Returns paginated, filtered audit logs.
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function listAuditLogs(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { adminEmail, action, targetType, targetId, startDate, endDate, search } = req.query;

    const where = {};

    if (adminEmail && adminEmail.trim()) {
      where.adminEmail = {
        contains: adminEmail.trim().toLowerCase(),
        mode: 'insensitive'
      };
    }

    if (action && action.trim()) {
      where.action = action.trim();
    }

    if (targetType && targetType.trim()) {
      where.targetType = targetType.trim().toUpperCase();
    }

    if (targetId && targetId.trim()) {
      where.targetId = targetId.trim();
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) {
          where.createdAt.gte = s;
        }
      }
      if (endDate) {
        const e = new Date(endDate);
        if (!isNaN(e.getTime())) {
          where.createdAt.lte = e;
        }
      }
    }

    // Text search query across adminEmail, action, and targetType
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { adminEmail: { contains: q, mode: 'insensitive' } },
        { action: { contains: q, mode: 'insensitive' } },
        { targetType: { contains: q, mode: 'insensitive' } },
        { targetId: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          admin: {
            select: {
              name: true,
              role: true,
              email: true
            }
          }
        }
      })
    ]);

    const isSuperAdmin = req.admin && req.admin.role === 'SUPER_ADMIN';

    // Format and apply IP privacy masking if not SUPER_ADMIN
    const formattedLogs = logs.map(log => {
      return {
        id: log.id,
        adminId: log.adminId,
        adminEmail: log.adminEmail,
        adminName: log.admin?.name || log.adminEmail.split('@')[0],
        adminRole: log.admin?.role || 'ADMIN',
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: log.details,
        ipAddress: isSuperAdmin ? log.ipAddress : maskIpAddress(log.ipAddress),
        isIpMasked: !isSuperAdmin,
        userAgent: log.userAgent,
        createdAt: log.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      logs: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[AdminAuditController.listAuditLogs Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative audit logs.'
    });
  }
}

/**
 * GET /api/admin/audit-logs/actions
 * Returns distinct action types recorded in audit trail for filter dropdowns.
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function listActionTypes(req, res) {
  try {
    const rawActions = await prisma.adminAuditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' }
    });

    const actions = rawActions.map(a => a.action);

    return res.status(200).json({
      success: true,
      actions
    });
  } catch (error) {
    console.error('[AdminAuditController.listActionTypes Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit action types.'
    });
  }
}

/**
 * GET /api/admin/audit-logs/:id
 * Returns a single audit log record with complete before/after details.
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function getAuditLog(req, res) {
  try {
    const { id } = req.params;

    const log = await prisma.adminAuditLog.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            name: true,
            role: true,
            email: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        code: 'AUDIT_LOG_NOT_FOUND',
        message: `Audit log record with ID "${id}" was not found.`
      });
    }

    const isSuperAdmin = req.admin && req.admin.role === 'SUPER_ADMIN';

    return res.status(200).json({
      success: true,
      log: {
        id: log.id,
        adminId: log.adminId,
        adminEmail: log.adminEmail,
        adminName: log.admin?.name || log.adminEmail.split('@')[0],
        adminRole: log.admin?.role || 'ADMIN',
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: log.details,
        ipAddress: isSuperAdmin ? log.ipAddress : maskIpAddress(log.ipAddress),
        isIpMasked: !isSuperAdmin,
        userAgent: log.userAgent,
        createdAt: log.createdAt
      }
    });
  } catch (error) {
    console.error('[AdminAuditController.getAuditLog Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit log details.'
    });
  }
}

module.exports = {
  listAuditLogs,
  listActionTypes,
  getAuditLog,
  maskIpAddress
};

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminAlertController.js — Broadcast Alerts & WhatsApp/n8n Automation (Plan 45 Phase 4)
 *
 * Implements administrative emergency and curriculum broadcast notifications.
 *
 * Safeguards:
 *  - Defaults to dryRun: true (safe simulation mode).
 *  - Live execution (dryRun: false) strictly requires confirmed: true and ADMIN or SUPER_ADMIN role.
 *  - Strict recipient limit: max 500 recipients per broadcast batch.
 *  - Strict message length bounds: 10 to 1000 characters.
 *  - Zero hardcoded keys: uses process.env.WHATSAPP_TOKEN / N8N_ALERT_WEBHOOK_URL.
 *  - Full before/after audit tracking in admin_audit_logs.
 *
 * Disheera · Enterprise Administration Service
 */

const { prisma } = require('../config/prisma');
const { sendTextMessage } = require('../services/whatsappService');

const MAX_BROADCAST_RECIPIENTS = 500;
const MAX_MESSAGE_LENGTH = 1000;
const MIN_MESSAGE_LENGTH = 10;

/**
 * Builds Prisma filter for target audience
 */
function buildTargetFilter(options = {}) {
  const { stream, college, role = 'student' } = options;
  const where = {
    role: role || 'student',
    phone: {
      not: null,
      not: ''
    }
  };

  if (stream && stream !== 'all') {
    where.primaryStream = stream.trim().toLowerCase();
  }

  // Filter by college in education JSONB if specified
  if (college && college.trim()) {
    where.education = {
      path: ['college'],
      string_contains: college.trim()
    };
  }

  return where;
}

/**
 * GET /api/admin/alerts/recipients-count
 * Returns total eligible recipients matching criteria.
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function getRecipientCount(req, res) {
  try {
    const { stream, college, role } = req.query;
    const where = buildTargetFilter({ stream, college, role });

    const count = await prisma.user.count({ where });

    return res.status(200).json({
      success: true,
      count,
      filters: {
        stream: stream || 'all',
        college: college || 'all',
        role: role || 'student'
      },
      maxBatchLimit: MAX_BROADCAST_RECIPIENTS
    });
  } catch (error) {
    console.error('[AdminAlertController.getRecipientCount Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate eligible recipient count.'
    });
  }
}

/**
 * POST /api/admin/alerts/broadcast
 * Dispatches WhatsApp / n8n broadcast notifications.
 * Defaults to dryRun: true.
 * Roles: ADMIN, SUPER_ADMIN for live broadcast; MODERATOR allowed for dryRun only.
 */
async function broadcastAlert(req, res) {
  try {
    const {
      title,
      message,
      targetStream = 'all',
      targetCollege = 'all',
      targetRole = 'student',
      dryRun = true,
      confirmed = false
    } = req.body;

    // Title validation
    if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_TITLE',
        message: 'Broadcast title is required (3-100 characters).'
      });
    }

    // Message validation
    if (!message || typeof message !== 'string' || message.trim().length < MIN_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        code: 'MESSAGE_TOO_SHORT',
        message: `Broadcast message must be at least ${MIN_MESSAGE_LENGTH} characters.`
      });
    }

    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        code: 'MESSAGE_TOO_LONG',
        message: `Broadcast message cannot exceed ${MAX_MESSAGE_LENGTH} characters (received ${message.trim().length}).`
      });
    }

    const isDryRun = dryRun !== false;

    // RBAC: MODERATOR can only simulate dry-run
    if (!isDryRun && req.admin.role === 'MODERATOR') {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Moderators may only perform dry-run simulations. Live broadcasts require ADMIN or SUPER_ADMIN role.'
      });
    }

    // Safety gate: Live execution requires explicit confirmed: true
    if (!isDryRun && !confirmed) {
      return res.status(400).json({
        success: false,
        code: 'CONFIRMATION_REQUIRED',
        message: 'Live broadcast requires explicit confirmation. Set confirmed: true in request payload.'
      });
    }

    const where = buildTargetFilter({
      stream: targetStream,
      college: targetCollege,
      role: targetRole
    });

    // Query eligible recipients
    const recipients = await prisma.user.findMany({
      where,
      take: MAX_BROADCAST_RECIPIENTS,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        primaryStream: true
      }
    });

    const recipientCount = recipients.length;
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    // ── DRY-RUN SIMULATION MODE ─────────────────────────────────
    if (isDryRun) {
      await prisma.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          adminEmail: req.admin.email,
          action: 'ALERT_BROADCAST_DRY_RUN',
          targetType: 'SYSTEM',
          targetId: `dryrun-${Date.now()}`,
          details: {
            title: cleanTitle,
            messageLength: cleanMessage.length,
            targetStream,
            targetCollege,
            recipientCount,
            simulatedSample: recipients.slice(0, 3).map(r => ({ name: r.name, phone: r.phone ? '***' + r.phone.slice(-4) : null }))
          },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        }
      });

      return res.status(200).json({
        success: true,
        dryRun: true,
        message: `Simulation complete: ${recipientCount} recipient(s) identified for "${cleanTitle}". Zero external messages dispatched.`,
        recipientCount,
        preview: {
          title: cleanTitle,
          messagePreview: cleanMessage.slice(0, 150) + (cleanMessage.length > 150 ? '...' : ''),
          totalCharacters: cleanMessage.length,
          targetFilter: { stream: targetStream, college: targetCollege, role: targetRole },
          sampleRecipientsCount: Math.min(recipientCount, 5)
        }
      });
    }

    // ── LIVE BROADCAST EXECUTION ────────────────────────────────
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    const broadcastPayload = `📢 *[DISHEERA ADVISORY]*\n*${cleanTitle}*\n\n${cleanMessage}\n\n_Disheera Career Systems · https://disheera.site_`;

    for (const recipient of recipients) {
      if (!recipient.phone) continue;
      try {
        const sendRes = await sendTextMessage(recipient.phone, broadcastPayload, {
          source: 'admin_broadcast',
          adminId: req.admin.id,
          title: cleanTitle
        });

        if (sendRes && sendRes.success) {
          successCount++;
        } else {
          failureCount++;
          if (errors.length < 5) {
            errors.push({ recipientId: recipient.id, error: sendRes?.error || 'Unknown dispatch error' });
          }
        }
      } catch (sendErr) {
        failureCount++;
        if (errors.length < 5) {
          errors.push({ recipientId: recipient.id, error: sendErr.message });
        }
      }
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'ALERT_BROADCAST_LIVE',
        targetType: 'SYSTEM',
        targetId: `broadcast-${Date.now()}`,
        details: {
          title: cleanTitle,
          messageLength: cleanMessage.length,
          targetStream,
          targetCollege,
          totalEligible: recipientCount,
          successCount,
          failureCount,
          errorsSample: errors
        },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(200).json({
      success: true,
      dryRun: false,
      message: `Broadcast "${cleanTitle}" dispatched: ${successCount} successful, ${failureCount} failed out of ${recipientCount} recipients.`,
      recipientCount,
      deliveredCount: successCount,
      failedCount: failureCount,
      stats: {
        totalEligible: recipientCount,
        dispatched: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    console.error('[AdminAlertController.broadcastAlert Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process alert broadcast.'
    });
  }
}

/**
 * GET /api/admin/alerts/history
 * Returns past broadcast events from audit trail.
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function getAlertHistory(req, res) {
  try {
    const history = await prisma.adminAuditLog.findMany({
      where: {
        action: {
          in: ['ALERT_BROADCAST_LIVE', 'ALERT_BROADCAST_DRY_RUN']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const mappedHistory = history.map(h => ({
      id: h.id,
      adminEmail: h.adminEmail,
      action: h.action,
      title: h.details?.title || 'Notification',
      messagePreview: h.details?.title || 'Broadcast Announcement',
      recipientCount: h.details?.totalEligible || 0,
      dryRun: h.action === 'ALERT_BROADCAST_DRY_RUN',
      isDryRun: h.action === 'ALERT_BROADCAST_DRY_RUN',
      details: h.details,
      createdAt: h.createdAt
    }));

    return res.status(200).json({
      success: true,
      history: mappedHistory,
      broadcasts: mappedHistory
    });
  } catch (error) {
    console.error('[AdminAlertController.getAlertHistory Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve alert broadcast history.'
    });
  }
}

module.exports = {
  getRecipientCount,
  broadcastAlert,
  getAlertHistory
};

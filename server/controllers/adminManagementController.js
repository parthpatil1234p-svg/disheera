/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminManagementController.js — Sub-Admin Lifecycle & RBAC Management (Plan 45 Phase 4)
 *
 * Exclusively accessible to SUPER_ADMIN.
 * Features:
 *  - Sub-admin account creation with cryptographically secure one-time temporary password.
 *  - Temporary password is NEVER logged to console and NEVER stored in plain text.
 *  - Forced password change on first login (mustChangePassword: true).
 *  - Session revocation on account deactivation and role modification.
 *  - Self-deactivation and self-demotion prevention for SUPER_ADMIN.
 *  - Immutability of the last active SUPER_ADMIN account.
 *  - Complete audit logging of all administrative personnel actions.
 *
 * Disheera · Enterprise Administration Service
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');

const VALID_ROLES = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

/**
 * Generates a cryptographically strong temporary password
 * Contains uppercase, lowercase, numbers, and symbols
 */
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(16);
  let pass = 'Dis#';
  for (let i = 0; i < 12; i++) {
    pass += chars[randomBytes[i] % chars.length];
  }
  return pass;
}

/**
 * GET /api/admin/admins
 * Lists all administrative accounts.
 * Roles: SUPER_ADMIN only
 */
async function listAdmins(req, res) {
  try {
    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        isActive: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: true,
            auditLogs: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      admins: admins.map(a => ({
        ...a,
        activeSessionCount: a._count.sessions,
        totalAuditActions: a._count.auditLogs
      }))
    });
  } catch (error) {
    console.error('[AdminManagementController.listAdmins Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative personnel list.'
    });
  }
}

/**
 * POST /api/admin/admins
 * Creates a new administrator or moderator with a one-time temporary password.
 * Roles: SUPER_ADMIN only
 */
async function createAdmin(req, res) {
  try {
    const { name, email, role } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_NAME',
        message: 'Name is required (2-100 characters).'
      });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_EMAIL',
        message: 'A valid email address is required.'
      });
    }

    const assignedRole = role ? String(role).toUpperCase().trim() : 'ADMIN';
    if (!VALID_ROLES.includes(assignedRole)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ROLE',
        message: `Role must be one of: ${VALID_ROLES.join(', ')}.`
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered as an admin
    const existing = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        code: 'ADMIN_EXISTS',
        message: `An administrator account with email "${normalizedEmail}" already exists.`
      });
    }

    // Generate secure temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    const newAdmin = await prisma.adminUser.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: assignedRole,
        mustChangePassword: true,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
        createdAt: true
      }
    });

    // Record audit log (details NEVER include the temporary password or hash)
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'ADMIN_CREATE',
        targetType: 'ADMIN',
        targetId: newAdmin.id,
        details: {
          createdAdminId: newAdmin.id,
          createdAdminEmail: newAdmin.email,
          createdAdminRole: newAdmin.role,
          mustChangePassword: true
        },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    // Return the temporary password ONCE in the response
    return res.status(201).json({
      success: true,
      message: `Administrator account created for "${newAdmin.name}". Share this one-time temporary password securely; it will NOT be displayed again.`,
      admin: newAdmin,
      temporaryPassword
    });
  } catch (error) {
    console.error('[AdminManagementController.createAdmin Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create administrative account.'
    });
  }
}

/**
 * PATCH /api/admin/admins/:id/toggle-active
 * Activates or deactivates an admin account.
 * When deactivating, all active sessions for that admin are immediately revoked.
 * Roles: SUPER_ADMIN only
 */
async function toggleAdminActive(req, res) {
  try {
    const { id } = req.params;

    const targetAdmin = await prisma.adminUser.findUnique({
      where: { id }
    });

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        code: 'ADMIN_NOT_FOUND',
        message: `Admin account with ID "${id}" was not found.`
      });
    }

    // Self-deactivation protection
    if (targetAdmin.id === req.admin.id) {
      return res.status(400).json({
        success: false,
        code: 'SELF_DEACTIVATION_BLOCKED',
        message: 'A Super Admin cannot deactivate their own account.'
      });
    }

    const newActiveState = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !targetAdmin.isActive;

    // Last-Active SUPER_ADMIN protection
    if (targetAdmin.role === 'SUPER_ADMIN' && newActiveState === false) {
      const activeSuperAdmins = await prisma.adminUser.count({
        where: {
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });

      if (activeSuperAdmins <= 1) {
        return res.status(403).json({
          success: false,
          code: 'LAST_SUPER_ADMIN_CANNOT_BE_DEACTIVATED',
          message: 'The last active Super Admin account cannot be deactivated.'
        });
      }
    }

    // Update active status
    const updated = await prisma.adminUser.update({
      where: { id },
      data: {
        isActive: newActiveState
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    // If deactivating, immediately purge all active sessions for this admin
    let revokedSessionsCount = 0;
    if (!newActiveState) {
      const delRes = await prisma.adminSession.deleteMany({
        where: { adminId: id }
      });
      revokedSessionsCount = delRes.count;
    }

    const action = newActiveState ? 'ADMIN_ACTIVATE' : 'ADMIN_DEACTIVATE';

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action,
        targetType: 'ADMIN',
        targetId: id,
        details: {
          targetEmail: targetAdmin.email,
          previousState: targetAdmin.isActive,
          newState: newActiveState,
          revokedSessionsCount
        },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(200).json({
      success: true,
      message: newActiveState
        ? `Account for "${targetAdmin.name}" has been activated.`
        : `Account for "${targetAdmin.name}" has been deactivated. ${revokedSessionsCount} active session(s) revoked.`,
      admin: updated,
      revokedSessionsCount
    });
  } catch (error) {
    console.error('[AdminManagementController.toggleAdminActive Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle administrator account status.'
    });
  }
}

/**
 * PATCH /api/admin/admins/:id/role
 * Changes the role of an admin (MODERATOR, ADMIN, SUPER_ADMIN).
 * Revokes target admin's sessions so they re-authenticate with new permissions.
 * Roles: SUPER_ADMIN only
 */
async function updateAdminRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(String(role).toUpperCase().trim())) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ROLE',
        message: `Role must be one of: ${VALID_ROLES.join(', ')}.`
      });
    }

    const targetRole = String(role).toUpperCase().trim();

    const targetAdmin = await prisma.adminUser.findUnique({
      where: { id }
    });

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        code: 'ADMIN_NOT_FOUND',
        message: `Admin account with ID "${id}" was not found.`
      });
    }

    // Self-demotion protection
    if (targetAdmin.id === req.admin.id && targetAdmin.role === 'SUPER_ADMIN' && targetRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        code: 'SELF_DEMOTION_BLOCKED',
        message: 'A Super Admin cannot demote their own account.'
      });
    }

    // Last-Active SUPER_ADMIN demotion protection
    if (targetAdmin.role === 'SUPER_ADMIN' && targetRole !== 'SUPER_ADMIN') {
      const activeSuperAdmins = await prisma.adminUser.count({
        where: {
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });

      if (activeSuperAdmins <= 1) {
        return res.status(403).json({
          success: false,
          code: 'LAST_SUPER_ADMIN_CANNOT_BE_DEMOTED',
          message: 'The last active Super Admin account cannot be demoted.'
        });
      }
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: { role: targetRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    // Revoke sessions so permissions update immediately
    const delRes = await prisma.adminSession.deleteMany({
      where: { adminId: id }
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'ADMIN_ROLE_CHANGE',
        targetType: 'ADMIN',
        targetId: id,
        details: {
          targetEmail: targetAdmin.email,
          previousRole: targetAdmin.role,
          newRole: targetRole,
          revokedSessionsCount: delRes.count
        },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(200).json({
      success: true,
      message: `Role for "${targetAdmin.name}" updated to "${targetRole}". Sessions revoked to refresh credentials.`,
      admin: updated,
      revokedSessionsCount: delRes.count
    });
  } catch (error) {
    console.error('[AdminManagementController.updateAdminRole Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update administrator role.'
    });
  }
}

module.exports = {
  listAdmins,
  createAdmin,
  toggleAdminActive,
  updateAdminRole,
  generateTemporaryPassword
};

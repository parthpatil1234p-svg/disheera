/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminUserController.js — Student & User Lifecycle Administration
 *
 * Provides administrative search, dossier inspection, suspension,
 * and SUPER_ADMIN exclusive deletion with full audit logging.
 */

const { prisma } = require('../config/prisma');

/**
 * GET /api/admin/users
 * Search and paginated list of registered users
 */
async function listUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const { search, role, stream, status } = req.query;

    const where = {};

    if (role && role !== 'all') {
      where.role = role;
    }

    if (stream && stream !== 'all') {
      where.primaryStream = stream;
    }

    if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'unverified') {
      where.isVerified = false;
    } else if (status === 'suspended') {
      where.profileStatus = { path: ['isSuspended'], equals: true };
    } else if (status === 'active') {
      where.NOT = { profileStatus: { path: ['isSuspended'], equals: true } };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          primaryStream: true,
          profileCompleted: true,
          isVerified: true,
          hasCompletedSkillVerification: true,
          phone: true,
          profileStatus: true,
          createdAt: true,
          lastAbandonedRouteAt: true,
          _count: {
            select: {
              roadmaps: true,
              attempts: true
            }
          }
        }
      })
    ]);

    const sanitizedUsers = users.map(user => {
      const pStatus = (user.profileStatus && typeof user.profileStatus === 'object') ? user.profileStatus : {};
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        primaryStream: user.primaryStream,
        profileCompleted: user.profileCompleted,
        isVerified: user.isVerified,
        hasCompletedSkillVerification: user.hasCompletedSkillVerification,
        phone: user.phone || '',
        isSuspended: Boolean(pStatus.isSuspended),
        suspendedAt: pStatus.suspendedAt || null,
        suspensionReason: pStatus.suspensionReason || null,
        createdAt: user.createdAt,
        roadmapsCount: user._count.roadmaps,
        attemptsCount: user._count.attempts
      };
    });

    return res.status(200).json({
      success: true,
      users: sanitizedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[AdminUserController.listUsers Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users.'
    });
  }
}

/**
 * GET /api/admin/users/:id
 * Complete student dossier: profile, roadmaps, attempts, resume
 */
async function getUserDetail(req, res) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roadmaps: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            careerId: true,
            durationWeeks: true,
            status: true,
            totalTasks: true,
            completedTasks: true,
            progressPercentage: true,
            startedAt: true,
            completedAt: true,
            careerSnapshot: true,
            career: {
              select: {
                title: true,
                slug: true,
                category: true
              }
            }
          }
        },
        attempts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            skill: true,
            roadmapWeek: true,
            score: true,
            total: true,
            percent: true,
            passed: true,
            createdAt: true
          }
        },
        resume: {
          select: {
            id: true,
            originalName: true,
            fileType: true,
            sizeBytes: true,
            fileLocation: true,
            atsScore: true,
            firstUploadedAt: true,
            lastUpdatedAt: true
          }
        },
        _count: {
          select: {
            studentApplications: true,
            jobOpenings: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'The requested user could not be found.'
      });
    }

    const pStatus = (user.profileStatus && typeof user.profileStatus === 'object') ? user.profileStatus : {};

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        primaryStream: user.primaryStream,
        avatarUrl: user.avatarUrl,
        resumeUrl: user.resumeUrl,
        profileCompleted: user.profileCompleted,
        isVerified: user.isVerified,
        hasCompletedSkillVerification: user.hasCompletedSkillVerification,
        phone: user.phone || '',
        whatsappNotificationsEnabled: user.whatsappNotificationsEnabled,
        education: user.education,
        interests: user.interests,
        skills: user.skills,
        careerGoals: user.careerGoals,
        githubProfile: user.githubProfile,
        recruiterProfile: user.recruiterProfile,
        jobReadiness: user.jobReadiness,
        isSuspended: Boolean(pStatus.isSuspended),
        suspendedAt: pStatus.suspendedAt || null,
        suspendedBy: pStatus.suspendedBy || null,
        suspensionReason: pStatus.suspensionReason || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roadmaps: user.roadmaps,
        attempts: user.attempts,
        resume: user.resume,
        applicationsCount: user._count.studentApplications,
        jobOpeningsCount: user._count.jobOpenings
      }
    });
  } catch (error) {
    console.error('[AdminUserController.getUserDetail Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user dossier.'
    });
  }
}

/**
 * PATCH /api/admin/users/:id/suspend
 * Toggle account suspension with audit logging
 * Allowed: ADMIN, SUPER_ADMIN
 */
async function toggleSuspendUser(req, res) {
  try {
    const { id } = req.params;
    const { isSuspended, reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, profileStatus: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Target user could not be found.'
      });
    }

    const currentStatus = (user.profileStatus && typeof user.profileStatus === 'object')
      ? user.profileStatus
      : {};

    const updatedProfileStatus = {
      ...currentStatus,
      isSuspended: Boolean(isSuspended),
      suspendedAt: isSuspended ? new Date().toISOString() : null,
      suspendedBy: req.admin.email,
      suspensionReason: reason || (isSuspended ? 'Administrative suspension' : '')
    };

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { profileStatus: updatedProfileStatus },
      select: { id: true, email: true, profileStatus: true }
    });

    // Write audit trail
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: isSuspended ? 'USER_SUSPEND' : 'USER_UNSUSPEND',
        targetType: 'USER',
        targetId: user.id,
        details: {
          userEmail: user.email,
          userName: user.name,
          isSuspended: Boolean(isSuspended),
          reason: reason || null
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(200).json({
      success: true,
      message: isSuspended ? 'User has been suspended successfully.' : 'User suspension has been revoked.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isSuspended: Boolean(isSuspended),
        suspendedAt: updatedProfileStatus.suspendedAt,
        suspensionReason: updatedProfileStatus.suspensionReason
      }
    });
  } catch (error) {
    console.error('[AdminUserController.toggleSuspendUser Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user suspension status.'
    });
  }
}

/**
 * DELETE /api/admin/users/:id
 * Soft-delete / deactivation with audit logging
 * Allowed: SUPER_ADMIN ONLY
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Strict SUPER_ADMIN check
    if (req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only SUPER_ADMIN may deactivate/delete user accounts.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, profileStatus: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Target user could not be found.'
      });
    }

    const currentStatus = (user.profileStatus && typeof user.profileStatus === 'object')
      ? user.profileStatus
      : {};

    const updatedProfileStatus = {
      ...currentStatus,
      isDeleted: true,
      isSuspended: true,
      deletedAt: new Date().toISOString(),
      deletedBy: req.admin.email,
      deactivationReason: req.body && req.body.reason ? req.body.reason : 'Administrative account deactivation'
    };

    // Soft delete: flag in profileStatus and anonymize display name
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: 'Deactivated User',
        profileStatus: updatedProfileStatus
      },
      select: { id: true, email: true, name: true, profileStatus: true }
    });

    // Write audit trail
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'USER_SOFT_DELETE',
        targetType: 'USER',
        targetId: id,
        details: {
          userEmail: user.email,
          previousName: user.name,
          role: user.role,
          softDeleted: true
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(200).json({
      success: true,
      message: `User account ${user.email} deactivated (soft-deleted).`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isDeleted: true,
        isSuspended: true
      }
    });
  } catch (error) {
    console.error('[AdminUserController.deleteUser Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate user.'
    });
  }
}

/**
 * POST /api/admin/users/:id/hard-delete
 * Permanent user erasure from database with typed email confirmation
 * Allowed: SUPER_ADMIN ONLY
 */
async function hardDeleteUser(req, res) {
  try {
    const { id } = req.params;
    const { confirmationEmail } = req.body;

    // Strict SUPER_ADMIN check
    if (req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only SUPER_ADMIN may permanently delete user accounts.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Target user could not be found.'
      });
    }

    // Typed email confirmation validation
    const normalizedInput = (confirmationEmail || '').trim().toLowerCase();
    const normalizedUserEmail = user.email.trim().toLowerCase();

    if (!normalizedInput || normalizedInput !== normalizedUserEmail) {
      return res.status(400).json({
        success: false,
        code: 'CONFIRMATION_MISMATCH',
        message: 'Typed confirmation email does not match the target user account email.'
      });
    }

    // Permanent hard delete (Prisma cascade removes all related records)
    await prisma.user.delete({
      where: { id }
    });

    // Write audit trail
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'USER_HARD_DELETE',
        targetType: 'USER',
        targetId: id,
        details: {
          deletedUserEmail: user.email,
          deletedUserName: user.name,
          deletedUserRole: user.role,
          hardDeleted: true
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(200).json({
      success: true,
      message: `User account ${user.email} permanently erased from database.`
    });
  } catch (error) {
    console.error('[AdminUserController.hardDeleteUser Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to permanently delete user.'
    });
  }
}

module.exports = {
  listUsers,
  getUserDetail,
  toggleSuspendUser,
  deleteUser,
  hardDeleteUser
};

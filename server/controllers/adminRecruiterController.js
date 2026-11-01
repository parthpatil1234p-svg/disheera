/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminRecruiterController.js — Corporate Recruiter Verification Administration
 *
 * Provides recruiter vetting, corporate verification, approval, rejection,
 * and comprehensive audit logging.
 */

const { prisma } = require('../config/prisma');

/**
 * GET /api/admin/recruiters
 * List and filter recruiter accounts with corporate credentials
 */
async function listRecruiters(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const { status, search } = req.query;

    const where = {
      role: 'recruiter'
    };

    if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'pending') {
      where.isVerified = false;
      where.NOT = {
        recruiterProfile: { path: ['verificationStatus'], equals: 'rejected' }
      };
    } else if (status === 'rejected') {
      where.recruiterProfile = { path: ['verificationStatus'], equals: 'rejected' };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [total, recruiters] = await Promise.all([
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
          phone: true,
          isVerified: true,
          recruiterProfile: true,
          createdAt: true,
          _count: {
            select: {
              jobOpenings: true
            }
          }
        }
      })
    ]);

    const formattedRecruiters = recruiters.map(r => {
      const profile = (r.recruiterProfile && typeof r.recruiterProfile === 'object')
        ? r.recruiterProfile
        : {};

      let verificationStatus = 'pending';
      if (r.isVerified) {
        verificationStatus = 'verified';
      } else if (profile.verificationStatus === 'rejected') {
        verificationStatus = 'rejected';
      }

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone || '',
        companyName: profile.companyName || profile.organization || 'Not Specified',
        designation: profile.designation || profile.title || 'Recruiter',
        website: profile.website || profile.companyWebsite || '',
        cinNumber: profile.cinNumber || '',
        linkedinUrl: profile.linkedinUrl || '',
        isVerified: r.isVerified,
        verificationStatus,
        rejectionReason: profile.rejectionReason || null,
        verifiedAt: profile.verifiedAt || null,
        jobOpeningsCount: r._count.jobOpenings,
        createdAt: r.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      recruiters: formattedRecruiters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[AdminRecruiterController.listRecruiters Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recruiters list.'
    });
  }
}

/**
 * POST /api/admin/recruiters/:id/approve
 * Approves a corporate recruiter account and issues verified badge
 * Allowed: ADMIN, SUPER_ADMIN
 */
async function approveRecruiter(req, res) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, isVerified: true, recruiterProfile: true }
    });

    if (!user || user.role !== 'recruiter') {
      return res.status(404).json({
        success: false,
        code: 'RECRUITER_NOT_FOUND',
        message: 'Target recruiter account could not be found.'
      });
    }

    const currentProfile = (user.recruiterProfile && typeof user.recruiterProfile === 'object')
      ? user.recruiterProfile
      : {};

    const updatedProfile = {
      ...currentProfile,
      verificationStatus: 'verified',
      verifiedAt: new Date().toISOString(),
      verifiedBy: req.admin.email,
      rejectionReason: null
    };

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isVerified: true,
        recruiterProfile: updatedProfile
      },
      select: { id: true, email: true, name: true, isVerified: true, recruiterProfile: true }
    });

    // Write audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'RECRUITER_APPROVE',
        targetType: 'RECRUITER',
        targetId: user.id,
        details: {
          recruiterEmail: user.email,
          recruiterName: user.name,
          companyName: currentProfile.companyName || currentProfile.organization || null
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(200).json({
      success: true,
      message: `Recruiter ${user.email} approved successfully with verified corporate badge.`,
      recruiter: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isVerified: updatedUser.isVerified,
        verificationStatus: 'verified'
      }
    });
  } catch (error) {
    console.error('[AdminRecruiterController.approveRecruiter Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve recruiter.'
    });
  }
}

/**
 * POST /api/admin/recruiters/:id/reject
 * Rejects a corporate recruiter application with a recorded reason
 * Allowed: ADMIN, SUPER_ADMIN
 */
async function rejectRecruiter(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, isVerified: true, recruiterProfile: true }
    });

    if (!user || user.role !== 'recruiter') {
      return res.status(404).json({
        success: false,
        code: 'RECRUITER_NOT_FOUND',
        message: 'Target recruiter account could not be found.'
      });
    }

    const currentProfile = (user.recruiterProfile && typeof user.recruiterProfile === 'object')
      ? user.recruiterProfile
      : {};

    const rejectionReason = reason && reason.trim()
      ? reason.trim()
      : 'Corporate credentials or domain verification did not meet platform guidelines.';

    const updatedProfile = {
      ...currentProfile,
      verificationStatus: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: req.admin.email,
      rejectionReason
    };

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isVerified: false,
        recruiterProfile: updatedProfile
      },
      select: { id: true, email: true, name: true, isVerified: true, recruiterProfile: true }
    });

    // Write audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'RECRUITER_REJECT',
        targetType: 'RECRUITER',
        targetId: user.id,
        details: {
          recruiterEmail: user.email,
          recruiterName: user.name,
          reason: rejectionReason
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(200).json({
      success: true,
      message: `Recruiter application for ${user.email} marked as rejected.`,
      recruiter: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isVerified: false,
        verificationStatus: 'rejected',
        rejectionReason
      }
    });
  } catch (error) {
    console.error('[AdminRecruiterController.rejectRecruiter Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject recruiter application.'
    });
  }
}

module.exports = {
  listRecruiters,
  approveRecruiter,
  rejectRecruiter
};

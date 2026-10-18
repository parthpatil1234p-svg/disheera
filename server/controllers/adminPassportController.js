/**
 * adminPassportController.js — Skill Passport Oversight & Revocation Management
 *
 * Provides student credential inspection, cryptographic ledger tracking,
 * soft-revocation with public QR alert propagation, and Super Admin reinstatement.
 * Disheera · Enterprise Administration Service
 */

const { prisma } = require('../config/prisma');
const { generatePassportData } = require('../services/passportService');

/**
 * GET /api/admin/passports
 * Paginated list of student skill passports with verification and revocation statuses
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function listPassports(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const { search, status } = req.query;

    const where = {
      role: 'student'
    };

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (status === 'revoked') {
      where.profileStatus = {
        path: ['passportRevocation', 'isRevoked'],
        equals: true
      };
    } else if (status === 'verified') {
      where.NOT = {
        profileStatus: {
          path: ['passportRevocation', 'isRevoked'],
          equals: true
        }
      };
    }

    const [total, students] = await Promise.all([
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
          primaryStream: true,
          education: true,
          skills: true,
          profileStatus: true,
          hasCompletedSkillVerification: true,
          createdAt: true
        }
      })
    ]);

    const formattedPassports = students.map(student => {
      const profileStatus = (typeof student.profileStatus === 'string')
        ? (() => { try { return JSON.parse(student.profileStatus); } catch (_) { return {}; } })()
        : (student.profileStatus || {});

      const revocation = profileStatus.passportRevocation || null;
      const isRevoked = Boolean(revocation && revocation.isRevoked);

      const rawSkills = Array.isArray(student.skills) ? student.skills : [];
      const verifiedSkillsCount = rawSkills.filter(s => s.isQuizVerified || s.isProjectVerified || s.isCodeVerified).length;

      let credentialStatus = 'pending';
      if (isRevoked) {
        credentialStatus = 'revoked';
      } else if (verifiedSkillsCount >= 1) {
        credentialStatus = 'verified';
      } else {
        credentialStatus = 'pending';
      }

      return {
        studentId: student.id,
        name: student.name,
        email: student.email,
        primaryStream: student.primaryStream || 'engineering',
        totalSkills: rawSkills.length,
        verifiedSkillsCount,
        hasCompletedSkillVerification: Boolean(student.hasCompletedSkillVerification || verifiedSkillsCount > 0),
        credentialStatus,
        status: credentialStatus,
        isRevoked,
        revocation: isRevoked ? revocation : null,
        createdAt: student.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      passports: formattedPassports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[AdminPassportController.listPassports Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve skill passports.'
    });
  }
}

/**
 * GET /api/admin/passports/:studentId
 * Returns complete cryptographic passport dossier for a candidate
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function getPassportDossier(req, res) {
  try {
    const { studentId } = req.params;

    if (!studentId || typeof studentId !== 'string') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STUDENT_ID',
        message: 'A valid student ID is required.'
      });
    }

    const passport = await generatePassportData(studentId.trim());

    if (!passport) {
      return res.status(404).json({
        success: false,
        code: 'PASSPORT_NOT_FOUND',
        message: 'No candidate passport found matching the provided ID.'
      });
    }

    return res.status(200).json({
      success: true,
      passport
    });
  } catch (error) {
    console.error('[AdminPassportController.getPassportDossier Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve candidate passport dossier.'
    });
  }
}

/**
 * POST /api/admin/passports/:studentId/revoke
 * Soft-revokes candidate skill passport, making public QR returns "revoked"
 * Roles: ADMIN, SUPER_ADMIN
 */
async function revokePassport(req, res) {
  try {
    const { studentId } = req.params;

    // Strict input validation: reject unknown fields
    const allowedKeys = ['reason'];
    const extraKeys = Object.keys(req.body).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'UNKNOWN_FIELDS',
        message: `Unknown fields not permitted: ${extraKeys.join(', ')}`
      });
    }

    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 300) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_REASON',
        message: 'Revocation reason is required and must be between 3 and 300 characters.'
      });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, email: true, name: true, role: true, profileStatus: true }
    });

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        message: 'Target student account could not be found.'
      });
    }

    const currentProfileStatus = (typeof student.profileStatus === 'string')
      ? (() => { try { return JSON.parse(student.profileStatus); } catch (_) { return {}; } })()
      : (student.profileStatus || {});

    const beforeState = currentProfileStatus.passportRevocation || null;

    const afterState = {
      isRevoked: true,
      revokedAt: new Date().toISOString(),
      revokedBy: req.admin.email,
      reason: reason.trim()
    };

    const updatedProfileStatus = {
      ...currentProfileStatus,
      passportRevocation: afterState
    };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: studentId },
        data: { profileStatus: updatedProfileStatus }
      }),
      prisma.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          adminEmail: req.admin.email,
          action: 'PASSPORT_REVOKE',
          targetType: 'PASSPORT',
          targetId: student.id,
          details: {
            studentEmail: student.email,
            studentName: student.name,
            before: beforeState,
            after: afterState
          },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: `Skill Passport for candidate ${student.name} has been revoked.`,
      passport: {
        studentId: student.id,
        credentialStatus: 'revoked',
        status: 'revoked',
        isRevoked: true,
        revocation: afterState
      }
    });
  } catch (error) {
    console.error('[AdminPassportController.revokePassport Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke skill passport.'
    });
  }
}

/**
 * POST /api/admin/passports/:studentId/reinstate
 * Reinstates a revoked skill passport.
 * STRICT ENFORCEMENT: ONLY SUPER_ADMIN may reinstate revoked credentials.
 */
async function reinstatePassport(req, res) {
  try {
    const { studentId } = req.params;

    // Strict input validation: reject unknown fields
    const allowedKeys = ['reason'];
    const extraKeys = Object.keys(req.body).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'UNKNOWN_FIELDS',
        message: `Unknown fields not permitted: ${extraKeys.join(', ')}`
      });
    }

    const { reason } = req.body;
    if (reason && (typeof reason !== 'string' || reason.trim().length > 300)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_REASON',
        message: 'Reinstatement reason must be a string up to 300 characters.'
      });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, email: true, name: true, role: true, profileStatus: true, skills: true }
    });

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        message: 'Target student account could not be found.'
      });
    }

    const currentProfileStatus = (typeof student.profileStatus === 'string')
      ? (() => { try { return JSON.parse(student.profileStatus); } catch (_) { return {}; } })()
      : (student.profileStatus || {});

    const beforeState = currentProfileStatus.passportRevocation || null;

    const afterState = {
      isRevoked: false,
      reinstatedAt: new Date().toISOString(),
      reinstatedBy: req.admin.email,
      reason: reason ? reason.trim() : 'Credential reinstated by Super Admin'
    };

    const updatedProfileStatus = {
      ...currentProfileStatus,
      passportRevocation: afterState
    };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: studentId },
        data: { profileStatus: updatedProfileStatus }
      }),
      prisma.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          adminEmail: req.admin.email,
          action: 'PASSPORT_REINSTATE',
          targetType: 'PASSPORT',
          targetId: student.id,
          details: {
            studentEmail: student.email,
            studentName: student.name,
            before: beforeState,
            after: afterState
          },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        }
      })
    ]);

    const rawSkills = Array.isArray(student.skills) ? student.skills : [];
    const verifiedSkillsCount = rawSkills.filter(s => s.isQuizVerified || s.isProjectVerified || s.isCodeVerified).length;
    const reinstatedStatus = verifiedSkillsCount >= 1 ? 'verified' : 'pending';

    return res.status(200).json({
      success: true,
      message: `Skill Passport for candidate ${student.name} has been reinstated.`,
      passport: {
        studentId: student.id,
        credentialStatus: reinstatedStatus,
        status: reinstatedStatus,
        isRevoked: false,
        revocation: afterState
      }
    });
  } catch (error) {
    console.error('[AdminPassportController.reinstatePassport Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reinstate skill passport.'
    });
  }
}

module.exports = {
  listPassports,
  getPassportDossier,
  revokePassport,
  reinstatePassport
};

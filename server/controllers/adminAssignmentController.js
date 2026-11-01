/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/adminAssignmentController.js — Subdomain Admin Assignment Review Cockpit (Plan 46)
 *
 * Implements Phase 3:
 * - List and filter student assignment submissions (SUBMITTED, FLAGGED_AI, GRADED, ADMIN_APPROVED)
 * - Fetch full submission dossier (PDF links, 4D rubric breakdown, Anti-AI writing heuristics)
 * - Administrative score override, customized team commit feedback, and status updates
 * - Audit logging via AdminAuditLog and student notification
 *
 * Disheera Technologies Inc.
 */

const { prisma } = require('../config/prisma');
const { generateEvaluationSheetPdf, notifyStudentEvaluation } = require('../services/assignmentFeedbackService');

/**
 * GET /api/admin/assignments
 * Lists submissions with filtering, search, pagination, and KPI counts.
 */
async function listAssignments(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const { status, weekNumber, search, careerId } = req.query;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (weekNumber) {
      const parsedWeek = parseInt(weekNumber, 10);
      if (!isNaN(parsedWeek)) where.weekNumber = parsedWeek;
    }

    if (careerId) {
      where.assignment = { careerId };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { assignment: { title: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [
      total,
      submissions,
      totalAll,
      totalSubmitted,
      totalFlaggedAi,
      totalGraded,
      totalAdminApproved,
      totalResubmission
    ] = await Promise.all([
      prisma.assignmentSubmission.count({ where }),
      prisma.assignmentSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              education: true
            }
          },
          assignment: {
            select: {
              id: true,
              title: true,
              weekNumber: true,
              maxMarks: true,
              careerId: true
            }
          }
        }
      }),
      prisma.assignmentSubmission.count(),
      prisma.assignmentSubmission.count({ where: { status: 'SUBMITTED' } }),
      prisma.assignmentSubmission.count({ where: { status: 'FLAGGED_AI' } }),
      prisma.assignmentSubmission.count({ where: { status: 'GRADED' } }),
      prisma.assignmentSubmission.count({ where: { status: 'ADMIN_APPROVED' } }),
      prisma.assignmentSubmission.count({ where: { status: 'RESUBMISSION_REQUESTED' } })
    ]);

    const formatted = submissions.map(s => ({
      id: s.id,
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignment?.title || `Week ${s.weekNumber} Assignment`,
      weekNumber: s.weekNumber,
      maxMarks: s.assignment?.maxMarks || 10,
      student: {
        id: s.user?.id,
        name: s.user?.name || 'Student',
        email: s.user?.email || 'N/A',
        college: s.user?.education?.college || s.user?.education?.institution || 'College',
        rollNumber: s.user?.education?.rollNumber || 'N/A'
      },
      status: s.status,
      pageCount: s.pageCount,
      fileSizeBytes: s.fileSizeBytes,
      aiScore: s.aiScore,
      adminScore: s.adminScore,
      finalScore: s.finalScore,
      aiProbability: s.aiProbability,
      aiDetected: s.aiDetected,
      aiDetectionReasons: s.aiDetectionReasons || [],
      aiFeedback: s.aiFeedback,
      adminFeedback: s.adminFeedback,
      submittedAt: s.submittedAt,
      reviewedAt: s.reviewedAt,
      pdfUrl: `/api/assignments/download/${s.id}`,
      evalSheetUrl: `/api/assignments/eval-sheet/${s.id}`
    }));

    return res.status(200).json({
      success: true,
      counts: {
        all: totalAll,
        submitted: totalSubmitted,
        flaggedAi: totalFlaggedAi,
        graded: totalGraded,
        adminApproved: totalAdminApproved,
        resubmissionRequested: totalResubmission
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      submissions: formatted
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/assignments/:id
 * Fetches the full submission dossier for detailed review.
 */
async function getAssignmentById(req, res, next) {
  try {
    const { id } = req.params;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            education: true,
            primaryStream: true
          }
        },
        assignment: true
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Assignment submission dossier not found.'
      });
    }

    return res.status(200).json({
      success: true,
      submission: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        assignmentTitle: submission.assignment?.title,
        assignmentDescription: submission.assignment?.description,
        learningOutcomes: submission.assignment?.learningOutcomes,
        questions: submission.assignment?.questions,
        rubric: submission.assignment?.rubric,
        maxMarks: submission.assignment?.maxMarks || 10,
        weekNumber: submission.weekNumber,
        student: {
          id: submission.user?.id,
          name: submission.user?.name,
          email: submission.user?.email,
          phone: submission.user?.phone,
          college: submission.user?.education?.college || 'University / Institute',
          department: submission.user?.education?.branch || submission.user?.primaryStream || 'Engineering',
          rollNumber: submission.user?.education?.rollNumber || 'N/A'
        },
        status: submission.status,
        pageCount: submission.pageCount,
        fileSizeBytes: submission.fileSizeBytes,
        aiScore: submission.aiScore,
        adminScore: submission.adminScore,
        finalScore: submission.finalScore,
        aiRubricBreakdown: submission.aiRubricBreakdown,
        aiProbability: submission.aiProbability,
        aiDetected: submission.aiDetected,
        aiDetectionReasons: submission.aiDetectionReasons || [],
        aiFeedback: submission.aiFeedback,
        adminFeedback: submission.adminFeedback,
        reviewedByAdminId: submission.reviewedByAdminId,
        submittedAt: submission.submittedAt,
        reviewedAt: submission.reviewedAt,
        pdfUrl: `/api/assignments/download/${submission.id}`,
        evalSheetUrl: `/api/assignments/eval-sheet/${submission.id}`
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/assignments/:id/review
 * Allows an admin/educator to override marks, write personalized feedback commits,
 * and approve or request resubmission.
 */
async function reviewAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const { status, adminScore, adminFeedback } = req.body;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        assignment: true,
        user: true
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Assignment submission dossier not found.'
      });
    }

    const validStatuses = ['ADMIN_APPROVED', 'RESUBMISSION_REQUESTED', 'GRADED', 'FLAGGED_AI'];
    const newStatus = status || 'ADMIN_APPROVED';
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid review status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    let parsedAdminScore = null;
    if (adminScore !== undefined && adminScore !== null && adminScore !== '') {
      parsedAdminScore = parseFloat(adminScore);
      if (isNaN(parsedAdminScore) || parsedAdminScore < 0 || parsedAdminScore > (submission.assignment?.maxMarks || 10)) {
        return res.status(400).json({
          success: false,
          message: `Admin score must be a number between 0.0 and ${submission.assignment?.maxMarks || 10}.`
        });
      }
    }

    // Determine final score: admin score if overridden, else retain existing score
    let finalScore = submission.finalScore;
    if (parsedAdminScore !== null) {
      finalScore = parsedAdminScore;
    } else if (newStatus === 'ADMIN_APPROVED' && finalScore === null) {
      finalScore = submission.aiScore || 7.5;
    } else if (newStatus === 'RESUBMISSION_REQUESTED') {
      finalScore = null;
    }

    // Update submission record
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id },
      data: {
        adminScore: parsedAdminScore,
        finalScore,
        adminFeedback: adminFeedback || submission.adminFeedback,
        status: newStatus,
        reviewedByAdminId: req.admin?.id || 'admin_cockpit',
        reviewedAt: new Date()
      },
      include: {
        assignment: true,
        user: true
      }
    });

    // Stamp regenerated Part C PDF with Admin Approved seal
    try {
      await generateEvaluationSheetPdf({
        submission: updatedSubmission,
        assignment: updatedSubmission.assignment,
        user: updatedSubmission.user,
        antiAiResult: {
          aiProbability: updatedSubmission.aiProbability,
          aiReasons: updatedSubmission.aiDetectionReasons
        },
        rubricBreakdown: updatedSubmission.aiRubricBreakdown || {}
      });
    } catch (pdfErr) {
      console.warn('[adminAssignmentController.review] PDF stamp note:', pdfErr.message);
    }

    // Record in AdminAuditLog
    if (req.admin?.id) {
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: req.admin.id,
            adminEmail: req.admin.email || 'admin@disheera.site',
            action: 'ASSIGNMENT_REVIEWED',
            targetType: 'ASSIGNMENT_SUBMISSION',
            targetId: id,
            details: {
              previousStatus: submission.status,
              newStatus,
              adminScore: parsedAdminScore,
              finalScore,
              studentEmail: submission.user?.email,
              weekNumber: submission.weekNumber
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (auditErr) {
        console.warn('[adminAssignmentController.review] Audit log note:', auditErr.message);
      }
    }

    // Dispatch WhatsApp update to student
    try {
      await notifyStudentEvaluation({
        user: updatedSubmission.user,
        submission: updatedSubmission,
        assignment: updatedSubmission.assignment,
        antiAiResult: {
          aiProbability: updatedSubmission.aiProbability,
          badgeLabel: newStatus === 'ADMIN_APPROVED' ? 'Academic Board Approved' : 'Resubmission Requested'
        }
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: newStatus === 'ADMIN_APPROVED'
        ? 'Assignment officially approved and recorded on student passport!'
        : (newStatus === 'RESUBMISSION_REQUESTED'
          ? 'Resubmission request dispatched to student with educator feedback.'
          : 'Assignment review successfully committed.'),
      submission: {
        id: updatedSubmission.id,
        status: updatedSubmission.status,
        adminScore: updatedSubmission.adminScore,
        finalScore: updatedSubmission.finalScore,
        adminFeedback: updatedSubmission.adminFeedback,
        reviewedAt: updatedSubmission.reviewedAt,
        evalSheetUrl: `/api/assignments/eval-sheet/${updatedSubmission.id}`
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAssignments,
  getAssignmentById,
  reviewAssignment
};

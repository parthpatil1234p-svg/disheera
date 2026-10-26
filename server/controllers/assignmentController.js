/**
 * controllers/assignmentController.js — Weekly Assignments & PDF Submission Controller (Plan 46)
 *
 * Implements Phase 1 & Phase 2 of Plan 46:
 * - Fetch weekly collegiate assignments, 4D rubrics, and learning outcomes
 * - Generate and download standardized 1-page Cover Sheets (Part A)
 * - Multipart & Base64 PDF submission pipeline with page-count & magic-byte validation
 * - AI Dual-Layer Multimodal Auto-Grading & Anti-AI Content Shield invocation
 * - Part C Official Evaluation Sheet downloads and student history tracking
 *
 * Disheera Technologies Inc.
 */

const fs = require('fs');
const path = require('path');
const { prisma } = require('../config/prisma');
const { generateCoverPagePdf } = require('../services/assignmentTemplateService');
const { evaluateSubmission } = require('../services/assignmentAiGraderService');
const { generateEvaluationSheetPdf } = require('../services/assignmentFeedbackService');
let _PDFParse = null;
function getPDFParse() {
  if (!_PDFParse) {
    if (typeof globalThis.DOMMatrix === 'undefined') {
      globalThis.DOMMatrix = class DOMMatrix {};
    }
    _PDFParse = require('pdf-parse').PDFParse;
  }
  return _PDFParse;
}

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'assignments');
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

// Ensure uploads directory exists on startup (guarded against read-only serverless filesystems)
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (fsErr) {
  // Read-only serverless runtime (Vercel/Lambda)
}

/**
 * Helper to resolve the student's active career and roadmap.
 */
async function resolveStudentContext(userId, explicitCareerId) {
  if (explicitCareerId) {
    const career = await prisma.career.findUnique({ where: { id: explicitCareerId } });
    if (career) return { careerId: career.id, careerTitle: career.title, roadmapId: null };
  }

  // Look up active roadmap
  const activeRoadmap = await prisma.roadmap.findFirst({
    where: { userId, status: 'active' },
    include: { career: true },
    orderBy: { createdAt: 'desc' }
  });

  if (activeRoadmap?.career) {
    return {
      careerId: activeRoadmap.career.id,
      careerTitle: activeRoadmap.career.title,
      roadmapId: activeRoadmap.id
    };
  }

  // Fallback to first available career
  const defaultCareer = await prisma.career.findFirst({
    where: { active: true },
    orderBy: { createdAt: 'asc' }
  });

  return {
    careerId: defaultCareer?.id || 'default-career',
    careerTitle: defaultCareer?.title || 'Full-Stack Developer',
    roadmapId: null
  };
}

/**
 * GET /api/assignments/week/:weekNumber
 * Returns weekly assignment questions, learning outcomes, max marks, and submission state.
 */
const getWeeklyAssignment = async (req, res, next) => {
  try {
    const weekNumber = parseInt(req.params.weekNumber, 10);
    if (isNaN(weekNumber) || weekNumber < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid week number specified.'
      });
    }

    const { careerId, careerTitle, roadmapId } = await resolveStudentContext(
      req.user.id,
      req.query.careerId
    );

    // Find assignment for this career and week
    let assignment = await prisma.weeklyAssignment.findUnique({
      where: {
        careerId_weekNumber: {
          careerId,
          weekNumber
        }
      }
    });

    // Fallback if not found for specific career: grab week assignment from another career
    if (!assignment) {
      assignment = await prisma.weeklyAssignment.findFirst({
        where: { weekNumber },
        orderBy: { createdAt: 'asc' }
      });
    }

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: `No collegiate assignment currently configured for Week ${weekNumber}.`
      });
    }

    // Check if authenticated student has already submitted for this assignment
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        userId: req.user.id,
        assignmentId: assignment.id
      },
      orderBy: { submittedAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      career: {
        id: careerId,
        title: careerTitle
      },
      roadmapId,
      assignment: {
        id: assignment.id,
        careerId: assignment.careerId,
        weekNumber: assignment.weekNumber,
        title: assignment.title,
        description: assignment.description,
        maxMarks: assignment.maxMarks,
        learningOutcomes: assignment.learningOutcomes,
        questions: assignment.questions,
        rubric: assignment.rubric,
        templatePdfUrl: `/api/assignments/template?careerId=${assignment.careerId}&weekNumber=${assignment.weekNumber}`
      },
      hasSubmitted: Boolean(existingSubmission),
      submission: existingSubmission
        ? {
            id: existingSubmission.id,
            status: existingSubmission.status,
            aiScore: existingSubmission.aiScore,
            finalScore: existingSubmission.finalScore,
            aiDetected: existingSubmission.aiDetected,
            aiProbability: existingSubmission.aiProbability,
            aiFeedback: existingSubmission.aiFeedback,
            adminFeedback: existingSubmission.adminFeedback,
            pageCount: existingSubmission.pageCount,
            fileSizeBytes: existingSubmission.fileSizeBytes,
            submittedAt: existingSubmission.submittedAt,
            pdfUrl: `/api/assignments/download/${existingSubmission.id}`,
            evalSheetUrl: `/api/assignments/eval-sheet/${existingSubmission.id}`
          }
        : null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/assignments/template
 * Downloads the personalized 1-page Part A Cover Page PDF with student metadata.
 */
const downloadCoverTemplate = async (req, res, next) => {
  try {
    const weekNumber = parseInt(req.query.weekNumber || '1', 10);
    const { careerId, careerTitle } = await resolveStudentContext(req.user.id, req.query.careerId);

    const assignment = await prisma.weeklyAssignment.findUnique({
      where: {
        careerId_weekNumber: {
          careerId,
          weekNumber
        }
      }
    });

    // Extract student education metadata
    const user = req.user;
    const edu = user.education || {};
    const college = edu.college || edu.institution || edu.school || 'University / Institute of Technology';
    const department = edu.branch || edu.department || edu.degree || user.primaryStream || 'Computer Science & Engineering';
    const rollNumber = edu.rollNumber || edu.enrollmentNo || edu.studentId || user.id.slice(0, 8).toUpperCase();

    const pdfBuffer = await generateCoverPagePdf({
      studentName: user.name || 'Disheera Student',
      email: user.email,
      rollNumber,
      college,
      department,
      careerTitle: careerTitle || 'Engineering Track',
      weekNumber,
      assignmentTitle: assignment?.title || `Week ${weekNumber} Practical Assignment`,
      submissionDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    });

    const safeCareerSlug = (careerTitle || 'Career').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const filename = `Disheera_Week_${weekNumber}_Cover_${safeCareerSlug}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'private, no-cache');

    return res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/assignments/submit
 * Handles PDF submission, page validation, file persistence, and automatic AI grading trigger.
 */
const submitAssignment = async (req, res, next) => {
  try {
    const { weekNumber, fileData, pdfBase64, assignmentId, roadmapId: inputRoadmapId, careerId: inputCareerId } = req.body;

    const parsedWeekNumber = parseInt(weekNumber, 10);
    if (isNaN(parsedWeekNumber) || parsedWeekNumber < 1) {
      return res.status(400).json({
        success: false,
        message: 'A valid week number (1-12) is required for assignment submission.'
      });
    }

    const rawData = fileData || pdfBase64;
    if (!rawData || typeof rawData !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Assignment PDF file is required (must be base64 Data URI or base64 string).'
      });
    }

    // Extract base64 payload
    let base64String = rawData;
    if (rawData.startsWith('data:')) {
      const match = rawData.match(/^data:([a-zA-Z0-9\/+.-]+);base64,(.+)$/s);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Invalid base64 Data URI format for PDF submission.'
        });
      }
      const mime = match[1].toLowerCase();
      if (mime !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          message: `Only official PDF submissions are accepted (received: ${mime}). Please convert your documents/photos to a merged PDF.`
        });
      }
      base64String = match[2];
    }

    const pdfBuffer = Buffer.from(base64String, 'base64');

    // 1. Validate File Size (<= 15MB)
    if (pdfBuffer.length > MAX_FILE_SIZE_BYTES) {
      const actualMb = (pdfBuffer.length / (1024 * 1024)).toFixed(2);
      return res.status(400).json({
        success: false,
        message: `Submission file size (${actualMb}MB) exceeds the maximum allowed limit of 15MB.`
      });
    }

    // 2. Validate PDF Magic Bytes (%PDF)
    const magic = pdfBuffer.subarray(0, 4).toString('ascii');
    if (!magic.startsWith('%PDF')) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is corrupted or not a valid PDF document (missing %PDF signature).'
      });
    }

    // 3. Inspect Page Count via PDFParse
    let pageCount = 1;
    let extractedText = '';
    try {
      const parser = new (getPDFParse())({ data: pdfBuffer });
      const loaded = await parser.load();
      pageCount = loaded?.numPages || parser.doc?.numPages || 1;
      const parsedTextResult = await parser.getText();
      extractedText = parsedTextResult?.text || '';
    } catch (parseErr) {
      console.warn('[assignmentController.submit] PDF parsing warning:', parseErr.message);
    }

    // Require at least 2 pages (Page 1 Cover Sheet + at least Page 2 solution photos/work)
    if (pageCount < 2) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete submission dossier: Your PDF only contains 1 page. In accordance with collegiate standards, please attach your handwritten solution sheets, diagrams, or code listings (Part B) directly behind the Cover Sheet (Part A). Minimum 2 pages required.'
      });
    }

    // 4. Resolve Context & Assignment
    const { careerId, roadmapId: resolvedRoadmapId } = await resolveStudentContext(
      req.user.id,
      inputCareerId
    );
    const targetRoadmapId = inputRoadmapId || resolvedRoadmapId || 'default-roadmap';

    let targetAssignmentId = assignmentId;
    if (!targetAssignmentId) {
      const assignment = await prisma.weeklyAssignment.findUnique({
        where: {
          careerId_weekNumber: {
            careerId,
            weekNumber: parsedWeekNumber
          }
        }
      });
      if (assignment) {
        targetAssignmentId = assignment.id;
      }
    }

    if (!targetAssignmentId) {
      const fallbackAssignment = await prisma.weeklyAssignment.findFirst({
        where: { weekNumber: parsedWeekNumber }
      });
      targetAssignmentId = fallbackAssignment?.id;
    }

    if (!targetAssignmentId) {
      return res.status(404).json({
        success: false,
        message: `No collegiate assignment found for Week ${parsedWeekNumber}.`
      });
    }

    // 5. Save File to Disk
    const filename = `asgn_${req.user.id}_w${parsedWeekNumber}_${Date.now()}.pdf`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    const relativePdfUrl = `/api/assignments/file/${filename}`;

    // 6. Upsert AssignmentSubmission Record
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        userId: req.user.id,
        assignmentId: targetAssignmentId
      }
    });

    let submission;
    if (existingSubmission) {
      // Remove old local file if present
      if (existingSubmission.pdfUrl && existingSubmission.pdfUrl.includes('/api/assignments/file/')) {
        const oldFilename = existingSubmission.pdfUrl.split('/').pop();
        const oldPath = path.join(UPLOADS_DIR, oldFilename);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (_) {}
        }
      }

      submission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          roadmapId: targetRoadmapId,
          weekNumber: parsedWeekNumber,
          pdfUrl: relativePdfUrl,
          fileSizeBytes: pdfBuffer.length,
          pageCount,
          status: 'SUBMITTED',
          submittedAt: new Date()
        }
      });
    } else {
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: targetAssignmentId,
          userId: req.user.id,
          roadmapId: targetRoadmapId,
          weekNumber: parsedWeekNumber,
          pdfUrl: relativePdfUrl,
          fileSizeBytes: pdfBuffer.length,
          pageCount,
          status: 'SUBMITTED'
        }
      });
    }

    // 7. Update corresponding RoadmapTask if available
    try {
      const task = await prisma.roadmapTask.findFirst({
        where: {
          roadmapId: targetRoadmapId,
          weekNumber: parsedWeekNumber,
          type: { in: ['project', 'practice', 'quiz'] }
        }
      });
      if (task) {
        await prisma.roadmapTask.update({
          where: { id: task.id },
          data: {
            projectVerification: {
              status: 'submitted',
              submissionId: submission.id,
              submittedAt: new Date().toISOString()
            }
          }
        });
      }
    } catch (taskErr) {
      console.warn('[assignmentController.submit] RoadmapTask link warning:', taskErr.message);
    }

    // 8. Trigger Phase 2 Dual-Layer AI Evaluation (Multimodal Gemini + Anti-AI Shield)
    let evaluationResult = null;
    try {
      evaluationResult = await evaluateSubmission(submission.id);
    } catch (evalErr) {
      console.warn('[assignmentController.submit] AI Auto-Grader async evaluation note:', evalErr.message);
    }

    const currentStatus = evaluationResult ? evaluationResult.status : submission.status;
    const finalScore = evaluationResult ? evaluationResult.finalScore : submission.finalScore;
    const aiScore = evaluationResult ? evaluationResult.rawScore : submission.aiScore;

    return res.status(201).json({
      success: true,
      message: currentStatus === 'FLAGGED_AI'
        ? 'Assignment received! High AI writing generation was detected; submission is flagged for human administrative review.'
        : 'Assignment successfully submitted and officially evaluated!',
      submission: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        weekNumber: submission.weekNumber,
        status: currentStatus,
        pageCount: submission.pageCount,
        fileSizeBytes: submission.fileSizeBytes,
        aiScore,
        finalScore,
        aiDetected: evaluationResult?.antiAi?.aiDetected ?? false,
        aiProbability: evaluationResult?.antiAi?.aiProbability ?? 0.0,
        aiReasons: evaluationResult?.antiAi?.aiReasons ?? [],
        aiFeedback: evaluationResult?.feedback ?? null,
        rubricBreakdown: evaluationResult?.rubricBreakdown ?? null,
        pdfUrl: `/api/assignments/download/${submission.id}`,
        evalSheetUrl: `/api/assignments/eval-sheet/${submission.id}`,
        submittedAt: submission.submittedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/assignments/:id/evaluate
 * Triggers on-demand AI re-evaluation for a submission (admin or student owner).
 */
const evaluateSubmissionEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Assignment submission dossier not found.'
      });
    }

    const isOwner = submission.userId === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to evaluate this dossier.'
      });
    }

    const result = await evaluateSubmission(id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/assignments/my-submissions
 * Returns student's historical submission records, grading status, and scores.
 */
const getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { userId: req.user.id },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            weekNumber: true,
            maxMarks: true,
            careerId: true
          }
        }
      },
      orderBy: { weekNumber: 'asc' }
    });

    const formatted = submissions.map((s) => ({
      id: s.id,
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignment?.title || `Week ${s.weekNumber} Assignment`,
      weekNumber: s.weekNumber,
      maxMarks: s.assignment?.maxMarks || 10,
      status: s.status,
      pageCount: s.pageCount,
      fileSizeBytes: s.fileSizeBytes,
      aiScore: s.aiScore,
      adminScore: s.adminScore,
      finalScore: s.finalScore,
      aiDetected: s.aiDetected,
      aiProbability: s.aiProbability,
      aiFeedback: s.aiFeedback,
      adminFeedback: s.adminFeedback,
      submittedAt: s.submittedAt,
      reviewedAt: s.reviewedAt,
      pdfDownloadUrl: `/api/assignments/download/${s.id}`,
      evalSheetUrl: `/api/assignments/eval-sheet/${s.id}`
    }));

    return res.status(200).json({
      success: true,
      totalSubmissions: formatted.length,
      submissions: formatted
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/assignments/download/:submissionId
 * Streams or downloads the student's submitted assignment PDF.
 */
const downloadSubmissionPdf = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Assignment submission dossier not found.'
      });
    }

    const isOwner = submission.userId === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this assignment dossier.'
      });
    }

    const filename = submission.pdfUrl.split('/').pop();
    const filePath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Submitted PDF file asset was not found on server storage.'
      });
    }

    const stat = fs.statSync(filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `inline; filename="Submission_Week_${submission.weekNumber}.pdf"`);

    const stream = fs.createReadStream(filePath);
    return stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/assignments/eval-sheet/:submissionId
 * Streams the Part C Official Evaluation Sheet PDF.
 */
const downloadEvaluationSheet = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        user: true
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation dossier not found for specified submission ID.'
      });
    }

    const isOwner = submission.userId === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this evaluation sheet.'
      });
    }

    const evalFilePath = path.join(UPLOADS_DIR, `eval_${submission.id}.pdf`);
    if (fs.existsSync(evalFilePath)) {
      const stat = fs.statSync(evalFilePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `inline; filename="Part_C_Evaluation_Week_${submission.weekNumber}.pdf"`);
      const stream = fs.createReadStream(evalFilePath);
      return stream.pipe(res);
    }

    // If file doesn't exist on disk yet, generate dynamically
    const pdfBuf = await generateEvaluationSheetPdf({
      submission,
      assignment: submission.assignment,
      user: submission.user,
      antiAiResult: {
        aiProbability: submission.aiProbability,
        aiReasons: submission.aiDetectionReasons
      },
      rubricBreakdown: submission.aiRubricBreakdown || {}
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuf.length);
    res.setHeader('Content-Disposition', `inline; filename="Part_C_Evaluation_Week_${submission.weekNumber}.pdf"`);
    return res.end(pdfBuf);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWeeklyAssignment,
  downloadCoverTemplate,
  submitAssignment,
  evaluateSubmissionEndpoint,
  getMySubmissions,
  downloadSubmissionPdf,
  downloadEvaluationSheet
};

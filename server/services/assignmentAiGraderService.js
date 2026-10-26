/**
 * services/assignmentAiGraderService.js — Multimodal Gemini AI Auto-Grader (Plan 46)
 *
 * Implements Phase 2 Dual-Layer Evaluation:
 * 1. Ingests student assignment PDF (Cover Sheet Part A + Solutions Part B)
 * 2. Runs Anti-AI Writing Shield (synthetic perplexity, LLM marker heuristics)
 * 3. Evaluates work against the 4D Collegiate Rubric (out of 10 Marks):
 *    - Problem Solving & Accuracy (4.0 pts)
 *    - Methodological Rigour & Schematics (3.0 pts)
 *    - Clarity & Step Flow (3.0 pts)
 * 4. Calls Gemini 1.5/2.0 Multimodal API (with Groq and deterministic fallback)
 * 5. Applies Anti-AI penalty/escalation policy:
 *    - <30% AI: Authentic (Full Marks, status = GRADED)
 *    - 30%-60% AI: Moderate AI (15% penalty, status = GRADED)
 *    - >60% AI: High AI (status = FLAGGED_AI, flagged for human admin review)
 * 6. Generates Part C Stamped Evaluation Appendix & notifies student
 *
 * Disheera Technologies Inc.
 */

const fs = require('fs');
const path = require('path');
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
const { prisma } = require('../config/prisma');
const { detectAiContent } = require('./antiAiDetectionService');
const { generateEvaluationSheetPdf, notifyStudentEvaluation } = require('./assignmentFeedbackService');

let callGroq = null;
let callGemini = null;
try {
  callGroq = require('./groqService').callGroq;
} catch (e) {}
try {
  callGemini = require('./geminiService').callGemini;
} catch (e) {}

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'assignments');

/**
 * Deterministic fallback evaluator when LLM APIs are unreachable or offline.
 */
function evaluateDeterministic(extractedText, questions = [], rubric = {}) {
  const text = (extractedText || '').toLowerCase();
  let matchedKeywordCount = 0;
  let totalKeywords = 0;

  questions.forEach(q => {
    const kws = q.expectedKeywords || [];
    totalKeywords += kws.length;
    kws.forEach(kw => {
      if (text.includes(kw.toLowerCase())) {
        matchedKeywordCount++;
      }
    });
  });

  const keywordRatio = totalKeywords > 0 ? (matchedKeywordCount / totalKeywords) : 0.6;
  const lengthBonus = Math.min(1.0, text.length / 800);

  // 1. Problem Solving (max 4.0)
  const problemSolving = +(Math.min(4.0, Math.max(1.8, 4.0 * (0.6 * keywordRatio + 0.4 * lengthBonus)))).toFixed(1);

  // 2. Methodology & Schematics (max 3.0)
  const hasSchematicRef = text.includes('diagram') || text.includes('flow') || text.includes('architecture') || text.includes('cycle') || text.includes('tree');
  const methodologyBase = hasSchematicRef ? 2.5 : 2.0;
  const methodology = +(Math.min(3.0, Math.max(1.5, methodologyBase * (0.7 + 0.3 * keywordRatio)))).toFixed(1);

  // 3. Clarity & Step Flow (max 3.0)
  const hasNumberedSteps = /\b(1\.|2\.|step\s*1|first|second)\b/i.test(extractedText);
  const clarityBase = hasNumberedSteps ? 2.6 : 2.1;
  const clarity = +(Math.min(3.0, Math.max(1.5, clarityBase * (0.8 + 0.2 * lengthBonus)))).toFixed(1);

  const rawScore = +(problemSolving + methodology + clarity).toFixed(1);

  return {
    score: Math.min(10.0, rawScore),
    rubricBreakdown: {
      problemSolving,
      methodology,
      clarity
    },
    strengths: [
      'Comprehensive attempt addressing core prompt milestones.',
      'Clear decomposition of technical terminology and operational stages.'
    ],
    improvements: [
      'Incorporate deeper mathematical complexity analysis and edge-case failure matrices.',
      'Expand on state transition diagrams and distributed failure modes.'
    ],
    feedback: `Solid collegiate laboratory submission. Demonstrates practical understanding of weekly core concepts with good structural flow. (Evaluated out of 10.0)`
  };
}

/**
 * Calls Gemini / Groq to evaluate assignment text against collegiate questions & rubric.
 */
async function callAiEvaluator(extractedText, assignment) {
  const questionsPrompt = (assignment.questions || [])
    .map((q, idx) => `Question ${idx + 1} (${q.marks} Marks):\n${q.prompt}\nExpected Concepts: ${(q.expectedKeywords || []).join(', ')}`)
    .join('\n\n');

  const prompt = `You are Disheera AI Multimodal Collegiate Auto-Grader. Evaluate the following student assignment solution against the official questions and 4D rubric.

ASSIGNMENT: ${assignment.title}
WEEK NUMBER: ${assignment.weekNumber}
MAX MARKS: 10.0

OFFICIAL QUESTIONS:
${questionsPrompt}

STUDENT SUBMITTED WORK:
"""
${extractedText.slice(0, 3500)}
"""

EVALUATION 4D RUBRIC:
1. Problem Solving & Accuracy: Max 4.0 marks (Logic correctness, solution completeness, technical rigor)
2. Methodological Rigour & Schematics: Max 3.0 marks (Step-by-step reasoning, architectural derivations, formulas)
3. Clarity & Step Flow: Max 3.0 marks (Neat presentation, clear sequence, proper documentation)

CRITICAL OUTPUT REQUIREMENT:
Output ONLY valid, parseable JSON with NO markdown code fences or backticks:
{
  "score": <float between 0.0 and 10.0>,
  "rubricBreakdown": {
    "problemSolving": <float between 0.0 and 4.0>,
    "methodology": <float between 0.0 and 3.0>,
    "clarity": <float between 0.0 and 3.0>
  },
  "strengths": ["string", "string"],
  "improvements": ["string", "string"],
  "feedback": "string"
}`;

  // 1. Try Groq (Fast LPU inference)
  if (callGroq && process.env.GROQ_API_KEY) {
    try {
      const messages = [
        { role: 'system', content: 'You are an objective academic evaluator. Output strictly pure JSON.' },
        { role: 'user', content: prompt }
      ];
      const rawRes = await callGroq(messages, null, 1024);
      const text = typeof rawRes === 'string' ? rawRes : (rawRes.content || '');
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed.score === 'number' && parsed.rubricBreakdown) {
        return parsed;
      }
    } catch (groqErr) {
      console.warn('[assignmentAiGraderService] Groq evaluation warning:', groqErr.message);
    }
  }

  // 2. Try Gemini Multimodal
  if (callGemini && process.env.GEMINI_API_KEY) {
    try {
      const contents = [{ role: 'user', parts: [{ text: prompt }] }];
      const rawRes = await callGemini(contents, null, null, 'You are an objective academic evaluator. Output strictly pure JSON.');
      const text = typeof rawRes === 'string' ? rawRes : (rawRes.text || '');
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed.score === 'number' && parsed.rubricBreakdown) {
        return parsed;
      }
    } catch (geminiErr) {
      console.warn('[assignmentAiGraderService] Gemini evaluation warning:', geminiErr.message);
    }
  }

  // 3. Fallback to deterministic rubric
  return evaluateDeterministic(extractedText, assignment.questions, assignment.rubric);
}

/**
 * Main Evaluation Orchestrator:
 * Ingests assignment submission, applies Anti-AI shield, scores 4D rubric, updates DB, stamps Part C.
 *
 * @param {string} submissionId - ID of AssignmentSubmission
 * @returns {Promise<object>} Evaluation result dossier
 */
async function evaluateSubmission(submissionId) {
  if (!submissionId) throw new Error('submissionId is required for assignment evaluation.');

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          whatsappNotificationsEnabled: true,
          education: true,
          primaryStream: true
        }
      }
    }
  });

  if (!submission) {
    throw new Error(`Assignment submission not found for ID: ${submissionId}`);
  }

  // Mark status as EVALUATING
  await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: { status: 'EVALUATING' }
  });

  // 1. Resolve PDF file from storage
  let extractedText = '';
  let pageCount = submission.pageCount || 2;
  const filename = submission.pdfUrl.split('/').pop();
  const filePath = path.join(UPLOADS_DIR, filename);

  if (fs.existsSync(filePath)) {
    try {
      const pdfBuffer = fs.readFileSync(filePath);
      const parser = new (getPDFParse())({ data: pdfBuffer });
      const loaded = await parser.load();
      pageCount = loaded?.numPages || pageCount;
      const parsedResult = await parser.getText();
      extractedText = parsedResult?.text || '';
    } catch (readErr) {
      console.warn('[assignmentAiGraderService] PDF read/parse warning:', readErr.message);
    }
  }

  // 2. Run Anti-AI Writing Shield
  const antiAiResult = detectAiContent(extractedText, { pageCount });

  // 3. Run AI 4D Rubric Grader
  const aiGrading = await callAiEvaluator(extractedText, submission.assignment);

  const rawScore = +(Math.min(10.0, Math.max(0.0, aiGrading.score || 7.5))).toFixed(1);
  const rubricBreakdown = aiGrading.rubricBreakdown || {
    problemSolving: +(rawScore * 0.4).toFixed(1),
    methodology: +(rawScore * 0.3).toFixed(1),
    clarity: +(rawScore * 0.3).toFixed(1)
  };

  // 4. Apply Escalation & Penalty Policy (Plan 46 Section 3)
  let finalStatus = 'GRADED';
  let finalScore = rawScore;
  let penaltyNotice = '';

  if (antiAiResult.aiProbability > 0.60) {
    // High AI Generation: Flag for human review
    finalStatus = 'FLAGGED_AI';
    finalScore = null; // Suspended until admin review
    penaltyNotice = `🚨 HIGH AI GENERATION DETECTED (${Math.round(antiAiResult.aiProbability * 100)}% confidence). This submission has been flagged for human administrative review. Please ensure your submission contains original handwritten derivations.`;
  } else if (antiAiResult.aiProbability >= 0.30) {
    // Moderate AI: 15% academic deduction
    finalStatus = 'GRADED';
    finalScore = +(Math.max(0, rawScore * 0.85)).toFixed(1);
    penaltyNotice = `⚠️ MODERATE AI ASSISTANCE DETECTED (${Math.round(antiAiResult.aiProbability * 100)}% confidence). A 15% synthetic assistance penalty was deducted (Raw: ${rawScore} → Final: ${finalScore}).`;
  } else {
    // Authentic Student Work
    finalStatus = 'GRADED';
    finalScore = rawScore;
    penaltyNotice = `✅ AUTHENTIC STUDENT WORK VERIFIED (${Math.round((1 - antiAiResult.aiProbability) * 100)}% authenticity score). Full collegiate merit points credited.`;
  }

  const combinedFeedback = [
    penaltyNotice,
    aiGrading.feedback || '',
    Array.isArray(aiGrading.strengths) && aiGrading.strengths.length > 0 ? `\n• Key Strengths: ${aiGrading.strengths.join('; ')}` : '',
    Array.isArray(aiGrading.improvements) && aiGrading.improvements.length > 0 ? `\n• Recommended Improvements: ${aiGrading.improvements.join('; ')}` : ''
  ].filter(Boolean).join('\n\n').trim();

  // 5. Update Database Record
  const updatedSubmission = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      aiScore: rawScore,
      finalScore: finalScore,
      aiRubricBreakdown: rubricBreakdown,
      aiProbability: antiAiResult.aiProbability,
      aiDetected: antiAiResult.aiDetected,
      aiDetectionReasons: antiAiResult.aiReasons,
      aiFeedback: combinedFeedback,
      status: finalStatus,
      aiEvaluatedAt: new Date()
    }
  });

  // 6. Generate Part C Stamped Evaluation Appendix
  try {
    await generateEvaluationSheetPdf({
      submission: updatedSubmission,
      assignment: submission.assignment,
      user: submission.user,
      antiAiResult,
      rubricBreakdown
    });
  } catch (sheetErr) {
    console.warn('[assignmentAiGraderService] Part C PDF stamp warning:', sheetErr.message);
  }

  // 7. Dispatch Student Notification (WhatsApp / in-app)
  try {
    await notifyStudentEvaluation({
      user: submission.user,
      submission: updatedSubmission,
      assignment: submission.assignment,
      antiAiResult
    });
  } catch (notifErr) {
    console.warn('[assignmentAiGraderService] Notification warning:', notifErr.message);
  }

  return {
    success: true,
    submissionId: updatedSubmission.id,
    weekNumber: updatedSubmission.weekNumber,
    status: updatedSubmission.status,
    rawScore,
    finalScore: updatedSubmission.finalScore,
    rubricBreakdown,
    antiAi: antiAiResult,
    feedback: combinedFeedback
  };
}

module.exports = {
  evaluateSubmission,
  evaluateDeterministic,
  callAiEvaluator
};

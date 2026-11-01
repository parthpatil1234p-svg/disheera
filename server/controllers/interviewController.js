/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/interviewController.js — AI Mock Interview Controller
 *
 * Disheera · Enterprise Backend Service
 */

const crypto = require('crypto');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const { generateInterviewQuestions, evaluateInterviewAnswer } = require('../services/mockInterviewService');

/**
 * POST /api/interview/start
 * Generates 3 interview questions for candidate.
 */
exports.startInterview = async (req, res, next) => {
  try {
    const { targetRole } = req.body;
    const user = await User.findById(req.user._id);

    let role = targetRole;
    if (!role) {
      const activeRoadmap = await Roadmap.findOne({ user: req.user._id, status: 'active' }).populate('career');
      role = activeRoadmap?.career?.title || (user?.interests && user.interests[0]) || 'Full-Stack Developer';
    }

    const questions = await generateInterviewQuestions(role, user?.skills || []);
    const normalizedQuestions = (questions || []).map(q => ({
      question: q.question || q.questionText || '',
      questionText: q.question || q.questionText || '',
      questionType: q.questionType || q.category || 'technical',
      category: q.questionType || q.category || 'technical',
      rubric: q.rubric || ''
    }));

    const secureId = crypto.randomBytes(8).toString('hex');
    return res.status(200).json({
      success: true,
      message: `Interview session generated for ${role}.`,
      data: {
        sessionId: `session_${Date.now()}_${secureId}`,
        targetRole: role,
        totalQuestions: normalizedQuestions.length,
        questions: normalizedQuestions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/evaluate
 * Evaluates a single answer.
 */
exports.evaluateAnswer = async (req, res, next) => {
  try {
    const question = req.body.question || req.body.questionText || 'Technical scenario question';
    const answer = req.body.answer || req.body.answerText;
    const questionType = req.body.questionType || req.body.category || 'technical';
    const targetRole = req.body.targetRole || 'Full-Stack Developer';

    if (!answer || String(answer).trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A valid answer of at least 5 characters is required.'
      });
    }

    const evaluation = await evaluateInterviewAnswer(question, answer, questionType, targetRole);

    return res.status(200).json({
      success: true,
      data: {
        ...evaluation,
        modelAnswerSnippet: evaluation.modelAnswer || evaluation.modelAnswerSnippet || '',
        rubric: {
          compositeScore: evaluation.overallScore,
          technicalDepth: evaluation.technicalScore,
          communication: evaluation.communicationScore,
          practicalApplication: evaluation.practicalScore
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/interview/finalize
 * Finalizes the interview session and updates user readiness profile.
 */
exports.finalizeInterview = async (req, res, next) => {
  try {
    const { targetRole, history, scores } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let overallScore = 75;
    if (scores && typeof scores.overallScore === 'number') {
      overallScore = Math.round(Number(scores.overallScore));
    } else if (Array.isArray(history) && history.length > 0) {
      const sum = history.reduce((acc, h) => acc + (Number(h.score) || 75), 0);
      overallScore = Math.round(sum / history.length);
    }

    const technicalScore = Math.round(Number(scores?.technicalScore || overallScore));
    const communicationScore = Math.round(Number(scores?.communicationScore || overallScore));
    const practicalScore = Math.round(Number(scores?.practicalScore || overallScore));

    user.mockInterview = {
      overallScore,
      technicalScore,
      communicationScore,
      practicalScore,
      targetRole: targetRole || 'Software Engineer',
      completedAt: new Date(),
      history: Array.isArray(history) ? history.slice(0, 5) : []
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Mock interview successfully recorded! Score added to Job Readiness Index.',
      data: {
        overallScore: user.mockInterview.overallScore,
        averageScore: user.mockInterview.overallScore,
        technicalScore: user.mockInterview.technicalScore,
        communicationScore: user.mockInterview.communicationScore,
        practicalScore: user.mockInterview.practicalScore,
        targetRole: user.mockInterview.targetRole,
        completedAt: user.mockInterview.completedAt,
        history: user.mockInterview.history
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/interview/status
 * Returns existing interview record.
 */
exports.getInterviewStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: user.mockInterview || null
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/quizController.js - Controller for Adaptive Skill Reality-Check Quiz
 *
 * Disheera · Enterprise Backend Service
 */

const quizService = require('../services/quizService');
const aiQuizGeneratorService = require('../services/aiQuizGeneratorService');
const User = require('../models/User');
const { AVAILABLE_QUIZ_SKILLS } = require('../data/quizQuestions');
const { cacheManager } = require('../utils/cacheManager');

// In-memory IP rate limiter for quiz starts (Pillar 4: Sybil Defense)
const quizStartRateLimiter = new Map();

/**
 * POST /api/quiz/start
 * Initializes an adaptive quiz session with optional multi-model AI provider or custom API key.
 * Enforces 24-hour retake cooldown and IP rate limiting.
 */
exports.startQuiz = async (req, res) => {
  try {
    const { skill, provider, userApiKey, displayName, forceAI } = req.body;
    if (!skill) {
      return res.status(400).json({ success: false, message: 'Skill parameter is required' });
    }

    // IP rate-limiting check (Pillar 4)
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local';
    const isLocalhost = clientIp.includes('127.0.0.1') || clientIp.includes('::1') || clientIp === 'local';
    const now = Date.now();

    if (!isLocalhost) {
      const ipHistory = quizStartRateLimiter.get(clientIp) || [];
      const recentAttempts = ipHistory.filter((t) => now - t < 15 * 60 * 1000); // 15 mins window
      if (recentAttempts.length >= 10) {
        return res.status(429).json({
          success: false,
          rateLimited: true,
          message: 'Too many quiz session initializations from this network. Please wait a few minutes before retrying.'
        });
      }
      recentAttempts.push(now);
      quizStartRateLimiter.set(clientIp, recentAttempts);
    }

    // Client bypass removed (AUTHZ-03 fix)

    const session = await quizService.startQuizSession(req.user.id, skill, {
      provider,
      userApiKey: userApiKey || req.headers['x-user-api-key'] || null,
      displayName,
      forceAI: Boolean(forceAI),
      bypassCooldown: false
    });

    return res.status(200).json({ success: true, data: session });
  } catch (err) {
    if (err.code === 'COOLDOWN_ACTIVE') {
      return res.status(429).json({
        success: false,
        cooldownActive: true,
        retryAfterHours: err.retryAfterHours,
        message: err.message
      });
    }
    console.error('[QuizController.startQuiz] Error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/quiz/answer
 * Submits an answer choice and receives immediate explanation + next question or summary.
 * Captures high-fidelity proctoring telemetry (timeTakenSeconds, tabSwitches).
 */
exports.submitAnswer = async (req, res) => {
  try {
    const {
      skill,
      questionId,
      selectedIndex,
      selectedOption,
      sessionId,
      timeTakenSeconds,
      tabSwitches
    } = req.body;
    const choice = selectedIndex !== undefined ? selectedIndex : selectedOption;

    let targetSkill = skill;
    if (!targetSkill && sessionId && sessionId.includes('_')) {
      targetSkill = sessionId.split('_').slice(1).join('_');
    }

    const session = quizService.getActiveSessionForUser(req.user.id, targetSkill);
    if (!targetSkill && session) {
      targetSkill = session.skill;
    }

    let targetQuestionId = questionId || session?.currentQuestionId;

    if (!targetSkill || !targetQuestionId || choice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'skill (or sessionId), questionId, and selectedIndex (or selectedOption) are required'
      });
    }

    const telemetry = {
      timeTakenSeconds: typeof timeTakenSeconds === 'number' ? timeTakenSeconds : undefined,
      tabSwitches: typeof tabSwitches === 'number' ? tabSwitches : undefined
    };

    const result = await quizService.submitAnswer(
      req.user.id,
      targetSkill,
      targetQuestionId,
      choice,
      telemetry
    );
    if (result && result.isComplete) {
      cacheManager.invalidateUser(req.user.id);
    }
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[QuizController.submitAnswer] Error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/quiz/status
 * Returns user skills eligible for quiz and their current verification status with Skill Passport metadata
 */
exports.getQuizStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const baseSkills = AVAILABLE_QUIZ_SKILLS || ['javascript', 'python', 'sql', 'react', 'node.js', 'html', 'css'];
    const userSkills = user.skills || [];

    // Combine banked skills with any custom skills claimed by the user
    const claimedSkillNames = userSkills.map((s) => (s.name || '').toLowerCase()).filter(Boolean);
    const allSkillNames = Array.from(new Set([...baseSkills, ...claimedSkillNames]));

    const now = new Date();
    const statusList = allSkillNames.map((name) => {
      const match = userSkills.find((s) => (s.name || '').toLowerCase() === name);
      const isCooldown = Boolean(match?.nextRetakeAvailableAt && now < new Date(match.nextRetakeAvailableAt));
      const hoursRemaining = isCooldown
        ? Math.max(1, Math.ceil((new Date(match.nextRetakeAvailableAt) - now) / (1000 * 60 * 60)))
        : 0;

      return {
        skill: name,
        displayName: match?.displayName || (name === 'sql' ? 'SQL' : name === 'html' ? 'HTML' : name === 'css' ? 'CSS' : name === 'node.js' ? 'Node.js' : name.charAt(0).toUpperCase() + name.slice(1)),
        isClaimed: !!match,
        selfRated: match?.selfRatedProficiency || match?.proficiency || null,
        isQuizVerified: !!match?.isQuizVerified,
        isCodeVerified: !!match?.isCodeVerified,
        verifiedProficiency: match?.verifiedProficiency || null,
        quizScore: match?.quizScore || 0,
        quizGaps: match?.quizGaps || [],
        quizVerifiedAt: match?.quizVerifiedAt || null,
        verificationTier: match?.verificationTier || (match?.isCodeVerified ? 'project_verified' : match?.isQuizVerified ? 'quiz_verified' : 'self_rated'),
        verificationStatus: match?.verificationStatus || (match?.isQuizVerified || match?.isCodeVerified ? 'verified' : 'unverified'),
        integrityScore: match?.integrityScore !== undefined ? match.integrityScore : 100,
        nextRetakeAvailableAt: match?.nextRetakeAvailableAt || null,
        cooldownActive: isCooldown,
        cooldownRemainingHours: hoursRemaining,
        tabSwitchCount: match?.tabSwitchCount || 0,
        velocityAnomalyCount: match?.velocityAnomalyCount || 0
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        skills: statusList,
        availableQuizSkills: allSkillNames,
        totalVerified: statusList.filter((s) => s.isQuizVerified || s.isCodeVerified).length
      }
    });
  } catch (err) {
    console.error('[QuizController.getQuizStatus] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving quiz status' });
  }
};

/**
 * GET /api/quiz/providers
 * Returns supported AI quiz generation engines & availability
 */
exports.getQuizProviders = async (req, res) => {
  try {
    const providers = aiQuizGeneratorService.getAvailableProviders();
    return res.status(200).json({ success: true, data: providers });
  } catch (err) {
    console.error('[QuizController.getQuizProviders] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving quiz providers' });
  }
};

/**
 * POST /api/quiz/violation
 * Authoritative proctoring violation recorder (fullscreen exit, tab switch, devtools attempt, clipboard)
 * Applies 3-strike policy with automatic session lock on Strike 3.
 */
exports.recordViolation = async (req, res) => {
  try {
    const { sessionId, skill, violationType, details } = req.body;
    let targetSkill = typeof skill === 'string' ? skill.trim() : null;
    if (!targetSkill && typeof sessionId === 'string' && sessionId.includes('_')) {
      targetSkill = sessionId.split('_').slice(1).join('_');
    }

    const violation = quizService.recordViolation(
      req.user.id,
      targetSkill,
      typeof violationType === 'string' ? violationType : 'proctoring_anomaly',
      details && typeof details === 'object' ? details : {}
    );

    return res.status(200).json({
      success: true,
      data: violation
    });
  } catch (err) {
    console.error('[QuizController.recordViolation] Error:', err.message);
    const status = err.status || 400;
    return res.status(status).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/quiz/active-session
 * Returns active proctored quiz session state for recovery on page reload
 */
exports.getActiveSession = async (req, res) => {
  try {
    const skill = typeof req.query.skill === 'string' ? req.query.skill.trim() : null;
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId.trim() : null;
    let targetSkill = skill;
    if (!targetSkill && sessionId && sessionId.includes('_')) {
      targetSkill = sessionId.split('_').slice(1).join('_');
    }

    const session = quizService.getActiveSession(req.user.id, targetSkill);
    if (!session) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active quiz session found'
      });
    }

    return res.status(200).json({
      success: true,
      data: session
    });
  } catch (err) {
    console.error('[QuizController.getActiveSession] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error checking active quiz session' });
  }
};

/**
 * POST /api/quiz/disqualify
 * Authoritatively terminates quiz session due to cheating / proctoring violations.
 * Writes 0% score, 0 integrity, 'flagged_cheating' status, and 24-hour lockout to MongoDB.
 */
exports.disqualifyUser = async (req, res) => {
  try {
    const { skill, sessionId, reason, strikes } = req.body;
    let targetSkill = skill;
    if (!targetSkill && sessionId && sessionId.includes('_')) {
      targetSkill = sessionId.split('_').slice(1).join('_');
    }

    if (!targetSkill) {
      return res.status(400).json({ success: false, message: 'Skill parameter is required' });
    }

    const result = await quizService.disqualifyUser(req.user.id, targetSkill, {
      strikes: strikes || 3,
      reason: reason || 'REPEATED_PROCTORING_VIOLATIONS'
    });

    return res.status(200).json({
      success: true,
      disqualified: true,
      retryAfterHours: 24,
      data: result,
      message: 'Candidate disqualified for cheating. 24-hour retake lockout activated.'
    });
  } catch (err) {
    console.error('[QuizController.disqualifyUser] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to record disqualification' });
  }
};

/**
 * GET /api/quiz/skills
 * Returns all 94 standardized skills from skillsData, categorized and annotated
 * with bank availability and (if authenticated) user verification status.
 */
exports.getAvailableSkills = async (req, res) => {
  try {
    const skillsData = require('../data/skillsData');
    const { QUIZ_QUESTIONS, normalizeSkillKey } = require('../data/quizQuestions');

    let userSkillsMap = new Map();
    if (req.user && req.user.skills) {
      req.user.skills.forEach((us) => {
        if (us && us.name) {
          userSkillsMap.set(normalizeSkillKey(us.name), us);
        }
      });
    }

    const categoriesSet = new Set();
    const formattedSkills = skillsData.map((s) => {
      const canonicalKey = normalizeSkillKey(s.name);
      categoriesSet.add(s.category);

      const uSkill = userSkillsMap.get(canonicalKey);
      const isBanked = Boolean(QUIZ_QUESTIONS[canonicalKey]);
      const isVerified = Boolean(uSkill?.isQuizVerified || uSkill?.isCodeVerified);
      const isCooldown = Boolean(
        uSkill?.nextRetakeAvailableAt && new Date() < new Date(uSkill.nextRetakeAvailableAt)
      );

      return {
        key: canonicalKey,
        name: canonicalKey,
        displayName: s.displayName || canonicalKey,
        category: s.category || 'general',
        description: s.description || '',
        isBanked,
        isUserSkill: Boolean(uSkill),
        isVerified,
        verifiedProficiency: uSkill?.verifiedProficiency || null,
        selfRatedProficiency: uSkill?.selfRatedProficiency || uSkill?.proficiency || null,
        verificationTier: uSkill?.verificationTier || (isVerified ? 'quiz_verified' : 'self_rated'),
        cooldownActive: isCooldown,
        nextRetakeAvailableAt: uSkill?.nextRetakeAvailableAt || null
      };
    });

    return res.status(200).json({
      success: true,
      total: formattedSkills.length,
      categories: Array.from(categoriesSet),
      data: formattedSkills
    });
  } catch (err) {
    console.error('[QuizController.getAvailableSkills] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch available quiz skills' });
  }
};

/**
 * GET /api/quiz/code-challenges
 * Returns curated code bug challenges (with canonical solution stripped for integrity)
 */
exports.getCodeChallenges = async (req, res) => {
  try {
    const { CODE_BUG_CHALLENGES } = require('../data/codeBugChallenges');
    const { category, skill } = req.query;

    let list = [...CODE_BUG_CHALLENGES];
    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      list = list.filter((c) => c.category.toLowerCase().includes(catLower));
    }
    if (skill) {
      const skillLower = skill.toLowerCase();
      list = list.filter((c) => c.targetSkill.toLowerCase().includes(skillLower));
    }

    // Strip canonical solutions so clients cannot cheat by inspecting JSON payloads
    const sanitized = list.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      difficulty: c.difficulty,
      targetSkill: c.targetSkill,
      filename: c.filename || 'solution.js',
      language: c.language || 'javascript',
      scenario: c.scenario,
      errorLog: c.errorLog,
      initialCode: c.initialCode,
      hints: c.hints,
      testCasesCount: c.testCases.length,
      testCaseDescriptions: c.testCases.map((t) => t.description)
    }));

    return res.status(200).json({
      success: true,
      count: sanitized.length,
      data: sanitized
    });
  } catch (err) {
    console.error('[QuizController.getCodeChallenges] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load code challenges' });
  }
};

/**
 * POST /api/quiz/verify-code-solution
 * Evaluates candidate code submission against assertion tests and records Verified Debugging Index (VDI)
 */
exports.verifyCodeSolution = async (req, res) => {
  try {
    const { CODE_BUG_CHALLENGES } = require('../data/codeBugChallenges');
    const {
      challengeId,
      submittedCode,
      keystrokesCount = 0,
      pasteEventsCount = 0,
      timeElapsedSec = 30
    } = req.body;

    if (!challengeId || !submittedCode) {
      return res.status(400).json({ success: false, message: 'challengeId and submittedCode are required' });
    }

    const challenge = CODE_BUG_CHALLENGES.find((c) => c.id === challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Code challenge not found' });
    }

    // Safety check against excessively large payloads
    if (submittedCode.length > 10000) {
      return res.status(400).json({ success: false, message: 'Submitted code exceeds maximum length limit' });
    }

    // Automated Test Runner
    let passed = false;
    let feedback = '';
    const testResults = [];

    // Run test functions or pattern assertions defined in the challenge
    for (const tc of challenge.testCases) {
      let tcPass = false;
      if (tc.testFn) {
        try {
          const evalFn = new Function('input', `return (${tc.testFn})(input)`);
          tcPass = Boolean(evalFn(submittedCode));
        } catch (e) {
          tcPass = false;
        }
      } else {
        tcPass = !submittedCode.includes('// BUG:') && submittedCode.length > challenge.initialCode.length * 0.5;
      }

      testResults.push({
        description: tc.description,
        passed: tcPass
      });
    }

    const passedCount = testResults.filter((t) => t.passed).length;
    passed = passedCount === testResults.length;

    // Calculate Verified Debugging Index (VDI)
    let vdiScore = 75;
    if (passed) {
      vdiScore += 10;
      if (timeElapsedSec < 180 && timeElapsedSec > 15) vdiScore += 5;
      if (keystrokesCount > 30) vdiScore += 5;
      if (pasteEventsCount > 0) vdiScore = Math.max(70, vdiScore - 5);
      feedback = 'All assertion tests passed! Bug successfully isolated and patched.';
    } else {
      vdiScore = Math.max(30, Math.round((passedCount / testResults.length) * 60));
      feedback = `${testResults.length - passedCount} assertion test(s) failed. Review the stack trace and hints.`;
    }

    // If authenticated and passed, stamp user skill ledger
    if (passed && req.user && req.user.id) {
      const user = await User.findById(req.user.id);
      if (user) {
        if (!Array.isArray(user.skills)) user.skills = [];

        const normSkill = challenge.targetSkill.toLowerCase();
        const skillIndex = user.skills.findIndex((s) => s && s.name && s.name.toLowerCase() === normSkill);

        const verificationRecord = {
          name: challenge.targetSkill,
          displayName: challenge.targetSkill,
          level: 'Advanced',
          isCodeVerified: true,
          verifiedBy: 'CODE_CHAMBER',
          vdiScore,
          verifiedAt: new Date().toISOString(),
          lastChallengeId: challenge.id
        };

        if (skillIndex >= 0) {
          user.skills[skillIndex].isCodeVerified = true;
          user.skills[skillIndex].verifiedBy = 'CODE_CHAMBER';
          user.skills[skillIndex].vdiScore = vdiScore;
        } else {
          user.skills.push(verificationRecord);
        }

        user.markModified('skills');
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      passed,
      vdiScore,
      verificationBadge: passed ? '⭐ Code Verified' : 'Needs Debugging',
      feedback,
      telemetry: {
        pasteEventsRecorded: pasteEventsCount,
        keystrokesRecorded: keystrokesCount,
        executionTimeSec: timeElapsedSec
      },
      testResults
    });
  } catch (err) {
    console.error('[QuizController.verifyCodeSolution] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Code verification failed' });
  }
};



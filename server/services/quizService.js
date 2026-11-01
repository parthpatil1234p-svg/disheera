/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/quizService.js — Adaptive Skill Quiz & Reality-Check Engine
 *
 * Disheera · Enterprise Backend Service
 *
 * Core Logic:
 * - 6 Questions per skill session.
 * - Starts at 'medium' difficulty.
 * - Right answer -> harder next (medium -> hard, easy -> medium).
 * - Wrong answer -> easier next (medium -> easy, hard -> medium).
 * - Real-time validation + punchy 1-line educational explanation.
 * - Reality-Check comparison (You Said vs. Quiz Says) with topic gap extraction.
 * - Evaluates qualification rubric (Advanced >= 3 Hard correct; Intermediate >= 3 Med/Hard correct).
 */

const User = require('../models/User');
const aiQuizGeneratorService = require('./aiQuizGeneratorService');
const {
  QUIZ_QUESTIONS,
  AVAILABLE_QUIZ_SKILLS,
  normalizeSkillKey,
  getQuestion,
  getQuestionById,
} = require('../data/quizQuestions');

// In-memory active session store (keyed by `${userId}_${skill}`)
const activeSessions = new Map();

const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Fisher-Yates shuffle for question options (Pillar 2)
 * Scrambles option order on the server so option positions cannot be memorized or DOM-inspected.
 * Returns sanitized { shuffledOptions, newCorrectIndex }
 */
function shuffleOptions(options, originalCorrectIndex) {
  if (!Array.isArray(options) || options.length === 0) {
    return { shuffledOptions: [], newCorrectIndex: -1 };
  }
  const indexed = options.map((opt, idx) => ({
    text: opt,
    isCorrect: idx === originalCorrectIndex
  }));

  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }

  return {
    shuffledOptions: indexed.map((item) => item.text),
    newCorrectIndex: indexed.findIndex((item) => item.isCorrect)
  };
}

/**
 * Start an adaptive quiz session for a user and skill
 * Supports both curated banked questions and dynamic multi-model AI generation (Groq, Gemini, OpenAI)
 * Enforces 24-hour retake cooldown (Pillar 5) and zero-answer-key client payloads (Pillar 2)
 */
async function startQuizSession(userId, skill, options = {}) {
  const normalizedSkill = normalizeSkillKey(skill);
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const existingSkill = (user.skills || []).find(
    (s) => (s.name || '').toLowerCase() === normalizedSkill
  );

  const selfRated = existingSkill?.selfRatedProficiency || existingSkill?.proficiency || 'intermediate';
  const displayName = existingSkill?.displayName || options.displayName || capitalize(skill);

  // ── Pillar 5: 24-Hour Retake Cooldown Enforcement ─────────────
  if (existingSkill?.nextRetakeAvailableAt && new Date() < new Date(existingSkill.nextRetakeAvailableAt)) {
    const isFlagged = existingSkill.verificationStatus === 'flagged_cheating';
    // If flagged for cheating, cooldown is strictly enforced unless explicit bypass parameter is provided
    const isBypassed = Boolean(options.bypassCooldown || options.forceBypass);
    if (!isBypassed) {
      const diffMs = new Date(existingSkill.nextRetakeAvailableAt) - new Date();
      const hoursRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
      const reasonPrefix = isFlagged ? 'Cheating Disqualification Lockout:' : 'Retake Cooldown:';
      const cooldownErr = new Error(`${reasonPrefix} Skill check for "${displayName}" is locked for 24 hours. Retake available in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}.`);
      cooldownErr.code = 'COOLDOWN_ACTIVE';
      cooldownErr.retryAfterHours = hoursRemaining;
      cooldownErr.isFlagged = isFlagged;
      throw cooldownErr;
    }
  }

  const isBanked = Boolean(QUIZ_QUESTIONS[normalizedSkill]);
  const forceAI = options.forceAI || options.provider === 'groq' || options.provider === 'gemini' || Boolean(options.userApiKey);

  let questions = null;
  let providerUsed = 'curated_bank';

  // If skill is not in static bank or user explicitly requested AI generation
  if (!isBanked || forceAI) {
    try {
      const aiResult = await aiQuizGeneratorService.generateAdaptiveSkillQuiz(displayName || skill, {
        userApiKey: options.userApiKey || null,
        provider: options.provider || 'auto'
      });
      questions = aiResult.questions;
      providerUsed = aiResult.provider;
    } catch (err) {
      console.warn('[QuizService] Dynamic AI generation failed for skill:', String(skill), err && err.message);
    }
  }

  // Fallback to static bank if available and AI was not used
  let firstQuestion = null;
  if (!questions && isBanked) {
    firstQuestion = getQuestion(normalizedSkill, 'medium', []);
    providerUsed = 'curated_bank';
  } else if (questions && questions.length > 0) {
    firstQuestion = questions[0];
  } else {
    // Guaranteed offline fallback
    const offlineResult = await aiQuizGeneratorService.generateAdaptiveSkillQuiz(displayName || skill, { provider: 'offline' });
    questions = offlineResult.questions;
    firstQuestion = questions[0];
    providerUsed = 'offline_engine';
  }

  // Pillar 2: Server-side Fisher-Yates scrambling of first question options
  const shuffledFirst = shuffleOptions(firstQuestion.options, firstQuestion.correctIndex);

  const sessionKey = `${userId}_${normalizedSkill}`;
  const sessionData = {
    userId,
    skill: normalizedSkill,
    displayName,
    selfRated,
    provider: providerUsed,
    isAIGenerated: Boolean(questions),
    questionPool: questions || null,
    currentStep: 1,
    totalSteps: 5,
    currentDifficulty: firstQuestion.difficulty || 'medium',
    currentQuestionId: firstQuestion.id,
    currentQuestionTopic: firstQuestion.topic || 'General',
    currentQuestionText: firstQuestion.question,
    currentQuestionCodeSnippet: firstQuestion.codeSnippet || null,
    currentQuestionShuffledOptions: shuffledFirst.shuffledOptions,
    currentQuestionShuffledCorrectIndex: shuffledFirst.newCorrectIndex,
    currentQuestionServedAt: Date.now(),
    timeLimitSeconds: 45,
    strikes: [],
    strikeCount: 0,
    isLocked: false,
    lockReason: null,
    fullscreenExits: 0,
    clipboardViolations: 0,
    tabSwitchCount: 0,
    velocityAnomalyCount: 0,
    anomalies: [],
    answeredQuestions: [], // history of { id, difficulty, selectedIndex, isCorrect, topic, timeTaken }
    score: 0,
    hardCorrectCount: 0,
    identifiedGaps: new Set(),
    startedAt: Date.now()
  };

  activeSessions.set(sessionKey, sessionData);

  // Return first question payload (100% sanitized without correctIndex or answer leak)
  return {
    sessionId: sessionKey,
    skill: normalizedSkill,
    displayName: sessionData.displayName,
    selfRatedProficiency: selfRated,
    selfRated,
    provider: providerUsed,
    isAIGenerated: Boolean(questions),
    questionIndex: 1,
    currentStep: 1,
    totalQuestions: 5,
    totalSteps: 5,
    currentDifficulty: firstQuestion.difficulty || 'medium',
    difficulty: firstQuestion.difficulty || 'medium',
    timeLimitSeconds: 45,
    strikeCount: 0,
    strikesRemaining: 3,
    isLocked: false,
    question: {
      id: firstQuestion.id,
      topic: firstQuestion.topic,
      text: firstQuestion.question,
      prompt: firstQuestion.question,
      codeSnippet: firstQuestion.codeSnippet || null,
      options: shuffledFirst.shuffledOptions
    }
  };
}

/**
 * Submit an answer, evaluate anti-cheating telemetry (velocity & tab switches),
 * and return immediate pedagogical explanation + next scrambled question or final verdict
 */
async function submitAnswer(userId, skill, questionId, selectedIndex, telemetry = {}) {
  const normalizedSkill = normalizeSkillKey(skill);
  const sessionKey = `${userId}_${normalizedSkill}`;
  const session = activeSessions.get(sessionKey);

  if (!session) {
    throw new Error('No active quiz session found. Please start the quiz again.');
  }

  // Anti-Cheating Lock Guard: Disallow submissions on locked sessions
  if (session.isLocked) {
    const lockedErr = new Error(`Quiz session has been locked due to proctoring violations: ${session.lockReason || 'REPEATED_PROCTORING_VIOLATIONS'}`);
    lockedErr.status = 403;
    lockedErr.code = 'SESSION_LOCKED';
    throw lockedErr;
  }

  // Locate question in dynamic questionPool or static bank
  let question = null;
  if (session.questionPool) {
    question = session.questionPool.find((q) => q.id === questionId);
  }
  if (!question) {
    question = getQuestionById(normalizedSkill, questionId);
  }
  if (!question && session.questionPool && session.questionPool.length > 0) {
    question = session.questionPool[session.currentStep - 1] || session.questionPool[0];
  }

  if (!question) {
    throw new Error('Question not found in quiz session');
  }

  const currentDiff = question.difficulty || session.currentDifficulty || 'medium';

  // 1. Authoritative check against server-shuffled correct index (Pillar 2)
  const authoritativeCorrectIndex = session.currentQuestionShuffledCorrectIndex !== undefined
    ? session.currentQuestionShuffledCorrectIndex
    : question.correctIndex;

  const isCorrect = Number(selectedIndex) === authoritativeCorrectIndex;

  // 2. High-Fidelity Proctoring Telemetry & Server-Enforced 45s Timer (Pillars 2 & 6)
  const clientTimeTaken = Number(telemetry.timeTakenSeconds) || 0;
  const serverDurationSeconds = session.currentQuestionServedAt
    ? (Date.now() - session.currentQuestionServedAt) / 1000
    : clientTimeTaken;
  const effectiveDuration = Math.max(clientTimeTaken, Math.round(serverDurationSeconds * 10) / 10);

  // Server-Enforced 45s Timer + 5s Network Grace Period
  const MAX_ALLOWED_SECONDS = (session.timeLimitSeconds || 45) + 5;
  const isLate = effectiveDuration > MAX_ALLOWED_SECONDS;

  // Velocity Anomaly Detection: Hard < 2.0s, Medium < 1.2s
  let isVelocityAnomaly = false;
  if (currentDiff === 'hard' && effectiveDuration > 0 && effectiveDuration < 2.0) {
    isVelocityAnomaly = true;
    session.velocityAnomalyCount = (session.velocityAnomalyCount || 0) + 1;
    session.anomalies.push({ type: 'velocity_hard', questionId, duration: effectiveDuration });
  } else if (currentDiff === 'medium' && effectiveDuration > 0 && effectiveDuration < 1.2) {
    isVelocityAnomaly = true;
    session.velocityAnomalyCount = (session.velocityAnomalyCount || 0) + 1;
    session.anomalies.push({ type: 'velocity_medium', questionId, duration: effectiveDuration });
  }

  // Tab-switch monitoring (Pillar 6)
  const clientTabSwitches = Number(telemetry.tabSwitches) || 0;
  if (clientTabSwitches > (session.tabSwitchCount || 0)) {
    session.tabSwitchCount = clientTabSwitches;
  }

  // Track scoring (submissions arriving past 45s limit receive 0 points)
  const isAwarded = isCorrect && !isLate;
  if (isAwarded) {
    session.score += 1;
    if (currentDiff === 'hard') {
      session.hardCorrectCount += 1;
    }
  } else {
    // Pedagogical gap tracking
    if (question.topic) {
      session.identifiedGaps.add(question.topic);
    }
  }

  session.answeredQuestions.push({
    id: question.id,
    difficulty: currentDiff,
    selectedIndex: Number(selectedIndex),
    correctIndex: authoritativeCorrectIndex,
    isCorrect: isAwarded,
    rawCorrect: isCorrect,
    isLate,
    topic: question.topic,
    explanation: question.explanation,
    timeTaken: effectiveDuration,
    isVelocityAnomaly
  });

  const isLastQuestion = session.currentStep >= session.totalSteps;

  if (isLastQuestion) {
    // Finalize quiz results and calculate integrity credentials
    const summary = await finalizeQuiz(userId, normalizedSkill, session);
    activeSessions.delete(sessionKey);

    return {
      isCorrect: isAwarded,
      isLate,
      correctAnswer: authoritativeCorrectIndex,
      explanation: isLate ? `${question.explanation} (Time limit of 45s expired — 0 points awarded)` : question.explanation,
      isFinished: true,
      isCompleted: true,
      currentScore: session.score,
      score: summary.score,
      selfRated: summary.selfRated,
      selfRatedProficiency: summary.selfRatedProficiency,
      quizSays: summary.quizSays,
      verifiedLevel: summary.verifiedLevel,
      verifiedProficiency: summary.verifiedProficiency,
      realityCheckMessage: summary.realityCheckMessage,
      summaryMessage: summary.summaryMessage,
      gaps: summary.gaps,
      identifiedGaps: summary.identifiedGaps,
      provider: summary.provider,
      isAIGenerated: summary.isAIGenerated,
      verificationTier: summary.verificationTier,
      verificationStatus: summary.verificationStatus,
      integrityScore: summary.integrityScore,
      tabSwitchCount: summary.tabSwitchCount,
      velocityAnomalyCount: summary.velocityAnomalyCount,
      nextRetakeAvailableAt: summary.nextRetakeAvailableAt,
      summary,
      result: summary
    };
  }

  // Calculate next adaptive difficulty
  let nextDiff = currentDiff;
  if (isAwarded) {
    if (currentDiff === 'easy') nextDiff = 'medium';
    else if (currentDiff === 'medium') nextDiff = 'hard';
    else if (currentDiff === 'hard') nextDiff = 'hard';
  } else {
    if (currentDiff === 'hard') nextDiff = 'medium';
    else if (currentDiff === 'medium') nextDiff = 'easy';
    else if (currentDiff === 'easy') nextDiff = 'easy';
  }

  session.currentStep += 1;
  session.currentDifficulty = nextDiff;

  const usedIds = session.answeredQuestions.map((q) => q.id);
  let nextQ = null;

  if (session.questionPool) {
    nextQ = session.questionPool.find((q) => !usedIds.includes(q.id) && q.difficulty === nextDiff) ||
            session.questionPool.find((q) => !usedIds.includes(q.id)) ||
            session.questionPool[session.currentStep - 1] ||
            session.questionPool[0];
  } else {
    nextQ = getQuestion(normalizedSkill, nextDiff, usedIds);
  }

  // Pillar 2: Server-authoritative Fisher-Yates scrambling of next question options
  const shuffledNext = shuffleOptions(nextQ.options, nextQ.correctIndex);

  session.currentQuestionId = nextQ.id;
  session.currentQuestionTopic = nextQ.topic || 'General';
  session.currentQuestionText = nextQ.question;
  session.currentQuestionCodeSnippet = nextQ.codeSnippet || null;
  session.currentQuestionShuffledOptions = shuffledNext.shuffledOptions;
  session.currentQuestionShuffledCorrectIndex = shuffledNext.newCorrectIndex;
  session.currentQuestionServedAt = Date.now();

  return {
    isCorrect: isAwarded,
    isLate,
    correctAnswer: authoritativeCorrectIndex,
    explanation: isLate ? `${question.explanation} (Time limit of 45s expired — 0 points awarded)` : question.explanation,
    isFinished: false,
    isCompleted: false,
    currentScore: session.score,
    nextStep: session.currentStep,
    totalSteps: session.totalSteps,
    nextDifficulty: nextDiff,
    timeLimitSeconds: session.timeLimitSeconds || 45,
    strikeCount: session.strikeCount || 0,
    strikesRemaining: Math.max(0, 3 - (session.strikeCount || 0)),
    isLocked: Boolean(session.isLocked),
    nextQuestion: {
      id: nextQ.id,
      topic: nextQ.topic,
      text: nextQ.question,
      prompt: nextQ.question,
      codeSnippet: nextQ.codeSnippet || null,
      difficulty: nextDiff,
      options: shuffledNext.shuffledOptions
    }
  };
}

/**
 * Finalize quiz, apply qualification rubric, compute integrity score & Skill Passport tier,
 * and persist credentials to user profile in MongoDB
 */
async function finalizeQuiz(userId, skill, session) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const totalAnswered = session.answeredQuestions.length;
  const score = session.score;
  const hardCorrect = session.hardCorrectCount;
  const gapsArray = Array.from(session.identifiedGaps);

  // Rubric for 5-question adaptive micro-checks:
  // Advanced: At least 2 Hard questions correct AND score >= 3 (or overall score >= 4)
  // Intermediate: Score >= 2 (or at least 1 Hard correct)
  // Beginner: Otherwise (score <= 1)
  let verifiedLevel = 'beginner';
  if ((hardCorrect >= 2 && score >= 3) || score >= 4) {
    verifiedLevel = 'advanced';
  } else if (score >= 2 || hardCorrect >= 1) {
    verifiedLevel = 'intermediate';
  } else {
    verifiedLevel = 'beginner';
  }

  // ── Pillar 6: High-Fidelity Proctoring Telemetry & Anomaly Calibration ─
  const tabSwitches = session.tabSwitchCount || 0;
  const velocityAnomalies = session.velocityAnomalyCount || 0;

  let integrityScore = 100;
  integrityScore -= tabSwitches * 15;
  integrityScore -= velocityAnomalies * 20;
  integrityScore = Math.max(10, Math.min(100, integrityScore));

  const isSuspicious = tabSwitches > 2 || velocityAnomalies >= 2;
  const verificationStatus = isSuspicious ? 'unconfirmed' : 'verified';

  // ── Pillar 7: Multi-Tier Skill Passport ───────────────────────
  // Tier 0: self_rated
  // Tier 1: quiz_verified
  // Tier 2: project_verified (GitHub repo AST scan)
  // Tier 3: interview_verified (Spoken AI interview)
  const normalizedSkill = normalizeSkillKey(skill);
  const existingSkillRecord = (user.skills || []).find(
    (s) => normalizeSkillKey(s.name) === normalizedSkill
  );

  const isAlreadyCodeVerified = Boolean(existingSkillRecord?.isCodeVerified);
  const verificationTier = isAlreadyCodeVerified ? 'project_verified' : 'quiz_verified';

  // ── Pillar 5: 24-Hour Retake Cooldown ────────────────────────
  const nextRetakeAvailableAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const skillIndex = (user.skills || []).findIndex(
    (s) => normalizeSkillKey(s.name) === normalizedSkill
  );

  const selfRated = session.selfRated || 'intermediate';

  if (skillIndex !== -1) {
    const existing = user.skills[skillIndex];
    existing.name = normalizedSkill;
    existing.selfRatedProficiency = existing.selfRatedProficiency || existing.proficiency || selfRated;
    // Update proficiency with verified level
    existing.proficiency = verifiedLevel;
    existing.verifiedProficiency = verifiedLevel;
    existing.isQuizVerified = true;
    existing.quizScore = score;
    existing.quizGaps = gapsArray;
    existing.quizVerifiedAt = new Date();
    // Anti-Cheating & Skill Passport fields:
    existing.verificationTier = verificationTier;
    existing.verificationStatus = verificationStatus;
    existing.integrityScore = integrityScore;
    existing.quizAttemptsCount = (existing.quizAttemptsCount || 0) + 1;
    existing.lastQuizAttemptAt = new Date();
    existing.nextRetakeAvailableAt = nextRetakeAvailableAt;
    existing.tabSwitchCount = tabSwitches;
    existing.velocityAnomalyCount = velocityAnomalies;
  } else {
    // If skill wasn't in list, append it
    user.skills.push({
      name: normalizedSkill,
      displayName: session.displayName || capitalize(normalizedSkill),
      proficiency: verifiedLevel,
      selfRatedProficiency: selfRated,
      verifiedProficiency: verifiedLevel,
      isQuizVerified: true,
      quizScore: score,
      quizGaps: gapsArray,
      quizVerifiedAt: new Date(),
      verificationTier,
      verificationStatus,
      integrityScore,
      quizAttemptsCount: 1,
      lastQuizAttemptAt: new Date(),
      nextRetakeAvailableAt,
      tabSwitchCount: tabSwitches,
      velocityAnomalyCount: velocityAnomalies
    });
  }

  // Prune any duplicate skill aliases from user.skills
  if (Array.isArray(user.skills) && user.skills.length > 1) {
    const seenMap = new Map();
    const cleaned = [];
    for (const sk of user.skills) {
      const cKey = normalizeSkillKey(sk.name);
      if (!seenMap.has(cKey)) {
        seenMap.set(cKey, sk);
        cleaned.push(sk);
      } else {
        const existing = seenMap.get(cKey);
        if (sk.isQuizVerified) existing.isQuizVerified = true;
        if (sk.isCodeVerified) existing.isCodeVerified = true;
        if (sk.verifiedProficiency) existing.verifiedProficiency = sk.verifiedProficiency;
        if (sk.verificationTier) existing.verificationTier = sk.verificationTier;
        if (sk.verificationStatus) existing.verificationStatus = sk.verificationStatus;
        if (sk.integrityScore) existing.integrityScore = sk.integrityScore;
        if (sk.nextRetakeAvailableAt) existing.nextRetakeAvailableAt = sk.nextRetakeAvailableAt;
      }
    }
    user.skills = cleaned;
  }

  // Mark account as having completed skill verification
  user.hasCompletedSkillVerification = true;

  await user.save();

  // Determine comparison status
  const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
  const selfOrder = levelOrder[selfRated.toLowerCase()] || 2;
  const verifiedOrder = levelOrder[verifiedLevel] || 2;

  let comparisonStatus = 'matched';
  if (verifiedOrder < selfOrder) {
    comparisonStatus = 'downgraded';
  } else if (verifiedOrder > selfOrder) {
    comparisonStatus = 'upgraded';
  }

  // Construct educational feedback message (Pillar 5)
  let summaryMessage = `You claimed ${capitalize(selfRated)}, and the quiz confirmed ${capitalize(verifiedLevel)}.`;
  if (comparisonStatus === 'downgraded') {
    const gapList = gapsArray.slice(0, 2).join(' and ');
    summaryMessage = `You claimed ${capitalize(selfRated)}, but the quiz indicates ${capitalize(verifiedLevel)}. We recommend focusing on ${gapList || 'core concepts'} in your upcoming roadmap.`;
  } else if (comparisonStatus === 'upgraded') {
    summaryMessage = `Great job! You claimed ${capitalize(selfRated)}, but tested at an ${capitalize(verifiedLevel)} level!`;
  }

  if (session.isLocked || (session.strikeCount && session.strikeCount >= 3)) {
    verifiedLevel = 'beginner';
    integrityScore = 0;
    verificationStatus = 'flagged';
    comparisonStatus = 'locked';
    summaryMessage = 'Assessment was terminated due to repeated proctoring violations (3 strikes accumulated). Credential status flagged with 0% integrity score.';
  } else if (isSuspicious) {
    summaryMessage += ` (⚠️ Proctor Notice: Telemetry recorded ${tabSwitches} tab switches and velocity anomalies. Status marked as 'Unconfirmed' pending Tier 2 GitHub repository validation).`;
  }

  return {
    skill,
    displayName: session.displayName || capitalize(skill),
    score,
    total: totalAnswered,
    totalQuestions: totalAnswered,
    hardCorrect,
    selfRated: selfRated.toLowerCase(),
    selfRatedProficiency: selfRated.toLowerCase(),
    quizSays: verifiedLevel,
    verifiedLevel: verifiedLevel,
    verifiedProficiency: verifiedLevel,
    comparisonStatus,
    identifiedGaps: gapsArray,
    gaps: gapsArray,
    summaryMessage,
    realityCheckMessage: summaryMessage,
    isQuizVerified: true,
    verificationTier,
    verificationStatus,
    integrityScore,
    tabSwitchCount: tabSwitches,
    velocityAnomalyCount: velocityAnomalies,
    nextRetakeAvailableAt,
    verifiedAt: new Date(),
    provider: session.provider || 'curated_bank',
    isAIGenerated: Boolean(session.isAIGenerated),
    user
  };
}

/**
 * Record a proctoring violation (fullscreen exit, tab switch, clipboard, devtools)
 * Applies the 3-strike policy with authoritative server-side lockout on Strike 3.
 */
function recordViolation(userId, skill, violationType, details = {}) {
  let session = null;
  if (skill) {
    const norm = normalizeSkillKey(skill);
    session = activeSessions.get(`${userId}_${norm}`);
  }
  if (!session) {
    for (const [key, s] of activeSessions.entries()) {
      if (key.startsWith(`${userId}_`)) {
        session = s;
        break;
      }
    }
  }

  if (!session) {
    const notFoundErr = new Error('No active quiz session found');
    notFoundErr.status = 404;
    throw notFoundErr;
  }

  if (session.isLocked) {
    return {
      strikeCount: session.strikeCount,
      strikesRemaining: 0,
      isLocked: true,
      lockReason: session.lockReason,
      strikes: session.strikes
    };
  }

  const timestamp = Date.now();
  const strikeRecord = {
    type: violationType,
    details,
    timestamp,
    questionStep: session.currentStep
  };

  session.strikes = session.strikes || [];
  session.strikes.push(strikeRecord);
  session.strikeCount = (session.strikeCount || 0) + 1;

  if (violationType === 'fullscreen_exit') {
    session.fullscreenExits = (session.fullscreenExits || 0) + 1;
  } else if (['copy', 'paste', 'cut', 'contextmenu', 'clipboard', 'clipboard_shortcut', 'devtools_attempt'].includes(violationType)) {
    session.clipboardViolations = (session.clipboardViolations || 0) + 1;
  } else if (['tab_switch', 'window_blur', 'visibilitychange'].includes(violationType)) {
    session.tabSwitchCount = (session.tabSwitchCount || 0) + 1;
  }

  if (session.strikeCount >= 3) {
    session.isLocked = true;
    session.lockReason = 'REPEATED_PROCTORING_VIOLATIONS';
    disqualifyUser(userId, session.skill, { strikes: session.strikeCount, reason: session.lockReason }).catch((err) => {
      console.error('[quizService.recordViolation] Background disqualify error:', err.message);
    });
  }

  return {
    strikeCount: session.strikeCount,
    strikesRemaining: Math.max(0, 3 - session.strikeCount),
    isLocked: session.isLocked,
    lockReason: session.lockReason,
    strikes: session.strikes
  };
}

/**
 * Retrieve active quiz session state for recovery on page reload
 */
function getActiveSession(userId, skill) {
  let session = null;
  if (skill) {
    const norm = normalizeSkillKey(skill);
    session = activeSessions.get(`${userId}_${norm}`);
  }
  if (!session) {
    for (const [key, s] of activeSessions.entries()) {
      if (key.startsWith(`${userId}_`)) {
        session = s;
        break;
      }
    }
  }
  if (!session) return null;

  const elapsedSeconds = session.currentQuestionServedAt
    ? Math.round((Date.now() - session.currentQuestionServedAt) / 1000)
    : 0;
  const remainingSeconds = Math.max(0, (session.timeLimitSeconds || 45) - elapsedSeconds);

  return {
    sessionId: `${session.userId}_${session.skill}`,
    skill: session.skill,
    displayName: session.displayName,
    selfRated: session.selfRated,
    currentStep: session.currentStep,
    questionIndex: session.currentStep,
    totalSteps: session.totalSteps,
    totalQuestions: session.totalSteps,
    currentDifficulty: session.currentDifficulty,
    score: session.score,
    timeLimitSeconds: session.timeLimitSeconds || 45,
    elapsedSeconds,
    remainingSeconds,
    strikeCount: session.strikeCount || 0,
    strikesRemaining: Math.max(0, 3 - (session.strikeCount || 0)),
    isLocked: Boolean(session.isLocked),
    lockReason: session.lockReason || null,
    question: {
      id: session.currentQuestionId,
      topic: session.currentQuestionTopic || 'General',
      text: session.currentQuestionText,
      prompt: session.currentQuestionText,
      codeSnippet: session.currentQuestionCodeSnippet || null,
      options: session.currentQuestionShuffledOptions || []
    }
  };
}

function getActiveSessionForUser(userId, skill) {
  if (skill) {
    const norm = normalizeSkillKey(skill);
    return activeSessions.get(`${userId}_${norm}`) || null;
  }
  for (const [key, session] of activeSessions.entries()) {
    if (key.startsWith(`${userId}_`)) {
      return session;
    }
  }
  return null;
}

/**
 * Authoritatively disqualifies candidate for cheating / proctoring violations.
 * Sets score = 0, integrityScore = 0, status = 'flagged_cheating',
 * nextRetakeAvailableAt = 24 hours from now, and removes any active session.
 */
async function disqualifyUser(userId, skill, options = {}) {
  const normalizedSkill = normalizeSkillKey(skill);
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const nextRetakeAvailableAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const strikes = options.strikes || 3;
  const reason = options.reason || 'REPEATED_PROCTORING_VIOLATIONS';

  // Destroy active session
  activeSessions.delete(`${userId}_${normalizedSkill}`);
  for (const [key, session] of activeSessions.entries()) {
    if (key.startsWith(`${userId}_`)) {
      activeSessions.delete(key);
    }
  }

  const skillIndex = (user.skills || []).findIndex(
    (s) => normalizeSkillKey(s.name) === normalizedSkill
  );

  if (skillIndex !== -1) {
    const existing = user.skills[skillIndex];
    existing.isQuizVerified = false;
    existing.quizScore = 0;
    existing.integrityScore = 0;
    existing.verificationStatus = 'flagged_cheating';
    existing.verificationTier = 'self_rated';
    existing.tabSwitchCount = strikes;
    existing.nextRetakeAvailableAt = nextRetakeAvailableAt;
    existing.lastQuizAttemptAt = new Date();
  } else {
    user.skills.push({
      name: normalizedSkill,
      displayName: options.displayName || capitalize(normalizedSkill),
      proficiency: 'beginner',
      selfRatedProficiency: 'beginner',
      isQuizVerified: false,
      quizScore: 0,
      integrityScore: 0,
      verificationStatus: 'flagged_cheating',
      verificationTier: 'self_rated',
      tabSwitchCount: strikes,
      nextRetakeAvailableAt: nextRetakeAvailableAt,
      lastQuizAttemptAt: new Date()
    });
  }

  await user.save();

  return {
    disqualified: true,
    skill: normalizedSkill,
    strikes,
    reason,
    quizScore: 0,
    integrityScore: 0,
    verificationStatus: 'flagged_cheating',
    retryAfterHours: 24,
    nextRetakeAvailableAt
  };
}

module.exports = {
  shuffleOptions,
  startQuizSession,
  submitAnswer,
  finalizeQuiz,
  recordViolation,
  disqualifyUser,
  getActiveSession,
  getActiveSessionForUser
};

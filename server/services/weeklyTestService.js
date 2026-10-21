/**
 * services/weeklyTestService.js — Server-Authoritative Weekly Milestone Test Engine
 *
 * Disheera · Enterprise Backend Service
 *
 * Implements Pillar 4 of the Shared Foundation:
 *  - 30-Minute Server-Locked Countdown (immune to page reloads)
 *  - Progressive Answer Auto-Save
 *  - 70% Pass Threshold for Next Week Advancement
 *  - Target Skill Evidence & Attempt Recording
 *  - Completed Path Graduation upon Final Week Pass
 */

const Attempt = require('../models/Attempt');
const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');
const User = require('../models/User');
const { getWeeklyTestQuestions, WEEKLY_TEST_QUESTIONS } = require('../data/weeklyTestQuestions');

/**
 * Starts a 30-minute server-authoritative weekly test attempt.
 *
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} roadmapId
 * @param {number} weekNumber
 * @returns {Promise<Object>}
 */
async function startWeeklyTest(userId, roadmapId, weekNumber, options = {}) {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, user: userId });
  if (!roadmap) {
    const err = new Error('Roadmap not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }

  const wNum = Number(weekNumber);
  if (isNaN(wNum) || wNum < 1 || wNum > roadmap.durationWeeks) {
    const err = new Error(`Invalid week number: ${weekNumber}`);
    err.statusCode = 400;
    throw err;
  }

  // Ensure weekProgress array is initialized
  if (!roadmap.weekProgress || roadmap.weekProgress.length === 0) {
    roadmap.weekProgress = [];
    for (let w = 1; w <= roadmap.durationWeeks; w++) {
      roadmap.weekProgress.push({
        weekNumber: w,
        title: `Week ${w} Milestone`,
        status: w === 1 ? 'in_progress' : 'locked',
        attemptsCount: 0,
        passedAt: null,
        testScore: 0,
        testPercent: 0,
      });
    }
    await roadmap.save();
  }

  // 0. Verify Cooldown Lockout (Cheating violations enforce unbreakable 24h lockout)
  const currentWeekProgress = roadmap.weekProgress.find((wp) => wp.weekNumber === wNum);
  if (currentWeekProgress && currentWeekProgress.cooldownUntil) {
    const cooldownTime = new Date(currentWeekProgress.cooldownUntil).getTime();
    if (Date.now() < cooldownTime) {
      const remainingMs = cooldownTime - Date.now();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
      const err = new Error(`Cheating Disqualification Lockout: Week ${wNum} retake is locked for 24 hours due to proctoring violation. Available in ~${remainingHours} hour${remainingHours > 1 ? 's' : ''} (${remainingMinutes} mins).`);
      err.statusCode = 403;
      err.code = 'COOLDOWN_ACTIVE';
      err.cooldownUntil = currentWeekProgress.cooldownUntil;
      err.remainingSeconds = Math.ceil(remainingMs / 1000);
      throw err;
    }
  }

  // 1. Verify Prerequisite (Week N - 1 must be passed; bypassed for admin)
  const testUser = await User.findById(userId);
  const isAdmin = Boolean(testUser?.role === 'admin' || testUser?.isAdmin);

  if (wNum > 1 && !isAdmin) {
    const prevWeek = roadmap.weekProgress.find((wp) => wp.weekNumber === wNum - 1);
    if (!prevWeek || prevWeek.status !== 'passed') {
      const err = new Error(`Week ${wNum - 1} milestone test must be passed (≥70%) before taking Week ${wNum} test.`);
      err.statusCode = 403;
      err.code = 'PREREQUISITE_LOCKED';
      throw err;
    }
  }

  const forceFresh = options.forceFresh === true || options.fresh === true;

  // 2. Check if there's an active in-progress attempt that hasn't expired
  const activeAttempt = await Attempt.findOne({
    user: userId,
    roadmap: roadmapId,
    roadmapWeek: wNum,
    status: 'in_progress',
  }).sort({ createdAt: -1 });

  const now = Date.now();

  if (activeAttempt) {
    const deadlineTime = new Date(activeAttempt.deadline).getTime();
    const careerTitleLower = (roadmap.careerSnapshot?.title || '').toLowerCase();
    
    // Auto-detect legacy mismatched questions (e.g. game dev with react/finance questions)
    const isLegacyMismatched = activeAttempt.questionsAsked.some((q) => {
      const qTop = (q.topic || '').toLowerCase();
      if ((careerTitleLower.includes('game') || careerTitleLower.includes('unity')) && (qTop.includes('react') || qTop.includes('finance') || qTop.includes('marketing'))) {
        return true;
      }
      return false;
    });

    if (now >= deadlineTime) {
      // Past deadline: auto-submit it before creating a new one
      await submitWeeklyTest(userId, activeAttempt._id, false);
    } else if (forceFresh || isLegacyMismatched) {
      // User explicitly requested fresh questions or attempt had mismatched legacy questions
      activeAttempt.status = 'abandoned';
      await activeAttempt.save();
    } else {
      // Resume existing in-progress test
      const remainingSeconds = Math.max(0, Math.floor((deadlineTime - now) / 1000));
      return {
        resumed: true,
        attemptId: activeAttempt._id,
        roadmapId: roadmap._id,
        weekNumber: wNum,
        durationMinutes: 30,
        startTime: activeAttempt.startTime,
        deadline: activeAttempt.deadline,
        remainingSeconds,
        questions: activeAttempt.questionsAsked.map((q) => {
          const original = WEEKLY_TEST_QUESTIONS.find((item) => item.id === q.questionId);
          return {
            questionId: q.questionId,
            prompt: q.prompt,
            question: q.prompt,
            topic: q.topic,
            topicTag: q.topic,
            options: (q.options && q.options.length > 0) ? q.options : (original ? original.options : []),
            selectedIndex: q.selectedIndex,
          };
        }),
      };
    }
  }

  // 3. Find topics from the week's tasks to pull relevant questions
  const weekTasks = await RoadmapTask.find({
    roadmap: roadmapId,
    weekNumber: wNum,
  });

  let topics = Array.from(
    new Set(weekTasks.map((t) => (t.skillName || '').toLowerCase().trim()).filter(Boolean))
  );

  // Fallback if task skills are not explicitly specified
  if (topics.length === 0) {
    const taskText = weekTasks.map((t) => `${t.title || ''} ${t.description || ''}`).join(' ').toLowerCase();
    if (taskText.includes('html')) topics.push('html');
    if (taskText.includes('css')) topics.push('css');
    if (taskText.includes('javascript') || taskText.includes('js')) topics.push('javascript');
    if (taskText.includes('react')) topics.push('react');
    if (taskText.includes('node')) topics.push('node.js');
    if (taskText.includes('unity')) topics.push('unity');
    if (taskText.includes('c#')) topics.push('csharp');
    if (taskText.includes('python')) topics.push('python');
    if (taskText.includes('sql')) topics.push('sql');
  }

  if (topics.length === 0 && roadmap.careerSnapshot?.title) {
    topics.push(roadmap.careerSnapshot.title.toLowerCase());
  }

  // 4. Gather previous attempt question IDs to provide fresh questions for retakes
  const previousAttempts = await Attempt.find({
    user: userId,
    roadmap: roadmapId,
    roadmapWeek: wNum,
  });

  const excludedIds = [];
  previousAttempts.forEach((att) => {
    (att.questionsAsked || []).forEach((q) => {
      if (q.questionId) excludedIds.push(q.questionId);
    });
  });

  // 5. Select 10 questions with strict domain-scoping
  const selectedQuestions = getWeeklyTestQuestions({
    topics,
    careerTitle: roadmap.careerSnapshot?.title || '',
    careerSlug: roadmap.careerSnapshot?.slug || '',
    count: 10,
    excludeIds: excludedIds,
  });

  // 6. Set 30-minute server clock deadline
  const startTime = new Date();
  const deadline = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes

  // Primary skill tag and topics covered for evidence recording
  const questionTopics = Array.from(new Set(selectedQuestions.map((q) => (q.topic || '').toLowerCase().trim()).filter(Boolean)));
  const combinedTopics = Array.from(new Set([...topics, ...questionTopics]));
  const primarySkill = combinedTopics[0] || (roadmap.careerSnapshot?.title || 'Technical');

  const attempt = await Attempt.create({
    user: userId,
    type: 'weekly_test',
    skill: primarySkill,
    roadmap: roadmapId,
    roadmapWeek: wNum,
    topicTags: combinedTopics,
    questionsAsked: selectedQuestions.map((q) => ({
      questionId: q.id,
      prompt: q.prompt,
      topic: q.topic,
      difficulty: q.difficulty || 'intermediate',
      options: q.options || [],
      selectedIndex: null,
      correctIndex: q.correctIndex,
      isCorrect: false,
      explanation: q.explanation || '',
    })),
    score: 0,
    total: selectedQuestions.length,
    percent: 0,
    passed: false,
    startTime,
    deadline,
    submitTime: null,
    missedTopics: [],
    status: 'in_progress',
  });

  // Update week status to awaiting_test if currently in_progress
  const weekEntry = roadmap.weekProgress.find((wp) => wp.weekNumber === wNum);
  if (weekEntry && weekEntry.status === 'in_progress') {
    weekEntry.status = 'awaiting_test';
    await roadmap.save();
  }

  return {
    resumed: false,
    attemptId: attempt._id,
    roadmapId: roadmap._id,
    weekNumber: wNum,
    durationMinutes: 30,
    startTime: attempt.startTime,
    deadline: attempt.deadline,
    remainingSeconds: 30 * 60,
    questions: selectedQuestions.map((q) => ({
      questionId: q.id,
      prompt: q.prompt,
      question: q.prompt,
      topic: q.topic,
      topicTag: q.topic,
      options: q.options,
      selectedIndex: null,
    })),
  };
}

/**
 * Saves a student's answer progressively during an ongoing test.
 *
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} attemptId
 * @param {string} questionId
 * @param {number} selectedIndex
 * @returns {Promise<Object>}
 */
async function saveWeeklyTestAnswer(userId, attemptId, questionId, selectedIndex) {
  const attempt = await Attempt.findOne({
    _id: attemptId,
    user: userId,
  });

  if (!attempt) {
    const err = new Error('Attempt not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }

  if (attempt.status !== 'in_progress') {
    const err = new Error('Test has already been submitted or completed');
    err.statusCode = 400;
    throw err;
  }

  // Grace period of 60 seconds past deadline for network latency
  const deadlineMs = new Date(attempt.deadline).getTime() + 60 * 1000;
  if (Date.now() > deadlineMs) {
    // Deadline elapsed: finalize test automatically
    return submitWeeklyTest(userId, attemptId, false);
  }

  const targetQ = attempt.questionsAsked.find((q) => q.questionId === questionId);
  if (targetQ) {
    targetQ.selectedIndex = selectedIndex;
    targetQ.isCorrect = selectedIndex === targetQ.correctIndex;
    await attempt.save();
  }

  return {
    success: true,
    saved: true,
    questionId,
    selectedIndex,
  };
}

/**
 * Grades and finalizes a weekly test attempt.
 * Evaluates the 70% pass rubric and unlocks subsequent roadmap weeks.
 *
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} attemptId
 * @param {boolean} [manual=true]
 * @returns {Promise<Object>}
 */
async function submitWeeklyTest(userId, attemptId, manual = true, submittedAnswers = []) {
  const attempt = await Attempt.findOne({
    _id: attemptId,
    user: userId,
  });

  if (!attempt) {
    const err = new Error('Test attempt not found');
    err.statusCode = 404;
    throw err;
  }

  // Apply any answers passed directly in the submission payload
  if (Array.isArray(submittedAnswers) && submittedAnswers.length > 0) {
    submittedAnswers.forEach((ans) => {
      const targetQ = attempt.questionsAsked.find((q) => q.questionId === ans.questionId);
      if (targetQ) {
        const choice = ans.selectedIndex !== undefined ? ans.selectedIndex : ans.selectedOption;
        if (choice !== undefined && choice !== null) {
          targetQ.selectedIndex = Number(choice);
          targetQ.isCorrect = targetQ.selectedIndex === targetQ.correctIndex;
        }
      }
    });
  }

  // Return already graded attempt if previously completed
  if (attempt.status === 'completed' || attempt.status === 'timed_out') {
    return {
      attemptId: attempt._id,
      score: attempt.score,
      total: attempt.total,
      percent: attempt.percent,
      passed: attempt.passed,
      missedTopics: attempt.missedTopics,
      status: attempt.status,
    };
  }

  let correctCount = 0;
  const missedTopicsSet = new Set();

  attempt.questionsAsked.forEach((q) => {
    const isCorrect = q.selectedIndex !== null && q.selectedIndex === q.correctIndex;
    q.isCorrect = isCorrect;
    if (isCorrect) {
      correctCount++;
    } else {
      if (q.topic) missedTopicsSet.add(q.topic);
    }
  });

  const total = attempt.questionsAsked.length || 10;
  const percent = Math.round((correctCount / total) * 100);
  const passed = percent >= 70;
  const missedTopics = Array.from(missedTopicsSet);

  attempt.score = correctCount;
  attempt.total = total;
  attempt.percent = percent;
  attempt.passed = passed;
  attempt.missedTopics = missedTopics;
  attempt.submitTime = new Date();
  attempt.status = manual ? 'completed' : 'timed_out';
  await attempt.save();

  // Update Roadmap Progress
  const roadmap = await Roadmap.findById(attempt.roadmap);
  let nextWeekUnlocked = false;
  let roadmapGraduated = false;

  if (roadmap) {
    if (!roadmap.weekProgress || roadmap.weekProgress.length === 0) {
      roadmap.weekProgress = [];
      for (let w = 1; w <= roadmap.durationWeeks; w++) {
        roadmap.weekProgress.push({
          weekNumber: w,
          title: `Week ${w} Milestone`,
          status: w === 1 ? 'in_progress' : 'locked',
          attemptsCount: 0,
          passedAt: null,
          testScore: 0,
          testPercent: 0,
        });
      }
    }

    const currentWp = roadmap.weekProgress.find((wp) => wp.weekNumber === attempt.roadmapWeek);
    if (currentWp) {
      currentWp.attemptsCount = (currentWp.attemptsCount || 0) + 1;
      currentWp.testScore = correctCount;
      currentWp.testPercent = percent;

      if (passed) {
        currentWp.status = 'passed';
        currentWp.passedAt = new Date();

        // Advance to next week if available
        const nextWp = roadmap.weekProgress.find((wp) => wp.weekNumber === attempt.roadmapWeek + 1);
        if (nextWp) {
          nextWp.status = 'in_progress';
          nextWeekUnlocked = true;
        }

        // Check if all weeks are passed for roadmap graduation
        const allPassed = roadmap.weekProgress.every((wp) => wp.status === 'passed');
        if (allPassed) {
          roadmap.status = 'completed';
          roadmap.completedAt = new Date();
          roadmap.progressPercentage = 100;
          roadmap.completedTasks = roadmap.totalTasks;
          roadmapGraduated = true;
          await RoadmapTask.updateMany(
            { roadmap: roadmap._id },
            { $set: { completed: true, completedAt: new Date() } }
          );
        }
      } else {
        // Did not pass: keep as awaiting_test for retake
        currentWp.status = 'awaiting_test';
      }
    }
    await roadmap.save();
  }

  // Update User skills evidence & completedPaths on graduation
  const user = await User.findById(userId);
  if (user) {
    // If passed, elevate skill verification
    if (passed) {
      const topicsCovered = Array.isArray(attempt.topicTags) && attempt.topicTags.length > 0
        ? attempt.topicTags
        : [attempt.skill];

      const now = new Date();
      const refreshByDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
      user.skills = user.skills || [];
      let elevatedSkill = null;

      topicsCovered.forEach((top) => {
        const topNorm = (top || '').toLowerCase().trim();
        if (!topNorm) return;

        let userSkill = user.skills.find(
          (s) => (s.name || '').toLowerCase().trim() === topNorm
        );

        if (!userSkill) {
          userSkill = {
            name: topNorm,
            displayName: top.toUpperCase(),
            proficiency: percent >= 90 ? 'advanced' : 'intermediate',
          };
          user.skills.push(userSkill);
          userSkill = user.skills[user.skills.length - 1];
        }

        userSkill.howVerified = 'weekly_test';
        userSkill.latestResult = `${correctCount} of ${total} (${percent}%)`;
        userSkill.refreshByDate = refreshByDate;
        userSkill.isQuizVerified = true;
        userSkill.quizVerifiedAt = now;
        userSkill.quizScore = correctCount;
        userSkill.verificationStatus = 'verified';
        userSkill.verificationTier = 'quiz_verified';
        if (percent >= 90) {
          userSkill.verifiedProficiency = 'advanced';
        } else if (!userSkill.verifiedProficiency || userSkill.verifiedProficiency === 'beginner') {
          userSkill.verifiedProficiency = 'intermediate';
        }
        if (!elevatedSkill) {
          elevatedSkill = userSkill;
        }
      });

      // If roadmap was completed, append to user.completedPaths with unique verifiable credential
      if (roadmapGraduated && roadmap) {
        user.completedPaths = user.completedPaths || [];
        const alreadyRecorded = user.completedPaths.some(
          (cp) => cp.roadmap?.toString() === roadmap._id.toString()
        );

        if (!alreadyRecorded) {
          const title = roadmap.careerSnapshot?.title || 'Graduated Specialist';
          const slug = roadmap.careerSnapshot?.slug || 'career-path';
          const credentialId = `CP-CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const verificationCode = `V-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

          user.completedPaths.push({
            roadmap: roadmap._id,
            role: title,
            careerTitle: title,
            slug,
            credentialId,
            verificationCode,
            completionDate: new Date(),
            skillsGained: Array.from(new Set(attempt.topicTags || [attempt.skill])),
          });
        }
      }

      await user.save();
    }
  }

  const primaryTopic = (attempt.topicTags && attempt.topicTags[0]) || attempt.skill || 'technical';
  const elevatedResult = (user?.skills || []).find((s) => (s.name || '').toLowerCase() === primaryTopic.toLowerCase()) || (user?.skills && user.skills[0]);

  return {
    attemptId: attempt._id,
    score: correctCount,
    total,
    percent,
    passed,
    missedTopics,
    nextWeekUnlocked,
    roadmapGraduated,
    skillUpdated: elevatedResult ? { name: elevatedResult.name, verified: true } : null,
    status: attempt.status,
    explanationBreakdown: attempt.questionsAsked.map((q) => {
      const orig = WEEKLY_TEST_QUESTIONS.find((item) => item.id === q.questionId);
      return {
        questionId: q.questionId,
        prompt: q.prompt,
        selectedIndex: q.selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect: q.isCorrect,
        explanation: orig ? orig.explanation : '',
      };
    }),
  };
}

/**
 * Returns current attempt status and timer countdown details.
 *
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} attemptId
 * @returns {Promise<Object>}
 */
async function getWeeklyTestStatus(userId, attemptId) {
  const attempt = await Attempt.findOne({
    _id: attemptId,
    user: userId,
  }).lean();

  if (!attempt) {
    const err = new Error('Attempt not found');
    err.statusCode = 404;
    throw err;
  }

  const now = Date.now();
  const deadlineTime = new Date(attempt.deadline).getTime();
  const remainingSeconds = Math.max(0, Math.floor((deadlineTime - now) / 1000));

  return {
    attemptId: attempt._id,
    roadmapId: attempt.roadmap,
    weekNumber: attempt.roadmapWeek,
    status: attempt.status,
    startTime: attempt.startTime,
    deadline: attempt.deadline,
    remainingSeconds,
    score: attempt.score,
    total: attempt.total,
    percent: attempt.percent,
    passed: attempt.passed,
    questions: attempt.questionsAsked.map((q) => {
      const orig = WEEKLY_TEST_QUESTIONS.find((item) => item.id === q.questionId);
      return {
        questionId: q.questionId,
        prompt: q.prompt,
        topic: q.topic,
        options: orig ? orig.options : [],
        selectedIndex: q.selectedIndex,
      };
    }),
  };
}

/**
 * Records an anti-cheating violation during weekly milestone test session.
 * Applies server-authoritative timer deductions (-120s on Strike 1, -180s on Strike 2).
 *
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} attemptId
 * @param {string} violationType
 * @param {number} penaltySeconds
 * @param {string|Object} details
 * @returns {Promise<Object>}
 */
async function recordWeeklyTestViolation(userId, attemptId, violationType = 'focus_lost', penaltySeconds = 120, details = '') {
  const attempt = await Attempt.findOne({
    _id: attemptId,
    user: userId,
  });

  if (!attempt) {
    const err = new Error('Test attempt not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }

  if (attempt.status !== 'in_progress') {
    return {
      success: false,
      message: 'Attempt is no longer in progress',
      status: attempt.status,
    };
  }

  const pSec = Number(penaltySeconds) || 120;
  attempt.strikesCount = (attempt.strikesCount || 0) + 1;

  attempt.violationLog.push({
    violationType,
    penaltySeconds: pSec,
    timestamp: new Date(),
    details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
  });

  // Deduct penalty from server-authoritative deadline
  const currentDeadline = new Date(attempt.deadline).getTime();
  const newDeadline = new Date(currentDeadline - pSec * 1000);
  attempt.deadline = newDeadline;

  await attempt.save();

  const remainingSeconds = Math.max(0, Math.floor((newDeadline.getTime() - Date.now()) / 1000));

  return {
    success: true,
    attemptId: attempt._id,
    strikesCount: attempt.strikesCount,
    penaltySeconds: pSec,
    deadline: attempt.deadline,
    remainingSeconds,
  };
}

/**
 * Disqualifies a weekly milestone test for cheating (3 strikes).
 * Sets score to 0%, marks attempt as disqualified_cheating, and locks week with 24h cooldown.
 *
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} attemptId
 * @param {string} reason
 * @returns {Promise<Object>}
 */
async function disqualifyWeeklyTest(userId, attemptId, reason = 'Repeated proctoring violations (3 strikes)') {
  const attempt = await Attempt.findOne({
    _id: attemptId,
    user: userId,
  });

  if (!attempt) {
    const err = new Error('Test attempt not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }

  const now = new Date();
  const cooldownUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  attempt.status = 'disqualified_cheating';
  attempt.score = 0;
  attempt.percent = 0;
  attempt.passed = false;
  attempt.submitTime = now;
  attempt.strikesCount = 3;

  attempt.violationLog.push({
    violationType: 'disqualification',
    penaltySeconds: 0,
    timestamp: now,
    details: reason || 'Disqualified: 3 anti-cheating strikes recorded',
  });

  await attempt.save();

  // Lock the roadmap week with 24-hour cooldown
  let weekNumber = attempt.roadmapWeek;
  if (attempt.roadmap) {
    const roadmap = await Roadmap.findOne({ _id: attempt.roadmap, user: userId });
    if (roadmap && roadmap.weekProgress) {
      const wp = roadmap.weekProgress.find((w) => w.weekNumber === attempt.roadmapWeek);
      if (wp) {
        wp.status = 'awaiting_test'; // Ensure it cannot pass
        wp.testScore = 0;
        wp.testPercent = 0;
        wp.cooldownUntil = cooldownUntil;
        wp.lastDisqualifiedAt = now;
        wp.disqualifiedReason = reason || 'Disqualified: 3 anti-cheating strikes recorded';
        await roadmap.save();
      }
    }
  }

  return {
    success: true,
    disqualified: true,
    status: 'disqualified_cheating',
    score: 0,
    percent: 0,
    passed: false,
    weekNumber,
    cooldownUntil,
    cooldownHours: 24,
    reason: reason || 'Accumulated 3 anti-cheating strikes',
  };
}

module.exports = {
  startWeeklyTest,
  saveWeeklyTestAnswer,
  submitWeeklyTest,
  getWeeklyTestStatus,
  recordWeeklyTestViolation,
  disqualifyWeeklyTest,
};

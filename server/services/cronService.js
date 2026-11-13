/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/cronService.js — Background Worker & Automated Maintenance Routines
 *
 * Runs only on persistent Node.js instances (Render / Local Development).
 * Completely bypassed in serverless runtime (Vercel) to respect execution boundaries.
 *
 * Responsibilities:
 * 1. 180-Day Skill Currency Ledger validation
 * 2. YouTube Data API v3 cache health check
 * 3. Database connection keep-alive & housekeeping
 */

const Attempt = require('../models/Attempt');
const YoutubeCache = require('../models/YoutubeCache');
const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');
const User = require('../models/User');
const { sendInactivityNudgeEmail } = require('./emailService');
const subscriptionNudgeService = require('./subscriptionNudgeService');

let hourlyTimer = null;
let dailyTimer = null;
let nudgeTimer = null;
let cleanupTimer = null;
let subscriptionTimer = null;

/**
 * Purges unverified pending signups and legacy unverified User rows older than 24 hours.
 */
async function cleanupUnverifiedSignups() {
  try {
    const pendingSignupStore = require('../data/pendingSignupStore');
    const cleanedPending = await pendingSignupStore.cleanupExpired(24);

    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { prisma } = require('../config/prisma');
    let cleanedLegacyUsers = 0;
    try {
      const res = await prisma.user.deleteMany({
        where: {
          isVerified: false,
          createdAt: { lt: cutoffDate },
        },
      });
      cleanedLegacyUsers = res.count;
    } catch (dbErr) {
      // Ignore if table query fails
    }

    console.log(`🧹 [Cron] Unverified Signups 24h Cleanup: ${cleanedPending} pending signups + ${cleanedLegacyUsers} legacy unverified User rows purged.`);
    return { cleanedPending, cleanedLegacyUsers };
  } catch (err) {
    console.warn('⚠️ [Cron] Unverified signups cleanup warning:', err.message);
    return { error: err.message };
  }
}

/**
 * Validates and logs skill currency for attempts older than 180 days
 */
async function validateSkillCurrency() {
  try {
    const cutoffDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const expiredCount = await Attempt.countDocuments({
      createdAt: { $lt: cutoffDate },
    });

    console.log(`🧹 [Cron] 180-Day Skill Currency Audit: ${expiredCount} historical attempts identified.`);
  } catch (err) {
    console.warn('⚠️ [Cron] Skill currency validation warning:', err.message);
  }
}

/**
 * Health check on YouTube cache entries
 */
async function auditYouTubeCache() {
  try {
    const cachedCount = await YoutubeCache.countDocuments({});
    console.log(`📺 [Cron] YouTube Video Cache Audit: ${cachedCount} cached queries active.`);
  } catch (err) {
    console.warn('⚠️ [Cron] YouTube cache audit warning:', err.message);
  }
}

/**
 * Scans all students with active roadmaps.
 * Detects inactivity (default: 3 days since last completed task or roadmap start).
 * Dispatches automated streak motivation emails with exact remaining tasks.
 */
async function auditInactivityAndSendNudges(options = {}) {
  const defaultClientUrl =
    (process.env.NODE_ENV === 'production' && process.env.PROD_CLIENT_URL) ||
    process.env.PROD_CLIENT_URL ||
    process.env.CLIENT_URL ||
    'https://disheera.site';

  const {
    inactivityDays = 3,
    forceUserEmail = null,
    clientUrl = defaultClientUrl,
  } = options;

  const results = {
    totalActiveRoadmaps: 0,
    scannedStudents: 0,
    nudgesSent: 0,
    skippedRecentlyNudged: 0,
    skippedActive: 0,
    errors: [],
  };

  try {
    const activeRoadmaps = await Roadmap.find({ status: 'active' });
    results.totalActiveRoadmaps = activeRoadmaps.length;

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const inactivityThresholdMs = inactivityDays * ONE_DAY_MS;
    const cooldownMs = 3 * ONE_DAY_MS; // Do not spam: 1 nudge per 3 days max

    for (const roadmap of activeRoadmaps) {
      try {
        const user = await User.findById(roadmap.userId);
        if (!user || user.role !== 'student' || !user.email) continue;

        // If testing for a specific user email
        if (forceUserEmail && user.email.toLowerCase() !== forceUserEmail.toLowerCase()) {
          continue;
        }

        results.scannedStudents++;

        // Check if recently nudged (unless forced)
        const lastNudge = user.profileStatus?.lastNudgeEmailSentAt
          ? new Date(user.profileStatus.lastNudgeEmailSentAt).getTime()
          : 0;

        if (!forceUserEmail && lastNudge && (Date.now() - lastNudge < cooldownMs)) {
          results.skippedRecentlyNudged++;
          continue;
        }

        // Fetch tasks on this active roadmap
        const tasks = await RoadmapTask.find({ roadmapId: roadmap.id });
        if (!tasks || tasks.length === 0) continue;

        // Determine last activity timestamp
        const completedTasks = tasks.filter((t) => t.completed && t.completedAt);
        let lastActivityDate = null;

        if (completedTasks.length > 0) {
          const timestamps = completedTasks.map((t) => new Date(t.completedAt).getTime());
          lastActivityDate = new Date(Math.max(...timestamps));
        } else {
          lastActivityDate = roadmap.startedAt
            ? new Date(roadmap.startedAt)
            : (roadmap.createdAt ? new Date(roadmap.createdAt) : new Date());
        }

        const elapsedMs = Date.now() - lastActivityDate.getTime();
        const daysInactive = Math.max(1, Math.floor(elapsedMs / ONE_DAY_MS));

        if (!forceUserEmail && elapsedMs < inactivityThresholdMs) {
          results.skippedActive++;
          continue;
        }

        // Determine the student's current milestone week & remaining tasks
        const incompleteTasks = tasks.filter((t) => !t.completed);
        if (incompleteTasks.length === 0) {
          continue;
        }

        const currentWeek = incompleteTasks[0].weekNumber || 1;
        const weekTasks = tasks.filter((t) => t.weekNumber === currentWeek);
        const remainingInWeek = weekTasks.filter((t) => !t.completed);
        const nextTask = remainingInWeek[0] || incompleteTasks[0];

        const careerTitle = roadmap.careerSnapshot?.title || 'Tech Specialist';

        // Send nudge email
        const sendRes = await sendInactivityNudgeEmail({
          toEmail: user.email,
          name: user.name || 'Student',
          careerTitle,
          currentWeek,
          remainingTasksCount: remainingInWeek.length || incompleteTasks.length,
          nextTaskTitle: nextTask ? nextTask.title : 'Continue curriculum',
          daysInactive: forceUserEmail ? (daysInactive || 3) : daysInactive,
          clientUrl,
        });

        if (sendRes.success) {
          results.nudgesSent++;
          const currentProfileStatus = user.profileStatus && typeof user.profileStatus === 'object' ? user.profileStatus : {};
          user.profileStatus = {
            ...currentProfileStatus,
            lastNudgeEmailSentAt: new Date(),
          };
          await user.save();
        }
      } catch (userErr) {
        results.errors.push({ roadmapId: roadmap.id, error: userErr.message });
      }
    }

    console.log(
      `📬 [Cron] Inactivity & Streak Nudge Audit completed: ${results.nudgesSent} emails sent (${results.scannedStudents} scanned, ${results.skippedRecentlyNudged} on cooldown).`
    );
  } catch (err) {
    console.warn('⚠️ [Cron] Inactivity nudge audit failed:', err.message);
    results.errors.push({ error: err.message });
  }

  return results;
}

/**
 * Initializes background cron worker
 */
function initCron() {
  if (process.env.VERCEL) {
    console.log('⚡ [Cron] Vercel serverless environment detected — skipping persistent background cron routines.');
    return;
  }

  console.log('⏰ [Cron] Initializing persistent background maintenance worker...');

  // Run initial lightweight audit on startup
  setTimeout(() => {
    auditYouTubeCache();
    validateSkillCurrency();
    auditInactivityAndSendNudges();
    cleanupUnverifiedSignups();
    subscriptionNudgeService.auditAndSendNudges().catch(err => {
      console.warn('⚠️ [Cron] Initial subscription audit warning:', err.message);
    });
  }, 10000);

  // Hourly routine: YouTube cache health & connection check
  hourlyTimer = setInterval(() => {
    auditYouTubeCache();
  }, 60 * 60 * 1000);

  // 6-Hour routine: Purge expired/unverified pending registrations (>24h)
  cleanupTimer = setInterval(() => {
    cleanupUnverifiedSignups();
  }, 6 * 60 * 60 * 1000);

  // Daily routine: 180-day skill currency audit + Subscription Expiry & WhatsApp Nudge
  dailyTimer = setInterval(() => {
    validateSkillCurrency();
    subscriptionNudgeService.auditAndSendNudges().catch(err => {
      console.warn('⚠️ [Cron] Daily subscription audit warning:', err.message);
    });
  }, 24 * 60 * 60 * 1000);

  // Twice-daily routine (every 12 hours): Inactivity & Streak Nudge audit
  nudgeTimer = setInterval(() => {
    auditInactivityAndSendNudges();
  }, 12 * 60 * 60 * 1000);

  console.log('✅ [Cron] Background maintenance worker active.');
}

/**
 * Graceful cleanup of timers
 */
function stopCron() {
  if (hourlyTimer) clearInterval(hourlyTimer);
  if (dailyTimer) clearInterval(dailyTimer);
  if (nudgeTimer) clearInterval(nudgeTimer);
  if (cleanupTimer) clearInterval(cleanupTimer);
  if (subscriptionTimer) clearInterval(subscriptionTimer);
  hourlyTimer = null;
  dailyTimer = null;
  nudgeTimer = null;
  cleanupTimer = null;
  subscriptionTimer = null;
}

module.exports = {
  initCron,
  stopCron,
  auditInactivityAndSendNudges,
  cleanupUnverifiedSignups,
  validateSkillCurrency,
  auditYouTubeCache,
};

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * controllers/dashboardController.js — Unified Student Dashboard Controller
 *
 * GET /api/dashboard (protected)
 *
 * Consolidates user profile, active roadmap progress, first 5 upcoming tasks,
 * and contextual next recommended action.
 */

const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');
const Career = require('../models/Career');
const { generateRoadmapTasks } = require('../services/roadmapService');
const { evaluateJobReadyCertification } = require('../services/readinessService');
const { prisma } = require('../config/prisma');
const { cacheManager } = require('../utils/cacheManager');

function invalidateDashboardCache(userId) {
  if (userId) {
    cacheManager.invalidateUser(userId);
  } else {
    cacheManager.delPrefix('dashboard:');
  }
}

/**
 * GET /api/dashboard
 * Retrieves comprehensive student dashboard telemetry with sub-second performance
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = String(req.user._id);
    const roadmapQueryId = req.query.roadmapId ? String(req.query.roadmapId) : null;
    const cacheKey = `dashboard:${userId}:${roadmapQueryId || 'default'}`;

    // Security & privacy: dashboard data is user-private and must not be cached by shared CDN proxies
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    // Fast-path: return cached response if valid
    const cachedPayload = cacheManager.get(cacheKey);
    if (cachedPayload) {
      return res.status(200).json(cachedPayload);
    }

    // 1. Fetch user, active roadmaps, and completed roadmaps concurrently
    const [user, allActiveRoadmaps, completedRoadmaps] = await Promise.all([
      User.findById(req.user._id).select('-password').lean(),
      prisma.roadmap.findMany({
        where: { userId: req.user._id, status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: {
          career: true,
          tasks: {
            where: { completed: false },
            orderBy: [{ weekNumber: 'asc' }, { order: 'asc' }],
            take: 5,
          },
        },
      }),
      prisma.roadmap.findMany({
        where: { userId: req.user._id, status: 'completed' },
        orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          career: true,
          tasks: {
            select: { skillName: true },
          },
        },
      }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // Aggregate completedPaths from user profile and completed roadmaps
    const existingCompleted = Array.isArray(user.completedPaths) ? [...user.completedPaths] : [];
    const existingRoadmapIds = new Set(
      existingCompleted.map((cp) => String(cp.roadmap || cp.id || cp.roadmapId || ''))
    );
    const existingRoles = new Set(
      existingCompleted.map((cp) => (cp.role || cp.careerTitle || '').toLowerCase().trim())
    );

    let hasNewCompletedPaths = false;

    // Heal existing entries if skillsGained contains nulls or is empty
    existingCompleted.forEach((cp) => {
      if (Array.isArray(cp.skillsGained)) {
        cp.skillsGained = cp.skillsGained.filter(Boolean);
      }
      if (!Array.isArray(cp.skillsGained) || cp.skillsGained.length === 0) {
        const matchingCr = (completedRoadmaps || []).find((r) => String(r.id || r._id) === String(cp.roadmap));
        if (matchingCr && Array.isArray(matchingCr.tasks) && matchingCr.tasks.length > 0) {
          cp.skillsGained = [...new Set(matchingCr.tasks.map((t) => t.skillName).filter(Boolean))];
          hasNewCompletedPaths = true;
        }
      }
    });

    for (const cr of (completedRoadmaps || [])) {
      const crId = String(cr.id || cr._id);
      const title = cr.careerSnapshot?.title || cr.career?.title || 'Graduated Track';
      const roleKey = title.toLowerCase().trim();

      if (!existingRoadmapIds.has(crId) && !existingRoles.has(roleKey)) {
        const slug = cr.careerSnapshot?.slug || cr.career?.slug || 'graduated-track';
        let requiredSkills = [];
        if (Array.isArray(cr.tasks) && cr.tasks.length > 0) {
          requiredSkills = [...new Set(cr.tasks.map((t) => t.skillName).filter(Boolean))];
        }
        if (requiredSkills.length === 0 && Array.isArray(cr.careerSnapshot?.requiredSkills)) {
          requiredSkills = cr.careerSnapshot.requiredSkills.map((s) => typeof s === 'string' ? s : s?.name).filter(Boolean);
        }
        if (requiredSkills.length === 0 && Array.isArray(cr.career?.requiredSkills)) {
          requiredSkills = cr.career.requiredSkills.map((s) => typeof s === 'string' ? s : s?.name).filter(Boolean);
        }

        const newPath = {
          roadmap: crId,
          role: title,
          careerTitle: title,
          slug,
          credentialId: `CP-CERT-${crId.slice(-8).toUpperCase()}`,
          verificationCode: `V-${crId.slice(0, 8).toUpperCase()}`,
          completionDate: cr.completedAt || cr.updatedAt || new Date(),
          skillsGained: requiredSkills,
          status: 'graduated',
        };

        existingCompleted.push(newPath);
        existingRoadmapIds.add(crId);
        existingRoles.add(roleKey);
        hasNewCompletedPaths = true;
      }
    }

    if (hasNewCompletedPaths) {
      try {
        await prisma.user.update({
          where: { id: req.user._id },
          data: { completedPaths: existingCompleted },
        });
      } catch (err) {
        console.warn('[dashboardController] Sync completedPaths warning:', err.message);
      }
    }

    // Determine target active roadmap (either from query or primary active)
    let activeRoadmap = null;
    if (roadmapQueryId) {
      activeRoadmap = allActiveRoadmaps.find(r => String(r.id || r._id) === roadmapQueryId);
    }
    if (!activeRoadmap && allActiveRoadmaps.length > 0) {
      activeRoadmap = allActiveRoadmaps[0];
    }

    const hasEducation =
      user.education &&
      user.education.course &&
      typeof user.education.course === 'string' &&
      user.education.course.trim() !== '';
    const hasInterest = Array.isArray(user.interests) && user.interests.length > 0;
    const hasSkill = Array.isArray(user.skills) && user.skills.length > 0;
    const isProfileComplete = Boolean(hasEducation && hasInterest && hasSkill);

    let roadmapData = null;
    let upcomingTasks = [];
    let nextRecommendedAction = '';

    if (!isProfileComplete) {
      nextRecommendedAction = 'Complete your assessment to discover your career path';
    } else if (!activeRoadmap) {
      // Check if user completed an archived/previous roadmap
      const completedRoadmap = (completedRoadmaps && completedRoadmaps.length > 0)
        ? completedRoadmaps[0]
        : await Roadmap.findOne({
            user: user._id,
            status: 'completed',
          }).sort({ completedAt: -1, updatedAt: -1 }).lean();

      if (completedRoadmap) {
        roadmapData = {
          id: completedRoadmap._id || completedRoadmap.id,
          _id: completedRoadmap._id || completedRoadmap.id,
          career: {
            title: completedRoadmap.careerSnapshot?.title || completedRoadmap.career?.title || 'Graduated Track',
            slug: completedRoadmap.careerSnapshot?.slug || completedRoadmap.career?.slug || '',
            shortDescription: completedRoadmap.careerSnapshot?.shortDescription || completedRoadmap.career?.shortDescription || '',
          },
          durationWeeks: completedRoadmap.durationWeeks,
          status: completedRoadmap.status,
          totalTasks: completedRoadmap.totalTasks,
          totalTasksCount: completedRoadmap.totalTasks,
          completedTasks: completedRoadmap.completedTasks,
          completedTasksCount: completedRoadmap.completedTasks,
          progressPercentage: 100,
          startedAt: completedRoadmap.startedAt,
          completedAt: completedRoadmap.completedAt,
          weekProgress: completedRoadmap.weekProgress || [],
        };
        nextRecommendedAction =
          'Congratulations! You graduated from this career route. Choose your next route from Recommendations!';
      } else {
        nextRecommendedAction =
          'Choose a recommended career and generate your personalized roadmap';
      }
    } else {
      // User has an active roadmap
      roadmapData = {
        id: activeRoadmap.id || activeRoadmap._id,
        _id: activeRoadmap.id || activeRoadmap._id,
        career: {
          title: activeRoadmap.careerSnapshot?.title || activeRoadmap.career?.title || 'Active Track',
          slug: activeRoadmap.careerSnapshot?.slug || activeRoadmap.career?.slug || '',
          shortDescription: activeRoadmap.careerSnapshot?.shortDescription || activeRoadmap.career?.shortDescription || '',
        },
        durationWeeks: activeRoadmap.durationWeeks,
        status: activeRoadmap.status,
        totalTasks: activeRoadmap.totalTasks,
        totalTasksCount: activeRoadmap.totalTasks,
        completedTasks: activeRoadmap.completedTasks,
        completedTasksCount: activeRoadmap.completedTasks,
        progressPercentage: activeRoadmap.progressPercentage,
        startedAt: activeRoadmap.startedAt,
        weekProgress: activeRoadmap.weekProgress || [],
      };

      // Extract tasks pre-fetched in the same Prisma query (0 extra roundtrips)
      if (Array.isArray(activeRoadmap.tasks) && activeRoadmap.tasks.length > 0) {
        upcomingTasks = activeRoadmap.tasks.map((t) => ({ ...t, _id: t.id }));
      } else if (activeRoadmap.progressPercentage < 100) {
        upcomingTasks = await RoadmapTask.find({
          roadmap: activeRoadmap.id || activeRoadmap._id,
          completed: false,
        })
          .sort({ weekNumber: 1, order: 1 })
          .limit(5)
          .select('-__v')
          .lean();

        if (upcomingTasks.length === 0) {
          const prismaTasks = await prisma.roadmapTask.findMany({
            where: { roadmapId: activeRoadmap.id || activeRoadmap._id, completed: false },
            orderBy: [{ weekNumber: 'asc' }, { order: 'asc' }],
            take: 5,
          });
          if (prismaTasks.length > 0) {
            upcomingTasks = prismaTasks.map((t) => ({ ...t, _id: t.id }));
          }
        }

        // Self-heal tasks if active roadmap is missing tasks entirely
        if (upcomingTasks.length === 0) {
          try {
            const targetUser = await User.findById(activeRoadmap.userId || activeRoadmap.user || req.user._id);
            const slug = activeRoadmap.careerSnapshot?.slug || activeRoadmap.career?.slug || 'front-end-developer';
            let targetCareer = await Career.findOne({ slug })
              .populate({ path: 'requiredSkills.skill', select: 'name displayName category description' });
            if (!targetCareer) {
              targetCareer = await Career.findOne({ active: true })
                .populate({ path: 'requiredSkills.skill', select: 'name displayName category description' });
            }

            if (targetCareer && targetUser) {
              const { taskDocuments } = generateRoadmapTasks(targetUser, targetCareer, activeRoadmap.durationWeeks || 4);
              if (Array.isArray(taskDocuments) && taskDocuments.length > 0) {
                const tasksWithRoadmapId = taskDocuments.map((t) => ({
                  ...t,
                  roadmap: activeRoadmap.id || activeRoadmap._id,
                }));
                const createdTasks = await RoadmapTask.insertMany(tasksWithRoadmapId);
                upcomingTasks = createdTasks.slice(0, 5).map(t => (t.toObject ? t.toObject() : t));
                await Roadmap.findByIdAndUpdate(activeRoadmap.id || activeRoadmap._id, {
                  $set: { totalTasks: createdTasks.length }
                });
              }
            }
          } catch (healErr) {
            console.warn('[dashboardController] Auto-healing tasks warning:', healErr.message);
          }
        }
      }

      if (upcomingTasks.length > 0) {
        const nextTask = upcomingTasks[0];
        nextRecommendedAction = `Next: ${nextTask.title} (Week ${nextTask.weekNumber})`;
      } else if (activeRoadmap.progressPercentage === 100) {
        nextRecommendedAction =
          'Congratulations! You completed your roadmap. Explore a new career path.';
      } else {
        nextRecommendedAction = 'Review your current learning milestones and projects';
      }
    }

    let actionLabel = 'Continue';
    let actionUrl = 'roadmap.html';
    if (!isProfileComplete) {
      actionLabel = 'Complete Assessment';
      actionUrl = 'assessment.html';
    } else if (!activeRoadmap) {
      actionLabel = 'Explore Careers';
      actionUrl = 'recommendations.html';
    }

    // In-memory instant evaluation: pass user and activeRoadmap directly (0 extra DB reads)
    const jobReadyCertification = await evaluateJobReadyCertification(user, activeRoadmap).catch(() => null);

    const sanitizedRepos = (user.githubRepos || []).map((r) => ({
      ...r,
      language: r.language && r.language.trim().toLowerCase() !== 'code' ? r.language.trim() : '',
    }));

    let sanitizedTopLanguages = user.githubProfile?.topLanguages || [];
    if (Array.isArray(sanitizedTopLanguages)) {
      sanitizedTopLanguages = sanitizedTopLanguages.filter((l) => l && l.trim().toLowerCase() !== 'code');
    }

    const sanitizedProfile = user.githubProfile
      ? {
          ...user.githubProfile,
          topLanguages: sanitizedTopLanguages,
        }
      : null;

    const payload = {
      success: true,
      data: {
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          education: user.education || {},
          interests: user.interests || [],
          skills: user.skills || [],
          githubProfile: sanitizedProfile,
          githubRepos: sanitizedRepos,
          profileCompleted: isProfileComplete,
          avatarUrl: user.avatarUrl || '',
          resumeUrl: user.resumeUrl || '',
          resumeRecord: user.resumeRecord || null,
          completedPaths: existingCompleted,
          profileStatus: user.profileStatus || { status: 'learning', currentRole: '' },
        },
        activeRoadmaps: allActiveRoadmaps.map((r) => ({
          id: r.id || r._id,
          _id: r.id || r._id,
          career: {
            title: r.careerSnapshot?.title || r.career?.title || 'Active Track',
            slug: r.careerSnapshot?.slug || r.career?.slug || '',
            shortDescription: r.careerSnapshot?.shortDescription || r.career?.shortDescription || '',
          },
          durationWeeks: r.durationWeeks,
          status: r.status,
          progressPercentage: r.progressPercentage,
          totalTasks: r.totalTasks,
          completedTasks: r.completedTasks,
        })),
        completedRoadmaps: (completedRoadmaps || []).map((r) => ({
          id: r.id || r._id,
          _id: r.id || r._id,
          career: {
            title: r.careerSnapshot?.title || r.career?.title || 'Graduated Track',
            slug: r.careerSnapshot?.slug || r.career?.slug || '',
            shortDescription: r.careerSnapshot?.shortDescription || r.career?.shortDescription || '',
          },
          durationWeeks: r.durationWeeks,
          status: r.status,
          progressPercentage: r.progressPercentage,
          totalTasks: r.totalTasks,
          completedTasks: r.completedTasks,
          completedAt: r.completedAt,
        })),
        activeCount: allActiveRoadmaps.length,
        maxAllowed: 2,
        canEnrollSecondCourse: allActiveRoadmaps.length === 1,
        activeRoadmap: roadmapData,
        jobReadyCertification,
        progress: {
          totalTasks: roadmapData ? roadmapData.totalTasks : 0,
          completedTasks: roadmapData ? roadmapData.completedTasks : 0,
          progressPercentage: roadmapData ? roadmapData.progressPercentage : 0,
        },
        upcomingTasks,
        nextRecommendedAction,
        nextAction: {
          prompt: nextRecommendedAction,
          actionLabel,
          actionUrl,
        },
      },
    };

    // Cache valid payload in memory for 15 seconds
    cacheManager.set(cacheKey, payload, 15);

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  invalidateDashboardCache,
};

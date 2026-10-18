/**
 * services/roadmapService.js — Deterministic Personalized Roadmap Generation & Progress Tracking
 *
 * Rules:
 *  - Deterministic synthesis; no external AI calls.
 *  - Uses recommendationService to re-evaluate real user skill gaps.
 *  - Matches template by career slug.
 *  - Generates weeks 1–4, 1–8, or 1–12 depending on durationWeeks.
 *  - Prioritizes tasks matching missing skills, then weak skills.
 *  - Calculates and updates roadmap progress metrics.
 */

const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');
const User = require('../models/User');
const { cacheManager } = require('../utils/cacheManager');
const roadmapTemplates = require('../data/roadmapTemplates');
const { calculateSkillScore } = require('./recommendationService');

/**
 * Generates structured task objects ready for bulk insertion
 *
 * @param {Object} user - Authenticated user document
 * @param {Object} career - Target career document with populated requiredSkills.skill
 * @param {Number} durationWeeks - 4, 8, or 12
 * @returns {Object} { generatedFrom, taskDocuments }
 */
const generateRoadmapTasks = (user, career, durationWeeks = 4) => {
  const careerSlug = career.slug.toLowerCase().trim();
  let template = roadmapTemplates[careerSlug];

  // Dynamic fallback generator if dedicated template is not predefined
  if (!template) {
    const reqSkills = Array.isArray(career.requiredSkills) ? career.requiredSkills : [];
    const weeks = [];
    const skillsPerWeek = Math.max(1, Math.ceil(reqSkills.length / durationWeeks));

    for (let w = 1; w <= durationWeeks; w++) {
      const startIdx = (w - 1) * skillsPerWeek;
      const weekSkills = reqSkills.slice(startIdx, startIdx + skillsPerWeek);
      const tasks = [];

      if (weekSkills.length === 0) {
        tasks.push({
          order: 1,
          title: `${career.title} Capstone Project & Production Readiness`,
          description: `Synthesize all competencies learned so far into an end-to-end production-grade portfolio project demonstrating real-world readiness for ${career.title} roles.`,
          type: 'project',
          skillName: (reqSkills[0]?.skill?.name || reqSkills[0]?.skillName || 'problem-solving'),
          priority: 'high',
          estimatedHours: 8,
          resource: {
            title: `${career.title} Open Source Reference Projects`,
            url: 'https://github.com/topics/portfolio-project',
            provider: 'GitHub & Open Source Community',
          },
        });
        tasks.push({
          order: 2,
          title: `${career.title} Technical Screening & Mock Assessment`,
          description: `Review foundational algorithms, domain-specific architecture questions, and refine resume project impact bullets.`,
          type: 'assessment',
          skillName: 'communication',
          priority: 'high',
          estimatedHours: 4,
          resource: {
            title: 'Technical Interview Preparation Handbook',
            url: 'https://github.com/jwasham/coding-interview-university',
            provider: 'Tech Interview Handbook',
          },
        });
      } else {
        weekSkills.forEach((rs, i) => {
          const sName = rs.skill?.displayName || rs.skill?.name || rs.skillName || 'Core Competency';
          const sKey = (rs.skill?.name || rs.skillName || 'skill').toLowerCase();

          tasks.push({
            order: i * 2 + 1,
            title: `Master ${sName} Architecture & Core Principles`,
            description: `Deep dive into theoretical foundations, syntactical patterns, and industry best practices for ${sName} in modern enterprise software.`,
            type: 'learn',
            skillName: sKey,
            priority: rs.importance === 'high' ? 'high' : 'medium',
            estimatedHours: rs.importance === 'high' ? 5 : 3,
            isVideoTask: false,
            videoDurationSeconds: 0,
            resource: {
              title: `${sName} Official Documentation & Architecture Guide`,
              url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(sName)}`,
              provider: 'Official Documentation & MDN',
              mediaType: 'doc',
            },
          });

          tasks.push({
            order: i * 2 + 2,
            title: `Hands-On Lab: Build & Test ${sName} Implementation`,
            description: `Construct a functional component or module demonstrating practical proficiency with ${sName}, including error handling and unit validation.`,
            type: 'practice',
            skillName: sKey,
            priority: rs.importance === 'high' ? 'high' : 'medium',
            estimatedHours: 4,
            resource: {
              title: `${sName} Interactive Hands-On Lab`,
              url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(sName)}`,
              provider: 'Interactive Learning Resource',
            },
          });
        });
      }

      weeks.push({
        weekNumber: w,
        tasks,
      });
    }

    template = {
      title: career.title,
      category: career.category || 'development',
      weeks,
    };
  }

  // 1. Re-evaluate real user skill gaps securely
  const userSkillsMap = new Map();
  if (Array.isArray(user.skills)) {
    user.skills.forEach((s) => {
      if (s.name) {
        userSkillsMap.set(s.name.toLowerCase().trim(), s);
      }
    });
  }

  const { matchedSkills, weakSkills, missingSkills } = calculateSkillScore(
    userSkillsMap,
    career.requiredSkills
  );

  const missingSkillNames = missingSkills.map((s) => s.name.toLowerCase());
  const weakSkillNames = weakSkills.map((s) => s.name.toLowerCase());
  const userInterests = Array.isArray(user.interests) ? user.interests : [];
  const userSkillNames = Array.from(userSkillsMap.keys());

  // 2. Select template weeks up to durationWeeks
  const selectedTemplateWeeks = template.weeks.filter(
    (w) => w.weekNumber <= durationWeeks
  );

  const taskDocuments = [];

  // 3. Process each week and prioritize tasks linked to missing & weak skills
  selectedTemplateWeeks.forEach((week) => {
    // Clone and score each task for prioritization
    const weekTasks = week.tasks.map((task) => {
      const taskSkill = (task.skillName || '').toLowerCase().trim();
      let dynamicPriority = task.priority || 'medium';

      // Elevate priority if this task directly targets one of the user's missing skills
      if (missingSkillNames.includes(taskSkill)) {
        dynamicPriority = 'high';
      } else if (weakSkillNames.includes(taskSkill) && dynamicPriority === 'low') {
        dynamicPriority = 'medium';
      }

      return {
        ...task,
        priority: dynamicPriority,
      };
    });

    // Sort tasks in week: missing skills first, then by original order
    weekTasks.sort((a, b) => {
      const aMissing = missingSkillNames.includes((a.skillName || '').toLowerCase());
      const bMissing = missingSkillNames.includes((b.skillName || '').toLowerCase());
      if (aMissing && !bMissing) return -1;
      if (!aMissing && bMissing) return 1;
      return a.order - b.order;
    });

    // Assign sequential order within the week
    weekTasks.forEach((task, idx) => {
      const validTypes = ['learn', 'practice', 'project', 'assessment', 'interview'];
      const sanitizedType = validTypes.includes(task.type) ? task.type : 'practice';

      const taskSkillKey = (task.skillName || '').toLowerCase().trim();
      const userSkillData = userSkillsMap.get(taskSkillKey);
      let taskDescription = task.description;
      if (userSkillData && Array.isArray(userSkillData.quizGaps) && userSkillData.quizGaps.length > 0) {
        taskDescription += ` • Targeted Focus Areas from Reality-Check Quiz: ${userSkillData.quizGaps.join(', ')}.`;
      }

      const mediaType = task.resource?.mediaType === 'video' ? 'doc' : (task.resource?.mediaType || task.resource?.type || 'doc');

      taskDocuments.push({
        weekNumber: week.weekNumber,
        order: idx + 1,
        title: task.title,
        description: taskDescription,
        type: sanitizedType,
        skillName: task.skillName || '',
        priority: task.priority || 'medium',
        estimatedHours: task.estimatedHours || 2,
        resource: {
          ...(task.resource || {}),
          mediaType: mediaType,
          url: (() => {
            if (task.resource?.url && typeof task.resource.url === 'string') {
              try {
                const parsedResUrl = new URL(task.resource.url);
                const host = parsedResUrl.hostname.toLowerCase();
                const isYouTube = host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be' || host.endsWith('.youtu.be');
                if (!isYouTube && (parsedResUrl.protocol === 'https:' || parsedResUrl.protocol === 'http:')) {
                  return task.resource.url;
                }
              } catch (_) {}
            }
            return `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(task.skillName || task.title)}`;
          })(),
          title: task.resource?.title || `${task.title} Documentation Guide`,
          provider: task.resource?.provider || 'Disheera Learning Hub',
        },
        isVideoTask: false,
        videoDurationSeconds: 0,
        videoMaxWatchedTime: 0,
        videoWatchTimeSeconds: 0,
        videoMidCheckPassed: false,
        isVideoVerified: false,
        completed: false,
      });
    });
  });

  return {
    generatedFrom: {
      missingSkills: missingSkillNames,
      weakSkills: weakSkillNames,
      userInterests,
      userSkillNames,
    },
    taskDocuments,
  };
};

/**
 * Automatically saves completed roadmap to user's profile and permanently elevates profile skills
 *
 * @param {string} userId
 * @param {Object} roadmap
 */
const syncUserGraduation = async (userId, roadmap) => {
  if (!userId || !roadmap) return;
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const rId = String(roadmap._id || roadmap.id);
    const title = roadmap.careerSnapshot?.title || 'Graduated Track';
    const roleKey = title.toLowerCase().trim();
    const slug = roadmap.careerSnapshot?.slug || 'graduated-track';

    // Fetch all tasks for this roadmap to extract skills gained
    const tasks = await RoadmapTask.find({ roadmap: roadmap._id || roadmap.id });
    let skillsGained = [...new Set(tasks.map((t) => t.skillName).filter(Boolean))];
    if (skillsGained.length === 0 && Array.isArray(roadmap.careerSnapshot?.requiredSkills)) {
      skillsGained = roadmap.careerSnapshot.requiredSkills
        .map((s) => (typeof s === 'string' ? s : s?.name))
        .filter(Boolean);
    }

    const completedPaths = Array.isArray(user.completedPaths) ? [...user.completedPaths] : [];
    const existingIdx = completedPaths.findIndex(
      (cp) => String(cp.roadmap || cp.id || '') === rId || (cp.role || '').toLowerCase().trim() === roleKey
    );

    const credentialRecord = {
      roadmap: rId,
      role: title,
      careerTitle: title,
      slug,
      credentialId: `CP-CERT-${rId.slice(-8).toUpperCase()}`,
      verificationCode: `V-${rId.slice(0, 8).toUpperCase()}`,
      completionDate: roadmap.completedAt || new Date(),
      skillsGained,
      status: 'graduated',
      totalTasks: roadmap.totalTasks,
      durationWeeks: roadmap.durationWeeks,
    };

    if (existingIdx >= 0) {
      completedPaths[existingIdx] = { ...completedPaths[existingIdx], ...credentialRecord };
    } else {
      completedPaths.push(credentialRecord);
    }

    user.completedPaths = completedPaths;

    // Permanently elevate user's profile skills
    const existingSkills = Array.isArray(user.skills) ? [...user.skills] : [];
    const skillMap = new Map();
    existingSkills.forEach((s) => {
      if (s.name) skillMap.set(s.name.toLowerCase().trim(), s);
    });

    skillsGained.forEach((sName) => {
      const k = sName.toLowerCase().trim();
      if (skillMap.has(k)) {
        const s = skillMap.get(k);
        s.proficiency = s.proficiency === 'beginner' ? 'intermediate' : 'advanced';
        s.isQuizVerified = true;
      } else {
        skillMap.set(k, {
          name: k,
          displayName: sName.charAt(0).toUpperCase() + sName.slice(1),
          proficiency: 'intermediate',
          isQuizVerified: true,
        });
      }
    });

    user.skills = Array.from(skillMap.values());
    const currentProfileStatus = (user.profileStatus && typeof user.profileStatus === 'object') ? user.profileStatus : {};
    user.profileStatus = {
      ...currentProfileStatus,
      status: 'graduated',
      currentRole: title,
    };
    user.hasCompletedSkillVerification = true;

    await user.save();
    cacheManager.invalidateUser(userId);
  } catch (err) {
    console.warn('[syncUserGraduation] Failed to sync graduation to user profile:', err.message);
  }
};

/**
 * Recalculates roadmap progress and updates Roadmap document
 *
 * @param {ObjectId|string} roadmapId
 * @returns {Promise<Object>} Updated roadmap document
 */
const calculateRoadmapProgress = async (roadmapId) => {
  const totalTasks = await RoadmapTask.countDocuments({ roadmap: roadmapId });
  const completedTasks = await RoadmapTask.countDocuments({
    roadmap: roadmapId,
    completed: true,
  });

  const progressPercentage =
    totalTasks > 0 ? Math.min(Math.max(Math.round((completedTasks / totalTasks) * 100), 0), 100) : 0;

  const isFullyCompleted = totalTasks > 0 && completedTasks === totalTasks;
  const currentRoadmapDoc = await Roadmap.findById(roadmapId);
  if (!currentRoadmapDoc) return null;

  const updateFields = {
    totalTasks,
    completedTasks,
    progressPercentage,
  };

  if (isFullyCompleted) {
    updateFields.status = 'completed';
    updateFields.completedAt = new Date();
  } else if (currentRoadmapDoc.status === 'completed') {
    updateFields.status = 'active';
    updateFields.completedAt = null;
  }

  const updatedRoadmap = await Roadmap.findByIdAndUpdate(
    roadmapId,
    { $set: updateFields },
    { new: true }
  );

  // Automatically save completed roadmap into user profile and elevate verified skills
  if (isFullyCompleted && updatedRoadmap) {
    await syncUserGraduation(currentRoadmapDoc.user || currentRoadmapDoc.userId, updatedRoadmap);
  }

  return updatedRoadmap;
};

module.exports = {
  generateRoadmapTasks,
  calculateRoadmapProgress,
  syncUserGraduation,
};

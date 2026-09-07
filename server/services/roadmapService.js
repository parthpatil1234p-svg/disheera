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
  const template = roadmapTemplates[careerSlug];

  if (!template) {
    throw new Error(`No roadmap template found for career slug: "${careerSlug}"`);
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
      taskDocuments.push({
        weekNumber: week.weekNumber,
        order: idx + 1,
        title: task.title,
        description: task.description,
        type: task.type || 'learn',
        skillName: task.skillName || '',
        priority: task.priority,
        estimatedHours: task.estimatedHours || 2,
        resource: task.resource || {},
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

  const updateFields = {
    totalTasks,
    completedTasks,
    progressPercentage,
  };

  if (isFullyCompleted) {
    updateFields.status = 'completed';
    updateFields.completedAt = new Date();
  } else {
    updateFields.status = 'active';
    updateFields.completedAt = null;
  }

  const updatedRoadmap = await Roadmap.findByIdAndUpdate(
    roadmapId,
    { $set: updateFields },
    { new: true }
  );

  return updatedRoadmap;
};

module.exports = {
  generateRoadmapTasks,
  calculateRoadmapProgress,
};

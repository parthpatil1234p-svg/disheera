/**
 * controllers/roadmapController.js — Personalized Roadmap & Task Progress Controllers
 *
 * generateRoadmap   POST  /api/roadmaps/generate
 * getCurrentRoadmap GET   /api/roadmaps/current
 * toggleTask        PATCH /api/roadmaps/tasks/:taskId/toggle
 * archiveRoadmap    DELETE /api/roadmaps/current
 */

const Roadmap = require('../models/Roadmap');
const RoadmapTask = require('../models/RoadmapTask');
const Career = require('../models/Career');
const User = require('../models/User');
const Skill = require('../models/Skill'); // Ensure registered
const { generateRecommendations } = require('../services/recommendationService');
const { generateRoadmapTasks, calculateRoadmapProgress } = require('../services/roadmapService');

// Helper to group tasks by weekNumber
const groupTasksByWeek = (tasks, durationWeeks) => {
  const weekMap = new Map();
  for (let w = 1; w <= durationWeeks; w++) {
    weekMap.set(w, []);
  }

  tasks.forEach((task) => {
    if (weekMap.has(task.weekNumber)) {
      weekMap.get(task.weekNumber).push(task);
    } else {
      weekMap.set(task.weekNumber, [task]);
    }
  });

  const weeks = [];
  weekMap.forEach((taskList, weekNumber) => {
    weeks.push({
      weekNumber,
      tasks: taskList,
    });
  });

  return weeks;
};

// ── generateRoadmap ────────────────────────────────────────────
/**
 * POST /api/roadmaps/generate
 * Creates or refreshes a personalized learning curriculum
 */
const generateRoadmap = async (req, res, next) => {
  try {
    const { careerSlug, durationWeeks } = req.body;
    const weeksCount = Number(durationWeeks);

    // 1. Fetch fresh user document
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // 2. Validate profile completeness
    const hasEducation =
      user.education &&
      user.education.course &&
      typeof user.education.course === 'string' &&
      user.education.course.trim() !== '';
    const hasInterest = Array.isArray(user.interests) && user.interests.length > 0;
    const hasSkill = Array.isArray(user.skills) && user.skills.length > 0;

    if (!hasEducation || !hasInterest || !hasSkill) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile assessment before generating a roadmap',
      });
    }

    // 3. Load all active careers and compute user's top-3 recommendations
    const allCareers = await Career.find({ active: true })
      .select('-__v')
      .populate({
        path: 'requiredSkills.skill',
        select: 'name displayName category description',
      });

    if (!allCareers || allCareers.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No active careers available. Please run database seed.',
      });
    }

    const topRecommendations = generateRecommendations(user, allCareers, 3);
    const topCareerSlugs = topRecommendations.map((r) => r.career.slug.toLowerCase().trim());

    // 4. Verify selected career is in user's top three recommendations
    const targetSlug = careerSlug.toLowerCase().trim();
    if (!topCareerSlugs.includes(targetSlug)) {
      return res.status(400).json({
        success: false,
        message: 'Please choose a career from your top recommendations',
      });
    }

    // 5. Find target career document with populated skills
    const selectedCareer = allCareers.find((c) => c.slug.toLowerCase().trim() === targetSlug);
    if (!selectedCareer) {
      return res.status(404).json({
        success: false,
        message: `Career "${careerSlug}" not found`,
      });
    }

    // 6. Archive user's current active roadmap(s)
    await Roadmap.updateMany(
      { user: user._id, status: 'active' },
      { $set: { status: 'archived' } }
    );

    // 7. Generate personalized tasks based on real skill gaps
    const { generatedFrom, taskDocuments } = generateRoadmapTasks(
      user,
      selectedCareer,
      weeksCount
    );

    // 8. Create Roadmap document
    const newRoadmap = await Roadmap.create({
      user: user._id,
      career: selectedCareer._id,
      careerSnapshot: {
        title: selectedCareer.title,
        slug: selectedCareer.slug,
        shortDescription: selectedCareer.shortDescription,
      },
      durationWeeks: weeksCount,
      status: 'active',
      generatedFrom,
      totalTasks: taskDocuments.length,
      completedTasks: 0,
      progressPercentage: 0,
      startedAt: new Date(),
    });

    // 9. Bulk-create RoadmapTask documents linked to new roadmap
    const tasksWithRoadmapId = taskDocuments.map((task) => ({
      ...task,
      roadmap: newRoadmap._id,
    }));

    const createdTasks = await RoadmapTask.insertMany(tasksWithRoadmapId);

    // 10. Group tasks by week for response
    const weeks = groupTasksByWeek(createdTasks, weeksCount);

    res.status(201).json({
      success: true,
      message: 'Personalized roadmap generated successfully',
      data: {
        roadmap: {
          id: newRoadmap._id,
          _id: newRoadmap._id,
          career: {
            title: newRoadmap.careerSnapshot.title,
            slug: newRoadmap.careerSnapshot.slug,
          },
          durationWeeks: newRoadmap.durationWeeks,
          status: newRoadmap.status,
          totalTasks: newRoadmap.totalTasks,
          totalTasksCount: newRoadmap.totalTasks,
          completedTasks: newRoadmap.completedTasks,
          completedTasksCount: newRoadmap.completedTasks,
          progressPercentage: newRoadmap.progressPercentage,
        },
        tasks: createdTasks,
        weeks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── getCurrentRoadmap ──────────────────────────────────────────
/**
 * GET /api/roadmaps/current
 * Returns active roadmap and all associated tasks grouped by week
 */
const getCurrentRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({
      user: req.user._id,
      status: 'active',
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'No active roadmap found. Generate a roadmap first.',
      });
    }

    const tasks = await RoadmapTask.find({ roadmap: roadmap._id })
      .sort({ weekNumber: 1, order: 1 })
      .select('-__v');

    const weeks = groupTasksByWeek(tasks, roadmap.durationWeeks);

    res.status(200).json({
      success: true,
      data: {
        roadmap: {
          id: roadmap._id,
          _id: roadmap._id,
          career: {
            title: roadmap.careerSnapshot.title,
            slug: roadmap.careerSnapshot.slug,
            shortDescription: roadmap.careerSnapshot.shortDescription,
          },
          durationWeeks: roadmap.durationWeeks,
          status: roadmap.status,
          totalTasks: roadmap.totalTasks,
          totalTasksCount: roadmap.totalTasks,
          completedTasks: roadmap.completedTasks,
          completedTasksCount: roadmap.completedTasks,
          progressPercentage: roadmap.progressPercentage,
          startedAt: roadmap.startedAt,
        },
        tasks,
        weeks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── toggleTask ─────────────────────────────────────────────────
/**
 * PATCH /api/roadmaps/tasks/:taskId/toggle
 * Toggles a task's completed state and recalculates overall roadmap progress
 */
const toggleTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // 1. Locate task
    const task = await RoadmapTask.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap task not found',
      });
    }

    // 2. Verify task belongs to current user's active roadmap
    const activeRoadmap = await Roadmap.findOne({
      _id: task.roadmap,
      user: req.user._id,
      status: { $in: ['active', 'completed'] }, // Allow toggling even if temporarily marked completed
    });

    if (!activeRoadmap) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this roadmap task',
      });
    }

    // 3. Toggle completed status
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;
    await task.save();

    // 4. Recalculate progress on Roadmap
    const updatedRoadmap = await calculateRoadmapProgress(activeRoadmap._id);

    res.status(200).json({
      success: true,
      message: `Task marked as ${task.completed ? 'completed' : 'incomplete'}`,
      data: {
        task: {
          id: task._id,
          _id: task._id,
          completed: task.completed,
          completedAt: task.completedAt,
        },
        roadmap: {
          id: updatedRoadmap._id,
          _id: updatedRoadmap._id,
          status: updatedRoadmap.status,
          totalTasks: updatedRoadmap.totalTasks,
          totalTasksCount: updatedRoadmap.totalTasks,
          completedTasks: updatedRoadmap.completedTasks,
          completedTasksCount: updatedRoadmap.completedTasks,
          progressPercentage: updatedRoadmap.progressPercentage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── archiveRoadmap ─────────────────────────────────────────────
/**
 * DELETE /api/roadmaps/current
 * Safely archives the current active roadmap without permanent deletion
 */
const archiveRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOneAndUpdate(
      { user: req.user._id, status: 'active' },
      { $set: { status: 'archived' } },
      { new: true }
    );

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'No active roadmap to archive',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Active roadmap archived successfully',
      data: {
        archivedRoadmapId: roadmap._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateRoadmap,
  getCurrentRoadmap,
  toggleTask,
  archiveRoadmap,
};

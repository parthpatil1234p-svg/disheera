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

/**
 * GET /api/dashboard
 * Retrieves comprehensive student dashboard telemetry
 */
const getDashboard = async (req, res, next) => {
  try {
    // 1. Fetch user
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    const hasEducation =
      user.education &&
      user.education.course &&
      typeof user.education.course === 'string' &&
      user.education.course.trim() !== '';
    const hasInterest = Array.isArray(user.interests) && user.interests.length > 0;
    const hasSkill = Array.isArray(user.skills) && user.skills.length > 0;
    const isProfileComplete = Boolean(hasEducation && hasInterest && hasSkill);

    // 2. Query active roadmap
    const activeRoadmap = await Roadmap.findOne({
      user: user._id,
      status: 'active',
    });

    let roadmapData = null;
    let upcomingTasks = [];
    let nextRecommendedAction = '';

    if (!isProfileComplete) {
      nextRecommendedAction = 'Complete your assessment to discover your career path';
    } else if (!activeRoadmap) {
      // Check if user completed an archived/previous roadmap
      const completedRoadmap = await Roadmap.findOne({
        user: user._id,
        status: 'completed',
      });

      if (completedRoadmap) {
        nextRecommendedAction =
          'Congratulations! You completed your roadmap. Explore a new career path.';
      } else {
        nextRecommendedAction =
          'Choose a recommended career and generate your personalized roadmap';
      }
    } else {
      // User has an active roadmap
      roadmapData = {
        id: activeRoadmap._id,
        career: {
          title: activeRoadmap.careerSnapshot.title,
          slug: activeRoadmap.careerSnapshot.slug,
          shortDescription: activeRoadmap.careerSnapshot.shortDescription,
        },
        durationWeeks: activeRoadmap.durationWeeks,
        status: activeRoadmap.status,
        totalTasks: activeRoadmap.totalTasks,
        completedTasks: activeRoadmap.completedTasks,
        progressPercentage: activeRoadmap.progressPercentage,
        startedAt: activeRoadmap.startedAt,
      };

      // Fetch first 5 incomplete tasks
      upcomingTasks = await RoadmapTask.find({
        roadmap: activeRoadmap._id,
        completed: false,
      })
        .sort({ weekNumber: 1, order: 1 })
        .limit(5)
        .select('-__v');

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

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          education: user.education || {},
          interests: user.interests || [],
          skills: user.skills || [],
          profileCompleted: isProfileComplete,
        },
        activeRoadmap: roadmapData,
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
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};

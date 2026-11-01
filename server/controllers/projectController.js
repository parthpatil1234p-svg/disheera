/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * projectController.js - Handles student practical project submissions & evaluations
 * Disheera Technologies Inc.
 */

const User = require('../models/User');
const { evaluateProject } = require('../services/projectVerificationService');

/**
 * POST /api/projects/submit
 * Evaluates student project against 4-dimensional AI rubric
 */
const submitProject = async (req, res, next) => {
  try {
    const {
      projectTitle,
      githubUrl,
      liveUrl,
      description,
      targetSkill,
      roadmapId,
      taskId
    } = req.body;

    if (!projectTitle || !githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'Project title and GitHub repository URL are required.'
      });
    }

    // Run 4D Rubric Evaluation
    const evaluation = await evaluateProject({
      projectTitle,
      githubUrl,
      liveUrl,
      description,
      targetSkill
    });

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const projectRecord = {
      id: 'proj_' + Date.now(),
      projectTitle: projectTitle.trim(),
      githubUrl: githubUrl.trim(),
      liveUrl: (liveUrl || '').trim(),
      description: (description || '').trim(),
      targetSkill: (targetSkill || '').trim(),
      roadmapId: roadmapId || null,
      taskId: taskId || null,
      passed: evaluation.passed,
      score: evaluation.compositeScore,
      verificationBadge: evaluation.verificationBadge,
      rubricBreakdown: evaluation.rubricBreakdown,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      summary: evaluation.summary,
      evaluatedAt: evaluation.evaluatedAt
    };

    // Initialize array if not present
    const verifiedProjects = Array.isArray(user.verifiedProjects) ? [...user.verifiedProjects] : [];
    verifiedProjects.unshift(projectRecord);
    user.verifiedProjects = verifiedProjects;

    // If passed, stamp target skill as project verified
    if (evaluation.passed && targetSkill) {
      const skills = Array.isArray(user.skills) ? [...user.skills] : [];
      const normTarget = targetSkill.trim().toLowerCase();
      let matched = false;

      for (let s of skills) {
        if ((s.name && s.name.toLowerCase() === normTarget) || (s.displayName && s.displayName.toLowerCase() === normTarget)) {
          s.isProjectVerified = true;
          s.verifiedSource = `Project: ${projectTitle}`;
          matched = true;
          break;
        }
      }

      if (!matched) {
        skills.push({
          name: normTarget,
          displayName: targetSkill.trim(),
          proficiency: 'intermediate',
          isProjectVerified: true,
          isCodeVerified: true,
          verifiedSource: `Project: ${projectTitle}`
        });
      }

      user.skills = skills;
      user.hasCompletedSkillVerification = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: evaluation.passed
        ? '🎉 Congratulations! Your project passed the evaluation and earned the Project Verified credential.'
        : 'Project evaluated. Please review feedback and resubmit to earn verification.',
      data: {
        evaluation,
        project: projectRecord
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/my-projects
 * Returns all submitted and verified projects for authenticated user
 */
const getMyProjects = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const projects = Array.isArray(user.verifiedProjects) ? user.verifiedProjects : [];

    res.status(200).json({
      success: true,
      count: projects.length,
      data: { projects }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 * Returns single project review detail
 */
const getProjectById = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const projects = Array.isArray(user.verifiedProjects) ? user.verifiedProjects : [];
    const proj = projects.find(p => p.id === req.params.id);

    if (!proj) {
      return res.status(404).json({
        success: false,
        message: 'Project submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { project: proj }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitProject,
  getMyProjects,
  getProjectById
};

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * routes/youtubeRoutes.js — YouTube Masterclass & Video Resolution API Routes
 *
 * Exposes endpoints for:
 *   GET   /api/youtube/resolve          — Resolve the best embeddable masterclass + alternatives for a skill
 *   GET   /api/youtube/search           — Search YouTube Data API v3 or cached/curated catalog
 *   PATCH /api/youtube/tasks/:id/switch — Switch the video instructor for a specific roadmap task
 */

const express = require('express');
const router = express.Router();
const youtubeService = require('../services/youtubeService');
const RoadmapTask = require('../models/RoadmapTask');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/youtube/resolve
 * @desc    Resolve the best embeddable YouTube masterclass for a skill/topic
 * @access  Public
 */
router.get('/resolve', async (req, res, next) => {
  try {
    const { skill, topic } = req.query;
    if (!skill && !topic) {
      return res.status(400).json({
        success: false,
        message: 'A skill or topic query parameter is required (e.g. ?skill=react).',
      });
    }

    const resolved = await youtubeService.resolveVideoForTask(skill || topic, topic || '');
    return res.status(200).json({
      success: true,
      data: resolved,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/youtube/search
 * @desc    Search YouTube videos with strict embeddability filters & cache
 * @access  Public
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, skill, maxResults } = req.query;
    const query = q || skill || 'computer science';

    const results = await youtubeService.searchYouTubeVideos(query, {
      skillName: skill,
      maxResults: parseInt(maxResults, 10) || 5,
    });

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/youtube/tasks/:taskId/switch-video
 * @desc    Persist student's chosen instructor video directly to RoadmapTask
 * @access  Private (Authenticated student)
 */
router.patch('/tasks/:taskId/switch-video', protect, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { videoId, videoTitle, channelTitle, videoUrl, thumbnailUrl } = req.body;

    if (!videoId || typeof videoId !== 'string' || videoId.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A valid YouTube videoId is required.',
      });
    }

    const task = await RoadmapTask.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap task not found.',
      });
    }

    const finalWatchUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`;
    const finalTitle = videoTitle || task.resource?.title || task.title;
    const finalProvider = channelTitle || task.resource?.provider || 'YouTube';

    task.resource = {
      ...(task.resource ? task.resource.toObject() : {}),
      title: finalTitle,
      url: finalWatchUrl,
      provider: finalProvider,
      mediaType: 'video',
      videoId,
      channelTitle: finalProvider,
      thumbnailUrl: thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };

    task.isVideoTask = true;
    await task.save();

    return res.status(200).json({
      success: true,
      message: `Course instructor switched to ${finalProvider}. Selection saved to roadmap.`,
      data: {
        task,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

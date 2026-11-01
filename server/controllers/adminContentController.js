/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * adminContentController.js — Curated Video Masterclasses Administration (Plan 43)
 *
 * Full lifecycle management of video masterclasses for the "Focus Video Chamber".
 * Strict URL allowlisting (YouTube only), soft-disable, and before/after audit tracking.
 * Disheera · Enterprise Administration Service
 */

const crypto = require('crypto');
const { prisma } = require('../config/prisma');

// YouTube URL parser & allowlist validator
const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})([&?].*)?$/;

function extractYouTubeId(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return null;
  const match = urlStr.trim().match(YOUTUBE_URL_REGEX);
  return match && match[5] && match[5].length === 11 ? match[5] : null;
}

/**
 * GET /api/admin/content/videos
 * Returns paginated, searchable curated masterclasses
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function listVideos(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const { skillName, search, status } = req.query;

    const caches = await prisma.youtubeCache.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    let allVideos = [];

    for (const cache of caches) {
      const currentSkill = cache.skillName || cache.queryKey.replace(/^skill:/, '');
      const rawVideos = Array.isArray(cache.videos) ? cache.videos : [];

      for (const v of rawVideos) {
        allVideos.push({
          id: cache.id,
          skillName: currentSkill,
          videoId: v.videoId,
          title: v.title || 'Masterclass',
          channelTitle: v.channelTitle || 'Unknown Channel',
          embedUrl: v.embedUrl || `https://www.youtube.com/embed/${v.videoId}`,
          watchUrl: v.watchUrl || `https://www.youtube.com/watch?v=${v.videoId}`,
          thumbnailUrl: v.thumbnailUrl || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          durationCategory: v.durationCategory || 'medium',
          language: v.language || 'English',
          instructor: v.instructor || v.channelTitle || '',
          isActive: v.isActive !== false,
          updatedAt: v.updatedAt || cache.updatedAt
        });
      }
    }

    // Filter by skillName
    if (skillName && skillName.trim()) {
      const s = skillName.trim().toLowerCase();
      allVideos = allVideos.filter(v => v.skillName.toLowerCase().includes(s));
    }

    // Filter by status (active vs disabled)
    if (status === 'active') {
      allVideos = allVideos.filter(v => v.isActive === true);
    } else if (status === 'disabled') {
      allVideos = allVideos.filter(v => v.isActive === false);
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allVideos = allVideos.filter(v =>
        v.title.toLowerCase().includes(q) ||
        v.channelTitle.toLowerCase().includes(q) ||
        v.skillName.toLowerCase().includes(q) ||
        (v.instructor && v.instructor.toLowerCase().includes(q))
      );
    }

    const total = allVideos.length;
    const paginated = allVideos.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      success: true,
      videos: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[AdminContentController.listVideos Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve curated masterclasses.'
    });
  }
}

/**
 * POST /api/admin/content/videos
 * Adds a new curated YouTube masterclass under a skill
 * Roles: ADMIN, SUPER_ADMIN
 */
async function addVideo(req, res) {
  try {
    // Strict input validation: reject unknown fields
    const allowedKeys = ['skillName', 'youtubeUrl', 'title', 'channelTitle', 'durationCategory', 'language', 'instructor'];
    const extraKeys = Object.keys(req.body).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'UNKNOWN_FIELDS',
        message: `Unknown fields not permitted: ${extraKeys.join(', ')}`
      });
    }

    const { skillName, youtubeUrl, title, channelTitle, durationCategory, language, instructor } = req.body;

    if (!skillName || typeof skillName !== 'string' || skillName.trim().length < 2 || skillName.trim().length > 50) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_SKILL_NAME',
        message: 'Skill name is required (2-50 characters).'
      });
    }

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_YOUTUBE_URL',
        message: 'A valid YouTube watch or embed URL is required (e.g., https://www.youtube.com/watch?v=bMknfKXIFA8).'
      });
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 150) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_TITLE',
        message: 'Title is required (3-150 characters).'
      });
    }

    if (!channelTitle || typeof channelTitle !== 'string' || channelTitle.trim().length < 2 || channelTitle.trim().length > 100) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_CHANNEL_TITLE',
        message: 'Channel title is required (2-100 characters).'
      });
    }

    const validDurations = ['short', 'medium', 'long'];
    const durCat = durationCategory ? durationCategory.toLowerCase().trim() : 'medium';
    if (!validDurations.includes(durCat)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_DURATION_CATEGORY',
        message: 'Duration category must be one of: short, medium, long.'
      });
    }

    const validLanguages = ['English', 'Hindi', 'Bilingual'];
    const lang = language ? language.trim() : 'English';
    if (!validLanguages.includes(lang)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_LANGUAGE',
        message: 'Language must be one of: English, Hindi, Bilingual.'
      });
    }

    if (instructor && (typeof instructor !== 'string' || instructor.trim().length > 100)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INSTRUCTOR',
        message: 'Instructor name cannot exceed 100 characters.'
      });
    }

    const normalizedSkill = skillName.trim().toLowerCase();
    const queryKey = `skill:${normalizedSkill}`;

    // Find or create YoutubeCache entry
    let cache = await prisma.youtubeCache.findUnique({
      where: { queryKey }
    });

    const newVideo = {
      videoId,
      title: title.trim(),
      channelTitle: channelTitle.trim(),
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      durationCategory: durCat,
      language: lang,
      instructor: instructor ? instructor.trim() : channelTitle.trim(),
      isActive: true,
      addedBy: req.admin.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let beforeVideos = [];
    let updatedVideos = [];

    if (cache) {
      beforeVideos = Array.isArray(cache.videos) ? cache.videos : [];
      if (beforeVideos.some(v => v.videoId === videoId)) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_VIDEO',
          message: `Video with ID ${videoId} already exists under skill ${normalizedSkill}.`
        });
      }
      updatedVideos = [...beforeVideos, newVideo];

      await prisma.$transaction([
        prisma.youtubeCache.update({
          where: { queryKey },
          data: { videos: updatedVideos }
        }),
        prisma.adminAuditLog.create({
          data: {
            adminId: req.admin.id,
            adminEmail: req.admin.email,
            action: 'VIDEO_ADD',
            targetType: 'COURSE',
            targetId: videoId,
            details: {
              skillName: normalizedSkill,
              videoId,
              before: null,
              after: newVideo
            },
            ipAddress: req.ip || null,
            userAgent: req.headers['user-agent'] || null
          }
        })
      ]);
    } else {
      updatedVideos = [newVideo];
      const newId = crypto.randomUUID();

      await prisma.$transaction([
        prisma.youtubeCache.create({
          data: {
            id: newId,
            queryKey,
            skillName: normalizedSkill,
            source: 'admin_curated',
            videos: updatedVideos
          }
        }),
        prisma.adminAuditLog.create({
          data: {
            adminId: req.admin.id,
            adminEmail: req.admin.email,
            action: 'VIDEO_ADD',
            targetType: 'COURSE',
            targetId: videoId,
            details: {
              skillName: normalizedSkill,
              videoId,
              before: null,
              after: newVideo
            },
            ipAddress: req.ip || null,
            userAgent: req.headers['user-agent'] || null
          }
        })
      ]);
    }

    return res.status(201).json({
      success: true,
      message: `Curated masterclass "${newVideo.title}" added under skill ${normalizedSkill}.`,
      video: newVideo
    });
  } catch (error) {
    console.error('[AdminContentController.addVideo Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add curated masterclass.'
    });
  }
}

/**
 * PATCH /api/admin/content/videos/:skillName/:videoId
 * Updates masterclass metadata or toggles isActive (soft-disable)
 * Roles: ADMIN, SUPER_ADMIN
 */
async function updateVideo(req, res) {
  try {
    const { skillName, videoId } = req.params;

    // Strict input validation: reject unknown fields
    const allowedKeys = ['title', 'channelTitle', 'durationCategory', 'language', 'instructor', 'isActive'];
    const extraKeys = Object.keys(req.body).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'UNKNOWN_FIELDS',
        message: `Unknown fields not permitted: ${extraKeys.join(', ')}`
      });
    }

    const normalizedSkill = skillName.trim().toLowerCase();
    const queryKey = `skill:${normalizedSkill}`;

    const cache = await prisma.youtubeCache.findUnique({
      where: { queryKey }
    });

    if (!cache) {
      return res.status(404).json({
        success: false,
        code: 'SKILL_CACHE_NOT_FOUND',
        message: `No video masterclasses found for skill ${normalizedSkill}.`
      });
    }

    const rawVideos = Array.isArray(cache.videos) ? cache.videos : [];
    const index = rawVideos.findIndex(v => v.videoId === videoId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        code: 'VIDEO_NOT_FOUND',
        message: `Video ${videoId} not found under skill ${normalizedSkill}.`
      });
    }

    const beforeVideo = { ...rawVideos[index] };
    const { title, channelTitle, durationCategory, language, instructor, isActive } = req.body;

    const afterVideo = { ...beforeVideo };

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 150) {
        return res.status(400).json({ success: false, code: 'INVALID_TITLE', message: 'Title must be 3-150 characters.' });
      }
      afterVideo.title = title.trim();
    }

    if (channelTitle !== undefined) {
      if (typeof channelTitle !== 'string' || channelTitle.trim().length < 2 || channelTitle.trim().length > 100) {
        return res.status(400).json({ success: false, code: 'INVALID_CHANNEL_TITLE', message: 'Channel title must be 2-100 characters.' });
      }
      afterVideo.channelTitle = channelTitle.trim();
    }

    if (durationCategory !== undefined) {
      const validDurations = ['short', 'medium', 'long'];
      const cat = durationCategory.toLowerCase().trim();
      if (!validDurations.includes(cat)) {
        return res.status(400).json({ success: false, code: 'INVALID_DURATION', message: 'Duration must be short, medium, or long.' });
      }
      afterVideo.durationCategory = cat;
    }

    if (language !== undefined) {
      const validLangs = ['English', 'Hindi', 'Bilingual'];
      if (!validLangs.includes(language.trim())) {
        return res.status(400).json({ success: false, code: 'INVALID_LANGUAGE', message: 'Language must be English, Hindi, or Bilingual.' });
      }
      afterVideo.language = language.trim();
    }

    if (instructor !== undefined) {
      if (typeof instructor !== 'string' || instructor.trim().length > 100) {
        return res.status(400).json({ success: false, code: 'INVALID_INSTRUCTOR', message: 'Instructor cannot exceed 100 characters.' });
      }
      afterVideo.instructor = instructor.trim();
    }

    if (isActive !== undefined) {
      afterVideo.isActive = Boolean(isActive);
    }

    afterVideo.updatedAt = new Date().toISOString();
    afterVideo.updatedBy = req.admin.email;

    rawVideos[index] = afterVideo;

    let action = 'VIDEO_UPDATE';
    if (beforeVideo.isActive !== afterVideo.isActive) {
      action = afterVideo.isActive ? 'VIDEO_ENABLE' : 'VIDEO_DISABLE';
    }

    await prisma.$transaction([
      prisma.youtubeCache.update({
        where: { queryKey },
        data: { videos: rawVideos }
      }),
      prisma.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          adminEmail: req.admin.email,
          action,
          targetType: 'COURSE',
          targetId: videoId,
          details: {
            skillName: normalizedSkill,
            videoId,
            before: beforeVideo,
            after: afterVideo
          },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: `Masterclass "${afterVideo.title}" updated successfully.`,
      video: afterVideo
    });
  } catch (error) {
    console.error('[AdminContentController.updateVideo Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update curated masterclass.'
    });
  }
}

/**
 * DELETE /api/admin/content/videos/:skillName/:videoId
 * Soft-disables by default (isActive: false)
 * Permanent delete requires SUPER_ADMIN and query ?permanent=true
 * Roles: ADMIN, SUPER_ADMIN
 */
async function deleteVideo(req, res) {
  try {
    const { skillName, videoId } = req.params;
    const isPermanent = req.query.permanent === 'true';

    const normalizedSkill = skillName.trim().toLowerCase();
    const queryKey = `skill:${normalizedSkill}`;

    const cache = await prisma.youtubeCache.findUnique({
      where: { queryKey }
    });

    if (!cache) {
      return res.status(404).json({
        success: false,
        code: 'SKILL_CACHE_NOT_FOUND',
        message: `No video masterclasses found for skill ${normalizedSkill}.`
      });
    }

    const rawVideos = Array.isArray(cache.videos) ? cache.videos : [];
    const index = rawVideos.findIndex(v => v.videoId === videoId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        code: 'VIDEO_NOT_FOUND',
        message: `Video ${videoId} not found under skill ${normalizedSkill}.`
      });
    }

    const targetVideo = rawVideos[index];

    if (isPermanent) {
      if (req.admin.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Permanent deletion requires SUPER_ADMIN role. Consider soft-disabling instead.'
        });
      }

      rawVideos.splice(index, 1);

      await prisma.$transaction([
        prisma.youtubeCache.update({
          where: { queryKey },
          data: { videos: rawVideos }
        }),
        prisma.adminAuditLog.create({
          data: {
            adminId: req.admin.id,
            adminEmail: req.admin.email,
            action: 'VIDEO_DELETE_PERMANENT',
            targetType: 'COURSE',
            targetId: videoId,
            details: {
              skillName: normalizedSkill,
              videoId,
              before: targetVideo,
              after: null
            },
            ipAddress: req.ip || null,
            userAgent: req.headers['user-agent'] || null
          }
        })
      ]);

      return res.status(200).json({
        success: true,
        message: `Video ${videoId} permanently deleted from ${normalizedSkill}.`
      });
    }

    // Default: Soft-disable
    targetVideo.isActive = false;
    targetVideo.updatedAt = new Date().toISOString();
    targetVideo.disabledBy = req.admin.email;
    rawVideos[index] = targetVideo;

    await prisma.$transaction([
      prisma.youtubeCache.update({
        where: { queryKey },
        data: { videos: rawVideos }
      }),
      prisma.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          adminEmail: req.admin.email,
          action: 'VIDEO_DISABLE',
          targetType: 'COURSE',
          targetId: videoId,
          details: {
            skillName: normalizedSkill,
            videoId,
            before: { ...targetVideo, isActive: true },
            after: targetVideo
          },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: `Video "${targetVideo.title}" has been soft-disabled.`,
      video: targetVideo
    });
  } catch (error) {
    console.error('[AdminContentController.deleteVideo Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to disable masterclass.'
    });
  }
}

module.exports = {
  listVideos,
  addVideo,
  updateVideo,
  deleteVideo
};

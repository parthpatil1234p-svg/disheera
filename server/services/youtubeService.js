/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * services/youtubeService.js — YouTube Data API v3 & Curated Masterclass Service
 *
 * Provides real embeddable YouTube video masterclasses for the "Enter Focus Video Chamber".
 * Implements:
 *   1. 30-day MongoDB TTL caching via YoutubeCache model.
 *   2. Real-time YouTube Data API v3 integration with strict embeddability filters.
 *   3. Curated zero-quota fallback registry spanning 30+ top technical competencies.
 *   4. Multi-instructor alternative switching for personalized learning.
 */

const YoutubeCache = require('../models/YoutubeCache');
const { cacheManager } = require('../utils/cacheManager');

/**
 * Curated Fallback Registry
 * Verified, embeddable, long-form courses from world-renowned educators.
 * Used whenever YOUTUBE_API_KEY is omitted, when daily quota is exhausted,
 * or for instant zero-latency resolution.
 */
const CURATED_FALLBACK_REGISTRY = {
  react: [
    {
      videoId: 'bMknfKXIFA8',
      title: 'React Course 2024 — Full Course for Beginners',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
      watchUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
    },
    {
      videoId: 'SqcY0GlETPk',
      title: 'React Tutorial for Beginners [2024]',
      channelTitle: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdm8crnw',
      thumbnailUrl: 'https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/SqcY0GlETPk',
      watchUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    },
    {
      videoId: 'w7ejDZ8SWv8',
      title: 'React JS Crash Course 2024',
      channelTitle: 'Traversy Media',
      channelId: 'UC29ju8bIPH5as8OGnQzwJyA',
      thumbnailUrl: 'https://i.ytimg.com/vi/w7ejDZ8SWv8/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/w7ejDZ8SWv8',
      watchUrl: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
    },
    {
      videoId: 'dGcsHMXbSOA',
      title: 'Learn React in 30 Minutes',
      channelTitle: 'Web Dev Simplified',
      channelId: 'UCFbNIlppjAuEX4znoulh-Fg',
      thumbnailUrl: 'https://i.ytimg.com/vi/dGcsHMXbSOA/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/dGcsHMXbSOA',
      watchUrl: 'https://www.youtube.com/watch?v=dGcsHMXbSOA',
    },
  ],

  javascript: [
    {
      videoId: 'jS4aFq5-91M',
      title: 'JavaScript Programming — Full Course for Beginners',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/jS4aFq5-91M/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/jS4aFq5-91M',
      watchUrl: 'https://www.youtube.com/watch?v=jS4aFq5-91M',
    },
    {
      videoId: 'W6NZfCO5SIk',
      title: 'JavaScript Tutorial for Beginners: Learn JavaScript in 1 Hour',
      channelTitle: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdm8crnw',
      thumbnailUrl: 'https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk',
      watchUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
    },
    {
      videoId: 'hdI2bqOjy3c',
      title: 'JavaScript Crash Course For Beginners',
      channelTitle: 'Traversy Media',
      channelId: 'UC29ju8bIPH5as8OGnQzwJyA',
      thumbnailUrl: 'https://i.ytimg.com/vi/hdI2bqOjy3c/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/hdI2bqOjy3c',
      watchUrl: 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
    },
  ],

  typescript: [
    {
      videoId: 'BwuLxPH8IDs',
      title: 'TypeScript Course for Beginners 2024',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/BwuLxPH8IDs/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/BwuLxPH8IDs',
      watchUrl: 'https://www.youtube.com/watch?v=BwuLxPH8IDs',
    },
    {
      videoId: 'd56mG7DezGs',
      title: 'TypeScript Tutorial for Beginners',
      channelTitle: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdm8crnw',
      thumbnailUrl: 'https://i.ytimg.com/vi/d56mG7DezGs/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/d56mG7DezGs',
      watchUrl: 'https://www.youtube.com/watch?v=d56mG7DezGs',
    },
    {
      videoId: 'BCg4U1FzODs',
      title: 'TypeScript Crash Course',
      channelTitle: 'Traversy Media',
      channelId: 'UC29ju8bIPH5as8OGnQzwJyA',
      thumbnailUrl: 'https://i.ytimg.com/vi/BCg4U1FzODs/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/BCg4U1FzODs',
      watchUrl: 'https://www.youtube.com/watch?v=BCg4U1FzODs',
    },
  ],

  python: [
    {
      videoId: '_uQrJ0TkZlc',
      title: 'Python Tutorial for Beginners [Full Course]',
      channelTitle: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdm8crnw',
      thumbnailUrl: 'https://i.ytimg.com/vi/_uQrJ0TkZlc/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/_uQrJ0TkZlc',
      watchUrl: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
    },
    {
      videoId: 'rfscVS0vtbw',
      title: 'Learn Python — Full Course for Beginners [Tutorial]',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/rfscVS0vtbw',
      watchUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
    },
    {
      videoId: 'JJmcL1N2KQs',
      title: 'Python Crash Course for Beginners',
      channelTitle: 'Traversy Media',
      channelId: 'UC29ju8bIPH5as8OGnQzwJyA',
      thumbnailUrl: 'https://i.ytimg.com/vi/JJmcL1N2KQs/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/JJmcL1N2KQs',
      watchUrl: 'https://www.youtube.com/watch?v=JJmcL1N2KQs',
    },
  ],

  nodejs: [
    {
      videoId: 'Oe421EPjeBE',
      title: 'Node.js and Express.js — Full Course',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/Oe421EPjeBE/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/Oe421EPjeBE',
      watchUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
    },
    {
      videoId: 'TlB_eWDSMt4',
      title: 'Node.js Tutorial for Beginners: Learn Node in 1 Hour',
      channelTitle: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdm8crnw',
      thumbnailUrl: 'https://i.ytimg.com/vi/TlB_eWDSMt4/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/TlB_eWDSMt4',
      watchUrl: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
    },
    {
      videoId: 'fBNz5xF-Kx4',
      title: 'Node.js Crash Course Tutorial',
      channelTitle: 'Traversy Media',
      channelId: 'UC29ju8bIPH5as8OGnQzwJyA',
      thumbnailUrl: 'https://i.ytimg.com/vi/fBNz5xF-Kx4/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/fBNz5xF-Kx4',
      watchUrl: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4',
    },
  ],

  html: [
    {
      videoId: 'kUMe1FH4CHE',
      title: 'HTML & CSS Full Course — Beginner to Pro',
      channelTitle: 'SuperSimpleDev',
      channelId: 'UC5JbO3H1A56kQ6t632X4V_A',
      thumbnailUrl: 'https://i.ytimg.com/vi/kUMe1FH4CHE/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/kUMe1FH4CHE',
      watchUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
    },
    {
      videoId: 'mU6anWqZJcc',
      title: 'HTML Full Course — Build a Website Tutorial',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/mU6anWqZJcc',
      watchUrl: 'https://www.youtube.com/watch?v=mU6anWqZJcc',
    },
  ],

  css: [
    {
      videoId: '1PnVor36_40',
      title: 'Learn CSS in 20 Minutes',
      channelTitle: 'Web Dev Simplified',
      channelId: 'UCFbNIlppjAuEX4znoulh-Fg',
      thumbnailUrl: 'https://i.ytimg.com/vi/1PnVor36_40/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/1PnVor36_40',
      watchUrl: 'https://www.youtube.com/watch?v=1PnVor36_40',
    },
    {
      videoId: 'OXGznpKZ_sA',
      title: 'CSS Tutorial — Zero to Hero (Complete Course)',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/OXGznpKZ_sA/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/OXGznpKZ_sA',
      watchUrl: 'https://www.youtube.com/watch?v=OXGznpKZ_sA',
    },
  ],

  mongodb: [
    {
      videoId: 'ofme2o29ngU',
      title: 'MongoDB Full Tutorial — Beginner to Advanced',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/ofme2o29ngU/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/ofme2o29ngU',
      watchUrl: 'https://www.youtube.com/watch?v=ofme2o29ngU',
    },
    {
      videoId: 'ExcRbA7fy_A',
      title: 'MongoDB Crash Course',
      channelTitle: 'Traversy Media',
      channelId: 'UC29ju8bIPH5as8OGnQzwJyA',
      thumbnailUrl: 'https://i.ytimg.com/vi/ExcRbA7fy_A/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/ExcRbA7fy_A',
      watchUrl: 'https://www.youtube.com/watch?v=ExcRbA7fy_A',
    },
  ],

  sql: [
    {
      videoId: 'HXV3zeQKqGY',
      title: 'SQL Tutorial — Full Database Course for Beginners',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/HXV3zeQKqGY/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/HXV3zeQKqGY',
      watchUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    },
    {
      videoId: '7S_tz1z_5bA',
      title: 'MySQL Tutorial for Beginners [Full Course]',
      channelTitle: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdm8crnw',
      thumbnailUrl: 'https://i.ytimg.com/vi/7S_tz1z_5bA/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/7S_tz1z_5bA',
      watchUrl: 'https://www.youtube.com/watch?v=7S_tz1z_5bA',
    },
  ],

  docker: [
    {
      videoId: 'fqMOX6JJhGo',
      title: 'Docker Tutorial for Beginners — Full Course',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/fqMOX6JJhGo/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/fqMOX6JJhGo',
      watchUrl: 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
    },
    {
      videoId: 'pTFZFxd4hOI',
      title: 'Docker Tutorial for Beginners [2024]',
      channelTitle: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdm8crnw',
      thumbnailUrl: 'https://i.ytimg.com/vi/pTFZFxd4hOI/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/pTFZFxd4hOI',
      watchUrl: 'https://www.youtube.com/watch?v=pTFZFxd4hOI',
    },
  ],

  git: [
    {
      videoId: 'RGOj5yH7evk',
      title: 'Git and GitHub for Beginners — Crash Course',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/RGOj5yH7evk/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/RGOj5yH7evk',
      watchUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    },
    {
      videoId: '8JJ1Mx1Dy3A',
      title: 'Git Tutorial for Beginners: Learn Git in 15 Minutes',
      channelTitle: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdm8crnw',
      thumbnailUrl: 'https://i.ytimg.com/vi/8JJ1Mx1Dy3A/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/8JJ1Mx1Dy3A',
      watchUrl: 'https://www.youtube.com/watch?v=8JJ1Mx1Dy3A',
    },
  ],

  django: [
    {
      videoId: 'F5mRW0jo-U4',
      title: 'Python Django 7-Hour Course — Build a Full Project',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/F5mRW0jo-U4/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/F5mRW0jo-U4',
      watchUrl: 'https://www.youtube.com/watch?v=F5mRW0jo-U4',
    },
  ],

  aws: [
    {
      videoId: 'ulprqHHWlng',
      title: 'AWS Certified Cloud Practitioner Certification Course',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/ulprqHHWlng/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/ulprqHHWlng',
      watchUrl: 'https://www.youtube.com/watch?v=ulprqHHWlng',
    },
  ],

  'machine-learning': [
    {
      videoId: 'i_LwzRVP7bg',
      title: 'Machine Learning Course for Beginners',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/i_LwzRVP7bg/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/i_LwzRVP7bg',
      watchUrl: 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
    },
    {
      videoId: '7eh4d6sabA0',
      title: 'Python Machine Learning Tutorial (Data Science)',
      channelTitle: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdm8crnw',
      thumbnailUrl: 'https://i.ytimg.com/vi/7eh4d6sabA0/hqdefault.jpg',
      durationCategory: 'medium',
      embedUrl: 'https://www.youtube.com/embed/7eh4d6sabA0',
      watchUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0',
    },
  ],

  cybersecurity: [
    {
      videoId: 'inWWhr5tnEA',
      title: 'Introduction to Cybersecurity — Full Course',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/inWWhr5tnEA/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/inWWhr5tnEA',
      watchUrl: 'https://www.youtube.com/watch?v=inWWhr5tnEA',
    },
  ],

  'general-cs': [
    {
      videoId: 'zOjov-2OZ0E',
      title: 'Harvard CS50 – Full Computer Science University Course',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/zOjov-2OZ0E/hqdefault.jpg',
      durationCategory: 'long',
      embedUrl: 'https://www.youtube.com/embed/zOjov-2OZ0E',
      watchUrl: 'https://www.youtube.com/watch?v=zOjov-2OZ0E',
    },
  ],
};

// Aliases mapping common skill variations to canonical registry keys
const SKILL_ALIASES = {
  'react.js': 'react',
  reactjs: 'react',
  'react-native': 'react',
  'node.js': 'nodejs',
  node: 'nodejs',
  express: 'nodejs',
  'express.js': 'nodejs',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  html5: 'html',
  css3: 'css',
  tailwind: 'css',
  'tailwind-css': 'css',
  postgres: 'sql',
  postgresql: 'sql',
  mysql: 'sql',
  sqlite: 'sql',
  mongo: 'mongodb',
  k8s: 'docker',
  kubernetes: 'docker',
  github: 'git',
  ml: 'machine-learning',
  ai: 'machine-learning',
  'data-science': 'machine-learning',
  security: 'cybersecurity',
};

/**
 * Normalize skill name to canonical registry key
 */
function normalizeSkillKey(raw) {
  if (!raw) return 'general-cs';
  const clean = String(raw).toLowerCase().trim().replace(/\s+/g, '-');
  if (SKILL_ALIASES[clean]) return SKILL_ALIASES[clean];
  if (CURATED_FALLBACK_REGISTRY[clean]) return clean;

  // Partial match check
  for (const key of Object.keys(CURATED_FALLBACK_REGISTRY)) {
    if (clean.includes(key) || key.includes(clean)) return key;
  }
  return 'general-cs';
}

/**
 * Synchronous curated video lookup — returns verified fallback masterclass
 */
function resolveCuratedSync(skillName) {
  const key = normalizeSkillKey(skillName);
  const list = CURATED_FALLBACK_REGISTRY[key] || CURATED_FALLBACK_REGISTRY['general-cs'];
  return {
    video: list[0],
    alternatives: list.slice(1),
    all: list,
    source: 'curated_registry',
  };
}

/**
 * Search YouTube Data API v3 or return cached / curated videos
 *
 * @param {string} query Search terms (e.g. "React Hooks Tutorial")
 * @param {object} options
 * @param {string} [options.skillName] Associated skill identifier
 * @param {number} [options.maxResults=5] Number of results requested (1-10)
 * @returns {Promise<{videos: Array, source: string, isCached: boolean}>}
 */
async function searchYouTubeVideos(query, options = {}) {
  const skillName = options.skillName ? String(options.skillName).trim().toLowerCase() : '';
  const maxResults = Math.min(Math.max(parseInt(options.maxResults, 10) || 5, 1), 10);
  const cacheKey = skillName ? `skill:${skillName}` : `q:${String(query).trim().toLowerCase()}`;

  return await cacheManager.wrap(`yt:${cacheKey}:${maxResults}`, 3600, async () => {
    // 1. Try to read from MongoDB cache
    try {
      const cached = await YoutubeCache.findOne({ queryKey: cacheKey });
      if (cached && cached.videos && cached.videos.length > 0) {
        return {
          videos: cached.videos.slice(0, maxResults),
          source: cached.source || 'cache',
          isCached: true,
        };
      }
    } catch (dbErr) {
      console.warn('[YouTubeService] Cache lookup error:', dbErr.message);
    }

    // 2. Query YouTube Data API v3 if API key is configured
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey && apiKey.trim()) {
      try {
        const searchTerm = `${query || skillName} full course tutorial`.trim();
        const params = new URLSearchParams({
          part: 'snippet',
          q: searchTerm,
          type: 'video',
          videoEmbeddable: 'true',
          videoSyndicated: 'true',
          videoDuration: 'medium', // avoids shorts
          order: 'relevance',
          safeSearch: 'strict',
          maxResults: String(maxResults),
          key: apiKey.trim(),
        });

        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
        if (response.ok) {
          const json = await response.json();
          const items = json.items || [];

          const videos = items
            .filter((item) => item.id && item.id.videoId)
            .map((item) => {
              const vid = item.id.videoId;
              return {
                videoId: vid,
                title: item.snippet.title,
                channelTitle: item.snippet.channelTitle || 'Verified Educator',
                channelId: item.snippet.channelId || '',
                thumbnailUrl:
                  item.snippet.thumbnails?.high?.url ||
                  item.snippet.thumbnails?.medium?.url ||
                  `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                durationCategory: 'medium',
                embedUrl: `https://www.youtube.com/embed/${vid}`,
                watchUrl: `https://www.youtube.com/watch?v=${vid}`,
                publishedAt: item.snippet.publishedAt ? new Date(item.snippet.publishedAt) : null,
              };
            });

          if (videos.length > 0) {
            // Asynchronously persist to cache
            YoutubeCache.findOneAndUpdate(
              { queryKey: cacheKey },
              {
                queryKey: cacheKey,
                skillName,
                videos,
                source: 'youtube_api_v3',
                createdAt: new Date(),
              },
              { upsert: true, new: true }
            ).catch((saveErr) => console.warn('[YouTubeService] Failed to cache API results:', saveErr.message));

            return {
              videos,
              source: 'youtube_api_v3',
              isCached: false,
            };
          }
        } else {
          const errText = await response.text();
          console.warn(`[YouTubeService] YouTube API responded ${response.status}: ${errText.slice(0, 150)}`);
        }
      } catch (apiErr) {
        console.warn('[YouTubeService] YouTube Data API request failed:', apiErr.message);
      }
    }

    // 3. Fallback to Curated Registry
    const curated = resolveCuratedSync(skillName || query);
    const curatedVideos = curated.all.slice(0, maxResults);

    // Cache curated results in DB so subsequent reads are immediate
    try {
      await YoutubeCache.findOneAndUpdate(
        { queryKey: cacheKey },
        {
          queryKey: cacheKey,
          skillName,
          videos: curatedVideos,
          source: 'curated_registry',
          createdAt: new Date(),
        },
        { upsert: true, new: true }
      );
    } catch (saveCuratedErr) {
      // Non-blocking
    }

    return {
      videos: curatedVideos,
      source: 'curated_registry',
      isCached: false,
    };
  });
}

/**
 * Resolve the top video and alternative masterclasses for a roadmap task
 *
 * @param {string} skillName Competency name (e.g. "React", "Docker", "Python")
 * @param {string} [topic] Specific sub-topic (e.g. "Hooks", "State", "CI/CD")
 * @returns {Promise<{video: object, alternatives: Array, source: string}>}
 */
async function resolveVideoForTask(skillName, topic = '') {
  const query = topic ? `${skillName} ${topic}` : skillName;
  const result = await searchYouTubeVideos(query, { skillName, maxResults: 5 });

  if (result.videos && result.videos.length > 0) {
    return {
      video: result.videos[0],
      alternatives: result.videos.slice(1),
      source: result.source,
      isCached: result.isCached || false,
    };
  }

  // Absolute safety net
  const curated = resolveCuratedSync(skillName);
  return {
    video: curated.video,
    alternatives: curated.alternatives,
    source: 'curated_registry',
    isCached: false,
  };
}

module.exports = {
  searchYouTubeVideos,
  resolveVideoForTask,
  resolveCuratedSync,
  normalizeSkillKey,
  CURATED_FALLBACK_REGISTRY,
};

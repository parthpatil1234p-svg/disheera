/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * sync_video_tasks.js
 * Retrofits introductory and 'learn' tasks on existing active roadmaps with video links and isVideoTask: true.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const RoadmapTask = require('../models/RoadmapTask');

const VIDEO_SKILL_MAP = {
  html: { url: 'https://www.youtube.com/watch?v=mU6anWqZJcc', title: 'HTML & CSS Crash Course for Beginners', provider: 'freeCodeCamp (YouTube)' },
  css: { url: 'https://www.youtube.com/watch?v=mU6anWqZJcc', title: 'HTML & CSS Crash Course for Beginners', provider: 'freeCodeCamp (YouTube)' },
  javascript: { url: 'https://www.youtube.com/watch?v=5fb2aPlgoys', title: 'JavaScript DOM Manipulation - Full Tutorial', provider: 'freeCodeCamp (YouTube)' },
  git: { url: 'https://www.youtube.com/watch?v=RGOj5yH7evk', title: 'Git and GitHub for Beginners - Crash Course', provider: 'freeCodeCamp (YouTube)' },
  react: { url: 'https://www.youtube.com/watch?v=bMknfKXIFA8', title: 'React 18 Full Course for Beginners', provider: 'freeCodeCamp (YouTube)' },
  'node.js': { url: 'https://www.youtube.com/watch?v=Oe421EPjeBE', title: 'Node.js and Express.js - Full Course', provider: 'freeCodeCamp (YouTube)' },
  mongodb: { url: 'https://www.youtube.com/watch?v=ofme2o29ngU', title: 'MongoDB Full Tutorial for Beginners', provider: 'freeCodeCamp (YouTube)' },
  sql: { url: 'https://www.youtube.com/watch?v=HXV3zeRR3h4', title: 'SQL Tutorial - Full Database Course for Beginners', provider: 'freeCodeCamp (YouTube)' },
  figma: { url: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', title: 'Figma UI UX Design Essentials Full Course', provider: 'freeCodeCamp (YouTube)' },
  networking: { url: 'https://www.youtube.com/watch?v=IPvYjXCsTg8', title: 'Computer Networking Full Course for Beginners', provider: 'freeCodeCamp (YouTube)' },
  'owasp-basics': { url: 'https://www.youtube.com/watch?v=inWWhr5tnEA', title: 'Web Security & OWASP Top 10 Full Tutorial', provider: 'freeCodeCamp (YouTube)' },
  excel: { url: 'https://www.youtube.com/watch?v=Vl0H-qTclOg', title: 'Excel Tutorial for Beginners - Full Course', provider: 'freeCodeCamp (YouTube)' },
  python: { url: 'https://www.youtube.com/watch?v=LHBE6Q9XlzI', title: 'Python for Data Science - Full Course', provider: 'freeCodeCamp (YouTube)' },
};

async function sync() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const tasks = await RoadmapTask.find({ type: 'learn' });
  console.log(`Found ${tasks.length} 'learn' tasks to evaluate.`);

  let updatedCount = 0;
  for (const t of tasks) {
    const skillKey = (t.skillName || '').toLowerCase().trim();
    const videoInfo = VIDEO_SKILL_MAP[skillKey] || {
      url: 'https://www.youtube.com/watch?v=mU6anWqZJcc',
      title: `${t.title} Video Guide`,
      provider: 'freeCodeCamp (YouTube)',
    };

    t.isVideoTask = true;
    t.videoDurationSeconds = t.videoDurationSeconds || 600;
    t.resource = {
      ...(t.resource || {}),
      url: videoInfo.url,
      title: videoInfo.title,
      provider: videoInfo.provider,
      mediaType: 'video',
    };

    await t.save();
    updatedCount++;
  }

  console.log(`Successfully synced ${updatedCount} video tasks.`);
  await mongoose.disconnect();
}

sync().catch(err => {
  console.error('Error syncing video tasks:', err);
  process.exit(1);
});

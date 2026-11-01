/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * clean_video_tasks.js
 * Sanitizes existing roadmap tasks in MongoDB to remove video guide flags, YouTube links,
 * and resets all tasks to clean documentation/reading tasks.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const RoadmapTask = require('../models/RoadmapTask');

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const tasks = await RoadmapTask.find({
    $or: [
      { isVideoTask: true },
      { 'resource.mediaType': 'video' },
      { 'resource.url': /youtube\.com|youtu\.be/i },
      { title: /video guide/i },
      { 'resource.title': /video/i }
    ]
  });

  console.log(`Found ${tasks.length} tasks to sanitize.`);

  let updatedCount = 0;
  for (const t of tasks) {
    t.isVideoTask = false;
    t.videoDurationSeconds = 0;
    t.videoWatchTimeSeconds = 0;
    t.videoMaxWatchedTime = 0;
    t.videoMidCheckPassed = false;
    t.isVideoVerified = false;

    // Clean title if it contains "Video Guide"
    if (t.title && /video guide/i.test(t.title)) {
      t.title = t.title.replace(/\s*video guide/gi, ' Comprehensive Guide');
    }

    const sName = t.skillName || 'Development';
    const isYt = t.resource?.url && (/youtube\.com|youtu\.be/i.test(t.resource.url));

    t.resource = {
      ...(t.resource || {}),
      mediaType: 'doc',
      url: isYt ? `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(sName)}` : (t.resource?.url || 'https://developer.mozilla.org'),
      title: isYt ? `${sName} Official Documentation & Architecture Guide` : (t.resource?.title || `${t.title} Guide`),
      provider: isYt ? 'Official Documentation & MDN' : (t.resource?.provider || 'Official DevDocs & MDN'),
    };

    delete t.resource.videoId;
    delete t.resource.channelTitle;
    delete t.resource.thumbnailUrl;

    await t.save();
    updatedCount++;
  }

  console.log(`Successfully sanitized ${updatedCount} tasks in MongoDB.`);
  await mongoose.disconnect();
}

clean().catch(err => {
  console.error('Error cleaning tasks:', err);
  process.exit(1);
});

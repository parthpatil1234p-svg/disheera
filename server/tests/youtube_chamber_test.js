/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/youtube_chamber_test.js
 * Comprehensive automated test suite for YouTube Data API v3 integration,
 * curated masterclass resolution, MongoDB TTL cache, and instructor switching.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const YoutubeCache = require('../models/YoutubeCache');
const RoadmapTask = require('../models/RoadmapTask');
const youtubeService = require('../services/youtubeService');

async function runTestSuite() {
  console.log('==================================================================');
  console.log('🚀 RUNNING FOCUS VIDEO CHAMBER YOUTUBE v3 TEST SUITE');
  console.log('==================================================================\n');

  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ [DB] Connected to MongoDB Atlas');
  } else {
    console.warn('⚠️ [DB] MONGODB_URI not detected in environment, skipping DB-dependent checks');
  }

  // -------------------------------------------------------------
  // Test 1: Synchronous Curated Fallback Resolution for Core Competencies
  // -------------------------------------------------------------
  console.log('\n--- 1. Curated Fallback Masterclass Resolution ---');
  const skillsToTest = ['react', 'python', 'docker', 'nodejs', 'mongodb', 'cybersecurity'];
  for (const skill of skillsToTest) {
    const res = youtubeService.resolveCuratedSync(skill);
    if (!res || !res.video || !res.video.videoId) {
      throw new Error(`Failed to resolve curated video for skill: ${skill}`);
    }
    console.log(`✓ [${skill}] Video ID: ${res.video.videoId} | Channel: "${res.video.channelTitle}" | Title: "${res.video.title.slice(0, 45)}..."`);
    if (!res.alternatives || res.alternatives.length === 0) {
      console.warn(`  ↳ Notice: only 1 video registered for ${skill}`);
    } else {
      console.log(`  ↳ Found ${res.alternatives.length} alternative educators for switcher drawer`);
    }
  }

  // -------------------------------------------------------------
  // Test 2: Skill Alias Normalization
  // -------------------------------------------------------------
  console.log('\n--- 2. Skill Alias Normalization ---');
  const aliasTests = [
    { input: 'react.js', expected: 'react' },
    { input: 'express', expected: 'nodejs' },
    { input: 'k8s', expected: 'docker' },
    { input: 'postgresql', expected: 'sql' },
    { input: 'unknown-random-topic', expected: 'general-cs' },
  ];
  for (const t of aliasTests) {
    const key = youtubeService.normalizeSkillKey(t.input);
    if (key !== t.expected) {
      throw new Error(`Alias normalization failed for "${t.input}". Expected "${t.expected}", got "${key}"`);
    }
    console.log(`✓ Normalized "${t.input}" -> "${key}"`);
  }

  // -------------------------------------------------------------
  // Test 3: YoutubeCache Persistence & Cache Hits
  // -------------------------------------------------------------
  if (mongoose.connection.readyState === 1) {
    console.log('\n--- 3. YoutubeCache TTL Cache Integrity ---');
    const testKey = 'skill:test-react-cache';
    await YoutubeCache.deleteOne({ queryKey: testKey });

    const dummyVideos = [
      {
        videoId: 'bMknfKXIFA8',
        title: 'React Course 2024 — Full Course for Beginners',
        channelTitle: 'freeCodeCamp.org',
        thumbnailUrl: 'https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg',
        durationCategory: 'long',
        embedUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
        watchUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
      },
    ];

    const cachedDoc = await YoutubeCache.create({
      queryKey: testKey,
      skillName: 'test-react-cache',
      videos: dummyVideos,
      source: 'curated_registry',
    });
    console.log(`✓ Successfully saved cache record with ID: ${cachedDoc._id}`);

    const fetchedDoc = await YoutubeCache.findOne({ queryKey: testKey });
    if (!fetchedDoc || fetchedDoc.videos.length !== 1 || fetchedDoc.videos[0].videoId !== 'bMknfKXIFA8') {
      throw new Error('Cache lookup failed or data corrupted');
    }
    console.log('✓ Successfully retrieved cached record from MongoDB');

    // Clean up test document
    await YoutubeCache.deleteOne({ queryKey: testKey });
    console.log('✓ Cleaned up test cache record');
  }

  // -------------------------------------------------------------
  // Test 4: Dynamic Resolution Service (`resolveVideoForTask`)
  // -------------------------------------------------------------
  console.log('\n--- 4. Task Video Resolution (`resolveVideoForTask`) ---');
  const taskRes = await youtubeService.resolveVideoForTask('react', 'Hooks & State Management');
  if (!taskRes || !taskRes.video || !taskRes.video.videoId) {
    throw new Error('resolveVideoForTask failed to return a video object');
  }
  console.log(`✓ Resolved Video: "${taskRes.video.title}"`);
  console.log(`✓ Video ID: ${taskRes.video.videoId} (${taskRes.video.watchUrl})`);
  console.log(`✓ Instructor: ${taskRes.video.channelTitle}`);
  console.log(`✓ Source: ${taskRes.source} (isCached: ${Boolean(taskRes.isCached)})`);
  console.log(`✓ Total Alternatives: ${taskRes.alternatives.length}`);

  // -------------------------------------------------------------
  // Test 5: Instructor Switch Persistence on RoadmapTask
  // -------------------------------------------------------------
  if (mongoose.connection.readyState === 1) {
    console.log('\n--- 5. RoadmapTask Instructor Switching & Persistence ---');
    let sampleTask = await RoadmapTask.findOne();
    if (!sampleTask) {
      console.log('⚠️ No existing RoadmapTask found in database. Skipping task switch test.');
    } else {
      const originalUrl = sampleTask.resource?.url;
      const originalChannel = sampleTask.resource?.channelTitle;

      // Simulate switching instructor to "Programming with Mosh"
      const newVideo = {
        videoId: 'SqcY0GlETPk',
        title: 'React Tutorial for Beginners [2024]',
        channelTitle: 'Programming with Mosh',
        thumbnailUrl: 'https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg',
      };

      sampleTask.resource = {
        ...(sampleTask.resource ? sampleTask.resource.toObject() : {}),
        title: newVideo.title,
        url: `https://www.youtube.com/watch?v=${newVideo.videoId}`,
        provider: newVideo.channelTitle,
        mediaType: 'video',
        videoId: newVideo.videoId,
        channelTitle: newVideo.channelTitle,
        thumbnailUrl: newVideo.thumbnailUrl,
      };
      sampleTask.isVideoTask = true;
      await sampleTask.save();

      // Reload from DB to verify persistence
      const reloadedTask = await RoadmapTask.findById(sampleTask._id);
      if (
        reloadedTask.resource.videoId !== newVideo.videoId ||
        reloadedTask.resource.channelTitle !== newVideo.channelTitle
      ) {
        throw new Error('Task resource failed to persist switched instructor video');
      }
      console.log(`✓ Task [${sampleTask._id}] successfully switched:`);
      console.log(`  • Title: ${reloadedTask.resource.title}`);
      console.log(`  • Provider/Channel: ${reloadedTask.resource.channelTitle}`);
      console.log(`  • VideoId: ${reloadedTask.resource.videoId}`);
      console.log(`  • URL: ${reloadedTask.resource.url}`);

      // Restore original state if existed
      if (originalUrl) {
        sampleTask.resource.url = originalUrl;
        sampleTask.resource.channelTitle = originalChannel;
        await sampleTask.save();
      }
    }
  }

  console.log('\n==================================================================');
  console.log('🎉 ALL FOCUS VIDEO CHAMBER YOUTUBE v3 TESTS PASSED PERFECTLY!');
  console.log('==================================================================\n');

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});

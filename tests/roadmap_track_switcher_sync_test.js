/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/roadmap_track_switcher_sync_test.js
 * 
 * Verifies that GET /api/roadmaps/current returns perfectly synchronized
 * progress percentages across roadmap and activeRoadmaps objects.
 */

const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const http = require('http');
const jwt = require('jsonwebtoken');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTest() {
  console.log('================================================================');
  console.log('🧪 VERIFYING ROADMAP & TRACK SWITCHER PROGRESS SYNCHRONIZATION');
  console.log('================================================================');

  const JWT_SECRET = process.env.JWT_SECRET || 'careerpath_secret_jwt_key_2024_secure';
  
  // Test with user having 17% progress
  const userPayload = {
    id: '6abf95d36f06213c5c355e49',
    _id: '6abf95d36f06213c5c355e49',
    role: 'student',
    email: 'pawarsuyog396@gmail.com'
  };
  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1d' });

  const res = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/roadmaps/current',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (res.status !== 200 || !res.data?.data) {
    console.error('❌ Failed to fetch current roadmap:', res);
    process.exit(1);
  }

  const { roadmap, activeRoadmaps } = res.data.data;
  console.log(`[Step 1] Roadmap Title: ${roadmap.career?.title}`);
  console.log(`         Roadmap Progress: ${roadmap.progressPercentage}%`);
  console.log(`         Tasks Completed: ${roadmap.completedTasksCount || roadmap.completedTasks} / ${roadmap.totalTasksCount || roadmap.totalTasks}`);

  if (!activeRoadmaps || activeRoadmaps.length === 0) {
    console.error('❌ activeRoadmaps array is empty!');
    process.exit(1);
  }

  const activeTrack = activeRoadmaps[0];
  console.log(`[Step 2] Active Track Switcher Tab: Track 1: ${activeTrack.career?.title} (${activeTrack.progressPercentage}%)`);

  if (roadmap.progressPercentage !== activeTrack.progressPercentage) {
    console.error(`❌ Mismatch detected! roadmap.progressPercentage (${roadmap.progressPercentage}%) !== activeTrack.progressPercentage (${activeTrack.progressPercentage}%)`);
    process.exit(1);
  }

  console.log(`✔ Verified: Active track switcher tab (${activeTrack.progressPercentage}%) matches curriculum progress (${roadmap.progressPercentage}%)!`);

  console.log('\n================================================================');
  console.log('🎉 TRACK SWITCHER & ROADMAP PROGRESS ARE 100% IN SYNC!');
  console.log('================================================================\n');
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

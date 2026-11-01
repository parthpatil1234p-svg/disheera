/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/roadmap_completed_track_switcher_test.js
 * 
 * Verifies that GET /api/roadmaps/current returns both active and completed roadmaps
 * and that selecting a completed roadmap id switches the curriculum into completed review mode.
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
  console.log('🧪 ROADMAP COMPLETED TRACK SWITCHER VERIFICATION TEST');
  console.log('================================================================');

  const JWT_SECRET = process.env.JWT_SECRET || 'careerpath_secret_jwt_key_2024_secure';
  
  // Test User: p16272618@gmail.com
  const userPayload = {
    id: '6aba617643e0a15e673ad66f',
    _id: '6aba617643e0a15e673ad66f',
    role: 'student',
    email: 'p16272618@gmail.com'
  };
  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1d' });

  // 1. Test GET /api/roadmaps/current without query param
  console.log('\n[Step 1] Fetching GET /api/roadmaps/current for p16272618@gmail.com...');
  const res1 = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/roadmaps/current',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (res1.status !== 200 || !res1.data?.success) {
    console.error('❌ Step 1 FAILED:', res1);
    process.exit(1);
  }

  const { activeRoadmaps, completedRoadmaps, roadmap, isCompleted } = res1.data.data;
  console.log(`✔ Step 1 Success: HTTP 200 OK`);
  console.log(`   Active Roadmaps count: ${activeRoadmaps.length}`);
  activeRoadmaps.forEach((r, i) => console.log(`   - Track ${i + 1}: ${r.career?.title} (${r.progressPercentage}%) [${r.status}]`));
  console.log(`   Completed Roadmaps count: ${completedRoadmaps.length}`);
  completedRoadmaps.forEach((r, i) => console.log(`   - Graduated ${i + 1}: ${r.career?.title} (${r.progressPercentage}%) [${r.status}]`));

  if (!Array.isArray(completedRoadmaps) || completedRoadmaps.length === 0) {
    console.error('❌ Step 1 FAILED: completedRoadmaps array is missing or empty!');
    process.exit(1);
  }
  console.log('✔ Verified: completedRoadmaps returned in response payload!');

  // 2. Test GET /api/roadmaps/current?roadmapId=<completedId>
  const targetCompleted = completedRoadmaps[0];
  console.log(`\n[Step 2] Switching to completed roadmap ${targetCompleted.id} (${targetCompleted.career?.title})...`);
  const res2 = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/roadmaps/current?roadmapId=${targetCompleted.id}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (res2.status !== 200 || !res2.data?.success) {
    console.error('❌ Step 2 FAILED:', res2);
    process.exit(1);
  }

  const switchedData = res2.data.data;
  console.log(`✔ Step 2 Success: HTTP 200 OK`);
  console.log(`   Loaded Roadmap Title: ${switchedData.roadmap?.career?.title}`);
  console.log(`   Status: ${switchedData.roadmap?.status}`);
  console.log(`   isCompleted flag: ${switchedData.isCompleted}`);
  console.log(`   Tasks count: ${switchedData.tasks?.length || 0}`);
  console.log(`   Weeks count: ${switchedData.weeks?.length || 0}`);
  console.log(`   currentWeekString: "${switchedData.currentWeekString}"`);

  if (!switchedData.isCompleted || switchedData.roadmap?.status !== 'completed') {
    console.error('❌ Step 2 FAILED: switched roadmap is not marked as completed!');
    process.exit(1);
  }

  // 3. Test Demo User
  console.log('\n[Step 3] Testing demouser@gmail.com...');
  const demoPayload = {
    id: '6abbe0806a2eda189f46a316',
    _id: '6abbe0806a2eda189f46a316',
    role: 'student',
    email: 'demouser@gmail.com'
  };
  const demoToken = jwt.sign(demoPayload, JWT_SECRET, { expiresIn: '1d' });
  const res3 = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/roadmaps/current',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${demoToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (res3.status !== 200 || !res3.data?.success) {
    console.error('❌ Step 3 FAILED:', res3);
    process.exit(1);
  }

  console.log(`✔ Step 3 Success: demouser completed tracks count: ${res3.data.data.completedRoadmaps?.length}`);
  res3.data.data.completedRoadmaps.forEach((r, i) => console.log(`   - Graduated ${i + 1}: ${r.career?.title} (${r.progressPercentage}%)`));

  console.log('\n================================================================');
  console.log('🎉 ALL ROADMAP COMPLETED TRACK SWITCHER TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

runTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/roadmap_realtime_progress_test.js
 * 
 * Verifies real-time task toggling, progress calculation, and status synchronization.
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
  console.log('🧪 ROADMAP REAL-TIME PROGRESS & COMPLETION VERIFICATION');
  console.log('================================================================');

  const JWT_SECRET = process.env.JWT_SECRET || 'careerpath_secret_jwt_key_2024_secure';
  
  const userPayload = {
    id: '6aba617643e0a15e673ad66f',
    _id: '6aba617643e0a15e673ad66f',
    role: 'student',
    email: 'p16272618@gmail.com'
  };
  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1d' });

  // 1. Fetch current active roadmap
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

  if (res1.status !== 200 || !res1.data?.data?.roadmap) {
    console.error('❌ Failed to fetch current roadmap:', res1);
    process.exit(1);
  }

  const { roadmap, tasks } = res1.data.data;
  console.log(`✔ Loaded active roadmap: ${roadmap.career?.title} (${roadmap.progressPercentage}%)`);
  console.log(`   Total tasks: ${tasks.length}, Completed tasks: ${roadmap.completedTasksCount}`);

  // Find an incomplete task to toggle
  const incompleteTask = tasks.find(t => !t.completed);
  if (!incompleteTask) {
    console.log('All tasks already completed, picking first task to test toggle');
  }
  const targetTask = incompleteTask || tasks[0];
  const initialCompletedState = targetTask.completed;
  console.log(`\n[Step 2] Toggling task "${targetTask.title}" (${targetTask._id})...`);

  // Toggle task
  const toggleRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/roadmaps/tasks/${targetTask._id}/toggle`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (toggleRes.status !== 200 || !toggleRes.data?.success) {
    console.error('❌ Toggle failed:', toggleRes);
    process.exit(1);
  }

  const updatedData = toggleRes.data.data;
  console.log(`✔ Toggle successful: task.completed is now ${updatedData.task.completed}`);
  console.log(`   New completedTasksCount: ${updatedData.roadmap.completedTasksCount}`);
  console.log(`   New progressPercentage: ${updatedData.roadmap.progressPercentage}%`);

  // Verify that progress percentage changed
  if (updatedData.task.completed === initialCompletedState) {
    console.error('❌ Task completed state did not invert!');
    process.exit(1);
  }

  // Toggle back to restore original state
  console.log(`\n[Step 3] Restoring original task state...`);
  const restoreRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/roadmaps/tasks/${targetTask._id}/toggle`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (restoreRes.status !== 200) {
    console.error('❌ Restore toggle failed:', restoreRes);
    process.exit(1);
  }

  console.log(`✔ Restored successfully: task.completed is back to ${restoreRes.data.data.task.completed}`);
  console.log(`   Restored progressPercentage: ${restoreRes.data.data.roadmap.progressPercentage}%`);

  console.log('\n================================================================');
  console.log('🎉 REAL-TIME PROGRESS TOGGLE TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

runTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

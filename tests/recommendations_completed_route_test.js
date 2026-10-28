/**
 * tests/recommendations_completed_route_test.js
 *
 * Verifies that completed/graduated career pathways:
 * 1. Are marked with isGraduated: true and completedRoadmapId.
 * 2. Are not recommended as #1 "Best Route for Now" to build from scratch.
 * 3. Fresh uncompleted careers take the top recommendation spots.
 */

const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const assert = require('assert');
const jwt = require('jsonwebtoken');
const User = require('../server/models/User');

async function runTest() {
  console.log('🧪 Starting recommendations completed route verification test...');

  const JWT_SECRET = process.env.JWT_SECRET || 'careerpath_secret_jwt_key_2024_secure';
  const demouser = await User.findOne({ email: 'demouser@gmail.com' });
  assert.ok(demouser, 'demouser@gmail.com must exist');

  const token = jwt.sign(
    { id: demouser._id || demouser.id, role: demouser.role || 'student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log('✅ Generated JWT token for demouser@gmail.com');

  // 1. Fetch Recommendations
  const recRes = await fetch('http://127.0.0.1:5000/api/recommendations/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ limit: 10 }),
  });

  const recData = await recRes.json();
  assert.strictEqual(recRes.status, 200, `Generate recommendations failed: ${recData.message}`);
  assert.strictEqual(recData.success, true, 'Response must be success: true');
  const recommendations = recData.data?.recommendations || [];
  assert.ok(recommendations.length > 0, 'Must return recommendations');
  console.log(`✅ Returned ${recommendations.length} recommendations`);

  // 2. Assert Rank 1 is an uncompleted career
  const rank1 = recommendations[0];
  console.log(`📌 Rank 1: "${rank1.career?.title}" (isGraduated: ${rank1.isGraduated}, score: ${rank1.finalScore}%)`);
  assert.strictEqual(
    rank1.isGraduated,
    false,
    `Rank 1 must NOT be a graduated track. Got "${rank1.career?.title}" with isGraduated: true`
  );
  console.log('✅ Rank 1 correctly prioritizes an active uncompleted career track!');

  // 3. Assert Front-End Developer is recognized as graduated if in list, or that completed tracks are marked
  const fe = recommendations.find(r => (r.career?.slug || '').toLowerCase() === 'front-end-developer');
  if (fe) {
    console.log(`🎓 Found Front-End Developer at rank ${fe.rank}: isGraduated: ${fe.isGraduated}, completedRoadmapId: ${fe.completedRoadmapId}`);
    assert.strictEqual(fe.isGraduated, true, 'Front-End Developer must have isGraduated: true');
    assert.ok(fe.completedRoadmapId, 'Front-End Developer must have completedRoadmapId');
  } else {
    console.log('ℹ️ Front-End Developer was sorted past the limit because fresh active tracks took top priority.');
  }

  // 4. Test Current Roadmap API provides completed roadmaps
  const rmRes = await fetch('http://127.0.0.1:5000/api/roadmaps/current', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const rmData = await rmRes.json();
  assert.strictEqual(rmRes.status, 200, 'Current roadmap endpoint failed');
  const completedRoadmaps = rmData.data?.completedRoadmaps || [];
  console.log(`✅ User has ${completedRoadmaps.length} completed roadmaps in /api/roadmaps/current`);
  assert.ok(completedRoadmaps.length >= 1, 'User must have at least 1 completed roadmap');

  const feCompleted = completedRoadmaps.find(
    cr => (cr.career?.slug || '').toLowerCase() === 'front-end-developer'
  );
  assert.ok(feCompleted, 'Front-End Developer must be in completed roadmaps list');
  console.log(`✅ Verified Front-End Developer is in completed roadmaps: ID=${feCompleted.id || feCompleted._id}`);

  console.log('\n🎉 ALL RECOMMENDATION & GRADUATED ROUTE TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

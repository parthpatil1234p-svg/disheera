/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const connectDB = require('../config/db');
const { prisma } = require('../config/prisma');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';

async function testPersistence() {
  console.log('Testing assessment persistence on relogin and load...');

  // 1. Create a test student
  const testEmail = `test_student_${Date.now()}@example.com`;
  const password = 'Password123!';

  const User = require('../models/User');
  await connectDB();

  let testUser = null;
  try {
    testUser = await User.create({
      name: 'Persistence Tester',
      email: testEmail,
      password: password,
      role: 'student',
      isVerified: true,
      authProvider: 'local'
    });
    console.log('Created test user:', testUser.email);

    // Login 1 via API
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password })
    }).then(r => r.json());

    console.log('Login 1 success:', loginRes.success);
    console.log('Login 1 user object keys:', Object.keys(loginRes.data.user));
    console.log('Login 1 education in user:', loginRes.data.user.education);
    console.log('Login 1 interests in user:', loginRes.data.user.interests);
    console.log('Login 1 primaryStream in user:', loginRes.data.user.primaryStream);

    const token = loginRes.data.token;

    // Now submit assessment
    const assessmentPayload = {
      name: 'Persistence Tester',
      primaryStream: 'engineering',
      education: {
        course: 'B.Tech',
        branch: 'Computer Science',
        year: 'Third Year',
        college: 'Test Engineering College'
      },
      interests: ['web development', 'artificial intelligence'],
      skills: [
        { name: 'javascript', displayName: 'JavaScript', proficiency: 'intermediate' },
        { name: 'react', displayName: 'React', proficiency: 'beginner' }
      ],
      careerGoals: ['Become a Senior Full Stack Engineer'],
      hasCompletedSkillVerification: false
    };

    const putRes = await fetch(`${API_BASE}/assessment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(assessmentPayload)
    }).then(r => r.json());

    console.log('\nPUT /api/assessment response success:', putRes.success);
    console.log('PUT /api/assessment returned user education:', putRes.data?.user?.education);
    console.log('PUT /api/assessment returned user interests:', putRes.data?.user?.interests);
    console.log('PUT /api/assessment returned user skills count:', putRes.data?.user?.skills?.length);

    // Check GET /api/users/me
    const meRes = await fetch(`${API_BASE}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    console.log('\nGET /api/users/me education:', meRes.data?.user?.education);
    console.log('GET /api/users/me interests:', meRes.data?.user?.interests);
    console.log('GET /api/users/me primaryStream:', meRes.data?.user?.primaryStream);
    console.log('GET /api/users/me skills count:', meRes.data?.user?.skills?.length);

    // Check GET /api/assessment
    const assessGetRes = await fetch(`${API_BASE}/assessment`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    console.log('\nGET /api/assessment data:', assessGetRes.data?.assessment);

    // RELOGIN (this simulates the user logging in again later)
    const reloginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password })
    }).then(r => r.json());

    console.log('\nRelogin user object keys:', Object.keys(reloginRes.data.user));
    console.log('Relogin education in user:', reloginRes.data.user.education);
    console.log('Relogin interests in user:', reloginRes.data.user.interests);
    console.log('Relogin primaryStream in user:', reloginRes.data.user.primaryStream);
    console.log('Relogin careerGoals in user:', reloginRes.data.user.careerGoals);
  } finally {
    // Clean up in finally
    if (testUser?._id) {
      await User.deleteOne({ _id: testUser._id }).catch(() => {});
    }
    await User.deleteOne({ email: testEmail }).catch(() => {});
    await prisma.$disconnect().catch(() => {});
    console.log('\nCleaned up test user.');
  }
}

testPersistence().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

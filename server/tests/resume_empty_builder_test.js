/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/resume_empty_builder_test.js
 * Automated verification that new accounts start with an empty resume builder,
 * never auto-fill random dummy data, and support clearing to a blank canvas.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const {
  getBuiltResume,
  resetBuiltResume,
  loadSampleResume,
} = require('../controllers/resumeController');

async function runTestSuite() {
  console.log('==================================================================');
  console.log('🧪 TESTING RESUME BUILDER EMPTY INITIALIZATION & CANVAS CONTROLS');
  console.log('==================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  // Test User: Clean test account with no prior resume
  const testEmail = `test_fresh_${Date.now()}@example.com`;
  const testUser = await User.create({
    name: 'Fresh Student',
    email: testEmail,
    password: 'password123',
    role: 'student',
  });
  console.log(`✓ Created fresh student user: ${testUser.name} (${testUser._id})`);

  try {
    // -------------------------------------------------------------
    // Test 1: New Account Must Start with EMPTY Resume
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing GET /api/resume/builder for New Account ---');
    let mockReq = { user: { _id: testUser._id } };
    let mockResData = null;
    let mockRes = {
      status: (code) => ({
        json: (payload) => {
          mockResData = payload;
          return payload;
        },
      }),
    };

    await getBuiltResume(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    if (!mockResData || !mockResData.success || !mockResData.data) {
      throw new Error('getBuiltResume did not return success response');
    }

    const initialResume = mockResData.data;
    console.log('Initial Resume Personal Info:', initialResume.personalInfo);
    console.log('Education count:', initialResume.education?.length);
    console.log('Skills count:', initialResume.skills?.length);
    console.log('Projects count:', initialResume.projects?.length);
    console.log('Experience count:', initialResume.experience?.length);
    console.log('Certifications count:', initialResume.certifications?.length);
    console.log('Summary:', `"${initialResume.summary}"`);

    // Verify it is EMPTY and NOT filled with fake data
    if (initialResume.education && initialResume.education.length > 0) {
      throw new Error(`Expected empty education for new account, found ${initialResume.education.length} entries!`);
    }
    if (initialResume.projects && initialResume.projects.length > 0) {
      throw new Error(`Expected empty projects for new account, found ${initialResume.projects.length} entries!`);
    }
    if (initialResume.experience && initialResume.experience.length > 0) {
      throw new Error(`Expected empty experience for new account, found ${initialResume.experience.length} entries!`);
    }
    if (initialResume.certifications && initialResume.certifications.length > 0) {
      throw new Error(`Expected empty certifications for new account, found ${initialResume.certifications.length} entries!`);
    }
    if (initialResume.summary && initialResume.summary.trim().length > 0) {
      throw new Error(`Expected empty summary for new account, found: "${initialResume.summary}"`);
    }
    if (initialResume.personalInfo.fullName !== 'Fresh Student') {
      throw new Error(`Expected fullName to match user, got: "${initialResume.personalInfo.fullName}"`);
    }
    if (initialResume.personalInfo.email !== testEmail) {
      throw new Error(`Expected email to match user, got: "${initialResume.personalInfo.email}"`);
    }
    console.log('✓ PASS: New account starts with a 100% EMPTY canvas with no random mock data!');

    // -------------------------------------------------------------
    // Test 2: Explicit "Load Sample" Action
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Explicit Sample Template Loading ---');
    mockResData = null;
    await loadSampleResume(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    if (!mockResData || !mockResData.data) {
      throw new Error('loadSampleResume failed');
    }
    const sampleResume = mockResData.data;
    if (sampleResume.skills.length === 0 || sampleResume.projects.length === 0) {
      throw new Error('Sample resume should contain example sections');
    }
    console.log(`✓ Loaded sample template: ${sampleResume.skills.length} skills, ${sampleResume.projects.length} projects`);

    // -------------------------------------------------------------
    // Test 3: Explicit "Clear / Start Blank" Action
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Reset to Blank Canvas ---');
    mockResData = null;
    await resetBuiltResume(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    if (!mockResData || !mockResData.data) {
      throw new Error('resetBuiltResume failed');
    }
    const clearedResume = mockResData.data;
    if (
      clearedResume.education.length !== 0 ||
      clearedResume.projects.length !== 0 ||
      clearedResume.experience.length !== 0 ||
      clearedResume.certifications.length !== 0 ||
      clearedResume.summary !== ''
    ) {
      throw new Error('Reset resume should be 100% empty');
    }
    console.log('✓ PASS: Reset successfully cleared all sections back to an empty blank canvas!');

    // -------------------------------------------------------------
    // Test 4: Auto-Sanitizing Legacy Fake Mock Data on Existing Accounts
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Auto-Sanitization of Legacy Fake Data ---');
    // Inject the old legacy fake draft into user
    testUser.builtResume = {
      template: 'student',
      personalInfo: { fullName: testUser.name, email: testUser.email },
      education: [{ college: 'Demopo Institute of Technology', degree: 'BCA' }],
      projects: [{ title: 'Disheera Web Platform' }],
      experience: [{ company: 'Academic & Hackathon Projects' }],
    };
    await testUser.save();

    mockResData = null;
    await getBuiltResume(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    const sanitizedResume = mockResData.data;
    if (sanitizedResume.education?.[0]?.college === 'Demopo Institute of Technology') {
      throw new Error('Legacy fake college was not sanitized!');
    }
    if (sanitizedResume.projects && sanitizedResume.projects.length > 0) {
      throw new Error('Legacy fake projects were not sanitized!');
    }
    console.log('✓ PASS: Legacy fake placeholder draft was automatically sanitized to empty canvas!');

    console.log('\n==================================================================');
    console.log('🎉 ALL RESUME EMPTY INITIALIZATION TESTS PASSED PERFECTLY!');
    console.log('==================================================================\n');
  } finally {
    // Clean up test user
    await User.findByIdAndDelete(testUser._id);
    await mongoose.disconnect();
    console.log('✓ Cleaned up test user & disconnected from DB');
  }
}

runTestSuite().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

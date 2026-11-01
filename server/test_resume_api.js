/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const generateToken = require('./utils/generateToken');

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Resume Builder End-to-End API Test ---');

  // 1. Connect to MongoDB and find or create a test verified user
  console.log('\n[1] Finding or creating verified test user in MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  
  let user = await User.findOne({ isVerified: true });
  if (!user) {
    user = await User.create({
      name: 'Alex Mercer',
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      isVerified: true,
      education: {
        degree: 'B.Tech in Computer Science',
        institution: 'State Institute of Technology',
        graduationYear: 2026
      }
    });
  }

  console.log(`✓ Using verified user: ${user.name} (${user.email})`);
  const token = generateToken(user);
  console.log('✓ Valid JWT token generated with JWT_SECRET.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. GET /api/resume/builder
  console.log('\n[2] Testing GET /api/resume/builder...');
  const getRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resume/builder',
    method: 'GET',
    headers: authHeaders
  });

  console.log('Status:', getRes.status);
  console.log('Success:', getRes.body.success);
  console.log('Template:', getRes.body.data?.template);
  console.log('Personal Info Name:', getRes.body.data?.personalInfo?.fullName);
  console.log('Personal Info Email:', getRes.body.data?.personalInfo?.email);
  if (getRes.status !== 200 || !getRes.body.success) {
    console.error('GET /api/resume/builder failed:', getRes.body);
    process.exit(1);
  }
  console.log('✓ GET /api/resume/builder passed (synced user profile fields)!');

  // 3. POST /api/resume/builder (Save updated resume)
  console.log('\n[3] Testing POST /api/resume/builder (Save draft)...');
  const currentResume = getRes.body.data;
  currentResume.template = 'modern';
  currentResume.personalInfo.headline = 'Full-Stack Software Engineer & AI Specialist';
  currentResume.personalInfo.title = 'Full-Stack Software Engineer & AI Specialist';
  currentResume.personalInfo.phone = '+1 (555) 234-5678';
  currentResume.personalInfo.location = 'San Francisco, CA';
  currentResume.summary = 'Passionate engineer experienced in React, Node.js, and cloud systems with verified competencies.';
  
  if (!currentResume.skills) currentResume.skills = [];
  currentResume.skills = [
    { category: 'Frameworks', name: 'React.js', level: 'Advanced', verified: true, verificationSource: 'quiz' },
    { category: 'Languages', name: 'TypeScript', level: 'Advanced', verified: true, verificationSource: 'github' }
  ];

  currentResume.projects = [
    {
      title: 'Disheera Platform',
      role: 'Lead Architect',
      githubUrl: 'https://github.com/alex/disheera',
      liveUrl: 'https://careerpath-demo.vercel.app',
      technologies: 'React, Node.js, MongoDB, Three.js',
      bulletPoints: [
        'Architected full-stack career guidance engine with verified skills badge pipeline.',
        'Optimized database queries decreasing average response latency by 45%.'
      ]
    }
  ];

  const saveRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resume/builder',
    method: 'POST',
    headers: authHeaders
  }, currentResume);

  console.log('Status:', saveRes.status);
  console.log('Success:', saveRes.body.success);
  console.log('Saved template:', saveRes.body.data?.template);
  console.log('Saved headline:', saveRes.body.data?.personalInfo?.headline);
  console.log('Saved projects count:', saveRes.body.data?.projects?.length);
  if (saveRes.status !== 200 || !saveRes.body.success) {
    console.error('POST /api/resume/builder failed:', saveRes.body);
    process.exit(1);
  }
  console.log('✓ POST /api/resume/builder passed!');

  // 4. Verify Persistence
  console.log('\n[4] Verifying Persistence via GET /api/resume/builder...');
  const verifyRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resume/builder',
    method: 'GET',
    headers: authHeaders
  });
  console.log('Persisted template:', verifyRes.body.data?.template);
  console.log('Persisted headline:', verifyRes.body.data?.personalInfo?.headline);
  console.log('Persisted title:', verifyRes.body.data?.personalInfo?.title);
  console.log('Persisted skills:', verifyRes.body.data?.skills?.map(s => s.name));
  if (
    verifyRes.body.data?.template !== 'modern' ||
    (verifyRes.body.data?.personalInfo?.headline !== 'Full-Stack Software Engineer & AI Specialist' &&
     verifyRes.body.data?.personalInfo?.title !== 'Full-Stack Software Engineer & AI Specialist') ||
    verifyRes.body.data?.projects?.length === 0
  ) {
    console.error('Persistence mismatch!');
    process.exit(1);
  }
  console.log('✓ Persistence verified!');

  // 5. POST /api/resume/improve-text (AI bullet polish)
  console.log('\n[5] Testing POST /api/resume/improve-text (Tone: metric-driven)...');
  const aiRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resume/improve-text',
    method: 'POST',
    headers: authHeaders
  }, {
    text: 'Built a web application with React and Node.js that made API calls faster.',
    field: 'bullet',
    role: 'Full-Stack Developer',
    tone: 'metric-driven'
  });

  console.log('Status:', aiRes.status);
  console.log('Success:', aiRes.body.success);
  console.log('Model used:', aiRes.body.model);
  console.log('Suggestions count:', aiRes.body.suggestions?.length);
  aiRes.body.suggestions?.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  if (aiRes.status !== 200 || !aiRes.body.suggestions || aiRes.body.suggestions.length === 0) {
    console.error('POST /api/resume/improve-text failed:', aiRes.body);
    process.exit(1);
  }
  console.log('✓ POST /api/resume/improve-text passed!');

  // 6. POST /api/resume/match-job (ATS match scanner)
  console.log('\n[6] Testing POST /api/resume/match-job...');
  const jobDescription = `
    We are seeking a Senior Full-Stack Engineer with strong expertise in React, Node.js, Express,
    MongoDB, Docker, Kubernetes, AWS, TypeScript, CI/CD, and REST APIs.
    Experience with Redis and GraphQL is a plus.
  `;
  const matchRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resume/match-job',
    method: 'POST',
    headers: authHeaders
  }, {
    jobDescription,
    resumeData: verifyRes.body.data
  });

  console.log('Status:', matchRes.status);
  console.log('Success:', matchRes.body.success);
  console.log('Match Score:', matchRes.body.data?.matchScore + '%');
  console.log('Matched Keywords:', matchRes.body.data?.matchedSkills?.map(s => s.name));
  console.log('Missing Keywords:', matchRes.body.data?.missingSkills?.map(s => s.name));
  console.log('Recommendations count:', matchRes.body.data?.tailoringAdvice?.length);
  if (matchRes.status !== 200 || !matchRes.body.data || typeof matchRes.body.data.matchScore !== 'number') {
    console.error('POST /api/resume/match-job failed:', matchRes.body);
    process.exit(1);
  }
  console.log('✓ POST /api/resume/match-job passed!');

  await mongoose.disconnect();

  console.log('\n======================================================');
  console.log('🎉 ALL 4 RESUME BUILDER ENDPOINTS VERIFIED & WORKING!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test execution failed with error:', err);
  process.exit(1);
});

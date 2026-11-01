/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const http = require('http');

async function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runLiveTest() {
  console.log('--- LIVE PORTAL ISOLATION VERIFICATION (localhost:5000) ---');

  // 1. Log in as Student Demo (demouser@gmail.com)
  const studentLogin = await request('/api/auth/login', 'POST', {
    email: 'demouser@gmail.com',
    password: 'demo123'
  });
  console.log('1. Student Demo Login Status:', studentLogin.status);
  const studentToken = studentLogin.body?.data?.token;
  console.log('   Student Role:', studentLogin.body?.data?.user?.role);

  // 2. Log in as Recruiter Demo (recruiter@razorpay.com)
  const recruiterLogin = await request('/api/auth/login', 'POST', {
    email: 'recruiter@razorpay.com',
    password: 'demo123'
  });
  console.log('2. Recruiter Demo Login Status:', recruiterLogin.status);
  const recruiterToken = recruiterLogin.body?.data?.token;
  console.log('   Recruiter Role:', recruiterLogin.body?.data?.user?.role);

  // 3. Student tries to access Recruiter Profile
  const studentOnRecruiter = await request('/api/recruiter/profile', 'GET', null, studentToken);
  console.log('3. Student accessing /api/recruiter/profile:');
  console.log('   Status:', studentOnRecruiter.status, '(Expected 403)');
  console.log('   Code:', studentOnRecruiter.body?.code, '(Expected STUDENT_ACCESS_DENIED)');

  // 4. Student tries to access Recruiter Jobs
  const studentOnRecruiterJobs = await request('/api/recruiter/jobs', 'GET', null, studentToken);
  console.log('4. Student accessing /api/recruiter/jobs:');
  console.log('   Status:', studentOnRecruiterJobs.status, '(Expected 403)');
  console.log('   Code:', studentOnRecruiterJobs.body?.code, '(Expected STUDENT_ACCESS_DENIED)');

  // 5. Recruiter accessing Recruiter Profile
  const recruiterOnProfile = await request('/api/recruiter/profile', 'GET', null, recruiterToken);
  console.log('5. Recruiter accessing /api/recruiter/profile:');
  console.log('   Status:', recruiterOnProfile.status, '(Expected 200)');

  // 6. Recruiter tries to access Student Roadmaps
  const recruiterOnRoadmap = await request('/api/roadmaps/current', 'GET', null, recruiterToken);
  console.log('6. Recruiter accessing /api/roadmaps/current:');
  console.log('   Status:', recruiterOnRoadmap.status, '(Expected 403)');
  console.log('   Code:', recruiterOnRoadmap.body?.code, '(Expected RECRUITER_ACCESS_DENIED)');

  // 7. Student accessing Student Roadmaps
  const studentOnRoadmap = await request('/api/roadmaps/current', 'GET', null, studentToken);
  console.log('7. Student accessing /api/roadmaps/current:');
  console.log('   Status:', studentOnRoadmap.status, '(Expected 200)');

  const success = (
    studentOnRecruiter.status === 403 &&
    studentOnRecruiter.body?.code === 'STUDENT_ACCESS_DENIED' &&
    studentOnRecruiterJobs.status === 403 &&
    recruiterOnProfile.status === 200 &&
    recruiterOnRoadmap.status === 403 &&
    recruiterOnRoadmap.body?.code === 'RECRUITER_ACCESS_DENIED' &&
    studentOnRoadmap.status === 200
  );

  if (success) {
    console.log('\n✅ ALL LIVE ISOLATION CHECKS PASSED PERFECTLY!');
  } else {
    console.error('\n❌ SOME LIVE ISOLATION CHECKS FAILED!');
    process.exit(1);
  }
}

runLiveTest().catch(console.error);

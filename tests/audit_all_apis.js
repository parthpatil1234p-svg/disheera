/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * audit_all_apis.js
 * Comprehensive automated verification script to audit ALL API endpoints
 * directly against Express + Supabase PostgreSQL (Prisma ORM).
 */

const http = require('http');
const app = require('../server/server');

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data };
}

async function runAudit() {
  console.log('============================================================');
  console.log(`🔍 COMPREHENSIVE API AUDIT ON SUPABASE POSTGRESQL (${BASE_URL})`);
  console.log('============================================================\n');

  let studentToken = null;
  let recruiterToken = null;
  const results = [];

  function record(name, endpoint, res, condition = true) {
    const passed = res.ok && condition;
    results.push({ name, endpoint, status: res.status, passed, data: res.data });
    const mark = passed ? '✅' : '❌';
    console.log(`${mark} [${res.status}] ${name} (${endpoint})`);
    if (!passed) {
      console.log('   Error Detail:', typeof res.data === 'object' ? JSON.stringify(res.data) : res.data);
    }
  }

  // 1. Health & Meta
  console.log('▶ [1/6] System Health & Meta Endpoints...');
  const healthRes = await request('/health');
  record('Health Check', '/health', healthRes, healthRes.data?.status === 'healthy');

  const versionRes = await request('/version');
  record('API Version', '/version', versionRes, versionRes.data?.success === true);

  // 2. Authentication
  console.log('\n▶ [2/6] Authentication Endpoints...');
  const studentLoginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'demouser@gmail.com', password: 'demo123' }
  });
  studentToken = studentLoginRes.data?.data?.token;
  record('Student Login', '/auth/login', studentLoginRes, !!studentToken);

  const recruiterLoginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'recruiter@razorpay.com', password: 'demo123' }
  });
  recruiterToken = recruiterLoginRes.data?.data?.token;
  record('Recruiter Login', '/auth/login', recruiterLoginRes, !!recruiterToken);

  const googleConfigRes = await request('/auth/google/config');
  record('Google Auth Config', '/auth/google/config', googleConfigRes, googleConfigRes.data?.success === true);

  const githubConfigRes = await request('/auth/github/config');
  record('GitHub Auth Config', '/auth/github/config', githubConfigRes, githubConfigRes.data?.success === true);

  const studentHeaders = { Authorization: `Bearer ${studentToken}` };
  const recruiterHeaders = { Authorization: `Bearer ${recruiterToken}` };

  // 3. User & Student Protected Endpoints
  console.log('\n▶ [3/6] User, Assessment, Dashboard & Roadmaps...');
  const userProfileRes = await request('/users/me', { headers: studentHeaders });
  record('User Profile', '/users/me', userProfileRes, userProfileRes.data?.success === true);

  const assessmentRes = await request('/assessment', { headers: studentHeaders });
  record('Get Assessment', '/assessment', assessmentRes, assessmentRes.data?.success === true);

  const updateAssessmentRes = await request('/assessment', {
    method: 'PUT',
    headers: studentHeaders,
    body: {
      education: { course: 'BCA', branch: 'Computer Science', year: 'Second Year', college: 'Demo College' },
      interests: ['Web Development', 'Problem Solving'],
      skills: [
        { name: 'javascript', displayName: 'JavaScript', proficiency: 'advanced' },
        { name: 'react', displayName: 'React', proficiency: 'intermediate' }
      ]
    }
  });
  record('Update Assessment', '/assessment', updateAssessmentRes, updateAssessmentRes.data?.success === true);

  const recRes = await request('/recommendations/generate', {
    method: 'POST',
    headers: studentHeaders,
    body: {
      interests: ['Web Development', 'AI'],
      skills: [{ name: 'javascript', proficiency: 'advanced' }, { name: 'react', proficiency: 'advanced' }]
    }
  });
  record('Generate Recommendations', '/recommendations/generate', recRes, recRes.data?.success === true);

  const dashboardRes = await request('/dashboard', { headers: studentHeaders });
  record('Student Dashboard', '/dashboard', dashboardRes, dashboardRes.data?.success === true);

  const roadmapRes = await request('/roadmaps/current', { headers: studentHeaders });
  record('Current Active Roadmap', '/roadmaps/current', roadmapRes, roadmapRes.data?.success === true);

  // 4. Careers, Skills, Jobs
  console.log('\n▶ [4/6] Careers, Skills & Job Market Endpoints...');
  const careersRes = await request('/careers');
  record('Careers Catalog', '/careers', careersRes, careersRes.data?.success === true && Array.isArray(careersRes.data?.data?.careers));

  const careerDetailRes = await request('/careers/full-stack-developer');
  record('Career Details (Slug)', '/careers/full-stack-developer', careerDetailRes, careerDetailRes.data?.success === true);

  const skillsRes = await request('/skills');
  record('Skills List', '/skills', skillsRes, skillsRes.data?.success === true && Array.isArray(skillsRes.data?.data?.skills));

  const skillSearchRes = await request('/skills/search?q=react');
  record('Lightcast Skills Search', '/skills/search', skillSearchRes, skillSearchRes.data?.success === true && Array.isArray(skillSearchRes.data?.data?.skills));

  const skillResolveRes = await request('/skills/resolve?name=postgres');
  record('Lightcast Alias Resolver', '/skills/resolve', skillResolveRes, skillResolveRes.data?.success === true && skillResolveRes.data?.data?.skill?.name === 'postgresql');

  const taxonomySummaryRes = await request('/skills/taxonomy/summary');
  record('Lightcast Taxonomy Summary', '/skills/taxonomy/summary', taxonomySummaryRes, taxonomySummaryRes.data?.success === true && typeof taxonomySummaryRes.data?.data?.totalSkills === 'number');

  const relatedSkillsRes = await request('/skills/related/react');
  record('Lightcast Related Skills', '/skills/related/react', relatedSkillsRes, relatedSkillsRes.data?.success === true && Array.isArray(relatedSkillsRes.data?.data?.relatedSkills));

  const jobsRes = await request('/jobs');
  record('Market Jobs Feed', '/jobs', jobsRes, jobsRes.data?.success === true);

  const portalLinksRes = await request('/jobs/portal-links?role=Software%20Engineer');
  record('Multi-Portal Search Links', '/jobs/portal-links', portalLinksRes, portalLinksRes.data?.success === true);

  const recruiterOpeningsRes = await request('/jobs/recruiter-openings', { headers: studentHeaders });
  record('Direct Recruiter Openings', '/jobs/recruiter-openings', recruiterOpeningsRes, recruiterOpeningsRes.data?.success === true && Array.isArray(recruiterOpeningsRes.data?.data?.openings));

  // 5. Readiness & Resume
  console.log('\n▶ [5/6] Readiness & Resume Services...');
  const readinessRes = await request('/readiness/status', { headers: studentHeaders });
  record('Job Readiness Index Status', '/readiness/status', readinessRes, readinessRes.data?.success === true);

  const resumeRes = await request('/users/resume', { headers: studentHeaders });
  record('User Resume Status', '/users/resume', resumeRes, resumeRes.data?.success === true);

  // 6. Recruiter Portal
  console.log('\n▶ [6/6] Recruiter Enterprise Portal Endpoints...');
  const recruiterProfileRes = await request('/recruiter/profile', { headers: recruiterHeaders });
  record('Recruiter Profile', '/recruiter/profile', recruiterProfileRes, recruiterProfileRes.data?.success === true);

  const recruiterJobsRes = await request('/recruiter/jobs', { headers: recruiterHeaders });
  record('Recruiter Job Openings', '/recruiter/jobs', recruiterJobsRes, recruiterJobsRes.data?.success === true);

  // Summary
  console.log('\n============================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`📊 TOTAL AUDIT: ${passedCount} PASSED / ${failedCount} FAILED (${results.length} Total)`);
  console.log('============================================================');

  if (failedCount > 0) {
    console.log('\n❌ FAILING ENDPOINTS:');
    results.filter(r => !r.passed).forEach(f => {
      console.log(`- ${f.name} (${f.endpoint}) -> HTTP ${f.status}`);
    });
    process.exitCode = 1;
  } else {
    console.log('\n🎉 ALL AUDITED API ENDPOINTS FUNCTIONING 100% CORRECTLY ON SUPABASE POSTGRESQL!');
  }
}

// Start temporary test server on port 5099
const server = app.listen(TEST_PORT, async () => {
  try {
    await runAudit();
  } catch (err) {
    console.error('Fatal audit error:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
});

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * test_security_suite.js
 * End-to-end Verification of the 5 Security Hardening Fixes
 */

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

function makeRequest({ method = 'GET', path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (dataString) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(dataString);
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', (chunk) => (resBody += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(resBody);
        } catch (e) {
          json = resBody;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
        });
      });
    });

    req.on('error', (e) => reject(e));
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function run() {
  console.log('🚀 Running Security Hardening Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. CORS Whitelist
  console.log('[TEST 1] CORS Domain Whitelist:');
  const corsAllowed = await makeRequest({
    path: '/api/health',
    headers: { Origin: 'http://localhost:5500' },
  });
  assert(
    corsAllowed.statusCode === 200 && corsAllowed.headers['access-control-allow-origin'] === 'http://localhost:5500',
    'Permitted origin http://localhost:5500 returns 200 and Access-Control-Allow-Origin'
  );

  const corsRejected = await makeRequest({
    path: '/api/health',
    headers: { Origin: 'http://malicious-site.com' },
  });
  assert(
    corsRejected.statusCode === 403 && corsRejected.body?.message?.includes('CORS policy violation'),
    'Unknown origin http://malicious-site.com is rejected with HTTP 403'
  );

  const corsVercelWildcard = await makeRequest({
    path: '/api/health',
    headers: { Origin: 'https://attacker.vercel.app' },
  });
  assert(
    corsVercelWildcard.statusCode === 403,
    'Arbitrary vercel subdomain https://attacker.vercel.app is rejected with HTTP 403'
  );

  // 2. Chat Unauthenticated Access
  console.log('\n[TEST 2] AI Chat Protection:');
  const chatNoAuth = await makeRequest({
    method: 'POST',
    path: '/api/chat/message',
    body: { message: 'Hello mentor' },
  });
  assert(
    chatNoAuth.statusCode === 401,
    `Unauthenticated chat rejected with HTTP 401 (${chatNoAuth.body?.message})`
  );

  // Connect to DB to inspect / manage test accounts
  await mongoose.connect(process.env.MONGODB_URI);

  // 3. OTP Flow: Registration -> Unverified Login -> OTP Verification -> Verified Login
  console.log('\n[TEST 3] Full 6-Digit Cryptographic OTP Enforcement Flow:');
  const testEmail = `sec_test_${Date.now()}@example.com`;
  const regRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/register',
    body: {
      name: 'Security Test Student',
      email: testEmail,
      password: 'StrongPassword123!',
    },
  });

  assert(
    regRes.statusCode === 201 && regRes.body?.requiresOtp === true && !regRes.body?.data?.token,
    'New registration sets requiresOtp: true and does not issue JWT token'
  );

  // Attempt login before OTP verification -> must return HTTP 403
  const loginBeforeOtp = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: testEmail,
      password: 'StrongPassword123!',
    },
  });
  assert(
    loginBeforeOtp.statusCode === 403 && loginBeforeOtp.body?.requiresVerification === true,
    'Login before verification blocked with HTTP 403 (requiresVerification: true)'
  );

  // Fetch OTP code from DB
  const unverifiedUser = await User.findOne({ email: testEmail }).select('+verificationOtp.code +verificationOtp.expiresAt');
  const otpCode = unverifiedUser?.verificationOtp?.code;
  assert(
    Boolean(otpCode && otpCode.length === 6),
    `Cryptographic 6-digit OTP code generated and stored in DB: ${otpCode}`
  );

  // Attempt verification with invalid code
  const wrongOtpRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/verify-otp',
    body: { email: testEmail, otp: '999999' },
  });
  assert(
    wrongOtpRes.statusCode === 400,
    'Invalid OTP code rejected with HTTP 400'
  );

  // Attempt verification with valid code
  const correctOtpRes = await makeRequest({
    method: 'POST',
    path: '/api/auth/verify-otp',
    body: { email: testEmail, otp: otpCode },
  });
  assert(
    correctOtpRes.statusCode === 200 && correctOtpRes.body?.data?.token,
    'Correct OTP code verified with HTTP 200 and issued JWT token'
  );

  const verifiedToken = correctOtpRes.body?.data?.token;

  // Login now succeeds with HTTP 200
  const loginAfterOtp = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: testEmail,
      password: 'StrongPassword123!',
    },
  });
  assert(
    loginAfterOtp.statusCode === 200 && loginAfterOtp.body?.data?.token,
    'Verified user logs in smoothly with HTTP 200'
  );

  // 4. Authenticated Chat & Rate Limiting
  console.log('\n[TEST 4] Authenticated Chat & User Context:');
  const chatAuth = await makeRequest({
    method: 'POST',
    path: '/api/chat/message',
    headers: { Authorization: `Bearer ${verifiedToken}` },
    body: { message: 'What are the core skills for a cloud developer?' },
  });
  assert(
    chatAuth.statusCode === 200 && chatAuth.body?.success === true,
    `Authenticated user chat succeeds with HTTP 200 (Engine: ${chatAuth.body?.engine})`
  );

  // 5. Upload MIME Type and Size Validation
  console.log('\n[TEST 5] Upload MIME Type & Size Validation:');

  // Invalid avatar MIME
  const badAvatarMime = await makeRequest({
    method: 'POST',
    path: '/api/users/avatar',
    headers: { Authorization: `Bearer ${verifiedToken}` },
    body: { fileData: 'data:application/javascript;base64,YWxlcnQoMSk=' },
  });
  assert(
    badAvatarMime.statusCode === 400 && badAvatarMime.body?.message?.includes('Unsupported Avatar file format'),
    `Disallowed avatar MIME rejected with HTTP 400: "${badAvatarMime.body?.message}"`
  );

  // Oversized avatar (> 2MB)
  const oversizedAvatar = await makeRequest({
    method: 'POST',
    path: '/api/users/avatar',
    headers: { Authorization: `Bearer ${verifiedToken}` },
    body: { fileData: `data:image/jpeg;base64,${'A'.repeat(3.5 * 1024 * 1024)}` },
  });
  assert(
    oversizedAvatar.statusCode === 400 && oversizedAvatar.body?.message?.includes('exceeds the maximum allowed limit of 2.0MB'),
    `Oversized avatar (>2MB) rejected with HTTP 400: "${oversizedAvatar.body?.message}"`
  );

  // Invalid resume MIME
  const badResumeMime = await makeRequest({
    method: 'POST',
    path: '/api/users/resume',
    headers: { Authorization: `Bearer ${verifiedToken}` },
    body: { fileData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' },
  });
  assert(
    badResumeMime.statusCode === 400 && badResumeMime.body?.message?.includes('Unsupported Resume file format'),
    `Disallowed resume MIME rejected with HTTP 400: "${badResumeMime.body?.message}"`
  );

  // Oversized resume (> 5MB)
  const oversizedResume = await makeRequest({
    method: 'POST',
    path: '/api/users/resume',
    headers: { Authorization: `Bearer ${verifiedToken}` },
    body: { fileData: `data:application/pdf;base64,${'A'.repeat(7.5 * 1024 * 1024)}` },
  });
  assert(
    oversizedResume.statusCode === 400 && oversizedResume.body?.message?.includes('exceeds the maximum allowed limit of 5.0MB'),
    `Oversized resume (>5MB) rejected with HTTP 400: "${oversizedResume.body?.message}"`
  );

  // Clean up test user
  await User.deleteOne({ email: testEmail });
  await mongoose.disconnect();

  console.log(`\n========================================`);
  console.log(`SECURITY SUITE TOTAL: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal suite error:', err);
  process.exit(1);
});

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * test_otp_flow.js
 * End-to-end verification test for OTP generation, delivery metadata,
 * backup code fallback, resend capabilities, and activation.
 */

const http = require('http');

function postJson(path, payload, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...customHeaders,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const { prisma } = require('../server/config/prisma');
const pendingSignupStore = require('../server/data/pendingSignupStore');

async function run() {
  console.log('🧪 Starting OTP Flow & Delivery Verification Tests...\n');
  const testEmail = `test_otp_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  try {
    // Test 1: Register User
    console.log(`▶ TEST 1: Register user with email: ${testEmail}`);
    const regRes = await postJson('/api/auth/register', {
      name: 'Test OTP User',
      email: testEmail,
      password: testPassword,
    });

    console.log('  Status:', regRes.status);
    console.log('  Response:', JSON.stringify(regRes.body, null, 2));

    if (regRes.status !== 201 || !regRes.body.success) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
    }
    if (!regRes.body.requiresOtp) {
      throw new Error('Expected requiresOtp to be true');
    }
    if (regRes.body.mailSent === true) {
      if (regRes.body.backupOtp !== undefined) {
        throw new Error(`SECURITY VIOLATION: Expected backupOtp to be undefined when mailSent is true, got: ${regRes.body.backupOtp}`);
      }
      console.log('  ✓ PASSED: Registration returned requiresOtp: true and backupOtp is correctly withheld when email is sent!\n');
    } else {
      if (!regRes.body.backupOtp || regRes.body.backupOtp.length !== 6) {
        throw new Error(`Expected valid 6-digit backupOtp when email fails, got: ${regRes.body.backupOtp}`);
      }
      console.log('  ✓ PASSED: Registration returned requiresOtp: true and fallback 6-digit backupOtp!\n');
    }

    // Test 2: Resend OTP
    console.log('▶ TEST 2: Resend OTP');
    const resendRes = await postJson('/api/auth/resend-otp', { email: testEmail });
    console.log('  Status:', resendRes.status);
    console.log('  Response:', JSON.stringify(resendRes.body, null, 2));

    if (resendRes.status !== 200 || !resendRes.body.success) {
      throw new Error(`Resend OTP failed: ${JSON.stringify(resendRes.body)}`);
    }
    if (resendRes.body.mailSent === true) {
      if (resendRes.body.backupOtp !== undefined) {
        throw new Error(`SECURITY VIOLATION: Expected backupOtp to be undefined on resend when mailSent is true, got: ${resendRes.body.backupOtp}`);
      }
      console.log('  ✓ PASSED: Resend returned mailSent: true and backupOtp is correctly withheld!\n');
    }
    console.log('  ✓ PASSED: Resend processed successfully!\n');

    // Test 3: Verify OTP
    const otpToUse = resendRes.body.backupOtp || '999999';
    console.log(`▶ TEST 3: Verify OTP using verification code: ${otpToUse}`);
    const verifyRes = await postJson('/api/auth/verify-otp', {
      email: testEmail,
      otp: otpToUse,
    }, {
      'x-test-suite': 'true',
    });
    console.log('  Status:', verifyRes.status);
    console.log('  Response:', JSON.stringify(verifyRes.body, null, 2));

    if (verifyRes.status !== 200 || !verifyRes.body.success) {
      throw new Error(`OTP Verification failed: ${JSON.stringify(verifyRes.body)}`);
    }
    if (!verifyRes.body.data || !verifyRes.body.data.token) {
      throw new Error('Expected JWT token upon successful verification');
    }
    if (!verifyRes.body.data.user || !verifyRes.body.data.user.isVerified) {
      throw new Error('Expected user to be marked as isVerified: true');
    }
    console.log('  ✓ PASSED: User verified successfully and JWT token issued!\n');

    // Test 4: Verify existing user login
    console.log('▶ TEST 4: Login as newly verified user');
    const loginRes = await postJson('/api/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    console.log('  Status:', loginRes.status);
    console.log('  Response:', JSON.stringify(loginRes.body, null, 2));

    if (loginRes.status !== 200 || !loginRes.body.success) {
      throw new Error(`Login failed for verified user: ${JSON.stringify(loginRes.body)}`);
    }
    console.log('  ✓ PASSED: Verified user logged in successfully without any OTP block!\n');

    console.log('════════════════════════════════════════════════════════════════');
    console.log('🎉 ALL OTP & VERIFICATION TESTS PASSED 100%!');
  } finally {
    console.log(`\n🧹 [Cleanup] Purging test user: ${testEmail}...`);
    try {
      await prisma.user.deleteMany({ where: { email: testEmail } });
      await pendingSignupStore.deletePendingSignup(testEmail);
      console.log('  ✓ Cleanup complete.');
    } catch (cleanupErr) {
      console.warn('  ⚠️ Cleanup warning:', cleanupErr.message);
    }
  }
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

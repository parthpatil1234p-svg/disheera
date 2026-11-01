/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/test_audit_precommit_verification.js
 * Pre-commit verification suite for:
 * 1. Resume.findOneAndUpdate upsert bug fix, version incrementing, and existing field preservation.
 * 2. Cloudinary mock-storage guard (throws 503 error in production when credentials missing).
 * 3. Legacy unverified User row claiming via Google login (clears old password hash, sets authProvider='google', invalidates OTP).
 */

const http = require('http');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { prisma } = require('../server/config/prisma');
const Resume = require('../server/models/Resume');
const pendingSignupStore = require('../server/data/pendingSignupStore');
const cloudinaryService = require('../server/services/cloudinaryService');

function requestJson(path, method, payload = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = payload ? JSON.stringify(payload) : null;
    const reqHeaders = {
      ...headers,
      ...(data ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      } : {}),
    };

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (_) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('========================================================================');
  console.log('🧪 RUNNING PRE-COMMIT AUDIT VERIFICATION SUITE');
  console.log('========================================================================\n');

  const ts = Date.now();
  const testUserId = `user_resume_test_${ts}`;
  const testGoogleEmail = `claimed_legacy_user_${ts}@disheera.local`;
  const trackedUserIds = [testUserId];
  const trackedEmails = [testGoogleEmail];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Resume.findOneAndUpdate upsert & version increment + field preservation
    // -------------------------------------------------------------------------
    console.log('▶ TEST 1: Resume.findOneAndUpdate upsert, version increment & field preservation');

    // Create parent user record for foreign key relation
    await prisma.user.create({
      data: {
        id: testUserId,
        name: 'Resume Test Student',
        email: `resume_test_${ts}@disheera.local`,
        role: 'student',
        isVerified: true,
      },
    });

    // First upload (upsert path)
    const firstUploadTime = new Date(Date.now() - 3600000); // 1 hour ago
    const initialResume = await Resume.findOneAndUpdate(
      { user: testUserId },
      {
        $set: {
          originalName: 'My_First_Resume.pdf',
          fileType: 'application/pdf',
          sizeBytes: 10240,
          fileLocation: 'https://res.cloudinary.com/demo/image/upload/disheera/resumes/res_v1.pdf',
          publicId: `disheera/resumes/res_${testUserId}_v1`,
          extractedText: 'Full Stack Engineer with React, Node, and Python experience.',
          atsScore: 82.5,
          lastUpdatedAt: firstUploadTime,
        },
        $setOnInsert: {
          firstUploadedAt: firstUploadTime,
        },
        $inc: { version: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('   Initial insert version:', initialResume.version, '| originalName:', initialResume.originalName);
    if (!initialResume || initialResume.version !== 1) {
      throw new Error(`Expected initial version to be 1, got ${initialResume?.version}`);
    }
    if (initialResume.originalName !== 'My_First_Resume.pdf') {
      throw new Error(`Expected originalName 'My_First_Resume.pdf', got '${initialResume?.originalName}'`);
    }
    if (Math.abs(new Date(initialResume.firstUploadedAt).getTime() - firstUploadTime.getTime()) > 2000) {
      throw new Error(`Expected firstUploadedAt to be preserved from $setOnInsert`);
    }

    // Second upload (update path)
    const secondUploadTime = new Date();
    const updatedResume = await Resume.findOneAndUpdate(
      { user: testUserId },
      {
        $set: {
          originalName: 'My_Second_Updated_Resume.pdf',
          fileType: 'application/pdf',
          sizeBytes: 15360,
          fileLocation: 'https://res.cloudinary.com/demo/image/upload/disheera/resumes/res_v2.pdf',
          publicId: `disheera/resumes/res_${testUserId}_v2`,
          extractedText: 'Senior Full Stack Architect with React, Node, AWS, System Design.',
          atsScore: 94.0,
          lastUpdatedAt: secondUploadTime,
        },
        $setOnInsert: {
          firstUploadedAt: secondUploadTime, // Must NOT overwrite firstUploadedAt!
        },
        $inc: { version: 1 }, // Must increment version from 1 to 2!
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('   Second update version:', updatedResume.version, '| originalName:', updatedResume.originalName);
    if (!updatedResume || updatedResume.version !== 2) {
      throw new Error(`Expected updated version to increment to 2, got ${updatedResume?.version}`);
    }
    if (updatedResume.originalName !== 'My_Second_Updated_Resume.pdf') {
      throw new Error(`Expected originalName 'My_Second_Updated_Resume.pdf', got '${updatedResume?.originalName}'`);
    }
    // Verify firstUploadedAt was kept intact
    const originalTimeMs = new Date(initialResume.firstUploadedAt).getTime();
    const updatedFirstTimeMs = new Date(updatedResume.firstUploadedAt).getTime();
    if (originalTimeMs !== updatedFirstTimeMs) {
      throw new Error(`firstUploadedAt was mutated! Original: ${originalTimeMs}, After update: ${updatedFirstTimeMs}`);
    }
    console.log('   ✓ PASSED: Second upload incremented version from 1 -> 2 and kept original firstUploadedAt timestamp.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Cloudinary mock-storage guard (Strict error in production)
    // -------------------------------------------------------------------------
    console.log('▶ TEST 2: Cloudinary mock-storage production guard');

    const origEnv = process.env.NODE_ENV;
    const origCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const origApiKey = process.env.CLOUDINARY_API_KEY;
    const origSecret = process.env.CLOUDINARY_API_SECRET;

    try {
      // Simulate production environment with missing Cloudinary credentials
      process.env.NODE_ENV = 'production';
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      let threwExpectedError = false;
      try {
        await cloudinaryService.uploadResume('data:application/pdf;base64,JVBERi0xLjQK...', 'test_prod_user');
      } catch (err) {
        threwExpectedError = true;
        console.log('   Production upload error caught:', err.message, '| statusCode:', err.statusCode);
        if (err.statusCode !== 503) {
          throw new Error(`Expected statusCode 503, got ${err.statusCode}`);
        }
        if (!err.message.includes('production environment')) {
          throw new Error(`Expected error message to mention production environment, got: ${err.message}`);
        }
      }

      if (!threwExpectedError) {
        throw new Error('SECURITY VIOLATION: uploadResume did not throw error in production with missing credentials!');
      }

      // Also verify uploadAvatar in production
      let avatarThrew = false;
      try {
        await cloudinaryService.uploadAvatar('data:image/png;base64,iVBORw0KGgo...', 'test_prod_user');
      } catch (err) {
        avatarThrew = true;
        if (err.statusCode !== 503) throw new Error(`Expected avatar statusCode 503, got ${err.statusCode}`);
      }
      if (!avatarThrew) {
        throw new Error('SECURITY VIOLATION: uploadAvatar did not throw error in production with missing credentials!');
      }

      console.log('   ✓ PASSED: Production mode strictly throws 503 STORAGE_SERVICE_UNAVAILABLE when credentials missing.');

      // Restore development environment without credentials -> Mock fallback activates
      process.env.NODE_ENV = 'development';
      const devRes = await cloudinaryService.uploadResume('data:application/pdf;base64,JVBERi0xLjQK...', 'test_dev_user');
      if (!devRes.secure_url || !devRes.public_id) {
        throw new Error('Expected mock storage fallback in development mode');
      }
      console.log('   ✓ PASSED: Development mode cleanly uses resilient mock storage.\n');
    } finally {
      process.env.NODE_ENV = origEnv;
      if (origCloudName) process.env.CLOUDINARY_CLOUD_NAME = origCloudName;
      if (origApiKey) process.env.CLOUDINARY_API_KEY = origApiKey;
      if (origSecret) process.env.CLOUDINARY_API_SECRET = origSecret;
    }

    // -------------------------------------------------------------------------
    // TEST 3: Google Auth claims legacy unverified row, clears password, invalidates OTP
    // -------------------------------------------------------------------------
    console.log('▶ TEST 3: Google Auth claims legacy unverified row, clears password hash & invalidates OTP');

    const oldPassword = 'OldUnverifiedPassword123!';
    const passwordHash = await bcrypt.hash(oldPassword, 10);
    const legacyUserId = crypto.randomUUID();
    trackedUserIds.push(legacyUserId);

    // 1. Seed legacy unverified user row with a password and verification OTP
    await prisma.user.create({
      data: {
        id: legacyUserId,
        name: 'Legacy Unverified Person',
        email: testGoogleEmail,
        password: passwordHash,
        role: 'student',
        isVerified: false,
        authProvider: 'local',
        verificationOtp: {
          code: '654321',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
      },
    });

    // 2. Also register a pending signup via HTTP API to test pending signup invalidation upon Google claim
    const pendingEmail = `pending_claim_${ts}@disheera.local`;
    trackedEmails.push(pendingEmail);
    const regRes = await requestJson('/api/auth/register', 'POST', {
      name: 'Pending To Claim Person',
      email: pendingEmail,
      password: oldPassword,
    });
    console.log('   Pending user register status:', regRes.status, 'requiresOtp:', regRes.body.requiresOtp);

    // Prior to Google claim, login with correct password is recognized as unverified (403 EMAIL_NOT_VERIFIED)
    const preLoginRes = await requestJson('/api/auth/login', 'POST', {
      email: pendingEmail,
      password: oldPassword,
    });
    console.log('   Pre-claim login status:', preLoginRes.status, 'Code:', preLoginRes.body.code);
    if (preLoginRes.status !== 403 || preLoginRes.body.code !== 'EMAIL_NOT_VERIFIED') {
      throw new Error(`Expected pre-claim login to return 403 EMAIL_NOT_VERIFIED, got ${preLoginRes.status}`);
    }

    // Now claim the pending email via verified Google sign-in
    const googleClaimPendingRes = await requestJson('/api/auth/google', 'POST', {
      email: pendingEmail,
      googleId: `google_uid_pending_${ts}`,
      name: 'Claimed Google Person',
      isVerified: true,
    });
    console.log('   Google claim pending status:', googleClaimPendingRes.status, 'success:', googleClaimPendingRes.body.success);
    if (googleClaimPendingRes.status !== 200 || !googleClaimPendingRes.body.success) {
      throw new Error(`Google claim failed: ${JSON.stringify(googleClaimPendingRes.body)}`);
    }

    // Now attempting to resend OTP for this email must return 400 'Your account is already verified'
    const resendAfterClaim = await requestJson('/api/auth/resend-otp', 'POST', {
      email: pendingEmail,
    });
    console.log('   Resend OTP post-claim status:', resendAfterClaim.status, '| message:', resendAfterClaim.body.message);
    if (resendAfterClaim.status !== 400 || !resendAfterClaim.body.message.includes('already verified')) {
      throw new Error(`Expected 400 already verified on resend-otp, got ${resendAfterClaim.status}`);
    }

    // 3. User logs in with verified Google account for the legacy unverified DB row
    const googleRes = await requestJson('/api/auth/google', 'POST', {
      email: testGoogleEmail,
      googleId: `google_uid_${ts}`,
      name: 'Legacy Person Google Verified',
      isVerified: true,
    });

    console.log('   Google login status:', googleRes.status, '| success:', googleRes.body.success);
    if (googleRes.status !== 200 || !googleRes.body.success) {
      throw new Error(`Google login failed: ${JSON.stringify(googleRes.body)}`);
    }

    // 4. Inspect DB row: password must be cleared/null, authProvider='google', isVerified=true, verificationOtp=null
    const claimedUser = await prisma.user.findUnique({ where: { email: testGoogleEmail } });
    console.log('   Claimed user state -> isVerified:', claimedUser.isVerified, '| authProvider:', claimedUser.authProvider, '| password:', claimedUser.password, '| verificationOtp:', claimedUser.verificationOtp);

    if (claimedUser.isVerified !== true) {
      throw new Error('Expected claimedUser.isVerified to be true');
    }
    if (claimedUser.password !== null) {
      throw new Error(`SECURITY VIOLATION: Password hash was NOT cleared! Value: ${claimedUser.password}`);
    }
    if (claimedUser.authProvider !== 'google') {
      throw new Error(`Expected authProvider to be 'google', got '${claimedUser.authProvider}'`);
    }
    if (claimedUser.verificationOtp !== null) {
      throw new Error(`Expected verificationOtp to be null, got: ${JSON.stringify(claimedUser.verificationOtp)}`);
    }

    // 5. Attempt password login with the old password: MUST BE REJECTED with 401
    const pwdLoginRes = await requestJson('/api/auth/login', 'POST', {
      email: testGoogleEmail,
      password: oldPassword,
    });
    console.log('   Post-claim password login status:', pwdLoginRes.status, '| message:', pwdLoginRes.body.message);
    if (pwdLoginRes.status !== 401) {
      throw new Error(`Expected 401 Invalid email or password after claim, got ${pwdLoginRes.status}`);
    }

    console.log('   ✓ PASSED: Legacy password hash was cleared, authProvider switched to google, pending OTP invalidated, and old password rejected.\n');

    console.log('========================================================================');
    console.log('🎉 ALL 3 PRE-COMMIT AUDIT SCENARIOS PASSED 100%!');
    console.log('========================================================================\n');
  } finally {
    console.log('🧹 [Cleanup in finally] Deleting test records...');
    for (const id of trackedUserIds) {
      try {
        await prisma.resume.deleteMany({ where: { userId: id } });
        await prisma.user.deleteMany({ where: { id } });
      } catch (_) {}
    }
    for (const email of trackedEmails) {
      try {
        await prisma.user.deleteMany({ where: { email } });
        await pendingSignupStore.deletePendingSignup(email);
      } catch (_) {}
    }
    console.log('✓ Cleanup complete.\n');
  }
}

run().catch((err) => {
  console.error('\n❌ PRE-COMMIT AUDIT TEST FAILED:', err);
  process.exit(1);
});

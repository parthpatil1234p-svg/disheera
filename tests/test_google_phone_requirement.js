/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const express = require('express');
const authRoutes = require('../server/routes/authRoutes');
const connectDB = require('../server/config/db');
const User = require('../server/models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message });
});

const runTests = async () => {
  console.log('--- STARTING GOOGLE AUTH PHONE REQUIREMENT TESTS ---');

  // Connect to DB if not already connected
  await connectDB();

  const testEmail1 = `google_student_phone_test_${Date.now()}@example.com`;
  const testEmail2 = `google_student_phone_test2_${Date.now()}@example.com`;
  const testPhone = '9876543210';
  const expectedFormattedPhone = '+919876543210';

  // Clean up any remnants just in case
  await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });
  await User.deleteMany({ phone: expectedFormattedPhone });

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/auth`;

    try {
      // 1. New user without phone: must return requirePhone: true
      console.log('\n[TEST 1] New Google user without phone...');
      const res1 = await fetch(`${baseUrl}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail1,
          name: 'Google Student One',
          googleId: `gid_test_${Date.now()}`,
          picture: 'https://example.com/photo.jpg',
        }),
      });
      const data1 = await res1.json();
      console.log('  Status:', res1.status);
      console.log('  Response:', data1);

      if (res1.status === 200 && data1.success === false && data1.requirePhone === true) {
        console.log('  ✓ PASS: requirePhone: true returned as expected.');
      } else {
        throw new Error(`FAIL in Test 1: expected requirePhone: true, got ${JSON.stringify(data1)}`);
      }

      // Verify no user record created in DB
      const userInDb1 = await User.findOne({ email: testEmail1 });
      if (!userInDb1) {
        console.log('  ✓ PASS: User not created without phone number.');
      } else {
        throw new Error('FAIL in Test 1: User was prematurely saved in database without phone!');
      }

      // 2. Short/invalid phone: must return 400
      console.log('\n[TEST 2] Google user with invalid/short phone (e.g. "123")...');
      const res2 = await fetch(`${baseUrl}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail1,
          name: 'Google Student One',
          googleId: `gid_test_${Date.now()}`,
          phone: '123',
        }),
      });
      const data2 = await res2.json();
      console.log('  Status:', res2.status);
      console.log('  Response:', data2);

      if (res2.status === 400 && data2.success === false && data2.message.includes('10-digit mobile number')) {
        console.log('  ✓ PASS: Invalid phone rejected with HTTP 400.');
      } else {
        throw new Error(`FAIL in Test 2: expected 400 invalid phone, got ${res2.status} ${JSON.stringify(data2)}`);
      }

      // 3. New user with valid 10-digit phone: must require OTP verification first
      console.log('\n[TEST 3] Google user with valid 10-digit phone ("9876543210")...');
      const res3a = await fetch(`${baseUrl}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail1,
          name: 'Google Student One',
          googleId: `gid_test_${Date.now()}`,
          phone: testPhone,
        }),
      });
      const data3a = await res3a.json();
      console.log('  Status (initial phone submission):', res3a.status);
      console.log('  Response requireOtp:', data3a.requireOtp);

      if (res3a.status === 200 && data3a.requireOtp === true) {
        console.log('  ✓ PASS: Initial phone submission strictly requires WhatsApp OTP verification (requireOtp: true).');
      } else {
        throw new Error(`FAIL in Test 3a: expected requireOtp: true, got ${JSON.stringify(data3a)}`);
      }

      // Test 3b: Wrong OTP rejected with HTTP 400
      console.log('  Testing wrong OTP rejection...');
      const res3b = await fetch(`${baseUrl}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail1,
          name: 'Google Student One',
          googleId: `gid_test_${Date.now()}`,
          phone: testPhone,
          otp: '000000',
        }),
      });
      const data3b = await res3b.json();
      if (res3b.status === 400 && data3b.success === false) {
        console.log('  ✓ PASS: Invalid OTP rejected with HTTP 400.');
      } else {
        throw new Error(`FAIL in Test 3b: expected 400 invalid OTP, got ${res3b.status} ${JSON.stringify(data3b)}`);
      }

      // Test 3c: Valid OTP completes registration & issues token
      console.log('  Testing valid OTP completion...');
      const validOtp = data3a.backupOtp || '999999';
      const res3c = await fetch(`${baseUrl}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail1,
          name: 'Google Student One',
          googleId: `gid_test_${Date.now()}`,
          phone: testPhone,
          otp: validOtp,
        }),
      });
      const data3c = await res3c.json();
      console.log('  Status:', res3c.status);
      console.log('  User phone in response:', data3c.data?.user?.phone);

      if (
        (res3c.status === 200 || res3c.status === 201) &&
        data3c.success === true &&
        data3c.data?.token &&
        data3c.data?.user?.phone === expectedFormattedPhone
      ) {
        console.log(`  ✓ PASS: User created successfully after verifying OTP: ${data3c.data.user.phone}`);
      } else {
        throw new Error(`FAIL in Test 3c: expected success with formatted phone, got ${JSON.stringify(data3c)}`);
      }

      // Verify persisted in DB
      const userInDb3 = await User.findOne({ email: testEmail1 });
      if (userInDb3 && userInDb3.phone === expectedFormattedPhone) {
        console.log(`  ✓ PASS: Database confirms user.phone is strictly "${userInDb3.phone}".`);
      } else {
        throw new Error(`FAIL in Test 3: DB user.phone mismatch: ${userInDb3?.phone}`);
      }

      // 4. Subsequent login by same user WITHOUT passing phone: must log in instantly
      console.log('\n[TEST 4] Subsequent login by existing user (without passing phone in body)...');
      const res4 = await fetch(`${baseUrl}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail1,
          name: 'Google Student One',
          googleId: `gid_test_${Date.now()}`,
        }),
      });
      const data4 = await res4.json();
      console.log('  Status:', res4.status);
      console.log('  Success:', data4.success);

      if (res4.status === 200 && data4.success === true && data4.data?.token && data4.data?.user?.phone === expectedFormattedPhone) {
        console.log('  ✓ PASS: Existing user with phone in DB logs in instantly without re-prompting.');
      } else {
        throw new Error(`FAIL in Test 4: expected instant login for existing user, got ${JSON.stringify(data4)}`);
      }

      // 5. Duplicate phone collision: different email attempts to register with same phone
      console.log('\n[TEST 5] Duplicate phone collision check across distinct accounts...');
      const res5 = await fetch(`${baseUrl}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail2,
          name: 'Google Student Two',
          googleId: `gid_test2_${Date.now()}`,
          phone: testPhone,
        }),
      });
      const data5 = await res5.json();
      console.log('  Status:', res5.status);
      console.log('  Response:', data5);

      if (res5.status === 400 && data5.success === false && data5.message.includes('already linked')) {
        console.log('  ✓ PASS: Duplicate phone collision blocked with clear message.');
      } else {
        throw new Error(`FAIL in Test 5: expected 400 duplicate collision, got ${res5.status} ${JSON.stringify(data5)}`);
      }

      // 6. Existing user in DB whose phone is empty/null: must require phone, then save on submit
      console.log('\n[TEST 6] Existing user in DB with empty phone...');
      const testEmail3 = `google_student_emptyphone_${Date.now()}@example.com`;
      const testPhone3 = '9123456789';
      const expectedFormattedPhone3 = '+919123456789';
      
      const legacyUser = new User({
        name: 'Legacy User',
        email: testEmail3,
        phone: '',
        authProvider: 'google',
        googleId: `gid_legacy_${Date.now()}`,
        isVerified: true,
      });
      await legacyUser.save();

      // Attempt login without phone -> must requirePhone: true
      const res6a = await fetch(`${baseUrl}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail3,
          googleId: legacyUser.googleId,
        }),
      });
      const data6a = await res6a.json();
      if (res6a.status === 200 && data6a.success === false && data6a.requirePhone === true) {
        console.log('  ✓ PASS: Existing user with empty phone correctly prompted (requirePhone: true).');
      } else {
        throw new Error(`FAIL in Test 6a: expected requirePhone: true for legacy user, got ${JSON.stringify(data6a)}`);
      }

      // Supply phone -> must require OTP, then verify OTP to update legacy user's phone in DB
      const res6b1 = await fetch(`${baseUrl}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail3,
          googleId: legacyUser.googleId,
          phone: testPhone3,
        }),
      });
      const data6b1 = await res6b1.json();
      if (res6b1.status === 200 && data6b1.requireOtp === true) {
        console.log('  ✓ PASS: Legacy user phone submission strictly requires OTP (requireOtp: true).');
      } else {
        throw new Error(`FAIL in Test 6b1: expected requireOtp: true, got ${JSON.stringify(data6b1)}`);
      }

      const legacyOtp = data6b1.backupOtp || '999999';
      const res6b2 = await fetch(`${baseUrl}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail3,
          googleId: legacyUser.googleId,
          phone: testPhone3,
          otp: legacyOtp,
        }),
      });
      const data6b2 = await res6b2.json();
      const updatedLegacyUser = await User.findOne({ email: testEmail3 });
      if (res6b2.status === 200 && data6b2.success === true && updatedLegacyUser.phone === expectedFormattedPhone3) {
        console.log(`  ✓ PASS: Legacy user's phone successfully updated in DB after OTP verification to ${updatedLegacyUser.phone}.`);
      } else {
        throw new Error(`FAIL in Test 6b2: expected phone update, got DB phone=${updatedLegacyUser?.phone}`);
      }

      // Clean up legacy test user
      await User.deleteMany({ email: testEmail3 });

      console.log('\n======================================================');
      console.log('🎉 ALL 6 GOOGLE AUTH PHONE REQUIREMENT TESTS PASSED!');
      console.log('======================================================\n');
    } catch (err) {
      console.error('\n❌ TEST RUNNER ERROR:', err);
      process.exitCode = 1;
    } finally {
      // Cleanup test data
      await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });
      await User.deleteMany({ phone: expectedFormattedPhone });
      server.close();
      process.exit(process.exitCode || 0);
    }
  });
};

runTests();

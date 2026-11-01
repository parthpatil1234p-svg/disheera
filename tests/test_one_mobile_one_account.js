/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/test_one_mobile_one_account.js
 * Comprehensive automated verification for strict 1:1 mobile number uniqueness across the system.
 */
const express = require('express');
const authRoutes = require('../server/routes/authRoutes');
const recruiterRoutes = require('../server/routes/recruiterRoutes');
const userRoutes = require('../server/routes/userRoutes');
const connectDB = require('../server/config/db');
const User = require('../server/models/User');
const pendingSignupStore = require('../server/data/pendingSignupStore');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/users', userRoutes);

// Standard error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message, code: err.code });
});

const runTests = async () => {
  console.log('--- STARTING 1:1 MOBILE NUMBER TO ONE ACCOUNT SYSTEM TESTS ---');

  await connectDB();

  const timestamp = Date.now();
  const testPhoneRaw = '9876500111';
  const testPhoneFormatted = '+919876500111';
  const testEmailA = `student_1to1_a_${timestamp}@example.com`;
  const testEmailB = `student_1to1_b_${timestamp}@example.com`;
  const testEmailC = `student_1to1_c_${timestamp}@example.com`;
  const testEmailRecruiter = `recruiter_${timestamp}@corporatetest.com`;
  const testEmailD = `student_1to1_d_${timestamp}@example.com`;

  // Pre-cleanup
  await User.deleteMany({ email: { $in: [testEmailA, testEmailB, testEmailC, testEmailRecruiter, testEmailD] } });
  await User.deleteMany({ phone: testPhoneFormatted });
  await pendingSignupStore.deletePendingSignup(testEmailA);
  await pendingSignupStore.deletePendingSignup(testEmailB);
  await pendingSignupStore.deletePendingSignup(testEmailRecruiter);

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const authUrl = `http://localhost:${port}/api/auth`;
    const recruiterUrl = `http://localhost:${port}/api/recruiter`;
    const userUrl = `http://localhost:${port}/api/users`;

    try {
      // 1. Live phone pre-check on available phone
      console.log('\n[TEST 1] Pre-check available phone number...');
      const checkRes1 = await fetch(`${authUrl}/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhoneRaw }),
      });
      const checkData1 = await checkRes1.json();
      console.log('  Status:', checkRes1.status);
      console.log('  Response:', checkData1);

      if (checkRes1.status === 200 && checkData1.available === true) {
        console.log('  ✓ PASS: Phone is available for new registration.');
      } else {
        throw new Error(`FAIL in Test 1: expected available: true, got ${JSON.stringify(checkData1)}`);
      }

      // 2. Register Account A with phone
      console.log('\n[TEST 2] Register Account A with phone number...');
      const regResA = await fetch(`${authUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Student Account A',
          email: testEmailA,
          password: 'Password@123',
          phone: testPhoneRaw,
        }),
      });
      const regDataA = await regResA.json();
      console.log('  Status:', regResA.status);
      console.log('  Success:', regDataA.success, 'requiresOtp:', regDataA.requiresOtp);

      if (regResA.status === 201 && regDataA.success === true && regDataA.requiresOtp === true) {
        console.log('  ✓ PASS: Account A initiated registration and received OTP requirement.');
      } else {
        throw new Error(`FAIL in Test 2: registration failed: ${JSON.stringify(regDataA)}`);
      }

      // 3. Pre-check phone availability while Account A is pending
      console.log('\n[TEST 3] Pre-check phone availability while Account A is pending verification...');
      const checkRes2 = await fetch(`${authUrl}/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhoneRaw }),
      });
      const checkData2 = await checkRes2.json();
      console.log('  Status:', checkRes2.status);
      console.log('  Response:', checkData2);

      if (checkData2.available === false && checkData2.code === 'PHONE_ALREADY_EXISTS') {
        console.log('  ✓ PASS: Live pre-check correctly identifies phone is already locked by pending registration.');
      } else {
        throw new Error(`FAIL in Test 3: expected available: false, got ${JSON.stringify(checkData2)}`);
      }

      // 4. Attempt to register Account B with same phone
      console.log('\n[TEST 4] Attempt to register Account B with the same phone number...');
      const regResB = await fetch(`${authUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Student Account B',
          email: testEmailB,
          password: 'Password@123',
          phone: testPhoneRaw,
        }),
      });
      const regDataB = await regResB.json();
      console.log('  Status:', regResB.status);
      console.log('  Response:', regDataB);

      if (regResB.status === 400 && regDataB.code === 'PHONE_ALREADY_EXISTS') {
        console.log('  ✓ PASS: Second registration blocked with PHONE_ALREADY_EXISTS.');
      } else {
        throw new Error(`FAIL in Test 4: expected 400 PHONE_ALREADY_EXISTS, got ${regResB.status} ${JSON.stringify(regDataB)}`);
      }

      // 5. Complete Account A verification
      console.log('\n[TEST 5] Complete Account A verification via OTP...');
      const verifyResA = await fetch(`${authUrl}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-suite': 'true',
        },
        body: JSON.stringify({
          email: testEmailA,
          otp: '999999',
        }),
      });
      const verifyDataA = await verifyResA.json();
      console.log('  Status:', verifyResA.status);
      console.log('  Success:', verifyDataA.success);

      if (verifyResA.status === 200 && verifyDataA.success === true) {
        console.log('  ✓ PASS: Account A verified and persisted in DB.');
      } else {
        throw new Error(`FAIL in Test 5: verification failed: ${JSON.stringify(verifyDataA)}`);
      }

      // Verify user in DB has formatted phone
      const userA = await User.findOne({ email: testEmailA });
      if (userA && userA.phone === testPhoneFormatted) {
        console.log(`  ✓ PASS: Confirmed DB record for Account A has phone "${userA.phone}".`);
      } else {
        throw new Error(`FAIL in Test 5: DB record missing or phone mismatch: ${userA?.phone}`);
      }

      // 6. Attempt to register Account C with verified phone
      console.log('\n[TEST 6] Attempt to register Account C with now-verified phone...');
      const regResC = await fetch(`${authUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Student Account C',
          email: testEmailC,
          password: 'Password@123',
          phone: testPhoneRaw,
        }),
      });
      const regDataC = await regResC.json();
      console.log('  Status:', regResC.status);
      console.log('  Response:', regDataC);

      if (regResC.status === 400 && regDataC.code === 'PHONE_ALREADY_EXISTS') {
        console.log('  ✓ PASS: Account C registration blocked by verified account phone lock.');
      } else {
        throw new Error(`FAIL in Test 6: expected 400 PHONE_ALREADY_EXISTS, got ${regResC.status} ${JSON.stringify(regDataC)}`);
      }

      // 7. Attempt Corporate Recruiter registration with same phone
      console.log('\n[TEST 7] Attempt Corporate Recruiter registration with same phone...');
      const regResRecruiter = await fetch(`${recruiterUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Corporate Recruiter',
          title: 'Senior Tech Recruiter',
          email: testEmailRecruiter,
          companyName: 'Test Tech Corp',
          website: 'https://corporatetest.com',
          password: 'Password@123',
          workPhone: testPhoneRaw,
        }),
      });
      const regDataRecruiter = await regResRecruiter.json();
      console.log('  Status:', regResRecruiter.status);
      console.log('  Response:', regDataRecruiter);

      if (regResRecruiter.status === 400 && regDataRecruiter.code === 'PHONE_ALREADY_EXISTS') {
        console.log('  ✓ PASS: Recruiter registration blocked from stealing registered mobile number.');
      } else {
        throw new Error(`FAIL in Test 7: expected 400 PHONE_ALREADY_EXISTS, got ${regResRecruiter.status} ${JSON.stringify(regDataRecruiter)}`);
      }

      // 8. Attempt Phone Linking from another account
      console.log('\n[TEST 8] Attempt Phone Linking from Account D...');
      const userD = new User({
        name: 'Student Account D',
        email: testEmailD,
        password: 'hashed_pw_dummy',
        role: 'student',
        isVerified: true,
      });
      await userD.save();

      const tokenD = jwt.sign(
        { id: userD._id.toString(), email: userD.email, role: userD.role },
        process.env.JWT_SECRET || 'careerpath_ai_super_secret_jwt_key_2026',
        { expiresIn: '1h' }
      );

      const linkRes = await fetch(`${userUrl}/link-phone/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenD}`,
        },
        body: JSON.stringify({ phone: testPhoneRaw }),
      });
      const linkData = await linkRes.json();
      console.log('  Status:', linkRes.status);
      console.log('  Response:', linkData);

      if (linkRes.status === 400 && linkData.code === 'PHONE_ALREADY_EXISTS') {
        console.log('  ✓ PASS: Phone linking blocked with PHONE_ALREADY_EXISTS.');
      } else {
        throw new Error(`FAIL in Test 8: expected 400 PHONE_ALREADY_EXISTS, got ${linkRes.status} ${JSON.stringify(linkData)}`);
      }

      // 9. Physical Database Constraint Verification
      console.log('\n[TEST 9] Physical Database Unique Constraint Check...');
      let dbConstraintCaught = false;
      try {
        const rogueUser = new User({
          name: 'Rogue Account',
          email: `rogue_${timestamp}@example.com`,
          password: 'pw',
          phone: testPhoneFormatted, // identical phone
          isVerified: true,
        });
        await rogueUser.save();
      } catch (dbErr) {
        dbConstraintCaught = true;
        console.log('  Database caught collision as expected:', dbErr.message);
      }

      if (dbConstraintCaught) {
        console.log('  ✓ PASS: Physical database partial unique index strictly prevents duplicate phone numbers.');
      } else {
        throw new Error('FAIL in Test 9: Physical DB unique constraint did not fire!');
      }

      // Cleanup
      await User.deleteMany({ email: { $in: [testEmailA, testEmailB, testEmailC, testEmailRecruiter, testEmailD, `rogue_${timestamp}@example.com`] } });
      await User.deleteMany({ phone: testPhoneFormatted });
      await pendingSignupStore.deletePendingSignup(testEmailA);

      console.log('\n=================================================================');
      console.log('🎉 ALL 9 ONE-MOBILE-ONE-ACCOUNT UNIQUENESS TESTS PASSED 100%!');
      console.log('=================================================================\n');

      server.close();
      process.exit(0);
    } catch (err) {
      console.error('\n❌ TEST RUN FAILED:', err);
      server.close();
      process.exit(1);
    }
  });
};

runTests();

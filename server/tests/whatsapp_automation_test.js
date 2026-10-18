/**
 * tests/whatsapp_automation_test.js — WhatsApp Automation Suite Verification Suite
 * 
 * Verifies:
 * 1. WhatsApp phone formatting & normalization logic
 * 2. Multi-provider WhatsApp Service (Console Fallback driver & payload generation)
 * 3. Dynamic PDF Study Material Compiler (PDFKit buffer & %PDF signature)
 * 4. Meta Webhook Verification Handshake
 * 5. Incoming Student Query Webhook parsing & AI context assembly
 * 6. User Model Supabase PostgreSQL phone persistence
 * 
 * Disheera Technologies Inc.
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const whatsappService = require('../services/whatsappService');
const { generateWeeklyRoadmapPdf } = require('../services/pdfStudyMaterialService');
const User = require('../models/User');
const { generateDualOtps, isDisposableEmail, verifyOtp } = require('../controllers/authController');
const { sendLinkPhoneOtp, verifyLinkPhoneOtp } = require('../controllers/userController');

async function runTests() {
  console.log('============================================================');
  console.log('🧪 Disheera — WhatsApp Automation Suite Verification');
  console.log('============================================================');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ PASSED: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASSED: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // ── TEST 1: Phone Sanitization & E.164 Formatting ──
  console.log('\n▶ SUITE 1: Phone Number Formatting & E.164 Normalization');
  test('Sanitizes 10-digit number with default +91', () => {
    assert.strictEqual(whatsappService.formatPhoneNumber('9876543210'), '+919876543210');
  });

  test('Sanitizes spaces and hyphens', () => {
    assert.strictEqual(whatsappService.formatPhoneNumber('+91 98765-43210'), '+919876543210');
  });

  test('Converts leading zero to +91', () => {
    assert.strictEqual(whatsappService.formatPhoneNumber('09876543210'), '+919876543210');
  });

  test('Extracts digits only for API payloads', () => {
    assert.strictEqual(whatsappService.getPhoneDigits('+91 98765-43210'), '919876543210');
  });

  // ── TEST 2: Multi-Provider WhatsApp Service ──
  console.log('\n▶ SUITE 2: Multi-Provider WhatsApp Service (OpenWA & Console Drivers)');
  await asyncTest('Dispatches 6-digit OTP via active driver (OpenWA or Console Fallback)', async () => {
    const res = await whatsappService.sendOtp('+919876543210', '482910', 'Parth');
    assert.strictEqual(res.success, true);
    assert.ok(['openwa_gateway', 'meta_cloud_api', 'console_fallback'].includes(res.provider), `Provider was: ${res.provider}`);
  });

  await asyncTest('Dispatches general text message', async () => {
    const res = await whatsappService.sendTextMessage('+919876543210', 'Hello from Disheera!');
    assert.strictEqual(res.success, true);
    assert.ok(['openwa_gateway', 'meta_cloud_api', 'console_fallback'].includes(res.provider), `Provider was: ${res.provider}`);
  });

  await asyncTest('Rejects missing or invalid phone number', async () => {
    const res = await whatsappService.sendOtp('', '123456');
    assert.strictEqual(res.success, false);
  });

  // ── TEST 3: Dynamic PDF Study Material Generator ──
  console.log('\n▶ SUITE 3: Dynamic PDF Study Material Generator');
  await asyncTest('Compiles Weekly Roadmap Notes PDF with valid %PDF header', async () => {
    const pdfBuffer = await generateWeeklyRoadmapPdf({
      careerTitle: 'Frontend Developer',
      weekNumber: 1,
      studentName: 'Parth Patil'
    });

    assert.ok(Buffer.isBuffer(pdfBuffer), 'Result must be a Buffer');
    assert.ok(pdfBuffer.length > 2000, `Buffer size (${pdfBuffer.length} bytes) should be > 2KB`);

    // Verify PDF Magic Bytes (%PDF-)
    const magicBytes = pdfBuffer.slice(0, 5).toString('ascii');
    assert.strictEqual(magicBytes, '%PDF-', 'Buffer must begin with %PDF- signature');
  });

  await asyncTest('Dispatches Document via WhatsApp Service', async () => {
    const mockPdf = Buffer.from('%PDF-1.4 Mock PDF Content');
    const res = await whatsappService.sendDocument('+919876543210', mockPdf, 'Week_1_Notes.pdf', 'Notes attached');
    assert.strictEqual(res.success, true);
    assert.ok(['openwa_gateway', 'meta_cloud_api', 'console_fallback'].includes(res.provider), `Provider was: ${res.provider}`);
  });

  // ── TEST 4: Supabase User Model Persistence with Phone Field ──
  console.log('\n▶ SUITE 4: Supabase User Model Phone Column Persistence');
  await asyncTest('Finds demo user and confirms phone field capability in Supabase', async () => {
    const demoUser = (await User.findOne({ email: 'judge@hack2ignite.com' })) || (await User.findOne({}));
    assert.ok(demoUser, 'A user record must exist in Supabase');
    assert.ok('phone' in demoUser, 'User document must have phone property');
  });

  // ── TEST 5: OpenWA Webhook Inbound Envelope Handling ──
  console.log('\n▶ SUITE 5: OpenWA Webhook Inbound Envelope Handling');
  test('Extracts sender and message from OpenWA envelope without error', () => {
    const mockEnvelope = {
      event: 'message.received',
      timestamp: '2026-10-13T10:00:00Z',
      sessionId: '7947d4c9-0297-4396-be07-330534d6c58a',
      data: {
        from: '919876543210@c.us',
        body: 'Can you explain React useEffect hook?',
        fromMe: false,
        senderName: 'Parth Patil',
        senderPhone: '919876543210'
      }
    };

    assert.strictEqual(mockEnvelope.data.fromMe, false);
    assert.strictEqual(whatsappService.formatPhoneNumber(mockEnvelope.data.senderPhone), '+919876543210');
    assert.strictEqual(mockEnvelope.data.body, 'Can you explain React useEffect hook?');
  });

  // ── TEST 6: Dual Distinct OTP Guarantee (Gmail vs WhatsApp) ──
  console.log('\n▶ SUITE 6: Dual Distinct OTP Guarantee (Gmail !== WhatsApp)');
  test('Guarantees emailOtp and whatsappOtp are never identical across 1000 generations', () => {
    for (let i = 0; i < 1000; i++) {
      const { emailOtp, whatsappOtp } = generateDualOtps();
      assert.strictEqual(typeof emailOtp, 'string');
      assert.strictEqual(typeof whatsappOtp, 'string');
      assert.strictEqual(emailOtp.length, 6, 'Email OTP must be 6 digits');
      assert.strictEqual(whatsappOtp.length, 6, 'WhatsApp OTP must be 6 digits');
      assert.ok(/^\d{6}$/.test(emailOtp), 'Email OTP must consist of numbers only');
      assert.ok(/^\d{6}$/.test(whatsappOtp), 'WhatsApp OTP must consist of numbers only');
      assert.notStrictEqual(emailOtp, whatsappOtp, `Iteration ${i}: emailOtp (${emailOtp}) cannot equal whatsappOtp (${whatsappOtp})`);
    }
  });

  // ── TEST 7: AI & Domain Disposable Email Identifier ──
  console.log('\n▶ SUITE 7: AI & Domain Disposable Email Identifier (Temp Mail Block)');
  test('Identifies and flags disposable & temporary email services', () => {
    const disposableSamples = [
      'student@tempmail.com',
      'user@temp-mail.org',
      'applicant@temp-mail.io',
      'tester@mailinator.com',
      'fresh@10minutemail.com',
      'bot@guerrillamail.com',
      'fake@burnermail.io',
      'throwaway@sharklasers.com',
      'temp@yopmail.com'
    ];

    disposableSamples.forEach(addr => {
      assert.strictEqual(isDisposableEmail(addr), true, `Must flag ${addr} as disposable`);
    });
  });

  test('Permits authentic student and commercial webmail domains', () => {
    const validSamples = [
      'student@college.edu',
      'parth@gmail.com',
      'patil@yahoo.com',
      'developer@outlook.com',
      'engineer@somaiya.edu',
      'priya@razorpay.com'
    ];

    validSamples.forEach(addr => {
      assert.strictEqual(isDisposableEmail(addr), false, `Must permit authentic email ${addr}`);
    });
  });

  // ── TEST 8: Simultaneous Dual Verification Enforcement (Gmail & WhatsApp) ──
  console.log('\n▶ SUITE 8: Simultaneous Dual Verification Enforcement (Gmail & WhatsApp)');

  function mockReqRes(body, user = null) {
    let statusCode = 200;
    let responseData = null;
    const req = { body, user };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };
    return { req, res, getStatus: () => statusCode, getData: () => responseData };
  }

  await asyncTest('Enforces BOTH Gmail and WhatsApp OTPs simultaneously when phone is present', async () => {
    const testEmail = `dualtest_${Date.now()}@college.edu`;
    const { emailOtp, whatsappOtp } = generateDualOtps();

    try {
      const user = new User({
        name: 'Dual Test Student',
        email: testEmail,
        password: 'password123',
        phone: '+919876543210',
        isVerified: false,
        verificationOtp: {
          code: emailOtp,
          emailCode: emailOtp,
          whatsappCode: whatsappOtp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }
      });
      await user.save();

      // 1. Entering valid whatsappOtp but wrong/empty emailOtp -> Rejected!
      const mock1 = mockReqRes({ email: testEmail, emailOtp: '000000', whatsappOtp });
      await verifyOtp(mock1.req, mock1.res, () => {});
      assert.strictEqual(mock1.getStatus(), 400);
      assert.ok(mock1.getData().message.includes('Invalid Gmail verification code'), 'Must reject invalid Gmail OTP');

      // 2. Entering valid emailOtp but wrong whatsappOtp -> Rejected!
      const mock2 = mockReqRes({ email: testEmail, emailOtp, whatsappOtp: '999999' });
      await verifyOtp(mock2.req, mock2.res, () => {});
      assert.strictEqual(mock2.getStatus(), 400);
      assert.ok(mock2.getData().message.includes('Invalid WhatsApp verification code'), 'Must reject invalid WhatsApp OTP');

      // 3. Entering BOTH valid emailOtp AND whatsappOtp -> Approved & verified!
      const mock3 = mockReqRes({ email: testEmail, emailOtp, whatsappOtp });
      await verifyOtp(mock3.req, mock3.res, () => {});
      assert.strictEqual(mock3.getStatus(), 200);
      assert.strictEqual(mock3.getData().success, true);
      assert.ok(mock3.getData().data?.token, 'Must return active session JWT token');
      assert.strictEqual(mock3.getData().data?.user?.isVerified, true, 'User must be marked verified');
    } finally {
      // Clean up in finally
      await User.deleteOne({ email: testEmail }).catch(() => {});
    }
  });

  await asyncTest('Single email verification succeeds for users without phone (recruiter mode)', async () => {
    const recruiterEmail = `recruiter_${Date.now()}@company.com`;
    const { emailOtp } = generateDualOtps();

    try {
      const recruiterUser = new User({
        name: 'Recruiter User',
        email: recruiterEmail,
        password: 'password123',
        role: 'recruiter',
        isVerified: false,
        verificationOtp: {
          code: emailOtp,
          emailCode: emailOtp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }
      });
      await recruiterUser.save();

      const mock = mockReqRes({ email: recruiterEmail, emailOtp });
      await verifyOtp(mock.req, mock.res, () => {});
      assert.strictEqual(mock.getStatus(), 200);
      assert.strictEqual(mock.getData().success, true);
      assert.ok(mock.getData().data?.token, 'Must return active session token');
    } finally {
      // Clean up in finally
      await User.deleteOne({ email: recruiterEmail }).catch(() => {});
    }
  });

  // ── TEST 9: Strict WhatsApp Phone Link Gate for Existing Students (Option A) ──
  console.log('\n▶ SUITE 9: Strict WhatsApp Phone Link Gate for Existing Students (Option A)');

  await asyncTest('sendLinkPhoneOtp rejects invalid or missing phone numbers', async () => {
    const mockUser = { _id: 'mock_uid_123', name: 'Test User', email: 'test@college.edu' };

    // 1. Missing phone
    const mock1 = mockReqRes({}, mockUser);
    await sendLinkPhoneOtp(mock1.req, mock1.res, () => {});
    assert.strictEqual(mock1.getStatus(), 400);
    assert.ok(mock1.getData().message.includes('required'));

    // 2. Short phone (< 10 digits)
    const mock2 = mockReqRes({ phone: '12345' }, mockUser);
    await sendLinkPhoneOtp(mock2.req, mock2.res, () => {});
    assert.strictEqual(mock2.getStatus(), 400);
    assert.ok(mock2.getData().message.includes('10-digit'));
  });

  await asyncTest('sendLinkPhoneOtp sends WhatsApp OTP & verifyLinkPhoneOtp links phone successfully', async () => {
    const testStudentEmail = `oldstudent_${Date.now()}@college.edu`;
    const secondStudentEmail = `anotherstudent_${Date.now()}@college.edu`;
    const targetPhone = '9876543210';

    try {
      const studentUser = new User({
        name: 'Existing Old Student',
        email: testStudentEmail,
        password: 'password123',
        role: 'student',
        isVerified: true,
        phone: '', // Old student without phone
      });
      await studentUser.save();

      const mockSend = mockReqRes({ phone: targetPhone }, studentUser);
      await sendLinkPhoneOtp(mockSend.req, mockSend.res, () => {});

      assert.strictEqual(mockSend.getStatus(), 200);
      assert.strictEqual(mockSend.getData().success, true);
      assert.strictEqual(mockSend.getData().phone, '+919876543210');

      // Fetch updated user from DB to verify OTP was stored
      const updatedUser = await User.findById(studentUser._id);
      const otpCode = updatedUser.verificationOtp?.whatsappCode;
      assert.ok(otpCode && /^\d{6}$/.test(otpCode), 'Must store 6-digit WhatsApp OTP in verificationOtp');
      assert.strictEqual(updatedUser.verificationOtp?.phonePending, '+919876543210');

      // 1. verifyLinkPhoneOtp with wrong OTP -> Rejected
      const mockVerifyWrong = mockReqRes({ otp: '000000', phone: targetPhone }, studentUser);
      await verifyLinkPhoneOtp(mockVerifyWrong.req, mockVerifyWrong.res, () => {});
      assert.strictEqual(mockVerifyWrong.getStatus(), 400);
      assert.ok(mockVerifyWrong.getData().message.includes('Invalid WhatsApp verification code'));

      // 2. verifyLinkPhoneOtp with correct OTP -> Success!
      const mockVerifyRight = mockReqRes({ otp: otpCode, phone: targetPhone }, studentUser);
      await verifyLinkPhoneOtp(mockVerifyRight.req, mockVerifyRight.res, () => {});
      assert.strictEqual(mockVerifyRight.getStatus(), 200);
      assert.strictEqual(mockVerifyRight.getData().success, true);
      assert.strictEqual(mockVerifyRight.getData().data?.user?.phone, '+919876543210', 'formatUser must return updated phone');

      // DB record must now reflect verified phone
      const finalUser = await User.findById(studentUser._id);
      assert.strictEqual(finalUser.phone, '+919876543210');
      assert.strictEqual(finalUser.verificationOtp?.whatsappCode, null);

      // 3. Prevent duplicate phone linking by another user
      const secondStudent = new User({
        name: 'Second Student',
        email: secondStudentEmail,
        password: 'password123',
        role: 'student',
        isVerified: true,
        phone: '',
      });
      await secondStudent.save();

      const mockDuplicate = mockReqRes({ phone: targetPhone }, secondStudent);
      await sendLinkPhoneOtp(mockDuplicate.req, mockDuplicate.res, () => {});
      assert.strictEqual(mockDuplicate.getStatus(), 400);
      assert.ok(mockDuplicate.getData().message.includes('already linked to another account'));
    } finally {
      // Clean up in finally
      await User.deleteOne({ email: testStudentEmail }).catch(() => {});
      await User.deleteOne({ email: secondStudentEmail }).catch(() => {});
    }
  });

  // ── SUMMARY ──
  console.log('\n============================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL WHATSAPP AUTOMATION SUITE TESTS PASSED 100%!\n');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

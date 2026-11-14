/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/tpo_cockpit_e2e_test.js — Campus TPO Cockpit & College OS E2E Test Suite
 */

const { prisma } = require('../config/prisma');
const tpoAuthController = require('../controllers/tpoAuthController');
const tpoDashboardController = require('../controllers/tpoDashboardController');
const { findInstitution, isConsumerEmail } = require('../data/aisheMasterRegistry');

async function runTestSuite() {
  console.log('🧪 Starting Campus TPO Cockpit & College OS Test Suite...\n');

  // ── Test 1: AISHE Master Registry Lookup ──────────────────
  console.log('Test 1: AISHE Code Lookup for COEP Technological University (C-41234)...');
  const coep = findInstitution('C-41234');
  if (coep && coep.name.includes('COEP') && coep.domain === 'coep.ac.in') {
    console.log(`  ✓ Found institution: ${coep.name} | NAAC: ${coep.naacGrade} | Domain: ${coep.domain}`);
  } else {
    throw new Error('COEP lookup failed in master registry');
  }

  // ── Test 2: Tier 1 Consumer Email Rejection ───────────────
  console.log('\nTest 2: Tier 1 Consumer Email Gate Check...');
  const isGmailBlocked = isConsumerEmail('tpo.placement@gmail.com');
  const isYahooBlocked = isConsumerEmail('director@yahoo.com');
  const isEduAllowed = isConsumerEmail('placements@coep.ac.in');

  if (isGmailBlocked && isYahooBlocked && !isEduAllowed) {
    console.log('  ✓ Correctly identified consumer domains as blocked and academic domain as allowed.');
  } else {
    throw new Error('Consumer email domain gate logic failure');
  }

  // ── Test 3: TPO Registration Simulation ───────────────────
  console.log('\nTest 3: TPO Institutional Registration with AISHE Linking...');
  const testTpoEmail = `tpo.test.${Date.now()}@coep.ac.in`;

  const mockReq = {
    body: {
      name: 'Dr. Suresh Patil',
      designation: 'Head, Training & Placement Cell',
      email: testTpoEmail,
      phone: '+919876543210',
      password: 'SecureTpoPassword123!',
      collegeName: 'COEP Technological University',
      aisheCode: 'C-41234',
      domain: 'coep.ac.in'
    }
  };

  let registeredData = null;
  const mockRes = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (payload) {
      this.data = payload;
      return this;
    }
  };

  await tpoAuthController.registerTpo(mockReq, mockRes);

  if (mockRes.statusCode === 201 && mockRes.data.success) {
    registeredData = mockRes.data;
    console.log(`  ✓ TPO Registered: ${registeredData.user.name} (${registeredData.college.name})`);
    console.log(`  ✓ College Invite Code Generated: ${registeredData.college.inviteCode}`);
    console.log(`  ✓ Initial Status: ${registeredData.status}`);
  } else {
    throw new Error(`Registration failed: ${mockRes.data?.message || 'Unknown error'}`);
  }

  // ── Test 4: OTP Verification ──────────────────────────────
  console.log('\nTest 4: Tier 2 Email OTP Verification...');
  // Read OTP from DB
  const createdUser = await prisma.user.findUnique({
    where: { email: testTpoEmail }
  });

  const otpCode = createdUser.verificationOtp?.code;
  if (!otpCode) throw new Error('OTP was not generated in user record');

  const otpReq = {
    user: { id: createdUser.id },
    body: { otp: otpCode }
  };
  const otpRes = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (payload) { this.data = payload; return this; }
  };

  await tpoAuthController.verifyOtp(otpReq, otpRes);
  if (otpRes.statusCode === 200 && otpRes.data.success) {
    console.log('  ✓ OTP verified successfully! Account marked emailVerified: true.');
  } else {
    throw new Error(`OTP Verification failed: ${otpRes.data?.message}`);
  }

  // ── Test 5: TPO Login ─────────────────────────────────────
  console.log('\nTest 5: Isolated TPO Login...');
  const loginReq = {
    body: {
      email: testTpoEmail,
      password: 'SecureTpoPassword123!'
    }
  };
  const loginRes = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (payload) { this.data = payload; return this; }
  };

  await tpoAuthController.loginTpo(loginReq, loginRes);
  if (loginRes.statusCode === 200 && loginRes.data.token && loginRes.data.user.role === 'tpo') {
    console.log(`  ✓ TPO Login Succeeded! JWT Token generated.`);
    console.log(`  ✓ Associated College: ${loginRes.data.college.name}`);
  } else {
    throw new Error(`Login failed: ${loginRes.data?.message}`);
  }

  // ── Test 6: Sandbox Telemetry for Pending Account ─────────
  console.log('\nTest 6: Interactive Demo Sandbox Telemetry Generation...');
  const telemReq = {
    user: { id: createdUser.id }
  };
  const telemRes = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (payload) { this.data = payload; return this; }
  };

  await tpoDashboardController.getDashboardTelemetry(telemReq, telemRes);
  if (telemRes.statusCode === 200 && telemRes.data.telemetry) {
    const telem = telemRes.data.telemetry;
    console.log(`  ✓ Telemetry active (Sandbox Mode: ${telem.isSandboxMode})`);
    console.log(`  ✓ NAAC 5.2.1 Placement Rate: ${telem.summary.placementRate}%`);
    console.log(`  ✓ Skill Deficits Identified: ${telem.skillDeficits.length} skills tracked`);
  } else {
    throw new Error(`Telemetry failed: ${telemRes.data?.message}`);
  }

  // ── Test 7: Super-Admin 1-Click Verification Gate ─────────
  console.log('\nTest 7: Super-Admin 1-Click Approval Gate...');
  const approveReq = {
    body: {
      tpoUserId: createdUser.id,
      collegeId: registeredData.college.id
    }
  };
  const approveRes = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (payload) { this.data = payload; return this; }
  };

  await tpoAuthController.approveTpo(approveReq, approveRes);
  if (approveRes.statusCode === 200 && approveRes.data.success) {
    console.log('  ✓ Institution & TPO successfully approved to ROLE_TPO_VERIFIED!');
  } else {
    throw new Error(`Approval failed: ${approveRes.data?.message}`);
  }


  // ── Test 8: Student & Recruiter Access Restriction on TPO Telemetry ────
  console.log('\nTest 8: Student & Recruiter Access Restriction on TPO Telemetry...');
  const studentTelemReq = {
    user: { id: 'some-student-id', role: 'student' }
  };
  const studentTelemRes = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (payload) { this.data = payload; return this; }
  };
  await tpoDashboardController.getDashboardTelemetry(studentTelemReq, studentTelemRes);
  if (studentTelemRes.statusCode === 403 && studentTelemRes.data.code === 'STUDENT_TPO_ACCESS_DENIED') {
    console.log('  ✓ Student access strictly blocked with 403 STUDENT_TPO_ACCESS_DENIED');
  } else {
    throw new Error(`Expected 403 for student but got ${studentTelemRes.statusCode}`);
  }

  const recTelemReq = {
    user: { id: 'some-recruiter-id', role: 'recruiter' }
  };
  const recTelemRes = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (payload) { this.data = payload; return this; }
  };
  await tpoDashboardController.getDashboardTelemetry(recTelemReq, recTelemRes);
  if (recTelemRes.statusCode === 403 && recTelemRes.data.code === 'RECRUITER_TPO_ACCESS_DENIED') {
    console.log('  ✓ Recruiter access strictly blocked with 403 RECRUITER_TPO_ACCESS_DENIED');
  } else {
    throw new Error(`Expected 403 for recruiter but got ${recTelemRes.statusCode}`);
  }

  // ── Clean up test user & college ──────────────────────────
  console.log('\nCleaning up test artifacts...');
  await prisma.user.delete({ where: { id: createdUser.id } });
  await prisma.college.delete({ where: { id: registeredData.college.id } });
  console.log('  ✓ Test user & college cleaned up.');

  console.log('\n🎉 ALL 8 CAMPUS TPO COCKPIT & RBAC TESTS PASSED CLEANLY!\n');
}

runTestSuite()
  .catch(err => {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

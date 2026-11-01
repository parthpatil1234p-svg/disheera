/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * maintenance_mode_test.js — Automated Verification for Platform Maintenance Mode System
 *
 * Disheera Technologies Inc.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

const assert = require('assert');
const { getMaintenanceConfig, setMaintenanceConfig, isMaintenanceActiveSync } = require('../server/services/maintenanceService');
const { getAdminMaintenanceConfig, updateAdminMaintenanceConfig } = require('../server/controllers/adminSystemController');
const { maintenanceMiddleware } = require('../server/middleware/maintenanceMiddleware');

async function runMaintenanceTests() {
  console.log('--- [Test 1: Service Configuration & Cache] ---');
  const initialConfig = await getMaintenanceConfig();
  assert(initialConfig !== null, 'Initial config should not be null');
  assert(typeof initialConfig.enabled === 'boolean', 'Config should contain boolean enabled flag');
  assert(typeof initialConfig.title === 'string', 'Config should contain title string');
  assert(typeof initialConfig.message === 'string', 'Config should contain message string');
  console.log('✓ Initial config verified:', { enabled: initialConfig.enabled, title: initialConfig.title });

  console.log('\n--- [Test 2: Admin Controller GET Endpoint] ---');
  let getStatus = null;
  let getJson = null;
  const mockGetReq = { admin: { id: 'admin-1', email: 'admin@disheera.site', role: 'ADMIN' } };
  const mockGetRes = {
    status(code) { getStatus = code; return this; },
    json(data) { getJson = data; return this; }
  };

  await getAdminMaintenanceConfig(mockGetReq, mockGetRes);
  assert.strictEqual(getJson.success, true, 'getAdminMaintenanceConfig should return success: true');
  assert(getJson.maintenance, 'Should return maintenance object');
  console.log('✓ Admin GET controller verified successfully');

  console.log('\n--- [Test 3: Middleware Pass-Through When Disabled] ---');
  // Ensure maintenance is disabled
  await setMaintenanceConfig({ enabled: false, title: 'Test Maintenance', message: 'Testing' }, 'test-suite');

  let passedNext = false;
  let sentStatus = null;
  let sentJson = null;

  const mockPublicReq = {
    originalUrl: '/api/assessment/questions',
    path: '/api/assessment/questions',
    headers: {}
  };
  const mockPublicRes = {
    status(code) { sentStatus = code; return this; },
    json(data) { sentJson = data; return this; },
    set() { return this; }
  };

  await maintenanceMiddleware(mockPublicReq, mockPublicRes, () => {
    passedNext = true;
  });

  assert.strictEqual(passedNext, true, 'When disabled, middleware must invoke next()');
  assert.strictEqual(sentStatus, null, 'No 503 should be sent when disabled');
  console.log('✓ Public route cleanly passes through when maintenance is OFF');

  console.log('\n--- [Test 4: Admin Controller POST Endpoint (Toggle ON)] ---');
  let postStatus = null;
  let postJson = null;
  const mockPostReq = {
    admin: { id: 'admin-test', email: 'director@disheera.site', role: 'ADMIN' },
    body: {
      enabled: true,
      title: 'Emergency Core Engine Upgrade',
      message: 'Upgrading diagnostic assessment engine and security patches.',
      startTime: '3:00 PM IST',
      endTime: '4:30 PM IST',
      expectedDuration: 'Approx. 1.5 hours'
    }
  };
  const mockPostRes = {
    status(code) { postStatus = code; return this; },
    json(data) { postJson = data; return this; }
  };

  await updateAdminMaintenanceConfig(mockPostReq, mockPostRes);
  assert.strictEqual(postJson.success, true, 'updateAdminMaintenanceConfig should succeed');
  assert.strictEqual(postJson.maintenance.enabled, true, 'Maintenance should be enabled');
  assert.strictEqual(postJson.maintenance.title, 'Emergency Core Engine Upgrade', 'Title should match');
  assert.strictEqual(postJson.maintenance.startTime, '3:00 PM IST', 'Start time should match');
  assert.strictEqual(postJson.maintenance.endTime, '4:30 PM IST', 'End time should match');
  console.log('✓ Maintenance activated via admin controller with custom schedule');

  console.log('\n--- [Test 5: Middleware Interception When Enabled] ---');
  passedNext = false;
  sentStatus = null;
  sentJson = null;

  await maintenanceMiddleware(mockPublicReq, mockPublicRes, () => {
    passedNext = true;
  });

  assert.strictEqual(passedNext, false, 'Protected public API should NOT call next() during maintenance');
  assert.strictEqual(sentStatus, 503, 'Protected public API must receive HTTP 503 Service Unavailable');
  assert.strictEqual(sentJson.error, 'SERVICE_UNAVAILABLE', 'Expected SERVICE_UNAVAILABLE error code');
  assert.strictEqual(sentJson.maintenance.enabled, true, 'Response must include maintenance metadata');
  assert.strictEqual(sentJson.maintenance.title, 'Emergency Core Engine Upgrade', 'Title in 503 response must match');
  assert.strictEqual(sentJson.maintenance.startTime, '3:00 PM IST', 'Start time in 503 must match');
  console.log('✓ Public request successfully blocked with 503 and metadata');

  console.log('\n--- [Test 6: Admin Whitelist Immunity During Maintenance] ---');
  // Admin route must NEVER be blocked
  let adminPassedNext = false;
  const mockAdminReq = {
    originalUrl: '/api/admin/users?page=1',
    path: '/api/admin/users',
    headers: {}
  };
  await maintenanceMiddleware(mockAdminReq, mockPublicRes, () => {
    adminPassedNext = true;
  });
  assert.strictEqual(adminPassedNext, true, 'Admin routes (/api/admin/*) MUST bypass maintenance mode');

  // Health route must NEVER be blocked
  let healthPassedNext = false;
  const mockHealthReq = {
    originalUrl: '/health',
    path: '/health',
    headers: {}
  };
  await maintenanceMiddleware(mockHealthReq, mockPublicRes, () => {
    healthPassedNext = true;
  });
  assert.strictEqual(healthPassedNext, true, 'Health check (/health) MUST bypass maintenance mode');

  // Maintenance query endpoint must NEVER be blocked
  let maintCheckPassedNext = false;
  const mockMaintCheckReq = {
    originalUrl: '/api/system/maintenance',
    path: '/api/system/maintenance',
    headers: {}
  };
  await maintenanceMiddleware(mockMaintCheckReq, mockPublicRes, () => {
    maintCheckPassedNext = true;
  });
  assert.strictEqual(maintCheckPassedNext, true, 'Public maintenance polling endpoint MUST bypass maintenance mode');

  // Request with bypass header must pass
  let bypassHeaderPassed = false;
  const mockBypassReq = {
    originalUrl: '/api/assessment/questions',
    path: '/api/assessment/questions',
    headers: { 'x-maintenance-bypass': 'true' }
  };
  await maintenanceMiddleware(mockBypassReq, mockPublicRes, () => {
    bypassHeaderPassed = true;
  });
  assert.strictEqual(bypassHeaderPassed, true, 'Bypass header must allow access');
  console.log('✓ Admin portal immunity, health checks, and bypass headers verified 100% immune');

  console.log('\n--- [Test 7: Restore Site & Deactivate Maintenance] ---');
  const mockRestoreReq = {
    admin: { id: 'admin-test', email: 'director@disheera.site', role: 'ADMIN' },
    body: { enabled: false }
  };
  await updateAdminMaintenanceConfig(mockRestoreReq, mockPostRes);
  assert.strictEqual(postJson.maintenance.enabled, false, 'Maintenance should be disabled');

  // Verify public route is unblocked
  passedNext = false;
  await maintenanceMiddleware(mockPublicReq, mockPublicRes, () => {
    passedNext = true;
  });
  assert.strictEqual(passedNext, true, 'Public routes must immediately resume when disabled');
  console.log('✓ Public website and APIs cleanly restored to live operations');

  console.log('\n🎉 ALL 7 PLATFORM MAINTENANCE MODE TESTS PASSED PERFECTLY!\n');
}

runMaintenanceTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/pilot_cohort_telemetry_test.js — Verification Test for Pilot TPO Telemetry & CSV Roster
 * Disheera · Enterprise Backend Quality Gate
 */

const assert = require('assert');
const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: d });
        }
      });
    }).on('error', reject);
  });
}

async function runCohortTests() {
  console.log('🧪 Starting Pilot Cohort Telemetry Test Suite...\n');

  // TEST 1: Cohort Students Telemetry Endpoint
  console.log('--- TEST 1: GET /api/campus/cohort-students ---');
  const resStudents = await get('http://localhost:5000/api/campus/cohort-students');
  assert.strictEqual(resStudents.status, 200, 'Endpoint must return 200');
  assert.strictEqual(resStudents.body.success, true, 'Response success must be true');
  assert.strictEqual(Array.isArray(resStudents.body.data), true, 'Cohort data must be an array');
  assert.ok(resStudents.body.count >= 1, 'Must find at least 1 student in DB');

  const student = resStudents.body.data[0];
  assert.ok(student.id, 'Student must have id');
  assert.ok(student.name, 'Student must have name');
  assert.ok(student.email, 'Student must have email');
  assert.ok(student.track, 'Student must have career track');
  assert.strictEqual(typeof student.progressPercent, 'number', 'Progress must be a number');
  assert.strictEqual(typeof student.isAtRisk, 'boolean', 'isAtRisk must be boolean');
  assert.ok(student.passportUrl, 'Must have passport link');
  console.log(`✓ Retrieved cohort telemetry: ${resStudents.body.count} students monitored.`);
  console.log(`  Sample Student: "${student.name}" | Track: ${student.track} | Progress: ${student.progressPercent}% | At-Risk: ${student.isAtRisk}`);

  // TEST 2: CSV Roster Export
  console.log('\n--- TEST 2: GET /api/campus/export-roster-csv ---');
  const resCsv = await get('http://localhost:5000/api/campus/export-roster-csv');
  assert.strictEqual(resCsv.status, 200, 'CSV export must return 200');
  assert.ok(resCsv.headers['content-type'].includes('text/csv'), 'Content-Type must be text/csv');
  assert.ok(typeof resCsv.body === 'string', 'Body must be string CSV data');
  assert.ok(resCsv.body.includes('Candidate ID,Full Name,Email Address'), 'Must include standard CSV headers');
  console.log(`✓ CSV export successful (${resCsv.body.split('\n').length} lines).`);

  console.log('\n🎉 ALL PILOT COHORT TELEMETRY TESTS PASSED CLEANLY!\n');
}

runCohortTests().catch(err => {
  console.error('\n❌ Pilot Cohort Telemetry Tests Failed:', err);
  process.exit(1);
});

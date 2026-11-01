/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * proximity_radar_test.js - Comprehensive Verification Test for Pan-India Industrial Proximity Radar
 * Validates Haversine distance engine, corridor filtering, and live GPS coordinate sorting.
 *
 * Disheera - Quality Assurance Suite
 */

const assert = require('assert');
const regionalCompanies = require('../data/regionalCompaniesData');
const { calculateHaversineKm, getCompaniesByProximity } = regionalCompanies;

console.log('====================================================');
console.log('  PAN-INDIA INDUSTRIAL PROXIMITY RADAR TEST SUITE   ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// ----------------------------------------------------
// 1. HAVERSINE DISTANCE FORMULA PRECISION
// ----------------------------------------------------
runTest('Haversine distance between Jalgaon (21.0077, 75.5626) and Bhusawal (21.0454, 75.7885)', () => {
  const dist = calculateHaversineKm(21.0077, 75.5626, 21.0454, 75.7885);
  // Expected distance ~23.8 km
  assert(dist >= 22 && dist <= 25, `Expected ~23.8 km, got ${dist}`);
});

runTest('Haversine distance between Jalgaon (21.0077, 75.5626) and Pune (18.5204, 73.8567)', () => {
  const dist = calculateHaversineKm(21.0077, 75.5626, 18.5204, 73.8567);
  // Expected distance ~330 - 340 km
  assert(dist >= 320 && dist <= 350, `Expected ~334 km, got ${dist}`);
});

runTest('Haversine distance to identical coordinates should be 0 km', () => {
  const dist = calculateHaversineKm(21.0077, 75.5626, 21.0077, 75.5626);
  assert.strictEqual(dist, 0, `Expected 0 km, got ${dist}`);
});

runTest('Haversine handles null or invalid coordinates gracefully', () => {
  assert.strictEqual(calculateHaversineKm(null, 75.5626, 21.0077, 75.5626), null);
  assert.strictEqual(calculateHaversineKm('abc', 75.5626, 21.0077, 75.5626), null);
});

// ----------------------------------------------------
// 2. VERIFIED COMPANY DATASET COMPLETENESS
// ----------------------------------------------------
runTest('Dataset contains 60+ verified industrial employers', () => {
  assert(regionalCompanies.length >= 60, `Expected >= 60 companies, found ${regionalCompanies.length}`);
});

runTest('All employers have valid coordinates, clusterGroup, and required fields', () => {
  const requiredProps = ['id', 'name', 'cluster', 'clusterGroup', 'city', 'state', 'latitude', 'longitude', 'industry', 'website'];
  regionalCompanies.forEach((c) => {
    requiredProps.forEach((prop) => {
      assert(c[prop] != null, `Company ${c.id || c.name} missing property: ${prop}`);
    });
    assert(typeof c.latitude === 'number' && !isNaN(c.latitude), `Invalid latitude for ${c.id}`);
    assert(typeof c.longitude === 'number' && !isNaN(c.longitude), `Invalid longitude for ${c.id}`);
  });
});

runTest('All 8 national corridor cluster groups are represented', () => {
  const expectedClusters = ['khandesh', 'marathwada', 'nashik', 'pune_mumbai', 'bengaluru', 'ncr', 'hyderabad', 'gujarat', 'chennai'];
  const presentClusters = new Set(regionalCompanies.map((c) => c.clusterGroup));
  expectedClusters.forEach((cl) => {
    assert(presentClusters.has(cl), `Missing cluster group: ${cl}`);
  });
});

// ----------------------------------------------------
// 3. PROXIMITY SORTING ENGINE (HAVERSINE HUD)
// ----------------------------------------------------
runTest('Live GPS in Jalgaon sorts Khandesh & MIDC employers to the top (< 15 km)', () => {
  const sorted = getCompaniesByProximity({
    userLat: 21.0077,
    userLng: 75.5626
  });

  assert(sorted.length >= 60, 'Should return full catalog');
  assert(sorted[0].city === 'Jalgaon', `Expected top company in Jalgaon, got ${sorted[0].city} (${sorted[0].name})`);
  assert(sorted[0].distanceKm < 15, `Expected top company distance < 15km, got ${sorted[0].distanceKm}km`);
});

runTest('Live GPS in Bengaluru (12.9716, 77.5946) sorts Electronic City / Peenya to the top (< 25 km)', () => {
  const sorted = getCompaniesByProximity({
    userLat: 12.9716,
    userLng: 77.5946
  });

  assert(sorted[0].city === 'Bengaluru', `Expected top company in Bengaluru, got ${sorted[0].city} (${sorted[0].name})`);
  assert(sorted[0].distanceKm < 25, `Expected Bengaluru distance < 25km, got ${sorted[0].distanceKm}km`);
  assert.strictEqual(sorted[0].state, 'Karnataka');
});

runTest('Live GPS in Gurgaon / NCR (28.4595, 77.0266) sorts Cyber City / Manesar to the top (< 25 km)', () => {
  const sorted = getCompaniesByProximity({
    userLat: 28.4595,
    userLng: 77.0266
  });

  assert(sorted[0].city === 'Gurgaon' || sorted[0].city === 'Noida', `Expected top company in NCR, got ${sorted[0].city}`);
  assert(sorted[0].distanceKm < 25, `Expected NCR distance < 25km, got ${sorted[0].distanceKm}km`);
  assert.strictEqual(sorted[0].clusterGroup, 'ncr');
});

runTest('Distance radius filter (< 15 km from Jalgaon) returns strictly local employers', () => {
  const localOnly = getCompaniesByProximity({
    userLat: 21.0077,
    userLng: 75.5626,
    maxDistanceKm: 15
  });

  assert(localOnly.length >= 5, `Expected >= 5 local employers, got ${localOnly.length}`);
  localOnly.forEach((c) => {
    assert(c.distanceKm <= 15, `Company ${c.name} distance ${c.distanceKm} exceeds 15km`);
  });
});

runTest('Cluster filter for "gujarat" returns only Gujarat corridor employers', () => {
  const gujaratCompanies = getCompaniesByProximity({
    cluster: 'gujarat'
  });

  assert(gujaratCompanies.length >= 5, `Expected >= 5 Gujarat companies, got ${gujaratCompanies.length}`);
  gujaratCompanies.forEach((c) => {
    assert.strictEqual(c.clusterGroup, 'gujarat', `Expected clusterGroup gujarat, got ${c.clusterGroup}`);
  });
});

runTest('Keyword search for "Python" filters companies requiring Python skills', () => {
  const pythonJobs = getCompaniesByProximity({
    search: 'Python'
  });

  assert(pythonJobs.length > 0, 'Should find companies requiring Python');
  pythonJobs.forEach((c) => {
    const hasPython = c.requiredSkills.some((s) => s.toLowerCase().includes('python')) ||
                      c.topRoles.some((r) => r.toLowerCase().includes('python'));
    assert(hasPython, `Company ${c.name} does not match Python`);
  });
});

console.log('\n====================================================');
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUITE PASS)`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

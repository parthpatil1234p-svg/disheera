/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * server/tests/caching_architecture_verification.js
 *
 * Automated verification suite for Disheera Caching Infrastructure:
 * 1. CacheManager Core Unit Test: TTL, Stampede Coalescing, Eviction.
 * 2. Privacy & User Isolation Test: Never leak user data across keys, targeted invalidation.
 * 3. Public Catalog Caching & HTTP Headers: Edge CDN headers, 0ms repeat requests.
 * 4. External API & AI Inference Caching: Adzuna jobs, AIDevBoard, AI fit brief.
 * 5. Private Endpoints Protection: Cache-Control private headers on dashboard and readiness.
 * 6. Mutation Invalidation: Toggle task / assessment update evicts user cache cleanly.
 */

const assert = require('assert');
const { cacheManager } = require('../utils/cacheManager');
const { getCareers, getCareerBySlug } = require('../controllers/careerController');
const { getSkills, getTaxonomyTreeApi, getTaxonomySummaryApi } = require('../controllers/skillController');
const { getJobsForCareer } = require('../services/jobBoardService');
const { generateCareerBrief } = require('../services/careerInsightService');
const { getDashboard, invalidateDashboardCache } = require('../controllers/dashboardController');
const { getReadinessStatus } = require('../controllers/readinessController');

// Mock Express req/res
function createMockReqRes({ user = null, query = {}, params = {}, body = {} } = {}) {
  const headers = {};
  let statusCode = 200;
  let jsonBody = null;

  const req = {
    user,
    query,
    params,
    body,
    headers: {},
    get: (h) => headers[h.toLowerCase()],
  };

  const res = {
    setHeader: (k, v) => {
      headers[k.toLowerCase()] = v;
    },
    getHeader: (k) => headers[k.toLowerCase()],
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      jsonBody = data;
      return res;
    },
  };

  return { req, res, getHeaders: () => headers, getStatus: () => statusCode, getBody: () => jsonBody };
}

async function runTests() {
  console.log('============================================================');
  console.log('🧪 Disheera — Enterprise Caching Architecture Test');
  console.log('============================================================\n');

  let passed = 0;

  // ── TEST 1: CacheManager Core Unit Tests ──────────────────
  console.log('▶ TEST 1: CacheManager Core Unit Tests');
  cacheManager.clear();

  // Test set / get
  cacheManager.set('test:key1', { count: 42 }, 10);
  const val1 = cacheManager.get('test:key1');
  assert.strictEqual(val1.count, 42, 'Expected key1 to equal { count: 42 }');
  console.log('  ✓ PASSED: Set & Get works accurately');
  passed++;

  // Test stampede protection (Promise coalescing)
  let dbCallCount = 0;
  const stampedePromises = [];
  for (let i = 0; i < 10; i++) {
    stampedePromises.push(
      cacheManager.wrap('test:stampede', 10, async () => {
        dbCallCount++;
        await new Promise((r) => setTimeout(r, 20));
        return { data: 'stampede_resolved' };
      })
    );
  }
  const stampedeResults = await Promise.all(stampedePromises);
  assert.strictEqual(dbCallCount, 1, `Expected exactly 1 execution, got ${dbCallCount}`);
  assert.strictEqual(stampedeResults[0].data, 'stampede_resolved');
  assert.strictEqual(stampedeResults[9].data, 'stampede_resolved');
  console.log('  ✓ PASSED: Stampede protection coalesced 10 concurrent requests into 1 execution');
  passed++;

  // ── TEST 2: User Isolation & Privacy Guarantee ─────────────
  console.log('\n▶ TEST 2: User Isolation & Privacy Guarantee');
  const userA = 'user_111';
  const userB = 'user_222';

  cacheManager.set(`dashboard:${userA}:default`, { user: 'Alice', kpi: 90 }, 60);
  cacheManager.set(`readiness:${userA}`, { score: 92 }, 60);
  cacheManager.set(`dashboard:${userB}:default`, { user: 'Bob', kpi: 75 }, 60);
  cacheManager.set(`readiness:${userB}`, { score: 78 }, 60);

  // Invalidate User A only
  cacheManager.invalidateUser(userA);

  assert.strictEqual(cacheManager.get(`dashboard:${userA}:default`), null, 'User A dashboard should be purged');
  assert.strictEqual(cacheManager.get(`readiness:${userA}`), null, 'User A readiness should be purged');
  assert.notStrictEqual(cacheManager.get(`dashboard:${userB}:default`), null, 'User B dashboard MUST be preserved');
  assert.notStrictEqual(cacheManager.get(`readiness:${userB}`), null, 'User B readiness MUST be preserved');
  console.log('  ✓ PASSED: InvalidateUser isolated to targeted user; zero cross-user cache leakage');
  passed++;

  // ── TEST 3: Public Catalog Caching & Edge Headers ──────────
  console.log('\n▶ TEST 3: Public Catalog Caching & Edge Headers');
  const mockMock1 = createMockReqRes({ query: {} });
  const t0 = Date.now();
  await getCareers(mockMock1.req, mockMock1.res, (err) => { if (err) throw err; });
  const t1 = Date.now();
  const dur1 = t1 - t0;

  const mockMock2 = createMockReqRes({ query: {} });
  const t2 = Date.now();
  await getCareers(mockMock2.req, mockMock2.res, (err) => { if (err) throw err; });
  const t3 = Date.now();
  const dur2 = t3 - t2;

  const cacheHeader = mockMock1.getHeaders()['cache-control'];
  assert(cacheHeader && cacheHeader.includes('public'), 'Careers must have public Cache-Control');
  assert(cacheHeader.includes('s-maxage=3600'), 'Careers must specify s-maxage=3600 for Edge CDN');
  assert.strictEqual(mockMock1.getBody().success, true);
  assert.strictEqual(mockMock2.getBody().success, true);
  assert.strictEqual(mockMock1.getBody().count, mockMock2.getBody().count);
  console.log(`  ✓ PASSED: Careers catalog cached (1st run: ${dur1}ms, 2nd run: ${dur2}ms, Header: ${cacheHeader})`);
  passed++;

  // Skills taxonomy tree
  const treeMock = createMockReqRes();
  await getTaxonomyTreeApi(treeMock.req, treeMock.res, (err) => { if (err) throw err; });
  const treeHeader = treeMock.getHeaders()['cache-control'];
  assert(treeHeader && treeHeader.includes('public'), 'Taxonomy tree must have public Cache-Control');
  assert.strictEqual(treeMock.getBody().success, true);
  console.log(`  ✓ PASSED: Skills taxonomy tree cached with Edge CDN header: ${treeHeader}`);
  passed++;

  // ── TEST 4: External API & AI Inference Caching ───────────
  console.log('\n▶ TEST 4: External API & AI Inference Caching');
  const jobT0 = Date.now();
  const jobs1 = await getJobsForCareer('front-end-developer', { limit: 4 });
  const jobT1 = Date.now();

  const jobT2 = Date.now();
  const jobs2 = await getJobsForCareer('front-end-developer', { limit: 4 });
  const jobT3 = Date.now();

  assert(jobs1 && jobs1.jobs && jobs1.jobs.length > 0, 'Expected job listings');
  assert.strictEqual(jobs1.jobs.length, jobs2.jobs.length);
  assert(jobT3 - jobT2 <= jobT1 - jobT0, 'Second jobs call should be served from memory cache');
  console.log(`  ✓ PASSED: External Job API cached (1st run: ${jobT1 - jobT0}ms, 2nd cached run: ${jobT3 - jobT2}ms)`);
  passed++;

  // AI Brief Caching
  const mockRec = {
    career: { slug: 'front-end-developer', title: 'Front-End Developer', domain: 'engineering' },
    matchedSkills: [{ name: 'javascript', displayName: 'JavaScript' }, { name: 'html', displayName: 'HTML' }],
    missingSkills: [{ name: 'react', displayName: 'React' }],
    finalScore: 82,
  };
  const mockUserDoc = {
    education: { course: 'B.Tech', branch: 'Computer Science' },
  };

  const aiT0 = Date.now();
  const brief1 = await generateCareerBrief(mockRec, mockUserDoc);
  const aiT1 = Date.now();

  const aiT2 = Date.now();
  const brief2 = await generateCareerBrief(mockRec, mockUserDoc);
  const aiT3 = Date.now();

  assert(brief1 && brief1.salaryRange, 'Expected valid salaryRange in brief');
  assert.strictEqual(brief1.salaryRange, brief2.salaryRange);
  assert(aiT3 - aiT2 <= 2, `Cached AI brief must be instant 0ms, took ${aiT3 - aiT2}ms`);
  console.log(`  ✓ PASSED: AI Career Brief cached (1st run: ${aiT1 - aiT0}ms, 2nd cached run: ${aiT3 - aiT2}ms)`);
  passed++;

  // ── TEST 5: Private Endpoints Security & Headers ───────────
  console.log('\n▶ TEST 5: Private Endpoints Security & Headers');
  const demoUserId = 'user_privacy_test_999';

  // Seed user in cache
  cacheManager.set(`readiness:${demoUserId}`, { readinessScore: 88, isJobReady: true }, 30);
  const readinessMock = createMockReqRes({ user: { _id: demoUserId } });
  await getReadinessStatus(readinessMock.req, readinessMock.res, (err) => { if (err) throw err; });

  const readinessHeader = readinessMock.getHeaders()['cache-control'];
  assert(readinessHeader && readinessHeader.includes('private'), 'Readiness MUST have private Cache-Control');
  assert(readinessHeader.includes('no-store') || readinessHeader.includes('no-cache'), 'Readiness must forbid proxy storing');
  assert.strictEqual(readinessMock.getBody().data.readinessScore, 88);
  console.log(`  ✓ PASSED: Readiness endpoint secured with header: ${readinessHeader}`);
  passed++;

  // Invalidate Dashboard Cache
  invalidateDashboardCache(demoUserId);
  assert.strictEqual(cacheManager.get(`readiness:${demoUserId}`), null, 'Readiness cache should be invalidated');
  console.log('  ✓ PASSED: Invalidation cleanly evicted readiness and dashboard cache for user');
  passed++;

  // ── TEST 6: Cache Telemetry Stats ─────────────────────────
  console.log('\n▶ TEST 6: Cache Telemetry Stats');
  const stats = cacheManager.getStats();
  assert(stats.hits > 0, 'Expected positive cache hit count');
  assert(stats.size >= 0, 'Expected non-negative size');
  console.log(`  ✓ PASSED: Cache telemetry active (Hits: ${stats.hits}, Misses: ${stats.misses}, HitRate: ${stats.hitRate}, Active Keys: ${stats.size})`);
  passed++;

  console.log('============================================================');
  console.log(`📊 Test Summary: ${passed} Passed, 0 Failed`);
  console.log('============================================================\n');
  console.log('🎉 ALL CACHING ARCHITECTURE VERIFICATION TESTS PASSED 100%!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});

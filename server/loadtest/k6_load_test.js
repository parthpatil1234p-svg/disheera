/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * server/loadtest/k6_load_test.js — Production-Grade k6 Load Test Suite
 *
 * Simulates realistic student user journeys through Disheera:
 * 1. Discover / Explore public career catalog & skills taxonomy
 * 2. Authenticate / Login to student profile (JWT session)
 * 3. Load centralized Dashboard & live Job Readiness KPI telemetry
 * 4. Navigate active Learning Roadmap & Curriculum
 * 5. Interactive Progress / Assessment saving
 *
 * Safeguards:
 * - Restricted strictly to LOCAL / STAGING environments (prohibits live production).
 * - Bypasses external paid third-party APIs (no paid AI, emails, or payments).
 * - Built-in k6 Thresholds:
 *     - http_req_failed < 1%
 *     - http_req_duration p(95) < 500ms
 *
 * Disheera · Enterprise Performance Engineering
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Custom Telemetry Metrics ──────────────────────────────────────
const failedRequests = new Rate('custom_failed_requests');
const loginDuration = new Trend('step_login_duration', true);
const dashboardDuration = new Trend('step_dashboard_duration', true);
const catalogDuration = new Trend('step_catalog_duration', true);
const readinessDuration = new Trend('step_readiness_duration', true);
const saveDuration = new Trend('step_save_assessment_duration', true);
const completedJourneys = new Counter('completed_user_journeys');

// ── Environment & Target Configuration ────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const DEMO_EMAIL = __ENV.DEMO_EMAIL || 'kajimew275@blobapps.com';
const DEMO_PASSWORD = __ENV.DEMO_PASSWORD || '123456';
const IS_QUICK = __ENV.QUICK === 'true';

// SAFETY GUARD: Prevent accidental execution against live production
if (BASE_URL.includes('api.disheera.site') || BASE_URL.includes('careerpath.ai')) {
  throw new Error(
    `[SECURITY HALT] Load test target '${BASE_URL}' appears to be PRODUCTION! ` +
    `Per testing policy, k6 load tests may ONLY target local (localhost / 127.0.0.1) or staging environments.`
  );
}

// ── Test Options, Stages & Thresholds ─────────────────────────────
export const options = {
  // Ramp stages: gradually scale VUs to find the breaking point
  stages: IS_QUICK
    ? [
        { duration: '15s', target: 20 },  // Ramp 0 -> 20
        { duration: '30s', target: 20 },  // Hold 20
        { duration: '15s', target: 50 },  // Ramp 20 -> 50
        { duration: '30s', target: 50 },  // Hold 50
        { duration: '20s', target: 100 }, // Ramp 50 -> 100
        { duration: '45s', target: 100 }, // Hold 100 (Stress test plateau)
        { duration: '15s', target: 0 },   // Ramp down to 0
      ]
    : [
        { duration: '30s', target: 20 },  // Normal traffic warm-up: 0 -> 20 VUs
        { duration: '1m',  target: 20 },  // Hold at 20 VUs
        { duration: '30s', target: 50 },  // Moderate load ramp: 20 -> 50 VUs
        { duration: '1m',  target: 50 },  // Hold at 50 VUs
        { duration: '30s', target: 100 }, // Peak breaking-point ramp: 50 -> 100 VUs
        { duration: '1m',  target: 100 }, // Hold at 100 VUs
        { duration: '30s', target: 0 },   // Cool-down ramp to 0 VUs
      ],

  // Performance Quality Gates
  thresholds: {
    // Global requirement 1: http_req_failed rate under 1%
    http_req_failed: ['rate<0.01'],

    // Global requirement 2: http_req_duration p(95) under 500 ms
    http_req_duration: ['p(95)<500'],

    // Individual step SLAs
    'step_catalog_duration': ['p(95)<300'],
    'step_dashboard_duration': ['p(95)<400'],
    'step_readiness_duration': ['p(95)<400'],
    'step_save_assessment_duration': ['p(95)<500'],
  },
};

// ── Global Headers ────────────────────────────────────────────────
const commonHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-K6-LoadTest': 'careerpath-load-benchmark', // Whitelisted benchmark header
};

// ── Setup: Verify target connectivity and pre-generate fallback token ─
export function setup() {
  console.log(`\n============================================================`);
  console.log(`🚀 Starting k6 Load Benchmark against target: ${BASE_URL}`);
  console.log(`Target Mode: ${IS_QUICK ? 'Quick Ramp Mode' : 'Standard Full-Plateau Mode'}`);
  console.log(`============================================================\n`);

  // Verify server health
  const healthRes = http.get(`${BASE_URL}/api/health`, { headers: commonHeaders });
  if (healthRes.status !== 200) {
    throw new Error(`Target ${BASE_URL} is unhealthy (HTTP ${healthRes.status}). Aborting test.`);
  }

  // Pre-authenticate a backup session token in case VUs reuse sessions
  const loginPayload = JSON.stringify({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, { headers: commonHeaders });
  let sharedToken = null;
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      sharedToken = body.data?.token || body.token;
    } catch (e) {
      console.warn('Could not parse setup auth response');
    }
  }

  return { sharedToken };
}

// ── Virtual User Execution Loop ───────────────────────────────────
export default function (data) {
  let userToken = data.sharedToken;
  const shouldLoginThisIteration = (__ITER % 3 === 0);

  // ────────────────────────────────────────────────────────────────
  // Step 1: Discover / Public Exploration (Catalog & Skills)
  // ────────────────────────────────────────────────────────────────
  group('1_Explore_Public_Catalog', () => {
    const t0 = Date.now();
    const careersRes = http.get(`${BASE_URL}/api/careers`, {
      headers: commonHeaders,
      tags: { step: 'explore_catalog' },
    });

    const taxonomyRes = http.get(`${BASE_URL}/api/skills/taxonomy/summary`, {
      headers: commonHeaders,
      tags: { step: 'explore_taxonomy' },
    });

    const duration = Date.now() - t0;
    catalogDuration.add(duration);

    const ok = check(careersRes, {
      'careers returns 200': (r) => r.status === 200,
      'careers has data list': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && Array.isArray(body.data?.careers);
        } catch {
          return false;
        }
      },
    }) && check(taxonomyRes, {
      'taxonomy summary returns 200': (r) => r.status === 200,
    });

    if (!ok) failedRequests.add(1);
    sleep(1); // Realistic reading pause: 1s
  });

  // ────────────────────────────────────────────────────────────────
  // Step 2: Student Authentication (Login)
  // ────────────────────────────────────────────────────────────────
  if (shouldLoginThisIteration || !userToken) {
    group('2_Student_Login', () => {
      const t0 = Date.now();
      const loginPayload = JSON.stringify({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });

      const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
        headers: commonHeaders,
        tags: { step: 'auth_login' },
      });

      const duration = Date.now() - t0;
      loginDuration.add(duration);

      const ok = check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'token returned': (r) => {
          try {
            const body = JSON.parse(r.body);
            const t = body.data?.token || body.token;
            if (t) {
              userToken = t;
              return true;
            }
            return false;
          } catch {
            return false;
          }
        },
      });

      if (!ok) failedRequests.add(1);
      sleep(1); // Think time: 1s
    });
  }

  // Headers for authenticated routes
  const authHeaders = {
    ...commonHeaders,
    'Authorization': `Bearer ${userToken}`,
  };

  // ────────────────────────────────────────────────────────────────
  // Step 3: Load Student Dashboard & Job Readiness Telemetry
  // ────────────────────────────────────────────────────────────────
  group('3_Load_Student_Dashboard', () => {
    const t0 = Date.now();
    const dashRes = http.get(`${BASE_URL}/api/dashboard`, {
      headers: authHeaders,
      tags: { step: 'dashboard' },
    });
    dashboardDuration.add(Date.now() - t0);

    const t1 = Date.now();
    const readyRes = http.get(`${BASE_URL}/api/readiness/status`, {
      headers: authHeaders,
      tags: { step: 'readiness' },
    });
    readinessDuration.add(Date.now() - t1);

    const ok = check(dashRes, {
      'dashboard status is 200': (r) => r.status === 200,
      'dashboard has user profile': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && !!body.data?.user;
        } catch {
          return false;
        }
      },
    }) && check(readyRes, {
      'readiness status is 200': (r) => r.status === 200,
      'readiness score calculated': (r) => {
        try {
          const body = JSON.parse(r.body);
          return typeof body.data?.readinessScore === 'number';
        } catch {
          return false;
        }
      },
    });

    if (!ok) failedRequests.add(1);
    sleep(1.5); // User reviewing their dashboard stats
  });

  // ────────────────────────────────────────────────────────────────
  // Step 4: Fetch Active Roadmap Curriculum & Detail
  // ────────────────────────────────────────────────────────────────
  group('4_Load_Curriculum_Roadmap', () => {
    const roadmapRes = http.get(`${BASE_URL}/api/roadmaps/current`, {
      headers: authHeaders,
      tags: { step: 'curriculum' },
      responseCallback: http.expectedStatuses(200, 404),
    });

    const careerRes = http.get(`${BASE_URL}/api/careers/front-end-developer`, {
      headers: authHeaders,
      tags: { step: 'career_detail' },
    });

    const ok = check(roadmapRes, {
      'roadmap response is 200 or 404 (clean empty)': (r) => r.status === 200 || r.status === 404,
    }) && check(careerRes, {
      'career detail is 200': (r) => r.status === 200,
    });

    if (!ok) failedRequests.add(1);
    sleep(1); // Reviewing week tasks
  });

  // ────────────────────────────────────────────────────────────────
  // Step 5: Interactive Progress & Assessment State Saving
  // ────────────────────────────────────────────────────────────────
  group('5_Save_Assessment_Progress', () => {
    const t0 = Date.now();
    const updatePayload = JSON.stringify({
      education: {
        course: 'B.Tech',
        branch: 'Computer Science',
        year: 'Third Year',
        college: 'Performance Testing University',
      },
      interests: ['web-development'],
      skills: [
        { name: 'javascript', displayName: 'JavaScript', proficiency: 'intermediate' },
        { name: 'react', displayName: 'React', proficiency: 'intermediate' },
        { name: 'html', displayName: 'HTML', proficiency: 'advanced' },
        { name: 'css', displayName: 'CSS', proficiency: 'intermediate' },
      ],
      careerGoals: ['Full-Stack Developer'],
    });

    const updateRes = http.put(`${BASE_URL}/api/assessment`, updatePayload, {
      headers: authHeaders,
      tags: { step: 'save_assessment' },
    });
    saveDuration.add(Date.now() - t0);

    const ok = check(updateRes, {
      'assessment save is 200': (r) => r.status === 200,
      'save marked success': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true;
        } catch {
          return false;
        }
      },
    });

    if (!ok) failedRequests.add(1);
    else completedJourneys.add(1);

    sleep(1); // Short pause before next cycle
  });
}

// ── Teardown / Summary Hook ───────────────────────────────────────
export function teardown() {
  console.log(`\n============================================================`);
  console.log(`🏁 k6 Load Benchmark Complete`);
  console.log(`============================================================\n`);
}

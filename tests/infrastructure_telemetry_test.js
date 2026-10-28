const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const { getInfrastructureTelemetry } = require('../server/controllers/adminSystemController');

async function testInfrastructureTelemetry() {
  console.log('Testing getInfrastructureTelemetry controller...');

  let statusCode = null;
  let jsonResponse = null;

  const mockReq = {
    app: {
      locals: {
        requestTelemetry: {
          totalRequests: 42,
          endpoints: { auth: 10, careers: 15, other: 17 }
        }
      }
    }
  };

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    }
  };

  await getInfrastructureTelemetry(mockReq, mockRes);

  assert.strictEqual(statusCode, 200, 'Expected HTTP 200');
  assert.strictEqual(jsonResponse.success, true, 'Expected success: true');
  assert(jsonResponse.telemetry, 'Expected telemetry object');
  assert(jsonResponse.telemetry.tiers.tier1_vercel, 'Expected tier 1 vercel');
  assert(jsonResponse.telemetry.tiers.tier2_render, 'Expected tier 2 render');
  assert(jsonResponse.telemetry.tiers.tier3_database, 'Expected tier 3 database');
  assert(jsonResponse.telemetry.trafficSplit, 'Expected trafficSplit');
  assert(typeof jsonResponse.telemetry.trafficSplit.vercelPct === 'number', 'Expected vercelPct number');
  assert(typeof jsonResponse.telemetry.trafficSplit.renderPct === 'number', 'Expected renderPct number');

  console.log('✓ PASSED: Telemetry structure verified successfully!');
  console.log('Sample telemetry response:');
  console.log(JSON.stringify({
    trafficSplit: jsonResponse.telemetry.trafficSplit,
    currentInstance: jsonResponse.telemetry.currentInstance,
    tier1: {
      name: jsonResponse.telemetry.tiers.tier1_vercel.name,
      status: jsonResponse.telemetry.tiers.tier1_vercel.status,
      latencyMs: jsonResponse.telemetry.tiers.tier1_vercel.latencyMs,
      trafficShareEst: jsonResponse.telemetry.tiers.tier1_vercel.trafficShareEst
    },
    tier2: {
      name: jsonResponse.telemetry.tiers.tier2_render.name,
      status: jsonResponse.telemetry.tiers.tier2_render.status,
      latencyMs: jsonResponse.telemetry.tiers.tier2_render.latencyMs,
      trafficShareEst: jsonResponse.telemetry.tiers.tier2_render.trafficShareEst
    },
    tier3: {
      name: jsonResponse.telemetry.tiers.tier3_database.name,
      status: jsonResponse.telemetry.tiers.tier3_database.status,
      latencyMs: jsonResponse.telemetry.tiers.tier3_database.latencyMs
    }
  }, null, 2));
}

testInfrastructureTelemetry().then(() => {
  console.log('All tests passed!');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

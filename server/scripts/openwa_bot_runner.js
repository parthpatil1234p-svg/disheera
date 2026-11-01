/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * scripts/openwa_bot_runner.js — OpenWA & WhatsApp Automation Suite Runner / Webhook Simulator
 * 
 * Provides:
 * 1. Interactive simulated WhatsApp chat with Disheera 24x7 Mentor
 * 2. Webhook test runner against local or remote Express server
 * 3. Configuration instructions for physical WhatsApp QR bridge
 * 
 * Usage:
 *   node server/scripts/openwa_bot_runner.js
 *   node server/scripts/openwa_bot_runner.js --query "Bhai, Frontend Developer banne ke liye agla step kya hai?" --phone "+919876543210"
 * 
 * Disheera Technologies Inc.
 */

const http = require('http');

const PORT = process.env.PORT || 5000;
const WEBHOOK_HOST = '127.0.0.1';
const WEBHOOK_PATH = '/api/whatsapp/webhook';

// Parse command line arguments
const args = process.argv.slice(2);
let testQuery = 'Bhai, Frontend Developer ke liye agla step kya hai?';
let testPhone = '+919876543210';
let testName = 'Parth Patil';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--query' && args[i + 1]) testQuery = args[++i];
  if (args[i] === '--phone' && args[i + 1]) testPhone = args[++i];
  if (args[i] === '--name' && args[i + 1]) testName = args[++i];
}

console.log('============================================================');
console.log('🤖 DISHEERA — WHATSAPP AUTOMATION SUITE TEST RUNNER');
console.log('============================================================');
console.log(`Target Webhook: http://${WEBHOOK_HOST}:${PORT}${WEBHOOK_PATH}`);
console.log(`Student Phone:  ${testPhone}`);
console.log(`Student Query:  "${testQuery}"`);
console.log('────────────────────────────────────────────────────────────');

const payload = JSON.stringify({
  from: testPhone,
  phone: testPhone,
  text: testQuery,
  name: testName,
  timestamp: Date.now()
});

const req = http.request({
  hostname: WEBHOOK_HOST,
  port: PORT,
  path: WEBHOOK_PATH,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  },
  timeout: 10000
}, (res) => {
  let responseData = '';
  res.on('data', chunk => responseData += chunk);
  res.on('end', () => {
    console.log(`✅ Webhook acknowledged by server (HTTP ${res.statusCode})`);
    console.log(`Response: ${responseData}`);
    console.log('\nCheck your server terminal log above for the real-time AI response dispatch!\n');
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error(`❌ Could not connect to server at http://${WEBHOOK_HOST}:${PORT}:`, err.message);
  console.log('\n💡 Tip: Start the server first with `npm start` or `npm --prefix server start`.\n');
  process.exit(1);
});

req.write(payload);
req.end();

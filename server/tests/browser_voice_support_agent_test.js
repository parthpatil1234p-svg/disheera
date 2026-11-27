/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/browser_voice_support_agent_test.js — Regression & Unit Tests
 * Plan 47: Browser Voice AI Support Agent, WhatsApp Ticket Relay & Admin Telemetry
 */

const assert = require('assert');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const voiceSupportService = require('../services/browserVoiceSupportService');

async function runTests() {
  console.log('🧪 Starting Browser Voice AI Support Agent Unit & Verification Suite...\n');

  // Test 1: Service exports & initial state
  console.log('▶ Test 1: Verifying Service Engine Interface...');
  assert.strictEqual(typeof voiceSupportService.startSession, 'function', 'startSession should be a function');
  assert.strictEqual(typeof voiceSupportService.processVoiceTurn, 'function', 'processVoiceTurn should be a function');
  assert.strictEqual(typeof voiceSupportService.endSession, 'function', 'endSession should be a function');
  assert.strictEqual(typeof voiceSupportService.getCallLogs, 'function', 'getCallLogs should be a function');
  console.log('  ✔ Service exports verified successfully.\n');

  // Test 2: Authentication Gate on Session Start
  console.log('▶ Test 2: Testing Authentication Gate (Unauthenticated Block)...');
  try {
    voiceSupportService.startSession(null);
    assert.fail('Should have thrown an authentication error');
  } catch (err) {
    assert(err.message.includes('Authentication required'), 'Should report authentication required');
    console.log('  ✔ Unauthenticated session start properly blocked.\n');
  }

  // Test 3: Authenticated Session Initiation
  console.log('▶ Test 3: Testing Authenticated Session Start...');
  const mockUser = {
    id: 'test-student-47-id',
    name: 'Parth Patil',
    email: 'parth@disheera.site',
    phone: '7499085045',
  };

  const session = voiceSupportService.startSession(mockUser);
  assert(session.sessionId, 'Session ID must be generated');
  assert(session.sessionId.startsWith('call_'), 'Session ID must start with call_');
  assert(session.greeting.includes('Arya'), 'Greeting must introduce Arya');
  assert.strictEqual(session.user.hasPhone, true, 'User phone presence should be recognized');
  console.log(`  ✔ Session started successfully: ${session.sessionId}`);
  console.log(`    Greeting: "${session.greeting.slice(0, 60)}..."\n`);

  // Test 4: Strict Domain Boundary Guardrail
  console.log('▶ Test 4: Testing Strict Domain Boundary (Out-of-Domain Query)...');
  const outOfDomainTurn = await voiceSupportService.processVoiceTurn(session.sessionId, {
    textInput: 'Who won the ICC Cricket World Cup in 2023?',
    user: mockUser,
  });

  assert(outOfDomainTurn.success, 'Turn must return success');
  console.log(`    Student Asked: "Who won the ICC Cricket World Cup in 2023?"`);
  console.log(`    Arya Replied: "${outOfDomainTurn.replyText}"`);

  // The guardrail system prompt or offline fallback should enforce Disheera scope
  const isGuardrailRespected =
    /Disheera|roadmap|assignment|proctoring|platform|support/i.test(outOfDomainTurn.replyText) &&
    !/Australia won|defeat India by 6 wickets/i.test(outOfDomainTurn.replyText);

  assert(isGuardrailRespected, 'Agent must decline out-of-domain query and redirect to Disheera');
  console.log('  ✔ Strict Disheera Domain Boundary verified (External chit-chat rejected).\n');

  // Test 5: In-Domain Assistance (Roadmaps & Assignments)
  console.log('▶ Test 5: Testing In-Domain Technical Query...');
  const inDomainTurn = await voiceSupportService.processVoiceTurn(session.sessionId, {
    textInput: 'How do I submit my weekly assignment for AI grading?',
    user: mockUser,
  });

  assert(inDomainTurn.success, 'Turn must return success');
  console.log(`    Student Asked: "How do I submit my weekly assignment for AI grading?"`);
  console.log(`    Arya Replied: "${inDomainTurn.replyText.slice(0, 100)}..."`);
  assert(
    /assignment|pdf|grading|upload|roadmap|score/i.test(inDomainTurn.replyText),
    'Agent should guide about weekly assignment submission'
  );
  console.log('  ✔ In-domain support guidance verified.\n');

  // Test 6: Ticket Escalation & Dual WhatsApp Relay Trigger
  console.log('▶ Test 6: Testing Ticket Escalation & WhatsApp Relay Trigger...');
  const escalationTurn = await voiceSupportService.processVoiceTurn(session.sessionId, {
    textInput: 'My camera locked my test by mistake and I want to report a bug to a human supervisor immediately!',
    user: mockUser,
  });

  assert(escalationTurn.success, 'Turn must return success');
  console.log(`    Student Asked: "My camera locked my test by mistake and I want to report a bug to a human supervisor immediately!"`);
  console.log(`    Arya Replied: "${escalationTurn.replyText.slice(0, 120)}..."`);
  assert(escalationTurn.ticketId, 'A support ticket ID must be generated');
  assert(escalationTurn.ticketId.startsWith('CP-TKT-'), 'Ticket ID must follow CP-TKT- format');
  console.log(`  ✔ Ticket #${escalationTurn.ticketId} successfully created and dispatched.\n`);

  // Test 7: Conclude Session & Audio Telemetry Persistence
  console.log('▶ Test 7: Testing Session Conclude & CallLog Persistence...');
  const fakeAudioBase64 = 'data:audio/webm;base64,' + Buffer.from('FAKE_AUDIO_SAMPLE_CHUNKS').toString('base64');
  const endResult = await voiceSupportService.endSession(session.sessionId, fakeAudioBase64);

  assert(endResult.success, 'End session must return success');
  assert.strictEqual(endResult.callLog.status, 'ESCALATED_TICKET', 'Call status must reflect ticket escalation');
  assert(endResult.callLog.durationSeconds >= 0, 'Duration must be calculated');
  assert(endResult.callLog.recordingUrl, 'Recording URL must be generated');
  console.log(`  ✔ Session concluded. CallLog #${endResult.callLog.id} saved with status ${endResult.callLog.status}`);
  console.log(`    Recording URL: ${endResult.callLog.recordingUrl}\n`);

  // Test 8: Admin Telemetry & Call Logs Retrieval
  console.log('▶ Test 8: Testing Admin Dashboard Telemetry Query...');
  const logsQuery = await voiceSupportService.getCallLogs({ limit: 10, search: mockUser.name });
  assert(logsQuery.total >= 1, 'Should find at least 1 call log');
  const targetLog = logsQuery.data.find((c) => c.id === session.sessionId);
  assert(targetLog, 'Newly created call log must be retrieved');
  assert.strictEqual(targetLog.userName, mockUser.name, 'Student name must match');
  assert.strictEqual(targetLog.ticketId, escalationTurn.ticketId, 'Ticket ID must match escalation');
  assert(Array.isArray(targetLog.transcript) && targetLog.transcript.length >= 3, 'Transcript history must be preserved');
  console.log(`  ✔ Admin Telemetry successfully retrieved log for ${targetLog.userName} with ${targetLog.transcript.length} turns.\n`);

  console.log('======================================================================');
  console.log('🎉 ALL BROWSER VOICE AI SUPPORT AGENT TESTS PASSED (100% VERIFIED)!');
  console.log('======================================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});

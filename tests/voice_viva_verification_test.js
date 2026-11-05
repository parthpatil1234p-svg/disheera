/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/voice_viva_verification_test.js — Verification Test Suite for Code-Grounded Voice Viva
 * Disheera · Enterprise Backend Quality Gate
 */

const assert = require('assert');
const http = require('http');
const voiceVivaService = require('../server/services/voiceVivaService');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, body: d });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runVoiceVivaTests() {
  console.log('🧪 Starting Voice Viva Engine Verification Suite...\n');

  // TEST 1: Question Synthesis from AST / File Tree
  console.log('--- TEST 1: Code-Grounded Question Synthesis ---');
  const sampleFiles = {
    'server.js': `
      const express = require('express');
      const rateLimit = require('express-rate-limit');
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const app = express();
      const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
      app.use('/api/auth/login', authLimiter);
    `,
    'controllers/authController.js': `
      exports.login = async (req, res) => {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      }
    `
  };

  const questions = await voiceVivaService.generateVivaQuestions({
    repoName: 'campus-portal-backend',
    careerTrack: 'Backend & Cloud',
    files: sampleFiles
  });

  assert.strictEqual(Array.isArray(questions), true, 'Questions must be an array');
  assert.strictEqual(questions.length >= 2, true, 'Must generate at least 2 questions');
  console.log(`✓ Successfully generated ${questions.length} questions`);

  // TEST 2: Validate Timing & Anti-Cheat Cadence Bounds
  console.log('\n--- TEST 2: Timing & Cadence Guardrails ---');
  questions.forEach((q, idx) => {
    assert.strictEqual(q.prepTimeSeconds, 15, `Question ${idx + 1} prep time must be 15s`);
    assert.strictEqual(q.answerTimeSeconds, 45, `Question ${idx + 1} response time must be 45s`);
    assert.ok(q.targetFile, `Question ${idx + 1} must cite target file`);
    assert.ok(q.targetConcept, `Question ${idx + 1} must cite target architectural concept`);
    assert.ok(Array.isArray(q.expectedKeywords) && q.expectedKeywords.length > 0, `Question ${idx + 1} must have expected keywords`);
    console.log(`  Q${idx + 1}: [${q.targetFile}] "${q.questionText.substring(0, 70)}..."`);
  });
  console.log('✓ All questions adhere to strict 15s prep / 45s speech burst constraints');

  // TEST 3: Genuine Author Response Evaluation
  console.log('\n--- TEST 3: Genuine Author Response Evaluation ---');
  const genuineAnswer = 'In server.js we applied rate limiting middleware to prevent brute force attacks on the auth endpoints. If validation fails or rate limits trigger, express returns an HTTP status code 429 too many requests in a structured json error response.';
  const evalGenuine = await voiceVivaService.evaluateVivaAnswer({
    question: questions[0],
    studentAnswer: genuineAnswer,
    audioDurationSeconds: 32
  });

  assert.strictEqual(evalGenuine.passed, true, 'Genuine author answer must pass');
  assert.ok(evalGenuine.score >= 65, `Score must be >= 65, got ${evalGenuine.score}`);
  assert.ok(evalGenuine.verifiedSeal, 'Verified seal must be issued for passing score');
  assert.ok(evalGenuine.verifiedSeal.hash.length === 64, 'Seal hash must be SHA-256 (64 chars)');
  console.log(`✓ Genuine answer passed with score: ${evalGenuine.score}% (Seal: ${evalGenuine.verifiedSeal.sealId})`);

  // TEST 4: Linguistic Equity (Hinglish / Vernacular Technical Explanation)
  console.log('\n--- TEST 4: Linguistic Equity (Hinglish / Vernacular Explanation) ---');
  const hinglishAnswer = 'Humne connection pool use kiya taaki database crash na ho concurrent requests me. Error aane pe catch block status code aur json response bhejta hai.';
  const evalHinglish = await voiceVivaService.evaluateVivaAnswer({
    question: questions[0],
    studentAnswer: hinglishAnswer,
    audioDurationSeconds: 28
  });

  assert.strictEqual(evalHinglish.passed, true, 'Vernacular Hinglish technical answer must pass without penalty');
  assert.ok(evalHinglish.score >= 65, `Hinglish score must be >= 65, got ${evalHinglish.score}`);
  console.log(`✓ Hinglish technical answer passed with score: ${evalHinglish.score}% (Zero linguistic disqualification)`);

  // TEST 5: Evasive / Cheating Response Rejection
  console.log('\n--- TEST 5: Evasive / Proxy Answer Rejection ---');
  const evasiveAnswer = 'I made this whole website using javascript and html. It is very beautiful and has nice buttons and fast colors.';
  const evalEvasive = await voiceVivaService.evaluateVivaAnswer({
    question: questions[0],
    studentAnswer: evasiveAnswer,
    audioDurationSeconds: 12
  });

  assert.strictEqual(evalEvasive.passed, false, 'Evasive answer lacking architectural concepts must fail');
  assert.ok(evalEvasive.score < 65, `Score must be < 65, got ${evalEvasive.score}`);
  assert.strictEqual(evalEvasive.verifiedSeal, null, 'No seal should be issued for failing answers');
  console.log(`✓ Evasive answer rejected with score: ${evalEvasive.score}% (Missing: ${evalEvasive.missingKeywords.join(', ')})`);

  // TEST 6: HTTP Integration Endpoint Test
  console.log('\n--- TEST 6: HTTP Integration Endpoint Test ---');
  const httpRes = await postJson('http://localhost:5000/api/viva/demo-evaluate', {
    questionId: questions[0].id,
    question: questions[0],
    studentAnswer: genuineAnswer,
    audioDurationSeconds: 30
  });

  assert.strictEqual(httpRes.status, 200, 'HTTP endpoint must return 200');
  assert.strictEqual(httpRes.body.success, true, 'HTTP response success must be true');
  assert.strictEqual(httpRes.body.data.passed, true, 'HTTP evaluated answer must pass');
  console.log(`✓ POST /api/viva/demo-evaluate returned HTTP 200 (Score: ${httpRes.body.data.score}%, Seal: ${httpRes.body.data.verifiedSeal?.sealId})`);

  console.log('\n🎉 ALL 6 VOICE VIVA VERIFICATION TESTS PASSED CLEANLY!\n');
}

runVoiceVivaTests().catch(err => {
  console.error('\n❌ Voice Viva Test Suite Failed:', err);
  process.exit(1);
});

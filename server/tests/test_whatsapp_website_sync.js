/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * test_whatsapp_website_sync.js — Verification for Website Features Synchronized to WhatsApp Service
 * 
 * Verifies:
 * 1. MENU command -> returns Disheera master commands catalog
 * 2. JOBS command -> returns real-time tech job radar & apply links to https://disheera.site/jobs.html
 * 3. ROADMAP command -> returns milestone breakdown & link to https://disheera.site/roadmap.html
 * 4. NOTES command -> dispatches dynamic PDF cheatsheet buffer via sendDocument
 * 5. PASSPORT command -> returns verified skill badges & link to https://disheera.site/passport.html & verify.html
 * 6. QUIZ command -> returns proctored milestone test rules & link to https://disheera.site/quiz.html
 * 7. RESUME command -> returns AI ATS resume builder guide & link to https://disheera.site/resume-builder.html
 * 8. INTERVIEW command -> returns AI mock interview evaluation guide & link to https://disheera.site/assessment.html
 * 9. SUPPORT command -> returns Grievance Officer details with parthpatil@disheera.site
 * 
 * Disheera Technologies Inc.
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { handleIncomingWebhook } = require('../controllers/whatsappController');
const whatsappService = require('../services/whatsappService');

async function runTests() {
  console.log('============================================================');
  console.log('🧪 Disheera — WhatsApp & Website Features Sync Verification');
  console.log('============================================================');

  const dispatchedMessages = [];
  const dispatchedDocuments = [];

  const originalSendText = whatsappService.sendTextMessage;
  const originalSendDoc = whatsappService.sendDocument;

  whatsappService.sendTextMessage = async (phone, text, meta = {}) => {
    dispatchedMessages.push({ phone, text, meta, timestamp: new Date().toISOString() });
    console.log(`\n📨 [INTERCEPTED TEXT] -> To: ${phone} (Context: ${meta.context || 'GENERAL'})`);
    console.log(`   Content: ${text.split('\n')[0]}`);
    return { success: true, provider: 'TEST_DRIVER', messageId: 'MSG_' + Math.random().toString(36).substring(7) };
  };

  whatsappService.sendDocument = async (phone, docBufferOrUrl, filename, caption) => {
    dispatchedDocuments.push({ phone, filename, caption, isBuffer: Buffer.isBuffer(docBufferOrUrl) });
    console.log(`\n📄 [INTERCEPTED DOC] -> To: ${phone} (File: ${filename})`);
    return { success: true, provider: 'TEST_DRIVER', messageId: 'DOC_' + Math.random().toString(36).substring(7) };
  };

  const testStudentPhone = '+919876543210';
  const mockRes = {
    status: () => ({ json: () => {}, send: () => {} })
  };

  try {
    // ----------------------------------------------------
    // TEST 1: MENU Command
    // ----------------------------------------------------
    console.log('\n▶ TEST 1: Student sends "MENU"');
    dispatchedMessages.length = 0;
    await handleIncomingWebhook({
      body: { from: testStudentPhone, text: 'MENU', senderName: 'Aarav Sharma' }
    }, mockRes);

    assert.ok(dispatchedMessages.length >= 1, 'Should dispatch menu message');
    const menuMsg = dispatchedMessages[0];
    assert.strictEqual(menuMsg.meta.context, 'DISHEERA_COMMANDS_MENU');
    assert.ok(menuMsg.text.includes('JOBS'), 'Menu must list JOBS');
    assert.ok(menuMsg.text.includes('ROADMAP'), 'Menu must list ROADMAP');
    assert.ok(menuMsg.text.includes('NOTES'), 'Menu must list NOTES');
    assert.ok(menuMsg.text.includes('PASSPORT'), 'Menu must list PASSPORT');
    assert.ok(menuMsg.text.includes('QUIZ'), 'Menu must list QUIZ');
    assert.ok(/https:\/\/disheera\.site(\/|\b)/.test(menuMsg.text), 'Menu must link to disheera.site');
    console.log('  ✓ PASSED: MENU command returns full feature catalog.');

    // ----------------------------------------------------
    // TEST 2: JOBS Command
    // ----------------------------------------------------
    console.log('\n▶ TEST 2: Student sends "JOBS"');
    dispatchedMessages.length = 0;
    await handleIncomingWebhook({
      body: { from: testStudentPhone, text: 'JOBS', senderName: 'Aarav Sharma' }
    }, mockRes);

    assert.ok(dispatchedMessages.length >= 1, 'Should dispatch jobs message');
    const jobsMsg = dispatchedMessages[0];
    assert.strictEqual(jobsMsg.meta.context, 'LIVE_JOBS_FEED');
    assert.ok(jobsMsg.text.includes('Live Verified Job Radar'), 'Must header live jobs');
    assert.ok(jobsMsg.text.includes('https://disheera.site/jobs.html'), 'Must link to jobs.html');
    console.log('  ✓ PASSED: JOBS command returns active openings with 1-click apply.');

    // ----------------------------------------------------
    // TEST 3: ROADMAP Command
    // ----------------------------------------------------
    console.log('\n▶ TEST 3: Student sends "ROADMAP"');
    dispatchedMessages.length = 0;
    await handleIncomingWebhook({
      body: { from: testStudentPhone, text: 'ROADMAP', senderName: 'Aarav Sharma' }
    }, mockRes);

    assert.ok(dispatchedMessages.length >= 1, 'Should dispatch roadmap message');
    const rmMsg = dispatchedMessages[0];
    assert.strictEqual(rmMsg.meta.context, 'STUDENT_ROADMAP_OVERVIEW');
    assert.ok(rmMsg.text.includes('12-Week Career Roadmap'), 'Must header 12-week roadmap');
    assert.ok(rmMsg.text.includes('https://disheera.site/roadmap.html'), 'Must link to roadmap.html');
    console.log('  ✓ PASSED: ROADMAP command returns weekly roadmap overview.');

    // ----------------------------------------------------
    // TEST 4: NOTES Command (PDF Dispatch)
    // ----------------------------------------------------
    console.log('\n▶ TEST 4: Student sends "NOTES" (PDF Cheatsheet Delivery)');
    dispatchedMessages.length = 0;
    dispatchedDocuments.length = 0;
    await handleIncomingWebhook({
      body: { from: testStudentPhone, text: 'NOTES', senderName: 'Aarav Sharma' }
    }, mockRes);

    assert.ok(dispatchedDocuments.length >= 1, 'Should dispatch PDF document');
    assert.strictEqual(dispatchedDocuments[0].isBuffer, true, 'Document must be a valid buffer');
    assert.ok(dispatchedDocuments[0].filename.endsWith('.pdf'), 'Filename must end with .pdf');
    assert.ok(dispatchedMessages.length >= 1, 'Should dispatch confirmation text');
    assert.strictEqual(dispatchedMessages[0].meta.context, 'STUDY_NOTES_DISPATCH_CONFIRM');
    console.log('  ✓ PASSED: NOTES command compiles & dispatches PDF cheatsheet buffer.');

    // ----------------------------------------------------
    // TEST 5: PASSPORT Command
    // ----------------------------------------------------
    console.log('\n▶ TEST 5: Student sends "PASSPORT"');
    dispatchedMessages.length = 0;
    await handleIncomingWebhook({
      body: { from: testStudentPhone, text: 'PASSPORT', senderName: 'Aarav Sharma' }
    }, mockRes);

    assert.ok(dispatchedMessages.length >= 1, 'Should dispatch passport message');
    const passMsg = dispatchedMessages[0];
    assert.strictEqual(passMsg.meta.context, 'SKILL_PASSPORT_OVERVIEW');
    assert.ok(passMsg.text.includes('Cryptographic Skill Passport'), 'Must header skill passport');
    assert.ok(passMsg.text.includes('https://disheera.site/passport.html'), 'Must link to passport.html');
    assert.ok(passMsg.text.includes('https://disheera.site/verify.html'), 'Must link to verify.html');
    console.log('  ✓ PASSED: PASSPORT command returns cryptographic badges & verify link.');

    // ----------------------------------------------------
    // TEST 6: QUIZ Command
    // ----------------------------------------------------
    console.log('\n▶ TEST 6: Student sends "QUIZ"');
    dispatchedMessages.length = 0;
    await handleIncomingWebhook({
      body: { from: testStudentPhone, text: 'QUIZ', senderName: 'Aarav Sharma' }
    }, mockRes);

    assert.ok(dispatchedMessages.length >= 1, 'Should dispatch quiz guide');
    const quizMsg = dispatchedMessages[0];
    assert.strictEqual(quizMsg.meta.context, 'MILESTONE_QUIZ_GUIDE');
    assert.ok(quizMsg.text.includes('Milestone Skill Verifier'), 'Must header milestone quiz');
    assert.ok(quizMsg.text.includes('https://disheera.site/quiz.html'), 'Must link to quiz.html');
    console.log('  ✓ PASSED: QUIZ command returns anti-cheat rules & test link.');

    // ----------------------------------------------------
    // TEST 7: RESUME Command
    // ----------------------------------------------------
    console.log('\n▶ TEST 7: Student sends "RESUME"');
    dispatchedMessages.length = 0;
    await handleIncomingWebhook({
      body: { from: testStudentPhone, text: 'RESUME', senderName: 'Aarav Sharma' }
    }, mockRes);

    assert.ok(dispatchedMessages.length >= 1, 'Should dispatch resume guide');
    const resumeMsg = dispatchedMessages[0];
    assert.strictEqual(resumeMsg.meta.context, 'ATS_RESUME_BUILDER_GUIDE');
    assert.ok(resumeMsg.text.includes('ATS Resume Builder'), 'Must header resume builder');
    assert.ok(resumeMsg.text.includes('https://disheera.site/resume-builder.html'), 'Must link to resume-builder.html');
    console.log('  ✓ PASSED: RESUME command returns ATS scoring guidance & builder link.');

    // ----------------------------------------------------
    // TEST 8: INTERVIEW Command
    // ----------------------------------------------------
    console.log('\n▶ TEST 8: Student sends "INTERVIEW"');
    dispatchedMessages.length = 0;
    await handleIncomingWebhook({
      body: { from: testStudentPhone, text: 'INTERVIEW', senderName: 'Aarav Sharma' }
    }, mockRes);

    assert.ok(dispatchedMessages.length >= 1, 'Should dispatch interview guide');
    const intMsg = dispatchedMessages[0];
    assert.strictEqual(intMsg.meta.context, 'AI_MOCK_INTERVIEW_GUIDE');
    assert.ok(intMsg.text.includes('AI Mock Interview'), 'Must header mock interview');
    assert.ok(intMsg.text.includes('https://disheera.site/assessment.html'), 'Must link to assessment.html');
    console.log('  ✓ PASSED: INTERVIEW command returns mock interview practice link.');

    // ----------------------------------------------------
    // TEST 9: SUPPORT Command & Statutory Officer Email Verification
    // ----------------------------------------------------
    console.log('\n▶ TEST 9: Student sends "SUPPORT" (Grievance email audit)');
    dispatchedMessages.length = 0;
    await handleIncomingWebhook({
      body: { from: testStudentPhone, text: 'SUPPORT', senderName: 'Aarav Sharma' }
    }, mockRes);

    assert.ok(dispatchedMessages.length >= 1, 'Should dispatch support menu');
    const supMsg = dispatchedMessages[0];
    assert.strictEqual(supMsg.meta.context, 'SUPPORT_MENU');
    assert.ok(supMsg.text.includes('parthpatil@disheera.site'), 'Must list official disheera.site email');
    assert.ok(!/careerpath\.is-local\.org/.test(supMsg.text), 'Must NOT have legacy domain');
    console.log('  ✓ PASSED: SUPPORT command verified with official parthpatil@disheera.site.');

    console.log('\n============================================================');
    console.log('🎉 ALL 9 WHATSAPP & WEBSITE SYNC VERIFICATION TESTS PASSED!');
    console.log('============================================================');

  } finally {
    whatsappService.sendTextMessage = originalSendText;
    whatsappService.sendDocument = originalSendDoc;
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

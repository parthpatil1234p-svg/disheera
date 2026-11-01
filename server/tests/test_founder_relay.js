/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * test_founder_relay.js — Comprehensive Verification for Anonymous Founder & Co-Founder Relay
 * 
 * Verifies:
 * 1. Student requests counselor/submits doubt -> Docket created + Alert sent to BOTH Founder (+919923092340) & Co-Founder (+917709589602)
 * 2. Co-Founder checks queue (TICKETS) from personal WhatsApp -> Lists pending escalations
 * 3. Co-Founder replies (REPLY #code: ... / REPLY LAST: ...) -> Message delivered to Student from Bot (+91 7499085045)
 * 4. Confirmation sent to Co-Founder with privacy guarantee
 * 5. Founder checks queue and resolves ticket (RESOLVE #code) -> Ticket marked RESOLVED + Student notified
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
  handleIncomingWebhook,
  supportTicketsCache,
  findTicket,
  getFounders
} = require('../controllers/whatsappController');
const whatsappService = require('../services/whatsappService');

async function runTest() {
  console.log('============================================================');
  console.log('🧪 Disheera — Founder & Co-Founder Anonymous Relay Test');
  console.log('============================================================');

  // Intercept whatsappService.sendTextMessage to capture outbound dispatches
  const dispatchedMessages = [];
  const originalSendText = whatsappService.sendTextMessage;
  whatsappService.sendTextMessage = async (phone, text, meta = {}) => {
    dispatchedMessages.push({
      phone,
      text,
      meta,
      timestamp: new Date().toISOString()
    });
    console.log(`\n📨 [INTERCEPTED DISPATCH] -> To: ${phone} (Context: ${meta.context || 'GENERAL'})`);
    console.log(`   Content: ${text.split('\n')[0]}...`);
    return { success: true, provider: 'TEST_DRIVER', messageId: 'TEST_' + Math.random().toString(36).substring(7) };
  };

  const studentPhone = '+919876543210';
  const founderPhone = '+919923092340';
  const cofounderPhone = '+917709589602';
  const sanikaPhone = '+918983020995';

  try {
    // ----------------------------------------------------
    // TEST 1: Student requests 1-on-1 Counselor Callback (Alerts ALL Founders)
    // ----------------------------------------------------
    console.log('\n▶ TEST 1: Student sends "counselor" request (Alerts Founder, Suyog & Sanika)');
    dispatchedMessages.length = 0;

    const mockReq1 = {
      body: {
        from: studentPhone,
        text: 'counselor',
        senderName: 'Rohit Verma'
      }
    };
    const mockRes1 = { status: () => ({ json: () => {} }) };

    await handleIncomingWebhook(mockReq1, mockRes1);

    // We expect: 
    // 1 message to Student (counselor docket confirmation)
    // 1 message to Founder (Parth)
    // 1 message to Co-Founder (Suyog)
    // 1 message to Co-Founder (Sanika)
    const studentCounselConfirm = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'COUNSELOR_REQUEST_CONFIRMATION');
    const founderCounselAlert = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');
    const cofounderCounselAlert = dispatchedMessages.find(m => m.phone === cofounderPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');
    const sanikaCounselAlert = dispatchedMessages.find(m => m.phone === sanikaPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');

    assert(studentCounselConfirm, 'Student must receive counselor request confirmation');
    assert(founderCounselAlert, 'Founder must receive escalation alert on personal WhatsApp');
    assert(cofounderCounselAlert, 'Suyog must also receive escalation alert on personal WhatsApp');
    assert(sanikaCounselAlert, 'Sanika must also receive escalation alert on personal WhatsApp');
    assert(founderCounselAlert.text.includes('Rohit Verma'), 'Founder alert must cite student name');
    assert(cofounderCounselAlert.text.includes('Rohit Verma'), 'Co-Founder alert must cite student name');
    assert(sanikaCounselAlert.text.includes('Rohit Verma'), 'Sanika alert must cite student name');
    console.log('  ✓ PASSED: Counselor request alerted to Founder, Suyog & Sanika, confirmed to Student.');

    // ----------------------------------------------------
    // TEST 2: Student submits technical doubt via QUERY:
    // ----------------------------------------------------
    console.log('\n▶ TEST 2: Student logs technical doubt via QUERY:');
    dispatchedMessages.length = 0;

    const mockReq2 = {
      body: {
        from: studentPhone,
        text: 'QUERY: How do I connect to Supabase Prisma pooler with pgbouncer?',
        senderName: 'Rohit Verma'
      }
    };
    await handleIncomingWebhook(mockReq2, mockRes1);

    const studentQueryConfirm = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'COUNSELOR_QUERY_LOGGED');
    const founderQueryAlert = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');
    const cofounderQueryAlert = dispatchedMessages.find(m => m.phone === cofounderPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');
    const sanikaQueryAlert = dispatchedMessages.find(m => m.phone === sanikaPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');

    assert(studentQueryConfirm, 'Student must receive query logged notice');
    assert(founderQueryAlert, 'Founder must receive query alert');
    assert(cofounderQueryAlert, 'Suyog must receive query alert');
    assert(sanikaQueryAlert, 'Sanika must receive query alert');
    console.log('  ✓ PASSED: Technical doubt alerted to Founder, Suyog & Sanika.');

    // ----------------------------------------------------
    // TEST 3: Co-Founder checks active ticket queue (TICKETS)
    // ----------------------------------------------------
    console.log('\n▶ TEST 3: Co-Founder sends "TICKETS" from +917709589602');
    dispatchedMessages.length = 0;

    const mockReq3 = {
      body: {
        from: cofounderPhone,
        text: 'TICKETS',
        senderName: 'Co-Founder'
      }
    };
    await handleIncomingWebhook(mockReq3, mockRes1);

    const cofounderQueueView = dispatchedMessages.find(m => m.phone === cofounderPhone && m.meta.context === 'FOUNDER_TICKET_QUEUE');
    assert(cofounderQueueView, 'Co-Founder must receive active ticket queue');
    assert(cofounderQueueView.text.includes('Rohit Verma'), 'Queue must show Rohit Verma tickets');
    console.log('  ✓ PASSED: Co-Founder queue renders active student escalations.');

    // ----------------------------------------------------
    // TEST 4: Co-Founder secretly replies to student via REPLY LAST:
    // ----------------------------------------------------
    console.log('\n▶ TEST 4: Co-Founder replies secretly via "REPLY LAST: ..."');
    dispatchedMessages.length = 0;

    const mockReq4 = {
      body: {
        from: cofounderPhone,
        text: 'REPLY LAST: Use port 6543 with pgbouncer=true in DATABASE_URL, and direct 5432 for DIRECT_URL.',
        senderName: 'Co-Founder'
      }
    };
    await handleIncomingWebhook(mockReq4, mockRes1);

    // 1 message sent to Student (from official bot)
    const studentReceivedReply = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'COUNSELOR_DIRECT_REPLY');
    // 1 message sent to Co-Founder (confirmation)
    const cofounderDeliveryConfirm = dispatchedMessages.find(m => m.phone === cofounderPhone && m.meta.context === 'FOUNDER_REPLY_CONFIRMED');

    assert(studentReceivedReply, 'Student must receive counselor reply from bot');
    assert(studentReceivedReply.text.includes('Co-Founder Desk'), 'Message must reflect Co-Founder counselor desk');
    assert(studentReceivedReply.text.includes('pgbouncer=true'), 'Student must get exact text');
    assert(cofounderDeliveryConfirm, 'Co-Founder must get delivery confirmation');
    assert(cofounderDeliveryConfirm.text.includes('Privacy Protected'), 'Co-Founder confirmation must guarantee number masking');
    console.log('  ✓ PASSED: Co-Founder secret reply delivered to student; Co-Founder personal number masked.');

    // ----------------------------------------------------
    // TEST 5: Founder resolves ticket via "RESOLVE LAST"
    // ----------------------------------------------------
    console.log('\n▶ TEST 5: Founder resolves ticket via "RESOLVE LAST" from +919923092340');
    dispatchedMessages.length = 0;

    const mockReq5 = {
      body: {
        from: founderPhone,
        text: 'RESOLVE LAST',
        senderName: 'Parth Patil'
      }
    };
    await handleIncomingWebhook(mockReq5, mockRes1);

    const studentResolveNotice = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'TICKET_RESOLVED_STUDENT_NOTICE');
    const founderResolveConfirm = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'FOUNDER_RESOLVE_CONFIRMED');

    assert(studentResolveNotice, 'Student must receive ticket resolved notice');
    assert(founderResolveConfirm, 'Founder must receive resolve confirmation');
    console.log('  ✓ PASSED: Ticket resolved by Founder and student notified.');
    // ----------------------------------------------------
    // TEST 6: Founder initiates proactive Direct Outreach (MSG <phone>: <msg>)
    // ----------------------------------------------------
    console.log('\n▶ TEST 6: Founder initiates direct outreach (MSG 9876543210: ...)');
    dispatchedMessages.length = 0;

    const mockReq6 = {
      body: {
        from: founderPhone,
        text: 'MSG 9876543210: Hello Rohit, maine aapka Week 1 progress dekha. Project me koi doubt hai?',
        senderName: 'Parth Patil'
      }
    };
    await handleIncomingWebhook(mockReq6, mockRes1);

    const studentOutreachMsg = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'FOUNDER_DIRECT_OUTREACH');
    const founderOutreachConfirm = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'FOUNDER_DM_CONFIRMED');

    assert(studentOutreachMsg, 'Student must receive direct mentor outreach message from bot');
    assert(studentOutreachMsg.text.includes('Week 1 progress'), 'Student must get exact outreach content');
    assert(founderOutreachConfirm, 'Founder must get outreach delivery confirmation');
    console.log('  ✓ PASSED: Proactive mentor message delivered to student without exposing mentor phone.');

    // ----------------------------------------------------
    // TEST 7: Student replies to mentor outreach (alerts Founder)
    // ----------------------------------------------------
    console.log('\n▶ TEST 7: Student replies directly to mentor outreach');
    dispatchedMessages.length = 0;

    const mockReq7 = {
      body: {
        from: studentPhone,
        text: 'Haan sir, mujhe REST API call integrate karne me issue aa raha hai.',
        senderName: 'Rohit Verma'
      }
    };
    await handleIncomingWebhook(mockReq7, mockRes1);

    const studentReplyAlertToFounder = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'FOUNDER_ESCALATION_ALERT');
    const studentReplyAck = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'STUDENT_REPLY_FORWARDED');

    assert(studentReplyAlertToFounder, 'Founder must receive alert with student reply');
    assert(studentReplyAlertToFounder.text.includes('REST API call'), 'Alert must contain student reply text');
    assert(studentReplyAck, 'Student must receive forward acknowledgement');
    console.log('  ✓ PASSED: Student reply forwarded to Mentor with privacy maintained.');

    // ----------------------------------------------------
    // TEST 8: Sanika (Co-Founder +918983020995) replies secretly via REPLY LAST:
    // ----------------------------------------------------
    console.log('\n▶ TEST 8: Sanika replies secretly via "REPLY LAST: ..." from +918983020995');
    dispatchedMessages.length = 0;

    const mockReq8 = {
      body: {
        from: sanikaPhone,
        text: 'REPLY LAST: Great question Rohit! Main aapko sample Axios code send kar rahi hu.',
        senderName: 'Sanika'
      }
    };
    await handleIncomingWebhook(mockReq8, mockRes1);

    const studentReceivedSanikaReply = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'COUNSELOR_DIRECT_REPLY');
    const sanikaDeliveryConfirm = dispatchedMessages.find(m => m.phone === sanikaPhone && m.meta.context === 'FOUNDER_REPLY_CONFIRMED');

    assert(studentReceivedSanikaReply, 'Student must receive counselor reply from bot');
    assert(studentReceivedSanikaReply.text.includes('Sanika'), 'Message must reflect Sanika Desk title');
    assert(studentReceivedSanikaReply.text.includes('sample Axios code'), 'Student must get exact text');
    assert(sanikaDeliveryConfirm, 'Sanika must get delivery confirmation');
    assert(sanikaDeliveryConfirm.text.includes('Privacy Protected'), 'Sanika confirmation must guarantee number masking');
    console.log('  ✓ PASSED: Sanika secret reply delivered to student; Sanika personal number masked.');

    // ----------------------------------------------------
    // TEST 9: Sanika resolves the ticket (Broadcasts Resolve Sync to Parth & Suyog)
    // ----------------------------------------------------
    console.log('\n▶ TEST 9: Sanika resolves ticket -> Broadcasts Sync to Parth & Suyog');
    dispatchedMessages.length = 0;

    const mockReq9 = {
      body: {
        from: sanikaPhone,
        text: 'RESOLVE LAST',
        senderName: 'Sanika'
      }
    };
    await handleIncomingWebhook(mockReq9, mockRes1);

    const resolveSyncToFounder = dispatchedMessages.find(m => m.phone === founderPhone && m.meta.context === 'LEADERSHIP_TICKET_RESOLVED_SYNC');
    const resolveSyncToSuyog = dispatchedMessages.find(m => m.phone === cofounderPhone && m.meta.context === 'LEADERSHIP_TICKET_RESOLVED_SYNC');

    assert(resolveSyncToFounder, 'Parth must receive real-time resolve sync alert');
    assert(resolveSyncToSuyog, 'Suyog must receive real-time resolve sync alert');
    assert(resolveSyncToFounder.text.includes('Sanika'), 'Sync alert must cite resolving mentor');
    console.log('  ✓ PASSED: Real-time sync alert broadcasted to other 2 mentors when ticket is resolved.');

    // ----------------------------------------------------
    // TEST 10: Suyog tries to reply to already-resolved ticket (Collision Guard)
    // ----------------------------------------------------
    console.log('\n▶ TEST 10: Suyog tries to reply to already-resolved ticket (Collision Guard Active)');
    dispatchedMessages.length = 0;

    const ticketCodeMatch = resolveSyncToFounder.text.match(/Code:\s*\*#?([0-9a-zA-Z-]+)\*/);
    const resolvedCode = ticketCodeMatch ? ticketCodeMatch[1] : 'LAST';

    const mockReq10 = {
      body: {
        from: cofounderPhone,
        text: `REPLY #${resolvedCode}: Let me also help you with that`,
        senderName: 'Suyog Pawar'
      }
    };
    await handleIncomingWebhook(mockReq10, mockRes1);

    const duplicateReplyToStudent = dispatchedMessages.find(m => m.phone === studentPhone && m.meta.context === 'COUNSELOR_DIRECT_REPLY');
    const collisionNoticeToSuyog = dispatchedMessages.find(m => m.phone === cofounderPhone && m.meta.context === 'FOUNDER_REPLY_ALREADY_RESOLVED');

    assert(!duplicateReplyToStudent, 'No duplicate reply must be sent to student once ticket is resolved');
    assert(collisionNoticeToSuyog, 'Suyog must receive collision guard notification');
    assert(collisionNoticeToSuyog.text.includes('Already Resolved'), 'Collision notification must inform that ticket was already resolved');
    console.log('  ✓ PASSED: Collision guard prevented duplicate reply and informed mentor.');

    console.log('\n============================================================');
    console.log('🎉 ALL 10 LEADERSHIP SYNC & COLLISION GUARD TESTS PASSED!');
    console.log('============================================================\n');

  } finally {
    // Restore original driver
    whatsappService.sendTextMessage = originalSendText;
  }
}

runTest().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});

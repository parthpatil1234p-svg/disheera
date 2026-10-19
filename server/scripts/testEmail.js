/**
 * server/scripts/testEmail.js — Dakly Email Engine Delivery Diagnostic Tool
 * Run: node server/scripts/testEmail.js [optional-target-email@example.com]
 *
 * Disheera · Enterprise Testing Utility
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { sendOtpEmail, isEmailConfigured } = require('../services/emailService');

async function runEmailDiagnostics() {
  console.log('\n======================================================');
  console.log('   📧 DISHEERA DAKLY EMAIL ENGINE DIAGNOSTIC TOOL');
  console.log('======================================================\n');

  const apiUrl = (process.env.DAKLY_API_URL || 'https://dakly-engin.vercel.app/api/send').trim();
  const apiKey = (process.env.DAKLY_API_KEY || 'gkey_live_657886f2e5c57f4f0632b0d4bd896a623231c0a05beb69b0').trim();

  console.log('1. Configuration Overview:');
  console.log(`   - DAKLY_API_URL: ${apiUrl}`);
  console.log(`   - DAKLY_API_KEY: ${apiKey.slice(0, 10)}...${apiKey.slice(-6)} (${apiKey.length} chars)`);
  console.log(`   - Is Configured: ${isEmailConfigured() ? '✅ YES' : '❌ NO'}`);

  const targetRecipient = process.argv[2] || process.env.EMAIL_USER || 'disheera.site@gmail.com';
  console.log(`\n2. Dispatching Live Test OTP Verification Email to: ${targetRecipient}...`);

  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const startTime = Date.now();
  const sendRes = await sendOtpEmail(targetRecipient, 'Disheera Tester', testOtp);
  const durationMs = Date.now() - startTime;

  if (sendRes.success) {
    console.log(`\n🎉 SUCCESS! Test verification email was successfully delivered via Dakly Engine!`);
    console.log(`   - Recipient  : ${targetRecipient}`);
    console.log(`   - Message ID : ${sendRes.messageId}`);
    console.log(`   - Tracking ID: ${sendRes.trackingId || 'N/A'}`);
    console.log(`   - Sent Code  : ${testOtp}`);
    console.log(`   - Duration   : ${durationMs}ms`);
    console.log('\nCheck your inbox (and Spam/Junk folder if testing for the first time).');
  } else {
    console.error(`\n❌ Delivery failed: ${sendRes.error}`);
    process.exit(1);
  }
}

runEmailDiagnostics().catch((err) => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});

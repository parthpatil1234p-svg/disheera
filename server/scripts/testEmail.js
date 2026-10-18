/**
 * server/scripts/testEmail.js — SMTP & Gmail Delivery Diagnostic Tool
 * Run: node server/scripts/testEmail.js [optional-target-email@example.com]
 *
 * Disheera · Enterprise Testing Utility
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');
const { sendOtpEmail } = require('../services/emailService');

async function runEmailDiagnostics() {
  console.log('\n======================================================');
  console.log('   📧 DISHEERA EMAIL & GMAIL SMTP DIAGNOSTIC TOOL');
  console.log('======================================================\n');

  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const emailUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  console.log('1. Environment Configuration:');
  console.log(`   - SMTP_HOST : ${smtpHost}`);
  console.log(`   - SMTP_PORT : ${smtpPort}`);
  console.log(`   - EMAIL_USER: ${emailUser || '(NOT SET)'}`);
  console.log(`   - EMAIL_PASS: ${emailPass ? `[${emailPass.length} chars: ${emailPass.slice(0, 3)}...${emailPass.slice(-3)}]` : '(NOT SET)'}`);

  if (!emailUser || !emailPass) {
    console.error('\n❌ ERROR: EMAIL_USER or EMAIL_PASS is missing in server/.env.');
    console.error('👉 Add your Gmail address and 16-character Google App Password to server/.env.');
    process.exit(1);
  }

  // Check if non-google domain is being used with smtp.gmail.com
  if (smtpHost === 'smtp.gmail.com' && !emailUser.endsWith('@gmail.com') && !emailUser.endsWith('@googlemail.com')) {
    console.warn(`\n⚠️  WARNING: "${emailUser}" is not an @gmail.com domain.`);
    console.warn('   smtp.gmail.com only authenticates Google accounts or verified Google Workspace domains.');
    console.warn('   If this is a custom or dynamic domain, Google will reject authentication with 535 BadCredentials.');
  }

  console.log('\n2. Testing SMTP Connection & Authentication...');
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 12000,
    greetingTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await transporter.verify();
    console.log(`✅ [SMTP AUTH SUCCESS] Successfully authenticated with ${smtpHost}:${smtpPort} as ${emailUser}!`);
  } catch (err) {
    console.error(`\n❌ [SMTP AUTH FAILED] Connection / Authentication rejected: ${err.message}`);
    if (err.message && (err.message.includes('535') || err.message.includes('BadCredentials') || err.code === 'EAUTH')) {
      console.log('\n------------------------------------------------------');
      console.log('📌 HOW TO FIX GMAIL SMTP "535 BadCredentials":');
      console.log('------------------------------------------------------');
      console.log('1. Go to: https://myaccount.google.com/apppasswords');
      console.log('2. Ensure "2-Step Verification" is ON for your Google account.');
      console.log('3. Under "App passwords", enter app name: Disheera');
      console.log('4. Click "Create" to generate the 16-letter App Password (e.g. abcd efgh ijkl mnop).');
      console.log('5. In server/.env, set:');
      console.log('   EMAIL_USER=your_real_address@gmail.com');
      console.log('   EMAIL_PASS=abcdefghijklmnop  (without spaces)');
      console.log('------------------------------------------------------\n');
    }
    process.exit(1);
  }

  const targetRecipient = process.argv[2] || emailUser;
  console.log(`\n3. Sending Live Test OTP Verification Email to: ${targetRecipient}...`);

  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const sendRes = await sendOtpEmail(targetRecipient, 'Disheera Tester', testOtp);

  if (sendRes.success) {
    console.log(`\n🎉 SUCCESS! Test verification email was successfully delivered to ${targetRecipient}!`);
    console.log(`   Message ID: ${sendRes.messageId}`);
    console.log(`   Sent Code : ${testOtp}`);
    console.log('\nCheck your inbox (and Spam/Junk folder if testing for the first time).');
  } else {
    console.error(`\n❌ Delivery failed: ${sendRes.error}`);
  }
}

runEmailDiagnostics().catch((err) => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});

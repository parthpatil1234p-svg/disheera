/**
 * services/emailService.js — High-Reliability Email Delivery for OTP Verification
 * Uses Nodemailer with direct Gmail SMTP (Port 465 SSL with Port 587 STARTTLS Fallback).
 * Anti-Spam Optimized: Clean headers, no trigger emojis, RFC compliance.
 * Disheera · Enterprise Backend Service
 */

const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 resolution to prevent ENETUNREACH on IPv6 cloud egress (Render, AWS, Docker)
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (_) {}
}

let cachedGmailIpv4 = null;
let lastIpv4Resolve = 0;

async function getGmailIpv4() {
  const now = Date.now();
  if (cachedGmailIpv4 && (now - lastIpv4Resolve < 10 * 60 * 1000)) {
    return cachedGmailIpv4;
  }
  try {
    const addrs = await dns.promises.resolve4('smtp.gmail.com');
    if (addrs && addrs.length > 0) {
      cachedGmailIpv4 = addrs[0];
      lastIpv4Resolve = now;
      return cachedGmailIpv4;
    }
  } catch (err) {
    console.warn('⚠️ [DNS] Failed to resolve smtp.gmail.com IPv4:', err.message);
  }
  return cachedGmailIpv4 || 'smtp.gmail.com';
}

// Pre-resolve on module load
getGmailIpv4().catch(() => {});

function createTransporter(port = null, secure = null, timeoutMs = 8000, hostOverride = null) {
  // 1. Universal / Custom SMTP (Brevo, SendGrid, Resend, AWS SES, Postmark, etc.)
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : null;
  const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!smtpUser || !smtpPass) {
    return null;
  }

  const connTimeout = timeoutMs;
  const greetTimeout = Math.min(timeoutMs, 6000);
  const sockTimeout = Math.max(timeoutMs, 12000);

  // If a custom SMTP host is explicitly specified
  if (smtpHost && smtpHost !== 'smtp.gmail.com') {
    const targetPort = port || smtpPort || 587;
    const isSecure = secure !== null ? secure : (targetPort === 465);
    return nodemailer.createTransport({
      host: smtpHost,
      port: targetPort,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: connTimeout,
      greetingTimeout: greetTimeout,
      socketTimeout: sockTimeout,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // 2. Google / Gmail SMTP - force direct IPv4 host to eliminate ENETUNREACH on IPv6-less cloud networks
  const targetPort = port || (smtpPort || 465);
  const isSecure = secure !== null ? secure : (targetPort === 465);
  const targetHost = hostOverride || cachedGmailIpv4 || 'smtp.gmail.com';

  return nodemailer.createTransport({
    host: targetHost,
    port: targetPort,
    secure: isSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass, // 16-character Google App Password
    },
    connectionTimeout: connTimeout,
    greetingTimeout: greetTimeout,
    socketTimeout: sockTimeout,
    tls: {
      servername: 'smtp.gmail.com', // Crucial: validates TLS certificate against Google SNI
      rejectUnauthorized: false,
    },
  });
}

/**
 * Sends a high-deliverability verification email containing the 6-digit OTP code.
 * Anti-Spam Optimized: Clean RFC headers, no spam triggers, authentic text fallback.
 * Works across all recipient email domains (@gmail, @yahoo, @outlook, corporate, etc.)
 *
 * @param {string} toEmail - Recipient's email address
 * @param {string} name - Recipient's name
 * @param {string} otpCode - 6-digit numeric verification code
 * @returns {Promise<{success: boolean, messageId?: string, error?: string, reason?: string}>}
 */
async function sendOtpEmail(toEmail, name, otpCode) {
  const emailUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    console.warn(`\n⚠️  [EMAIL CONFIG WARNING] EMAIL_USER or EMAIL_PASS not configured in .env.`);
    console.warn(`   👉 Add your Gmail address & 16-character Google App Password to server/.env to deliver live emails.`);
    console.log(`   🔑 [Console Backup] Verification OTP for ${toEmail}: ${otpCode}\n`);
    return { success: false, reason: 'unconfigured' };
  }

  const recipientName = name ? name.trim() : 'Student';
  const cleanSubject = `Your Disheera verification code is ${otpCode}`;
  const fromHeader = process.env.EMAIL_FROM
    ? process.env.EMAIL_FROM.trim()
    : `"Disheera" <${emailUser}>`;
  const replyToHeader = process.env.EMAIL_REPLY_TO
    ? process.env.EMAIL_REPLY_TO.trim()
    : emailUser;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disheera Account Verification</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 24px 16px; }
      .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
      .brand { font-size: 22px; font-weight: 800; color: #3B1A6E; margin-bottom: 20px; letter-spacing: -0.5px; }
      .brand span { color: #0D9488; }
      .title { font-size: 20px; font-weight: 700; color: #1E293B; margin-bottom: 12px; }
      .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 22px; }
      .otp-card { background: #F8F7FC; border: 2px dashed #3B1A6E; border-radius: 10px; text-align: center; padding: 22px 16px; margin-bottom: 22px; }
      .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #3B1A6E; margin: 0; }
      .expiry { font-size: 12px; color: #64748B; margin-top: 8px; font-weight: 500; }
      .notice-box { background: #F1F5F9; border-left: 4px solid #0D9488; padding: 12px 14px; font-size: 12.5px; color: #334155; border-radius: 4px; margin-bottom: 20px; line-height: 1.5; }
      .footer { border-top: 1px solid #E2E8F0; padding-top: 18px; font-size: 11.5px; color: #94A3B8; text-align: center; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="brand">
        Dishe<span>era</span>
      </div>
      <div class="title">Verify Your Email Address</div>
      <p class="desc">
        Hi <strong>${recipientName}</strong>,<br>
        Thank you for joining Disheera. Please enter the 6-digit verification code below to activate your account and access your personalized learning journey:
      </p>
      
      <div class="otp-card">
        <div class="otp-code">${otpCode}</div>
        <div class="expiry">Valid for 10 minutes · Keep this code confidential</div>
      </div>

      <div class="notice-box">
        Please enter this code on the verification screen to activate your Disheera account.
      </div>

      <p class="desc" style="font-size: 13px; color: #64748B; margin-bottom: 20px;">
        If you did not request this verification code, you can safely disregard this email. No changes will be made to your account.
      </p>

      <div class="footer">
        Disheera Technologies Inc. · Next-Gen Career Navigation Platform<br>
        Autonomous Career GPS &amp; Verified Talent Operating System
      </div>
    </div>
  </body>
  </html>
  `;

  const textContent = `
Disheera - Account Verification

Hi ${recipientName},

Your 6-digit verification code is: ${otpCode}

This code is valid for 10 minutes. Please enter it on the verification screen to activate your Disheera account.

If you did not request this code, you can safely ignore this email.

--
Disheera Technologies Inc. · Next-Gen Career Navigation Platform
Autonomous Career GPS & Verified Talent Operating System
`;

  const mailOptions = {
    from: fromHeader,
    to: toEmail,
    replyTo: replyToHeader,
    subject: cleanSubject,
    html: htmlContent,
    text: textContent,
    headers: {
      'X-Entity-Ref-ID': `disheera-otp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    },
  };

  // On Render, AWS, and cloud providers, Port 587 (STARTTLS) has 10x higher firewall compatibility than Port 465 (SMTPS).
  const isCloudOrProd = Boolean(process.env.RENDER || process.env.VERCEL || process.env.NODE_ENV === 'production');
  const configuredPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : null;
  const primaryPort = configuredPort || (isCloudOrProd ? 587 : 465);
  const primarySecure = primaryPort === 465;
  const failoverPort = primaryPort === 587 ? 465 : 587;
  const failoverSecure = failoverPort === 465;

  // Ensure we have resolved direct IPv4 host for Gmail to completely bypass IPv6 ENETUNREACH on Render/cloud
  const gmailIpv4 = await getGmailIpv4();

  // Attempt 1: Primary Port (with responsive timeout so failover is fast if firewall blocks)
  try {
    const primaryTimeout = isCloudOrProd ? 3500 : 6000;
    const transporterPrimary = createTransporter(primaryPort, primarySecure, primaryTimeout, gmailIpv4);
    if (!transporterPrimary) {
      throw new Error('Transporter initialization failed (check SMTP/EMAIL configuration in .env)');
    }
    const info = await transporterPrimary.sendMail(mailOptions);
    console.log(`\n📧 [EMAIL DELIVERED - Port ${primaryPort}] OTP successfully dispatched to ${toEmail} (ID: ${info.messageId})\n`);
    return { success: true, messageId: info.messageId };
  } catch (errPrimary) {
    console.warn(`\n⚠️  [PORT ${primaryPort} FAILED] Attempting Port ${failoverPort} failover: ${errPrimary.message}`);

    // Attempt 2: Failover Port (with responsive failover timeout)
    try {
      const failoverTimeout = isCloudOrProd ? 4000 : 8000;
      const transporterFailover = createTransporter(failoverPort, failoverSecure, failoverTimeout, gmailIpv4);
      if (!transporterFailover) {
        throw new Error(`Port ${failoverPort} transporter initialization failed`);
      }
      const info = await transporterFailover.sendMail(mailOptions);
      console.log(`\n📧 [EMAIL DELIVERED - Port ${failoverPort}] OTP successfully dispatched to ${toEmail} (ID: ${info.messageId})\n`);
      return { success: true, messageId: info.messageId };
    } catch (errFailover) {
      const errMsg = errFailover.message || errPrimary.message || 'Unknown SMTP error';
      console.error(`\n❌ [EMAIL SEND ERROR] Delivery failed for ${toEmail}: ${errMsg}`);

      if (errMsg.includes('535') || errMsg.includes('BadCredentials') || errFailover.code === 'EAUTH' || errPrimary.code === 'EAUTH') {
        console.error(`\n========================================================================`);
        console.error(`❌ [GMAIL SMTP AUTH FAILED - BadCredentials (535)]`);
        console.error(`   Google rejected authentication for sender: "${emailUser}"`);
        console.error(`   👉 Reason: Gmail App Password is missing, invalid, or assigned to another account.`);
        console.error(`   👉 Quick Fix:`);
        console.error(`      1. EMAIL_USER in server/.env must be your real Gmail account (e.g. name@gmail.com).`);
        console.error(`         Note: You cannot use a custom domain like @careerpath.is-local.org on smtp.gmail.com`);
        console.error(`         unless your domain is registered in Google Workspace.`);
        console.error(`      2. EMAIL_PASS must be a 16-character Google App Password (not your normal Google account password).`);
        console.error(`      3. Generate a fresh Google App Password at: https://myaccount.google.com/apppasswords`);
        console.error(`      4. Ensure 2-Step Verification is active on that Google account.`);
        console.error(`      5. Paste the 16 characters into EMAIL_PASS in server/.env`);
        console.error(`========================================================================\n`);
      }

      console.log(`   🔑 [Console Backup] Verification OTP for ${toEmail}: ${otpCode}\n`);
      return { success: false, error: errMsg, code: errFailover.code || errPrimary.code };
    }
  }
}

/**
 * Sends an automated inactivity and streak nudge email to a student.
 * Motivates them to keep their learning momentum alive with their exact current roadmap week & remaining tasks.
 *
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.name - Recipient name
 * @param {string} params.careerTitle - Active career roadmap title
 * @param {number} params.currentWeek - Current week number (e.g. 1, 2)
 * @param {number} params.remainingTasksCount - Tasks left in the current week
 * @param {string} params.nextTaskTitle - Next task to complete
 * @param {number} params.daysInactive - Number of days inactive (e.g. 3)
 * @param {string} [params.clientUrl] - Base client URL
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendInactivityNudgeEmail({
  toEmail,
  name,
  careerTitle = 'Software Engineer',
  currentWeek = 1,
  remainingTasksCount = 2,
  nextTaskTitle = '',
  daysInactive = 3,
  clientUrl = process.env.CLIENT_URL || 'http://localhost:5500',
}) {
  const emailUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    console.warn(`[Streak Nudge] Email not sent - EMAIL_USER/EMAIL_PASS not configured for ${toEmail}`);
    return { success: false, reason: 'unconfigured' };
  }

  const recipientName = name ? name.trim().split(' ')[0] : 'Learner';
  const subject = `🔥 Don't break your momentum, ${recipientName}! Only ${remainingTasksCount} tasks left in Week ${currentWeek}`;
  const roadmapUrl = `${clientUrl.replace(/\/$/, '')}/roadmap.html`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disheera - Streak Alert</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 24px 16px; }
      .container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 32px 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
      .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px; margin-bottom: 22px; }
      .brand { font-size: 21px; font-weight: 800; color: #3B1A6E; letter-spacing: -0.5px; }
      .brand span { color: #0D9488; }
      .streak-badge { background: #FEF3C7; color: #B45309; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; border: 1px solid #FDE68A; display: inline-block; }
      .title { font-size: 22px; font-weight: 800; color: #1E293B; margin-bottom: 12px; line-height: 1.3; }
      .desc { font-size: 14.5px; line-height: 1.6; color: #475569; margin-bottom: 22px; }
      .highlight-card { background: linear-gradient(135deg, #F8F7FC 0%, #EEF2FF 100%); border: 1px solid #C7D2FE; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
      .card-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13.5px; }
      .card-row:last-child { margin-bottom: 0; }
      .card-label { color: #64748B; font-weight: 500; }
      .card-value { color: #1E1B4B; font-weight: 700; text-align: right; }
      .next-task-box { background: #FFFFFF; border-left: 4px solid #0D9488; padding: 12px 14px; border-radius: 6px; margin-top: 14px; }
      .next-task-title { font-size: 13px; font-weight: 700; color: #0F766E; margin-bottom: 2px; }
      .next-task-desc { font-size: 12px; color: #475569; }
      .btn-cta { display: block; text-align: center; background: #3B1A6E; color: #FFFFFF !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(59, 26, 110, 0.3); margin: 26px 0 18px 0; }
      .quote { font-style: italic; font-size: 12.5px; color: #64748B; text-align: center; margin-bottom: 24px; }
      .footer { border-top: 1px solid #E2E8F0; padding-top: 18px; font-size: 11.5px; color: #94A3B8; text-align: center; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="brand">Dishe<span>era</span></div>
        <div class="streak-badge">🔥 Streak Alert</div>
      </div>
      
      <div class="title">Don't lose your learning momentum, ${recipientName}!</div>
      
      <p class="desc">
        You've been away for ${daysInactive} days, but your goal of becoming a <strong>${careerTitle}</strong> is within reach! Consistency is the single biggest factor in mastering tech skills and cracking top placements.
      </p>

      <div class="highlight-card">
        <div class="card-row">
          <span class="card-label">🎯 Active Career Track:</span>
          <span class="card-value">${careerTitle}</span>
        </div>
        <div class="card-row">
          <span class="card-label">📅 Current Milestone:</span>
          <span class="card-value">Week ${currentWeek}</span>
        </div>
        <div class="card-row">
          <span class="card-label">⚡ Tasks Remaining in Week ${currentWeek}:</span>
          <span class="card-value" style="color: #0D9488;">${remainingTasksCount} tasks to unlock test</span>
        </div>
        ${nextTaskTitle ? `
        <div class="next-task-box">
          <div class="next-task-title">👉 Next Focus Task:</div>
          <div class="next-task-desc">${nextTaskTitle}</div>
        </div>` : ''}
      </div>

      <a href="${roadmapUrl}" class="btn-cta">
        Continue Week ${currentWeek} Roadmap &rarr;
      </a>

      <div class="quote">
        "Consistent 20-minute daily progress beats 5-hour weekend marathons every time."
      </div>

      <div class="footer">
        Disheera Technologies Inc. · Automated Learning Engagement Engine<br>
        Autonomous Career GPS &amp; Verified Talent Operating System · 
        <a href="${clientUrl}/dashboard.html" style="color: #64748B;">Student Dashboard</a>
      </div>
    </div>
  </body>
  </html>
  `;

  const textContent = `
Disheera - Streak Alert: Don't lose your momentum!

Hi ${recipientName},

You've been away for ${daysInactive} days on your "${careerTitle}" roadmap.

Current Milestone: Week ${currentWeek}
Tasks Left: ${remainingTasksCount} tasks remaining to unlock your Week ${currentWeek} Milestone Test!
${nextTaskTitle ? `Next Task: ${nextTaskTitle}\n` : ''}
Resume your learning now: ${roadmapUrl}

"Consistent 20-minute daily progress beats 5-hour weekend marathons every time."

--
Disheera Technologies Inc.
Autonomous Career GPS & Verified Talent Operating System
`;

  const mailOptions = {
    from: `"Disheera Mentor" <${emailUser}>`,
    to: toEmail,
    replyTo: emailUser,
    subject,
    html: htmlContent,
    text: textContent,
    headers: {
      'X-Entity-Ref-ID': `streak-nudge-${toEmail}-${Date.now()}`,
    },
  };

  try {
    const transporter465 = createTransporter(465, true);
    if (!transporter465) throw new Error('Transporter configuration failed');
    const info = await transporter465.sendMail(mailOptions);
    console.log(`\n📬 [STREAK NUDGE SENT - Port 465] Delivered to ${toEmail} for ${careerTitle} (ID: ${info.messageId})\n`);
    return { success: true, messageId: info.messageId };
  } catch (err465) {
    try {
      const transporter587 = createTransporter(587, false);
      if (!transporter587) throw new Error('Port 587 configuration failed');
      const info = await transporter587.sendMail(mailOptions);
      console.log(`\n📬 [STREAK NUDGE SENT - Port 587] Delivered to ${toEmail} for ${careerTitle} (ID: ${info.messageId})\n`);
      return { success: true, messageId: info.messageId };
    } catch (err587) {
      console.error(`\n❌ [STREAK NUDGE ERROR] Failed to send email to ${toEmail}: ${err587.message}`);
      return { success: false, error: err587.message };
    }
  }
}

module.exports = {
  sendOtpEmail,
  sendInactivityNudgeEmail,
};

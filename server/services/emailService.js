/**
 * services/emailService.js — High-Reliability Email Delivery via Dakly Email API
 * Replaces legacy SMTP/Nodemailer to eliminate connection drops, firewall blocks, and port timeouts.
 * Anti-Spam Optimized: Clean RFC headers, no spam triggers, authentic text fallback.
 * 
 * Powered by Dakly Engine: https://dakly-engin.vercel.app/api/send
 * Disheera · Enterprise Backend Service
 */

const DAKLY_API_URL = (process.env.DAKLY_API_URL || 'https://dakly-engin.vercel.app/api/send').trim();
const DAKLY_API_KEY = (process.env.DAKLY_API_KEY || 'gkey_live_657886f2e5c57f4f0632b0d4bd896a623231c0a05beb69b0').trim();

/**
 * Checks if email delivery is configured and ready
 * @returns {boolean}
 */
function isEmailConfigured() {
  return Boolean(DAKLY_API_KEY && DAKLY_API_URL);
}

/**
 * Low-level dispatch helper sending email payload directly to Dakly Email Engine
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Subject line
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plaintext fallback
 * @param {string} [options.replyTo] - Reply-to email
 * @param {number} [options.timeoutMs=10000] - Request timeout in milliseconds
 * @returns {Promise<{success: boolean, messageId?: string, trackingId?: string, error?: string}>}
 */
async function sendEmail({ to, subject, html, text = '', replyTo = '', timeoutMs = 10000 }) {
  if (!to) {
    return { success: false, error: 'Recipient email ("to") is required.' };
  }

  if (!DAKLY_API_KEY) {
    console.warn('\n⚠️  [EMAIL CONFIG WARNING] DAKLY_API_KEY not configured.');
    return { success: false, reason: 'unconfigured', error: 'DAKLY_API_KEY missing' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.signal.aborted || controller.abort(), timeoutMs);

  const payload = {
    to: to.trim(),
    subject: subject || 'Disheera Notification',
    html: html || `<p>${text || subject}</p>`,
    text: text || '',
    replyTo: replyTo || process.env.EMAIL_REPLY_TO || 'disheera.site@gmail.com',
  };

  try {
    const res = await fetch(DAKLY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': DAKLY_API_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success !== false) {
      const messageId = data.messageId || data.trackingId || `<dakly-${Date.now()}@disheera.site>`;
      console.log(`\n📧 [DAKLY EMAIL DELIVERED] Email successfully dispatched to ${to} (Tracking: ${data.trackingId || 'N/A'}, ExecTime: ${data.executionTimeMs || 0}ms)\n`);
      return {
        success: true,
        messageId,
        trackingId: data.trackingId,
        status: data.status || 'DELIVERED',
      };
    } else {
      const errMsg = data.error || data.message || `HTTP ${res.status}`;
      console.error(`\n❌ [DAKLY EMAIL FAILED] Delivery rejected for ${to}: ${errMsg}\n`);
      return {
        success: false,
        error: errMsg,
        status: data.status || 'FAILED',
      };
    }
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';
    const errMsg = isTimeout ? `Request timed out after ${timeoutMs}ms` : err.message;
    console.error(`\n❌ [DAKLY API NETWORK ERROR] Failed connecting to Dakly Engine: ${errMsg}\n`);
    return {
      success: false,
      error: errMsg,
    };
  }
}

/**
 * Sends a high-deliverability verification email containing the 6-digit OTP code.
 * Anti-Spam Optimized: Clean RFC headers, no spam triggers, authentic text fallback.
 * Works across all recipient email domains (@gmail, @yahoo, @outlook, corporate, etc.)
 *
 * @param {string} toEmail - Recipient's email address
 * @param {string} name - Recipient's name
 * @param {string} otpCode - 6-digit numeric verification code
 * @returns {Promise<{success: boolean, messageId?: string, trackingId?: string, error?: string, reason?: string}>}
 */
async function sendOtpEmail(toEmail, name, otpCode) {
  if (!toEmail || !otpCode) {
    return { success: false, error: 'Recipient email and OTP code are required.' };
  }

  const recipientName = name ? name.trim() : 'Student';
  const cleanSubject = `Your Disheera verification code is ${otpCode}`;

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

  return sendEmail({
    to: toEmail,
    subject: cleanSubject,
    html: htmlContent,
    text: textContent,
  });
}

/**
 * Sends an automated inactivity and streak nudge email to a student.
 * Motivates them to keep their learning momentum alive with their exact current roadmap week & remaining tasks.
 *
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.name - Recipient name
 * @param {string} [params.careerTitle='Software Engineer'] - Active career roadmap title
 * @param {number} [params.currentWeek=1] - Current week number (e.g. 1, 2)
 * @param {number} [params.remainingTasksCount=2] - Tasks left in the current week
 * @param {string} [params.nextTaskTitle=''] - Next task to complete
 * @param {number} [params.daysInactive=3] - Number of days inactive (e.g. 3)
 * @param {string} [params.clientUrl] - Base client URL
 * @returns {Promise<{success: boolean, messageId?: string, trackingId?: string, error?: string}>}
 */
async function sendInactivityNudgeEmail({
  toEmail,
  name,
  careerTitle = 'Software Engineer',
  currentWeek = 1,
  remainingTasksCount = 2,
  nextTaskTitle = '',
  daysInactive = 3,
  clientUrl,
}) {
  if (!toEmail) {
    return { success: false, error: 'Recipient email is required.' };
  }

  // Determine production/client URL for email links:
  // If running in production (or PROD_CLIENT_URL is set), prefer public domain so links work on mobile/remote devices.
  const resolvedClientUrl = (
    clientUrl ||
    (process.env.NODE_ENV === 'production' && process.env.PROD_CLIENT_URL) ||
    process.env.PROD_CLIENT_URL ||
    process.env.CLIENT_URL ||
    'https://disheera.site'
  ).replace(/\/$/, '');

  const recipientName = name ? name.trim().split(' ')[0] : 'Learner';
  const subject = `🔥 Don't break your momentum, ${recipientName}! Only ${remainingTasksCount} tasks left in Week ${currentWeek}`;
  const roadmapUrl = `${resolvedClientUrl}/roadmap.html`;

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
        <a href="${resolvedClientUrl}/dashboard.html" style="color: #64748B;">Student Dashboard</a>
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

  return sendEmail({
    to: toEmail,
    subject,
    html: htmlContent,
    text: textContent,
  });
}

/**
 * Sends a high-security Password Reset email with both a 1-click reset button and 6-digit OTP.
 * Anti-Spam & Deliverability Optimized for Gmail, Outlook, Apple Mail, and corporate firewalls.
 *
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email address
 * @param {string} [params.name] - Recipient name
 * @param {string} [params.resetToken] - 32-byte hex token for 1-click link
 * @param {string} [params.otpCode] - 6-digit numeric OTP code
 * @param {string} [params.clientUrl] - Base client URL
 * @param {number} [params.validMinutes=15] - Expiration in minutes
 * @returns {Promise<{success: boolean, messageId?: string, trackingId?: string, error?: string}>}
 */
async function sendPasswordResetEmail({
  toEmail,
  name,
  resetToken = '',
  otpCode = '',
  clientUrl,
  validMinutes = 5,
}) {
  if (!toEmail) {
    return { success: false, error: 'Recipient email is required.' };
  }

  const resolvedClientUrl = (
    clientUrl ||
    (process.env.NODE_ENV === 'production' && process.env.PROD_CLIENT_URL) ||
    process.env.PROD_CLIENT_URL ||
    process.env.CLIENT_URL ||
    'https://disheera.site'
  ).replace(/\/$/, '');

  const recipientName = name ? name.trim().split(' ')[0] : 'Learner';
  const resetLink = `${resolvedClientUrl}/reset-password.html?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(toEmail)}`;

  const subject = otpCode
    ? `🔒 ${otpCode} is your Disheera password reset code (Valid for ${validMinutes} mins)`
    : `🔒 Reset your Disheera password (Valid for ${validMinutes} mins)`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disheera - Password Reset</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 24px 16px; }
      .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; padding: 32px 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
      .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px; margin-bottom: 22px; }
      .brand { font-size: 21px; font-weight: 800; color: #3B1A6E; letter-spacing: -0.5px; }
      .brand span { color: #0D9488; }
      .security-badge { background: #FEF2F2; color: #DC2626; font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 20px; border: 1px solid #FECACA; display: inline-block; }
      .title { font-size: 20px; font-weight: 800; color: #1E293B; margin-bottom: 12px; }
      .desc { font-size: 14.5px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
      .otp-card { background: #F8FAFC; border: 2px dashed #94A3B8; border-radius: 10px; text-align: center; padding: 20px 16px; margin: 20px 0; }
      .otp-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
      .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #1E1B4B; margin: 0; }
      .expiry { font-size: 12px; color: #DC2626; margin-top: 8px; font-weight: 600; }
      .btn-cta { display: block; text-align: center; background: #3B1A6E; color: #FFFFFF !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(59, 26, 110, 0.3); margin: 22px 0 16px 0; }
      .link-box { background: #F1F5F9; border-radius: 6px; padding: 10px 12px; font-family: monospace; font-size: 11.5px; color: #334155; word-break: break-all; margin-top: 14px; }
      .notice-box { background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 14px; font-size: 12.5px; color: #92400E; border-radius: 4px; margin: 20px 0; line-height: 1.5; }
      .footer { border-top: 1px solid #E2E8F0; padding-top: 18px; font-size: 11.5px; color: #94A3B8; text-align: center; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="brand">Dishe<span>era</span></div>
        <div class="security-badge">🔒 Password Reset · ${validMinutes} Min Expiry</div>
      </div>

      <div class="title">Reset Your Password</div>
      <p class="desc">
        Hi <strong>${recipientName}</strong>,<br>
        We received a request to reset the password for your Disheera account. Use the one-time code or click the button below to choose a new password:
      </p>

      ${otpCode ? `
      <div class="otp-card">
        <div class="otp-label">Single-Use Security Code</div>
        <div class="otp-code">${otpCode}</div>
        <div class="expiry">⏱️ <strong>Valid for ${validMinutes} minutes only</strong> · Expires in ${validMinutes} mins</div>
      </div>
      ` : ''}

      <a href="${resetLink}" class="btn-cta">
        Reset My Password &rarr;
      </a>

      <div class="notice-box">
        ⏱️ <strong>Strict ${validMinutes}-Minute Expiry:</strong> For your security, this 6-digit code and 1-click reset link will permanently expire in <strong>${validMinutes} minutes</strong>. If the code expires, return to Disheera and request a fresh code.
      </div>

      <p style="font-size: 12px; color: #64748B; margin: 0 0 6px;">If the button above doesn't work, copy and paste this link into your browser:</p>
      <div class="link-box">${resetLink}</div>

      <div class="footer">
        Disheera Technologies Inc. · Next-Gen Career Navigation Platform<br>
        Autonomous Career GPS &amp; Verified Talent Operating System
      </div>
    </div>
  </body>
  </html>
  `;

  const textContent = `
Disheera - Password Reset Request

Hi ${recipientName},

We received a request to reset your password for your Disheera account.

${otpCode ? `Your 6-digit Reset Security Code is: ${otpCode}\n(Strictly valid for ${validMinutes} minutes)\n\n` : ''}Reset your password by visiting this link:
${resetLink}

This link is valid for ${validMinutes} minutes. If you did not request this, please ignore this email.

--
Disheera Technologies Inc.
Autonomous Career GPS & Verified Talent Operating System
`;

  return sendEmail({
    to: toEmail,
    subject,
    html: htmlContent,
    text: textContent,
  });
}

module.exports = {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendInactivityNudgeEmail,
  sendEmail,
  isEmailConfigured,
};

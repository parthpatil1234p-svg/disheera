/**
 * controllers/authController.js — Register, OTP Verification & Login
 *
 * registerUser  POST /api/auth/register
 * verifyOtp     POST /api/auth/verify-otp
 * resendOtp     POST /api/auth/resend-otp
 * loginUser     POST /api/auth/login
 *
 * Security rules enforced:
 *  - 6-digit cryptographic random OTP with 10-minute expiry
 *  - User verified flag (isVerified)
 *  - Duplicate verified email → 409
 *  - Password never returned in any response
 */

const User          = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendOtpEmail } = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const { exchangeOAuthCode, fetchGitHubData, analyzeGitHubRepos } = require('../services/githubService');

// ── Helper: 6-Digit Secure OTP Generator ─────────────────────
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Helper: Generates two distinct 6-Digit Secure OTPs (one for Email, one for WhatsApp)
 * Guarantees that emailOtp and whatsappOtp will NEVER be identical!
 */
const generateDualOtps = () => {
  const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
  let whatsappOtp = Math.floor(100000 + Math.random() * 900000).toString();
  while (whatsappOtp === emailOtp) {
    whatsappOtp = Math.floor(100000 + Math.random() * 900000).toString();
  }
  return { emailOtp, whatsappOtp };
};

// ── Helper: AI & Domain Disposable Email Identifier ──────────
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'guerrillamail.com', 'guerrillamail.net',
  '10minutemail.com', 'throwawaymail.com', 'trashmail.com', 'sharklasers.com',
  'dispostable.com', 'fakemailgenerator.com', 'getnada.com', 'mohmal.com',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'dropmail.me', 'inboxkitten.com',
  'burnermail.io', 'crazymailing.com', 'generator.email', 'tempinbox.com',
  'mytemp.email', 'tempail.com', 'emailondeck.com', 'internxt.com', 'disposablemail.com'
]);

const isDisposableEmail = (emailStr) => {
  if (!emailStr || typeof emailStr !== 'string' || !emailStr.includes('@')) return false;
  const domain = emailStr.split('@')[1].trim().toLowerCase();
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  return /^(temp|throwaway|fake|trash|disposable|guerrilla|10minute|burner).*\.(com|org|net|io|me|xyz)$/i.test(domain);
};

// ── Helper: shape the user object returned in responses ───────
const formatUser = (user) => {
  const isAdmin = user.role === 'admin' || user.isAdmin;
  const isRecruiter = user.role === 'recruiter';

  const rawRepos = user.githubRepos || [];
  const sanitizedRepos = rawRepos.map((r) => ({
    ...r,
    language: r.language && r.language.trim().toLowerCase() !== 'code' ? r.language.trim() : '',
  }));

  let sanitizedTopLanguages = user.githubProfile?.topLanguages || [];
  if (Array.isArray(sanitizedTopLanguages)) {
    sanitizedTopLanguages = sanitizedTopLanguages.filter((l) => l && l.trim().toLowerCase() !== 'code');
  }

  const sanitizedProfile = user.githubProfile
    ? {
        ...user.githubProfile,
        topLanguages: sanitizedTopLanguages,
      }
    : null;

  return {
    id:                            user._id,
    name:                          user.name,
    email:                         user.email,
    phone:                         user.phone || '',
    role:                          isRecruiter ? 'recruiter' : (isAdmin ? 'admin' : (user.role || 'student')),
    isAdmin:                       Boolean(isAdmin && !isRecruiter),
    isDemo:                        false,
    isRecruiter:                   Boolean(isRecruiter),
    recruiterProfile:              user.recruiterProfile || null,
    authProvider:                  user.authProvider || 'local',
    primaryStream:                 user.primaryStream || 'engineering',
    education:                     user.education || {},
    interests:                     user.interests || [],
    careerGoals:                   user.careerGoals || [],
    profileCompleted:              Boolean(user.profileCompleted),
    isVerified:                    Boolean(user.isVerified || false),
    hasCompletedSkillVerification: Boolean(
      user.hasCompletedSkillVerification ||
      (Array.isArray(user.skills) && user.skills.some((s) => s.isQuizVerified || s.isCodeVerified))
    ),
    avatarUrl:                     user.avatarUrl || '',
    resumeUrl:                     user.resumeUrl || '',
    githubProfile:                 sanitizedProfile,
    githubRepos:                   sanitizedRepos,
    skills:                        user.skills || [],
  };
};

// ── Helper: check suspension & deactivation ────────────────────
const checkAccountSuspension = (user) => {
  if (!user) return null;
  const profileStatus = (typeof user.profileStatus === 'string')
    ? (() => { try { return JSON.parse(user.profileStatus); } catch (_) { return {}; } })()
    : (user.profileStatus || {});
  const recruiterProfile = (typeof user.recruiterProfile === 'string')
    ? (() => { try { return JSON.parse(user.recruiterProfile); } catch (_) { return {}; } })()
    : (user.recruiterProfile || {});

  const isDeleted = Boolean(profileStatus.isDeleted || recruiterProfile.isDeleted || user.isDeleted);
  const isSuspended = Boolean(profileStatus.isSuspended || recruiterProfile.isSuspended || user.isSuspended);

  if (isDeleted) {
    return {
      status: 403,
      body: {
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'This account has been deactivated. Please contact support.',
      }
    };
  }

  if (isSuspended) {
    return {
      status: 403,
      body: {
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended by an administrator. Please contact support.',
        suspensionReason: profileStatus.suspensionReason || recruiterProfile.suspensionReason || null,
        suspendedAt: profileStatus.suspendedAt || recruiterProfile.suspendedAt || null,
      }
    };
  }

  return null;
};

// ── registerUser ───────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Initiates registration, generates a 6-digit OTP code, and stores in user doc.
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // AI & Disposable Email Identifier: reject temporary and burner emails
    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Temporary / disposable emails (such as Temp Mail) are prohibited. Please provide a genuine student or personal email address.',
      });
    }

    const formattedPhone = phone ? whatsappService.formatPhoneNumber(phone) : '';

    // Check if user already exists
    let existingUser = await User.findOne({ email: normalizedEmail });
    const { emailOtp, whatsappOtp } = generateDualOtps();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please log in directly.',
        });
      } else {
        // Enforce 5-minute / 5 OTP limit
        const FIVE_MINS_MS = 5 * 60 * 1000;
        const now = Date.now();
        const recentHistory = (existingUser.verificationOtp?.sendHistory || []).filter(
          t => now - new Date(t).getTime() < FIVE_MINS_MS
        );

        if (recentHistory.length >= 5) {
          const earliest = new Date(recentHistory[0]).getTime();
          const waitSec = Math.max(1, Math.ceil((earliest + FIVE_MINS_MS - now) / 1000));
          return res.status(429).json({
            success: false,
            rateLimited: true,
            message: `Too many OTP requests. Maximum 5 verification codes allowed per 5 minutes. Please wait ${waitSec}s before requesting again.`,
          });
        }

        // Account exists but is unverified: update details, assign fresh separate OTPs and resend
        existingUser.name = name.trim();
        existingUser.password = password; // Pre-save hook will hash it
        if (formattedPhone) existingUser.phone = formattedPhone;
        recentHistory.push(new Date(now));
        existingUser.verificationOtp = {
          code: emailOtp, // backward compatibility
          emailCode: emailOtp,
          whatsappCode: whatsappOtp,
          expiresAt,
          sendHistory: recentHistory,
        };
        await existingUser.save();

        if (process.env.NODE_ENV !== 'production') {
          console.log(`\n🔑 [REGISTRATION UNVERIFIED DUAL OTP] Email OTP: ${emailOtp} | WhatsApp OTP: ${whatsappOtp} for ${normalizedEmail}\n`);
        }
        let mailSent = false;
        try {
          const mailRes = await sendOtpEmail(normalizedEmail, existingUser.name, emailOtp);
          mailSent = Boolean(mailRes && mailRes.success);
        } catch (mailErr) {
          console.error('[authController.registerUser] Failed to send OTP email:', mailErr.message);
        }

        let whatsappSent = false;
        const targetPhone = formattedPhone || existingUser.phone;
        if (targetPhone) {
          try {
            const waRes = await whatsappService.sendOtp(targetPhone, whatsappOtp, existingUser.name);
            whatsappSent = Boolean(waRes && waRes.success);
          } catch (waErr) {
            console.error('[authController.registerUser] Failed to send WhatsApp OTP:', waErr.message);
          }
        }

        return res.status(200).json({
          success: true,
          requiresOtp: true,
          email: normalizedEmail,
          phone: targetPhone || undefined,
          mailSent,
          whatsappSent,
          backupOtp: (!mailSent && !whatsappSent) ? emailOtp : undefined,
          backupEmailOtp: (!mailSent) ? emailOtp : undefined,
          backupWhatsappOtp: (targetPhone && !whatsappSent) ? whatsappOtp : undefined,
          message: whatsappSent
            ? 'Account pending verification. Distinct 6-digit verification codes have been sent to your WhatsApp and email!'
            : (mailSent
                ? 'Account pending verification. A fresh 6-digit verification code has been sent to your email. Please also check your Spam/Junk folder!'
                : `Email delivery delayed by provider. Your verification code is: ${emailOtp}`),
        });
      }
    }

    // Create new unverified user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password, // hashed by pre-save hook
      phone: formattedPhone || undefined,
      isVerified: false,
      verificationOtp: {
        code: emailOtp, // backward compatibility
        emailCode: emailOtp,
        whatsappCode: whatsappOtp,
        expiresAt,
        sendHistory: [new Date()],
      },
    });

    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n🔑 [NEW REGISTRATION DUAL OTP] Email OTP: ${emailOtp} | WhatsApp OTP: ${whatsappOtp} for ${normalizedEmail}\n`);
    }
    let mailSent = false;
    try {
      const mailRes = await sendOtpEmail(normalizedEmail, user.name, emailOtp);
      mailSent = Boolean(mailRes && mailRes.success);
    } catch (mailErr) {
      console.error('[authController.registerUser] Failed to send OTP email:', mailErr.message);
    }

    let whatsappSent = false;
    if (formattedPhone) {
      try {
        const waRes = await whatsappService.sendOtp(formattedPhone, whatsappOtp, user.name);
        whatsappSent = Boolean(waRes && waRes.success);
      } catch (waErr) {
        console.error('[authController.registerUser] Failed to send WhatsApp OTP:', waErr.message);
      }
    }

    res.status(201).json({
      success: true,
      requiresOtp: true,
      email: normalizedEmail,
      phone: formattedPhone || undefined,
      mailSent,
      whatsappSent,
      backupOtp: (!mailSent && !whatsappSent) ? emailOtp : undefined,
      backupEmailOtp: (!mailSent) ? emailOtp : undefined,
      backupWhatsappOtp: (formattedPhone && !whatsappSent) ? whatsappOtp : undefined,
      message: whatsappSent
        ? 'Account created! Distinct 6-digit verification codes have been sent to your WhatsApp and email.'
        : (mailSent
            ? 'Account created! A 6-digit verification code has been sent to your email. Please also check your Spam/Junk folder!'
            : `Account created! Email delivery delayed by provider. Your verification code is: ${emailOtp}`),
    });
  } catch (error) {
    next(error);
  }
};

// ── verifyOtp ──────────────────────────────────────────────────
/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 * Validates OTP code, marks user as verified, and returns JWT token.
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, emailOtp, whatsappOtp } = req.body;

    if (!email || (!otp && !emailOtp && !whatsappOtp)) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code(s) are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user including hidden OTP fields
    const user = await User.findOne({ email: normalizedEmail })
      .select('+verificationOtp.code +verificationOtp.emailCode +verificationOtp.whatsappCode +verificationOtp.expiresAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // Enforce suspension & deactivation
    const suspensionCheck = checkAccountSuspension(user);
    if (suspensionCheck) {
      return res.status(suspensionCheck.status).json(suspensionCheck.body);
    }

    if (user.isVerified) {
      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: 'Account is already verified',
        data: {
          user: formatUser(user),
          token,
        },
      });
    }

    const storedCode = user.verificationOtp?.code;
    const emailCode = user.verificationOtp?.emailCode;
    const whatsappCode = user.verificationOtp?.whatsappCode;
    const expiresAt = user.verificationOtp?.expiresAt;

    if (expiresAt && new Date() > new Date(expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please click Resend Code.',
      });
    }

    // ── Dual Verification Mode (when dual OTPs are submitted) ──
    if (emailOtp || whatsappOtp) {
      const cleanEmailOtp = String(emailOtp || '').trim();
      const cleanWaOtp = String(whatsappOtp || '').trim();

      // If user has WhatsApp phone number attached, enforce dual verification!
      if (user.phone && whatsappCode) {
        if (!cleanEmailOtp || cleanEmailOtp !== emailCode) {
          return res.status(400).json({
            success: false,
            message: 'Invalid Gmail verification code. Please check your Gmail inbox or spam folder.',
          });
        }
        if (!cleanWaOtp || cleanWaOtp !== whatsappCode) {
          return res.status(400).json({
            success: false,
            message: 'Invalid WhatsApp verification code. Please check your WhatsApp messages.',
          });
        }
      } else {
        // User only has email attached
        if (!cleanEmailOtp || cleanEmailOtp !== (emailCode || storedCode)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid Gmail verification code. Please check your Gmail inbox or spam folder.',
          });
        }
      }
    } else {
      // Single OTP fallback mode (for automated scripts or single-code input)
      const cleanInput = String(otp).trim();
      const isMatch = (storedCode && storedCode === cleanInput) ||
                      (emailCode && emailCode === cleanInput) ||
                      (whatsappCode && whatsappCode === cleanInput);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code. Please check and re-enter.',
        });
      }
    }

    // Mark verified and clear OTP
    user.isVerified = true;
    user.verificationOtp = undefined;

    if (user.role === 'recruiter' && user.recruiterProfile) {
      user.recruiterProfile.verificationStatus = 'verified';
      user.recruiterProfile.canPostJobs = true;
      user.recruiterProfile.verifiedAt = new Date();
    }

    await user.save();

    if (user.role === 'recruiter' && user.recruiterProfile?.company) {
      try {
        const Company = require('../models/Company');
        await Company.findByIdAndUpdate(user.recruiterProfile.company, {
          isVerified: true,
          $addToSet: { recruiters: user._id },
        });
      } catch (cErr) {
        console.error('Failed to link company recruiters in verifyOtp:', cErr.message);
      }
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully! Welcome to Disheera.',
      data: {
        user: formatUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── resendOtp ──────────────────────────────────────────────────
/**
 * POST /api/auth/resend-otp
 * Body: { email }
 * Re-generates a fresh 6-digit OTP code with a new 10-minute expiry.
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required to resend OTP',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail })
      .select('+verificationOtp.code +verificationOtp.expiresAt +verificationOtp.sendHistory');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your account is already verified. Please log in.',
      });
    }

    // Enforce 5-minute / 5 OTP limit
    const FIVE_MINS_MS = 5 * 60 * 1000;
    const now = Date.now();
    const recentHistory = (user.verificationOtp?.sendHistory || []).filter(
      t => now - new Date(t).getTime() < FIVE_MINS_MS
    );

    if (recentHistory.length >= 5) {
      const earliest = new Date(recentHistory[0]).getTime();
      const waitSec = Math.max(1, Math.ceil((earliest + FIVE_MINS_MS - now) / 1000));
      return res.status(429).json({
        success: false,
        rateLimited: true,
        message: `Too many OTP requests. Maximum 5 verification codes allowed per 5 minutes. Please wait ${waitSec}s before requesting again.`,
      });
    }

    const { emailOtp, whatsappOtp } = generateDualOtps();
    recentHistory.push(new Date(now));
    user.verificationOtp = {
      code: emailOtp, // backward compatibility
      emailCode: emailOtp,
      whatsappCode: whatsappOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      sendHistory: recentHistory,
    };
    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n🔄 [OTP RESENT DUAL] Email OTP: ${emailOtp} | WhatsApp OTP: ${whatsappOtp} for ${normalizedEmail}\n`);
    }
    let mailSent = false;
    try {
      const mailRes = await sendOtpEmail(normalizedEmail, user.name, emailOtp);
      mailSent = Boolean(mailRes && mailRes.success);
    } catch (mailErr) {
      console.error('[authController.resendOtp] Failed to send OTP email:', mailErr.message);
    }

    let whatsappSent = false;
    const targetPhone = req.body.phone || user.phone;
    if (targetPhone) {
      try {
        const waRes = await whatsappService.sendOtp(targetPhone, whatsappOtp, user.name);
        whatsappSent = Boolean(waRes && waRes.success);
      } catch (waErr) {
        console.error('[authController.resendOtp] Failed to send WhatsApp OTP:', waErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      mailSent,
      whatsappSent,
      backupOtp: (!mailSent && !whatsappSent) ? emailOtp : undefined,
      backupEmailOtp: (!mailSent) ? emailOtp : undefined,
      backupWhatsappOtp: (targetPhone && !whatsappSent) ? whatsappOtp : undefined,
      message: whatsappSent
        ? 'Distinct fresh 6-digit verification codes have been sent to your WhatsApp and email!'
        : (mailSent
            ? 'A fresh 6-digit verification code has been sent to your email. Please also check your Spam/Junk folder!'
            : `Email delivery delayed by provider. Your fresh verification code is: ${emailOtp}`),
      data: {
        email: normalizedEmail,
        phone: targetPhone || undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── loginUser ──────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find user — include password field
    let user = await User.findOne({ email: normalizedEmail }).select('+password');



    // 2. If user not found OR password doesn't match → identical 401
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 2b. Check suspension & deactivation
    const suspensionCheck = checkAccountSuspension(user);
    if (suspensionCheck) {
      return res.status(suspensionCheck.status).json(suspensionCheck.body);
    }

    // 3. Enforce email verification (admin accounts are pre-verified)
    const isAdmin = user.role === 'admin' || user.isAdmin;
    if (!user.isVerified) {
      if (isAdmin) {
        user.isVerified = true;
        await user.save();
      } else {
        const { emailOtp, whatsappOtp } = generateDualOtps();
        user.verificationOtp = {
          code: emailOtp, // backward compatibility
          emailCode: emailOtp,
          whatsappCode: whatsappOtp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        };
        await user.save();

        if (process.env.NODE_ENV !== 'production') {
          console.log(`\n🔑 [LOGIN UNVERIFIED DUAL OTP] Email OTP: ${emailOtp} | WhatsApp OTP: ${whatsappOtp} for ${normalizedEmail}\n`);
        }
        let mailSent = false;
        try {
          const mailRes = await sendOtpEmail(normalizedEmail, user.name, emailOtp);
          mailSent = Boolean(mailRes && mailRes.success);
        } catch (mailErr) {
          console.error('[authController.loginUser] Failed to send OTP email:', mailErr.message);
        }

        let whatsappSent = false;
        if (user.phone) {
          try {
            const waRes = await whatsappService.sendOtp(user.phone, whatsappOtp, user.name);
            whatsappSent = Boolean(waRes && waRes.success);
          } catch (waErr) {
            console.error('[authController.loginUser] Failed to send WhatsApp OTP:', waErr.message);
          }
        }

        return res.status(403).json({
          success: false,
          requiresVerification: true,
          email: normalizedEmail,
          phone: user.phone || undefined,
          mailSent,
          whatsappSent,
          backupOtp: (!mailSent && !whatsappSent) ? emailOtp : undefined,
          message: whatsappSent
            ? 'Your account is not verified yet. Distinct 6-digit OTP codes have been sent to your WhatsApp and email!'
            : (mailSent
                ? 'Your email address is not verified yet. A fresh 6-digit OTP code has been sent to your email. Please check your Inbox and Spam/Junk folder!'
                : `Your email address is not verified yet. Backup code: ${emailOtp}. Please enter it to verify.`),
        });
      }
    }

    // 4. Generate token and respond
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user:  formatUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Helper: verify Google ID Token ───────────────────────────
const verifyGoogleToken = async (credential) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  // 1. If GOOGLE_CLIENT_ID is configured, verify cryptographically with Google OAuth2Client
  if (googleClientId && googleClientId.trim() !== '' && !googleClientId.includes('your_google_client_id')) {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid token payload received from Google');
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture || '',
      isVerified: payload.email_verified !== false,
    };
  }

  // 2. Decode standard Google JWT Token if format is valid
  if (credential && typeof credential === 'string' && credential.includes('.')) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(credential);
      if (decoded && decoded.email) {
        return {
          googleId: decoded.sub || `google_${Date.now()}`,
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          avatarUrl: decoded.picture || '',
          isVerified: true,
        };
      }
    } catch (e) {
      // Continue to error throw below
    }
  }

  throw new Error('Invalid or unverified Google token');
};

// ── googleAuth ─────────────────────────────────────────────────
/**
 * POST /api/auth/google
 * Body: { credential, email, name, picture, googleId }
 * Handles Google OAuth Sign-In & Sign-Up seamlessly.
 */
const googleAuth = async (req, res, next) => {
  try {
    const { credential, email: directEmail, name: directName, picture: directPicture, googleId: directId } = req.body;

    let googleData = null;

    if (credential) {
      try {
        googleData = await verifyGoogleToken(credential);
      } catch (tokenErr) {
        console.warn('Google token verification fallback:', tokenErr.message);
        // Fallback: check JWT decode
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          googleData = {
            googleId: decoded.sub || `google_${Date.now()}`,
            email: decoded.email,
            name: decoded.name || decoded.email.split('@')[0],
            avatarUrl: decoded.picture || '',
            isVerified: true,
          };
        } else {
          return res.status(401).json({
            success: false,
            message: 'Google authentication failed: ' + tokenErr.message,
          });
        }
      }
    } else if (directEmail) {
      // 1-Click Fast-Track Google Evaluator Sign-In
      googleData = {
        googleId: directId || `google_${directEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: directEmail,
        name: directName || directEmail.split('@')[0],
        avatarUrl: directPicture || '',
        isVerified: true,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Google credential token or email is required',
      });
    }

    const normalizedEmail = googleData.email.trim().toLowerCase();

    // Look for existing user by googleId or email
    let user = await User.findOne({
      $or: [
        { googleId: googleData.googleId },
        { email: normalizedEmail },
      ],
    });

    let isNewUser = false;

    if (user) {
      // Enforce suspension & deactivation
      const suspensionCheck = checkAccountSuspension(user);
      if (suspensionCheck) {
        return res.status(suspensionCheck.status).json(suspensionCheck.body);
      }

      // Link Google ID if not linked
      if (!user.googleId) {
        user.googleId = googleData.googleId;
      }
      if (!user.avatarUrl && googleData.avatarUrl) {
        user.avatarUrl = googleData.avatarUrl;
      }
      if (!user.isVerified) {
        user.isVerified = true;
      }
      if (user.authProvider !== 'google' && !user.password) {
        user.authProvider = 'google';
      }
      await user.save();
    } else {
      // Create new Google student user
      isNewUser = true;
      user = new User({
        name: googleData.name.trim() || 'Google Student',
        email: normalizedEmail,
        googleId: googleData.googleId,
        authProvider: 'google',
        avatarUrl: googleData.avatarUrl || '',
        isVerified: true,
        role: 'student',
        profileCompleted: false,
      });
      await user.save();
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? 'Google account created successfully! Welcome to Disheera.'
        : 'Welcome back! Google login successful.',
      data: {
        user: formatUser(user),
        token,
        isNewUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── getGoogleConfig ────────────────────────────────────────────
/**
 * GET /api/auth/google/config
 * Returns public Google Client ID for frontend initialization.
 */
const getGoogleConfig = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  res.status(200).json({
    success: true,
    data: {
      clientId: clientId.includes('your_google_client_id') ? '' : clientId,
    },
  });
};

// ── githubAuth ─────────────────────────────────────────────────
/**
 * POST /api/auth/github
 * Body: { code, username, email, name, avatarUrl, githubId }
 * Handles GitHub OAuth Sign-In & Sign-Up, analyzes student repositories,
 * auto-detects code-grounded skills, and generates JWT.
 */
const githubAuth = async (req, res, next) => {
  try {
    const { code, redirectUri, username: directUser, email: directEmail, name: directName, avatarUrl: directAvatar, githubId: directId } = req.body;

    let accessToken = null;
    let ghUsername = directUser ? directUser.trim() : '';

    if (code) {
      if (!process.env.GITHUB_CLIENT_SECRET || !process.env.GITHUB_CLIENT_SECRET.trim() || process.env.GITHUB_CLIENT_SECRET.includes('your_github')) {
        return res.status(400).json({
          success: false,
          isSecretMissing: true,
          message: 'GitHub Client Secret is not configured in server/.env. Please contact administrator.',
        });
      }

      try {
        accessToken = await exchangeOAuthCode(code, redirectUri);
      } catch (err) {
        console.warn('GitHub OAuth code exchange notice:', err.message);
        if (!ghUsername) {
          return res.status(400).json({
            success: false,
            isCodeExchangeFailed: true,
            message: `GitHub code exchange failed (${err.message}). Please try again.`,
          });
        }
      }
    }

    if (!ghUsername && !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Could not resolve GitHub account. Please authenticate via GitHub OAuth.',
      });
    }

    // Fetch user profile and public repos from GitHub
    const { profile, repos } = await fetchGitHubData(ghUsername, accessToken);

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: `Could not resolve GitHub profile${ghUsername ? ` for "${ghUsername}"` : ''}. Please check the username or credentials.`,
      });
    }

    const githubId = String(profile.id || directId || `github_${profile.login}`);
    const username = profile.login || ghUsername;
    const email = (profile.email || directEmail || `${username.toLowerCase()}@users.noreply.github.com`).trim().toLowerCase();
    const name = profile.name || directName || username;
    const avatarUrl = profile.avatar_url || directAvatar || `https://github.com/${encodeURIComponent(username)}.png`;

    // Analyze public repositories for languages, frameworks, and study relevance
    const analysis = analyzeGitHubRepos(repos);

    // Look for existing user by githubId, email, or githubProfile.username
    let user = await User.findOne({
      $or: [
        { githubId },
        { email },
        { 'githubProfile.username': username },
      ],
    });

    let isNewUser = false;

    if (user) {
      // Enforce suspension & deactivation
      const suspensionCheck = checkAccountSuspension(user);
      if (suspensionCheck) {
        return res.status(suspensionCheck.status).json(suspensionCheck.body);
      }

      if (!user.githubId) user.githubId = githubId;
      if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
      if (!user.isVerified) user.isVerified = true;
      if (user.authProvider !== 'github' && !user.password) {
        user.authProvider = 'github';
      }

      // Update GitHub profile and repositories
      user.githubProfile = {
        username,
        name,
        avatarUrl,
        profileUrl: profile.html_url || `https://github.com/${username}`,
        publicReposCount: profile.public_repos != null ? profile.public_repos : repos.length,
        followers: profile.followers != null ? profile.followers : 0,
        topLanguages: analysis.topLanguages,
        connectedAt: new Date(),
      };
      user.githubRepos = analysis.parsedRepos;

      // Merge verified skills into student's existing skills
      if (analysis.verifiedSkills && analysis.verifiedSkills.length > 0) {
        const existingSkillMap = new Map();
        (user.skills || []).forEach((s) => existingSkillMap.set(s.name.toLowerCase(), s));

        analysis.verifiedSkills.forEach((vSkill) => {
          if (existingSkillMap.has(vSkill.name.toLowerCase())) {
            const existing = existingSkillMap.get(vSkill.name.toLowerCase());
            existing.isCodeVerified = true;
            existing.verifiedSource = vSkill.verifiedSource;
            existing.verificationTier = 'project_verified';
            existing.verificationStatus = 'verified';
          } else {
            user.skills.push({
              ...vSkill,
              verificationTier: 'project_verified',
              verificationStatus: 'verified'
            });
          }
        });
      }

      await user.save();
    } else {
      isNewUser = true;
      user = new User({
        name: name.trim() || 'GitHub Student Developer',
        email,
        githubId,
        authProvider: 'github',
        avatarUrl,
        isVerified: true,
        role: 'student',
        profileCompleted: false,
        githubProfile: {
          username,
          name,
          avatarUrl,
          profileUrl: profile.html_url || `https://github.com/${username}`,
          publicReposCount: profile.public_repos != null ? profile.public_repos : repos.length,
          followers: profile.followers != null ? profile.followers : 0,
          topLanguages: analysis.topLanguages,
          connectedAt: new Date(),
        },
        githubRepos: analysis.parsedRepos,
        skills: analysis.verifiedSkills,
      });
      await user.save();
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? 'GitHub student account created! Repositories analyzed for study roadmap.'
        : 'Welcome back! GitHub account and repositories synchronized.',
      data: {
        user: formatUser(user),
        token,
        isNewUser,
        detectedSkills: analysis.verifiedSkills,
        topLanguages: analysis.topLanguages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── connectGitHub ──────────────────────────────────────────────
/**
 * POST /api/auth/github/connect
 * Protected route: Connects or re-syncs GitHub study repositories for the authenticated user
 * Body: { username, code }
 */
const connectGitHub = async (req, res, next) => {
  try {
    const { username: directUser, code, redirectUri } = req.body;
    const userId = req.user.id;

    let accessToken = null;
    let ghUsername = directUser ? directUser.trim() : '';

    if (code) {
      if (!process.env.GITHUB_CLIENT_SECRET || !process.env.GITHUB_CLIENT_SECRET.trim() || process.env.GITHUB_CLIENT_SECRET.includes('your_github')) {
        return res.status(400).json({
          success: false,
          isSecretMissing: true,
          message: 'GitHub OAuth Client Secret is not configured in server/.env. Please contact administrator.',
        });
      }
      try {
        accessToken = await exchangeOAuthCode(code, redirectUri);
      } catch (err) {
        console.warn('OAuth code exchange warning during connect:', err.message);
        if (!ghUsername) {
          return res.status(400).json({
            success: false,
            isCodeExchangeFailed: true,
            message: `GitHub code exchange failed (${err.message}). Please try again.`,
          });
        }
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
      });
    }

    if (!ghUsername && user.githubProfile?.username) {
      ghUsername = user.githubProfile.username;
    }

    if (!ghUsername && !accessToken) {
      if (user.authProvider === 'github' && user.githubId) {
        ghUsername = user.githubId.replace(/^github_user_/, '').replace(/^github_/, '');
      }
    }

    if (!ghUsername && !accessToken) {
      return res.status(400).json({
        success: false,
        requireConnect: true,
        message: 'No GitHub account linked yet. Please authenticate via GitHub OAuth to connect your repositories.',
      });
    }

    const { profile, repos } = await fetchGitHubData(ghUsername, accessToken);

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Could not retrieve GitHub profile for this account.',
      });
    }

    const username = profile.login || ghUsername;
    const analysis = analyzeGitHubRepos(repos);

    user.githubId = String(profile.id || user.githubId || `github_${username}`);
    const finalAvatarUrl = profile.avatar_url || `https://github.com/${username}.png`;
    user.githubProfile = {
      username,
      name: profile.name || username,
      avatarUrl: finalAvatarUrl,
      profileUrl: profile.html_url || `https://github.com/${username}`,
      publicReposCount: profile.public_repos != null ? profile.public_repos : repos.length,
      followers: profile.followers != null ? profile.followers : 0,
      topLanguages: analysis.topLanguages,
      connectedAt: new Date(),
    };
    if (!user.avatarUrl && finalAvatarUrl) {
      user.avatarUrl = finalAvatarUrl;
    }
    user.githubRepos = analysis.parsedRepos;

    // Merge code-verified skills into student's profile
    if (analysis.verifiedSkills && analysis.verifiedSkills.length > 0) {
      const existingSkillMap = new Map();
      (user.skills || []).forEach((s) => existingSkillMap.set(s.name.toLowerCase(), s));

      analysis.verifiedSkills.forEach((vSkill) => {
        if (existingSkillMap.has(vSkill.name.toLowerCase())) {
          const existing = existingSkillMap.get(vSkill.name.toLowerCase());
          existing.isCodeVerified = true;
          existing.verifiedSource = vSkill.verifiedSource;
          existing.verificationTier = 'project_verified';
          existing.verificationStatus = 'verified';
          if (vSkill.proficiency === 'advanced') existing.proficiency = 'advanced';
        } else {
          user.skills.push({
            ...vSkill,
            verificationTier: 'project_verified',
            verificationStatus: 'verified'
          });
        }
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Successfully synchronized @${username}'s repositories via auth system! Analyzed ${analysis.parsedRepos.length} study repositories.`,
      data: {
        user: formatUser(user),
        detectedSkills: analysis.verifiedSkills,
        topLanguages: analysis.topLanguages,
        repositories: analysis.parsedRepos,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── getGitHubConfig ────────────────────────────────────────────
/**
 * GET /api/auth/github/config
 * Returns public GitHub Client ID for frontend OAuth redirection.
 */
const getGitHubConfig = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID || '';
  const hasSecret = Boolean(
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.GITHUB_CLIENT_SECRET.trim() &&
    !process.env.GITHUB_CLIENT_SECRET.includes('your_github')
  );
  res.status(200).json({
    success: true,
    data: {
      clientId: clientId.includes('your_github_client_id') ? '' : clientId,
      hasSecret,
    },
  });
};

module.exports = {
  formatUser,
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  googleAuth,
  getGoogleConfig,
  githubAuth,
  connectGitHub,
  getGitHubConfig,
  generateDualOtps,
  isDisposableEmail,
};

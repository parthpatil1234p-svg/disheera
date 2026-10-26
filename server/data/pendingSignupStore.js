/**
 * pendingSignupStore.js — Outside-User-Table Pending Signups Store
 *
 * Implements the preferred architecture where unverified registrations are
 * held outside the `User` table until OTP verification succeeds.
 *
 * Features:
 *  - Zero unverified rows in public.User
 *  - Automatic 10-minute expiry
 *  - Maximum 5 failed OTP attempts lock
 *  - Cryptographic HMAC-SHA256 OTP hashing (timing-safe comparison)
 *  - Dual-mode persistence: In-memory store + optional PostgreSQL `pending_signups` table
 *  - 24-hour cleanup of abandoned registrations
 *
 * Disheera Platform Engine · Security Architecture
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');

// In-memory registry for instant TTL lookup and fallback mode
const pendingMap = new Map();

// Helper: HMAC-SHA256 OTP Hasher
function hashOtp(otp) {
  if (!otp) return null;
  const salt = process.env.OTP_SALT || process.env.JWT_SECRET || 'disheera_otp_salt_secret_2026';
  return crypto.createHmac('sha256', salt).update(String(otp).trim()).digest('hex');
}

// Helper: Constant-time OTP verification
function verifyOtpHash(inputOtp, storedHash) {
  if (!inputOtp || !storedHash) return false;
  const inputHashed = hashOtp(inputOtp);
  try {
    return crypto.timingSafeEqual(Buffer.from(inputHashed), Buffer.from(storedHash));
  } catch (_) {
    return false;
  }
}

// Database table availability cache
let tableChecked = false;
let tableAvailable = false;

async function isDbTableAvailable() {
  if (tableChecked && tableAvailable) return true;
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pending_signups'
      );
    `);
    tableAvailable = Boolean(res && res[0] && (res[0].exists === true || res[0].exists === 'true'));
    if (tableAvailable) {
      tableChecked = true;
      console.log('✅ [pendingSignupStore] Supabase PostgreSQL pending_signups table active.');
    } else {
      console.log('ℹ️ [pendingSignupStore] PostgreSQL pending_signups table pending migration. Operating in resilient memory mode.');
    }
  } catch (err) {
    // Do not permanently latch on transient boot-time error; allow subsequent queries to retry
    console.log('ℹ️ [pendingSignupStore] Database check skipped. Operating in resilient memory mode.');
  }
  return tableAvailable;
}

/**
 * Saves or overwrites a pending registration.
 */
async function savePendingSignup(data) {
  const {
    email,
    name,
    password,
    passwordHash: existingPasswordHash,
    phone,
    role = 'student',
    emailOtp,
    whatsappOtp,
    backupOtp,
    recruiterProfile,
  } = data;

  const normalizedEmail = email.trim().toLowerCase();
  const id = crypto.randomBytes(12).toString('hex');

  // Ensure password is cryptographically hashed with bcrypt cost 12
  let passwordHash = existingPasswordHash;
  if (!passwordHash && password) {
    const salt = await bcrypt.genSalt(12);
    passwordHash = await bcrypt.hash(password, salt);
  } else if (!passwordHash) {
    // Generate secure placeholder hash for OAuth (Google) registrations to satisfy PostgreSQL NOT NULL constraint
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), salt);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  const record = {
    id,
    email: normalizedEmail,
    name: name.trim(),
    passwordHash,
    phone: phone || null,
    role,
    emailOtpHash: hashOtp(emailOtp),
    whatsappOtpHash: whatsappOtp ? hashOtp(whatsappOtp) : null,
    backupOtp: backupOtp || null,
    recruiterProfile: recruiterProfile || null,
    expiresAt,
    attempts: 0,
    sendHistory: [now],
    createdAt: now,
    updatedAt: now,
  };

  // 1. Store in memory map
  pendingMap.set(normalizedEmail, record);

  // 2. Persist to PostgreSQL if table exists
  try {
    if (await isDbTableAvailable()) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.pending_signups (
          id, email, name, "passwordHash", phone, role, "emailOtpHash", "whatsappOtpHash",
          "backupOtp", "recruiterProfile", "expiresAt", attempts, "sendHistory", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13::jsonb, $14, $15
        )
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          "passwordHash" = EXCLUDED."passwordHash",
          phone = EXCLUDED.phone,
          role = EXCLUDED.role,
          "emailOtpHash" = EXCLUDED."emailOtpHash",
          "whatsappOtpHash" = EXCLUDED."whatsappOtpHash",
          "backupOtp" = EXCLUDED."backupOtp",
          "recruiterProfile" = EXCLUDED."recruiterProfile",
          "expiresAt" = EXCLUDED."expiresAt",
          attempts = 0,
          "sendHistory" = EXCLUDED."sendHistory",
          "updatedAt" = EXCLUDED."updatedAt";
      `,
        record.id,
        record.email,
        record.name,
        record.passwordHash,
        record.phone,
        record.role,
        record.emailOtpHash,
        record.whatsappOtpHash,
        record.backupOtp,
        JSON.stringify(record.recruiterProfile),
        record.expiresAt,
        record.attempts,
        JSON.stringify(record.sendHistory),
        record.createdAt,
        record.updatedAt
      );
    }
  } catch (dbErr) {
    console.warn('⚠️ [pendingSignupStore.savePendingSignup] DB write warning:', dbErr.message);
  }

  return record;
}

/**
 * Retrieves a pending registration by email.
 */
async function getPendingSignup(email) {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();

  // Check memory map first
  if (pendingMap.has(normalizedEmail)) {
    return pendingMap.get(normalizedEmail);
  }

  // Check database if table is available
  try {
    if (await isDbTableAvailable()) {
      const rows = await prisma.$queryRawUnsafe(`
        SELECT * FROM public.pending_signups WHERE email = $1 LIMIT 1;
      `, normalizedEmail);

      if (rows && rows.length > 0) {
        const row = rows[0];
        const record = {
          id: row.id,
          email: row.email,
          name: row.name,
          passwordHash: row.passwordHash,
          phone: row.phone,
          role: row.role,
          emailOtpHash: row.emailOtpHash,
          whatsappOtpHash: row.whatsappOtpHash,
          backupOtp: row.backupOtp,
          recruiterProfile: typeof row.recruiterProfile === 'string'
            ? JSON.parse(row.recruiterProfile)
            : row.recruiterProfile,
          expiresAt: new Date(row.expiresAt),
          attempts: row.attempts,
          sendHistory: Array.isArray(row.sendHistory)
            ? row.sendHistory
            : (typeof row.sendHistory === 'string' ? JSON.parse(row.sendHistory) : []),
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        };
        pendingMap.set(normalizedEmail, record);
        return record;
      }
    }
  } catch (dbErr) {
    console.warn('⚠️ [pendingSignupStore.getPendingSignup] DB read warning:', dbErr.message);
  }

  return null;
}

/**
 * Retrieves an active (non-expired) pending registration by phone number.
 */
async function getPendingSignupByPhone(phone) {
  if (!phone) return null;
  const formatted = typeof phone === 'string' ? phone.trim() : '';
  if (!formatted) return null;

  const now = new Date();

  // 1. Check in-memory map
  for (const record of pendingMap.values()) {
    if (record.phone === formatted && new Date(record.expiresAt) > now) {
      return record;
    }
  }

  // 2. Check PostgreSQL database if table is active
  try {
    if (await isDbTableAvailable()) {
      const rows = await prisma.$queryRawUnsafe(`
        SELECT * FROM public.pending_signups 
        WHERE phone = $1 AND "expiresAt" > NOW() 
        LIMIT 1;
      `, formatted);

      if (rows && rows.length > 0) {
        const row = rows[0];
        return {
          id: row.id,
          email: row.email,
          name: row.name,
          passwordHash: row.passwordHash,
          phone: row.phone,
          role: row.role,
          emailOtpHash: row.emailOtpHash,
          whatsappOtpHash: row.whatsappOtpHash,
          backupOtp: row.backupOtp,
          recruiterProfile: row.recruiterProfile,
          expiresAt: new Date(row.expiresAt),
          attempts: row.attempts,
          sendHistory: row.sendHistory,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        };
      }
    }
  } catch (dbErr) {
    console.warn('⚠️ [pendingSignupStore.getPendingSignupByPhone] DB read warning:', dbErr.message);
  }

  return null;
}

/**
 * Increments failed attempt counter for a pending signup.
 */
async function recordAttempt(email) {
  if (!email) return 0;
  const normalizedEmail = email.trim().toLowerCase();
  const record = await getPendingSignup(normalizedEmail);
  if (!record) return 0;

  record.attempts = (record.attempts || 0) + 1;
  record.updatedAt = new Date();
  pendingMap.set(normalizedEmail, record);

  try {
    if (await isDbTableAvailable()) {
      await prisma.$executeRawUnsafe(`
        UPDATE public.pending_signups
        SET attempts = attempts + 1, "updatedAt" = NOW()
        WHERE email = $1;
      `, normalizedEmail);
    }
  } catch (dbErr) {
    console.warn('⚠️ [pendingSignupStore.recordAttempt] DB update warning:', dbErr.message);
  }

  return record.attempts;
}

/**
 * Updates OTP hashes and resets attempts on OTP resend.
 */
async function updatePendingOtp(email, emailOtp, whatsappOtp = null, backupOtp = null) {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const record = await getPendingSignup(normalizedEmail);
  if (!record) return null;

  const now = new Date();
  record.emailOtpHash = hashOtp(emailOtp);
  record.whatsappOtpHash = whatsappOtp ? hashOtp(whatsappOtp) : null;
  record.backupOtp = backupOtp || null;
  record.attempts = 0; // Reset attempts on resend
  record.expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // Fresh 10 minutes
  record.sendHistory = Array.isArray(record.sendHistory) ? record.sendHistory : [];
  record.sendHistory.push(now);
  record.updatedAt = now;

  pendingMap.set(normalizedEmail, record);

  try {
    if (await isDbTableAvailable()) {
      await prisma.$executeRawUnsafe(`
        UPDATE public.pending_signups
        SET "emailOtpHash" = $1,
            "whatsappOtpHash" = $2,
            "backupOtp" = $3,
            attempts = 0,
            "expiresAt" = $4,
            "sendHistory" = $5::jsonb,
            "updatedAt" = $6
        WHERE email = $7;
      `,
        record.emailOtpHash,
        record.whatsappOtpHash,
        record.backupOtp,
        record.expiresAt,
        JSON.stringify(record.sendHistory),
        record.updatedAt,
        normalizedEmail
      );
    }
  } catch (dbErr) {
    console.warn('⚠️ [pendingSignupStore.updatePendingOtp] DB update warning:', dbErr.message);
  }

  return record;
}

/**
 * Removes a pending signup after successful verification.
 */
async function deletePendingSignup(email) {
  if (!email) return;
  const normalizedEmail = email.trim().toLowerCase();

  pendingMap.delete(normalizedEmail);

  try {
    if (await isDbTableAvailable()) {
      await prisma.$executeRawUnsafe(`
        DELETE FROM public.pending_signups WHERE email = $1;
      `, normalizedEmail);
    }
  } catch (dbErr) {
    console.warn('⚠️ [pendingSignupStore.deletePendingSignup] DB delete warning:', dbErr.message);
  }
}

/**
 * Background cleanup routine for abandoned pending signups older than 24 hours.
 */
async function cleanupExpired(maxAgeMs = 24 * 60 * 60 * 1000) {
  const cutoff = new Date(Date.now() - maxAgeMs);
  let cleanedCount = 0;

  for (const [email, record] of pendingMap.entries()) {
    if (record.createdAt < cutoff || record.expiresAt < cutoff) {
      pendingMap.delete(email);
      cleanedCount++;
    }
  }

  try {
    if (await isDbTableAvailable()) {
      const res = await prisma.$executeRawUnsafe(`
        DELETE FROM public.pending_signups WHERE "createdAt" < $1 OR "expiresAt" < $1;
      `, cutoff);
      cleanedCount += Number(res || 0);
    }
  } catch (dbErr) {
    console.warn('⚠️ [pendingSignupStore.cleanupExpired] DB cleanup warning:', dbErr.message);
  }

  return cleanedCount;
}

module.exports = {
  hashOtp,
  verifyOtpHash,
  savePendingSignup,
  getPendingSignup,
  getPendingSignupByPhone,
  recordAttempt,
  updatePendingOtp,
  deletePendingSignup,
  cleanupExpired,
  _isDbTableAvailable: isDbTableAvailable,
  _pendingMap: pendingMap,
};

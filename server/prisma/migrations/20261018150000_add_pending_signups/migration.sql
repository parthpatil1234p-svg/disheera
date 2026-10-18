-- =========================================================================
-- Disheera Migration: Add pending_signups table
-- Moves unverified student and recruiter signups outside the public."User" table
-- Ensures public."User" contains ONLY fully verified user accounts.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.pending_signups (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    "emailOtpHash" TEXT NOT NULL,
    "whatsappOtpHash" TEXT,
    "backupOtp" TEXT,
    "recruiterProfile" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    "sendHistory" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid lookup during OTP submission & 24h cleanup
CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON public.pending_signups(email);
CREATE INDEX IF NOT EXISTS idx_pending_signups_expires_at ON public.pending_signups("expiresAt");

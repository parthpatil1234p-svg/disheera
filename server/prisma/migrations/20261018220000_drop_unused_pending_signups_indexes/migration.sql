-- ============================================================
-- Disheera — Supabase PostgreSQL Unused Index Cleanup Migration
-- Enterprise Architecture · Disheera Technologies Inc.
-- Resolves Supabase Database Linter Warning: unused_index (0005)
-- Drops redundant/unscanned indexes on public.pending_signups:
--  1. idx_pending_signups_email (redundant with UNIQUE index pending_signups_email_key)
--  2. idx_pending_signups_expires_at (unscanned index on ephemeral table)
-- ============================================================

-- 1. Drop redundant non-unique email index
DROP INDEX IF EXISTS public.idx_pending_signups_email;

-- 2. Drop unscanned expires_at index
DROP INDEX IF EXISTS public.idx_pending_signups_expires_at;

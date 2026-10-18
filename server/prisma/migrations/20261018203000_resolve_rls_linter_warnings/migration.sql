-- =========================================================================
-- Disheera Migration: Resolve Supabase Database Linter Warnings (0008_rls_enabled_no_policy)
-- 
-- Fixes tables with Row Level Security enabled but missing RLS policies:
--  1. public._prisma_migrations      (service_role full access, public blocked)
--  2. public.admin_audit_logs        (service_role full access, public blocked)
--  3. public.admin_login_attempts    (service_role full access, public blocked)
--  4. public.admin_sessions          (service_role full access, public blocked)
--  5. public.admin_users             (service_role full access, public blocked)
--  6. public.radar_employers         (anon/authenticated SELECT active, service_role ALL)
--  7. public.pending_signups         (service_role full access, public blocked)
--
-- Safe, idempotent, and non-destructive.
-- =========================================================================

-- ── 1. _prisma_migrations (Internal Schema History) ───────────────────────
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "service_role_full_access__prisma_migrations" ON public."_prisma_migrations";
    CREATE POLICY "service_role_full_access__prisma_migrations"
      ON public."_prisma_migrations"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- ── 2. admin_audit_logs (Administrative Audit Trail) ──────────────────────
DO $$
BEGIN
  IF to_regclass('public.admin_audit_logs') IS NOT NULL THEN
    ALTER TABLE public."admin_audit_logs" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "service_role_full_access_admin_audit_logs" ON public."admin_audit_logs";
    CREATE POLICY "service_role_full_access_admin_audit_logs"
      ON public."admin_audit_logs"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- ── 3. admin_login_attempts (Brute-Force Rate Limiting) ───────────────────
DO $$
BEGIN
  IF to_regclass('public.admin_login_attempts') IS NOT NULL THEN
    ALTER TABLE public."admin_login_attempts" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "service_role_full_access_admin_login_attempts" ON public."admin_login_attempts";
    CREATE POLICY "service_role_full_access_admin_login_attempts"
      ON public."admin_login_attempts"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- ── 4. admin_sessions (Administrative Active Sessions) ────────────────────
DO $$
BEGIN
  IF to_regclass('public.admin_sessions') IS NOT NULL THEN
    ALTER TABLE public."admin_sessions" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "service_role_full_access_admin_sessions" ON public."admin_sessions";
    CREATE POLICY "service_role_full_access_admin_sessions"
      ON public."admin_sessions"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- ── 5. admin_users (Personnel Credentials & RBAC Roles) ───────────────────
DO $$
BEGIN
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    ALTER TABLE public."admin_users" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "service_role_full_access_admin_users" ON public."admin_users";
    CREATE POLICY "service_role_full_access_admin_users"
      ON public."admin_users"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- ── 6. radar_employers (Industrial Proximity Radar Hubs) ──────────────────
DO $$
BEGIN
  IF to_regclass('public.radar_employers') IS NOT NULL THEN
    ALTER TABLE public."radar_employers" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access on radar_employers" ON public."radar_employers";
    CREATE POLICY "Allow public read access on radar_employers"
      ON public."radar_employers"
      FOR SELECT
      TO anon, authenticated
      USING ("isActive" = true);

    DROP POLICY IF EXISTS "Allow service_role full management on radar_employers" ON public."radar_employers";
    CREATE POLICY "Allow service_role full management on radar_employers"
      ON public."radar_employers"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- ── 7. pending_signups (Pending Unverified Registration Store) ────────────
DO $$
BEGIN
  IF to_regclass('public.pending_signups') IS NOT NULL THEN
    ALTER TABLE public."pending_signups" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "service_role_full_access_pending_signups" ON public."pending_signups";
    CREATE POLICY "service_role_full_access_pending_signups"
      ON public."pending_signups"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

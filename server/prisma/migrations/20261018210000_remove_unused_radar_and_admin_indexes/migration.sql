-- ============================================================
-- Disheera — Supabase PostgreSQL Unused Index Cleanup Migration
-- Enterprise Architecture · Disheera Technologies Inc.
-- Resolves Supabase Database Linter Warning: unused_index (0005)
-- Drops 6 unscanned non-unique indexes on radar_employers and
-- admin_login_attempts to reduce disk overhead and eliminate write amplification.
-- ============================================================

-- 1. radar_employers: Drop unused city index (table scanned sequentially in memory)
DROP INDEX IF EXISTS public."radar_employers_city_idx";

-- 2. radar_employers: Drop unused isActive boolean index (low-cardinality boolean)
DROP INDEX IF EXISTS public."radar_employers_isActive_idx";

-- 3. radar_employers: Drop unused cluster index
DROP INDEX IF EXISTS public."radar_employers_cluster_idx";

-- 4. radar_employers: Drop unused clusterGroup index
DROP INDEX IF EXISTS public."radar_employers_clusterGroup_idx";

-- 5. admin_login_attempts: Drop unused standalone ipAddress index
DROP INDEX IF EXISTS public."admin_login_attempts_ipAddress_idx";

-- 6. admin_login_attempts: Drop unused standalone attemptedAt index
DROP INDEX IF EXISTS public."admin_login_attempts_attemptedAt_idx";

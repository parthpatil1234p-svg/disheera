-- ============================================================
-- Disheera — Index Roadmap Foreign Key (careerId) Migration
-- Enterprise Architecture · Disheera Technologies Inc.
-- Resolves Supabase Database Linter Warning: unindexed_foreign_keys (0001)
-- Provides covering B-tree index for Roadmap_careerId_fkey constraint
-- preventing sequential table scans and table locks during Career cascades.
-- ============================================================

CREATE INDEX IF NOT EXISTS "Roadmap_careerId_idx" ON public."Roadmap" ("careerId");

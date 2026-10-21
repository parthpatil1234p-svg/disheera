-- =========================================================================
-- Disheera Migration: Index Assignment Submissions Foreign Key (assignmentId)
-- Enterprise Architecture · Disheera Technologies Inc.
-- 
-- Resolves Supabase Database Linter Warning: unindexed_foreign_keys (0001)
-- Provides covering B-tree index for assignment_submissions_assignmentId_fkey constraint
-- preventing sequential table scans and table locks during weekly_assignments cascades.
-- =========================================================================

CREATE INDEX IF NOT EXISTS "assignment_submissions_assignmentId_idx" 
ON public."assignment_submissions" ("assignmentId");

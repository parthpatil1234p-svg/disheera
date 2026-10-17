-- ============================================================
-- Disheera — Secure CampusLead RLS Insert Policy
-- Enterprise Architecture · Disheera Technologies Inc.
-- Resolves Supabase Database Linter Warning: rls_policy_always_true (0024)
-- Enforces domain validation on anonymous and authenticated inserts:
-- 1. status must strictly be 'new'
-- 2. collegeName, contactPerson, and phone must be non-empty
-- 3. email must be valid format containing '@' with minimum length
-- ============================================================

DROP POLICY IF EXISTS "Allow anonymous and authenticated insert on CampusLead" ON public."CampusLead";

CREATE POLICY "Allow anonymous and authenticated insert on CampusLead"
ON public."CampusLead"
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND length(trim("collegeName")) > 0
  AND length(trim("contactPerson")) > 0
  AND length(trim(email)) > 3
  AND position('@' in email) > 1
  AND length(trim(phone)) > 0
);

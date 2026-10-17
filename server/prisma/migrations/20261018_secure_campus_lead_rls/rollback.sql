-- ============================================================
-- Disheera — Rollback Script for Secure CampusLead RLS Migration
-- Reverts policy to permissive WITH CHECK (true)
-- ============================================================

DROP POLICY IF EXISTS "Allow anonymous and authenticated insert on CampusLead" ON public."CampusLead";

CREATE POLICY "Allow anonymous and authenticated insert on CampusLead"
ON public."CampusLead"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

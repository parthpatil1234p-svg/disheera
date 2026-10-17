-- ============================================================
-- Disheera — Optimize RLS InitPlan & Deduplicate Permissive Policies
-- Enterprise Architecture · Disheera Technologies Inc.
-- Resolves Supabase Database Linter Warnings:
-- 1. auth_rls_initplan (0003): Wraps auth.uid() in (select auth.uid())
--    to prevent per-row re-evaluation and enable query InitPlan caching.
-- 2. multiple_permissive_policies (0006): Removes redundant duplicate
--    SELECT policies on Roadmap, RoadmapTask, Resume, and JobOpening.
-- ============================================================

-- ── 1. JobOpening Table ───────────────────────────────────────
DROP POLICY IF EXISTS "Allow public read access on JobOpening" ON public."JobOpening";
DROP POLICY IF EXISTS "Allow recruiters to manage own JobOpening" ON public."JobOpening";
DROP POLICY IF EXISTS "Allow read access on JobOpening" ON public."JobOpening";
DROP POLICY IF EXISTS "Allow recruiters to insert own JobOpening" ON public."JobOpening";
DROP POLICY IF EXISTS "Allow recruiters to update own JobOpening" ON public."JobOpening";
DROP POLICY IF EXISTS "Allow recruiters to delete own JobOpening" ON public."JobOpening";

-- Single unified SELECT policy for both anon and authenticated
CREATE POLICY "Allow read access on JobOpening"
ON public."JobOpening"
FOR SELECT
TO anon, authenticated
USING (
  status = 'active'
  OR ((select auth.uid())::text) = "recruiterId"
);

-- Recruiter write operations
CREATE POLICY "Allow recruiters to insert own JobOpening"
ON public."JobOpening"
FOR INSERT
TO authenticated
WITH CHECK (((select auth.uid())::text) = "recruiterId");

CREATE POLICY "Allow recruiters to update own JobOpening"
ON public."JobOpening"
FOR UPDATE
TO authenticated
USING (((select auth.uid())::text) = "recruiterId")
WITH CHECK (((select auth.uid())::text) = "recruiterId");

CREATE POLICY "Allow recruiters to delete own JobOpening"
ON public."JobOpening"
FOR DELETE
TO authenticated
USING (((select auth.uid())::text) = "recruiterId");


-- ── 2. Resume Table ───────────────────────────────────────────
DROP POLICY IF EXISTS "Allow users to read own Resume" ON public."Resume";
DROP POLICY IF EXISTS "Allow users to manage own Resume" ON public."Resume";

-- Single FOR ALL policy covering SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Allow users to manage own Resume"
ON public."Resume"
FOR ALL
TO authenticated
USING (((select auth.uid())::text) = "userId")
WITH CHECK (((select auth.uid())::text) = "userId");


-- ── 3. Roadmap Table ──────────────────────────────────────────
DROP POLICY IF EXISTS "Allow users to read own Roadmap" ON public."Roadmap";
DROP POLICY IF EXISTS "Allow users to manage own Roadmap" ON public."Roadmap";

-- Single FOR ALL policy covering SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Allow users to manage own Roadmap"
ON public."Roadmap"
FOR ALL
TO authenticated
USING (((select auth.uid())::text) = "userId")
WITH CHECK (((select auth.uid())::text) = "userId");


-- ── 4. RoadmapTask Table ──────────────────────────────────────
DROP POLICY IF EXISTS "Allow users to read own RoadmapTask" ON public."RoadmapTask";
DROP POLICY IF EXISTS "Allow users to manage own RoadmapTask" ON public."RoadmapTask";

-- Single FOR ALL policy covering SELECT, INSERT, UPDATE, DELETE via parent Roadmap ownership
CREATE POLICY "Allow users to manage own RoadmapTask"
ON public."RoadmapTask"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."Roadmap" r
    WHERE r.id = public."RoadmapTask"."roadmapId"
      AND r."userId" = ((select auth.uid())::text)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Roadmap" r
    WHERE r.id = public."RoadmapTask"."roadmapId"
      AND r."userId" = ((select auth.uid())::text)
  )
);


-- ── 5. User Table ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow users to read own profile on User" ON public."User";
CREATE POLICY "Allow users to read own profile on User"
ON public."User"
FOR SELECT
TO authenticated
USING (((select auth.uid())::text) = id);

DROP POLICY IF EXISTS "Allow users to update own profile on User" ON public."User";
CREATE POLICY "Allow users to update own profile on User"
ON public."User"
FOR UPDATE
TO authenticated
USING (((select auth.uid())::text) = id)
WITH CHECK (((select auth.uid())::text) = id);


-- ── 6. Attempt Table ──────────────────────────────────────────
DROP POLICY IF EXISTS "Allow users to read own Attempt" ON public."Attempt";
CREATE POLICY "Allow users to read own Attempt"
ON public."Attempt"
FOR SELECT
TO authenticated
USING (((select auth.uid())::text) = "userId");

DROP POLICY IF EXISTS "Allow users to insert own Attempt" ON public."Attempt";
CREATE POLICY "Allow users to insert own Attempt"
ON public."Attempt"
FOR INSERT
TO authenticated
WITH CHECK (((select auth.uid())::text) = "userId");

DROP POLICY IF EXISTS "Allow users to update own Attempt" ON public."Attempt";
CREATE POLICY "Allow users to update own Attempt"
ON public."Attempt"
FOR UPDATE
TO authenticated
USING (((select auth.uid())::text) = "userId")
WITH CHECK (((select auth.uid())::text) = "userId");


-- ── 7. JobApplication Table ───────────────────────────────────
DROP POLICY IF EXISTS "Allow participants to read JobApplication" ON public."JobApplication";
CREATE POLICY "Allow participants to read JobApplication"
ON public."JobApplication"
FOR SELECT
TO authenticated
USING (
  ((select auth.uid())::text) = "studentId" 
  OR ((select auth.uid())::text) = "recruiterId"
);

DROP POLICY IF EXISTS "Allow students to insert JobApplication" ON public."JobApplication";
CREATE POLICY "Allow students to insert JobApplication"
ON public."JobApplication"
FOR INSERT
TO authenticated
WITH CHECK (((select auth.uid())::text) = "studentId");

DROP POLICY IF EXISTS "Allow participants to update JobApplication" ON public."JobApplication";
CREATE POLICY "Allow participants to update JobApplication"
ON public."JobApplication"
FOR UPDATE
TO authenticated
USING (
  ((select auth.uid())::text) = "studentId" 
  OR ((select auth.uid())::text) = "recruiterId"
)
WITH CHECK (
  ((select auth.uid())::text) = "studentId" 
  OR ((select auth.uid())::text) = "recruiterId"
);

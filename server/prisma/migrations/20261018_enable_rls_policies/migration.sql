-- ============================================================
-- Disheera — Supabase PostgreSQL Row Level Security (RLS) Policies
-- Enterprise Architecture · Disheera Technologies Inc.
-- Resolves Supabase Database Linter Warning: rls_enabled_no_policy (0008)
-- ============================================================

-- ── 1. Skill Table (Public Catalog) ─────────────────────────
ALTER TABLE public."Skill" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on Skill" ON public."Skill";
CREATE POLICY "Allow public read access on Skill"
ON public."Skill"
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow service_role full management on Skill" ON public."Skill";
CREATE POLICY "Allow service_role full management on Skill"
ON public."Skill"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ── 2. Career Table (Public Catalog) ────────────────────────
ALTER TABLE public."Career" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on Career" ON public."Career";
CREATE POLICY "Allow public read access on Career"
ON public."Career"
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow service_role full management on Career" ON public."Career";
CREATE POLICY "Allow service_role full management on Career"
ON public."Career"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ── 3. Company Table (Public Directory) ─────────────────────
ALTER TABLE public."Company" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on Company" ON public."Company";
CREATE POLICY "Allow public read access on Company"
ON public."Company"
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow service_role full management on Company" ON public."Company";
CREATE POLICY "Allow service_role full management on Company"
ON public."Company"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ── 4. JobOpening Table (Public Active / Recruiter Managed) ───
ALTER TABLE public."JobOpening" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on JobOpening" ON public."JobOpening";
CREATE POLICY "Allow public read access on JobOpening"
ON public."JobOpening"
FOR SELECT
TO anon, authenticated
USING (status = 'active');

DROP POLICY IF EXISTS "Allow recruiters to manage own JobOpening" ON public."JobOpening";
CREATE POLICY "Allow recruiters to manage own JobOpening"
ON public."JobOpening"
FOR ALL
TO authenticated
USING (auth.uid()::text = "recruiterId")
WITH CHECK (auth.uid()::text = "recruiterId");

DROP POLICY IF EXISTS "Allow service_role full management on JobOpening" ON public."JobOpening";
CREATE POLICY "Allow service_role full management on JobOpening"
ON public."JobOpening"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ── 5. YoutubeCache Table (Educational Resource Registry) ───
ALTER TABLE public."YoutubeCache" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on YoutubeCache" ON public."YoutubeCache";
CREATE POLICY "Allow public read access on YoutubeCache"
ON public."YoutubeCache"
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow service_role full management on YoutubeCache" ON public."YoutubeCache";
CREATE POLICY "Allow service_role full management on YoutubeCache"
ON public."YoutubeCache"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ── 6. CampusLead Table (Institutional Inquiry Forms) ────────
ALTER TABLE public."CampusLead" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous and authenticated insert on CampusLead" ON public."CampusLead";
CREATE POLICY "Allow anonymous and authenticated insert on CampusLead"
ON public."CampusLead"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role full management on CampusLead" ON public."CampusLead";
CREATE POLICY "Allow service_role full management on CampusLead"
ON public."CampusLead"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ── 7. User Table (Self-Access / Service Role) ───────────────
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own profile on User" ON public."User";
CREATE POLICY "Allow users to read own profile on User"
ON public."User"
FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Allow users to update own profile on User" ON public."User";
CREATE POLICY "Allow users to update own profile on User"
ON public."User"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

DROP POLICY IF EXISTS "Allow service_role full management on User" ON public."User";
CREATE POLICY "Allow service_role full management on User"
ON public."User"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ── 8. Roadmap Table (Self-Access / Service Role) ────────────
ALTER TABLE public."Roadmap" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own Roadmap" ON public."Roadmap";
CREATE POLICY "Allow users to read own Roadmap"
ON public."Roadmap"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Allow users to manage own Roadmap" ON public."Roadmap";
CREATE POLICY "Allow users to manage own Roadmap"
ON public."Roadmap"
FOR ALL
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Allow service_role full management on Roadmap" ON public."Roadmap";
CREATE POLICY "Allow service_role full management on Roadmap"
ON public."Roadmap"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ── 9. RoadmapTask Table (Task Ownership via Roadmap) ───────
ALTER TABLE public."RoadmapTask" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own RoadmapTask" ON public."RoadmapTask";
CREATE POLICY "Allow users to read own RoadmapTask"
ON public."RoadmapTask"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."Roadmap" r
    WHERE r.id = public."RoadmapTask"."roadmapId"
      AND r."userId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Allow users to manage own RoadmapTask" ON public."RoadmapTask";
CREATE POLICY "Allow users to manage own RoadmapTask"
ON public."RoadmapTask"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public."Roadmap" r
    WHERE r.id = public."RoadmapTask"."roadmapId"
      AND r."userId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Roadmap" r
    WHERE r.id = public."RoadmapTask"."roadmapId"
      AND r."userId" = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Allow service_role full management on RoadmapTask" ON public."RoadmapTask";
CREATE POLICY "Allow service_role full management on RoadmapTask"
ON public."RoadmapTask"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ── 10. Attempt Table (Assessment Records) ───────────────────
ALTER TABLE public."Attempt" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own Attempt" ON public."Attempt";
CREATE POLICY "Allow users to read own Attempt"
ON public."Attempt"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Allow users to insert own Attempt" ON public."Attempt";
CREATE POLICY "Allow users to insert own Attempt"
ON public."Attempt"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Allow users to update own Attempt" ON public."Attempt";
CREATE POLICY "Allow users to update own Attempt"
ON public."Attempt"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Allow service_role full management on Attempt" ON public."Attempt";
CREATE POLICY "Allow service_role full management on Attempt"
ON public."Attempt"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ── 11. Resume Table (Resume Storage) ────────────────────────
ALTER TABLE public."Resume" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read own Resume" ON public."Resume";
CREATE POLICY "Allow users to read own Resume"
ON public."Resume"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Allow users to manage own Resume" ON public."Resume";
CREATE POLICY "Allow users to manage own Resume"
ON public."Resume"
FOR ALL
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Allow service_role full management on Resume" ON public."Resume";
CREATE POLICY "Allow service_role full management on Resume"
ON public."Resume"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ── 12. JobApplication Table (Participant Access) ────────────
ALTER TABLE public."JobApplication" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow participants to read JobApplication" ON public."JobApplication";
CREATE POLICY "Allow participants to read JobApplication"
ON public."JobApplication"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "studentId" OR auth.uid()::text = "recruiterId");

DROP POLICY IF EXISTS "Allow students to insert JobApplication" ON public."JobApplication";
CREATE POLICY "Allow students to insert JobApplication"
ON public."JobApplication"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "studentId");

DROP POLICY IF EXISTS "Allow participants to update JobApplication" ON public."JobApplication";
CREATE POLICY "Allow participants to update JobApplication"
ON public."JobApplication"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "studentId" OR auth.uid()::text = "recruiterId")
WITH CHECK (auth.uid()::text = "studentId" OR auth.uid()::text = "recruiterId");

DROP POLICY IF EXISTS "Allow service_role full management on JobApplication" ON public."JobApplication";
CREATE POLICY "Allow service_role full management on JobApplication"
ON public."JobApplication"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- Disheera — Rollback Script for RLS InitPlan & Deduplicate Migration
-- ============================================================

-- 1. JobOpening
DROP POLICY IF EXISTS "Allow read access on JobOpening" ON public."JobOpening";
DROP POLICY IF EXISTS "Allow recruiters to insert own JobOpening" ON public."JobOpening";
DROP POLICY IF EXISTS "Allow recruiters to update own JobOpening" ON public."JobOpening";
DROP POLICY IF EXISTS "Allow recruiters to delete own JobOpening" ON public."JobOpening";

CREATE POLICY "Allow public read access on JobOpening" ON public."JobOpening" FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Allow recruiters to manage own JobOpening" ON public."JobOpening" FOR ALL TO authenticated USING (auth.uid()::text = "recruiterId") WITH CHECK (auth.uid()::text = "recruiterId");

-- 2. Resume
DROP POLICY IF EXISTS "Allow users to manage own Resume" ON public."Resume";
CREATE POLICY "Allow users to read own Resume" ON public."Resume" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");
CREATE POLICY "Allow users to manage own Resume" ON public."Resume" FOR ALL TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

-- 3. Roadmap
DROP POLICY IF EXISTS "Allow users to manage own Roadmap" ON public."Roadmap";
CREATE POLICY "Allow users to read own Roadmap" ON public."Roadmap" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");
CREATE POLICY "Allow users to manage own Roadmap" ON public."Roadmap" FOR ALL TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

-- 4. RoadmapTask
DROP POLICY IF EXISTS "Allow users to manage own RoadmapTask" ON public."RoadmapTask";
CREATE POLICY "Allow users to read own RoadmapTask" ON public."RoadmapTask" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public."Roadmap" r WHERE r.id = public."RoadmapTask"."roadmapId" AND r."userId" = auth.uid()::text));
CREATE POLICY "Allow users to manage own RoadmapTask" ON public."RoadmapTask" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public."Roadmap" r WHERE r.id = public."RoadmapTask"."roadmapId" AND r."userId" = auth.uid()::text)) WITH CHECK (EXISTS (SELECT 1 FROM public."Roadmap" r WHERE r.id = public."RoadmapTask"."roadmapId" AND r."userId" = auth.uid()::text));

-- 5. User
DROP POLICY IF EXISTS "Allow users to read own profile on User" ON public."User";
DROP POLICY IF EXISTS "Allow users to update own profile on User" ON public."User";
CREATE POLICY "Allow users to read own profile on User" ON public."User" FOR SELECT TO authenticated USING (auth.uid()::text = id);
CREATE POLICY "Allow users to update own profile on User" ON public."User" FOR UPDATE TO authenticated USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);

-- 6. Attempt
DROP POLICY IF EXISTS "Allow users to read own Attempt" ON public."Attempt";
DROP POLICY IF EXISTS "Allow users to insert own Attempt" ON public."Attempt";
DROP POLICY IF EXISTS "Allow users to update own Attempt" ON public."Attempt";
CREATE POLICY "Allow users to read own Attempt" ON public."Attempt" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");
CREATE POLICY "Allow users to insert own Attempt" ON public."Attempt" FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Allow users to update own Attempt" ON public."Attempt" FOR UPDATE TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

-- 7. JobApplication
DROP POLICY IF EXISTS "Allow participants to read JobApplication" ON public."JobApplication";
DROP POLICY IF EXISTS "Allow students to insert JobApplication" ON public."JobApplication";
DROP POLICY IF EXISTS "Allow participants to update JobApplication" ON public."JobApplication";
CREATE POLICY "Allow participants to read JobApplication" ON public."JobApplication" FOR SELECT TO authenticated USING (auth.uid()::text = "studentId" OR auth.uid()::text = "recruiterId");
CREATE POLICY "Allow students to insert JobApplication" ON public."JobApplication" FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = "studentId");
CREATE POLICY "Allow participants to update JobApplication" ON public."JobApplication" FOR UPDATE TO authenticated USING (auth.uid()::text = "studentId" OR auth.uid()::text = "recruiterId") WITH CHECK (auth.uid()::text = "studentId" OR auth.uid()::text = "recruiterId");

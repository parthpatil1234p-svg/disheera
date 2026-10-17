-- ============================================================
-- Disheera — Rollback Script for RLS Policies Migration
-- Enterprise Architecture · Disheera Technologies Inc.
-- Drops all custom RLS policies added in 20261018_enable_rls_policies
-- ============================================================

-- 1. Skill
DROP POLICY IF EXISTS "Allow public read access on Skill" ON public."Skill";
DROP POLICY IF EXISTS "Allow service_role full management on Skill" ON public."Skill";

-- 2. Career
DROP POLICY IF EXISTS "Allow public read access on Career" ON public."Career";
DROP POLICY IF EXISTS "Allow service_role full management on Career" ON public."Career";

-- 3. Company
DROP POLICY IF EXISTS "Allow public read access on Company" ON public."Company";
DROP POLICY IF EXISTS "Allow service_role full management on Company" ON public."Company";

-- 4. JobOpening
DROP POLICY IF EXISTS "Allow public read access on JobOpening" ON public."JobOpening";
DROP POLICY IF EXISTS "Allow recruiters to manage own JobOpening" ON public."JobOpening";
DROP POLICY IF EXISTS "Allow service_role full management on JobOpening" ON public."JobOpening";

-- 5. YoutubeCache
DROP POLICY IF EXISTS "Allow public read access on YoutubeCache" ON public."YoutubeCache";
DROP POLICY IF EXISTS "Allow service_role full management on YoutubeCache" ON public."YoutubeCache";

-- 6. CampusLead
DROP POLICY IF EXISTS "Allow anonymous and authenticated insert on CampusLead" ON public."CampusLead";
DROP POLICY IF EXISTS "Allow service_role full management on CampusLead" ON public."CampusLead";

-- 7. User
DROP POLICY IF EXISTS "Allow users to read own profile on User" ON public."User";
DROP POLICY IF EXISTS "Allow users to update own profile on User" ON public."User";
DROP POLICY IF EXISTS "Allow service_role full management on User" ON public."User";

-- 8. Roadmap
DROP POLICY IF EXISTS "Allow users to read own Roadmap" ON public."Roadmap";
DROP POLICY IF EXISTS "Allow users to manage own Roadmap" ON public."Roadmap";
DROP POLICY IF EXISTS "Allow service_role full management on Roadmap" ON public."Roadmap";

-- 9. RoadmapTask
DROP POLICY IF EXISTS "Allow users to read own RoadmapTask" ON public."RoadmapTask";
DROP POLICY IF EXISTS "Allow users to manage own RoadmapTask" ON public."RoadmapTask";
DROP POLICY IF EXISTS "Allow service_role full management on RoadmapTask" ON public."RoadmapTask";

-- 10. Attempt
DROP POLICY IF EXISTS "Allow users to read own Attempt" ON public."Attempt";
DROP POLICY IF EXISTS "Allow users to insert own Attempt" ON public."Attempt";
DROP POLICY IF EXISTS "Allow users to update own Attempt" ON public."Attempt";
DROP POLICY IF EXISTS "Allow service_role full management on Attempt" ON public."Attempt";

-- 11. Resume
DROP POLICY IF EXISTS "Allow users to read own Resume" ON public."Resume";
DROP POLICY IF EXISTS "Allow users to manage own Resume" ON public."Resume";
DROP POLICY IF EXISTS "Allow service_role full management on Resume" ON public."Resume";

-- 12. JobApplication
DROP POLICY IF EXISTS "Allow participants to read JobApplication" ON public."JobApplication";
DROP POLICY IF EXISTS "Allow students to insert JobApplication" ON public."JobApplication";
DROP POLICY IF EXISTS "Allow participants to update JobApplication" ON public."JobApplication";
DROP POLICY IF EXISTS "Allow service_role full management on JobApplication" ON public."JobApplication";

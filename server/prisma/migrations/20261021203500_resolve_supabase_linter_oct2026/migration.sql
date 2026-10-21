-- =========================================================================
-- Disheera Migration: Resolve Supabase Database Linter Warnings (October 2026)
-- 
-- 1. Unused Index Removals (0005_unused_index):
--    - public.weekly_assignments_careerId_idx
--      (Redundant: weekly_assignments_careerId_weekNumber_key already leads with careerId)
--    - public.assignment_submissions_assignmentId_idx
--      (Unused: submissions are filtered by userId or (userId, weekNumber))
--    - public.student_merit_scores_currentRank_idx
--      (Unused: ranks are dynamically sorted by totalMeritScore DESC)
--
-- 2. Row Level Security Policies (0008_rls_enabled_no_policy):
--    - public.weekly_assignments (anon/auth SELECT, service_role ALL)
--    - public.assignment_submissions (auth own submissions via (select auth.uid())::text, service_role ALL)
--    - public.student_merit_scores (anon/auth SELECT leaderboard, service_role ALL)
--    - public.internship_rewards (anon/auth SELECT active rewards, service_role ALL)
--
-- Complies with Supabase Performance & Security Best Practices:
-- - Uses (select auth.uid()) to avoid auth_rls_initplan (0003) re-evaluations.
-- - Uses unified policies to avoid multiple_permissive_policies (0006).
-- =========================================================================

-- ── 1. Drop Unused / Redundant Indexes ──────────────────────────────────────
DROP INDEX IF EXISTS public."weekly_assignments_careerId_idx";
DROP INDEX IF EXISTS public."assignment_submissions_assignmentId_idx";
DROP INDEX IF EXISTS public."student_merit_scores_currentRank_idx";


-- ── 2. Table: weekly_assignments ───────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.weekly_assignments') IS NOT NULL THEN
    ALTER TABLE public."weekly_assignments" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access on weekly_assignments" ON public."weekly_assignments";
    CREATE POLICY "Allow public read access on weekly_assignments"
      ON public."weekly_assignments"
      FOR SELECT
      TO anon, authenticated
      USING (true);

    DROP POLICY IF EXISTS "Allow service_role full management on weekly_assignments" ON public."weekly_assignments";
    CREATE POLICY "Allow service_role full management on weekly_assignments"
      ON public."weekly_assignments"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- ── 3. Table: assignment_submissions ───────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.assignment_submissions') IS NOT NULL THEN
    ALTER TABLE public."assignment_submissions" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow users to manage own assignment_submissions" ON public."assignment_submissions";
    CREATE POLICY "Allow users to manage own assignment_submissions"
      ON public."assignment_submissions"
      FOR ALL
      TO authenticated
      USING (((select auth.uid())::text) = "userId")
      WITH CHECK (((select auth.uid())::text) = "userId");

    DROP POLICY IF EXISTS "Allow service_role full management on assignment_submissions" ON public."assignment_submissions";
    CREATE POLICY "Allow service_role full management on assignment_submissions"
      ON public."assignment_submissions"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- ── 4. Table: student_merit_scores ─────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.student_merit_scores') IS NOT NULL THEN
    ALTER TABLE public."student_merit_scores" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access on student_merit_scores" ON public."student_merit_scores";
    CREATE POLICY "Allow public read access on student_merit_scores"
      ON public."student_merit_scores"
      FOR SELECT
      TO anon, authenticated
      USING (true);

    DROP POLICY IF EXISTS "Allow service_role full management on student_merit_scores" ON public."student_merit_scores";
    CREATE POLICY "Allow service_role full management on student_merit_scores"
      ON public."student_merit_scores"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- ── 5. Table: internship_rewards ───────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.internship_rewards') IS NOT NULL THEN
    ALTER TABLE public."internship_rewards" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access on internship_rewards" ON public."internship_rewards";
    CREATE POLICY "Allow public read access on internship_rewards"
      ON public."internship_rewards"
      FOR SELECT
      TO anon, authenticated
      USING ("isActive" = true);

    DROP POLICY IF EXISTS "Allow service_role full management on internship_rewards" ON public."internship_rewards";
    CREATE POLICY "Allow service_role full management on internship_rewards"
      ON public."internship_rewards"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

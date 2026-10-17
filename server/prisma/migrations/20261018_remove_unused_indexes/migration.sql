-- ============================================================
-- Disheera — Supabase PostgreSQL Unused Index Cleanup Migration
-- Enterprise Architecture · Disheera Technologies Inc.
-- Resolves Supabase Database Linter Warning: unused_index (0005)
-- Drops 13 redundant/unscanned non-unique indexes to reduce disk overhead
-- and eliminate write amplification on INSERT/UPDATE/DELETE.
-- ============================================================

-- 1. Roadmap: Drop unused careerId index (queries filter by userId or composite route)
DROP INDEX IF EXISTS public."Roadmap_careerId_idx";

-- 2. Career: Drop category index (table has only 24 rows, seq scan is optimal)
DROP INDEX IF EXISTS public."Career_category_idx";

-- 3. Attempt: Drop unused standalone skill index
DROP INDEX IF EXISTS public."Attempt_skill_idx";

-- 4. Company: Drop isVerified boolean index (low cardinality on ~10 rows)
DROP INDEX IF EXISTS public."Company_isVerified_idx";

-- 5. JobOpening: Drop careerSlug index
DROP INDEX IF EXISTS public."JobOpening_careerSlug_idx";

-- 6. JobApplication: Drop standalone jobId index (shadowed by unique jobId+studentId index)
DROP INDEX IF EXISTS public."JobApplication_jobId_idx";

-- 7. CampusLead: Drop unused email index
DROP INDEX IF EXISTS public."CampusLead_email_idx";

-- 8. CampusLead: Drop unused status index
DROP INDEX IF EXISTS public."CampusLead_status_idx";

-- 9. Skill: Drop subcategory index
DROP INDEX IF EXISTS public."Skill_subcategory_idx";

-- 10. Skill: Drop type index
DROP INDEX IF EXISTS public."Skill_type_idx";

-- 11. JobApplication: Drop composite student_created index (studentId index is actively used)
DROP INDEX IF EXISTS public."idx_jobapplication_student_created";

-- 12. JobApplication: Drop composite job_matchscore_created index
DROP INDEX IF EXISTS public."idx_jobapplication_job_matchscore_created";

-- 13. Skill: Drop composite active_category_displayname index (Skill_category_idx is actively used)
DROP INDEX IF EXISTS public."idx_skill_active_category_displayname";

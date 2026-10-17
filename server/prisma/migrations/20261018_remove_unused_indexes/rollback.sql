-- ============================================================
-- Disheera — Rollback Script for Unused Index Cleanup Migration
-- Enterprise Architecture · Disheera Technologies Inc.
-- Recreates the 13 indexes dropped in 20261018_remove_unused_indexes
-- ============================================================

-- 1. Roadmap: careerId index
CREATE INDEX IF NOT EXISTS "Roadmap_careerId_idx" ON public."Roadmap" USING btree ("careerId");

-- 2. Career: category index
CREATE INDEX IF NOT EXISTS "Career_category_idx" ON public."Career" USING btree (category);

-- 3. Attempt: skill index
CREATE INDEX IF NOT EXISTS "Attempt_skill_idx" ON public."Attempt" USING btree (skill);

-- 4. Company: isVerified index
CREATE INDEX IF NOT EXISTS "Company_isVerified_idx" ON public."Company" USING btree ("isVerified");

-- 5. JobOpening: careerSlug index
CREATE INDEX IF NOT EXISTS "JobOpening_careerSlug_idx" ON public."JobOpening" USING btree ("careerSlug");

-- 6. JobApplication: jobId index
CREATE INDEX IF NOT EXISTS "JobApplication_jobId_idx" ON public."JobApplication" USING btree ("jobId");

-- 7. CampusLead: email index
CREATE INDEX IF NOT EXISTS "CampusLead_email_idx" ON public."CampusLead" USING btree (email);

-- 8. CampusLead: status index
CREATE INDEX IF NOT EXISTS "CampusLead_status_idx" ON public."CampusLead" USING btree (status);

-- 9. Skill: subcategory index
CREATE INDEX IF NOT EXISTS "Skill_subcategory_idx" ON public."Skill" USING btree (subcategory);

-- 10. Skill: type index
CREATE INDEX IF NOT EXISTS "Skill_type_idx" ON public."Skill" USING btree (type);

-- 11. JobApplication: student_created composite index
CREATE INDEX IF NOT EXISTS idx_jobapplication_student_created ON public."JobApplication" USING btree ("studentId", "createdAt" DESC);

-- 12. JobApplication: job_matchscore_created composite index
CREATE INDEX IF NOT EXISTS idx_jobapplication_job_matchscore_created ON public."JobApplication" USING btree ("jobId", "matchScore" DESC, "createdAt" DESC);

-- 13. Skill: active_category_displayname composite index
CREATE INDEX IF NOT EXISTS idx_skill_active_category_displayname ON public."Skill" USING btree (active, category, "displayName");

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * scripts/migrate_mongo_to_supabase.js — Comprehensive Data Migration Script
 *
 * Concurrently connects to MongoDB Atlas (NoSQL) and Supabase PostgreSQL (Prisma ORM).
 * Migrates all 12 collections in strict relational dependency order:
 *  1. Skill
 *  2. Career
 *  3. Company
 *  4. User (preserves exact raw bcrypt password hashes without re-encoding)
 *  5. Roadmap (enforces single-active-route per user)
 *  6. RoadmapTask
 *  7. Attempt
 *  8. Resume
 *  9. JobOpening
 * 10. JobApplication
 * 11. YoutubeCache
 * 12. CampusLead
 *
 * Preserves 24-character hexadecimal MongoDB ObjectIDs as primary keys (id String @id)
 * so existing JWTs, local storage, and client URLs remain 100% valid.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
const connectDB = require('../config/db');

// Import MongoDB Models
const SkillMongo = require('../models/Skill');
const CareerMongo = require('../models/Career');
const CompanyMongo = require('../models/Company');
const UserMongo = require('../models/User');
const RoadmapMongo = require('../models/Roadmap');
const RoadmapTaskMongo = require('../models/RoadmapTask');
const AttemptMongo = require('../models/Attempt');
const ResumeMongo = require('../models/Resume');
const JobOpeningMongo = require('../models/JobOpening');
const JobApplicationMongo = require('../models/JobApplication');
const YoutubeCacheMongo = require('../models/YoutubeCache');
const CampusLeadMongo = require('../models/CampusLead');

const prisma = new PrismaClient();

async function runMigration() {
  console.log('\n============================================================');
  console.log('🚀 Disheera — MongoDB Atlas to Supabase (PostgreSQL) Migration');
  console.log('============================================================\n');

  const startTime = Date.now();

  try {
    // 1. Connect to both databases
    console.log('🔌 Connecting to MongoDB Atlas...');
    await connectDB();
    console.log('✅ MongoDB Atlas connected.\n');

    console.log('🔌 Connecting to Supabase PostgreSQL via Prisma...');
    await prisma.$connect();
    console.log('✅ Supabase PostgreSQL connected.\n');

    // Ensure PostgreSQL partial unique index exists
    console.log('🔒 Verifying PostgreSQL Partial Unique Indexes...');
    try {
      await prisma.$executeRawUnsafe(
        'DROP INDEX IF EXISTS idx_single_active_route;'
      );
      await prisma.$executeRawUnsafe(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_user_career_active_route ON "Roadmap"("userId", "careerId") WHERE status = \'active\';'
      );
      console.log('✅ Partial unique index `idx_user_career_active_route` verified.\n');
    } catch (idxErr) {
      console.warn('⚠️  Notice on partial unique index:', idxErr.message);
    }

    const stats = {};

    // ── STEP 1: Migrate Skills ────────────────────────────────
    console.log('📦 [1/12] Migrating Skills...');
    const skills = await SkillMongo.find({}).lean();
    let skillCount = 0;
    for (const s of skills) {
      await prisma.skill.upsert({
        where: { id: s._id.toString() },
        create: {
          id: s._id.toString(),
          name: s.name,
          displayName: s.displayName || s.name,
          category: s.category || 'General',
          description: s.description || null,
          active: s.active !== false,
          createdAt: s.createdAt || new Date(),
          updatedAt: s.updatedAt || new Date(),
        },
        update: {
          name: s.name,
          displayName: s.displayName || s.name,
          category: s.category || 'General',
          description: s.description || null,
          active: s.active !== false,
          updatedAt: s.updatedAt || new Date(),
        },
      });
      skillCount++;
    }
    stats.skills = { mongo: skills.length, supabase: skillCount };
    console.log(`   ✓ Migrated ${skillCount} skills.\n`);

    // ── STEP 2: Migrate Careers ───────────────────────────────
    console.log('📦 [2/12] Migrating Careers...');
    const careers = await CareerMongo.find({}).lean();
    let careerCount = 0;
    for (const c of careers) {
      await prisma.career.upsert({
        where: { id: c._id.toString() },
        create: {
          id: c._id.toString(),
          title: c.title,
          slug: c.slug,
          shortDescription: c.shortDescription || '',
          longDescription: c.longDescription || '',
          category: c.category || 'Engineering',
          icon: c.icon || null,
          color: c.color || null,
          active: c.active !== false,
          educationPreferences: c.educationPreferences || null,
          interestTags: c.interestTags || null,
          requiredSkills: c.requiredSkills || null,
          createdAt: c.createdAt || new Date(),
          updatedAt: c.updatedAt || new Date(),
        },
        update: {
          title: c.title,
          slug: c.slug,
          shortDescription: c.shortDescription || '',
          longDescription: c.longDescription || '',
          category: c.category || 'Engineering',
          icon: c.icon || null,
          color: c.color || null,
          active: c.active !== false,
          educationPreferences: c.educationPreferences || null,
          interestTags: c.interestTags || null,
          requiredSkills: c.requiredSkills || null,
          updatedAt: c.updatedAt || new Date(),
        },
      });
      careerCount++;
    }
    stats.careers = { mongo: careers.length, supabase: careerCount };
    console.log(`   ✓ Migrated ${careerCount} careers.\n`);

    // ── STEP 3: Migrate Companies ─────────────────────────────
    console.log('📦 [3/12] Migrating Companies...');
    const companies = await CompanyMongo.find({}).lean();
    let companyCount = 0;
    for (const co of companies) {
      await prisma.company.upsert({
        where: { id: co._id.toString() },
        create: {
          id: co._id.toString(),
          name: co.name,
          domain: co.domain.toLowerCase(),
          website: co.website || null,
          logoUrl: co.logoUrl || null,
          industry: co.industry || null,
          headquarters: co.headquarters || null,
          companySize: co.companySize || null,
          cinNumber: co.cinNumber || null,
          linkedinUrl: co.linkedinUrl || null,
          isVerified: !!co.isVerified,
          verificationScore: co.verificationScore || 0,
          verificationDetails: co.verificationDetails || null,
          createdAt: co.createdAt || new Date(),
          updatedAt: co.updatedAt || new Date(),
        },
        update: {
          name: co.name,
          domain: co.domain.toLowerCase(),
          website: co.website || null,
          logoUrl: co.logoUrl || null,
          industry: co.industry || null,
          headquarters: co.headquarters || null,
          companySize: co.companySize || null,
          cinNumber: co.cinNumber || null,
          linkedinUrl: co.linkedinUrl || null,
          isVerified: !!co.isVerified,
          verificationScore: co.verificationScore || 0,
          verificationDetails: co.verificationDetails || null,
          updatedAt: co.updatedAt || new Date(),
        },
      });
      companyCount++;
    }
    stats.companies = { mongo: companies.length, supabase: companyCount };
    console.log(`   ✓ Migrated ${companyCount} companies.\n`);

    // ── STEP 4: Migrate Users (Preserving Bcrypt Passwords) ─────
    console.log('📦 [4/12] Migrating Users (Preserving Bcrypt Passwords)...');
    const users = await UserMongo.find({}).select('+password +encryptedVault').lean();
    let userCount = 0;
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u._id.toString() },
        create: {
          id: u._id.toString(),
          name: u.name || 'User',
          email: u.email.toLowerCase(),
          password: u.password || null, // Transfer exact raw hash string directly!
          googleId: u.googleId || null,
          githubId: u.githubId || null,
          authProvider: u.authProvider || 'local',
          role: u.role || 'student',
          primaryStream: u.primaryStream || 'engineering',
          avatarUrl: u.avatarUrl || null,
          resumeUrl: u.resumeUrl || null,
          profileCompleted: !!u.profileCompleted,
          isVerified: !!u.isVerified,
          hasCompletedSkillVerification: !!u.hasCompletedSkillVerification,
          lastAbandonedRouteAt: u.lastAbandonedRouteAt ? new Date(u.lastAbandonedRouteAt) : null,
          education: u.education || null,
          interests: u.interests || null,
          skills: u.skills || null,
          careerGoals: u.careerGoals || null,
          githubProfile: u.githubProfile || null,
          githubRepos: u.githubRepos || null,
          recruiterProfile: u.recruiterProfile || null,
          resumeRecord: u.resumeRecord || null,
          completedPaths: u.completedPaths || null,
          profileStatus: u.profileStatus || null,
          resumeAnalysis: u.resumeAnalysis || null,
          mockInterview: u.mockInterview || null,
          jobReadiness: u.jobReadiness || null,
          builtResume: u.builtResume || null,
          verificationOtp: u.verificationOtp || null,
          encryptedVault: u.encryptedVault || null,
          createdAt: u.createdAt || new Date(),
          updatedAt: u.updatedAt || new Date(),
        },
        update: {
          name: u.name || 'User',
          email: u.email.toLowerCase(),
          password: u.password || null,
          googleId: u.googleId || null,
          githubId: u.githubId || null,
          authProvider: u.authProvider || 'local',
          role: u.role || 'student',
          primaryStream: u.primaryStream || 'engineering',
          avatarUrl: u.avatarUrl || null,
          resumeUrl: u.resumeUrl || null,
          profileCompleted: !!u.profileCompleted,
          isVerified: !!u.isVerified,
          hasCompletedSkillVerification: !!u.hasCompletedSkillVerification,
          lastAbandonedRouteAt: u.lastAbandonedRouteAt ? new Date(u.lastAbandonedRouteAt) : null,
          education: u.education || null,
          interests: u.interests || null,
          skills: u.skills || null,
          careerGoals: u.careerGoals || null,
          githubProfile: u.githubProfile || null,
          githubRepos: u.githubRepos || null,
          recruiterProfile: u.recruiterProfile || null,
          resumeRecord: u.resumeRecord || null,
          completedPaths: u.completedPaths || null,
          profileStatus: u.profileStatus || null,
          resumeAnalysis: u.resumeAnalysis || null,
          mockInterview: u.mockInterview || null,
          jobReadiness: u.jobReadiness || null,
          builtResume: u.builtResume || null,
          verificationOtp: u.verificationOtp || null,
          encryptedVault: u.encryptedVault || null,
          updatedAt: u.updatedAt || new Date(),
        },
      });
      userCount++;
    }
    stats.users = { mongo: users.length, supabase: userCount };
    console.log(`   ✓ Migrated ${userCount} users.\n`);

    // ── STEP 5: Migrate Roadmaps (Enforce Single-Active Route) ──
    console.log('📦 [5/12] Migrating Roadmaps...');
    const roadmaps = await RoadmapMongo.find({}).sort({ updatedAt: -1 }).lean();
    let roadmapCount = 0;
    const activeRoutePerUser = new Set();

    // Map of known careers in Supabase to guarantee foreign key integrity
    const validCareerIds = new Set((await prisma.career.findMany({ select: { id: true } })).map((c) => c.id));
    const validUserIds = new Set((await prisma.user.findMany({ select: { id: true } })).map((u) => u.id));
    const fallbackCareer = await prisma.career.findFirst();

    for (const r of roadmaps) {
      const userId = r.user ? r.user.toString() : null;
      if (!userId || !validUserIds.has(userId)) continue;

      let careerId = r.career ? r.career.toString() : null;
      if (!careerId || !validCareerIds.has(careerId)) {
        careerId = fallbackCareer ? fallbackCareer.id : null;
      }
      if (!careerId) continue;

      // Handle single-active-route rule: if user already has an active route, archive subsequent older ones
      let status = r.status || 'active';
      if (status === 'active') {
        if (activeRoutePerUser.has(userId)) {
          status = 'archived';
        } else {
          activeRoutePerUser.add(userId);
        }
      }

      await prisma.roadmap.upsert({
        where: { id: r._id.toString() },
        create: {
          id: r._id.toString(),
          userId,
          careerId,
          durationWeeks: r.durationWeeks || 4,
          status,
          abandonedAt: r.abandonedAt ? new Date(r.abandonedAt) : null,
          totalTasks: r.totalTasks || 0,
          completedTasks: r.completedTasks || 0,
          progressPercentage: r.progressPercentage || 0,
          careerSnapshot: r.careerSnapshot || null,
          generatedFrom: r.generatedFrom || null,
          weekProgress: r.weekProgress || null,
          startedAt: r.startedAt || r.createdAt || new Date(),
          completedAt: r.completedAt ? new Date(r.completedAt) : null,
          createdAt: r.createdAt || new Date(),
          updatedAt: r.updatedAt || new Date(),
        },
        update: {
          userId,
          careerId,
          durationWeeks: r.durationWeeks || 4,
          status,
          abandonedAt: r.abandonedAt ? new Date(r.abandonedAt) : null,
          totalTasks: r.totalTasks || 0,
          completedTasks: r.completedTasks || 0,
          progressPercentage: r.progressPercentage || 0,
          careerSnapshot: r.careerSnapshot || null,
          generatedFrom: r.generatedFrom || null,
          weekProgress: r.weekProgress || null,
          completedAt: r.completedAt ? new Date(r.completedAt) : null,
          updatedAt: r.updatedAt || new Date(),
        },
      });
      roadmapCount++;
    }
    stats.roadmaps = { mongo: roadmaps.length, supabase: roadmapCount };
    console.log(`   ✓ Migrated ${roadmapCount} roadmaps.\n`);

    // ── STEP 6: Migrate RoadmapTasks ──────────────────────────
    console.log('📦 [6/12] Migrating Roadmap Tasks...');
    const validRoadmapIds = new Set((await prisma.roadmap.findMany({ select: { id: true } })).map((r) => r.id));
    const tasks = await RoadmapTaskMongo.find({}).lean();
    let taskCount = 0;

    for (const t of tasks) {
      const roadmapId = t.roadmap ? t.roadmap.toString() : null;
      if (!roadmapId || !validRoadmapIds.has(roadmapId)) continue;

      await prisma.roadmapTask.upsert({
        where: { id: t._id.toString() },
        create: {
          id: t._id.toString(),
          roadmapId,
          weekNumber: t.weekNumber || 1,
          order: t.order || 1,
          title: t.title || 'Task',
          description: t.description || '',
          type: t.type || 'learn',
          skillName: t.skillName || null,
          priority: t.priority || 'medium',
          estimatedHours: t.estimatedHours || 2,
          completed: !!t.completed,
          completedAt: t.completedAt ? new Date(t.completedAt) : null,
          isVideoTask: !!t.isVideoTask,
          videoWatchTimeSeconds: t.videoWatchTimeSeconds || 0,
          videoDurationSeconds: t.videoDurationSeconds || 0,
          resource: t.resource || null,
          videoVerification: t.videoVerification || null,
          createdAt: t.createdAt || new Date(),
          updatedAt: t.updatedAt || new Date(),
        },
        update: {
          roadmapId,
          weekNumber: t.weekNumber || 1,
          order: t.order || 1,
          title: t.title || 'Task',
          description: t.description || '',
          type: t.type || 'learn',
          skillName: t.skillName || null,
          priority: t.priority || 'medium',
          estimatedHours: t.estimatedHours || 2,
          completed: !!t.completed,
          completedAt: t.completedAt ? new Date(t.completedAt) : null,
          isVideoTask: !!t.isVideoTask,
          videoWatchTimeSeconds: t.videoWatchTimeSeconds || 0,
          videoDurationSeconds: t.videoDurationSeconds || 0,
          resource: t.resource || null,
          videoVerification: t.videoVerification || null,
          updatedAt: t.updatedAt || new Date(),
        },
      });
      taskCount++;
    }
    stats.tasks = { mongo: tasks.length, supabase: taskCount };
    console.log(`   ✓ Migrated ${taskCount} roadmap tasks.\n`);

    // ── STEP 7: Migrate Attempts ──────────────────────────────
    console.log('📦 [7/12] Migrating Quiz & Milestone Attempts...');
    const attempts = await AttemptMongo.find({}).lean();
    let attemptCount = 0;

    for (const a of attempts) {
      const userId = a.user ? a.user.toString() : null;
      if (!userId || !validUserIds.has(userId)) continue;

      let roadmapId = a.roadmap ? a.roadmap.toString() : null;
      if (roadmapId && !validRoadmapIds.has(roadmapId)) {
        roadmapId = null;
      }

      await prisma.attempt.upsert({
        where: { id: a._id.toString() },
        create: {
          id: a._id.toString(),
          userId,
          type: a.type || 'skill_check',
          skill: a.skill || null,
          roadmapId,
          roadmapWeek: a.roadmapWeek || null,
          score: a.score || 0,
          total: a.total || 0,
          percent: a.percent || 0,
          passed: !!a.passed,
          startTime: a.startTime || a.createdAt || new Date(),
          deadline: a.deadline || new Date(Date.now() + 30 * 60 * 1000),
          submitTime: a.submitTime ? new Date(a.submitTime) : null,
          topicTags: a.topicTags || null,
          questionsAsked: a.questionsAsked || null,
          missedTopics: a.missedTopics || null,
          integrityMetadata: a.integrityMetadata || null,
          createdAt: a.createdAt || new Date(),
          updatedAt: a.updatedAt || new Date(),
        },
        update: {
          userId,
          type: a.type || 'skill_check',
          skill: a.skill || null,
          roadmapId,
          roadmapWeek: a.roadmapWeek || null,
          score: a.score || 0,
          total: a.total || 0,
          percent: a.percent || 0,
          passed: !!a.passed,
          submitTime: a.submitTime ? new Date(a.submitTime) : null,
          topicTags: a.topicTags || null,
          questionsAsked: a.questionsAsked || null,
          missedTopics: a.missedTopics || null,
          integrityMetadata: a.integrityMetadata || null,
          updatedAt: a.updatedAt || new Date(),
        },
      });
      attemptCount++;
    }
    stats.attempts = { mongo: attempts.length, supabase: attemptCount };
    console.log(`   ✓ Migrated ${attemptCount} attempts.\n`);

    // ── STEP 8: Migrate Resumes ────────────────────────────────
    console.log('📦 [8/12] Migrating Resumes...');
    const resumes = await ResumeMongo.find({}).lean();
    let resumeCount = 0;

    for (const resDoc of resumes) {
      const userId = resDoc.user ? resDoc.user.toString() : null;
      if (!userId || !validUserIds.has(userId)) continue;

      await prisma.resume.upsert({
        where: { id: resDoc._id.toString() },
        create: {
          id: resDoc._id.toString(),
          userId,
          originalName: resDoc.originalName || 'resume.pdf',
          fileType: resDoc.fileType || 'application/pdf',
          sizeBytes: resDoc.sizeBytes || 0,
          fileLocation: resDoc.fileLocation || '',
          publicId: resDoc.publicId || '',
          version: resDoc.version || 1,
          extractedText: resDoc.extractedText || null,
          atsScore: resDoc.atsScore || null,
          firstUploadedAt: resDoc.firstUploadedAt || resDoc.createdAt || new Date(),
          lastUpdatedAt: resDoc.lastUpdatedAt || resDoc.updatedAt || new Date(),
          createdAt: resDoc.createdAt || new Date(),
          updatedAt: resDoc.updatedAt || new Date(),
        },
        update: {
          userId,
          originalName: resDoc.originalName || 'resume.pdf',
          fileType: resDoc.fileType || 'application/pdf',
          sizeBytes: resDoc.sizeBytes || 0,
          fileLocation: resDoc.fileLocation || '',
          publicId: resDoc.publicId || '',
          version: resDoc.version || 1,
          extractedText: resDoc.extractedText || null,
          atsScore: resDoc.atsScore || null,
          lastUpdatedAt: resDoc.lastUpdatedAt || resDoc.updatedAt || new Date(),
          updatedAt: resDoc.updatedAt || new Date(),
        },
      });
      resumeCount++;
    }
    stats.resumes = { mongo: resumes.length, supabase: resumeCount };
    console.log(`   ✓ Migrated ${resumeCount} resumes.\n`);

    // ── STEP 9: Migrate Job Openings ───────────────────────────
    console.log('📦 [9/12] Migrating Job Openings...');
    const validCompanyIds = new Set((await prisma.company.findMany({ select: { id: true } })).map((c) => c.id));
    const jobOpenings = await JobOpeningMongo.find({}).lean();
    let openingCount = 0;

    for (const job of jobOpenings) {
      const recruiterId = job.recruiter ? job.recruiter.toString() : null;
      const companyId = job.company ? job.company.toString() : null;
      if (!recruiterId || !validUserIds.has(recruiterId)) continue;
      if (!companyId || !validCompanyIds.has(companyId)) continue;

      await prisma.jobOpening.upsert({
        where: { id: job._id.toString() },
        create: {
          id: job._id.toString(),
          recruiterId,
          companyId,
          companyName: job.companyName || 'Company',
          companyLogo: job.companyLogo || null,
          companyWebsite: job.companyWebsite || null,
          isCompanyVerified: job.isCompanyVerified !== false,
          title: job.title || 'Role',
          careerSlug: job.careerSlug || 'software-engineer',
          jobType: job.jobType || 'full-time',
          workplace: job.workplace || 'hybrid',
          location: job.location || null,
          experienceLevel: job.experienceLevel || 'entry',
          salaryMin: job.salaryMin || null,
          salaryMax: job.salaryMax || null,
          salaryCurrency: job.salaryCurrency || 'INR',
          description: job.description || '',
          minimumReadinessScore: job.minimumReadinessScore || 0,
          status: job.status || 'active',
          applicationsCount: job.applicationsCount || 0,
          deadline: job.deadline ? new Date(job.deadline) : null,
          responsibilities: job.responsibilities || null,
          requiredSkills: job.requiredSkills || null,
          createdAt: job.createdAt || new Date(),
          updatedAt: job.updatedAt || new Date(),
        },
        update: {
          recruiterId,
          companyId,
          companyName: job.companyName || 'Company',
          companyLogo: job.companyLogo || null,
          companyWebsite: job.companyWebsite || null,
          isCompanyVerified: job.isCompanyVerified !== false,
          title: job.title || 'Role',
          careerSlug: job.careerSlug || 'software-engineer',
          jobType: job.jobType || 'full-time',
          workplace: job.workplace || 'hybrid',
          location: job.location || null,
          experienceLevel: job.experienceLevel || 'entry',
          salaryMin: job.salaryMin || null,
          salaryMax: job.salaryMax || null,
          salaryCurrency: job.salaryCurrency || 'INR',
          description: job.description || '',
          minimumReadinessScore: job.minimumReadinessScore || 0,
          status: job.status || 'active',
          applicationsCount: job.applicationsCount || 0,
          deadline: job.deadline ? new Date(job.deadline) : null,
          responsibilities: job.responsibilities || null,
          requiredSkills: job.requiredSkills || null,
          updatedAt: job.updatedAt || new Date(),
        },
      });
      openingCount++;
    }
    stats.jobOpenings = { mongo: jobOpenings.length, supabase: openingCount };
    console.log(`   ✓ Migrated ${openingCount} job openings.\n`);

    // ── STEP 10: Migrate Job Applications ──────────────────────
    console.log('📦 [10/12] Migrating Job Applications...');
    const validJobIds = new Set((await prisma.jobOpening.findMany({ select: { id: true } })).map((j) => j.id));
    const jobApps = await JobApplicationMongo.find({}).lean();
    let appCount = 0;

    for (const app of jobApps) {
      const jobId = app.job ? app.job.toString() : null;
      const studentId = app.student ? app.student.toString() : null;
      const recruiterId = app.recruiter ? app.recruiter.toString() : null;

      if (!jobId || !validJobIds.has(jobId)) continue;
      if (!studentId || !validUserIds.has(studentId)) continue;
      if (!recruiterId || !validUserIds.has(recruiterId)) continue;

      await prisma.jobApplication.upsert({
        where: { id: app._id.toString() },
        create: {
          id: app._id.toString(),
          jobId,
          studentId,
          recruiterId,
          matchScore: app.matchScore || 0,
          readinessTier: app.readinessTier || null,
          resumeUrl: app.resumeUrl || null,
          coverNote: app.coverNote || null,
          status: app.status || 'applied',
          recruiterNotes: app.recruiterNotes || null,
          appliedAt: app.appliedAt || app.createdAt || new Date(),
          matchedSkills: app.matchedSkills || null,
          missingSkills: app.missingSkills || null,
          builtResumeSnapshot: app.builtResumeSnapshot || null,
          createdAt: app.createdAt || new Date(),
          updatedAt: app.updatedAt || new Date(),
        },
        update: {
          jobId,
          studentId,
          recruiterId,
          matchScore: app.matchScore || 0,
          readinessTier: app.readinessTier || null,
          resumeUrl: app.resumeUrl || null,
          coverNote: app.coverNote || null,
          status: app.status || 'applied',
          recruiterNotes: app.recruiterNotes || null,
          matchedSkills: app.matchedSkills || null,
          missingSkills: app.missingSkills || null,
          builtResumeSnapshot: app.builtResumeSnapshot || null,
          updatedAt: app.updatedAt || new Date(),
        },
      });
      appCount++;
    }
    stats.jobApplications = { mongo: jobApps.length, supabase: appCount };
    console.log(`   ✓ Migrated ${appCount} job applications.\n`);

    // ── STEP 11: Migrate YoutubeCache ─────────────────────────
    console.log('📦 [11/12] Migrating YouTube Video Cache...');
    const ytCaches = await YoutubeCacheMongo.find({}).lean();
    let ytCount = 0;

    for (const yt of ytCaches) {
      if (!yt.queryKey) continue;
      await prisma.youtubeCache.upsert({
        where: { queryKey: yt.queryKey },
        create: {
          id: yt._id ? yt._id.toString() : `yt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          queryKey: yt.queryKey,
          skillName: yt.skillName || null,
          source: yt.source || 'curated_registry',
          videos: yt.videos || null,
          createdAt: yt.createdAt || new Date(),
          updatedAt: yt.updatedAt || new Date(),
        },
        update: {
          skillName: yt.skillName || null,
          source: yt.source || 'curated_registry',
          videos: yt.videos || null,
          updatedAt: yt.updatedAt || new Date(),
        },
      });
      ytCount++;
    }
    stats.youtubeCache = { mongo: ytCaches.length, supabase: ytCount };
    console.log(`   ✓ Migrated ${ytCount} YouTube cache entries.\n`);

    // ── STEP 12: Migrate Campus Leads ─────────────────────────
    console.log('📦 [12/12] Migrating Campus Leads...');
    const campusLeads = await CampusLeadMongo.find({}).lean();
    let leadCount = 0;

    for (const cl of campusLeads) {
      await prisma.campusLead.upsert({
        where: { id: cl._id.toString() },
        create: {
          id: cl._id.toString(),
          collegeName: cl.collegeName || 'Unknown College',
          cityState: cl.cityState || null,
          contactPerson: cl.contactPerson || 'TPO',
          designation: cl.designation || 'Head of Placement',
          email: cl.email || 'tpo@college.edu',
          phone: cl.phone || '0000000000',
          batchSize: cl.batchSize || '500+',
          preferredDemoDate: cl.preferredDemoDate ? new Date(cl.preferredDemoDate) : null,
          source: cl.source || 'landing_page',
          voiceAiCallId: cl.voiceAiCallId || null,
          status: cl.status || 'new',
          notes: cl.notes || null,
          createdAt: cl.createdAt || new Date(),
          updatedAt: cl.updatedAt || new Date(),
        },
        update: {
          collegeName: cl.collegeName || 'Unknown College',
          cityState: cl.cityState || null,
          contactPerson: cl.contactPerson || 'TPO',
          designation: cl.designation || 'Head of Placement',
          email: cl.email || 'tpo@college.edu',
          phone: cl.phone || '0000000000',
          batchSize: cl.batchSize || '500+',
          preferredDemoDate: cl.preferredDemoDate ? new Date(cl.preferredDemoDate) : null,
          source: cl.source || 'landing_page',
          voiceAiCallId: cl.voiceAiCallId || null,
          status: cl.status || 'new',
          notes: cl.notes || null,
          updatedAt: cl.updatedAt || new Date(),
        },
      });
      leadCount++;
    }
    stats.campusLeads = { mongo: campusLeads.length, supabase: leadCount };
    console.log(`   ✓ Migrated ${leadCount} campus leads.\n`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('============================================================');
    console.log(`🎉 MIGRATION COMPLETED SUCCESSFULLY in ${duration}s!`);
    console.log('============================================================');
    console.table(stats);

    await mongoose.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED WITH ERROR:\n', error);
    try {
      await mongoose.disconnect();
      await prisma.$disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

runMigration();

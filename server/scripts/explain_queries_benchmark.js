/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { prisma } = require('../config/prisma');

// Candidate read queries from our analysis
const QUERIES = [
  {
    name: 'Query 1: Dashboard Active Roadmaps (Filter + Sort)',
    description: 'Student Dashboard querying active roadmaps sorted by creation date',
    screen: 'dashboard.html / dashboardController',
    sql: `EXPLAIN (ANALYZE, BUFFERS)
          SELECT "id", "userId", "careerId", "status", "progressPercentage", "totalTasks", "completedTasks", "createdAt"
          FROM "Roadmap"
          WHERE "userId" = '68dc3b5c43d83b9e4a87a102' AND "status" = 'active'
          ORDER BY "createdAt" DESC;`
  },
  {
    name: 'Query 2: Dashboard Upcoming Unfinished Tasks (Filter + Sort + Limit)',
    description: 'Dashboard fetching next 5 unfinished tasks for active roadmap in week order',
    screen: 'dashboard.html / dashboardController',
    sql: `EXPLAIN (ANALYZE, BUFFERS)
          SELECT "id", "roadmapId", "weekNumber", "order", "title", "completed", "priority"
          FROM "RoadmapTask"
          WHERE "roadmapId" = '9b67484d-2a14-411a-a82f-836798c92a64' AND "completed" = false
          ORDER BY "weekNumber" ASC, "order" ASC
          LIMIT 5;`
  },
  {
    name: 'Query 3: Full Roadmap Tasks Grouped by Week (Filter + Sort)',
    description: 'Roadmap view fetching all curriculum tasks ordered by week and sequence',
    screen: 'roadmap.html / roadmapController.getCurrentRoadmap',
    sql: `EXPLAIN (ANALYZE, BUFFERS)
          SELECT "id", "roadmapId", "weekNumber", "order", "title", "completed", "isVideoTask"
          FROM "RoadmapTask"
          WHERE "roadmapId" = '9b67484d-2a14-411a-a82f-836798c92a64'
          ORDER BY "weekNumber" ASC, "order" ASC;`
  },
  {
    name: 'Query 4: Recruiter Applicant Radar Ranked (Filter + Multi-Column Sort)',
    description: 'Recruiter Dashboard fetching applicants ranked by match score and application date',
    screen: 'recruiter-dashboard.html / recruiterController.getJobApplicants',
    sql: `EXPLAIN (ANALYZE, BUFFERS)
          SELECT "id", "jobId", "studentId", "matchScore", "status", "appliedAt", "createdAt"
          FROM "JobApplication"
          WHERE "jobId" = 'job_lead_fullstack_2026'
          ORDER BY "matchScore" DESC, "createdAt" DESC;`
  },
  {
    name: 'Query 5: Recruiter Postings by Recency (Filter + Sort)',
    description: 'Recruiter portal loading openings posted by recruiter sorted by creation date',
    screen: 'recruiter-dashboard.html / recruiterController.getMyJobs',
    sql: `EXPLAIN (ANALYZE, BUFFERS)
          SELECT "id", "recruiterId", "companyId", "title", "status", "applicationsCount", "createdAt"
          FROM "JobOpening"
          WHERE "recruiterId" = '68dc3b5c43d83b9e4a87a102'
          ORDER BY "createdAt" DESC;`
  },
  {
    name: 'Query 6: Candidate My Applications (Filter + Sort)',
    description: 'Student viewing their submitted job applications sorted by submission date',
    screen: 'jobs.html / jobRoutes.my-applications',
    sql: `EXPLAIN (ANALYZE, BUFFERS)
          SELECT "id", "jobId", "studentId", "status", "matchScore", "createdAt"
          FROM "JobApplication"
          WHERE "studentId" = '68dc3b5c43d83b9e4a87a102'
          ORDER BY "createdAt" DESC;`
  },
  {
    name: 'Query 7: Milestone Test Attempt Lookup (Multi-Column Filter + Sort)',
    description: 'Weekly test engine checking for active attempt for a specific user, roadmap, and week',
    screen: 'roadmap.html / weeklyTestService.startWeeklyTest',
    sql: `EXPLAIN (ANALYZE, BUFFERS)
          SELECT "id", "userId", "roadmapId", "roadmapWeek", "score", "submitTime", "deadline", "createdAt"
          FROM "Attempt"
          WHERE "userId" = '68dc3b5c43d83b9e4a87a102'
            AND "roadmapId" = '9b67484d-2a14-411a-a82f-836798c92a64'
            AND "roadmapWeek" = 1
            AND "submitTime" IS NULL
          ORDER BY "createdAt" DESC
          LIMIT 1;`
  },
  {
    name: 'Query 8: Previous Attempt Question Exclusion (Multi-Column Filter)',
    description: 'Weekly test engine retrieving past attempts for user on week to exclude duplicate questions',
    screen: 'roadmap.html / weeklyTestService.getWeeklyTestQuestions',
    sql: `EXPLAIN (ANALYZE, BUFFERS)
          SELECT "id", "userId", "roadmapId", "roadmapWeek", "questionsAsked"
          FROM "Attempt"
          WHERE "userId" = '68dc3b5c43d83b9e4a87a102'
            AND "roadmapId" = '9b67484d-2a14-411a-a82f-836798c92a64'
            AND "roadmapWeek" = 1;`
  },
  {
    name: 'Query 9: Active Skills by Category & Display Name (Filter + Sort)',
    description: 'Skill explorer listing active skills in a domain sorted alphabetically',
    screen: 'assessment.html / skillController.getSkills',
    sql: `EXPLAIN (ANALYZE, BUFFERS)
          SELECT "id", "name", "displayName", "category", "type", "active"
          FROM "Skill"
          WHERE "active" = true AND "category" = 'software'
          ORDER BY "displayName" ASC;`
  },
  {
    name: 'Query 10: 180-Day Skill Currency Expiration Audit (Date Range Scan)',
    description: 'Cron background worker scanning historical attempts older than 180 days',
    screen: 'cronService.validateSkillCurrency',
    sql: `EXPLAIN (ANALYZE, BUFFERS)
          SELECT count(*)
          FROM "Attempt"
          WHERE "createdAt" < NOW() - INTERVAL '180 days';`
  }
];

async function benchmark() {
  console.log('=== RUNNING EXPLAIN ANALYZE ON CORE READ QUERIES ===\n');
  const results = [];

  for (const q of QUERIES) {
    try {
      const rawRows = await prisma.$queryRawUnsafe(q.sql);
      const planLines = rawRows.map(r => r['QUERY PLAN']);
      const planText = planLines.join('\n');

      // Extract execution time & scan type
      const execTimeMatch = planText.match(/Execution Time: ([\d\.]+) ms/);
      const planTimeMatch = planText.match(/Planning Time: ([\d\.]+) ms/);
      const isSeqScan = planText.includes('Seq Scan');
      const isIndexScan = planText.includes('Index Scan') || planText.includes('Index Only Scan');
      const isBitmapScan = planText.includes('Bitmap Heap Scan');
      const hasSort = planText.includes('Sort Method:');

      let scanSummary = 'Index Scan';
      if (isSeqScan && (isIndexScan || isBitmapScan)) {
        scanSummary = 'Mixed (Index + Seq Scan)';
      } else if (isSeqScan) {
        scanSummary = 'Seq Scan (Whole Table Scan)';
      } else if (isBitmapScan) {
        scanSummary = 'Bitmap Index Scan';
      } else if (isIndexScan) {
        scanSummary = 'Index Scan';
      }

      console.log(`------------------------------------------------------------`);
      console.log(`📌 ${q.name}`);
      console.log(`   Screen: ${q.screen}`);
      console.log(`   Plan Summary: ${scanSummary}${hasSort ? ' + In-Memory Sort' : ' (Presorted)'}`);
      console.log(`   Planning Time: ${planTimeMatch ? planTimeMatch[1] : 'N/A'} ms | Execution Time: ${execTimeMatch ? execTimeMatch[1] : 'N/A'} ms`);
      console.log(`   Details:\n   ${planLines.slice(0, 4).join('\n   ')}`);
      if (planLines.length > 4) {
        console.log(`   ...`);
        console.log(`   ${planLines[planLines.length - 1]}`);
      }

      results.push({
        name: q.name,
        screen: q.screen,
        scanType: scanSummary,
        hasSort,
        planningMs: parseFloat(planTimeMatch ? planTimeMatch[1] : 0),
        execMs: parseFloat(execTimeMatch ? execTimeMatch[1] : 0),
        fullPlan: planText
      });
    } catch (err) {
      console.error(`❌ Error explaining "${q.name}":`, err.message);
    }
  }

  await prisma.$disconnect();
  return results;
}

if (require.main === module) {
  benchmark();
}

module.exports = { benchmark, QUERIES };

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * tests/supabase_migration_verification.js — Complete Verification Suite
 *
 * Validates the Supabase PostgreSQL migration:
 * 1. Database Connectivity & Model Record Counts
 * 2. Password Authenticity (Bcrypt hash validation without re-encoding)
 * 3. Relational Foreign Key Integrity (User -> Roadmap -> Tasks)
 * 4. Single-Active-Route PostgreSQL Partial Unique Index Constraint
 * 5. JSONB Column Hydration & Integrity
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runVerificationSuite() {
  console.log('\n============================================================');
  console.log('🧪 Disheera — Supabase PostgreSQL Migration Test Suite');
  console.log('============================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASSED: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failedTests++;
    }
  }

  try {
    // ── TEST 1: Table Counts & Population ─────────────────────
    console.log('▶ TEST 1: Supabase Record Population & Counts');
    const userCount = await prisma.user.count();
    const careerCount = await prisma.career.count();
    const skillCount = await prisma.skill.count();
    const roadmapCount = await prisma.roadmap.count();
    const taskCount = await prisma.roadmapTask.count();
    const attemptCount = await prisma.attempt.count();
    const companyCount = await prisma.company.count();
    const openingCount = await prisma.jobOpening.count();
    const appCount = await prisma.jobApplication.count();
    const ytCount = await prisma.youtubeCache.count();
    const leadCount = await prisma.campusLead.count();

    assert(userCount >= 39, `Users populated in Supabase (Found: ${userCount})`);
    assert(careerCount >= 24, `Careers populated in Supabase (Found: ${careerCount})`);
    assert(skillCount >= 95, `Skills populated in Supabase (Found: ${skillCount})`);
    assert(roadmapCount >= 20, `Roadmaps populated in Supabase (Found: ${roadmapCount})`);
    assert(taskCount >= 100, `Roadmap Tasks populated in Supabase (Found: ${taskCount})`);
    assert(attemptCount >= 30, `Attempts populated in Supabase (Found: ${attemptCount})`);
    assert(companyCount >= 2, `Companies populated in Supabase (Found: ${companyCount})`);
    assert(ytCount >= 6, `YouTube Cache populated in Supabase (Found: ${ytCount})`);

    // ── TEST 2: Bcrypt Password Validation ────────────────────
    console.log('\n▶ TEST 2: Bcrypt Password Hash Authenticity');
    // Test known demo user
    const demoUser = await prisma.user.findFirst({
      where: { email: 'kajimew275@blobapps.com' },
    });

    if (demoUser && demoUser.password) {
      const isValid = await bcrypt.compare('123456', demoUser.password);
      assert(isValid === true, 'Existing password for demo user matches original bcrypt hash without reset');
    } else {
      const anyUserWithPw = await prisma.user.findFirst({
        where: { password: { not: null } },
      });
      assert(!!anyUserWithPw, 'User with bcrypt hash present');
    }

    // ── TEST 3: Relational Foreign Key Integrity ──────────────
    console.log('\n▶ TEST 3: Relational Foreign Key Integrity (User -> Roadmap -> Tasks)');
    const sampleRoadmap = await prisma.roadmap.findFirst({
      where: {
        tasks: { some: {} },
      },
      include: {
        user: true,
        career: true,
        tasks: { take: 5 },
      },
    });

    assert(!!sampleRoadmap, 'Roadmap query succeeds');
    assert(!!sampleRoadmap.user && typeof sampleRoadmap.user.email === 'string', 'Roadmap correctly links to User');
    assert(!!sampleRoadmap.career && typeof sampleRoadmap.career.slug === 'string', 'Roadmap correctly links to Career');
    assert(Array.isArray(sampleRoadmap.tasks) && sampleRoadmap.tasks.length > 0, `Roadmap links to RoadmapTasks (Count: ${sampleRoadmap.tasks.length})`);

    // ── TEST 4: Partial Unique Index: Single Active Route ─────
    console.log('\n▶ TEST 4: PostgreSQL Partial Unique Index: Single Active Route Enforcement');
    const testUser = await prisma.user.findFirst({
      where: { role: 'student' },
    });
    const sampleCareer = await prisma.career.findFirst();

    if (testUser && sampleCareer) {
      // Find or create first active roadmap
      const activeRoadmap = await prisma.roadmap.findFirst({
        where: { userId: testUser.id, status: 'active' },
      });

      let testRoadmap1 = null;
      let createdRoadmap1 = false;
      if (!activeRoadmap) {
        testRoadmap1 = await prisma.roadmap.create({
          data: {
            id: `test_rm1_${Date.now()}`,
            userId: testUser.id,
            careerId: sampleCareer.id,
            status: 'active',
          },
        });
        createdRoadmap1 = true;
      }

      // Now attempt to insert a SECOND active roadmap for the exact same user
      let caughtUniqueViolation = false;
      let secondRoadmapId = `test_rm2_${Date.now()}`;
      try {
        await prisma.roadmap.create({
          data: {
            id: secondRoadmapId,
            userId: testUser.id,
            careerId: sampleCareer.id,
            status: 'active',
          },
        });
      } catch (err) {
        caughtUniqueViolation = true;
      }

      assert(
        caughtUniqueViolation === true,
        'PostgreSQL rejected second active roadmap for the same user via partial unique index'
      );

      // Cleanup test roadmap if created
      if (createdRoadmap1 && testRoadmap1) {
        await prisma.roadmap.delete({ where: { id: testRoadmap1.id } }).catch(() => {});
      }
    }

    // ── TEST 5: JSONB Document Structure Preservation ─────────
    console.log('\n▶ TEST 5: JSONB Document Hydration & Parsing');
    const userWithJson = await prisma.user.findFirst({
      where: { skills: { not: null } },
    });

    assert(
      !!userWithJson && (Array.isArray(userWithJson.skills) || typeof userWithJson.skills === 'object'),
      'JSONB columns (skills) parse as native JavaScript arrays/objects'
    );

    console.log('\n============================================================');
    console.log(`📊 Test Summary: ${passedTests} Passed, ${failedTests} Failed`);
    console.log('============================================================\n');

    await prisma.$disconnect();

    if (failedTests > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL SUPABASE MIGRATION VERIFICATION TESTS PASSED 100%!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Verification suite encountered an unexpected error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runVerificationSuite();

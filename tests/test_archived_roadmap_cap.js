/**
 * tests/test_archived_roadmap_cap.js
 *
 * Automated verification test for Archived Roadmap Capping (Item 3):
 * 1. Provisions a test student candidate.
 * 2. Creates 5 abandoned roadmaps with sequential timestamps.
 * 3. Calls enforceArchivedRoadmapCap(userId, 3).
 * 4. Confirms that exactly the latest 3 abandoned roadmaps are preserved.
 * 5. Confirms that the older 2 excess roadmaps and their child tasks were cleanly purged.
 * 6. Cleans up all test candidate rows and roadmaps in finally.
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
require('dotenv').config();

const { prisma, connectPrisma } = require('../server/config/prisma');
const { enforceArchivedRoadmapCap } = require('../server/controllers/roadmapController');

async function runTest() {
  console.log('🧪 Starting Archived Roadmap Cap (Keep Latest 3) Verification Test...\n');

  await connectPrisma();

  const timestamp = Date.now();
  const testUserId = `test_cap_student_${timestamp}`;
  const testUserEmail = `test_cap_student_${timestamp}@example.com`;
  const createdRoadmapIds = [];

  try {
    // 1. Create test student
    const testUser = await prisma.user.create({
      data: {
        id: testUserId,
        name: 'Cap Test Candidate',
        email: testUserEmail,
        password: 'Password123!',
        role: 'student',
        isVerified: true,
      }
    });
    console.log(`✓ Provisioned test user: ${testUser.id} (${testUser.email})`);

    // 2. Fetch or create a test career
    let career = await prisma.career.findFirst({ where: { active: true } });
    if (!career) {
      career = await prisma.career.create({
        data: {
          id: `test_career_${timestamp}`,
          title: 'Full Stack Engineer',
          slug: `test-career-${timestamp}`,
          category: 'engineering',
          shortDescription: 'Full Stack Test Track',
          active: true
        }
      });
    }

    // 3. Create 5 abandoned roadmaps with spaced abandonedAt dates
    console.log('\nCreating 5 sequential abandoned roadmaps...');
    for (let i = 1; i <= 5; i++) {
      const abandonedDate = new Date(Date.now() - (6 - i) * 3600000); // 1 is oldest, 5 is newest
      const rm = await prisma.roadmap.create({
        data: {
          id: `rm_cap_${timestamp}_${i}`,
          userId: testUser.id,
          careerId: career.id,
          status: 'abandoned',
          durationWeeks: 4,
          abandonedAt: abandonedDate,
          careerSnapshot: { title: `Track Variant ${i}` }
        }
      });
      createdRoadmapIds.push(rm.id);

      // Add a dummy task to verify cascade deletion
      await prisma.roadmapTask.create({
        data: {
          id: `task_cap_${timestamp}_${i}`,
          roadmapId: rm.id,
          title: `Task for variant ${i}`,
          description: `Description for task ${i}`,
          weekNumber: 1,
          order: i
        }
      });
    }
    console.log(`✓ Created 5 abandoned roadmaps: [${createdRoadmapIds.join(', ')}]`);

    const initialCount = await prisma.roadmap.count({
      where: { userId: testUser.id, status: 'abandoned' }
    });
    assert.strictEqual(initialCount, 5, 'User should initially have 5 abandoned roadmaps');

    // 4. Call enforceArchivedRoadmapCap to keep only latest 3
    console.log('\nInvoking enforceArchivedRoadmapCap(userId, 3)...');
    const capResult = await enforceArchivedRoadmapCap(testUser.id, 3);
    console.log(`✓ Cap execution returned: purgedCount = ${capResult.purgedCount}, purgedIds = [${capResult.purgedIds.join(', ')}]`);

    assert.strictEqual(capResult.purgedCount, 2, 'Must purge exactly 2 excess roadmaps');
    assert.deepStrictEqual(
      [...capResult.purgedIds].sort(),
      [createdRoadmapIds[0], createdRoadmapIds[1]].sort(),
      'Must purge the oldest roadmaps (1 and 2)'
    );

    // 5. Verify remaining roadmaps in DB
    const remainingRoadmaps = await prisma.roadmap.findMany({
      where: { userId: testUser.id, status: 'abandoned' },
      orderBy: { abandonedAt: 'desc' }
    });

    assert.strictEqual(remainingRoadmaps.length, 3, 'User must have exactly 3 retained archived roadmaps');
    assert.strictEqual(remainingRoadmaps[0].id, createdRoadmapIds[4], 'Newest roadmap (#5) must be preserved');
    assert.strictEqual(remainingRoadmaps[1].id, createdRoadmapIds[3], 'Second newest roadmap (#4) must be preserved');
    assert.strictEqual(remainingRoadmaps[2].id, createdRoadmapIds[2], 'Third newest roadmap (#3) must be preserved');

    // Verify tasks for purged roadmaps were also deleted
    const purgedTasksCount = await prisma.roadmapTask.count({
      where: { roadmapId: { in: [createdRoadmapIds[0], createdRoadmapIds[1]] } }
    });
    assert.strictEqual(purgedTasksCount, 0, 'Associated tasks for purged roadmaps must be 0');

    console.log('\n================================================================');
    console.log('🎉 ARCHIVED ROADMAP CAPPING VERIFICATION PASSED 100%!');
    console.log('================================================================\n');

  } finally {
    // 6. Cleanup in finally
    console.log('🧹 [Cleanup in finally] Purging test user and test roadmaps...');
    try {
      await prisma.roadmapTask.deleteMany({
        where: { roadmapId: { in: createdRoadmapIds } }
      }).catch(() => {});
      await prisma.roadmap.deleteMany({
        where: { userId: testUserId }
      }).catch(() => {});
      await prisma.user.deleteMany({
        where: { id: testUserId }
      }).catch(() => {});
      console.log('✓ Cleanup complete (0 residual test rows).');
    } catch (cleanupErr) {
      console.warn('⚠️ Cleanup warning:', cleanupErr.message);
    }
    await prisma.$disconnect().catch(() => {});
  }
}

runTest().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});

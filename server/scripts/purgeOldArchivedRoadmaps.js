/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * server/scripts/purgeOldArchivedRoadmaps.js
 *
 * Maintenance CLI Script: Caps and purges older archived/abandoned roadmaps.
 * Keeps the latest N (default: 3) archived roadmaps per user and cleans up
 * older excess records along with their associated RoadmapTask and Attempt rows.
 *
 * Usage:
 *   node server/scripts/purgeOldArchivedRoadmaps.js [--dry-run] [--keep 3] [--user <id|email>]
 *
 * Examples:
 *   # Inspect what would be purged across all users without deleting:
 *   node server/scripts/purgeOldArchivedRoadmaps.js --dry-run
 *
 *   # Purge older roadmaps keeping latest 3 for all users:
 *   node server/scripts/purgeOldArchivedRoadmaps.js
 *
 *   # Purge keeping latest 2 for a specific user:
 *   node server/scripts/purgeOldArchivedRoadmaps.js --user demouser@gmail.com --keep 2
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const { prisma, connectPrisma } = require('../config/prisma');

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Roadmap Maintenance Tool — Purge Old Archived Roadmaps
======================================================
Options:
  --dry-run             Simulate without deleting any records
  --keep <number>       Number of latest archived roadmaps to keep per user (default: 3)
  --user <id|email>     Target a single user by ID or email
  --help, -h            Show this help message

Examples:
  node server/scripts/purgeOldArchivedRoadmaps.js --dry-run
  node server/scripts/purgeOldArchivedRoadmaps.js --keep 3
  node server/scripts/purgeOldArchivedRoadmaps.js --user user_123 --dry-run
`);
    process.exit(0);
  }

  const isDryRun = args.includes('--dry-run');
  const keepIndex = args.indexOf('--keep');
  const keepCount = keepIndex !== -1 && args[keepIndex + 1] ? parseInt(args[keepIndex + 1], 10) : 3;

  const userIndex = args.indexOf('--user');
  const targetUserParam = userIndex !== -1 && args[userIndex + 1] ? args[userIndex + 1] : null;

  if (isNaN(keepCount) || keepCount < 1) {
    console.error('❌ Error: --keep must be a positive integer (e.g. --keep 3)');
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🧹 DISHEERA — ARCHIVED ROADMAP PURGE & CAP MAINTENANCE');
  console.log('================================================================');
  console.log(`Mode:       ${isDryRun ? 'DRY-RUN (Simulated, no deletes)' : 'LIVE EXECUTION'}`);
  console.log(`Cap Limit:  Keep latest ${keepCount} archived roadmap(s) per user`);
  if (targetUserParam) {
    console.log(`Target:     Single user filter (${targetUserParam})`);
  } else {
    console.log(`Target:     All users`);
  }
  console.log('----------------------------------------------------------------\n');

  await connectPrisma();

  let targetUserId = null;
  if (targetUserParam) {
    const userDoc = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetUserParam },
          { email: targetUserParam.toLowerCase() }
        ]
      },
      select: { id: true, name: true, email: true }
    });

    if (!userDoc) {
      console.error(`❌ User not found with ID or email: "${targetUserParam}"`);
      await prisma.$disconnect();
      process.exit(1);
    }
    targetUserId = userDoc.id;
    console.log(`Found target user: ${userDoc.name || 'Anonymous'} (${userDoc.email}) [ID: ${userDoc.id}]\n`);
  }

  // 1. Fetch all archived/abandoned roadmaps
  const whereClause = {
    status: { in: ['abandoned', 'archived'] }
  };
  if (targetUserId) {
    whereClause.userId = targetUserId;
  }

  const allArchived = await prisma.roadmap.findMany({
    where: whereClause,
    orderBy: [
      { abandonedAt: 'desc' },
      { updatedAt: 'desc' }
    ],
    select: {
      id: true,
      userId: true,
      careerId: true,
      careerSnapshot: true,
      durationWeeks: true,
      status: true,
      abandonedAt: true,
      startedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (allArchived.length === 0) {
    console.log('✓ No archived or abandoned roadmaps found in the database. Nothing to purge.');
    await prisma.$disconnect();
    return;
  }

  // 2. Group by userId
  const userRoadmapsMap = new Map();
  allArchived.forEach((rm) => {
    if (!userRoadmapsMap.has(rm.userId)) {
      userRoadmapsMap.set(rm.userId, []);
    }
    userRoadmapsMap.get(rm.userId).push(rm);
  });

  console.log(`Found ${allArchived.length} total archived/abandoned roadmap(s) across ${userRoadmapsMap.size} user(s).\n`);

  let totalUsersWithExcess = 0;
  let totalRoadmapsToPurge = 0;
  const purgePlan = [];

  for (const [userId, roadmaps] of userRoadmapsMap.entries()) {
    const userSummary = roadmaps[0].user || { id: userId, email: 'unknown', name: 'Unknown' };
    const totalArchived = roadmaps.length;

    if (totalArchived > keepCount) {
      totalUsersWithExcess++;
      const toKeep = roadmaps.slice(0, keepCount);
      const toPurge = roadmaps.slice(keepCount);
      totalRoadmapsToPurge += toPurge.length;

      purgePlan.push({
        user: userSummary,
        toKeep,
        toPurge
      });

      console.log(`👤 User: ${userSummary.name || 'Unknown'} (${userSummary.email}) [${userId}]`);
      console.log(`   Archived count: ${totalArchived} | Keeping latest ${keepCount}:`);
      toKeep.forEach((k, idx) => {
        const title = k.careerSnapshot?.title || k.careerId || 'Untitled Track';
        const dateStr = k.abandonedAt ? new Date(k.abandonedAt).toISOString().split('T')[0] : 'N/A';
        console.log(`     ✓ [Keep #${idx + 1}] ID: ${k.id} · "${title}" (Abandoned: ${dateStr})`);
      });

      console.log(`   ${isDryRun ? 'Would purge' : 'Purging'} ${toPurge.length} excess roadmap(s):`);
      toPurge.forEach((p, idx) => {
        const title = p.careerSnapshot?.title || p.careerId || 'Untitled Track';
        const dateStr = p.abandonedAt ? new Date(p.abandonedAt).toISOString().split('T')[0] : 'N/A';
        console.log(`     🗑️ [${isDryRun ? 'Dry-Run Purge' : 'Purging'} #${idx + 1}] ID: ${p.id} · "${title}" (Abandoned: ${dateStr})`);
      });
      console.log('');
    }
  }

  if (totalRoadmapsToPurge === 0) {
    console.log(`✓ All users have <= ${keepCount} archived roadmap(s). No excess roadmaps found.`);
    await prisma.$disconnect();
    return;
  }

  console.log('----------------------------------------------------------------');
  console.log(`Summary: ${totalUsersWithExcess} user(s) have excess archived roadmaps.`);
  console.log(`Total roadmaps eligible for purge: ${totalRoadmapsToPurge}`);
  console.log('----------------------------------------------------------------\n');

  if (isDryRun) {
    console.log('ℹ️  DRY-RUN COMPLETED: No records were modified or deleted.');
    console.log('   To execute the actual purge, re-run without the --dry-run flag:');
    console.log(`   node server/scripts/purgeOldArchivedRoadmaps.js --keep ${keepCount}${targetUserParam ? ` --user ${targetUserParam}` : ''}\n`);
    await prisma.$disconnect();
    return;
  }

  // 3. Execute live deletion
  console.log('🚀 Executing live deletion of excess archived roadmaps...');
  let totalDeletedRoadmaps = 0;
  let totalDeletedTasks = 0;
  let totalDeletedAttempts = 0;

  for (const item of purgePlan) {
    const purgeIds = item.toPurge.map((r) => r.id);

    try {
      const delTasks = await prisma.roadmapTask.deleteMany({
        where: { roadmapId: { in: purgeIds } }
      });
      totalDeletedTasks += delTasks.count;

      const delAttempts = await prisma.attempt.deleteMany({
        where: { roadmapId: { in: purgeIds } }
      });
      totalDeletedAttempts += delAttempts.count;

      const delRoadmaps = await prisma.roadmap.deleteMany({
        where: { id: { in: purgeIds } }
      });
      totalDeletedRoadmaps += delRoadmaps.count;

      console.log(`  ✓ Purged ${delRoadmaps.count} roadmap(s) for ${item.user.email} (${delTasks.count} tasks, ${delAttempts.count} attempts).`);
    } catch (err) {
      console.error(`  ❌ Error purging roadmaps for ${item.user.email}:`, err.message);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 PURGE COMPLETE!');
  console.log(`  Roadmaps deleted: ${totalDeletedRoadmaps}`);
  console.log(`  Tasks deleted:    ${totalDeletedTasks}`);
  console.log(`  Attempts deleted: ${totalDeletedAttempts}`);
  console.log('================================================================\n');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('\n💥 Unhandled error in purge script:', err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});

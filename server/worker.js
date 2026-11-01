/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * worker.js — Standalone Background Worker & Automated Maintenance Process
 *
 * Decouples heavy recurring maintenance routines from the main Express HTTP server:
 * 1. 180-Day Skill Currency Ledger validation
 * 2. YouTube Data API v3 cache health check
 * 3. Inactivity & Streak Motivation automated nudge batch dispatcher
 * 4. 24-Hour unverified pending signup purger
 *
 * Usage:
 *   node worker.js              # Runs persistent scheduled background worker
 *   node worker.js --run-now    # Runs all routines once immediately and exits (for cron-job.org / Render Cron)
 *   node worker.js --task=nudges # Runs only inactivity nudges task
 *
 * Disheera Technologies Inc. · High-Performance Enterprise Architecture
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { connectPrisma, prisma } = require('./config/prisma');
const {
  initCron,
  stopCron,
  auditInactivityAndSendNudges,
  cleanupUnverifiedSignups,
  validateSkillCurrency,
  auditYouTubeCache
} = require('./services/cronService');

async function runWorker() {
  const args = process.argv.slice(2);
  const isRunNow = args.includes('--run-now');
  const taskArg = args.find(a => a.startsWith('--task='));
  const targetTask = taskArg ? taskArg.split('=')[1].toLowerCase() : null;

  console.log('============================================================');
  console.log('⚙️  Disheera Standalone Background Worker Engine');
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('============================================================');

  try {
    // 1. Establish Database Connection (Supabase PostgreSQL via Prisma)
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await connectPrisma();
    console.log('✅ Database connection established.');

    // 2. Single-Task Mode
    if (targetTask) {
      console.log(`\n▶ Executing targeted maintenance task: [${targetTask}]...`);
      switch (targetTask) {
        case 'nudges':
        case 'inactivity':
          await auditInactivityAndSendNudges();
          break;
        case 'cleanup':
        case 'signups':
          await cleanupUnverifiedSignups();
          break;
        case 'currency':
        case 'skills':
          await validateSkillCurrency();
          break;
        case 'cache':
        case 'youtube':
          await auditYouTubeCache();
          break;
        default:
          console.error(`❌ Unknown task: "${targetTask}". Valid tasks: nudges, cleanup, currency, cache.`);
          process.exit(1);
      }
      console.log(`✅ Targeted task [${targetTask}] completed successfully.`);
      await prisma.$disconnect();
      process.exit(0);
    }

    // 3. One-Shot Execution Mode (--run-now)
    if (isRunNow) {
      console.log('\n▶ Running one-shot maintenance cycle (--run-now)...');
      console.log('1/4: Checking YouTube Cache health...');
      await auditYouTubeCache();

      console.log('2/4: Auditing 180-day Skill Currency...');
      await validateSkillCurrency();

      console.log('3/4: Purging expired/unverified signups (>24h)...');
      await cleanupUnverifiedSignups();

      console.log('4/4: Scanning student roadmaps & dispatching inactivity nudges...');
      await auditInactivityAndSendNudges();

      console.log('\n✨ One-shot maintenance cycle completed cleanly.');
      await prisma.$disconnect();
      process.exit(0);
    }

    // 4. Persistent Background Worker Mode
    console.log('\n🚀 Starting persistent maintenance schedules...');
    initCron();

    console.log('\nActive Worker Timers:');
    console.log('  • YouTube Cache Audit         : Every 60 minutes');
    console.log('  • Unverified Signups Purge    : Every 6 hours');
    console.log('  • Inactivity & Streak Nudges  : Every 12 hours');
    console.log('  • 180-Day Skill Currency Audit: Every 24 hours');
    console.log('\n🟢 Worker process active and listening. Press Ctrl+C to stop.');

    // Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down worker gracefully...`);
      stopCron();
      try {
        await prisma.$disconnect();
        console.log('👋 Database connection closed. Worker stopped.');
      } catch (err) {
        console.error('Error during shutdown:', err.message);
      }
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    console.error('❌ Fatal error in background worker:', err);
    try {
      await prisma.$disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

runWorker();

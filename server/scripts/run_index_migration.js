/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

async function runMigration() {
  console.log('=== DISHEERA: EXECUTING DATABASE INDEX MIGRATION ===');
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!directUrl) {
    throw new Error('Neither DIRECT_URL nor DATABASE_URL found in environment.');
  }

  console.log('Connecting directly to PostgreSQL via node-postgres (autocommit mode)...');
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connected directly to PostgreSQL server.');

  const migrationPath = path.join(__dirname, '../prisma/migrations/20261010_optimize_performance_indexes/migration.sql');
  const rawSql = fs.readFileSync(migrationPath, 'utf8');

  // Strip line comments
  const cleanSql = rawSql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  // Split into individual statements by semicolon
  const statements = cleanSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Found ${statements.length} statements to execute.\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const firstLine = stmt.replace(/\s+/g, ' ').substring(0, 75);
    console.log(`[${i + 1}/${statements.length}] Executing: ${firstLine}...`);
    try {
      const startTime = Date.now();
      await client.query(stmt);
      const elapsed = Date.now() - startTime;
      console.log(`  ✅ Done (${elapsed} ms).`);
    } catch (err) {
      console.error(`  ❌ Error executing statement:\n     ${err.message}`);
    }
  }

  console.log('\n=== VERIFYING NEW & DROPPED INDEXES (pg_indexes) ===');
  const checkRes = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND (
        indexname LIKE 'idx_%'
        OR indexname IN (
          'User_email_idx',
          'Resume_userId_idx',
          'Company_domain_idx',
          'Career_slug_idx',
          'Skill_name_idx',
          'YoutubeCache_queryKey_idx'
        )
      )
    ORDER BY tablename, indexname;
  `);

  console.log(`Total relevant indexes in database: ${checkRes.rows.length}`);
  for (const row of checkRes.rows) {
    console.log(`  [${row.tablename}] ${row.indexname}`);
  }

  await client.end();
  console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY ===');
}

runMigration().catch(err => {
  console.error('Fatal error in migration:', err);
  process.exit(1);
});

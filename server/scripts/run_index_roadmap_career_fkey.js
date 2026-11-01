/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

async function main() {
  console.log('=== DISHEERA: CREATING COVERING INDEX FOR ROADMAP CAREER_ID FK ===');
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!directUrl) {
    throw new Error('Neither DIRECT_URL nor DATABASE_URL found in environment.');
  }

  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connected to database.');

  const migrationPath = path.join(__dirname, '../prisma/migrations/20261018_index_roadmap_career_fkey/migration.sql');
  const rawSql = fs.readFileSync(migrationPath, 'utf8');

  // Strip line comments
  const cleanSql = rawSql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleanSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    const summary = stmt.replace(/\s+/g, ' ').substring(0, 80);
    process.stdout.write(`Executing: ${summary}... `);
    await client.query(stmt);
    console.log('✅ OK');
  }

  console.log('\n=== VERIFYING ROADMAP FOREIGN KEY COVERING INDEX ===');
  const res = await client.query(`
    SELECT
      c.relname AS table_name,
      i.relname AS index_name,
      pg_get_indexdef(x.indexrelid) AS index_def
    FROM pg_index x
    JOIN pg_class c ON c.oid = x.indrelid
    JOIN pg_class i ON i.oid = x.indexrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
      AND c.relname = 'Roadmap' 
      AND i.relname = 'Roadmap_careerId_idx';
  `);

  if (res.rows.length > 0) {
    console.log('🎉 COVERING INDEX SUCCESSFULLY CREATED AND VERIFIED:');
    console.table(res.rows);
  } else {
    throw new Error('Verification failed: Roadmap_careerId_idx was not found.');
  }

  await client.end();
}

main().catch(err => {
  console.error('\nFatal error executing migration:', err);
  process.exit(1);
});

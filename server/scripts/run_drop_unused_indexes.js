const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

async function runIndexCleanup() {
  console.log('=== DISHEERA: EXECUTING UNUSED INDEX CLEANUP MIGRATION ===');
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!directUrl) {
    throw new Error('Neither DIRECT_URL nor DATABASE_URL found in environment.');
  }

  console.log('Connecting directly to Supabase PostgreSQL...');
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connected to database.');

  const migrationPath = path.join(__dirname, '../prisma/migrations/20261018_remove_unused_indexes/migration.sql');
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

  console.log(`Found ${statements.length} SQL statements to execute.\n`);

  let executed = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const firstLine = stmt.replace(/\s+/g, ' ').substring(0, 85);
    process.stdout.write(`[${i + 1}/${statements.length}] ${firstLine}... `);
    try {
      await client.query(stmt);
      console.log('✅ OK');
      executed++;
    } catch (err) {
      console.log('❌ FAIL');
      console.error(`   Error: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nExecution finished: ${executed} succeeded, ${errors} failed.`);
  if (errors > 0) {
    throw new Error(`${errors} statements failed during migration.`);
  }

  console.log('\n=== VERIFYING REMAINING UNUSED INDEXES (pg_stat_user_indexes) ===');
  const checkRes = await client.query(`
    SELECT
      s.relname AS table_name,
      s.indexrelname AS index_name,
      s.idx_scan,
      i.indisunique AS is_unique,
      i.indisprimary AS is_primary
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.schemaname = 'public'
      AND NOT i.indisunique
      AND NOT i.indisprimary
      AND s.idx_scan = 0
    ORDER BY s.relname, s.indexrelname;
  `);

  if (checkRes.rows.length === 0) {
    console.log('🎉 0 UNUSED INDEXES DETECTED! Supabase database linter 0005 is 100% clean.');
  } else {
    console.warn(`⚠️ Notice: Still found ${checkRes.rows.length} unused indexes:`);
    console.table(checkRes.rows);
  }

  await client.end();
}

runIndexCleanup().catch(err => {
  console.error('\nFatal error executing index cleanup migration:', err);
  process.exit(1);
});

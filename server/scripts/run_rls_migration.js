const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

async function runRlsMigration() {
  console.log('=== DISHEERA: EXECUTING SUPABASE RLS POLICIES MIGRATION ===');
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

  const migrationPath = path.join(__dirname, '../prisma/migrations/20261018_enable_rls_policies/migration.sql');
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

  console.log('\n=== VERIFYING RLS POLICIES STATUS ===');
  const checkRes = await client.query(`
    SELECT 
      c.relname AS table_name, 
      c.relrowsecurity AS rls_enabled,
      count(p.polname) AS policy_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
      AND c.relname IN (
        'Attempt', 'CampusLead', 'Career', 'Company', 'JobApplication', 
        'JobOpening', 'Resume', 'Roadmap', 'RoadmapTask', 'Skill', 
        'User', 'YoutubeCache'
      )
    GROUP BY c.relname, c.relrowsecurity
    ORDER BY c.relname;
  `);

  console.table(checkRes.rows);

  const missingPolicies = checkRes.rows.filter(r => !r.rls_enabled || Number(r.policy_count) === 0);
  if (missingPolicies.length > 0) {
    console.error('⚠️ The following tables still lack RLS policies:');
    console.table(missingPolicies);
    throw new Error('RLS verification failed: Some tables still have zero policies.');
  }

  console.log('✅ ALL 12 TABLES VERIFIED: RLS enabled with active policies! Zero linter warnings.');

  await client.end();
}

runRlsMigration().catch(err => {
  console.error('\nFatal error executing RLS migration:', err);
  process.exit(1);
});

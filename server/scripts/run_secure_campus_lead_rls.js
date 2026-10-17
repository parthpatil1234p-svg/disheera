const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

async function main() {
  console.log('=== DISHEERA: SECURING CAMPUS LEAD RLS INSERT POLICY ===');
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

  const migrationPath = path.join(__dirname, '../prisma/migrations/20261018_secure_campus_lead_rls/migration.sql');
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

  console.log(`Executing ${statements.length} statements...`);
  for (const stmt of statements) {
    const summary = stmt.replace(/\s+/g, ' ').substring(0, 80);
    process.stdout.write(`Executing: ${summary}... `);
    await client.query(stmt);
    console.log('✅ OK');
  }

  console.log('\n=== VERIFYING CAMPUS LEAD POLICIES IN pg_policies ===');
  const res = await client.query(`
    SELECT
      schemaname,
      tablename,
      policyname,
      cmd,
      roles,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'CampusLead';
  `);

  console.table(res.rows);

  const insertPol = res.rows.find(r => r.cmd === 'INSERT');
  if (insertPol && insertPol.with_check && insertPol.with_check !== 'true') {
    console.log('🎉 VERIFICATION SUCCESSFUL: CampusLead INSERT policy is properly constrained!');
    console.log(`WITH CHECK expression: ${insertPol.with_check}`);
  } else {
    throw new Error('Verification failed: WITH CHECK is still permissive or missing.');
  }

  await client.end();
}

main().catch(err => {
  console.error('\nFatal error executing migration:', err);
  process.exit(1);
});

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

async function main() {
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const query = `
    SELECT 
      c.relname AS table_name, 
      c.relrowsecurity AS rls_enabled,
      c.relforcerowsecurity AS rls_forced,
      count(p.polname) AS policy_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
    ORDER BY c.relname;
  `;

  const res = await client.query(query);
  console.log('--- SUPABASE PUBLIC TABLES RLS AUDIT ---');
  console.table(res.rows);

  const policiesQuery = `
    SELECT 
      schemaname, 
      tablename, 
      policyname, 
      permissive, 
      roles, 
      cmd, 
      qual, 
      with_check
    FROM pg_policies
    WHERE schemaname = 'public';
  `;
  const polRes = await client.query(policiesQuery);
  console.log('\n--- EXISTING POLICIES ---');
  console.log('Total Policies:', polRes.rows.length);
  console.table(polRes.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

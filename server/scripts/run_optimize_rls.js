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
  console.log('=== DISHEERA: EXECUTING RLS INITPLAN OPTIMIZATION & POLICY DEDUPLICATION ===');
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

  const migrationPath = path.join(__dirname, '../prisma/migrations/20261018_optimize_rls_initplan_and_deduplicate/migration.sql');
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

  console.log(`Executing ${statements.length} SQL statements...`);
  let count = 0;
  for (const stmt of statements) {
    count++;
    const summary = stmt.replace(/\s+/g, ' ').substring(0, 80);
    process.stdout.write(`[${count}/${statements.length}] ${summary}... `);
    await client.query(stmt);
    console.log('✅ OK');
  }

  console.log('\n=== 1. AUDITING FOR MULTIPLE PERMISSIVE POLICIES ===');
  const dupesRes = await client.query(`
    SELECT
      schemaname,
      tablename,
      roles,
      cmd,
      count(*) AS policy_count,
      array_agg(policyname) AS policies
    FROM (
      SELECT
        schemaname,
        tablename,
        policyname,
        cmd,
        unnest(roles) AS roles
      FROM pg_policies
      WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
    ) p
    GROUP BY schemaname, tablename, roles, cmd
    HAVING count(*) > 1
    ORDER BY tablename, roles, cmd;
  `);

  if (dupesRes.rows.length === 0) {
    console.log('🎉 0 MULTIPLE PERMISSIVE POLICIES FOUND! Supabase database linter 0006 is 100% clean.');
  } else {
    console.warn(`⚠️ Notice: Found ${dupesRes.rows.length} actions with multiple permissive policies:`);
    console.table(dupesRes.rows);
  }

  console.log('\n=== 2. AUDITING FOR UNCACHED auth.uid() CALLS (auth_rls_initplan) ===');
  const initPlanRes = await client.query(`
    SELECT
      schemaname,
      tablename,
      policyname,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual ~* 'auth\\.[a-z_]+\\(\\)' AND NOT qual ~* '\\(select auth\\.[a-z_]+\\(\\)\\)')
        OR (with_check ~* 'auth\\.[a-z_]+\\(\\)' AND NOT with_check ~* '\\(select auth\\.[a-z_]+\\(\\)\\)')
      );
  `);

  if (initPlanRes.rows.length === 0) {
    console.log('🎉 0 UNCACHED auth.*() CALLS FOUND! Supabase database linter 0003 is 100% clean.');
  } else {
    console.warn(`⚠️ Notice: Still found ${initPlanRes.rows.length} policies without InitPlan:`);
    console.table(initPlanRes.rows);
  }

  console.log('\n=== CURRENT PUBLIC RLS POLICIES SUMMARY ===');
  const polCountRes = await client.query(`
    SELECT tablename, count(*) as total_policies
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
    ORDER BY tablename;
  `);
  console.table(polCountRes.rows);

  await client.end();
}

main().catch(err => {
  console.error('\nFatal error executing migration:', err);
  process.exit(1);
});

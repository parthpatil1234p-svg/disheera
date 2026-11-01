/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { prisma } = require('../config/prisma');

async function runDiagnostics() {
  console.log('=== DISHEERA DATABASE PERFORMANCE DIAGNOSTICS ===');
  try {
    // 1. Version
    const versionRes = await prisma.$queryRawUnsafe(`SELECT version()`);
    console.log('\n[1] PostgreSQL Version:', versionRes[0]?.version);

    // 2. Check pg_stat_statements extension
    const extRes = await prisma.$queryRawUnsafe(`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_stat_statements';
    `);
    console.log('\n[2] pg_stat_statements extension installed?:', extRes.length > 0 ? extRes : 'NO');

    if (extRes.length > 0) {
      try {
        const topQueries = await prisma.$queryRawUnsafe(`
          SELECT 
            calls,
            ROUND(total_exec_time::numeric, 2) as total_time_ms,
            ROUND(mean_exec_time::numeric, 2) as mean_time_ms,
            ROUND(max_exec_time::numeric, 2) as max_time_ms,
            rows,
            query
          FROM pg_stat_statements
          ORDER BY total_exec_time DESC
          LIMIT 10;
        `);
        console.log('\n[2.1] Top Application Queries by Calls & Total Execution Time:');
        const appQueries = await prisma.$queryRawUnsafe(`
          SELECT 
            calls,
            ROUND(total_exec_time::numeric, 2) as total_time_ms,
            ROUND(mean_exec_time::numeric, 2) as mean_time_ms,
            ROUND(max_exec_time::numeric, 2) as max_time_ms,
            rows,
            query
          FROM pg_stat_statements
          WHERE query ILIKE '%public."User"%' 
             OR query ILIKE '%public."Roadmap"%' 
             OR query ILIKE '%public."RoadmapTask"%'
             OR query ILIKE '%public."Career"%'
             OR query ILIKE '%public."Skill"%'
             OR query ILIKE '%public."Attempt"%'
             OR query ILIKE '%public."Resume"%'
             OR query ILIKE '%public."JobOpening"%'
             OR query ILIKE '%public."JobApplication"%'
             OR query ILIKE '%public."Company"%'
          ORDER BY total_exec_time DESC
          LIMIT 25;
        `);
        for (const q of appQueries) {
          console.log(`- Calls: ${q.calls} | Total: ${q.total_time_ms}ms | Mean: ${q.mean_time_ms}ms | Max: ${q.max_time_ms}ms | Rows: ${q.rows}`);
          console.log(`  Query: ${q.query.replace(/\s+/g, ' ')}\n`);
        }
      } catch (err) {
        console.warn('Could not query pg_stat_statements view:', err.message);
      }
    } else {
      console.log('Notice: pg_stat_statements is not installed/enabled in pg_extension. Checking if extension is available to create...');
      try {
        const availRes = await prisma.$queryRawUnsafe(`
          SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name = 'pg_stat_statements';
        `);
        console.log('Available extension:', availRes);
      } catch (e) {
        console.log('Cannot check pg_available_extensions:', e.message);
      }
    }
    return;
    console.log('\n[3] Tables & Approximate/Exact Row Counts:');
    const tables = ['User', 'Roadmap', 'RoadmapTask', 'Career', 'Skill', 'Attempt', 'Resume', 'Company', 'JobOpening', 'JobApplication', 'YoutubeCache', 'CampusLead'];
    for (const t of tables) {
      try {
        const cnt = await prisma.$queryRawUnsafe(`SELECT count(*) as count FROM "${t}"`);
        console.log(` - Table "${t}": ${cnt[0].count} rows`);
      } catch (e) {
        console.log(` - Table "${t}": [Error: ${e.message}]`);
      }
    }
    return;

    // 4. Existing Indexes & Usage Statistics
    console.log('\n[4] Existing User Indexes & Usage Count (pg_stat_user_indexes):');
    const indexStats = await prisma.$queryRawUnsafe(`
      SELECT
        relname AS table_name,
        indexrelname AS index_name,
        idx_scan AS number_of_scans,
        idx_tup_read AS tuples_read,
        idx_tup_fetch AS tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
      FROM pg_stat_user_indexes
      ORDER BY relname, number_of_scans DESC;
    `);
    console.table(indexStats);

    // 5. Index Definitions
    console.log('\n[5] Index Definitions (pg_indexes):');
    const indexDefs = await prisma.$queryRawUnsafe(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    for (const idx of indexDefs) {
      console.log(`[${idx.tablename}] ${idx.indexname}: ${idx.indexdef}`);
    }

  } catch (error) {
    console.error('Fatal error during diagnostics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runDiagnostics();

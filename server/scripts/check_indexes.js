/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
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
      s.relname AS table_name,
      s.indexrelname AS index_name,
      s.idx_scan,
      s.idx_tup_read,
      s.idx_tup_fetch,
      pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size,
      i.indisunique AS is_unique,
      i.indisprimary AS is_primary,
      pg_get_indexdef(s.indexrelid) AS index_def
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.schemaname = 'public'
    ORDER BY s.idx_scan ASC, s.relname ASC;
  `;

  const res = await client.query(query);
  console.log('--- ALL PUBLIC USER INDEXES STATS ---');
  console.table(res.rows.map(r => ({
    table: r.table_name,
    index: r.index_name,
    scans: r.idx_scan,
    size: r.index_size,
    unique: r.is_unique,
    primary: r.is_primary
  })));

  const unused = res.rows.filter(r => !r.is_unique && !r.is_primary && Number(r.idx_scan) === 0);
  console.log(`\nFound ${unused.length} non-unique indexes with 0 scans:`);
  for (const u of unused) {
    console.log(`- [${u.table_name}] ${u.index_name} (${u.index_size}) -> ${u.index_def}`);
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

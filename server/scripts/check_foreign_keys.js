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

  // Query adapted from Supabase database linter for 0001_unindexed_foreign_keys
  const query = `
    WITH fk_actions AS (
      SELECT
        c.conrelid,
        c.conname,
        c.confrelid,
        c.conkey,
        c.conrelid::regclass AS table_name,
        c.confrelid::regclass AS referenced_table,
        pg_get_constraintdef(c.oid) AS constraint_def,
        ARRAY_AGG(a.attname ORDER BY u.attposition) AS fkey_columns,
        c.conkey AS fkey_col_nums
      FROM pg_constraint c
      JOIN LATERAL UNNEST(c.conkey) WITH ORDINALITY AS u(attnum, attposition) ON TRUE
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = u.attnum
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE c.contype = 'f' AND n.nspname = 'public'
      GROUP BY c.conrelid, c.conname, c.confrelid, c.conkey, c.oid
    ),
    covering_indexes AS (
      SELECT
        fk.conrelid,
        fk.conname,
        fk.table_name,
        fk.referenced_table,
        fk.constraint_def,
        fk.fkey_columns,
        i.indexrelid::regclass AS index_name,
        i.indkey
      FROM fk_actions fk
      LEFT JOIN pg_index i ON i.indrelid = fk.conrelid
        AND (i.indkey::int2[])[0:cardinality(fk.fkey_col_nums) - 1] = fk.fkey_col_nums
    )
    SELECT
      table_name::text,
      conname AS foreign_key,
      referenced_table::text,
      fkey_columns,
      index_name::text AS covering_index,
      constraint_def
    FROM covering_indexes
    ORDER BY table_name, conname;
  `;

  const res = await client.query(query);
  console.log('--- ALL PUBLIC FOREIGN KEYS AND COVERING INDEXES ---');
  console.table(res.rows);

  const unindexed = res.rows.filter(r => !r.covering_index);
  console.log(`\nFound ${unindexed.length} unindexed foreign keys:`);
  for (const u of unindexed) {
    const cols = Array.isArray(u.fkey_columns) ? u.fkey_columns.join(', ') : u.fkey_columns;
    console.log(`- Table [${u.table_name}], FK [${u.foreign_key}], Columns: [${cols}] -> ${u.constraint_def}`);
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

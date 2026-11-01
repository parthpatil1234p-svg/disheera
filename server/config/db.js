/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * config/db.js — Database Connection Forwarder (Supabase PostgreSQL via Prisma)
 *
 * Disheera has transitioned 100% to Supabase PostgreSQL (0% MongoDB).
 * Forwards legacy database connection calls to connectPrisma().
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { connectPrisma } = require('./prisma');

const connectDB = async () => {
  return connectPrisma();
};

module.exports = connectDB;

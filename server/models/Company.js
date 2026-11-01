/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/Company.js — Pure Prisma ORM Company Model
 *
 * Implements Mongoose-compatible interface for corporate recruiter companies.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel } = require('./prismaBase');

const Company = createPrismaModel('Company', {});

module.exports = Company;

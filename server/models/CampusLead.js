/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/CampusLead.js — Pure Prisma ORM CampusLead Model
 *
 * Implements Mongoose-compatible interface for University TPO partner leads.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel } = require('./prismaBase');

const CampusLead = createPrismaModel('CampusLead', {});

module.exports = CampusLead;

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/Skill.js — Pure Prisma ORM Skill Model
 *
 * Implements Mongoose-compatible interface for skills directory & taxonomy.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel } = require('./prismaBase');

const Skill = createPrismaModel('Skill', {});

module.exports = Skill;

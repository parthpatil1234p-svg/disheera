/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * models/YoutubeCache.js — Pure Prisma ORM YoutubeCache Model
 *
 * Implements Mongoose-compatible interface for cached YouTube video results.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * Disheera Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel } = require('./prismaBase');

const YoutubeCache = createPrismaModel('YoutubeCache', {});

module.exports = YoutubeCache;

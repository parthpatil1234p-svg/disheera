/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * scripts/migrate_roadmaps_active_index.js
 *
 * Migrates roadmaps collection index from single-active-per-user to
 * compound { user: 1, career: 1 } where status: 'active' for Dual Active Roadmaps.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateIndexes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment.');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('✅ Connected.');

    const collection = mongoose.connection.collection('roadmaps');
    const existingIndexes = await collection.indexes();
    console.log('Existing indexes:', existingIndexes.map(i => i.name));

    // 1. Drop old single active index if present
    const oldIndex = existingIndexes.find(i => i.name === 'user_1_single_active_roadmap_unique');
    if (oldIndex) {
      console.log('Dropping old index: user_1_single_active_roadmap_unique...');
      await collection.dropIndex('user_1_single_active_roadmap_unique');
      console.log('✅ Dropped user_1_single_active_roadmap_unique.');
    }

    // 2. Create new compound index for dual active roadmaps if not present
    const hasCompound = existingIndexes.some(i => i.name === 'user_1_career_1' || i.name === 'user_1_career_1_active_roadmap_unique');
    if (!hasCompound) {
      console.log('Creating compound index: user_1_career_1...');
      await collection.createIndex(
        { user: 1, career: 1 },
        {
          name: 'user_1_career_1',
          unique: true,
          partialFilterExpression: { status: 'active' },
        }
      );
      console.log('✅ Created user_1_career_1 successfully.');
    } else {
      console.log('✅ Compound index user_1_career_1 is already active.');
    }

    const updatedIndexes = await collection.indexes();
    console.log('Updated indexes:', updatedIndexes.map(i => i.name));

    await mongoose.disconnect();
    console.log('🏁 Migration finished successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrateIndexes();

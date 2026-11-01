/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * scripts/migrate_resumes.js — Single-Resume Data Migration & Index Builder
 *
 * Scans all existing users in MongoDB:
 * - Creates Resume collection documents for any accounts with existing resumeUrl
 * - Builds and enforces the hard { user: 1 }, { unique: true } index
 * - Verifies zero duplicate records exist across the entire database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Resume = require('../models/Resume');
const { getPublicIdFromUrl } = require('../services/cloudinaryService');

async function migrateResumes() {
  console.log('🔄 Connecting to MongoDB Atlas via connectDB...');
  await connectDB();
  console.log('✔ Connected successfully to database:', mongoose.connection.name);

  try {
    // 1. Ensure indexes on Resume collection
    console.log('\n🛠 Ensuring unique index { user: 1 } on Resume model...');
    await Resume.syncIndexes();
    console.log('✔ Unique index verified.');

    // 2. Find all users with active resumeUrl
    const usersWithResume = await User.find({
      resumeUrl: { $exists: true, $ne: '', $type: 'string' },
    });
    console.log(`\n📋 Found ${usersWithResume.length} user(s) with active resumeUrl in User collection.`);

    let createdCount = 0;
    let existingCount = 0;

    for (const u of usersWithResume) {
      const existing = await Resume.findOne({ user: u._id });
      if (existing) {
        existingCount++;
        console.log(`  [Skip] User ${u.email} already has Resume document (ID: ${existing._id}).`);
      } else {
        const publicId = (u.resumeRecord?.publicId) || getPublicIdFromUrl(u.resumeUrl) || `resume_${u._id}`;
        const newResume = await Resume.create({
          user: u._id,
          originalName: u.resumeRecord?.fileName || 'Student_Resume.pdf',
          fileType: 'application/pdf',
          sizeBytes: u.resumeRecord?.fileSize || 524288,
          fileLocation: u.resumeUrl,
          publicId: publicId,
          version: 1,
          atsScore: u.resumeAnalysis?.atsScore ?? null,
          firstUploadedAt: u.resumeRecord?.firstUploadedDate || u.createdAt || new Date(),
          lastUpdatedAt: u.resumeRecord?.lastUpdatedDate || u.updatedAt || new Date(),
        });
        createdCount++;
        console.log(`  [Created] Migrated resume for user ${u.email} -> Resume ID: ${newResume._id}`);
      }
    }

    const totalResumes = await Resume.countDocuments();
    console.log(`\n🎉 Migration Complete!`);
    console.log(`   - Newly migrated: ${createdCount}`);
    console.log(`   - Already existing: ${existingCount}`);
    console.log(`   - Total Resume collection documents: ${totalResumes}`);

    // Integrity Check: verify no duplicates
    const duplicates = await Resume.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    if (duplicates.length > 0) {
      console.error('❌ INTEGRITY CHECK FAILED: Found duplicate resume records:', duplicates);
    } else {
      console.log('✔ Integrity check passed: 100% strictly 1 resume per account.');
    }
  } catch (err) {
    console.error('❌ Error during resume migration:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database.');
  }
}

migrateResumes();

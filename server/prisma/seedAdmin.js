/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * seedAdmin.js — Super Admin Seeder
 *
 * Hardened Seeding Rules:
 *  1. ZERO hardcoded credentials. ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD
 *     must both be set in .env.
 *  2. Unconditionally aborts with process.exit(1) if either is missing or invalid.
 *  3. Password hashed with bcrypt cost factor 12.
 *  4. Enforces mustChangePassword = true on initial seed.
 *  5. Idempotent: upserts Super Admin account.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { prisma, connectPrisma } = require('../config/prisma');

async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !email.trim()) {
    console.error('\n🛑 [FATAL] ADMIN_SEED_EMAIL is missing or blank in .env. Admin seeding aborted.');
    process.exit(1);
  }

  if (!password || password.trim().length < 8) {
    console.error('\n🛑 [FATAL] ADMIN_SEED_PASSWORD is missing or too short (< 8 chars) in .env. Admin seeding aborted.');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    await connectPrisma();

    console.log(`\n🌱 Seeding Super Admin account (${normalizedEmail})...`);

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.adminUser.upsert({
      where: { email: normalizedEmail },
      update: {
        name: 'Super Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null
      },
      create: {
        name: 'Super Admin',
        email: normalizedEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        mustChangePassword: true,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });

    // Record audit trail
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: 'SYSTEM_SEED',
        targetType: 'USER',
        targetId: admin.id,
        details: { description: 'Super Admin seeded via CLI script' }
      }
    });

    console.log('✅ Super Admin account seeded successfully:');
    console.log(`   ID                  : ${admin.id}`);
    console.log(`   Email               : ${admin.email}`);
    console.log(`   Role                : ${admin.role}`);
    console.log(`   Must Change Password: ${admin.mustChangePassword}`);
    console.log('\n🔒 Security Note: When you first log in, you will be prompted to change your temporary password.\n');
  } catch (err) {
    console.error('❌ [FATAL] Super Admin seeding failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;

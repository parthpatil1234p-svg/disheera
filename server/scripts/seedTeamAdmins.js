/**
 * server/scripts/seedTeamAdmins.js
 *
 * Seeds Co-Founder Admins (Sanika, Suyog, Aditi) into admin_users table
 * with role: ADMIN, mustChangePassword: true, bcrypt cost 12.
 *
 * Disheera Technologies Inc.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');

const team = [
  {
    name: 'Sanika Bodhanwar',
    email: 'sanikabodhanwar10@gmail.com',
    tempPass: 'Sanika@Disheera2026!'
  },
  {
    name: 'Suyog Pawar',
    email: 'pawarsuyog0618@gmail.com',
    tempPass: 'Suyog@Disheera2026!'
  },
  {
    name: 'Aditi Vispute',
    email: 'aditivispute25@gmail.com',
    tempPass: 'Aditi@Disheera2026!'
  }
];

async function seedTeamAdmins() {
  console.log('🚀 Seeding Co-Founders into Disheera Admin System...\n');

  const results = [];

  for (const member of team) {
    const normalizedEmail = member.email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(member.tempPass, 12);

    const admin = await prisma.adminUser.upsert({
      where: { email: normalizedEmail },
      update: {
        name: member.name,
        role: 'ADMIN',
        isActive: true
      },
      create: {
        name: member.name,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePassword: true,
        isActive: true
      }
    });

    results.push({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      tempPass: member.tempPass,
      mustChangePassword: admin.mustChangePassword
    });
  }

  console.log('✅ Co-Founder Admins Seeded Successfully:');
  console.table(results);
}

seedTeamAdmins()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

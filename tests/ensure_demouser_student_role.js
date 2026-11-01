/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { prisma } = require('../server/config/prisma');

async function fixRoles() {
  console.log('--- CHECKING & ENSURING STRICT STUDENT ROLE FOR DEMOUSER ---');

  const bcrypt = require('bcryptjs');
  const crypto = require('crypto');
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const spUser = await prisma.user.findUnique({ where: { email: 'demouser@gmail.com' } });
  if (spUser) {
    console.log('Supabase user role before:', spUser.role, 'isVerified:', spUser.isVerified);
    await prisma.user.update({
      where: { email: 'demouser@gmail.com' },
      data: {
        role: 'student',
        isVerified: true,
        password: hashedPassword,
        hasCompletedSkillVerification: true,
        skills: [
          { name: 'JavaScript', level: 'intermediate', isQuizVerified: true, howVerified: 'skill_check' }
        ],
      }
    });
    console.log('Updated Supabase user role to student, isVerified: true, skill verified, and password reset!');
  } else {
    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Demo Student User',
        email: 'demouser@gmail.com',
        password: hashedPassword,
        role: 'student',
        isVerified: true,
        hasCompletedSkillVerification: true,
        skills: [
          { name: 'JavaScript', level: 'intermediate', isQuizVerified: true, howVerified: 'skill_check' }
        ],
      }
    });
    console.log('Created demouser@gmail.com with role: student, isVerified: true, and verified skill!');
  }

  // Also check if any other student accounts have wrong roles
  const parthUser = await prisma.user.findUnique({ where: { email: 'parthpatil1234p@gmail.com' } });
  if (parthUser) {
    console.log('parthpatil1234p@gmail.com role:', parthUser.role);
  }

  console.log('✅ Demo user role verification complete!');
}

fixRoles().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  process.exit(0);
});

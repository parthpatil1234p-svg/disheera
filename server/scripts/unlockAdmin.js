/**
 * unlockAdmin.js — Emergency Admin Account Unlock CLI Utility
 *
 * Usage:
 *   node server/scripts/unlockAdmin.js <email>
 *   npm run admin:unlock -- <email>
 *
 * Mitigates intentional lockout Denial-of-Service by immediately clearing:
 *   - failedLoginAttempts = 0
 *   - lockedUntil = null
 * and recording an emergency unlock event in admin_audit_logs.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const { prisma, connectPrisma } = require('../config/prisma');

async function unlockAdmin() {
  const email = process.argv[2];

  if (!email || !email.trim()) {
    console.error('\nUsage: node server/scripts/unlockAdmin.js <email>');
    console.error('Example: node server/scripts/unlockAdmin.js admin@disheera.site\n');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    await connectPrisma();

    const admin = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail }
    });

    if (!admin) {
      console.error(`\n❌ Error: No admin account found with email "${normalizedEmail}".\n`);
      process.exit(1);
    }

    const updated = await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });

    // Record audit event
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: 'EMERGENCY_CLI_UNLOCK',
        targetType: 'USER',
        targetId: admin.id,
        details: { description: 'Account lockout cleared via CLI unlock script' }
      }
    });

    console.log(`\n✅ Account unlocked successfully!`);
    console.log(`   Email              : ${updated.email}`);
    console.log(`   Failed Attempts    : ${updated.failedLoginAttempts}`);
    console.log(`   Lockout Timestamp  : ${updated.lockedUntil || 'None (Active)'}`);
    console.log(`   Active Status      : ${updated.isActive}\n`);
  } catch (err) {
    console.error('\n❌ Failed to unlock admin account:', err);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  } finally {
    if (require.main === module) {
      await prisma.$disconnect();
    }
  }
}

if (require.main === module) {
  unlockAdmin();
}

module.exports = unlockAdmin;

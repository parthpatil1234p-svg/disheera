/**
 * config/prisma.js — Supabase PostgreSQL Prisma Client Singleton
 *
 * Provides a cached, pooled PrismaClient instance across hot-reloads and serverless invocations.
 * Disheera · Enterprise Architecture
 */

const { PrismaClient } = require('@prisma/client');

// ── Build hardened pooler URL ──────────────────────────────────
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl) {
  // 1. Transaction Pooler Mode (port 6543): disable prepared statements via pgbouncer=true
  if (dbUrl.includes(':6543') && !dbUrl.includes('pgbouncer=true')) {
    const sep = dbUrl.includes('?') ? '&' : '?';
    dbUrl = `${dbUrl}${sep}pgbouncer=true`;
  }
  // 2. Set safe connection_limit (2 for serverless bursts, 15 for persistent server)
  if (!dbUrl.includes('connection_limit=')) {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const limit = isServerless ? 2 : (process.env.DB_POOL_SIZE || 15);
    const sep = dbUrl.includes('?') ? '&' : '?';
    dbUrl = `${dbUrl}${sep}connection_limit=${limit}`;
  }
}

const prismaOptions = {
  log: ['error', 'warn'],
};
if (dbUrl) {
  prismaOptions.datasources = {
    db: { url: dbUrl },
  };
}

// Global singleton pattern ensures warm serverless invocations and dev reloads reuse connections
const globalForPrisma = global;
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient(prismaOptions);
}
const prisma = globalForPrisma.prisma;

/**
 * Validates connection to Supabase PostgreSQL database
 */
async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log('✅ Supabase PostgreSQL Connected [Prisma ORM]: db.naefjieafxfdzliphaxb.supabase.co');

    // Enforce 1:1 Mobile Uniqueness at database level:
    // Partial unique index ensures non-empty phones are strictly unique across all accounts
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_unique_not_empty" 
        ON public."User" (phone) 
        WHERE phone IS NOT NULL AND phone != '';
      `);
    } catch (idxErr) {
      console.warn('⚠️  Notice verifying User phone unique index:', idxErr.message);
    }

    return prisma;
  } catch (error) {
    console.warn('⚠️  Supabase PostgreSQL Notice:', error.message);
    return null;
  }
}

module.exports = {
  prisma,
  connectPrisma,
};

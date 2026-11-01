/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * maintenanceService.js — Global Website Maintenance Mode Engine
 *
 * Manages platform-wide scheduled maintenance state, custom downtime notices,
 * and time-window scheduling across Vercel serverless and Render persistent worker.
 *
 * Disheera Technologies Inc. · High Availability Infrastructure
 */

const { prisma } = require('../config/prisma');

// In-memory cache for ultra-fast, zero-overhead request interception
let cachedConfig = {
  enabled: false,
  title: "Scheduled System Maintenance",
  message: "We are currently upgrading server infrastructure and applying updates. Disheera will be back online shortly.",
  startTime: "",
  endTime: "",
  expectedDuration: "Approx. 1-2 hours",
  updatedAt: new Date().toISOString(),
  updatedBy: "System Default"
};

let lastSyncTime = 0;
const CACHE_TTL_MS = 15000; // Resync from DB every 15 seconds

async function initMaintenanceTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "key" TEXT PRIMARY KEY,
        "value" JSONB NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedBy" TEXT
      );
    `);
  } catch (err) {
    console.warn('[MaintenanceService] Notice initializing SystemSetting table:', err.message);
  }
}

async function getMaintenanceConfig(forceDb = false) {
  const now = Date.now();
  if (!forceDb && now - lastSyncTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const records = await prisma.$queryRawUnsafe(`
      SELECT "value" FROM "SystemSetting" WHERE "key" = 'maintenance_mode' LIMIT 1
    `);

    if (records && records.length > 0 && records[0].value) {
      cachedConfig = typeof records[0].value === 'string' 
        ? JSON.parse(records[0].value) 
        : records[0].value;
      lastSyncTime = now;
    }
  } catch (err) {
    // If DB is offline or table missing, rely on in-memory state
    console.warn('[MaintenanceService] DB read warning:', err.message);
  }

  return cachedConfig;
}

async function setMaintenanceConfig(updateData, adminIdentifier = 'Admin') {
  await initMaintenanceTable();
  const current = await getMaintenanceConfig(true);

  const updatedBy = updateData.updatedBy || adminIdentifier || 'Admin';
  const newConfig = {
    enabled: typeof updateData.enabled === 'boolean' ? updateData.enabled : current.enabled,
    title: (updateData.title !== undefined ? updateData.title : current.title || 'Scheduled System Maintenance').trim(),
    message: (updateData.message !== undefined ? updateData.message : current.message || 'We are currently performing routine maintenance and bug fixing. We will be back online shortly.').trim(),
    startTime: (updateData.startTime !== undefined ? updateData.startTime : current.startTime || '').trim(),
    endTime: (updateData.endTime !== undefined ? updateData.endTime : current.endTime || '').trim(),
    expectedDuration: (updateData.expectedDuration !== undefined ? updateData.expectedDuration : current.expectedDuration || '').trim(),
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy
  };

  try {
    const jsonPayload = JSON.stringify(newConfig);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "SystemSetting" ("key", "value", "updatedAt", "updatedBy")
      VALUES ('maintenance_mode', $1::jsonb, NOW(), $2)
      ON CONFLICT ("key") DO UPDATE
      SET "value" = $1::jsonb, "updatedAt" = NOW(), "updatedBy" = $2
    `, jsonPayload, updatedBy);
  } catch (dbErr) {
    console.warn('[MaintenanceService] Notice persisting to DB:', dbErr.message);
  }

  cachedConfig = newConfig;
  lastSyncTime = Date.now();

  return cachedConfig;
}

function isMaintenanceActiveSync() {
  return cachedConfig.enabled === true;
}

module.exports = {
  getMaintenanceConfig,
  setMaintenanceConfig,
  isMaintenanceActiveSync,
  initMaintenanceTable
};

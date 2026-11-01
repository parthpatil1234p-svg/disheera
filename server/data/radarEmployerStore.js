/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * radarEmployerStore.js — Industrial Proximity Radar Employer Storage Engine
 *
 * Persists additions, edits, and soft-disables of regional employers to PostgreSQL
 * (model: RadarEmployer / table: radar_employers) while merging with base regionalCompaniesData.
 * Features resilient in-memory caching and graceful pre-migration fallback.
 *
 * Disheera · Enterprise Administration Service
 */

const { prisma } = require('../config/prisma');
const baseCompanies = require('./regionalCompaniesData');

// In-memory cache structures for high-speed synchronous access
const modifiedBaseMap = new Map();
const customEmployersMap = new Map();
let isDatabaseSynced = false;
let isTableAvailable = null; // null: unknown, true: available in DB, false: pending migration

/**
 * Normalizes an employer object to ensure consistent field types
 */
function normalizeEmployer(data, isBase = false) {
  return {
    id: String(data.id),
    name: String(data.name || '').trim(),
    cluster: String(data.cluster || '').trim(),
    clusterGroup: data.clusterGroup ? String(data.clusterGroup).trim().toLowerCase() : null,
    city: String(data.city || '').trim(),
    state: String(data.state || '').trim(),
    latitude: Number(data.latitude) || 0,
    longitude: Number(data.longitude) || 0,
    distanceKm: data.distanceKm != null ? Number(data.distanceKm) : 0,
    industry: String(data.industry || '').trim(),
    website: data.website ? String(data.website).trim() : '',
    openingsCount: typeof data.openingsCount === 'number' ? Math.max(0, data.openingsCount) : 0,
    topRoles: Array.isArray(data.topRoles) ? data.topRoles : [],
    requiredSkills: Array.isArray(data.requiredSkills) ? data.requiredSkills : [],
    verifiedPartner: Boolean(data.verifiedPartner),
    hiringFresher: Boolean(data.hiringFresher),
    internshipOffered: Boolean(data.internshipOffered),
    campusDriveActive: Boolean(data.campusDriveActive),
    isBaseEmployer: Boolean(isBase || data.isBaseEmployer),
    isActive: data.isActive !== false,
    addedBy: data.addedBy || null,
    updatedBy: data.updatedBy || null,
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString()
  };
}

/**
 * Asynchronously synchronizes employer overrides and custom employers from PostgreSQL
 */
async function syncFromDatabase() {
  try {
    if (!prisma || !prisma.radarEmployer) {
      isTableAvailable = false;
      return false;
    }
    const dbRows = await prisma.radarEmployer.findMany();
    isTableAvailable = true;
    if (Array.isArray(dbRows)) {
      modifiedBaseMap.clear();
      customEmployersMap.clear();

      for (const row of dbRows) {
        const isBase = baseCompanies.some(c => c.id === row.id) || Boolean(row.isBaseEmployer);
        const normalized = normalizeEmployer(row, isBase);
        if (isBase) {
          modifiedBaseMap.set(normalized.id, normalized);
        } else {
          customEmployersMap.set(normalized.id, normalized);
        }
      }
      isDatabaseSynced = true;
      return true;
    }
  } catch (err) {
    isTableAvailable = false;
    // Graceful notice if table has not been created yet by administrator migration
    if (!isDatabaseSynced) {
      console.log('ℹ️ [radarEmployerStore] PostgreSQL radar_employers table pending migration. Operating in resilient memory mode.');
    }
  }
  return false;
}

// Trigger initial async sync on module load
syncFromDatabase().catch(() => {});

/**
 * Returns complete merged employer list
 * @param {boolean} includeDisabled - whether to include soft-disabled employers
 */
function getAllEmployers(includeDisabled = true) {
  const merged = baseCompanies.map(c => {
    if (modifiedBaseMap.has(c.id)) {
      return { ...c, ...modifiedBaseMap.get(c.id) };
    }
    return { ...c, isActive: c.isActive !== false, isBaseEmployer: true };
  });

  const customList = Array.from(customEmployersMap.values());
  const all = [...merged, ...customList];

  if (!includeDisabled) {
    return all.filter(c => c.isActive !== false);
  }

  return all;
}

/**
 * Returns a single employer by ID from base or custom additions
 */
function getEmployerById(id) {
  if (!id) return null;
  if (customEmployersMap.has(id)) {
    return customEmployersMap.get(id);
  }
  if (modifiedBaseMap.has(id)) {
    const base = baseCompanies.find(c => c.id === id) || {};
    return { ...base, ...modifiedBaseMap.get(id) };
  }
  const base = baseCompanies.find(c => c.id === id);
  if (base) {
    return { ...base, isActive: base.isActive !== false, isBaseEmployer: true };
  }
  return null;
}

/**
 * Persists employer data to in-memory store and PostgreSQL database
 */
function upsertEmployer(employerData) {
  if (!employerData || !employerData.id) return null;

  const isBase = baseCompanies.some(c => c.id === employerData.id);
  const existing = getEmployerById(employerData.id) || {};
  const merged = normalizeEmployer({ ...existing, ...employerData, updatedAt: new Date().toISOString() }, isBase);

  if (isBase) {
    modifiedBaseMap.set(merged.id, merged);
  } else {
    customEmployersMap.set(merged.id, merged);
  }

  // Asynchronously persist to PostgreSQL when table is available
  if (isTableAvailable && prisma && prisma.radarEmployer) {
    prisma.radarEmployer.upsert({
      where: { id: merged.id },
      create: {
        id: merged.id,
        name: merged.name,
        cluster: merged.cluster,
        clusterGroup: merged.clusterGroup,
        city: merged.city,
        state: merged.state,
        latitude: merged.latitude,
        longitude: merged.longitude,
        distanceKm: merged.distanceKm,
        industry: merged.industry,
        website: merged.website,
        openingsCount: merged.openingsCount,
        topRoles: merged.topRoles,
        requiredSkills: merged.requiredSkills,
        verifiedPartner: merged.verifiedPartner,
        hiringFresher: merged.hiringFresher,
        internshipOffered: merged.internshipOffered,
        campusDriveActive: merged.campusDriveActive,
        isBaseEmployer: merged.isBaseEmployer,
        isActive: merged.isActive,
        addedBy: merged.addedBy,
        updatedBy: merged.updatedBy
      },
      update: {
        name: merged.name,
        cluster: merged.cluster,
        clusterGroup: merged.clusterGroup,
        city: merged.city,
        state: merged.state,
        latitude: merged.latitude,
        longitude: merged.longitude,
        distanceKm: merged.distanceKm,
        industry: merged.industry,
        website: merged.website,
        openingsCount: merged.openingsCount,
        topRoles: merged.topRoles,
        requiredSkills: merged.requiredSkills,
        verifiedPartner: merged.verifiedPartner,
        hiringFresher: merged.hiringFresher,
        internshipOffered: merged.internshipOffered,
        campusDriveActive: merged.campusDriveActive,
        isActive: merged.isActive,
        updatedBy: merged.updatedBy
      }
    }).catch(err => {
      // Non-fatal if table pending migration
    });
  }

  return merged;
}

/**
 * Soft-disables an employer
 */
function disableEmployer(id) {
  return upsertEmployer({ id, isActive: false });
}

/**
 * Re-enables an employer
 */
function enableEmployer(id) {
  return upsertEmployer({ id, isActive: true });
}

/**
 * Removes a custom employer or resets a modified base employer
 */
function removeEmployer(id) {
  if (!id) return;
  customEmployersMap.delete(id);
  modifiedBaseMap.delete(id);

  if (isTableAvailable && prisma && prisma.radarEmployer) {
    prisma.radarEmployer.delete({
      where: { id }
    }).catch(() => {});
  }
}

/**
 * Resets in-memory overrides (for testing)
 */
function resetOverrides() {
  modifiedBaseMap.clear();
  customEmployersMap.clear();
}

// Async aliases for modern promise-based pipelines
async function getAllEmployersAsync(includeDisabled = true) {
  await syncFromDatabase();
  return getAllEmployers(includeDisabled);
}

async function getEmployerByIdAsync(id) {
  await syncFromDatabase();
  return getEmployerById(id);
}

async function upsertEmployerAsync(employerData) {
  const result = upsertEmployer(employerData);
  if (isTableAvailable && prisma && prisma.radarEmployer) {
    try {
      await prisma.radarEmployer.upsert({
        where: { id: result.id },
        create: {
          id: result.id,
          name: result.name,
          cluster: result.cluster,
          clusterGroup: result.clusterGroup,
          city: result.city,
          state: result.state,
          latitude: result.latitude,
          longitude: result.longitude,
          distanceKm: result.distanceKm,
          industry: result.industry,
          website: result.website,
          openingsCount: result.openingsCount,
          topRoles: result.topRoles,
          requiredSkills: result.requiredSkills,
          verifiedPartner: result.verifiedPartner,
          hiringFresher: result.hiringFresher,
          internshipOffered: result.internshipOffered,
          campusDriveActive: result.campusDriveActive,
          isBaseEmployer: result.isBaseEmployer,
          isActive: result.isActive,
          addedBy: result.addedBy,
          updatedBy: result.updatedBy
        },
        update: {
          name: result.name,
          cluster: result.cluster,
          clusterGroup: result.clusterGroup,
          city: result.city,
          state: result.state,
          latitude: result.latitude,
          longitude: result.longitude,
          distanceKm: result.distanceKm,
          industry: result.industry,
          website: result.website,
          openingsCount: result.openingsCount,
          topRoles: result.topRoles,
          requiredSkills: result.requiredSkills,
          verifiedPartner: result.verifiedPartner,
          hiringFresher: result.hiringFresher,
          internshipOffered: result.internshipOffered,
          campusDriveActive: result.campusDriveActive,
          isActive: result.isActive,
          updatedBy: result.updatedBy
        }
      });
    } catch (_) {}
  }
  return result;
}

module.exports = {
  getAllEmployers,
  getEmployerById,
  upsertEmployer,
  disableEmployer,
  enableEmployer,
  removeEmployer,
  resetOverrides,
  syncFromDatabase,
  getAllEmployersAsync,
  getEmployerByIdAsync,
  upsertEmployerAsync
};

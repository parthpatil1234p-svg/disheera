/**
 * adminRadarController.js — Industrial Proximity Radar Administration (Plan 44)
 *
 * Full lifecycle management of 60+ regional & pan-India industrial employers.
 * Strict coordinate validation (-90..90, -180..180), soft-disable, and before/after audit tracking.
 * Disheera · Enterprise Administration Service
 */

const { prisma } = require('../config/prisma');
const radarStore = require('../data/radarEmployerStore');

/**
 * GET /api/admin/radar/employers
 * Returns paginated, searchable regional employers with cluster tags and GPS coordinates
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function listEmployers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const { search, cluster, clusterGroup, status } = req.query;

    let employers = radarStore.getAllEmployers(true);

    // Filter by status (active vs disabled)
    if (status === 'active') {
      employers = employers.filter(e => e.isActive !== false);
    } else if (status === 'disabled') {
      employers = employers.filter(e => e.isActive === false);
    }

    // Filter by cluster
    if (cluster && cluster.trim()) {
      const c = cluster.trim().toLowerCase();
      employers = employers.filter(e => e.cluster && e.cluster.toLowerCase().includes(c));
    }

    // Filter by clusterGroup
    if (clusterGroup && clusterGroup.trim()) {
      const cg = clusterGroup.trim().toLowerCase();
      employers = employers.filter(e => e.clusterGroup && e.clusterGroup.toLowerCase() === cg);
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      employers = employers.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.city && e.city.toLowerCase().includes(q)) ||
        (e.industry && e.industry.toLowerCase().includes(q)) ||
        (e.cluster && e.cluster.toLowerCase().includes(q)) ||
        (Array.isArray(e.requiredSkills) && e.requiredSkills.some(s => s.toLowerCase().includes(q))) ||
        (Array.isArray(e.topRoles) && e.topRoles.some(r => r.toLowerCase().includes(q)))
      );
    }

    const total = employers.length;
    const paginated = employers.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      success: true,
      employers: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[AdminRadarController.listEmployers Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve industrial radar employers.'
    });
  }
}

/**
 * GET /api/admin/radar/employers/:id
 * Returns single employer details
 * Roles: MODERATOR, ADMIN, SUPER_ADMIN
 */
async function getEmployer(req, res) {
  try {
    const { id } = req.params;
    const employer = radarStore.getEmployerById(id);

    if (!employer) {
      return res.status(404).json({
        success: false,
        code: 'EMPLOYER_NOT_FOUND',
        message: `Employer with ID ${id} not found.`
      });
    }

    return res.status(200).json({
      success: true,
      employer
    });
  } catch (error) {
    console.error('[AdminRadarController.getEmployer Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employer details.'
    });
  }
}

/**
 * POST /api/admin/radar/employers
 * Creates a new regional industrial employer with strict GPS coordinate validation
 * Roles: ADMIN, SUPER_ADMIN
 */
async function addEmployer(req, res) {
  try {
    // Strict input validation: reject unknown fields
    const allowedKeys = [
      'name', 'cluster', 'clusterGroup', 'city', 'state', 'latitude', 'longitude',
      'industry', 'website', 'openingsCount', 'topRoles', 'requiredSkills',
      'verifiedPartner', 'hiringFresher', 'internshipOffered', 'campusDriveActive'
    ];
    const extraKeys = Object.keys(req.body).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'UNKNOWN_FIELDS',
        message: `Unknown fields not permitted: ${extraKeys.join(', ')}`
      });
    }

    const {
      name, cluster, clusterGroup, city, state, latitude, longitude,
      industry, website, openingsCount, topRoles, requiredSkills,
      verifiedPartner, hiringFresher, internshipOffered, campusDriveActive
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_NAME',
        message: 'Employer name is required (2-100 characters).'
      });
    }

    if (!cluster || typeof cluster !== 'string' || cluster.trim().length < 2 || cluster.trim().length > 100) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_CLUSTER',
        message: 'Industrial cluster name is required (2-100 characters).'
      });
    }

    if (!city || typeof city !== 'string' || city.trim().length < 2 || city.trim().length > 50) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_CITY',
        message: 'City is required (2-50 characters).'
      });
    }

    if (!state || typeof state !== 'string' || state.trim().length < 2 || state.trim().length > 50) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATE',
        message: 'State is required (2-50 characters).'
      });
    }

    if (latitude == null || typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_LATITUDE',
        message: 'Latitude must be a valid number between -90 and 90 degrees.'
      });
    }

    if (longitude == null || typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_LONGITUDE',
        message: 'Longitude must be a valid number between -180 and 180 degrees.'
      });
    }

    if (!industry || typeof industry !== 'string' || industry.trim().length < 2 || industry.trim().length > 150) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INDUSTRY',
        message: 'Industry sector is required (2-150 characters).'
      });
    }

    if (website && (typeof website !== 'string' || website.trim().length > 200)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_WEBSITE',
        message: 'Website URL cannot exceed 200 characters.'
      });
    }

    const cleanName = name.trim();
    const idSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = `${idSlug}-${city.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;

    const existing = radarStore.getEmployerById(id);
    if (existing) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_EMPLOYER',
        message: `Employer with generated ID "${id}" already exists.`
      });
    }

    const newEmployer = {
      id,
      name: cleanName,
      cluster: cluster.trim(),
      clusterGroup: clusterGroup ? clusterGroup.trim().toLowerCase() : 'pan_india',
      city: city.trim(),
      state: state.trim(),
      latitude,
      longitude,
      distanceKm: 0,
      industry: industry.trim(),
      website: website ? website.trim() : '',
      openingsCount: typeof openingsCount === 'number' ? Math.max(0, openingsCount) : 5,
      topRoles: Array.isArray(topRoles) ? topRoles.slice(0, 20).map(r => String(r).trim().slice(0, 100)) : [],
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.slice(0, 30).map(s => String(s).trim().slice(0, 50)) : [],
      verifiedPartner: Boolean(verifiedPartner),
      hiringFresher: Boolean(hiringFresher),
      internshipOffered: Boolean(internshipOffered),
      campusDriveActive: Boolean(campusDriveActive),
      isActive: true,
      addedBy: req.admin.email
    };

    const saved = radarStore.upsertEmployer(newEmployer);

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'RADAR_EMPLOYER_ADD',
        targetType: 'RADAR',
        targetId: id,
        details: {
          employerId: id,
          before: null,
          after: saved
        },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(201).json({
      success: true,
      message: `Industrial employer "${saved.name}" successfully added to Proximity Radar.`,
      employer: saved
    });
  } catch (error) {
    console.error('[AdminRadarController.addEmployer Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add employer to proximity radar.'
    });
  }
}

/**
 * PATCH /api/admin/radar/employers/:id
 * Updates employer metadata or coordinates, or soft-disables
 * Roles: ADMIN, SUPER_ADMIN
 */
async function updateEmployer(req, res) {
  try {
    const { id } = req.params;

    const allowedKeys = [
      'name', 'cluster', 'clusterGroup', 'city', 'state', 'latitude', 'longitude',
      'industry', 'website', 'openingsCount', 'topRoles', 'requiredSkills',
      'verifiedPartner', 'hiringFresher', 'internshipOffered', 'campusDriveActive', 'isActive'
    ];
    const extraKeys = Object.keys(req.body).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'UNKNOWN_FIELDS',
        message: `Unknown fields not permitted: ${extraKeys.join(', ')}`
      });
    }

    const beforeEmployer = radarStore.getEmployerById(id);
    if (!beforeEmployer) {
      return res.status(404).json({
        success: false,
        code: 'EMPLOYER_NOT_FOUND',
        message: `Employer with ID ${id} not found.`
      });
    }

    const updates = { id };
    const {
      name, cluster, clusterGroup, city, state, latitude, longitude,
      industry, website, openingsCount, topRoles, requiredSkills,
      verifiedPartner, hiringFresher, internshipOffered, campusDriveActive, isActive
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).json({ success: false, code: 'INVALID_NAME', message: 'Name must be 2-100 characters.' });
      }
      updates.name = name.trim();
    }

    if (cluster !== undefined) {
      if (typeof cluster !== 'string' || cluster.trim().length < 2 || cluster.trim().length > 100) {
        return res.status(400).json({ success: false, code: 'INVALID_CLUSTER', message: 'Cluster must be 2-100 characters.' });
      }
      updates.cluster = cluster.trim();
    }

    if (clusterGroup !== undefined) {
      updates.clusterGroup = String(clusterGroup).trim().toLowerCase();
    }

    if (city !== undefined) {
      if (typeof city !== 'string' || city.trim().length < 2 || city.trim().length > 50) {
        return res.status(400).json({ success: false, code: 'INVALID_CITY', message: 'City must be 2-50 characters.' });
      }
      updates.city = city.trim();
    }

    if (state !== undefined) {
      if (typeof state !== 'string' || state.trim().length < 2 || state.trim().length > 50) {
        return res.status(400).json({ success: false, code: 'INVALID_STATE', message: 'State must be 2-50 characters.' });
      }
      updates.state = state.trim();
    }

    if (latitude !== undefined) {
      if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
        return res.status(400).json({ success: false, code: 'INVALID_LATITUDE', message: 'Latitude must be between -90 and 90.' });
      }
      updates.latitude = latitude;
    }

    if (longitude !== undefined) {
      if (typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
        return res.status(400).json({ success: false, code: 'INVALID_LONGITUDE', message: 'Longitude must be between -180 and 180.' });
      }
      updates.longitude = longitude;
    }

    if (industry !== undefined) {
      if (typeof industry !== 'string' || industry.trim().length < 2 || industry.trim().length > 150) {
        return res.status(400).json({ success: false, code: 'INVALID_INDUSTRY', message: 'Industry must be 2-150 characters.' });
      }
      updates.industry = industry.trim();
    }

    if (website !== undefined) {
      updates.website = String(website).trim().slice(0, 200);
    }

    if (openingsCount !== undefined) {
      updates.openingsCount = typeof openingsCount === 'number' ? Math.max(0, openingsCount) : 0;
    }

    if (topRoles !== undefined) {
      updates.topRoles = Array.isArray(topRoles) ? topRoles.slice(0, 20).map(r => String(r).trim().slice(0, 100)) : [];
    }

    if (requiredSkills !== undefined) {
      updates.requiredSkills = Array.isArray(requiredSkills) ? requiredSkills.slice(0, 30).map(s => String(s).trim().slice(0, 50)) : [];
    }

    if (verifiedPartner !== undefined) updates.verifiedPartner = Boolean(verifiedPartner);
    if (hiringFresher !== undefined) updates.hiringFresher = Boolean(hiringFresher);
    if (internshipOffered !== undefined) updates.internshipOffered = Boolean(internshipOffered);
    if (campusDriveActive !== undefined) updates.campusDriveActive = Boolean(campusDriveActive);

    if (isActive !== undefined) {
      updates.isActive = Boolean(isActive);
    }

    updates.updatedBy = req.admin.email;

    const afterEmployer = radarStore.upsertEmployer(updates);

    let action = 'RADAR_EMPLOYER_UPDATE';
    if (beforeEmployer.isActive !== afterEmployer.isActive) {
      action = afterEmployer.isActive ? 'RADAR_EMPLOYER_ENABLE' : 'RADAR_EMPLOYER_DISABLE';
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action,
        targetType: 'RADAR',
        targetId: id,
        details: {
          employerId: id,
          before: beforeEmployer,
          after: afterEmployer
        },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(200).json({
      success: true,
      message: `Employer "${afterEmployer.name}" successfully updated.`,
      employer: afterEmployer
    });
  } catch (error) {
    console.error('[AdminRadarController.updateEmployer Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update employer.'
    });
  }
}

/**
 * DELETE /api/admin/radar/employers/:id
 * Soft-disables employer from proximity radar
 * Roles: ADMIN, SUPER_ADMIN
 */
async function deleteEmployer(req, res) {
  try {
    const { id } = req.params;
    const isPermanent = req.query.permanent === 'true';

    const beforeEmployer = radarStore.getEmployerById(id);
    if (!beforeEmployer) {
      return res.status(404).json({
        success: false,
        code: 'EMPLOYER_NOT_FOUND',
        message: `Employer with ID ${id} not found.`
      });
    }

    if (isPermanent) {
      if (req.admin.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Permanent deletion requires SUPER_ADMIN role. Consider soft-disabling instead.'
        });
      }

      radarStore.removeEmployer(id);

      await prisma.adminAuditLog.create({
        data: {
          adminId: req.admin.id,
          adminEmail: req.admin.email,
          action: 'RADAR_EMPLOYER_DELETE_PERMANENT',
          targetType: 'RADAR',
          targetId: id,
          details: {
            employerId: id,
            before: beforeEmployer,
            after: null
          },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        }
      });

      return res.status(200).json({
        success: true,
        message: `Employer "${beforeEmployer.name}" permanently purged from radar.`
      });
    }

    const disabledEmployer = radarStore.disableEmployer(id);

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'RADAR_EMPLOYER_DISABLE',
        targetType: 'RADAR',
        targetId: id,
        details: {
          employerId: id,
          before: beforeEmployer,
          after: disabledEmployer
        },
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      }
    });

    return res.status(200).json({
      success: true,
      message: `Employer "${beforeEmployer.name}" has been soft-disabled from live radar.`,
      employer: disabledEmployer
    });
  } catch (error) {
    console.error('[AdminRadarController.deleteEmployer Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to disable employer.'
    });
  }
}

module.exports = {
  listEmployers,
  getEmployer,
  addEmployer,
  updateEmployer,
  deleteEmployer
};

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * radarView.js — Industrial Proximity Radar Employer Management Module (Plan 44)
 *
 * Full lifecycle management of 60+ verified employers across industrial hubs.
 * Real-time coordinate checks (-90..90, -180..180), cluster tagging, and soft-disabling.
 * Disheera · Enterprise Administration Service
 */

let radarCurrentPage = 1;
let radarSearchTimeout = null;

async function loadEmployers(page = 1) {
  radarCurrentPage = page;
  const tbody = document.getElementById('radarTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Retrieving industrial employers...</td></tr>';

  try {
    const search = document.getElementById('radarSearchInput')?.value || '';
    const cluster = document.getElementById('radarClusterFilter')?.value || '';
    const status = document.getElementById('radarStatusFilter')?.value || 'all';

    const params = new URLSearchParams({
      page,
      limit: 12,
      search,
      cluster,
      status
    });

    const res = await adminFetch(`/api/admin/radar/employers?${params.toString()}`);
    if (res.success) {
      renderEmployersTable(res.employers, res.pagination);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-rose);">${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderEmployersTable(employers, pagination) {
  const tbody = document.getElementById('radarTableBody');
  if (!tbody) return;

  if (!employers || employers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No employers found matching current criteria.</td></tr>';
    renderRadarPagination(pagination);
    return;
  }

  tbody.innerHTML = employers.map(e => {
    const statusBadge = e.isActive !== false
      ? '<span class="badge badge-emerald">Active</span>'
      : '<span class="badge badge-rose">Disabled</span>';

    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(e.name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(e.city)}, ${escapeHtml(e.state)}</div>
        </td>
        <td><span class="badge badge-cyan">${escapeHtml(e.cluster)}</span></td>
        <td><span class="badge badge-muted">${escapeHtml(e.clusterGroup || 'Pan-India')}</span></td>
        <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-indigo);">
          ${escapeHtml(String(e.latitude))}, ${escapeHtml(String(e.longitude))}
        </td>
        <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(e.industry)}
        </td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
            <button class="btn-action" onclick="toggleEmployerActive('${escapeHtml(e.id)}', ${e.isActive !== false})" title="${e.isActive !== false ? 'Disable from Radar' : 'Enable on Radar'}">
              ${e.isActive !== false ? '<i class="bi bi-pause-fill"></i> Disable' : '<i class="bi bi-play-fill"></i> Enable'}
            </button>
            <button class="btn-action" onclick="openEditEmployerModal('${escapeHtml(e.id)}')" title="Edit Employer">
              <i class="bi bi-pencil-fill"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderRadarPagination(pagination);
}

function renderRadarPagination(pagination) {
  const container = document.getElementById('radarPagination');
  if (!container || !pagination) return;

  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) {
    container.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">Total Employers: ${escapeHtml(String(total))}</span>`;
    return;
  }

  container.innerHTML = `
    <span style="font-size: 0.8rem; color: var(--text-muted);">Page ${escapeHtml(String(page))} of ${escapeHtml(String(totalPages))} (${escapeHtml(String(total))} employers)</span>
    <div style="display: flex; gap: 0.5rem;">
      <button class="btn-action" ${page <= 1 ? 'disabled style="opacity: 0.5;"' : ''} onclick="loadEmployers(${page - 1})">Previous</button>
      <button class="btn-action" ${page >= totalPages ? 'disabled style="opacity: 0.5;"' : ''} onclick="loadEmployers(${page + 1})">Next</button>
    </div>
  `;
}

function openAddEmployerModal() {
  document.getElementById('addEmpName').value = '';
  document.getElementById('addEmpCluster').value = '';
  document.getElementById('addEmpClusterGroup').value = 'khandesh';
  document.getElementById('addEmpCity').value = '';
  document.getElementById('addEmpState').value = 'Maharashtra';
  document.getElementById('addEmpLat').value = '';
  document.getElementById('addEmpLng').value = '';
  document.getElementById('addEmpIndustry').value = '';
  document.getElementById('addEmpWebsite').value = '';
  document.getElementById('addEmpOpenings').value = '5';
  document.getElementById('addEmpRoles').value = '';
  document.getElementById('addEmpSkills').value = '';
  openModal('addEmployerModal');
}

async function submitAddEmployer() {
  const name = document.getElementById('addEmpName').value.trim();
  const cluster = document.getElementById('addEmpCluster').value.trim();
  const clusterGroup = document.getElementById('addEmpClusterGroup').value;
  const city = document.getElementById('addEmpCity').value.trim();
  const state = document.getElementById('addEmpState').value.trim();
  const latStr = document.getElementById('addEmpLat').value.trim();
  const lngStr = document.getElementById('addEmpLng').value.trim();
  const industry = document.getElementById('addEmpIndustry').value.trim();
  const website = document.getElementById('addEmpWebsite').value.trim();
  const openings = parseInt(document.getElementById('addEmpOpenings').value, 10) || 5;
  const rolesStr = document.getElementById('addEmpRoles').value.trim();
  const skillsStr = document.getElementById('addEmpSkills').value.trim();

  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lngStr);

  if (!name || !cluster || !city || !state || isNaN(latitude) || isNaN(longitude) || !industry) {
    showToast('Please fill in all required fields including valid GPS numbers.', 'error');
    return;
  }

  if (latitude < -90 || latitude > 90) {
    showToast('Latitude must be between -90 and 90 degrees.', 'error');
    return;
  }

  if (longitude < -180 || longitude > 180) {
    showToast('Longitude must be between -180 and 180 degrees.', 'error');
    return;
  }

  const topRoles = rolesStr ? rolesStr.split(',').map(r => r.trim()).filter(Boolean) : [];
  const requiredSkills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  try {
    const res = await adminFetch('/api/admin/radar/employers', {
      method: 'POST',
      body: JSON.stringify({
        name,
        cluster,
        clusterGroup,
        city,
        state,
        latitude,
        longitude,
        industry,
        website: website || undefined,
        openingsCount: openings,
        topRoles,
        requiredSkills,
        verifiedPartner: true,
        hiringFresher: true
      })
    });

    if (res.success) {
      showToast(res.message || 'Employer added to radar', 'success');
      closeModal('addEmployerModal');
      loadEmployers(radarCurrentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to add employer', 'error');
  }
}

async function openEditEmployerModal(id) {
  try {
    const res = await adminFetch(`/api/admin/radar/employers/${encodeURIComponent(id)}`);
    if (res.success && res.employer) {
      const e = res.employer;
      document.getElementById('editEmpId').value = e.id;
      document.getElementById('editEmpName').value = e.name;
      document.getElementById('editEmpCluster').value = e.cluster;
      document.getElementById('editEmpClusterGroup').value = e.clusterGroup || 'khandesh';
      document.getElementById('editEmpCity').value = e.city;
      document.getElementById('editEmpState').value = e.state;
      document.getElementById('editEmpLat').value = e.latitude;
      document.getElementById('editEmpLng').value = e.longitude;
      document.getElementById('editEmpIndustry').value = e.industry;
      document.getElementById('editEmpWebsite').value = e.website || '';
      document.getElementById('editEmpOpenings').value = e.openingsCount || 0;
      document.getElementById('editEmpRoles').value = (e.topRoles || []).join(', ');
      document.getElementById('editEmpSkills').value = (e.requiredSkills || []).join(', ');
      openModal('editEmployerModal');
    }
  } catch (err) {
    showToast(err.message || 'Failed to fetch employer', 'error');
  }
}

async function submitEditEmployer() {
  const id = document.getElementById('editEmpId').value;
  const name = document.getElementById('editEmpName').value.trim();
  const cluster = document.getElementById('editEmpCluster').value.trim();
  const clusterGroup = document.getElementById('editEmpClusterGroup').value;
  const city = document.getElementById('editEmpCity').value.trim();
  const state = document.getElementById('editEmpState').value.trim();
  const latStr = document.getElementById('editEmpLat').value.trim();
  const lngStr = document.getElementById('editEmpLng').value.trim();
  const industry = document.getElementById('editEmpIndustry').value.trim();
  const website = document.getElementById('editEmpWebsite').value.trim();
  const openings = parseInt(document.getElementById('editEmpOpenings').value, 10) || 0;
  const rolesStr = document.getElementById('editEmpRoles').value.trim();
  const skillsStr = document.getElementById('editEmpSkills').value.trim();

  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lngStr);

  const topRoles = rolesStr ? rolesStr.split(',').map(r => r.trim()).filter(Boolean) : [];
  const requiredSkills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  try {
    const res = await adminFetch(`/api/admin/radar/employers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name,
        cluster,
        clusterGroup,
        city,
        state,
        latitude,
        longitude,
        industry,
        website: website || undefined,
        openingsCount: openings,
        topRoles,
        requiredSkills
      })
    });

    if (res.success) {
      showToast(res.message || 'Employer updated successfully', 'success');
      closeModal('editEmployerModal');
      loadEmployers(radarCurrentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to update employer', 'error');
  }
}

async function toggleEmployerActive(id, currentlyActive) {
  try {
    const res = await adminFetch(`/api/admin/radar/employers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !currentlyActive })
    });

    if (res.success) {
      showToast(res.message || 'Status updated', 'success');
      loadEmployers(radarCurrentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to toggle status', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('radarSearchInput');
  if (search) {
    search.addEventListener('input', () => {
      clearTimeout(radarSearchTimeout);
      radarSearchTimeout = setTimeout(() => loadEmployers(1), 350);
    });
  }

  const cluster = document.getElementById('radarClusterFilter');
  if (cluster) {
    cluster.addEventListener('input', () => {
      clearTimeout(radarSearchTimeout);
      radarSearchTimeout = setTimeout(() => loadEmployers(1), 350);
    });
  }

  const status = document.getElementById('radarStatusFilter');
  if (status) {
    status.addEventListener('change', () => loadEmployers(1));
  }
});

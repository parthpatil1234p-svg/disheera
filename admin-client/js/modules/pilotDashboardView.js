/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * pilotDashboardView.js — Collegiate Pilot Cohort & TPO Telemetry Module
 *
 * Implements real-time student cohort progression tracking, automated at-risk
 * early-warning detection (inactive > 7 days, progress < 80%), and placement-ready
 * candidate roster CSV export for university Placement Cells (TPO).
 *
 * Disheera · Enterprise Administration Service
 */

let pilotCohortData = [];
let pilotFilterTimeout = null;

/**
 * Fetch cohort telemetry from backend
 */
async function loadPilotCohort() {
  const tbody = document.getElementById('pilotCohortTableBody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;"><div class="spinner-border text-teal mb-2" style="width: 2rem; height: 2rem; border-width: 2px;"></div><div>Loading GHRCEM student cohort telemetry...</div></td></tr>';
  }

  try {
    const res = await adminFetch('/api/campus/cohort-students?college=GHRCEM');
    if (res && res.success && Array.isArray(res.data)) {
      pilotCohortData = res.data;
      updatePilotKPIs(pilotCohortData);
      renderPilotCohortTable(pilotCohortData);
    } else {
      throw new Error(res.message || 'Failed to load cohort data');
    }
  } catch (err) {
    console.error('[PilotDashboard] Fetch error:', err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-rose); padding: 2rem;"><i class="bi bi-exclamation-triangle-fill me-1"></i> ${escapeHtml(err.message)}</td></tr>`;
    }
  }
}

/**
 * Calculate & display high-level cohort telemetry KPIs
 */
function updatePilotKPIs(students) {
  const total = students.length;
  const atRiskCount = students.filter(s => s.isAtRisk).length;
  const placementReadyCount = students.filter(s => (s.progressPercent || 0) >= 70).length;
  
  const avgProgress = total > 0
    ? Math.round(students.reduce((acc, s) => acc + (s.progressPercent || 0), 0) / total)
    : 0;

  const elTotal = document.getElementById('kpiPilotTotal');
  const elAvg = document.getElementById('kpiPilotAvgProgress');
  const elAtRisk = document.getElementById('kpiPilotAtRisk');
  const elReady = document.getElementById('kpiPilotReady');

  if (elTotal) elTotal.textContent = total;
  if (elAvg) elAvg.textContent = `${avgProgress}%`;
  if (elAtRisk) {
    elAtRisk.textContent = atRiskCount;
    elAtRisk.style.color = atRiskCount > 0 ? '#FB7185' : '#34D399';
  }
  if (elReady) elReady.textContent = placementReadyCount;
}

/**
 * Filter cohort list based on search and status controls
 */
function filterPilotCohort() {
  clearTimeout(pilotFilterTimeout);
  pilotFilterTimeout = setTimeout(() => {
    const search = (document.getElementById('pilotSearchInput')?.value || '').toLowerCase().trim();
    const status = document.getElementById('pilotStatusFilter')?.value || 'all';
    const track = document.getElementById('pilotTrackFilter')?.value || 'all';

    const filtered = pilotCohortData.filter(s => {
      const matchSearch = !search ||
        (s.name && s.name.toLowerCase().includes(search)) ||
        (s.email && s.email.toLowerCase().includes(search)) ||
        (s.track && s.track.toLowerCase().includes(search));

      let matchStatus = true;
      if (status === 'at-risk') matchStatus = s.isAtRisk;
      else if (status === 'ready') matchStatus = (s.progressPercent || 0) >= 70;
      else if (status === 'active') matchStatus = !s.isAtRisk;

      const matchTrack = track === 'all' || (s.track && s.track.toLowerCase().includes(track.toLowerCase()));

      return matchSearch && matchStatus && matchTrack;
    });

    renderPilotCohortTable(filtered);
  }, 200);
}

/**
 * Render cohort students table
 */
function renderPilotCohortTable(students) {
  const tbody = document.getElementById('pilotCohortTableBody');
  if (!tbody) return;

  if (!students || students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No students found matching current filter criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = students.map(s => {
    const progress = Math.min(100, Math.max(0, s.progressPercent || 0));
    const progressColor = progress >= 75 ? '#10B981' : (progress >= 40 ? '#3B82F6' : '#F59E0B');
    
    const statusBadge = s.isAtRisk
      ? '<span class="badge badge-rose"><i class="bi bi-exclamation-triangle-fill"></i> At-Risk (Inactive)</span>'
      : (progress >= 70
          ? '<span class="badge badge-emerald"><i class="bi bi-patch-check-fill"></i> Placement Ready</span>'
          : '<span class="badge badge-cyan"><i class="bi bi-arrow-repeat"></i> Active Sprint</span>');

    const vivaBadge = s.vivaScore
      ? `<span class="badge badge-emerald" title="Voice Viva Cryptographic Seal Verified"><i class="bi bi-mic-fill"></i> ${s.vivaScore}% Viva</span>`
      : '<span class="badge badge-muted"><i class="bi bi-mic"></i> Pending</span>';

    const dateStr = s.lastActiveDate ? new Date(s.lastActiveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${escapeHtml(s.name || 'Anonymous Student')}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(s.email)} · ${escapeHtml(s.phone)}</div>
        </td>
        <td>
          <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-primary);">${escapeHtml(s.track)}</span>
        </td>
        <td style="min-width: 140px;">
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
            <span style="font-family: var(--font-mono); font-weight: 700; color: ${progressColor};">${progress}%</span>
            <span style="color: var(--text-muted);">Milestone</span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.08); border-radius: 9999px; overflow: hidden;">
            <div style="width: ${progress}%; height: 100%; background: ${progressColor}; border-radius: 9999px; transition: width 0.3s ease;"></div>
          </div>
        </td>
        <td>${statusBadge}</td>
        <td>${vivaBadge}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">${dateStr}</td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            <a href="${s.passportUrl || '#'}" target="_blank" class="btn-action" style="font-size: 0.75rem; padding: 4px 8px; text-decoration: none;" title="Inspect candidate Skill Passport">
              <i class="bi bi-box-arrow-up-right"></i> Passport
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Trigger placement-ready CSV download
 */
function exportPilotCohortCsv() {
  const exportUrl = `${API_BASE}/api/campus/export-roster-csv?college=GHRCEM`;
  window.open(exportUrl, '_blank');
  if (typeof showToast === 'function') {
    showToast('Placement-ready candidate roster CSV generated.', 'success');
  }
}

// Expose functions globally for admin-client template
window.loadPilotCohort = loadPilotCohort;
window.filterPilotCohort = filterPilotCohort;
window.exportPilotCohortCsv = exportPilotCohortCsv;

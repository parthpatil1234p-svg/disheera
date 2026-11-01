/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * passportsView.js — Skill Passport Oversight & Credential Verification Module
 *
 * Implements digital credential inspection, tamper-proof seal verification,
 * soft-revocation with public QR alert propagation, and Super Admin reinstatement.
 * Escapes all data to prevent stored XSS.
 * Disheera · Enterprise Administration Service
 */

let passportCurrentPage = 1;
let passportSearchTimeout = null;

if (typeof window.openModal !== 'function') {
  window.openModal = function (modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  };
}
if (typeof window.closeModal !== 'function') {
  window.closeModal = function (modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  };
}

async function loadPassports(page = 1) {
  passportCurrentPage = page;
  const tbody = document.getElementById('passportsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Retrieving skill passports...</td></tr>';

  try {
    const search = document.getElementById('passportSearchInput')?.value || '';
    const status = document.getElementById('passportStatusFilter')?.value || 'all';

    const params = new URLSearchParams({
      page,
      limit: 12,
      search,
      status
    });

    const res = await adminFetch(`/api/admin/passports?${params.toString()}`);
    if (res.success) {
      renderPassportsTable(res.passports, res.pagination);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-rose);">${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderPassportsTable(passports, pagination) {
  const tbody = document.getElementById('passportsTableBody');
  if (!tbody) return;

  if (!passports || passports.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No skill passports found matching current criteria.</td></tr>';
    renderPassportPagination(pagination);
    return;
  }

  const role = window.currentAdminRole || 'SUPER_ADMIN';

  tbody.innerHTML = passports.map(p => {
    const isRevoked = p.isRevoked || p.credentialStatus === 'revoked' || p.status === 'revoked';
    const isVerified = (p.credentialStatus === 'verified' || p.status === 'verified') && ((p.verifiedSkillsCount || 0) >= 1);
    const statusBadge = isRevoked
      ? '<span class="badge badge-rose"><i class="bi bi-shield-x"></i> Revoked</span>'
      : (isVerified
          ? '<span class="badge badge-emerald"><i class="bi bi-patch-check-fill"></i> Verified</span>'
          : '<span class="badge badge-muted"><i class="bi bi-hourglass-split"></i> Pending</span>');

    const actionButtons = `
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button class="btn-action" onclick="viewPassportDossier('${escapeHtml(p.studentId)}')" title="View Cryptographic Dossier">
          <i class="bi bi-person-badge"></i> Dossier
        </button>
        ${isRevoked
          ? (role === 'SUPER_ADMIN'
              ? `<button class="btn-action" style="color: var(--accent-emerald);" onclick="openReinstatePassportModal('${escapeHtml(p.studentId)}', '${escapeHtml(p.name)}')" title="Reinstate Credential">
                  <i class="bi bi-shield-check"></i> Reinstate
                </button>`
              : '')
          : `<button class="btn-action" style="color: var(--accent-rose);" onclick="openRevokePassportModal('${escapeHtml(p.studentId)}', '${escapeHtml(p.name)}')" title="Revoke Credential">
              <i class="bi bi-shield-x"></i> Revoke
            </button>`
        }
      </div>
    `;

    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(p.name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(p.email)}</div>
        </td>
        <td><span class="badge badge-muted">${escapeHtml(p.primaryStream)}</span></td>
        <td>
          <span style="font-weight: 600; color: var(--accent-cyan);">${escapeHtml(String(p.verifiedSkillsCount))}</span>
          <span style="color: var(--text-muted); font-size: 0.8rem;"> / ${escapeHtml(String(p.totalSkills))}</span>
        </td>
        <td>${p.hasCompletedSkillVerification ? '<span class="badge badge-indigo">Complete</span>' : '<span class="badge badge-muted">Pending</span>'}</td>
        <td>${statusBadge}</td>
        <td style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(new Date(p.createdAt).toLocaleDateString())}</td>
        <td style="text-align: right;">${actionButtons}</td>
      </tr>
    `;
  }).join('');

  renderPassportPagination(pagination);
}

function renderPassportPagination(pagination) {
  const container = document.getElementById('passportsPagination');
  if (!container || !pagination) return;

  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) {
    container.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">Total Passports: ${escapeHtml(String(total))}</span>`;
    return;
  }

  container.innerHTML = `
    <span style="font-size: 0.8rem; color: var(--text-muted);">Page ${escapeHtml(String(page))} of ${escapeHtml(String(totalPages))} (${escapeHtml(String(total))} passports)</span>
    <div style="display: flex; gap: 0.5rem;">
      <button class="btn-action" ${page <= 1 ? 'disabled style="opacity: 0.5;"' : ''} onclick="loadPassports(${page - 1})">Previous</button>
      <button class="btn-action" ${page >= totalPages ? 'disabled style="opacity: 0.5;"' : ''} onclick="loadPassports(${page + 1})">Next</button>
    </div>
  `;
}

async function viewPassportDossier(studentId) {
  try {
    const res = await adminFetch(`/api/admin/passports/${encodeURIComponent(studentId)}`);
    if (res.success && res.passport) {
      const p = res.passport;
      const modalBody = document.getElementById('passportDossierBody');
      if (!modalBody) return;

      const skillsHtml = (p.skillsMatrix || []).map(s => `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.6rem 0.8rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(s.displayName || s.name)}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${escapeHtml(s.verifiedSource || 'Protocol')}</div>
          </div>
          <span class="badge ${s.isVerified ? 'badge-indigo' : 'badge-muted'}" style="font-size: 0.72rem;">${escapeHtml(s.badge || s.tier)}</span>
        </div>
      `).join('') || '<div style="color: var(--text-muted); font-size: 0.8rem;">No skills declared yet.</div>';

      const revocationAlert = p.isRevoked ? `
        <div class="alert-box alert-error" style="display: block; margin-bottom: 1rem;">
          <strong style="color: var(--accent-rose);"><i class="bi bi-shield-x"></i> REVOKED CREDENTIAL:</strong> Revoked by ${escapeHtml(p.revocationDetails?.revokedBy || 'Admin')} on ${escapeHtml(new Date(p.revocationDetails?.revokedAt).toLocaleString())}.<br>
          Reason: <em>${escapeHtml(p.revocationDetails?.reason || 'Administrative action')}</em>
        </div>
      ` : '';

      modalBody.innerHTML = `
        ${revocationAlert}
        <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
          <img src="${escapeHtml(p.avatarUrl)}" style="width: 54px; height: 54px; border-radius: 50%; border: 2px solid var(--accent-cyan);" alt="Avatar">
          <div>
            <h4 style="margin: 0; color: var(--text-primary);">${escapeHtml(p.name)}</h4>
            <div style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(p.email)}</div>
            <div style="font-size: 0.8rem; color: var(--accent-cyan); margin-top: 0.2rem;">${escapeHtml(p.degreeBranch)} • ${escapeHtml(p.college)}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.25rem;">
          <div style="background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Job Readiness</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-emerald);">${escapeHtml(String(p.readinessScore))}%</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Verified Skills</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-indigo);">${escapeHtml(String(p.verifiedSkillsCount))}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Credential State</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: ${p.isRevoked ? 'var(--accent-rose)' : ((p.verifiedSkillsCount || 0) >= 1 ? 'var(--accent-emerald)' : 'var(--accent-amber)')};">${p.isRevoked ? 'REVOKED' : ((p.verifiedSkillsCount || 0) >= 1 ? 'VERIFIED' : 'PENDING')}</div>
          </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label class="form-label" style="margin-bottom: 0.5rem;">Cryptographic Ledger Hash (SHA-256)</label>
          <div style="background: #000; padding: 0.6rem 0.8rem; border-radius: 6px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan); word-break: break-all; border: 1px solid var(--border-subtle);">
            ${escapeHtml(p.cryptographicHash)}
          </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label class="form-label" style="margin-bottom: 0.5rem;">Public QR Verification URL</label>
          <div style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted);">
            <a href="${escapeHtml(p.verificationUrl)}" target="_blank" style="color: var(--accent-cyan); text-decoration: underline;">
              ${escapeHtml(p.verificationUrl)} <i class="bi bi-box-arrow-up-right" style="font-size: 0.72rem;"></i>
            </a>
          </div>
        </div>

        <div>
          <label class="form-label" style="margin-bottom: 0.5rem;">Skills Matrix Breakdown (${escapeHtml(String(p.verifiedSkillsCount))} of ${escapeHtml(String(p.totalSkillsCount))} Verified)</label>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; max-height: 220px; overflow-y: auto;">
            ${skillsHtml}
          </div>
        </div>
      `;

      openModal('passportDossierModal');
    }
  } catch (err) {
    showToast(err.message || 'Failed to load passport dossier', 'error');
  }
}

function openRevokePassportModal(studentId, studentName) {
  document.getElementById('revokePassportStudentId').value = studentId;
  document.getElementById('revokePassportStudentNameDisplay').textContent = studentName;
  document.getElementById('revokePassportReasonInput').value = '';
  openModal('passportRevokeModal');
}

async function submitRevokePassport() {
  const studentId = document.getElementById('revokePassportStudentId').value;
  const reason = document.getElementById('revokePassportReasonInput').value;

  if (!reason || reason.trim().length < 3) {
    showToast('Please state a valid revocation reason (min 3 chars).', 'error');
    return;
  }

  try {
    const res = await adminFetch(`/api/admin/passports/${encodeURIComponent(studentId)}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason.trim() })
    });

    if (res.success) {
      showToast(res.message || 'Passport revoked successfully', 'success');
      closeModal('passportRevokeModal');
      loadPassports(passportCurrentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to revoke passport', 'error');
  }
}

function openReinstatePassportModal(studentId, studentName) {
  document.getElementById('reinstatePassportStudentId').value = studentId;
  document.getElementById('reinstatePassportStudentNameDisplay').textContent = studentName;
  document.getElementById('reinstatePassportReasonInput').value = '';
  openModal('passportReinstateModal');
}

async function submitReinstatePassport() {
  const studentId = document.getElementById('reinstatePassportStudentId').value;
  const reason = document.getElementById('reinstatePassportReasonInput').value;

  try {
    const res = await adminFetch(`/api/admin/passports/${encodeURIComponent(studentId)}/reinstate`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason ? reason.trim() : 'Reinstated by Super Admin' })
    });

    if (res.success) {
      showToast(res.message || 'Passport reinstated successfully', 'success');
      closeModal('passportReinstateModal');
      loadPassports(passportCurrentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to reinstate passport', 'error');
  }
}

// Attach debounce on passport search
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('passportSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(passportSearchTimeout);
      passportSearchTimeout = setTimeout(() => loadPassports(1), 350);
    });
  }

  const statusFilter = document.getElementById('passportStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => loadPassports(1));
  }
});

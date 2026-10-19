/**
 * auditView.js — Immutable Administrative Audit Log Inspector (Plan 45 Phase 4)
 *
 * Provides paginated, filtered inspection of all administrative actions.
 * Enforces IP privacy masking: only SUPER_ADMIN sees full IPs; others see masked IPs.
 */

let currentAuditPage = 1;
const AUDIT_PAGE_LIMIT = 20;

async function loadAuditActionsFilter() {
  const select = document.getElementById('auditActionFilter');
  if (!select) return;

  try {
    const res = await adminFetch('/api/admin/audit-logs/actions');
    if (res.success && Array.isArray(res.actions)) {
      const currentVal = select.value;
      select.innerHTML = '<option value="">All Actions</option>' +
        res.actions.map(act => `<option value="${escapeHtml(act)}">${escapeHtml(act)}</option>`).join('');
      if (currentVal) select.value = currentVal;
    }
  } catch (err) {
    console.warn('Failed to load audit actions filter:', err.message);
  }
}

async function loadAuditLogs(page = 1) {
  currentAuditPage = page;
  const tbody = document.getElementById('fullAuditTableBody');
  const paginationEl = document.getElementById('auditPagination');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Retrieving immutable audit records...</td></tr>';

  const search = document.getElementById('auditSearchInput')?.value.trim() || '';
  const action = document.getElementById('auditActionFilter')?.value || '';
  const targetType = document.getElementById('auditTargetTypeFilter')?.value || '';
  const startDate = document.getElementById('auditStartDate')?.value || '';
  const endDate = document.getElementById('auditEndDate')?.value || '';

  const params = new URLSearchParams({
    page: String(page),
    limit: String(AUDIT_PAGE_LIMIT)
  });

  if (search) params.set('search', search);
  if (action) params.set('action', action);
  if (targetType) params.set('targetType', targetType);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  try {
    const res = await adminFetch(`/api/admin/audit-logs?${params.toString()}`);
    if (res.success && Array.isArray(res.logs)) {
      if (res.logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No audit records match your filters.</td></tr>';
        if (paginationEl) paginationEl.innerHTML = '';
        return;
      }

      tbody.innerHTML = res.logs.map(l => {
        const ipDisplay = l.isIpMasked
          ? `<span class="badge badge-muted" title="Masked for privacy">${escapeHtml(l.ipAddress || '—')}</span>`
          : `<span class="badge badge-indigo" title="Full IP (Super Admin)">${escapeHtml(l.ipAddress || '—')}</span>`;

        const detailsJson = escapeHtml(JSON.stringify(l.details || {}, null, 2));

        return `
          <tr>
            <td style="font-family: var(--font-mono); font-size: 0.75rem; white-space: nowrap;">
              ${escapeHtml(new Date(l.createdAt).toLocaleString())}
            </td>
            <td>
              <div style="font-weight: 600; font-size: 0.85rem;">${escapeHtml(l.adminName || l.adminEmail)}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(l.adminEmail)} (${escapeHtml(l.adminRole)})</div>
            </td>
            <td>
              <span class="badge ${getActionBadgeClass(l.action)}">${escapeHtml(l.action)}</span>
            </td>
            <td>
              <span class="badge badge-muted">${escapeHtml(l.targetType)}</span>
            </td>
            <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(l.targetId || '—')}
            </td>
            <td>${ipDisplay}</td>
            <td style="text-align: right;">
              <button class="btn-action" style="font-size: 0.75rem;" onclick="viewAuditDetailsModal('${escapeHtml(l.id)}', '${escapeHtml(l.action)}', '${escapeHtml(l.adminEmail)}', '${escapeHtml(new Date(l.createdAt).toLocaleString())}', this)" data-details='${JSON.stringify(l.details || {})}' data-ua='${escapeHtml(l.userAgent || '')}'>
                <i class="bi bi-search"></i> Inspect
              </button>
            </td>
          </tr>
        `;
      }).join('');

      // Render pagination
      if (paginationEl && res.pagination) {
        const p = res.pagination;
        paginationEl.innerHTML = `
          <div style="font-size: 0.82rem; color: var(--text-muted);">
            Showing page <strong>${p.page}</strong> of <strong>${p.totalPages || 1}</strong> (${p.total} total events)
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn-action" ${p.page <= 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : `onclick="loadAuditLogs(${p.page - 1})"`}>
              ← Previous
            </button>
            <button class="btn-action" ${p.page >= p.totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : `onclick="loadAuditLogs(${p.page + 1})"`}>
              Next →
            </button>
          </div>
        `;
      }
    }
  } catch (err) {
    console.error('Failed to load audit logs:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-rose); padding: 2rem;">${escapeHtml(err.message)}</td></tr>`;
  }
}

function viewAuditDetailsModal(id, action, adminEmail, timestamp, btn) {
  let details = {};
  let userAgent = '';
  try {
    details = JSON.parse(btn.getAttribute('data-details') || '{}');
    userAgent = btn.getAttribute('data-ua') || '';
  } catch (e) {
    details = { error: 'Failed to parse details JSON' };
  }

  const modal = document.getElementById('auditDetailsModal');
  const title = document.getElementById('auditDetailsTitle');
  const content = document.getElementById('auditDetailsContent');

  if (!modal || !content) return;

  title.textContent = `Audit Inspection: ${action}`;
  content.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; background: var(--bg-surface); padding: 0.85rem; border-radius: 8px; border: 1px solid var(--border-subtle); font-size: 0.8rem;">
        <div><strong style="color: var(--text-muted);">Event ID:</strong> <span style="font-family: var(--font-mono);">${escapeHtml(id)}</span></div>
        <div><strong style="color: var(--text-muted);">Operator:</strong> ${escapeHtml(adminEmail)}</div>
        <div><strong style="color: var(--text-muted);">Action:</strong> <span class="badge ${getActionBadgeClass(action)}">${escapeHtml(action)}</span></div>
        <div><strong style="color: var(--text-muted);">Timestamp:</strong> ${escapeHtml(timestamp)}</div>
      </div>

      <div>
        <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">User Agent</label>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-surface); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-subtle); word-break: break-all;">
          ${escapeHtml(userAgent || 'Direct Server / System Call')}
        </div>
      </div>

      <div>
        <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Event Payload & State Diffs</label>
        <pre style="background: #090d16; color: #a5b4fc; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-subtle); font-family: var(--font-mono); font-size: 0.78rem; overflow-x: auto; max-height: 320px;">${escapeHtml(JSON.stringify(details, null, 2))}</pre>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

let auditSearchTimeout = null;
function debounceAuditSearch() {
  clearTimeout(auditSearchTimeout);
  auditSearchTimeout = setTimeout(() => {
    loadAuditLogs(1);
  }, 350);
}

window.loadAuditLogs = loadAuditLogs;
window.loadAuditActionsFilter = loadAuditActionsFilter;
window.viewAuditDetailsModal = viewAuditDetailsModal;
window.debounceAuditSearch = debounceAuditSearch;

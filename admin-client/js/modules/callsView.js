/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * callsView.js — Voice Support Cockpit & Call Telemetry Module (Plan 47 Phase 4)
 * Disheera · Enterprise Subdomain Admin Panel (admin.disheera.site)
 *
 * Capabilities:
 * - Paginated Call Logs with real-time search & status filtering
 * - Turn-by-turn conversation transcript viewer modal
 * - Inline HTML5 audio player for call recordings
 * - Ticket escalation status and WhatsApp relay inspection
 */

let currentCallsPage = 1;
const CALLS_PAGE_LIMIT = 20;
let cachedCallLogs = [];

/**
 * Loads and renders call logs for the Voice Support Cockpit
 */
async function loadCallLogs(page = 1) {
  currentCallsPage = page;
  const tbody = document.getElementById('callsTableBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center py-4 text-muted">
        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
        Loading voice call logs...
      </td>
    </tr>
  `;

  const searchInput = document.getElementById('callsSearchInput');
  const statusFilter = document.getElementById('callsStatusFilter');
  const search = searchInput ? searchInput.value.trim() : '';
  const status = statusFilter ? statusFilter.value : '';

  try {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(CALLS_PAGE_LIMIT),
      search,
      status,
    });

    let res = await adminFetch(`/api/admin/calls?${query.toString()}`).catch(() => null);
    if (!res || !res.success) {
      res = await adminFetch(`/api/voice/logs?${query.toString()}`);
    }
    if (!res || !res.success) {
      throw new Error((res && res.message) || 'Failed to fetch voice call logs');
    }

    const { total = 0, data = [] } = res.data || {};
    cachedCallLogs = data;

    // Update KPI metrics
    updateCallsKpis(data, total);

    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="bi bi-headset me-2"></i>No voice support calls recorded matching your criteria.
          </td>
        </tr>
      `;
      renderCallsPagination(0, page);
      return;
    }

    tbody.innerHTML = data.map((call) => {
      const isEscalated = call.status === 'ESCALATED_TICKET';
      const statusBadge = isEscalated
        ? '<span class="badge badge-rose"><i class="bi bi-exclamation-triangle-fill me-1"></i>Ticket Escalated</span>'
        : '<span class="badge badge-emerald"><i class="bi bi-check-circle-fill me-1"></i>Resolved</span>';

      const durationText = call.durationSeconds > 60
        ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s`
        : `${call.durationSeconds || 0}s`;

      const ticketHtml = call.ticketId
        ? `<span class="badge badge-indigo font-monospace">#${escapeHtml(call.ticketId)}</span>`
        : '<span class="text-muted small">None</span>';

      const audioHtml = call.recordingUrl
        ? `<audio controls src="${escapeHtml(call.recordingUrl)}" preload="none" style="height: 28px; width: 140px;"></audio>`
        : '<span class="text-muted small" style="font-size: 11px;">Text/No Audio</span>';

      const phoneLink = call.userPhone && call.userPhone.replace(/\D/g, '').length >= 10
        ? `<a href="https://wa.me/${escapeHtml(call.userPhone.replace(/\D/g, ''))}" target="_blank" class="text-decoration-none text-success small fw-semibold"><i class="bi bi-whatsapp me-1"></i>${escapeHtml(call.userPhone)}</a>`
        : `<span class="text-muted small">${escapeHtml(call.userPhone || 'Not Set')}</span>`;

      return `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="user-avatar-sm" style="width: 32px; height: 32px; border-radius: 50%; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">
                ${escapeHtml((call.userName || 'S').charAt(0).toUpperCase())}
              </div>
              <div>
                <div class="fw-semibold text-dark">${escapeHtml(call.userName || 'Student')}</div>
                <div class="text-muted small" style="font-size: 11px;">${escapeHtml(call.userEmail || '')}</div>
              </div>
            </div>
          </td>
          <td>${phoneLink}</td>
          <td><span class="badge badge-cyan">${escapeHtml(durationText)}</span></td>
          <td>${statusBadge}</td>
          <td>${ticketHtml}</td>
          <td>${audioHtml}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-outline-primary py-1 px-2" style="font-size: 11px;" onclick="openCallTranscriptModal('${escapeHtml(call.id)}')">
                <i class="bi bi-chat-left-text me-1"></i>Transcript
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    renderCallsPagination(total, page);
  } catch (err) {
    console.error('[callsView] Error loading logs:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-danger">
          <i class="bi bi-x-circle me-2"></i>Failed to load voice call logs: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  }
}

/**
 * Updates KPI Summary Cards for the Voice Support Cockpit
 */
function updateCallsKpis(data = [], total = 0) {
  const totalCallsEl = document.getElementById('kpiTotalVoiceCalls');
  const escalatedRateEl = document.getElementById('kpiVoiceEscalatedRate');
  const avgDurationEl = document.getElementById('kpiVoiceAvgDuration');

  if (totalCallsEl) totalCallsEl.textContent = total;

  if (data.length > 0) {
    const escalatedCount = data.filter((c) => c.status === 'ESCALATED_TICKET').length;
    const escalatedRate = Math.round((escalatedCount / data.length) * 100);
    if (escalatedRateEl) escalatedRateEl.textContent = `${escalatedRate}%`;

    const totalDuration = data.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
    const avgDuration = Math.round(totalDuration / data.length);
    if (avgDurationEl) avgDurationEl.textContent = `${avgDuration}s`;
  }
}

/**
 * Renders pagination controls for call logs
 */
function renderCallsPagination(total, currentPage) {
  const container = document.getElementById('callsPagination');
  if (!container) return;

  const totalPages = Math.ceil(total / CALLS_PAGE_LIMIT) || 1;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<div class="d-flex align-items-center justify-content-between p-3 border-top">
    <div class="text-muted small">Showing page ${currentPage} of ${totalPages} (${total} total calls)</div>
    <div class="btn-group btn-group-sm">
  `;

  if (currentPage > 1) {
    html += `<button class="btn btn-outline-secondary" onclick="loadCallLogs(${currentPage - 1})">Previous</button>`;
  }

  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
      html += `<button class="btn ${p === currentPage ? 'btn-primary' : 'btn-outline-secondary'}" onclick="loadCallLogs(${p})">${p}</button>`;
    }
  }

  if (currentPage < totalPages) {
    html += `<button class="btn btn-outline-secondary" onclick="loadCallLogs(${currentPage + 1})">Next</button>`;
  }

  html += '</div></div>';
  container.innerHTML = html;
}

/**
 * Opens transcript viewer modal
 */
function openCallTranscriptModal(callId) {
  const call = cachedCallLogs.find((c) => c.id === callId);
  if (!call) return;

  const modal = document.getElementById('callTranscriptModal');
  const titleEl = document.getElementById('callTranscriptModalTitle');
  const bodyEl = document.getElementById('callTranscriptModalBody');
  if (!modal || !bodyEl) return;

  if (titleEl) {
    titleEl.innerHTML = `<i class="bi bi-chat-left-quote-fill text-primary me-2"></i>Call Transcript · ${escapeHtml(call.userName)} (${escapeHtml(call.id)})`;
  }

  const transcript = Array.isArray(call.transcript) ? call.transcript : [];
  if (transcript.length === 0) {
    bodyEl.innerHTML = '<div class="text-muted text-center py-4">No turn transcript recorded for this session.</div>';
  } else {
    bodyEl.innerHTML = `
      <div class="mb-3 p-3 bg-light rounded-3 d-flex justify-content-between align-items-center small">
        <div><strong>Status:</strong> ${escapeHtml(call.status)}</div>
        <div><strong>Duration:</strong> ${escapeHtml(call.durationSeconds)}s</div>
        <div><strong>Ticket:</strong> ${escapeHtml(call.ticketId || 'None')}</div>
      </div>
      <div class="d-flex flex-column gap-2" style="max-height: 400px; overflow-y: auto;">
        ${transcript.map((turn) => {
          const isUser = turn.speaker === 'user';
          const bg = isUser ? 'bg-primary-subtle text-primary-emphasis' : 'bg-white border text-dark';
          const align = isUser ? 'align-self-end' : 'align-self-start';
          const label = isUser ? escapeHtml(call.userName || 'Student') : 'Arya (AI Support)';
          const time = turn.timestamp ? new Date(turn.timestamp).toLocaleTimeString() : '';

          return `
            <div class="p-2 rounded-3 ${bg} ${align}" style="max-width: 80%;">
              <div class="d-flex justify-content-between gap-3 text-muted" style="font-size: 11px;">
                <strong>${label}</strong>
                <span>${time}</span>
              </div>
              <div class="small mt-1">${escapeHtml(turn.text)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  modal.classList.add('active');
}

function closeCallTranscriptModal() {
  const modal = document.getElementById('callTranscriptModal');
  if (modal) modal.classList.remove('active');
}

window.loadCallLogs = loadCallLogs;
window.openCallTranscriptModal = openCallTranscriptModal;
window.closeCallTranscriptModal = closeCallTranscriptModal;

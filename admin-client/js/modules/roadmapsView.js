/**
 * roadmapsView.js — Student Progression & Anti-Cheat Anomaly Monitor
 *
 * Visualizes student roadmap progress, task completion, anti-cheat test anomalies,
 * and enables administrative status pause/flagging with complete audit logging.
 * Disheera · Enterprise Administration Service
 */

let roadmapCurrentPage = 1;
let anomalyCurrentPage = 1;
let roadmapSearchTimeout = null;

async function loadRoadmaps(page = 1) {
  roadmapCurrentPage = page;
  const tbody = document.getElementById('roadmapsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Retrieving roadmaps...</td></tr>';

  try {
    const search = document.getElementById('roadmapSearchInput')?.value || '';
    const status = document.getElementById('roadmapStatusFilter')?.value || 'all';

    const params = new URLSearchParams({
      page,
      limit: 12,
      search,
      status
    });

    const res = await adminFetch(`/api/admin/roadmaps?${params.toString()}`);
    if (res.success) {
      renderRoadmapsTable(res.roadmaps, res.pagination);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-rose);">${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderRoadmapsTable(roadmaps, pagination) {
  const tbody = document.getElementById('roadmapsTableBody');
  if (!tbody) return;

  if (!roadmaps || roadmaps.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No roadmaps found matching current criteria.</td></tr>';
    renderRoadmapPagination(pagination);
    return;
  }

  tbody.innerHTML = roadmaps.map(r => {
    let statusClass = 'badge-muted';
    if (r.status === 'active') statusClass = 'badge-emerald';
    else if (r.status === 'completed') statusClass = 'badge-cyan';
    else if (r.status === 'flagged') statusClass = 'badge-rose';
    else if (r.status === 'paused') statusClass = 'badge-amber';

    const pct = Math.min(100, Math.max(0, r.progressPercentage || 0));

    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(r.careerTitle)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(r.domain)} track</div>
        </td>
        <td>
          <div style="font-weight: 500;">${escapeHtml(r.studentName)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(r.studentEmail)}</div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; max-width: 100px;">
              <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--accent-cyan), var(--accent-indigo));"></div>
            </div>
            <span style="font-size: 0.75rem; font-weight: 600; color: var(--accent-cyan); font-family: var(--font-mono);">${pct}%</span>
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${escapeHtml(String(r.completedTasks))} / ${escapeHtml(String(r.totalTasks))} tasks</div>
        </td>
        <td><span class="badge ${statusClass}">${escapeHtml(r.status)}</span></td>
        <td style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(String(r.durationWeeks))} Weeks</td>
        <td style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(new Date(r.createdAt).toLocaleDateString())}</td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
            <button class="btn-action" onclick="viewRoadmapDetail('${escapeHtml(r.id)}')" title="View Tasks & Milestones">
              <i class="bi bi-list-check"></i> Tasks
            </button>
            <button class="btn-action" onclick="openUpdateRoadmapStatusModal('${escapeHtml(r.id)}', '${escapeHtml(r.status)}')" title="Change Status">
              <i class="bi bi-gear-fill"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderRoadmapPagination(pagination);
}

function renderRoadmapPagination(pagination) {
  const container = document.getElementById('roadmapPagination');
  if (!container || !pagination) return;

  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) {
    container.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">Total Roadmaps: ${escapeHtml(String(total))}</span>`;
    return;
  }

  container.innerHTML = `
    <span style="font-size: 0.8rem; color: var(--text-muted);">Page ${escapeHtml(String(page))} of ${escapeHtml(String(totalPages))} (${escapeHtml(String(total))} roadmaps)</span>
    <div style="display: flex; gap: 0.5rem;">
      <button class="btn-action" ${page <= 1 ? 'disabled style="opacity: 0.5;"' : ''} onclick="loadRoadmaps(${page - 1})">Previous</button>
      <button class="btn-action" ${page >= totalPages ? 'disabled style="opacity: 0.5;"' : ''} onclick="loadRoadmaps(${page + 1})">Next</button>
    </div>
  `;
}

async function loadAnomalies() {
  const tbody = document.getElementById('anomaliesTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Scanning assessment telemetry for anomalies...</td></tr>';

  try {
    const res = await adminFetch('/api/admin/roadmaps/anomalies/scores');
    if (res.success) {
      renderAnomaliesTable(res.anomalies);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-rose);">${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderAnomaliesTable(anomalies) {
  const tbody = document.getElementById('anomaliesTableBody');
  if (!tbody) return;

  if (!anomalies || anomalies.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--accent-emerald);"><i class="bi bi-shield-check" style="font-size: 1.1rem; margin-right: 0.35rem;"></i> Zero anomalous test submissions detected. All assessments conform to academic integrity rubrics.</td></tr>';
    return;
  }

  tbody.innerHTML = anomalies.map(a => {
    const reasonsHtml = a.reasons.map(r => `<div style="color: var(--accent-rose); font-size: 0.75rem;">• ${escapeHtml(r)}</div>`).join('');
    const severityBadge = a.severity === 'HIGH'
      ? '<span class="badge badge-rose">HIGH RISK</span>'
      : '<span class="badge badge-amber">MEDIUM</span>';

    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(a.studentName)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(a.studentEmail)}</div>
        </td>
        <td>
          <div style="font-size: 0.82rem; font-weight: 500;">${escapeHtml(a.careerTitle)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${a.weekNumber ? `Week ${escapeHtml(String(a.weekNumber))} Milestone` : 'Skill Assessment'}</div>
        </td>
        <td>
          <span style="font-weight: 700; color: ${a.percent >= 70 ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">${escapeHtml(String(a.percent))}%</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">(${escapeHtml(String(a.score))}/${escapeHtml(String(a.total))})</span>
        </td>
        <td>${severityBadge}</td>
        <td>${reasonsHtml}</td>
        <td style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(new Date(a.recordedAt).toLocaleString())}</td>
      </tr>
    `;
  }).join('');
}

async function viewRoadmapDetail(id) {
  try {
    const res = await adminFetch(`/api/admin/roadmaps/${encodeURIComponent(id)}`);
    if (res.success && res.roadmap) {
      const r = res.roadmap;
      const modalBody = document.getElementById('roadmapDetailBody');
      if (!modalBody) return;

      const tasksByWeek = {};
      (r.tasks || []).forEach(t => {
        const wk = t.weekNumber || 1;
        tasksByWeek[wk] = tasksByWeek[wk] || [];
        tasksByWeek[wk].push(t);
      });

      const weeksHtml = Object.keys(tasksByWeek).sort((a,b) => Number(a)-Number(b)).map(wk => `
        <div style="margin-bottom: 1rem;">
          <h5 style="color: var(--accent-cyan); font-size: 0.85rem; margin-bottom: 0.4rem; text-transform: uppercase;">Week ${escapeHtml(wk)} Curriculum</h5>
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            ${tasksByWeek[wk].map(t => `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); padding: 0.5rem 0.75rem; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="font-size: 0.82rem; font-weight: 500; color: var(--text-primary);">${escapeHtml(t.title)}</span>
                  <span style="font-size: 0.7rem; color: var(--text-muted); margin-left: 0.5rem;">[${escapeHtml(t.type || 'learn')}]</span>
                </div>
                ${t.completed ? '<span class="badge badge-emerald" style="font-size: 0.7rem;">Completed</span>' : '<span class="badge badge-muted" style="font-size: 0.7rem;">Pending</span>'}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

      modalBody.innerHTML = `
        <div style="margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
          <h4 style="margin: 0; color: var(--text-primary);">${escapeHtml(r.careerTitle)}</h4>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
            Learner: <strong>${escapeHtml(r.user?.name || 'Student')}</strong> (${escapeHtml(r.user?.email)}) • Progress: <strong>${escapeHtml(String(r.progressPercentage))}%</strong>
          </div>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
          ${weeksHtml || '<div style="color: var(--text-muted);">No tasks found for this roadmap.</div>'}
        </div>
      `;

      openModal('roadmapDetailModal');
    }
  } catch (err) {
    showToast(err.message || 'Failed to load roadmap details', 'error');
  }
}

function openUpdateRoadmapStatusModal(id, currentStatus) {
  document.getElementById('updateRoadmapId').value = id;
  document.getElementById('updateRoadmapStatusSelect').value = currentStatus || 'active';
  document.getElementById('updateRoadmapReasonInput').value = '';
  openModal('updateRoadmapStatusModal');
}

async function submitUpdateRoadmapStatus() {
  const id = document.getElementById('updateRoadmapId').value;
  const status = document.getElementById('updateRoadmapStatusSelect').value;
  const flagReason = document.getElementById('updateRoadmapReasonInput').value;

  try {
    const res = await adminFetch(`/api/admin/roadmaps/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        flagReason: flagReason ? flagReason.trim() : undefined
      })
    });

    if (res.success) {
      showToast(res.message || 'Roadmap status updated', 'success');
      closeModal('updateRoadmapStatusModal');
      loadRoadmaps(roadmapCurrentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to update status', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('roadmapSearchInput');
  if (search) {
    search.addEventListener('input', () => {
      clearTimeout(roadmapSearchTimeout);
      roadmapSearchTimeout = setTimeout(() => loadRoadmaps(1), 350);
    });
  }

  const status = document.getElementById('roadmapStatusFilter');
  if (status) {
    status.addEventListener('change', () => loadRoadmaps(1));
  }
});

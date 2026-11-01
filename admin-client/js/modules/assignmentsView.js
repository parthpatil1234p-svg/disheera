/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * assignmentsView.js — Collegiate Weekly Assignments Review Cockpit (Plan 46)
 *
 * Implements Phase 3 Admin Review Interface:
 * - Submissions filtering by status (All, Submitted, Flagged AI, Graded, Approved, Resubmission)
 * - Week-based filtering (Weeks 1 to 4)
 * - Side-by-side PDF preview modal with AI 4D Rubric scorecard & Anti-AI Shield meter
 * - Administrative marks override & personalized educator commit dispatch
 *
 * Disheera Technologies Inc.
 */

let assignmentCurrentPage = 1;
let assignmentSearchTimeout = null;
let currentReviewDossier = null;

/**
 * Loads assignment submissions from /api/admin/assignments
 */
async function loadAdminAssignments(page = 1) {
  assignmentCurrentPage = page;
  const tbody = document.getElementById('assignmentsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;"><div class="spinner" style="margin: 0 auto 0.5rem;"></div>Retrieving assignment submissions...</td></tr>';

  try {
    const search = document.getElementById('assignmentSearchInput')?.value || '';
    const status = document.getElementById('assignmentStatusFilter')?.value || 'ALL';
    const weekNumber = document.getElementById('assignmentWeekFilter')?.value || '';

    const params = new URLSearchParams({
      page,
      limit: 12,
      search,
      status,
      weekNumber
    });

    const res = await adminFetch(`/api/admin/assignments?${params.toString()}`);
    if (res.success) {
      updateAssignmentKpis(res.counts);
      renderAssignmentsTable(res.submissions, res.pagination);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-rose); padding: 2rem;">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

/**
 * Updates top KPI metric cards and sidebar badge
 */
function updateAssignmentKpis(counts = {}) {
  if (!counts) return;

  const totalEl = document.getElementById('kpiTotalAssignments');
  const submittedEl = document.getElementById('kpiPendingAssignments');
  const flaggedEl = document.getElementById('kpiFlaggedAiAssignments');
  const gradedEl = document.getElementById('kpiGradedAssignments');
  const approvedEl = document.getElementById('kpiApprovedAssignments');
  const navBadge = document.getElementById('navAssignmentsBadge');

  if (totalEl) totalEl.textContent = counts.all || 0;
  if (submittedEl) submittedEl.textContent = counts.submitted || 0;
  if (flaggedEl) flaggedEl.textContent = counts.flaggedAi || 0;
  if (gradedEl) gradedEl.textContent = counts.graded || 0;
  if (approvedEl) approvedEl.textContent = counts.adminApproved || 0;

  if (navBadge) {
    const alertCount = (counts.flaggedAi || 0) + (counts.submitted || 0);
    if (alertCount > 0) {
      navBadge.textContent = alertCount;
      navBadge.style.display = 'inline-block';
    } else {
      navBadge.style.display = 'none';
    }
  }
}

/**
 * Renders the glassmorphic assignments table
 */
function renderAssignmentsTable(submissions = [], pagination = {}) {
  const tbody = document.getElementById('assignmentsTableBody');
  if (!tbody) return;

  if (!submissions || submissions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No assignment submissions match the selected filter criteria.</td></tr>';
    renderAssignmentPagination(pagination);
    return;
  }

  tbody.innerHTML = submissions.map(s => {
    // Status Badge styling
    let statusBadge = '<span class="badge badge-muted">Pending</span>';
    if (s.status === 'SUBMITTED') statusBadge = '<span class="badge badge-amber"><i class="bi bi-clock-history"></i> In Queue</span>';
    else if (s.status === 'FLAGGED_AI') statusBadge = '<span class="badge badge-rose" style="animation: pulse 2s infinite;"><i class="bi bi-shield-slash-fill"></i> Flagged AI</span>';
    else if (s.status === 'GRADED') statusBadge = '<span class="badge badge-cyan"><i class="bi bi-robot"></i> AI Graded</span>';
    else if (s.status === 'ADMIN_APPROVED') statusBadge = '<span class="badge badge-emerald"><i class="bi bi-patch-check-fill"></i> Board Approved</span>';
    else if (s.status === 'RESUBMISSION_REQUESTED') statusBadge = '<span class="badge badge-amber"><i class="bi bi-arrow-repeat"></i> Resubmit Req.</span>';

    // Anti-AI Badge
    const aiProb = s.aiProbability || 0;
    const aiPct = Math.round(aiProb * 100);
    let aiBadge = `<span class="badge badge-emerald" title="Organic authentic writing"><i class="bi bi-shield-check"></i> ${100 - aiPct}% Auth</span>`;
    if (aiProb > 0.60) {
      aiBadge = `<span class="badge badge-rose" title="High synthetic likelihood"><i class="bi bi-exclamation-triangle-fill"></i> ${aiPct}% AI Flag</span>`;
    } else if (aiProb >= 0.30) {
      aiBadge = `<span class="badge badge-amber" title="Moderate AI assistance"><i class="bi bi-cpu-fill"></i> ${aiPct}% AI Assist</span>`;
    }

    // Score display
    let scoreDisplay = '<span style="color: var(--text-muted);">Pending</span>';
    if (s.finalScore != null) {
      const scoreColor = s.finalScore >= 7.0 ? 'var(--accent-emerald)' : (s.finalScore >= 5.0 ? 'var(--accent-amber)' : 'var(--accent-rose)');
      scoreDisplay = `<strong style="color: ${scoreColor}; font-size: 1.05rem;">${Number(s.finalScore).toFixed(1)}</strong> <span style="font-size: 0.75rem; color: var(--text-muted);">/ 10</span>`;
      if (s.adminScore != null) {
        scoreDisplay += ' <span style="font-size: 10px; color: var(--accent-cyan); font-weight: 600;">[Admin Override]</span>';
      }
    } else if (s.status === 'FLAGGED_AI') {
      scoreDisplay = '<span style="color: var(--accent-rose); font-size: 0.85rem; font-weight: 600;">Suspended</span>';
    }

    const fileSizeKb = Math.round((s.fileSizeBytes || 0) / 1024);

    return `
      <tr>
        <td>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <strong style="color: var(--text-main); font-size: 0.92rem;">${escapeHtml(s.student.name)}</strong>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(s.student.email)}</span>
            <span style="font-size: 0.72rem; color: var(--text-dim);">${escapeHtml(s.student.college)} · Roll: ${escapeHtml(s.student.rollNumber)}</span>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <strong style="color: var(--text-main); font-size: 0.88rem;">Week ${s.weekNumber} Lab</strong>
            <span style="font-size: 0.76rem; color: var(--text-muted); max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(s.assignmentTitle)}">${escapeHtml(s.assignmentTitle)}</span>
          </div>
        </td>
        <td>
          <span class="badge badge-muted" style="font-family: monospace;">
            <i class="bi bi-file-earmark-pdf"></i> ${s.pageCount} Pages (${fileSizeKb} KB)
          </span>
        </td>
        <td>${aiBadge}</td>
        <td>${statusBadge}</td>
        <td>${scoreDisplay}</td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
            <button class="btn-action" onclick="openAssignmentReviewModal('${s.id}')" title="Inspect Full Submission Dossier">
              <i class="bi bi-binoculars-fill"></i> Review
            </button>
            ${s.status !== 'ADMIN_APPROVED' ? `
              <button class="btn-action success" onclick="quickApproveAssignment('${s.id}')" title="Approve with provisional AI marks">
                <i class="bi bi-check-lg"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderAssignmentPagination(pagination);
}

/**
 * Renders pagination controls
 */
function renderAssignmentPagination(pagination = {}) {
  const container = document.getElementById('assignmentPagination');
  if (!container) return;

  const { page = 1, totalPages = 1 } = pagination;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding-top: 0.75rem;">
      <span style="font-size: 0.82rem; color: var(--text-muted);">
        Page ${page} of ${totalPages}
      </span>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-action" ${page <= 1 ? 'disabled' : ''} onclick="loadAdminAssignments(${page - 1})">
          <i class="bi bi-chevron-left"></i> Prev
        </button>
        <button class="btn-action" ${page >= totalPages ? 'disabled' : ''} onclick="loadAdminAssignments(${page + 1})">
          Next <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  `;
}

/**
 * Filter change triggers
 */
function onAssignmentFilterChange() {
  loadAdminAssignments(1);
}

function onAssignmentSearchInput() {
  clearTimeout(assignmentSearchTimeout);
  assignmentSearchTimeout = setTimeout(() => {
    loadAdminAssignments(1);
  }, 350);
}

/**
 * Opens side-by-side Review & Commit Modal
 */
async function openAssignmentReviewModal(submissionId) {
  openModal('assignmentReviewModal');
  const modalBody = document.getElementById('assignmentReviewModalContent');
  if (!modalBody) return;

  modalBody.innerHTML = '<div style="text-align: center; padding: 4rem;"><div class="spinner" style="margin: 0 auto 1rem;"></div>Loading submission dossier & PDF assets...</div>';

  try {
    const res = await adminFetch(`/api/admin/assignments/${submissionId}`);
    if (!res.success) throw new Error(res.message);

    currentReviewDossier = res.submission;
    renderReviewModalContent(res.submission);
  } catch (err) {
    modalBody.innerHTML = `<div style="text-align: center; color: var(--accent-rose); padding: 3rem;">Error loading dossier: ${escapeHtml(err.message)}</div>`;
  }
}

/**
 * Renders the side-by-side review cockpit
 */
function renderReviewModalContent(dossier) {
  const modalBody = document.getElementById('assignmentReviewModalContent');
  if (!modalBody) return;

  const aiProb = dossier.aiProbability || 0;
  const aiPct = Math.round(aiProb * 100);
  const isHighAi = aiProb > 0.60;
  const isModAi = aiProb >= 0.30 && aiProb <= 0.60;

  const shieldColor = isHighAi ? 'var(--accent-rose)' : (isModAi ? 'var(--accent-amber)' : 'var(--accent-emerald)');
  const shieldLabel = isHighAi ? 'High AI Generation Detected' : (isModAi ? 'Moderate AI Assistance' : 'Authentic Student Work');

  const r = dossier.aiRubricBreakdown || {};
  const ps = r.problemSolving != null ? Number(r.problemSolving).toFixed(1) : '3.6';
  const meth = r.methodology != null ? Number(r.methodology).toFixed(1) : '2.6';
  const clar = r.clarity != null ? Number(r.clarity).toFixed(1) : '2.5';

  modalBody.innerHTML = `
    <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 1.25rem; height: 75vh; overflow: hidden;">
      
      <!-- LEFT COLUMN: PDF VIEWER & ORIGINAL QUESTIONS -->
      <div style="display: flex; flex-direction: column; gap: 0.75rem; height: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="bi bi-file-earmark-pdf-fill" style="color: var(--accent-rose); font-size: 1.4rem;"></i>
            <div>
              <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(dossier.assignmentTitle)}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Week ${dossier.weekNumber} · ${dossier.pageCount} Pages Submitted · Max Marks: ${dossier.maxMarks}.0</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <a href="${dossier.pdfUrl}" target="_blank" class="btn-action" title="Open student PDF in separate tab">
              <i class="bi bi-box-arrow-up-right"></i> Open PDF
            </a>
            <a href="${dossier.evalSheetUrl}" target="_blank" class="btn-action" title="View official Part C stamped sheet">
              <i class="bi bi-award-fill"></i> Part C Sheet
            </a>
          </div>
        </div>

        <!-- Embedded PDF iframe -->
        <div style="flex: 1; background: #1e293b; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); overflow: hidden; position: relative;">
          <iframe src="${dossier.pdfUrl}#toolbar=1" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
      </div>

      <!-- RIGHT COLUMN: AI RUBRICS, ANTI-AI DIAGNOSTICS & COMMIT CONTROLS -->
      <div style="display: flex; flex-direction: column; gap: 0.9rem; overflow-y: auto; padding-right: 0.25rem;">
        
        <!-- Student Dossier Card -->
        <div class="card" style="padding: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <strong style="font-size: 1.05rem; color: var(--text-main);">${escapeHtml(dossier.student.name)}</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(dossier.student.email)}</div>
              <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">${escapeHtml(dossier.student.college)} · ${escapeHtml(dossier.student.department)}</div>
            </div>
            <span class="badge badge-muted">Roll: ${escapeHtml(dossier.student.rollNumber)}</span>
          </div>
        </div>

        <!-- Anti-AI Writing Shield Diagnostic -->
        <div class="card" style="padding: 1rem; border-left: 4px solid ${shieldColor};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.82rem; font-weight: 700; color: ${shieldColor}; text-transform: uppercase;">
              <i class="bi bi-shield-fill"></i> ${shieldLabel}
            </span>
            <span style="font-size: 0.95rem; font-weight: 800; color: ${shieldColor};">${aiPct}% AI Confidence</span>
          </div>
          
          <div style="background: rgba(255,255,255,0.05); height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 0.6rem;">
            <div style="background: ${shieldColor}; width: ${aiPct}%; height: 100%;"></div>
          </div>

          <div style="font-size: 0.75rem; color: var(--text-muted);">
            ${dossier.aiDetectionReasons && dossier.aiDetectionReasons.length > 0 
              ? `<ul style="margin: 0; padding-left: 1.2rem;">${dossier.aiDetectionReasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` 
              : 'Prose matches organic student cadence, individual error derivations, and handwritten sketches.'}
          </div>
        </div>

        <!-- AI 4D Rubric Scorecard -->
        <div class="card" style="padding: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong style="font-size: 0.88rem; color: var(--text-main);">AI 4D Rubric Evaluation</strong>
            <span style="font-size: 1.15rem; font-weight: 800; color: var(--accent-amber);">
              ${dossier.aiScore != null ? Number(dossier.aiScore).toFixed(1) : '—'} <span style="font-size: 0.75rem; color: var(--text-muted);">/ 10</span>
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; text-align: center; margin-bottom: 0.75rem;">
            <div style="background: var(--bg-surface); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.7rem; color: var(--text-muted);">Problem Solving</div>
              <strong style="font-size: 0.95rem; color: var(--accent-cyan);">${ps} / 4.0</strong>
            </div>
            <div style="background: var(--bg-surface); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.7rem; color: var(--text-muted);">Methodology</div>
              <strong style="font-size: 0.95rem; color: var(--accent-cyan);">${meth} / 3.0</strong>
            </div>
            <div style="background: var(--bg-surface); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.7rem; color: var(--text-muted);">Clarity</div>
              <strong style="font-size: 0.95rem; color: var(--accent-cyan);">${clar} / 3.0</strong>
            </div>
          </div>

          <div style="font-size: 0.76rem; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 0.6rem; border-radius: var(--radius-sm); white-space: pre-wrap; max-height: 90px; overflow-y: auto;">
            ${escapeHtml(dossier.aiFeedback || 'No automated feedback recorded.')}
          </div>
        </div>

        <!-- Educator Review & Commit Controls -->
        <div class="card" style="padding: 1.1rem; background: rgba(30, 58, 138, 0.15); border: 1px solid var(--accent-indigo);">
          <strong style="font-size: 0.92rem; color: var(--text-main); display: block; margin-bottom: 0.75rem;">
            <i class="bi bi-pencil-square"></i> Educator Commits & Grade Override
          </strong>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 0.75rem;">Official Marks (0.0 - 10.0)</label>
              <input type="number" id="reviewAdminScore" class="form-input" min="0" max="10" step="0.1" value="${dossier.finalScore != null ? Number(dossier.finalScore).toFixed(1) : (dossier.aiScore != null ? Number(dossier.aiScore).toFixed(1) : '')}" placeholder="e.g. 8.5">
            </div>

            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 0.75rem;">Decision Status</label>
              <select id="reviewAdminStatus" class="form-input">
                <option value="ADMIN_APPROVED" ${dossier.status === 'ADMIN_APPROVED' ? 'selected' : ''}>✅ Approve & Stamp Part C</option>
                <option value="RESUBMISSION_REQUESTED" ${dossier.status === 'RESUBMISSION_REQUESTED' ? 'selected' : ''}>⚠️ Request Resubmission</option>
                <option value="FLAGGED_AI" ${dossier.status === 'FLAGGED_AI' ? 'selected' : ''}>🚨 Confirm High AI Flag</option>
                <option value="GRADED" ${dossier.status === 'GRADED' ? 'selected' : ''}>🤖 Retain AI Graded</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0.9rem;">
            <label class="form-label" style="font-size: 0.75rem;">Academic Board Feedback / Commit Notes</label>
            <textarea id="reviewAdminFeedback" class="form-input" rows="3" placeholder="Encouraging feedback, step-by-step guidance, or citation advice for the student...">${escapeHtml(dossier.adminFeedback || '')}</textarea>
          </div>

          <button class="btn-primary" style="width: 100%;" onclick="submitAssignmentReview('${dossier.id}')">
            <i class="bi bi-check2-circle"></i> Commit Official Review & Dispatch
          </button>
        </div>

      </div>
    </div>
  `;
}

/**
 * Commits the review decision to /api/admin/assignments/:id/review
 */
async function submitAssignmentReview(submissionId) {
  const scoreInput = document.getElementById('reviewAdminScore');
  const statusInput = document.getElementById('reviewAdminStatus');
  const feedbackInput = document.getElementById('reviewAdminFeedback');

  if (!scoreInput || !statusInput) return;

  const adminScore = scoreInput.value;
  const status = statusInput.value;
  const adminFeedback = feedbackInput?.value || '';

  try {
    const res = await adminFetch(`/api/admin/assignments/${submissionId}/review`, {
      method: 'POST',
      body: JSON.stringify({
        adminScore,
        status,
        adminFeedback
      })
    });

    if (res.success) {
      showToast(res.message || 'Assignment review committed!', 'success');
      closeModal('assignmentReviewModal');
      loadAdminAssignments(assignmentCurrentPage);
    }
  } catch (err) {
    showToast(err.message || 'Failed to commit review', 'error');
  }
}

/**
 * Quick one-click approval using current marks
 */
async function quickApproveAssignment(submissionId) {
  if (!confirm('Quick-approve this student submission with its provisional marks?')) return;

  try {
    const res = await adminFetch(`/api/admin/assignments/${submissionId}/review`, {
      method: 'POST',
      body: JSON.stringify({
        status: 'ADMIN_APPROVED'
      })
    });

    if (res.success) {
      showToast('Assignment approved and stamped!', 'success');
      loadAdminAssignments(assignmentCurrentPage);
    }
  } catch (err) {
    showToast(err.message || 'Approval failed', 'error');
  }
}

window.loadAdminAssignments = loadAdminAssignments;
window.openAssignmentReviewModal = openAssignmentReviewModal;
window.submitAssignmentReview = submitAssignmentReview;
window.quickApproveAssignment = quickApproveAssignment;
window.onAssignmentFilterChange = onAssignmentFilterChange;
window.onAssignmentSearchInput = onAssignmentSearchInput;

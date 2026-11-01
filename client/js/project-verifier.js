/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * project-verifier.js - Client-Side Controller for Practical Project Verification
 * Disheera Technologies Inc.
 * Manages project submission modal, animated rubric grading, and credential stamping.
 */

(function () {
  'use strict';

  function getApiBase() {
    return window.API_BASE_URL ||
      (window.location.origin.includes('5500') ? 'http://localhost:5000' : 'https://api.disheera.site');
  }

  function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  }

  // Construct and inject modal into DOM if not present
  function ensureProjectModal() {
    if (document.getElementById('projectSubmissionModal')) return;

    const modalHtml = `
      <div class="modal fade" id="projectSubmissionModal" tabindex="-1" aria-labelledby="projectSubmissionModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content bg-white border border-line rounded-4 shadow-2xl text-ink">
            <!-- Header -->
            <div class="modal-header border-bottom border-line pb-3">
              <div class="d-flex align-items-center gap-2.5">
                <div class="p-2 rounded-3 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                  <i class="bi bi-code-slash fs-4"></i>
                </div>
                <div>
                  <h5 class="modal-title fw-bold text-ink mb-0" id="projectSubmissionModalLabel">Practical Project Verification</h5>
                  <p class="text-muted small mb-0">Submit real code repository to earn the "Project Verified" credential stamp.</p>
                </div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <!-- Body -->
            <div class="modal-body p-4">
              <!-- Form Section -->
              <div id="projectFormSection">
                <div class="alert alert-info bg-info bg-opacity-10 border-info border-opacity-25 text-info d-flex align-items-center gap-2 py-2.5 mb-3 rounded-3 small">
                  <i class="bi bi-shield-check fs-5"></i>
                  <div>Evaluated across 4 dimensions: <strong>Functional Completeness (35%)</strong>, <strong>Code Quality (25%)</strong>, <strong>Documentation (20%)</strong>, and <strong>Robustness (20%)</strong>.</div>
                </div>

                <form id="projectSubmissionForm">
                  <input type="hidden" id="pvRoadmapId" value="">
                  <input type="hidden" id="pvTaskId" value="">

                  <div class="mb-3">
                    <label class="form-label text-muted small fw-semibold">PROJECT TITLE *</label>
                    <input type="text" class="form-control bg-white text-ink border-line font-mono" id="pvTitle" placeholder="e.g. Smart Irrigation Soil Moisture Telemetry Gateway" required>
                  </div>

                  <div class="row g-3 mb-3">
                    <div class="col-md-6">
                      <label class="form-label text-muted small fw-semibold">TARGET COMPETENCY *</label>
                      <input type="text" class="form-control bg-white text-ink border-line font-mono" id="pvTargetSkill" placeholder="e.g. IoT Sensor Telemetry, Node.js, Python" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label text-muted small fw-semibold">LIVE DEPLOYMENT LINK (OPTIONAL)</label>
                      <input type="url" class="form-control bg-white text-ink border-line font-mono" id="pvLiveUrl" placeholder="https://your-project.vercel.app">
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label text-muted small fw-semibold">GITHUB REPOSITORY URL *</label>
                    <div class="input-group">
                      <span class="input-group-text bg-surface-muted text-muted border-line"><i class="bi bi-github"></i></span>
                      <input type="url" class="form-control bg-white text-ink border-line font-mono" id="pvGithubUrl" placeholder="https://github.com/username/repository" required>
                    </div>
                    <div class="form-text text-muted small">Must be a public repository containing your source code and README.</div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label text-muted small fw-semibold">ARCHITECTURAL SUMMARY & KEY CHALLENGES *</label>
                    <textarea class="form-control bg-white text-ink border-line font-mono" id="pvDescription" rows="3" placeholder="Briefly explain your architectural choices, libraries used, and how you handled errors or edge cases..." required></textarea>
                  </div>

                  <div class="d-flex justify-content-end gap-2 pt-2">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary px-4 fw-semibold" id="btnSubmitProjectReview">
                      <i class="bi bi-cpu me-1.5"></i> Submit for AI Rubric Evaluation
                    </button>
                  </div>
                </form>
              </div>

              <!-- Loading / Evaluation Progress Section -->
              <div id="projectEvaluatingSection" class="d-none text-center py-5">
                <div class="spinner-border text-primary mb-3" style="width: 3.5rem; height: 3.5rem;" role="status">
                  <span class="visually-hidden">Evaluating...</span>
                </div>
                <h5 class="text-ink fw-bold mb-2">Analyzing Project Telemetry...</h5>
                <p class="text-muted small mb-3" id="evalProgressText">Fetching GitHub repository structure & dependencies...</p>

                <div class="progress bg-surface-muted border border-line rounded-pill mx-auto" style="height: 6px; max-width: 380px;">
                  <div class="progress-bar progress-bar-striped progress-bar-animated bg-primary" id="evalProgressBar" role="progressbar" style="width: 25%"></div>
                </div>
              </div>

              <!-- Results Section -->
              <div id="projectResultSection" class="d-none">
                <div class="text-center mb-4">
                  <div class="display-5 fw-bold font-mono text-ink" id="resCompositeScore">--</div>
                  <div class="text-uppercase fw-semibold font-mono small tracking-wider text-muted" id="resBadgeText">Evaluation Result</div>
                  <p class="text-muted small mt-1 mb-0" id="resSummary">Evaluation completed.</p>
                </div>

                <!-- 4 Rubric Bars -->
                <div class="p-3 rounded-3 bg-surface-muted border border-line mb-3">
                  <div class="mb-2.5">
                    <div class="d-flex justify-content-between small text-muted mb-1">
                      <span>Functional Completeness (35%)</span>
                      <span class="font-mono text-ink fw-bold" id="scoreFunc">--</span>
                    </div>
                    <div class="progress bg-white border border-line" style="height: 6px;">
                      <div class="progress-bar bg-primary" id="barFunc" style="width: 0%"></div>
                    </div>
                  </div>

                  <div class="mb-2.5">
                    <div class="d-flex justify-content-between small text-muted mb-1">
                      <span>Code Quality & Modularity (25%)</span>
                      <span class="font-mono text-ink fw-bold" id="scoreQuality">--</span>
                    </div>
                    <div class="progress bg-white border border-line" style="height: 6px;">
                      <div class="progress-bar bg-success" id="barQuality" style="width: 0%"></div>
                    </div>
                  </div>

                  <div class="mb-2.5">
                    <div class="d-flex justify-content-between small text-muted mb-1">
                      <span>Documentation & Architecture (20%)</span>
                      <span class="font-mono text-ink fw-bold" id="scoreDocs">--</span>
                    </div>
                    <div class="progress bg-white border border-line" style="height: 6px;">
                      <div class="progress-bar bg-info" id="barDocs" style="width: 0%"></div>
                    </div>
                  </div>

                  <div>
                    <div class="d-flex justify-content-between small text-muted mb-1">
                      <span>Error Handling & Robustness (20%)</span>
                      <span class="font-mono text-ink fw-bold" id="scoreRobust">--</span>
                    </div>
                    <div class="progress bg-white border border-line" style="height: 6px;">
                      <div class="progress-bar bg-warning" id="barRobust" style="width: 0%"></div>
                    </div>
                  </div>
                </div>

                <!-- Strengths & Improvements -->
                <div class="row g-2 mb-3">
                  <div class="col-md-6">
                    <div class="p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-20 h-100">
                      <div class="text-success small fw-bold mb-1"><i class="bi bi-check-circle-fill me-1"></i>Key Strengths:</div>
                      <ul class="text-secondary small ps-3 mb-0" id="resStrengthsList"></ul>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="p-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-20 h-100">
                      <div class="text-warning small fw-bold mb-1"><i class="bi bi-lightbulb-fill me-1"></i>Recommended Improvements:</div>
                      <ul class="text-secondary small ps-3 mb-0" id="resImprovementsList"></ul>
                    </div>
                  </div>
                </div>

                <div class="d-flex justify-content-end gap-2 pt-2">
                  <button type="button" class="btn btn-outline-secondary" id="btnResubmitProject">Submit Another Project</button>
                  <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close & Update Roadmap</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    bindProjectEvents();
  }

  function bindProjectEvents() {
    const form = document.getElementById('projectSubmissionForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const projectTitle = document.getElementById('pvTitle').value.trim();
      const targetSkill = document.getElementById('pvTargetSkill').value.trim();
      const githubUrl = document.getElementById('pvGithubUrl').value.trim();
      const liveUrl = document.getElementById('pvLiveUrl').value.trim();
      const description = document.getElementById('pvDescription').value.trim();
      const roadmapId = document.getElementById('pvRoadmapId').value;
      const taskId = document.getElementById('pvTaskId').value;

      // Switch to loading
      document.getElementById('projectFormSection').classList.add('d-none');
      document.getElementById('projectEvaluatingSection').classList.remove('d-none');

      // Animated progress stages
      const pText = document.getElementById('evalProgressText');
      const pBar = document.getElementById('evalProgressBar');

      setTimeout(() => {
        if (pText) pText.textContent = 'Inspecting code modularity & error boundaries...';
        if (pBar) pBar.style.width = '55%';
      }, 1200);

      setTimeout(() => {
        if (pText) pText.textContent = 'Executing 4D AI Rubric Evaluation...';
        if (pBar) pBar.style.width = '85%';
      }, 2500);

      try {
        const token = getAuthToken();
        const res = await fetch(getApiBase() + '/api/projects/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            projectTitle,
            targetSkill,
            githubUrl,
            liveUrl,
            description,
            roadmapId,
            taskId
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Project evaluation failed');
        }

        renderProjectResults(data.data.evaluation);
      } catch (err) {
        console.error('[ProjectVerifier] Submit error:', err);
        alert('Evaluation error: ' + err.message);
        document.getElementById('projectEvaluatingSection').classList.add('d-none');
        document.getElementById('projectFormSection').classList.remove('d-none');
      }
    });

    const btnResubmit = document.getElementById('btnResubmitProject');
    if (btnResubmit) {
      btnResubmit.addEventListener('click', () => {
        document.getElementById('projectResultSection').classList.add('d-none');
        document.getElementById('projectFormSection').classList.remove('d-none');
      });
    }
  }

  function renderProjectResults(ev) {
    document.getElementById('projectEvaluatingSection').classList.add('d-none');
    document.getElementById('projectResultSection').classList.remove('d-none');

    const scoreEl = document.getElementById('resCompositeScore');
    const badgeEl = document.getElementById('resBadgeText');
    const sumEl = document.getElementById('resSummary');

    scoreEl.textContent = ev.compositeScore + ' / 100';
    if (ev.passed) {
      scoreEl.className = 'display-5 fw-bold font-mono text-success';
      badgeEl.textContent = '🎉 Project Verified Credential Earned!';
      badgeEl.className = 'text-uppercase fw-semibold font-mono small text-success';
    } else {
      scoreEl.className = 'display-5 fw-bold font-mono text-warning';
      badgeEl.textContent = 'Needs Revision (Passing Score: 70)';
      badgeEl.className = 'text-uppercase fw-semibold font-mono small text-warning';
    }

    sumEl.textContent = ev.summary || '';

    // Bars
    const rb = ev.rubricBreakdown || {};
    const s1 = (rb.functionalCompleteness && rb.functionalCompleteness.score) || 75;
    const s2 = (rb.codeQuality && rb.codeQuality.score) || 75;
    const s3 = (rb.documentation && rb.documentation.score) || 70;
    const s4 = (rb.errorHandling && rb.errorHandling.score) || 70;

    document.getElementById('scoreFunc').textContent = s1 + '%';
    document.getElementById('barFunc').style.width = s1 + '%';

    document.getElementById('scoreQuality').textContent = s2 + '%';
    document.getElementById('barQuality').style.width = s2 + '%';

    document.getElementById('scoreDocs').textContent = s3 + '%';
    document.getElementById('barDocs').style.width = s3 + '%';

    document.getElementById('scoreRobust').textContent = s4 + '%';
    document.getElementById('barRobust').style.width = s4 + '%';

    // Strengths
    const strList = document.getElementById('resStrengthsList');
    strList.innerHTML = (ev.strengths || ['Good repository hygiene']).map(s => `<li>${s}</li>`).join('');

    // Improvements
    const impList = document.getElementById('resImprovementsList');
    impList.innerHTML = (ev.improvements || ['Expand unit test coverage']).map(i => `<li>${i}</li>`).join('');

    // Trigger custom event so roadmaps update UI
    window.dispatchEvent(new CustomEvent('cp-project-verified', { detail: { evaluation: ev } }));
  }

  // Public opener
  window.openProjectVerificationModal = function ({ title, skill, roadmapId, taskId }) {
    ensureProjectModal();

    // Reset views
    document.getElementById('projectResultSection').classList.add('d-none');
    document.getElementById('projectEvaluatingSection').classList.add('d-none');
    document.getElementById('projectFormSection').classList.remove('d-none');

    // Pre-fill fields
    if (title) document.getElementById('pvTitle').value = title;
    if (skill) document.getElementById('pvTargetSkill').value = skill;
    if (roadmapId) document.getElementById('pvRoadmapId').value = roadmapId;
    if (taskId) document.getElementById('pvTaskId').value = taskId;

    // Show modal via Bootstrap
    const modalEl = document.getElementById('projectSubmissionModal');
    if (window.bootstrap && window.bootstrap.Modal) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
    } else {
      modalEl.classList.add('show');
      modalEl.style.display = 'block';
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    ensureProjectModal();
  });
})();

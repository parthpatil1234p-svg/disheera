/**
 * client/js/modules/assignmentModal.js — Collegiate Weekly Assignment & PDF Submission Modal (Plan 46)
 *
 * Provides:
 * - Dynamic modal creation and management for weekly assignments
 * - Fetching weekly problem statements, learning outcomes & 4D grading rubrics
 * - One-click download of standardized Part A Cover Page (PDFKit generated)
 * - PDF submission dropzone with client-side file size and MIME-type validation
 * - Instant AI evaluation trigger and real-time score display (out of 10 marks)
 * - Anti-AI writing shield confidence indicator & feedback commentary
 * - Stamped Part C Evaluation Appendix download link
 *
 * Disheera Technologies Inc.
 */

(function () {
  'use strict';

  let currentWeekNumber = 1;
  let currentCareerId = null;
  let currentSubmission = null;
  let isEvaluating = false;

  const MODAL_ID = 'weeklyAssignmentModal';

  /**
   * Builds and injects the modal markup into the DOM if not present.
   */
  function ensureModalMarkup() {
    if (document.getElementById(MODAL_ID)) return;

    const modalHtml = `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
          <div class="modal-content text-white" style="background: #0f172a; border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
            
            <!-- Modal Header -->
            <div class="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3" style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px);">
              <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="badge" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-weight: 600; padding: 6px 12px; border-radius: 20px;">
                      <i class="bi bi-file-earmark-code-fill me-1"></i> Weekly Collegiate Assignment
                    </span>
                    <span class="badge bg-secondary bg-opacity-25 text-info font-monospace" id="wamWeekBadge">Week 1</span>
                    <span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25" id="wamMaxMarksBadge">10.0 Max Marks</span>
                  </div>
                  <h4 class="modal-title h5 fw-bold text-white mb-0" id="wamAssignmentTitle">Weekly Assignment</h4>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <div id="wamStatusPill">
                    <span class="badge bg-secondary-subtle text-muted">Loading...</span>
                  </div>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
              </div>
            </div>

            <!-- Modal Body -->
            <div class="modal-body p-4" style="background: #0b1120;">
              
              <!-- Tabs / Nav -->
              <ul class="nav nav-pills mb-4 gap-2" id="wamTabs" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active px-3 py-2 rounded-3 text-white" id="wam-overview-tab" data-bs-toggle="pill" data-bs-target="#wam-overview" type="button" role="tab" style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.3);">
                    <i class="bi bi-journal-text me-1"></i> Problem & Rubric
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link px-3 py-2 rounded-3 text-white" id="wam-submit-tab" data-bs-toggle="pill" data-bs-target="#wam-submit" type="button" role="tab" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
                    <i class="bi bi-cloud-arrow-up-fill me-1"></i> Submit Solution PDF
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link px-3 py-2 rounded-3 text-white" id="wam-results-tab" data-bs-toggle="pill" data-bs-target="#wam-results" type="button" role="tab" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
                    <i class="bi bi-award-fill me-1"></i> AI Evaluation & Marks
                  </button>
                </li>
              </ul>

              <!-- Tab Contents -->
              <div class="tab-content" id="wamTabContent">
                
                <!-- 1. Overview & Questions Tab -->
                <div class="tab-pane fade show active" id="wam-overview" role="tabpanel">
                  
                  <!-- Cover Page Callout -->
                  <div class="p-3 mb-4 rounded-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3" style="background: rgba(99, 102, 241, 0.1); border: 1px dashed rgba(99, 102, 241, 0.4);">
                    <div class="d-flex align-items-center gap-3">
                      <div class="p-2 rounded-3 text-primary" style="background: rgba(99, 102, 241, 0.2);">
                        <i class="bi bi-file-earmark-pdf fs-3"></i>
                      </div>
                      <div>
                        <h6 class="fw-bold mb-1 text-white">Standardized Part A Cover Page</h6>
                        <p class="small text-muted mb-0">Every collegiate submission must include Disheera's verified 1-page cover sheet with your student metadata and honor pledge.</p>
                      </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-primary px-3 py-2 flex-shrink-0" id="wamBtnDownloadCover" style="background: #6366f1; border: none; border-radius: 8px;">
                      <i class="bi bi-download me-1"></i> Download Part A Cover (PDF)
                    </button>
                  </div>

                  <!-- Learning Outcomes -->
                  <div class="mb-4">
                    <h6 class="text-uppercase small fw-bold text-info mb-2" style="letter-spacing: 0.5px;">
                      <i class="bi bi-bullseye me-1"></i> Core Learning Outcomes
                    </h6>
                    <div id="wamOutcomesList" class="d-flex flex-wrap gap-2">
                      <span class="badge bg-secondary bg-opacity-25 text-white">Mastering architectural foundations</span>
                    </div>
                  </div>

                  <!-- 4D Rubric Breakdown -->
                  <div class="mb-4 p-3 rounded-3" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08);">
                    <h6 class="text-uppercase small fw-bold text-warning mb-2" style="letter-spacing: 0.5px;">
                      <i class="bi bi-check2-square me-1"></i> 4D Evaluation Rubric (10.0 Marks Total)
                    </h6>
                    <div class="row g-3">
                      <div class="col-md-4">
                        <div class="p-2 rounded-2" style="background: rgba(99, 102, 241, 0.08); border-left: 3px solid #6366f1;">
                          <div class="fw-bold small text-white">Problem Solving & Correctness</div>
                          <div class="text-muted small">Max: <strong>4.0 Marks</strong></div>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="p-2 rounded-2" style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981;">
                          <div class="fw-bold small text-white">Methodology & Architecture</div>
                          <div class="text-muted small">Max: <strong>3.0 Marks</strong></div>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="p-2 rounded-2" style="background: rgba(234, 179, 8, 0.08); border-left: 3px solid #eab308;">
                          <div class="fw-bold small text-white">Clarity & Documentation</div>
                          <div class="text-muted small">Max: <strong>3.0 Marks</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Questions Container -->
                  <div>
                    <h6 class="text-uppercase small fw-bold text-white mb-3" style="letter-spacing: 0.5px;">
                      <i class="bi bi-question-circle me-1"></i> Assignment Problem Statements
                    </h6>
                    <div id="wamQuestionsList" class="d-flex flex-column gap-3">
                      <!-- Rendered dynamically -->
                    </div>
                  </div>

                </div>

                <!-- 2. Submission Tab -->
                <div class="tab-pane fade" id="wam-submit" role="tabpanel">
                  <div class="p-4 rounded-3 text-center" id="wamDropzone" style="border: 2px dashed rgba(99, 102, 241, 0.4); background: rgba(99, 102, 241, 0.03); border-radius: 12px; cursor: pointer; transition: all 0.2s ease;">
                    <i class="bi bi-file-earmark-arrow-up text-primary fs-1 mb-2 d-block"></i>
                    <h5 class="fw-bold text-white mb-1">Drag and drop your solution PDF here</h5>
                    <p class="text-muted small mb-3">Single compiled PDF containing Part A (Cover Page) and Part B (Your Solutions). Max 15MB.</p>
                    <button type="button" class="btn btn-outline-primary btn-sm px-4" id="wamBrowseBtn">
                      <i class="bi bi-folder2-open me-1"></i> Browse Files
                    </button>
                    <input type="file" id="wamFileInput" accept="application/pdf" class="d-none" />
                  </div>

                  <!-- Selected File Display -->
                  <div id="wamSelectedFileInfo" class="d-none mt-3 p-3 rounded-3" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3);">
                    <div class="d-flex align-items-center justify-content-between">
                      <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-file-earmark-check-fill text-success fs-4"></i>
                        <div>
                          <div class="fw-bold text-white" id="wamFileName">solution.pdf</div>
                          <div class="small text-muted" id="wamFileSize">0 KB</div>
                        </div>
                      </div>
                      <button type="button" class="btn btn-sm btn-link text-danger p-0" id="wamRemoveFileBtn" title="Remove file">
                        <i class="bi bi-x-circle fs-5"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Upload Progress / Evaluating Spinner -->
                  <div id="wamEvaluatingState" class="d-none text-center my-4 p-4 rounded-3" style="background: rgba(99, 102, 241, 0.06);">
                    <div class="spinner-border text-primary mb-2" role="status" style="width: 2.5rem; height: 2.5rem;"></div>
                    <h6 class="text-white fw-bold">Gemini Multimodal AI Evaluating Solutions...</h6>
                    <p class="text-muted small mb-0">Analyzing 4D rubric criteria, running Anti-AI writing heuristics, and stamping Part C evaluation sheet.</p>
                  </div>

                  <!-- Submit Action Button -->
                  <div class="mt-4 text-end">
                    <button type="button" class="btn btn-primary px-4 py-2" id="wamSubmitBtn" disabled style="background: #6366f1; border: none; border-radius: 8px;">
                      <i class="bi bi-send-fill me-1"></i> Submit & AI Evaluate
                    </button>
                  </div>
                </div>

                <!-- 3. AI Evaluation & Marks Tab -->
                <div class="tab-pane fade" id="wam-results" role="tabpanel">
                  <div id="wamResultsContent">
                    <div class="text-center py-5 text-muted">
                      <i class="bi bi-clipboard-x fs-1 mb-2 d-block"></i>
                      <h6>No Evaluation Record Yet</h6>
                      <p class="small">Submit your weekly assignment to unlock real-time Gemini AI grading and stamped feedback.</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <!-- Modal Footer -->
            <div class="modal-footer border-top border-secondary border-opacity-25 px-4 py-3" style="background: rgba(15, 23, 42, 0.85);">
              <button type="button" class="btn btn-secondary btn-sm px-3" data-bs-dismiss="modal">Close</button>
            </div>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setupEventListeners();
  }

  /**
   * Sets up dropzone, file input, and action button listeners.
   */
  function setupEventListeners() {
    const modalEl = document.getElementById(MODAL_ID);
    const dropzone = document.getElementById('wamDropzone');
    const fileInput = document.getElementById('wamFileInput');
    const browseBtn = document.getElementById('wamBrowseBtn');
    const removeFileBtn = document.getElementById('wamRemoveFileBtn');
    const submitBtn = document.getElementById('wamSubmitBtn');
    const downloadCoverBtn = document.getElementById('wamBtnDownloadCover');

    browseBtn.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('click', (e) => {
      if (e.target !== browseBtn) fileInput.click();
    });

    // Drag-and-drop
    ['dragenter', 'dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#10b981';
        dropzone.style.background = 'rgba(16, 185, 129, 0.05)';
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'rgba(99, 102, 241, 0.4)';
        dropzone.style.background = 'rgba(99, 102, 241, 0.03)';
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFileSelection(files[0]);
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) handleFileSelection(fileInput.files[0]);
    });

    removeFileBtn.addEventListener('click', () => {
      fileInput.value = '';
      document.getElementById('wamSelectedFileInfo').classList.add('d-none');
      dropzone.classList.remove('d-none');
      submitBtn.disabled = true;
    });

    downloadCoverBtn.addEventListener('click', downloadCoverTemplate);
    submitBtn.addEventListener('click', submitAssignmentPdf);
  }

  /**
   * Validates and displays selected file.
   */
  function handleFileSelection(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Invalid file format. Please upload a standard compiled PDF document.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds the 15MB limit. Please compress your PDF before uploading.');
      return;
    }

    document.getElementById('wamFileName').textContent = file.name;
    document.getElementById('wamFileSize').textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    document.getElementById('wamDropzone').classList.add('d-none');
    document.getElementById('wamSelectedFileInfo').classList.remove('d-none');
    document.getElementById('wamSubmitBtn').disabled = false;
  }

  /**
   * Downloads the standardized Part A Cover Page PDF for the active week.
   */
  async function downloadCoverTemplate() {
    try {
      const token = window.Auth?.getToken() || localStorage.getItem('token');
      const url = `${window.CONFIG?.API_BASE_URL || '/api'}/assignments/template?weekNumber=${currentWeekNumber}${currentCareerId ? `&careerId=${currentCareerId}` : ''}&token=${token || ''}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('[assignmentModal] Error downloading cover template:', err);
      alert('Failed to download cover template.');
    }
  }

  /**
   * Submits the compiled solution PDF and triggers AI auto-evaluation.
   */
  async function submitAssignmentPdf() {
    const fileInput = document.getElementById('wamFileInput');
    if (!fileInput.files || fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    const submitBtn = document.getElementById('wamSubmitBtn');
    const evaluatingState = document.getElementById('wamEvaluatingState');

    submitBtn.disabled = true;
    evaluatingState.classList.remove('d-none');

    try {
      const token = window.Auth?.getToken() || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('pdfFile', file);
      formData.append('weekNumber', currentWeekNumber);
      if (currentCareerId) formData.append('careerId', currentCareerId);

      const response = await fetch(`${window.CONFIG?.API_BASE_URL || '/api'}/assignments/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      evaluatingState.classList.add('d-none');

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Submission upload failed.');
      }

      currentSubmission = data.submission;
      renderResultsTab(currentSubmission);

      // Switch to Results Tab
      const resultsTabBtn = document.getElementById('wam-results-tab');
      const tabInstance = new bootstrap.Tab(resultsTabBtn);
      tabInstance.show();

      // Trigger Leaderboard Recalculation Notification
      if (window.leaderboardView && typeof window.leaderboardView.fetchStanding === 'function') {
        window.leaderboardView.fetchStanding();
      }

    } catch (err) {
      console.error('[assignmentModal] Submission error:', err);
      evaluatingState.classList.add('d-none');
      submitBtn.disabled = false;
      alert(`Submission error: ${err.message}`);
    }
  }

  /**
   * Renders the Results tab with AI grading, 4D rubric breakdown, anti-AI score, and Part C download.
   */
  function renderResultsTab(submission) {
    const resultsContainer = document.getElementById('wamResultsContent');
    if (!submission) return;

    const marks = submission.finalScore != null ? submission.finalScore : submission.aiScore;
    const scoreColor = marks >= 8 ? '#10b981' : marks >= 5 ? '#eab308' : '#ef4444';
    const rubric = submission.aiRubricBreakdown || {};

    const aiProbPercent = Math.round((submission.aiProbability || 0) * 100);
    let aiBadge = `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25"><i class="bi bi-shield-check me-1"></i> Authentic (${aiProbPercent}% AI)</span>`;
    if (aiProbPercent > 60) {
      aiBadge = `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"><i class="bi bi-shield-x me-1"></i> Flagged Synthetic (${aiProbPercent}% AI)</span>`;
    } else if (aiProbPercent >= 30) {
      aiBadge = `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25"><i class="bi bi-shield-exclamation me-1"></i> Moderate AI Assist (${aiProbPercent}% AI)</span>`;
    }

    const token = window.Auth?.getToken() || localStorage.getItem('token');
    const evalSheetUrl = `${window.CONFIG?.API_BASE_URL || '/api'}/assignments/eval-sheet/${submission.id}?token=${token || ''}`;

    resultsContainer.innerHTML = `
      <div class="p-4 rounded-3 mb-4" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1);">
        <div class="row align-items-center g-4">
          <div class="col-md-4 text-center border-end border-secondary border-opacity-25">
            <div class="text-muted small text-uppercase fw-semibold mb-1">Official Marks</div>
            <div class="display-4 fw-bold" style="color: ${scoreColor}; font-family: monospace;">
              ${marks != null ? marks.toFixed(1) : 'Pending'}<span class="fs-4 text-muted">/10</span>
            </div>
            <div class="mt-2">${aiBadge}</div>
          </div>
          <div class="col-md-8">
            <h6 class="text-white fw-bold mb-2">Evaluator Breakdown & Rubric</h6>
            <div class="row g-2 mb-3">
              <div class="col-sm-4">
                <div class="p-2 rounded-2" style="background: rgba(99, 102, 241, 0.1);">
                  <div class="small text-muted">Problem Solving</div>
                  <div class="fw-bold text-white">${rubric.problemSolving != null ? rubric.problemSolving : '—'} / 4.0</div>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="p-2 rounded-2" style="background: rgba(16, 185, 129, 0.1);">
                  <div class="small text-muted">Methodology</div>
                  <div class="fw-bold text-white">${rubric.methodology != null ? rubric.methodology : '—'} / 3.0</div>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="p-2 rounded-2" style="background: rgba(234, 179, 8, 0.1);">
                  <div class="small text-muted">Clarity</div>
                  <div class="fw-bold text-white">${rubric.clarity != null ? rubric.clarity : '—'} / 3.0</div>
                </div>
              </div>
            </div>
            <div class="p-3 rounded-2" style="background: rgba(0, 0, 0, 0.3); border-left: 3px solid #6366f1;">
              <div class="small text-muted mb-1 fw-bold">Team Commit & Evaluator Feedback:</div>
              <p class="small text-white mb-0" style="line-height: 1.5;">${submission.adminFeedback || submission.aiFeedback || 'Evaluation feedback logged.'}</p>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div class="small text-muted">
            <i class="bi bi-calendar-check me-1"></i> Evaluated: ${new Date(submission.updatedAt || submission.submittedAt).toLocaleDateString()}
          </div>
          <a href="${evalSheetUrl}" target="_blank" class="btn btn-sm btn-outline-info px-3">
            <i class="bi bi-file-earmark-pdf me-1"></i> Download Part C Evaluation Appendix (PDF)
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Opens the weekly assignment modal for a given week.
   */
  async function openModal({ weekNumber = 1, careerId = null } = {}) {
    ensureModalMarkup();
    currentWeekNumber = weekNumber;
    currentCareerId = careerId;
    currentSubmission = null;

    document.getElementById('wamWeekBadge').textContent = `Week ${weekNumber}`;
    document.getElementById('wamAssignmentTitle').textContent = `Week ${weekNumber} Collegiate Assignment`;
    document.getElementById('wamStatusPill').innerHTML = '<span class="badge bg-secondary-subtle text-muted">Loading...</span>';

    // Reset file input
    const fileInput = document.getElementById('wamFileInput');
    if (fileInput) fileInput.value = '';
    document.getElementById('wamDropzone')?.classList.remove('d-none');
    document.getElementById('wamSelectedFileInfo')?.classList.add('d-none');
    document.getElementById('wamSubmitBtn') && (document.getElementById('wamSubmitBtn').disabled = true);

    const modalEl = document.getElementById(MODAL_ID);
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();

    // Fetch assignment details
    try {
      const token = window.Auth?.getToken() || localStorage.getItem('token');
      const url = `${window.CONFIG?.API_BASE_URL || '/api'}/assignments/week/${weekNumber}${careerId ? `?careerId=${careerId}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success && data.assignment) {
        const a = data.assignment;
        document.getElementById('wamAssignmentTitle').textContent = a.title || `Week ${weekNumber} Assignment`;
        document.getElementById('wamMaxMarksBadge').textContent = `${a.maxMarks || 10} Max Marks`;

        // Outcomes
        const outcomesList = document.getElementById('wamOutcomesList');
        if (a.learningOutcomes && Array.isArray(a.learningOutcomes)) {
          outcomesList.innerHTML = a.learningOutcomes.map(o => `<span class="badge bg-secondary bg-opacity-25 text-white"><i class="bi bi-check me-1"></i>${o}</span>`).join('');
        }

        // Questions
        const questionsList = document.getElementById('wamQuestionsList');
        if (a.questions && Array.isArray(a.questions)) {
          questionsList.innerHTML = a.questions.map((q, idx) => `
            <div class="p-3 rounded-3" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 font-monospace">Question ${idx + 1} (${q.marks || 5} Marks)</span>
              </div>
              <h6 class="text-white fw-semibold mb-2">${q.problemStatement || q.title || 'Problem Description'}</h6>
              ${q.requirements ? `<p class="small text-muted mb-0"><strong class="text-info">Requirements:</strong> ${q.requirements}</p>` : ''}
            </div>
          `).join('');
        }

        // Submissions Status
        const statusPill = document.getElementById('wamStatusPill');
        if (data.submission) {
          currentSubmission = data.submission;
          statusPill.innerHTML = `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25"><i class="bi bi-check-circle-fill me-1"></i> Submitted (${data.submission.status})</span>`;
          renderResultsTab(currentSubmission);
        } else {
          statusPill.innerHTML = `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25"><i class="bi bi-clock-history me-1"></i> Not Submitted</span>`;
        }
      }
    } catch (err) {
      console.error('[assignmentModal] Error fetching weekly assignment details:', err);
    }
  }

  // Export to window
  window.assignmentModal = {
    open: openModal
  };

})();

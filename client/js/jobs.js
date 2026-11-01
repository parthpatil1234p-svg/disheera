/**
 * jobs.js - Verified Job Board & 1-Click Recruiter Application Controller
 *
 * Disheera · Enterprise Platform Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
  const alertContainer = document.getElementById('jobAlertContainer');
  const badgeOpeningsCount = document.getElementById('badgeOpeningsCount');
  const badgeMyAppsCount = document.getElementById('badgeMyAppsCount');

  // Openings Tab Elements
  const openingsSpinner = document.getElementById('openingsSpinner');
  const emptyOpenings = document.getElementById('emptyOpenings');
  const openingsGrid = document.getElementById('openingsGrid');
  const filterCareerSlug = document.getElementById('filterCareerSlug');
  const filterWorkplace = document.getElementById('filterWorkplace');
  const jobSearchInput = document.getElementById('jobSearchInput');
  const btnClearJobSearch = document.getElementById('btnClearJobSearch');
  const searchRelevanceBadge = document.getElementById('searchRelevanceBadge');

  let cachedOpenings = [];
  const searchEngine = window.SearchRelevanceEngine ? window.SearchRelevanceEngine.create() : null;

  // URL query pre-population (Google SearchAction support)
  const initialUrlQuery = new URLSearchParams(window.location.search).get('q');
  if (initialUrlQuery && jobSearchInput) {
    jobSearchInput.value = initialUrlQuery;
    if (btnClearJobSearch) btnClearJobSearch.style.display = 'block';
  }

  // Applications Tab Elements
  const tabApplications = document.getElementById('tabApplications');
  const appsSpinner = document.getElementById('appsSpinner');
  const emptyApps = document.getElementById('emptyApps');
  const appsTableCard = document.getElementById('appsTableCard');
  const appsTableBody = document.getElementById('appsTableBody');

  // Apply Modal Elements
  const applyModal = new bootstrap.Modal(document.getElementById('applyModal'));
  const applyModalSubtitle = document.getElementById('applyModalSubtitle');
  const applyCandidateName = document.getElementById('applyCandidateName');
  const applyMatchScoreBadge = document.getElementById('applyMatchScoreBadge');
  const applyCandidateDetails = document.getElementById('applyCandidateDetails');
  const applyCoverNote = document.getElementById('applyCoverNote');
  const applyForm = document.getElementById('applyForm');
  const btnSubmitApplication = document.getElementById('btnSubmitApplication');
  const applyModalAlert = document.getElementById('applyModalAlert');

  let activeApplyJob = null;

  const showAlert = (message, type = 'danger') => {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-2 px-3 small mb-3" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}"></i>
        <div>${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto p-2" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  // ── Role-Aware Navbar Adaptation for Corporate Recruiters ───
  if (window.Auth?.isRecruiter()) {
    const desktopNavLinks = document.querySelector('.notch-nav-links');
    if (desktopNavLinks) {
      desktopNavLinks.innerHTML = `
        <li>
          <a class="notch-nav-link" href="recruiter-dashboard.html">
            <i class="bi bi-broadcast text-success me-1"></i> Openings &amp; Radar
          </a>
        </li>
        <li>
          <a class="notch-nav-link active" href="jobs.html" aria-current="page">
            <i class="bi bi-briefcase-fill text-primary me-1"></i> Public Job Board
          </a>
        </li>
        <li>
          <a class="notch-nav-link" href="dashboard.html">
            <i class="bi bi-mortarboard text-secondary me-1"></i> Student View
          </a>
        </li>
      `;
    }
    const mobileLinks = document.querySelector('#jobsMobileMenu .notch-mobile-links');
    if (mobileLinks) {
      mobileLinks.innerHTML = `
        <li>
          <a href="recruiter-dashboard.html">
            <i class="bi bi-broadcast text-success"></i> Openings &amp; Radar
          </a>
        </li>
        <li>
          <a class="active" href="jobs.html">
            <i class="bi bi-briefcase text-primary"></i> Public Job Board
          </a>
        </li>
        <li>
          <a href="dashboard.html">
            <i class="bi bi-mortarboard text-secondary"></i> Student View
          </a>
        </li>
        <li class="pt-2 border-top border-secondary border-opacity-25" id="notchMobileAuthActions"></li>
      `;
    }
    const recruiterCtaBtn = document.querySelector('a[href*="role=recruiter"]');
    if (recruiterCtaBtn) {
      recruiterCtaBtn.href = 'recruiter-dashboard.html';
      recruiterCtaBtn.className = 'btn btn-success btn-sm py-2 px-3 fw-semibold';
      recruiterCtaBtn.innerHTML = '<i class="bi bi-broadcast me-1"></i> Recruiter Dashboard';
    }
  }

  // ── Render Openings Cards List ──────────────────────────────
  const renderOpeningsList = (openings) => {
    if (!openings || openings.length === 0) {
      openingsGrid.innerHTML = '';
      emptyOpenings.classList.remove('d-none');
      openingsGrid.classList.add('d-none');
      return;
    }

    emptyOpenings.classList.add('d-none');
    openingsGrid.innerHTML = '';

    openings.forEach((job) => {
      const score = job.matchScore || 75;
      const isHighMatch = score >= 80;
      const matchClass = isHighMatch ? 'match-badge-high' : 'match-badge-med';

      const logoUrl = job.companyLogo || `https://www.google.com/s2/favicons?domain=${job.company?.domain || 'company.com'}&sz=128`;
      const salaryText = job.salaryRange?.isDisclosed
        ? `₹${(job.salaryRange.min / 100000).toFixed(1)}L - ₹${(job.salaryRange.max / 100000).toFixed(1)}L / yr`
        : 'Competitive CTC';

      const skillsHtml = (job.requiredSkills || [])
        .map((s) => {
          const sName = s.skillName || s;
          const isMatched = (job.matchedSkills || []).some((m) => (m.name || m).toLowerCase() === sName.toLowerCase());
          return `
            <span class="badge ${isMatched ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-light text-secondary border'} me-1 mb-1" style="font-size:0.75rem;">
              ${isMatched ? '<i class="bi bi-check-circle-fill me-1"></i>' : ''}${escapeHtml(sName)}
            </span>
          `;
        })
        .join('');

      const col = document.createElement('div');
      col.className = 'col-lg-6';
      col.innerHTML = `
        <div class="job-card-direct h-100">
          <div>
            <!-- Top Row: Company & Match Badge -->
            <div class="d-flex align-items-start justify-content-between mb-3">
              <div class="d-flex align-items-center gap-2.5">
                <div class="company-logo-box">
                  <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(job.companyName)}" class="company-logo-img" onerror="this.src='assets/logo.svg'" />
                </div>
                <div>
                  <h3 class="h6 fw-bold text-ink mb-0">${escapeHtml(job.companyName)}</h3>
                  <div class="verified-employer-pill mt-0.5">
                    <i class="bi bi-patch-check-fill"></i> Verified Enterprise
                  </div>
                </div>
              </div>

              <div class="match-badge-large ${matchClass}">
                <i class="bi bi-lightning-charge-fill"></i>
                <span>${score}%</span>
              </div>
            </div>

            <!-- Job Title -->
            <h2 class="h5 fw-bold text-ink mb-2">${escapeHtml(job.title)}</h2>

            <!-- Key Metadata Chips -->
            <div class="d-flex flex-wrap gap-2 text-muted small mb-3">
              <span class="d-inline-flex align-items-center gap-1">
                <i class="bi bi-geo-alt"></i> ${escapeHtml(job.location || 'Remote')}
              </span>
              <span>&middot;</span>
              <span class="d-inline-flex align-items-center gap-1 text-capitalize">
                <i class="bi bi-laptop"></i> ${escapeHtml(job.workplace)}
              </span>
              <span>&middot;</span>
              <span class="d-inline-flex align-items-center gap-1 fw-semibold text-ink">
                <i class="bi bi-cash-stack text-success"></i> ${escapeHtml(salaryText)}
              </span>
            </div>

            <!-- Job Description Snippet -->
            <p class="text-secondary small mb-3" style="line-height:1.5;">
              ${escapeHtml(job.description.slice(0, 160))}${job.description.length > 160 ? '...' : ''}
            </p>

            <!-- Required Skills Tag Container -->
            <div class="mb-3">
              <div class="small fw-semibold text-muted mb-1" style="font-size:0.72rem; letter-spacing:0.02em;">REQUIRED SKILLS:</div>
              <div class="d-flex flex-wrap">${skillsHtml || '<span class="text-muted small">Open to all tech stacks</span>'}</div>
            </div>
          </div>

          <!-- Footer: Application Button & Deadline -->
          <div class="pt-3 border-top border-line d-flex align-items-center justify-content-between">
            <div class="d-flex flex-column">
              <span class="small text-muted font-mono" style="font-size:0.75rem;">
                Posted by Authorized Recruiter
              </span>
              ${job.deadline ? `
                <span class="small text-secondary font-mono d-inline-flex align-items-center gap-1 mt-0.5" style="font-size:0.72rem;">
                  <i class="bi bi-clock-history text-primary"></i>
                  <span>Apply by ${new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>
              ` : ''}
            </div>

            ${job.hasApplied
              ? `<button class="btn btn-outline-success btn-sm px-3 fw-semibold" disabled>
                   <i class="bi bi-check2-circle me-1"></i> Applied &middot; Under Review
                 </button>`
              : `<button class="btn cp-btn-primary btn-sm px-3.5 py-1.5 fw-semibold btn-open-apply" data-job-id="${job._id}" data-job-title="${escapeHtml(job.title)}" data-company="${escapeHtml(job.companyName)}" data-match="${score}">
                   <i class="bi bi-send-fill me-1"></i> Apply to this role
                 </button>`
            }
          </div>
        </div>
      `;
      openingsGrid.appendChild(col);
    });

    openingsGrid.classList.remove('d-none');

    // Wire Apply Buttons
    document.querySelectorAll('.btn-open-apply').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!window.Auth?.isAuthenticated()) {
          window.location.href = 'login.html?redirect=jobs.html';
          return;
        }

        const jobId = btn.getAttribute('data-job-id');
        const title = btn.getAttribute('data-job-title');
        const company = btn.getAttribute('data-company');
        const match = btn.getAttribute('data-match');

        activeApplyJob = { id: jobId, title, company, match };

        const currentUser = window.Auth.getCurrentUser() || {};
        applyModalSubtitle.textContent = `${title} at ${company}`;
        applyCandidateName.textContent = currentUser.name || 'Candidate';
        applyMatchScoreBadge.textContent = `${match}% Personal Match`;
        applyCandidateDetails.textContent = `${currentUser.education?.course || 'Degree Program'} · ${currentUser.education?.college || 'College'}`;

        applyCoverNote.value = '';
        applyModalAlert.innerHTML = '';
        applyModal.show();
      });
    });
  };

  // Expose global modal opener for Industrial Proximity Radar cards
  window.openJobApplyModal = (jobId, title, company, match = 88) => {
    activeApplyJob = { id: jobId, title, company, match };
    const currentUser = window.Auth.getCurrentUser() || {};
    applyModalSubtitle.textContent = `${title} at ${company}`;
    applyCandidateName.textContent = currentUser.name || 'Candidate';
    applyMatchScoreBadge.textContent = `${match}% Personal Match`;
    applyCandidateDetails.textContent = `${currentUser.education?.course || 'Degree Program'} · ${currentUser.education?.college || 'College'}`;
    applyCoverNote.value = '';
    applyModalAlert.innerHTML = '';
    applyModal.show();
  };

  // ── BM25 Hybrid Client Search Execution ──────────────────────
  const executeClientSearch = () => {
    const query = (jobSearchInput?.value || '').trim();
    if (btnClearJobSearch) {
      btnClearJobSearch.style.display = query ? 'block' : 'none';
    }

    if (!query || !searchEngine) {
      if (searchRelevanceBadge) {
        searchRelevanceBadge.innerHTML = '<i class="bi bi-funnel text-secondary me-1"></i>Default Sorted';
      }
      renderOpeningsList(cachedOpenings);
      return;
    }

    const searchResults = searchEngine.search(
      cachedOpenings,
      query,
      (job) => ({
        title: job.title || '',
        skills: (job.requiredSkills || []).map(s => s.skillName || s),
        company: job.companyName || '',
        category: job.careerSlug || '',
        description: job.description || ''
      })
    );

    const rankedJobs = searchResults.map(res => res.item);
    if (searchRelevanceBadge) {
      searchRelevanceBadge.innerHTML = `<i class="bi bi-stars text-warning me-1"></i>BM25: ${rankedJobs.length} match${rankedJobs.length === 1 ? '' : 'es'}`;
    }
    renderOpeningsList(rankedJobs);
  };

  // ── 1. Fetch & Render Verified Openings ──────────────────────
  const loadOpenings = async (silent = false) => {
    if (!silent) {
      openingsSpinner.classList.remove('d-none');
      openingsGrid.classList.add('d-none');
      emptyOpenings.classList.add('d-none');
    }

    const params = new URLSearchParams();
    if (filterCareerSlug?.value) params.set('careerSlug', filterCareerSlug.value);
    if (filterWorkplace?.value) params.set('workplace', filterWorkplace.value);

    try {
      const response = await window.API.get(`/jobs/recruiter-openings?${params.toString()}`, { auth: true });
      if (!silent) openingsSpinner.classList.add('d-none');

      const incoming = response.data?.openings || [];
      const hasChanged = !silent || incoming.length !== cachedOpenings.length || 
        JSON.stringify(incoming.map(j => j._id || j.id)) !== JSON.stringify(cachedOpenings.map(j => j._id || j.id));

      if (hasChanged) {
        cachedOpenings = incoming;
        if (badgeOpeningsCount) badgeOpeningsCount.textContent = cachedOpenings.length;
        executeClientSearch();
      }
    } catch (err) {
      if (!silent) {
        openingsSpinner.classList.add('d-none');
        showAlert(err.message || 'Failed to load verified company openings.');
      }
    }
  };

  // ── 2. Fetch & Render My Applications ────────────────────────
  const loadMyApplications = async () => {
    if (!window.Auth?.isAuthenticated()) return;

    appsSpinner.classList.remove('d-none');
    appsTableCard.classList.add('d-none');
    emptyApps.classList.add('d-none');

    try {
      const response = await window.API.get('/jobs/my-applications', { auth: true });
      appsSpinner.classList.add('d-none');

      const apps = response.data?.applications || [];
      if (badgeMyAppsCount) badgeMyAppsCount.textContent = apps.length;

      if (apps.length === 0) {
        emptyApps.classList.remove('d-none');
        return;
      }

      appsTableBody.innerHTML = '';
      apps.forEach((app) => {
        const job = app.job || {};
        let stageBadge = `<span class="badge bg-secondary-subtle text-secondary px-2.5 py-1">📥 Applied</span>`;

        if (app.status === 'reviewed') {
          stageBadge = `<span class="badge bg-info-subtle text-info px-2.5 py-1">👀 Under Review</span>`;
        } else if (app.status === 'shortlisted') {
          stageBadge = `<span class="badge bg-warning-subtle text-warning px-2.5 py-1 fw-bold">⭐ Shortlisted</span>`;
        } else if (app.status === 'interview_scheduled') {
          stageBadge = `<span class="badge bg-success-subtle text-success px-2.5 py-1 fw-bold">📅 Interview Scheduled</span>`;
        } else if (app.status === 'rejected') {
          stageBadge = `<span class="badge bg-danger-subtle text-danger px-2.5 py-1">✕ Application Closed</span>`;
        }

        const salaryDisplay = job.salaryRange
          ? `₹${(job.salaryRange.min / 100000).toFixed(1)}L - ₹${(job.salaryRange.max / 100000).toFixed(1)}L`
          : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="ps-4">
            <div class="fw-bold text-ink">${escapeHtml(job.title || 'Role')}</div>
            <div class="small text-muted">${escapeHtml(job.companyName || 'Verified Employer')}</div>
          </td>
          <td class="text-capitalize">${escapeHtml(job.workplace || 'Remote')}</td>
          <td class="fw-semibold text-ink">${escapeHtml(salaryDisplay)}</td>
          <td>
            <span class="badge bg-light text-dark border font-mono">
              <i class="bi bi-lightning-charge-fill text-warning me-1"></i>${app.matchScore}%
            </span>
          </td>
          <td class="text-muted small">${new Date(app.appliedAt).toLocaleDateString()}</td>
          <td class="pe-4 text-end">${stageBadge}</td>
        `;
        appsTableBody.appendChild(tr);
      });

      appsTableCard.classList.remove('d-none');
    } catch (err) {
      appsSpinner.classList.add('d-none');
      console.warn('Could not load user applications:', err.message);
    }
  };

  // ── 3. Submit 1-Click Application ────────────────────────────
  if (applyForm) {
    applyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeApplyJob) return;

      const originalBtn = btnSubmitApplication.innerHTML;
      btnSubmitApplication.disabled = true;
      btnSubmitApplication.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status"></span>
        <span>Submitting Application...</span>
      `;

      try {
        const response = await window.API.post(`/jobs/${activeApplyJob.id}/apply`, {
          coverNote: applyCoverNote.value.trim(),
          roleTitle: activeApplyJob.title,
          companyName: activeApplyJob.company,
        }, { auth: true });

        btnSubmitApplication.disabled = false;
        btnSubmitApplication.innerHTML = originalBtn;

        if (response.success) {
          applyModal.hide();
          showAlert(`🎉 Your application was successfully delivered to ${activeApplyJob.company} for "${activeApplyJob.title}"!`, 'success');
          loadOpenings(true);
          loadMyApplications();
        } else {
          applyModalAlert.innerHTML = `
            <div class="alert alert-danger py-2 small mb-3">${escapeHtml(response.message || 'Could not submit application.')}</div>
          `;
        }
      } catch (err) {
        btnSubmitApplication.disabled = false;
        btnSubmitApplication.innerHTML = originalBtn;
        applyModalAlert.innerHTML = `
          <div class="alert alert-danger py-2 small mb-3">${escapeHtml(err.message || 'Application failed.')}</div>
        `;
      }
    });
  }

  // ── Real-Time Job Stream & Polling Sync ──────────────────────
  const initRealTimeJobFeed = () => {
    // 1. WebSocket Live Stream
    if (window.CareerPathSocket) {
      window.CareerPathSocket.init();

      window.CareerPathSocket.on('new_job_opening', (data) => {
        if (!data || !data.job) return;
        const newJob = data.job;
        const exists = cachedOpenings.some(j => (j._id || j.id) === (newJob._id || newJob.id));
        if (exists) return;

        // Compute client match score if student is logged in
        const user = window.Auth?.getCurrentUser();
        if (user && Array.isArray(user.skills) && Array.isArray(newJob.requiredSkills)) {
          const userSkillsMap = new Map();
          user.skills.forEach(s => userSkillsMap.set((s.name || s).toLowerCase(), s));
          let matches = 0;
          newJob.requiredSkills.forEach(reqS => {
            const sName = (reqS.skillName || reqS).toLowerCase();
            const candS = userSkillsMap.get(sName);
            if (candS) matches += (candS.isQuizVerified || candS.isCodeVerified ? 1.0 : 0.7);
          });
          const raw = Math.round((matches / (newJob.requiredSkills.length || 1)) * 100);
          newJob.matchScore = Math.min(99, Math.max(45, raw));
        } else {
          newJob.matchScore = newJob.matchScore || 78;
        }

        // Prepend new job to cached list
        cachedOpenings.unshift(newJob);
        if (badgeOpeningsCount) badgeOpeningsCount.textContent = cachedOpenings.length;

        // Display sleek live toast banner
        const liveToastHtml = `
          <div class="alert alert-success alert-dismissible fade show d-flex align-items-center justify-content-between py-2 px-3 small mb-3 border-success-subtle shadow-xs" role="alert">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-success font-mono" style="font-size:0.68rem;">LIVE NEW JOB</span>
              <span class="fw-bold text-ink">${escapeHtml(newJob.title)}</span>
              <span class="text-secondary">at</span>
              <span class="fw-semibold text-ink">${escapeHtml(newJob.companyName || 'Verified Enterprise')}</span>
              <span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size:0.68rem;">Just Posted</span>
            </div>
            <button type="button" class="btn-close ms-2 p-1.5" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        `;
        alertContainer.insertAdjacentHTML('afterbegin', liveToastHtml);

        // Re-execute search / filter so new job is rendered instantly
        executeClientSearch();
      });

      window.CareerPathSocket.on('job_status_changed', (data) => {
        if (!data || !data.jobId) return;
        const { jobId, status } = data;
        if (status === 'closed' || status === 'paused') {
          cachedOpenings = cachedOpenings.filter(j => (j._id || j.id) !== jobId);
          if (badgeOpeningsCount) badgeOpeningsCount.textContent = cachedOpenings.length;
          executeClientSearch();
        }
      });
    }

    // 2. Background Polling Fallback (every 20s) to keep real-time guarantee 100% reliable
    setInterval(() => {
      loadOpenings(true);
      if (document.getElementById('contentApplications')?.classList.contains('active')) {
        loadMyApplications();
      }
    }, 20000);
  };

  if (filterCareerSlug) filterCareerSlug.addEventListener('change', () => loadOpenings(false));
  if (filterWorkplace) filterWorkplace.addEventListener('change', () => loadOpenings(false));
  if (tabApplications) tabApplications.addEventListener('click', loadMyApplications);

  // Live BM25 Search Listeners
  if (jobSearchInput) {
    let debounceTimer;
    jobSearchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        executeClientSearch();
      }, 150);
    });
  }

  if (btnClearJobSearch) {
    btnClearJobSearch.addEventListener('click', () => {
      if (jobSearchInput) {
        jobSearchInput.value = '';
        executeClientSearch();
        jobSearchInput.focus();
      }
    });
  }

  // Initial Data Load & Real-Time Activation
  await loadOpenings();
  await loadMyApplications();
  initRealTimeJobFeed();
});

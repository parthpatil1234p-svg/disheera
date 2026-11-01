/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * recruiter.js — Corporate Recruiter Dashboard & Applicant Radar Controller
 *
 * Disheera · Enterprise Platform Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Strict Portal Isolation Guard (blocks students and redirects to dashboard.html immediately)
  const existingUser = window.Auth?.getCurrentUser();
  if (existingUser && existingUser.role !== 'recruiter' && existingUser.role !== 'admin') {
    sessionStorage.setItem(
      'portal_redirect_alert',
      '🎓 Student accounts cannot access the company recruiter portal. You have been redirected to your Student Dashboard.'
    );
    window.location.replace('dashboard.html');
    return;
  }

  // 2. Enforce Recruiter Auth Guard
  if (!window.Auth?.isAuthenticated()) {
    window.location.href = 'login.html?redirect=recruiter-dashboard.html';
    return;
  }

  // 3. Final Verification
  if (!window.Auth?.requireRecruiter()) {
    return;
  }

  let currentUser = window.Auth.getCurrentUser();

  // DOM Elements - Profile & KPIs
  const recruiterGreeting = document.getElementById('recruiterGreeting');
  const companyNameText = document.getElementById('companyNameText');
  const companySubtitle = document.getElementById('companySubtitle');
  const companyDomainBadge = document.getElementById('companyDomainBadge');
  const navCompanyName = document.getElementById('navCompanyName');
  const kpiActiveOpenings = document.getElementById('kpiActiveOpenings');
  const kpiTotalApplicants = document.getElementById('kpiTotalApplicants');
  const kpiShortlisted = document.getElementById('kpiShortlisted');
  const kpiTrustScore = document.getElementById('kpiTrustScore');

  // DOM Elements - Jobs Table
  const jobsLoadingSpinner = document.getElementById('jobsLoadingSpinner');
  const emptyJobsPlaceholder = document.getElementById('emptyJobsPlaceholder');
  const jobsTableContainer = document.getElementById('jobsTableContainer');
  const jobsTableBody = document.getElementById('jobsTableBody');
  const btnRefreshJobs = document.getElementById('btnRefreshJobs');
  const alertContainer = document.getElementById('recruiterAlertContainer');
  const btnRecruiterLogout = document.getElementById('btnRecruiterLogout');

  // DOM Elements - Create Job Modal
  const createJobForm = document.getElementById('createJobForm');
  const btnSubmitJob = document.getElementById('btnSubmitJob');
  const modalAlertContainer = document.getElementById('modalAlertContainer');
  const skillsInput = document.getElementById('skillsInput');
  const skillChips = document.querySelectorAll('.role-skill-chip');

  // DOM Elements - Applicant Radar Modal
  const applicantRadarModal = new bootstrap.Modal(document.getElementById('applicantRadarModal'));
  const radarJobTitle = document.getElementById('radarJobTitle');
  const radarTotalCount = document.getElementById('radarTotalCount');
  const radarLoadingSpinner = document.getElementById('radarLoadingSpinner');
  const emptyRadarPlaceholder = document.getElementById('emptyRadarPlaceholder');
  const radarApplicantsList = document.getElementById('radarApplicantsList');

  let activeJobRadarId = null;

  const showAlert = (message, type = 'danger') => {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-2 px-3 small mb-3" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}"></i>
        <div>${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto p-2" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  const showModalAlert = (message, type = 'danger') => {
    modalAlertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-2 px-3 small mb-3" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}"></i>
        <div>${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto p-2" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  if (btnRecruiterLogout) {
    btnRecruiterLogout.addEventListener('click', () => {
      window.Auth.logout();
    });
  }

  // ── Skill Chips Click Handler ───────────────────────────────
  skillChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const skill = chip.getAttribute('data-skill');
      if (!skill || !skillsInput) return;
      const current = skillsInput.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!current.includes(skill)) {
        current.push(skill);
        skillsInput.value = current.join(', ');
      }
    });
  });

  // ── Deadline Preset Helper ─────────────────────────────────
  const jobDeadlineInput = document.getElementById('jobDeadlineInput');
  const deadlinePresetSelect = document.getElementById('deadlinePresetSelect');

  const updateDeadlineFromPreset = (days = 30) => {
    if (!jobDeadlineInput) return;
    const d = new Date();
    d.setDate(d.getDate() + parseInt(days, 10));
    jobDeadlineInput.value = d.toISOString().split('T')[0];
  };

  if (deadlinePresetSelect && jobDeadlineInput) {
    updateDeadlineFromPreset(30);
    deadlinePresetSelect.addEventListener('change', (e) => {
      updateDeadlineFromPreset(e.target.value);
    });
  }

  // ── 1. Fetch Recruiter Profile & Stats ───────────────────────
  const loadRecruiterProfile = async () => {
    try {
      const response = await window.API.get('/recruiter/profile', { auth: true });
      if (response.success && response.data) {
        const { recruiter, company, stats } = response.data;

        if (recruiterGreeting) recruiterGreeting.textContent = `Welcome back, ${recruiter.name}`;
        if (companyNameText) companyNameText.textContent = company.name || 'Company';
        if (navCompanyName) navCompanyName.textContent = company.name || 'Enterprise Recruiter';
        if (companyDomainBadge) companyDomainBadge.textContent = company.domain || 'verified';
        if (companySubtitle) {
          companySubtitle.innerHTML = `Managing openings &amp; candidate pipelines for <strong class="text-ink">${escapeHtml(company.name)}</strong> · ${escapeHtml(company.industry || 'Tech')}`;
        }

        if (kpiActiveOpenings) kpiActiveOpenings.textContent = stats.activeOpenings || 0;
        if (kpiTotalApplicants) kpiTotalApplicants.textContent = stats.totalApplicants || 0;
        if (kpiShortlisted) kpiShortlisted.textContent = stats.shortlistedCount || 0;
        if (kpiTrustScore) kpiTrustScore.textContent = `${recruiter.verificationScore || 98}%`;
      }
    } catch (err) {
      console.warn('Could not load recruiter profile directly, using cached auth session:', err.message);
      if (currentUser) {
        if (recruiterGreeting) recruiterGreeting.textContent = `Welcome back, ${currentUser.name || 'Recruiter'}`;
        if (companyNameText) companyNameText.textContent = currentUser.recruiterProfile?.companyName || 'Corporate Partner';
        if (navCompanyName) navCompanyName.textContent = currentUser.recruiterProfile?.companyName || 'Corporate Partner';
        if (companyDomainBadge) companyDomainBadge.textContent = currentUser.recruiterProfile?.companyDomain || 'corporate.com';
      }
    }
  };

  // ── 2. Fetch Recruiter Job Openings ──────────────────────────
  const loadMyJobs = async () => {
    jobsLoadingSpinner.classList.remove('d-none');
    jobsTableContainer.classList.add('d-none');
    emptyJobsPlaceholder.classList.add('d-none');

    try {
      const response = await window.API.get('/recruiter/jobs', { auth: true });
      jobsLoadingSpinner.classList.add('d-none');

      const jobs = response.data?.jobs || [];

      if (jobs.length === 0) {
        emptyJobsPlaceholder.classList.remove('d-none');
        return;
      }

      jobsTableBody.innerHTML = '';
      jobs.forEach((job) => {
        const tr = document.createElement('tr');
        const isClosed = job.status === 'closed';
        const isPaused = job.status === 'paused';
        const deadlineDate = job.deadline ? new Date(job.deadline) : null;
        const isExpired = deadlineDate && deadlineDate < new Date();
        const isActive = job.status === 'active' && !isExpired;

        let statusBadge = '';
        let deadlineNotice = '';

        if (isClosed) {
          statusBadge = `<span class="badge bg-secondary text-white px-2.5 py-1 text-capitalize"><i class="bi bi-x-circle-fill me-1" style="font-size:0.6rem;"></i>Closed</span>`;
          deadlineNotice = `<div class="small text-muted font-mono mt-0.5" style="font-size:0.72rem;">Manually ended</div>`;
        } else if (isExpired) {
          statusBadge = `<span class="badge bg-danger-subtle text-danger px-2.5 py-1 text-capitalize"><i class="bi bi-hourglass-bottom me-1" style="font-size:0.6rem;"></i>Expired</span>`;
          deadlineNotice = `<div class="small text-danger font-mono fw-semibold mt-0.5" style="font-size:0.72rem;"><i class="bi bi-calendar-x me-1"></i>Expired (${deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})</div>`;
        } else if (isPaused) {
          statusBadge = `<span class="badge bg-warning-subtle text-warning px-2.5 py-1 text-capitalize"><i class="bi bi-pause-circle-fill me-1" style="font-size:0.6rem;"></i>Paused</span>`;
          deadlineNotice = `<div class="small text-muted font-mono mt-0.5" style="font-size:0.72rem;">Applications paused</div>`;
        } else {
          statusBadge = `<span class="badge bg-success-subtle text-success px-2.5 py-1 text-capitalize"><i class="bi bi-circle-fill me-1" style="font-size:0.6rem;"></i>Active</span>`;
          if (deadlineDate) {
            const diffDays = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
            deadlineNotice = `<div class="small text-muted font-mono mt-0.5" style="font-size:0.72rem;"><i class="bi bi-clock-history text-primary me-1"></i>Closes in ${diffDays}d (${deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})</div>`;
          }
        }

        const formattedSkills = (job.requiredSkills || [])
          .map((s) => `<span class="badge bg-light text-dark border me-1"><i class="bi bi-patch-check-fill text-success me-1"></i>${escapeHtml(s.skillName || s)}</span>`)
          .join('');

        const salaryDisplay = job.salaryRange?.isDisclosed
          ? `₹${(job.salaryRange.min / 100000).toFixed(1)}L - ₹${(job.salaryRange.max / 100000).toFixed(1)}L`
          : 'Confidential';

        tr.innerHTML = `
          <td class="ps-4">
            <div class="fw-bold text-ink">${escapeHtml(job.title)}</div>
            <div class="small text-muted font-mono" style="font-size:0.75rem;">${escapeHtml(job.careerSlug)}</div>
          </td>
          <td>
            <span class="badge bg-secondary-subtle text-secondary text-uppercase">${escapeHtml(job.workplace)}</span>
            <div class="small text-muted mt-0.5">${escapeHtml(job.location || 'Remote')}</div>
          </td>
          <td>
            <span class="fw-semibold text-ink">${salaryDisplay}</span>
            <div class="small text-muted text-capitalize">${escapeHtml(job.experienceLevel)}</div>
          </td>
          <td style="max-width: 240px;">
            <div class="d-flex flex-wrap gap-1">${formattedSkills || '<span class="text-muted small">All skills</span>'}</div>
          </td>
          <td>
            ${statusBadge}
            ${deadlineNotice}
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 px-2.5 py-1 btn-view-applicants" data-job-id="${job._id}" data-job-title="${escapeHtml(job.title)}">
              <i class="bi bi-people-fill"></i>
              <span class="fw-bold">${job.applicantsCount || 0}</span>
              <span class="d-none d-sm-inline">Applicants</span>
            </button>
          </td>
          <td class="pe-4 text-end">
            <div class="btn-group">
              ${!isClosed ? `
                <button class="btn btn-sm btn-light border btn-toggle-status" data-job-id="${job._id}" data-current-status="${job.status}" title="${isActive ? 'Pause Applications' : 'Activate Opening'}">
                  <i class="bi ${isActive ? 'bi-pause-fill text-warning' : 'bi-play-fill text-success'}"></i>
                </button>
                <button class="btn btn-sm btn-light border btn-close-job text-danger" data-job-id="${job._id}" data-job-title="${escapeHtml(job.title)}" title="Permanently End / Close Opening">
                  <i class="bi bi-x-octagon-fill"></i>
                </button>
              ` : `
                <button class="btn btn-sm btn-light border btn-toggle-status" data-job-id="${job._id}" data-current-status="closed" title="Re-open Opening">
                  <i class="bi bi-arrow-counterclockwise text-primary"></i>
                </button>
              `}
              <button class="btn btn-sm btn-light border btn-copy-link" data-job-id="${job._id}" title="Copy Student Share Link">
                <i class="bi bi-link-45deg"></i>
              </button>
            </div>
          </td>
        `;
        jobsTableBody.appendChild(tr);
      });

      jobsTableContainer.classList.remove('d-none');
      attachJobActionHandlers();
    } catch (err) {
      jobsLoadingSpinner.classList.add('d-none');
      showAlert(err.message || 'Failed to load recruiter job openings.');
    }
  };

  // ── 3. Attach Dynamic Table Action Handlers ─────────────────
  const attachJobActionHandlers = () => {
    // View Applicants Button
    document.querySelectorAll('.btn-view-applicants').forEach((btn) => {
      btn.addEventListener('click', () => {
        const jobId = btn.getAttribute('data-job-id');
        const jobTitle = btn.getAttribute('data-job-title');
        openApplicantRadar(jobId, jobTitle);
      });
    });

    // Toggle Status Button (Active / Paused / Reopen)
    document.querySelectorAll('.btn-toggle-status').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const jobId = btn.getAttribute('data-job-id');
        const current = btn.getAttribute('data-current-status');
        const nextStatus = current === 'active' ? 'paused' : 'active';

        try {
          await window.API.patch(`/recruiter/jobs/${jobId}`, { status: nextStatus }, { auth: true });
          showAlert(`Opening status updated to "${nextStatus}"`, 'success');
          loadMyJobs();
          loadRecruiterProfile();
        } catch (err) {
          showAlert(err.message || 'Could not update status');
        }
      });
    });

    // Close / End Job Opening Button
    document.querySelectorAll('.btn-close-job').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const jobId = btn.getAttribute('data-job-id');
        const jobTitle = btn.getAttribute('data-job-title') || 'this opening';
        if (!confirm(`Are you sure you want to end & close "${jobTitle}"? Students will immediately no longer be able to submit applications.`)) {
          return;
        }

        try {
          await window.API.delete(`/recruiter/jobs/${jobId}`, { auth: true });
          showAlert(`🛑 Opening "${jobTitle}" has been closed.`, 'info');
          loadMyJobs();
          loadRecruiterProfile();
        } catch (err) {
          showAlert(err.message || 'Could not close job opening.');
        }
      });
    });

    // Copy Student Link Button
    document.querySelectorAll('.btn-copy-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const jobId = btn.getAttribute('data-job-id');
        const shareUrl = `${window.location.origin}/jobs.html?jobId=${jobId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
          showAlert(`📋 Student job board link copied to clipboard!`, 'info');
        });
      });
    });
  };

  // ── 4. Open Applicant Radar Modal ───────────────────────────
  const openApplicantRadar = async (jobId, jobTitle) => {
    activeJobRadarId = jobId;
    if (radarJobTitle) radarJobTitle.textContent = jobTitle || 'Opportunity';

    applicantRadarModal.show();
    radarLoadingSpinner.classList.remove('d-none');
    radarApplicantsList.classList.add('d-none');
    emptyRadarPlaceholder.classList.add('d-none');

    try {
      const response = await window.API.get(`/recruiter/jobs/${jobId}/applicants`, { auth: true });
      radarLoadingSpinner.classList.add('d-none');

      const applicants = response.data?.applicants || [];
      if (radarTotalCount) radarTotalCount.textContent = applicants.length;

      if (applicants.length === 0) {
        emptyRadarPlaceholder.classList.remove('d-none');
        return;
      }

      radarApplicantsList.innerHTML = '';
      applicants.forEach((app) => {
        const student = app.student || {};
        const score = app.matchScore || 75;
        let ringBg = '#ECFDF5';
        let ringColor = '#059669';
        let ringBorder = '#6EE7B7';

        if (score < 60) {
          ringBg = '#F1F5F9';
          ringColor = '#475569';
          ringBorder = '#CBD5E1';
        } else if (score < 80) {
          ringBg = '#FEF3C7';
          ringColor = '#B45309';
          ringBorder = '#FCD34D';
        }

        const badgesHtml = (student.verifiedBadges || [])
          .map((b) => `<span class="candidate-badge-${b.isCode ? 'code' : 'quiz'} me-1"><i class="bi bi-shield-check me-1"></i>${escapeHtml(b.name)}</span>`)
          .join('');

        const matchedTags = (app.matchedSkills || [])
          .map((m) => `<span class="badge bg-success-subtle text-success me-1">✓ ${escapeHtml(m)}</span>`)
          .join('');

        const missingTags = (app.missingSkills || [])
          .map((m) => `<span class="badge bg-secondary-subtle text-secondary me-1">- ${escapeHtml(m)}</span>`)
          .join('');

        const resumeLink = student.resumeUrl
          ? `<a href="${escapeHtml(student.resumeUrl)}" target="_blank" class="btn btn-sm btn-outline-primary py-1 px-2.5">
               <i class="bi bi-file-earmark-pdf me-1"></i> View Resume
             </a>`
          : `<span class="badge bg-light text-muted border py-1.5 px-2">Built Profile Snapshot</span>`;

        const card = document.createElement('div');
        card.className = 'applicant-card shadow-xs';
        card.innerHTML = `
          <div class="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div class="d-flex align-items-center gap-3">
              <!-- Circular Match Score Ring -->
              <div class="match-ring-score" style="background:${ringBg}; border: 2.5px solid ${ringBorder}; color:${ringColor};">
                <span style="font-size:1.15rem; line-height:1;">${score}%</span>
                <span style="font-size:0.55rem; text-transform:uppercase; letter-spacing:0.04em;">Match</span>
              </div>

              <div>
                <div class="d-flex align-items-center gap-2">
                  <h4 class="h6 fw-bold text-ink mb-0">${escapeHtml(student.name)}</h4>
                  <span class="candidate-badge-certified">${escapeHtml(app.readinessTier || 'Job Ready')}</span>
                </div>
                <div class="small text-muted mt-0.5">
                  ${escapeHtml(student.education?.degree || student.education?.course || 'B.Tech CS')} &middot; ${escapeHtml(student.education?.college || 'Engineering College')}
                </div>
                <div class="small text-muted">
                  <i class="bi bi-envelope me-1"></i>${escapeHtml(student.email)} &middot; Applied ${new Date(app.appliedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2">
              ${resumeLink}
              <!-- Status Dropdown Selector -->
              <select class="form-select form-select-sm stage-status-select" data-app-id="${app.applicationId}" style="width: auto; font-weight:600;">
                <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>📥 Applied</option>
                <option value="reviewed" ${app.status === 'reviewed' ? 'selected' : ''}>👀 Reviewed</option>
                <option value="shortlisted" ${app.status === 'shortlisted' ? 'selected' : ''}>⭐ Shortlisted</option>
                <option value="interview_scheduled" ${app.status === 'interview_scheduled' ? 'selected' : ''}>📅 Interview Scheduled</option>
                <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>✕ Declined</option>
              </select>
            </div>
          </div>

          <!-- Verified Skill Badges -->
          <div class="mt-3 pt-2 border-top border-line d-flex flex-wrap align-items-center gap-2">
            <span class="small text-muted fw-semibold" style="font-size:0.75rem;">VERIFIED BADGES:</span>
            ${badgesHtml || '<span class="text-muted small">No verified badges yet</span>'}
          </div>

          <!-- Matched vs Missing Skills breakdown -->
          <div class="mt-2 d-flex flex-wrap align-items-center gap-2">
            <span class="small text-muted fw-semibold" style="font-size:0.75rem;">SKILL MATCH:</span>
            ${matchedTags}
            ${missingTags}
          </div>

          ${app.coverNote ? `
            <div class="mt-2 p-2 rounded bg-light border text-muted small" style="font-size:0.8rem;">
              <strong>Candidate Note:</strong> "${escapeHtml(app.coverNote)}"
            </div>
          ` : ''}
        `;
        radarApplicantsList.appendChild(card);
      });

      radarApplicantsList.classList.remove('d-none');

      // Wire stage change listeners
      document.querySelectorAll('.stage-status-select').forEach((sel) => {
        sel.addEventListener('change', async (e) => {
          const appId = sel.getAttribute('data-app-id');
          const newStatus = e.target.value;

          try {
            await window.API.patch(`/recruiter/applications/${appId}/status`, { status: newStatus }, { auth: true });
            showAlert(`Candidate moved to stage: ${newStatus.replace('_', ' ').toUpperCase()}`, 'success');
            loadRecruiterProfile(); // update shortlisted KPIs
          } catch (err) {
            showAlert(err.message || 'Could not update applicant stage.');
          }
        });
      });
    } catch (err) {
      radarLoadingSpinner.classList.add('d-none');
      showAlert(err.message || 'Failed to load applicant radar.');
    }
  };

  // ── 5. Create Job Opening Form Submission ────────────────────
  if (createJobForm) {
    createJobForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      modalAlertContainer.innerHTML = '';

      const title = document.getElementById('jobTitleInput').value.trim();
      const careerSlug = document.getElementById('careerSlugSelect').value;
      const workplace = document.getElementById('workplaceSelect').value;
      const location = document.getElementById('locationInput').value.trim();
      const experienceLevel = document.getElementById('experienceLevelSelect').value;
      const salaryMin = Number(document.getElementById('salaryMinInput').value) || 400000;
      const salaryMax = Number(document.getElementById('salaryMaxInput').value) || 800000;
      const rawSkills = document.getElementById('skillsInput').value;
      const mandateVerified = document.getElementById('mandateVerifiedCheck').checked;
      const description = document.getElementById('jobDescInput').value.trim();

      if (!title || !description) {
        showModalAlert('Title and description are required.');
        return;
      }

      const parsedSkills = rawSkills
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .map((sName) => ({
          skillName: sName,
          minimumProficiency: 'intermediate',
          requiresVerification: mandateVerified,
        }));

      const originalBtn = btnSubmitJob.innerHTML;
      btnSubmitJob.disabled = true;
      btnSubmitJob.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status"></span>
        <span>Publishing Opening...</span>
      `;

      try {
        const deadline = document.getElementById('jobDeadlineInput')?.value || null;

        const response = await window.API.post('/recruiter/jobs', {
          title,
          careerSlug,
          workplace,
          location,
          experienceLevel,
          salaryRange: {
            min: salaryMin,
            max: salaryMax,
            currency: 'INR',
            isDisclosed: true,
          },
          requiredSkills: parsedSkills,
          description,
          deadline,
        }, { auth: true });

        btnSubmitJob.disabled = false;
        btnSubmitJob.innerHTML = originalBtn;

        if (response.success) {
          const modalInstance = bootstrap.Modal.getInstance(document.getElementById('postJobModal'));
          if (modalInstance) modalInstance.hide();

          showAlert(`🎉 Job opening "${title}" published live for students!`, 'success');
          loadMyJobs();
          loadRecruiterProfile();
        } else {
          showModalAlert(response.message || 'Could not publish job.');
        }
      } catch (err) {
        btnSubmitJob.disabled = false;
        btnSubmitJob.innerHTML = originalBtn;
        showModalAlert(err.message || 'Could not publish opening.');
      }
    });
  }

  if (btnRefreshJobs) {
    btnRefreshJobs.addEventListener('click', () => {
      loadMyJobs();
      loadRecruiterProfile();
    });
  }

  // Initial Load
  await loadRecruiterProfile();
  await loadMyJobs();
});

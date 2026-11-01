/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * recommendations.js — Career Recommendations & Skill Gap Analysis
 *
 * Calls POST /api/recommendations/generate, displays the top ranked careers,
 * renders skill gap indicators (matched/developing/missing), score breakdown bars,
 * and wires duration selection modal for roadmap generation.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Route guard (strict student portal isolation)
  if (!window.Auth?.requireStudent()) {
    return;
  }
  window.Auth?.consumePortalAlert('alertContainer');

  // 1.1 Verification Gate Check
  if (!window.Auth?.isSkillVerified()) {
    const targetContainer = document.getElementById('recommendationsContainer') || document.querySelector('main');
    window.Auth?.renderVerificationGate(
      targetContainer,
      'Recommendations',
      'Your tailored career matches, deterministic score breakdowns, and skill gap analyses'
    );
    return;
  }

  // 2. DOM Elements
  const loadingState = document.getElementById('loadingState');
  const incompleteState = document.getElementById('incompleteProfileState');
  const container = document.getElementById('recommendationsContainer');
  const alertContainer = document.getElementById('alertContainer');
  const roadmapModalEl = document.getElementById('roadmapDurationModal');
  const modalCareerTitle = document.getElementById('modalCareerTitle');
  const btnConfirmGenerate = document.getElementById('btnConfirmGenerate');
  const skillOrbitTitle = document.getElementById('skillOrbitTitle');

  // Live Jobs Modal DOM Elements (AI Dev Board API)
  const liveJobsModalEl = document.getElementById('liveJobsModal');
  const jobsModalCareerTitle = document.getElementById('jobsModalCareerTitle');
  const jobsLoadingState = document.getElementById('jobsLoadingState');
  const jobsListContainer = document.getElementById('jobsListContainer');
  const jobsEmptyState = document.getElementById('jobsEmptyState');
  const filterGlobalRemote = document.getElementById('filterGlobalRemote');

  let roadmapModal = null;
  if (roadmapModalEl && typeof bootstrap !== 'undefined') {
    roadmapModal = new bootstrap.Modal(roadmapModalEl);
  }

  let liveJobsModal = null;
  if (liveJobsModalEl && typeof bootstrap !== 'undefined') {
    liveJobsModal = new bootstrap.Modal(liveJobsModalEl);
  }

  // Future-Proof & What-If Modal DOM Elements
  const futureProofModalEl = document.getElementById('futureProofModal');
  const whatIfModalEl = document.getElementById('whatIfSimulatorModal');

  let futureProofModal = null;
  if (futureProofModalEl && typeof bootstrap !== 'undefined') {
    futureProofModal = new bootstrap.Modal(futureProofModalEl);
  }

  let whatIfModal = null;
  if (whatIfModalEl && typeof bootstrap !== 'undefined') {
    whatIfModal = new bootstrap.Modal(whatIfModalEl);
  }

  const fpModalCareerTitle = document.getElementById('fpModalCareerTitle');
  const fpModalScoreDisplay = document.getElementById('fpModalScoreDisplay');
  const fpModalRatingBadge = document.getElementById('fpModalRatingBadge');
  const fpTransferableVal = document.getElementById('fpTransferableVal');
  const fpTransferableBar = document.getElementById('fpTransferableBar');
  const fpAdaptabilityVal = document.getElementById('fpAdaptabilityVal');
  const fpAdaptabilityBar = document.getElementById('fpAdaptabilityBar');
  const fpDemandVal = document.getElementById('fpDemandVal');
  const fpDemandBar = document.getElementById('fpDemandBar');
  const fpResilienceVal = document.getElementById('fpResilienceVal');
  const fpResilienceBar = document.getElementById('fpResilienceBar');

  const whatIfCareerTitle = document.getElementById('whatIfCareerTitle');
  const whatIfCurrentScore = document.getElementById('whatIfCurrentScore');
  const whatIfSkillSelect = document.getElementById('whatIfSkillSelect');
  const whatIfSkillContext = document.getElementById('whatIfSkillContext');
  const whatIfDeltaBadge = document.getElementById('whatIfDeltaBadge');
  const whatIfBeforeScore = document.getElementById('whatIfBeforeScore');
  const whatIfAfterScore = document.getElementById('whatIfAfterScore');
  const whatIfBeforeGaps = document.getElementById('whatIfBeforeGaps');
  const whatIfAfterGaps = document.getElementById('whatIfAfterGaps');
  const whatIfBeforeDuration = document.getElementById('whatIfBeforeDuration');
  const whatIfAfterDuration = document.getElementById('whatIfAfterDuration');
  const whatIfNarrativeText = document.getElementById('whatIfNarrativeText');
  const whatIfApplyRoadmapBtn = document.getElementById('whatIfApplyRoadmapBtn');

  let activeWhatIfItem = null;

  // Curated Prototype Future-Proof Data Dictionary (Guidance Indicator)
  // Formula: Future-Proof Score = 40% Transferable Skills + 25% Learning Adaptability + 20% Demand Signal + 15% Automation Resilience
  const FUTURE_PROOF_DATA = {
    'frontend-developer': { transferable: 86, adaptability: 90, demand: 88, automationResilience: 82, rating: 'High Resilience' },
    'full-stack-developer': { transferable: 92, adaptability: 92, demand: 94, automationResilience: 88, rating: 'Very High Resilience' },
    'data-analyst': { transferable: 84, adaptability: 85, demand: 86, automationResilience: 78, rating: 'Moderate-High Resilience' },
    'ui-ux-designer': { transferable: 88, adaptability: 86, demand: 85, automationResilience: 84, rating: 'High Resilience' },
    'cybersecurity-analyst': { transferable: 90, adaptability: 94, demand: 96, automationResilience: 92, rating: 'Exceptional Resilience' },
    'ai-ml-engineer': { transferable: 94, adaptability: 96, demand: 98, automationResilience: 94, rating: 'Exceptional Resilience' },
    'devops-cloud-engineer': { transferable: 90, adaptability: 92, demand: 95, automationResilience: 90, rating: 'Exceptional Resilience' },
    'mobile-app-developer': { transferable: 85, adaptability: 88, demand: 86, automationResilience: 80, rating: 'High Resilience' },
    'backend-engineer': { transferable: 92, adaptability: 90, demand: 93, automationResilience: 89, rating: 'Very High Resilience' },
    'data-scientist': { transferable: 91, adaptability: 92, demand: 92, automationResilience: 88, rating: 'Very High Resilience' },
    'qa-automation-engineer': { transferable: 82, adaptability: 86, demand: 84, automationResilience: 76, rating: 'Moderate Resilience' },
    'blockchain-developer': { transferable: 86, adaptability: 88, demand: 82, automationResilience: 84, rating: 'High Resilience' },
    'product-manager': { transferable: 95, adaptability: 90, demand: 89, automationResilience: 92, rating: 'Exceptional Resilience' },
    'cloud-architect': { transferable: 93, adaptability: 94, demand: 96, automationResilience: 93, rating: 'Exceptional Resilience' },
    'default': { transferable: 85, adaptability: 88, demand: 87, automationResilience: 83, rating: 'High Resilience' }
  };

  const getFutureProofMetrics = (slug, category) => {
    const key = (slug || '').toLowerCase().trim();
    const data = FUTURE_PROOF_DATA[key] || FUTURE_PROOF_DATA['default'];
    const score = Math.round(
      data.transferable * 0.40 +
      data.adaptability * 0.25 +
      data.demand * 0.20 +
      data.automationResilience * 0.15
    );
    return { ...data, score };
  };

  const openFutureProofModal = (careerTitle, slug, category) => {
    const metrics = getFutureProofMetrics(slug, category);
    if (fpModalCareerTitle) fpModalCareerTitle.textContent = careerTitle;
    if (fpModalScoreDisplay) fpModalScoreDisplay.textContent = `${metrics.score}/100`;
    if (fpModalRatingBadge) {
      fpModalRatingBadge.textContent = metrics.rating;
      fpModalRatingBadge.className = `badge font-mono px-3 py-1 ${metrics.score >= 88 ? 'bg-success' : 'bg-primary'}`;
    }
    if (fpTransferableVal) fpTransferableVal.textContent = `${metrics.transferable}/100`;
    if (fpTransferableBar) fpTransferableBar.style.width = `${metrics.transferable}%`;

    if (fpAdaptabilityVal) fpAdaptabilityVal.textContent = `${metrics.adaptability}/100`;
    if (fpAdaptabilityBar) fpAdaptabilityBar.style.width = `${metrics.adaptability}%`;

    if (fpDemandVal) fpDemandVal.textContent = `${metrics.demand}/100`;
    if (fpDemandBar) fpDemandBar.style.width = `${metrics.demand}%`;

    if (fpResilienceVal) fpResilienceVal.textContent = `${metrics.automationResilience}/100`;
    if (fpResilienceBar) fpResilienceBar.style.width = `${metrics.automationResilience}%`;

    if (futureProofModal) {
      futureProofModal.show();
    }
  };

  const openWhatIfSimulator = (item) => {
    activeWhatIfItem = item;
    const { career, finalScore, scoreBreakdown = {}, weakSkills = [], missingSkills = [], matchedSkills = [] } = item;

    if (whatIfCareerTitle) whatIfCareerTitle.textContent = career.title;
    if (whatIfCurrentScore) whatIfCurrentScore.textContent = `${finalScore}%`;
    if (whatIfBeforeScore) whatIfBeforeScore.textContent = `${finalScore}%`;

    const candidateSkills = [
      ...weakSkills.map(s => ({ ...s, type: 'Developing', currentProf: s.userProficiency || 'Beginner' })),
      ...missingSkills.map(s => ({ ...s, type: 'Missing', currentProf: 'None' }))
    ];

    if (!whatIfSkillSelect) return;

    if (candidateSkills.length === 0) {
      whatIfSkillSelect.innerHTML = '<option value="">All primary skills already mastered!</option>';
      if (whatIfDeltaBadge) whatIfDeltaBadge.textContent = '+0% Max Fit';
      if (whatIfAfterScore) whatIfAfterScore.textContent = `${finalScore}%`;
      if (whatIfBeforeGaps) whatIfBeforeGaps.textContent = '0';
      if (whatIfAfterGaps) whatIfAfterGaps.textContent = '0';
      if (whatIfBeforeDuration) whatIfBeforeDuration.textContent = '4 Wks';
      if (whatIfAfterDuration) whatIfAfterDuration.textContent = '4 Wks';
      if (whatIfNarrativeText) whatIfNarrativeText.textContent = 'Your profile already matches all core technical competencies for this path!';
    } else {
      whatIfSkillSelect.innerHTML = candidateSkills.map((s, idx) => `
        <option value="${idx}">
          ${escapeHtml(s.displayName || s.name)} (${s.type}: currently ${escapeHtml(s.currentProf)})
        </option>
      `).join('');

      runWhatIfCalculation(candidateSkills[0], candidateSkills);
    }

    if (whatIfModal) {
      whatIfModal.show();
    }
  };

  const runWhatIfCalculation = (selectedSkill, allCandidates) => {
    if (!activeWhatIfItem || !selectedSkill) return;
    const { finalScore, scoreBreakdown = {}, weakSkills = [], missingSkills = [], matchedSkills = [], career } = activeWhatIfItem;

    const levelRadio = document.querySelector('input[name="whatIfLevel"]:checked');
    const targetLevel = levelRadio ? levelRadio.value : 'Intermediate';

    const totalSkills = Math.max(1, (matchedSkills.length + weakSkills.length + missingSkills.length));

    // Transparent calculation strictly conforming to 60% skills + 25% interests + 15% education
    let factor = 0.35;
    if (selectedSkill.type === 'Developing') {
      factor = targetLevel === 'Advanced' ? 0.50 : 0.30;
    } else {
      factor = targetLevel === 'Advanced' ? 0.90 : 0.70;
    }

    const skillBoost = Math.round((factor / totalSkills) * 100);
    const currentSkillMatch = scoreBreakdown.skillMatch || 50;
    const newSkillMatch = Math.min(100, currentSkillMatch + skillBoost);

    const newFinalScore = Math.min(99, Math.round(
      newSkillMatch * 0.60 +
      (scoreBreakdown.interestMatch || 0) * 0.25 +
      (scoreBreakdown.educationMatch || 0) * 0.15
    ));

    const delta = Math.max(1, newFinalScore - finalScore);
    const oldGaps = weakSkills.length + missingSkills.length;
    const newGaps = Math.max(0, oldGaps - 1);
    const oldDuration = oldGaps >= 4 ? 8 : 4;
    const newDuration = Math.max(4, oldDuration - (delta >= 12 ? 3 : delta >= 6 ? 2 : 1));
    const savedWeeks = Math.max(1, oldDuration - newDuration);

    if (whatIfDeltaBadge) whatIfDeltaBadge.textContent = `+${delta}% Boost`;
    if (whatIfBeforeScore) whatIfBeforeScore.textContent = `${finalScore}%`;
    if (whatIfAfterScore) whatIfAfterScore.textContent = `${newFinalScore}%`;
    if (whatIfBeforeGaps) whatIfBeforeGaps.textContent = `${oldGaps}`;
    if (whatIfAfterGaps) whatIfAfterGaps.textContent = `${newGaps}`;
    if (whatIfBeforeDuration) whatIfBeforeDuration.textContent = `${oldDuration} Wks`;
    if (whatIfAfterDuration) whatIfAfterDuration.textContent = `${newDuration} Wks`;

    if (whatIfSkillContext) {
      whatIfSkillContext.innerHTML = `<span class="text-teal fw-semibold">${escapeHtml(selectedSkill.displayName || selectedSkill.name)}</span> is a core skill (${escapeHtml(selectedSkill.type)}). Target: <strong class="text-ink">${escapeHtml(targetLevel)}</strong>.`;
    }

    if (whatIfNarrativeText) {
      whatIfNarrativeText.innerHTML = `
        Upgrading <strong class="text-ink">${escapeHtml(selectedSkill.displayName || selectedSkill.name)}</strong> from <em>${escapeHtml(selectedSkill.currentProf)}</em> to <strong>${escapeHtml(targetLevel)}</strong> resolves a high-impact bottleneck for ${escapeHtml(career.title)}.
        By strengthening the 60% skill match component from ${currentSkillMatch}% to ${newSkillMatch}%, your career match jumps from <span class="text-muted text-decoration-line-through">${finalScore}%</span> to <strong class="text-success">${newFinalScore}%</strong> (+${delta}%), shortening your placement-readiness timeline by <strong>${savedWeeks} ${savedWeeks === 1 ? 'week' : 'weeks'}</strong>.
      `;
    }
  };

  // Wire What-If Simulator interactive controls
  if (whatIfSkillSelect) {
    whatIfSkillSelect.addEventListener('change', () => {
      if (!activeWhatIfItem) return;
      const candidateSkills = [
        ...activeWhatIfItem.weakSkills.map(s => ({ ...s, type: 'Developing', currentProf: s.userProficiency || 'Beginner' })),
        ...activeWhatIfItem.missingSkills.map(s => ({ ...s, type: 'Missing', currentProf: 'None' }))
      ];
      const idx = parseInt(whatIfSkillSelect.value, 10);
      if (!isNaN(idx) && candidateSkills[idx]) {
        runWhatIfCalculation(candidateSkills[idx], candidateSkills);
      }
    });
  }

  document.querySelectorAll('input[name="whatIfLevel"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!activeWhatIfItem) return;
      const candidateSkills = [
        ...activeWhatIfItem.weakSkills.map(s => ({ ...s, type: 'Developing', currentProf: s.userProficiency || 'Beginner' })),
        ...activeWhatIfItem.missingSkills.map(s => ({ ...s, type: 'Missing', currentProf: 'None' }))
      ];
      const idx = parseInt(whatIfSkillSelect.value, 10);
      if (!isNaN(idx) && candidateSkills[idx]) {
        runWhatIfCalculation(candidateSkills[idx], candidateSkills);
      }
    });
  });

  if (whatIfApplyRoadmapBtn) {
    whatIfApplyRoadmapBtn.addEventListener('click', () => {
      if (!activeWhatIfItem) return;
      if (whatIfModal) whatIfModal.hide();

      if (userActiveRoadmap && (userActiveRoadmap.career?.slug || '').toLowerCase() !== (activeWhatIfItem.career.slug || '').toLowerCase()) {
        showAlert(
          `You currently have an active roadmap for "${userActiveRoadmap.career?.title || 'another track'}". Complete it first or abandon it before switching tracks.`,
          'warning'
        );
        return;
      }

      selectedCareerTitle = activeWhatIfItem.career.title;
      selectedCareerSlug = activeWhatIfItem.career.slug;
      if (modalCareerTitle) modalCareerTitle.textContent = selectedCareerTitle;
      setTimeout(() => {
        if (roadmapModal) roadmapModal.show();
      }, 300);
    });
  }

  let selectedCareerSlug = null;
  let selectedCareerTitle = null;

  let activeJobsCareerSlug = null;
  let activeJobsCareerTitle = null;

  // Load and render real-time market jobs for a career track
  const loadJobsForCareer = async (slug, title, isGlobalRemote = false) => {
    activeJobsCareerSlug = slug;
    activeJobsCareerTitle = title;

    if (jobsModalCareerTitle) jobsModalCareerTitle.textContent = title;

    // Configure Multi-Portal Hub Links for Selected Career
    const cleanRole = String(title || 'Developer').trim();
    const cleanSlug = cleanRole.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || slug;
    const modalPortals = {
      linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(cleanRole)}&location=India`,
      naukri: `https://www.naukri.com/jobs-in-india?k=${encodeURIComponent(cleanRole)}`,
      indeed: `https://in.indeed.com/jobs?q=${encodeURIComponent(cleanRole)}&l=India`,
      wellfound: `https://wellfound.com/jobs?query=${encodeURIComponent(cleanRole)}`,
      internshala: `https://internshala.com/jobs/${encodeURIComponent(cleanSlug)}-jobs/`,
      googleJobs: `https://www.google.com/search?q=${encodeURIComponent(cleanRole + ' jobs in India')}&ibp=htl;jobs`
    };

    const pLinkedin = document.getElementById('portalModalLinkedin');
    const pNaukri = document.getElementById('portalModalNaukri');
    const pIndeed = document.getElementById('portalModalIndeed');
    const pWellfound = document.getElementById('portalModalWellfound');
    const pInternshala = document.getElementById('portalModalInternshala');
    const pGoogle = document.getElementById('portalModalGoogle');

    if (pLinkedin) pLinkedin.href = modalPortals.linkedin;
    if (pNaukri) pNaukri.href = modalPortals.naukri;
    if (pIndeed) pIndeed.href = modalPortals.indeed;
    if (pWellfound) pWellfound.href = modalPortals.wellfound;
    if (pInternshala) pInternshala.href = modalPortals.internshala;
    if (pGoogle) pGoogle.href = modalPortals.googleJobs;

    // Wire "Launch All Major Portals" Button (Graceful Multi-Tab Handler)
    const btnLaunchAllModal = document.getElementById('btnLaunchAllPortalsModal');
    if (btnLaunchAllModal) {
      btnLaunchAllModal.onclick = () => {
        window.open(modalPortals.linkedin, '_blank', 'noopener,noreferrer');
        showAlert(`🚀 Launched LinkedIn Jobs! Click to open others: <a href="${modalPortals.naukri}" target="_blank" rel="noopener noreferrer" class="fw-bold text-decoration-underline ms-1 text-white">Naukri</a> · <a href="${modalPortals.indeed}" target="_blank" rel="noopener noreferrer" class="fw-bold text-decoration-underline ms-1 text-white">Indeed</a> · <a href="${modalPortals.wellfound}" target="_blank" rel="noopener noreferrer" class="fw-bold text-decoration-underline ms-1 text-white">Wellfound</a> · <a href="${modalPortals.internshala}" target="_blank" rel="noopener noreferrer" class="fw-bold text-decoration-underline ms-1 text-white">Internshala</a> · <a href="${modalPortals.googleJobs}" target="_blank" rel="noopener noreferrer" class="fw-bold text-decoration-underline ms-1 text-white">Google</a>`, 'info');
      };
    }

    if (jobsLoadingState) jobsLoadingState.classList.remove('d-none');
    if (jobsListContainer) {
      jobsListContainer.classList.add('d-none');
      jobsListContainer.innerHTML = '';
    }
    if (jobsEmptyState) jobsEmptyState.classList.add('d-none');

    if (liveJobsModal) {
      liveJobsModal.show();
    }

    try {
      const res = await window.API.get(`/jobs/career/${slug}`, {
        query: { globalRemote: isGlobalRemote ? 'true' : 'false', limit: 8 }
      });

      if (jobsLoadingState) jobsLoadingState.classList.add('d-none');

      const jobs = res.data?.jobs || [];
      if (jobs.length === 0) {
        if (jobsEmptyState) jobsEmptyState.classList.remove('d-none');
        return;
      }

      if (jobsListContainer) {
        jobsListContainer.classList.remove('d-none');
        jobsListContainer.innerHTML = jobs.map(job => {
          const jobCompany = job.companyName || job.company || 'Tech Company';
          const cardPortals = job.portalLinks || {
            linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + jobCompany)}&location=India`,
            naukri: `https://www.naukri.com/jobs-in-india?k=${encodeURIComponent(job.title + ' ' + jobCompany)}`,
            googleJobs: `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + jobCompany + ' jobs in India')}&ibp=htl;jobs`
          };

          return `
            <div class="job-item-card">
              <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-2 mb-2">
                <div>
                  <h4 class="h6 fw-bold text-ink mb-1 d-flex align-items-center gap-2 flex-wrap">
                    <span>${escapeHtml(job.title)}</span>
                    ${job.globalRemote ? '<span class="atlas-badge text-teal border-teal"><i class="bi bi-globe me-1"></i>Worldwide Remote</span>' : ''}
                  </h4>
                  <div class="job-company-tag d-flex align-items-center gap-2 flex-wrap">
                    <span><i class="bi bi-building me-1 text-cyan"></i>${escapeHtml(jobCompany)}</span>
                    <span>•</span>
                    <span><i class="bi bi-geo-alt me-1 text-muted"></i>${escapeHtml(job.location)}</span>
                    <span>•</span>
                    <span class="text-secondary font-mono small">${escapeHtml(job.source || 'Live API')}</span>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <span class="job-salary-badge">
                    <i class="bi bi-cash-stack me-1"></i>${escapeHtml(job.salaryText)}
                  </span>
                  <span class="job-remote-badge text-uppercase">
                    ${escapeHtml(job.workplace)}
                  </span>
                </div>
              </div>

              <!-- Tags, Cross-Search & Direct Apply -->
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 pt-2 border-top border-line mt-2 flex-wrap">
                <div class="d-flex flex-wrap gap-1 align-items-center">
                  ${(job.tags || []).map(t => {
                    const isVerified = userVerifiedSkillNames.has(String(t).toLowerCase().trim());
                    if (isVerified) {
                      return `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 font-mono" style="font-size: 0.68rem;" title="Verified in your skill profile"><i class="bi bi-check-circle-fill me-1"></i>${escapeHtml(t)}</span>`;
                    } else {
                      return `<button type="button" class="btn btn-outline-danger btn-sm py-0 px-2 font-mono btn-bridge-gap" data-skill="${escapeHtml(t)}" data-job="${escapeHtml(job.title)}" title="1-Click: Add 1-week micro-task to your active roadmap" style="font-size: 0.68rem;"><i class="bi bi-plus-circle me-1"></i>${escapeHtml(t)} <span class="badge bg-danger text-white ms-1" style="font-size: 0.55rem;">+ Bridge</span></button>`;
                    }
                  }).join('')}
                </div>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <div class="d-flex align-items-center gap-1">
                    <a href="${escapeHtml(cardPortals.linkedin)}" target="_blank" rel="noopener noreferrer" class="cross-search-btn" title="Search this role on LinkedIn">
                      <i class="bi bi-linkedin text-primary"></i> LinkedIn
                    </a>
                    <a href="${escapeHtml(cardPortals.naukri)}" target="_blank" rel="noopener noreferrer" class="cross-search-btn" title="Search this role on Naukri">
                      <i class="bi bi-briefcase-fill text-danger"></i> Naukri
                    </a>
                    <a href="${escapeHtml(cardPortals.googleJobs)}" target="_blank" rel="noopener noreferrer" class="cross-search-btn" title="Search on Google Jobs">
                      <i class="bi bi-google text-danger"></i> Google
                    </a>
                  </div>
                  <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn cp-btn-primary btn-sm px-3 py-1 text-nowrap">
                    <span>View & Apply</span>
                    <i class="bi bi-box-arrow-up-right ms-1 small"></i>
                  </a>
                </div>
              </div>
            </div>
          `;
        }).join('');

        // Wire 1-Click Bridge the Gap micro-task injection
        jobsListContainer.querySelectorAll('.btn-bridge-gap').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const skill = btn.getAttribute('data-skill');
            const jobTitle = btn.getAttribute('data-job') || activeJobsCareerTitle || 'Target Tech Role';
            btn.disabled = true;
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" style="width: 0.75rem; height: 0.75rem;"></span>';

            try {
              const bridgeRes = await window.API.post('/jobs/bridge-gap', {
                skillName: skill,
                missingSkill: skill,
                jobTitle: jobTitle
              }, { auth: true });

              if (bridgeRes.success) {
                showAlert(`✓ Added "${skill}" to Week 1 of your active roadmap!`, 'success');
                btn.className = 'btn btn-outline-success btn-sm py-0 px-2 font-mono';
                btn.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Bridged!`;
              } else {
                showAlert(bridgeRes.message || 'Failed to bridge skill gap.', 'danger');
                btn.disabled = false;
                btn.innerHTML = originalContent;
              }
            } catch (bridgeErr) {
              showAlert(bridgeErr.message || 'Could not bridge skill. Please ensure you have an active roadmap.', 'danger');
              btn.disabled = false;
              btn.innerHTML = originalContent;
            }
          });
        });
      }
    } catch (err) {
      if (jobsLoadingState) jobsLoadingState.classList.add('d-none');
      if (jobsEmptyState) {
        jobsEmptyState.classList.remove('d-none');
        const h4 = jobsEmptyState.querySelector('h4');
        const p = jobsEmptyState.querySelector('p');
        if (h4) h4.textContent = 'Could not load live jobs';
        if (p) p.textContent = err.message || 'Please check your connection and try again.';
      }
    }
  };

  // Switch filter between all and global remote
  if (filterGlobalRemote) {
    filterGlobalRemote.addEventListener('change', (e) => {
      if (activeJobsCareerSlug) {
        loadJobsForCareer(activeJobsCareerSlug, activeJobsCareerTitle, e.target.checked);
      }
    });
  }

  // Duration option radio selection styling
  document.querySelectorAll('input[name="durationWeeks"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.duration-option').forEach((el) => el.classList.remove('active-option'));
      const parentLabel = e.target.closest('.duration-option');
      if (parentLabel) {
        parentLabel.classList.add('active-option');
      }
    });
  });

  const showAlert = (message, type = 'danger') => {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // 3. Fetch Recommendations
  const renderSkillMap = (recommendation) => {
    const map = document.getElementById('skillTileMap');
    if (!map || !recommendation) return;

    if (skillOrbitTitle) {
      skillOrbitTitle.textContent = `${recommendation.career.title} — Skill Map`;
    }

    const groups = [
      { label: 'Matched', className: 'matched', skills: recommendation.matchedSkills || [] },
      { label: 'Developing', className: 'weak', skills: recommendation.weakSkills || [] },
      { label: 'Missing', className: 'missing', skills: recommendation.missingSkills || [] },
    ];
    const skills = groups.flatMap((group) => group.skills.map((skill) => ({ ...skill, status: group.label, statusClass: group.className })));

    if (!skills.length) {
      map.innerHTML = '<p class="text-muted small mb-0">No skill details are available for this career yet.</p>';
      return;
    }

    map.innerHTML = skills.map((skill) => {
      const name = skill.displayName || skill.name || 'Skill';
      const skillId = String(skill.name || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const mark = name.trim().split(/[\s/.-]+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
      return `
        <button class="career-skill-tile skill-status-${skill.statusClass}" type="button"
          data-skill-id="${escapeHtml(skillId)}" data-skill-name="${escapeHtml(name)}"
          data-skill-status="${escapeHtml(skill.status)}" data-skill-category="${escapeHtml(skill.category || 'Technology')}"
          aria-haspopup="dialog" aria-controls="skillDetailDialog" aria-label="Learn ${escapeHtml(name)} (${skill.status})">
          <span class="career-skill-mark" aria-hidden="true">${escapeHtml(mark || 'S')}</span>
          <span class="career-skill-copy"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(skill.status)}</span></span>
          <i class="bi bi-arrow-up-right skill-tile-arrow" aria-hidden="true"></i>
        </button>
      `;
    }).join('');
  };

  // ── Dual Active Career Route State Tracking & Course Synergy ─────────
  let userActiveRoadmaps = [];
  let userActiveRoadmap = null;
  let userCompletedSlugs = new Set();
  let userCompletedRoadmapsMap = {};
  let userVerifiedSkillNames = new Set();

  const checkCourseSynergy = (activeCareer, targetCareer) => {
    if (!activeCareer || !targetCareer) return false;
    const domainA = (activeCareer.domain || activeCareer.primaryStream || 'engineering').toLowerCase().trim();
    const domainB = (targetCareer.domain || targetCareer.primaryStream || 'engineering').toLowerCase().trim();
    if (domainA === domainB) return true;

    const SYNERGY_PAIRS = [
      ['engineering', 'creative'],
      ['engineering', 'business'],
      ['business', 'marketing'],
    ];
    const isSynergisticDomain = SYNERGY_PAIRS.some(
      ([d1, d2]) => (domainA === d1 && domainB === d2) || (domainA === d2 && domainB === d1)
    );
    if (isSynergisticDomain) return true;

    const getSkillNames = (c) => (c.requiredSkills || []).map(rs => 
      (rs.skill?.name || rs.skillName || rs.name || (typeof rs.skill === 'string' ? rs.skill : '')).toLowerCase().trim()
    ).filter(Boolean);

    const skillsA = getSkillNames(activeCareer);
    const skillsB = getSkillNames(targetCareer);
    const shared = skillsA.filter(s => skillsB.includes(s));
    return shared.length >= 2;
  };

  // Initialize Abandon Route Modal
  const modalAbandonEl = document.getElementById('modalAbandonRoute');
  let modalAbandon = null;
  if (modalAbandonEl && typeof bootstrap !== 'undefined') {
    modalAbandon = new bootstrap.Modal(modalAbandonEl);
  }

  const btnAbandonBanner = document.getElementById('btnAbandonRouteBanner');
  const btnConfirmAbandon = document.getElementById('btnConfirmAbandonRoute');
  const abandonCareerTitle = document.getElementById('abandonModalCareerTitle');
  const abandonErrorAlert = document.getElementById('abandonErrorAlert');

  const renderActiveRouteBanner = () => {
    const activeLockBanner = document.getElementById('activeRouteLockBanner');
    const bannerTitle = document.getElementById('bannerActiveCareerTitle');
    const bannerProgress = document.getElementById('bannerActiveProgress');
    const bannerSubtitle = document.getElementById('bannerActiveSubtitle');

    const gradBanner = document.getElementById('graduatedTracksBanner');
    const gradTitles = document.getElementById('bannerGraduatedTitles');
    const gradBadge = document.getElementById('bannerGraduatedBadge');

    if (userCompletedSlugs.size > 0 && gradBanner) {
      const titles = Array.from(userCompletedSlugs).map(s => {
        return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }).join(', ');
      if (gradTitles) gradTitles.textContent = titles;
      if (gradBadge) gradBadge.textContent = `${userCompletedSlugs.size} Completed Pathway${userCompletedSlugs.size > 1 ? 's' : ''}`;
      gradBanner.classList.remove('d-none');
    } else if (gradBanner) {
      gradBanner.classList.add('d-none');
    }

    if (userActiveRoadmaps.length > 0 && activeLockBanner) {
      if (userActiveRoadmaps.length === 1) {
        const r1 = userActiveRoadmaps[0];
        const title1 = r1.career?.title || 'Active Track';
        const pct1 = Math.round(r1.progressPercentage || 0);
        const weekStr1 = r1.currentWeekString || `Week ${r1.currentWeekNumber || 1} of ${r1.durationWeeks || 4}`;
        if (bannerTitle) bannerTitle.innerHTML = `<span class="badge badge-navy me-1 font-mono">1/2</span> ${escapeHtml(title1)}`;
        if (bannerProgress) bannerProgress.textContent = `${weekStr1} · ${pct1}% Complete`;
        if (bannerSubtitle) {
          bannerSubtitle.innerHTML = `You are actively enrolled in <strong>1 of 2 allowed courses</strong>. You can enroll in a <strong>2nd related course</strong> in parallel to accelerate your skill synergy!`;
        }
      } else {
        const titles = userActiveRoadmaps.map(r => `${escapeHtml(r.career?.title || 'Track')} (${Math.round(r.progressPercentage || 0)}%)`).join(' & ');
        if (bannerTitle) bannerTitle.innerHTML = `<span class="badge badge-navy me-1 font-mono">2/2 Active</span> ${titles}`;
        if (bannerProgress) bannerProgress.textContent = `2 Parallel Courses Active`;
        if (bannerSubtitle) {
          bannerSubtitle.textContent = `You have reached the maximum concurrency limit of 2 active courses. Complete milestone tests to graduate or abandon a track to enroll in a new one.`;
        }
      }
      activeLockBanner.classList.remove('d-none');
    } else if (activeLockBanner) {
      activeLockBanner.classList.add('d-none');
    }
  };

  const fetchUserRouteState = async () => {
    userCompletedSlugs = new Set();
    userCompletedRoadmapsMap = {};

    try {
      const rmRes = await window.API.get('/roadmaps/current', { auth: true });
      if (rmRes.success && rmRes.data) {
        userActiveRoadmaps = rmRes.data.activeRoadmaps || [];
        if (userActiveRoadmaps.length === 0 && rmRes.data.roadmap?.status === 'active') {
          userActiveRoadmaps = [rmRes.data.roadmap];
        }
        userActiveRoadmap = userActiveRoadmaps[0] || null;

        if (Array.isArray(rmRes.data.completedRoadmaps)) {
          rmRes.data.completedRoadmaps.forEach((cr) => {
            const slug = (cr.career?.slug || cr.slug || '').toLowerCase().trim();
            if (slug) {
              userCompletedSlugs.add(slug);
              userCompletedRoadmapsMap[slug] = cr.id || cr._id;
            }
          });
        }
      } else {
        userActiveRoadmaps = [];
        userActiveRoadmap = null;
      }
    } catch (e) {
      userActiveRoadmaps = [];
      userActiveRoadmap = null;
    }

    try {
      const userRes = await window.API.get('/users/me', { auth: true });
      if (userRes.success && userRes.data?.user) {
        const u = userRes.data.user;
        if (Array.isArray(u.completedPaths)) {
          u.completedPaths.forEach((cp) => {
            const slug = (cp.slug || cp.role || cp.careerTitle || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').trim();
            if (slug) {
              userCompletedSlugs.add(slug);
              if (cp.roadmap && !userCompletedRoadmapsMap[slug]) {
                userCompletedRoadmapsMap[slug] = cp.roadmap;
              }
            }
          });
        }
        if (Array.isArray(u.skills)) {
          userVerifiedSkillNames = new Set(
            u.skills
              .filter(s => s.isVerified || s.isCodeVerified || s.isQuizVerified || s.verificationTier === 'project_verified' || s.verificationTier === 'quiz_verified')
              .map(s => (s.name || s.displayName || '').toLowerCase().trim())
          );
        }
      }
    } catch (e) {
      // Keep completed slugs from rmRes if any
    }

    renderActiveRouteBanner();
  };

  // Wire Abandon Route Button on Banner to Trigger Confirmation Modal
  const getAbandonModal = () => {
    const el = document.getElementById('modalAbandonRoute');
    if (!el) return null;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      return bootstrap.Modal.getOrCreateInstance(el);
    }
    return null;
  };

  const executeAbandonRoute = async (targetRoadmapId = null) => {
    try {
      if (btnConfirmAbandon) {
        btnConfirmAbandon.disabled = true;
        btnConfirmAbandon.textContent = 'Abandoning Route...';
      }
      if (abandonErrorAlert) abandonErrorAlert.classList.add('d-none');

      const payload = {};
      if (targetRoadmapId) {
        payload.roadmapId = targetRoadmapId;
      } else {
        const selectedRadio = document.querySelector('input[name="abandonTargetChoice"]:checked');
        if (selectedRadio) {
          payload.roadmapId = selectedRadio.value;
        } else if (userActiveRoadmaps[0]) {
          payload.roadmapId = userActiveRoadmaps[0]._id || userActiveRoadmaps[0].id;
        }
      }

      const res = await window.API.post('/roadmaps/current/abandon', payload, { auth: true });
      if (res.success) {
        const modal = getAbandonModal();
        if (modal) modal.hide();
        showAlert(res.message || 'Active career route abandoned. All your verified skills and test history have been safely preserved.', 'info');
        userActiveRoadmap = null;
        userActiveRoadmaps = [];
        await fetchUserRouteState();
        loadRecommendations();
      } else {
        if (abandonErrorAlert) {
          abandonErrorAlert.textContent = res.message || 'Failed to abandon route.';
          abandonErrorAlert.classList.remove('d-none');
        } else {
          showAlert(res.message || 'Failed to abandon route.', 'warning');
        }
      }
    } catch (err) {
      if (abandonErrorAlert) {
        abandonErrorAlert.textContent = err.message || 'Failed to abandon route.';
        abandonErrorAlert.classList.remove('d-none');
      } else {
        showAlert(err.message || 'Failed to abandon route.', 'danger');
      }
    } finally {
      if (btnConfirmAbandon) {
        btnConfirmAbandon.disabled = false;
        btnConfirmAbandon.innerHTML = '<i class="bi bi-check-circle me-1"></i> Confirm & Abandon Route';
      }
    }
  };

  const openAbandonModal = (targetRoadmapId = null, targetTitle = null) => {
    if (abandonErrorAlert) abandonErrorAlert.classList.add('d-none');

    const singleBox = document.getElementById('abandonSingleRouteText');
    const multiBox = document.getElementById('abandonMultiRouteSelector');
    const routesList = document.getElementById('abandonRoutesList');

    if (userActiveRoadmaps.length > 1 && multiBox && routesList) {
      if (singleBox) singleBox.classList.add('d-none');
      multiBox.classList.remove('d-none');
      routesList.innerHTML = `
        ${userActiveRoadmaps.map((r, idx) => {
          const rId = r._id || r.id;
          const title = r.career?.title || r.careerSnapshot?.title || 'Active Track';
          const pct = Math.round(r.progressPercentage || 0);
          const isSelected = targetRoadmapId ? (String(rId) === String(targetRoadmapId)) : (idx === 0);
          return `
            <div class="form-check p-2.5 rounded border border-line mb-2 bg-light d-flex align-items-center gap-2">
              <input class="form-check-input ms-1 me-2" type="radio" name="abandonTargetChoice" id="abandonTarget_${escapeHtml(rId)}" value="${escapeHtml(rId)}" ${isSelected ? 'checked' : ''}>
              <label class="form-check-label fw-semibold text-ink m-0 cursor-pointer flex-grow-1" for="abandonTarget_${escapeHtml(rId)}">
                ${escapeHtml(title)} <span class="badge bg-secondary font-mono ms-1">${pct}% Complete</span>
              </label>
            </div>
          `;
        }).join('')}
        <div class="form-check p-2.5 rounded border border-danger-subtle mb-2 bg-danger-subtle d-flex align-items-center gap-2">
          <input class="form-check-input ms-1 me-2" type="radio" name="abandonTargetChoice" id="abandonTarget_all" value="all">
          <label class="form-check-label fw-semibold text-danger m-0 cursor-pointer flex-grow-1" for="abandonTarget_all">
            <i class="bi bi-trash3-fill me-1"></i> Abandon Both Tracks (Reset all active routes)
          </label>
        </div>
      `;
    } else {
      if (singleBox) singleBox.classList.remove('d-none');
      if (multiBox) multiBox.classList.add('d-none');
      if (abandonCareerTitle) {
        const r0 = userActiveRoadmaps[0] || userActiveRoadmap;
        abandonCareerTitle.textContent = targetTitle || r0?.career?.title || r0?.careerSnapshot?.title || 'Current Route';
      }
    }

    const modal = getAbandonModal();
    if (modal) {
      modal.show();
    } else {
      // Fallback prompt if modal element is unavailable
      const title = targetTitle || (userActiveRoadmaps[0] || userActiveRoadmap)?.career?.title || 'current';
      if (confirm(`Are you sure you want to abandon the "${title}" route? Your verified skills and quiz attempts will be saved.`)) {
        executeAbandonRoute(targetRoadmapId);
      }
    }
  };

  if (btnAbandonBanner) {
    btnAbandonBanner.addEventListener('click', (e) => {
      e.preventDefault();
      openAbandonModal();
    });
  }

  // Delegated click handler on container for card-level Abandon Track buttons
  if (container) {
    container.addEventListener('click', (e) => {
      const abandonBtn = e.target.closest('.btn-card-abandon-track');
      if (abandonBtn) {
        e.preventDefault();
        const rId = abandonBtn.dataset.roadmapId;
        const cTitle = abandonBtn.dataset.careerTitle;
        openAbandonModal(rId, cTitle);
      }
    });
  }

  // Wire Modal Confirmation Button
  if (btnConfirmAbandon) {
    btnConfirmAbandon.addEventListener('click', () => {
      executeAbandonRoute();
    });
  }

  const loadRecommendations = async () => {
    try {
      await fetchUserRouteState();
      const response = await window.API.post('/recommendations/generate', {}, { auth: true });

      loadingState.classList.add('d-none');

      if (response.success && response.data?.recommendations) {
        const recommendations = response.data.recommendations;
        const crossTrack = response.data.crossTrackDiscovery || recommendations.crossTrackDiscovery || null;

        if (recommendations.length === 0) {
          showAlert('No career recommendations could be computed. Please check your assessment inputs.', 'warning');
          return;
        }

        renderRecommendations(recommendations, response.data.profileSummary, crossTrack);

        renderSkillMap(recommendations[0]);
      } else {
        showAlert(response.message || 'Unable to generate recommendations.');
      }
    } catch (err) {
      loadingState.classList.add('d-none');

      if (err.status === 403 || err.requiresSkillVerification) {
        const targetContainer = document.getElementById('recommendationsContainer') || document.querySelector('main');
        window.Auth?.renderVerificationGate(
          targetContainer,
          'Recommendations',
          'Your tailored career matches, deterministic score breakdowns, and skill gap analyses'
        );
        return;
      }

      if (
        err.status === 400 || err.status === 404 || err.status === 422 ||
        (err.message && err.message.toLowerCase().includes('complete your profile'))
      ) {
        incompleteState.classList.remove('d-none');
      } else if (err.isNetworkError || err.message === 'Failed to fetch') {
        showAlert('Network error: server is unreachable. Please check your connection.');
      } else if (err.status === 401) {
        window.location.href = '/login.html';
      } else {
        showAlert(err.message || 'Failed to load recommendations. Please try again.');
      }
    }
  };

  // 4. Render Recommendations Cards
  const renderRecommendations = (recommendations, profileSummary, crossTrack = null) => {
    container.classList.remove('d-none');
    container.innerHTML = '';

    recommendations.forEach((item, index) => {
      const { rank, career, finalScore, scoreBreakdown, whyRecommended, matchedSkills = [], weakSkills = [], missingSkills = [], aiBrief } = item;
      const isTopRank = rank === 1;
      const fpMetrics = getFutureProofMetrics(career.slug || career.id, career.category);

      let domainBadgeHtml = '';
      const domainKey = career.domain || (['finance', 'business'].includes(career.category) ? 'business' : ['marketing'].includes(career.category) ? 'marketing' : ['design'].includes(career.category) ? 'creative' : 'engineering');
      if (domainKey === 'business') {
        domainBadgeHtml = `<span class="badge badge-gold"><i class="bi bi-briefcase me-1"></i> Business & Finance</span>`;
      } else if (domainKey === 'marketing') {
        domainBadgeHtml = `<span class="badge badge-emerald"><i class="bi bi-graph-up-arrow me-1"></i> Digital Marketing</span>`;
      } else if (domainKey === 'creative') {
        domainBadgeHtml = `<span class="badge badge-purple"><i class="bi bi-palette me-1"></i> Design & Creative</span>`;
      } else {
        domainBadgeHtml = `<span class="badge badge-cyan"><i class="bi bi-laptop me-1"></i> Tech & Engineering</span>`;
      }

      const careerSlugNorm = (career.slug || '').toLowerCase().trim();
      const activeMatch = userActiveRoadmaps.find(
        (r) => (r.career?.slug || '').toLowerCase().trim() === careerSlugNorm
      );
      const isActiveThisCareer = Boolean(activeMatch);
      const isGraduated = Boolean(item.isGraduated || item.isCompleted || userCompletedSlugs.has(careerSlugNorm));
      const completedRoadmapId = item.completedRoadmapId || userCompletedRoadmapsMap[careerSlugNorm] || '';

      let isRelatedForSecondTrack = false;
      if (!isActiveThisCareer && !isGraduated && userActiveRoadmaps.length === 1) {
        isRelatedForSecondTrack = checkCourseSynergy(userActiveRoadmaps[0].career, career);
      }

      let routeStatusBadge = '';
      if (isActiveThisCareer) {
        const weekStr = activeMatch.currentWeekString || `Week ${activeMatch.currentWeekNumber || 1} of ${activeMatch.durationWeeks || 4}`;
        const pct = Math.round(activeMatch.progressPercentage || 0);
        routeStatusBadge = `<span class="badge badge-teal font-mono"><i class="bi bi-lightning-charge-fill me-1"></i> ACTIVE COURSE · ${escapeHtml(weekStr)} (${pct}% Tasks)</span>`;
      } else if (isGraduated) {
        routeStatusBadge = `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-50 font-mono"><i class="bi bi-patch-check-fill me-1"></i> CREDENTIAL VERIFIED · 100% MASTERED</span>`;
      } else if (userActiveRoadmaps.length === 1 && !window.Auth?.isAdmin()) {
        if (isRelatedForSecondTrack) {
          routeStatusBadge = `<span class="badge badge-teal font-mono"><i class="bi bi-link-45deg me-1"></i> RELATED TRACK (2nd Slot Open)</span>`;
        } else {
          routeStatusBadge = `<span class="badge bg-secondary text-light font-mono"><i class="bi bi-lock-fill me-1"></i> UNRELATED TRACK</span>`;
        }
      } else if (userActiveRoadmaps.length >= 2 && !window.Auth?.isAdmin()) {
        routeStatusBadge = `<span class="badge bg-secondary text-light font-mono"><i class="bi bi-lock-fill me-1"></i> LOCKED (Max 2 Active)</span>`;
      }

      const card = document.createElement('div');
      card.className = `recommendation-card card p-4 p-md-5 mb-4 ${isTopRank && !isGraduated ? 'top-match-card' : 'secondary-match-card'} ${isActiveThisCareer ? 'border-teal shadow-sm' : ''} ${isGraduated ? 'border-success-subtle' : ''}`;

      card.innerHTML = `
        <!-- Header: Top Match Badge / Rank & Title -->
        <div class="row align-items-center mb-4 g-3">
          <div class="col-md-8">
            <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
              ${
                isGraduated
                  ? `<span class="badge bg-success text-white px-3 py-1 fw-bold font-mono shadow-sm"><i class="bi bi-mortarboard-fill me-1 text-warning"></i> 🎓 GRADUATED CAREER ROUTE</span>`
                  : isTopRank
                  ? `<span class="badge badge-navy px-3 py-1 fw-bold">★ BEST ROUTE FOR NOW</span>`
                  : `<span class="badge cp-tag px-3 py-1 fw-bold">ROUTE #${rank}</span>`
              }
              ${routeStatusBadge}
              ${domainBadgeHtml}
              <span class="atlas-badge text-capitalize">
                ${escapeHtml(career.category)}
              </span>
            </div>
            <h2 class="h3 fw-bold text-ink mb-2 d-flex align-items-center gap-2">
              <i class="bi ${career.icon || 'bi-signpost-2-fill'} text-teal"></i>
              <span>${escapeHtml(career.title)}</span>
            </h2>
            <p class="text-muted text-md mb-0">
              ${escapeHtml(career.shortDescription)}
            </p>
            <div class="mt-3 d-flex align-items-center gap-2 flex-wrap">
              <div class="future-proof-pill d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill">
                <i class="bi bi-shield-check text-cyan"></i>
                <span class="fw-semibold text-ink" style="font-size: 0.88rem;">Future-Proof:</span>
                <span class="badge font-mono ${fpMetrics.score >= 88 ? 'bg-success' : 'bg-primary'}" style="font-size: 0.82rem;">${fpMetrics.score}/100</span>
                <span class="text-muted font-mono" style="font-size: 0.82rem;">· ${fpMetrics.rating}</span>
                <button type="button" class="btn btn-link p-0 text-cyan ms-1 future-proof-info-btn" data-career-title="${escapeHtml(career.title)}" data-career-slug="${escapeHtml(career.slug || '')}" data-career-category="${escapeHtml(career.category || '')}" title="View Future-Proof Score formula & breakdown">
                  <i class="bi bi-info-circle"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Career Fit Score Gauge -->
          <div class="col-md-4 text-md-end">
            <div class="match-score-badge d-inline-block text-center p-3">
              <div class="display-6 fw-bold text-primary font-mono">
                ${finalScore}%
              </div>
              <div class="text-muted font-mono text-uppercase" style="font-size: 0.82rem; letter-spacing: 0.05em; font-weight: 600;">
                Career Fit
              </div>
              <div class="text-muted" style="font-size: 0.78rem;">Based on skills, interests, education</div>
            </div>
          </div>
        </div>

        <!-- Score Breakdown Meters -->
        <div class="score-breakdown-box mb-4">
          <div class="row g-3">
            <!-- Skill Match (60%) -->
            <div class="col-sm-4">
              <div class="d-flex justify-content-between text-muted small mb-1">
                <span><i class="bi bi-tools text-teal me-1"></i> Skills (60%)</span>
                <span class="text-ink fw-bold font-mono">${scoreBreakdown.skillMatch}%</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-info" role="progressbar" style="width: ${scoreBreakdown.skillMatch}%;" aria-valuenow="${scoreBreakdown.skillMatch}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>

            <!-- Interest Match (25%) -->
            <div class="col-sm-4">
              <div class="d-flex justify-content-between text-muted small mb-1">
                <span><i class="bi bi-heart text-teal me-1"></i> Interests (25%)</span>
                <span class="text-ink fw-bold font-mono">${scoreBreakdown.interestMatch}%</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: ${scoreBreakdown.interestMatch}%;" aria-valuenow="${scoreBreakdown.interestMatch}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>

            <!-- Education Match (15%) -->
            <div class="col-sm-4">
              <div class="d-flex justify-content-between text-muted small mb-1">
                <span><i class="bi bi-mortarboard text-gold me-1"></i> Education (15%)</span>
                <span class="text-ink fw-bold font-mono">${scoreBreakdown.educationMatch}%</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-warning" role="progressbar" style="width: ${scoreBreakdown.educationMatch}%;" aria-valuenow="${scoreBreakdown.educationMatch}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI-Powered Career Fit Brief & Market Telemetry -->
        ${aiBrief ? `
        <div class="ai-brief-card p-3 p-md-4 mb-4">
          <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <span class="badge-ai-pulse"><span class="pulse-dot"></span> AI CAREER BRIEF</span>
              <span class="text-muted fw-semibold" style="font-size: 0.72rem; letter-spacing: 0.04em;">2026–27 INDUSTRY TELEMETRY</span>
            </div>
            <div class="d-flex align-items-center gap-2 text-cyan fw-bold" style="font-size: 0.88rem;">
              <i class="bi bi-cash-stack"></i> <strong>${escapeHtml(aiBrief.salaryRange)}</strong>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-md-7">
              <div class="ai-brief-text small mb-2">
                <i class="bi bi-stars text-cyan me-1"></i>
                <strong class="text-ink">Why You Fit:</strong> ${escapeHtml(aiBrief.whyYouFit)}
              </div>
              ${aiBrief.actionableTip ? `
              <div class="ai-brief-tip small text-muted mt-2">
                <strong class="text-ink"><i class="bi bi-lightbulb-fill text-gold me-1"></i>Actionable Pro-Tip:</strong> ${escapeHtml(aiBrief.actionableTip)}
              </div>` : ''}
            </div>

            <div class="col-md-5">
              <div class="ai-bottleneck-box p-3">
                <div class="text-rose fw-bold mb-1" style="font-size: 0.74rem; letter-spacing: 0.04em;">
                  <i class="bi bi-exclamation-octagon-fill me-1"></i> KEY BOTTLENECK
                </div>
                <div class="small text-secondary">${escapeHtml(aiBrief.keyBottleneck)}</div>
              </div>
              <div class="mt-2 text-muted fw-medium" style="font-size: 0.74rem;">
                <i class="bi bi-graph-up-arrow text-emerald me-1"></i> ${escapeHtml(aiBrief.hiringDemand)}
              </div>
            </div>
          </div>
        </div>
        ` : `
        <!-- Fallback Why Recommended Context -->
        <div class="why-recommended-banner mb-4 d-flex align-items-start gap-3">
          <i class="bi bi-info-circle text-teal fs-5 mt-1 flex-shrink-0"></i>
          <div>
            <span class="fw-bold small d-block mb-1">Evaluation Rationale:</span>
            <p class="small mb-0">${escapeHtml(whyRecommended)}</p>
          </div>
        </div>
        `}

        <!-- Skill Gap Analysis Grid -->
        <div class="skill-gap-analysis mb-4">
          <div class="text-xs text-muted text-uppercase fw-bold mb-2" style="letter-spacing: 0.04em;">
            Skill Breakdown
          </div>

          <div class="row g-3">
            <!-- 1. Matched Skills (Green) -->
            <div class="col-md-4">
              <div class="gap-column">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="text-leaf small fw-bold text-uppercase">
                    <i class="bi bi-check-circle-fill me-1"></i> Matched (${matchedSkills.length})
                  </span>
                </div>
                <div class="d-flex flex-wrap gap-1 gap-pill-container align-items-center">
                  ${
                    matchedSkills.length > 0
                      ? matchedSkills
                          .map((s) => {
                            const tier = s.verificationTier || (s.isCodeVerified ? 'project_verified' : (s.isQuizVerified ? 'quiz_verified' : 'self_rated'));
                            const isUnconfirmed = s.verificationStatus === 'unconfirmed';

                            let tierBadge = '';
                            let verIcon = 'bi-check2 text-leaf';
                            let borderClass = '';

                            if (tier === 'interview_verified') {
                              verIcon = 'bi-mic-fill text-warning';
                              borderClass = 'border-warning';
                              tierBadge = `<span class="passport-tier-badge badge-passport-t3 ms-1" style="font-size:0.6rem; padding: 1px 5px;"><i class="bi bi-mic-fill"></i> T3: Interview</span>`;
                            } else if (tier === 'project_verified' || s.isCodeVerified) {
                              verIcon = 'bi-github text-success';
                              borderClass = 'border-success';
                              tierBadge = `<span class="passport-tier-badge badge-passport-t2 ms-1" style="font-size:0.6rem; padding: 1px 5px;"><i class="bi bi-github"></i> T2: Code</span>`;
                            } else if (tier === 'quiz_verified' || s.isQuizVerified) {
                              verIcon = 'bi-patch-check-fill text-primary';
                              borderClass = 'border-primary';
                              if (isUnconfirmed) {
                                tierBadge = `<span class="badge-status-unconfirmed ms-1" style="font-size:0.58rem; padding: 1px 4px;" title="Telemetry Anomaly: Tab changes or velocity anomalies"><i class="bi bi-exclamation-triangle-fill"></i> Unconfirmed</span>`;
                              } else {
                                tierBadge = `<span class="passport-tier-badge badge-passport-t1 ms-1" style="font-size:0.6rem; padding: 1px 5px;"><i class="bi bi-shield-check"></i> T1: Quiz</span>`;
                              }
                            } else {
                              tierBadge = `<span class="passport-tier-badge badge-passport-t0 ms-1" style="font-size:0.6rem; padding: 1px 5px;"><i class="bi bi-person"></i> T0: 70%</span>`;
                            }

                            const sName = s.displayName || s.name;
                            const logoHtml = window.TechLogos?.getLogoImg(sName, { size: 14, className: 'me-1' }) || '';
                            return `
                              <span class="skill-pill matched-pill ${borderClass}" style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:0.78rem; font-weight:600; background-color:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; line-height:1.3; text-decoration:none;" title="Proficiency: ${s.userProficiency} · Passport Tier: ${tier}">
                                ${logoHtml || `<i class="bi ${verIcon} me-1"></i>`} <span class="skill-pill-name" style="color:inherit;">${escapeHtml(sName)}</span> ${tierBadge}
                              </span>
                            `;
                          })
                          .join('')
                      : '<span class="text-muted small fst-italic">None matched yet</span>'
                  }
                </div>
              </div>
            </div>

            <!-- 2. Weak Skills (Gold) -->
            <div class="col-md-4">
              <div class="gap-column">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="text-gold small fw-bold text-uppercase">
                    <i class="bi bi-arrow-up-circle-fill me-1"></i> Developing (${weakSkills.length})
                  </span>
                </div>
                <div class="d-flex flex-wrap gap-1 gap-pill-container align-items-center">
                  ${
                    weakSkills.length > 0
                      ? weakSkills
                          .map((s) => {
                            const sName = s.displayName || s.name;
                            const hasGaps = Array.isArray(s.quizGaps) && s.quizGaps.length > 0;
                            const gapTooltip = hasGaps ? ` · Reality-check focus areas: ${s.quizGaps.join(', ')}` : '';
                            const isQuizVer = Boolean(s.isQuizVerified);
                            const tierBadge = isQuizVer ? `<span class="passport-tier-badge badge-passport-t1 ms-1" style="font-size:0.58rem; padding: 1px 4px;"><i class="bi bi-shield-check"></i> Quiz</span>` : '';
                            const logoHtml = window.TechLogos?.getLogoImg(sName, { size: 14, className: 'me-1' }) || '';
                            return `
                              <span class="skill-pill weak-pill" style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:0.78rem; font-weight:600; background-color:#FFFBEB; color:#92400E; border:1px solid #FDE68A; line-height:1.3; text-decoration:none;" title="Current: ${s.userProficiency}, Required: ${s.requiredProficiency}${gapTooltip}">
                                ${logoHtml || `<i class="bi bi-arrow-up-circle-fill text-warning me-1"></i>`} <span class="skill-pill-name" style="color:inherit;">${escapeHtml(sName)}</span> ${tierBadge}
                                ${hasGaps ? '<span class="badge bg-danger-subtle text-danger ms-1" style="font-size: 0.6rem; font-weight: 600;">Focus: ' + escapeHtml(s.quizGaps[0]) + '</span>' : ''}
                              </span>
                            `;
                          })
                          .join('')
                      : '<span class="text-muted small fst-italic">No skills needing upgrades</span>'
                  }
                </div>
              </div>
            </div>

            <!-- 3. Missing Skills (Coral) -->
            <div class="col-md-4">
              <div class="gap-column">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="text-coral small fw-bold text-uppercase">
                    <i class="bi bi-plus-circle-fill me-1"></i> Missing (${missingSkills.length})
                  </span>
                </div>
                <div class="d-flex flex-wrap gap-1 gap-pill-container align-items-center">
                  ${
                    missingSkills.length > 0
                      ? missingSkills
                          .map(
                            (s) => {
                              const sName = s.displayName || s.name;
                              const logoHtml = window.TechLogos?.getLogoImg(sName, { size: 14, className: 'me-1' }) || '';
                              return `
                                <span class="skill-pill missing-pill" style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:9999px; font-size:0.78rem; font-weight:600; background-color:#FEF2F2; color:#991B1B; border:1px solid #FECACA; line-height:1.3; text-decoration:none;" title="Required: ${s.requiredProficiency} (${s.importance} importance)">
                                  ${logoHtml || `<i class="bi bi-plus-circle-fill text-danger me-1"></i>`} <span class="skill-pill-name" style="color:inherit;">${escapeHtml(sName)}</span>
                                </span>
                              `;
                            }
                          )
                          .join('')
                      : '<span class="text-muted small fst-italic">No missing core skills</span>'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 pt-3 border-top">
          <div class="small ${isGraduated ? 'text-success fw-semibold' : 'text-muted'}">
            ${
              isGraduated
                ? `<i class="bi bi-check-circle-fill me-1"></i> Completed & Verified Curriculum · All Milestones Passed`
                : `<i class="bi bi-compass me-1 text-teal"></i> ${missingSkills.length + weakSkills.length} skills to strengthen for this career trajectory`
            }
          </div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              class="btn cp-btn-outline btn-sm px-3 py-2 fw-semibold what-if-btn"
              data-career-title="${escapeHtml(career.title)}"
              data-career-slug="${escapeHtml(career.slug)}"
            >
              <i class="bi bi-lightning-charge text-warning me-1"></i>
              <span>What-If Simulator</span>
            </button>
            <button
              type="button"
              class="btn cp-btn-outline btn-sm px-3 py-2 fw-semibold view-jobs-btn"
              data-career-title="${escapeHtml(career.title)}"
              data-career-slug="${escapeHtml(career.slug)}"
            >
              <i class="bi bi-briefcase text-teal me-1"></i>
              <span>Live Market Jobs</span>
            </button>
            <a
              href="dashboard.html?action=mock-interview&role=${encodeURIComponent(career.title)}"
              class="btn cp-btn-outline btn-sm px-3 py-2 fw-semibold"
              title="Practice AI mock interview tailored for ${escapeHtml(career.title)}"
            >
              <i class="bi bi-mic-fill text-primary me-1"></i>
              <span>Practice AI Mock Interview</span>
            </a>
            ${
              isActiveThisCareer
                ? `<div class="d-inline-flex align-items-center gap-2 flex-wrap">
                     <a href="roadmap.html?id=${activeMatch._id || activeMatch.id}" class="btn cp-btn-primary btn-sm px-4 py-2 fw-semibold">
                       <i class="bi bi-arrow-right-circle-fill me-1"></i> Continue Roadmap (${Math.round(activeMatch.progressPercentage || 0)}%)
                     </a>
                     <button type="button" class="btn btn-outline-danger btn-sm px-3 py-2 fw-semibold btn-card-abandon-track" data-roadmap-id="${activeMatch._id || activeMatch.id}" data-career-title="${escapeHtml(career.title)}" data-bs-toggle="modal" data-bs-target="#modalAbandonRoute" title="Abandon this course to pick a new career track">
                       <i class="bi bi-x-circle me-1"></i> Abandon Route
                     </button>
                   </div>`
                : isGraduated
                ? `<div class="d-inline-flex align-items-center gap-2 flex-wrap">
                     <a href="${completedRoadmapId ? `roadmap.html?id=${completedRoadmapId}` : 'roadmap.html'}" class="btn btn-success btn-sm px-3 py-2 fw-semibold text-white shadow-sm">
                       <i class="bi bi-mortarboard-fill me-1 text-warning"></i> View Graduated Curriculum
                     </a>
                     <a href="profile.html" class="btn btn-outline-success btn-sm px-3 py-2 fw-semibold">
                       <i class="bi bi-award-fill me-1 text-warning"></i> View Certificate
                     </a>
                     <button
                       type="button"
                       class="btn btn-outline-secondary btn-sm px-2 py-2 fw-semibold choose-career-btn text-muted"
                       data-career-title="${escapeHtml(career.title)}"
                       data-career-slug="${escapeHtml(career.slug)}"
                       title="Retake or generate a fresh roadmap for this completed career path"
                     >
                       <i class="bi bi-arrow-repeat me-1"></i> Re-enroll
                     </button>
                   </div>`
                : (userActiveRoadmaps.length === 1 && !window.Auth?.isAdmin())
                ? (isRelatedForSecondTrack
                    ? `<button
                         type="button"
                         class="btn cp-btn-primary btn-sm px-4 py-2 fw-semibold choose-career-btn"
                         data-career-title="${escapeHtml(career.title)}"
                         data-career-slug="${escapeHtml(career.slug)}"
                       >
                         <i class="bi bi-plus-circle me-1"></i>
                         <span>Enroll as 2nd Active Course</span>
                       </button>`
                    : `<button type="button" class="btn cp-btn-locked btn-sm px-3 py-2 fw-semibold" disabled title="You can take up to 2 concurrent courses, but the 2nd course must be in a related domain (e.g. ${userActiveRoadmaps[0].career?.domain || 'Tech'}) or share competencies.">
                         <i class="bi bi-lock-fill me-1"></i>
                         <span>Locked (Unrelated Track)</span>
                       </button>`
                  )
                : (userActiveRoadmaps.length >= 2 && !window.Auth?.isAdmin())
                ? `<button type="button" class="btn cp-btn-locked btn-sm px-3 py-2 fw-semibold" disabled title="You already have 2 active courses in progress. Complete or abandon one before starting another.">
                     <i class="bi bi-lock-fill me-1"></i>
                     <span>Locked (Max 2 Courses Active)</span>
                   </button>`
                : `<button
                     type="button"
                     class="btn ${isTopRank ? 'cp-btn-primary' : 'cp-btn-outline'} btn-sm px-4 py-2 fw-semibold choose-career-btn"
                     data-career-title="${escapeHtml(career.title)}"
                     data-career-slug="${escapeHtml(career.slug)}"
                   >
                     <span>Build Roadmap for ${escapeHtml(career.title)}</span>
                     <i class="bi bi-arrow-right ms-1"></i>
                   </button>`
            }
          </div>
        </div>
      `;

      // Bind Future-Proof Info button click
      const fpBtn = card.querySelector('.future-proof-info-btn');
      if (fpBtn) {
        fpBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const title = fpBtn.getAttribute('data-career-title');
          const slug = fpBtn.getAttribute('data-career-slug');
          const cat = fpBtn.getAttribute('data-career-category');
          openFutureProofModal(title, slug, cat);
        });
      }

      // Bind What-If Simulator button click
      const whatIfBtn = card.querySelector('.what-if-btn');
      if (whatIfBtn) {
        whatIfBtn.addEventListener('click', () => {
          openWhatIfSimulator(item);
        });
      }

      // Bind View Live Jobs button click
      const viewJobsBtn = card.querySelector('.view-jobs-btn');
      if (viewJobsBtn) {
        viewJobsBtn.addEventListener('click', () => {
          const title = viewJobsBtn.getAttribute('data-career-title');
          const slug = viewJobsBtn.getAttribute('data-career-slug');
          const isGlobal = filterGlobalRemote ? filterGlobalRemote.checked : false;
          loadJobsForCareer(slug, title, isGlobal);
        });
      }

      // Bind Choose Career button click
      const chooseBtn = card.querySelector('.choose-career-btn');
      if (chooseBtn) {
        chooseBtn.addEventListener('click', () => {
          selectedCareerTitle = chooseBtn.getAttribute('data-career-title');
          selectedCareerSlug = chooseBtn.getAttribute('data-career-slug');
          if (modalCareerTitle) modalCareerTitle.textContent = selectedCareerTitle;

          if (roadmapModal) {
            roadmapModal.show();
          }
        });
      }

      container.appendChild(card);
    });

    // Render Cross-Track Discovery Bridge if available
    if (crossTrack && crossTrack.career) {
      let crossDomainBadge = '';
      const cDomain = crossTrack.career.domain || (['finance', 'business'].includes(crossTrack.career.category) ? 'business' : ['marketing'].includes(crossTrack.career.category) ? 'marketing' : ['design'].includes(crossTrack.career.category) ? 'creative' : 'engineering');
      if (cDomain === 'business') {
        crossDomainBadge = `<span class="badge badge-gold font-mono"><i class="bi bi-briefcase me-1"></i> Business Track</span>`;
      } else if (cDomain === 'marketing') {
        crossDomainBadge = `<span class="badge badge-emerald font-mono"><i class="bi bi-graph-up-arrow me-1"></i> Marketing Track</span>`;
      } else if (cDomain === 'creative') {
        crossDomainBadge = `<span class="badge badge-purple font-mono"><i class="bi bi-palette me-1"></i> Creative Track</span>`;
      } else {
        crossDomainBadge = `<span class="badge badge-cyan font-mono"><i class="bi bi-laptop me-1"></i> Tech Track</span>`;
      }

      const crossCard = document.createElement('div');
      crossCard.className = 'cross-track-card card p-4 p-md-5 mb-4';
      crossCard.innerHTML = `
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
          <div>
            <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span class="badge badge-teal font-mono"><i class="bi bi-compass me-1"></i> CROSS-TRACK DISCOVERY BRIDGE</span>
              <span class="atlas-badge"><i class="bi bi-shuffle me-1"></i> Alternative Horizon</span>
              ${crossDomainBadge}
            </div>
            <h2 class="h4 fw-bold text-ink mb-1 d-flex align-items-center gap-2">
              <i class="bi ${crossTrack.career.icon || 'bi-lightbulb-fill'} text-primary"></i>
              <span>${escapeHtml(crossTrack.career.title)}</span>
            </h2>
            <p class="text-muted small mb-0">${escapeHtml(crossTrack.career.shortDescription || '')}</p>
          </div>
          <div class="text-md-end flex-shrink-0">
            <div class="match-score-badge d-inline-block text-center p-2 px-3">
              <div class="h3 fw-bold text-teal font-mono mb-0">${crossTrack.matchScore}%</div>
              <div class="text-muted font-mono" style="font-size: 0.72rem;">Transferable Fit</div>
            </div>
          </div>
        </div>

        <div class="p-3 rounded-2 mb-3" style="background: rgba(99, 102, 241, 0.05); border-left: 3px solid #6366F1;">
          <div class="small text-ink">
            <strong>💡 Why explore this cross-domain track:</strong> ${escapeHtml(crossTrack.bridgeReason)}
          </div>
          ${crossTrack.matchedSkills && crossTrack.matchedSkills.length > 0 ? `
          <div class="small text-muted mt-1">
            <i class="bi bi-check2-circle text-success me-1"></i> Transferable skills already active: <strong>${crossTrack.matchedSkills.slice(0, 4).map(s => escapeHtml(s)).join(', ')}</strong>
          </div>` : ''}
        </div>

        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 pt-2 border-top border-line">
          <span class="small text-muted font-mono">Expand your career horizons beyond your primary track without losing your skill foundations.</span>
          ${(() => {
            const crossSlugNorm = (crossTrack.career.slug || '').toLowerCase().trim();
            const crossActiveMatch = userActiveRoadmaps.find(
              (r) => (r.career?.slug || '').toLowerCase().trim() === crossSlugNorm
            );
            if (crossActiveMatch) {
              return `<a href="roadmap.html?id=${crossActiveMatch._id || crossActiveMatch.id}" class="btn cp-btn-primary btn-sm px-4 text-nowrap">
                        <i class="bi bi-arrow-right-circle-fill me-1"></i> Continue Active Course
                      </a>`;
            } else if (userActiveRoadmaps.length === 1 && !window.Auth?.isAdmin()) {
              const isCrossRelated = checkCourseSynergy(userActiveRoadmaps[0].career, crossTrack.career);
              if (isCrossRelated) {
                return `<button type="button" class="btn cp-btn-primary btn-sm px-4 choose-career-btn text-nowrap"
                          data-career-title="${escapeHtml(crossTrack.career.title)}"
                          data-career-slug="${escapeHtml(crossTrack.career.slug)}">
                          <i class="bi bi-plus-circle me-1"></i>
                          <span>Enroll as 2nd Active Course</span>
                        </button>`;
              } else {
                return `<button type="button" class="btn cp-btn-locked btn-sm px-4 py-2 text-nowrap" disabled title="Cross-domain track must satisfy synergy criteria to take as concurrent course">
                          <i class="bi bi-lock-fill me-1"></i> Locked (Unrelated Track)
                        </button>`;
              }
            } else if (userActiveRoadmaps.length >= 2 && !window.Auth?.isAdmin()) {
              return `<button type="button" class="btn cp-btn-locked btn-sm px-4 py-2 text-nowrap" disabled title="You already have 2 active courses in progress">
                        <i class="bi bi-lock-fill me-1"></i> Locked (Max 2 Courses Active)
                      </button>`;
            } else {
              return `<button type="button" class="btn cp-btn-primary btn-sm px-4 choose-career-btn text-nowrap"
                        data-career-title="${escapeHtml(crossTrack.career.title)}"
                        data-career-slug="${escapeHtml(crossTrack.career.slug)}">
                        <span>Build Roadmap for ${escapeHtml(crossTrack.career.title)}</span>
                        <i class="bi bi-arrow-right ms-1"></i>
                      </button>`;
            }
          })()}
        </div>
      `;

      const crossChooseBtn = crossCard.querySelector('.choose-career-btn');
      if (crossChooseBtn) {
        crossChooseBtn.addEventListener('click', () => {
          selectedCareerTitle = crossChooseBtn.getAttribute('data-career-title');
          selectedCareerSlug = crossChooseBtn.getAttribute('data-career-slug');
          if (modalCareerTitle) modalCareerTitle.textContent = selectedCareerTitle;
          if (roadmapModal) roadmapModal.show();
        });
      }

      container.appendChild(crossCard);
    }
  };

  // Handle roadmap generation confirmation
  if (btnConfirmGenerate) {
    btnConfirmGenerate.addEventListener('click', async () => {
      if (!selectedCareerSlug) return;

      const selectedDurationRadio = document.querySelector('input[name="durationWeeks"]:checked');
      const durationWeeks = selectedDurationRadio ? parseInt(selectedDurationRadio.value, 10) : 8;

      const btnText = btnConfirmGenerate.querySelector('.btn-text');
      const spinner = btnConfirmGenerate.querySelector('.spinner-border');

      try {
        btnConfirmGenerate.disabled = true;
        btnConfirmGenerate.setAttribute('data-generating', 'true');
        if (btnText) btnText.textContent = 'Generating Roadmap...';
        if (spinner) spinner.classList.remove('d-none');

        const res = await window.API.post(
          '/roadmaps/generate',
          { careerSlug: selectedCareerSlug, durationWeeks },
          { auth: true }
        );

        if (res.success) {
          if (roadmapModal) roadmapModal.hide();
          showAlert('Personalized roadmap created successfully! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'roadmap.html';
          }, 600);
          return;
        } else {
          showAlert(res.message || 'Failed to generate roadmap.', 'danger');
        }
      } catch (err) {
        console.error('Roadmap generation error:', err);
        if (roadmapModal) roadmapModal.hide();

        if (err.status === 409 || err.code === 'ACTIVE_ROUTE_IN_PROGRESS') {
          showAlert(
            err.message || 'You already have an active career route in progress. Complete it first or abandon it before starting another track.',
            'warning'
          );
          await fetchUserRouteState();
          loadRecommendations();
        } else {
          showAlert(err.message || 'Failed to generate roadmap from server. Please retry in a few seconds.', 'danger');
        }
      } finally {
        if (!window.location.href.includes('roadmap.html')) {
          btnConfirmGenerate.disabled = false;
          btnConfirmGenerate.removeAttribute('data-generating');
          if (btnText) btnText.innerHTML = '<i class="bi bi-map me-1"></i> Build My Roadmap';
          if (spinner) spinner.classList.add('d-none');
        }
      }
    });
  }

  // Safe string escaper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── Real-Time Skills Synchronization Listener ─────────────────
  if (typeof BroadcastChannel !== 'undefined') {
    const realTimeChannel = new BroadcastChannel('careerpath_realtime_channel');
    realTimeChannel.onmessage = (e) => {
      if (e.data?.type === 'SKILLS_UPDATED') {
        loadRecommendations();
      }
    };
  }

  window.addEventListener('careerpath-skills-updated', () => {
    loadRecommendations();
  });

  // Load recommendations
  loadRecommendations();
});

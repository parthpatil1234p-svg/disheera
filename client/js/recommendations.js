/**
 * recommendations.js — Recommendations Display & Skill Gap Analysis
 *
 * Calls POST /api/recommendations/generate, displays the top 3 ranked careers,
 * renders skill gap indicators (green/amber/red), score breakdown bars,
 * and handles "Choose This Career" action alerts.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Route guard
  if (!window.Auth?.isAuthenticated()) {
    window.Auth?.requireAuth();
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

  let roadmapModal = null;
  if (roadmapModalEl && typeof bootstrap !== 'undefined') {
    roadmapModal = new bootstrap.Modal(roadmapModalEl);
  }

  let selectedCareerSlug = null;
  let selectedCareerTitle = null;

  // Duration option selection highlighting
  document.querySelectorAll('input[name="durationWeeks"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.duration-option').forEach((el) => el.classList.remove('active-option', 'border-info'));
      const parentLabel = e.target.closest('.duration-option');
      if (parentLabel) {
        parentLabel.classList.add('active-option', 'border-info');
      }
    });
  });

  const showAlert = (message, type = 'danger') => {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  // 3. Fetch Recommendations
  const loadRecommendations = async () => {
    try {
      const response = await window.API.post('/recommendations/generate', {}, { auth: true });

      loadingState.classList.add('d-none');

      if (response.success && response.data?.recommendations) {
        const recommendations = response.data.recommendations;

        if (recommendations.length === 0) {
          showAlert('No career recommendations could be computed. Please check your assessment inputs.', 'warning');
          return;
        }

        renderRecommendations(recommendations, response.data.profileSummary);

        // Mount 3D Skill Orbit for top recommendation
        const topRec = recommendations[0];
        if (topRec && window.initSkillOrbit) {
          if (skillOrbitTitle) {
            skillOrbitTitle.textContent = `${topRec.career.title} — Planetary Skill Orbit`;
          }
          window.initSkillOrbit('skill-orbit', {
            careerTitle: topRec.career.title,
            matchedSkills: topRec.matchedSkills,
            weakSkills: topRec.weakSkills,
            missingSkills: topRec.missingSkills,
          });
        }
      } else {
        showAlert(response.message || 'Unable to generate recommendations.');
      }
    } catch (err) {
      loadingState.classList.add('d-none');

      // Check if profile was incomplete
      if (
        err.status === 400 ||
        (err.message && err.message.toLowerCase().includes('complete your profile'))
      ) {
        incompleteState.classList.remove('d-none');
      } else {
        showAlert(err.message || 'Failed to load recommendations. Please try again.');
      }
    }
  };

  // 4. Render Recommendations Cards
  const renderRecommendations = (recommendations, profileSummary) => {
    container.classList.remove('d-none');
    container.innerHTML = '';

    recommendations.forEach((item, index) => {
      const { rank, career, finalScore, scoreBreakdown, whyRecommended, matchedSkills, weakSkills, missingSkills } = item;
      const isTopRank = rank === 1;

      const card = document.createElement('div');
      card.className = `recommendation-card p-4 p-md-5 rounded-4 mb-4 ${isTopRank ? 'top-match-card' : 'secondary-match-card'}`;

      card.innerHTML = `
        <!-- Card Header: Rank, Match %, Title -->
        <div class="row align-items-center mb-4 g-3">
          <div class="col-md-8">
            <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span class="badge ${isTopRank ? 'bg-info text-dark fw-bold' : 'bg-secondary text-light'} px-3 py-1 font-monospace">
                ${isTopRank ? '★ #1 TOP MATCH' : `#${rank} Career Option`}
              </span>
              <span class="badge bg-dark border border-secondary text-secondary text-uppercase px-2 py-1 small">
                ${escapeHtml(career.category)}
              </span>
            </div>
            <h2 class="h3 fw-bold text-white mb-2 d-flex align-items-center gap-2">
              <i class="bi ${career.icon || 'bi-briefcase-fill'}" style="color: ${career.color || '#22D3EE'};"></i>
              <span>${escapeHtml(career.title)}</span>
            </h2>
            <p class="text-secondary small mb-0" style="max-width: 650px;">
              ${escapeHtml(career.shortDescription)}
            </p>
          </div>

          <!-- Match Percentage Gauge -->
          <div class="col-md-4 text-md-end">
            <div class="match-score-badge d-inline-block text-center p-3 rounded-4 bg-dark border ${isTopRank ? 'border-info' : 'border-secondary'}">
              <div class="display-6 fw-bold ${isTopRank ? 'text-info' : 'text-light'} font-monospace">
                ${finalScore}%
              </div>
              <div class="text-secondary small text-uppercase" style="font-size: 0.7rem; letter-spacing: 1px;">
                Overall Alignment
              </div>
            </div>
          </div>
        </div>

        <!-- Score Breakdown Meters -->
        <div class="score-breakdown-box p-3 rounded-3 bg-dark bg-opacity-75 border border-secondary border-opacity-25 mb-4">
          <div class="row g-3 text-center text-sm-start">
            <!-- Skill Match (60%) -->
            <div class="col-sm-4">
              <div class="d-flex justify-content-between text-secondary small mb-1">
                <span><i class="bi bi-tools text-info me-1"></i> Skills Match (60%)</span>
                <span class="text-info fw-bold">${scoreBreakdown.skillMatch}%</span>
              </div>
              <div class="progress bg-secondary bg-opacity-25" style="height: 6px;">
                <div class="progress-bar bg-info" role="progressbar" style="width: ${scoreBreakdown.skillMatch}%;" aria-valuenow="${scoreBreakdown.skillMatch}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>

            <!-- Interest Match (25%) -->
            <div class="col-sm-4">
              <div class="d-flex justify-content-between text-secondary small mb-1">
                <span><i class="bi bi-heart-fill text-primary me-1"></i> Interest Match (25%)</span>
                <span class="text-primary fw-bold">${scoreBreakdown.interestMatch}%</span>
              </div>
              <div class="progress bg-secondary bg-opacity-25" style="height: 6px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: ${scoreBreakdown.interestMatch}%;" aria-valuenow="${scoreBreakdown.interestMatch}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>

            <!-- Education Match (15%) -->
            <div class="col-sm-4">
              <div class="d-flex justify-content-between text-secondary small mb-1">
                <span><i class="bi bi-mortarboard-fill text-warning me-1"></i> Education Match (15%)</span>
                <span class="text-warning fw-bold">${scoreBreakdown.educationMatch}%</span>
              </div>
              <div class="progress bg-secondary bg-opacity-25" style="height: 6px;">
                <div class="progress-bar bg-warning" role="progressbar" style="width: ${scoreBreakdown.educationMatch}%;" aria-valuenow="${scoreBreakdown.educationMatch}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Why Recommended Banner -->
        <div class="why-recommended-banner p-3 rounded-3 mb-4 d-flex align-items-start gap-3">
          <i class="bi bi-stars text-info fs-5 mt-1 flex-shrink-0"></i>
          <div>
            <span class="fw-semibold text-white small d-block mb-1">Why Recommended for You:</span>
            <p class="text-light small mb-0">${escapeHtml(whyRecommended)}</p>
          </div>
        </div>

        <!-- Skill Gap Analysis Grid -->
        <div class="skill-gap-analysis mb-4">
          <h3 class="h6 text-white text-uppercase small fw-bold mb-3" style="letter-spacing: 0.5px;">
            <i class="bi bi-diagram-3 me-1 text-info"></i> Detailed Skill Gap Breakdown
          </h3>

          <div class="row g-3">
            <!-- 1. Matched Skills (Green) -->
            <div class="col-md-4">
              <div class="gap-column p-3 rounded-3 h-100 bg-dark bg-opacity-50 border border-success border-opacity-25">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="text-success small fw-bold text-uppercase">
                    <i class="bi bi-check-circle-fill me-1"></i> Matched (${matchedSkills.length})
                  </span>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  ${
                    matchedSkills.length > 0
                      ? matchedSkills
                          .map(
                            (s) => `
                        <span class="badge skill-pill matched-pill" title="Proficiency: ${s.userProficiency}">
                          <i class="bi bi-check2"></i> ${escapeHtml(s.displayName)}
                        </span>
                      `
                          )
                          .join('')
                      : '<span class="text-secondary small fst-italic">None mastered yet</span>'
                  }
                </div>
              </div>
            </div>

            <!-- 2. Weak Skills (Amber/Yellow) -->
            <div class="col-md-4">
              <div class="gap-column p-3 rounded-3 h-100 bg-dark bg-opacity-50 border border-warning border-opacity-25">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="text-warning small fw-bold text-uppercase">
                    <i class="bi bi-arrow-up-circle-fill me-1"></i> Needs Upgrade (${weakSkills.length})
                  </span>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  ${
                    weakSkills.length > 0
                      ? weakSkills
                          .map(
                            (s) => `
                        <span class="badge skill-pill weak-pill" title="You have: ${s.userProficiency}, Required: ${s.requiredProficiency}">
                          <i class="bi bi-arrow-up"></i> ${escapeHtml(s.displayName)}
                        </span>
                      `
                          )
                          .join('')
                      : '<span class="text-secondary small fst-italic">No skill gaps in proficiency</span>'
                  }
                </div>
              </div>
            </div>

            <!-- 3. Missing Skills (Red/Orange) -->
            <div class="col-md-4">
              <div class="gap-column p-3 rounded-3 h-100 bg-dark bg-opacity-50 border border-danger border-opacity-25">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="text-danger small fw-bold text-uppercase">
                    <i class="bi bi-plus-circle-fill me-1"></i> Missing Skills (${missingSkills.length})
                  </span>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  ${
                    missingSkills.length > 0
                      ? missingSkills
                          .map(
                            (s) => `
                        <span class="badge skill-pill missing-pill" title="Required: ${s.requiredProficiency} (${s.importance} importance)">
                          <i class="bi bi-plus"></i> ${escapeHtml(s.displayName)}
                        </span>
                      `
                          )
                          .join('')
                      : '<span class="text-secondary small fst-italic">No missing core skills!</span>'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 pt-3 border-top border-secondary border-opacity-25">
          <div class="text-secondary small">
            <i class="bi bi-info-circle me-1"></i> ${missingSkills.length + weakSkills.length} skills to learn to become job-ready for this role
          </div>
          <button
            type="button"
            class="btn ${isTopRank ? 'cp-btn-primary' : 'cp-btn-outline'} btn-sm px-4 py-2 fw-semibold choose-career-btn"
            data-career-title="${escapeHtml(career.title)}"
            data-career-slug="${escapeHtml(career.slug)}"
          >
            <span>Choose This Career</span>
            <i class="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      `;

      // Bind Choose Career button click
      const chooseBtn = card.querySelector('.choose-career-btn');
      chooseBtn.addEventListener('click', () => {
        selectedCareerTitle = chooseBtn.getAttribute('data-career-title');
        selectedCareerSlug = chooseBtn.getAttribute('data-career-slug');
        if (modalCareerTitle) modalCareerTitle.textContent = selectedCareerTitle;

        if (roadmapModal) {
          roadmapModal.show();
        }
      });

      container.appendChild(card);
    });
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
        } else {
          showAlert(res.message || 'Failed to generate roadmap.', 'danger');
        }
      } catch (err) {
        console.error('Roadmap generation error:', err);
        showAlert(err.message || 'An error occurred while generating roadmap.', 'danger');
      } finally {
        btnConfirmGenerate.disabled = false;
        if (btnText) btnText.innerHTML = '<i class="bi bi-lightning-charge-fill me-1"></i> Generate Roadmap';
        if (spinner) spinner.classList.add('d-none');
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

  // Load recommendations
  loadRecommendations();
});

/**
 * client/js/modules/leaderboardView.js — Cumulative Merit Score (CMS) & Dynamic Leaderboard HUD (Plan 46 Phase 4)
 *
 * Implements:
 * - Animated Top 3 Topper Podium (Gold, Silver, Bronze)
 * - 4D Composite CMS Leaderboard table with metric breakdown (40% Assignments, 30% Quizzes, 20% Progress, 10% Consistency)
 * - Partner Tech Internship Rewards catalog with live eligibility indicators (Razorpay, CRED, Postman, Swiggy, Zerodha, Zomato)
 * - Individual student standing HUD & rank tracker
 *
 * Disheera Technologies Inc.
 */

(function () {
  'use strict';

  const MODAL_ID = 'leaderboardModal';

  /**
   * Builds and injects the Leaderboard modal into DOM if absent.
   */
  function ensureLeaderboardMarkup() {
    if (document.getElementById(MODAL_ID)) return;

    const modalHtml = `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
          <div class="modal-content text-white" style="background: #0f172a; border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 20px; box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85);">
            
            <!-- Modal Header -->
            <div class="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3" style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(14px);">
              <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-3">
                  <div class="p-2.5 rounded-3 text-warning" style="background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.3);">
                    <i class="bi bi-trophy-fill fs-4"></i>
                  </div>
                  <div>
                    <div class="d-flex align-items-center gap-2 mb-0.5">
                      <span class="badge" style="background: linear-gradient(135deg, #eab308, #f59e0b); color: #000; font-weight: 700; border-radius: 12px; font-size: 0.75rem;">
                        NATIONAL MERIT STANDINGS
                      </span>
                      <span class="badge bg-secondary bg-opacity-25 text-info font-monospace small">Plan 46 CMS Engine</span>
                    </div>
                    <h4 class="modal-title h5 fw-bold text-white mb-0">Disheera Cumulative Merit Leaderboard & Rewards</h4>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-sm btn-outline-warning" id="lbRefreshBtn" title="Refresh Leaderboard">
                    <i class="bi bi-arrow-clockwise"></i>
                  </button>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
              </div>
            </div>

            <!-- Modal Body -->
            <div class="modal-body p-4" style="background: #0b1120;">
              
              <!-- User Standing Sticky HUD -->
              <div id="lbUserStandingCard" class="p-3 mb-4 rounded-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(99, 102, 241, 0.3);">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 44px; height: 44px; background: #6366f1; color: #fff; font-size: 1.1rem;" id="lbUserAvatar">
                    U
                  </div>
                  <div>
                    <div class="d-flex align-items-center gap-2">
                      <h6 class="text-white fw-bold mb-0" id="lbUserName">Your Standing</h6>
                      <span id="lbUserTopperBadge"></span>
                    </div>
                    <div class="small text-muted" id="lbUserSubtext">Calculating current position...</div>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-3 flex-wrap">
                  <div class="text-md-end">
                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">Cumulative Merit Score</div>
                    <div class="fs-4 fw-bold font-monospace text-warning" id="lbUserCmsScore">0.0<span class="fs-6 text-muted">/100</span></div>
                  </div>
                  <div class="p-2 rounded-2 text-center" style="background: rgba(0, 0, 0, 0.3); min-width: 90px;">
                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem;">National Rank</div>
                    <div class="fs-4 fw-bold text-white font-monospace" id="lbUserRank">#—</div>
                  </div>
                </div>
              </div>

              <!-- Top 3 Podium Section -->
              <div class="mb-5">
                <div class="text-center mb-4">
                  <h5 class="fw-bold text-white mb-1"><i class="bi bi-award me-1 text-warning"></i> National Top 3 Podium</h5>
                  <p class="text-muted small mb-0">Highest Cumulative Merit Scores across collegiate assignments, proctored quizzes, and learning consistency</p>
                </div>

                <div class="row g-3 align-items-end justify-content-center" id="lbPodiumRow">
                  <!-- Podium slots dynamically injected -->
                </div>
              </div>

              <!-- Navigation Pills (Leaderboard Table vs Internship Rewards) -->
              <ul class="nav nav-pills mb-4 gap-2 border-bottom border-secondary border-opacity-25 pb-3" id="lbTabs" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active px-3 py-2 rounded-3 text-white" id="lb-table-tab" data-bs-toggle="pill" data-bs-target="#lb-table-view" type="button" role="tab" style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.3);">
                    <i class="bi bi-list-ol me-1"></i> Full National Rankings
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link px-3 py-2 rounded-3 text-white" id="lb-rewards-tab" data-bs-toggle="pill" data-bs-target="#lb-rewards-view" type="button" role="tab" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);">
                    <i class="bi bi-briefcase-fill me-1 text-warning"></i> Partner Tech Internships & Rewards
                  </button>
                </li>
              </ul>

              <div class="tab-content" id="lbTabContent">
                
                <!-- 1. Leaderboard Table View -->
                <div class="tab-pane fade show active" id="lb-table-view" role="tabpanel">
                  <div class="table-responsive rounded-3" style="border: 1px solid rgba(255, 255, 255, 0.08);">
                    <table class="table table-dark table-hover mb-0 align-middle" style="background: #0b1120;">
                      <thead style="background: rgba(15, 23, 42, 0.9); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">
                        <tr>
                          <th scope="col" class="py-3 px-3 text-center" style="width: 70px;">Rank</th>
                          <th scope="col" class="py-3 px-3">Student</th>
                          <th scope="col" class="py-3 px-3">Career Track</th>
                          <th scope="col" class="py-3 px-3">College</th>
                          <th scope="col" class="py-3 px-3 text-center">Assignments (40%)</th>
                          <th scope="col" class="py-3 px-3 text-center">Quizzes (30%)</th>
                          <th scope="col" class="py-3 px-3 text-center">Progress (20%)</th>
                          <th scope="col" class="py-3 px-3 text-end">Total CMS</th>
                        </tr>
                      </thead>
                      <tbody id="lbTableBody">
                        <tr>
                          <td colspan="8" class="text-center py-4 text-muted">Loading leaderboard data...</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- 2. Internship Rewards View -->
                <div class="tab-pane fade" id="lb-rewards-view" role="tabpanel">
                  <div class="mb-3">
                    <p class="text-muted small mb-0">Disheera Strategic Placement Partnerships. Top scorers unlock direct executive referrals and fast-track technical evaluations.</p>
                  </div>
                  <div class="row g-3" id="lbRewardsGrid">
                    <!-- Rewards Cards dynamically rendered -->
                  </div>
                </div>

              </div>

            </div>

            <!-- Modal Footer -->
            <div class="modal-footer border-top border-secondary border-opacity-25 px-4 py-3" style="background: rgba(15, 23, 42, 0.85);">
              <div class="small text-muted me-auto">
                <i class="bi bi-info-circle me-1"></i> CMS Formula: (Assignments &times; 0.40) + (Quizzes &times; 0.30) + (Roadmap &times; 0.20) + (Consistency &times; 0.10)
              </div>
              <button type="button" class="btn btn-secondary btn-sm px-3" data-bs-dismiss="modal">Close</button>
            </div>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('lbRefreshBtn').addEventListener('click', loadLeaderboardData);
  }

  /**
   * Fetches leaderboard data from backend and renders all components.
   */
  async function loadLeaderboardData() {
    ensureLeaderboardMarkup();
    const token = window.Auth?.getToken() || localStorage.getItem('token');

    try {
      const response = await fetch(`${window.CONFIG?.API_BASE_URL || '/api'}/leaderboard`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.message || 'Failed to load leaderboard');

      renderUserStanding(data.currentUser);
      renderPodium(data.top3 || []);
      renderTable(data.rankings || []);
      renderRewards(data.rewards || [], data.currentUser);

    } catch (err) {
      console.error('[leaderboardView] Error loading data:', err);
      document.getElementById('lbTableBody').innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-danger">
            <i class="bi bi-exclamation-triangle me-1"></i> Failed to load leaderboard data: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  /**
   * Renders the current user's personalized standing card.
   */
  function renderUserStanding(currentUser) {
    if (!currentUser) {
      document.getElementById('lbUserName').textContent = 'Guest Visitor';
      document.getElementById('lbUserSubtext').textContent = 'Log in to track your personal CMS rank and eligibility.';
      document.getElementById('lbUserCmsScore').innerHTML = '—<span class="fs-6 text-muted">/100</span>';
      document.getElementById('lbUserRank').textContent = '#—';
      document.getElementById('lbUserTopperBadge').innerHTML = '';
      return;
    }

    document.getElementById('lbUserName').textContent = currentUser.studentName || 'Authenticated Student';
    document.getElementById('lbUserSubtext').textContent = `Career: ${currentUser.careerTitle || 'Active Track'} · Institution: ${currentUser.college || 'Engineering'}`;
    document.getElementById('lbUserCmsScore').innerHTML = `${currentUser.totalMeritScore || 0}<span class="fs-6 text-muted">/100</span>`;
    document.getElementById('lbUserRank').textContent = `#${currentUser.rank || '—'}`;

    let badgeHtml = '';
    if (currentUser.topperBadge === 'GOLD' || currentUser.rank === 1) {
      badgeHtml = '<span class="badge" style="background: linear-gradient(135deg, #ffd700, #ffae00); color: #000; font-weight: bold;">👑 GOLD TOPPER</span>';
    } else if (currentUser.topperBadge === 'SILVER' || currentUser.rank === 2) {
      badgeHtml = '<span class="badge" style="background: linear-gradient(135deg, #e0e0e0, #bdbdbd); color: #000; font-weight: bold;">🥈 SILVER TOPPER</span>';
    } else if (currentUser.topperBadge === 'BRONZE' || currentUser.rank === 3) {
      badgeHtml = '<span class="badge" style="background: linear-gradient(135deg, #cd7f32, #b87333); color: #fff; font-weight: bold;">🥉 BRONZE TOPPER</span>';
    } else if (currentUser.rank <= 10) {
      badgeHtml = '<span class="badge bg-primary bg-opacity-25 text-info">TOP 10 MERIT</span>';
    }
    document.getElementById('lbUserTopperBadge').innerHTML = badgeHtml;
  }

  /**
   * Renders the Top 3 Podium (Silver #2, Gold #1, Bronze #3).
   */
  function renderPodium(top3) {
    const podiumRow = document.getElementById('lbPodiumRow');
    if (!top3 || top3.length === 0) {
      podiumRow.innerHTML = '<div class="col-12 text-center text-muted py-3">No student merit records calculated yet.</div>';
      return;
    }

    const gold = top3[0] || null;
    const silver = top3[1] || null;
    const bronze = top3[2] || null;

    podiumRow.innerHTML = `
      <!-- Rank 2: Silver (Left) -->
      <div class="col-md-4 col-sm-6 text-center order-2 order-md-1">
        ${silver ? `
          <div class="p-3 rounded-top-4 d-flex flex-column align-items-center" style="background: linear-gradient(180deg, rgba(192, 192, 192, 0.15), rgba(192, 192, 192, 0.05)); border: 1px solid rgba(192, 192, 192, 0.3); border-bottom: none; min-height: 220px; justify-content: flex-end;">
            <div class="position-relative mb-2">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 58px; height: 58px; background: linear-gradient(135deg, #c0c0c0, #9e9e9e); color: #000; font-size: 1.3rem; border: 3px solid #e0e0e0; box-shadow: 0 0 15px rgba(192, 192, 192, 0.4);">
                ${silver.studentName ? silver.studentName.charAt(0).toUpperCase() : 'S'}
              </div>
              <span class="position-absolute bottom-0 end-0 badge rounded-pill bg-light text-dark fw-bold" style="font-size: 0.75rem;">2</span>
            </div>
            <h6 class="fw-bold text-white mb-0 text-truncate w-100">${silver.studentName}</h6>
            <div class="small text-muted mb-1 text-truncate w-100">${silver.college || 'Engineering'}</div>
            <div class="badge text-dark font-monospace fw-bold mb-2" style="background: #c0c0c0;">${silver.totalMeritScore} CMS</div>
            <div class="w-100 py-2 rounded-2 text-dark fw-bold" style="background: rgba(192, 192, 192, 0.3); font-size: 0.85rem;">
              🥈 SILVER TOPPER
            </div>
          </div>
        ` : '<div class="text-muted small">Awaiting Silver Topper</div>'}
      </div>

      <!-- Rank 1: Gold (Center - Highest) -->
      <div class="col-md-4 col-sm-6 text-center order-1 order-md-2 mb-3 mb-md-0">
        ${gold ? `
          <div class="p-3 rounded-top-4 d-flex flex-column align-items-center" style="background: linear-gradient(180deg, rgba(234, 179, 8, 0.25), rgba(234, 179, 8, 0.08)); border: 2px solid rgba(234, 179, 8, 0.6); border-bottom: none; min-height: 260px; justify-content: flex-end; box-shadow: 0 0 30px rgba(234, 179, 8, 0.25);">
            <div class="position-relative mb-2">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 72px; height: 72px; background: linear-gradient(135deg, #ffd700, #ffb300); color: #000; font-size: 1.6rem; border: 4px solid #fff; box-shadow: 0 0 25px rgba(255, 215, 0, 0.6);">
                ${gold.studentName ? gold.studentName.charAt(0).toUpperCase() : 'G'}
              </div>
              <span class="position-absolute top-0 start-50 translate-middle fs-4" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">👑</span>
              <span class="position-absolute bottom-0 end-0 badge rounded-pill bg-warning text-dark fw-bold" style="font-size: 0.85rem;">1</span>
            </div>
            <h5 class="fw-bold text-white mb-0 text-truncate w-100">${gold.studentName}</h5>
            <div class="small text-muted mb-1 text-truncate w-100">${gold.college || 'Engineering'}</div>
            <div class="badge text-dark font-monospace fw-bold mb-2 fs-6" style="background: #ffd700;">${gold.totalMeritScore} CMS</div>
            <div class="w-100 py-2.5 rounded-2 text-dark fw-bold" style="background: #ffd700; font-size: 0.9rem; letter-spacing: 0.5px;">
              👑 NATIONAL GOLD TOPPER
            </div>
          </div>
        ` : '<div class="text-muted small">Awaiting Gold Topper</div>'}
      </div>

      <!-- Rank 3: Bronze (Right) -->
      <div class="col-md-4 col-sm-6 text-center order-3 order-md-3">
        ${bronze ? `
          <div class="p-3 rounded-top-4 d-flex flex-column align-items-center" style="background: linear-gradient(180deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.05)); border: 1px solid rgba(205, 127, 50, 0.4); border-bottom: none; min-height: 190px; justify-content: flex-end;">
            <div class="position-relative mb-2">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 52px; height: 52px; background: linear-gradient(135deg, #cd7f32, #a0522d); color: #fff; font-size: 1.2rem; border: 3px solid #e29f6b; box-shadow: 0 0 15px rgba(205, 127, 50, 0.3);">
                ${bronze.studentName ? bronze.studentName.charAt(0).toUpperCase() : 'B'}
              </div>
              <span class="position-absolute bottom-0 end-0 badge rounded-pill bg-warning-subtle text-dark fw-bold" style="font-size: 0.75rem;">3</span>
            </div>
            <h6 class="fw-bold text-white mb-0 text-truncate w-100">${bronze.studentName}</h6>
            <div class="small text-muted mb-1 text-truncate w-100">${bronze.college || 'Engineering'}</div>
            <div class="badge text-white font-monospace fw-bold mb-2" style="background: #cd7f32;">${bronze.totalMeritScore} CMS</div>
            <div class="w-100 py-2 rounded-2 text-white fw-bold" style="background: rgba(205, 127, 50, 0.4); font-size: 0.85rem;">
              🥉 BRONZE TOPPER
            </div>
          </div>
        ` : '<div class="text-muted small">Awaiting Bronze Topper</div>'}
      </div>
    `;
  }

  /**
   * Renders the rankings table rows.
   */
  function renderTable(rankings) {
    const tableBody = document.getElementById('lbTableBody');
    if (!rankings || rankings.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No student rankings available yet.</td></tr>';
      return;
    }

    tableBody.innerHTML = rankings.map(r => {
      let rankBadge = `<span class="fw-bold font-monospace text-muted">#${r.rank}</span>`;
      if (r.rank === 1) rankBadge = '<span class="badge bg-warning text-dark fw-bold">👑 #1</span>';
      else if (r.rank === 2) rankBadge = '<span class="badge bg-secondary text-white fw-bold">🥈 #2</span>';
      else if (r.rank === 3) rankBadge = '<span class="badge text-white fw-bold" style="background: #cd7f32;">🥉 #3</span>';

      const isCurrent = r.isCurrentUser;
      const rowStyle = isCurrent ? 'background: rgba(99, 102, 241, 0.15); border-left: 3px solid #6366f1;' : '';

      return `
        <tr style="${rowStyle}">
          <td class="text-center py-3">${rankBadge}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; background: rgba(255, 255, 255, 0.1); font-size: 0.85rem;">
                ${r.studentName ? r.studentName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div class="fw-bold text-white small">${r.studentName} ${isCurrent ? '<span class="badge bg-primary ms-1" style="font-size: 0.65rem;">YOU</span>' : ''}</div>
                <div class="text-muted" style="font-size: 0.72rem;">${r.studentEmail || ''}</div>
              </div>
            </div>
          </td>
          <td><span class="badge bg-secondary bg-opacity-25 text-info font-monospace small">${r.careerTitle || 'Developer'}</span></td>
          <td class="small text-muted">${r.college || 'Engineering'}</td>
          <td class="text-center font-monospace small">${r.assignmentMarks != null ? r.assignmentMarks.toFixed(1) : '—'}</td>
          <td class="text-center font-monospace small">${r.quizMarks != null ? r.quizMarks.toFixed(1) : '—'}</td>
          <td class="text-center font-monospace small">${r.progressMarks != null ? r.progressMarks.toFixed(1) : '—'}%</td>
          <td class="text-end">
            <span class="badge text-warning font-monospace fw-bold fs-6" style="background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.3);">
              ${r.totalMeritScore.toFixed(1)}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Renders the partner tech internship rewards grid.
   */
  function renderRewards(rewards, currentUser) {
    const grid = document.getElementById('lbRewardsGrid');
    if (!rewards || rewards.length === 0) {
      grid.innerHTML = '<div class="col-12 text-center text-muted py-3">No partner opportunities currently listed.</div>';
      return;
    }

    grid.innerHTML = rewards.map(r => {
      let crestBadge = '<span class="badge bg-secondary text-white">TOP 10</span>';
      if (r.eligibilityCrest === 'GOLD') crestBadge = '<span class="badge bg-warning text-dark fw-bold">👑 GOLD CREST</span>';
      else if (r.eligibilityCrest === 'SILVER') crestBadge = '<span class="badge bg-secondary-subtle text-white fw-bold">🥈 SILVER CREST</span>';
      else if (r.eligibilityCrest === 'BRONZE') crestBadge = '<span class="badge text-white fw-bold" style="background: #cd7f32;">🥉 BRONZE CREST</span>';

      const isEligible = r.isEligible;
      const statusPill = isEligible
        ? '<span class="badge bg-success bg-opacity-20 text-success border border-success border-opacity-50"><i class="bi bi-check-circle-fill me-1"></i> You are Eligible</span>'
        : '<span class="badge bg-secondary bg-opacity-10 text-muted"><i class="bi bi-lock-fill me-1"></i> Higher CMS Required</span>';

      return `
        <div class="col-md-6 col-lg-4">
          <div class="p-3.5 rounded-3 h-100 d-flex flex-column justify-content-between" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px;">
            <div>
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fw-bold text-white fs-6">${r.companyName}</span>
                ${crestBadge}
              </div>
              <h6 class="text-info fw-semibold mb-1">${r.roleTitle}</h6>
              <div class="small text-muted mb-2">
                <i class="bi bi-geo-alt me-1"></i> ${r.location} &bull; <i class="bi bi-cash-stack me-1"></i> ${r.stipendRange}
              </div>
              <div class="p-2 rounded-2 mb-3" style="background: rgba(0, 0, 0, 0.3); font-size: 0.75rem; color: #94a3b8;">
                <i class="bi bi-shield-lock-fill text-warning me-1"></i> <strong>Referral Track:</strong> ${r.referralContact || 'Disheera Direct Placement'}
              </div>
            </div>
            <div class="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-25">
              <div>${statusPill}</div>
              <a href="${r.applyUrl || '#'}" target="_blank" class="btn btn-sm ${isEligible ? 'btn-primary' : 'btn-outline-secondary disabled'}" style="${isEligible ? 'background: #6366f1; border: none;' : ''}">
                Apply <i class="bi bi-box-arrow-up-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Opens the Leaderboard HUD modal and fetches data.
   */
  function openLeaderboard() {
    ensureLeaderboardMarkup();
    const modalEl = document.getElementById(MODAL_ID);
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
    loadLeaderboardData();
  }

  // Export to window
  window.leaderboardView = {
    open: openLeaderboard,
    fetchStanding: loadLeaderboardData
  };

})();

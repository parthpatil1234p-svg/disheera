/**
 * client/js/modules/leaderboardView.js — Cumulative Merit Score (CMS) & Dynamic Leaderboard HUD (Plan 46 Phase 4)
 *
 * EduTech Light Theme · Disheera Design System Aligned
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
          <div class="modal-content" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; box-shadow: 0 20px 50px -15px rgba(15, 23, 42, 0.15);">
            
            <!-- Modal Header -->
            <div class="modal-header border-bottom px-4 py-3" style="background: #FFFFFF; border-color: #E2E8F0 !important;">
              <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-3">
                  <div class="p-2.5 rounded-3 text-warning" style="background: #FFFBEB; border: 1px solid #FDE68A;">
                    <i class="bi bi-trophy-fill fs-4 text-warning"></i>
                  </div>
                  <div>
                    <div class="d-flex align-items-center gap-2 mb-0.5">
                      <span class="badge" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; font-weight: 700; border-radius: 12px; font-size: 0.75rem;">
                        NATIONAL MERIT STANDINGS
                      </span>
                      <span class="badge bg-light text-secondary border font-monospace small">Plan 46 CMS Engine</span>
                    </div>
                    <h4 class="modal-title h5 fw-bold mb-0" style="color: #0F172A;">Disheera Cumulative Merit Leaderboard & Rewards</h4>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-sm btn-outline-secondary" id="lbRefreshBtn" title="Refresh Leaderboard">
                    <i class="bi bi-arrow-clockwise"></i>
                  </button>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
              </div>
            </div>

            <!-- Modal Body -->
            <div class="modal-body p-4" style="background: #F8FAFC;">
              
              <!-- User Standing Sticky HUD -->
              <div id="lbUserStandingCard" class="p-3 mb-4 rounded-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 bg-white" style="border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); border-radius: 14px;">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 44px; height: 44px; background: #2563EB; color: #FFFFFF; font-size: 1.1rem;" id="lbUserAvatar">
                    U
                  </div>
                  <div>
                    <div class="d-flex align-items-center gap-2">
                      <h6 class="fw-bold mb-0" style="color: #0F172A;" id="lbUserName">Your Standing</h6>
                      <span id="lbUserTopperBadge"></span>
                    </div>
                    <div class="small text-muted" id="lbUserSubtext">Calculating current position...</div>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-3 flex-wrap">
                  <div class="text-md-end">
                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem; font-weight: 600;">Cumulative Merit Score</div>
                    <div class="fs-4 fw-bold font-monospace text-primary" id="lbUserCmsScore">0.0<span class="fs-6 text-muted">/100</span></div>
                  </div>
                  <div class="p-2 rounded-2 text-center" style="background: #F1F5F9; border: 1px solid #E2E8F0; min-width: 90px;">
                    <div class="small text-muted text-uppercase" style="font-size: 0.7rem; font-weight: 600;">National Rank</div>
                    <div class="fs-4 fw-bold font-monospace" style="color: #0F172A;" id="lbUserRank">#—</div>
                  </div>
                </div>
              </div>

              <!-- Top 3 Podium Section -->
              <div class="mb-5">
                <div class="text-center mb-4">
                  <h5 class="fw-bold mb-1" style="color: #0F172A;"><i class="bi bi-award me-1 text-warning"></i> National Top 3 Podium</h5>
                  <p class="text-muted small mb-0">Highest Cumulative Merit Scores across collegiate assignments, proctored quizzes, and learning consistency</p>
                </div>

                <div class="row g-3 align-items-end justify-content-center" id="lbPodiumRow">
                  <!-- Podium slots dynamically injected -->
                </div>
              </div>

              <!-- Navigation Pills (Leaderboard Table vs Internship Rewards) -->
              <ul class="nav nav-pills mb-4 gap-2 border-bottom pb-3" style="border-color: #E2E8F0 !important;" id="lbTabs" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active px-3 py-2 rounded-3 fw-semibold" id="lb-table-tab" data-bs-toggle="pill" data-bs-target="#lb-table-view" type="button" role="tab" style="background: #2563EB; color: #FFFFFF; border: 1px solid #2563EB;">
                    <i class="bi bi-list-ol me-1"></i> Full National Rankings
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link px-3 py-2 rounded-3 fw-semibold text-secondary" id="lb-rewards-tab" data-bs-toggle="pill" data-bs-target="#lb-rewards-view" type="button" role="tab" style="background: #FFFFFF; border: 1px solid #E2E8F0;">
                    <i class="bi bi-briefcase-fill me-1 text-warning"></i> Partner Tech Internships & Rewards
                  </button>
                </li>
              </ul>

              <div class="tab-content" id="lbTabContent">
                
                <!-- 1. Leaderboard Table View -->
                <div class="tab-pane fade show active" id="lb-table-view" role="tabpanel">
                  <div class="table-responsive rounded-3 bg-white" style="border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);">
                    <table class="table table-hover mb-0 align-middle">
                      <thead class="table-light text-secondary" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">
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
            <div class="modal-footer border-top px-4 py-3" style="background: #FFFFFF; border-color: #E2E8F0 !important;">
              <div class="small text-muted me-auto">
                <i class="bi bi-info-circle me-1 text-primary"></i> CMS Formula: (Assignments &times; 0.40) + (Quizzes &times; 0.30) + (Roadmap &times; 0.20) + (Consistency &times; 0.10)
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm px-3 fw-semibold" data-bs-dismiss="modal">Close</button>
            </div>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Tab styling sync
    const tabBtns = document.querySelectorAll('#lbTabs .nav-link');
    tabBtns.forEach(btn => {
      btn.addEventListener('shown.bs.tab', (e) => {
        tabBtns.forEach(b => {
          b.style.background = '#FFFFFF';
          b.style.color = '#475569';
          b.style.borderColor = '#E2E8F0';
        });
        e.target.style.background = '#2563EB';
        e.target.style.color = '#FFFFFF';
        e.target.style.borderColor = '#2563EB';
      });
    });

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
      badgeHtml = '<span class="badge" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; font-weight: bold;">👑 GOLD TOPPER</span>';
    } else if (currentUser.topperBadge === 'SILVER' || currentUser.rank === 2) {
      badgeHtml = '<span class="badge" style="background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; font-weight: bold;">🥈 SILVER TOPPER</span>';
    } else if (currentUser.topperBadge === 'BRONZE' || currentUser.rank === 3) {
      badgeHtml = '<span class="badge" style="background: #FFEDD5; color: #9A3412; border: 1px solid #FDBA74; font-weight: bold;">🥉 BRONZE TOPPER</span>';
    } else if (currentUser.rank <= 10) {
      badgeHtml = '<span class="badge bg-primary-subtle text-primary border border-primary-subtle">TOP 10 MERIT</span>';
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
          <div class="p-3 rounded-top-4 d-flex flex-column align-items-center" style="background: #FFFFFF; border: 1px solid #CBD5E1; border-bottom: none; min-height: 220px; justify-content: flex-end; box-shadow: 0 4px 15px rgba(15, 23, 42, 0.05);">
            <div class="position-relative mb-2">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 58px; height: 58px; background: #F1F5F9; color: #334155; font-size: 1.3rem; border: 3px solid #CBD5E1; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                ${silver.studentName ? silver.studentName.charAt(0).toUpperCase() : 'S'}
              </div>
              <span class="position-absolute bottom-0 end-0 badge rounded-pill bg-secondary text-white fw-bold" style="font-size: 0.75rem;">2</span>
            </div>
            <h6 class="fw-bold mb-0 text-truncate w-100" style="color: #0F172A;">${silver.studentName}</h6>
            <div class="small text-muted mb-1 text-truncate w-100">${silver.college || 'Engineering'}</div>
            <div class="badge font-monospace fw-bold mb-2" style="background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1;">${silver.totalMeritScore} CMS</div>
            <div class="w-100 py-2 rounded-2 fw-bold" style="background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; font-size: 0.85rem;">
              🥈 SILVER TOPPER
            </div>
          </div>
        ` : '<div class="text-muted small">Awaiting Silver Topper</div>'}
      </div>

      <!-- Rank 1: Gold (Center - Highest) -->
      <div class="col-md-4 col-sm-6 text-center order-1 order-md-2 mb-3 mb-md-0">
        ${gold ? `
          <div class="p-3 rounded-top-4 d-flex flex-column align-items-center" style="background: #FEFCE8; border: 2px solid #FDE047; border-bottom: none; min-height: 260px; justify-content: flex-end; box-shadow: 0 8px 25px rgba(234, 179, 8, 0.15);">
            <div class="position-relative mb-2">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 72px; height: 72px; background: #FDE047; color: #854D0E; font-size: 1.6rem; border: 4px solid #FFFFFF; box-shadow: 0 4px 15px rgba(234, 179, 8, 0.3);">
                ${gold.studentName ? gold.studentName.charAt(0).toUpperCase() : 'G'}
              </div>
              <span class="position-absolute top-0 start-50 translate-middle fs-4">👑</span>
              <span class="position-absolute bottom-0 end-0 badge rounded-pill bg-warning text-dark fw-bold" style="font-size: 0.85rem;">1</span>
            </div>
            <h5 class="fw-bold mb-0 text-truncate w-100" style="color: #0F172A;">${gold.studentName}</h5>
            <div class="small text-muted mb-1 text-truncate w-100">${gold.college || 'Engineering'}</div>
            <div class="badge font-monospace fw-bold mb-2 fs-6" style="background: #FEF08A; color: #854D0E; border: 1px solid #FDE047;">${gold.totalMeritScore} CMS</div>
            <div class="w-100 py-2.5 rounded-2 fw-bold" style="background: #EAB308; color: #000000; font-size: 0.9rem; letter-spacing: 0.5px;">
              👑 NATIONAL GOLD TOPPER
            </div>
          </div>
        ` : '<div class="text-muted small">Awaiting Gold Topper</div>'}
      </div>

      <!-- Rank 3: Bronze (Right) -->
      <div class="col-md-4 col-sm-6 text-center order-3 order-md-3">
        ${bronze ? `
          <div class="p-3 rounded-top-4 d-flex flex-column align-items-center" style="background: #FFF7ED; border: 1px solid #FDBA74; border-bottom: none; min-height: 190px; justify-content: flex-end; box-shadow: 0 4px 15px rgba(234, 88, 12, 0.06);">
            <div class="position-relative mb-2">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 52px; height: 52px; background: #FFEDD5; color: #9A3412; font-size: 1.2rem; border: 3px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                ${bronze.studentName ? bronze.studentName.charAt(0).toUpperCase() : 'B'}
              </div>
              <span class="position-absolute bottom-0 end-0 badge rounded-pill bg-warning-subtle text-dark fw-bold" style="font-size: 0.75rem;">3</span>
            </div>
            <h6 class="fw-bold mb-0 text-truncate w-100" style="color: #0F172A;">${bronze.studentName}</h6>
            <div class="small text-muted mb-1 text-truncate w-100">${bronze.college || 'Engineering'}</div>
            <div class="badge font-monospace fw-bold mb-2" style="background: #FFEDD5; color: #9A3412; border: 1px solid #FDBA74;">${bronze.totalMeritScore} CMS</div>
            <div class="w-100 py-2 rounded-2 fw-bold" style="background: #FFEDD5; color: #9A3412; border: 1px solid #FDBA74; font-size: 0.85rem;">
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
      const rowStyle = isCurrent ? 'background: #EFF6FF; border-left: 3px solid #2563EB;' : '';

      return `
        <tr style="${rowStyle}">
          <td class="text-center py-3">${rankBadge}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; background: #EFF6FF; color: #2563EB; font-size: 0.85rem; border: 1px solid #DBEAFE;">
                ${r.studentName ? r.studentName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div class="fw-bold small" style="color: #0F172A;">${r.studentName} ${isCurrent ? '<span class="badge bg-primary ms-1" style="font-size: 0.65rem;">YOU</span>' : ''}</div>
                <div class="text-muted" style="font-size: 0.72rem;">${r.studentEmail || ''}</div>
              </div>
            </div>
          </td>
          <td><span class="badge bg-light text-secondary border font-monospace small">${r.careerTitle || 'Developer'}</span></td>
          <td class="small text-muted">${r.college || 'Engineering'}</td>
          <td class="text-center font-monospace small">${r.assignmentMarks != null ? r.assignmentMarks.toFixed(1) : '—'}</td>
          <td class="text-center font-monospace small">${r.quizMarks != null ? r.quizMarks.toFixed(1) : '—'}</td>
          <td class="text-center font-monospace small">${r.progressMarks != null ? r.progressMarks.toFixed(1) : '—'}%</td>
          <td class="text-end">
            <span class="badge font-monospace fw-bold fs-6" style="background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A;">
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
      let crestBadge = '<span class="badge bg-light text-secondary border">TOP 10</span>';
      if (r.eligibilityCrest === 'GOLD') crestBadge = '<span class="badge bg-warning text-dark fw-bold">👑 GOLD CREST</span>';
      else if (r.eligibilityCrest === 'SILVER') crestBadge = '<span class="badge bg-light text-dark fw-bold border">🥈 SILVER CREST</span>';
      else if (r.eligibilityCrest === 'BRONZE') crestBadge = '<span class="badge text-white fw-bold" style="background: #cd7f32;">🥉 BRONZE CREST</span>';

      const isEligible = r.isEligible;
      const statusPill = isEligible
        ? '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle-fill me-1"></i> You are Eligible</span>'
        : '<span class="badge bg-light text-muted border"><i class="bi bi-lock-fill me-1"></i> Higher CMS Required</span>';

      return `
        <div class="col-md-6 col-lg-4">
          <div class="p-3.5 rounded-3 h-100 d-flex flex-column justify-content-between bg-white" style="border: 1px solid #E2E8F0; border-radius: 14px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);">
            <div>
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fw-bold fs-6" style="color: #0F172A;">${r.companyName}</span>
                ${crestBadge}
              </div>
              <h6 class="text-primary fw-semibold mb-1">${r.roleTitle}</h6>
              <div class="small text-muted mb-2">
                <i class="bi bi-geo-alt me-1"></i> ${r.location} &bull; <i class="bi bi-cash-stack me-1"></i> ${r.stipendRange}
              </div>
              <div class="p-2 rounded-2 mb-3" style="background: #F8FAFC; border: 1px solid #E2E8F0; font-size: 0.75rem; color: #475569;">
                <i class="bi bi-shield-lock-fill text-warning me-1"></i> <strong>Referral Track:</strong> ${r.referralContact || 'Disheera Direct Placement'}
              </div>
            </div>
            <div class="d-flex align-items-center justify-content-between pt-2 border-top" style="border-color: #E2E8F0 !important;">
              <div>${statusPill}</div>
              <a href="${r.applyUrl || '#'}" target="_blank" class="btn btn-sm ${isEligible ? 'btn-primary' : 'btn-outline-secondary disabled'}" style="${isEligible ? 'background: #2563EB; border: none; font-weight: 600;' : ''}">
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

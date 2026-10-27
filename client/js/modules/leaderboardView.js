/**
 * client/js/modules/leaderboardView.js — Cumulative Merit Score (CMS) & Dynamic Leaderboard HUD (Plan 46 Phase 4)
 *
 * EduTech Light Theme · Disheera Design System Aligned
 * Implements:
 * - Animated Top 3 Topper Stepped 3D Podium (Gold, Silver, Bronze on Grounded Pedestal)
 * - 4D Composite CMS Leaderboard table with metric breakdown (40% Assignments, 30% Quizzes, 20% Progress, 10% Consistency)
 * - Partner Tech Internship Rewards catalog with live eligibility indicators (Razorpay, CRED, Postman, Swiggy, Zerodha, Zomato)
 * - Individual student standing HUD & rank tracker with dynamic initials
 *
 * Disheera Technologies Inc.
 */

(function () {
  'use strict';

  const MODAL_ID = 'leaderboardModal';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getInitials(name, fallback = 'U') {
    if (!name || typeof name !== 'string') return fallback;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Builds and injects the Leaderboard modal into DOM if absent.
   */
  function ensureLeaderboardMarkup() {
    if (document.getElementById(MODAL_ID)) return;

    const modalHtml = `
      <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable" style="max-width: min(1380px, 96vw); width: 96vw; margin: 1.25rem auto;">
          <div class="modal-content" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; box-shadow: 0 20px 50px -15px rgba(15, 23, 42, 0.15);">
            
            <!-- Modal Header -->
            <div class="modal-header border-bottom px-4 py-3" style="background: #FFFFFF; border-color: #E2E8F0 !important;">
              <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-3 d-flex align-items-center justify-content-center" style="background: linear-gradient(135deg, #FEF3C7, #FDE68A); border: 1px solid #FCD34D; width: 44px; height: 44px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);">
                    <i class="bi bi-trophy-fill fs-4" style="color: #D97706;"></i>
                  </div>
                  <div>
                    <div class="d-flex align-items-center gap-2 mb-0.5">
                      <span class="badge" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; font-weight: 700; border-radius: 12px; font-size: 0.75rem;">
                        NATIONAL MERIT STANDINGS
                      </span>
                      <span class="badge bg-light text-secondary border font-monospace small">Career Progress</span>
                    </div>
                    <h4 class="modal-title h5 fw-bold mb-0" style="color: #0F172A;">Disheera Cumulative Merit Leaderboard & Rewards</h4>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-sm btn-outline-secondary" id="lbRefreshBtn" title="Refresh Leaderboard" style="border-radius: 8px;">
                    <i class="bi bi-arrow-clockwise"></i>
                  </button>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
              </div>
            </div>

            <!-- Modal Body -->
            <div class="modal-body p-4" style="background: #F8FAFC; max-height: calc(88vh - 120px); overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent;">
              
              <!-- User Standing Sticky HUD -->
              <div id="lbUserStandingCard" class="p-3 mb-4 rounded-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 bg-white" style="border: 1px solid #E2E8F0; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04); border-radius: 14px;">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 50px; height: 50px; background: linear-gradient(135deg, #2563EB, #1D4ED8); color: #FFFFFF; font-size: 1.15rem; border: 2px solid #DBEAFE; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);" id="lbUserAvatar">
                    U
                  </div>
                  <div>
                    <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <h5 class="fw-bold mb-0" style="color: #0F172A; font-size: 1.1rem;" id="lbUserName">Your Standing</h5>
                      <span id="lbUserTopperBadge"></span>
                    </div>
                    <div class="small text-muted" id="lbUserSubtext">Calculating current position...</div>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-3 flex-wrap">
                  <div class="p-2.5 px-3 rounded-2 text-center" style="background: #EFF6FF; border: 1px solid #BFDBFE; min-width: 140px;">
                    <div class="small text-uppercase fw-bold" style="font-size: 0.68rem; color: #1D4ED8; letter-spacing: 0.5px;">Cumulative Merit Score</div>
                    <div class="fs-4 fw-bold font-monospace" style="color: #2563EB;" id="lbUserCmsScore">0.0<span class="fs-6 text-muted">/100</span></div>
                  </div>
                  <div class="p-2.5 px-3 rounded-2 text-center" id="lbUserRankContainer" style="background: #F1F5F9; border: 1px solid #E2E8F0; min-width: 110px;">
                    <div class="small text-uppercase fw-bold text-muted" style="font-size: 0.68rem; letter-spacing: 0.5px;">National Rank</div>
                    <div class="fs-4 fw-bold font-monospace" style="color: #0F172A;" id="lbUserRank">#—</div>
                  </div>
                </div>
              </div>

              <!-- Top 3 Stepped Podium Section -->
              <div class="mb-4">
                <div class="text-center mb-3">
                  <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2" style="background: #FEF3C7; border: 1px solid #FDE68A; color: #92400E; font-size: 0.8rem; font-weight: 700;">
                    <i class="bi bi-award-fill text-warning"></i> National Top 3 Podium
                  </div>
                  <h4 class="fw-bold mb-1" style="color: #0F172A;">Collegiate Excellence Hall of Fame</h4>
                  <p class="text-muted small mb-0" style="max-width: 600px; margin: 0 auto;">Calculated via real-time 4D composite evaluation: 40% Assignments, 30% Quizzes, 20% Roadmap Progress, 10% Consistency.</p>
                </div>

                <div class="row g-0 justify-content-center" id="lbPodiumRow">
                  <!-- Stepped Podium dynamically injected -->
                </div>
              </div>

              <!-- Navigation Pills (Leaderboard Table vs Internship Rewards) -->
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3 pt-2 border-top" style="border-color: #E2E8F0 !important;">
                <div class="p-1 rounded-pill d-inline-flex" style="background: #F1F5F9; border: 1px solid #E2E8F0;" id="lbTabs" role="tablist">
                  <button class="nav-link active px-3 py-2 rounded-pill fw-semibold" id="lb-table-tab" data-bs-toggle="pill" data-bs-target="#lb-table-view" type="button" role="tab" style="background: #2563EB; color: #FFFFFF; font-size: 0.85rem; border: none; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);">
                    <i class="bi bi-list-ol me-1"></i> Full National Rankings
                  </button>
                  <button class="nav-link px-3 py-2 rounded-pill fw-semibold text-secondary" id="lb-rewards-tab" data-bs-toggle="pill" data-bs-target="#lb-rewards-view" type="button" role="tab" style="background: transparent; color: #475569; font-size: 0.85rem; border: none;">
                    <i class="bi bi-briefcase-fill me-1 text-warning"></i> Partner Tech Internships & Rewards
                  </button>
                </div>
                <div class="small text-muted d-none d-sm-block">
                  <i class="bi bi-shield-check text-success me-1"></i> Verified Collegiate Telemetry
                </div>
              </div>

              <div class="tab-content" id="lbTabContent">
                
                <!-- 1. Leaderboard Table View -->
                <div class="tab-pane fade show active" id="lb-table-view" role="tabpanel">
                  <div class="table-responsive rounded-3 bg-white shadow-xs" style="border: 1px solid #E2E8F0; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent;">
                    <table class="table table-hover mb-0 align-middle" style="min-width: 1040px; width: 100%;">
                      <thead class="table-light text-secondary" style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #E2E8F0;">
                        <tr>
                          <th scope="col" class="py-3 px-3 text-center" style="width: 75px; min-width: 75px; white-space: nowrap;">Rank</th>
                          <th scope="col" class="py-3 px-3" style="min-width: 220px; white-space: nowrap;">Student</th>
                          <th scope="col" class="py-3 px-3" style="min-width: 170px; white-space: nowrap;">Career Track</th>
                          <th scope="col" class="py-3 px-3" style="min-width: 180px; white-space: nowrap;">College / Institution</th>
                          <th scope="col" class="py-3 px-3 text-center" style="min-width: 140px; white-space: nowrap;">Assignments (40%)</th>
                          <th scope="col" class="py-3 px-3 text-center" style="min-width: 125px; white-space: nowrap;">Quizzes (30%)</th>
                          <th scope="col" class="py-3 px-3 text-center" style="min-width: 130px; white-space: nowrap;">Progress (20%)</th>
                          <th scope="col" class="py-3 px-3 text-end" style="min-width: 110px; white-space: nowrap;">Total CMS</th>
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
                    <p class="text-muted small mb-0">Disheera Strategic Placement Partnerships. Top scorers qualify for direct executive referrals and fast-track technical evaluations.</p>
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
          b.style.background = 'transparent';
          b.style.color = '#475569';
          b.style.boxShadow = 'none';
        });
        e.target.style.background = '#2563EB';
        e.target.style.color = '#FFFFFF';
        e.target.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.25)';
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
      document.getElementById('lbUserAvatar').textContent = 'G';
      return;
    }

    const name = currentUser.studentName || 'Student';
    const initials = name.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'S';
    document.getElementById('lbUserAvatar').textContent = initials;
    document.getElementById('lbUserName').textContent = name;
    document.getElementById('lbUserSubtext').textContent = `Career: ${currentUser.careerTitle || 'Active Track'} · Institution: ${currentUser.college || 'Engineering'}`;
    
    const cmsVal = currentUser.totalMeritScore != null ? Number(currentUser.totalMeritScore).toFixed(1) : '0.0';
    document.getElementById('lbUserCmsScore').innerHTML = `${cmsVal}<span class="fs-6 text-muted">/100</span>`;

    let badgeHtml = '';
    const rankContainer = document.getElementById('lbUserRankContainer');
    const rankText = document.getElementById('lbUserRank');

    if (currentUser.topperBadge === 'GOLD' || currentUser.rank === 1) {
      badgeHtml = '<span class="badge" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">👑 GOLD TOPPER</span>';
      if (rankContainer) {
        rankContainer.style.background = '#FEF3C7';
        rankContainer.style.borderColor = '#FDE68A';
      }
      if (rankText) {
        rankText.style.color = '#78350F';
        rankText.innerHTML = '👑 #' + (currentUser.rank || 1);
      }
    } else if (currentUser.topperBadge === 'SILVER' || currentUser.rank === 2) {
      badgeHtml = '<span class="badge" style="background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">🥈 SILVER TOPPER</span>';
      if (rankContainer) {
        rankContainer.style.background = '#F1F5F9';
        rankContainer.style.borderColor = '#CBD5E1';
      }
      if (rankText) {
        rankText.style.color = '#1E293B';
        rankText.innerHTML = '🥈 #' + currentUser.rank;
      }
    } else if (currentUser.topperBadge === 'BRONZE' || currentUser.rank === 3) {
      badgeHtml = '<span class="badge" style="background: #FFEDD5; color: #9A3412; border: 1px solid #FDBA74; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">🥉 BRONZE TOPPER</span>';
      if (rankContainer) {
        rankContainer.style.background = '#FFEDD5';
        rankContainer.style.borderColor = '#FDBA74';
      }
      if (rankText) {
        rankText.style.color = '#7C2D12';
        rankText.innerHTML = '🥉 #' + currentUser.rank;
      }
    } else if (currentUser.rank <= 10) {
      badgeHtml = '<span class="badge bg-primary-subtle text-primary border border-primary-subtle" style="padding: 4px 10px; border-radius: 9999px; font-weight: 600;">TOP 10 MERIT</span>';
      if (rankContainer) {
        rankContainer.style.background = '#F1F5F9';
        rankContainer.style.borderColor = '#E2E8F0';
      }
      if (rankText) {
        rankText.style.color = '#0F172A';
        rankText.textContent = '#' + currentUser.rank;
      }
    } else {
      if (rankContainer) {
        rankContainer.style.background = '#F1F5F9';
        rankContainer.style.borderColor = '#E2E8F0';
      }
      if (rankText) {
        rankText.style.color = '#0F172A';
        rankText.textContent = '#' + (currentUser.rank || '—');
      }
    }
    document.getElementById('lbUserTopperBadge').innerHTML = badgeHtml;
  }

  /**
   * Renders the Stepped 3D Podium (Silver #2 on left, Gold #1 in center, Bronze #3 on right on a grounded stage).
   */
  function renderPodium(top3) {
    const podiumRow = document.getElementById('lbPodiumRow');
    if (!top3 || top3.length === 0) {
      podiumRow.innerHTML = '<div class="col-12 text-center text-muted py-4">No student merit records calculated yet.</div>';
      return;
    }

    const gold = top3[0] || null;
    const silver = top3[1] || null;
    const bronze = top3[2] || null;

    function getInitials(name, fallback) {
      if (!name) return fallback;
      return name.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || fallback;
    }

    podiumRow.innerHTML = `
      <div class="col-12">
        <div class="cms-podium-stage-container d-flex align-items-end justify-content-center mx-auto" style="max-width: 820px; padding: 20px 10px 0 10px;">
          
          <!-- Rank 2: Silver Pedestal (Left) -->
          <div class="cms-podium-column d-flex flex-column align-items-center flex-fill" style="max-width: 250px; z-index: 2;">
            ${silver ? `
              <!-- Winner Profile Header -->
              <div class="cms-winner-profile text-center mb-2 px-2 w-100">
                <div class="position-relative d-inline-block mb-2">
                  <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 62px; height: 62px; background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%); color: #334155; font-size: 1.25rem; border: 3px solid #94A3B8; box-shadow: 0 4px 12px rgba(100, 116, 139, 0.2);">
                    ${getInitials(silver.studentName, 'S')}
                  </div>
                  <span class="position-absolute bottom-0 end-0 badge rounded-pill fw-bold" style="background: #64748B; color: #FFFFFF; font-size: 0.72rem; padding: 3px 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">2</span>
                </div>
                <h6 class="fw-bold mb-0 text-truncate w-100" style="color: #0F172A; font-size: 0.92rem;" title="${silver.studentName}">${silver.studentName}</h6>
                <div class="small text-muted mb-1.5 text-truncate w-100" style="font-size: 0.72rem;">${silver.college || 'Engineering'}</div>
                <div class="badge font-monospace fw-bold" style="background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; font-size: 0.76rem; padding: 4px 9px;">${silver.totalMeritScore.toFixed(1)} CMS</div>
              </div>

              <!-- Stepped Pedestal Block -->
              <div class="cms-pedestal-block w-100 d-flex flex-column justify-content-between align-items-center py-2 px-2" style="height: 120px; background: linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 100%); border: 1.5px solid #94A3B8; border-bottom: none; border-radius: 14px 14px 0 0; box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.6), 0 4px 14px rgba(100, 116, 139, 0.12);">
                <div class="cms-rank-watermark fw-bold" style="font-size: 2.8rem; font-weight: 900; color: #64748B; opacity: 0.45; line-height: 1;">2</div>
                <div class="w-100 py-1.5 px-2 rounded-2 text-center fw-bold" style="background: rgba(255, 255, 255, 0.85); color: #1E293B; font-size: 0.75rem; letter-spacing: 0.4px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                  🥈 SILVER TOPPER
                </div>
              </div>
            ` : '<div class="text-muted small py-4">Awaiting Silver Topper</div>'}
          </div>

          <!-- Rank 1: Gold Pedestal (Center - Highest) -->
          <div class="cms-podium-column d-flex flex-column align-items-center flex-fill" style="max-width: 275px; z-index: 3; margin: 0 -4px;">
            ${gold ? `
              <!-- Winner Profile Header -->
              <div class="cms-winner-profile text-center mb-2 px-2 w-100">
                <div class="position-relative d-inline-block mb-1">
                  <!-- Crown Ornament -->
                  <div class="mb-1" style="font-size: 1.6rem; line-height: 1; filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.4));">👑</div>
                  <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 74px; height: 74px; background: linear-gradient(135deg, #FEF08A 0%, #FDE047 50%, #F59E0B 100%); color: #78350F; font-size: 1.6rem; border: 4px solid #FFFFFF; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35);">
                    ${getInitials(gold.studentName, 'G')}
                  </div>
                  <span class="position-absolute bottom-0 end-0 badge rounded-pill fw-bold" style="background: #D97706; color: #FFFFFF; font-size: 0.82rem; padding: 4px 7px; border: 2px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">1</span>
                </div>
                <h5 class="fw-bold mb-0 text-truncate w-100" style="color: #0F172A; font-size: 1.05rem;" title="${gold.studentName}">${gold.studentName}</h5>
                <div class="small text-muted mb-1.5 text-truncate w-100" style="font-size: 0.75rem;">${gold.college || 'Engineering'}</div>
                <div class="badge font-monospace fw-bold" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; font-size: 0.84rem; padding: 5px 12px; box-shadow: 0 1px 3px rgba(245, 158, 11, 0.15);">${gold.totalMeritScore.toFixed(1)} CMS</div>
              </div>

              <!-- Stepped Pedestal Block -->
              <div class="cms-pedestal-block w-100 d-flex flex-column justify-content-between align-items-center py-2 px-2" style="height: 165px; background: linear-gradient(180deg, #FDE68A 0%, #F59E0B 100%); border: 2px solid #D97706; border-bottom: none; border-radius: 16px 16px 0 0; box-shadow: inset 0 2px 6px rgba(255, 255, 255, 0.8), 0 8px 24px rgba(245, 158, 11, 0.25);">
                <div class="cms-rank-watermark fw-bold" style="font-size: 3.6rem; font-weight: 900; color: #92400E; opacity: 0.35; line-height: 1;">1</div>
                <div class="w-100 py-2 px-2 rounded-2 text-center fw-bold" style="background: #FFFFFF; color: #78350F; font-size: 0.82rem; letter-spacing: 0.5px; border: 1px solid #FDE68A; box-shadow: 0 2px 6px rgba(120, 53, 15, 0.12);">
                  👑 NATIONAL GOLD TOPPER
                </div>
              </div>
            ` : '<div class="text-muted small py-4">Awaiting Gold Topper</div>'}
          </div>

          <!-- Rank 3: Bronze Pedestal (Right) -->
          <div class="cms-podium-column d-flex flex-column align-items-center flex-fill" style="max-width: 250px; z-index: 1;">
            ${bronze ? `
              <!-- Winner Profile Header -->
              <div class="cms-winner-profile text-center mb-2 px-2 w-100">
                <div class="position-relative d-inline-block mb-2">
                  <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 58px; height: 58px; background: linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%); color: #9A3412; font-size: 1.15rem; border: 3px solid #FDBA74; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.18);">
                    ${getInitials(bronze.studentName, 'B')}
                  </div>
                  <span class="position-absolute bottom-0 end-0 badge rounded-pill fw-bold" style="background: #C2410C; color: #FFFFFF; font-size: 0.72rem; padding: 3px 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">3</span>
                </div>
                <h6 class="fw-bold mb-0 text-truncate w-100" style="color: #0F172A; font-size: 0.9rem;" title="${bronze.studentName}">${bronze.studentName}</h6>
                <div class="small text-muted mb-1.5 text-truncate w-100" style="font-size: 0.72rem;">${bronze.college || 'Engineering'}</div>
                <div class="badge font-monospace fw-bold" style="background: #FFEDD5; color: #9A3412; border: 1px solid #FDBA74; font-size: 0.76rem; padding: 4px 9px;">${bronze.totalMeritScore.toFixed(1)} CMS</div>
              </div>

              <!-- Stepped Pedestal Block -->
              <div class="cms-pedestal-block w-100 d-flex flex-column justify-content-between align-items-center py-2 px-2" style="height: 95px; background: linear-gradient(180deg, #FED7AA 0%, #FB923C 100%); border: 1.5px solid #EA580C; border-bottom: none; border-radius: 12px 12px 0 0; box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.6), 0 4px 12px rgba(234, 88, 12, 0.12);">
                <div class="cms-rank-watermark fw-bold" style="font-size: 2.4rem; font-weight: 900; color: #9A3412; opacity: 0.4; line-height: 1;">3</div>
                <div class="w-100 py-1.5 px-2 rounded-2 text-center fw-bold" style="background: rgba(255, 255, 255, 0.9); color: #7C2D12; font-size: 0.72rem; letter-spacing: 0.3px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                  🥉 BRONZE TOPPER
                </div>
              </div>
            ` : '<div class="text-muted small py-4">Awaiting Bronze Topper</div>'}
          </div>

        </div>

        <!-- Unified Podium Stage Base Foundation -->
        <div class="cms-podium-base-stage mx-auto" style="max-width: 820px; height: 16px; background: linear-gradient(90deg, #CBD5E1 0%, #94A3B8 50%, #CBD5E1 100%); border-radius: 0 0 12px 12px; box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12); border: 1px solid #94A3B8; border-top: none;"></div>
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
      if (r.rank === 1) rankBadge = '<span class="badge fw-bold" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; padding: 4px 8px;">👑 #1</span>';
      else if (r.rank === 2) rankBadge = '<span class="badge fw-bold" style="background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; padding: 4px 8px;">🥈 #2</span>';
      else if (r.rank === 3) rankBadge = '<span class="badge fw-bold" style="background: #FFEDD5; color: #9A3412; border: 1px solid #FDBA74; padding: 4px 8px;">🥉 #3</span>';

      const isCurrent = r.isCurrentUser;
      const rowStyle = isCurrent ? 'background: #EFF6FF !important; border-left: 4px solid #2563EB;' : '';

      return `
        <tr style="${rowStyle}">
          <td class="text-center py-3" style="white-space: nowrap;">${rankBadge}</td>
          <td style="min-width: 220px;">
            <div class="d-flex align-items-center gap-2.5">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 36px; height: 36px; background: #EFF6FF; color: #2563EB; font-size: 0.85rem; border: 1px solid #DBEAFE; flex-shrink: 0;">
                ${getInitials(r.studentName, 'U')}
              </div>
              <div style="min-width: 0;">
                <div class="fw-bold small text-truncate" style="color: #0F172A; max-width: 190px;" title="${escapeHtml(r.studentName)}">
                  ${escapeHtml(r.studentName)} ${isCurrent ? '<span class="badge bg-primary ms-1" style="font-size: 0.65rem;">YOU</span>' : ''}
                </div>
                <div class="text-muted text-truncate" style="font-size: 0.72rem; max-width: 190px;" title="${escapeHtml(r.studentEmail || '')}">
                  ${escapeHtml(r.studentEmail || '')}
                </div>
              </div>
            </div>
          </td>
          <td style="white-space: nowrap;">
            <span class="badge bg-light text-secondary border font-monospace small" style="font-weight: 500;">
              ${escapeHtml(r.careerTitle || 'Developer')}
            </span>
          </td>
          <td class="small text-muted text-truncate" style="max-width: 210px;" title="${escapeHtml(r.college || 'Engineering')}">
            ${escapeHtml(r.college || 'Engineering')}
          </td>
          <td class="text-center font-monospace small fw-semibold" style="color: #334155; white-space: nowrap;">
            ${r.assignmentMarks != null ? r.assignmentMarks.toFixed(1) : '—'}
          </td>
          <td class="text-center font-monospace small fw-semibold" style="color: #334155; white-space: nowrap;">
            ${r.quizMarks != null ? r.quizMarks.toFixed(1) : '—'}
          </td>
          <td class="text-center font-monospace small fw-semibold" style="color: #334155; white-space: nowrap;">
            ${r.progressMarks != null ? r.progressMarks.toFixed(1) : '—'}%
          </td>
          <td class="text-end" style="white-space: nowrap;">
            <span class="badge font-monospace fw-bold fs-6" style="background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; padding: 5px 10px;">
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
      let crestBadge = '<span class="badge bg-light text-secondary border font-monospace">TOP 10</span>';
      if (r.eligibilityCrest === 'GOLD') crestBadge = '<span class="badge fw-bold" style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;">👑 GOLD CREST</span>';
      else if (r.eligibilityCrest === 'SILVER') crestBadge = '<span class="badge fw-bold" style="background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1;">🥈 SILVER CREST</span>';
      else if (r.eligibilityCrest === 'BRONZE') crestBadge = '<span class="badge fw-bold" style="background: #FFEDD5; color: #9A3412; border: 1px solid #FDBA74;">🥉 BRONZE CREST</span>';

      const isEligible = r.isEligible;
      const statusPill = isEligible
        ? '<span class="badge bg-success-subtle text-success border border-success-subtle fw-semibold" style="font-size: 0.75rem;"><i class="bi bi-check-circle-fill me-1"></i> You are Eligible</span>'
        : '<span class="badge bg-light text-muted border font-monospace" style="font-size: 0.75rem;"><i class="bi bi-lock-fill me-1"></i> Higher CMS Required</span>';

      const companyInitials = getInitials(r.companyName, 'CO');

      return `
        <div class="col-12 col-md-6 col-xl-4">
          <div class="h-100 bg-white rounded-3 p-3.5 d-flex flex-column justify-content-between" style="border: 1.5px solid #E2E8F0; border-radius: 16px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04); transition: transform 0.2s, box-shadow 0.2s;">
            <div>
              <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                  <div class="rounded-3 d-flex align-items-center justify-content-center fw-bold" style="width: 36px; height: 36px; background: #F1F5F9; color: #1E293B; border: 1px solid #CBD5E1; font-size: 0.82rem; flex-shrink: 0;">
                    ${companyInitials}
                  </div>
                  <div>
                    <span class="fw-bold fs-6 d-block" style="color: #0F172A; line-height: 1.2;">${escapeHtml(r.companyName)}</span>
                    <span class="text-muted small" style="font-size: 0.72rem;">Placement Partner</span>
                  </div>
                </div>
                ${crestBadge}
              </div>

              <h6 class="text-primary fw-semibold mb-2" style="font-size: 0.95rem; line-height: 1.4;">${escapeHtml(r.roleTitle)}</h6>

              <div class="d-flex align-items-center gap-1.5 flex-wrap mb-2.5">
                <span class="badge bg-light text-secondary border font-mono" style="font-size: 0.74rem; font-weight: 500; padding: 4px 8px;">
                  <i class="bi bi-geo-alt text-danger me-1"></i>${escapeHtml(r.location)}
                </span>
                <span class="badge bg-success-subtle text-success border border-success-subtle font-mono" style="font-size: 0.74rem; font-weight: 700; padding: 4px 8px;">
                  <i class="bi bi-cash-stack text-success me-1"></i>${escapeHtml(r.stipendRange)}
                </span>
              </div>

              <div class="p-2.5 rounded-2 mb-2" style="background: #F8FAFC; border: 1px solid #E2E8F0; font-size: 0.75rem; color: #334155;">
                <div class="d-flex align-items-center gap-1.5">
                  <i class="bi bi-shield-lock-fill text-warning fs-6 flex-shrink-0"></i>
                  <div>
                    <strong class="text-ink">Referral Track:</strong> ${escapeHtml(r.referralContact || 'Disheera Direct Executive Referral')}
                  </div>
                </div>
              </div>
            </div>

            <div class="d-flex align-items-center justify-content-between pt-2.5 mt-2 border-top" style="border-color: #E2E8F0 !important;">
              <div>${statusPill}</div>
              <a href="${escapeHtml(r.applyUrl || '#')}" target="_blank" rel="noopener noreferrer" class="btn btn-sm ${isEligible ? 'btn-primary' : 'btn-outline-secondary disabled'}" style="${isEligible ? 'background: #2563EB; border: none; font-weight: 600;' : 'font-weight: 600;'}">
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

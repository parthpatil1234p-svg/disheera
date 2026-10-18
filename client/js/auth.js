/**
 * auth.js — Client-Side Authentication State & Helpers
 *
 * Manages JWT storage, active user persistence, route protection, and logout.
 */

// ── Portal Isolation Catalogs ─────────────────────────────────
const STUDENT_PAGES = [
  'dashboard',
  'dashboard.html',
  'assessment',
  'assessment.html',
  'recommendations',
  'recommendations.html',
  'roadmap',
  'roadmap.html',
  'resume-builder',
  'resume-builder.html',
  'quiz',
  'quiz.html',
];

const RECRUITER_PAGES = [
  'recruiter-dashboard',
  'recruiter-dashboard.html',
  'post-job',
  'post-job.html',
];

function checkPageMatch(pathname, pageList) {
  if (!pathname) return false;
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
  const slug = clean.split('/').pop() || '';
  return pageList.some((p) => {
    const baseP = p.replace(/\.html$/, '').toLowerCase();
    return slug === p.toLowerCase() || slug === baseP;
  });
}

// Immediate Portal Isolation Trap (runs synchronously on script load before page DOM renders)
(function enforcePortalIsolation() {
  if (typeof window === 'undefined') return;
  const path = (window.location.pathname || '').toLowerCase();

  const isStudentPage = checkPageMatch(path, STUDENT_PAGES);
  const isRecruiterPage = checkPageMatch(path, RECRUITER_PAGES);
  const isLandingPage = path === '' || path === '/' || path.endsWith('/index.html') || path.endsWith('index.html') || path.endsWith('/index') || path.endsWith('index');

  if (!isStudentPage && !isRecruiterPage && !isLandingPage) return;

  const rawUser = localStorage.getItem(window.CONFIG?.USER_KEY || 'careerpath_user');
  const token = localStorage.getItem(window.CONFIG?.TOKEN_KEY || 'careerpath_token');
  if (!token || !rawUser) return;

  try {
    const user = JSON.parse(rawUser);
    if (!user) return;
    if (user.role === 'admin' || user.isAdmin) return; // Full admin bypass only

    const isRecruiter = user.role === 'recruiter';

    // Auto-redirect recruiter from student landing page unless public preview requested
    if (isRecruiter && isLandingPage && !window.location.search.includes('view=public')) {
      window.location.replace('recruiter-dashboard.html');
      return;
    }

    if (isRecruiter && isStudentPage) {
      sessionStorage.setItem(
        'portal_redirect_alert',
        '🏢 Recruiter accounts cannot access student learning and roadmap resources. You have been redirected to your Recruiter Portal.'
      );
      window.location.replace('recruiter-dashboard.html');
    } else if (user.role !== 'recruiter' && isRecruiterPage) {
      sessionStorage.setItem(
        'portal_redirect_alert',
        '🎓 Student accounts cannot access the company recruiter portal. You have been redirected to your Student Dashboard.'
      );
      window.location.replace('dashboard.html');
    }
  } catch {
    // Ignore JSON parse errors
  }
})();

const Auth = {
  /**
   * Retrieves the stored JWT token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(window.CONFIG?.TOKEN_KEY || 'careerpath_token');
  },

  /**
   * Stores the JWT token
   * @param {string} token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem(window.CONFIG?.TOKEN_KEY || 'careerpath_token', token);
    }
  },

  /**
   * Removes the JWT token
   */
  removeToken() {
    localStorage.removeItem(window.CONFIG?.TOKEN_KEY || 'careerpath_token');
  },

  /**
   * Retrieves stored user summary object
   * @returns {Object|null}
   */
  getCurrentUser() {
    const raw = localStorage.getItem(window.CONFIG?.USER_KEY || 'careerpath_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Retrieves stored user summary object (alias for getCurrentUser)
   * @returns {Object|null}
   */
  getUser() {
    return this.getCurrentUser();
  },

  /**
   * Getter property for user summary
   * @returns {Object|null}
   */
  get user() {
    return this.getCurrentUser();
  },

  /**
   * Stores user summary
   * @param {Object} user
   */
  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(window.CONFIG?.USER_KEY || 'careerpath_user', JSON.stringify(user));
    }
  },

  /**
   * Checks if user has a valid active session
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = this.getToken();
    return Boolean(token && token.trim() !== '');
  },

  /**
   * Alias for isAuthenticated()
   * @returns {boolean}
   */
  isLoggedIn() {
    return this.isAuthenticated();
  },

  /**
   * Guard for protected pages: redirects unauthenticated users to login.html
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?redirect=${currentPath}`;
    }
  },

  /**
   * Checks whether the current user is a system admin
   * @returns {boolean}
   */
  isAdmin() {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.role === 'admin' || Boolean(user.isAdmin);
  },

  isDemo() {
    return false;
  },

  /**
   * Checks whether the active user is a verified corporate recruiter
   * @returns {boolean}
   */
  isRecruiter() {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.role === 'recruiter';
  },

  /**
   * Guard for student-only pages: blocks recruiters and redirects to recruiter portal
   * @returns {boolean}
   */
  requireStudent() {
    if (!this.isAuthenticated()) {
      const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?redirect=${currentPath}`;
      return false;
    }
    const user = this.getCurrentUser();
    if (user && user.role === 'recruiter' && user.role !== 'admin') {
      sessionStorage.setItem(
        'portal_redirect_alert',
        '🏢 Recruiter accounts cannot access student learning and roadmap resources. You have been redirected to your Recruiter Portal.'
      );
      window.location.replace('recruiter-dashboard.html');
      return false;
    }
    return true;
  },

  /**
   * Guard for recruiter-only pages: redirects students or unauthenticated users
   * @returns {boolean}
   */
  requireRecruiter() {
    if (!this.isAuthenticated()) {
      const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?redirect=${currentPath}`;
      return false;
    }
    const user = this.getCurrentUser();
    if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
      sessionStorage.setItem(
        'portal_redirect_alert',
        '🎓 Student accounts cannot access the company recruiter portal. You have been redirected to your Student Dashboard.'
      );
      window.location.replace('dashboard.html');
      return false;
    }
    return true;
  },

  /**
   * Consumes and renders session flash alert message from portal redirection
   * @param {string|null} containerId
   */
  consumePortalAlert(containerId = null) {
    const msg = sessionStorage.getItem('portal_redirect_alert');
    if (!msg) return;
    sessionStorage.removeItem('portal_redirect_alert');

    const container = containerId ? document.getElementById(containerId) : (
      document.getElementById('alertContainer') ||
      document.getElementById('recruiterAlertContainer') ||
      document.getElementById('jobAlertContainer') ||
      document.getElementById('dashboardAlertContainer') ||
      document.querySelector('main.container') ||
      document.querySelector('main')
    );

    if (container) {
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-warning alert-dismissible fade show d-flex align-items-center gap-2.5 py-2.5 px-3.5 mb-4 shadow-sm border border-warning border-opacity-50';
      alertDiv.setAttribute('role', 'alert');
      alertDiv.innerHTML = `
        <i class="bi bi-shield-exclamation fs-5 flex-shrink-0 text-warning"></i>
        <div class="small fw-semibold text-ink">${escapeHtml(msg)}</div>
        <button type="button" class="btn-close ms-auto p-2" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      if (container.firstChild) {
        container.insertBefore(alertDiv, container.firstChild);
      } else {
        container.appendChild(alertDiv);
      }
    }
  },

  /**
   * Logs out the user by clearing localStorage and redirecting to login.html
   */
  logout() {
    this.removeToken();
    localStorage.removeItem(window.CONFIG?.USER_KEY || 'careerpath_user');
    window.location.href = 'login.html';
  },

  /**
   * Checks whether the active user has completed skill verification
   * (either via adaptive check or GitHub code verification)
   * @returns {boolean}
   */
  isSkillVerified() {
    if (this.isAdmin() || this.isRecruiter()) return true;
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'recruiter' || user.isRecruiter) return true;
    return Boolean(
      user.hasCompletedSkillVerification ||
      (Array.isArray(user.skills) && user.skills.some((s) => s.isQuizVerified || s.isCodeVerified))
    );
  },

  /**
   * Guard for skill-verified pages
   * @returns {boolean}
   */
  requireSkillVerification() {
    this.requireAuth();
    return this.isSkillVerified();
  },

  /**
   * Renders the high-aesthetic Skill Verification Gate into a target container
   * @param {HTMLElement} container
   * @param {string} pageName
   * @param {string} description
   */
  renderVerificationGate(container, pageName, description) {
    if (!container) return;
    const loadingEl = document.getElementById('loadingState') || document.getElementById('roadmapLoading');
    if (loadingEl) loadingEl.classList.add('d-none');

    container.classList.remove('d-none');
    container.innerHTML = `
      <div class="row justify-content-center py-5">
        <div class="col-lg-8 col-xl-7">
          <div class="card p-4 p-md-5 text-center shadow-lg border border-warning-subtle" 
               style="background: radial-gradient(circle at top, rgba(234, 179, 8, 0.09), transparent 70%), var(--bg-surface, #FFFFFF); border-radius: 1.25rem;">
            <div class="mb-3">
              <span class="badge badge-gold fs-6 px-3 py-1.5 rounded-pill" style="font-family: var(--font-body);">
                <i class="bi bi-shield-lock-fill me-1"></i> Skill Verification Gate Active
              </span>
            </div>
            <div class="display-3 text-warning mb-3">
              <i class="bi bi-lock-fill"></i>
            </div>
            <h2 class="h3 fw-bold text-ink mb-2">${escapeHtml(pageName)} is Locked</h2>
            <p class="text-muted mb-4 lead" style="font-size: 1.05rem;">
              ${escapeHtml(description)} require verified skill data to generate. Complete <strong>"Prove your skills"</strong> in your assessment to earn your <strong>Account Verified ✓</strong> credential and unlock this page.
            </p>
            <div class="p-3 mb-4 rounded-3 stat-box-atlas text-start d-flex align-items-center gap-3 border border-line">
              <div class="rounded-circle p-2 bg-primary-subtle text-primary fs-4 flex-shrink-0">
                <i class="bi bi-lightning-charge-fill"></i>
              </div>
              <div>
                <div class="fw-semibold text-ink">90-Second Adaptive Check or GitHub Sync</div>
                <div class="small text-muted">Answer 5 quick adaptive questions or auto-sync your GitHub repositories to prove your skills and unlock all platform features.</div>
              </div>
            </div>
            <div class="d-flex justify-content-center gap-3 flex-wrap">
              <a href="assessment.html?step=3#stepPanel3" class="btn cp-btn-primary px-4 py-2.5 fw-semibold d-inline-flex align-items-center gap-2">
                <i class="bi bi-shield-check"></i>
                <span>Prove Your Skills to Unlock</span>
                <i class="bi bi-arrow-right"></i>
              </a>
              <a href="index.html" class="btn btn-outline-secondary px-3 py-2.5">
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Binds smart role-aware destination to brand logos across all pages.
   * - Recruiters stay inside / return to recruiter-dashboard.html
   * - Students and guests: brand logo always links back to the main landing page (index.html)
   */
  bindSmartLogo() {
    const isAuthed = this.isAuthenticated();
    const isRecruiter = this.isRecruiter();
    const currentPath = (window.location.pathname || '').toLowerCase();
    const onRecruiterPage = currentPath.includes('recruiter-');
    const brandElements = document.querySelectorAll('.navbar-brand');

    brandElements.forEach((brand) => {
      if (isAuthed && (isRecruiter || onRecruiterPage)) {
        brand.setAttribute('href', 'recruiter-dashboard.html');
        brand.setAttribute('title', 'Recruiter Portal Home');

        // Ensure a stylish recruiter badge is rendered if not already present
        if (!brand.querySelector('.brand-recruiter-badge') && !brand.querySelector('.badge')) {
          const badge = document.createElement('span');
          badge.className = 'badge bg-success-subtle text-success border border-success-subtle ms-2 font-mono brand-recruiter-badge';
          badge.style.fontSize = '0.68rem';
          badge.style.padding = '2px 7px';
          badge.style.borderRadius = '9999px';
          badge.innerHTML = '<span class="pulse-dot-green d-inline-block me-1" style="width: 5px; height: 5px; border-radius: 50%; background: #10B981;"></span> RECRUITER';
          brand.appendChild(badge);
        }
      } else {
        brand.setAttribute('href', 'index.html');
        brand.setAttribute('title', 'Disheera Home');
      }
    });
  },

  /**
   * Initializes navbar user state (displays username, Home navigation button, or login/signup buttons)
   */
  initNav() {
    this.bindSmartLogo();
    const user = this.getCurrentUser();
    const authActions = document.getElementById('authNavActions');
    if (!authActions) return;

    if (this.isAuthenticated() && user) {
      const isRecruiter = this.isRecruiter();
      const isAdmin = this.isAdmin();
      const isVerified = this.isSkillVerified();
      const currentPath = (window.location.pathname || '').toLowerCase();
      const isHomePage = currentPath.endsWith('/index.html') || currentPath.endsWith('/') || currentPath === '' || currentPath.endsWith('\\index.html');

      const name = user.name || (isRecruiter ? 'Recruiter' : 'Student');
      const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0].toUpperCase())
        .join('') || 'U';

      let roleChip = '';
      let targetDashboardUrl = isRecruiter ? 'recruiter-dashboard.html' : 'dashboard.html';

      if (isRecruiter) {
        roleChip = `
          <a href="recruiter-dashboard.html" class="nav-role-chip nav-role-chip-recruiter" title="Verified Corporate Recruiter Portal">
            <i class="bi bi-buildings-fill text-success"></i>
            <span>Recruiter</span>
          </a>
        `;
      } else if (isAdmin) {
        roleChip = `
          <a href="dashboard.html" class="nav-role-chip nav-role-chip-student" title="Student Hub & Learning Dashboard">
            <i class="bi bi-mortarboard-fill text-success"></i>
            <span>Student</span>
          </a>
        `;
      } else if (isVerified) {
        roleChip = `
          <a href="dashboard.html" class="nav-role-chip nav-role-chip-student" title="Student Hub · Account & Skills Verified">
            <i class="bi bi-patch-check-fill text-success"></i>
            <span>Student ✓</span>
          </a>
        `;
      } else {
        roleChip = `
          <a href="dashboard.html" class="nav-role-chip nav-role-chip-student" title="Student Hub & Learning Dashboard · 100% Free Lifetime Access">
            <i class="bi bi-mortarboard-fill text-success"></i>
            <span>Student</span>
          </a>
        `;
      }

      authActions.innerHTML = `
        <div class="nav-profile-group d-flex align-items-center gap-1.5 text-nowrap">
          ${roleChip}
          <a href="${targetDashboardUrl}"
             class="nav-user-pill ${isRecruiter ? 'nav-user-pill-recruiter' : ''} d-none d-md-inline-flex align-items-center gap-2"
             title="${isRecruiter ? 'Recruiter Account' : 'Student Account'}: ${escapeHtml(name)} · Click to open ${isRecruiter ? 'Recruiter Portal' : 'Student Dashboard'}">
            <span class="nav-avatar-circle">${escapeHtml(initials)}</span>
            <span class="nav-user-name">${escapeHtml(name)}</span>
          </a>
          <button id="logoutBtn" class="nav-btn-logout" onclick="Auth.logout()" title="Sign Out" aria-label="Sign Out">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      `;

      const mobileDashUrl = isRecruiter ? 'recruiter-dashboard.html' : 'dashboard.html';
      const mobileDashLabel = isRecruiter ? 'Recruiter Portal' : 'Dashboard';

      const mobileActions = document.getElementById('notchMobileAuthActions');
      if (mobileActions) {
        mobileActions.innerHTML = `
          <div class="d-flex flex-column gap-2 w-100">
            <div class="d-flex justify-content-center">${roleChip}</div>
            <div class="d-flex gap-2">
              ${!isRecruiter && !isHomePage ? `
                <a class="btn btn-outline-secondary btn-sm flex-grow-1 text-center" href="index.html" title="Return to Home Landing Page">
                  <i class="bi bi-house-door-fill me-1 text-primary"></i> Home
                </a>
              ` : ''}
              <a class="btn cp-btn-primary btn-sm flex-grow-1 text-center" href="${mobileDashUrl}">
                <i class="bi ${isRecruiter ? 'bi-building' : 'bi-speedometer2'} me-1"></i> ${mobileDashLabel}
              </a>
              <button class="nav-btn-logout" onclick="Auth.logout()" title="Sign Out">
                <i class="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        `;
      }

      // Ensure Home link is prepended to mobile drawer links when inside the student portal
      const mobileLinks = document.querySelector('#notchMobileMenu .notch-mobile-links');
      if (mobileLinks && !isRecruiter && !isHomePage && !mobileLinks.querySelector('.notch-mobile-home-item')) {
        const homeLi = document.createElement('li');
        homeLi.className = 'notch-mobile-home-item';
        homeLi.innerHTML = `
          <a href="index.html" class="d-flex align-items-center gap-2 text-primary fw-semibold py-1">
            <i class="bi bi-house-door-fill text-primary"></i> Home Page
          </a>
        `;
        mobileLinks.insertBefore(homeLi, mobileLinks.firstChild);
      }
    }
  },
};

// Safe HTML escaper helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.escapeHtml = escapeHtml;
window.Auth = Auth;

// ── Strict WhatsApp Phone Gate for Existing Students (Option A) ───
const STUDENT_GATE_PAGES = [
  'dashboard.html',
  'assessment.html',
  'recommendations.html',
  'roadmap.html',
  'resume-builder.html',
  'quiz.html',
  'jobs.html',
];

function injectPhoneGateStyles() {
  if (document.getElementById('spgStyles')) return;
  const style = document.createElement('style');
  style.id = 'spgStyles';
  style.textContent = `
    .spg-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(10, 15, 29, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: 1rem;
      animation: spgFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes spgFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .spg-card {
      width: 100%;
      max-width: 480px;
      background: linear-gradient(180deg, #182234 0%, #0d1524 100%);
      border: 1px solid rgba(99, 102, 241, 0.35);
      border-radius: 1.25rem;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2);
      padding: 2rem;
      color: #f8fafc;
      position: relative;
      animation: spgSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes spgSlideUp {
      from { transform: translateY(20px) scale(0.97); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .spg-wa-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(37, 211, 102, 0.15);
      color: #25D366;
      border: 1px solid rgba(37, 211, 102, 0.3);
      padding: 5px 14px;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .spg-icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(37, 211, 102, 0.25) 0%, rgba(37, 211, 102, 0.05) 70%);
      border: 1px solid rgba(37, 211, 102, 0.4);
      color: #25D366;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin: 0 auto;
      box-shadow: 0 0 20px rgba(37, 211, 102, 0.25);
    }
    .spg-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #ffffff;
      margin-top: 0.5rem;
    }
    .spg-subtitle {
      font-size: 0.875rem;
      color: #94a3b8;
      line-height: 1.5;
    }
    .spg-notice-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
      color: #cbd5e1;
    }
    .spg-input-group {
      border: 1px solid rgba(148, 163, 184, 0.3);
      border-radius: 0.65rem;
      overflow: hidden;
      transition: all 0.2s ease;
      background: #0b1120;
    }
    .spg-input-group:focus-within {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
    }
    .spg-prefix-addon {
      background: #1e293b !important;
      border: none !important;
      color: #f1f5f9 !important;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 0.65rem 0.9rem;
    }
    .spg-input-field {
      background: transparent !important;
      border: none !important;
      color: #ffffff !important;
      font-size: 1.1rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.08em;
      padding: 0.65rem 0.9rem !important;
    }
    .spg-input-field::placeholder {
      color: #64748b !important;
      font-weight: 400;
      letter-spacing: normal;
    }
    .spg-input-field:focus {
      outline: none !important;
      box-shadow: none !important;
    }
    .spg-otp-digits-wrapper {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin: 1.25rem 0;
    }
    .spg-otp-digit {
      width: 48px;
      height: 54px;
      text-align: center;
      font-size: 1.4rem;
      font-weight: 800;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #ffffff;
      background: #0b1120 !important;
      border: 1px solid rgba(148, 163, 184, 0.3);
      border-radius: 0.6rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
      background-image: none !important;
      background-size: 0px 0px !important;
      background-repeat: no-repeat !important;
    }
    .spg-otp-digit:focus {
      border-color: #25D366;
      box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.3);
      background: #111c30 !important;
    }
    .spg-otp-digit.is-filled {
      border-color: #6366f1;
      background: #131d33 !important;
    }
    .spg-otp-digit.is-error {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25) !important;
    }
    .spg-link-switch {
      color: #94a3b8;
      font-size: 0.82rem;
      text-decoration: none;
      transition: color 0.2s;
    }
    .spg-link-switch:hover {
      color: #f1f5f9;
      text-decoration: underline;
    }
    @media (max-width: 420px) {
      .spg-card {
        padding: 1.25rem;
      }
      .spg-otp-digit {
        width: 40px;
        height: 48px;
        font-size: 1.2rem;
      }
      .spg-otp-digits-wrapper {
        gap: 6px;
      }
    }
  `;
  document.head.appendChild(style);
}

function renderStrictPhoneGateModal() {
  if (document.getElementById('strictPhoneGateModal')) return;

  injectPhoneGateStyles();
  document.body.style.overflow = 'hidden';

  const overlay = document.createElement('div');
  overlay.id = 'strictPhoneGateModal';
  overlay.className = 'spg-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'spgTitle');

  overlay.innerHTML = `
    <div class="spg-card">
      <div class="text-center mb-3">
        <div class="mb-2.5">
          <span class="spg-wa-badge">
            <i class="bi bi-whatsapp"></i> WhatsApp Verification Required
          </span>
        </div>
        <div class="spg-icon-circle mb-3">
          <i class="bi bi-phone-vibrate-fill"></i>
        </div>
        <h3 id="spgTitle" class="spg-title mb-1.5">Link Your WhatsApp Number</h3>
        <p class="spg-subtitle mb-3">
          To receive your weekly roadmap PDF notes, test score alerts, and verified certificates, linking an authentic WhatsApp number is required.
        </p>
        <div class="spg-notice-card text-start d-flex align-items-center gap-2.5 mb-3">
          <i class="bi bi-shield-lock-fill text-warning fs-4 flex-shrink-0"></i>
          <div>
            <strong class="text-white">Strict Student Gate Active:</strong>
            <span> Platform resources are locked until your WhatsApp number is verified.</span>
          </div>
        </div>
      </div>

      <div id="spgAlertBox" class="alert d-none mb-3 py-2 px-3 small border" role="alert"></div>

      <!-- Step 1: Input WhatsApp Number -->
      <div id="spgStep1">
        <label for="spgPhoneInput" class="form-label small fw-semibold text-slate-300 mb-1.5">
          WhatsApp Mobile Number <span class="text-danger">*</span>
        </label>
        <div class="input-group mb-3 spg-input-group">
          <span class="input-group-text spg-prefix-addon">🇮🇳 +91</span>
          <input type="tel"
                 id="spgPhoneInput"
                 class="form-control spg-input-field"
                 placeholder="10-digit number"
                 maxlength="10"
                 autocomplete="off"
                 inputmode="numeric" />
        </div>
        <button id="spgBtnSendOtp" class="btn cp-btn-primary w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2">
          <i class="bi bi-send-fill"></i>
          <span>Send WhatsApp OTP</span>
        </button>
        <div class="text-center mt-3">
          <a href="#" id="spgBtnLogout" class="spg-link-switch">
            <i class="bi bi-box-arrow-right me-1"></i> Sign in with a different account
          </a>
        </div>
      </div>

      <!-- Step 2: 6-Digit OTP Verification -->
      <div id="spgStep2" class="d-none">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <span class="small text-slate-300">Code sent to: <strong id="spgTargetPhoneDisplay" class="text-white">+91</strong></span>
          <button type="button" id="spgBtnChangePhone" class="btn btn-link btn-sm text-primary p-0 text-decoration-none">
            <i class="bi bi-pencil-square"></i> Change
          </button>
        </div>

        <div class="spg-otp-digits-wrapper" id="spgDigitsContainer">
          <input type="text" class="spg-otp-digit" id="spgd0" maxlength="1" inputmode="numeric" autocomplete="off" />
          <input type="text" class="spg-otp-digit" id="spgd1" maxlength="1" inputmode="numeric" autocomplete="off" />
          <input type="text" class="spg-otp-digit" id="spgd2" maxlength="1" inputmode="numeric" autocomplete="off" />
          <input type="text" class="spg-otp-digit" id="spgd3" maxlength="1" inputmode="numeric" autocomplete="off" />
          <input type="text" class="spg-otp-digit" id="spgd4" maxlength="1" inputmode="numeric" autocomplete="off" />
          <input type="text" class="spg-otp-digit" id="spgd5" maxlength="1" inputmode="numeric" autocomplete="off" />
        </div>

        <div class="d-flex align-items-center justify-content-between mb-3 small">
          <span id="spgTimerWrap" class="text-muted">
            Resend code in <strong id="spgTimerSeconds" class="text-primary font-mono">60</strong>s
          </span>
          <button type="button" id="spgBtnResendOtp" class="btn btn-link btn-sm p-0 text-decoration-none text-primary fw-semibold d-none">
            Resend WhatsApp OTP
          </button>
        </div>

        <button id="spgBtnVerifyOtp" class="btn cp-btn-primary w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2">
          <i class="bi bi-shield-check"></i>
          <span>Verify & Unlock Platform</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Bind elements
  const step1 = overlay.querySelector('#spgStep1');
  const step2 = overlay.querySelector('#spgStep2');
  const phoneInput = overlay.querySelector('#spgPhoneInput');
  const btnSend = overlay.querySelector('#spgBtnSendOtp');
  const btnLogout = overlay.querySelector('#spgBtnLogout');
  const alertBox = overlay.querySelector('#spgAlertBox');
  const phoneDisplay = overlay.querySelector('#spgTargetPhoneDisplay');
  const btnChange = overlay.querySelector('#spgBtnChangePhone');
  const btnVerify = overlay.querySelector('#spgBtnVerifyOtp');
  const btnResend = overlay.querySelector('#spgBtnResendOtp');
  const timerWrap = overlay.querySelector('#spgTimerWrap');
  const timerSecs = overlay.querySelector('#spgTimerSeconds');
  const digitsContainer = overlay.querySelector('#spgDigitsContainer');
  const digitInputs = [0, 1, 2, 3, 4, 5].map((i) => overlay.querySelector(`#spgd${i}`));

  let currentLinkedPhone = '';
  let countdownTimer = null;
  let remainingTime = 60;

  function showAlert(msg, type = 'danger') {
    alertBox.className = `alert alert-${type} py-2 px-3 small border mb-3`;
    alertBox.innerHTML = escapeHtml(msg);
    alertBox.classList.remove('d-none');
  }

  function clearAlert() {
    alertBox.classList.add('d-none');
    alertBox.innerHTML = '';
  }

  function setBtnLoading(btn, loading, text) {
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${escapeHtml(text || 'Processing...')}`;
    } else {
      btn.disabled = false;
      if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
    }
  }

  function startTimer() {
    if (countdownTimer) clearInterval(countdownTimer);
    remainingTime = 60;
    timerSecs.textContent = '60';
    timerWrap.classList.remove('d-none');
    btnResend.classList.add('d-none');

    countdownTimer = setInterval(() => {
      remainingTime--;
      if (remainingTime <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        timerWrap.classList.add('d-none');
        btnResend.classList.remove('d-none');
      } else {
        timerSecs.textContent = remainingTime;
      }
    }, 1000);
  }

  // Intercept Escape to prevent dismissing the strict gate
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('strictPhoneGateModal')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Strip background styles injected by extensions
  const stripExtensionStyles = () => {
    digitInputs.forEach((inp) => {
      if (inp) {
        inp.style.setProperty('background-image', 'none', 'important');
        inp.style.setProperty('background-size', '0px 0px', 'important');
      }
    });
  };
  stripExtensionStyles();
  const obs = new MutationObserver(stripExtensionStyles);
  if (digitsContainer) obs.observe(digitsContainer, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });

  // Digit box keyboard navigation and paste handling
  digitInputs.forEach((inp, idx) => {
    inp.addEventListener('input', (e) => {
      clearAlert();
      const val = inp.value.replace(/\D/g, '');
      if (val.length > 0) {
        inp.value = val.slice(-1);
        inp.classList.add('is-filled');
        inp.classList.remove('is-error');
        if (idx < 5) digitInputs[idx + 1].focus();
      } else {
        inp.classList.remove('is-filled');
      }
    });

    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inp.value && idx > 0) {
        digitInputs[idx - 1].focus();
        digitInputs[idx - 1].value = '';
        digitInputs[idx - 1].classList.remove('is-filled');
      }
    });

    inp.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteText = (e.clipboardData || window.clipboardData).getData('text');
      const cleanDigits = pasteText.replace(/\D/g, '').slice(0, 6);
      if (cleanDigits) {
        cleanDigits.split('').forEach((d, i) => {
          if (digitInputs[i]) {
            digitInputs[i].value = d;
            digitInputs[i].classList.add('is-filled');
            digitInputs[i].classList.remove('is-error');
          }
        });
        const nextIdx = Math.min(cleanDigits.length, 5);
        digitInputs[nextIdx].focus();
        if (cleanDigits.length === 6) {
          handleVerifyOtp();
        }
      }
    });
  });

  // Action: Send OTP
  async function handleSendOtp() {
    clearAlert();
    const raw = (phoneInput.value || '').trim().replace(/\D/g, '');
    if (!raw || raw.length !== 10) {
      showAlert('Please enter a valid 10-digit mobile number.');
      phoneInput.focus();
      return;
    }

    setBtnLoading(btnSend, true, 'Sending WhatsApp OTP...');
    try {
      const baseUrl = window.CONFIG?.API_BASE_URL || 'http://localhost:5000/api';
      const token = window.Auth.getToken();
      const res = await fetch(`${baseUrl}/users/link-phone/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: raw }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showAlert(data.message || 'Failed to send WhatsApp verification code.');
        setBtnLoading(btnSend, false);
        return;
      }

      currentLinkedPhone = data.phone || ('+91' + raw);
      phoneDisplay.textContent = currentLinkedPhone;

      step1.classList.add('d-none');
      step2.classList.remove('d-none');

      startTimer();
      setTimeout(() => digitInputs[0].focus(), 150);
    } catch (err) {
      showAlert('Connection error. Please ensure your internet is active and try again.');
    } finally {
      setBtnLoading(btnSend, false);
    }
  }

  // Action: Verify OTP
  async function handleVerifyOtp() {
    clearAlert();
    const code = digitInputs.map((i) => i.value.trim()).join('');
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      showAlert('Please enter the complete 6-digit WhatsApp verification code.');
      digitInputs.forEach((i) => i.classList.add('is-error'));
      return;
    }

    setBtnLoading(btnVerify, true, 'Verifying...');
    try {
      const baseUrl = window.CONFIG?.API_BASE_URL || 'http://localhost:5000/api';
      const token = window.Auth.getToken();
      const res = await fetch(`${baseUrl}/users/link-phone/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: code, phone: currentLinkedPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showAlert(data.message || 'Invalid WhatsApp verification code.');
        digitInputs.forEach((i) => i.classList.add('is-error'));
        setBtnLoading(btnVerify, false);
        return;
      }

      // Successful verification!
      showAlert('✓ WhatsApp Mobile Number Linked! Unlocking platform...', 'success');
      if (data.data?.user) {
        window.Auth.setCurrentUser(data.data.user);
      } else {
        const u = window.Auth.getCurrentUser() || {};
        u.phone = currentLinkedPhone;
        window.Auth.setCurrentUser(u);
      }

      setTimeout(() => {
        document.body.style.overflow = '';
        overlay.remove();
        window.dispatchEvent(new CustomEvent('phoneLinked', { detail: { phone: currentLinkedPhone } }));
      }, 750);
    } catch (err) {
      showAlert('Verification error. Please try again.');
      setBtnLoading(btnVerify, false);
    }
  }

  btnSend.addEventListener('click', handleSendOtp);
  phoneInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendOtp();
  });

  btnVerify.addEventListener('click', handleVerifyOtp);

  btnChange.addEventListener('click', () => {
    step2.classList.add('d-none');
    step1.classList.remove('d-none');
    clearAlert();
    if (countdownTimer) clearInterval(countdownTimer);
    digitInputs.forEach((i) => {
      i.value = '';
      i.classList.remove('is-filled', 'is-error');
    });
    setTimeout(() => phoneInput.focus(), 100);
  });

  btnResend.addEventListener('click', () => {
    handleSendOtp();
  });

  btnLogout.addEventListener('click', (e) => {
    e.preventDefault();
    window.Auth.logout();
  });
}

async function initStudentPhoneGate() {
  if (typeof window === 'undefined') return;
  const path = (window.location.pathname || '').toLowerCase();
  const isStudentPage = STUDENT_GATE_PAGES.some((p) => path.endsWith(p));
  if (!isStudentPage) return;

  if (!window.Auth || !window.Auth.isAuthenticated()) return;
  const user = window.Auth.getCurrentUser();
  if (!user) return;

  // Bypass for recruiters and admins
  if (window.Auth.isRecruiter() || window.Auth.isAdmin()) return;

  // If user already has a phone with >= 10 digits
  if (user.phone && String(user.phone).trim().length >= 10) {
    return;
  }

  // Double check /api/users/me once in case server profile has phone but local storage was stale
  try {
    const token = window.Auth.getToken();
    if (token) {
      const baseUrl = window.CONFIG?.API_BASE_URL || 'http://localhost:5000/api';
      const checkRes = await fetch(`${baseUrl}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (checkRes.ok) {
        const json = await checkRes.json();
        const serverUser = json?.data?.user;
        if (serverUser?.phone && String(serverUser.phone).trim().length >= 10) {
          window.Auth.setCurrentUser({ ...user, phone: serverUser.phone });
          return;
        }
      }
    }
  } catch (err) {
    // Proceed to enforce gate if check fails
  }

  renderStrictPhoneGateModal();
}

window.Auth.initStudentPhoneGate = initStudentPhoneGate;
window.Auth.renderPhoneGate = renderStrictPhoneGateModal;

// Auto-initialize navbar, consume portal flash alert, and enforce student phone gate across all pages
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.Auth?.bindSmartLogo();
    window.Auth?.initNav();
    window.Auth?.consumePortalAlert();
    initStudentPhoneGate();
  });
} else {
  window.Auth?.bindSmartLogo();
  window.Auth?.initNav();
  window.Auth?.consumePortalAlert();
  initStudentPhoneGate();
}


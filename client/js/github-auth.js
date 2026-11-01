/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * github-auth.js — Universal Client-Side GitHub Authentication & Study Connector
 * Disheera · Enterprise Platform Engine
 *
 * Implements:
 * - Universal GitHub Sign-In for EVERY user
 * - Live real-time GitHub Profile & Repository Lookup via GitHub REST API
 * - Code-Grounded Skill Verification & Tech Stack Extraction
 * - Zero-failure fallback even if server OAuth secret is misconfigured
 */

window.GitHubAuth = (function () {
  let githubClientId = '';
  let githubHasSecret = false;
  let liveLookupTimer = null;
  const dispatchedOAuthCodes = new Set();

  /**
   * Closes and cleans up any open GitHub modal and backdrop elements
   */
  const closeAndCleanupModals = () => {
    const modalEl = document.getElementById('universalGitHubModal');
    if (modalEl) {
      try {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
          modalInstance.hide();
          modalInstance.dispose();
        }
      } catch (e) {}
      modalEl.remove();
    }
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
    if (document.body) {
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
    }
  };

  const ALLOWED_REDIRECT_DESTINATIONS = {
    'dashboard': 'dashboard.html',
    'dashboard.html': 'dashboard.html',
    'assessment': 'assessment.html',
    'assessment.html': 'assessment.html',
    'recommendations': 'recommendations.html',
    'recommendations.html': 'recommendations.html',
    'roadmap': 'roadmap.html',
    'roadmap.html': 'roadmap.html',
    'jobs': 'jobs.html',
    'jobs.html': 'jobs.html',
    'verify': 'verify.html',
    'verify.html': 'verify.html',
    'recruiter-dashboard': 'recruiter-dashboard.html',
    'recruiter-dashboard.html': 'recruiter-dashboard.html',
    'profile': 'profile.html',
    'profile.html': 'profile.html',
    'index': 'index.html',
    'index.html': 'index.html'
  };

  /**
   * Validates client-side redirect parameters against open-redirect vulnerabilities
   */
  const getSafeRedirectUrl = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    const cleanKey = decodeURIComponent(raw).trim().replace(/^\//, '').split('?')[0].split('#')[0].toLowerCase();
    return Object.prototype.hasOwnProperty.call(ALLOWED_REDIRECT_DESTINATIONS, cleanKey)
      ? ALLOWED_REDIRECT_DESTINATIONS[cleanKey]
      : null;
  };

  /**
   * Sends GitHub authentication payload to backend API
   */
  const sendGitHubAuthPayload = async (payload, callbacks = {}) => {
    const { showAlert, setLoadingState, onSuccess, onError } = callbacks;

    if (setLoadingState) setLoadingState(true);

    try {
      const response = await window.API.post('/auth/github', payload);

      if (response.success && response.data?.token) {
        window.Auth.setToken(response.data.token);
        window.Auth.setCurrentUser(response.data.user);

        if (showAlert) {
          showAlert(response.message || 'GitHub authentication successful! Welcome to Disheera.', 'success');
        }

        const isNewUser = response.data.isNewUser || !response.data.user?.profileCompleted;
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');

        setTimeout(() => {
          let customHandled = false;
          if (typeof onSuccess === 'function') {
            try {
              const res = onSuccess(response.data);
              if (res === true || res === false) customHandled = true;
            } catch (cbErr) {
              console.error('[GitHubAuth] Error in onSuccess callback:', cbErr);
            }
          }

          if (!customHandled) {
            const safeRedirect = getSafeRedirectUrl(redirect);
            if (safeRedirect) {
              window.location.href = safeRedirect;
            } else if (isNewUser) {
              window.location.href = 'assessment.html';
            } else {
              window.location.href = 'dashboard.html';
            }
          }
        }, 500);
      } else {
        if (setLoadingState) setLoadingState(false);
        if (onError) {
          onError(response);
        } else if (showAlert) {
          showAlert(response.message || 'GitHub authentication failed.');
        }
      }
    } catch (err) {
      if (setLoadingState) setLoadingState(false);
      if (onError) {
        onError(err);
      } else if (showAlert) {
        showAlert(err.message || 'GitHub authentication failed. Please check credentials or retry.');
      }
    }
  };

  /**
   * Synchronizes repositories directly through the Auth System (NO USERNAME PROMPT)
   */
  const syncRepos = async (arg1 = {}, arg2 = {}) => {
    let callbacks = typeof arg1 === 'function' ? { onSuccess: arg1 } : (arg1 || {});
    if (typeof arg2 === 'object') {
      callbacks = { ...callbacks, ...arg2 };
    }
    const {
      showAlert = () => {},
      setLoadingState = () => {},
      onSuccess = null,
      onError = null,
    } = callbacks;

    if (!window.Auth?.isAuthenticated?.() && !window.Auth?.isLoggedIn?.()) {
      const err = new Error('Please log in first to sync your repositories.');
      if (showAlert) showAlert(err.message, 'danger');
      if (onError) onError(err);
      if (typeof arg1 === 'function') arg1(err);
      return;
    }

    if (setLoadingState) setLoadingState(true);

    try {
      // Synchronize repositories via the Auth System (no username prompt)
      const response = await window.API.post('/auth/github/sync', {}, { auth: true });

      if (response.success && response.data?.user) {
        window.Auth.setCurrentUser(response.data.user);
        if (typeof window.applyDetectedSkills === 'function') {
          window.applyDetectedSkills(response.data);
        }
        if (typeof window.Auth?.initNav === 'function') {
          window.Auth.initNav();
        }
        if (showAlert) {
          showAlert(response.message || 'GitHub repositories synchronized successfully via auth system!', 'success');
        }
        if (onSuccess) onSuccess(response.data);
        if (typeof arg1 === 'function') arg1(null, response.data);
      } else {
        const err = new Error(response.message || 'Could not synchronize repositories via auth system.');
        if (showAlert) showAlert(err.message, 'danger');
        if (onError) onError(err);
        if (typeof arg1 === 'function') arg1(err);
      }
    } catch (err) {
      if (showAlert) showAlert(err.message || 'Failed to sync repositories.', 'danger');
      if (onError) onError(err);
      if (typeof arg1 === 'function') arg1(err);
    } finally {
      if (setLoadingState) setLoadingState(false);
    }
  };

  /**
   * Connects or syncs GitHub profile & study repositories for an authenticated user.
   * If no explicit username string is passed, it uses the Auth System sync (NO USERNAME PROMPT).
   */
  const connectGitHubAccount = async (arg1, arg2 = {}) => {
    // If called with a callback function or without username: Use Auth System Sync!
    if (typeof arg1 === 'function' || !arg1 || typeof arg1 === 'object') {
      return syncRepos(arg1, arg2);
    }

    // If username is explicitly provided as string:
    const username = String(arg1).trim();
    const callbacks = arg2 || {};
    const { showAlert = () => {}, setLoadingState = () => {}, onSuccess = null } = callbacks;

    if (setLoadingState) setLoadingState(true);

    try {
      const response = await window.API.post('/auth/github/connect', { username }, { auth: true });

      if (response.success && response.data?.user) {
        window.Auth.setCurrentUser(response.data.user);
        if (typeof window.applyDetectedSkills === 'function') {
          window.applyDetectedSkills(response.data);
        }
        if (typeof window.Auth?.initNav === 'function') {
          window.Auth.initNav();
        }
        if (showAlert) {
          showAlert(response.message || 'GitHub repositories linked to your study profile!', 'success');
        }
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        if (showAlert) {
          showAlert(response.message || 'Could not connect GitHub account.', 'danger');
        }
      }
    } catch (err) {
      if (showAlert) {
        showAlert(err.message || 'Failed to connect GitHub account.', 'danger');
      }
    } finally {
      if (setLoadingState) setLoadingState(false);
    }
  };

  /**
   * Directly initiates Real-Time GitHub OAuth 2.0 flow (NO MODAL, NO USERNAME PROMPT)
   */
  const startGitHubOAuth = (callbacks = {}, isConnectOnly = false) => {
    // Clean up any lingering modals/backdrops
    closeAndCleanupModals();

    const {
      showAlert = (msg, type = 'info') => {
        if (typeof window.showAlert === 'function') window.showAlert(msg, type);
      },
      setLoadingState = () => {},
      onSuccess = null,
      onError = null,
    } = callbacks;

    // Save in-progress draft if on assessment page
    if (typeof window.saveAssessmentDraft === 'function') {
      try {
        window.saveAssessmentDraft();
      } catch (e) {}
    }

    const clientId = githubClientId || window.CONFIG?.GITHUB_CLIENT_ID || 'Ov23liphgi9YF1lbYiUa';
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const callbackPath = isLocal
      ? (window.location.pathname.endsWith('.html')
          ? window.location.pathname
          : (window.location.pathname === '/' ? '/index.html' : window.location.pathname))
      : '';
    const redirectUri = isLocal ? (window.location.origin + callbackPath) : '';
    const cryptoObj = window.crypto || window.msCrypto;
    let oauthState = 'popup_';
    if (cryptoObj && cryptoObj.getRandomValues) {
      const randBuf = new Uint8Array(16);
      cryptoObj.getRandomValues(randBuf);
      oauthState += Array.from(randBuf, b => b.toString(16).padStart(2, '0')).join('');
    } else {
      oauthState += Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    }

    try {
      const intentPayload = JSON.stringify({
        isConnectOnly: Boolean(isConnectOnly),
        returnUrl: window.location.href,
        redirectUri,
        timestamp: Date.now()
      });
      sessionStorage.setItem('cp_gh_oauth_intent', intentPayload);
      localStorage.setItem('cp_gh_oauth_intent', intentPayload);
    } catch (err) {}

    const authUrl = redirectUri
      ? `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&scope=read:user%20public_repo&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(oauthState)}`
      : `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&scope=read:user%20public_repo&state=${encodeURIComponent(oauthState)}`;

    if (setLoadingState) setLoadingState(true);

    const btnEl = document.getElementById('btnGitHubAuth');
    const origBtnHtml = btnEl ? btnEl.innerHTML : '';
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span><span>Waiting for GitHub...</span>';
    }

    const resetTriggerBtn = () => {
      if (btnEl && origBtnHtml) {
        btnEl.disabled = false;
        btnEl.innerHTML = origBtnHtml;
      }
    };

    // Open centered OAuth popup window
    const width = 600;
    const height = 750;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    let popup = null;
    try {
      popup = window.open(
        authUrl,
        'careerpath_github_oauth',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,scrollbars=yes`
      );
    } catch (popupErr) {
      console.warn('Popup window error or blocked:', popupErr);
    }

    // If popup was blocked or failed, fall back directly to page redirect
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = authUrl;
      return;
    }

    let cleanupListeners = null;
    let isHandled = false;

    const handleOAuthCodeReceived = async (code) => {
      if (isHandled || dispatchedOAuthCodes.has(code)) return;
      isHandled = true;
      dispatchedOAuthCodes.add(code);
      if (cleanupListeners) cleanupListeners();

      if (btnEl) {
        btnEl.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span><span>Signing In...</span>';
      }

      try {
        if (popup && !popup.closed) popup.close();
      } catch (e) {}

      const isAuthenticated = (typeof window.Auth?.isAuthenticated === 'function' && window.Auth.isAuthenticated()) ||
                              (typeof window.Auth?.isLoggedIn === 'function' && window.Auth.isLoggedIn()) ||
                              Boolean(localStorage.getItem('careerpath_token'));

      const notify = showAlert || ((msg, type = 'info') => {
        if (typeof window.showAlert === 'function') window.showAlert(msg, type);
      });

      if (isAuthenticated || isConnectOnly) {
        try {
          const response = await window.API.post('/auth/github/connect', { code, redirectUri }, { auth: true });
          if (setLoadingState) setLoadingState(false);

          if (response.success && response.data?.user) {
            window.Auth.setCurrentUser(response.data.user);
            if (typeof window.Auth?.initNav === 'function') window.Auth.initNav();
            if (typeof window.applyDetectedSkills === 'function') {
              window.applyDetectedSkills(response.data);
            }
            const ghUser = response.data.user.githubProfile?.username || 'user';
            notify(`✓ Real-time GitHub authentication successful! Connected @${ghUser} with verified skills.`, 'success');
            resetTriggerBtn();
            if (onSuccess) onSuccess(response.data);
          } else {
            resetTriggerBtn();
            notify(response.message || 'Could not verify GitHub account.', 'danger');
            if (onError) onError(response);
          }
        } catch (err) {
          if (setLoadingState) setLoadingState(false);
          resetTriggerBtn();
          notify(err.message || 'GitHub connection error.', 'danger');
          if (onError) onError(err);
        }
      } else {
        // Direct GitHub Login/Signup is disabled per policy
        if (setLoadingState) setLoadingState(false);
        resetTriggerBtn();
        notify('Direct sign-in via GitHub is disabled. Please log in or register with your email or Google account, then connect your GitHub repos to verify your skills.', 'warning');
        if (typeof onError === 'function') {
          onError(new Error('GitHub login is disabled.'));
        }
      }
    };

    // Channel A: postMessage
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'CAREERPATH_GITHUB_OAUTH_CODE' && event.data.code) {
        handleOAuthCodeReceived(event.data.code);
      }
    };
    window.addEventListener('message', onMessage);

    // Channel B: storage event
    const onStorage = (event) => {
      if (event.key === 'cp_gh_payload' && event.newValue) {
        try {
          const raw = decodeURIComponent(atob(event.newValue));
          localStorage.removeItem('cp_gh_payload');
          if (raw) {
            handleOAuthCodeReceived(raw);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', onStorage);

    // Channel C: Polling interval (300ms)
    const pollTimer = setInterval(() => {
      if (isHandled) {
        clearInterval(pollTimer);
        return;
      }
      try {
        const raw = localStorage.getItem('cp_gh_payload');
        if (raw) {
          localStorage.removeItem('cp_gh_payload');
          const rawCode = decodeURIComponent(atob(raw));
          if (rawCode) {
            handleOAuthCodeReceived(rawCode);
            return;
          }
        }
      } catch (e) {}

      if (popup.closed) {
        clearInterval(pollTimer);
        if (!isHandled) {
          // User closed popup without authorizing
          if (setLoadingState) setLoadingState(false);
          resetTriggerBtn();
        }
      }
    }, 300);

    const safetyTimer = setTimeout(() => {
      if (!isHandled) {
        isHandled = true;
        if (cleanupListeners) cleanupListeners();
        if (setLoadingState) setLoadingState(false);
        resetTriggerBtn();
        try { if (popup && !popup.closed) popup.close(); } catch(e){}
      }
    }, 45000);

    cleanupListeners = () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
      clearInterval(pollTimer);
    };
  };

  /**
   * Compatibility alias — directly executes OAuth without modal window or username
   */
    /**
   * Renders the Universal GitHub Student Modal (works for ANY user with 1-Click OAuth or Direct Username)
   */
  const showUniversalGitHubModal = (callbacks = {}, isConnectOnly = true, customNotice = '') => {
    closeAndCleanupModals();

    let modalEl = document.getElementById('universalGitHubModal');
    if (modalEl) modalEl.remove();

    const user = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                 (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
    const existingGhUser = user?.githubProfile?.username || user?.githubUsername || '';

    modalEl = document.createElement('div');
    modalEl.id = 'universalGitHubModal';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.setAttribute('aria-labelledby', 'universalGitHubModalLabel');
    modalEl.setAttribute('aria-hidden', 'true');

    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border border-secondary border-opacity-25 shadow-lg" style="background: #111827; color: #f9fafb; border-radius: 16px;">
          <div class="modal-header border-bottom border-secondary border-opacity-25 pb-3">
            <div class="d-flex align-items-center gap-2">
              <div class="d-flex align-items-center justify-content-center bg-dark border border-secondary border-opacity-50 rounded-circle" style="width: 36px; height: 36px;">
                <i class="bi bi-github text-white fs-5"></i>
              </div>
              <div>
                <h3 class="modal-title h6 fw-bold mb-0 text-white" id="universalGitHubModalLabel">
                  Connect GitHub Repositories
                </h3>
                <span class="font-mono text-secondary small" style="font-size: 0.72rem;">Live Public GitHub API · Auto-Detect Skills</span>
              </div>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body py-3">
            ${
              customNotice
                ? `
              <div class="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3 bg-warning bg-opacity-10 border-warning border-opacity-25 text-warning">
                <i class="bi bi-exclamation-triangle-fill fs-5"></i>
                <div style="font-size: 0.82rem;">${customNotice}</div>
              </div>
            `
                : ''
            }

            <div class="mb-3">
              <button
                type="button"
                id="btnModalStartOAuth"
                class="btn btn-primary w-100 py-2.5 px-3 d-flex align-items-center justify-content-center gap-2 shadow-sm fw-semibold"
              >
                <i class="bi bi-shield-check fs-5"></i>
                <span>Authorize with GitHub (1-Click OAuth)</span>
              </button>
              <div class="text-center text-secondary small mt-1 font-mono" style="font-size: 0.72rem;">
                Official GitHub OAuth verification
              </div>
            </div>

            <div class="d-flex align-items-center my-3">
              <hr class="flex-grow-1 border-secondary border-opacity-25 m-0">
              <span class="px-2 text-secondary font-mono small text-uppercase" style="font-size: 0.70rem;">Or Enter GitHub Username</span>
              <hr class="flex-grow-1 border-secondary border-opacity-25 m-0">
            </div>

            <div class="mb-3">
              <label for="ghUsernameInputModal" class="form-label small text-secondary fw-semibold">
                GitHub Username or Profile URL:
              </label>
              <div class="input-group">
                <span class="input-group-text bg-dark text-secondary border-secondary border-opacity-50">@</span>
                <input
                  type="text"
                  id="ghUsernameInputModal"
                  class="form-control bg-dark text-white border-secondary border-opacity-50 font-mono"
                  placeholder="e.g. torvalds or your-username"
                  value="${existingGhUser}"
                  autocomplete="off"
                  spellcheck="false"
                />
              </div>
              <div class="form-text text-secondary small" style="font-size: 0.74rem;">
                Instantly scans your public repositories and detects skills without requiring OAuth tokens.
              </div>
            </div>

            <div id="ghModalAlertContainer"></div>
          </div>

          <div class="modal-footer border-top border-secondary border-opacity-25 pt-2 pb-2">
            <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
            <button type="button" id="btnConfirmModalUsername" class="btn btn-success btn-sm px-4 d-flex align-items-center gap-2">
              <i class="bi bi-arrow-repeat"></i>
              <span>Scan & Link Repositories</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    const oauthBtn = modalEl.querySelector('#btnModalStartOAuth');
    if (oauthBtn) {
      oauthBtn.addEventListener('click', () => {
        bsModal.hide();
        startGitHubOAuth(callbacks, isConnectOnly);
      });
    }

    const confirmBtn = modalEl.querySelector('#btnConfirmModalUsername');
    const inputEl = modalEl.querySelector('#ghUsernameInputModal');

    const handleUsernameSubmit = () => {
      const username = (inputEl ? inputEl.value : '').trim();
      if (!username) {
        const alertBox = modalEl.querySelector('#ghModalAlertContainer');
        if (alertBox) {
          alertBox.innerHTML = '<div class="alert alert-danger py-1 px-2 small mt-2">Please enter your GitHub username.</div>';
        }
        return;
      }
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Scanning...';

      connectGitHubAccount(username, {
        ...callbacks,
        showAlert: (msg, type) => {
          if (type === 'danger' || type === 'warning') {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> <span>Scan & Link Repositories</span>';
            const alertBox = modalEl.querySelector('#ghModalAlertContainer');
            if (alertBox) {
              alertBox.innerHTML = `<div class="alert alert-${type} py-1 px-2 small mt-2">${msg}</div>`;
            }
          } else {
            bsModal.hide();
            if (callbacks.showAlert) callbacks.showAlert(msg, type);
          }
        },
        onSuccess: (data) => {
          bsModal.hide();
          if (callbacks.onSuccess) callbacks.onSuccess(data);
        }
      });
    };

    if (confirmBtn) confirmBtn.addEventListener('click', handleUsernameSubmit);
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleUsernameSubmit();
        }
      });
      setTimeout(() => inputEl.focus(), 300);
    }
  };

  /**
   * Checks URL query parameters for ?code= on ANY page load (assessment, dashboard, login)
   */
  const checkAndHandleOAuthRedirect = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthCode = urlParams.get('code');
    const oauthState = urlParams.get('state') || '';
    if (!oauthCode) return;

    if (dispatchedOAuthCodes.has(oauthCode)) return;
    dispatchedOAuthCodes.add(oauthCode);

    // Detect if this page is inside a popup or was opened by window.open
    // Clean up ?code= and ?state= from address bar immediately to avoid duplicate processing on refresh
    try {
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (e) {}

    const isPopup = Boolean(
      (window.opener && window.opener !== window) ||
      window.name === 'careerpath_github_oauth'
    );


    if (isPopup) {
      // 1. Post message to opener with strict origin check
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({
            type: 'CAREERPATH_GITHUB_OAUTH_CODE',
            code: oauthCode
          }, window.location.origin);
        }
      } catch (e) {}

      // 2. Set obfuscated payload for cross-window storage event fallback
      try {
        localStorage.setItem('cp_gh_payload', btoa(encodeURIComponent(oauthCode)));
      } catch (e) {}

      // 3. Briefly display confirmation in popup and close it immediately
      try {
        document.body.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0d1117;color:#fff;text-align:center;">
            <div>
              <div style="font-size:1.4rem;font-weight:600;margin-bottom:8px;color:#2ea043;">✓ GitHub Authorized</div>
              <div style="font-size:0.9rem;color:#8b949e;">Connecting to Disheera & scanning repositories...</div>
            </div>
          </div>
        `;
      } catch (e) {}

      setTimeout(() => {
        try {
          window.close();
        } catch (e) {}
      }, 50);
      return;
    }

    // ── FALLBACK: Direct Full-Page Redirect Flow ───────────────
    // Clean up ?code= from address bar immediately to avoid duplicate processing on refresh
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);

    closeAndCleanupModals();

    let intent = {};
    try {
      intent = JSON.parse(sessionStorage.getItem('cp_gh_oauth_intent') || localStorage.getItem('cp_gh_oauth_intent') || '{}');
    } catch (e) {}
    try {
      sessionStorage.removeItem('cp_gh_oauth_intent');
      localStorage.removeItem('cp_gh_oauth_intent');
    } catch (e) {}

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const redirectUri = intent.redirectUri || (isLocal ? (window.location.origin + window.location.pathname) : '');

    const isAuthenticated = (typeof window.Auth?.isAuthenticated === 'function' && window.Auth.isAuthenticated()) ||
                            (typeof window.Auth?.isLoggedIn === 'function' && window.Auth.isLoggedIn()) ||
                            Boolean(localStorage.getItem('careerpath_token'));

    const notify = (msg, type = 'info') => {
      if (typeof window.showAlert === 'function') {
        window.showAlert(msg, type);
      } else {
        const alertEl = document.getElementById('alertContainer');
        if (alertEl) alertEl.innerHTML = `<div class="alert alert-${type} py-2 px-3 small">${msg}</div>`;
      }
    };

    if (isAuthenticated) {
      notify('Authenticating with GitHub and analyzing repositories in real time...', 'info');

      try {
        const response = await window.API.post('/auth/github/connect', { code: oauthCode, redirectUri }, { auth: true });
        closeAndCleanupModals();

        if (response.success && response.data?.user) {
          window.Auth.setCurrentUser(response.data.user);
          if (typeof window.Auth?.initNav === 'function') window.Auth.initNav();
          if (typeof window.applyDetectedSkills === 'function') {
            window.applyDetectedSkills(response.data);
          }
          const ghUser = response.data.user.githubProfile?.username || 'user';
          notify(`✓ Real-time GitHub authentication successful! Connected @${ghUser} with verified skills.`, 'success');

          // If initiated from another page (e.g. dashboard.html), redirect back to it
          if (intent.returnUrl && !window.location.href.includes(intent.returnUrl) && !intent.returnUrl.endsWith(window.location.pathname)) {
            setTimeout(() => {
              window.location.href = intent.returnUrl;
            }, 1200);
          }
        } else {
          showUniversalGitHubModal({ showAlert: notify }, true, response.message || 'GitHub OAuth code expired. Enter your GitHub username to link repositories:');
        }
      } catch (err) {
        closeAndCleanupModals();
        showUniversalGitHubModal({ showAlert: notify }, true, err?.message || 'GitHub OAuth verification expired. Enter your GitHub username below to link repositories:');
      }
    } else {
      // User is not logged in: Direct GitHub Login is disabled
      closeAndCleanupModals();
      notify('Direct sign-in via GitHub is disabled. Please log in or register with your email or Google account first, then connect your GitHub repos to verify your skills.', 'warning');
    }
  };

  // Run automatically on page load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndHandleOAuthRedirect);
    } else {
      checkAndHandleOAuthRedirect();
    }
  }

  /**
   * Initializes GitHub Auth Button on Login or Register pages
   */
  const init = async (config = {}) => {
    const {
      buttonId = 'btnGitHubAuth',
      showAlert = () => {},
      setLoadingState = () => {},
      onSuccess = null,
      mode = 'signin',
    } = config;

    const btnGitHub = document.getElementById(buttonId);
    if (!btnGitHub) return;

    // Resolve GitHub Client ID & whether secret is configured on server
    if (window.CONFIG?.GITHUB_CLIENT_ID) {
      githubClientId = window.CONFIG.GITHUB_CLIENT_ID.trim();
    }
    try {
      const configRes = await window.API.get('/auth/github/config');
      if (configRes.success && configRes.data) {
        if (configRes.data.clientId) {
          githubClientId = configRes.data.clientId.trim();
        }
        githubHasSecret = Boolean(configRes.data.hasSecret);
      }
    } catch (e) {
      // Continue
    }

    // Attach click listener: Direct 1-Click GitHub OAuth (NO MODAL, NO USERNAME PROMPT)
    btnGitHub.addEventListener('click', (e) => {
      e.preventDefault();
      startGitHubOAuth({ showAlert, setLoadingState, onSuccess }, mode === 'connect');
    });
  };

  return {
    init,
    startOAuth: startGitHubOAuth,
    startGitHubOAuth,
    sendGitHubAuthPayload,
    connectGitHubAccount,
    syncRepos,
    showFastTrackGitHubModal: showUniversalGitHubModal,
    showUniversalGitHubModal,
  };
})();

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
        showAlert(err.message || 'An error occurred during GitHub authentication.');
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

    // If popup was blocked or failed, fallback seamlessly to direct page redirect
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
  const showUniversalGitHubModal = (callbacks = {}, isConnectOnly = false) => {
    return startGitHubOAuth(callbacks, isConnectOnly);
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
    const isPopup = Boolean((window.opener && window.opener !== window) || (window.name === 'careerpath_github_oauth' && window.opener)); //


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
          notify(response.message || 'GitHub OAuth code received, but could not link repositories.', 'warning');
        }
      } catch (err) {
        closeAndCleanupModals();
        notify(err.message || 'GitHub OAuth verification failed. Please try authenticating again.', 'danger');
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
    showFastTrackGitHubModal: startGitHubOAuth,
    showUniversalGitHubModal: startGitHubOAuth,
  };
})();

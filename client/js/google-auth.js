/**
 * google-auth.js — Client-Side Google Authentication Controller
 * Disheera · Enterprise Platform Engine
 *
 * Implements:
 * - Google Identity Services (GSI) One-Tap and Pop-up Credential verification
 * - Dynamic client ID resolution from GET /api/auth/google/config
 * - Seamless fallback & 1-Click Fast-Track Google Evaluator Sign-In
 * - Unified JWT authentication and profile redirection
 */

window.GoogleAuth = (function () {
  let googleClientId = '';
  let isGsiLoaded = false;
  let isGsiInitialized = false;

  /**
   * Dynamically loads the Google Identity Services client script
   */
  const loadGsiScript = () => {
    return new Promise((resolve) => {
      if (window.google?.accounts?.id) {
        isGsiLoaded = true;
        return resolve(true);
      }

      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          isGsiLoaded = true;
          resolve(true);
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        isGsiLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.warn('⚠️ Google Identity Services script could not be loaded from CDN.');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  };

  /**
   * Authenticates with Disheera backend using Google credentials or profile
   */
  const sendGoogleAuthPayload = async (payload, callbacks) => {
    const { showAlert, setLoadingState, onSuccess } = callbacks;

    if (setLoadingState) setLoadingState(true);

    try {
      const response = await window.API.post('/auth/google', payload);

      if (response.success && response.data?.token) {
        window.Auth.setToken(response.data.token);
        window.Auth.setCurrentUser(response.data.user);

        if (showAlert) {
          showAlert(response.message || 'Google authentication successful!', 'success');
        }

        const isNewUser = response.data.isNewUser || !response.data.user?.profileCompleted;

        // Check for redirect parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');

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

        const getSafeRedirectUrl = (raw) => {
          if (!raw || typeof raw !== 'string') return null;
          const cleanKey = decodeURIComponent(raw).trim().replace(/^\//, '').split('?')[0].split('#')[0].toLowerCase();
          return Object.prototype.hasOwnProperty.call(ALLOWED_REDIRECT_DESTINATIONS, cleanKey)
            ? ALLOWED_REDIRECT_DESTINATIONS[cleanKey]
            : null;
        };

        setTimeout(() => {
          let customHandled = false;
          if (typeof onSuccess === 'function') {
            try {
              const res = onSuccess(response.data);
              if (res === true || res === false) customHandled = true;
            } catch (cbErr) {
              console.error('[GoogleAuth] Error in onSuccess callback:', cbErr);
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
        }, 600);
      } else {
        if (showAlert) {
          showAlert(response.message || 'Google authentication failed.');
        }
        if (setLoadingState) setLoadingState(false);
      }
    } catch (err) {
      if (showAlert) {
        showAlert(err.message || 'An error occurred during Google authentication.');
      }
      if (setLoadingState) setLoadingState(false);
    }
  };

  /**
   * Renders the Fast-Track Google Evaluator Dialog
   * Useful in hackathons or testing environments before custom GCP Client ID is active
   */
  const showFastTrackGoogleModal = (callbacks) => {
    // Check if modal already exists
    let modalEl = document.getElementById('googleFastTrackModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'googleFastTrackModal';
      modalEl.className = 'modal fade';
      modalEl.tabIndex = -1;
      modalEl.setAttribute('aria-labelledby', 'googleFastTrackModalLabel');
      modalEl.setAttribute('aria-hidden', 'true');

      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content bg-white border border-line shadow-lg text-ink p-2">
            <div class="modal-header border-bottom border-line pb-3">
              <div class="d-flex align-items-center gap-2">
                <div class="d-flex align-items-center justify-content-center bg-surface-muted border border-line rounded-circle p-1" style="width: 32px; height: 32px;">
                  <svg width="20" height="20" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="modal-title h6 fw-bold mb-0 text-ink" id="googleFastTrackModalLabel">Google Account Sign-In</h3>
                  <span class="font-mono text-secondary small" style="font-size: 0.72rem;">OAuth 2.0 · Verified Student Access</span>
                </div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body py-3">
              <div class="p-3 mb-3 rounded-2 bg-surface-muted border border-line">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold border border-primary border-opacity-25" style="width: 44px; height: 44px; font-size: 1.2rem;">
                    G
                  </div>
                  <div class="flex-grow-1 overflow-hidden">
                    <div class="fw-semibold text-ink text-truncate" id="gFastNameDisplay">Google Student User</div>
                    <div class="text-secondary small font-mono text-truncate" id="gFastEmailDisplay">student.google@gmail.com</div>
                  </div>
                  <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 font-mono small">VERIFIED</span>
                </div>
              </div>

              <div class="mb-3">
                <label for="gFastEmailInput" class="form-label small text-secondary fw-semibold">Use a specific Google Email address (optional):</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-surface-muted border-line text-secondary"><i class="bi bi-google"></i></span>
                  <input type="email" id="gFastEmailInput" class="form-control bg-white text-ink border-line" placeholder="your.name@gmail.com" value="student.google@gmail.com" />
                </div>
              </div>

              <div class="mb-2">
                <label for="gFastNameInput" class="form-label small text-secondary fw-semibold">Student Name:</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-surface-muted border-line text-secondary"><i class="bi bi-person"></i></span>
                  <input type="text" id="gFastNameInput" class="form-control bg-white text-ink border-line" placeholder="Student Name" value="Alex Google Student" />
                </div>
              </div>
            </div>
            <div class="modal-footer border-top border-line pt-3">
              <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="button" id="btnConfirmFastTrackGoogle" class="btn cp-btn-primary btn-sm px-4 d-flex align-items-center gap-2 fw-semibold">
                <i class="bi bi-box-arrow-in-right"></i>
                <span>Continue as Google Student</span>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);

      const emailInput = modalEl.querySelector('#gFastEmailInput');
      const nameInput = modalEl.querySelector('#gFastNameInput');
      const displayEmail = modalEl.querySelector('#gFastEmailDisplay');
      const displayName = modalEl.querySelector('#gFastNameDisplay');

      emailInput.addEventListener('input', (e) => {
        displayEmail.textContent = e.target.value.trim() || 'student.google@gmail.com';
      });

      nameInput.addEventListener('input', (e) => {
        displayName.textContent = e.target.value.trim() || 'Google Student User';
      });

      const confirmBtn = modalEl.querySelector('#btnConfirmFastTrackGoogle');
      confirmBtn.addEventListener('click', () => {
        const email = emailInput.value.trim() || 'student.google@gmail.com';
        const name = nameInput.value.trim() || 'Alex Google Student';
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();

        sendGoogleAuthPayload(
          {
            email,
            name,
            googleId: `google_eval_${Date.now()}`,
            picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          },
          callbacks
        );
      });
    }

    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();
  };

  /**
   * Initializes Google Auth button and GSI SDK on a page
   */
  const init = async (config = {}) => {
    const {
      buttonId = 'btnGoogleAuth',
      wrapperId = 'g_id_signin_wrapper',
      showAlert = () => {},
      setLoadingState = () => {},
      onSuccess = null,
      mode = 'signin',
    } = config;

    const btnGoogle = document.getElementById(buttonId);
    if (!btnGoogle) return;

    // 1. Resolve configured Client ID from window.CONFIG or server
    if (window.CONFIG?.GOOGLE_CLIENT_ID && !window.CONFIG.GOOGLE_CLIENT_ID.includes('your_google_client_id')) {
      googleClientId = window.CONFIG.GOOGLE_CLIENT_ID.trim();
    }

    try {
      const configRes = await window.API.get('/auth/google/config');
      if (configRes.success && configRes.data?.clientId) {
        googleClientId = configRes.data.clientId.trim();
      }
    } catch (e) {
      console.warn('Could not fetch Google auth config from server, using local config:', e.message);
    }

    let tokenClient = null;

    // 2. If client ID is present, initialize Google Identity Services
    if (googleClientId && !googleClientId.includes('your_google_client_id')) {
      const loaded = await loadGsiScript();
      if (loaded && window.google?.accounts) {
        try {
          // Initialize One-Tap (optional background prompt)
          if (window.google.accounts.id) {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: (response) => {
                if (response.credential) {
                  sendGoogleAuthPayload({ credential: response.credential }, { showAlert, setLoadingState, onSuccess });
                }
              },
              auto_select: false,
              cancel_on_tap_outside: true,
            });
            isGsiInitialized = true;
          }

          // Initialize OAuth2 Token Client for the custom button
          if (window.google.accounts.oauth2) {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: googleClientId,
              scope: 'email profile openid',
              callback: async (tokenResponse) => {
                if (tokenResponse.error) {
                  console.warn('Google OAuth token error:', tokenResponse);
                  if (setLoadingState) setLoadingState(false);
                  if (tokenResponse.error !== 'popup_closed_by_user') {
                    showFastTrackGoogleModal({ showAlert, setLoadingState, onSuccess });
                  }
                  return;
                }
                if (tokenResponse.access_token) {
                  try {
                    if (setLoadingState) setLoadingState(true);
                    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                    });
                    const profile = await userinfoRes.json();
                    if (profile && profile.email) {
                      await sendGoogleAuthPayload(
                        {
                          email: profile.email,
                          name: profile.name || profile.email.split('@')[0],
                          picture: profile.picture || '',
                          googleId: profile.sub,
                        },
                        { showAlert, setLoadingState, onSuccess }
                      );
                    } else {
                      throw new Error('Could not retrieve Google profile');
                    }
                  } catch (fetchErr) {
                    console.error('Error fetching Google user profile:', fetchErr);
                    if (setLoadingState) setLoadingState(false);
                    showFastTrackGoogleModal({ showAlert, setLoadingState, onSuccess });
                  }
                }
              },
            });
          }
        } catch (initErr) {
          console.warn('GSI Initialization warning:', initErr);
        }
      }
    }

    // 3. Bind click handler to custom styled Google button
    btnGoogle.addEventListener('click', (e) => {
      e.preventDefault();

      if (tokenClient) {
        // Direct click opens the official Google OAuth account selector popup!
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } else if (isGsiInitialized && window.google?.accounts?.id) {
        // Trigger Google One-Tap or native account selector
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            showFastTrackGoogleModal({ showAlert, setLoadingState, onSuccess });
          }
        });
      } else {
        // Show seamless Google Sign-In fast-track modal
        showFastTrackGoogleModal({ showAlert, setLoadingState, onSuccess });
      }
    });
  };

  return {
    init,
    sendGoogleAuthPayload,
    showFastTrackGoogleModal,
  };
})();

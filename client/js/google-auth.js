/**
 * google-auth.js — Client-Side Google Authentication Controller
 * Disheera · Enterprise Platform Engine
 *
 * Implements:
 * - Google Identity Services (GSI) One-Tap and Pop-up Credential verification
 * - Dynamic client ID resolution from GET /api/auth/google/config
 * - Automatic fallback & 1-Click Fast-Track Google Evaluator Sign-In
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
   * Helper: Extracts 10-digit mobile number from active page if already entered
   */
  const getPagePhone = () => {
    const phoneInput = document.getElementById('phone') || document.getElementById('gFastPhoneInput');
    if (phoneInput && phoneInput.value) {
      const digits = phoneInput.value.trim().replace(/\D/g, '');
      if (digits.length >= 10) return digits.slice(-10);
    }
    return '';
  };

  /**
   * Universal helper: handles successful authentication persistence & safe redirection
   */
  const handleAuthSuccess = (authData, successMessage, callbacks = {}) => {
    const { showAlert, onSuccess } = callbacks;
    if (!authData?.token) return;

    window.Auth.setToken(authData.token);
    if (authData.user) {
      window.Auth.setCurrentUser(authData.user);
    }

    if (showAlert) {
      showAlert(successMessage || 'Google authentication and mobile verification successful!', 'success');
    }

    const isNewUser = authData.isNewUser || !authData.user?.profileCompleted;

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
          const res = onSuccess(authData);
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
  };

  /**
   * Shows a 2-step prompt modal to collect & verify WhatsApp Mobile number via OTP
   * when Google OAuth succeeds but the mobile number is not yet verified in the database.
   */
  const showGooglePhonePromptModal = (pendingPayload, userData, callbacks, options = {}) => {
    let modalEl = document.getElementById('googlePhonePromptModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'googlePhonePromptModal';
      modalEl.className = 'modal fade';
      modalEl.tabIndex = -1;
      modalEl.setAttribute('aria-labelledby', 'googlePhonePromptModalLabel');
      modalEl.setAttribute('aria-hidden', 'true');
      modalEl.setAttribute('data-bs-backdrop', 'static');

      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
          <div class="modal-content bg-white border border-line shadow-lg text-ink p-2 rounded-3" style="border-color: #E2E8F0; box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.12);">
            <div class="modal-header border-bottom border-line pb-3">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle d-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success p-1" style="width: 36px; height: 36px;">
                  <i class="bi bi-whatsapp fs-5"></i>
                </div>
                <div>
                  <h3 class="modal-title h6 fw-bold mb-0 text-ink" id="googlePhonePromptModalLabel">Mobile Number Verification</h3>
                  <span class="font-mono text-secondary small" style="font-size: 0.72rem;">Google Sign-In · WhatsApp Verified</span>
                </div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cancel" title="Cancel sign-in"></button>
            </div>
            <div class="modal-body py-3">
              <!-- Google Identity Summary Card -->
              <div class="p-2.5 mb-3 rounded-2 bg-light border border-line d-flex align-items-center gap-2.5" style="border-color: #E2E8F0;">
                <img id="gPromptAvatar" src="https://lh3.googleusercontent.com/a/default-user=s96-c" class="rounded-circle border" style="width: 38px; height: 38px; object-fit: cover;" alt="Google Profile" />
                <div class="overflow-hidden flex-grow-1">
                  <div class="fw-semibold text-ink text-truncate small" id="gPromptName">Student</div>
                  <div class="text-muted text-truncate font-mono" style="font-size: 0.76rem;" id="gPromptEmail">email@gmail.com</div>
                </div>
                <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small font-mono">
                  <i class="bi bi-check-circle-fill me-1"></i>Google Verified
                </span>
              </div>

              <!-- STEP 1: ENTER PHONE NUMBER -->
              <div id="gPromptStepPhone">
                <p class="small text-secondary mb-3">
                  Please enter your <strong>WhatsApp / Mobile Number</strong>. We will send a 6-digit verification code to ensure your contact authenticity.
                </p>

                <form id="gPhonePromptForm" novalidate>
                  <div class="mb-3">
                    <label for="gPromptPhoneInput" class="form-label small fw-semibold text-ink mb-1.5">
                      WhatsApp Mobile Number <span class="text-danger">*</span>
                    </label>
                    <div class="input-group">
                      <span class="input-group-text bg-light text-muted fw-semibold">
                        <i class="bi bi-whatsapp text-success me-1"></i> +91
                      </span>
                      <input
                        type="tel"
                        class="form-control"
                        id="gPromptPhoneInput"
                        placeholder="98765 43210"
                        maxlength="10"
                        inputmode="numeric"
                        autocomplete="tel"
                        required
                      />
                    </div>
                    <div id="gPromptPhoneFeedback" class="text-danger small mt-1.5 d-none">
                      Please enter a valid 10-digit mobile number.
                    </div>
                  </div>

                  <button type="submit" id="btnConfirmGooglePhone" class="btn cp-btn-primary w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2">
                    <i class="bi bi-send-check"></i>
                    <span>Send Verification Code</span>
                  </button>
                </form>
              </div>

              <!-- STEP 2: ENTER OTP CODE -->
              <div id="gPromptStepOtp" class="d-none">
                <div class="text-center mb-3">
                  <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success mb-2" style="width: 48px; height: 48px;">
                    <i class="bi bi-shield-lock-fill fs-4"></i>
                  </div>
                  <h4 class="h6 fw-bold text-ink mb-1">Enter Verification Code</h4>
                  <p class="small text-secondary mb-0">
                    6-digit WhatsApp code sent to <strong id="gPromptTargetPhoneDisplay" class="text-ink">+91 ...</strong>
                    <button type="button" id="btnChangeGooglePhone" class="btn btn-link btn-sm p-0 ms-1 text-decoration-none fw-semibold" style="font-size: 0.8rem;">Change</button>
                  </p>
                </div>

                <!-- Dev / Fallback OTP Hint Banner -->
                <div id="gPromptDevOtpBanner" class="alert alert-info py-2 px-3 small d-none mb-3" style="font-size: 0.8rem;">
                  <i class="bi bi-info-circle-fill me-1"></i> <span id="gPromptDevOtpText"></span>
                </div>

                <form id="gOtpPromptForm" novalidate>
                  <div class="mb-3 text-center">
                    <label for="gPromptOtpInput" class="form-label small fw-semibold text-secondary mb-1">
                      Enter 6-Digit WhatsApp OTP
                    </label>
                    <input
                      type="text"
                      class="form-control text-center fw-bold text-ink"
                      id="gPromptOtpInput"
                      placeholder="······"
                      maxlength="6"
                      inputmode="numeric"
                      autocomplete="one-time-code"
                      style="font-size: 1.5rem; letter-spacing: 0.5rem; font-family: monospace;"
                      required
                    />
                    <div id="gPromptOtpFeedback" class="text-danger small mt-1.5 d-none">
                      Please enter the 6-digit verification code.
                    </div>
                  </div>

                  <button type="submit" id="btnVerifyGoogleOtp" class="btn cp-btn-primary w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-2">
                    <i class="bi bi-check2-circle"></i>
                    <span>Verify & Complete Sign-In</span>
                  </button>

                  <div class="text-center pt-2">
                    <span class="small text-muted" id="gResendCountdownText">Resend code in <span id="gResendSec">30</span>s</span>
                    <button type="button" id="btnResendGoogleOtp" class="btn btn-link btn-sm p-0 text-decoration-none fw-semibold d-none" style="font-size: 0.82rem;">
                      <i class="bi bi-arrow-repeat me-1"></i>Resend WhatsApp Code
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);
    }

    const email = userData.email || pendingPayload.email || '';
    const name = userData.name || pendingPayload.name || 'Google Student';
    const avatarUrl = userData.avatarUrl || pendingPayload.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c';

    const avatarEl = modalEl.querySelector('#gPromptAvatar');
    const nameEl = modalEl.querySelector('#gPromptName');
    const emailEl = modalEl.querySelector('#gPromptEmail');
    
    // Step 1 Elements
    const stepPhoneEl = modalEl.querySelector('#gPromptStepPhone');
    const phoneInput = modalEl.querySelector('#gPromptPhoneInput');
    const phoneFeedbackEl = modalEl.querySelector('#gPromptPhoneFeedback');
    const formPhoneEl = modalEl.querySelector('#gPhonePromptForm');
    const sendOtpBtn = modalEl.querySelector('#btnConfirmGooglePhone');

    // Step 2 Elements
    const stepOtpEl = modalEl.querySelector('#gPromptStepOtp');
    const targetPhoneDisplay = modalEl.querySelector('#gPromptTargetPhoneDisplay');
    const btnChangePhone = modalEl.querySelector('#btnChangeGooglePhone');
    const devOtpBanner = modalEl.querySelector('#gPromptDevOtpBanner');
    const devOtpText = modalEl.querySelector('#gPromptDevOtpText');
    const formOtpEl = modalEl.querySelector('#gOtpPromptForm');
    const otpInput = modalEl.querySelector('#gPromptOtpInput');
    const otpFeedbackEl = modalEl.querySelector('#gPromptOtpFeedback');
    const verifyOtpBtn = modalEl.querySelector('#btnVerifyGoogleOtp');
    const resendCountdownText = modalEl.querySelector('#gResendCountdownText');
    const resendSec = modalEl.querySelector('#gResendSec');
    const btnResendOtp = modalEl.querySelector('#btnResendGoogleOtp');

    if (avatarEl) avatarEl.src = avatarUrl;
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;

    let activePhone = options.initialPhone || getPagePhone() || '';
    let resendInterval = null;

    const startResendCountdown = () => {
      clearInterval(resendInterval);
      let seconds = 30;
      if (resendSec) resendSec.textContent = seconds;
      if (resendCountdownText) resendCountdownText.classList.remove('d-none');
      if (btnResendOtp) btnResendOtp.classList.add('d-none');

      resendInterval = setInterval(() => {
        seconds--;
        if (resendSec) resendSec.textContent = seconds;
        if (seconds <= 0) {
          clearInterval(resendInterval);
          if (resendCountdownText) resendCountdownText.classList.add('d-none');
          if (btnResendOtp) btnResendOtp.classList.remove('d-none');
        }
      }, 1000);
    };

    const switchToStep2 = (phoneStr, backupOtpCode) => {
      activePhone = phoneStr.replace(/\D/g, '').slice(-10);
      if (targetPhoneDisplay) {
        targetPhoneDisplay.textContent = `+91 ${activePhone}`;
      }

      if (backupOtpCode) {
        if (devOtpText) devOtpText.innerHTML = `Test/Dev Code: <strong>${backupOtpCode}</strong>`;
        if (devOtpBanner) devOtpBanner.classList.remove('d-none');
      } else {
        if (devOtpBanner) devOtpBanner.classList.add('d-none');
      }

      if (stepPhoneEl) stepPhoneEl.classList.add('d-none');
      if (stepOtpEl) stepOtpEl.classList.remove('d-none');
      if (otpFeedbackEl) otpFeedbackEl.classList.add('d-none');
      if (otpInput) {
        otpInput.value = '';
        otpInput.classList.remove('is-invalid');
        setTimeout(() => otpInput.focus(), 300);
      }
      startResendCountdown();
    };

    const switchToStep1 = () => {
      clearInterval(resendInterval);
      if (stepOtpEl) stepOtpEl.classList.add('d-none');
      if (stepPhoneEl) stepPhoneEl.classList.remove('d-none');
      if (phoneFeedbackEl) phoneFeedbackEl.classList.add('d-none');
      if (phoneInput) {
        phoneInput.classList.remove('is-invalid');
        setTimeout(() => phoneInput.focus(), 300);
      }
    };

    // Prepopulate Phone Input
    if (phoneInput) {
      phoneInput.value = activePhone;
      phoneInput.oninput = (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (phoneFeedbackEl) phoneFeedbackEl.classList.add('d-none');
        phoneInput.classList.remove('is-invalid');
      };
    }

    if (otpInput) {
      otpInput.oninput = (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
        if (otpFeedbackEl) otpFeedbackEl.classList.add('d-none');
        otpInput.classList.remove('is-invalid');
      };
    }

    if (btnChangePhone) {
      btnChangePhone.onclick = () => switchToStep1();
    }

    // Resend OTP Click
    if (btnResendOtp) {
      btnResendOtp.onclick = async () => {
        btnResendOtp.disabled = true;
        btnResendOtp.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Resending...';

        try {
          const res = await window.API.post('/auth/google', {
            ...pendingPayload,
            phone: activePhone,
            resendOtp: true
          });

          btnResendOtp.disabled = false;
          btnResendOtp.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i>Resend WhatsApp Code';

          if (res.backupOtp && devOtpText) {
            devOtpText.innerHTML = `Test/Dev Code: <strong>${res.backupOtp}</strong>`;
            if (devOtpBanner) devOtpBanner.classList.remove('d-none');
          }

          if (otpFeedbackEl) {
            otpFeedbackEl.textContent = res.message || 'A fresh verification code has been dispatched to your WhatsApp.';
            otpFeedbackEl.className = 'text-success small mt-1.5';
            otpFeedbackEl.classList.remove('d-none');
          }
          startResendCountdown();
        } catch (err) {
          btnResendOtp.disabled = false;
          btnResendOtp.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i>Resend WhatsApp Code';
          if (otpFeedbackEl) {
            otpFeedbackEl.textContent = err.message || 'Failed to resend code. Please try again.';
            otpFeedbackEl.className = 'text-danger small mt-1.5';
            otpFeedbackEl.classList.remove('d-none');
          }
        }
      };
    }

    // Step 1 Form Submission (Send WhatsApp Code)
    formPhoneEl.onsubmit = async (e) => {
      e.preventDefault();
      const rawPhone = (phoneInput.value || '').trim().replace(/\D/g, '');
      if (rawPhone.length < 10) {
        if (phoneFeedbackEl) {
          phoneFeedbackEl.textContent = 'Please enter a valid 10-digit mobile number.';
          phoneFeedbackEl.className = 'text-danger small mt-1.5';
          phoneFeedbackEl.classList.remove('d-none');
        }
        phoneInput.classList.add('is-invalid');
        phoneInput.focus();
        return;
      }

      sendOtpBtn.disabled = true;
      sendOtpBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Sending WhatsApp Code...';

      try {
        const response = await window.API.post('/auth/google', {
          ...pendingPayload,
          phone: rawPhone
        });

        sendOtpBtn.disabled = false;
        sendOtpBtn.innerHTML = '<i class="bi bi-send-check"></i> <span>Send Verification Code</span>';

        if (response.requireOtp) {
          switchToStep2(rawPhone, response.backupOtp);
        } else if (response.success && response.data?.token) {
          // In case user was already verified
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();
          handleAuthSuccess(response.data, response.message, callbacks);
        } else {
          if (phoneFeedbackEl) {
            phoneFeedbackEl.textContent = response.message || 'Please check your mobile number.';
            phoneFeedbackEl.className = 'text-danger small mt-1.5';
            phoneFeedbackEl.classList.remove('d-none');
          }
        }
      } catch (err) {
        sendOtpBtn.disabled = false;
        sendOtpBtn.innerHTML = '<i class="bi bi-send-check"></i> <span>Send Verification Code</span>';
        if (phoneFeedbackEl) {
          phoneFeedbackEl.textContent = err.message || 'Failed to send WhatsApp verification code. Please check the number.';
          phoneFeedbackEl.className = 'text-danger small mt-1.5';
          phoneFeedbackEl.classList.remove('d-none');
        }
        phoneInput.classList.add('is-invalid');
        phoneInput.focus();
      }
    };

    // Step 2 Form Submission (Verify OTP & Complete Sign-In)
    formOtpEl.onsubmit = async (e) => {
      e.preventDefault();
      const enteredOtp = (otpInput.value || '').trim().replace(/\D/g, '');
      if (enteredOtp.length < 6) {
        if (otpFeedbackEl) {
          otpFeedbackEl.textContent = 'Please enter the complete 6-digit WhatsApp verification code.';
          otpFeedbackEl.className = 'text-danger small mt-1.5';
          otpFeedbackEl.classList.remove('d-none');
        }
        otpInput.classList.add('is-invalid');
        otpInput.focus();
        return;
      }

      verifyOtpBtn.disabled = true;
      verifyOtpBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Verifying Code...';

      try {
        const verifyRes = await window.API.post('/auth/google', {
          ...pendingPayload,
          phone: activePhone,
          otp: enteredOtp
        });

        if (verifyRes.success && verifyRes.data?.token) {
          verifyOtpBtn.className = 'btn btn-success w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-2';
          verifyOtpBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> <span>Verified! Redirecting...</span>';

          if (otpFeedbackEl) {
            otpFeedbackEl.textContent = 'Mobile number verified successfully! Redirecting...';
            otpFeedbackEl.className = 'text-success small mt-1.5';
            otpFeedbackEl.classList.remove('d-none');
          }

          setTimeout(() => {
            clearInterval(resendInterval);
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
            handleAuthSuccess(verifyRes.data, verifyRes.message, callbacks);
          }, 450);
        } else {
          verifyOtpBtn.disabled = false;
          verifyOtpBtn.innerHTML = '<i class="bi bi-check2-circle"></i> <span>Verify & Complete Sign-In</span>';
          if (otpFeedbackEl) {
            otpFeedbackEl.textContent = verifyRes.message || 'Invalid verification code. Please check and try again.';
            otpFeedbackEl.className = 'text-danger small mt-1.5';
            otpFeedbackEl.classList.remove('d-none');
          }
          otpInput.classList.add('is-invalid');
          otpInput.focus();
        }
      } catch (err) {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.innerHTML = '<i class="bi bi-check2-circle"></i> <span>Verify & Complete Sign-In</span>';
        if (otpFeedbackEl) {
          otpFeedbackEl.textContent = err.message || 'Invalid WhatsApp verification code. Please check and try again.';
          otpFeedbackEl.className = 'text-danger small mt-1.5';
          otpFeedbackEl.classList.remove('d-none');
        }
        otpInput.classList.add('is-invalid');
        otpInput.focus();
      }
    };

    // Initial view decision
    if (options.initialRequireOtp && options.initialPhone) {
      switchToStep2(options.initialPhone, options.backupOtp);
    } else {
      switchToStep1();
    }

    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();
  };

  /**
   * Authenticates with Disheera backend using Google credentials or profile
   */
  const sendGoogleAuthPayload = async (payload, callbacks) => {
    const { showAlert, setLoadingState } = callbacks;

    // Check if phone was already entered on the registration form
    if (!payload.phone) {
      const pagePhone = getPagePhone();
      if (pagePhone) payload.phone = pagePhone;
    }

    if (setLoadingState) setLoadingState(true);

    try {
      const response = await window.API.post('/auth/google', payload);

      // If backend reports phone number is required:
      if (response.requirePhone) {
        if (setLoadingState) setLoadingState(false);
        showGooglePhonePromptModal(payload, response.data || {}, callbacks);
        return;
      }

      // If backend reports OTP verification is required:
      if (response.requireOtp) {
        if (setLoadingState) setLoadingState(false);
        showGooglePhonePromptModal(payload, response.data || {}, callbacks, {
          initialPhone: response.phone || payload.phone,
          initialRequireOtp: true,
          backupOtp: response.backupOtp,
          message: response.message
        });
        return;
      }

      if (response.success && response.data?.token) {
        handleAuthSuccess(response.data, response.message, callbacks);
      } else {
        if (showAlert) {
          showAlert(response.message || 'Google authentication failed.');
        }
        if (setLoadingState) setLoadingState(false);
      }
    } catch (err) {
      if (showAlert) {
        showAlert(err.message || 'Google authentication failed. Please check credentials or retry.');
      }
      if (setLoadingState) setLoadingState(false);
    }
  };

  /**
   * Reports when Google sign-in cannot be completed.
   */
  const showFastTrackGoogleModal = (callbacks = {}) => {
    callbacks.setLoadingState?.(false);
    callbacks.showAlert?.('Google sign-in is unavailable right now. Please try again or use email and password.', 'warning');
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
        // Show Google Sign-In fast-track modal
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

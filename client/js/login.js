/**
 * login.js — Login Controller
 *
 * Handles login submission, validation, auth token persistence, and redirection.
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated, redirect to appropriate destination
  if (window.Auth?.isAuthenticated()) {
    const user = window.Auth.getCurrentUser();
    if (user?.role === 'recruiter') {
      window.location.href = 'recruiter-dashboard.html';
      return;
    }
    if (user && user.profileCompleted) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'assessment.html';
    }
    return;
  }

  const form = document.getElementById('loginForm');
  const alertContainer = document.getElementById('alertContainer');
  const submitBtn = document.getElementById('submitBtn');

  const showAlert = (message, type = 'danger') => {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-2 px-3 small mb-3" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}"></i>
        <div>${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto p-2" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  // ── Initialize Google Authentication ────────────────────────
  if (window.GoogleAuth) {
    window.GoogleAuth.init({
      buttonId: 'btnGoogleAuth',
      wrapperId: 'g_id_signin_wrapper',
      showAlert,
      setLoadingState: (loading) => {
        const btn = document.getElementById('btnGoogleAuth');
        if (!btn) return;
        if (loading) {
          btn.disabled = true;
          btn.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span>Connecting to Google...</span>
          `;
        } else {
          btn.disabled = false;
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            <span class="fw-semibold">Sign In with Google</span>
          `;
        }
      },
      mode: 'signin',
    });
  }

  // ── Initialize GitHub Authentication ────────────────────────
  if (window.GitHubAuth) {
    window.GitHubAuth.init({
      buttonId: 'btnGitHubAuth',
      showAlert,
      mode: 'signin',
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertContainer.innerHTML = '';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showAlert('Please enter both your email address and password.');
      return;
    }

    // Button loading state
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span>Signing In...</span>
    `;

    try {
      const response = await window.API.post('/auth/login', { email, password });

      if (response.success && response.data?.token) {
        window.Auth.setToken(response.data.token);
        window.Auth.setCurrentUser(response.data.user);

        showAlert('Login successful! Redirecting...', 'success');

        // Check for redirect param
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');

        const getSafeRedirect = (raw) => {
          if (!raw || typeof raw !== 'string') return null;
          const decoded = decodeURIComponent(raw).trim();
          if (decoded.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return null;
          if (/^\/[^\/\\]/.test(decoded) || /^[a-zA-Z0-9_-]+\.html(\?[a-zA-Z0-9_=&-]*)?$/.test(decoded)) {
            return decoded;
          }
          return null;
        };

        setTimeout(() => {
          const role = response.data.user?.role;
          const safeTarget = getSafeRedirect(redirect);

          if (safeTarget) {
            if (role === 'recruiter' && !safeTarget.includes('recruiter') && !safeTarget.includes('jobs.html')) {
              window.location.href = 'recruiter-dashboard.html';
            } else if (role === 'student' && safeTarget.includes('recruiter')) {
              window.location.href = 'dashboard.html';
            } else {
              window.location.href = safeTarget;
            }
          } else if (role === 'recruiter') {
            window.location.href = 'recruiter-dashboard.html';
          } else if (response.data.user?.profileCompleted) {
            window.location.href = 'dashboard.html';
          } else {
            window.location.href = 'assessment.html';
          }
        }, 700);
      } else {
        showAlert(response.message || 'Login failed. Please check your credentials.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;

      if (err.status === 403 && (err.data?.requiresVerification || err.message?.toLowerCase().includes('not verified'))) {
        const verifyEmail = err.data?.email || email;
        const backupOtpParam = err.data?.backupOtp ? `&backupOtp=${encodeURIComponent(err.data.backupOtp)}` : '';
        alertContainer.innerHTML = `
          <div class="alert alert-warning border border-warning border-opacity-50 p-3 mb-3 text-start" role="alert">
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="bi bi-shield-exclamation text-warning fs-5"></i>
              <strong class="text-ink">Verification Required</strong>
            </div>
            <p class="small text-secondary mb-3">
              Your email <strong>${escapeHtml(verifyEmail)}</strong> is not verified yet. A 6-digit OTP code has been dispatched.
            </p>
            <a href="register.html?verify=true&email=${encodeURIComponent(verifyEmail)}${backupOtpParam}" class="btn cp-btn-primary btn-sm w-100 py-2 text-center text-white fw-semibold">
              Enter 6-Digit OTP Code →
            </a>
          </div>
        `;
        return;
      }

      showAlert(err.message || 'Login failed. Please check your credentials and try again.');
    }
  });
});

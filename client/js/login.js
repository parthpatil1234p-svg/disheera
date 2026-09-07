/**
 * login.js — Login Controller
 *
 * Handles login submission, validation, auth token persistence, and redirection.
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated, redirect to assessment
  if (window.Auth?.isAuthenticated()) {
    window.location.href = 'assessment.html';
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
        <button type="button" class="btn-close btn-close-white ms-auto p-2" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

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

        setTimeout(() => {
          if (redirect) {
            window.location.href = decodeURIComponent(redirect);
          } else if (response.data.user?.profileCompleted) {
            window.location.href = 'recommendations.html';
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
      showAlert(err.message || 'Login failed. Please try again.');
    }
  });
});

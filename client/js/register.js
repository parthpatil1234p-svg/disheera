/**
 * register.js — Registration Controller
 *
 * Handles account creation, password confirmation validation, auth token storage,
 * and redirection to the assessment page.
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated, redirect to assessment
  if (window.Auth?.isAuthenticated()) {
    window.location.href = 'assessment.html';
    return;
  }

  const form = document.getElementById('registerForm');
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

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Client-side validations
    if (!name || name.length < 2) {
      showAlert('Name must be at least 2 characters.');
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      showAlert('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match. Please re-check.');
      return;
    }

    // Button loading state
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span>Creating Account...</span>
    `;

    try {
      const response = await window.API.post('/auth/register', { name, email, password });

      if (response.success && response.data?.token) {
        window.Auth.setToken(response.data.token);
        window.Auth.setCurrentUser(response.data.user);

        showAlert('Account created successfully! Taking you to assessment...', 'success');

        setTimeout(() => {
          window.location.href = 'assessment.html';
        }, 700);
      } else {
        showAlert(response.message || 'Registration failed. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;

      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const errorList = err.errors.map((e) => e.message).join('; ');
        showAlert(errorList);
      } else {
        showAlert(err.message || 'Registration failed. Please try again.');
      }
    }
  });
});

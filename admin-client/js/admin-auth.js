/**
 * admin-auth.js — Disheera Admin Authentication Lifecycle
 *
 * Manages admin session validation, login flow, lockout countdown,
 * forced initial password reset, and secure logout.
 */

let currentAdmin = null;
let lockoutTimerInterval = null;

/**
 * Initializes and checks session for protected pages (e.g., index.html)
 */
async function initAdminAuthSession() {
  try {
    const res = await adminFetch('/api/admin/auth/me');
    if (res.success && res.admin) {
      currentAdmin = res.admin;
      updateAdminHeaderUI(res.admin);

      // Check if admin is required to change their temporary initial password
      if (res.admin.mustChangePassword) {
        triggerForcedPasswordChangeModal();
      }
      return res.admin;
    } else {
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.warn('[AdminAuth] Session check failed, redirecting to login:', error.message);
    window.location.href = 'login.html';
  }
}

/**
 * Updates admin username and role badge across the dashboard header & sidebar
 */
function updateAdminHeaderUI(admin) {
  window.adminCurrentProfile = admin;
  const nameEl = document.getElementById('adminCurrentName');
  const roleEl = document.getElementById('adminCurrentRole');
  const emailEl = document.getElementById('adminCurrentEmail');
  const adminsNav = document.getElementById('navLinkAdmins');

  if (nameEl) nameEl.textContent = admin.name || 'Admin';
  if (roleEl) {
    roleEl.textContent = admin.role;
    roleEl.className = `badge ${admin.role === 'SUPER_ADMIN' ? 'badge-rose' : (admin.role === 'ADMIN' ? 'badge-cyan' : 'badge-emerald')}`;
  }
  if (emailEl) emailEl.textContent = admin.email;

  const initialsEl = document.getElementById('adminAvatarInitials');
  if (initialsEl) {
    const parts = (admin.name || 'Admin').trim().split(/\s+/);
    const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]) : parts[0].slice(0, 2);
    initialsEl.textContent = initials.toUpperCase();
  }

  // Personnel management is restricted exclusively to SUPER_ADMIN
  if (adminsNav) {
    adminsNav.style.display = admin.role === 'SUPER_ADMIN' ? 'flex' : 'none';
  }
}

/**
 * Triggers modal requiring the admin to change their password
 */
function triggerForcedPasswordChangeModal() {
  let modal = document.getElementById('forcedPasswordModal');
  if (modal) {
    modal.classList.add('active');
  }
}

/**
 * Login Form Submit Handler (used in login.html)
 */
async function handleAdminLogin(event) {
  event.preventDefault();
  
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const btnSubmit = document.getElementById('btnLoginSubmit');
  const errorBox = document.getElementById('loginErrorBox');
  const lockoutBox = document.getElementById('loginLockoutBox');

  if (!emailInput || !passwordInput) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showLoginError('Please enter both email and password.');
    return;
  }

  try {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Authenticating...';
    hideLoginError();

    const res = await adminFetch('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.success) {
      if (res.admin && res.admin.mustChangePassword) {
        // Show forced password change form
        document.getElementById('loginCard').style.display = 'none';
        document.getElementById('changePasswordCard').style.display = 'block';
        document.getElementById('changeOldPassword').value = password;
      } else {
        window.location.href = 'index.html';
      }
    } else {
      showLoginError(res.message || 'Login failed.');
    }
  } catch (error) {
    if (error.code === 'ACCOUNT_LOCKED') {
      const remainingSec = error.data && error.data.lockedUntil
        ? Math.max(1, Math.ceil((new Date(error.data.lockedUntil) - new Date()) / 1000))
        : 900;
      startLockoutCountdown(remainingSec);
    } else {
      showLoginError(error.message || 'Invalid administrative credentials.');
    }
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Sign In to Admin Panel';
  }
}

/**
 * Forced Password Change Form Submit Handler
 */
async function handleChangePassword(event) {
  event.preventDefault();

  const oldPasswordInput = document.getElementById('changeOldPassword');
  const newPasswordInput = document.getElementById('changeNewPassword');
  const confirmPasswordInput = document.getElementById('changeConfirmPassword');
  const errorBox = document.getElementById('changePasswordErrorBox');
  const btnSubmit = document.getElementById('btnChangePasswordSubmit');

  const oldPassword = oldPasswordInput ? oldPasswordInput.value : '';
  const newPassword = newPasswordInput ? newPasswordInput.value : '';
  const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

  if (!oldPassword || !newPassword || !confirmPassword) {
    if (errorBox) {
      errorBox.textContent = 'All fields are required.';
      errorBox.style.display = 'block';
    }
    return;
  }

  if (newPassword.length < 10) {
    if (errorBox) {
      errorBox.textContent = 'New password must be at least 10 characters long.';
      errorBox.style.display = 'block';
    }
    return;
  }

  if (newPassword !== confirmPassword) {
    if (errorBox) {
      errorBox.textContent = 'New passwords do not match.';
      errorBox.style.display = 'block';
    }
    return;
  }

  try {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Updating Password...';
    if (errorBox) errorBox.style.display = 'none';

    const res = await adminFetch('/api/admin/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: oldPassword, oldPassword, newPassword, confirmPassword })
    });

    if (res.success) {
      showToast('Password changed successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }
  } catch (error) {
    if (errorBox) {
      errorBox.textContent = error.message || 'Failed to update password.';
      errorBox.style.display = 'block';
    }
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Set New Password';
  }
}

/**
 * Logout Handler
 */
async function handleAdminLogout() {
  openConfirmModal({
    title: 'Sign Out',
    message: 'Are you sure you want to terminate your administrative session?',
    confirmText: 'Sign Out',
    isDanger: true,
    onConfirm: async () => {
      try {
        await adminFetch('/api/admin/auth/logout', { method: 'POST' });
      } catch (e) {
        // Ignore logout error
      }
      window.location.href = 'login.html';
    }
  });
}

function showLoginError(msg) {
  const box = document.getElementById('loginErrorBox');
  if (box) {
    box.textContent = msg;
    box.style.display = 'block';
  }
}

function hideLoginError() {
  const box = document.getElementById('loginErrorBox');
  if (box) box.style.display = 'none';
}

function startLockoutCountdown(seconds) {
  const lockoutBox = document.getElementById('loginLockoutBox');
  const timerSpan = document.getElementById('lockoutRemainingSeconds');
  const btnSubmit = document.getElementById('btnLoginSubmit');

  if (!lockoutBox || !timerSpan) return;

  hideLoginError();
  lockoutBox.style.display = 'block';
  if (btnSubmit) btnSubmit.disabled = true;

  let remaining = seconds;
  timerSpan.textContent = remaining;

  if (lockoutTimerInterval) clearInterval(lockoutTimerInterval);

  lockoutTimerInterval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(lockoutTimerInterval);
      lockoutBox.style.display = 'none';
      if (btnSubmit) btnSubmit.disabled = false;
    } else {
      timerSpan.textContent = remaining;
    }
  }, 1000);
}

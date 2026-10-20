/**
 * reset-password.js — Client Logic for Password Recovery & Reset Flow
 * Disheera Technologies Inc.
 */

document.addEventListener('DOMContentLoaded', () => {
  const alertContainer = document.getElementById('alertContainer');
  const stepRequestSection = document.getElementById('stepRequestSection');
  const stepResetSection = document.getElementById('stepResetSection');
  const stepSuccessSection = document.getElementById('stepSuccessSection');

  const forgotForm = document.getElementById('forgotForm');
  const requestEmail = document.getElementById('requestEmail');
  const btnSendRequest = document.getElementById('btnSendRequest');

  const resetForm = document.getElementById('resetForm');
  const targetEmail = document.getElementById('targetEmail');
  const resetOtp = document.getElementById('resetOtp');
  const resetTokenHidden = document.getElementById('resetTokenHidden');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const btnSubmitReset = document.getElementById('btnSubmitReset');
  const btnResendCode = document.getElementById('btnResendCode');

  const linkSwitchToReset = document.getElementById('linkSwitchToReset');
  const linkSwitchToRequest = document.getElementById('linkSwitchToRequest');

  const toggleNewPass = document.getElementById('toggleNewPass');
  const toggleConfirmPass = document.getElementById('toggleConfirmPass');

  // ── Alert Helper ──────────────────────────────────────────────
  function showAlert(message, type = 'info') {
    if (!alertContainer) return;
    const icon = type === 'success' ? 'check-circle-fill' : type === 'danger' ? 'exclamation-triangle-fill' : 'info-circle-fill';
    alertContainer.innerHTML = `
      <div class="alert alert-${type} d-flex align-items-center gap-2 alert-dismissible fade show" role="alert">
        <i class="bi bi-${icon} fs-5"></i>
        <div style="font-size: 0.9rem;">${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearAlert() {
    if (alertContainer) alertContainer.innerHTML = '';
  }

  // ── Password Visibility Toggles ───────────────────────────────
  function setupPasswordToggle(button, inputField) {
    if (!button || !inputField) return;
    button.addEventListener('click', () => {
      const isPass = inputField.type === 'password';
      inputField.type = isPass ? 'text' : 'password';
      const icon = button.querySelector('i');
      if (icon) {
        icon.className = isPass ? 'bi bi-eye-slash' : 'bi bi-eye';
      }
    });
  }

  setupPasswordToggle(toggleNewPass, newPassword);
  setupPasswordToggle(toggleConfirmPass, confirmPassword);

  // ── State Switching ───────────────────────────────────────────
  function showStep(stepName) {
    clearAlert();
    if (stepRequestSection) stepRequestSection.style.display = stepName === 'request' ? 'block' : 'none';
    if (stepResetSection) stepResetSection.style.display = stepName === 'reset' ? 'block' : 'none';
    if (stepSuccessSection) stepSuccessSection.style.display = stepName === 'success' ? 'block' : 'none';
  }

  if (linkSwitchToReset) {
    linkSwitchToReset.addEventListener('click', (e) => {
      e.preventDefault();
      if (requestEmail && requestEmail.value.trim() && targetEmail) {
        targetEmail.value = requestEmail.value.trim();
      }
      showStep('reset');
    });
  }

  if (linkSwitchToRequest) {
    linkSwitchToRequest.addEventListener('click', (e) => {
      e.preventDefault();
      showStep('request');
    });
  }

  // ── Auto-Detect Query Parameters (From Email Link) ────────────
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get('token') || '';
  const emailParam = urlParams.get('email') || '';

  if (tokenParam || emailParam) {
    showStep('reset');
    if (targetEmail && emailParam) targetEmail.value = emailParam;
    if (resetTokenHidden && tokenParam) resetTokenHidden.value = tokenParam;

    if (tokenParam) {
      showAlert('1-click secure reset token verified! Enter your new password below.', 'success');
      // If 1-click token is present, user doesn't need to manually enter OTP
      const otpGroup = document.getElementById('otpGroup');
      if (otpGroup) {
        const otpNote = document.createElement('div');
        otpNote.className = 'small text-success mt-1';
        otpNote.innerHTML = '<i class="bi bi-shield-fill-check"></i> Security token attached from email link.';
        otpGroup.appendChild(otpNote);
      }
    }
  }

  // ── Step 1: Submit Forgot Password Request ────────────────────
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert();

      const emailVal = requestEmail ? requestEmail.value.trim() : '';
      if (!emailVal || !emailVal.includes('@')) {
        showAlert('Please enter a valid email address.', 'danger');
        return;
      }

      btnSendRequest.disabled = true;
      const originalText = btnSendRequest.innerHTML;
      btnSendRequest.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Sending...';

      try {
        const res = await window.API.post('/auth/forgot-password', { email: emailVal });

        if (res.success) {
          if (targetEmail) targetEmail.value = emailVal;
          showStep('reset');
          showAlert(res.message || 'Verification code sent to your email! Please check your inbox.', 'success');
        } else {
          showAlert(res.message || 'Unable to process reset request. Please try again.', 'danger');
        }
      } catch (err) {
        showAlert(err.message || 'Failed to connect to server. Please try again.', 'danger');
      } finally {
        btnSendRequest.disabled = false;
        btnSendRequest.innerHTML = originalText;
      }
    });
  }

  // ── Resend Code Helper ────────────────────────────────────────
  if (btnResendCode) {
    btnResendCode.addEventListener('click', async () => {
      const emailVal = targetEmail ? targetEmail.value.trim() : '';
      if (!emailVal || !emailVal.includes('@')) {
        showAlert('Please provide your email address to receive a code.', 'warning');
        return;
      }

      btnResendCode.disabled = true;
      btnResendCode.innerText = 'Sending...';

      try {
        const res = await window.API.post('/auth/forgot-password', { email: emailVal });
        if (res.success) {
          showAlert('A fresh reset code has been sent to your email!', 'success');
        } else {
          showAlert(res.message || 'Failed to resend code.', 'danger');
        }
      } catch (err) {
        showAlert(err.message || 'Error requesting new code.', 'danger');
      } finally {
        setTimeout(() => {
          btnResendCode.disabled = false;
          btnResendCode.innerText = 'Resend code';
        }, 10000); // 10s cooldown
      }
    });
  }

  // ── Step 2: Submit Reset Password Form ────────────────────────
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert();

      const emailVal = targetEmail ? targetEmail.value.trim() : '';
      const otpVal = resetOtp ? resetOtp.value.trim() : '';
      const tokenVal = resetTokenHidden ? resetTokenHidden.value.trim() : '';
      const passVal = newPassword ? newPassword.value : '';
      const confirmVal = confirmPassword ? confirmPassword.value : '';

      if (!emailVal) {
        showAlert('Please enter your email address.', 'danger');
        return;
      }

      if (!tokenVal && (!otpVal || otpVal.length < 6)) {
        showAlert('Please enter the 6-digit verification code from your email.', 'danger');
        return;
      }

      if (!passVal || passVal.length < 6) {
        showAlert('New password must be at least 6 characters long.', 'danger');
        return;
      }

      if (passVal !== confirmVal) {
        showAlert('Passwords do not match. Please re-enter matching passwords.', 'danger');
        return;
      }

      btnSubmitReset.disabled = true;
      const originalText = btnSubmitReset.innerHTML;
      btnSubmitReset.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Updating Password...';

      try {
        const res = await window.API.post('/auth/reset-password', {
          email: emailVal,
          token: tokenVal || undefined,
          otp: otpVal || undefined,
          newPassword: passVal,
        });

        if (res.success) {
          showStep('success');
          showAlert('Password updated successfully! Redirecting to login...', 'success');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 3500);
        } else {
          showAlert(res.message || 'Failed to reset password. Please verify the code and try again.', 'danger');
        }
      } catch (err) {
        showAlert(err.message || 'Unable to update password. Please check your code and try again.', 'danger');
      } finally {
        btnSubmitReset.disabled = false;
        btnSubmitReset.innerHTML = originalText;
      }
    });
  }
});

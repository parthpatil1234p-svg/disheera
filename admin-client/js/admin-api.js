/**
 * admin-api.js — Disheera Admin Panel API Client & Security Utilities
 *
 * Implements authenticated fetch wrappers with credentials, automatic
 * session redirection, and strict XSS sanitization.
 */

// Determine API base URL dynamically
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : (window.location.origin.includes('admin.') ? '' : window.location.origin);

/**
 * Strict HTML escaping utility to prevent Cross-Site Scripting (XSS).
 * All dynamic user-supplied data MUST pass through this helper before insertion into DOM.
 */
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats a Date object or ISO string cleanly
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return String(dateStr);
  }
}

/**
 * Central authenticated fetch wrapper
 */
async function adminFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    credentials: 'include' // Always send host-only cookie
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    // Intercept 401 Unauthorized -> redirect to login.html
    if (response.status === 401) {
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
      }
      throw new Error(data.message || 'Session expired. Please log in.');
    }

    // Intercept 403 PASSWORD_CHANGE_REQUIRED
    if (response.status === 403 && data.code === 'PASSWORD_CHANGE_REQUIRED') {
      if (typeof window.triggerForcedPasswordChangeModal === 'function') {
        window.triggerForcedPasswordChangeModal();
      } else if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html?changePassword=true';
      }
      throw new Error(data.message || 'Password change is required.');
    }

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.code = data.code;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Lightweight Toast notification system
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Universal Confirmation Modal Dialog
 */
function openConfirmModal({ title, message, confirmText = 'Confirm', isDanger = false, onConfirm }) {
  let modal = document.getElementById('universalConfirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'universalConfirmModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title" id="confirmModalTitle">Confirm Action</h3>
          <button class="btn-modal-close" onclick="closeConfirmModal()">&times;</button>
        </div>
        <div class="modal-body" id="confirmModalMessage">Are you sure?</div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="closeConfirmModal()">Cancel</button>
          <button id="btnConfirmSubmit" class="btn-primary">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalMessage').textContent = message;
  
  const confirmBtn = document.getElementById('btnConfirmSubmit');
  confirmBtn.textContent = confirmText;
  confirmBtn.className = isDanger ? 'btn-danger' : 'btn-primary';

  // Replace onClick handler cleanly
  confirmBtn.onclick = async () => {
    closeConfirmModal();
    if (typeof onConfirm === 'function') {
      await onConfirm();
    }
  };

  modal.classList.add('active');
}

function closeConfirmModal() {
  const modal = document.getElementById('universalConfirmModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

/**
 * Universal Modal Management Helpers
 */
function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('active');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}

window.openModal = openModal;
window.closeModal = closeModal;

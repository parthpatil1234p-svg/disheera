/**
 * adminsView.js — Administrative Personnel & Role Management (Plan 45 Phase 4)
 *
 * Exclusively for SUPER_ADMIN.
 * Handles sub-admin account creation, one-time temporary passwords,
 * active status toggling (with immediate session revocation), and role management.
 */

async function loadAdmins() {
  const tbody = document.getElementById('adminsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading administrative personnel...</td></tr>';

  try {
    const res = await adminFetch('/api/admin/admins');
    if (res.success && Array.isArray(res.admins)) {
      if (res.admins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No administrative personnel found.</td></tr>';
        return;
      }

      const currentAdminId = window.adminCurrentProfile?.id;

      tbody.innerHTML = res.admins.map(a => {
        const isCurrent = a.id === currentAdminId;
        const statusBadge = a.isActive
          ? '<span class="badge badge-emerald">Active</span>'
          : '<span class="badge badge-rose">Deactivated</span>';

        const roleBadge = a.role === 'SUPER_ADMIN'
          ? '<span class="badge badge-indigo">SUPER_ADMIN</span>'
          : a.role === 'ADMIN'
            ? '<span class="badge badge-sky">ADMIN</span>'
            : '<span class="badge badge-muted">MODERATOR</span>';

        const passwordStatus = a.mustChangePassword
          ? '<span class="badge badge-amber" title="Must change password on next login">Pending Change</span>'
          : '<span class="badge badge-emerald">Established</span>';

        const lockStatus = (a.lockedUntil && new Date(a.lockedUntil) > new Date())
          ? `<span class="badge badge-rose" title="Locked until ${new Date(a.lockedUntil).toLocaleTimeString()}">Locked (${a.failedLoginAttempts} fails)</span>`
          : `<span style="font-size: 0.8rem; color: var(--text-muted);">${a.failedLoginAttempts || 0} fails</span>`;

        return `
          <tr>
            <td>
              <div style="font-weight: 600; font-size: 0.88rem;">
                ${escapeHtml(a.name)}
                ${isCurrent ? '<span class="badge badge-indigo" style="margin-left: 0.4rem; font-size: 0.65rem;">You</span>' : ''}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(a.email)}</div>
            </td>
            <td>${roleBadge}</td>
            <td>${statusBadge}</td>
            <td>${passwordStatus}</td>
            <td>${lockStatus}</td>
            <td style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
              ${a.lastLoginAt ? escapeHtml(new Date(a.lastLoginAt).toLocaleString()) : 'Never'}
            </td>
            <td style="text-align: right; white-space: nowrap;">
              <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                ${!isCurrent ? `
                  <button class="btn-action" style="font-size: 0.75rem;" onclick="promptChangeAdminRole('${escapeHtml(a.id)}', '${escapeHtml(a.name)}', '${escapeHtml(a.role)}')">
                    Role
                  </button>
                  <button class="${a.isActive ? 'btn-danger' : 'btn-action'}" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;" onclick="toggleAdminStatus('${escapeHtml(a.id)}', '${escapeHtml(a.name)}', ${a.isActive})">
                    ${a.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                ` : `
                  <span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Protected</span>
                `}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to load administrators:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-rose); padding: 2rem;">${escapeHtml(err.message)}</td></tr>`;
  }
}

function openCreateAdminModal() {
  document.getElementById('newAdminName').value = '';
  document.getElementById('newAdminEmail').value = '';
  document.getElementById('newAdminRole').value = 'ADMIN';
  document.getElementById('createAdminError').style.display = 'none';
  document.getElementById('createAdminFormBox').style.display = 'block';
  document.getElementById('createAdminSuccessBox').style.display = 'none';

  const modal = document.getElementById('createAdminModal');
  if (modal) modal.classList.add('active');
}

async function submitCreateAdmin() {
  const name = document.getElementById('newAdminName').value.trim();
  const email = document.getElementById('newAdminEmail').value.trim();
  const role = document.getElementById('newAdminRole').value;
  const errBox = document.getElementById('createAdminError');

  if (!name || !email) {
    errBox.textContent = 'Name and email are required.';
    errBox.style.display = 'block';
    return;
  }

  try {
    errBox.style.display = 'none';
    const res = await adminFetch('/api/admin/admins', {
      method: 'POST',
      body: JSON.stringify({ name, email, role })
    });

    if (res.success && res.temporaryPassword) {
      document.getElementById('createAdminFormBox').style.display = 'none';
      document.getElementById('createAdminSuccessBox').style.display = 'block';

      document.getElementById('tempPasswordDisplay').value = res.temporaryPassword;
      document.getElementById('tempAdminSummary').textContent = `${res.admin.name} (${res.admin.email}) — ${res.admin.role}`;

      showToast(`Administrator account created successfully!`, 'success');
      loadAdmins();
    }
  } catch (err) {
    errBox.textContent = err.message || 'Failed to create administrator.';
    errBox.style.display = 'block';
  }
}

function copyTemporaryPassword() {
  const input = document.getElementById('tempPasswordDisplay');
  if (!input) return;
  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    showToast('Temporary password copied to clipboard!', 'success');
  }).catch(() => {
    document.execCommand('copy');
    showToast('Temporary password copied!', 'success');
  });
}

async function toggleAdminStatus(id, name, currentActive) {
  const actionText = currentActive ? 'DEACTIVATE' : 'ACTIVATE';
  const warning = currentActive
    ? `Deactivating "${name}" will immediately invalidate all their active login sessions.\n\nAre you sure you want to proceed?`
    : `Activate administrator account for "${name}"?`;

  if (!confirm(warning)) return;

  try {
    const res = await adminFetch(`/api/admin/admins/${id}/toggle-active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !currentActive })
    });

    if (res.success) {
      showToast(res.message, 'success');
      loadAdmins();
    }
  } catch (err) {
    alert(`Failed to update administrator status: ${err.message}`);
  }
}

async function promptChangeAdminRole(id, name, currentRole) {
  const newRole = prompt(`Change role for "${name}".\nEnter MODERATOR, ADMIN, or SUPER_ADMIN:`, currentRole);
  if (!newRole) return;

  const normalized = newRole.trim().toUpperCase();
  if (!['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(normalized)) {
    alert('Invalid role specified. Must be MODERATOR, ADMIN, or SUPER_ADMIN.');
    return;
  }

  if (normalized === currentRole) return;

  if (!confirm(`Are you sure you want to change role of "${name}" from ${currentRole} to ${normalized}? Target user will be forced to re-login.`)) {
    return;
  }

  try {
    const res = await adminFetch(`/api/admin/admins/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: normalized })
    });

    if (res.success) {
      showToast(res.message, 'success');
      loadAdmins();
    }
  } catch (err) {
    alert(`Failed to update role: ${err.message}`);
  }
}

window.loadAdmins = loadAdmins;
window.openCreateAdminModal = openCreateAdminModal;
window.submitCreateAdmin = submitCreateAdmin;
window.copyTemporaryPassword = copyTemporaryPassword;
window.toggleAdminStatus = toggleAdminStatus;
window.promptChangeAdminRole = promptChangeAdminRole;

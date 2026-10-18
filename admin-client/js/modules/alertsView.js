/**
 * alertsView.js — WhatsApp & n8n Broadcast Control Center (Plan 45 Phase 4)
 *
 * Implements broadcast previews, recipient filtering, live character counts,
 * dry-run simulations, and confirmed live broadcasts.
 */

async function refreshAlertRecipientCount() {
  const countEl = document.getElementById('alertRecipientCountPreview');
  if (!countEl) return;

  const stream = document.getElementById('alertTargetStream')?.value || 'all';
  const role = document.getElementById('alertTargetRole')?.value || 'student';
  const college = document.getElementById('alertTargetCollege')?.value.trim() || '';

  countEl.textContent = 'Calculating...';

  try {
    const params = new URLSearchParams({ stream, role });
    if (college) params.set('college', college);

    const res = await adminFetch(`/api/admin/alerts/recipients-count?${params.toString()}`);
    if (res.success) {
      countEl.innerHTML = `<strong>${res.count}</strong> eligible recipient(s) (Cap: ${res.maxBatchLimit})`;
    }
  } catch (err) {
    countEl.textContent = 'Calculation failed';
  }
}

function updateAlertCharCounter() {
  const textarea = document.getElementById('alertMessageInput');
  const counter = document.getElementById('alertCharCounter');
  if (!textarea || !counter) return;

  const len = textarea.value.trim().length;
  counter.textContent = `${len} / 1000 characters`;

  if (len < 10) {
    counter.style.color = 'var(--accent-amber)';
  } else if (len > 1000) {
    counter.style.color = 'var(--accent-rose)';
  } else {
    counter.style.color = 'var(--text-muted)';
  }
}

async function loadAlertHistory() {
  const tbody = document.getElementById('alertHistoryTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Loading broadcast history...</td></tr>';

  try {
    const res = await adminFetch('/api/admin/alerts/history?limit=15');
    if (res.success && Array.isArray(res.broadcasts)) {
      if (res.broadcasts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No past broadcast transmissions found.</td></tr>';
        return;
      }

      tbody.innerHTML = res.broadcasts.map(b => {
        const modeBadge = b.dryRun
          ? '<span class="badge badge-amber">Dry-Run Simulation</span>'
          : '<span class="badge badge-emerald">Live Production</span>';

        return `
          <tr>
            <td style="font-family: var(--font-mono); font-size: 0.75rem; white-space: nowrap;">
              ${escapeHtml(new Date(b.createdAt).toLocaleString())}
            </td>
            <td style="font-weight: 600; font-size: 0.85rem;">${escapeHtml(b.title)}</td>
            <td>${modeBadge}</td>
            <td style="font-family: var(--font-mono); font-size: 0.8rem;">
              ${b.recipientCount} target(s)
            </td>
            <td style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(b.adminEmail)}</td>
            <td style="font-size: 0.75rem; color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(b.messagePreview)}
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to load broadcast history:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-rose); padding: 1.5rem;">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function handleBroadcastSubmit() {
  const title = document.getElementById('alertTitleInput').value.trim();
  const message = document.getElementById('alertMessageInput').value.trim();
  const targetStream = document.getElementById('alertTargetStream').value;
  const targetRole = document.getElementById('alertTargetRole').value;
  const targetCollege = document.getElementById('alertTargetCollege').value.trim();
  const isDryRun = document.getElementById('alertDryRunCheckbox').checked;

  if (!title) {
    alert('Please enter a broadcast announcement title.');
    return;
  }

  if (message.length < 10) {
    alert('Broadcast message must contain at least 10 characters.');
    return;
  }

  if (message.length > 1000) {
    alert('Broadcast message cannot exceed 1000 characters.');
    return;
  }

  // Safety Confirmation Gate for Live Broadcast
  if (!isDryRun) {
    const confirmation = prompt(
      `⚠️ WARNING: LIVE PRODUCTION BROADCAST!\n\n` +
      `You are about to transmit a real notification via WhatsApp/n8n to registered users.\n` +
      `This action cannot be undone and will be permanently recorded in the audit trail.\n\n` +
      `Type "BROADCAST" to confirm execution:`
    );

    if (confirmation !== 'BROADCAST') {
      alert('Broadcast canceled. Execution aborted.');
      return;
    }
  }

  try {
    const btn = document.getElementById('btnSubmitBroadcast');
    if (btn) btn.disabled = true;

    const res = await adminFetch('/api/admin/alerts/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        title,
        message,
        targetStream,
        targetRole,
        targetCollege,
        dryRun: isDryRun,
        confirmed: !isDryRun // Explicit confirmation flag required by server
      })
    });

    if (res.success) {
      if (res.dryRun) {
        alert(`✅ Dry-Run Completed Successfully!\n\nEligible Audience: ${res.recipientCount} recipients\nTitle: "${res.title}"\n\nNo live messages were sent.`);
      } else {
        showToast(`🎉 Live broadcast dispatched to ${res.recipientCount} recipients!`, 'success');
        document.getElementById('alertTitleInput').value = '';
        document.getElementById('alertMessageInput').value = '';
        updateAlertCharCounter();
      }
      loadAlertHistory();
    }
  } catch (err) {
    alert(`Broadcast Failed: ${err.message}`);
  } finally {
    const btn = document.getElementById('btnSubmitBroadcast');
    if (btn) btn.disabled = false;
  }
}

window.refreshAlertRecipientCount = refreshAlertRecipientCount;
window.updateAlertCharCounter = updateAlertCharCounter;
window.loadAlertHistory = loadAlertHistory;
window.handleBroadcastSubmit = handleBroadcastSubmit;

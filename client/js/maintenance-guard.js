/**
 * maintenance-guard.js — Platform Maintenance Mode Guard & Downtime Screen
 *
 * Checks platform maintenance state and displays a clean, user-friendly
 * downtime screen with custom notices and scheduled maintenance hours.
 *
 * Disheera Technologies Inc.
 */

(function () {
  // Never intercept admin panel or administrative personnel
  if (
    typeof window === 'undefined' ||
    window.location.hostname === 'admin.disheera.site' ||
    window.location.hostname.startsWith('admin.') ||
    window.location.search.includes('bypass_maintenance=true')
  ) {
    return;
  }

  let autoCheckTimer = null;
  let countdownSec = 20;

  async function checkMaintenanceStatus() {
    try {
      const baseUrl = window.CONFIG?.API_BASE_URL || 'https://api.disheera.site/api';
      const cleanBase = baseUrl.replace(/\/api$/, '');
      const endpoint = `${cleanBase}/api/system/maintenance`;

      const res = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        cache: 'no-cache'
      });

      if (!res.ok && res.status !== 503) return;

      const data = await res.json().catch(() => null);
      if (!data) return;

      const maint = data.maintenance || data.config || {};
      if (maint.enabled === true) {
        showMaintenanceScreen(maint);
      } else {
        removeMaintenanceScreen();
      }
    } catch (err) {
      // Quiet fail if offline or initial load
    }
  }

  function showMaintenanceScreen(config) {
    if (document.getElementById('disheera-maintenance-overlay')) {
      updateMaintenanceData(config);
      return;
    }

    const title = config.title || 'Platform Scheduled Maintenance';
    const message = config.message || 'We are currently performing routine upgrades, performance tuning, and bug fixing. We will be back online shortly.';
    const startTime = config.startTime || '';
    const endTime = config.endTime || '';
    const duration = config.expectedDuration || '';

    const overlay = document.createElement('div');
    overlay.id = 'disheera-maintenance-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #F8FAFC;
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      overflow-y: auto;
    `;

    overlay.innerHTML = `
      <div style="
        max-width: 640px;
        width: 100%;
        background: #FFFFFF;
        border: 1px solid #E2E8F0;
        border-radius: 16px;
        box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.12);
        padding: 2.5rem 2rem;
        text-align: center;
        position: relative;
      ">
        <!-- Logo & Maintenance Status Pill -->
        <div style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
          <div style="width: 44px; height: 44px; border-radius: 10px; background: #2563EB; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 800; font-size: 1.4rem; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
            D
          </div>
          <span style="font-size: 1.25rem; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">Disheera</span>
        </div>

        <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: #FFFBEB; border: 1px solid #FDE68A; color: #B45309; padding: 0.35rem 0.85rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1.25rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #F59E0B; display: inline-block;"></span>
          Scheduled Maintenance In Progress
        </div>

        <!-- Main Title -->
        <h1 id="maintOverlayTitle" style="font-size: 1.85rem; font-weight: 800; color: #0F172A; margin: 0 0 1rem 0; line-height: 1.25;">
          ${escapeHtml(title)}
        </h1>

        <!-- Custom Notice Message -->
        <p id="maintOverlayMessage" style="font-size: 1rem; color: #334155; line-height: 1.6; margin: 0 0 1.5rem 0; white-space: pre-wrap;">
          ${escapeHtml(message)}
        </p>

        <!-- Time Schedule Container (if time provided) -->
        <div id="maintTimeContainer" style="background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.2rem; margin-bottom: 1.5rem; ${(!startTime && !endTime) ? 'display: none;' : ''}">
          <div style="display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 1rem;">
            ${startTime ? `
              <div>
                <div style="font-size: 0.75rem; color: #64748B; font-weight: 700; text-transform: uppercase;">Maintenance Started</div>
                <div id="maintOverlayStart" style="font-size: 1.1rem; font-weight: 700; color: #0F172A; margin-top: 0.2rem;">${escapeHtml(startTime)}</div>
              </div>
            ` : ''}
            ${endTime ? `
              <div>
                <div style="font-size: 0.75rem; color: #64748B; font-weight: 700; text-transform: uppercase;">Expected Completion</div>
                <div id="maintOverlayEnd" style="font-size: 1.1rem; font-weight: 700; color: #2563EB; margin-top: 0.2rem;">${escapeHtml(endTime)}</div>
              </div>
            ` : ''}
            ${duration ? `
              <div>
                <div style="font-size: 0.75rem; color: #64748B; font-weight: 700; text-transform: uppercase;">Estimated Downtime</div>
                <div id="maintOverlayDuration" style="font-size: 1.1rem; font-weight: 700; color: #059669; margin-top: 0.2rem;">${escapeHtml(duration)}</div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Data Preservation Guarantee -->
        <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1.75rem; display: flex; align-items: center; gap: 0.6rem; text-align: left;">
          <span style="color: #059669; font-size: 1.2rem;">🛡️</span>
          <span style="font-size: 0.85rem; color: #065F46; font-weight: 600;">
            All your student roadmaps, verified skill checkpoints, and assessment progress are safely preserved.
          </span>
        </div>

        <!-- Action / Auto-Check Row -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
          <button id="maintCheckBtn" onclick="window.checkMaintenanceNow()" style="
            background: #2563EB;
            color: #FFFFFF;
            border: none;
            padding: 0.75rem 1.75rem;
            border-radius: 10px;
            font-size: 0.95rem;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
            transition: all 0.2s;
          ">
            Check Site Status Now
          </button>
          <span id="maintCountdownLabel" style="font-size: 0.8rem; color: #64748B;">
            Auto-checking for recovery in <strong id="maintTimerCount">20</strong>s...
          </span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Start auto-recovery polling loop
    startCountdownTimer();
  }

  function updateMaintenanceData(config) {
    const titleEl = document.getElementById('maintOverlayTitle');
    const msgEl = document.getElementById('maintOverlayMessage');
    const startEl = document.getElementById('maintOverlayStart');
    const endEl = document.getElementById('maintOverlayEnd');
    const durEl = document.getElementById('maintOverlayDuration');

    if (titleEl && config.title) titleEl.textContent = config.title;
    if (msgEl && config.message) msgEl.textContent = config.message;
    if (startEl && config.startTime) startEl.textContent = config.startTime;
    if (endEl && config.endTime) endEl.textContent = config.endTime;
    if (durEl && config.expectedDuration) durEl.textContent = config.expectedDuration;
  }

  function removeMaintenanceScreen() {
    const el = document.getElementById('disheera-maintenance-overlay');
    if (el) {
      el.remove();
      document.body.style.overflow = '';
      if (autoCheckTimer) clearInterval(autoCheckTimer);
    }
  }

  function startCountdownTimer() {
    if (autoCheckTimer) clearInterval(autoCheckTimer);
    countdownSec = 20;

    autoCheckTimer = setInterval(async () => {
      countdownSec--;
      const countEl = document.getElementById('maintTimerCount');
      if (countEl) countEl.textContent = countdownSec;

      if (countdownSec <= 0) {
        countdownSec = 20;
        await checkMaintenanceStatus();
      }
    }, 1000);
  }

  window.checkMaintenanceNow = async function () {
    const btn = document.getElementById('maintCheckBtn');
    if (btn) {
      btn.textContent = 'Checking...';
      btn.disabled = true;
    }
    await checkMaintenanceStatus();
    if (btn) {
      btn.textContent = 'Check Site Status Now';
      btn.disabled = false;
    }
  };

  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Check immediately on script execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkMaintenanceStatus);
  } else {
    checkMaintenanceStatus();
  }

  // Expose check helper globally
  window.checkMaintenanceStatus = checkMaintenanceStatus;
})();

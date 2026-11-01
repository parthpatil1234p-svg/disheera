/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * anti-cheat-lock.js — Proctoring & Anti-Cheating Lock Controller
 *
 * Implements authoritative client-side deterrence sensors & HUD controllers:
 *   1. Fullscreen Enforcement (requestFullscreen & exit detection)
 *   2. Tab Switch & Blur Listeners (visibilitychange, window.blur)
 *   3. Clipboard & DevTools Blocking (copy, paste, cut, contextmenu, F12, Ctrl+U, Ctrl+Shift+I)
 *   4. 3-Strike HUD Modals (Strike 1 Amber, Strike 2 Red Urgent, Strike 3 Termination)
 *   5. Authoritative Server Violation Sync (POST /api/quiz/violation)
 *
 * Disheera · Enterprise Platform
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AntiCheatLock = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class AntiCheatController {
    constructor(options = {}) {
      this.sessionId = options.sessionId || null;
      this.skill = options.skill || null;
      this.attemptId = options.attemptId || null;
      this.roadmapId = options.roadmapId || null;
      this.weekNumber = options.weekNumber || null;
      this.violationEndpoint = options.violationEndpoint || '/quiz/violation';
      this.disqualifyEndpoint = options.disqualifyEndpoint || '/quiz/disqualify';
      this.strikePenalties = options.strikePenalties || [10, 10]; // seconds for strike 1 and strike 2
      this.maxStrikes = options.maxStrikes || 3;
      this.strikeCount = 0;
      this.isArmed = false;
      this.isExiting = false;
      this.isLocked = false;
      this.lockReason = null;
      this.lastViolationTime = 0;
      this.violationDebounceMs = options.violationDebounceMs || 800; // prevent double-triggering on simultaneous blur+visibilitychange

      // Callbacks
      this.onStrikeCallback = options.onStrike || null;
      this.onLockoutCallback = options.onLockout || null;
      this.onNoticeCallback = options.onNotice || null;
      this.onDeductTimeCallback = options.onDeductTime || null;

      // Bound event listeners
      this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
      this._handleWindowBlur = this._handleWindowBlur.bind(this);
      this._handleFullscreenChange = this._handleFullscreenChange.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
      this._handleContextMenu = this._handleContextMenu.bind(this);
      this._handleClipboard = this._handleClipboard.bind(this);

      this._initDomModals();
    }

    /**
     * Arm the proctoring lock (starts monitoring and attaches listeners)
     */
    arm(sessionInfo = {}) {
      if (sessionInfo.sessionId) this.sessionId = sessionInfo.sessionId;
      if (sessionInfo.skill) this.skill = sessionInfo.skill;
      if (sessionInfo.attemptId) this.attemptId = sessionInfo.attemptId;
      if (sessionInfo.roadmapId) this.roadmapId = sessionInfo.roadmapId;
      if (sessionInfo.weekNumber) this.weekNumber = sessionInfo.weekNumber;
      if (typeof sessionInfo.strikeCount === 'number') this.strikeCount = sessionInfo.strikeCount;
      if (sessionInfo.isLocked) {
        this.isLocked = true;
        this.lockReason = sessionInfo.lockReason || 'SESSION_LOCKED';
        this._showLockoutModal(this.lockReason);
        return;
      }

      this.isExiting = false;
      this.isArmed = true;
      this._attachListeners();
      this._updateHudBadge();
    }

    /**
     * Disarm the proctoring lock (quiz completed or left)
     */
    disarm() {
      this.isExiting = true;
      this.isArmed = false;
      this._detachListeners();
      this._removeModals();
    }

    /**
     * Request fullscreen mode on start
     */
    async requestFullscreen(targetElement = document.documentElement) {
      try {
        if (!document.fullscreenElement && targetElement.requestFullscreen) {
          await targetElement.requestFullscreen();
          return true;
        }
      } catch (err) {
        console.warn('[AntiCheatLock] Fullscreen request not granted or user dismissed:', err.message);
        return false;
      }
      return false;
    }

    /**
     * Check if currently in fullscreen
     */
    isFullscreen() {
      return Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    }

    /**
     * Exit fullscreen mode cleanly
     */
    async exitFullscreen() {
      this.isExiting = true;
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch (_) {}
    }

    /**
     * Attach all security listeners
     */
    _attachListeners() {
      document.addEventListener('visibilitychange', this._handleVisibilityChange);
      window.addEventListener('blur', this._handleWindowBlur);
      document.addEventListener('fullscreenchange', this._handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', this._handleFullscreenChange);
      window.addEventListener('keydown', this._handleKeydown, true);
      window.addEventListener('contextmenu', this._handleContextMenu, true);
      window.addEventListener('copy', this._handleClipboard, true);
      window.addEventListener('paste', this._handleClipboard, true);
      window.addEventListener('cut', this._handleClipboard, true);
    }

    /**
     * Detach all security listeners
     */
    _detachListeners() {
      document.removeEventListener('visibilitychange', this._handleVisibilityChange);
      window.removeEventListener('blur', this._handleWindowBlur);
      document.removeEventListener('fullscreenchange', this._handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', this._handleFullscreenChange);
      window.removeEventListener('keydown', this._handleKeydown, true);
      window.removeEventListener('contextmenu', this._handleContextMenu, true);
      window.removeEventListener('copy', this._handleClipboard, true);
      window.removeEventListener('paste', this._handleClipboard, true);
      window.removeEventListener('cut', this._handleClipboard, true);
    }

    _handleVisibilityChange() {
      if (!this.isArmed || this.isLocked || this.isExiting) return;
      if (document.hidden) {
        this._recordViolation('tab_switch', 'User switched browser tab during active assessment');
      }
    }

    _handleWindowBlur() {
      if (!this.isArmed || this.isLocked || this.isExiting) return;
      this._recordViolation('window_blur', 'Assessment window lost focus (application switch or secondary monitor click)');
    }

    _handleFullscreenChange() {
      if (!this.isArmed || this.isLocked || this.isExiting) return;
      if (!this.isFullscreen()) {
        this._recordViolation('fullscreen_exit', 'User exited enforced fullscreen mode');
      }
    }

    _handleKeydown(e) {
      if (!this.isArmed) return;

      const key = e.key;
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      // DevTools shortcuts: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        key === 'F12' ||
        (isCtrl && isShift && ['I', 'i', 'J', 'j', 'C', 'c'].includes(key)) ||
        (isCtrl && ['u', 'U'].includes(key)) // View Source
      ) {
        e.preventDefault();
        e.stopPropagation();
        this._showToastNotice('🔒 Developer tools and source view are disabled during skill verification.');
        this._recordViolation('devtools_attempt', `Attempted devtools key combo: ${key}`);
        return false;
      }

      // Clipboard shortcuts: Ctrl+C, Ctrl+V, Ctrl+X
      if (isCtrl && ['c', 'C', 'v', 'V', 'x', 'X'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        this._showToastNotice('🔒 Copying and pasting are disabled to ensure credential integrity.');
        this._recordViolation('clipboard_shortcut', `Attempted clipboard shortcut: Ctrl+${key.toUpperCase()}`);
        return false;
      }

      // Print shortcut: Ctrl+P
      if (isCtrl && ['p', 'P'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        this._showToastNotice('🔒 Printing is disabled during active quiz.');
        return false;
      }
    }

    _handleContextMenu(e) {
      if (!this.isArmed) return;
      e.preventDefault();
      e.stopPropagation();
      this._showToastNotice('🔒 Right-click inspect menu is disabled during assessment.');
      return false;
    }

    _handleClipboard(e) {
      if (!this.isArmed) return;
      e.preventDefault();
      e.stopPropagation();
      this._showToastNotice('🔒 Clipboard access is disabled during active verification.');
      return false;
    }

    /**
     * Dispatch violation to backend and trigger HUD warnings
     */
    async _recordViolation(type, message) {
      if (!this.isArmed || this.isLocked || this.isExiting) return;
      const now = Date.now();
      if (now - this.lastViolationTime < this.violationDebounceMs) {
        return; // debounce rapid consecutive blur+visibilitychange events
      }
      this.lastViolationTime = now;

      // Optimistic increment
      this.strikeCount += 1;
      const strikesRemaining = Math.max(0, this.maxStrikes - this.strikeCount);
      const penaltySeconds = (this.strikePenalties && this.strikePenalties[this.strikeCount - 1]) || 10;

      console.warn(`[AntiCheatLock] Proctoring Violation [${type}]: ${message}. Strike ${this.strikeCount}/${this.maxStrikes} (-${penaltySeconds}s penalty)`);

      // Trigger time deduction callback immediately
      if (this.onDeductTimeCallback) {
        this.onDeductTimeCallback(penaltySeconds);
      }

      // Sync with server authoritative state
      try {
        if (window.API && (this.sessionId || this.skill || this.attemptId)) {
          const resp = await window.API.post(this.violationEndpoint, {
            sessionId: this.sessionId,
            skill: this.skill,
            attemptId: this.attemptId,
            roadmapId: this.roadmapId,
            weekNumber: this.weekNumber,
            violationType: type,
            penaltySeconds: penaltySeconds,
            details: { message, timestamp: now }
          }, { auth: true });

          if (resp && resp.data) {
            this.strikeCount = resp.data.strikesCount || resp.data.strikeCount || this.strikeCount;
            if (resp.data.isLocked) {
              this.isLocked = true;
              this.lockReason = resp.data.lockReason || 'REPEATED_PROCTORING_VIOLATIONS';
            }
          }
        }
      } catch (err) {
        console.error('[AntiCheatLock] Failed to report violation to server:', err);
      }

      // Guard after async network call: if disarmed or exiting, abort immediately and cleanup
      if (!this.isArmed || this.isExiting) {
        this._removeModals();
        return;
      }

      this._updateHudBadge();

      // Trigger callbacks
      if (this.onStrikeCallback) {
        this.onStrikeCallback(this.strikeCount, strikesRemaining, type);
      }

      // Display corresponding Strike Modal
      if (this.strikeCount === 1) {
        this._showStrike1Modal(message);
      } else if (this.strikeCount === 2) {
        this._showStrike2Modal(message);
      } else if (this.strikeCount >= 3 || this.isLocked) {
        this.isLocked = true;
        this.lockReason = 'REPEATED_PROCTORING_VIOLATIONS';
        this._showLockoutModal('Repeated proctoring violations (3/3 strikes). Your assessment session has been locked and terminated.');
        if (this.onLockoutCallback) {
          this.onLockoutCallback(this.lockReason);
        }
      }
    }

    /**
     * Update Proctoring HUD indicator badge on the page
     */
    _updateHudBadge() {
      const strikeEl = document.getElementById('strikeBadgeCount') || document.getElementById('testStrikesCount');
      const badgeContainer = document.getElementById('proctoringHudBadge') || document.getElementById('testStrikesBadge');
      if (strikeEl) {
        strikeEl.textContent = this.strikeCount;
      }
      if (badgeContainer) {
        badgeContainer.classList.remove('d-none', 'bg-success', 'bg-warning', 'bg-danger');
        if (this.strikeCount === 0) {
          badgeContainer.className = 'badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small font-mono';
        } else if (this.strikeCount === 1) {
          badgeContainer.className = 'badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 small font-mono';
        } else {
          badgeContainer.className = 'badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 small font-mono';
        }
      }
    }

    _showToastNotice(text) {
      let toast = document.getElementById('antiCheatToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'antiCheatToast';
        toast.style.cssText = `
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100000;
          background: rgba(15, 23, 42, 0.95);
          color: #F8FAFC;
          padding: 12px 18px;
          border-radius: 8px;
          font-family: var(--font-sans, system-ui, sans-serif);
          font-size: 0.88rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          border-left: 4px solid #F59E0B;
          pointer-events: none;
          transition: opacity 0.3s ease, transform 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        `;
        document.body.appendChild(toast);
      }
      toast.innerHTML = text;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';

      clearTimeout(this._toastTimeout);
      this._toastTimeout = setTimeout(() => {
        if (toast) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(10px)';
        }
      }, 2500);
    }

    _initDomModals() {
      if (document.getElementById('antiCheatModalBackdrop')) return;

      const backdrop = document.createElement('div');
      backdrop.id = 'antiCheatModalBackdrop';
      backdrop.style.cssText = `
        display: none;
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(15, 23, 42, 0.82);
        backdrop-filter: blur(6px);
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: var(--font-sans, system-ui, sans-serif);
      `;

      backdrop.innerHTML = `
        <div id="antiCheatModalCard" style="
          background: #FFFFFF;
          color: #0F172A;
          max-width: 520px;
          width: 100%;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          text-align: center;
          position: relative;
          border: 2px solid transparent;
        ">
          <div id="antiCheatModalIcon" style="font-size: 3rem; margin-bottom: 12px;"></div>
          <h3 id="antiCheatModalTitle" style="font-weight: 800; margin-bottom: 10px; font-size: 1.35rem;"></h3>
          <p id="antiCheatModalDesc" style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;"></p>
          <div id="antiCheatModalExtra" style="margin-bottom: 24px;"></div>
          <div id="antiCheatModalActions" style="display: flex; justify-content: center; gap: 12px;"></div>
        </div>
      `;

      document.body.appendChild(backdrop);
    }

    _showStrike1Modal(details) {
      const backdrop = document.getElementById('antiCheatModalBackdrop');
      const card = document.getElementById('antiCheatModalCard');
      const icon = document.getElementById('antiCheatModalIcon');
      const title = document.getElementById('antiCheatModalTitle');
      const desc = document.getElementById('antiCheatModalDesc');
      const extra = document.getElementById('antiCheatModalExtra');
      const actions = document.getElementById('antiCheatModalActions');

      if (!backdrop || !card) return;

      const p1 = (this.strikePenalties && this.strikePenalties[0]) || 10;
      const p1Text = p1 >= 60 ? `-${Math.round(p1 / 60)}:00 (${Math.round(p1 / 60)} MINS)` : `-${p1}s`;
      const p2 = (this.strikePenalties && this.strikePenalties[1]) || 10;
      const p2Text = p2 >= 60 ? `-${Math.round(p2 / 60)}:00` : `-${p2}s`;

      card.style.borderColor = '#F59E0B';
      icon.innerHTML = '<span style="color: #F59E0B;">⚠️</span>';
      title.innerHTML = '<span style="color: #D97706;">Strike 1 of 3: Cheating Violation Logged</span>';
      desc.innerHTML = `
        <div style="margin-bottom: 8px;">
          <span style="display: inline-block; background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; padding: 4px 12px; border-radius: 999px; font-weight: 800; font-size: 0.82rem;">
            ⚡ ${p1Text} PENALTY DEDUCTED FROM TIMER
          </span>
        </div>
        The proctoring system detected an unauthorized focus loss or tab switch.<br>
        <span style="font-size: 0.85rem; color: #64748B;">Reason: ${details || 'Tab switch or window blur'}</span>
      `;
      extra.innerHTML = `
        <div style="background: #FEF3C7; color: #92400E; padding: 12px; border-radius: 8px; font-size: 0.88rem; font-weight: 600;">
          ⚠️ <strong>2 Strikes Remaining.</strong> Next violation triggers a critical final warning and another ${p2Text} penalty!
        </div>
      `;
      actions.innerHTML = `
        <button id="btnAcknowledgeStrike1" style="
          background: #D97706;
          color: #FFFFFF;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        ">I Acknowledge & Resume Focus</button>
      `;

      backdrop.style.display = 'flex';

      document.getElementById('btnAcknowledgeStrike1')?.addEventListener('click', async () => {
        backdrop.style.display = 'none';
        await this.requestFullscreen();
      });
    }

    _showStrike2Modal(details) {
      const backdrop = document.getElementById('antiCheatModalBackdrop');
      const card = document.getElementById('antiCheatModalCard');
      const icon = document.getElementById('antiCheatModalIcon');
      const title = document.getElementById('antiCheatModalTitle');
      const desc = document.getElementById('antiCheatModalDesc');
      const extra = document.getElementById('antiCheatModalExtra');
      const actions = document.getElementById('antiCheatModalActions');

      if (!backdrop || !card) return;

      const p1 = (this.strikePenalties && this.strikePenalties[0]) || 10;
      const p2 = (this.strikePenalties && this.strikePenalties[1]) || 10;
      const p2Text = p2 >= 60 ? `-${Math.round(p2 / 60)}:00 (${Math.round(p2 / 60)} MINS)` : `-${p2}s`;
      const totalP = p1 + p2;
      const totalPText = totalP >= 60 ? `-${Math.round(totalP / 60)} MINS TOTAL` : `-${totalP}s TOTAL`;

      card.style.borderColor = '#EF4444';
      icon.innerHTML = '<span style="color: #DC2626;">🚨</span>';
      title.innerHTML = '<span style="color: #DC2626;">Strike 2 of 3: CRITICAL FINAL WARNING!</span>';
      desc.innerHTML = `
        <div style="margin-bottom: 8px;">
          <span style="display: inline-block; background: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA; padding: 4px 12px; border-radius: 999px; font-weight: 800; font-size: 0.82rem;">
            ⚡ ${p2Text} PENALTY DEDUCTED (${totalPText})
          </span>
        </div>
        Second proctoring violation recorded!<br>
        <strong style="color: #991B1B;">ONE MORE VIOLATION WILL IMMEDIATELY DISQUALIFY YOU WITH 0% AND 24H LOCKOUT.</strong><br>
        <span style="font-size: 0.85rem; color: #64748B;">Reason: ${details || 'Unfocused browser window or tab switch'}</span>
      `;
      extra.innerHTML = `
        <div style="background: #FEE2E2; color: #991B1B; padding: 12px; border-radius: 8px; font-size: 0.88rem; font-weight: 700;">
          🛑 STRIKE 2/3: Stay on this screen. Do not switch tabs or open DevTools.
        </div>
      `;
      actions.innerHTML = `
        <button id="btnAcknowledgeStrike2" style="
          background: #DC2626;
          color: #FFFFFF;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
        ">Acknowledge Final Chance</button>
      `;

      backdrop.style.display = 'flex';

      document.getElementById('btnAcknowledgeStrike2')?.addEventListener('click', async () => {
        backdrop.style.display = 'none';
        await this.requestFullscreen();
      });
    }

    _showLockoutModal(reason) {
      const backdrop = document.getElementById('antiCheatModalBackdrop');
      const card = document.getElementById('antiCheatModalCard');
      const icon = document.getElementById('antiCheatModalIcon');
      const title = document.getElementById('antiCheatModalTitle');
      const desc = document.getElementById('antiCheatModalDesc');
      const extra = document.getElementById('antiCheatModalExtra');
      const actions = document.getElementById('antiCheatModalActions');

      // Dispatch disqualify to backend MongoDB
      try {
        if (window.API && (this.skill || this.sessionId || this.attemptId)) {
          window.API.post(this.disqualifyEndpoint, {
            skill: this.skill,
            sessionId: this.sessionId,
            attemptId: this.attemptId,
            roadmapId: this.roadmapId,
            weekNumber: this.weekNumber,
            strikes: 3,
            reason: reason || 'REPEATED_PROCTORING_VIOLATIONS'
          }, { auth: true }).catch(() => {});
        }
      } catch (_) {}

      if (!backdrop || !card) return;

      card.style.borderColor = '#991B1B';
      icon.innerHTML = '<span style="color: #991B1B; font-size: 3.5rem;">🚫</span>';
      title.innerHTML = '<span style="color: #991B1B;">ASSESSMENT TERMINATED: DISQUALIFIED</span>';
      desc.innerHTML = `
        Your quiz session has been terminated due to repeated cheating violations (3/3 strikes).<br>
        Your score is recorded as <strong>0% (Flagged for Cheating)</strong>.
      `;
      extra.innerHTML = `
        <div style="background: #FEF2F2; border: 1px solid #FCA5A5; padding: 14px; border-radius: 8px; text-align: left; font-size: 0.88rem; color: #7F1D1D;">
          <div style="margin-bottom: 4px;"><strong>Violation:</strong> ${reason || 'Repeated focus violations (3 strikes)'}</div>
          <div style="margin-bottom: 4px;"><strong>Status:</strong> Disqualified · Integrity Score: 0%</div>
          <div style="margin-bottom: 4px;"><strong>Lockout:</strong> 🔒 Strict 24-Hour Cooldown Active</div>
          <div style="font-size: 0.8rem; color: #991B1B; margin-top: 6px;">Refreshing the browser or clearing cache will not bypass this server-enforced lockout.</div>
        </div>
      `;
        const returnUrl = (this.roadmapId || window.location.pathname.includes('roadmap')) ? 'roadmap.html' : 'dashboard.html';
        const returnLabel = returnUrl === 'roadmap.html' ? 'Return to Roadmap' : 'Return to Dashboard';
        actions.innerHTML = `
        <a href="${returnUrl}" style="
          display: inline-block;
          background: #0F172A;
          color: #FFFFFF;
          text-decoration: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
        ">${returnLabel}</a>
      `;

      backdrop.style.display = 'flex';
      this.disarm();
    }

    _removeModals() {
      const backdrop = document.getElementById('antiCheatModalBackdrop');
      if (backdrop) {
        backdrop.style.display = 'none';
      }
    }
  }

  return AntiCheatController;
});

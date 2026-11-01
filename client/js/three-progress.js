/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * three-progress.js — Journey Marker Progress Gauge (Clean 2D Vector)
 *
 * Implements a clean, modern, non-3D semi-circular progress gauge:
 * - 0%   = Left start milestone
 * - 50%  = Top apex milestone
 * - 100% = Right target goal
 *
 * Exclusively displays percentage (%) scores: 0%, 50%, 100% and current % progress.
 */

(function () {
  const ARC_RADIUS = 72;
  const ARC_LENGTH = Math.PI * ARC_RADIUS; // ~226.195

  function initProgressOrb(containerId, percentage = 0) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const clampedPct = Math.max(0, Math.min(100, Math.round(percentage)));

    // Needle geometric rotation along semi-circle:
    // 0%   -> -90deg (pointing left to 0%)
    // 50%  -> 0deg   (pointing straight up to 50%)
    // 100% -> +90deg (pointing right to 100%)
    const needleRotation = -90 + (clampedPct / 100) * 180;

    // Stroke dashoffset for semi-circle:
    // When 0%   -> dashoffset = ARC_LENGTH (empty)
    // When 50%  -> dashoffset = ARC_LENGTH * 0.5 (halfway, at 50%)
    // When 100% -> dashoffset = 0 (fully filled)
    const dashOffset = ARC_LENGTH * (1 - clampedPct / 100);

    // Color states and status label
    let badgeClass = 'text-primary';
    let statusLabel = 'ROADMAP PROGRESS';
    if (clampedPct >= 100) {
      badgeClass = 'text-success';
      statusLabel = 'GOAL COMPLETED';
    } else if (clampedPct > 0) {
      badgeClass = 'text-info';
      statusLabel = 'IN PROGRESS';
    } else {
      statusLabel = 'NOT STARTED';
    }

    // Update external HTML pill if present in DOM
    const externalPill = document.getElementById('bearingDegreeReadout');
    if (externalPill) {
      externalPill.textContent = `${clampedPct}% Completed`;
      externalPill.className = `badge font-monospace px-2 py-1 shadow-sm ${
        clampedPct >= 100 ? 'bg-success text-white' : clampedPct > 0 ? 'badge-teal text-teal' : 'badge-navy text-secondary'
      }`;
    }

    // Check if SVG is already mounted in the container
    const existingArc = container.querySelector('#gaugeProgressArc');
    const existingNeedle = container.querySelector('#gaugeNeedleGroup');
    const existingVal = container.querySelector('#gaugeValueText');
    const existingStatus = container.querySelector('#gaugeStatusText');

    if (existingArc && existingNeedle && existingVal && existingStatus) {
      existingArc.style.strokeDashoffset = `${dashOffset}`;
      existingNeedle.style.transform = `rotate(${needleRotation}deg)`;
      existingVal.textContent = `${clampedPct}%`;
      existingStatus.textContent = statusLabel;
      existingStatus.setAttribute('class', `gauge-status-text ${badgeClass}`);
      return;
    }

    // Render full 2D SVG Semi-Circular Gauge (Pure % scores only)
    container.innerHTML = `
      <div class="gauge-2d-wrapper" style="width: 100%; max-width: 250px; margin: 0 auto; user-select: none;">
        <svg viewBox="0 0 220 155" class="gauge-svg" width="100%" style="overflow: visible; display: block; height: auto;">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#4F46E5" />
              <stop offset="50%" stop-color="#06B6D4" />
              <stop offset="100%" stop-color="#10B981" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#06B6D4" flood-opacity="0.25" />
            </filter>
          </defs>

          <!-- 1. Background Arc Track (E2E8F0 light slate) -->
          <path d="M 38 96 A 72 72 0 0 1 182 96" 
                fill="none" 
                stroke="#E2E8F0" 
                stroke-width="12" 
                stroke-linecap="round" />

          <!-- 2. Milestone Scale Ticks (0%, 25%, 50%, 75%, 100%) -->
          <!-- 0% Left Start Tick -->
          <line x1="28" y1="96" x2="35" y2="96" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" />
          <!-- 25% Tick -->
          <line x1="54" y1="40" x2="58" y2="44" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round" />
          <!-- 50% Top Apex Tick -->
          <line x1="110" y1="14" x2="110" y2="21" stroke="#06B6D4" stroke-width="2.5" stroke-linecap="round" />
          <!-- 75% Tick -->
          <line x1="166" y1="40" x2="162" y2="44" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round" />
          <!-- 100% Right Target Tick -->
          <line x1="185" y1="96" x2="192" y2="96" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" />

          <!-- 3. Progress Arc (Animated Dashoffset) -->
          <path id="gaugeProgressArc" 
                d="M 38 96 A 72 72 0 0 1 182 96" 
                fill="none" 
                stroke="url(#gaugeGrad)" 
                stroke-width="12" 
                stroke-linecap="round"
                stroke-dasharray="${ARC_LENGTH}" 
                stroke-dashoffset="${dashOffset}"
                filter="url(#gaugeGlow)"
                style="transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);" />

          <!-- 4. Rotating Needle (Sweeps upper half, -90° to +90°) -->
          <g id="gaugeNeedleGroup" style="transform-origin: 110px 96px; transform: rotate(${needleRotation}deg); transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);">
            <line x1="110" y1="96" x2="110" y2="34" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" />
            <polygon points="107,40 110,28 113,40" fill="#06B6D4" />
          </g>

          <!-- 5. Center Pivot Cap -->
          <circle cx="110" cy="96" r="8" fill="#0F172A" />
          <circle cx="110" cy="96" r="3.5" fill="#06B6D4" />

          <!-- 6. Scale Legend Labels (Pure % only) -->
          <text x="38" y="112" font-size="9" font-family="'JetBrains Mono', monospace" fill="#64748B" font-weight="700" text-anchor="middle">0%</text>
          <text x="110" y="10" font-size="9.5" font-family="'JetBrains Mono', monospace" fill="#06B6D4" font-weight="700" text-anchor="middle">50%</text>
          <text x="182" y="112" font-size="9" font-family="'JetBrains Mono', monospace" fill="#64748B" font-weight="700" text-anchor="middle">100%</text>

          <!-- 7. Center Numerical Telemetry (Pure % score only, unobstructed) -->
          <text id="gaugeValueText" x="110" y="128" font-size="28" font-family="'Outfit', sans-serif" font-weight="800" fill="#0F172A" text-anchor="middle">${clampedPct}%</text>
          <text id="gaugeStatusText" x="110" y="145" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="700" fill="#06B6D4" text-anchor="middle" class="gauge-status-text ${badgeClass}">${statusLabel}</text>
        </svg>
      </div>
    `;
  }

  window.initProgressOrb = initProgressOrb;
})();

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * animated-icons.js — 21st.dev Animated State Icons Engine
 * Disheera · Enterprise Platform
 *
 * Micro-animated state icons with SVG morphing and spring physics
 * inspired by 21st.dev/community/icons/animated
 */

(function () {
  'use strict';

  // SVG templates for 21st.dev state icons
  const SVG_ICONS = {
    compass: `
      <svg viewBox="0 0 40 40" fill="none" class="anim-svg-compass" width="28" height="28">
        <circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="2" stroke-opacity="0.4"/>
        <circle cx="20" cy="20" r="12" stroke="#00F2FE" stroke-width="1.5" stroke-dasharray="4 4" stroke-opacity="0.6"/>
        <polygon points="20,7 24,19 20,16 16,19" fill="#00F2FE"/>
        <polygon points="20,33 24,21 20,24 16,21" fill="#7C3AED"/>
        <circle cx="20" cy="20" r="2.5" fill="#FFFFFF"/>
      </svg>
    `,
    success: `
      <svg viewBox="0 0 40 40" fill="none" class="anim-svg-success" width="24" height="24">
        <circle cx="20" cy="20" r="16" stroke="#10B981" stroke-width="2.5"/>
        <path d="M12 20l6 6 10-12" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    lightning: `
      <svg viewBox="0 0 40 40" fill="none" class="anim-svg-lightning" width="24" height="24">
        <path d="M22 6L10 22h8l-2 12 14-16h-8l2-12z" fill="url(#boltGrad)" stroke="#00F2FE" stroke-width="1.5" stroke-linejoin="round"/>
        <defs>
          <linearGradient id="boltGrad" x1="10" y1="6" x2="28" y2="34" gradientUnits="userSpaceOnUse">
            <stop stop-color="#00F2FE"/>
            <stop offset="1" stop-color="#3B82F6"/>
          </linearGradient>
        </defs>
      </svg>
    `,
    speedometer: `
      <svg viewBox="0 0 40 40" fill="none" class="anim-svg-speedometer" width="24" height="24">
        <path d="M8 28A14 14 0 1 1 32 28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="20" y1="20" x2="28" y2="12" stroke="#00F2FE" stroke-width="2.5" stroke-linecap="round" class="needle"/>
        <circle cx="20" cy="20" r="3" fill="#00F2FE"/>
      </svg>
    `,
    rocket: `
      <svg viewBox="0 0 40 40" fill="none" class="anim-svg-rocket" width="24" height="24">
        <path d="M20 6c4 4 8 12 8 18l-4 4-4-2-4 2-4-4c0-6 4-14 8-18z" fill="#00F2FE" fill-opacity="0.2" stroke="#00F2FE" stroke-width="2"/>
        <circle cx="20" cy="16" r="3" fill="#FFFFFF"/>
        <path d="M16 28l4 6 4-6" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    stars: `
      <svg viewBox="0 0 40 40" fill="none" class="anim-svg-stars" width="24" height="24">
        <path d="M20 6l3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9z" fill="#FBBF24" fill-opacity="0.85" stroke="#F59E0B" stroke-width="1.5"/>
        <circle cx="32" cy="10" r="2" fill="#FBBF24"/>
        <circle cx="8" cy="30" r="1.5" fill="#FBBF24"/>
      </svg>
    `
  };

  function initAnimatedIcons() {
    // 1. Hydrate elements with data-anim-icon
    document.querySelectorAll('[data-anim-icon]').forEach((el) => {
      const type = el.getAttribute('data-anim-icon');
      if (SVG_ICONS[type]) {
        el.innerHTML = SVG_ICONS[type];
        el.classList.add('anim-state-icon-wrapper');
      }
    });

    // 2. Add subtle interactive micro-animations to all interactive icon containers
    document.querySelectorAll('.brand-icon, .career-card, .btn, .cp-btn, .dashboard-task-item, .task-checklist-item').forEach((container) => {
      container.addEventListener('mouseenter', () => {
        const icon = container.querySelector('.bi, svg');
        if (icon) {
          icon.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
      });
    });
  }

  // Auto initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimatedIcons);
  } else {
    initAnimatedIcons();
  }

  window.AnimatedIcons = {
    init: initAnimatedIcons,
    icons: SVG_ICONS
  };
})();

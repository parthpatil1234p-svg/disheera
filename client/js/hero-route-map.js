/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * hero-route-map.js — Interactive Mapped In-Demand Skills Showcase for Hero Section
 * 
 * Provides responsive category filtering across verified industry skills (Tech, AI/Data, UI/UX)
 * and direct integration with the skill guide modal dialog.
 * 
 * Accessible (W3C ARIA), lightweight, zero WebGL overhead, instant FCP/CLS = 0.
 */

(function () {
  'use strict';

  function init() {
    const hub = document.getElementById('heroRouteHub');
    if (!hub) return;

    const pills = hub.querySelectorAll('.route-track-pill');
    const cards = hub.querySelectorAll('.hero-skills-grid .skill-logo-card');
    if (!pills.length || !cards.length) return;

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const track = pill.getAttribute('data-track') || 'all';

        pills.forEach(p => {
          const isActive = p === pill;
          p.classList.toggle('active', isActive);
          p.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        cards.forEach(card => {
          const cardTrack = card.getAttribute('data-track') || '';
          if (track === 'all' || cardTrack === track) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });

      pill.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pill.click();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

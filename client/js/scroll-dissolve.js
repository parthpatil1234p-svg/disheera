/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * scroll-dissolve.js — Lightweight 2D Interactive Transformation Slider
 * Disheera · Enterprise Platform
 *
 * Clean, accessible Before/After comparison:
 * - Before: Student Skill Gaps
 * - After: Calibrated Career Roadmap
 * - Zero Three.js or WebGL dependency
 * - Zero continuous scroll event listener reflows
 * - Pure GPU-accelerated CSS opacity crossfade
 */

(function () {
  'use strict';

  function initTransformationSlider() {
    const container = document.getElementById('scrollDissolveContainer');
    const slider = document.getElementById('dissolveScrubber');
    const btnBefore = document.getElementById('btnDissolveBefore');
    const btnAfter = document.getElementById('btnDissolveAfter');
    const frontLayer = document.querySelector('.dissolve-fallback-layer.front');

    if (!container || !slider) return;

    function setProgress(val, animate = false) {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      slider.value = clamped;

      if (frontLayer) {
        if (animate) {
          frontLayer.style.transition = 'opacity 0.4s ease';
        } else {
          frontLayer.style.transition = 'opacity 0.05s linear';
        }
        frontLayer.style.opacity = (1 - clamped / 100).toFixed(2);
      }

      if (btnBefore && btnAfter) {
        if (clamped < 50) {
          btnBefore.classList.add('active');
          btnAfter.classList.remove('active');
        } else {
          btnAfter.classList.add('active');
          btnBefore.classList.remove('active');
        }
      }
    }

    // Slider input event
    slider.addEventListener('input', (e) => {
      setProgress(parseFloat(e.target.value), false);
    });

    // Button controls
    if (btnBefore) {
      btnBefore.addEventListener('click', () => {
        setProgress(0, true);
      });
    }

    if (btnAfter) {
      btnAfter.addEventListener('click', () => {
        setProgress(100, true);
      });
    }

    // Initialize to Before state
    setProgress(0, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTransformationSlider);
  } else {
    initTransformationSlider();
  }
})();

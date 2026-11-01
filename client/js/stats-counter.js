/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * stats-counter.js — VengeanceUI Stats Counter (@vengeanceui/stats-counter)
 * Smooth Spring/Easing Numerical Counter Engine
 * Disheera · Enterprise Platform
 */

(function () {
  'use strict';

  /**
   * Easing function: Quartic ease-out (smooth slowdown as it reaches target)
   */
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  /**
   * Animate a DOM element's text content from 0 to target value
   * @param {HTMLElement} el
   * @param {number} targetValue
   * @param {Object} options
   */
  function animateCounter(el, targetValue, options = {}) {
    if (!el) return;

    const duration = (options.duration || 1.4) * 1000;
    const prefix = options.prefix ?? (el.dataset.prefix || '');
    const suffix = options.suffix ?? (el.dataset.suffix || '');
    const decimals = options.decimals ?? parseInt(el.dataset.decimals || '0', 10);
    const startValue = options.start ?? 0;

    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      const currentValue = startValue + (targetValue - startValue) * easedProgress;

      el.textContent = `${prefix}${currentValue.toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = `${prefix}${targetValue.toFixed(decimals)}${suffix}`;
        el.classList.add('stat-counter-done');
      }
    }

    requestAnimationFrame(step);
  }

  // Expose global helper
  window.animateCounter = animateCounter;

  // Auto-observe elements with [data-counter]
  function initAutoCounters() {
    const counterElements = document.querySelectorAll('[data-counter]');
    if (!counterElements.length) return;

    if (!('IntersectionObserver' in window)) {
      counterElements.forEach((el) => {
        const val = parseFloat(el.dataset.counter);
        if (!isNaN(val)) animateCounter(el, val);
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const targetVal = parseFloat(el.dataset.counter);
            if (!isNaN(targetVal)) {
              animateCounter(el, targetVal);
            }
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
    );

    counterElements.forEach((el) => observer.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoCounters);
  } else {
    initAutoCounters();
  }
})();

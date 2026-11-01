/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * typing-character-fx.js — Universal Keystroke Character Pop-up Animation Engine
 * Disheera · Enterprise Platform
 *
 * Spawns a micro-popup badge above the active input caret whenever a user types,
 * creating a tactile, juicy, game-like keystroke micro-interaction.
 */

(function () {
  'use strict';

  // Palette color rotation for dynamic cyber aesthetic
  const COLOR_CLASSES = ['color-cyan', 'color-purple', 'color-emerald', 'color-amber', 'color-rose'];
  let colorIndex = 0;
  let activePopupCount = 0;
  const MAX_CONCURRENT_POPUPS = 25;

  // Offscreen canvas context for accurate text measurement
  let measurementCanvas = null;
  let measurementContext = null;

  function getCanvasContext() {
    if (!measurementContext) {
      measurementCanvas = document.createElement('canvas');
      measurementContext = measurementCanvas.getContext('2d');
    }
    return measurementContext;
  }

  /**
   * Calculates the caret screen coordinates for an input or textarea
   */
  function getCaretCoordinates(target) {
    const rect = target.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;

    const style = window.getComputedStyle(target);
    const paddingLeft = parseFloat(style.paddingLeft) || 12;
    const fontSize = style.fontSize || '14px';
    const fontFamily = style.fontFamily || 'Inter, sans-serif';

    // Measure text width up to caret
    const ctx = getCanvasContext();
    ctx.font = `${fontSize} ${fontFamily}`;

    const caretPos = typeof target.selectionStart === 'number' ? target.selectionStart : target.value.length;
    const textBeforeCaret = target.value.substring(0, caretPos);
    const measuredWidth = ctx.measureText(textBeforeCaret).width;

    // Handle scroll offset inside input if text overflows
    const scrollLeft = target.scrollLeft || 0;

    let x = rect.left + paddingLeft + measuredWidth - scrollLeft;
    // Keep X bounded within the visible input box
    x = Math.max(rect.left + 14, Math.min(x, rect.right - 14));

    // Y position right above top border of input
    const y = rect.top - 4;

    return { x, y };
  }

  /**
   * Spawns a single floating character pop-up
   */
  function spawnCharacterPopup(target, keyChar, isSpecial = false) {
    if (activePopupCount >= MAX_CONCURRENT_POPUPS) return;

    const coords = getCaretCoordinates(target);
    if (!coords) return;

    const popup = document.createElement('div');
    popup.className = 'cp-char-popup';

    // Random rotation for organic pop trajectory (-10deg to +10deg)
    const rot = (Math.random() * 20 - 10).toFixed(1);
    popup.style.setProperty('--pop-rot', `${rot}deg`);

    // X-jitter (-4px to +4px)
    const xJitter = (Math.random() * 8 - 4);
    popup.style.left = `${coords.x + xJitter}px`;
    popup.style.top = `${coords.y}px`;

    const isPassword = target.type === 'password';

    if (isPassword) {
      popup.classList.add('is-password', 'color-purple');
      popup.textContent = '✦';
    } else if (keyChar === 'Backspace') {
      popup.classList.add('is-backspace');
      popup.textContent = '⌫';
    } else if (keyChar === 'Enter') {
      popup.classList.add('color-emerald');
      popup.textContent = '↵';
    } else if (keyChar === ' ' || keyChar === 'Space') {
      popup.classList.add(COLOR_CLASSES[colorIndex % COLOR_CLASSES.length]);
      popup.textContent = '·';
      colorIndex++;
    } else {
      // Normal printable letter/digit/symbol
      const colorClass = COLOR_CLASSES[colorIndex % COLOR_CLASSES.length];
      popup.classList.add(colorClass);
      colorIndex++;
      popup.textContent = keyChar;
    }

    document.body.appendChild(popup);
    activePopupCount++;

    // Self-cleanup after animation finishes (550ms)
    setTimeout(() => {
      if (popup && popup.parentNode) {
        popup.remove();
        activePopupCount = Math.max(0, activePopupCount - 1);
      }
    }, 550);
  }

  /**
   * Global event delegation on document
   */
  function handleKeydown(e) {
    const target = e.target;
    if (!target) return;

    const isTextInput =
      (target.tagName === 'INPUT' && !['checkbox', 'radio', 'range', 'file', 'color', 'submit', 'button'].includes(target.type)) ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    if (!isTextInput) return;

    // Ignore modifier keys alone
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      return;
    }

    if (e.key === 'Backspace') {
      spawnCharacterPopup(target, 'Backspace', true);
    } else if (e.key === 'Enter') {
      spawnCharacterPopup(target, 'Enter', true);
    } else if (e.key && e.key.length === 1) {
      spawnCharacterPopup(target, e.key, false);
    }
  }

  // Initialize on DOM ready
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', handleKeydown, { passive: true });
  }

  // Expose global controller
  window.TypingCharacterFX = {
    spawn: spawnCharacterPopup,
    enabled: true,
  };
})();

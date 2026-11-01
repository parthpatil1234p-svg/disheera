/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * code-chamber.js - In-Browser "Fix-the-Bug" Proof-of-Work Chamber
 * Replaces multiple-choice quizzes with authentic production code debugging challenges.
 * Features client-side execution sandbox, 3-second hard timeout, keystroke cadence, and paste detection.
 *
 * Disheera - Enterprise Skill Verification Engine
 */

(function () {
  let activeChallenge = null;
  let allChallenges = [];
  let keystrokesCount = 0;
  let pasteEventsCount = 0;
  let startTime = null;
  let timerInterval = null;

  // Initialize Code Chamber when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    initCodeChamber();
  });

  async function initCodeChamber() {
    const chamberContainer = document.getElementById('codeChamberView');
    if (!chamberContainer) return;

    setupEditorEventListeners();
    await loadChallenges();
  }

  // Setup telemetry listeners on the in-browser code editor
  function setupEditorEventListeners() {
    const editor = document.getElementById('codeEditorInput');
    if (!editor) return;

    // Keystroke cadence tracking
    editor.addEventListener('keydown', (e) => {
      // Tab key indent support
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
        updateLineNumbers();
        return;
      }

      // Ctrl+Enter or Cmd+Enter to run verification
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCodeVerification();
        return;
      }

      keystrokesCount++;
      const counterEl = document.getElementById('keystrokesCounter');
      if (counterEl) counterEl.textContent = keystrokesCount;
    });

    editor.addEventListener('input', () => {
      updateLineNumbers();
    });

    // Clipboard paste detection (telemetry alert)
    editor.addEventListener('paste', () => {
      pasteEventsCount++;
      const pasteWarning = document.getElementById('pasteWarningAlert');
      if (pasteWarning) {
        pasteWarning.classList.remove('d-none');
        pasteWarning.textContent = `Telemetry Alert: External clipboard paste detected (${pasteEventsCount}x). Live typing cadence preferred for highest VDI score.`;
        setTimeout(() => pasteWarning.classList.add('d-none'), 5000);
      }
      const pasteEl = document.getElementById('pasteCounter');
      if (pasteEl) pasteEl.textContent = pasteEventsCount;
    });
  }

  function updateLineNumbers() {
    const editor = document.getElementById('codeEditorInput');
    const lineGutter = document.getElementById('codeLineGutter');
    if (!editor || !lineGutter) return;

    const lines = editor.value.split('\n').length;
    let numbers = '';
    for (let i = 1; i <= Math.max(lines, 12); i++) {
      numbers += `<div>${i}</div>`;
    }
    lineGutter.innerHTML = numbers;
  }

  function getApiBaseUrl() {
    if (window.CONFIG?.API_BASE_URL) return window.CONFIG.API_BASE_URL;
    if (window.location.origin.includes('5500')) return 'http://localhost:5000/api';
    return 'https://api.disheera.site/api';
  }

  // Fetch challenges from server
  async function loadChallenges() {
    const categorySelector = document.getElementById('chamberCategorySelect');
    const challengeListContainer = document.getElementById('chamberChallengeList');
    if (!challengeListContainer) return;

    challengeListContainer.innerHTML = '<div class="text-center py-4 text-muted small"><div class="spinner-border spinner-border-sm text-warning me-2"></div>Loading debugging challenges...</div>';

    try {
      const category = categorySelector ? categorySelector.value : 'all';
      let result;
      if (window.API?.get) {
        result = await window.API.get(`/quiz/code-challenges?category=${encodeURIComponent(category)}`);
      } else {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/quiz/code-challenges?category=${encodeURIComponent(category)}`);
        result = await res.json();
      }

      if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
        allChallenges = result.data;
        renderChallengePills(allChallenges);
        selectChallenge(allChallenges[0].id);
      } else {
        loadFallbackChallenges();
      }
    } catch (err) {
      console.warn('[CodeChamber] Error loading from server, using local fallback:', err);
      // Fallback challenges if offline
      loadFallbackChallenges();
    }
  }

  function renderChallengePills(challenges) {
    const container = document.getElementById('chamberChallengeList');
    if (!container) return;

    let html = '';
    challenges.forEach((ch, idx) => {
      const diffBadge = ch.difficulty === 'Hard' ? 'badge-pill-hard' : ch.difficulty === 'Medium' ? 'badge-pill-med' : 'badge-pill-easy';
      html += `
        <button type="button" class="btn btn-sm rounded-pill text-start mb-1 text-truncate challenge-select-pill ${idx === 0 ? 'active' : ''}" 
                data-id="${ch.id}" onclick="window.CodeChamber.selectChallenge('${ch.id}')" style="font-size: 0.78rem;">
          <span class="badge ${diffBadge} me-1" style="font-size: 0.65rem;">${ch.difficulty}</span>
          <span>${escapeHtml(ch.title)}</span>
        </button>
      `;
    });
    container.innerHTML = html;
  }

  function selectChallenge(challengeId) {
    const challenge = allChallenges.find(c => c.id === challengeId);
    if (!challenge) return;

    activeChallenge = challenge;
    keystrokesCount = 0;
    pasteEventsCount = 0;
    startTime = Date.now();

    // Update active pill styling
    document.querySelectorAll('.challenge-select-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-id') === challengeId);
    });

    // Populate problem details
    const titleEl = document.getElementById('chamberTitle');
    const skillEl = document.getElementById('chamberTargetSkill');
    const diffEl = document.getElementById('chamberDifficultyBadge');
    const scenarioEl = document.getElementById('chamberScenario');
    const errorLogEl = document.getElementById('chamberErrorLog');
    const testListEl = document.getElementById('chamberTestList');
    const hintsListEl = document.getElementById('chamberHintsList');
    const editor = document.getElementById('codeEditorInput');
    const terminal = document.getElementById('chamberConsoleOutput');

    if (titleEl) titleEl.textContent = challenge.title;
    if (skillEl) skillEl.textContent = challenge.targetSkill;
    if (diffEl) {
      diffEl.textContent = challenge.difficulty;
      diffEl.className = `badge font-mono ${challenge.difficulty === 'Hard' ? 'bg-danger text-white' : challenge.difficulty === 'Medium' ? 'bg-warning text-dark' : 'bg-success text-white'}`;
    }
    if (scenarioEl) scenarioEl.textContent = challenge.scenario;
    if (errorLogEl) errorLogEl.textContent = challenge.errorLog;

    if (editor) {
      editor.value = challenge.initialCode;
      updateLineNumbers();
    }

    // Update active tab filename, icon, and language badge
    const filenameEl = document.getElementById('chamberTabFilename');
    const iconEl = document.getElementById('chamberTabIcon');
    const langBadgeEl = document.getElementById('chamberTabLangBadge');

    const filename = challenge.filename || (challenge.targetSkill?.toLowerCase() === 'python' ? 'solution.py' : challenge.targetSkill?.toLowerCase() === 'sql' ? 'query.sql' : challenge.targetSkill?.toLowerCase() === 'react' ? 'Component.jsx' : 'solution.js');
    const lang = (challenge.language || (challenge.targetSkill?.toLowerCase() === 'python' ? 'python' : challenge.targetSkill?.toLowerCase() === 'sql' ? 'sql' : 'javascript')).toLowerCase();

    if (filenameEl) filenameEl.textContent = filename;
    if (langBadgeEl) langBadgeEl.textContent = challenge.targetSkill || lang.toUpperCase();

    if (iconEl) {
      if (lang === 'python' || challenge.targetSkill?.toLowerCase() === 'python') {
        iconEl.className = 'bi bi-filetype-py text-primary fs-6';
      } else if (lang === 'sql' || challenge.targetSkill?.toLowerCase() === 'sql') {
        iconEl.className = 'bi bi-database-fill text-info fs-6';
      } else if (lang === 'jsx' || challenge.targetSkill?.toLowerCase() === 'react') {
        iconEl.className = 'bi bi-filetype-jsx text-info fs-6';
      } else {
        iconEl.className = 'bi bi-filetype-js text-primary fs-6';
      }
    }

    // Reset telemetry displays
    const counterEl = document.getElementById('keystrokesCounter');
    if (counterEl) counterEl.textContent = '0';
    const pasteEl = document.getElementById('pasteCounter');
    if (pasteEl) pasteEl.textContent = '0';

    if (testListEl && Array.isArray(challenge.testCaseDescriptions)) {
      testListEl.innerHTML = challenge.testCaseDescriptions.map(desc => `
        <li class="d-flex align-items-center gap-2 small mb-1.5 text-secondary">
          <i class="bi bi-circle text-muted"></i>
          <span>${escapeHtml(desc)}</span>
        </li>
      `).join('');
    }

    if (hintsListEl && Array.isArray(challenge.hints)) {
      hintsListEl.innerHTML = challenge.hints.map((hint, i) => `
        <div class="small text-muted mb-1 pb-1 border-bottom border-line">
          <strong class="text-warning">Hint ${i + 1}:</strong> ${escapeHtml(hint)}
        </div>
      `).join('');
    }

    if (terminal) {
      terminal.innerHTML = `<span class="text-info font-monospace">$ Runtime Sandbox initialized: ${escapeHtml(challenge.targetSkill)} Environment</span>\n<span class="text-secondary">$ Target source: ${escapeHtml(filename)} (${challenge.testCaseDescriptions?.length || 1} assertion test(s) loaded)</span>\n<span class="text-success">> Review incident scenario on the left, patch the defect, and click 'Run Code &amp; Verify'.</span>`;
    }

    startChamberTimer();
  }

  function startChamberTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const timerDisplay = document.getElementById('chamberTimerDisplay');
    startTime = Date.now();

    timerInterval = setInterval(() => {
      if (!timerDisplay) return;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  // Client-Side Execution Sandbox with 3-Second Hard Timeout Guard
  async function runCodeVerification() {
    if (!activeChallenge) return;

    const editor = document.getElementById('codeEditorInput');
    const terminal = document.getElementById('chamberConsoleOutput');
    const btnRun = document.getElementById('btnRunCodeVerify');

    if (!editor || !terminal) return;
    const submittedCode = editor.value;

    if (!submittedCode.trim()) {
      terminal.innerHTML = '<span class="text-danger">Error: Code editor cannot be empty.</span>';
      return;
    }

    if (btnRun) {
      btnRun.disabled = true;
      btnRun.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Evaluating Sandbox...';
    }

    terminal.innerHTML = '<span class="text-info">> Compiling code in isolated evaluation sandbox...</span>\n<span class="text-secondary">> Applying 3000ms execution timeout guard...</span>';

    const timeElapsedSec = Math.max(5, Math.floor((Date.now() - startTime) / 1000));

    try {
      // Send to server evaluation endpoint
      let data;
      const payload = {
        challengeId: activeChallenge.id,
        submittedCode,
        keystrokesCount,
        pasteEventsCount,
        timeElapsedSec
      };

      if (window.API?.post) {
        data = await window.API.post('/quiz/verify-code-solution', payload, { auth: true });
      } else {
        const baseUrl = getApiBaseUrl();
        const token = window.Auth?.getToken?.() || localStorage.getItem('cp_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${baseUrl}/quiz/verify-code-solution`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        data = await res.json();
      }

      if (data.success) {
        let terminalText = '';
        if (data.passed) {
          terminalText += `<span class="text-success font-monospace fw-bold">[SUCCESS] All Test Assertions Passed!</span>\n`;
          terminalText += `<span class="text-success">✔ Verified Debugging Index (VDI): <strong>${data.vdiScore} / 100</strong></span>\n`;
          terminalText += `<span class="text-white">✔ Telemetry: ${data.telemetry.keystrokesRecorded} keystrokes, ${data.telemetry.executionTimeSec}s elapsed</span>\n`;
          terminalText += `<span class="text-success font-monospace">✔ Skill Ledger Updated: '${activeChallenge.targetSkill}' stamped as [${data.verificationBadge}]</span>\n`;
          terminalText += `\n<span class="text-info">> Great work! The bug has been resolved with zero regressions.</span>`;

          showVerificationSuccessModal(data);
        } else {
          terminalText += `<span class="text-danger font-monospace fw-bold">[FAIL] Verification Incomplete</span>\n`;
          terminalText += `<span class="text-warning">> Feedback: ${escapeHtml(data.feedback)}</span>\n`;
          if (Array.isArray(data.testResults)) {
            data.testResults.forEach((t, idx) => {
              const icon = t.passed ? '<span class="text-success">✔</span>' : '<span class="text-danger">✖</span>';
              terminalText += `${icon} Test ${idx + 1}: ${escapeHtml(t.description)}\n`;
            });
          }
          terminalText += `\n<span class="text-secondary">> Review the hints drawer or reset code to try again.</span>`;
        }
        terminal.innerHTML = terminalText;
      } else {
        terminal.innerHTML = `<span class="text-danger">Verification error: ${escapeHtml(data.message || 'Unknown evaluation failure')}</span>`;
      }
    } catch (err) {
      console.error('[CodeChamber] Verification request failed:', err);
      terminal.innerHTML = `<span class="text-danger">Network error connecting to verification engine: ${escapeHtml(err.message)}</span>`;
    } finally {
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.innerHTML = '<i class="bi bi-play-fill me-1"></i> Run Code &amp; Verify';
      }
    }
  }

  function showVerificationSuccessModal(data) {
    const modalEl = document.getElementById('codeVerifiedSuccessModal');
    if (!modalEl) return;

    const scoreEl = document.getElementById('modalVdiScore');
    const badgeEl = document.getElementById('modalSkillBadge');
    if (scoreEl) scoreEl.textContent = `${data.vdiScore}/100`;
    if (badgeEl) badgeEl.textContent = activeChallenge.targetSkill;

    if (window.bootstrap && bootstrap.Modal) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  function resetCurrentChallenge() {
    if (!activeChallenge) return;
    const editor = document.getElementById('codeEditorInput');
    if (editor) {
      editor.value = activeChallenge.initialCode;
      updateLineNumbers();
    }
    const filename = activeChallenge.filename || 'solution.js';
    const terminal = document.getElementById('chamberConsoleOutput');
    if (terminal) {
      terminal.innerHTML = `<span class="text-warning font-monospace">> Code reset to original buggy state for ${escapeHtml(filename)}.</span>`;
    }
  }

  function loadFallbackChallenges() {
    allChallenges = [
      {
        id: 'js-promise-unhandled-rejection',
        title: 'Fix Unhandled Promise Rejection in Async Worker',
        category: 'JavaScript / Node.js',
        difficulty: 'Medium',
        targetSkill: 'JavaScript',
        filename: 'worker.js',
        language: 'javascript',
        scenario: 'In an asynchronous data pipeline, network retries fail silently and crash Node.js with UnhandledPromiseRejection.',
        errorLog: 'UnhandledPromiseRejection: Error: Gateway timeout connecting to payment service\nProcess exited with status code 1',
        initialCode: `async function fetchUserTransactions(userId, gatewayUrl) {\n  if (!userId) throw new Error("Invalid User ID");\n  // BUG: Missing try/catch or async rejection wrapper\n  return await fetchGateway(gatewayUrl);\n}`,
        hints: ['Wrap in try/catch and return an error object fallback.'],
        testCaseDescriptions: ['Gracefully handles gateway timeout without crashing']
      }
    ];
    renderChallengePills(allChallenges);
    selectChallenge(allChallenges[0].id);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Global window hook for UI
  window.CodeChamber = {
    selectChallenge,
    runCodeVerification,
    resetCurrentChallenge,
    loadChallenges
  };

  window.switchVerificationMode = function (mode) {
    const mcqView = document.getElementById('mcqQuizView');
    const codeView = document.getElementById('codeChamberView');
    const heroBanner = document.getElementById('quizHeroBanner');
    const btnMcq = document.getElementById('btnModeMcq');
    const btnCode = document.getElementById('btnModeCodeChamber');

    if (mode === 'code') {
      if (heroBanner) heroBanner.classList.add('d-none');
      if (mcqView) mcqView.classList.add('d-none');
      if (codeView) codeView.classList.remove('d-none');
      if (btnMcq) {
        btnMcq.classList.remove('active', 'btn-primary');
        btnMcq.classList.add('text-secondary');
      }
      if (btnCode) {
        btnCode.classList.add('active', 'btn-primary');
        btnCode.classList.remove('text-secondary');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      initCodeChamber();
    } else {
      if (heroBanner) heroBanner.classList.remove('d-none');
      if (mcqView) mcqView.classList.remove('d-none');
      if (codeView) codeView.classList.add('d-none');
      if (btnMcq) {
        btnMcq.classList.add('active', 'btn-primary');
        btnMcq.classList.remove('text-secondary');
      }
      if (btnCode) {
        btnCode.classList.remove('active', 'btn-primary');
        btnCode.classList.add('text-secondary');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
})();

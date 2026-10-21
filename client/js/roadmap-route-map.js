/**
 * roadmap-route-map.js — Student-Explainable Interactive Career Route Map
 * 
 * Replaces abstract 3D canvas with a clear, student-explainable milestone route:
 * - Visual subway / career highway station track connecting each week
 * - Status Color Coding:
 *     - Completed: Emerald green (#10B981) with verified checkmark
 *     - Current Focus: Electric cyan / teal (#00F2FE) with live pulsing radar signal ("YOU ARE HERE")
 *     - Milestone Test Ready: Amber gold (#F59E0B) with lightning pill
 *     - Upcoming / Locked: Muted slate (#64748B) with padlock
 * - Deep interactivity:
 *     - Station card click smoothly scrolls to #week-card-${w}
 *     - Visual highlight glow applied to target week module
 *     - Direct CTA to launch milestone quiz if awaiting test
 * - 100% Accessible, responsive (desktop horizontal station track, mobile vertical journey),
 *   zero WebGL dependency, zero jank.
 */

(function () {
  'use strict';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderStudentRouteMap(containerId, weeklyData = [], options = {}) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;

    if (!Array.isArray(weeklyData) || weeklyData.length === 0) {
      container.innerHTML = `
        <div class="route-map-empty p-4 text-center text-muted">
          <i class="bi bi-map display-6 d-block mb-2 text-teal opacity-50"></i>
          <p class="mb-0 small">No milestone stations configured yet for this track.</p>
        </div>
      `;
      return;
    }

    const totalWeeks = weeklyData.length;
    let completedWeeksCount = 0;
    let activeWeekIndex = -1;
    let passedTestsCount = 0;

    weeklyData.forEach((w, idx) => {
      const isComp = Boolean(w.isCompleted || w.status === 'completed' || w.status === 'passed');
      if (isComp) {
        completedWeeksCount++;
        passedTestsCount++;
      }
      if (w.isActive || (!isComp && activeWeekIndex === -1)) {
        activeWeekIndex = idx;
      }
    });

    if (activeWeekIndex === -1) {
      activeWeekIndex = completedWeeksCount === totalWeeks ? totalWeeks - 1 : 0;
    }

    const activeWeek = weeklyData[activeWeekIndex] || weeklyData[0];
    const overallPct = options.progressPercentage != null 
      ? Math.round(options.progressPercentage) 
      : Math.round((completedWeeksCount / totalWeeks) * 100);

    // Update telemetry widgets in outer card if present
    const totalWeeksBadge = document.getElementById('routeTotalWeeksBadge');
    if (totalWeeksBadge) {
      totalWeeksBadge.textContent = `${totalWeeks} Milestone Stations`;
    }

    const activeStationLabel = document.getElementById('routeActiveStationLabel');
    if (activeStationLabel && activeWeek) {
      const activeTopic = activeWeek.title ? activeWeek.title.replace(/^Week\s*\d+\s*:\s*/i, '') : `Week ${activeWeek.weekNumber}`;
      activeStationLabel.innerHTML = `Station ${activeWeekIndex + 1}: <span class="text-teal fw-semibold">Week ${activeWeek.weekNumber}</span> <span class="text-secondary fw-normal">(${escapeHtml(activeTopic)})</span>`;
    }

    const completionPercentBadge = document.getElementById('routeCompletionPercentBadge');
    if (completionPercentBadge) {
      completionPercentBadge.textContent = `${overallPct}% Mastered`;
      completionPercentBadge.className = `badge font-monospace ${overallPct >= 100 ? 'bg-success text-white' : 'badge-teal text-teal'}`;
    }

    const milestonesCountLabel = document.getElementById('routeMilestonesCountLabel');
    if (milestonesCountLabel) {
      milestonesCountLabel.innerHTML = `<i class="bi bi-shield-check text-success me-1"></i>${passedTestsCount} of ${totalWeeks} Milestones Verified`;
    }

    const overallProgressBar = document.getElementById('routeOverallProgressBar');
    if (overallProgressBar) {
      overallProgressBar.style.width = `${overallPct}%`;
      overallProgressBar.setAttribute('aria-valuenow', overallPct);
    }

    // Build the Station Cards and Track
    let stationsHtml = '';

    weeklyData.forEach((week, idx) => {
      const wNum = week.weekNumber || (idx + 1);
      const isCompleted = Boolean(week.isCompleted || week.status === 'completed' || week.status === 'passed');
      const completedTasks = week.completedTasksCount != null ? week.completedTasksCount : (isCompleted ? (week.tasksCount || 4) : 0);
      const totalTasks = week.tasksCount != null ? week.tasksCount : 4;
      const allTasksDone = totalTasks > 0 ? (completedTasks >= totalTasks) : true;
      const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Status resolution: A station can ONLY be awaiting test if ALL tasks for that week are done!
      // If tasks are incomplete (completedTasks < totalTasks), it can NEVER be awaiting_test.
      let stationStatus = week.status;
      if (isCompleted) {
        stationStatus = 'passed';
      } else if (!allTasksDone) {
        if (stationStatus === 'awaiting_test') {
          stationStatus = 'in_progress';
        }
      } else if (allTasksDone && stationStatus === 'in_progress') {
        stationStatus = 'awaiting_test';
      }

      const isActive = idx === activeWeekIndex;
      const isAwaitingTest = !isCompleted && allTasksDone && (stationStatus === 'awaiting_test' || allTasksDone);
      const isLocked = !isCompleted && !isActive && !isAwaitingTest && idx > activeWeekIndex;

      let stationStateClass = 'state-locked';
      let stateBadge = `<span class="badge cp-tag"><i class="bi bi-lock-fill me-1"></i> Locked</span>`;
      let statusIcon = `<i class="bi bi-lock text-secondary"></i>`;
      let testBadge = `<span class="route-test-pill pill-locked"><i class="bi bi-lock me-1"></i> Test Locked</span>`;

      if (isCompleted) {
        stationStateClass = 'state-completed';
        stateBadge = `<span class="badge badge-matched"><i class="bi bi-check2-circle me-1"></i> Completed</span>`;
        statusIcon = `<i class="bi bi-check-lg text-success"></i>`;
        const scoreText = week.testPercent ? `${week.testPercent}%` : (week.testScore ? `${week.testScore}/10` : 'Verified');
        testBadge = `<span class="route-test-pill pill-passed" title="Server-Verified Milestone Quiz"><i class="bi bi-patch-check-fill me-1"></i> Passed (${scoreText})</span>`;
      } else if (isAwaitingTest) {
        stationStateClass = 'state-awaiting-test';
        stateBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-lightning-charge-fill me-1"></i> Test Ready</span>`;
        statusIcon = `<i class="bi bi-award-fill text-warning"></i>`;
        testBadge = `<button class="route-test-pill pill-ready btn-launch-station-test" data-week="${wNum}"><i class="bi bi-stopwatch me-1"></i> Launch Test</button>`;
      } else if (isActive) {
        stationStateClass = 'state-active';
        stateBadge = `<span class="badge badge-teal"><span class="station-pulse-dot"></span> Current Focus</span>`;
        statusIcon = `<i class="bi bi-bullseye text-teal"></i>`;
        testBadge = `<span class="route-test-pill pill-inprogress"><i class="bi bi-arrow-repeat me-1"></i> Tasks in Progress</span>`;
      }

      const cleanTitle = week.title ? week.title.replace(/^Week\s*\d+\s*:\s*/i, '') : `Curriculum Stage ${wNum}`;
      const skillName = week.skillName || '';

      // Station Card Markup
      stationsHtml += `
        <div class="route-station ${stationStateClass} ${isActive ? 'is-active-station' : ''}" data-week="${wNum}" id="routeStationNode-${wNum}">
          <!-- Station Node Marker on Connecting Line -->
          <div class="route-node-anchor">
            <div class="station-node-pin">
              <span class="station-node-number">${String(wNum).padStart(2, '0')}</span>
              <span class="station-node-icon">${statusIcon}</span>
              ${isActive ? '<span class="station-beacon-ring"></span><span class="station-beacon-ring beacon-outer"></span>' : ''}
            </div>
            ${isActive ? '<div class="station-here-tooltip"><i class="bi bi-geo-alt-fill me-1"></i>YOU ARE HERE</div>' : ''}
          </div>

          <!-- Station Detail Card -->
          <div class="station-card">
            <div class="station-card-header d-flex align-items-center justify-content-between gap-2 mb-2">
              <div class="d-flex align-items-center gap-1.5 flex-wrap">
                <span class="station-week-pill">WEEK ${wNum}</span>
                ${stateBadge}
              </div>
              <span class="station-step-indicator small font-monospace text-muted">Stop ${wNum}/${totalWeeks}</span>
            </div>

            <h4 class="station-title mb-1 text-ink" title="${escapeHtml(cleanTitle)}">${escapeHtml(cleanTitle)}</h4>

            ${skillName ? `
              <div class="station-skill-badge mb-2 small text-teal d-flex align-items-center gap-1">
                <i class="bi bi-cpu me-1"></i> <span>${escapeHtml(skillName)}</span>
              </div>
            ` : ''}

            <!-- Task Progress Meter -->
            <div class="station-task-meter mb-2.5">
              <div class="d-flex align-items-center justify-content-between small text-muted mb-1">
                <span><i class="bi bi-check2-square me-1"></i>Tasks</span>
                <span class="fw-semibold text-ink">${completedTasks}/${totalTasks} (${taskPct}%)</span>
              </div>
              <div class="progress" style="height: 5px;">
                <div class="progress-bar ${isCompleted ? 'bg-success' : 'bg-teal'}" style="width: ${taskPct}%;"></div>
              </div>
            </div>

            <!-- Milestone Test Pill -->
            <div class="station-footer d-flex align-items-center justify-content-between pt-2 border-top border-line gap-2 flex-wrap">
              <div class="station-test-wrapper">
                ${testBadge}
              </div>
              <button type="button" class="btn btn-sm btn-link p-0 text-decoration-none text-teal fw-semibold station-focus-btn" data-week="${wNum}">
                Focus Tasks <i class="bi bi-arrow-right-short"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="student-route-track-wrapper">
        <div class="route-rail-line-bg">
          <div class="route-rail-line-fill" style="width: ${Math.min(100, Math.max(0, (activeWeekIndex / Math.max(totalWeeks - 1, 1)) * 100))}%;"></div>
        </div>
        <div class="route-stations-row">
          ${stationsHtml}
        </div>
      </div>
    `;

    // Attach Click Handlers to Stations
    const stationElements = container.querySelectorAll('.route-station');
    stationElements.forEach((stationEl) => {
      const wNum = stationEl.getAttribute('data-week');

      // Clicking anywhere on station card (except direct test button) jumps to that week module
      stationEl.addEventListener('click', (e) => {
        if (e.target.closest('.btn-launch-station-test')) {
          e.stopPropagation();
          // Trigger milestone test modal for this week
          const testBtn = document.querySelector(`.btn-open-test[data-week="${wNum}"]`);
          if (testBtn) {
            testBtn.click();
          } else if (typeof window.openWeeklyTestModal === 'function') {
            window.openWeeklyTestModal(parseInt(wNum, 10));
          }
          return;
        }

        focusWeekModule(wNum);
      });
    });

    // Handle direct Focus button clicks
    const focusButtons = container.querySelectorAll('.station-focus-btn');
    focusButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wNum = btn.getAttribute('data-week');
        focusWeekModule(wNum);
      });
    });

    // Helper: Smoothly scroll to week card and highlight
    function focusWeekModule(weekNumber) {
      const targetCard = document.getElementById(`week-card-${weekNumber}`) || document.getElementById(`week-${weekNumber}`);
      if (!targetCard) return;

      // Ensure any collapsed section is opened if needed
      const collapseEl = targetCard.querySelector('.collapse');
      if (collapseEl && !collapseEl.classList.contains('show') && window.bootstrap?.Collapse) {
        const bsCollapse = window.bootstrap.Collapse.getOrCreateInstance(collapseEl);
        bsCollapse.show();
      }

      // Smooth scroll
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add highlight pulse
      targetCard.classList.remove('station-focus-glow');
      void targetCard.offsetWidth; // trigger reflow
      targetCard.classList.add('station-focus-glow');

      setTimeout(() => {
        targetCard.classList.remove('station-focus-glow');
      }, 2500);
    }
  }

  // Global exports for full backward compatibility
  window.renderStudentRouteMap = renderStudentRouteMap;
  window.initRoadmapPath = renderStudentRouteMap;

})();

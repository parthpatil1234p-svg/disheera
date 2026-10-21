/**
 * roadmap.js — Active Roadmap Controller & Task Tracker
 *
 * Interacts with:
 * - GET   /api/roadmaps/current
 * - PATCH /api/roadmaps/tasks/:taskId/toggle
 * - window.initRoadmapPath() for 3D milestone visualization
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard check (strict student portal isolation)
  if (!window.Auth?.requireStudent()) {
    return;
  }
  window.Auth?.consumePortalAlert('alertContainer');

  // 1.1 Verification Gate Check
  if (!window.Auth?.isSkillVerified()) {
    const targetContent = document.getElementById('roadmapContent') || document.querySelector('main');
    window.Auth?.renderVerificationGate(
      targetContent,
      'Active Roadmap',
      'Your week-by-week learning milestones, hands-on tasks, and curated resources'
    );
    return;
  }

  // 2. Elements
  const loadingState = document.getElementById('roadmapLoading') || document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyRoadmapState');
  const content = document.getElementById('roadmapContent');
  const alertContainer = document.getElementById('alertContainer');

  const careerTitleEl = document.getElementById('roadmapCareerTitle');
  const careerDescEl = document.getElementById('roadmapCareerDesc');
  const durationBadgeEl = document.getElementById('roadmapDurationBadge');
  const paceBadgeEl = document.getElementById('roadmapPaceBadge');
  const careerIconEl = document.getElementById('careerIcon');

  const percentageEl = document.getElementById('roadmapPercentage');
  const progressBarEl = document.getElementById('roadmapProgressBar');
  const tasksCounterEl = document.getElementById('roadmapTasksCounter');

  const graduationCard = document.getElementById('graduationCelebrationCard');
  const graduationSubtitle = document.getElementById('graduationCelebrationSubtitle');
  const roadmapStatusBadge = document.getElementById('roadmapStatusAtlasBadge');
  const btnAbandon = document.getElementById('btnAbandonRouteRoadmap');

  const weeksContainer = document.getElementById('weeksContainer');

  let currentRoadmap = null;
  let currentTasks = [];

  const showAlert = (message, type = 'danger') => {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  let allActiveRoadmaps = [];
  let allCompletedRoadmaps = [];

  const renderTrackSwitcher = () => {
    const switcher = document.getElementById('roadmapTrackSwitcher');
    const container = document.getElementById('roadmapTrackTabsContainer');
    const btnEnroll = document.getElementById('btnRoadmapEnrollSecondTrack');
    const modeBadge = document.getElementById('roadmapTrackModeBadge');
    if (!switcher || !container) return;

    const hasActive = Array.isArray(allActiveRoadmaps) && allActiveRoadmaps.length > 0;
    const hasCompleted = Array.isArray(allCompletedRoadmaps) && allCompletedRoadmaps.length > 0;

    if (hasActive || hasCompleted) {
      switcher.classList.remove('d-none');

      if (modeBadge) {
        if (hasActive && hasCompleted) {
          modeBadge.textContent = 'ACTIVE & GRADUATED TRACKS';
        } else if (hasCompleted) {
          modeBadge.textContent = 'GRADUATED TRACKS';
        } else {
          modeBadge.textContent = 'PARALLEL TRACK LEARNING';
        }
      }

      const activeTabsHtml = (allActiveRoadmaps || []).map((r, idx) => {
        const rId = String(r.id || r._id || '');
        const currId = String(currentRoadmap?.id || currentRoadmap?._id || '');
        const isCurrentActive = Boolean(currId && rId && currId === rId) || (allActiveRoadmaps.length === 1 && currentRoadmap?.status !== 'completed');
        const pct = isCurrentActive
          ? Math.round(currentRoadmap?.progressPercentage ?? r.progressPercentage ?? 0)
          : Math.round(r.progressPercentage ?? 0);
        return `
          <button type="button" class="btn btn-sm ${isCurrentActive ? 'cp-btn-primary shadow-sm' : 'cp-btn-outline'} roadmap-track-tab-btn" data-roadmap-id="${rId}" title="Active learning track">
            <i class="bi bi-compass me-1"></i> Track ${idx + 1}: ${escapeHtml(r.career?.title || 'Active Track')} (${pct}%)
          </button>
        `;
      }).join('');

      const completedTabsHtml = (allCompletedRoadmaps || []).map((r) => {
        const isActiveThis = Boolean(currentRoadmap && (
          String(currentRoadmap.id || currentRoadmap._id) === String(r.id || r._id)
        ));
        return `
          <button type="button" class="btn btn-sm ${isActiveThis ? 'btn-success text-white shadow-sm' : 'btn-outline-success'} roadmap-track-tab-btn d-inline-flex align-items-center gap-1" data-roadmap-id="${r.id || r._id}" title="Click to view graduated milestones & verified curriculum">
            <i class="bi bi-mortarboard-fill text-warning"></i>
            <span>Graduated: ${escapeHtml(r.career?.title || 'Completed Track')}</span>
            <span class="badge ${isActiveThis ? 'bg-white text-success' : 'bg-success-subtle text-success border border-success-subtle'} font-mono ms-1" style="font-size: 0.7rem;">100% ✓</span>
          </button>
        `;
      }).join('');

      container.innerHTML = activeTabsHtml + completedTabsHtml;

      container.querySelectorAll('.roadmap-track-tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const rid = btn.getAttribute('data-roadmap-id');
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('id', rid);
          window.history.pushState({}, '', newUrl);
          loadRoadmap(rid);
        });
      });

      if (btnEnroll) {
        if (allActiveRoadmaps.length === 1) {
          btnEnroll.innerHTML = '<i class="bi bi-plus-circle me-1"></i> + Add 2nd Related Course';
          btnEnroll.classList.remove('d-none');
        } else if (allActiveRoadmaps.length === 0) {
          btnEnroll.innerHTML = '<i class="bi bi-compass me-1"></i> + Start New Career Route';
          btnEnroll.classList.remove('d-none');
        } else {
          btnEnroll.classList.add('d-none');
        }
      }
    } else {
      switcher.classList.add('d-none');
    }
  };

  // 3. Fetch active roadmap
  const loadRoadmap = async (targetRoadmapId = null) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roadmapId = targetRoadmapId || urlParams.get('id') || null;
      const endpoint = roadmapId ? `/roadmaps/current?roadmapId=${encodeURIComponent(roadmapId)}` : '/roadmaps/current';

      const res = await window.API.get(endpoint, { auth: true });

      loadingState.classList.add('d-none');

      if (res.success && res.data?.roadmap) {
        currentRoadmap = res.data.roadmap;
        currentTasks = res.data.tasks || [];
        allActiveRoadmaps = res.data.activeRoadmaps || [];
        allCompletedRoadmaps = res.data.completedRoadmaps || [];
        renderTrackSwitcher();
        renderRoadmap();
      } else {
        emptyState.classList.remove('d-none');
      }
    } catch (err) {
      loadingState.classList.add('d-none');
      if (err.status === 403 || err.requiresSkillVerification) {
        window.Auth?.renderVerificationGate(
          content || document.querySelector('main'),
          'Active Roadmap',
          'Your week-by-week learning milestones, hands-on tasks, and curated resources'
        );
        return;
      }
      if (err.status === 404) {
        emptyState.classList.remove('d-none');
      } else {
        showAlert(err.message || 'Failed to load active roadmap. Please try again.');
      }
    }
  };

  const updateProgressUI = (pct, completed, total) => {
    const rounded = Math.round(pct || 0);
    if (percentageEl) percentageEl.textContent = `${rounded}%`;
    if (progressBarEl) {
      progressBarEl.style.width = `${rounded}%`;
      progressBarEl.setAttribute('aria-valuenow', rounded);
    }
    if (tasksCounterEl) {
      tasksCounterEl.textContent = `${completed || 0} of ${total || 0} tasks completed`;
    }
  };

  // 4. Render Roadmap & Weeks
  const renderRoadmap = () => {
    content.classList.remove('d-none');

    // Header Details
    const career = currentRoadmap.career || {};
    if (careerTitleEl) careerTitleEl.textContent = career.title || 'Tech Career';
    if (careerDescEl && career.shortDescription) {
      careerDescEl.textContent = career.shortDescription;
    }
    if (careerIconEl && career.icon) {
      careerIconEl.className = `bi ${career.icon} text-teal`;
    }

    const btnRoadmapMock = document.getElementById('btnRoadmapMockInterview');
    if (btnRoadmapMock && career.title) {
      btnRoadmapMock.href = `dashboard.html?action=mock-interview&role=${encodeURIComponent(career.title)}`;
    }

    if (durationBadgeEl) durationBadgeEl.textContent = `${currentRoadmap.durationWeeks} Weeks`;
    if (paceBadgeEl) {
      paceBadgeEl.textContent =
        currentRoadmap.durationWeeks === 4
          ? 'Fast-track Pace'
          : currentRoadmap.durationWeeks === 12
          ? 'Deep Dive Pace'
          : 'Balanced Pace';
    }

    const isCompleted = currentRoadmap.status === 'completed';

    if (graduationCard) {
      if (isCompleted) {
        graduationCard.classList.remove('d-none');
        if (graduationSubtitle) {
          graduationSubtitle.innerHTML = `
            You have successfully mastered the <strong>${escapeHtml(career.title || 'chosen track')}</strong> curriculum, passed all weekly milestone assessments (&ge; 70%), and stamped verified competencies into your skill evidence ledger. Your account is now unlocked to attend your next career route!
          `;
        }
        renderJobReadyCard(true);
      } else {
        graduationCard.classList.add('d-none');
        renderJobReadyCard(false);
      }
    }

    if (roadmapStatusBadge) {
      if (isCompleted) {
        roadmapStatusBadge.innerHTML = '<i class="bi bi-patch-check-fill text-success"></i> GRADUATED ROUTE';
      } else {
        roadmapStatusBadge.innerHTML = '<i class="bi bi-compass text-teal"></i> ACTIVE ROUTE';
      }
    }

    if (btnAbandon) {
      btnAbandon.style.display = isCompleted ? 'none' : 'inline-block';
    }

    updateProgressUI(currentRoadmap.progressPercentage, currentRoadmap.completedTasksCount, currentRoadmap.totalTasksCount);
    renderTrackSwitcher();

    // Group tasks by week
    const weekMap = {};
    for (let w = 1; w <= currentRoadmap.durationWeeks; w++) {
      weekMap[w] = [];
    }

    currentTasks.forEach((task) => {
      if (!weekMap[task.weekNumber]) {
        weekMap[task.weekNumber] = [];
      }
      weekMap[task.weekNumber].push(task);
    });

    // Determine Student-Explainable Milestone Route Data
    const weekProgressList = currentRoadmap.weekProgress || [];
    const isGraduatedRoadmap = currentRoadmap.status === 'completed' || (currentRoadmap.progressPercentage || 0) >= 100;
    const weeklyMilestones = [];
    let firstIncompleteFound = false;

    Object.keys(weekMap).forEach((wNum) => {
      const weekNumber = parseInt(wNum, 10);
      const tasks = weekMap[weekNumber] || [];
      const completedCount = tasks.filter((t) => t.completed).length;
      const allTasksCompleted = tasks.length > 0 ? (completedCount >= tasks.length) : true;
      
      let wp = weekProgressList.find((p) => p.weekNumber === weekNumber);
      if (!wp) {
        wp = {
          weekNumber,
          status: weekNumber === 1 ? 'in_progress' : 'locked',
          testScore: null,
          testPercent: null,
          passedAt: null,
          attemptsCount: 0
        };
      }

      const isWeekPassed = wp.status === 'passed' || isGraduatedRoadmap;
      
      let isActive = false;
      if (!isWeekPassed && !firstIncompleteFound) {
        isActive = true;
        firstIncompleteFound = true;
      }

      const weekTitle = tasks[0]?.title ? tasks[0].title.split(':')[0] : `Week ${weekNumber}`;
      const skillName = tasks[0]?.skill?.displayName || tasks[0]?.skill?.name || '';

      // Clean status determination:
      let weekStatus = 'locked';
      if (isWeekPassed) {
        weekStatus = 'passed';
      } else if (allTasksCompleted) {
        weekStatus = 'awaiting_test';
      } else if (isActive) {
        weekStatus = 'in_progress';
      }

      weeklyMilestones.push({
        weekNumber,
        title: weekTitle,
        skillName,
        tasksCount: tasks.length,
        completedTasksCount: completedCount,
        isCompleted: isWeekPassed,
        isActive,
        status: weekStatus,
        testScore: wp.testScore,
        testPercent: wp.testPercent,
        passedAt: wp.passedAt,
        attemptsCount: wp.attemptsCount || 0
      });
    });

    // Initialize Student-Explainable Milestone Route Map
    if (window.renderStudentRouteMap) {
      window.renderStudentRouteMap('roadmap-path', weeklyMilestones, {
        progressPercentage: currentRoadmap.progressPercentage || 0,
        careerTitle: currentRoadmap.careerTitle || currentRoadmap.title || 'Career Path'
      });
    } else if (window.initRoadmapPath) {
      window.initRoadmapPath('roadmap-path', weeklyMilestones, {
        progressPercentage: currentRoadmap.progressPercentage || 0,
        careerTitle: currentRoadmap.careerTitle || currentRoadmap.title || 'Career Path'
      });
    }

    // Render Weekly Cards in DOM
    weeksContainer.innerHTML = '';

    Object.keys(weekMap).forEach((wNum) => {
      const weekNumber = parseInt(wNum, 10);
      const tasks = weekMap[weekNumber];
      const completedCount = tasks.filter((t) => t.completed).length;

      // Milestone progress status: 'locked' | 'in_progress' | 'awaiting_test' | 'passed'
      let wp = weekProgressList.find((p) => p.weekNumber === weekNumber);
      if (!wp) {
        wp = {
          weekNumber,
          status: weekNumber === 1 ? 'in_progress' : 'locked',
          testScore: null,
          testPercent: null,
          passedAt: null,
          attemptsCount: 0
        };
      }

      const isGraduated = currentRoadmap.status === 'completed' || currentRoadmap.progressPercentage >= 100;
      const isAdminUser = Boolean(window.Auth?.isAdmin());
      const allTasksCompleted = tasks.length > 0 ? (completedCount >= tasks.length) : true;
      let rawStatus = wp.status || (isGraduated ? 'passed' : (weekNumber === 1 ? 'in_progress' : 'locked'));
      if (rawStatus !== 'passed' && !isGraduated) {
        if (!allTasksCompleted && rawStatus === 'awaiting_test') {
          rawStatus = 'in_progress';
        } else if (allTasksCompleted && rawStatus === 'in_progress') {
          rawStatus = 'awaiting_test';
        }
      }
      const status = isAdminUser ? (rawStatus === 'locked' ? 'in_progress' : rawStatus) : rawStatus;
      const isLocked = isAdminUser ? false : (!isGraduated && status === 'locked');
      const isPassed = status === 'passed' || isGraduated;
      const isAwaitingTest = !isGraduated && status === 'awaiting_test' && allTasksCompleted;
      const isInProgress = !isGraduated && (status === 'in_progress' || (isAdminUser && !isPassed && !isAwaitingTest));

      let statusCardClass = '';
      if (isLocked) statusCardClass = 'locked-week';
      else if (isPassed) statusCardClass = 'completed-week';
      else if (isAwaitingTest) statusCardClass = 'awaiting-test-week active-week';
      else if (isInProgress) statusCardClass = 'active-week';

      // Header Pill
      let pillContent = `${weekNumber}`;
      if (isLocked) pillContent = '<i class="bi bi-lock-fill"></i>';
      else if (isPassed) pillContent = '<i class="bi bi-check2"></i>';
      else if (isAwaitingTest) pillContent = '<i class="bi bi-patch-question-fill text-warning"></i>';

      const isCooldownActive = Boolean(wp?.cooldownUntil && new Date(wp.cooldownUntil).getTime() > Date.now());
      let cooldownRemainingText = '';
      if (isCooldownActive) {
        const remainingMs = new Date(wp.cooldownUntil).getTime() - Date.now();
        const remH = Math.floor(remainingMs / (1000 * 60 * 60));
        const remM = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        cooldownRemainingText = remH > 0 ? `${remH}h ${remM}m` : `${remM}m`;
      }

      // Header Status Badge
      let statusBadgeHtml = '';
      if (isCooldownActive) {
        statusBadgeHtml = `<span class="badge bg-danger-subtle text-danger border border-danger font-mono"><i class="bi bi-shield-x-fill me-1"></i> Cheating Lockout (${cooldownRemainingText})</span>`;
      } else if (isLocked) {
        statusBadgeHtml = '<span class="badge bg-secondary-subtle text-muted font-mono"><i class="bi bi-lock-fill me-1"></i> Locked Milestone</span>';
      } else if (isPassed) {
        statusBadgeHtml = `<span class="badge badge-matched"><i class="bi bi-patch-check-fill me-1"></i> Passed (${wp.testPercent}%)</span>`;
      } else if (isAwaitingTest) {
        statusBadgeHtml = '<span class="badge bg-warning-subtle text-warning border border-warning-subtle"><i class="bi bi-alarm-fill me-1"></i> Ready for Milestone Test</span>';
      } else if (isInProgress) {
        statusBadgeHtml = isAdminUser ? '<span class="badge badge-teal"><i class="bi bi-unlock-fill me-1"></i> Unlocked (Admin)</span>' : '<span class="badge badge-teal">In Progress</span>';
      }

      // Milestone Test Action Box
      let milestoneActionHtml = '';
      if (isCooldownActive) {
        milestoneActionHtml = `
          <div class="mt-3 p-3 card border-danger border-opacity-75 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-sm" style="background: rgba(239, 68, 68, 0.08); border-radius: 12px;">
            <div>
              <div class="fw-bold text-danger d-flex align-items-center gap-2 mb-1">
                <i class="bi bi-shield-x-fill text-danger fs-5"></i>
                🔒 Retake Locked: Strict Anti-Cheating Cooldown Active
              </div>
              <div class="text-muted small">
                Repeated focus loss or proctoring violations were recorded. The server has enforced a 24-hour retake lockout on Week ${weekNumber}. <strong>Unlocks in ~${cooldownRemainingText}</strong>.
              </div>
            </div>
            <button class="btn btn-secondary btn-sm px-3 py-2 flex-shrink-0" disabled title="24-hour anti-cheat lockout active">
              <i class="bi bi-lock-fill me-1"></i> Locked (~${cooldownRemainingText})
            </button>
          </div>
        `;
      } else if (isLocked) {
        milestoneActionHtml = `
          <div class="mt-3 p-3 card border-line text-muted small d-flex flex-row align-items-center gap-2" style="background: rgba(0,0,0,0.02); border-radius: 8px;">
            <i class="bi bi-lock-fill text-secondary fs-5"></i>
            <div>
              <strong>Milestone Locked:</strong> Complete Week ${weekNumber - 1} tasks and pass its 30-minute milestone test (&ge; 70%) to access this curriculum.
            </div>
          </div>
        `;
      } else if (isAwaitingTest) {
        milestoneActionHtml = `
          <div class="mt-3 p-3 card border-warning border-opacity-75 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-sm" style="background: rgba(234, 179, 8, 0.08); border-radius: 12px;">
            <div>
              <div class="fw-bold text-ink d-flex align-items-center gap-2 mb-1">
                <i class="bi bi-award-fill text-warning fs-5"></i>
                Week ${weekNumber} All Tasks Completed! Milestone Test Ready
              </div>
              <div class="text-muted small">
                Pass the 30-minute server test (10 questions, &ge; 70% threshold) to stamp verified skill evidence into your ledger and advance to Week ${weekNumber + 1}.
              </div>
            </div>
            <button class="btn cp-btn-primary px-4 py-2 btn-open-test flex-shrink-0" data-week="${weekNumber}">
              <i class="bi bi-pencil-square me-1"></i> Take Milestone Test (30 Mins)
            </button>
          </div>
        `;
      } else if (isPassed) {
        milestoneActionHtml = `
          <div class="mt-3 p-3 card border-success border-opacity-50 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2" style="background: rgba(34, 197, 94, 0.06); border-radius: 10px;">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-patch-check-fill text-success fs-4"></i>
              <div>
                <div class="fw-semibold text-ink">
                  Milestone Verified & Skill Stamped (${wp.testScore}/10 &middot; ${wp.testPercent}%)
                </div>
                <div class="text-muted small">
                  Skill currency active for 180 days. Passed on ${wp.passedAt ? new Date(wp.passedAt).toLocaleDateString() : 'Active'}.
                </div>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <button class="btn btn-outline-secondary btn-sm px-3 btn-review-test" data-week="${weekNumber}">
                <i class="bi bi-clipboard-check me-1"></i> View Results
              </button>
              <button class="btn btn-outline-success btn-sm px-3 btn-open-test" data-week="${weekNumber}">
                <i class="bi bi-arrow-repeat me-1"></i> Retake Practice
              </button>
            </div>
          </div>
        `;
      } else if (isInProgress) {
        milestoneActionHtml = `
          <div class="mt-3 d-flex align-items-center justify-content-between pt-2 border-top border-line flex-wrap gap-2">
            <div class="text-muted small">
              ${isAdminUser ? '<span class="text-success fw-semibold"><i class="bi bi-unlock-fill me-1"></i> Fast-Track Access:</span> All tasks and milestone tests are unlocked for evaluation.' : (completedCount === tasks.length 
                ? 'All tasks checked! Take milestone test to advance to the next week.' 
                : `${completedCount} of ${tasks.length} tasks finished. Complete all tasks or verify skill early when ready.`)}
            </div>
            <button class="btn ${isAdminUser ? 'cp-btn-primary' : 'btn-outline-primary'} btn-sm px-3 btn-open-test" data-week="${weekNumber}">
              <i class="bi bi-stopwatch me-1"></i> ${isAdminUser ? 'Launch Milestone Test' : `Milestone Test ${wp.attemptsCount ? `(${wp.attemptsCount} attempts)` : ''}`}
            </button>
          </div>
        `;
      }

      const weekCard = document.createElement('div');
      weekCard.className = `week-card card p-4 mb-4 ${statusCardClass}`;
      weekCard.id = `week-card-${weekNumber}`;

      weekCard.innerHTML = `
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 pb-3 border-bottom gap-2">
          <div class="d-flex align-items-center gap-3">
            <div class="week-badge-pill">
              ${pillContent}
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <h3 class="h5 fw-bold text-ink mb-0">Week ${weekNumber}</h3>
                ${statusBadgeHtml}
              </div>
              <p class="text-muted small mb-0 d-inline-flex align-items-center gap-1">
                ${tasks[0]?.skill ? `Mastering skill: ${window.TechLogos?.getLogoImg(tasks[0].skill.name || tasks[0].skill.displayName, { size: 15, className: 'me-1' }) || ''}<strong class="text-teal">${escapeHtml(tasks[0].skill.displayName || tasks[0].skill.name)}</strong>` : 'Core Career Competencies'}
              </p>
            </div>
          </div>
          <div class="text-md-end text-muted small">
            <span class="fw-bold text-ink">${completedCount} of ${tasks.length}</span> tasks finished
          </div>
        </div>

        <!-- Tasks List -->
        <div class="tasks-list d-flex flex-column gap-3" id="week-tasks-${weekNumber}">
          ${tasks
            .map((task) => {
              let isYouTubeUrl = false;
              if (task.resource?.url && typeof task.resource.url === 'string') {
                try {
                  const parsedU = new URL(task.resource.url, window.location.origin);
                  const h = parsedU.hostname.toLowerCase();
                  isYouTubeUrl = h === 'youtube.com' || h.endsWith('.youtube.com') || h === 'youtu.be' || h.endsWith('.youtu.be');
                } catch (_) {
                  isYouTubeUrl = false;
                }
              }
              const isVideo = Boolean(
                task.isVideoTask ||
                task.resource?.mediaType === 'video' ||
                isYouTubeUrl
              );

              let resourceBadge = '';
              // Only render non-video resources (e.g. official documentation, guides, labs)
              if (task.resource?.url && !isVideo) {
                resourceBadge = `<a href="${escapeHtml(task.resource.url)}" target="_blank" rel="noopener noreferrer" class="resource-link-btn" title="${escapeHtml(task.resource.title || 'Documentation')}">
                    <i class="bi bi-box-arrow-up-right me-1"></i>${escapeHtml(task.resource.type || 'Documentation')}
                   </a>`;
              }

              let projectLinkHtml = '';
              if (task.type === 'project' || task.title.toLowerCase().includes('project') || task.title.toLowerCase().includes('capstone')) {
                if (task.isProjectVerified && task.linkedRepoUrl) {
                  projectLinkHtml = `
                    <span class="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1 font-mono" style="font-size: 0.7rem;">
                      <i class="bi bi-github"></i> Project Verified ✓
                    </span>
                    <a href="${escapeHtml(task.linkedRepoUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.72rem; height: 24px; line-height: 22px;">
                      <i class="bi bi-box-arrow-up-right me-1"></i>Repo
                    </a>
                  `;
                } else {
                  projectLinkHtml = `
                    <button type="button" class="btn btn-outline-primary btn-sm py-0 px-2 btn-link-repo d-inline-flex align-items-center gap-1" data-task-id="${task._id}" data-task-title="${escapeHtml(task.title)}" ${isLocked ? 'disabled' : ''} style="font-size: 0.72rem; height: 26px; line-height: 24px;">
                      <i class="bi bi-github"></i> Link Project Repo
                    </button>
                  `;
                }
              }

              const isTaskDone = task.completed || isGraduated;
              const isCheckboxDisabled = isLocked || isGraduated;
              return `
                <div class="task-item d-flex align-items-start gap-3 ${isTaskDone ? 'is-completed' : ''}" data-task-id="${task._id}">
                  <div class="task-checkbox-wrap pt-1">
                    <input
                      type="checkbox"
                      class="form-check-input task-checkbox-input"
                      ${isTaskDone ? 'checked' : ''}
                      ${isCheckboxDisabled ? 'disabled' : ''}
                      data-task-id="${task._id}"
                    />
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                      <h4 class="h6 fw-semibold text-ink mb-0 task-title">
                        ${escapeHtml(task.title)}
                      </h4>
                      <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span class="atlas-badge">
                          ${escapeHtml(task.type)}
                        </span>
                        <span class="badge cp-tag">
                          ${escapeHtml(task.priority)}
                        </span>
                        <span class="badge cp-tag font-mono">
                          <i class="bi bi-clock me-1"></i>${task.estimatedHours || 2}h
                        </span>
                        ${resourceBadge}
                        ${projectLinkHtml}
                      </div>
                    </div>
                    <p class="text-muted small mb-0">
                      ${escapeHtml(task.description)}
                    </p>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>

        <!-- Milestone Status Action Box -->
        ${milestoneActionHtml}

        <!-- Collegiate Weekly Assignment Action Box (Plan 46) -->
        <div class="mt-3 p-3 card border border-primary border-opacity-25 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-sm" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.03)); border-radius: 12px;">
          <div class="d-flex align-items-center gap-3">
            <div class="p-2 rounded-3 text-primary" style="background: rgba(99, 102, 241, 0.12);">
              <i class="bi bi-file-earmark-code fs-4"></i>
            </div>
            <div>
              <div class="fw-bold text-ink d-flex align-items-center gap-2 mb-0.5">
                Week ${weekNumber} Collegiate Assignment
                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 font-monospace">10.0 Marks</span>
                <span class="badge bg-warning bg-opacity-10 text-warning font-monospace" style="font-size: 0.7rem;">40% CMS Weight</span>
              </div>
              <div class="text-muted small">
                Submit compiled solution PDF (Parts A + B). Dual-evaluated with Gemini Multimodal AI and team commit reviews.
              </div>
            </div>
          </div>
          <button type="button" class="btn cp-btn-primary btn-sm px-3 py-2 flex-shrink-0" onclick="window.assignmentModal && window.assignmentModal.open({ weekNumber: ${weekNumber} })">
            <i class="bi bi-cloud-arrow-up me-1"></i> Open Assignment
          </button>
        </div>
      `;

      weeksContainer.appendChild(weekCard);
    });

    // Attach Checkbox event listeners
    document.querySelectorAll('.task-checkbox-input').forEach((checkbox) => {
      checkbox.addEventListener('change', async (e) => {
        const taskId = e.target.getAttribute('data-task-id');
        const isChecked = e.target.checked;
        const taskItem = e.target.closest('.task-item');

        if (taskItem) {
          taskItem.classList.toggle('is-completed', isChecked);
        }

        try {
          const res = await window.API.patch(`/roadmaps/tasks/${taskId}/toggle`, {}, { auth: true });

          if (res.success && res.data) {
            const { task, roadmap } = res.data;

            const localTask = currentTasks.find((t) => String(t._id || t.id) === String(taskId));
            if (localTask) {
              localTask.completed = task.completed;
            }

            currentRoadmap.completedTasksCount = roadmap.completedTasksCount;
            currentRoadmap.progressPercentage = roadmap.progressPercentage;
            if (roadmap.status) {
              currentRoadmap.status = roadmap.status;
            }
            if (roadmap.weekProgress) {
              currentRoadmap.weekProgress = roadmap.weekProgress;
            }

            // Real-time track switcher arrays update
            const currentId = String(currentRoadmap.id || currentRoadmap._id || '');
            if (roadmap.status === 'completed' || roadmap.progressPercentage >= 100) {
              // Move from active list to completed list in memory in real time
              allActiveRoadmaps = (allActiveRoadmaps || []).filter(r => {
                const rId = String(r.id || r._id || '');
                return rId && rId !== currentId;
              });
              const existsInComp = (allCompletedRoadmaps || []).some(r => {
                const rId = String(r.id || r._id || '');
                return rId && rId === currentId;
              });
              if (!existsInComp) {
                allCompletedRoadmaps.unshift({
                  ...currentRoadmap,
                  status: 'completed',
                  progressPercentage: 100,
                });
              }
            } else {
              if (Array.isArray(allActiveRoadmaps)) {
                allActiveRoadmaps.forEach((r) => {
                  const rId = String(r.id || r._id || '');
                  if (rId === currentId || allActiveRoadmaps.length === 1) {
                    r.progressPercentage = roadmap.progressPercentage;
                    r.completedTasks = roadmap.completedTasksCount;
                    if (roadmap.totalTasksCount) r.totalTasks = roadmap.totalTasksCount;
                  }
                });
              }
            }

            updateProgressUI(roadmap.progressPercentage, roadmap.completedTasksCount, roadmap.totalTasksCount);
            renderTrackSwitcher();
            renderRoadmap();
            showAlert(`Task marked ${task.completed ? 'complete' : 'incomplete'}.`, 'success');
          } else {
            e.target.checked = !isChecked;
            if (taskItem) taskItem.classList.toggle('is-completed', !isChecked);
            showAlert(res.message || 'Failed to toggle task completion.');
          }
        } catch (err) {
          e.target.checked = !isChecked;
          if (taskItem) taskItem.classList.toggle('is-completed', !isChecked);
          showAlert(err.message || 'Error updating task.');
        }
      });
    });

    // Attach Milestone Test button listeners
    document.querySelectorAll('.btn-open-test').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const weekNum = parseInt(btn.getAttribute('data-week'), 10);
        openWeeklyTestModal(weekNum);
      });
    });

    // Attach Review Test Results button listeners
    document.querySelectorAll('.btn-review-test').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const weekNum = parseInt(btn.getAttribute('data-week'), 10);
        openWeeklyTestStatus(weekNum);
      });
    });

    // Attach Link Project Repo event listeners
    document.querySelectorAll('.btn-link-repo').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task-id');
        const taskTitle = btn.getAttribute('data-task-title');
        const repoUrl = prompt(`Enter GitHub Repository URL to verify "${taskTitle}":\n(e.g., https://github.com/username/project)`);
        if (!repoUrl) return;

        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Verifying...`;

        try {
          const res = await window.API.post(`/roadmaps/tasks/${taskId}/link-repo`, { repoUrl }, { auth: true });
          if (res.success) {
            showAlert(res.message || 'Project verified successfully!', 'success');
            loadRoadmap();
          } else {
            showAlert(res.message || 'Could not verify project repository.', 'danger');
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-github"></i> Link Project Repo`;
          }
        } catch (err) {
          showAlert(err.message || 'Failed to verify project.', 'danger');
          btn.disabled = false;
          btn.innerHTML = `<i class="bi bi-github"></i> Link Project Repo`;
        }
      });
    });
  };

  // ==========================================================================
  // Milestone Weekly Test Runner (30-Minute Server Clock, 70% Pass Threshold)
  // ==========================================================================
  let activeAttempt = null;
  let timerCountdownInterval = null;
  let currentDeadlineMs = 0;
  let testAnswersMap = {};
  let antiCheatLock = null;
  const weeklyTestModalEl = document.getElementById('weeklyTestModal');
  let bsTestModal = null;
  if (weeklyTestModalEl && window.bootstrap?.Modal) {
    bsTestModal = new bootstrap.Modal(weeklyTestModalEl);
  }

  const openWeeklyTestModal = async (weekNumber, forceFresh = false) => {
    if (!currentRoadmap?._id) return;

    // Reset Modal UI
    document.getElementById('testActiveView').classList.remove('d-none');
    document.getElementById('testActiveButtons').classList.remove('d-none');
    document.getElementById('testResultView').classList.add('d-none');
    document.getElementById('testResultButtons').classList.add('d-none');
    document.getElementById('testWeekBadge').textContent = `Week ${weekNumber}`;
    document.getElementById('weeklyTestModalLabel').textContent = `Week ${weekNumber} Milestone Verification`;
    document.getElementById('testTimerText').textContent = '30:00';
    document.getElementById('testAnsweredCount').textContent = '0';

    const resumedBanner = document.getElementById('testResumedBanner');
    if (resumedBanner) resumedBanner.classList.add('d-none');
    const btnResetHeader = document.getElementById('btnResetWeeklyTest');
    if (btnResetHeader) btnResetHeader.classList.add('d-none');

    const testStrikesEl = document.getElementById('testStrikesCount');
    const testStrikesBadge = document.getElementById('testStrikesBadge');
    if (testStrikesEl) testStrikesEl.textContent = '0';
    if (testStrikesBadge) {
      testStrikesBadge.className = 'milestone-chip-strikes strikes-clean';
      testStrikesBadge.innerHTML = `<i class="bi bi-shield-check me-1"></i>Strikes: <strong id="testStrikesCount">0</strong>/3`;
    }

    const testTimerBadgeEl = document.getElementById('testTimerBadge');
    if (testTimerBadgeEl) {
      testTimerBadgeEl.classList.remove('is-urgent', 'animate-pulse', 'is-penalty');
    }

    document.getElementById('testQuestionsContainer').innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-teal mb-3" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
        <p class="text-ink fw-semibold mb-1">${forceFresh ? 'Generating Fresh Topic-Aligned Questions...' : 'Curating Milestone Assessment...'}</p>
        <p class="text-muted small mb-0">10 verified topic questions &middot; 30-minute server clock</p>
      </div>
    `;
    document.getElementById('btnSubmitMilestoneTest').disabled = true;

    if (bsTestModal) bsTestModal.show();

    try {
      const res = await window.API.post(`/roadmaps/${currentRoadmap._id}/weeks/${weekNumber}/test/start`, { fresh: forceFresh }, { auth: true });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Could not initiate weekly milestone test.');
      }

      activeAttempt = res.data;
      testAnswersMap = {};
      if (Array.isArray(activeAttempt.questions)) {
        activeAttempt.questions.forEach((q) => {
          if (q.selectedIndex !== undefined && q.selectedIndex !== null && q.selectedIndex >= 0) {
            testAnswersMap[q.questionId] = q.selectedIndex;
          }
        });
      }

      if (res.data.resumed && resumedBanner) {
        resumedBanner.classList.remove('d-none');
      }
      if (btnResetHeader) {
        btnResetHeader.classList.remove('d-none');
        btnResetHeader.onclick = () => {
          if (confirm('Regenerate 10 completely fresh questions for this milestone? Your current answers will be reset.')) {
            openWeeklyTestModal(weekNumber, true);
          }
        };
      }
      const btnResumedReset = document.getElementById('btnResumedReset');
      if (btnResumedReset) {
        btnResumedReset.onclick = () => {
          openWeeklyTestModal(weekNumber, true);
        };
      }

      renderActiveQuestions(activeAttempt.questions);
      startServerCountdown(activeAttempt.deadline);
      document.getElementById('btnSubmitMilestoneTest').disabled = false;

      // Arm AntiCheatLock for strict milestone proctoring
      if (window.AntiCheatLock) {
        if (antiCheatLock) antiCheatLock.disarm();
        antiCheatLock = new window.AntiCheatLock({
          attemptId: activeAttempt.attemptId,
          roadmapId: currentRoadmap._id,
          weekNumber: weekNumber,
          violationEndpoint: '/roadmaps/test/violation',
          disqualifyEndpoint: '/roadmaps/test/disqualify',
          strikePenalties: [120, 180],
          onStrike: (strikeNumber, count) => {
            const countEl = document.getElementById('testStrikesCount');
            const badgeEl = document.getElementById('testStrikesBadge');
            if (countEl) countEl.textContent = count;
            if (badgeEl) {
              badgeEl.classList.remove('strikes-clean', 'strikes-warning', 'strikes-danger');
              if (count === 1) {
                badgeEl.classList.add('strikes-warning');
                badgeEl.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i>Strikes: <strong id="testStrikesCount">1</strong>/3`;
              } else if (count >= 2) {
                badgeEl.classList.add('strikes-danger');
                badgeEl.innerHTML = `<i class="bi bi-shield-x me-1"></i>Strikes: <strong id="testStrikesCount">${count}</strong>/3`;
              }
            }
          },
          onDeductTime: (penaltySeconds) => {
            currentDeadlineMs -= penaltySeconds * 1000;
            const timerBadgeEl = document.getElementById('testTimerBadge');
            if (timerBadgeEl) {
              timerBadgeEl.classList.add('is-penalty');
              setTimeout(() => {
                timerBadgeEl.classList.remove('is-penalty');
              }, 1500);
            }
          },
          onLockout: (reason) => {
            if (timerCountdownInterval) clearInterval(timerCountdownInterval);
            const container = document.getElementById('testQuestionsContainer');
            if (container) {
              container.innerHTML = `
                <div class="alert alert-danger p-4 text-center my-4" style="border-radius: 12px;">
                  <div class="display-5 mb-2">🚫</div>
                  <h4 class="fw-bold text-danger mb-1">Session Terminated for Cheating</h4>
                  <p class="small text-muted mb-3">3 anti-cheating strikes recorded. Your questions have been wiped, score set to 0%, and a strict 24-hour retake lockout has been applied to Week ${weekNumber}.</p>
                  <button type="button" class="btn btn-outline-danger btn-sm px-4" data-bs-dismiss="modal" onclick="window.location.reload()">Return to Roadmap</button>
                </div>
              `;
            }
            renderTestResultView({
              score: 0,
              total: activeAttempt?.questions?.length || 10,
              percent: 0,
              passed: false,
              missedTopics: ['Session Disqualified for Proctoring Violations (3 Strikes)'],
              status: 'disqualified_cheating'
            });
            if (antiCheatLock) {
              antiCheatLock.disarm();
              antiCheatLock.exitFullscreen().catch(() => {});
            }
            loadRoadmap();
          }
        });
        antiCheatLock.arm();
        antiCheatLock.requestFullscreen().catch(() => {});
      }
    } catch (err) {
      if (antiCheatLock) antiCheatLock.disarm();
      showAlert(err.message || 'Failed to start weekly milestone test.', 'danger');
      if (bsTestModal) bsTestModal.hide();
      loadRoadmap();
    }
  };

  const openWeeklyTestStatus = async (weekNumber) => {
    if (!currentRoadmap?._id) return;
    try {
      const res = await window.API.get(`/roadmaps/${currentRoadmap._id}/weeks/${weekNumber}/test/status`, { auth: true });
      if (res.success && res.data?.attempt) {
        if (bsTestModal) bsTestModal.show();
        renderTestResultView(res.data.attempt);
      } else {
        showAlert('No previous test attempt found for this milestone.', 'info');
      }
    } catch (err) {
      showAlert(err.message || 'Could not load milestone test status.', 'danger');
    }
  };

  const renderActiveQuestions = (questions) => {
    const container = document.getElementById('testQuestionsContainer');
    if (!container) return;

    if (!questions || questions.length === 0) {
      container.innerHTML = '<div class="text-center text-muted py-4">No questions found for this milestone.</div>';
      return;
    }

    const alphabet = ['A', 'B', 'C', 'D', 'E', 'F'];

    container.innerHTML = questions
      .map((q, idx) => {
        const isAnswered = testAnswersMap[q.questionId] !== undefined && testAnswersMap[q.questionId] !== null;
        return `
          <div class="test-question-item ${isAnswered ? 'is-answered' : ''}" data-question-id="${escapeHtml(q.questionId)}">
            <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div class="d-flex align-items-center gap-2">
                <span class="question-pill-index">Question ${idx + 1} of ${questions.length}</span>
                <span class="question-answered-badge ${isAnswered ? 'is-visible' : ''}">
                  <i class="bi bi-check-circle-fill me-1"></i>Answered
                </span>
              </div>
              ${q.topicTag ? `<span class="question-pill-topic"><i class="bi bi-tag-fill me-1"></i>${escapeHtml(q.topicTag)}</span>` : ''}
            </div>
            <h5 class="question-prompt-text mb-3">
              ${escapeHtml(q.question)}
            </h5>
            <div class="d-flex flex-column gap-2">
              ${q.options
                .map((opt, optIdx) => {
                  const isSelected = testAnswersMap[q.questionId] === optIdx;
                  const letter = alphabet[optIdx] || String(optIdx + 1);
                  return `
                    <label class="test-option-item ${isSelected ? 'selected' : ''}" for="q_${escapeHtml(q.questionId)}_opt_${optIdx}">
                      <input 
                        type="radio" 
                        id="q_${escapeHtml(q.questionId)}_opt_${optIdx}" 
                        name="q_${escapeHtml(q.questionId)}" 
                        value="${optIdx}" 
                        data-question-id="${escapeHtml(q.questionId)}"
                        data-option-index="${optIdx}"
                        class="test-radio-input"
                        ${isSelected ? 'checked' : ''}
                      />
                      <span class="option-letter-chip">${letter}</span>
                      <span class="option-text flex-grow-1">${escapeHtml(opt)}</span>
                      <span class="option-status-dot">
                        <i class="bi bi-check-lg"></i>
                      </span>
                    </label>
                  `;
                })
                .join('')}
            </div>
          </div>
        `;
      })
      .join('');

    updateAnsweredCounter(questions.length);

    // Attach selection listener on options
    container.querySelectorAll('.test-radio-input').forEach((input) => {
      input.addEventListener('change', async (e) => {
        const qId = e.target.getAttribute('data-question-id');
        const optIdx = parseInt(e.target.getAttribute('data-option-index'), 10);
        testAnswersMap[qId] = optIdx;

        // Card styling
        const questionCard = e.target.closest('.test-question-item');
        if (questionCard) {
          questionCard.classList.add('is-answered');
          const answeredBadge = questionCard.querySelector('.question-answered-badge');
          if (answeredBadge) answeredBadge.classList.add('is-visible');
          questionCard.querySelectorAll('.test-option-item').forEach((lbl) => lbl.classList.remove('selected'));
          const activeLabel = e.target.closest('.test-option-item');
          if (activeLabel) activeLabel.classList.add('selected');
        }

        updateAnsweredCounter(questions.length);

        // Server Progressive Auto-save
        const autosaveEl = document.getElementById('testAutosaveIndicator');
        if (autosaveEl) {
          autosaveEl.innerHTML = `<span class="milestone-autosave-chip"><i class="bi bi-arrow-repeat me-1 spinner-border spinner-border-sm" style="width: 8px; height: 8px;"></i> Auto-saving...</span>`;
        }

        try {
          await window.API.post('/roadmaps/test/save-answer', {
            attemptId: activeAttempt.attemptId,
            questionId: qId,
            selectedOption: optIdx
          }, { auth: true });

          if (autosaveEl) {
            autosaveEl.innerHTML = `<span class="milestone-autosave-chip"><i class="bi bi-cloud-check text-success me-1"></i> Auto-saved to server</span>`;
          }
        } catch (err) {
          if (autosaveEl) {
            autosaveEl.innerHTML = `<span class="milestone-autosave-chip"><i class="bi bi-cloud-check text-success me-1"></i> Auto-saved to server</span>`;
          }
        }
      });
    });
  };

  const updateAnsweredCounter = (totalCount) => {
    const countEl = document.getElementById('testAnsweredCount');
    const totalEl = document.getElementById('testTotalCount');
    const pctEl = document.getElementById('testProgressPercentBadge');
    const fillEl = document.getElementById('testProgressBarFill');
    const submitBtn = document.getElementById('btnSubmitMilestoneTest');

    const total = totalCount || activeAttempt?.questions?.length || 10;
    const answered = Object.keys(testAnswersMap).length;
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

    if (countEl) countEl.textContent = answered;
    if (totalEl) totalEl.textContent = total;
    if (pctEl) {
      pctEl.textContent = `${pct}%`;
      if (pct === 100) {
        pctEl.className = 'milestone-progress-pill completed';
      } else {
        pctEl.className = 'milestone-progress-pill';
      }
    }
    if (fillEl) {
      fillEl.style.width = `${pct}%`;
      if (pct === 100) {
        fillEl.classList.add('bg-success');
      } else {
        fillEl.classList.remove('bg-success');
      }
    }
    if (submitBtn) {
      if (answered === total && !submitBtn.disabled) {
        submitBtn.classList.add('pulse-ready');
      } else {
        submitBtn.classList.remove('pulse-ready');
      }
    }
  };

  const startServerCountdown = (deadlineIso) => {
    if (timerCountdownInterval) clearInterval(timerCountdownInterval);

    const timerTextEl = document.getElementById('testTimerText');
    const timerBadgeEl = document.getElementById('testTimerBadge');
    currentDeadlineMs = new Date(deadlineIso).getTime();

    const updateTimer = () => {
      const remainingMs = currentDeadlineMs - Date.now();
      if (remainingMs <= 0) {
        if (timerCountdownInterval) clearInterval(timerCountdownInterval);
        if (timerTextEl) timerTextEl.textContent = '00:00';
        // Auto-submit on server deadline
        submitActiveTest(true);
        return;
      }

      const totalSeconds = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      if (timerTextEl) timerTextEl.textContent = formatted;

      if (timerBadgeEl) {
        if (minutes < 5) {
          timerBadgeEl.classList.add('is-urgent', 'animate-pulse');
        } else {
          timerBadgeEl.classList.remove('is-urgent', 'animate-pulse');
        }
      }
    };

    updateTimer();
    timerCountdownInterval = setInterval(updateTimer, 1000);
  };

  const submitActiveTest = async (isAutoSubmit = false) => {
    if (!activeAttempt?.attemptId) return;

    const totalQuestions = activeAttempt?.questions?.length || 10;
    const answeredCount = Object.keys(testAnswersMap).length;

    if (!isAutoSubmit && answeredCount < totalQuestions) {
      if (antiCheatLock) antiCheatLock.isExiting = true;
      const proceed = confirm(`You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to submit for grading?`);
      if (!proceed) {
        if (antiCheatLock) antiCheatLock.isExiting = false;
        return;
      }
    }

    if (timerCountdownInterval) clearInterval(timerCountdownInterval);
    if (antiCheatLock) {
      antiCheatLock.disarm();
      antiCheatLock.exitFullscreen().catch(() => {});
    }

    const submitBtn = document.getElementById('btnSubmitMilestoneTest');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Grading...`;
    }

    // Build answers payload: [{ questionId, selectedOption }]
    const answersPayload = Object.entries(testAnswersMap).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption
    }));

    try {
      const res = await window.API.post('/roadmaps/test/submit', {
        attemptId: activeAttempt.attemptId,
        answers: answersPayload
      }, { auth: true });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to grade milestone test.');
      }

      renderTestResultView(res.data);
    } catch (err) {
      showAlert(err.message || 'Error submitting milestone test.', 'danger');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="bi bi-send-check me-1"></i> Submit & Grade`;
      }
    }
  };

  const renderTestResultView = (result) => {
    document.getElementById('testActiveView').classList.add('d-none');
    document.getElementById('testActiveButtons').classList.add('d-none');
    document.getElementById('testResultView').classList.remove('d-none');
    document.getElementById('testResultButtons').classList.remove('d-none');

    const { score, total, percent, passed, missedTopics, status } = result;

    document.getElementById('testResultScore').textContent = `${score} / ${total || 10}`;
    const percentEl = document.getElementById('testResultPercent');
    percentEl.textContent = `${percent}%`;

    const iconEl = document.getElementById('testResultIcon');
    const titleEl = document.getElementById('testResultTitle');
    const subtitleEl = document.getElementById('testResultSubtitle');
    const missedBox = document.getElementById('testMissedTopicsBox');
    const missedList = document.getElementById('testMissedTopicsList');
    const passedBox = document.getElementById('testPassedDetailsBox');
    const retakeBtn = document.getElementById('btnRetakeTest');

    if (status === 'disqualified_cheating') {
      percentEl.className = 'h3 fw-bold text-danger mb-0';
      iconEl.innerHTML = '<span style="font-size: 3.5rem;">🚫</span>';
      titleEl.textContent = 'Assessment Terminated: Disqualified (0%)';
      subtitleEl.textContent = 'Your attempt was terminated due to repeated anti-cheating strikes (3/3). A strict 24-hour server lockout is now active on this milestone.';
      passedBox.classList.add('d-none');
      missedBox.classList.add('d-none');
      retakeBtn.classList.add('d-none');
      loadRoadmap();
      return;
    }

    if (passed) {
      percentEl.className = 'h3 fw-bold text-success mb-0';
      iconEl.innerHTML = '<i class="bi bi-patch-check-fill text-success" style="font-size: 3.5rem;"></i>';
      titleEl.innerHTML = result.roadmapGraduated ? '<span class="text-warning">🎓</span> Official Career Route Graduated!' : 'Milestone Test Passed!';
      subtitleEl.innerHTML = result.roadmapGraduated
        ? 'Congratulations! You have passed all weekly milestones and graduated from this career track! Your verified credentials have been stamped to your profile.'
        : 'You exceeded the 70% threshold. Verified skill evidence has been stamped to your ledger and the next week is now unlocked.';
      passedBox.classList.remove('d-none');
      missedBox.classList.add('d-none');
      retakeBtn.classList.add('d-none');

      // Refresh roadmap data in background so unlocked week renders immediately
      loadRoadmap();
    } else {
      percentEl.className = 'h3 fw-bold text-danger mb-0';
      iconEl.innerHTML = '<i class="bi bi-x-circle-fill text-danger" style="font-size: 3.5rem;"></i>';
      titleEl.textContent = 'Milestone Incomplete (70% Required)';
      subtitleEl.textContent = 'A minimum score of 70% is required to clear this milestone. Review the missed topics below and retake with fresh questions.';
      passedBox.classList.add('d-none');
      retakeBtn.classList.remove('d-none');

      if (missedTopics && missedTopics.length > 0) {
        missedBox.classList.remove('d-none');
        missedList.innerHTML = missedTopics
          .map((t) => `<span class="badge bg-warning-subtle text-dark border border-warning px-2 py-1">${escapeHtml(t)}</span>`)
          .join('');
      } else {
        missedBox.classList.add('d-none');
      }
    }
  };

  // Wire Modal Buttons
  const btnSubmit = document.getElementById('btnSubmitMilestoneTest');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => submitActiveTest(false));
  }

  const btnRetake = document.getElementById('btnRetakeTest');
  if (btnRetake) {
    btnRetake.addEventListener('click', () => {
      if (activeAttempt?.weekNumber) {
        openWeeklyTestModal(activeAttempt.weekNumber, true);
      }
    });
  }

  const btnCloseResult = document.getElementById('btnCloseResult');
  if (btnCloseResult) {
    btnCloseResult.addEventListener('click', () => {
      loadRoadmap();
    });
  }

  // Explicit Exit Test button click handler
  const btnCancelTest = document.getElementById('btnCancelTest');
  if (btnCancelTest) {
    btnCancelTest.addEventListener('click', () => {
      if (timerCountdownInterval) clearInterval(timerCountdownInterval);
      if (antiCheatLock) {
        antiCheatLock.disarm();
        antiCheatLock.exitFullscreen().catch(() => {});
      }
    });
  }

  if (weeklyTestModalEl) {
    // Disarm IMMEDIATELY as soon as closing starts to prevent fullscreen_exit violation
    weeklyTestModalEl.addEventListener('hide.bs.modal', () => {
      if (timerCountdownInterval) clearInterval(timerCountdownInterval);
      if (antiCheatLock) {
        antiCheatLock.disarm();
        antiCheatLock.exitFullscreen().catch(() => {});
      }
    });

    weeklyTestModalEl.addEventListener('hidden.bs.modal', () => {
      if (timerCountdownInterval) clearInterval(timerCountdownInterval);
      if (antiCheatLock) {
        antiCheatLock.disarm();
        antiCheatLock.exitFullscreen().catch(() => {});
      }
      loadRoadmap();
    });
  }

  // ── Render Decoupled 4-Rule Job Ready Card ──────────────────────
  const renderJobReadyCard = async (isCompleted) => {
    const jobReadyCard = document.getElementById('roadmapJobReadyCard');
    const jobReadyBadge = document.getElementById('jobReadyBadge');
    const readinessScoreEl = document.getElementById('jobReadyReadinessScore');
    const criteriaList = document.getElementById('jobReadyCriteriaList');
    const summaryText = document.getElementById('jobReadySummaryText');

    if (!jobReadyCard || !isCompleted) {
      if (jobReadyCard) jobReadyCard.classList.add('d-none');
      return;
    }

    try {
      const res = await window.API.get('/readiness/job-ready-check', { auth: true });
      if (!res.success || !res.data) return;

      const evalData = res.data;
      jobReadyCard.classList.remove('d-none');

      if (readinessScoreEl) {
        readinessScoreEl.textContent = `Readiness Score: ${evalData.readiness?.readinessScore || 0}%`;
      }

      if (evalData.isJobReady) {
        if (jobReadyBadge) {
          jobReadyBadge.className = 'badge bg-success text-white font-mono px-3 py-1.5';
          jobReadyBadge.innerHTML = '<i class="bi bi-fire me-1"></i> 🔥 JOB READY CERTIFIED';
        }
        if (summaryText) {
          summaryText.innerHTML = '<strong class="text-success">Congratulations!</strong> You have passed all 4 industry benchmark criteria and qualify for job placement consideration.';
        }
      } else {
        if (jobReadyBadge) {
          jobReadyBadge.className = 'badge bg-warning text-dark font-mono px-3 py-1.5';
          jobReadyBadge.innerHTML = '<i class="bi bi-lock-fill me-1"></i> 🔒 JOB READY IN PROGRESS';
        }
        if (summaryText) {
          summaryText.textContent = 'To achieve official Job Ready status, satisfy all 4 criteria below:';
        }
      }

      if (criteriaList && evalData.criteriaStatus) {
        const c = evalData.criteriaStatus;
        const items = [
          {
            label: 'Readiness Score &ge; 70%',
            passed: c.score?.passed,
            detail: `Current: ${c.score?.actual || 0}% / 70% required`,
            icon: 'bi-speedometer2',
          },
          {
            label: '&ge; 4 Role-Specific Verified Skills',
            passed: c.skills?.passed,
            detail: `Verified: ${c.skills?.actual || 0} of 4 required`,
            icon: 'bi-patch-check-fill',
          },
          {
            label: 'Roadmap Milestone Mastery &ge; 80%',
            passed: c.roadmap?.passed,
            detail: `Completed: ${c.roadmap?.actual || 100}%`,
            icon: 'bi-map-fill',
          },
          {
            label: 'Zero Expired Required Skills',
            passed: c.expiration?.passed,
            detail: c.expiration?.passed ? 'All required skill verifications active' : 'Skills require refresh',
            icon: 'bi-calendar-check-fill',
          },
        ];

        criteriaList.innerHTML = items.map(item => `
          <li class="list-group-item d-flex align-items-center justify-content-between px-2 py-2 border-0 bg-transparent">
            <div class="d-flex align-items-center gap-2">
              <i class="bi ${item.passed ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} fs-6"></i>
              <div>
                <div class="fw-semibold text-ink">${item.label}</div>
                <div class="text-muted" style="font-size: 0.72rem;">${item.detail}</div>
              </div>
            </div>
            <span class="badge ${item.passed ? 'badge-leaf' : 'badge-warning'} font-mono" style="font-size: 0.68rem;">
              ${item.passed ? 'PASSED' : 'PENDING'}
            </span>
          </li>
        `).join('');
      }
    } catch (e) {
      console.warn('Could not load Job Ready evaluation:', e.message);
    }
  };

  // Wire Job Ready Collapsible Chevron icon state
  const collapseJobReadyEl = document.getElementById('roadmapJobReadyCollapse');
  const chevronJobReadyIcon = document.getElementById('jobReadyChevronIcon');
  if (collapseJobReadyEl && chevronJobReadyIcon) {
    collapseJobReadyEl.addEventListener('show.bs.collapse', () => {
      chevronJobReadyIcon.className = 'bi bi-chevron-up ms-1';
    });
    collapseJobReadyEl.addEventListener('hide.bs.collapse', () => {
      chevronJobReadyIcon.className = 'bi bi-chevron-down ms-1';
    });
  }

  // ── Wire Abandon Route Modal (Roadmap) ──────────────────────────
  const getAbandonRoadmapModal = () => {
    const el = document.getElementById('modalAbandonRouteRoadmap');
    if (!el) return null;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      return bootstrap.Modal.getOrCreateInstance(el);
    }
    return null;
  };

  const btnConfirmAbandonRoadmap = document.getElementById('btnConfirmAbandonRouteRoadmap');
  const abandonRoadmapTitle = document.getElementById('abandonRoadmapModalTitle');
  const abandonRoadmapError = document.getElementById('abandonRoadmapErrorAlert');

  const executeAbandonRoadmap = async () => {
    try {
      if (btnConfirmAbandonRoadmap) {
        btnConfirmAbandonRoadmap.disabled = true;
        btnConfirmAbandonRoadmap.textContent = 'Abandoning Route...';
      }
      if (abandonRoadmapError) abandonRoadmapError.classList.add('d-none');

      const targetId = currentRoadmap?._id || currentRoadmap?.id;
      const res = await window.API.post(
        '/roadmaps/current/abandon',
        { roadmapId: targetId },
        { auth: true }
      );
      if (res.success) {
        const modal = getAbandonRoadmapModal();
        if (modal) modal.hide();
        showAlert(res.message || 'Route abandoned. Your verified skills and quiz attempts have been saved. Redirecting...', 'info');
        setTimeout(() => {
          window.location.href = 'recommendations.html';
        }, 600);
      } else {
        if (abandonRoadmapError) {
          abandonRoadmapError.textContent = res.message || 'Failed to abandon route.';
          abandonRoadmapError.classList.remove('d-none');
        } else {
          showAlert(res.message || 'Failed to abandon route.', 'warning');
        }
      }
    } catch (err) {
      if (abandonRoadmapError) {
        abandonRoadmapError.textContent = err.message || 'Failed to abandon route.';
        abandonRoadmapError.classList.remove('d-none');
      } else {
        showAlert(err.message || 'Failed to abandon active route.', 'danger');
      }
    } finally {
      if (btnConfirmAbandonRoadmap) {
        btnConfirmAbandonRoadmap.disabled = false;
        btnConfirmAbandonRoadmap.innerHTML = '<i class="bi bi-check-circle me-1"></i> Confirm & Abandon Route';
      }
    }
  };

  if (btnAbandon) {
    btnAbandon.addEventListener('click', () => {
      if (abandonRoadmapError) abandonRoadmapError.classList.add('d-none');
      const trackTitle = currentRoadmap?.careerSnapshot?.title || 'Current Track';
      if (abandonRoadmapTitle) {
        abandonRoadmapTitle.textContent = trackTitle;
      }
      const modal = getAbandonRoadmapModal();
      if (modal) {
        modal.show();
      } else {
        const confirmed = confirm(
          `Are you sure you want to abandon the "${trackTitle}" career route?\n\nAll verified skills, quiz attempts, and test scores remain permanently saved on your profile.`
        );
        if (confirmed) {
          executeAbandonRoadmap();
        }
      }
    });
  }

  if (btnConfirmAbandonRoadmap) {
    btnConfirmAbandonRoadmap.addEventListener('click', executeAbandonRoadmap);
  }

  // Wire Streak Nudge Email Test Button
  const btnTestStreakNudge = document.getElementById('btnTestStreakNudge');
  if (btnTestStreakNudge) {
    btnTestStreakNudge.addEventListener('click', async () => {
      try {
        btnTestStreakNudge.disabled = true;
        btnTestStreakNudge.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Dispatching...';

        const res = await window.API.post('/roadmaps/nudge/test', {}, { auth: true });
        if (res.success) {
          showAlert(res.message || '🔥 Streak alert email sent to your inbox!', 'success');
        } else {
          showAlert(res.message || 'Unable to dispatch streak nudge email.', 'warning');
        }
      } catch (err) {
        showAlert(err.message || 'Failed to dispatch streak nudge email.', 'danger');
      } finally {
        btnTestStreakNudge.disabled = false;
        btnTestStreakNudge.innerHTML = '<i class="bi bi-bell-fill me-1"></i> Streak Alert Email';
      }
    });
  }

  // Wire WhatsApp Weekly Notes PDF Dispatch Button
  const btnSendWhatsAppNotes = document.getElementById('btnSendWhatsAppNotes');
  if (btnSendWhatsAppNotes) {
    btnSendWhatsAppNotes.addEventListener('click', async () => {
      try {
        const user = window.Auth?.getCurrentUser();
        const activeWeek = currentRoadmap?.currentWeek || 1;
        let phone = user?.phone || '';

        if (!phone) {
          phone = prompt('Enter your WhatsApp phone number with country code (e.g. +91 9876543210):');
          if (!phone) return;
        }

        btnSendWhatsAppNotes.disabled = true;
        btnSendWhatsAppNotes.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Sending to WhatsApp...';

        const res = await window.API.post('/whatsapp/send-roadmap-pdf', {
          weekNumber: activeWeek,
          phone
        }, { auth: true });

        if (res.success) {
          showAlert(`📱 ${res.message || 'Weekly notes PDF sent directly to your WhatsApp!'}`, 'success');
        } else {
          showAlert(res.message || 'Could not dispatch WhatsApp notes.', 'warning');
        }
      } catch (err) {
        showAlert(err.message || 'Failed to dispatch WhatsApp notes.', 'danger');
      } finally {
        btnSendWhatsAppNotes.disabled = false;
        btnSendWhatsAppNotes.innerHTML = '<i class="bi bi-whatsapp me-1"></i> Get Week Notes on WhatsApp';
      }
    });
  }

  // Wire Direct PDF Cheatsheet Download Button
  const btnDownloadNotesPdf = document.getElementById('btnDownloadNotesPdf');
  if (btnDownloadNotesPdf) {
    btnDownloadNotesPdf.addEventListener('click', async () => {
      try {
        const activeWeek = currentRoadmap?.currentWeek || 1;
        btnDownloadNotesPdf.disabled = true;
        btnDownloadNotesPdf.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Compiling PDF...';

        const token = window.Auth?.getToken();
        const baseUrl = window.CONFIG?.API_BASE_URL || 'http://localhost:5000/api';
        const res = await fetch(`${baseUrl}/whatsapp/send-roadmap-pdf?download=true&week=${activeWeek}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ weekNumber: activeWeek, downloadOnly: true })
        });

        if (!res.ok) {
          throw new Error(`Failed to compile PDF (HTTP ${res.status})`);
        }

        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Disheera_Week_${activeWeek}_Study_Notes.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        showAlert('📄 Week study notes PDF downloaded successfully!', 'success');
      } catch (err) {
        showAlert(err.message || 'Could not download notes PDF.', 'danger');
      } finally {
        btnDownloadNotesPdf.disabled = false;
        btnDownloadNotesPdf.innerHTML = '<i class="bi bi-file-earmark-pdf-fill text-danger me-1"></i> Download Week Notes PDF';
      }
    });
  }

  // Safe string escaper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Notch Navbar Scroll Elevation
  const notchNav = document.querySelector('.cp-navbar-notch');
  if (notchNav) {
    window.addEventListener(
      'scroll',
      () => {
        if (window.scrollY > 30) {
          notchNav.classList.add('scrolled');
        } else {
          notchNav.classList.remove('scrolled');
        }
      },
      { passive: true }
    );
  }
  // ============================================================
  // DEVELOPER ROADMAP EXPLORER (nilbuild/developer-roadmap standards)
  // ============================================================
  let currentExplorerSlug = 'frontend';
  let allExplorerTracks = [];
  let currentExplorerData = null;
  let activeTypeFilter = 'all';
  let searchQuery = '';

  const personalViewEl = document.getElementById('personalRoadmapView');
  const explorerViewEl = document.getElementById('developerExplorerView');
  const btnViewPersonal = document.getElementById('btnViewPersonalRoadmap');
  const btnViewExplorer = document.getElementById('btnViewDeveloperExplorer');
  const btnExploreEmpty = document.getElementById('btnExploreRoadmapsEmpty');

  const switchRoadmapView = (targetView) => {
    if (targetView === 'explorer') {
      if (personalViewEl) personalViewEl.classList.add('d-none');
      if (explorerViewEl) explorerViewEl.classList.remove('d-none');
      if (btnViewPersonal) {
        btnViewPersonal.classList.remove('active', 'text-white');
        btnViewPersonal.classList.add('text-secondary');
      }
      if (btnViewExplorer) {
        btnViewExplorer.classList.add('active', 'text-white');
        btnViewExplorer.classList.remove('text-secondary');
      }
      if (emptyState) emptyState.classList.add('d-none');
      if (content) content.classList.remove('d-none');

      // Initialize tracks if not yet loaded
      if (allExplorerTracks.length === 0) {
        loadDeveloperExplorer();
      }
    } else {
      if (explorerViewEl) explorerViewEl.classList.add('d-none');
      if (personalViewEl) personalViewEl.classList.remove('d-none');
      if (btnViewPersonal) {
        btnViewPersonal.classList.add('active', 'text-white');
        btnViewPersonal.classList.remove('text-secondary');
      }
      if (btnViewExplorer) {
        btnViewExplorer.classList.remove('active', 'text-white');
        btnViewExplorer.classList.add('text-secondary');
      }
      if (!currentRoadmap && emptyState) {
        emptyState.classList.remove('d-none');
        if (content) content.classList.add('d-none');
      }
    }
  };

  if (btnViewPersonal) {
    btnViewPersonal.addEventListener('click', () => switchRoadmapView('personal'));
  }
  if (btnViewExplorer) {
    btnViewExplorer.addEventListener('click', () => switchRoadmapView('explorer'));
  }
  if (btnExploreEmpty) {
    btnExploreEmpty.addEventListener('click', () => switchRoadmapView('explorer'));
  }

  // Fetch all tracks and populate track selector
  const loadDeveloperExplorer = async () => {
    try {
      const baseUrl = window.API?.baseUrl || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/roadmaps/developer-explorer/tracks`);
      const json = await res.json();

      if (!json.success || !Array.isArray(json.data)) {
        return;
      }

      allExplorerTracks = json.data;
      const trackCountBadge = document.getElementById('devExplorerTrackCountBadge');
      if (trackCountBadge) {
        trackCountBadge.textContent = `${allExplorerTracks.length} Industry Tracks`;
      }

      const trackSelector = document.getElementById('devRoadmapTrackSelector');
      if (trackSelector) {
        trackSelector.innerHTML = allExplorerTracks.map((t) => {
          const isActive = t.slug === currentExplorerSlug;
          return `
            <button type="button" class="dev-track-pill ${isActive ? 'active' : ''}" data-slug="${escapeHtml(t.slug)}">
              <i class="bi ${escapeHtml(t.icon || 'bi-diagram-3')}" style="color: ${isActive ? '#FFFFFF' : escapeHtml(t.color || '#2563EB')};"></i>
              <span>${escapeHtml(t.title)}</span>
              <span class="badge ${isActive ? 'bg-white text-primary' : 'bg-light text-muted border'} font-mono ms-1" style="font-size: 0.68rem;">
                ${t.totalNodes || 0}
              </span>
            </button>
          `;
        }).join('');

        trackSelector.querySelectorAll('.dev-track-pill').forEach((pill) => {
          pill.addEventListener('click', () => {
            const slug = pill.dataset.slug;
            if (slug && slug !== currentExplorerSlug) {
              selectExplorerTrack(slug);
            }
          });
        });
      }

      // Check if URL has a specific track requested
      const urlParams = new URLSearchParams(window.location.search);
      const requestedTrack = urlParams.get('track');
      const targetSlug = (requestedTrack && allExplorerTracks.some(t => t.slug === requestedTrack))
        ? requestedTrack
        : currentExplorerSlug;

      await selectExplorerTrack(targetSlug);
    } catch (err) {
      console.error('Failed to load developer explorer tracks:', err);
    }
  };

  const selectExplorerTrack = async (slug) => {
    currentExplorerSlug = slug;

    // Update active pill styling
    const trackSelector = document.getElementById('devRoadmapTrackSelector');
    if (trackSelector) {
      trackSelector.querySelectorAll('.dev-track-pill').forEach((pill) => {
        const isActive = pill.dataset.slug === slug;
        pill.classList.toggle('active', isActive);
        const icon = pill.querySelector('i');
        if (icon) {
          const matchTrack = allExplorerTracks.find(t => t.slug === pill.dataset.slug);
          icon.style.color = isActive ? '#FFFFFF' : (matchTrack?.color || '#2563EB');
        }
      });
    }

    // Fetch track data
    try {
      const baseUrl = window.API?.baseUrl || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/roadmaps/developer-explorer/${encodeURIComponent(slug)}`);
      const json = await res.json();

      if (!json.success || !json.data) return;

      currentExplorerData = json.data;

      // Update header stat card
      const activeTitleEl = document.getElementById('devExplorerActiveTrackTitle');
      const activeStatsEl = document.getElementById('devExplorerTrackStats');
      const activeIconEl = document.getElementById('devExplorerActiveTrackIcon');

      if (activeTitleEl) activeTitleEl.textContent = currentExplorerData.title;
      if (activeStatsEl) {
        let nodeCount = 0;
        (currentExplorerData.stages || []).forEach(s => nodeCount += (s.nodes || []).length);
        activeStatsEl.textContent = `${currentExplorerData.stages?.length || 0} Sequential Stages · ${nodeCount} Topics`;
      }
      if (activeIconEl && currentExplorerData.icon) {
        activeIconEl.className = `bi ${currentExplorerData.icon} text-primary`;
      }

      renderExplorerStages();
    } catch (err) {
      console.error('Failed to fetch track data:', err);
    }
  };

  const renderExplorerStages = () => {
    const canvas = document.getElementById('devRoadmapStagesCanvas');
    const showingCountEl = document.getElementById('devRoadmapShowingCount');
    if (!canvas || !currentExplorerData) return;

    const stages = currentExplorerData.stages || [];
    let totalShownNodes = 0;
    let totalTrackNodes = 0;

    const q = (searchQuery || '').toLowerCase().trim();

    const stagesHtml = stages.map((stage, sIdx) => {
      const isLastStage = sIdx === stages.length - 1;
      const allNodesInStage = stage.nodes || [];
      totalTrackNodes += allNodesInStage.length;

      // Filter nodes
      const filteredNodes = allNodesInStage.filter((node) => {
        // Status filter
        if (activeTypeFilter !== 'all' && node.type !== activeTypeFilter) {
          return false;
        }
        // Search query
        if (q) {
          const inTitle = (node.title || '').toLowerCase().includes(q);
          const inDesc = (node.shortExplanation || '').toLowerCase().includes(q);
          const inTopics = (node.keyTopics || []).some(t => t.toLowerCase().includes(q));
          const inSkills = (node.relatedSkills || []).some(s => s.toLowerCase().includes(q));
          if (!inTitle && !inDesc && !inTopics && !inSkills) {
            return false;
          }
        }
        return true;
      });

      totalShownNodes += filteredNodes.length;

      if (filteredNodes.length === 0 && (q || activeTypeFilter !== 'all')) {
        return ''; // Don't show empty stages when filtering
      }

      const nodesCardsHtml = filteredNodes.map((node) => {
        const typeBadgeClass =
          node.type === 'core'
            ? 'bg-primary-subtle text-primary border border-primary-subtle'
            : node.type === 'recommended'
            ? 'bg-success-subtle text-success border border-success-subtle'
            : 'bg-info-subtle text-info border border-info-subtle';

        const keyTags = (node.keyTopics || []).slice(0, 3).map(
          t => `<span class="dev-node-tag-pill">${escapeHtml(t)}</span>`
        ).join(' ');

        return `
          <div class="dev-node-card ${escapeHtml(node.type)}" data-node-id="${escapeHtml(node.id)}">
            <div>
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="badge ${typeBadgeClass} font-mono" style="font-size: 0.68rem; font-weight: 700;">
                  ${escapeHtml(node.status || node.type)}
                </span>
                <i class="bi bi-box-arrow-up-right text-muted small"></i>
              </div>
              <h5 class="dev-node-title">
                <span>${escapeHtml(node.title)}</span>
              </h5>
              <p class="dev-node-desc">${escapeHtml(node.shortExplanation || '')}</p>
            </div>
            <div>
              <div class="d-flex align-items-center gap-1 flex-wrap mb-2">
                ${keyTags}
              </div>
              <div class="dev-node-action">
                <span>View Topic Guide & Resources</span>
                <i class="bi bi-arrow-right"></i>
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="dev-stage-wrapper">
          <div class="dev-stage-card">
            <div class="d-flex align-items-start gap-3 flex-wrap">
              <div class="dev-stage-badge">
                ${stage.stageNumber}
              </div>
              <div class="flex-grow-1">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <h4 class="h5 fw-bold text-ink mb-1">
                    Stage ${stage.stageNumber}: ${escapeHtml(stage.title)}
                  </h4>
                  <span class="badge bg-light text-muted border font-mono small">
                    ${filteredNodes.length} ${filteredNodes.length === 1 ? 'Topic' : 'Topics'}
                  </span>
                </div>
                <p class="text-secondary small mb-0">${escapeHtml(stage.description || '')}</p>
              </div>
            </div>

            <div class="dev-nodes-grid">
              ${nodesCardsHtml}
            </div>
          </div>
          ${!isLastStage ? '<div class="dev-stage-connector"></div>' : ''}
        </div>
      `;
    }).filter(Boolean).join('');

    if (stagesHtml.trim() === '') {
      canvas.innerHTML = `
        <div class="card p-5 text-center bg-white border border-line rounded-3">
          <i class="bi bi-search text-muted display-4 mb-2"></i>
          <h5 class="h6 fw-bold text-ink mb-1">No topics match your filter or search</h5>
          <p class="text-secondary small mb-3">Try clearing your search query or switching to "All" topics.</p>
          <div>
            <button type="button" class="btn btn-sm cp-btn-outline" id="btnResetDevRoadmapFilter">
              Reset Search & Filters
            </button>
          </div>
        </div>
      `;
      const btnReset = document.getElementById('btnResetDevRoadmapFilter');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          searchQuery = '';
          activeTypeFilter = 'all';
          const input = document.getElementById('devRoadmapSearchInput');
          if (input) input.value = '';
          const typeButtons = document.querySelectorAll('#devRoadmapTypeFilters button');
          typeButtons.forEach(b => b.classList.toggle('active', b.dataset.typeFilter === 'all'));
          renderExplorerStages();
        });
      }
    } else {
      canvas.innerHTML = stagesHtml;

      // Attach click listeners to all node cards
      canvas.querySelectorAll('.dev-node-card').forEach((card) => {
        card.addEventListener('click', () => {
          const nodeId = card.dataset.nodeId;
          if (nodeId) {
            openTopicGuideModal(nodeId);
          }
        });
      });
    }

    if (showingCountEl) {
      showingCountEl.textContent = `Showing ${totalShownNodes} of ${totalTrackNodes} topics`;
    }
  };

  // Open Topic Guide Modal
  const openTopicGuideModal = async (nodeId) => {
    try {
      const baseUrl = window.API?.baseUrl || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/roadmaps/developer-explorer/topic/${encodeURIComponent(nodeId)}`);
      const json = await res.json();

      if (!json.success || !json.data) return;

      const { node, track, stage } = json.data;

      const titleEl = document.getElementById('devRoadmapTopicModalLabel');
      const trackBadge = document.getElementById('topicModalTrackBadge');
      const stageBadge = document.getElementById('topicModalStageBadge');
      const typeBadge = document.getElementById('topicModalTypeBadge');
      const shortDescEl = document.getElementById('topicModalShortDesc');
      const explanationEl = document.getElementById('topicModalExplanation');
      const keyConceptsEl = document.getElementById('topicModalKeyConcepts');
      const resourcesListEl = document.getElementById('topicModalResourcesList');
      const skillsListEl = document.getElementById('topicModalSkillsList');
      const iconEl = document.getElementById('topicModalIcon');

      if (titleEl) titleEl.textContent = node.title;
      if (trackBadge) trackBadge.textContent = track?.title || 'Developer Roadmap';
      if (stageBadge) stageBadge.textContent = `Stage ${stage?.stageNumber || 1}`;
      if (typeBadge) {
        typeBadge.textContent = node.status || node.type;
        typeBadge.className = `badge font-mono px-2 py-1 ${
          node.type === 'core'
            ? 'bg-primary-subtle text-primary border border-primary-subtle'
            : node.type === 'recommended'
            ? 'bg-success-subtle text-success border border-success-subtle'
            : 'bg-info-subtle text-info border border-info-subtle'
        }`;
      }
      if (shortDescEl) shortDescEl.textContent = node.shortExplanation || '';
      if (explanationEl) {
        explanationEl.textContent = `${node.shortExplanation || ''} Mastering this topic forms a cornerstone competency aligned with official roadmap.sh developer standards.`;
      }
      if (iconEl && track?.icon) {
        iconEl.className = `bi ${track.icon}`;
      }

      // Populate key concepts
      if (keyConceptsEl) {
        keyConceptsEl.innerHTML = (node.keyTopics || []).map((c) => `
          <div class="col-sm-6">
            <div class="concept-check-item">
              <i class="bi bi-check-circle-fill text-success"></i>
              <span>${escapeHtml(c)}</span>
            </div>
          </div>
        `).join('');
      }

      // Populate resources
      if (resourcesListEl) {
        const resources = [];
        if (node.documentationUrl) {
          resources.push(`
            <a href="${escapeHtml(node.documentationUrl)}" target="_blank" rel="noopener noreferrer" class="resource-link-btn">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-journal-code text-primary fs-5"></i>
                <div>
                  <div class="fw-semibold text-ink">Official Documentation & Reference</div>
                  <div class="text-muted small" style="font-size: 0.75rem;">Verified technical guide & API reference</div>
                </div>
              </div>
              <i class="bi bi-box-arrow-up-right text-muted"></i>
            </a>
          `);
        }
        if (node.videoUrl) {
          resources.push(`
            <a href="${escapeHtml(node.videoUrl)}" target="_blank" rel="noopener noreferrer" class="resource-link-btn">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-youtube text-danger fs-5"></i>
                <div>
                  <div class="fw-semibold text-ink">Video Masterclass & Tutorial</div>
                  <div class="text-muted small" style="font-size: 0.75rem;">Comprehensive video breakdown on YouTube</div>
                </div>
              </div>
              <i class="bi bi-play-circle-fill text-danger"></i>
            </a>
          `);
        }
        if (node.cheatsheetUrl) {
          resources.push(`
            <a href="${escapeHtml(node.cheatsheetUrl)}" target="_blank" rel="noopener noreferrer" class="resource-link-btn">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-file-earmark-text text-teal fs-5"></i>
                <div>
                  <div class="fw-semibold text-ink">Developer Cheatsheet & Roadmap Guide</div>
                  <div class="text-muted small" style="font-size: 0.75rem;">Visual syntax guide & quick-lookup reference</div>
                </div>
              </div>
              <i class="bi bi-box-arrow-up-right text-muted"></i>
            </a>
          `);
        }
        resourcesListEl.innerHTML = resources.join('');
      }

      // Populate skills
      if (skillsListEl) {
        skillsListEl.innerHTML = (node.relatedSkills || []).map((s) => `
          <span class="badge bg-light text-secondary border font-mono">
            #${escapeHtml(s)}
          </span>
        `).join('');
      }

      // Add to focus handler
      const btnFocus = document.getElementById('btnTopicModalAddToFocus');
      if (btnFocus) {
        btnFocus.onclick = () => {
          showAlert(`🎯 Skill "${node.title}" added to your custom weekly focus list!`, 'success');
          const modalInstance = bootstrap.Modal.getInstance(document.getElementById('devRoadmapTopicModal'));
          if (modalInstance) modalInstance.hide();
        };
      }

      const modalEl = document.getElementById('devRoadmapTopicModal');
      if (modalEl && window.bootstrap?.Modal) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    } catch (err) {
      console.error('Failed to open topic guide modal:', err);
    }
  };

  // Search input with debounce
  const searchInput = document.getElementById('devRoadmapSearchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = e.target.value;
        renderExplorerStages();
      }, 200);
    });
  }

  // Type filter buttons
  const typeFilterContainer = document.getElementById('devRoadmapTypeFilters');
  if (typeFilterContainer) {
    typeFilterContainer.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        typeFilterContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTypeFilter = btn.dataset.typeFilter || 'all';
        renderExplorerStages();
      });
    });
  }

  // Check URL query params for initial view
  const initUrlParams = new URLSearchParams(window.location.search);
  if (initUrlParams.get('view') === 'explorer') {
    switchRoadmapView('explorer');
  }

  loadRoadmap();
});


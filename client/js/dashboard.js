/**
 * dashboard.js — Student Dashboard Controller
 *
 * Interacts with:
 * - GET   /api/dashboard
 * - PATCH /api/roadmaps/tasks/:taskId/toggle
 * - window.initProgressOrb() for 3D progress visualization
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Route guard
  if (!window.Auth?.isAuthenticated()) {
    window.Auth?.requireAuth();
    return;
  }

  // 2. DOM Elements
  const loadingState = document.getElementById('loadingState');
  const dashboardContent = document.getElementById('dashboardContent');
  const alertContainer = document.getElementById('alertContainer');

  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const userDegree = document.getElementById('userDegree');
  const userSkillsCount = document.getElementById('userSkillsCount');

  const activeRoadmapPace = document.getElementById('activeRoadmapPace');
  const activeCareerTitle = document.getElementById('activeCareerTitle');
  const activeCareerDesc = document.getElementById('activeCareerDesc');
  const statPercentage = document.getElementById('statPercentage');
  const statTasks = document.getElementById('statTasks');
  const statHours = document.getElementById('statHours');
  const btnGoToRoadmap = document.getElementById('btnGoToRoadmap');

  const nextActionText = document.getElementById('nextActionText');
  const nextActionBtn = document.getElementById('nextActionBtn');
  const upcomingTasksList = document.getElementById('upcomingTasksList');

  let dashboardData = null;

  const showAlert = (message, type = 'danger') => {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  // 3. Load Dashboard Data
  const loadDashboard = async () => {
    try {
      const res = await window.API.get('/dashboard', { auth: true });

      loadingState.classList.add('d-none');

      if (res.success && res.data) {
        dashboardData = res.data;
        renderDashboard();
      } else {
        showAlert(res.message || 'Unable to load dashboard data.');
      }
    } catch (err) {
      loadingState.classList.add('d-none');
      showAlert(err.message || 'Failed to fetch student dashboard telemetry.');
    }
  };

  // 4. Render Dashboard Views
  const renderDashboard = () => {
    dashboardContent.classList.remove('d-none');
    const { user, activeRoadmap, upcomingTasks, nextAction } = dashboardData;

    // Profile Card
    const nameStr = user?.name || 'Student';
    userName.textContent = nameStr;
    userAvatar.textContent = nameStr.charAt(0).toUpperCase();
    userEmail.textContent = user?.email || '';

    const degreeName = user?.education?.degree ? `${user.education.degree}` : 'Degree not specified';
    userDegree.innerHTML = `<i class="bi bi-mortarboard-fill text-warning me-1"></i> ${escapeHtml(degreeName)}`;

    const skillCount = user?.skills?.length || 0;
    userSkillsCount.innerHTML = `<i class="bi bi-tools text-info me-1"></i> ${skillCount} Skills Logged`;

    // Active Roadmap & 3D Progress Orb
    if (activeRoadmap) {
      activeCareerTitle.textContent = activeRoadmap.career?.title || 'Selected Career';
      activeCareerDesc.textContent =
        activeRoadmap.career?.shortDescription ||
        'Personalized roadmap generated to close your skill gaps.';
      activeRoadmapPace.textContent = `${activeRoadmap.durationWeeks} Weeks`;

      const pct = Math.round(activeRoadmap.progressPercentage || 0);
      statPercentage.textContent = `${pct}%`;
      statTasks.textContent = `${activeRoadmap.completedTasksCount || 0} / ${activeRoadmap.totalTasksCount || 0}`;

      // Estimated hours remaining (estimate 2 hours per incomplete task)
      const remainingTasks = (activeRoadmap.totalTasksCount || 0) - (activeRoadmap.completedTasksCount || 0);
      statHours.textContent = `~${remainingTasks * 2} hrs left`;

      btnGoToRoadmap.href = 'roadmap.html';
      btnGoToRoadmap.innerHTML = '<i class="bi bi-map-fill me-1"></i> Open Full Roadmap';

      // Initialize 3D Progress Orb
      if (window.initProgressOrb) {
        window.initProgressOrb('progress-orb', pct);
      }
    } else {
      activeCareerTitle.textContent = 'No Active Roadmap Yet';
      activeCareerDesc.textContent = 'Take your assessment and select a career to generate an AI curriculum.';
      activeRoadmapPace.textContent = 'Not Started';
      statPercentage.textContent = '0%';
      statTasks.textContent = '0 / 0';
      statHours.textContent = '0 hrs';

      btnGoToRoadmap.href = 'recommendations.html';
      btnGoToRoadmap.innerHTML = '<i class="bi bi-stars me-1"></i> Choose a Career';

      if (window.initProgressOrb) {
        window.initProgressOrb('progress-orb', 0);
      }
    }

    // Recommended Next Action
    if (nextAction) {
      nextActionText.textContent = nextAction.prompt || 'Continue your learning path';
      nextActionBtn.href = nextAction.actionUrl || 'roadmap.html';
      nextActionBtn.querySelector('span').textContent = nextAction.actionLabel || 'Proceed';
    }

    // Upcoming Incomplete Tasks
    if (upcomingTasks && upcomingTasks.length > 0) {
      upcomingTasksList.innerHTML = upcomingTasks
        .map((task) => {
          const resourceBadge = task.resource?.url
            ? `<a href="${escapeHtml(task.resource.url)}" target="_blank" rel="noopener noreferrer" class="resource-link-btn ms-2">
                <i class="bi bi-box-arrow-up-right"></i> ${escapeHtml(task.resource.type || 'Resource')}
               </a>`
            : '';

          return `
            <div class="dashboard-task-item d-flex align-items-center justify-content-between gap-3 ${task.completed ? 'is-completed' : ''}" data-task-id="${task._id}">
              <div class="d-flex align-items-center gap-3">
                <input
                  type="checkbox"
                  class="task-checkbox-input"
                  ${task.completed ? 'checked' : ''}
                  data-task-id="${task._id}"
                />
                <div>
                  <div class="fw-semibold text-white small task-title mb-0">
                    Week ${task.weekNumber}: ${escapeHtml(task.title)}
                  </div>
                  <div class="d-flex align-items-center gap-2 mt-1">
                    <span class="badge badge-type-${task.type} text-uppercase font-monospace" style="font-size: 0.6rem;">
                      ${escapeHtml(task.type)}
                    </span>
                    <span class="badge badge-priority-${task.priority}" style="font-size: 0.6rem;">
                      ${escapeHtml(task.priority)}
                    </span>
                    <span class="text-secondary" style="font-size: 0.7rem;">
                      <i class="bi bi-clock me-1"></i>${task.estimatedHours || 2}h
                    </span>
                  </div>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                ${resourceBadge}
              </div>
            </div>
          `;
        })
        .join('');

      // Wire Task Checkbox Toggles
      upcomingTasksList.querySelectorAll('.task-checkbox-input').forEach((cb) => {
        cb.addEventListener('change', async (e) => {
          const taskId = e.target.getAttribute('data-task-id');
          const isChecked = e.target.checked;
          const parentItem = e.target.closest('.dashboard-task-item');

          if (parentItem) {
            parentItem.classList.toggle('is-completed', isChecked);
          }

          try {
            const res = await window.API.patch(`/roadmaps/tasks/${taskId}/toggle`, {}, { auth: true });

            if (res.success && res.data) {
              const { roadmap } = res.data;
              // Refresh telemetry
              const pct = Math.round(roadmap.progressPercentage || 0);
              statPercentage.textContent = `${pct}%`;
              statTasks.textContent = `${roadmap.completedTasksCount} / ${roadmap.totalTasksCount}`;

              if (window.initProgressOrb) {
                window.initProgressOrb('progress-orb', pct);
              }

              showAlert('Task progress updated!', 'success');
              // Reload dashboard after a brief delay to refresh the first 5 upcoming list
              setTimeout(() => {
                loadDashboard();
              }, 800);
            } else {
              e.target.checked = !isChecked;
              if (parentItem) parentItem.classList.toggle('is-completed', !isChecked);
              showAlert(res.message || 'Failed to toggle task.');
            }
          } catch (err) {
            console.error('Toggle error:', err);
            e.target.checked = !isChecked;
            if (parentItem) parentItem.classList.toggle('is-completed', !isChecked);
            showAlert(err.message || 'Error updating task.');
          }
        });
      });
    } else {
      upcomingTasksList.innerHTML = `
        <div class="text-secondary small py-3 text-center">
          ${activeRoadmap ? '🎉 All scheduled tasks completed! Great job!' : 'No active roadmap tasks. Generate a roadmap to begin.'}
        </div>
      `;
    }
  };

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

  // Load dashboard
  loadDashboard();
});

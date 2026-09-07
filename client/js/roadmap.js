/**
 * roadmap.js — Active Roadmap Controller & Task Tracker
 *
 * Interacts with:
 * - GET   /api/roadmaps/current
 * - PATCH /api/roadmaps/tasks/:taskId/toggle
 * - window.initRoadmapPath() for 3D milestone visualization
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard check
  if (!window.Auth?.isAuthenticated()) {
    window.Auth?.requireAuth();
    return;
  }

  // 2. Elements
  const loadingState = document.getElementById('loadingState');
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

  const weeksContainer = document.getElementById('weeksContainer');

  let currentRoadmap = null;
  let currentTasks = [];

  const showAlert = (message, type = 'danger') => {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  // 3. Fetch active roadmap
  const loadRoadmap = async () => {
    try {
      const res = await window.API.get('/roadmaps/current', { auth: true });

      loadingState.classList.add('d-none');

      if (res.success && res.data?.roadmap) {
        currentRoadmap = res.data.roadmap;
        currentTasks = res.data.tasks || [];
        renderRoadmap();
      } else {
        emptyState.classList.remove('d-none');
      }
    } catch (err) {
      loadingState.classList.add('d-none');
      if (err.status === 404) {
        emptyState.classList.remove('d-none');
      } else {
        showAlert(err.message || 'Failed to load active roadmap. Please try again.');
      }
    }
  };

  // 4. Render Roadmap & Weeks
  const renderRoadmap = () => {
    content.classList.remove('d-none');

    // Header Details
    const career = currentRoadmap.career || {};
    careerTitleEl.textContent = career.title || 'Tech Career';
    if (career.shortDescription) {
      careerDescEl.textContent = career.shortDescription;
    }
    if (career.icon) {
      careerIconEl.className = `bi ${career.icon} text-info`;
    }

    durationBadgeEl.textContent = `${currentRoadmap.durationWeeks} Weeks`;
    paceBadgeEl.textContent =
      currentRoadmap.durationWeeks === 4
        ? 'Fast-track'
        : currentRoadmap.durationWeeks === 12
        ? 'Deep Dive'
        : 'Balanced Pace';

    updateProgressUI(currentRoadmap.progressPercentage, currentRoadmap.completedTasksCount, currentRoadmap.totalTasksCount);

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

    // Determine 3D Milestones data
    const weeklyMilestones = [];
    let firstIncompleteFound = false;

    Object.keys(weekMap).forEach((wNum) => {
      const weekNumber = parseInt(wNum, 10);
      const tasks = weekMap[weekNumber];
      const isCompleted = tasks.length > 0 && tasks.every((t) => t.completed);
      let isActive = false;

      if (!isCompleted && !firstIncompleteFound) {
        isActive = true;
        firstIncompleteFound = true;
      }

      const weekTitle = tasks[0]?.title ? `Module: ${tasks[0].title.split(':')[0]}` : `Week ${weekNumber}`;
      weeklyMilestones.push({
        weekNumber,
        title: weekTitle,
        isCompleted,
        isActive,
      });
    });

    // Initialize 3D Milestone Pathway
    if (window.initRoadmapPath) {
      window.initRoadmapPath('roadmap-path', weeklyMilestones);
    }

    // Render Weekly Cards in DOM
    weeksContainer.innerHTML = '';

    Object.keys(weekMap).forEach((wNum) => {
      const weekNumber = parseInt(wNum, 10);
      const tasks = weekMap[weekNumber];
      const completedCount = tasks.filter((t) => t.completed).length;
      const isCompleted = tasks.length > 0 && completedCount === tasks.length;
      const milestone = weeklyMilestones.find((m) => m.weekNumber === weekNumber);
      const isActive = milestone?.isActive;

      const weekCard = document.createElement('div');
      weekCard.className = `week-card rounded-4 p-4 mb-4 ${isActive ? 'active-week' : ''} ${isCompleted ? 'completed-week' : ''}`;
      weekCard.id = `week-card-${weekNumber}`;

      weekCard.innerHTML = `
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 pb-3 border-bottom border-secondary border-opacity-25 gap-2">
          <div class="d-flex align-items-center gap-3">
            <div class="week-badge-pill">
              ${isCompleted ? '<i class="bi bi-check2 text-white"></i>' : weekNumber}
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <h3 class="h5 fw-bold text-white mb-0">Week ${weekNumber}</h3>
                ${isActive ? '<span class="badge bg-info text-dark small fw-bold">Current Focus</span>' : ''}
                ${isCompleted ? '<span class="badge bg-success bg-opacity-25 text-success small">Completed</span>' : ''}
              </div>
              <p class="text-secondary small mb-0">
                ${tasks[0]?.skill ? `Mastering skill: <strong class="text-info">${escapeHtml(tasks[0].skill.displayName || tasks[0].skill.name)}</strong>` : 'Core Career Competencies'}
              </p>
            </div>
          </div>
          <div class="text-md-end text-secondary small">
            <span class="fw-semibold text-light">${completedCount} of ${tasks.length}</span> tasks finished
          </div>
        </div>

        <!-- Tasks List -->
        <div class="tasks-list d-flex flex-column gap-3" id="week-tasks-${weekNumber}">
          ${tasks
            .map((task) => {
              const resourceBadge = task.resource?.url
                ? `<a href="${escapeHtml(task.resource.url)}" target="_blank" rel="noopener noreferrer" class="resource-link-btn" title="${escapeHtml(task.resource.title)}">
                    <i class="bi bi-box-arrow-up-right"></i> ${escapeHtml(task.resource.type || 'Resource')}
                   </a>`
                : '';

              return `
                <div class="task-item d-flex align-items-start gap-3 ${task.completed ? 'is-completed' : ''}" data-task-id="${task._id}">
                  <div class="task-checkbox-wrap pt-1">
                    <input
                      type="checkbox"
                      class="task-checkbox-input"
                      ${task.completed ? 'checked' : ''}
                      data-task-id="${task._id}"
                    />
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-1">
                      <h4 class="h6 fw-semibold text-white mb-0 task-title">
                        ${escapeHtml(task.title)}
                      </h4>
                      <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span class="badge badge-type-${task.type} text-uppercase font-monospace" style="font-size: 0.65rem;">
                          ${escapeHtml(task.type)}
                        </span>
                        <span class="badge badge-priority-${task.priority}" style="font-size: 0.65rem;">
                          ${escapeHtml(task.priority)}
                        </span>
                        <span class="badge bg-dark border border-secondary text-secondary" style="font-size: 0.65rem;">
                          <i class="bi bi-clock me-1"></i>${task.estimatedHours || 2}h
                        </span>
                        ${resourceBadge}
                      </div>
                    </div>
                    <p class="text-secondary small mb-0">
                      ${escapeHtml(task.description)}
                    </p>
                  </div>
                </div>
              `;
            })
            .join('')}
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

        // Optimistic toggle styling
        if (taskItem) {
          taskItem.classList.toggle('is-completed', isChecked);
        }

        try {
          const res = await window.API.patch(`/roadmaps/tasks/${taskId}/toggle`, {}, { auth: true });

          if (res.success && res.data) {
            const { task, roadmap } = res.data;

            // Update in-memory tasks
            const localTask = currentTasks.find((t) => t._id === taskId);
            if (localTask) {
              localTask.completed = task.completed;
            }

            // Update overall progress bar
            updateProgressUI(roadmap.progressPercentage, roadmap.completedTasksCount, roadmap.totalTasksCount);

            // Re-render UI to update week badge statuses and 3D path
            renderRoadmap();
          } else {
            // Revert
            e.target.checked = !isChecked;
            if (taskItem) taskItem.classList.toggle('is-completed', !isChecked);
            showAlert(res.message || 'Failed to update task progress.');
          }
        } catch (err) {
          console.error('Task toggle error:', err);
          e.target.checked = !isChecked;
          if (taskItem) taskItem.classList.toggle('is-completed', !isChecked);
          showAlert(err.message || 'Error updating task progress.');
        }
      });
    });
  };

  // 5. Update Progress Counters
  const updateProgressUI = (percentage, completed, total) => {
    const pct = Math.round(percentage || 0);
    percentageEl.textContent = `${pct}%`;
    progressBarEl.style.width = `${pct}%`;
    progressBarEl.setAttribute('aria-valuenow', pct);
    tasksCounterEl.textContent = `${completed || 0} of ${total || 0} tasks completed`;
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

  // Load active roadmap
  loadRoadmap();
});

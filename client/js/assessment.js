/**
 * assessment.js — Student Profile & Skill Assessment Controller
 *
 * Handles preloading user profile, rendering interactive interest chips,
 * category-filtered skill pickers with proficiency dropdowns, and submitting
 * to PUT /api/assessment before redirecting to recommendations.html.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard page
  if (!window.Auth?.isAuthenticated()) {
    window.Auth?.requireAuth();
    return;
  }

  // 2. Constants & Data
  const ALL_INTERESTS = [
    { id: 'web development', label: 'Web Development', icon: 'bi-code-slash' },
    { id: 'app development', label: 'App Development', icon: 'bi-phone' },
    { id: 'data analysis', label: 'Data Analysis', icon: 'bi-graph-up-arrow' },
    { id: 'artificial intelligence', label: 'Artificial Intelligence', icon: 'bi-cpu' },
    { id: 'design', label: 'Creative Design & UI/UX', icon: 'bi-palette' },
    { id: 'cybersecurity', label: 'Cybersecurity', icon: 'bi-shield-shaded' },
    { id: 'problem solving', label: 'Problem Solving & Logic', icon: 'bi-lightbulb' },
    { id: 'business', label: 'Business & Tech Analytics', icon: 'bi-briefcase' },
    { id: 'gaming', label: 'Game Development & 3D', icon: 'bi-controller' },
    { id: 'cloud computing', label: 'Cloud Computing & DevOps', icon: 'bi-cloud' },
  ];

  // Comprehensive fallback skills list matching server/data/skillsData.js
  const FALLBACK_SKILLS = [
    // Frontend
    { name: 'html', displayName: 'HTML', category: 'frontend' },
    { name: 'css', displayName: 'CSS', category: 'frontend' },
    { name: 'javascript', displayName: 'JavaScript', category: 'frontend' },
    { name: 'responsive-design', displayName: 'Responsive Design', category: 'frontend' },
    { name: 'react', displayName: 'React', category: 'frontend' },
    { name: 'bootstrap', displayName: 'Bootstrap', category: 'frontend' },
    // Backend
    { name: 'node.js', displayName: 'Node.js', category: 'backend' },
    { name: 'express.js', displayName: 'Express.js', category: 'backend' },
    { name: 'rest-apis', displayName: 'REST APIs', category: 'backend' },
    { name: 'authentication', displayName: 'Authentication', category: 'backend' },
    { name: 'python', displayName: 'Python', category: 'backend' },
    // Database
    { name: 'mongodb', displayName: 'MongoDB', category: 'database' },
    { name: 'sql', displayName: 'SQL', category: 'database' },
    { name: 'mysql', displayName: 'MySQL', category: 'database' },
    { name: 'database-design', displayName: 'Database Design', category: 'database' },
    // Data
    { name: 'excel', displayName: 'Excel', category: 'data' },
    { name: 'statistics', displayName: 'Statistics', category: 'data' },
    { name: 'power-bi', displayName: 'Power BI', category: 'data' },
    { name: 'data-visualization', displayName: 'Data Visualization', category: 'data' },
    { name: 'data-cleaning', displayName: 'Data Cleaning', category: 'data' },
    // Design
    { name: 'figma', displayName: 'Figma', category: 'design' },
    { name: 'wireframing', displayName: 'Wireframing', category: 'design' },
    { name: 'prototyping', displayName: 'Prototyping', category: 'design' },
    { name: 'user-research', displayName: 'User Research', category: 'design' },
    { name: 'visual-design', displayName: 'Visual Design', category: 'design' },
    // Security
    { name: 'networking', displayName: 'Networking', category: 'security' },
    { name: 'linux', displayName: 'Linux', category: 'security' },
    { name: 'cybersecurity-fundamentals', displayName: 'Cybersecurity Fundamentals', category: 'security' },
    { name: 'ethical-hacking', displayName: 'Ethical Hacking', category: 'security' },
    { name: 'owasp-basics', displayName: 'OWASP Basics', category: 'security' },
    // Soft & Tool
    { name: 'git', displayName: 'Git', category: 'tool' },
    { name: 'github', displayName: 'GitHub', category: 'tool' },
    { name: 'problem-solving', displayName: 'Problem Solving', category: 'soft-skill' },
    { name: 'communication', displayName: 'Communication', category: 'soft-skill' },
    { name: 'teamwork', displayName: 'Teamwork', category: 'soft-skill' },
  ];

  // 3. State
  let allAvailableSkills = [...FALLBACK_SKILLS];
  const selectedInterests = new Set();
  const selectedSkillsMap = new Map(); // key: skillName, value: { name, displayName, proficiency }

  // 4. DOM Elements
  const alertContainer = document.getElementById('alertContainer');
  const interestChipsWrapper = document.getElementById('interestChipsWrapper');
  const interestCount = document.getElementById('interestCount');
  const skillsGrid = document.getElementById('skillsGrid');
  const skillSearchInput = document.getElementById('skillSearchInput');
  const skillCategoryFilter = document.getElementById('skillCategoryFilter');
  const selectedSkillsSummary = document.getElementById('selectedSkillsSummary');
  const selectedSkillsCount = document.getElementById('selectedSkillsCount');
  const clearAllSkillsBtn = document.getElementById('clearAllSkillsBtn');
  const form = document.getElementById('assessmentForm');
  const submitBtn = document.getElementById('submitAssessmentBtn');

  let currentCategoryFilter = 'all';
  let currentSearchQuery = '';

  const showAlert = (message, type = 'danger') => {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // 5. Render Interest Chips
  const renderInterests = () => {
    interestChipsWrapper.innerHTML = '';
    ALL_INTERESTS.forEach((interest) => {
      const isSelected = selectedInterests.has(interest.id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `interest-chip ${isSelected ? 'selected' : ''}`;
      chip.innerHTML = `
        <i class="bi ${interest.icon} me-1"></i>
        <span>${interest.label}</span>
      `;

      chip.addEventListener('click', () => {
        if (selectedInterests.has(interest.id)) {
          selectedInterests.delete(interest.id);
        } else {
          if (selectedInterests.size >= 10) {
            showAlert('You can select a maximum of 10 interests.', 'warning');
            return;
          }
          selectedInterests.add(interest.id);
        }
        renderInterests();
      });

      interestChipsWrapper.appendChild(chip);
    });

    interestCount.textContent = selectedInterests.size;
  };

  // 6. Render Available Skills Grid
  const renderSkillsGrid = () => {
    skillsGrid.innerHTML = '';

    const filtered = allAvailableSkills.filter((skill) => {
      // Category filter
      const matchesCategory =
        currentCategoryFilter === 'all' ||
        skill.category === currentCategoryFilter ||
        (currentCategoryFilter === 'data' && ['database', 'data'].includes(skill.category));

      // Search query
      const matchesSearch =
        !currentSearchQuery ||
        skill.displayName.toLowerCase().includes(currentSearchQuery) ||
        skill.name.toLowerCase().includes(currentSearchQuery);

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      skillsGrid.innerHTML = `
        <div class="col-12 text-center py-4 text-secondary small">
          <i class="bi bi-search me-1"></i> No matching skills found for "${escapeHtml(currentSearchQuery)}".
        </div>
      `;
      return;
    }

    filtered.forEach((skill) => {
      const isSelected = selectedSkillsMap.has(skill.name);
      const currentProficiency = isSelected ? selectedSkillsMap.get(skill.name).proficiency : 'beginner';

      const col = document.createElement('div');
      col.className = 'col-sm-6 col-lg-4';
      col.innerHTML = `
        <div class="skill-picker-card p-2 rounded-3 ${isSelected ? 'active-skill' : ''}">
          <div class="d-flex align-items-center justify-content-between gap-2">
            <div class="form-check m-0 flex-grow-1">
              <input
                class="form-check-input skill-checkbox"
                type="checkbox"
                id="skill_${skill.name}"
                ${isSelected ? 'checked' : ''}
              />
              <label class="form-check-label text-light small fw-medium text-truncate d-block" for="skill_${skill.name}" title="${skill.displayName}">
                ${skill.displayName}
              </label>
            </div>
            <select class="form-select form-select-sm skill-proficiency-select bg-dark border-secondary text-info py-0 px-2 small"
                    style="width: 110px; font-size: 0.75rem; height: 26px;"
                    ${!isSelected ? 'disabled' : ''}>
              <option value="beginner" ${currentProficiency === 'beginner' ? 'selected' : ''}>Beginner</option>
              <option value="intermediate" ${currentProficiency === 'intermediate' ? 'selected' : ''}>Intermediate</option>
              <option value="advanced" ${currentProficiency === 'advanced' ? 'selected' : ''}>Advanced</option>
            </select>
          </div>
        </div>
      `;

      // Event handlers
      const checkbox = col.querySelector('.skill-checkbox');
      const select = col.querySelector('.skill-proficiency-select');

      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (selectedSkillsMap.size >= 20) {
            e.target.checked = false;
            showAlert('You can select a maximum of 20 skills for assessment.', 'warning');
            return;
          }
          selectedSkillsMap.set(skill.name, {
            name: skill.name,
            displayName: skill.displayName,
            proficiency: select.value || 'beginner',
          });
          select.disabled = false;
        } else {
          selectedSkillsMap.delete(skill.name);
          select.disabled = true;
        }
        updateSelectedSkillsUI();
        renderSkillsGrid();
      });

      select.addEventListener('change', (e) => {
        if (selectedSkillsMap.has(skill.name)) {
          selectedSkillsMap.get(skill.name).proficiency = e.target.value;
          updateSelectedSkillsUI();
        }
      });

      skillsGrid.appendChild(col);
    });
  };

  // 7. Update Selected Skills Summary Box
  const updateSelectedSkillsUI = () => {
    selectedSkillsCount.textContent = selectedSkillsMap.size;

    if (selectedSkillsMap.size === 0) {
      selectedSkillsSummary.innerHTML = `
        <span class="text-secondary small fst-italic">No skills selected yet. Click skills above to add them.</span>
      `;
      return;
    }

    selectedSkillsSummary.innerHTML = '';
    selectedSkillsMap.forEach((skill) => {
      const pill = document.createElement('span');
      pill.className = 'badge bg-secondary bg-opacity-50 text-light border border-secondary border-opacity-50 d-inline-flex align-items-center gap-1 py-1 px-2 small';
      pill.innerHTML = `
        <span>${escapeHtml(skill.displayName)}</span>
        <span class="text-info fw-bold font-monospace" style="font-size: 0.7rem;">(${skill.proficiency.slice(0, 3)})</span>
        <i class="bi bi-x ms-1 cursor-pointer" title="Remove" style="cursor: pointer;"></i>
      `;

      pill.querySelector('.bi-x').addEventListener('click', () => {
        selectedSkillsMap.delete(skill.name);
        updateSelectedSkillsUI();
        renderSkillsGrid();
      });

      selectedSkillsSummary.appendChild(pill);
    });
  };

  // 8. Filters & Search Handlers
  skillCategoryFilter.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      skillCategoryFilter.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategoryFilter = btn.getAttribute('data-cat') || 'all';
      renderSkillsGrid();
    });
  });

  skillSearchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim().toLowerCase();
    renderSkillsGrid();
  });

  clearAllSkillsBtn.addEventListener('click', () => {
    selectedSkillsMap.clear();
    updateSelectedSkillsUI();
    renderSkillsGrid();
  });

  // 9. Preload Profile Data
  const preloadProfile = async () => {
    try {
      const response = await window.API.get('/users/me', { auth: true });
      if (response.success && response.data?.user) {
        const user = response.data.user;

        if (user.name) document.getElementById('fullName').value = user.name;
        if (user.education) {
          if (user.education.course) document.getElementById('course').value = user.education.course;
          if (user.education.branch) document.getElementById('branch').value = user.education.branch;
          if (user.education.year) document.getElementById('year').value = user.education.year;
          if (user.education.college) document.getElementById('college').value = user.education.college;
        }

        if (Array.isArray(user.interests)) {
          user.interests.forEach((i) => selectedInterests.add(String(i).toLowerCase()));
        }

        if (Array.isArray(user.skills)) {
          user.skills.forEach((s) => {
            selectedSkillsMap.set(s.name.toLowerCase(), {
              name: s.name.toLowerCase(),
              displayName: s.displayName || s.name,
              proficiency: s.proficiency || 'beginner',
            });
          });
        }

        if (Array.isArray(user.careerGoals) && user.careerGoals.length > 0) {
          document.getElementById('careerGoals').value = user.careerGoals[0] || '';
        }
      }
    } catch (err) {
      console.warn('Could not preload existing profile:', err.message);
    }

    renderInterests();
    renderSkillsGrid();
    updateSelectedSkillsUI();
  };

  // 10. Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertContainer.innerHTML = '';

    const fullName = document.getElementById('fullName').value.trim();
    const course = document.getElementById('course').value.trim();
    const branch = document.getElementById('branch').value.trim();
    const year = document.getElementById('year').value;
    const college = document.getElementById('college').value.trim();
    const goalText = document.getElementById('careerGoals').value.trim();

    // Validations
    if (!fullName) {
      showAlert('Full Name is required.');
      return;
    }

    if (!course) {
      showAlert('Degree or Course is required (e.g. BCA, B.Tech, B.Sc Computer Science).');
      return;
    }

    if (selectedInterests.size === 0) {
      showAlert('Please select at least 1 domain of interest.');
      return;
    }

    if (selectedSkillsMap.size === 0) {
      showAlert('Please select at least 1 skill with your current proficiency level.');
      return;
    }

    const payload = {
      name: fullName,
      education: {
        course,
        branch,
        year,
        college,
      },
      interests: Array.from(selectedInterests),
      skills: Array.from(selectedSkillsMap.values()),
      careerGoals: goalText ? [goalText] : [],
    };

    // Button loading state
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span>Calculating Match Scores...</span>
    `;

    try {
      const response = await window.API.put('/assessment', payload, { auth: true });

      if (response.success) {
        // Update cached user in localStorage
        if (response.data?.user) {
          window.Auth.setCurrentUser(response.data.user);
        }

        showAlert('Assessment saved! Generating your career recommendations...', 'success');

        setTimeout(() => {
          window.location.href = 'recommendations.html';
        }, 600);
      } else {
        showAlert(response.message || 'Failed to submit assessment.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;

      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const errorMsg = err.errors.map((e) => e.message).join('; ');
        showAlert(errorMsg);
      } else {
        showAlert(err.message || 'Error saving assessment. Please try again.');
      }
    }
  });

  // Initial load
  preloadProfile();
});

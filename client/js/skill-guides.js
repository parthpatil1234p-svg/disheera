/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
(() => {
  const guides = {
    react: {
      name: 'React', category: 'Frontend development',
      summary: 'React helps you build interactive websites from reusable UI components. It is widely used for dashboards, online stores, and web apps.',
      steps: ['Build a page from components and pass data with props.', 'Learn state, events, lists, and forms.', 'Fetch data and handle loading, empty, and error states.'],
      project: 'Create a searchable career directory with filters, detail cards, and saved roles.',
      resource: { label: 'React: Learn the basics', url: 'https://react.dev/learn' },
      practice: { label: 'React tutorial', url: 'https://react.dev/learn/tutorial-tic-tac-toe' },
    },
    javascript: {
      name: 'JavaScript', category: 'Programming language',
      summary: 'JavaScript powers behavior in the browser and can also run servers. Learning it gives you the foundation for frontend and full-stack development.',
      steps: ['Practice variables, functions, arrays, objects, and conditions.', 'Use the DOM and events to make a page interactive.', 'Work with promises, async/await, and JSON APIs.'],
      project: 'Build a study planner that adds tasks, filters them, and saves them between visits.',
      resource: { label: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' },
      practice: { label: 'JavaScript.info tutorial', url: 'https://javascript.info/' },
    },
    python: {
      name: 'Python', category: 'Programming language',
      summary: 'Python is a readable general-purpose language used in automation, data analysis, backend services, and machine learning.',
      steps: ['Learn values, conditions, loops, functions, and collections.', 'Read and write files; handle errors and install packages.', 'Break a larger task into modules and test the results.'],
      project: 'Write a program that reads a CSV of learning hours and prints useful weekly summaries.',
      resource: { label: 'Python official tutorial', url: 'https://docs.python.org/3/tutorial/' },
      practice: { label: 'Exercism Python track', url: 'https://exercism.org/tracks/python' },
    },
    node: {
      name: 'Node.js', category: 'Backend development',
      summary: 'Node.js runs JavaScript outside the browser. It is commonly used to build APIs, command-line tools, and real-time services.',
      steps: ['Understand modules, npm packages, and asynchronous JavaScript.', 'Create an HTTP server and build routes for an API.', 'Validate input, handle errors, and connect a database safely.'],
      project: 'Build a small REST API for a personal learning tracker with create, list, and update actions.',
      resource: { label: 'Node.js: Introduction', url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs' },
      practice: { label: 'Node.js guides', url: 'https://nodejs.org/en/learn' },
    },
    figma: {
      name: 'Figma', category: 'Product design',
      summary: 'Figma is a collaborative interface design tool. It helps teams plan screens, create reusable design systems, and test user flows before coding.',
      steps: ['Create frames and use layout grids for desktop and mobile.', 'Practice auto layout, components, variants, and styles.', 'Connect screens into a prototype and test the flow with someone.'],
      project: 'Design a mobile onboarding flow with three screens, clear actions, and a clickable prototype.',
      resource: { label: 'Figma Learn', url: 'https://help.figma.com/hc/en-us/categories/360002042553-Learn-design' },
      practice: { label: 'Figma community files', url: 'https://www.figma.com/community' },
    },
    sql: {
      name: 'SQL', category: 'Data and databases',
      summary: 'SQL lets you ask questions of structured data and change database records. It is a core skill for analytics and backend engineering.',
      steps: ['Query tables with SELECT, WHERE, and ORDER BY.', 'Combine related tables with JOIN and summarize with GROUP BY.', 'Learn constraints and write safe INSERT, UPDATE, and DELETE queries.'],
      project: 'Create a small course database and answer questions about enrollments and completion rates.',
      resource: { label: 'PostgreSQL tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html' },
      practice: { label: 'SQLBolt interactive lessons', url: 'https://sqlbolt.com/' },
    },
    aws: {
      name: 'AWS', category: 'Cloud computing',
      summary: 'Amazon Web Services provides cloud infrastructure for hosting apps, storing files, and running databases. Start with the core concepts before choosing services.',
      steps: ['Learn regions, availability zones, identity, and shared responsibility.', 'Practice with core services such as compute, storage, and networking.', 'Deploy a small app and set budgets, permissions, and monitoring.'],
      project: 'Deploy a static portfolio and document how access, hosting, and costs are controlled.',
      resource: { label: 'AWS Skill Builder', url: 'https://skillbuilder.aws/' },
      practice: { label: 'AWS getting started guides', url: 'https://docs.aws.amazon.com/getting-started/' },
    },
    git: {
      name: 'Git', category: 'Version control',
      summary: 'Git records how your code changes over time. It makes it easier to experiment, collaborate, and recover from mistakes.',
      steps: ['Practice status, add, commit, and reading a diff.', 'Create branches and merge changes back into the main line.', 'Resolve a small conflict and learn how to inspect history.'],
      project: 'Put one of your practice projects in Git and make a branch for a new feature before merging it.',
      resource: { label: 'Git: Getting started', url: 'https://git-scm.com/docs/gittutorial' },
      practice: { label: 'Git branching practice', url: 'https://learngitbranching.js.org/' },
    },
  };

  const dialog = document.getElementById('skillDetailDialog');
  const title = document.getElementById('skillDetailTitle');
  const content = document.getElementById('skillDialogContent');
  if (!dialog || !title || !content) return;

  let activeSkillId = '';
  const guideAliases = { 'node-js': 'node', nodejs: 'node', js: 'javascript' };
  const storageKey = 'careerpath-skill-learning-progress-v1';

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch (_) {
      return {};
    }
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (_) {
      // The guide remains usable when browser storage is unavailable.
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
  }

  function renderGuide(skillId, skillName = '', skillStatus = '', skillCategory = '') {
    const guide = guides[skillId] || guides[guideAliases[skillId]] || {
      name: skillName || skillId.replace(/-/g, ' '),
      category: skillCategory || 'Technology skill',
      summary: `${skillName || 'This skill'} is marked ${skillStatus.toLowerCase() || 'as part of this career'} for your top career match. Use this guide to learn the foundations, practice them, and apply them in a small project.`,
      steps: ['Find the official documentation and learn the core terms and concepts.', 'Follow a beginner tutorial and repeat each example without copying.', 'Apply what you learned in a small project, then improve it from feedback.'],
      project: `Build a small project that uses ${skillName || 'this skill'} to solve a real problem. Write down what you learned and what you would improve next.`,
      resource: { label: `Find ${skillName || 'skill'} official learning resources`, url: `https://www.google.com/search?q=${encodeURIComponent(`${skillName || skillId} official documentation beginner tutorial`)}` },
      practice: { label: `Find ${skillName || 'skill'} practice exercises`, url: `https://www.google.com/search?q=${encodeURIComponent(`${skillName || skillId} beginner practice exercises`)}` },
    };
    activeSkillId = skillId;
    title.textContent = guide.name;

    const progress = readProgress();
    const completed = Array.isArray(progress[skillId]) ? progress[skillId] : [];
    const progressPercent = Math.round((completed.length / guide.steps.length) * 100);

    content.innerHTML = `
      <p class="skill-dialog-category">${escapeHtml(guide.category)}</p>
      <p class="skill-dialog-summary">${escapeHtml(guide.summary)}</p>
      <div class="skill-dialog-section-heading">
        <h3>Learn it step by step</h3>
        <span class="skill-progress-label">${completed.length} of ${guide.steps.length} complete</span>
      </div>
      <div class="skill-progress-track" role="progressbar" aria-label="${escapeHtml(guide.name)} learning progress" aria-valuemin="0" aria-valuemax="${guide.steps.length}" aria-valuenow="${completed.length}">
        <span style="width: ${progressPercent}%"></span>
      </div>
      <ol class="skill-learning-steps">
        ${guide.steps.map((step, index) => `
          <li>
            <label>
              <input type="checkbox" data-skill-step="${index}" ${completed.includes(index) ? 'checked' : ''}>
              <span class="skill-step-number">${index + 1}</span>
              <span>${escapeHtml(step)}</span>
            </label>
          </li>
        `).join('')}
      </ol>
      <section class="skill-practice-card" aria-labelledby="skillPracticeTitle">
        <span class="skill-showcase-eyebrow">Try building</span>
        <h3 id="skillPracticeTitle">Practice project</h3>
        <p>${escapeHtml(guide.project)}</p>
      </section>
      <div class="skill-resource-links">
        <a href="${escapeHtml(guide.resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(guide.resource.label)}<i class="bi bi-arrow-up-right" aria-hidden="true"></i></a>
        <a href="${escapeHtml(guide.practice.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(guide.practice.label)}<i class="bi bi-arrow-up-right" aria-hidden="true"></i></a>
      </div>
    `;
  }

  document.addEventListener('click', (event) => {
    const card = event.target.closest('[data-skill-id]');
    if (!card) return;
    renderGuide(card.dataset.skillId, card.dataset.skillName, card.dataset.skillStatus, card.dataset.skillCategory);
    dialog.showModal();
  });

  content.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-skill-step]');
    if (!checkbox || !activeSkillId) return;

    const progress = readProgress();
    const completed = new Set(Array.isArray(progress[activeSkillId]) ? progress[activeSkillId] : []);
    const stepIndex = Number(checkbox.dataset.skillStep);
    if (checkbox.checked) completed.add(stepIndex);
    else completed.delete(stepIndex);
    progress[activeSkillId] = [...completed].sort((a, b) => a - b);
    saveProgress(progress);

    const guide = guides[activeSkillId] || { steps: content.querySelectorAll('[data-skill-step]') };
    const completeCount = progress[activeSkillId].length;
    const progressLabel = content.querySelector('.skill-progress-label');
    const progressTrack = content.querySelector('[role="progressbar"]');
    if (progressLabel) progressLabel.textContent = `${completeCount} of ${guide.steps.length} complete`;
    if (progressTrack) {
      progressTrack.setAttribute('aria-valuenow', completeCount);
      progressTrack.querySelector('span').style.width = `${Math.round((completeCount / guide.steps.length) * 100)}%`;
    }
  });

  dialog.querySelector('[data-skill-dialog-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
})();

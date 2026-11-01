/**
 * js/quiz.js - Adaptive Skill Reality-Check Controller
 *
 * Implements the 6-question dynamic difficulty micro-quiz.
 * Compares "You Said" vs "Quiz Says" and unlocks the verified credential.
 *
 * Disheera · Enterprise Platform
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check Authentication & Portal Isolation
  if (window.Auth?.isRecruiter() && !window.Auth?.isAdmin()) {
    if (!window.Auth?.requireStudent()) return;
  }
  const isAuth = Boolean(window.Auth?.isAuthenticated?.() || window.Auth?.isLoggedIn?.());

  // 2. DOM Elements
  const alertContainer = document.getElementById('quizAlertContainer');
  const skillSelectorTabs = document.getElementById('skillSelectorTabs');

  // Screens
  const screenIntro = document.getElementById('screenIntro');
  const screenQuiz = document.getElementById('screenQuiz');
  const screenVerdict = document.getElementById('screenVerdict');

  // Intro Screen Elements
  const introSkillCategory = document.getElementById('introSkillCategory');
  const introSkillTitle = document.getElementById('introSkillTitle');
  const introSkillDesc = document.getElementById('introSkillDesc');
  const introSelfRatedProficiency = document.getElementById('introSelfRatedProficiency');
  const btnStartQuiz = document.getElementById('btnStartQuiz');

  // Quiz Screen Elements
  const activeSkillBadge = document.getElementById('activeSkillBadge');
  const qCurrent = document.getElementById('qCurrent');
  const qTotal = document.getElementById('qTotal');
  const difficultyPill = document.getElementById('difficultyPill');
  const difficultyLabel = document.getElementById('difficultyLabel');
  const quizStepper = document.getElementById('quizStepper');
  const questionPrompt = document.getElementById('questionPrompt');
  const questionCode = document.getElementById('questionCode');
  const optionsContainer = document.getElementById('optionsContainer');
  const feedbackBox = document.getElementById('feedbackBox');
  const feedbackIcon = document.getElementById('feedbackIcon');
  const feedbackTitle = document.getElementById('feedbackTitle');
  const feedbackText = document.getElementById('feedbackText');
  const topicName = document.getElementById('topicName');
  const btnSubmitAnswer = document.getElementById('btnSubmitAnswer');
  const btnNextQuestion = document.getElementById('btnNextQuestion');
  const activeProviderBadge = document.getElementById('activeProviderBadge');

  // Anti-Cheating Timer & Telemetry HUD Elements (Pillar 6)
  const quizTimerBadge = document.getElementById('quizTimerBadge');
  const quizTimerSeconds = document.getElementById('quizTimerSeconds');
  const quizTimerProgressBar = document.getElementById('quizTimerProgressBar');
  const quizProctorAlert = document.getElementById('quizProctorAlert');
  const quizProctorAlertText = document.getElementById('quizProctorAlertText');

  // AI Model & Custom Key Controls
  const customSkillInput = document.getElementById('customSkillInput');
  const btnCustomSkillGo = document.getElementById('btnCustomSkillGo');
  const btnQuizClearSearch = document.getElementById('btnQuizClearSearch');
  const categoryFilterBar = document.getElementById('categoryFilterBar');
  const quizSkillCountBadge = document.getElementById('quizSkillCountBadge');
  const aiProviderSelect = document.getElementById('aiProviderSelect');
  const customApiKeyRow = document.getElementById('customApiKeyRow');
  const customApiKeyInput = document.getElementById('customApiKeyInput');
  const btnSaveCustomKey = document.getElementById('btnSaveCustomKey');

  // Verdict Screen Elements
  const verdictClaimed = document.getElementById('verdictClaimed');
  const verdictActual = document.getElementById('verdictActual');
  const verdictScore = document.getElementById('verdictScore');
  const verdictMessage = document.getElementById('verdictMessage');
  const verdictGapsSection = document.getElementById('verdictGapsSection');
  const verdictGapsList = document.getElementById('verdictGapsList');
  const verdictPassportBadge = document.getElementById('verdictPassportBadge');
  const verdictIntegrityBadge = document.getElementById('verdictIntegrityBadge');
  const verdictUnconfirmedNotice = document.getElementById('verdictUnconfirmedNotice');
  const btnQuizAnotherSkill = document.getElementById('btnQuizAnotherSkill');
  const btnRetestCurrentSkill = document.getElementById('btnRetestCurrentSkill');
  const btnRetestQuick = document.getElementById('btnRetestQuick');

  // 3. State & Skill Aliases Normalization
  const SKILL_ALIASES = {
    'nodejs': 'node.js',
    'node': 'node.js',
    'node.js': 'node.js',
    'reactjs': 'react',
    'react.js': 'react',
    'react': 'react',
    'html5': 'html',
    'html': 'html',
    'css3': 'css',
    'css': 'css',
    'js': 'javascript',
    'javascript': 'javascript',
    'py': 'python',
    'python': 'python',
    'express': 'express.js',
    'expressjs': 'express.js',
    'express.js': 'express.js',
    'golang': 'go',
    'go': 'go',
    'ts': 'typescript',
    'typescript': 'typescript',
    'postgres': 'postgresql',
    'postgresql': 'postgresql',
    'mongo': 'mongodb',
    'mongodb': 'mongodb',
    'k8s': 'kubernetes',
    'kubernetes': 'kubernetes',
    'tailwind': 'tailwind-css',
    'tailwindcss': 'tailwind-css',
    'tailwind-css': 'tailwind-css',
    'next': 'next.js',
    'nextjs': 'next.js',
    'next.js': 'next.js',
    'fastapi': 'fastapi',
    'tf': 'terraform',
    'terraform': 'terraform',
    'rest': 'rest-apis',
    'restapi': 'rest-apis',
    'rest-apis': 'rest-apis',
    'ui/ux': 'ui-ux-design',
    'ui-ux': 'ui-ux-design',
    'ui-ux-design': 'ui-ux-design'
  };

  const CANONICAL_LABELS = {
    'javascript': 'JavaScript',
    'python': 'Python',
    'sql': 'SQL',
    'react': 'React',
    'node.js': 'Node.js',
    'html': 'HTML',
    'css': 'CSS',
    'express.js': 'Express.js',
    'typescript': 'TypeScript',
    'mongodb': 'MongoDB',
    'postgresql': 'PostgreSQL',
    'docker': 'Docker',
    'git': 'Git',
    'aws': 'AWS',
    'flutter': 'Flutter',
    'go': 'Go',
    'kubernetes': 'Kubernetes',
    'tailwind-css': 'Tailwind CSS',
    'next.js': 'Next.js',
    'fastapi': 'FastAPI',
    'linux': 'Linux',
    'rest-apis': 'REST APIs',
    'redis': 'Redis',
    'terraform': 'Terraform',
    'graphql': 'GraphQL',
    'figma': 'Figma',
    'ui-ux-design': 'UI/UX Design',
    'cypress': 'Cypress',
    'jest': 'Jest',
    'pandas': 'Pandas',
    'cybersecurity-fundamentals': 'Cybersecurity Fundamentals'
  };

  const normalizeSkillSlug = (raw) => {
    const s = String(raw || '').trim().toLowerCase();
    return SKILL_ALIASES[s] || s;
  };

  const deduplicateUserSkills = (rawList) => {
    if (!Array.isArray(rawList)) return [];
    const map = new Map();
    for (const us of rawList) {
      if (!us || !us.name) continue;
      const rawName = String(us.name || '').trim().toLowerCase();
      if (!rawName || rawName.includes('@') || rawName.includes('.com') || rawName.length > 30) continue;
      const canonicalKey = normalizeSkillSlug(rawName);

      const existing = map.get(canonicalKey);
      if (!existing) {
        map.set(canonicalKey, {
          ...us,
          name: canonicalKey,
          displayName: CANONICAL_LABELS[canonicalKey] || us.displayName || capitalize(canonicalKey)
        });
      } else {
        if (us.isQuizVerified) existing.isQuizVerified = true;
        if (us.isCodeVerified) existing.isCodeVerified = true;
        if (us.verifiedProficiency) existing.verifiedProficiency = us.verifiedProficiency;
        if (us.proficiency === 'advanced' || (!existing.proficiency && us.proficiency)) {
          existing.proficiency = us.proficiency;
        }
      }
    }
    return Array.from(map.values());
  };

  const getSkillIcon = (key, category) => {
    const k = String(key || '').toLowerCase();
    const c = String(category || '').toLowerCase();
    if (k.includes('python')) return 'bi-filetype-py';
    if (k.includes('javascript') || k === 'js') return 'bi-filetype-js';
    if (k.includes('typescript') || k === 'ts') return 'bi-filetype-tsx';
    if (k === 'html') return 'bi-filetype-html';
    if (k === 'css' || k.includes('tailwind') || k.includes('bootstrap')) return 'bi-filetype-css';
    if (k.includes('react') || k.includes('next') || k.includes('vue') || k.includes('angular')) return 'bi-code-slash';
    if (k.includes('node') || k.includes('express') || k.includes('fastapi') || k.includes('django') || k.includes('spring') || k.includes('flask') || c === 'backend') return 'bi-server';
    if (k.includes('sql') || k.includes('mongo') || k.includes('postgres') || k.includes('redis') || c === 'database') return 'bi-database-fill';
    if (k.includes('docker') || k.includes('kubernetes') || k.includes('k8s') || k.includes('git') || k.includes('aws') || k.includes('azure') || k.includes('gcp') || k.includes('terraform') || k.includes('linux') || c === 'cloud' || c === 'tool') return 'bi-boxes';
    if (c === 'ai' || c === 'data' || k.includes('ml') || k.includes('tensor') || k.includes('pytorch')) return 'bi-cpu';
    if (c === 'security' || k.includes('cyber') || k.includes('crypto')) return 'bi-shield-lock-fill';
    if (c === 'mobile' || k.includes('flutter') || k.includes('android') || k.includes('ios') || k.includes('swift')) return 'bi-phone-fill';
    if (c === 'testing' || k.includes('jest') || k.includes('cypress') || k.includes('selenium')) return 'bi-check2-all';
    if (c === 'design' || k.includes('figma') || k.includes('ui-ux')) return 'bi-palette';
    return 'bi-lightning-charge-fill';
  };

  const matchesCategory = (skill, cat) => {
    if (!cat || cat === 'all') return true;
    if (cat === 'my-skills') return Boolean(skill.isUserSkill);
    const sc = String(skill.category || '').toLowerCase();
    if (cat === 'frontend') return sc === 'frontend';
    if (cat === 'backend') return sc === 'backend';
    if (cat === 'database') return sc === 'database';
    if (cat === 'devops') return sc === 'cloud' || sc === 'tool' || sc === 'devops';
    if (cat === 'ai') return sc === 'ai' || sc === 'data';
    if (cat === 'security') return sc === 'security';
    if (cat === 'mobile') return sc === 'mobile';
    if (cat === 'testing') return sc === 'testing';
    if (cat === 'design') return ['design', 'product', 'soft-skill', 'business', 'marketing', 'finance', 'gaming', 'web3'].includes(sc);
    return sc === cat;
  };

  // Curated quiz skill bank
  const BANKED_SKILL_KEYS = new Set([
    'javascript', 'python', 'sql', 'react', 'node.js', 'html', 'css',
    'typescript', 'mongodb', 'docker', 'git', 'aws', 'postgresql',
    'express.js', 'tailwind-css', 'next.js', 'fastapi', 'linux', 'rest-apis',
    'redis', 'kubernetes'
  ]);

  let allSkillsCatalog = [];
  let activeCategory = 'all';
  let searchQuery = '';
  let currentUser = window.Auth?.getCurrentUser ? window.Auth.getCurrentUser() : null;
  let userSkills = [];
  let activeSkillKey = 'javascript';
  let activeSkillInfo = null;

  let currentSessionId = null;
  let currentQuestion = null;
  let currentQuestionIdx = 1;
  let selectedOptionIdx = null;
  let isAnswerLocked = false;
  let nextQuestionData = null;
  let sessionCompleted = false;
  let sessionResultData = null;

  // Anti-Cheating & Proctoring Telemetry State (Pillars 2, 5, 6)
  const QUESTION_TIME_LIMIT = 45;
  let timerInterval = null;
  let remainingSeconds = QUESTION_TIME_LIMIT;
  let questionStartTime = Date.now();
  let tabSwitchesCount = 0;
  let proctorToastTimeout = null;
  let proctorLock = null;

  const showProctorToast = (msg) => {
    if (!quizProctorAlert || !quizProctorAlertText) return;
    quizProctorAlertText.textContent = msg;
    quizProctorAlert.classList.remove('d-none');
    if (proctorToastTimeout) clearTimeout(proctorToastTimeout);
    proctorToastTimeout = setTimeout(() => {
      quizProctorAlert.classList.add('d-none');
    }, 4500);
  };

  const stopQuestionTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const startQuestionTimer = (initialSeconds = QUESTION_TIME_LIMIT) => {
    stopQuestionTimer();
    remainingSeconds = initialSeconds;
    questionStartTime = Date.now() - (QUESTION_TIME_LIMIT - initialSeconds) * 1000;

    if (quizTimerSeconds) quizTimerSeconds.textContent = Math.max(0, remainingSeconds);
    if (quizTimerProgressBar) {
      const pct = Math.max(0, (remainingSeconds / QUESTION_TIME_LIMIT) * 100);
      quizTimerProgressBar.style.width = `${pct}%`;
    }
    if (quizTimerBadge) quizTimerBadge.className = 'quiz-timer-badge';

    timerInterval = setInterval(() => {
      remainingSeconds--;
      if (quizTimerSeconds) quizTimerSeconds.textContent = Math.max(0, remainingSeconds);
      if (quizTimerProgressBar) {
        const pct = Math.max(0, (remainingSeconds / QUESTION_TIME_LIMIT) * 100);
        quizTimerProgressBar.style.width = `${pct}%`;
      }

      if (quizTimerBadge) {
        if (remainingSeconds <= 10) {
          quizTimerBadge.className = 'quiz-timer-badge danger';
        } else if (remainingSeconds <= 15) {
          quizTimerBadge.className = 'quiz-timer-badge warning';
        } else {
          quizTimerBadge.className = 'quiz-timer-badge';
        }
      }

      if (remainingSeconds <= 0) {
        stopQuestionTimer();
        // Automatic submission on timer expiry
        if (!isAnswerLocked && btnSubmitAnswer) {
          if (selectedOptionIdx === null) {
            selectedOptionIdx = 0;
            const firstCard = optionsContainer?.querySelector('.quiz-option-card');
            if (firstCard) firstCard.classList.add('selected');
          }
          btnSubmitAnswer.disabled = false;
          btnSubmitAnswer.click();
        }
      }
    }, 1000);
  };

  const handleProctorStrike = (strikeCount, remaining, type) => {
    tabSwitchesCount = strikeCount;
    // Strict 10-second timer penalty
    remainingSeconds = Math.max(5, remainingSeconds - 10);
    if (quizTimerSeconds) quizTimerSeconds.textContent = Math.max(0, remainingSeconds);
    if (quizTimerProgressBar) {
      const pct = Math.max(0, (remainingSeconds / QUESTION_TIME_LIMIT) * 100);
      quizTimerProgressBar.style.width = `${pct}%`;
    }
    if (quizTimerBadge) {
      quizTimerBadge.classList.add('timer-penalty-flash');
      setTimeout(() => quizTimerBadge?.classList.remove('timer-penalty-flash'), 1000);
    }
    showProctorToast(`⚠️ Proctor Strike ${strikeCount}/3: -10s timer penalty applied!`);
  };

  const handleProctorLockout = async (reason) => {
    stopQuestionTimer();
    isAnswerLocked = true;
    if (btnSubmitAnswer) btnSubmitAnswer.disabled = true;
    if (btnNextQuestion) btnNextQuestion.disabled = true;
    if (questionPrompt) questionPrompt.textContent = 'Assessment Terminated: Disqualified for Cheating';
    if (questionCode) questionCode.classList.add('d-none');
    if (optionsContainer) {
      optionsContainer.innerHTML = '<div class="alert alert-danger my-3 fw-bold"><i class="bi bi-slash-circle me-2"></i>You have been disqualified for repeated cheating violations. 24-hour review lockout is active.</div>';
    }
    try {
      if (window.API) {
        await window.API.post('/quiz/disqualify', {
          skill: activeSkillKey,
          sessionId: currentSessionId,
          strikes: 3,
          reason: reason || 'REPEATED_PROCTORING_VIOLATIONS'
        }, { auth: true });
      }
    } catch (e) {
      console.warn('Disqualification sync error:', e);
    }
  };

  // 4. Utility Functions
  const showAlert = (message, type = 'danger') => {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const escapeHtml = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // 5. Load User Profile & Check Skills
  const initUserSkills = async () => {
    try {
      if (window.Auth?.isAuthenticated?.()) {
        const res = await window.API.get('/users/me', { auth: true });
        if (res.success && res.data?.user) {
          currentUser = res.data.user;
          window.Auth.setCurrentUser(currentUser);
          userSkills = deduplicateUserSkills(currentUser.skills || []);
        } else if (currentUser) {
          userSkills = deduplicateUserSkills(currentUser.skills || []);
        }
      } else if (currentUser) {
        userSkills = deduplicateUserSkills(currentUser.skills || []);
      }
    } catch (err) {
      if (currentUser) {
        userSkills = deduplicateUserSkills(currentUser.skills || []);
      }
    }

    // 5.1 Load Universal Skills Catalog (from API with fallback to DEFAULT_94_SKILLS)
    try {
      const skillsRes = await window.API.get('/quiz/skills', { auth: Boolean(window.Auth?.isAuthenticated?.()) });
      if (skillsRes.success && Array.isArray(skillsRes.data) && skillsRes.data.length > 0) {
        allSkillsCatalog = skillsRes.data;
      }
    } catch (e) {
      console.warn('Using offline skills catalog fallback:', e.message);
    }

    if (!allSkillsCatalog || allSkillsCatalog.length === 0) {
      const fallbackList = Array.isArray(window.DEFAULT_94_SKILLS) ? window.DEFAULT_94_SKILLS : [
        { key: 'javascript', name: 'javascript', displayName: 'JavaScript', category: 'frontend', description: 'Core scripting language for interactive web experiences.' },
        { key: 'python', name: 'python', displayName: 'Python', category: 'ai', description: 'Versatile language for backend, automation, and AI/ML.' },
        { key: 'sql', name: 'sql', displayName: 'SQL', category: 'database', description: 'Structured Query Language for relational database querying.' },
        { key: 'react', name: 'react', displayName: 'React', category: 'frontend', description: 'Component-based frontend library for reactive web apps.' },
        { key: 'node.js', name: 'node.js', displayName: 'Node.js', category: 'backend', description: 'V8-powered asynchronous runtime for backend microservices.' },
        { key: 'html', name: 'html', displayName: 'HTML', category: 'frontend', description: 'Semantic markup structure of modern web pages.' },
        { key: 'css', name: 'css', displayName: 'CSS', category: 'frontend', description: 'Cascading Style Sheets for responsive layout and styling.' }
      ];
      allSkillsCatalog = fallbackList.map((s) => ({
        ...s,
        key: normalizeSkillSlug(s.name || s.key),
        displayName: s.displayName || CANONICAL_LABELS[normalizeSkillSlug(s.name || s.key)] || capitalize(s.name || s.key),
        isBanked: BANKED_SKILL_KEYS.has(normalizeSkillSlug(s.name || s.key))
      }));
    }

    // Annotate catalog with current user profile skills
    const userSkillMap = new Map();
    userSkills.forEach((us) => {
      userSkillMap.set(normalizeSkillSlug(us.name), us);
    });

    allSkillsCatalog.forEach((skill) => {
      const normKey = normalizeSkillSlug(skill.key || skill.name);
      skill.key = normKey;
      skill.isBanked = skill.isBanked || BANKED_SKILL_KEYS.has(normKey);
      const uSkill = userSkillMap.get(normKey);
      if (uSkill) {
        skill.isUserSkill = true;
        skill.isVerified = Boolean(uSkill.isQuizVerified || uSkill.isCodeVerified);
        skill.verifiedProficiency = uSkill.verifiedProficiency || null;
        skill.selfRatedProficiency = uSkill.selfRatedProficiency || uSkill.proficiency || null;
        if (uSkill.nextRetakeAvailableAt && new Date() < new Date(uSkill.nextRetakeAvailableAt)) {
          skill.cooldownActive = true;
          skill.nextRetakeAvailableAt = uSkill.nextRetakeAvailableAt;
        }
      }
    });

    // Merge any user skills not yet in catalog
    userSkills.forEach((us) => {
      const slug = normalizeSkillSlug(us.name);
      if (!slug || slug.includes('@') || slug.includes('.com') || slug.length > 30) return;
      if (!allSkillsCatalog.some((s) => normalizeSkillSlug(s.key) === slug)) {
        allSkillsCatalog.push({
          key: slug,
          name: slug,
          displayName: CANONICAL_LABELS[slug] || us.displayName || capitalize(slug),
          category: 'profile',
          description: `Custom competency from your student profile.`,
          isBanked: BANKED_SKILL_KEYS.has(slug),
          isUserSkill: true,
          isVerified: Boolean(us.isQuizVerified || us.isCodeVerified),
          verifiedProficiency: us.verifiedProficiency || null,
          selfRatedProficiency: us.selfRatedProficiency || us.proficiency || null
        });
      }
    });

    // Update Counts on UI
    const countAllEl = document.getElementById('countAll');
    if (countAllEl) countAllEl.textContent = `(${allSkillsCatalog.length})`;
    const countMySkillsEl = document.getElementById('countMySkills');
    const mySkillsCount = allSkillsCatalog.filter((s) => s.isUserSkill).length;
    if (countMySkillsEl) countMySkillsEl.textContent = `(${mySkillsCount})`;

    // Determine initial skill from query params (e.g. ?skill=docker)
    const urlParams = new URLSearchParams(window.location.search);
    const rawParamSkill = (urlParams.get('skill') || '').toLowerCase().trim();
    const paramSkill = normalizeSkillSlug(rawParamSkill);

    if (paramSkill && !paramSkill.includes('@') && !paramSkill.includes('.com') && paramSkill.length <= 30) {
      let match = allSkillsCatalog.find((s) => normalizeSkillSlug(s.key) === paramSkill);
      if (!match) {
        match = {
          key: paramSkill,
          name: paramSkill,
          displayName: CANONICAL_LABELS[paramSkill] || capitalize(paramSkill),
          category: 'general',
          description: `Adaptive technical reality-check on ${CANONICAL_LABELS[paramSkill] || capitalize(paramSkill)}.`,
          isBanked: BANKED_SKILL_KEYS.has(paramSkill),
          isUserSkill: false
        };
        allSkillsCatalog.unshift(match);
      }
      activeSkillKey = match.key;
    } else {
      // Find first unverified skill user possesses
      const match = allSkillsCatalog.find((sup) => {
        if (sup.key.includes('@') || sup.key.includes('.com')) return false;
        return sup.isUserSkill && !sup.isVerified;
      });
      activeSkillKey = match ? match.key : 'javascript';
    }

    // Setup Category Filter Pills
    if (categoryFilterBar) {
      categoryFilterBar.querySelectorAll('.category-filter-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
          categoryFilterBar.querySelectorAll('.category-filter-pill').forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
          activeCategory = pill.getAttribute('data-cat') || 'all';
          renderSkillTabs();
        });
      });
    }

    // Setup Live Search Input
    if (customSkillInput) {
      customSkillInput.addEventListener('input', () => {
        searchQuery = customSkillInput.value.trim().toLowerCase();
        if (btnQuizClearSearch) {
          btnQuizClearSearch.classList.toggle('d-none', !searchQuery);
        }
        renderSkillTabs();
      });
    }

    if (btnQuizClearSearch) {
      btnQuizClearSearch.addEventListener('click', () => {
        if (customSkillInput) customSkillInput.value = '';
        searchQuery = '';
        btnQuizClearSearch.classList.add('d-none');
        renderSkillTabs();
        if (customSkillInput) customSkillInput.focus();
      });
    }

    // Setup Custom Skill Search Trigger
    const triggerCustomSkill = () => {
      const rawVal = customSkillInput?.value?.trim();
      if (!rawVal) return;
      if (rawVal.includes('@') || rawVal.includes('.com') || rawVal.includes('http')) {
        showAlert('Please enter a valid skill or technology name (e.g. Docker, Rust, AWS, Flutter).', 'warning');
        return;
      }
      const norm = normalizeSkillSlug(rawVal.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
      if (!norm || norm.length > 30) return;

      let existing = allSkillsCatalog.find((s) => normalizeSkillSlug(s.key) === norm);
      if (!existing) {
        existing = {
          key: norm,
          name: norm,
          displayName: CANONICAL_LABELS[norm] || capitalize(rawVal),
          category: 'general',
          description: `Adaptive dynamic technical verification for ${capitalize(rawVal)}.`,
          isBanked: BANKED_SKILL_KEYS.has(norm),
          isUserSkill: false
        };
        allSkillsCatalog.unshift(existing);
      }
      activeSkillKey = existing.key;
      renderSkillTabs();
      loadIntroForSkill(activeSkillKey);
      if (customSkillInput) customSkillInput.value = '';
      if (btnQuizClearSearch) btnQuizClearSearch.classList.add('d-none');
      searchQuery = '';
      window.scrollTo({ top: 120, behavior: 'smooth' });
    };

    btnCustomSkillGo?.addEventListener('click', triggerCustomSkill);
    customSkillInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerCustomSkill();
      }
    });

    // Provider select default
    if (aiProviderSelect) {
      aiProviderSelect.value = 'auto';
    }

    renderSkillTabs();
    const hasRecovered = await checkActiveSessionRecovery();
    if (!hasRecovered) {
      loadIntroForSkill(activeSkillKey);
    }
  };

  // 5.5 Active Session Recovery (Pillars 2 & 6)
  const checkActiveSessionRecovery = async () => {
    if (!window.Auth?.isAuthenticated?.()) return false;
    try {
      const activeRes = await window.API.get('/quiz/active-session', { auth: true });
      if (activeRes.success && activeRes.data) {
        const data = activeRes.data;
        currentSessionId = data.sessionId;
        activeSkillKey = data.skill;
        currentQuestionIdx = data.currentStep || data.questionIndex || 1;
        currentQuestion = data.question;
        sessionCompleted = false;

        // Transition to Quiz Screen
        screenIntro.classList.add('d-none');
        screenVerdict.classList.add('d-none');
        screenQuiz.classList.remove('d-none');

        // Arm AntiCheatLock
        if (window.AntiCheatLock) {
          if (!proctorLock) {
            proctorLock = new window.AntiCheatLock({
              sessionId: currentSessionId,
              skill: activeSkillKey,
              onStrike: handleProctorStrike,
              onLockout: handleProctorLockout
            });
          }
          proctorLock.arm({
            sessionId: currentSessionId,
            skill: activeSkillKey,
            strikeCount: data.strikeCount || 0,
            isLocked: data.isLocked || false,
            lockReason: data.lockReason || null
          });
        }

        renderActiveQuestion(data.question, data.currentDifficulty, currentQuestionIdx, data.totalSteps || 5);
        if (data.remainingSeconds !== undefined) {
          startQuestionTimer(data.remainingSeconds);
        }
        return true;
      }
    } catch (err) {
      console.warn('Could not check active quiz session recovery:', err.message);
    }
    return false;
  };

  // 6. Render Skill Switcher Tabs (with Category + Live Search Filter)
  const renderSkillTabs = () => {
    if (!skillSelectorTabs) return;

    const filtered = allSkillsCatalog.filter((item) => {
      if (!matchesCategory(item, activeCategory)) return false;
      if (searchQuery) {
        const dName = (item.displayName || '').toLowerCase();
        const key = (item.key || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        if (!dName.includes(searchQuery) && !key.includes(searchQuery) && !desc.includes(searchQuery)) {
          return false;
        }
      }
      return true;
    });

    if (quizSkillCountBadge) {
      quizSkillCountBadge.textContent = `Showing ${filtered.length} of ${allSkillsCatalog.length} skills`;
    }

    if (filtered.length === 0) {
      skillSelectorTabs.innerHTML = `
        <div class="p-3 text-muted text-center w-100 small">
          <i class="bi bi-search me-1"></i> No skills found matching "<strong>${escapeHtml(searchQuery)}</strong>".
          Press <strong>Enter</strong> or click <strong>Quiz Skill</strong> to generate adaptive AI questions!
        </div>
      `;
      return;
    }

    skillSelectorTabs.innerHTML = filtered.map((item) => {
      const uSkill = userSkills.find((s) => normalizeSkillSlug(s.name) === normalizeSkillSlug(item.key));
      const isVerified = Boolean(item.isVerified || uSkill?.isQuizVerified || uSkill?.isCodeVerified);
      const isActive = normalizeSkillSlug(item.key) === normalizeSkillSlug(activeSkillKey);
      const isBanked = Boolean(item.isBanked);
      const isCooldown = Boolean(item.cooldownActive);

      let badgeHtml = '';
      if (isVerified) {
        badgeHtml = `<span class="badge-pill-verified"><i class="bi bi-patch-check-fill text-success"></i> Verified</span>`;
      } else if (isCooldown) {
        badgeHtml = `<span class="badge bg-warning-subtle text-warning border border-warning-subtle" style="font-size: 0.65rem;"><i class="bi bi-clock-history"></i> Cooldown</span>`;
      } else if (isBanked) {
        badgeHtml = `<span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size: 0.65rem;"><i class="bi bi-lightning-charge-fill text-warning"></i> Curated</span>`;
      } else if (item.isUserSkill || uSkill) {
        badgeHtml = `<span class="badge badge-gold" style="font-size: 0.65rem;">My Profile</span>`;
      } else {
        badgeHtml = `<span class="badge bg-secondary-subtle text-secondary" style="font-size: 0.65rem;">Adaptive AI</span>`;
      }

      const icon = getSkillIcon(item.key, item.category);

      return `
        <button type="button" class="skill-select-btn ${isActive ? 'active' : ''}" data-skill="${item.key}" title="${escapeHtml(item.displayName || item.key)}">
          <i class="bi ${icon}"></i>
          <span>${escapeHtml(item.displayName || item.key)}</span>
          ${badgeHtml}
        </button>
      `;
    }).join('');

    // Attach click events
    skillSelectorTabs.querySelectorAll('.skill-select-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const skill = btn.getAttribute('data-skill');
        if (skill && skill !== activeSkillKey) {
          activeSkillKey = skill;
          renderSkillTabs();
          loadIntroForSkill(activeSkillKey);
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    });
  };

  // 7. Load Intro for Target Skill
  const loadIntroForSkill = (skillKey) => {
    const canonical = normalizeSkillSlug(skillKey);
    activeSkillInfo = allSkillsCatalog.find((s) => normalizeSkillSlug(s.key) === canonical) || {
      key: canonical,
      displayName: CANONICAL_LABELS[canonical] || capitalize(canonical),
      category: 'general',
      description: 'Adaptive dynamic technical verification.',
      isBanked: BANKED_SKILL_KEYS.has(canonical)
    };
    const userSkillObj = userSkills.find((s) => normalizeSkillSlug(s.name) === canonical);

    const selfRated = userSkillObj?.selfRatedProficiency || userSkillObj?.proficiency || activeSkillInfo.selfRatedProficiency || 'Intermediate';
    const isVerified = Boolean(userSkillObj?.isQuizVerified || activeSkillInfo.isVerified);
    const isBanked = Boolean(activeSkillInfo.isBanked);

    if (introSkillCategory) {
      const catLabel = (activeSkillInfo.category || 'TECHNICAL').toUpperCase();
      introSkillCategory.textContent = `${catLabel} ${isBanked ? '· CURATED QUESTION BANK' : '· ADAPTIVE AI PROCTORING'}`;
    }
    if (introSkillTitle) introSkillTitle.textContent = `${activeSkillInfo.displayName || activeSkillInfo.label || capitalize(canonical)} Reality-Check`;
    if (introSelfRatedProficiency) introSelfRatedProficiency.textContent = capitalize(selfRated);

    if (introSkillDesc) {
      if (isVerified) {
        introSkillDesc.innerHTML = `
          You have already verified this skill at the <strong class="text-success">${capitalize(userSkillObj?.verifiedProficiency || activeSkillInfo.verifiedProficiency || selfRated)}</strong> level.
          Taking it again will recalibrate your knowledge and refresh your reality-check score.
        `;
      } else if (userSkillObj || activeSkillInfo.isUserSkill) {
        introSkillDesc.innerHTML = `
          You self-rated this skill as <strong class="text-primary">${capitalize(selfRated)}</strong>.
          Take the skill check to confirm your knowledge level and earn your verified badge.
        `;
      } else {
        introSkillDesc.innerHTML = `
          ${escapeHtml(activeSkillInfo.description || 'Test your real-world problem-solving abilities and algorithmic knowledge.')}
          <div class="mt-2 text-primary fw-medium small">
            <i class="bi bi-patch-plus me-1"></i>Taking this quiz will verify this skill and add it to your profile.
          </div>
        `;
      }
    }

    if (btnStartQuiz) {
      if (activeSkillInfo.cooldownActive) {
        btnStartQuiz.innerHTML = `<span>Review cooldown active</span> <i class="bi bi-clock-history ms-1"></i>`;
        btnStartQuiz.disabled = true;
      } else {
        btnStartQuiz.innerHTML = `
          <span>Start skill check</span>
          <i class="bi bi-lightning-charge-fill ms-1"></i>
        `;
        btnStartQuiz.disabled = false;
      }
    }

    // Switch view to intro
    screenIntro.classList.remove('d-none');
    screenQuiz.classList.add('d-none');
    screenVerdict.classList.add('d-none');
  };

  // 8. Start Quiz Action
  if (btnStartQuiz) {
    btnStartQuiz.addEventListener('click', async () => {
      btnStartQuiz.disabled = true;
      btnStartQuiz.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        <span>Initializing Reality-Check...</span>
      `;

      // Enforce authentication guard
      if (!window.Auth?.isAuthenticated?.()) {
        const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `login.html?redirect=${currentUrl}`;
        return;
      }

      try {
        tabSwitchesCount = 0;
        const savedProvider = localStorage.getItem('cp_quiz_preferred_provider') || aiProviderSelect?.value || 'auto';
        const customKey = localStorage.getItem('cp_custom_quiz_key') || customApiKeyInput?.value?.trim() || null;

        const response = await window.API.post('/quiz/start', {
          skill: activeSkillKey,
          displayName: activeSkillInfo?.label || activeSkillKey,
          provider: savedProvider !== 'auto' ? savedProvider : undefined,
          userApiKey: customKey || undefined
        }, { auth: true });

        if (response.success && response.data) {
          const data = response.data;
          currentSessionId = data.sessionId;
          currentQuestionIdx = data.questionIndex || 1;
          currentQuestion = data.question;
          sessionCompleted = false;
          nextQuestionData = null;
          sessionResultData = null;

          // Transition to Quiz Screen
          screenIntro.classList.add('d-none');
          screenVerdict.classList.add('d-none');
          screenQuiz.classList.remove('d-none');

          // Active provider badge
          if (activeProviderBadge) {
            activeProviderBadge.classList.remove('d-none');
            if (data.isAIGenerated) {
              const prov = data.provider || 'AI';
              const pName = prov === 'groq' ? 'Groq AI (Llama)' :
                            prov === 'gemini' ? 'Google Gemini' :
                            prov === 'custom_api_key' ? 'Custom AI Model' : 'Dynamic AI';
              activeProviderBadge.className = 'badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 small';
              activeProviderBadge.innerHTML = `<i class="bi bi-cpu me-1"></i>${escapeHtml(pName)}`;
            } else {
              activeProviderBadge.className = 'badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 small';
              activeProviderBadge.innerHTML = `<i class="bi bi-shield-check me-1"></i>Curated Bank`;
            }
          }
          // Arm AntiCheatLock & Request Fullscreen
          if (window.AntiCheatLock) {
            if (!proctorLock) {
              proctorLock = new window.AntiCheatLock({
                sessionId: currentSessionId,
                skill: activeSkillKey,
                onStrike: handleProctorStrike,
                onLockout: handleProctorLockout
              });
            }
            proctorLock.arm({
              sessionId: currentSessionId,
              skill: activeSkillKey,
              strikeCount: data.strikeCount || 0,
              isLocked: data.isLocked || false,
              lockReason: data.lockReason || null
            });
            proctorLock.requestFullscreen();
          }

          renderActiveQuestion(data.question, data.currentDifficulty, currentQuestionIdx, data.totalQuestions || 5);
        } else if (response.cooldownActive || response.status === 429) {
          const hours = response.retryAfterHours || 24;
          showAlert(`⏱️ 24-Hour Review Cooldown: Skill checks can only be retaken after a 24-hour review period to protect credential integrity. Retake available in ${hours} hour${hours > 1 ? 's' : ''}.`, 'warning');
          btnStartQuiz.disabled = false;
          btnStartQuiz.innerHTML = `<span>Start skill check</span> <i class="bi bi-lightning-charge-fill ms-1"></i>`;
        } else {
          showAlert(response.message || 'Could not start quiz session.');
          btnStartQuiz.disabled = false;
          btnStartQuiz.innerHTML = `<span>Start skill check</span> <i class="bi bi-lightning-charge-fill ms-1"></i>`;
        }
      } catch (err) {
        console.error('Quiz start error:', err);
        const isCooldown = err.cooldownActive || (err.message && err.message.includes('24-hour'));
        if (isCooldown) {
          showAlert(err.message, 'warning');
        } else {
          showAlert(err.message || 'Network error starting quiz. Please try again.');
        }
        btnStartQuiz.disabled = false;
          btnStartQuiz.innerHTML = `<span>Start skill check</span> <i class="bi bi-lightning-charge-fill ms-1"></i>`;
      }
    });
  }

  // 9. Render Question
  const renderActiveQuestion = (q, difficulty, qIndex, qTotalCount) => {
    isAnswerLocked = false;
    selectedOptionIdx = null;

    // Start 45-second anti-cheating countdown timer (Pillar 6)
    startQuestionTimer();

    // Meta Bar
    const badgeText = (activeSkillInfo?.displayName || activeSkillInfo?.label || activeSkillInfo?.name || activeSkillKey || 'SKILL').toUpperCase();
    if (activeSkillBadge) activeSkillBadge.textContent = badgeText;
    if (qCurrent) qCurrent.textContent = qIndex;
    if (qTotal) qTotal.textContent = qTotalCount;

    // Difficulty Pill
    const diff = (difficulty || 'medium').toLowerCase();
    if (difficultyPill && difficultyLabel) {
      difficultyPill.className = `difficulty-pill ${diff}`;
      difficultyLabel.textContent = capitalize(diff);
    }

    // Stepper Dots
    if (quizStepper) {
      const dots = quizStepper.querySelectorAll('.quiz-step-dot');
      dots.forEach((dot, idx) => {
        dot.className = 'quiz-step-dot';
        if (idx < qIndex - 1) {
          dot.classList.add('completed');
        } else if (idx === qIndex - 1) {
          dot.classList.add('active');
        }
      });
    }

    // Prompt & Code
    if (questionPrompt) questionPrompt.textContent = q.prompt || 'Question prompt';

    if (questionCode) {
      if (q.codeSnippet && q.codeSnippet.trim()) {
        questionCode.classList.remove('d-none');
        questionCode.querySelector('code').textContent = q.codeSnippet;
      } else {
        questionCode.classList.add('d-none');
      }
    }

    // Topic
    if (topicName) topicName.textContent = q.topic || 'General';

    // Options Cards
    if (optionsContainer) {
      optionsContainer.innerHTML = (q.options || []).map((optText, idx) => `
        <div class="quiz-option-card" data-idx="${idx}">
          <div class="quiz-option-radio">
            <div class="quiz-option-radio-dot"></div>
          </div>
          <span class="quiz-option-text">${escapeHtml(optText)}</span>
        </div>
      `).join('');

      // Option click handler
      optionsContainer.querySelectorAll('.quiz-option-card').forEach((card) => {
        card.addEventListener('click', () => {
          if (isAnswerLocked) return;

          optionsContainer.querySelectorAll('.quiz-option-card').forEach((c) => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedOptionIdx = parseInt(card.getAttribute('data-idx'), 10);

          if (btnSubmitAnswer) {
            btnSubmitAnswer.disabled = false;
          }
        });
      });
    }

    // Feedback & Action Buttons
    if (feedbackBox) feedbackBox.classList.add('d-none');
    if (btnSubmitAnswer) {
      btnSubmitAnswer.classList.remove('d-none');
      btnSubmitAnswer.disabled = true;
      btnSubmitAnswer.innerHTML = `<span>Submit Answer</span> <i class="bi bi-check2 ms-1"></i>`;
    }
    if (btnNextQuestion) {
      btnNextQuestion.classList.add('d-none');
    }
  };

  // 10. Submit Answer
  if (btnSubmitAnswer) {
    btnSubmitAnswer.addEventListener('click', async () => {
      if (selectedOptionIdx === null || isAnswerLocked) return;

      isAnswerLocked = true;
      stopQuestionTimer();

      btnSubmitAnswer.disabled = true;
      btnSubmitAnswer.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        <span>Verifying...</span>
      `;

      try {
        const timeTakenSeconds = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));

        const response = await window.API.post(
          '/quiz/answer',
          {
            skill: activeSkillKey,
            sessionId: currentSessionId,
            questionId: currentQuestion.id,
            selectedIndex: selectedOptionIdx,
            selectedOption: selectedOptionIdx,
            timeTakenSeconds,
            tabSwitches: tabSwitchesCount
          },
          { auth: true }
        );

        if (response.success && response.data) {
          const resData = response.data;
          const isCorrect = Boolean(resData.isCorrect);
          const correctAnswer = Number(resData.correctAnswer !== undefined ? resData.correctAnswer : resData.correctIndex);
          const explanation = resData.explanation || '';
          const isCompleted = Boolean(resData.isCompleted || resData.isFinished);
          const nextQuestion = resData.nextQuestion;
          const nextDifficulty = resData.nextDifficulty;
          const result = resData.result || resData.summary;

          // Lock option cards styling
          optionsContainer.querySelectorAll('.quiz-option-card').forEach((card) => {
            card.classList.add('locked');
            const idx = parseInt(card.getAttribute('data-idx'), 10);

            if (idx === correctAnswer) {
              card.classList.add('option-correct');
            } else if (idx === selectedOptionIdx && !isCorrect) {
              card.classList.add('option-wrong');
            }
          });

          // Show Instant Feedback
          if (feedbackBox) {
            feedbackBox.className = `quiz-feedback-box ${isCorrect ? 'correct' : 'incorrect'}`;
            if (feedbackIcon) {
              feedbackIcon.innerHTML = isCorrect
                ? '<i class="bi bi-check-circle-fill"></i>'
                : '<i class="bi bi-x-circle-fill"></i>';
            }
            if (feedbackTitle) {
              feedbackTitle.textContent = isCorrect ? 'Spot on! Correct answer.' : 'Not quite.';
            }
            if (feedbackText) {
              feedbackText.textContent = explanation || '';
            }
            feedbackBox.classList.remove('d-none');
          }

          // Stepper dot update for current
          if (quizStepper) {
            const dots = quizStepper.querySelectorAll('.quiz-step-dot');
            if (dots[currentQuestionIdx - 1]) {
              dots[currentQuestionIdx - 1].classList.remove('active');
              dots[currentQuestionIdx - 1].classList.add('completed');
            }
          }

          // State for next step
          sessionCompleted = Boolean(isCompleted);
          nextQuestionData = nextQuestion;
          sessionResultData = result;

          // Toggle action buttons
          btnSubmitAnswer.classList.add('d-none');
          btnNextQuestion.classList.remove('d-none');

          if (sessionCompleted) {
            btnNextQuestion.innerHTML = `<span>See Reality-Check Verdict</span> <i class="bi bi-trophy-fill ms-1"></i>`;
          } else {
            btnNextQuestion.innerHTML = `<span>Next Question (${nextDifficulty ? capitalize(nextDifficulty) : 'Adaptive'})</span> <i class="bi bi-arrow-right ms-1"></i>`;
          }
        } else {
          showAlert(response.message || 'Error checking answer.');
          isAnswerLocked = false;
          btnSubmitAnswer.disabled = false;
          btnSubmitAnswer.innerHTML = `<span>Submit Answer</span> <i class="bi bi-check2 ms-1"></i>`;
        }
      } catch (err) {
        showAlert(err.message || 'Failed to submit answer. Please try again.');
        isAnswerLocked = false;
        btnSubmitAnswer.disabled = false;
        btnSubmitAnswer.innerHTML = `<span>Submit Answer</span> <i class="bi bi-check2 ms-1"></i>`;
      }
    });
  }

  // 11. Next Question Button Handler
  if (btnNextQuestion) {
    btnNextQuestion.addEventListener('click', () => {
      if (sessionCompleted && sessionResultData) {
        renderVerdict(sessionResultData);
      } else if (nextQuestionData) {
        currentQuestionIdx++;
        currentQuestion = nextQuestionData;
        renderActiveQuestion(
          currentQuestion,
          nextQuestionData.difficulty || 'medium',
          currentQuestionIdx,
          5
        );
      }
    });
  }

  // 12. Render Reality-Check Verdict
  const renderVerdict = (result) => {
    stopQuestionTimer();
    if (proctorLock) {
      proctorLock.disarm();
      proctorLock.exitFullscreen();
    }
    screenQuiz.classList.add('d-none');
    screenVerdict.classList.remove('d-none');
    window.scrollTo({ top: 120, behavior: 'smooth' });

    const claimed = result.selfRatedProficiency || result.selfRated || 'Intermediate';
    const actual = result.verifiedProficiency || result.quizSays || result.verifiedLevel || 'Intermediate';

    if (verdictClaimed) verdictClaimed.textContent = capitalize(claimed);
    if (verdictActual) verdictActual.textContent = capitalize(actual);

    // Skill Passport Tier Badge (Pillar 7)
    if (verdictPassportBadge) {
      const tier = result.verificationTier || 'quiz_verified';
      if (tier === 'project_verified') {
        verdictPassportBadge.className = 'passport-tier-badge badge-passport-t2';
        verdictPassportBadge.innerHTML = '<i class="bi bi-github"></i> Tier 2: Code Verified';
      } else if (tier === 'interview_verified') {
        verdictPassportBadge.className = 'passport-tier-badge badge-passport-t3';
        verdictPassportBadge.innerHTML = '<i class="bi bi-mic-fill"></i> Tier 3: Interview Verified';
      } else {
        verdictPassportBadge.className = 'passport-tier-badge badge-passport-t1';
        verdictPassportBadge.innerHTML = '<i class="bi bi-shield-check"></i> Tier 1: Quiz Verified (85% Weight)';
      }
    }

    // Telemetry Integrity Badge (Pillar 6)
    if (verdictIntegrityBadge) {
      const score = typeof result.integrityScore === 'number' ? result.integrityScore : 100;
      verdictIntegrityBadge.textContent = `Integrity: ${score}/100`;
      verdictIntegrityBadge.className = score < 75 ? 'badge bg-warning text-dark font-mono' : 'badge bg-secondary font-mono';
    }

    // Unconfirmed Status Warning
    if (verdictUnconfirmedNotice) {
      if (result.verificationStatus === 'unconfirmed') {
        verdictUnconfirmedNotice.classList.remove('d-none');
      } else {
        verdictUnconfirmedNotice.classList.add('d-none');
      }
    }

    if (verdictScore) {
      verdictScore.textContent = `Score: ${result.score || 0} / ${result.totalQuestions || result.total || 5} Correct`;
    }

    if (verdictMessage) {
      verdictMessage.textContent = result.realityCheckMessage || result.summaryMessage || 'Reality-check validation complete.';
    }

    // Render Gaps
    if (verdictGapsList && verdictGapsSection) {
      const gaps = Array.isArray(result.gaps) ? result.gaps : Array.isArray(result.identifiedGaps) ? result.identifiedGaps : [];
      if (gaps.length > 0) {
        verdictGapsSection.classList.remove('d-none');
        verdictGapsList.innerHTML = gaps
          .map((g) => `<span class="gap-pill"><i class="bi bi-lightbulb-fill me-1 text-warning"></i>${escapeHtml(g)}</span>`)
          .join('');
      } else {
        verdictGapsSection.classList.add('d-none');
      }
    }

    // Refresh user's updated skill list in memory
    const userToSave = result.user || currentUser;
    if (userToSave) {
      userToSave.hasCompletedSkillVerification = true;
      if (result.user?.skills) userToSave.skills = result.user.skills;
      window.Auth.setCurrentUser(userToSave);
      userSkills = deduplicateUserSkills(userToSave.skills || []);
      renderSkillTabs();
    }
  };

  // 13. Retest Current Skill
  const handleRetestSkill = () => {
    if (activeSkillKey) {
      screenVerdict.classList.add('d-none');
      screenIntro.classList.remove('d-none');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      loadIntroForSkill(activeSkillKey);
      // Automatically start fresh quiz session
      if (btnStartQuiz) {
        btnStartQuiz.click();
      }
    }
  };

  if (btnRetestCurrentSkill) {
    btnRetestCurrentSkill.addEventListener('click', handleRetestSkill);
  }
  if (btnRetestQuick) {
    btnRetestQuick.addEventListener('click', handleRetestSkill);
  }

  // 14. Verify Another Skill
  if (btnQuizAnotherSkill) {
    btnQuizAnotherSkill.addEventListener('click', () => {
      // Find next unverified skill from catalog with alias normalization
      const nextSkill = allSkillsCatalog.find((sup) => {
        if (normalizeSkillSlug(sup.key) === normalizeSkillSlug(activeSkillKey)) return false;
        const u = userSkills.find((us) => normalizeSkillSlug(us.name) === normalizeSkillSlug(sup.key));
        return u && !u.isQuizVerified;
      }) || allSkillsCatalog.find((s) => normalizeSkillSlug(s.key) !== normalizeSkillSlug(activeSkillKey)) || allSkillsCatalog[0];

      if (nextSkill) {
        activeSkillKey = nextSkill.key;
        renderSkillTabs();
        loadIntroForSkill(activeSkillKey);
      }
    });
  }

  // Initial Boot
  if (window.Auth?.initNav) {
    window.Auth.initNav();
  }
  initUserSkills();
});

/**
 * chat.js  -  Student-Portal AI Career Mentor Chatbot Engine
 * Features:
 * - Dynamic Student Context & Academic Profile Integration
 * - Structured Portal Markdown Formatting (Badges, Steps, Pro-Tips, Code Cards)
 * - Interactive Topic Ribbon (Roadmaps, Skills, ATS Resume, Interviews, Projects)
 * - One-Click Advice & Code Copying
 * - Contextual Follow-Up Smart Prompts
 * - Expandable Focus View for Roadmaps
 * - Dual-Engine Real-Time WebSocket Streaming with REST Fallback
 *
 * Disheera · Enterprise Platform Engine
 */

(function () {
  const STORAGE_KEY = 'cp_chat_history_v2';
  let chatHistory = [];
  let isSending = false;
  let isExpanded = false;
  let activeTopic = 'roadmap';

  // Initialize from sessionStorage if exists
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      chatHistory = Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    chatHistory = [];
  }

  // Auto-load socket-client.js if not already present
  if (typeof window !== 'undefined' && !window.CareerPathSocket && !document.getElementById('cpSocketClientScript')) {
    const s = document.createElement('script');
    s.id = 'cpSocketClientScript';
    s.src = 'js/socket-client.js';
    document.head.appendChild(s);
  }

  // Curated High-Yield Student Prompts by Academic & Career Domain
  const TOPIC_PROMPTS = {
    roadmap: [
      { label: '⚡ How to master Week 1 tasks fast?', prompt: 'What is the fastest and most practical way for a student to master and check off Week 1 tasks in their roadmap?' },
      { label: '🎯 How to balance college exams & coding?', prompt: 'How should a college student manage time between semester exams and daily 2-hour roadmap coding tasks?' },
      { label: '🗺️ Beginner to Internship in 8 weeks', prompt: 'Give me a structured week-by-week timeline to go from beginner to internship-ready in 8 weeks.' }
    ],
    skills: [
      { label: '💻 Top 5 hiring skills in 2026', prompt: 'Which 5 technical skills have the highest hiring demand and starting salaries for tech freshers in 2026?' },
      { label: '⚡ How to verify skills for recruiters?', prompt: 'How do skill verification badges and coding benchmarks help students get shortlisted by tech companies?' },
      { label: '🔍 Frontend vs Full-Stack roadmap', prompt: 'Compare Frontend and Full-Stack development in terms of learning curve, job openings, and entry-level salaries.' }
    ],
    resume: [
      { label: '📄 How to achieve 90+ ATS score?', prompt: 'What are the top 5 factors to achieve a 90+ ATS score on a student technical resume?' },
      { label: '✍️ Action verbs for project bullet points', prompt: 'How should I write high-impact resume bullet points using the Google XYZ formula for my college projects?' },
      { label: '🚫 Top 5 resume rejection mistakes', prompt: 'What are the top 5 resume mistakes college students make that get their application rejected instantly?' }
    ],
    interviews: [
      { label: '💼 Top 5 technical interview questions', prompt: 'What are the top 5 technical interview questions tech companies ask freshers and how should I structure my answers?' },
      { label: '🗣️ 60-Second elevator pitch for freshers', prompt: 'Give me a crisp 60-second self-introduction pitch for a student attending a software engineering interview.' },
      { label: '🚀 How to clear live coding assessments?', prompt: 'How should I practice data structures and algorithms to clear 45-minute live online coding tests?' }
    ],
    projects: [
      { label: '🛠️ 3 standout full-stack project ideas', prompt: 'Suggest 3 unique full-stack projects with modern tech stacks that will immediately impress tech recruiters.' },
      { label: '🌐 How to deploy projects for free?', prompt: 'What is the best way to deploy full-stack apps (frontend + backend + database) completely free with public live URLs?' },
      { label: '📦 What makes a recruiter-ready GitHub README?', prompt: 'What sections and details must be in a project GitHub README to prove real engineering competence?' }
    ],
    support: [
      { label: '📞 Official Support Desk (+91 74990 85045)', prompt: 'How do I contact official student support on WhatsApp (+91 74990 85045) or raise a ticket?' },
      { label: '🔐 Login & Dual OTP help', prompt: 'I am facing issues with my login or email and WhatsApp dual OTP verification. How can I resolve it?' },
      { label: '📜 Certificate verification assistance', prompt: 'How do I verify my milestone certificate or resolve certificate credential issues?' },
      { label: '🛡️ Grievance Officer details', prompt: 'Who is the official Grievance Redressal Officer under the DPDP Act 2023 and what is the turnaround SLA?' }
    ]
  };

  function getApiBaseUrl() {
    if (window.CONFIG && window.CONFIG.API_BASE_URL) {
      return window.CONFIG.API_BASE_URL;
    }
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return isLocalhost ? 'http://localhost:5000/api' : 'https://api.disheera.site/api';
  }

  function getAuthToken() {
    if (window.Auth && typeof window.Auth.getToken === 'function') {
      return window.Auth.getToken();
    }
    return localStorage.getItem('careerpath_token') || localStorage.getItem('token') || null;
  }

  function getStudentContext() {
    const user = window.Auth?.getUser?.() || {};
    return {
      name: user.name || 'Student',
      course: user.education?.course || user.education?.degree || 'Tech Scholar',
      branch: user.education?.branch || '',
      isLoggedIn: Boolean(user && (user._id || user.id || user.name)),
    };
  }

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Advanced Markdown-to-HTML parser crafted specifically for Student Portal Telemetry
   * Converts markdown into beautiful interactive student components:
   * - Callouts (> 💡 Pro-Tip)
   * - Section Headers (🎯 Key Takeaway, 📌 Action Plan, etc.)
   * - Fenced Code Cards with Copy Buttons
   * - Numbered Step Badges
   * - Direct Portal Action Buttons
   */
  function parseMarkdown(text) {
    if (!text) return '';

    // 1. Extract Fenced Code Blocks first
    const codeBlocks = [];
    let processed = text.replace(/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `__CP_CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ lang: lang ? lang.trim().toLowerCase() : 'code', code: code.trim() });
      return placeholder;
    });

    // 2. Escape HTML for safety
    processed = escapeHtml(processed);

    // 3. Pro-Tip & Callout Blocks (> 💡 Pro-Tip: ... or > ...)
    processed = processed.replace(/^&gt;\s*(?:💡\s*)?(?:\*\*([^*]+)\*\*:?)?\s*(.*)$/gm, (m, title, content) => {
      const tipTitle = title ? title.trim() : 'Pro-Tip';
      return `<div class="cp-portal-callout"><div class="cp-callout-icon"><i class="bi bi-lightbulb-fill"></i></div><div class="cp-callout-body"><strong>${tipTitle}:</strong> ${content}</div></div>`;
    });

    // 4. Section Headers (### 🎯 ... or ### 📌 ...)
    processed = processed.replace(/^###\s*(🎯|📌|🛠️|🚀|💡)\s*(.*?)$/gm, (m, icon, title) => {
      let typeClass = 'default';
      let iconClass = 'bi-stars';
      if (icon === '🎯') { typeClass = 'takeaway'; iconClass = 'bi-bullseye'; }
      else if (icon === '📌') { typeClass = 'action-plan'; iconClass = 'bi-list-check'; }
      else if (icon === '🛠️') { typeClass = 'tech-stack'; iconClass = 'bi-cpu-fill'; }
      else if (icon === '🚀') { typeClass = 'portal-action'; iconClass = 'bi-rocket-takeoff-fill'; }
      else if (icon === '💡') { typeClass = 'pro-tip'; iconClass = 'bi-lightbulb-fill'; }
      return `<div class="cp-section-tag ${typeClass}"><i class="bi ${iconClass}"></i> <span>${title.replace(/\*\*/g, '').trim()}</span></div>`;
    });

    // 5. Numbered Steps (e.g. 1. **Title**: Description)
    processed = processed.replace(/^(\d+)\.\s+\*\*(.*?)\*\*:?\s*(.*)$/gm, (m, num, stepTitle, stepBody) => {
      return `<div class="cp-step-row"><span class="cp-step-badge">${num}</span><div class="cp-step-content"><strong>${stepTitle}:</strong> ${stepBody}</div></div>`;
    });

    // 6. Portal Internal Action Buttons ([Roadmap](roadmap.html), etc.)
    processed = processed.replace(/\[([^\]]+)\]\((roadmap\.html|assessment\.html|resume-builder\.html|jobs\.html|recommendations\.html|quiz\.html)\)/g, (m, label, url) => {
      let icon = 'bi-arrow-up-right-circle-fill';
      if (url.includes('roadmap')) icon = 'bi-map-fill';
      else if (url.includes('assessment')) icon = 'bi-patch-check-fill';
      else if (url.includes('resume')) icon = 'bi-file-earmark-person-fill';
      else if (url.includes('jobs')) icon = 'bi-briefcase-fill';
      else if (url.includes('recommendations')) icon = 'bi-compass-fill';
      return `<a href="${url}" class="cp-portal-action-pill"><i class="bi ${icon}"></i> <span>${label}</span> <i class="bi bi-chevron-right small"></i></a>`;
    });

    // 7. General Markdown External Links (enforce https:// or http:// protocol only)
    processed = processed.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)\"\'<>]+)\)/gi, (m, label, linkUrl) => {
      return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="cp-portal-link">${label} <i class="bi bi-box-arrow-up-right small"></i></a>`;
    });

    // 8. Bold text (**text**) & Italic (*text*)
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="cp-highlight-text">$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 9. Inline code (`code`)
    processed = processed.replace(/`([^`]+)`/g, '<code class="cp-inline-chip">$1</code>');

    // 10. Split Paragraphs & Bullets
    const paragraphs = processed.split(/\n\n+/);
    processed = paragraphs.map(p => {
      if (p.trim().startsWith('* ') || p.trim().startsWith('- ')) {
        const items = p.split(/\n/).map(line => {
          const clean = line.replace(/^[\*\-]\s+/, '').trim();
          return clean ? `<li>${clean}</li>` : '';
        }).join('');
        return `<ul class="cp-bullet-list">${items}</ul>`;
      }
      return p.startsWith('<div class="cp-') ? p : `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    // 11. Restore Fenced Code Blocks
    codeBlocks.forEach((cb, idx) => {
      const placeholder = `__CP_CODE_BLOCK_${idx}__`;
      const escapedCode = escapeHtml(cb.code);
      const codeCardHtml = `
        <div class="cp-code-block-card">
          <div class="cp-code-header">
            <span class="cp-code-lang"><i class="bi bi-code-slash"></i> ${escapeHtml(cb.lang.toUpperCase())}</span>
            <button type="button" class="cp-code-copy-btn" data-code="${escapeHtml(cb.code)}">
              <i class="bi bi-clipboard"></i> <span>Copy</span>
            </button>
          </div>
          <pre class="cp-code-pre"><code>${escapedCode}</code></pre>
        </div>
      `;
      processed = processed.replace(placeholder, codeCardHtml);
    });

    return processed;
  }

  /**
   * Generates intelligent, contextual follow-up question chips based on AI reply content
   */
  function generateFollowUpChips(text) {
    const lower = text.toLowerCase();
    const chips = [];

    if (lower.includes('project') || lower.includes('portfolio') || lower.includes('github')) {
      chips.push({ text: '🛠️ 3 projects to build next', prompt: 'Give me 3 specific portfolio project ideas with recommended tech stacks and GitHub repository structure.' });
    }
    if (lower.includes('roadmap') || lower.includes('week') || lower.includes('task')) {
      chips.push({ text: '🗺️ How to complete Week 1 quickly?', prompt: 'What is the fastest way to master and check off Week 1 tasks in my roadmap?' });
    }
    if (lower.includes('interview') || lower.includes('recruit') || lower.includes('job') || lower.includes('hire')) {
      chips.push({ text: '💼 Top 5 technical interview questions', prompt: 'What are the top 5 technical interview questions asked for this role and how should a student answer them?' });
    }
    if (lower.includes('skill') || lower.includes('learn') || lower.includes('language') || lower.includes('framework')) {
      chips.push({ text: '⚡ Which skill has highest market salary?', prompt: 'Between the skills mentioned, which one has the highest market demand and salary for freshers in 2026?' });
    }

    if (chips.length === 0) {
      chips.push({ text: '💡 Best project to build for this', prompt: 'What is the single best project I can build and deploy to prove this skill?' });
      chips.push({ text: '🎯 How to test my readiness?', prompt: 'How can I test if I am ready for internships or entry-level jobs?' });
    }

    return chips.slice(0, 3);
  }

  function injectWidgetDOM() {
    if (document.getElementById('cpChatDrawer')) return;

    // 1. Floating Trigger Button
    const trigger = document.createElement('button');
    trigger.id = 'cpChatTrigger';
    trigger.className = 'cp-chat-trigger cp-creepy-mentor-btn';
    trigger.setAttribute('aria-label', 'Open AI Career Mentor Chat');
    trigger.innerHTML = `
      <span class="trigger-icon"><i class="bi bi-robot"></i></span>
      <span class="trigger-label">AI Mentor</span>
      <span class="trigger-badge"><span class="badge-dot"></span>ONLINE</span>
    `;
    document.body.appendChild(trigger);

    // 2. Chat Drawer Container
    const drawer = document.createElement('div');
    drawer.id = 'cpChatDrawer';
    drawer.className = 'cp-chat-drawer';
    drawer.innerHTML = `
      <div class="cp-chat-header">
        <div class="cp-chat-header-info">
          <div class="cp-chat-avatar">
            <i class="bi bi-robot"></i>
            <span class="cp-avatar-status"></span>
          </div>
          <div class="cp-chat-header-text">
            <div class="d-flex align-items-center gap-1">
              <h4 class="cp-chat-title">Disheera Mentor</h4>
              <i class="bi bi-patch-check-fill cp-verified-icon" title="Certified Career Intelligence"></i>
            </div>
            <div class="cp-chat-subtitle" id="cpChatSubtitle">
              <span class="pulse-dot"></span> <span id="cpStudentStatusText">Online · Student Guidance</span>
            </div>
          </div>
        </div>
        <div class="cp-chat-header-actions">
          <button class="cp-chat-btn-icon" id="cpChatExpandBtn" title="Expand View" aria-label="Expand height">
            <i class="bi bi-arrows-angle-expand"></i>
          </button>
          <button class="cp-chat-btn-icon" id="cpChatClearBtn" title="Clear Conversation" aria-label="Clear chat">
            <i class="bi bi-trash3"></i>
          </button>
          <button class="cp-chat-btn-icon" id="cpChatCloseBtn" title="Close" aria-label="Close chat">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <!-- Quick Topic Pill Ribbon -->
      <div class="cp-chat-topic-ribbon" id="cpTopicRibbon">
        <button type="button" class="cp-topic-pill active" data-topic="roadmap"><i class="bi bi-map-fill text-primary"></i> Roadmap</button>
        <button type="button" class="cp-topic-pill" data-topic="skills"><i class="bi bi-cpu-fill text-info"></i> Skills</button>
        <button type="button" class="cp-topic-pill" data-topic="resume"><i class="bi bi-file-earmark-person-fill text-success"></i> ATS Resume</button>
        <button type="button" class="cp-topic-pill" data-topic="interviews"><i class="bi bi-mic-fill text-warning"></i> Interviews</button>
        <button type="button" class="cp-topic-pill" data-topic="projects"><i class="bi bi-folder-check text-indigo"></i> Projects</button>
        <button type="button" class="cp-topic-pill" data-topic="support"><i class="bi bi-headset text-danger"></i> Support</button>
      </div>

      <!-- Messages Scroll Area -->
      <div class="cp-chat-messages" id="cpChatMessages">
        <!-- Messages rendered dynamically here -->
      </div>

      <!-- Quick Suggested Prompts Drawer -->
      <div class="cp-chat-suggestions" id="cpChatSuggestions">
        <div class="cp-suggestions-header">
          <span class="cp-chat-suggestions-title"><i class="bi bi-stars"></i> Recommended Student Prompts:</span>
        </div>
        <div class="cp-suggestions-chips" id="cpSuggestionsChips">
          <!-- Populated based on activeTopic -->
        </div>
      </div>

      <!-- Chat Input Footer -->
      <div class="cp-chat-footer">
        <form class="cp-chat-form" id="cpChatForm">
          <button type="button" class="cp-prompts-toggle-btn" id="cpTogglePromptsBtn" title="Toggle Quick Prompts" aria-label="Quick Prompts">
            <i class="bi bi-stars"></i>
          </button>
          <input
            type="text"
            id="cpChatInput"
            class="cp-chat-input"
            placeholder="Ask about roadmaps, coding doubts, interview prep, resumes..."
            autocomplete="off"
            maxlength="600"
          />
          <button type="submit" class="cp-chat-send-btn" id="cpChatSendBtn" aria-label="Send message">
            <i class="bi bi-send-fill"></i>
          </button>
        </form>
        <div class="cp-chat-footer-telemetry">
          <span><i class="bi bi-lightning-charge-fill text-warning"></i> Dual-Engine AI (Groq & Gemini)</span>
          <span>· Student Privacy Protected 🔒</span>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    // 3. Floating Nudge Tooltip Card
    let popupDismissed = false;

    function showQuestionPopup() {
      if (popupDismissed) return;
      if (drawer.classList.contains('open')) return;
      if (document.getElementById('cpChatNudge')) return;
      if (document.body.classList.contains('assessment-page') || document.querySelector('.quiz-page-container')) return;

      const nudge = document.createElement('div');
      nudge.id = 'cpChatNudge';
      nudge.className = 'cp-chat-question-popup';
      nudge.innerHTML = `
        <div class="cp-chat-question-header">
          <span class="cp-chat-question-badge">
            <i class="bi bi-robot"></i> AI Academic Mentor
          </span>
          <button class="cp-question-close" id="cpQuestionClose" title="Dismiss" aria-label="Close popup">&times;</button>
        </div>
        <p class="cp-chat-question-title">💬 <strong>Have a doubt?</strong> Ask your AI Mentor!</p>
        <div class="cp-chat-question-list">
          <button class="cp-question-item-btn" data-q="What is the fastest way to master Week 1 tasks in my roadmap?">
            <span>⚡ How to master Week 1 roadmap tasks?</span>
            <i class="bi bi-arrow-right-short q-arrow"></i>
          </button>
          <button class="cp-question-item-btn" data-q="Which tech role has the highest industry hiring demand right now?">
            <span>🎯 Which tech role has highest demand?</span>
            <i class="bi bi-arrow-right-short q-arrow"></i>
          </button>
          <button class="cp-question-item-btn" data-q="How can a student get a 90+ ATS score on their tech resume?">
            <span>📄 How to score 90+ on Resume ATS?</span>
            <i class="bi bi-arrow-right-short q-arrow"></i>
          </button>
        </div>
        <div class="cp-chat-question-tail"></div>
      `;

      nudge.addEventListener('click', (e) => {
        if (e.target.closest('#cpQuestionClose')) {
          e.stopPropagation();
          dismissNudge();
          return;
        }

        const qBtn = e.target.closest('.cp-question-item-btn');
        if (qBtn) {
          const prompt = qBtn.getAttribute('data-q');
          dismissNudge();
          drawer.classList.add('open');
          updateStudentHeader();
          scrollToBottom();
          if (prompt) {
            sendUserMessage(prompt);
          }
          return;
        }

        dismissNudge();
        drawer.classList.add('open');
        updateStudentHeader();
        const inputEl = document.getElementById('cpChatInput');
        if (inputEl) inputEl.focus();
        scrollToBottom();
      });

      document.body.appendChild(nudge);
    }

    function dismissNudge() {
      popupDismissed = true;
      const nudge = document.getElementById('cpChatNudge');
      if (nudge) {
        nudge.classList.add('dismissed');
        setTimeout(() => {
          if (nudge.parentNode) nudge.parentNode.removeChild(nudge);
        }, 350);
      }
    }

    // Keep chat widget dormant as a small floating action button until explicit user action
    // setTimeout(showQuestionPopup, 3000); (Removed unsolicited intrusive popup)

    bindEvents(trigger, drawer, dismissNudge);
    renderTopicSuggestions(activeTopic);
    renderMessages();
  }

  function updateStudentHeader() {
    const ctx = getStudentContext();
    const statusTextEl = document.getElementById('cpStudentStatusText');
    if (!statusTextEl) return;

    if (ctx.isLoggedIn) {
      const courseStr = ctx.course ? ` (${ctx.course})` : '';
      statusTextEl.innerHTML = `Online · 🎓 <strong>${escapeHtml(ctx.name)}</strong>${escapeHtml(courseStr)}`;
    } else {
      statusTextEl.textContent = 'Online · 24/7 AI Career Mentor';
    }
  }

  function renderTopicSuggestions(topicKey = 'roadmap') {
    const container = document.getElementById('cpSuggestionsChips');
    if (!container) return;

    const list = TOPIC_PROMPTS[topicKey] || TOPIC_PROMPTS.roadmap;
    container.innerHTML = list.map(item => `
      <button type="button" class="cp-chat-chip" data-prompt="${escapeHtml(item.prompt)}">
        ${escapeHtml(item.label)}
      </button>
    `).join('');
  }

  function bindEvents(trigger, drawer, dismissNudge) {
    const closeBtn = document.getElementById('cpChatCloseBtn');
    const clearBtn = document.getElementById('cpChatClearBtn');
    const expandBtn = document.getElementById('cpChatExpandBtn');
    const form = document.getElementById('cpChatForm');
    const input = document.getElementById('cpChatInput');
    const suggestions = document.getElementById('cpChatSuggestions');
    const topicRibbon = document.getElementById('cpTopicRibbon');
    const togglePromptsBtn = document.getElementById('cpTogglePromptsBtn');

    // Toggle drawer open/close
    trigger.addEventListener('click', () => {
      if (typeof dismissNudge === 'function') dismissNudge();
      const isOpen = drawer.classList.contains('open');
      if (isOpen) {
        drawer.classList.remove('open');
      } else {
        drawer.classList.add('open');
        updateStudentHeader();
        input.focus();
        scrollToBottom();
      }
    });

    closeBtn.addEventListener('click', () => {
      drawer.classList.remove('open');
    });

    // Expand / contract height
    expandBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      drawer.classList.toggle('expanded', isExpanded);
      expandBtn.innerHTML = isExpanded ? '<i class="bi bi-arrows-angle-contract"></i>' : '<i class="bi bi-arrows-angle-expand"></i>';
      expandBtn.title = isExpanded ? 'Contract View' : 'Expand View';
    });

    // Clear history
    clearBtn.addEventListener('click', () => {
      chatHistory = [];
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      renderMessages();
      renderTopicSuggestions(activeTopic);
      if (suggestions) suggestions.style.display = 'flex';
    });

    // Topic Ribbon Clicks
    topicRibbon.addEventListener('click', (e) => {
      const pill = e.target.closest('.cp-topic-pill');
      if (!pill) return;

      topicRibbon.querySelectorAll('.cp-topic-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      activeTopic = pill.dataset.topic || 'roadmap';
      renderTopicSuggestions(activeTopic);
      if (suggestions) suggestions.style.display = 'flex';
    });

    // Toggle Quick Prompts Drawer
    togglePromptsBtn.addEventListener('click', () => {
      if (!suggestions) return;
      const isVisible = suggestions.style.display === 'flex';
      suggestions.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        renderTopicSuggestions(activeTopic);
      }
    });

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || isSending) return;
      input.value = '';
      sendUserMessage(text);
    });

    // Suggestion chips click
    suggestions.addEventListener('click', (e) => {
      const chip = e.target.closest('.cp-chat-chip');
      if (chip && !isSending) {
        const prompt = chip.dataset.prompt;
        if (prompt) {
          sendUserMessage(prompt);
        }
      }
    });

    // Delegated Clicks: Copy code, Copy advice, Follow-up pills
    document.addEventListener('click', (e) => {
      // 1. Copy Code Block
      const codeCopyBtn = e.target.closest('.cp-code-copy-btn');
      if (codeCopyBtn) {
        const codeText = codeCopyBtn.getAttribute('data-code') || codeCopyBtn.closest('.cp-code-block-card')?.querySelector('code')?.innerText;
        if (codeText) {
          navigator.clipboard.writeText(codeText).then(() => {
            codeCopyBtn.innerHTML = '<i class="bi bi-check-lg text-success"></i> <span class="text-success">Copied!</span>';
            setTimeout(() => {
              codeCopyBtn.innerHTML = '<i class="bi bi-clipboard"></i> <span>Copy</span>';
            }, 2000);
          });
        }
        return;
      }

      // 2. Copy Full Advice Message
      const msgCopyBtn = e.target.closest('.cp-msg-copy-btn');
      if (msgCopyBtn) {
        const bubble = msgCopyBtn.closest('.cp-chat-row')?.querySelector('.cp-chat-bubble');
        if (bubble) {
          navigator.clipboard.writeText(bubble.innerText).then(() => {
            msgCopyBtn.innerHTML = '<i class="bi bi-check-lg text-success"></i> <span class="text-success">Copied!</span>';
            setTimeout(() => {
              msgCopyBtn.innerHTML = '<i class="bi bi-clipboard"></i> <span>Copy Advice</span>';
            }, 2000);
          });
        }
        return;
      }

      // 3. Contextual Follow-Up Pill
      const followUpBtn = e.target.closest('.cp-followup-pill');
      if (followUpBtn && !isSending) {
        const prompt = followUpBtn.getAttribute('data-prompt');
        if (prompt) {
          sendUserMessage(prompt);
        }
      }
    });

    // Dynamic Eye Tracking for AI Mentor Trigger Button
    function updateCreepyEyes(e) {
      const pupils = trigger.querySelectorAll('.cp-creepy-pupil');
      if (!pupils.length) return;

      const rect = trigger.getBoundingClientRect();
      const eyesX = rect.left + rect.width - 24;
      const eyesY = rect.top + rect.height * 0.5;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = clientX - eyesX;
      const dy = clientY - eyesY;
      const angle = Math.atan2(-dy, dx) + Math.PI / 2;
      const distance = Math.hypot(dx, dy);

      const visionRangeX = 260;
      const visionRangeY = 140;
      const normX = (Math.sin(angle) * Math.min(distance, visionRangeX)) / visionRangeX;
      const normY = (Math.cos(angle) * Math.min(distance, visionRangeY)) / visionRangeY;

      const px = normX * 4;
      const py = normY * 4;

      pupils.forEach((p) => {
        p.style.transform = `translate(calc(-50% + ${px.toFixed(1)}px), calc(-50% + ${py.toFixed(1)}px))`;
      });
    }

    window.addEventListener('mousemove', updateCreepyEyes, { passive: true });
    window.addEventListener('touchmove', updateCreepyEyes, { passive: true });

    trigger.addEventListener('mouseleave', () => {
      const pupils = trigger.querySelectorAll('.cp-creepy-pupil');
      pupils.forEach((p) => {
        p.style.transform = 'translate(-50%, -50%)';
      });
    });
  }

  function renderMessages() {
    const container = document.getElementById('cpChatMessages');
    const suggestions = document.getElementById('cpChatSuggestions');
    if (!container) return;

    container.innerHTML = '';

    const ctx = getStudentContext();
    const studentGreeting = ctx.isLoggedIn ? `Welcome back, <strong>${escapeHtml(ctx.name)}</strong>! 👋` : 'Welcome to Disheera! 👋';

    // Welcome Greeting Card
    const welcomeRow = document.createElement('div');
    welcomeRow.className = 'cp-chat-row ai';
    welcomeRow.innerHTML = `
      <div class="cp-msg-meta-header">
        <div class="cp-meta-avatar"><i class="bi bi-robot"></i></div>
        <span class="cp-meta-name">Disheera Mentor</span>
        <span class="cp-meta-badge"><i class="bi bi-patch-check-fill text-primary"></i> Academic Advisor</span>
      </div>
      <div class="cp-chat-bubble">
        <p class="mb-2">${studentGreeting}</p>
        <p class="mb-2">I am your dedicated <strong>AI Career & Academic Mentor</strong>. I can help you with:</p>
        <div class="cp-welcome-features">
          <div class="cp-welcome-item"><i class="bi bi-map text-primary"></i> Weekly Roadmap milestone execution</div>
          <div class="cp-welcome-item"><i class="bi bi-cpu text-info"></i> In-demand skill gap elimination</div>
          <div class="cp-welcome-item"><i class="bi bi-file-earmark-person text-success"></i> 90+ ATS Resume bullet optimization</div>
          <div class="cp-welcome-item"><i class="bi bi-mic text-warning"></i> Technical & HR Mock Interview prep</div>
        </div>
        <p class="mt-2 mb-0 text-muted small">💡 Tap any topic above or choose a suggested question below to begin!</p>
      </div>
      <div class="cp-msg-footer">
        <span class="cp-chat-time"><i class="bi bi-clock me-1"></i>Just now</span>
      </div>
    `;
    container.appendChild(welcomeRow);

    // Render stored chat history
    for (const msg of chatHistory) {
      appendBubbleToDOM(msg.role, msg.text, msg.time, false, msg.engine);
    }

    if (suggestions) {
      suggestions.style.display = chatHistory.length > 2 ? 'none' : 'flex';
    }

    scrollToBottom();
  }

  function appendBubbleToDOM(role, text, time = formatTime(), shouldScroll = true, engine = null) {
    const container = document.getElementById('cpChatMessages');
    if (!container) return;

    const row = document.createElement('div');
    row.className = `cp-chat-row ${role}`;

    if (role === 'ai') {
      const parsedContent = parseMarkdown(text);

      row.innerHTML = `
        <div class="cp-msg-meta-header">
          <div class="cp-meta-avatar"><i class="bi bi-robot"></i></div>
          <span class="cp-meta-name">Disheera Mentor</span>
          <span class="cp-meta-badge"><i class="bi bi-lightning-charge-fill text-warning"></i> <span class="cp-engine-badge-text"></span></span>
        </div>
        <div class="cp-chat-bubble"></div>
        <div class="cp-msg-footer">
          <span class="cp-chat-time"><i class="bi bi-clock me-1"></i>${time}</span>
          <button type="button" class="cp-msg-copy-btn" title="Copy response to clipboard">
            <i class="bi bi-clipboard"></i> <span>Copy Advice</span>
          </button>
        </div>
      `;

      row.querySelector('.cp-engine-badge-text').textContent = engine || 'Disheera Knowledge Engine';
      row.querySelector('.cp-chat-bubble').innerHTML = parsedContent;

      // Contextual follow-up suggestions
      const chips = generateFollowUpChips(text);
      if (chips.length > 0) {
        const chipsContainer = document.createElement('div');
        chipsContainer.className = 'cp-followup-ribbon';
        chipsContainer.innerHTML = `<span class="cp-followup-title"><i class="bi bi-arrow-return-right"></i> Next Question:</span>`;
        chips.forEach(c => {
          const pillBtn = document.createElement('button');
          pillBtn.type = 'button';
          pillBtn.className = 'cp-followup-pill';
          pillBtn.setAttribute('data-prompt', c.prompt);
          pillBtn.textContent = c.text;
          chipsContainer.appendChild(pillBtn);
        });
        row.appendChild(chipsContainer);
      }
    } else {
      const studentCtx = getStudentContext();
      row.innerHTML = `
        <div class="cp-msg-meta-header user-header">
          <span class="cp-meta-name user-display-name"></span>
          <div class="cp-meta-avatar user-avatar"><i class="bi bi-person-fill"></i></div>
        </div>
        <div class="cp-chat-bubble">
          <p class="mb-0 user-bubble-text"></p>
        </div>
        <span class="cp-chat-time text-end"><i class="bi bi-clock me-1"></i>${time}</span>
      `;
      row.querySelector('.user-display-name').textContent = studentCtx.name || 'You';
      row.querySelector('.user-bubble-text').textContent = text;
    }

    container.appendChild(row);
    if (shouldScroll) scrollToBottom();
  }

  function showTypingIndicator() {
    const container = document.getElementById('cpChatMessages');
    if (!container) return;

    removeTypingIndicator();

    const indicator = document.createElement('div');
    indicator.id = 'cpChatTypingIndicator';
    indicator.className = 'cp-chat-row ai';
    indicator.innerHTML = `
      <div class="cp-msg-meta-header">
        <div class="cp-meta-avatar"><i class="bi bi-robot"></i></div>
        <span class="cp-meta-name">Disheera Mentor</span>
        <span class="cp-meta-badge"><i class="bi bi-hourglass-split"></i> Reasoning...</span>
      </div>
      <div class="cp-chat-typing">
        <div class="cp-chat-typing-dot"></div>
        <div class="cp-chat-typing-dot"></div>
        <div class="cp-chat-typing-dot"></div>
      </div>
    `;
    container.appendChild(indicator);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const existing = document.getElementById('cpChatTypingIndicator');
    if (existing) existing.remove();
  }

  function scrollToBottom() {
    const container = document.getElementById('cpChatMessages');
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }

  async function sendUserMessage(text) {
    isSending = true;
    const time = formatTime();

    // 1. Add user bubble to DOM & history
    appendBubbleToDOM('user', text, time);
    chatHistory.push({ role: 'user', text, time });

    // Hide suggestions drawer after user begins active chat
    const suggestions = document.getElementById('cpChatSuggestions');
    if (suggestions) suggestions.style.display = 'none';

    // 2. Show typing indicator
    showTypingIndicator();

    const token = getAuthToken();
    if (!token) {
      removeTypingIndicator();
      appendBubbleToDOM(
        'ai',
        '🔒 **Authentication Required:** Please [log in](login.html) or [create a student account](register.html) to chat with your personal AI Career Mentor.',
        formatTime()
      );
      isSending = false;
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Format previous history for AI Mentor API (last 6 messages)
      const previousHistory = chatHistory.slice(0, -1);
      const historyPayload = previousHistory.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      // ── Real-Time WebSocket Streaming with REST Fallback ─────
      if (window.CareerPathSocket && window.CareerPathSocket.isConnected()) {
        let streamRow = null;
        let streamBubble = null;
        let accumulatedText = '';

        window.CareerPathSocket.streamMentorMessage({
          message: text,
          history: historyPayload,
          onChunk: (chunk) => {
            removeTypingIndicator();
            if (!streamRow) {
              streamRow = document.createElement('div');
              streamRow.className = 'cp-chat-row ai';
              streamRow.innerHTML = `
                <div class="cp-msg-meta-header">
                  <div class="cp-meta-avatar"><i class="bi bi-robot"></i></div>
                  <span class="cp-meta-name">Disheera Mentor</span>
                  <span class="cp-meta-badge"><i class="bi bi-lightning-charge-fill text-warning"></i> Real-time Stream</span>
                </div>
              `;
              streamBubble = document.createElement('div');
              streamBubble.className = 'cp-chat-bubble';
              streamRow.appendChild(streamBubble);
              const container = document.getElementById('cpChatMessages');
              if (container) container.appendChild(streamRow);
            }
            accumulatedText += chunk;
            if (streamBubble) {
              streamBubble.innerHTML = parseMarkdown(accumulatedText);
              scrollToBottom();
            }
          },
          onDone: (data) => {
            removeTypingIndicator();
            const fullText = data.fullText || accumulatedText;
            if (!streamRow) {
              appendBubbleToDOM('ai', fullText, formatTime(), true, 'Groq Cloud (<100ms)');
            } else if (streamBubble) {
              streamBubble.innerHTML = parseMarkdown(fullText);
              // Add footer
              const footer = document.createElement('div');
              footer.className = 'cp-msg-footer';
              footer.innerHTML = `
                <span class="cp-chat-time"><i class="bi bi-clock me-1"></i>${formatTime()}</span>
                <button type="button" class="cp-msg-copy-btn" title="Copy response to clipboard">
                  <i class="bi bi-clipboard"></i> <span>Copy Advice</span>
                </button>
              `;
              streamRow.appendChild(footer);

              // Follow-up chips
              const chips = generateFollowUpChips(fullText);
              if (chips.length > 0) {
                const chipsContainer = document.createElement('div');
                chipsContainer.className = 'cp-followup-ribbon';
                chipsContainer.innerHTML = `
                  <span class="cp-followup-title"><i class="bi bi-arrow-return-right"></i> Next Question:</span>
                  ${chips.map(c => `<button type="button" class="cp-followup-pill" data-prompt="${escapeHtml(c.prompt)}">${escapeHtml(c.text)}</button>`).join('')}
                `;
                streamRow.appendChild(chipsContainer);
              }
            }
            chatHistory.push({ role: 'ai', text: fullText, time: formatTime(), engine: 'Groq Cloud (<100ms)' });
            try {
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory.slice(-20)));
            } catch (e) {}
            isSending = false;
            const input = document.getElementById('cpChatInput');
            if (input) input.focus();
          },
          onError: () => {
            executeRestFetch();
          }
        });
        return;
      }

      await executeRestFetch();

      async function executeRestFetch() {
        try {
          const res = await fetch(`${getApiBaseUrl()}/chat/message`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              message: text,
              history: historyPayload
            })
          });

          const data = await res.json().catch(() => ({}));
          removeTypingIndicator();

          if (res.status === 401) {
            appendBubbleToDOM(
              'ai',
              '🔒 **Session Expired:** Your login session has expired. Please [log in again](login.html) to continue chatting with your AI Career Mentor.',
              formatTime()
            );
            return;
          }

          if (res.status === 429) {
            const cooldownMsg = data.message || 'AI Career Mentor is currently cooling down. You have reached your rate limit for this window. Please wait a few minutes before continuing.';
            appendBubbleToDOM(
              'ai',
              `⏳ **Rate Limit Notice:** ${cooldownMsg}`,
              formatTime()
            );
            return;
          }

          if (data.success && data.reply) {
            const aiTime = formatTime();
            appendBubbleToDOM('ai', data.reply, aiTime, true, data.engine || 'Disheera Engine');
            chatHistory.push({ role: 'ai', text: data.reply, time: aiTime, engine: data.engine });
            try {
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory.slice(-20)));
            } catch (e) {}
          } else {
            const errorMsg = data.message || 'Sorry, I could not process your question right now. Please try again.';
            appendBubbleToDOM('ai', `⚠️ ${errorMsg}`, formatTime());
          }
        } catch (fetchErr) {
          removeTypingIndicator();
          console.error('Chatbot fetch error:', fetchErr);
          appendBubbleToDOM(
            'ai',
            '⚠️ Could not connect to Disheera backend server. Please verify your connection or try again shortly.',
            formatTime()
          );
        }
      }
    } catch (err) {
      removeTypingIndicator();
      console.error('Chatbot error:', err);
      appendBubbleToDOM(
        'ai',
        '⚠️ An unexpected error occurred. Please try again.',
        formatTime()
      );
    } finally {
      isSending = false;
      const input = document.getElementById('cpChatInput');
      if (input) input.focus();
    }
  }

  // Mount lazily after page load & idle to eliminate render blocking & forced reflows
  let widgetInjected = false;
  function safeInjectWidgetDOM() {
    if (widgetInjected) return;
    widgetInjected = true;
    injectWidgetDOM();
  }

  function scheduleWidgetInit() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(safeInjectWidgetDOM, { timeout: 2000 });
    } else {
      setTimeout(safeInjectWidgetDOM, 1200);
    }
  }

  if (document.readyState === 'complete') {
    scheduleWidgetInit();
  } else {
    window.addEventListener('load', scheduleWidgetInit, { once: true });
  }

  window.DisheeraChat = window.CareerPathChat = {
    open: () => {
      safeInjectWidgetDOM();
      const drawer = document.getElementById('cpChatDrawer');
      if (drawer) {
        drawer.classList.add('open');
        updateStudentHeader();
      }
    },
    close: () => document.getElementById('cpChatDrawer')?.classList.remove('open'),
    send: (prompt) => {
      safeInjectWidgetDOM();
      sendUserMessage(prompt);
    }
  };
})();

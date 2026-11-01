/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * resume-builder.js — Dual-Pane Reactive Resume Builder & ATS Job Matcher
 * Disheera · Enterprise Platform Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
  // ── Authentication Check (strict student portal isolation) ─
  if (!window.Auth?.requireStudent()) {
    return;
  }
  window.Auth?.consumePortalAlert();

  // ── State Variables ──────────────────────────────────────────
  let resumeData = null;
  let saveDebounceTimer = null;
  let activeZoom = 1.0;
  let activeAiTarget = null; // { type: 'summary'|'project'|'experience', index, key }

  // ── DOM Elements ─────────────────────────────────────────────
  const paper = document.getElementById('resumePaper');
  const previewWrapper = document.getElementById('previewScrollWrapper');
  const saveStatusText = document.getElementById('saveStatusText');
  const zoomLevelDisplay = document.getElementById('zoomLevelDisplay');

  // Input Fields
  const inpFullName = document.getElementById('inpFullName');
  const inpHeadline = document.getElementById('inpHeadline');
  const inpEmail = document.getElementById('inpEmail');
  const inpPhone = document.getElementById('inpPhone');
  const inpLocation = document.getElementById('inpLocation');
  const inpGitHub = document.getElementById('inpGitHub');
  const inpLinkedIn = document.getElementById('inpLinkedIn');
  const inpPortfolio = document.getElementById('inpPortfolio');
  const inpSummary = document.getElementById('inpSummary');
  const summaryWordCount = document.getElementById('summaryWordCount');
  const inpLanguages = document.getElementById('inpLanguages');
  const inpAchievements = document.getElementById('inpAchievements');
  const inpHobbies = document.getElementById('inpHobbies');

  // Container Repeaters
  const educationListContainer = document.getElementById('educationListContainer');
  const skillsListContainer = document.getElementById('skillsListContainer');
  const projectsListContainer = document.getElementById('projectsListContainer');
  const experienceListContainer = document.getElementById('experienceListContainer');
  const certificationsListContainer = document.getElementById('certificationsListContainer');

  // Buttons
  const btnSaveDraft = document.getElementById('btnSaveDraft');
  const btnDownloadPdf = document.getElementById('btnDownloadPdf');
  const btnPrintResume = document.getElementById('btnPrintResume');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnAddEducation = document.getElementById('btnAddEducation');
  const btnAddSkill = document.getElementById('btnAddSkill');
  const btnAddProject = document.getElementById('btnAddProject');
  const btnAddExperience = document.getElementById('btnAddExperience');
  const btnAddCertification = document.getElementById('btnAddCertification');
  const btnAutoSyncProfile = document.getElementById('btnAutoSyncProfile');
  const btnImportGithubRepos = document.getElementById('btnImportGithubRepos');
  const btnClearResume = document.getElementById('btnClearResume');
  const btnClearResumeQuick = document.getElementById('btnClearResumeQuick');
  const btnLoadSampleTemplate = document.getElementById('btnLoadSampleTemplate');
  const btnImproveSummary = document.getElementById('btnImproveSummary');
  const btnJobMatchModal = document.getElementById('btnJobMatchModal');
  const btnRunJobMatch = document.getElementById('btnRunJobMatch');

  // Template Buttons
  const templateButtons = document.querySelectorAll('.template-pill-btn');

  // Modals
  const aiModal = new bootstrap.Modal(document.getElementById('aiImproveModal'));
  const jobMatchModal = new bootstrap.Modal(document.getElementById('jobMatchModal'));

  // ── Helper: User-Scoped Local Storage Key ────────────────────
  const getStorageKey = () => {
    const user = window.Auth?.getUser();
    const uid = user?._id || user?.id || 'default';
    return `careerpath_resume_draft_${uid}`;
  };

  // ── Helper: Safe Text Escaping ───────────────────────────────
  const escapeHtml = (str) => {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // ── Update Save Status UI ────────────────────────────────────
  const setSaveStatus = (status, text) => {
    if (!saveStatusText) return;
    saveStatusText.textContent = text;
    const dot = document.querySelector('#saveStatus .badge-dot');
    if (dot) {
      dot.className = `badge-dot ${status === 'saving' ? 'bg-warning' : status === 'saved' ? 'bg-success' : 'bg-secondary'}`;
    }
  };

  // ── Debounced Draft Save ─────────────────────────────────────
  const triggerAutoSave = () => {
    setSaveStatus('saving', 'Saving...');
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);

    // Save offline snapshot immediately
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(resumeData));
    } catch (e) {}

    saveDebounceTimer = setTimeout(async () => {
      try {
        await window.API.post('/resume/builder', { resumeData }, { auth: true });
        setSaveStatus('saved', 'Saved');
      } catch (err) {
        console.warn('Auto-save error:', err.message);
        setSaveStatus('saved', 'Saved locally');
      }
    }, 1500);
  };

  // ── Update Word Count ────────────────────────────────────────
  const updateSummaryWordCount = () => {
    if (!summaryWordCount || !inpSummary) return;
    const text = inpSummary.value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    summaryWordCount.textContent = `${count} word${count === 1 ? '' : 's'}`;
  };

  // ============================================================
  // TEMPLATE RENDERERS
  // ============================================================

  // ── Template 1: Student / Fresher ⭐ ─────────────────────────
  const renderStudentTemplate = (data) => {
    const p = data.personalInfo || {};
    const contactParts = [
      p.email ? `<a href="mailto:${escapeHtml(p.email)}"><i class="bi bi-envelope"></i> ${escapeHtml(p.email)}</a>` : '',
      p.phone ? `<span><i class="bi bi-telephone"></i> ${escapeHtml(p.phone)}</span>` : '',
      p.location ? `<span><i class="bi bi-geo-alt"></i> ${escapeHtml(p.location)}</span>` : '',
      p.gitHub ? `<a href="${escapeHtml(p.gitHub)}" target="_blank"><i class="bi bi-github"></i> GitHub</a>` : '',
      p.linkedIn ? `<a href="${escapeHtml(p.linkedIn)}" target="_blank"><i class="bi bi-linkedin"></i> LinkedIn</a>` : '',
      p.portfolio ? `<a href="${escapeHtml(p.portfolio)}" target="_blank"><i class="bi bi-globe"></i> Portfolio</a>` : '',
    ].filter(Boolean).join(' • ');

    // Education HTML
    const eduHtml = (data.education || []).map(ed => `
      <div class="item-block">
        <div class="item-header">
          <span class="item-title">${escapeHtml(ed.degree || 'Degree')}</span>
          <span class="item-date">${escapeHtml(ed.startYear || '')} – ${escapeHtml(ed.gradYear || 'Present')}</span>
        </div>
        <div class="item-subtitle">${escapeHtml(ed.college || '')}${ed.university ? ` (${escapeHtml(ed.university)})` : ''}</div>
        ${ed.score ? `<div class="item-bullets" style="padding-left: 0; list-style: none;">Score / CGPA: <strong>${escapeHtml(ed.score)}</strong></div>` : ''}
      </div>
    `).join('');

    // Skills HTML
    const skillsHtml = (data.skills || []).map(s => `
      <span class="skill-tag ${s.isVerified ? 'verified' : ''}">
        ${escapeHtml(s.name)}
        ${s.isVerified ? '<span class="verified-badge-mini" title="Disheera Verified"><i class="bi bi-patch-check-fill"></i></span>' : ''}
      </span>
    `).join('');

    // Projects HTML
    const projectsHtml = (data.projects || []).map(pr => `
      <div class="item-block">
        <div class="item-header">
          <span class="item-title">
            ${escapeHtml(pr.title)}
            ${pr.githubUrl ? `<a href="${escapeHtml(pr.githubUrl)}" target="_blank" class="ms-1 text-primary small"><i class="bi bi-github"></i></a>` : ''}
            ${pr.liveUrl ? `<a href="${escapeHtml(pr.liveUrl)}" target="_blank" class="ms-1 text-info small"><i class="bi bi-box-arrow-up-right"></i></a>` : ''}
            ${pr.isVerified ? '<span class="verified-badge-mini ms-1" title="Code Analysis Verified"><i class="bi bi-patch-check-fill"></i> Verified</span>' : ''}
          </span>
        </div>
        <p class="summary-text mb-1" style="font-size: 11px;">${escapeHtml(pr.description || '')}</p>
        ${Array.isArray(pr.techStack) && pr.techStack.length ? `
          <div class="tech-pills">
            ${pr.techStack.map(t => `<span class="tech-pill">${escapeHtml(t)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    // Experience HTML
    const expHtml = (data.experience || []).map(ex => `
      <div class="item-block">
        <div class="item-header">
          <span class="item-title">${escapeHtml(ex.role || 'Role')}</span>
          <span class="item-date">${escapeHtml(ex.duration || '2024 - Present')}</span>
        </div>
        <div class="item-subtitle">${escapeHtml(ex.company || 'Company')} <span class="badge bg-light text-dark border ms-1" style="font-size: 9px;">${escapeHtml(ex.type || 'Internship')}</span></div>
        <ul class="item-bullets">
          ${(ex.responsibilities || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    // Certifications HTML
    const certHtml = (data.certifications || []).map(c => `
      <div class="item-block mb-1">
        <div class="item-header">
          <span class="item-title" style="font-size: 12px;">
            ${escapeHtml(c.name)}
            ${c.credentialUrl ? `<a href="${escapeHtml(c.credentialUrl)}" target="_blank" class="ms-1 text-primary small"><i class="bi bi-link-45deg"></i></a>` : ''}
          </span>
          <span class="item-date">${escapeHtml(c.date || '')}</span>
        </div>
        <div class="item-subtitle" style="font-size: 11px;">${escapeHtml(c.issuer || '')}</div>
      </div>
    `).join('');

    return `
      <div class="resume-header">
        <h1 class="candidate-name">${escapeHtml(p.fullName || 'Candidate Name')}</h1>
        <div class="candidate-headline">${escapeHtml(p.headline || 'Software Engineer')}</div>
        <div class="candidate-contact">${contactParts}</div>
      </div>

      ${data.summary ? `
        <div class="section-title">Professional Summary</div>
        <p class="summary-text">${escapeHtml(data.summary)}</p>
      ` : ''}

      ${eduHtml ? `
        <div class="section-title">Education</div>
        ${eduHtml}
      ` : ''}

      ${skillsHtml ? `
        <div class="section-title">Technical Skills & Verified Badges</div>
        <div class="skills-grid">${skillsHtml}</div>
      ` : ''}

      ${projectsHtml ? `
        <div class="section-title">Featured Projects & Study Repositories</div>
        ${projectsHtml}
      ` : ''}

      ${expHtml ? `
        <div class="section-title">Experience & Internships</div>
        ${expHtml}
      ` : ''}

      ${certHtml ? `
        <div class="section-title">Certifications & Accreditations</div>
        ${certHtml}
      ` : ''}

      ${data.additional?.achievements?.length || data.additional?.languages?.length ? `
        <div class="section-title">Additional Information</div>
        <div style="font-size: 11.5px; color: #334155;">
          ${data.additional?.languages?.length ? `<div><strong>Languages:</strong> ${escapeHtml(data.additional.languages.join(', '))}</div>` : ''}
          ${data.additional?.achievements?.length ? `
            <div class="mt-1"><strong>Key Achievements:</strong></div>
            <ul class="item-bullets">
              ${data.additional.achievements.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
            </ul>
          ` : ''}
          ${data.additional?.hobbies?.length ? `<div class="mt-1"><strong>Interests:</strong> ${escapeHtml(data.additional.hobbies.join(', '))}</div>` : ''}
        </div>
      ` : ''}
    `;
  };

  // ── Template 2: Modern Two-Column 💎 ─────────────────────────
  const renderModernTemplate = (data) => {
    const p = data.personalInfo || {};

    const sidebarContact = [
      p.email ? `<div class="sidebar-contact-item"><i class="bi bi-envelope text-teal"></i> <a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></div>` : '',
      p.phone ? `<div class="sidebar-contact-item"><i class="bi bi-telephone text-teal"></i> <span>${escapeHtml(p.phone)}</span></div>` : '',
      p.location ? `<div class="sidebar-contact-item"><i class="bi bi-geo-alt text-teal"></i> <span>${escapeHtml(p.location)}</span></div>` : '',
      p.gitHub ? `<div class="sidebar-contact-item"><i class="bi bi-github text-teal"></i> <a href="${escapeHtml(p.gitHub)}" target="_blank">GitHub Profile</a></div>` : '',
      p.linkedIn ? `<div class="sidebar-contact-item"><i class="bi bi-linkedin text-teal"></i> <a href="${escapeHtml(p.linkedIn)}" target="_blank">LinkedIn</a></div>` : '',
      p.portfolio ? `<div class="sidebar-contact-item"><i class="bi bi-globe text-teal"></i> <a href="${escapeHtml(p.portfolio)}" target="_blank">Portfolio</a></div>` : '',
    ].filter(Boolean).join('');

    const sidebarSkills = (data.skills || []).map(s => `
      <div class="sidebar-skill ${s.isVerified ? 'verified' : ''}">
        <span>${escapeHtml(s.name)}</span>
        ${s.isVerified ? '<i class="bi bi-patch-check-fill text-success" title="Verified Skill"></i>' : `<span style="font-size: 9px; opacity: 0.7;">${escapeHtml(s.level || '')}</span>`}
      </div>
    `).join('');

    const sidebarEdu = (data.education || []).map(ed => `
      <div class="mb-2">
        <div style="font-size: 11.5px; font-weight: 700; color: #ffffff;">${escapeHtml(ed.degree)}</div>
        <div style="font-size: 10.5px; color: #94a3b8;">${escapeHtml(ed.college)}</div>
        <div style="font-size: 10px; color: #5eead4;">${escapeHtml(ed.startYear)} – ${escapeHtml(ed.gradYear)} ${ed.score ? `• ${escapeHtml(ed.score)}` : ''}</div>
      </div>
    `).join('');

    const mainProjects = (data.projects || []).map(pr => `
      <div class="item-block">
        <div class="item-header">
          <span class="item-title">
            ${escapeHtml(pr.title)}
            ${pr.githubUrl ? `<a href="${escapeHtml(pr.githubUrl)}" target="_blank" class="ms-1 text-primary small"><i class="bi bi-github"></i></a>` : ''}
          </span>
        </div>
        <p class="summary-text mb-1" style="font-size: 11px;">${escapeHtml(pr.description)}</p>
        ${Array.isArray(pr.techStack) && pr.techStack.length ? `
          <div class="tech-pills">
            ${pr.techStack.map(t => `<span class="tech-pill">${escapeHtml(t)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    const mainExp = (data.experience || []).map(ex => `
      <div class="item-block">
        <div class="item-header">
          <span class="item-title">${escapeHtml(ex.role)}</span>
          <span class="item-date">${escapeHtml(ex.duration)}</span>
        </div>
        <div class="item-subtitle">${escapeHtml(ex.company)} (${escapeHtml(ex.type)})</div>
        <ul class="item-bullets">
          ${(ex.responsibilities || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    return `
      <div class="modern-sidebar">
        <div class="sidebar-title">Contact Information</div>
        ${sidebarContact}

        ${sidebarSkills ? `
          <div class="sidebar-title">Verified Skills</div>
          ${sidebarSkills}
        ` : ''}

        ${sidebarEdu ? `
          <div class="sidebar-title">Education</div>
          ${sidebarEdu}
        ` : ''}

        ${data.additional?.languages?.length ? `
          <div class="sidebar-title">Languages</div>
          <div style="font-size: 10.5px; color: #cbd5e1;">${escapeHtml(data.additional.languages.join(', '))}</div>
        ` : ''}
      </div>

      <div class="modern-main">
        <h1 class="candidate-name">${escapeHtml(p.fullName || 'Candidate Name')}</h1>
        <div class="candidate-headline">${escapeHtml(p.headline || 'Full-Stack Developer')}</div>

        ${data.summary ? `
          <div class="main-section-title">Profile Summary</div>
          <p class="summary-text">${escapeHtml(data.summary)}</p>
        ` : ''}

        ${mainProjects ? `
          <div class="main-section-title">Technical Projects & Repos</div>
          ${mainProjects}
        ` : ''}

        ${mainExp ? `
          <div class="main-section-title">Work & Project Experience</div>
          ${mainExp}
        ` : ''}

        ${data.additional?.achievements?.length ? `
          <div class="main-section-title">Achievements & Milestones</div>
          <ul class="item-bullets">
            ${data.additional.achievements.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `;
  };

  // ── Template 3: Executive Professional 💼 ────────────────────
  const renderProfessionalTemplate = (data) => {
    const p = data.personalInfo || {};
    const contactLine = [
      p.email ? `<a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>` : '',
      p.phone ? `<span>${escapeHtml(p.phone)}</span>` : '',
      p.location ? `<span>${escapeHtml(p.location)}</span>` : '',
      p.gitHub ? `<a href="${escapeHtml(p.gitHub)}" target="_blank">GitHub</a>` : '',
      p.linkedIn ? `<a href="${escapeHtml(p.linkedIn)}" target="_blank">LinkedIn</a>` : '',
    ].filter(Boolean).join(' | ');

    const expHtml = (data.experience || []).map(ex => `
      <div class="item-block">
        <div class="item-header">
          <span class="item-title">${escapeHtml(ex.role)} — ${escapeHtml(ex.company)}</span>
          <span class="item-date">${escapeHtml(ex.duration)}</span>
        </div>
        <ul class="item-bullets">
          ${(ex.responsibilities || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    const projHtml = (data.projects || []).map(pr => `
      <div class="item-block">
        <div class="item-header">
          <span class="item-title">${escapeHtml(pr.title)}</span>
          <span class="item-date">${escapeHtml((pr.techStack || []).join(', '))}</span>
        </div>
        <p class="summary-text mb-1" style="font-size: 11px;">${escapeHtml(pr.description)}</p>
      </div>
    `).join('');

    const eduHtml = (data.education || []).map(ed => `
      <div class="item-block">
        <div class="item-header">
          <span class="item-title">${escapeHtml(ed.degree)}</span>
          <span class="item-date">${escapeHtml(ed.startYear)} – ${escapeHtml(ed.gradYear)}</span>
        </div>
        <div class="item-subtitle">${escapeHtml(ed.college)} ${ed.score ? `— ${escapeHtml(ed.score)}` : ''}</div>
      </div>
    `).join('');

    const skillsStr = (data.skills || []).map(s => `${s.name}${s.isVerified ? ' (✓ Verified)' : ''}`).join(', ');

    return `
      <div class="resume-header">
        <h1 class="candidate-name">${escapeHtml(p.fullName || 'Candidate Name')}</h1>
        <div class="candidate-headline">${escapeHtml(p.headline || 'Software Engineer')}</div>
        <div class="candidate-contact">${contactLine}</div>
      </div>

      ${data.summary ? `
        <div class="section-title">Executive Summary</div>
        <p class="summary-text">${escapeHtml(data.summary)}</p>
      ` : ''}

      ${expHtml ? `
        <div class="section-title">Professional Experience</div>
        ${expHtml}
      ` : ''}

      ${projHtml ? `
        <div class="section-title">Key Projects & Systems</div>
        ${projHtml}
      ` : ''}

      ${skillsStr ? `
        <div class="section-title">Core Competencies & Skills</div>
        <p class="summary-text mb-2">${escapeHtml(skillsStr)}</p>
      ` : ''}

      ${eduHtml ? `
        <div class="section-title">Education & Credentials</div>
        ${eduHtml}
      ` : ''}
    `;
  };

  // ── Template 4: ATS Simple 📄 ────────────────────────────────
  const renderAtsSimpleTemplate = (data) => {
    const p = data.personalInfo || {};
    const contactLine = [
      p.email ? `<a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>` : '',
      p.phone ? escapeHtml(p.phone) : '',
      p.location ? escapeHtml(p.location) : '',
      p.gitHub ? `<a href="${escapeHtml(p.gitHub)}">GitHub</a>` : '',
      p.linkedIn ? `<a href="${escapeHtml(p.linkedIn)}">LinkedIn</a>` : '',
    ].filter(Boolean).join(' | ');

    const eduHtml = (data.education || []).map(ed => `
      <div style="margin-bottom: 8px;">
        <div class="item-header">
          <span>${escapeHtml(ed.college)}</span>
          <span>${escapeHtml(ed.startYear)} - ${escapeHtml(ed.gradYear)}</span>
        </div>
        <div class="item-subtitle">${escapeHtml(ed.degree)} ${ed.score ? `(CGPA: ${escapeHtml(ed.score)})` : ''}</div>
      </div>
    `).join('');

    const skillsGrouped = (data.skills || []).map(s => s.name).join(', ');

    const projHtml = (data.projects || []).map(pr => `
      <div style="margin-bottom: 8px;">
        <div class="item-header">
          <span>${escapeHtml(pr.title)}</span>
          <span style="font-weight: normal; font-size: 10.5px;">${escapeHtml((pr.techStack || []).join(', '))}</span>
        </div>
        <div class="item-bullets">
          <li>${escapeHtml(pr.description)}</li>
          ${pr.githubUrl ? `<li>Repository: ${escapeHtml(pr.githubUrl)}</li>` : ''}
        </div>
      </div>
    `).join('');

    const expHtml = (data.experience || []).map(ex => `
      <div style="margin-bottom: 8px;">
        <div class="item-header">
          <span>${escapeHtml(ex.role)} | ${escapeHtml(ex.company)}</span>
          <span>${escapeHtml(ex.duration)}</span>
        </div>
        <ul class="item-bullets">
          ${(ex.responsibilities || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    return `
      <div class="candidate-name">${escapeHtml(p.fullName || 'Candidate Name')}</div>
      <div class="candidate-contact">${contactLine}</div>

      ${data.summary ? `
        <div class="section-title">PROFESSIONAL SUMMARY</div>
        <div class="summary-text">${escapeHtml(data.summary)}</div>
      ` : ''}

      ${eduHtml ? `
        <div class="section-title">EDUCATION</div>
        ${eduHtml}
      ` : ''}

      ${skillsGrouped ? `
        <div class="section-title">TECHNICAL SKILLS</div>
        <div class="skills-line">${escapeHtml(skillsGrouped)}</div>
      ` : ''}

      ${projHtml ? `
        <div class="section-title">PROJECTS</div>
        ${projHtml}
      ` : ''}

      ${expHtml ? `
        <div class="section-title">EXPERIENCE</div>
        ${expHtml}
      ` : ''}
    `;
  };

  // ── Render Resume Preview Master ─────────────────────────────
  const renderResumePreview = () => {
    if (!resumeData || !paper) return;

    const tpl = resumeData.template || 'student';
    paper.className = `resume-paper template-${tpl}`;

    if (tpl === 'modern') {
      paper.innerHTML = renderModernTemplate(resumeData);
    } else if (tpl === 'professional') {
      paper.innerHTML = renderProfessionalTemplate(resumeData);
    } else if (tpl === 'ats_simple') {
      paper.innerHTML = renderAtsSimpleTemplate(resumeData);
    } else {
      paper.innerHTML = renderStudentTemplate(resumeData);
    }

    const hasAnyContent = Boolean(
      resumeData.summary ||
      (resumeData.education && resumeData.education.length > 0) ||
      (resumeData.skills && resumeData.skills.length > 0) ||
      (resumeData.projects && resumeData.projects.length > 0) ||
      (resumeData.experience && resumeData.experience.length > 0) ||
      (resumeData.certifications && resumeData.certifications.length > 0) ||
      (resumeData.additional?.achievements && resumeData.additional.achievements.length > 0)
    );

    if (!hasAnyContent) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'empty-canvas-prompt p-4 text-center my-4 border border-dashed rounded-3';
      emptyNotice.style.background = 'rgba(248, 250, 252, 0.75)';
      emptyNotice.style.borderColor = '#cbd5e1';
      emptyNotice.innerHTML = `
        <i class="bi bi-pencil-square fs-1 text-secondary opacity-50 mb-2 d-block"></i>
        <h6 class="fw-bold text-dark mb-1">Your Resume is Ready to Build</h6>
        <p class="small text-secondary mb-0">Use the form sections on the left to add your education, skills, and projects, or click <strong>Auto-Fill Profile</strong> to pull your verified assessment results.</p>
      `;
      paper.appendChild(emptyNotice);
    }
  };

  // ============================================================
  // FORM BINDINGS & REPEATERS
  // ============================================================

  // Populate Personal Details Form
  const populateFormFields = () => {
    if (!resumeData) return;
    const p = resumeData.personalInfo || {};

    if (inpFullName) inpFullName.value = p.fullName || '';
    if (inpHeadline) inpHeadline.value = p.headline || '';
    if (inpEmail) inpEmail.value = p.email || '';
    if (inpPhone) inpPhone.value = p.phone || '';
    if (inpLocation) inpLocation.value = p.location || '';
    if (inpGitHub) inpGitHub.value = p.gitHub || '';
    if (inpLinkedIn) inpLinkedIn.value = p.linkedIn || '';
    if (inpPortfolio) inpPortfolio.value = p.portfolio || '';
    if (inpSummary) inpSummary.value = resumeData.summary || '';
    updateSummaryWordCount();

    if (inpLanguages && resumeData.additional?.languages) {
      inpLanguages.value = resumeData.additional.languages.join(', ');
    }
    if (inpAchievements && resumeData.additional?.achievements) {
      inpAchievements.value = resumeData.additional.achievements.join('\n');
    }
    if (inpHobbies && resumeData.additional?.hobbies) {
      inpHobbies.value = resumeData.additional.hobbies.join(', ');
    }

    renderEducationList();
    renderSkillsList();
    renderProjectsList();
    renderExperienceList();
    renderCertificationsList();

    // Select Active Template Button
    templateButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.template === (resumeData.template || 'student'));
    });
  };

  // ── Render Education Repeater ─────────────────────────────────
  const renderEducationList = () => {
    if (!educationListContainer) return;
    educationListContainer.innerHTML = '';

    if (!resumeData.education || resumeData.education.length === 0) {
      educationListContainer.innerHTML = '<div class="text-muted small py-2 px-1 fst-italic">No education entries added yet. Click "+ Add Education" below.</div>';
      return;
    }

    (resumeData.education || []).forEach((ed, index) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <button type="button" class="btn-remove-item" data-remove-edu="${index}" title="Remove entry">
          <i class="bi bi-trash3"></i>
        </button>
        <div class="row g-2">
          <div class="col-sm-6">
            <label class="cp-input-label">Degree / Course</label>
            <input type="text" class="cp-form-control edu-field" data-field="degree" data-index="${index}" value="${escapeHtml(ed.degree || '')}" placeholder="BCA / B.Tech Computer Science" />
          </div>
          <div class="col-sm-6">
            <label class="cp-input-label">College / University</label>
            <input type="text" class="cp-form-control edu-field" data-field="college" data-index="${index}" value="${escapeHtml(ed.college || '')}" placeholder="Institute Name" />
          </div>
          <div class="col-sm-4">
            <label class="cp-input-label">Start Year</label>
            <input type="text" class="cp-form-control edu-field" data-field="startYear" data-index="${index}" value="${escapeHtml(ed.startYear || '')}" placeholder="2023" />
          </div>
          <div class="col-sm-4">
            <label class="cp-input-label">Grad Year</label>
            <input type="text" class="cp-form-control edu-field" data-field="gradYear" data-index="${index}" value="${escapeHtml(ed.gradYear || '')}" placeholder="2026" />
          </div>
          <div class="col-sm-4">
            <label class="cp-input-label">CGPA / Score</label>
            <input type="text" class="cp-form-control edu-field" data-field="score" data-index="${index}" value="${escapeHtml(ed.score || '')}" placeholder="8.5 CGPA" />
          </div>
        </div>
      `;
      educationListContainer.appendChild(item);
    });
  };

  // ── Render Skills Repeater ────────────────────────────────────
  const renderSkillsList = () => {
    if (!skillsListContainer) return;
    skillsListContainer.innerHTML = '';

    if (!resumeData.skills || resumeData.skills.length === 0) {
      skillsListContainer.innerHTML = '<div class="text-muted small py-2 px-1 fst-italic">No skills added yet. Click "+ Add Skill" or "Auto-Fill Profile".</div>';
      return;
    }

    (resumeData.skills || []).forEach((s, index) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <button type="button" class="btn-remove-item" data-remove-skill="${index}" title="Remove skill">
          <i class="bi bi-trash3"></i>
        </button>
        <div class="row g-2 align-items-center">
          <div class="col-sm-5">
            <label class="cp-input-label">Skill Name</label>
            <input type="text" class="cp-form-control skill-field" data-field="name" data-index="${index}" value="${escapeHtml(s.name || '')}" placeholder="e.g. JavaScript" />
          </div>
          <div class="col-sm-4">
            <label class="cp-input-label">Proficiency</label>
            <select class="cp-form-control skill-field" data-field="level" data-index="${index}">
              <option value="Beginner" ${s.level === 'Beginner' ? 'selected' : ''}>Beginner</option>
              <option value="Intermediate" ${s.level === 'Intermediate' || !s.level ? 'selected' : ''}>Intermediate</option>
              <option value="Advanced" ${s.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
            </select>
          </div>
          <div class="col-sm-3 pt-3">
            <div class="form-check form-switch">
              <input class="form-check-input skill-field" type="checkbox" role="switch" data-field="isVerified" data-index="${index}" ${s.isVerified ? 'checked' : ''} id="skillVer_${index}" />
              <label class="form-check-label small text-muted" for="skillVer_${index}">Verified</label>
            </div>
          </div>
        </div>
      `;
      skillsListContainer.appendChild(item);
    });
  };

  // ── Render Projects Repeater ──────────────────────────────────
  const renderProjectsList = () => {
    if (!projectsListContainer) return;
    projectsListContainer.innerHTML = '';

    if (!resumeData.projects || resumeData.projects.length === 0) {
      projectsListContainer.innerHTML = '<div class="text-muted small py-2 px-1 fst-italic">No projects added yet. Click "+ Add Project" or "GitHub Repos".</div>';
      return;
    }

    (resumeData.projects || []).forEach((pr, index) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <button type="button" class="btn-remove-item" data-remove-project="${index}" title="Remove project">
          <i class="bi bi-trash3"></i>
        </button>
        <div class="row g-2">
          <div class="col-sm-7">
            <label class="cp-input-label">Project Title</label>
            <input type="text" class="cp-form-control proj-field" data-field="title" data-index="${index}" value="${escapeHtml(pr.title || '')}" placeholder="Project Name" />
          </div>
          <div class="col-sm-5">
            <label class="cp-input-label">GitHub Repository URL</label>
            <input type="url" class="cp-form-control proj-field" data-field="githubUrl" data-index="${index}" value="${escapeHtml(pr.githubUrl || '')}" placeholder="https://github.com/..." />
          </div>
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="cp-input-label mb-0">Project Description & Impact</label>
              <button type="button" class="btn-ai-polish btn-polish-proj" data-index="${index}">
                <i class="bi bi-stars"></i> ✨ Polish with AI
              </button>
            </div>
            <textarea class="cp-form-control proj-field" data-field="description" data-index="${index}" rows="2" placeholder="Engineered responsive full-stack application with automated testing and continuous deployment.">${escapeHtml(pr.description || '')}</textarea>
          </div>
          <div class="col-sm-8">
            <label class="cp-input-label">Tech Stack (comma-separated)</label>
            <input type="text" class="cp-form-control proj-field" data-field="techStack" data-index="${index}" value="${escapeHtml(Array.isArray(pr.techStack) ? pr.techStack.join(', ') : pr.techStack || '')}" placeholder="React, Node.js, MongoDB, Docker" />
          </div>
          <div class="col-sm-4 pt-3">
            <div class="form-check form-switch">
              <input class="form-check-input proj-field" type="checkbox" role="switch" data-field="isVerified" data-index="${index}" ${pr.isVerified ? 'checked' : ''} id="projVer_${index}" />
              <label class="form-check-label small text-muted" for="projVer_${index}">Code Verified</label>
            </div>
          </div>
        </div>
      `;
      projectsListContainer.appendChild(item);
    });
  };

  // ── Render Experience Repeater ────────────────────────────────
  const renderExperienceList = () => {
    if (!experienceListContainer) return;
    experienceListContainer.innerHTML = '';

    if (!resumeData.experience || resumeData.experience.length === 0) {
      experienceListContainer.innerHTML = '<div class="text-muted small py-2 px-1 fst-italic">No experience or internships added yet. Click "+ Add Experience" below.</div>';
      return;
    }

    (resumeData.experience || []).forEach((ex, index) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <button type="button" class="btn-remove-item" data-remove-exp="${index}" title="Remove entry">
          <i class="bi bi-trash3"></i>
        </button>
        <div class="row g-2">
          <div class="col-sm-6">
            <label class="cp-input-label">Company / Organization</label>
            <input type="text" class="cp-form-control exp-field" data-field="company" data-index="${index}" value="${escapeHtml(ex.company || '')}" placeholder="Company Name" />
          </div>
          <div class="col-sm-6">
            <label class="cp-input-label">Role / Job Title</label>
            <input type="text" class="cp-form-control exp-field" data-field="role" data-index="${index}" value="${escapeHtml(ex.role || '')}" placeholder="Frontend Developer Intern" />
          </div>
          <div class="col-sm-6">
            <label class="cp-input-label">Experience Type</label>
            <select class="cp-form-control exp-field" data-field="type" data-index="${index}">
              <option value="Internship" ${ex.type === 'Internship' ? 'selected' : ''}>Internship</option>
              <option value="Full-time" ${ex.type === 'Full-time' ? 'selected' : ''}>Full-time</option>
              <option value="Hackathon" ${ex.type === 'Hackathon' ? 'selected' : ''}>Hackathon</option>
              <option value="Freelance" ${ex.type === 'Freelance' ? 'selected' : ''}>Freelance</option>
              <option value="Academic" ${ex.type === 'Academic' ? 'selected' : ''}>Academic Project</option>
            </select>
          </div>
          <div class="col-sm-6">
            <label class="cp-input-label">Duration</label>
            <input type="text" class="cp-form-control exp-field" data-field="duration" data-index="${index}" value="${escapeHtml(ex.duration || '')}" placeholder="June 2024 – Present" />
          </div>
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="cp-input-label mb-0">Responsibilities & Achievements (one bullet per line)</label>
              <button type="button" class="btn-ai-polish btn-polish-exp" data-index="${index}">
                <i class="bi bi-stars"></i> ✨ Polish with AI
              </button>
            </div>
            <textarea class="cp-form-control exp-field" data-field="responsibilities" data-index="${index}" rows="3" placeholder="Engineered high-performance web components using modern CSS&#10;Integrated third-party APIs and reduced query latency by 20%">${escapeHtml((ex.responsibilities || []).join('\n'))}</textarea>
          </div>
        </div>
      `;
      experienceListContainer.appendChild(item);
    });
  };

  // ── Render Certifications Repeater ────────────────────────────
  const renderCertificationsList = () => {
    if (!certificationsListContainer) return;
    certificationsListContainer.innerHTML = '';

    if (!resumeData.certifications || resumeData.certifications.length === 0) {
      certificationsListContainer.innerHTML = '<div class="text-muted small py-2 px-1 fst-italic">No certifications added yet. Click "+ Add Certification" below.</div>';
      return;
    }

    (resumeData.certifications || []).forEach((c, index) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <button type="button" class="btn-remove-item" data-remove-cert="${index}" title="Remove certification">
          <i class="bi bi-trash3"></i>
        </button>
        <div class="row g-2">
          <div class="col-sm-6">
            <label class="cp-input-label">Certification Name</label>
            <input type="text" class="cp-form-control cert-field" data-field="name" data-index="${index}" value="${escapeHtml(c.name || '')}" placeholder="Disheera Verified Assessment" />
          </div>
          <div class="col-sm-6">
            <label class="cp-input-label">Issuing Organization</label>
            <input type="text" class="cp-form-control cert-field" data-field="issuer" data-index="${index}" value="${escapeHtml(c.issuer || '')}" placeholder="Disheera / AWS / Google" />
          </div>
          <div class="col-sm-6">
            <label class="cp-input-label">Issue Date / Year</label>
            <input type="text" class="cp-form-control cert-field" data-field="date" data-index="${index}" value="${escapeHtml(c.date || '')}" placeholder="2026" />
          </div>
          <div class="col-sm-6">
            <label class="cp-input-label">Credential Verification URL</label>
            <input type="url" class="cp-form-control cert-field" data-field="credentialUrl" data-index="${index}" value="${escapeHtml(c.credentialUrl || '')}" placeholder="https://..." />
          </div>
        </div>
      `;
      certificationsListContainer.appendChild(item);
    });
  };

  // ============================================================
  // EVENT LISTENERS: TWO-WAY DATA BINDING
  // ============================================================

  // Personal Details Inputs
  const bindPersonalInput = (elem, field) => {
    if (!elem) return;
    elem.addEventListener('input', (e) => {
      if (!resumeData.personalInfo) resumeData.personalInfo = {};
      resumeData.personalInfo[field] = e.target.value;
      renderResumePreview();
      triggerAutoSave();
    });
  };

  bindPersonalInput(inpFullName, 'fullName');
  bindPersonalInput(inpHeadline, 'headline');
  bindPersonalInput(inpEmail, 'email');
  bindPersonalInput(inpPhone, 'phone');
  bindPersonalInput(inpLocation, 'location');
  bindPersonalInput(inpGitHub, 'gitHub');
  bindPersonalInput(inpLinkedIn, 'linkedIn');
  bindPersonalInput(inpPortfolio, 'portfolio');

  // Summary Input
  if (inpSummary) {
    inpSummary.addEventListener('input', (e) => {
      resumeData.summary = e.target.value;
      updateSummaryWordCount();
      renderResumePreview();
      triggerAutoSave();
    });
  }

  // Additional Details Inputs
  if (inpLanguages) {
    inpLanguages.addEventListener('input', (e) => {
      if (!resumeData.additional) resumeData.additional = {};
      resumeData.additional.languages = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
      renderResumePreview();
      triggerAutoSave();
    });
  }

  if (inpAchievements) {
    inpAchievements.addEventListener('input', (e) => {
      if (!resumeData.additional) resumeData.additional = {};
      resumeData.additional.achievements = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
      renderResumePreview();
      triggerAutoSave();
    });
  }

  if (inpHobbies) {
    inpHobbies.addEventListener('input', (e) => {
      if (!resumeData.additional) resumeData.additional = {};
      resumeData.additional.hobbies = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
      renderResumePreview();
      triggerAutoSave();
    });
  }

  // Delegated Listeners for Repeaters (Education, Skills, Projects, Experience, Certifications)
  document.body.addEventListener('input', (e) => {
    // Education Fields
    if (e.target.classList.contains('edu-field')) {
      const idx = parseInt(e.target.dataset.index, 10);
      const field = e.target.dataset.field;
      if (resumeData.education[idx]) {
        resumeData.education[idx][field] = e.target.value;
        renderResumePreview();
        triggerAutoSave();
      }
    }

    // Skills Fields
    if (e.target.classList.contains('skill-field')) {
      const idx = parseInt(e.target.dataset.index, 10);
      const field = e.target.dataset.field;
      if (resumeData.skills[idx]) {
        resumeData.skills[idx][field] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        renderResumePreview();
        triggerAutoSave();
      }
    }

    // Project Fields
    if (e.target.classList.contains('proj-field')) {
      const idx = parseInt(e.target.dataset.index, 10);
      const field = e.target.dataset.field;
      if (resumeData.projects[idx]) {
        if (field === 'techStack') {
          resumeData.projects[idx][field] = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
        } else if (e.target.type === 'checkbox') {
          resumeData.projects[idx][field] = e.target.checked;
        } else {
          resumeData.projects[idx][field] = e.target.value;
        }
        renderResumePreview();
        triggerAutoSave();
      }
    }

    // Experience Fields
    if (e.target.classList.contains('exp-field')) {
      const idx = parseInt(e.target.dataset.index, 10);
      const field = e.target.dataset.field;
      if (resumeData.experience[idx]) {
        if (field === 'responsibilities') {
          resumeData.experience[idx][field] = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
        } else {
          resumeData.experience[idx][field] = e.target.value;
        }
        renderResumePreview();
        triggerAutoSave();
      }
    }

    // Certification Fields
    if (e.target.classList.contains('cert-field')) {
      const idx = parseInt(e.target.dataset.index, 10);
      const field = e.target.dataset.field;
      if (resumeData.certifications[idx]) {
        resumeData.certifications[idx][field] = e.target.value;
        renderResumePreview();
        triggerAutoSave();
      }
    }
  });

  // Delegated Clicks: Add & Remove buttons
  document.body.addEventListener('click', (e) => {
    // Remove Education
    const remEdu = e.target.closest('[data-remove-edu]');
    if (remEdu) {
      const idx = parseInt(remEdu.dataset.removeEdu, 10);
      resumeData.education.splice(idx, 1);
      renderEducationList();
      renderResumePreview();
      triggerAutoSave();
      return;
    }

    // Remove Skill
    const remSkill = e.target.closest('[data-remove-skill]');
    if (remSkill) {
      const idx = parseInt(remSkill.dataset.removeSkill, 10);
      resumeData.skills.splice(idx, 1);
      renderSkillsList();
      renderResumePreview();
      triggerAutoSave();
      return;
    }

    // Remove Project
    const remProj = e.target.closest('[data-remove-project]');
    if (remProj) {
      const idx = parseInt(remProj.dataset.removeProject, 10);
      resumeData.projects.splice(idx, 1);
      renderProjectsList();
      renderResumePreview();
      triggerAutoSave();
      return;
    }

    // Remove Experience
    const remExp = e.target.closest('[data-remove-exp]');
    if (remExp) {
      const idx = parseInt(remExp.dataset.removeExp, 10);
      resumeData.experience.splice(idx, 1);
      renderExperienceList();
      renderResumePreview();
      triggerAutoSave();
      return;
    }

    // Remove Certification
    const remCert = e.target.closest('[data-remove-cert]');
    if (remCert) {
      const idx = parseInt(remCert.dataset.removeCert, 10);
      resumeData.certifications.splice(idx, 1);
      renderCertificationsList();
      renderResumePreview();
      triggerAutoSave();
      return;
    }

    // AI Polish Project Button
    const polishProjBtn = e.target.closest('.btn-polish-proj');
    if (polishProjBtn) {
      const idx = parseInt(polishProjBtn.dataset.index, 10);
      const pr = resumeData.projects[idx];
      openAiEnhancerModal('bullet', pr?.description || '', { type: 'project', index: idx, key: 'description' });
      return;
    }

    // AI Polish Experience Button
    const polishExpBtn = e.target.closest('.btn-polish-exp');
    if (polishExpBtn) {
      const idx = parseInt(polishExpBtn.dataset.index, 10);
      const ex = resumeData.experience[idx];
      const bulletText = (ex?.responsibilities || []).join('\n') || ex?.role || '';
      openAiEnhancerModal('bullet', bulletText, { type: 'experience', index: idx, key: 'responsibilities' });
      return;
    }
  });

  // Add Item Buttons
  if (btnAddEducation) {
    btnAddEducation.addEventListener('click', () => {
      if (!resumeData.education) resumeData.education = [];
      resumeData.education.push({ degree: '', college: '', startYear: '2023', gradYear: '2026', score: '' });
      renderEducationList();
      renderResumePreview();
      triggerAutoSave();
    });
  }

  if (btnAddSkill) {
    btnAddSkill.addEventListener('click', () => {
      if (!resumeData.skills) resumeData.skills = [];
      resumeData.skills.push({ name: '', level: 'Intermediate', isVerified: false });
      renderSkillsList();
      renderResumePreview();
      triggerAutoSave();
    });
  }

  if (btnAddProject) {
    btnAddProject.addEventListener('click', () => {
      if (!resumeData.projects) resumeData.projects = [];
      resumeData.projects.push({ title: 'New Web Application', description: '', techStack: ['JavaScript'], githubUrl: '', liveUrl: '', isVerified: false });
      renderProjectsList();
      renderResumePreview();
      triggerAutoSave();
    });
  }

  if (btnAddExperience) {
    btnAddExperience.addEventListener('click', () => {
      if (!resumeData.experience) resumeData.experience = [];
      resumeData.experience.push({ company: 'Tech Solutions Inc.', role: 'Developer Intern', type: 'Internship', duration: '2024 - Present', responsibilities: ['Developed and tested modern web components'] });
      renderExperienceList();
      renderResumePreview();
      triggerAutoSave();
    });
  }

  if (btnAddCertification) {
    btnAddCertification.addEventListener('click', () => {
      if (!resumeData.certifications) resumeData.certifications = [];
      resumeData.certifications.push({ name: 'Certified Web Specialist', issuer: 'Disheera', date: '2026', credentialUrl: '' });
      renderCertificationsList();
      renderResumePreview();
      triggerAutoSave();
    });
  }

  // Template Switcher Buttons
  templateButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const chosenTpl = btn.dataset.template;
      templateButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      resumeData.template = chosenTpl;
      renderResumePreview();
      triggerAutoSave();
    });
  });

  // Zoom Controls
  if (btnZoomIn && btnZoomOut && previewWrapper) {
    btnZoomIn.addEventListener('click', () => {
      if (activeZoom < 1.3) {
        activeZoom = +(activeZoom + 0.1).toFixed(1);
        paper.style.transform = `scale(${activeZoom})`;
        zoomLevelDisplay.textContent = `${Math.round(activeZoom * 100)}%`;
      }
    });

    btnZoomOut.addEventListener('click', () => {
      if (activeZoom > 0.6) {
        activeZoom = +(activeZoom - 0.1).toFixed(1);
        paper.style.transform = `scale(${activeZoom})`;
        zoomLevelDisplay.textContent = `${Math.round(activeZoom * 100)}%`;
      }
    });
  }

  // ============================================================
  // AI POLISH & ENHANCEMENT HANDLER
  // ============================================================

  const openAiEnhancerModal = async (type, text, targetContext) => {
    activeAiTarget = targetContext;
    const originalDisplay = document.getElementById('aiOriginalTextDisplay');
    const spinner = document.getElementById('aiLoadingSpinner');
    const container = document.getElementById('aiSuggestionsContainer');

    originalDisplay.textContent = text || '(No text provided)';
    container.innerHTML = '';
    spinner.classList.remove('d-none');
    aiModal.show();

    try {
      const res = await window.API.post('/resume/improve-text', {
        text: text || 'Developed software solution for web applications',
        type,
        context: resumeData.personalInfo?.headline || 'Software Engineering',
      }, { auth: true });

      spinner.classList.add('d-none');

      if (res.success && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
        container.innerHTML = res.suggestions.map((sug, i) => `
          <div class="p-3 rounded bg-light border d-flex flex-column gap-2">
            <div class="text-dark" style="font-size: 0.92rem; line-height: 1.5;">${escapeHtml(sug)}</div>
            <div class="text-end">
              <button type="button" class="btn btn-outline-primary btn-sm px-3 py-1 btn-apply-ai-sug" data-sug-index="${i}">
                <i class="bi bi-check2"></i> Apply This Variation
              </button>
            </div>
          </div>
        `).join('');

        // Attach apply click handlers
        document.querySelectorAll('.btn-apply-ai-sug').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.sugIndex, 10);
            const chosen = res.suggestions[idx];
            applyAiSuggestion(chosen);
            aiModal.hide();
          });
        });
      } else {
        container.innerHTML = `<div class="text-warning small">Could not generate suggestions. Please try again.</div>`;
      }
    } catch (err) {
      spinner.classList.add('d-none');
      container.innerHTML = `<div class="text-danger small">Error: ${escapeHtml(err.message || 'AI request failed')}</div>`;
    }
  };

  const applyAiSuggestion = (suggestion) => {
    if (!activeAiTarget) return;

    if (activeAiTarget.type === 'summary') {
      resumeData.summary = suggestion;
      if (inpSummary) inpSummary.value = suggestion;
      updateSummaryWordCount();
    } else if (activeAiTarget.type === 'project') {
      const pr = resumeData.projects[activeAiTarget.index];
      if (pr) {
        pr.description = suggestion;
        renderProjectsList();
      }
    } else if (activeAiTarget.type === 'experience') {
      const ex = resumeData.experience[activeAiTarget.index];
      if (ex) {
        ex.responsibilities = [suggestion];
        renderExperienceList();
      }
    }

    renderResumePreview();
    triggerAutoSave();
  };

  if (btnImproveSummary) {
    btnImproveSummary.addEventListener('click', () => {
      const summaryText = inpSummary ? inpSummary.value.trim() : '';
      openAiEnhancerModal('summary', summaryText || resumeData.summary || '', { type: 'summary' });
    });
  }

  // ============================================================
  // ATS RESUME → JOB DESCRIPTION MATCHER
  // ============================================================

  if (btnJobMatchModal) {
    btnJobMatchModal.addEventListener('click', () => {
      jobMatchModal.show();
    });
  }

  if (btnRunJobMatch) {
    btnRunJobMatch.addEventListener('click', async () => {
      const jdInput = document.getElementById('inpJobDescription');
      const jdText = jdInput ? jdInput.value.trim() : '';

      if (!jdText || jdText.length < 20) {
        alert('Please paste a job description of at least 20 characters.');
        return;
      }

      const origBtnHtml = btnRunJobMatch.innerHTML;
      btnRunJobMatch.disabled = true;
      btnRunJobMatch.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Evaluating ATS Keywords...`;

      try {
        const res = await window.API.post('/resume/match-job', {
          resumeData,
          jobDescription: jdText,
        }, { auth: true });

        btnRunJobMatch.disabled = false;
        btnRunJobMatch.innerHTML = origBtnHtml;

        if (res.success && res.data) {
          const d = res.data;
          const resultsArea = document.getElementById('jobMatchResultsArea');
          const scoreDisplay = document.getElementById('matchScoreDisplay');
          const verdictDisplay = document.getElementById('matchVerdictDisplay');
          const matchedCountBadge = document.getElementById('matchedCountBadge');
          const missingCountBadge = document.getElementById('missingCountBadge');
          const matchedTags = document.getElementById('matchedSkillsTags');
          const missingTags = document.getElementById('missingSkillsTags');
          const adviceList = document.getElementById('tailoringAdviceList');

          resultsArea.classList.remove('d-none');
          scoreDisplay.textContent = `${d.matchScore}%`;
          scoreDisplay.className = `fw-bold mb-0 ${d.matchScore >= 80 ? 'text-success' : d.matchScore >= 60 ? 'text-warning' : 'text-danger'}`;
          verdictDisplay.textContent = `${d.verdict} — Based on ${d.demandedCount} detected role keywords`;

          matchedCountBadge.textContent = `${d.matchedCount} Matched`;
          missingCountBadge.textContent = `${d.missingCount} Missing`;

          matchedTags.innerHTML = (d.matchedSkills || []).map(s => `
            <span class="badge bg-success bg-opacity-25 border border-success text-success px-2 py-1">
              ✓ ${escapeHtml(s.name)}
            </span>
          `).join('') || '<span class="text-muted small">None detected</span>';

          missingTags.innerHTML = (d.missingSkills || []).map(s => `
            <span class="badge bg-danger bg-opacity-25 border border-danger text-danger px-2 py-1">
              + ${escapeHtml(s.name)} ${s.importance === 'High' ? '<span class="badge bg-danger ms-1">High</span>' : ''}
            </span>
          `).join('') || '<span class="text-success small">All target keywords present!</span>';

          adviceList.innerHTML = (d.tailoringAdvice || []).map(adv => `
            <li class="mb-1">${escapeHtml(adv).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
          `).join('');
        }
      } catch (err) {
        btnRunJobMatch.disabled = false;
        btnRunJobMatch.innerHTML = origBtnHtml;
        alert(err.message || 'ATS match analysis failed.');
      }
    });
  }

  // ============================================================
  // AUTO-SYNC PROFILE & GITHUB REPOS
  // ============================================================

  if (btnAutoSyncProfile) {
    btnAutoSyncProfile.addEventListener('click', async () => {
      btnAutoSyncProfile.disabled = true;
      btnAutoSyncProfile.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Syncing...`;

      try {
        const userRes = await window.API.get('/users/me', { auth: true });
        if (userRes.success && userRes.data?.user) {
          const u = userRes.data.user;

          // Sync personal info
          if (!resumeData.personalInfo) resumeData.personalInfo = {};
          if (u.name) resumeData.personalInfo.fullName = u.name;
          if (u.email) resumeData.personalInfo.email = u.email;
          if (u.githubProfile?.login) {
            resumeData.personalInfo.gitHub = `https://github.com/${u.githubProfile.login}`;
          }

          // Sync verified skills
          if (Array.isArray(u.skills) && u.skills.length > 0) {
            resumeData.skills = u.skills.map(s => ({
              name: s.displayName || s.name,
              level: s.proficiency || 'Intermediate',
              isVerified: Boolean(s.isQuizVerified || s.isCodeVerified),
              category: s.category || 'Technical',
            }));
          }

          // Sync education (only actual values, no fake GPA or startYear)
          if (u.education?.course) {
            resumeData.education = [{
              degree: u.education.course,
              college: u.education.college || '',
              university: u.education.branch || '',
              startYear: '',
              gradYear: u.education.year || '',
              score: '',
            }];
          }

          populateFormFields();
          renderResumePreview();
          triggerAutoSave();
        }
      } catch (err) {
        console.error('Profile sync failed:', err);
      } finally {
        btnAutoSyncProfile.disabled = false;
        btnAutoSyncProfile.innerHTML = `<i class="bi bi-arrow-repeat text-primary"></i> Auto-Fill Profile`;
      }
    });
  }

  // ── Clear / Start Blank Resume Handlers ───────────────────────
  const handleClearResume = async () => {
    const confirmed = confirm('Are you sure you want to clear your resume and start with a completely empty canvas? All current fields will be emptied.');
    if (!confirmed) return;

    setSaveStatus('saving', 'Clearing...');
    try {
      const res = await window.API.post('/resume/builder/clear', {}, { auth: true });
      if (res.success && res.data) {
        resumeData = res.data;
        try {
          localStorage.removeItem(getStorageKey());
          localStorage.removeItem('careerpath_resume_draft');
        } catch (_) {}
        populateFormFields();
        renderResumePreview();
        setSaveStatus('saved', 'Blank Canvas Ready');
      }
    } catch (err) {
      alert('Failed to clear resume: ' + err.message);
      setSaveStatus('saved', 'Error');
    }
  };

  btnClearResume?.addEventListener('click', handleClearResume);
  btnClearResumeQuick?.addEventListener('click', handleClearResume);

  if (btnImportGithubRepos) {
    btnImportGithubRepos.addEventListener('click', async () => {
      btnImportGithubRepos.disabled = true;
      btnImportGithubRepos.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Repos...`;

      try {
        const userRes = await window.API.get('/users/me', { auth: true });
        if (userRes.success && userRes.data?.user) {
          const repos = userRes.data.user.githubRepos;
          if (Array.isArray(repos) && repos.length > 0) {
            resumeData.projects = repos.slice(0, 4).map(r => ({
              title: r.name ? r.name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Software Project',
              description: r.description || `Built full-stack ${r.language || 'web'} application featuring responsive architecture and state management.`,
              techStack: Array.isArray(r.detectedSkills) && r.detectedSkills.length > 0
                ? r.detectedSkills
                : [r.language || 'JavaScript', 'Git'],
              githubUrl: r.htmlUrl,
              liveUrl: '',
              isVerified: Boolean(r.stars > 0 || (r.detectedSkills && r.detectedSkills.length > 0)),
            }));

            renderProjectsList();
            renderResumePreview();
            triggerAutoSave();
            alert(`Imported ${resumeData.projects.length} study repositories from connected GitHub account!`);
          } else {
            alert('No GitHub study repositories found. Please connect your GitHub account via Profile Settings first.');
          }
        }
      } catch (err) {
        console.error('GitHub import failed:', err);
      } finally {
        btnImportGithubRepos.disabled = false;
        btnImportGithubRepos.innerHTML = `<i class="bi bi-github text-white"></i> GitHub Repos`;
      }
    });
  }

  // ============================================================
  // EXPORT & PRINT (PDF Download via html2pdf.js)
  // ============================================================

  if (btnDownloadPdf) {
    btnDownloadPdf.addEventListener('click', () => {
      if (!paper) return;

      const origBtn = btnDownloadPdf.innerHTML;
      btnDownloadPdf.disabled = true;
      btnDownloadPdf.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Generating PDF...`;

      const candidateName = (resumeData?.personalInfo?.fullName || 'Student').replace(/\s+/g, '_');
      const filename = `${candidateName}_Resume_Disheera.pdf`;

      // Save current zoom transform and reset for clean render
      const prevTransform = paper.style.transform;
      paper.style.transform = 'none';

      const opt = {
        margin: [10, 10, 10, 10], // mm
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
      };

      if (window.html2pdf) {
        window.html2pdf()
          .set(opt)
          .from(paper)
          .save()
          .then(() => {
            paper.style.transform = prevTransform;
            btnDownloadPdf.disabled = false;
            btnDownloadPdf.innerHTML = origBtn;
          })
          .catch((err) => {
            console.error('PDF error:', err);
            paper.style.transform = prevTransform;
            btnDownloadPdf.disabled = false;
            btnDownloadPdf.innerHTML = origBtn;
            alert('PDF generation failed. You can also use the Print button to save as PDF.');
          });
      } else {
        paper.style.transform = prevTransform;
        btnDownloadPdf.disabled = false;
        btnDownloadPdf.innerHTML = origBtn;
        window.print();
      }
    });
  }

  if (btnPrintResume) {
    btnPrintResume.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnSaveDraft) {
    btnSaveDraft.addEventListener('click', async () => {
      btnSaveDraft.disabled = true;
      btnSaveDraft.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Saving...`;
      try {
        await window.API.post('/resume/builder', { resumeData }, { auth: true });
        setSaveStatus('saved', 'Saved');
      } catch (err) {
        alert(err.message || 'Failed to save draft.');
      } finally {
        btnSaveDraft.disabled = false;
        btnSaveDraft.innerHTML = `<i class="bi bi-floppy"></i> <span>Save Draft</span>`;
      }
    });
  }

  // ============================================================
  // INITIAL DATA LOAD
  // ============================================================

  // Cleanup any legacy stale global draft holding fake data
  try {
    const legacyDraft = localStorage.getItem('careerpath_resume_draft');
    if (legacyDraft && (legacyDraft.includes('Demopo') || legacyDraft.includes('Academic & Hackathon'))) {
      localStorage.removeItem('careerpath_resume_draft');
    }
  } catch (_) {}

  try {
    setSaveStatus('saving', 'Loading...');
    const response = await window.API.get('/resume/builder', { auth: true });

    if (response.success && response.data) {
      resumeData = response.data;
      populateFormFields();
      renderResumePreview();
      setSaveStatus('saved', 'Ready');
    }
  } catch (err) {
    console.warn('Could not load existing draft from API. Using local cache fallback:', err);
    try {
      const storageKey = getStorageKey();
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Avoid legacy fake data in cache
        if (!parsed.education?.[0]?.college?.includes('Demopo')) {
          resumeData = parsed;
          populateFormFields();
          renderResumePreview();
          setSaveStatus('saved', 'Loaded locally');
        }
      }
    } catch (parseErr) {}
  }
});

const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, '..', 'client');
const htmlPath = path.join(clientDir, 'resume-builder.html');
const cssPath = path.join(clientDir, 'css', 'resume-templates.css');
const jsPath = path.join(clientDir, 'js', 'resume-builder.js');

// 1. Update CSS
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('.builder-section-header.collapsed')) {
  css = css.replace(
    '.builder-section-header:hover {',
    `.builder-section-header .bi-chevron-down {
  transition: transform 0.2s ease;
}

.builder-section-header.collapsed .bi-chevron-down {
  transform: rotate(-90deg);
}

.builder-section-header:hover {`
  );
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✓ Updated resume-templates.css with chevron rotation');
}

// 2. Update HTML
let html = fs.readFileSync(htmlPath, 'utf8');

// Add Expand All button in the quick import banner
if (!html.includes('btnToggleAllSections')) {
  const targetBanner = '<div class="d-flex gap-1.5 flex-wrap">';
  const replacementBanner = `<div class="d-flex gap-1.5 flex-wrap">
              <button type="button" class="btn-quick-import text-xs px-2.5 py-1 rounded-lg font-semibold" id="btnToggleAllSections" title="Expand or collapse all sections">
                <i class="bi bi-arrows-expand text-primary"></i> <span id="toggleAllSectionsText">Expand All</span>
              </button>`;
  html = html.replace(targetBanner, replacementBanner);
  console.log('✓ Added btnToggleAllSections to resume-builder.html');
}

// Collapse sections 2, 3, 4, 5, 6
const sectionsToCollapse = [
  '#secSummary',
  '#secEducation',
  '#secSkills',
  '#secProjects',
  '#secExperience'
];

sectionsToCollapse.forEach(targetId => {
  // Add 'collapsed' to header if not present
  const headerRegex = new RegExp(`(<div class="builder-section-header[^"]*)"([^>]*data-bs-target="${targetId}")`, 'g');
  html = html.replace(headerRegex, (m, p1, p2) => {
    if (!p1.includes('collapsed')) {
      return `${p1} collapsed"${p2}`;
    }
    return m;
  });

  // Change <div class="collapse show" id="sec..."> to <div class="collapse" id="sec...">
  const collapseRegex = new RegExp(`<div class="collapse show" id="${targetId.replace('#', '')}">`, 'g');
  html = html.replace(collapseRegex, `<div class="collapse" id="${targetId.replace('#', '')}">`);
});

// Ensure sections 7 and 8 headers also have collapsed class
['#secCertifications', '#secAdditional'].forEach(targetId => {
  const headerRegex = new RegExp(`(<div class="builder-section-header[^"]*)"([^>]*data-bs-target="${targetId}")`, 'g');
  html = html.replace(headerRegex, (m, p1, p2) => {
    if (!p1.includes('collapsed')) {
      return `${p1} collapsed"${p2}`;
    }
    return m;
  });
});

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✓ Updated sections 2-8 in resume-builder.html to default-collapsed state');

// 3. Update JS
let js = fs.readFileSync(jsPath, 'utf8');
if (!js.includes('btnToggleAllSections')) {
  const targetListener = "btnClearResumeQuick?.addEventListener('click', handleClearResume);";
  const toggleHandler = `${targetListener}

  const btnToggleAllSections = document.getElementById('btnToggleAllSections');
  if (btnToggleAllSections) {
    btnToggleAllSections.addEventListener('click', () => {
      const sectionCollapses = document.querySelectorAll('.builder-section-card .collapse');
      const anyCollapsed = Array.from(sectionCollapses).some(el => !el.classList.contains('show'));
      
      sectionCollapses.forEach(el => {
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
        if (anyCollapsed) {
          bsCollapse.show();
        } else {
          // Collapse all except Section 1 (Personal Info)
          if (el.id !== 'secPersonalInfo') {
            bsCollapse.hide();
          }
        }
      });

      const icon = btnToggleAllSections.querySelector('i');
      const textSpan = btnToggleAllSections.querySelector('#toggleAllSectionsText');
      if (anyCollapsed) {
        if (icon) icon.className = 'bi bi-arrows-collapse text-primary';
        if (textSpan) textSpan.textContent = 'Collapse All';
      } else {
        if (icon) icon.className = 'bi bi-arrows-expand text-primary';
        if (textSpan) textSpan.textContent = 'Expand All';
      }
    });
  }`;
  js = js.replace(targetListener, toggleHandler);
  fs.writeFileSync(jsPath, js, 'utf8');
  console.log('✓ Added btnToggleAllSections handler to resume-builder.js');
}

console.log('Accordion upgrade finished successfully!');

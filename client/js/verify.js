/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * Disheera — Official Public Credential Verification Controller
 * Disheera · Verified Talent Credential Protocol
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCertId = (urlParams.get('certId') || urlParams.get('id') || '').trim();

  const searchForm = document.getElementById('verifySearchForm');
  const inputCertId = document.getElementById('inputCertId');
  const loadingState = document.getElementById('verifyLoadingState');
  const errorState = document.getElementById('verifyErrorState');
  const successState = document.getElementById('verifySuccessState');
  const errorMessageText = document.getElementById('errorMessageText');

  if (inputCertId && initialCertId) {
    inputCertId.value = initialCertId;
  }

  // Handle manual ID lookup
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const queryId = inputCertId ? inputCertId.value.trim() : '';
      if (!queryId) return;
      const newUrl = `${window.location.pathname}?certId=${encodeURIComponent(queryId)}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      verifyCredential(queryId);
    });
  }

  // Execute verification if ID present in URL
  if (initialCertId) {
    verifyCredential(initialCertId);
  }

  async function verifyCredential(certId) {
    if (!certId) return;

    // Show loading state
    if (loadingState) loadingState.classList.remove('d-none');
    if (errorState) errorState.classList.add('d-none');
    if (successState) successState.classList.add('d-none');

    // Auto resolve API base URL for local or production
    const isLocalDev = window.location.port === '5500' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiBase = isLocalDev ? 'http://localhost:5000/api' : '/api';

    try {
      const response = await fetch(`${apiBase}/readiness/public-verify/${encodeURIComponent(certId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const res = await response.json();

      if (response.ok && res.success && res.data) {
        if (!res.data.isValid) {
          if (res.data.isRevoked || res.data.credentialStatus === 'revoked' || res.data.status === 'revoked') {
            renderError(`⚠️ CREDENTIAL REVOKED: This credential was revoked by platform administrators. ${res.data.message || ''}`);
          } else if (res.data.credentialStatus === 'pending' || res.data.status === 'pending') {
            renderError(`⏳ CREDENTIAL PENDING: This credential is in Pending status (verifiedSkills < 1). Candidate has not yet passed a verified competency test.`);
          } else {
            renderError(res.data.message || 'Credential verification failed.');
          }
          return;
        }
        renderVerifiedCertificate(res.data);
      } else {
        renderError(res.message || `No active credential record found for ID: ${certId}`);
      }
    } catch (err) {
      console.warn('Network error reaching verification registry:', err);
      renderError('Could not connect to the Disheera verification service. Please check your network connection.');
    }
  }

  function renderVerifiedCertificate(data) {
    if (loadingState) loadingState.classList.add('d-none');
    if (errorState) errorState.classList.add('d-none');
    if (successState) successState.classList.remove('d-none');

    const metaCertId = document.getElementById('metaCertId');
    const verifiedStudentName = document.getElementById('verifiedStudentName');
    const verifiedRoleTitle = document.getElementById('verifiedRoleTitle');
    const verifiedScoreBadge = document.getElementById('verifiedScoreBadge');
    const metricSkills = document.getElementById('metricSkills');
    const metricRoadmap = document.getElementById('metricRoadmap');
    const metricResume = document.getElementById('metricResume');
    const metricInterview = document.getElementById('metricInterview');
    const verifiedSkillsContainer = document.getElementById('verifiedSkillsContainer');
    const verifiedIssueDate = document.getElementById('verifiedIssueDate');
    const verifiedIdText = document.getElementById('verifiedIdText');
    const verifiedQrImg = document.getElementById('verifiedQrImg');
    const verifiedShaHash = document.getElementById('verifiedShaHash');
    const auditCandidate = document.getElementById('auditCandidate');
    const auditRole = document.getElementById('auditRole');
    const auditIssuer = document.getElementById('auditIssuer');
    const auditHash = document.getElementById('auditHash');

    if (metaCertId) metaCertId.textContent = `ID: ${data.certificateId || '—'}`;
    if (verifiedStudentName) verifiedStudentName.textContent = data.studentName || '—';
    if (verifiedRoleTitle) verifiedRoleTitle.textContent = data.targetRole || '—';
    if (verifiedScoreBadge) verifiedScoreBadge.textContent = data.readinessScore != null && Number.isFinite(Number(data.readinessScore)) ? `${Number(data.readinessScore)}% · ${data.tierLabel || 'JOB READY'}` : '—';

    const bd = data.breakdown || {};
    if (metricSkills) metricSkills.textContent = bd.verifiedSkills != null && Number.isFinite(Number(bd.verifiedSkills)) ? `${Number(bd.verifiedSkills)}%` : '—';
    if (metricRoadmap) metricRoadmap.textContent = bd.roadmapProgress != null && Number.isFinite(Number(bd.roadmapProgress)) ? `${Number(bd.roadmapProgress)}%` : '—';
    if (metricResume) metricResume.textContent = bd.resumeScore != null && Number.isFinite(Number(bd.resumeScore)) ? `${Number(bd.resumeScore)}%` : '—';
    if (metricInterview) metricInterview.textContent = bd.interviewScore != null && Number.isFinite(Number(bd.interviewScore)) ? `${Number(bd.interviewScore)}%` : '—';

    if (verifiedSkillsContainer) {
      const skills = Array.isArray(data.verifiedSkills) ? data.verifiedSkills : [];
      verifiedSkillsContainer.innerHTML = skills.map(s => `
        <span class="cert-skill-pill">
          <i class="bi bi-patch-check-fill text-warning me-1"></i>${escapeHtml(s)}
        </span>
      `).join('');
    }

    const d = data.certifiedAt ? new Date(data.certifiedAt) : null;
    if (verifiedIssueDate) {
      verifiedIssueDate.textContent = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
    }
    if (verifiedIdText) verifiedIdText.textContent = data.certificateId;

    if (verifiedQrImg) {
      const currentUrl = window.location.href;
      verifiedQrImg.src = data.certificateId ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(currentUrl)}` : '';
      verifiedQrImg.alt = data.certificateId ? `QR Code for ${data.certificateId}` : 'No verification QR is available';
    }

    const hashStr = data.tamperProofHash || '';
    if (verifiedShaHash) verifiedShaHash.textContent = hashStr ? hashStr.slice(0, 18) + '...' : '—';
    if (auditHash) auditHash.textContent = hashStr || '—';

    if (auditCandidate) auditCandidate.textContent = data.studentName || '—';
    if (auditRole) auditRole.textContent = data.targetRole || '—';
    if (auditIssuer) auditIssuer.textContent = data.issuer || 'Disheera';

    // Configure Action Buttons
    const btnCopyRecord = document.getElementById('btnCopyRecord');
    if (btnCopyRecord) {
      btnCopyRecord.onclick = () => {
        const recordSummary = `OFFICIAL Disheera Verified CREDENTIAL RECORD\n` +
          `Status: ACTIVE & AUTHENTIC\n` +
          `Credential ID: ${data.certificateId}\n` +
          `Candidate: ${data.studentName}\n` +
          `Designation: ${data.targetRole}\n` +
          `Hiring Readiness Score: ${data.readinessScore}%\n` +
          `Date Issued: ${d.toLocaleDateString('en-US')}\n` +
          `SHA-256 Ledger Hash: ${hashStr}\n` +
          `Verification URL: ${window.location.href}`;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(recordSummary).then(() => {
            alert('Verified record summary copied to clipboard!');
          }).catch(() => {
            prompt('Copy verified record summary:', recordSummary);
          });
        } else {
          prompt('Copy verified record summary:', recordSummary);
        }
      };
    }

    const btnAddLinkedIn = document.getElementById('btnAddLinkedIn');
    if (btnAddLinkedIn) {
      btnAddLinkedIn.onclick = () => {
        const issueDateParams = d && !Number.isNaN(d.getTime()) ? `&issueYear=${d.getFullYear()}&issueMonth=${d.getMonth() + 1}` : '';
        if (!data.certificateId) return;
        const addLinkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME` +
          `&name=${encodeURIComponent('Verified Job Ready: ' + data.targetRole)}` +
          `&organizationName=${encodeURIComponent('Disheera')}` +
          issueDateParams +
          `&certId=${encodeURIComponent(data.certificateId)}` +
          `&certUrl=${encodeURIComponent(window.location.href)}`;

        window.open(addLinkedInUrl, '_blank', 'noopener,noreferrer');
      };
    }

    const btnToggleVerifyTheme = document.getElementById('btnToggleVerifyCertTheme');
    const certCanvas = document.getElementById('printableCertificate');
    if (btnToggleVerifyTheme && certCanvas) {
      btnToggleVerifyTheme.onclick = () => {
        certCanvas.classList.toggle('cert-theme-dark');
        const isDark = certCanvas.classList.contains('cert-theme-dark');
        btnToggleVerifyTheme.innerHTML = isDark
          ? '<i class="bi bi-sun-fill me-1"></i> Royal Parchment'
          : '<i class="bi bi-moon-stars-fill me-1"></i> Dark Obsidian';
      };
    }

    // Helper function for isolated single-page certificate printing in verify portal
    window.printCertificate = () => {
      const certCanvas = document.getElementById('printableCertificate');
      if (!certCanvas) {
        window.print();
        return;
      }

      const oldFrame = document.getElementById('certVerifyPrintIframe');
      if (oldFrame) oldFrame.remove();

      const printFrame = document.createElement('iframe');
      printFrame.id = 'certVerifyPrintIframe';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.opacity = '0';
      printFrame.style.pointerEvents = 'none';
      document.body.appendChild(printFrame);

      const isDark = certCanvas.classList.contains('cert-theme-dark');
      const studentName = document.getElementById('verifiedStudentName')?.textContent?.trim() || 'Verified Student';
      const roleName = document.getElementById('verifiedRoleTitle')?.textContent?.trim() || 'Professional';

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Disheera Certificate &mdash; ${escapeHtml(studentName)} &mdash; ${escapeHtml(roleName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Great+Vibes&family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="css/style.css?v=3.9">
  <link rel="stylesheet" href="css/dashboard.css?v=3.9">
  <style>
    @page {
      size: landscape;
      margin: 0;
    }
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: ${isDark ? '#0A0F1D' : '#FAF8F5'} !important;
      width: 100vw !important;
      height: 100vh !important;
      overflow: hidden !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .official-certificate-container {
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      aspect-ratio: 16 / 9 !important;
      margin: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      page-break-inside: avoid !important;
      page-break-after: avoid !important;
      page-break-before: avoid !important;
      break-inside: avoid !important;
      padding: 1.35rem 3rem 2.25rem !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  </style>
</head>
<body class="${isDark ? 'cert-theme-dark' : ''}">
  ${certCanvas.outerHTML}
</body>
</html>`);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (err) {
          console.warn('Iframe print fallback to window.print', err);
          window.print();
        }
      }, 350);
    };

    const btnPrintVerify = document.getElementById('btnPrintVerifyCertPdf');
    if (btnPrintVerify) {
      btnPrintVerify.onclick = (e) => {
        if (e) e.preventDefault();
        window.printCertificate();
      };
    }
  }

  function renderError(message) {
    if (loadingState) loadingState.classList.add('d-none');
    if (successState) successState.classList.add('d-none');
    if (errorState) errorState.classList.remove('d-none');
    if (errorMessageText) errorMessageText.textContent = message;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});

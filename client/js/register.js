/**
 * register.js · Two-Step Registration & OTP Verification Controller
 * Supports Student Enrollment & Verified Company Recruiter Onboarding
 *
 * Disheera · Enterprise Platform Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated, redirect to appropriate destination
  if (window.Auth?.isAuthenticated()) {
    const user = window.Auth.getCurrentUser();
    if (user?.role === 'recruiter') {
      window.location.href = 'recruiter-dashboard.html';
      return;
    }
    if (user && user.profileCompleted) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'assessment.html';
    }
    return;
  }

  // DOM Elements - Role Tabs & Headers
  const tabStudentRole = document.getElementById('tabStudentRole');
  const tabRecruiterRole = document.getElementById('tabRecruiterRole');
  const atlasCoordinate = document.getElementById('atlasCoordinate');
  const authFormTitle = document.getElementById('authFormTitle');
  const authFormSubtitle = document.getElementById('authFormSubtitle');
  const studentSocialStack = document.getElementById('studentSocialStack');

  // DOM Elements - Step 1 Student Form
  const step1 = document.getElementById('registerStep1');
  const form = document.getElementById('registerForm');
  const alertContainer = document.getElementById('alertContainer');
  const submitBtn = document.getElementById('submitBtn');

  // DOM Elements - Step 1 Recruiter Form
  const recruiterForm = document.getElementById('recruiterForm');
  const recruiterName = document.getElementById('recruiterName');
  const recruiterTitle = document.getElementById('recruiterTitle');
  const recruiterEmail = document.getElementById('recruiterEmail');
  const companyName = document.getElementById('companyName');
  const companyWebsite = document.getElementById('companyWebsite');
  const recruiterLinkedin = document.getElementById('recruiterLinkedin');
  const recruiterPassword = document.getElementById('recruiterPassword');
  const recruiterConfirmPassword = document.getElementById('recruiterConfirmPassword');
  const recruiterSubmitBtn = document.getElementById('recruiterSubmitBtn');
  const companyPrecheckPill = document.getElementById('companyPrecheckPill');
  const precheckIcon = document.getElementById('precheckIcon');
  const precheckText = document.getElementById('precheckText');

  // DOM Elements - Step 2 (Dual OTP)
  const step2 = document.getElementById('registerStep2');
  const verificationBadge = document.getElementById('verificationBadge');
  const verificationHeading = document.getElementById('verificationHeading');
  const verificationSubheading = document.getElementById('verificationSubheading');
  const emailCardTitle = document.getElementById('emailCardTitle');
  const displayEmail = document.getElementById('displayTargetEmail');
  const displayTargetPhone = document.getElementById('displayTargetPhone');
  const noticeEmailText = document.getElementById('noticeEmailText');
  const noticePhoneText = document.getElementById('noticePhoneText');
  const whatsappOtpCard = document.getElementById('whatsappOtpCard');
  const otpForm = document.getElementById('otpForm');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const verifyBtnText = document.getElementById('verifyBtnText');
  const btnBackToForm = document.getElementById('btnBackToForm');
  const btnResendOtp = document.getElementById('btnResendOtp');
  const resendCountdown = document.getElementById('resendCountdown');
  const emailDigitInputs = document.querySelectorAll('.gmail-otp-digit, .email-otp-digit');
  const waDigitInputs = document.querySelectorAll('.wa-otp-digit');
  let currentEmail = '';
  let currentPhone = '';
  let activeRole = 'student'; // 'student' or 'recruiter'
  let countdownTimer = null;
  let precheckDebounceTimer = null;

  const fillDigits = (inputs, code) => {
    if (!code || !inputs) return;
    const digits = String(code).trim().slice(0, 6).split('');
    inputs.forEach((input, i) => {
      if (digits[i]) input.value = digits[i];
    });
    if (inputs[5]) inputs[5].focus();
  };

  // ── Neutralize 3rd-Party Extension Injected Backgrounds & Overlays ──
  const purgeExtensionInjections = () => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach((inp) => {
      const clean = () => {
        if (inp.style.backgroundImage && inp.style.backgroundImage !== 'none') {
          inp.style.removeProperty('background-image');
          inp.style.setProperty('background-image', 'none', 'important');
        }
        if (inp.style.background && inp.style.background.includes('url')) {
          inp.style.removeProperty('background');
          inp.style.setProperty('background', '#FFFFFF', 'important');
          inp.style.setProperty('background-color', '#FFFFFF', 'important');
        }
        inp.style.setProperty('background-size', '0px 0px', 'important');
        inp.style.setProperty('background-repeat', 'no-repeat', 'important');
      };

      clean();

      const observer = new MutationObserver(clean);
      observer.observe(inp, { attributes: true, attributeFilter: ['style', 'class'] });
    });
  };

  purgeExtensionInjections();

  const showAlert = (message, type = 'danger') => {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-2 px-3 small mb-3" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}"></i>
        <div>${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto p-2" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  };

  // ── Role Tab Switcher ───────────────────────────────────────
  const setRoleTab = (role) => {
    activeRole = role;
    alertContainer.innerHTML = '';

    if (role === 'recruiter') {
      tabRecruiterRole.classList.add('active');
      tabRecruiterRole.style.background = '#FFFFFF';
      tabRecruiterRole.style.color = '#059669';
      tabRecruiterRole.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';

      tabStudentRole.classList.remove('active');
      tabStudentRole.style.background = 'transparent';
      tabStudentRole.style.color = '#64748B';
      tabStudentRole.style.boxShadow = 'none';

      if (studentSocialStack) studentSocialStack.classList.add('d-none');
      if (form) form.classList.add('d-none');
      if (recruiterForm) recruiterForm.classList.remove('d-none');

      const recruiterPlanPill = document.getElementById('recruiterPlanPill');
      const studentPlanPill = document.getElementById('studentPlanPill');
      if (recruiterPlanPill) {
        recruiterPlanPill.classList.remove('d-none');
        recruiterPlanPill.classList.add('d-flex');
      }
      if (studentPlanPill) {
        studentPlanPill.classList.add('d-none');
        studentPlanPill.classList.remove('d-flex');
      }

      const authPanelBullets = document.getElementById('authPanelBullets');
      if (authPanelBullets) {
        authPanelBullets.innerHTML = `
          <div class="auth-panel-bullet">
            <i class="bi bi-radar fs-5 text-success"></i>
            <span>Recruiter Talent Radar: Sourcing 5,000+ pre-vetted engineers</span>
          </div>
          <div class="auth-panel-bullet">
            <i class="bi bi-shield-check fs-5 text-success"></i>
            <span>Zero-cheating guarantee with proctored test score audits</span>
          </div>
          <div class="auth-panel-bullet">
            <i class="bi bi-lightning-charge fs-5 text-success"></i>
            <span>Direct 1-click candidate interview invites &amp; ATS exports</span>
          </div>
        `;
      }

      if (atlasCoordinate) atlasCoordinate.textContent = 'COMPANY RECRUITER ONBOARDING · REC-01';
      if (authFormTitle) authFormTitle.textContent = 'Register Your Company';
      if (authFormSubtitle) {
        authFormSubtitle.textContent = 'Verify your corporate credentials to post job openings & access verified students.';
      }
    } else {
      tabStudentRole.classList.add('active');
      tabStudentRole.style.background = '#FFFFFF';
      tabStudentRole.style.color = '#0F172A';
      tabStudentRole.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';

      tabRecruiterRole.classList.remove('active');
      tabRecruiterRole.style.background = 'transparent';
      tabRecruiterRole.style.color = '#64748B';
      tabRecruiterRole.style.boxShadow = 'none';

      if (studentSocialStack) studentSocialStack.classList.remove('d-none');
      if (form) form.classList.remove('d-none');
      if (recruiterForm) recruiterForm.classList.add('d-none');

      const recruiterPlanPill = document.getElementById('recruiterPlanPill');
      const studentPlanPill = document.getElementById('studentPlanPill');
      if (recruiterPlanPill) {
        recruiterPlanPill.classList.add('d-none');
        recruiterPlanPill.classList.remove('d-flex');
      }
      if (studentPlanPill) {
        studentPlanPill.classList.remove('d-none');
        studentPlanPill.classList.add('d-flex');
      }

      const authPanelBullets = document.getElementById('authPanelBullets');
      if (authPanelBullets) {
        authPanelBullets.innerHTML = `
          <div class="auth-panel-bullet">
            <i class="bi bi-mortarboard fs-5"></i>
            <span>Designed specifically for college students &amp; freshers</span>
          </div>
          <div class="auth-panel-bullet">
            <i class="bi bi-sliders fs-5"></i>
            <span>Transparent 60/25/15 career-fit evaluation formula</span>
          </div>
          <div class="auth-panel-bullet">
            <i class="bi bi-map fs-5"></i>
            <span>Self-paced weekly learning plans with real tasks</span>
          </div>
        `;
      }

      if (atlasCoordinate) atlasCoordinate.textContent = 'NEW STUDENT ENROLLMENT · REG-01';
      if (authFormTitle) authFormTitle.textContent = 'Create Account';
      if (authFormSubtitle) {
        authFormSubtitle.textContent = 'Enter your details to generate your student profile.';
      }
    }
  };

  if (tabStudentRole) tabStudentRole.addEventListener('click', () => setRoleTab('student'));
  if (tabRecruiterRole) tabRecruiterRole.addEventListener('click', () => setRoleTab('recruiter'));

  // Check URL query param ?role=recruiter
  const regParams = new URLSearchParams(window.location.search);
  if (regParams.get('role') === 'recruiter') {
    setRoleTab('recruiter');
  }

  // ── Real-Time Corporate Domain Validation ───────────────────
  const FREE_MAIL_BLACKLIST = ['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'proton.me', 'protonmail.com', 'zoho.com', 'aol.com', 'mailinator.com', 'tempmail.com'];

  const runCorporateDomainPrecheck = () => {
    if (!recruiterEmail || !companyWebsite || !companyPrecheckPill) return;

    const email = recruiterEmail.value.trim().toLowerCase();
    const website = companyWebsite.value.trim();
    const cName = companyName?.value.trim() || '';

    if (!email) {
      companyPrecheckPill.style.background = '#F8FAFC';
      companyPrecheckPill.style.borderColor = '#E2E8F0';
      precheckIcon.className = 'bi bi-shield-lock-fill text-secondary fs-5 flex-shrink-0';
      precheckText.innerHTML = `
        <div class="fw-semibold text-ink">Automated Domain Pre-Check</div>
        <div class="small text-muted">Enter your corporate email and company website to verify domain legitimacy.</div>
      `;
      return;
    }

    // Check free webmail pattern
    const emailDomain = email.includes('@') ? email.split('@')[1].trim().toLowerCase() : '';
    if (FREE_MAIL_BLACKLIST.some(f => emailDomain === f || emailDomain.endsWith('.' + f))) {
      companyPrecheckPill.style.background = '#FEF2F2';
      companyPrecheckPill.style.borderColor = '#FCA5A5';
      precheckIcon.className = 'bi bi-x-circle-fill text-danger fs-5 flex-shrink-0';
      precheckText.innerHTML = `
        <div class="fw-bold text-danger">⚠️ Free Webmail Prohibited</div>
        <div class="small text-danger">Recruiters must use an official corporate email (e.g., name@company.com). Consumer addresses like @${escapeHtml(emailDomain)} are blocked.</div>
      `;
      return;
    }

    // Need both email and website to run deep check
    if (!website || !email.includes('@')) {
      companyPrecheckPill.style.background = '#F0FDF4';
      companyPrecheckPill.style.borderColor = '#BBF7D0';
      precheckIcon.className = 'bi bi-shield-check text-success fs-5 flex-shrink-0';
      precheckText.innerHTML = `
        <div class="fw-semibold text-success">✓ Corporate Format Recognized</div>
        <div class="small text-muted">Domain "@${escapeHtml(emailDomain)}" identified. Enter your company website to verify live DNS MX records.</div>
      `;
      return;
    }

    // Run active server probe
    companyPrecheckPill.style.background = '#EFF6FF';
    companyPrecheckPill.style.borderColor = '#BFDBFE';
    precheckIcon.className = 'bi bi-arrow-repeat text-primary fs-5 flex-shrink-0 spinner-border spinner-border-sm';
    precheckText.innerHTML = `
      <div class="fw-semibold text-primary">Probing Corporate Domain & DNS...</div>
      <div class="small text-muted">Validating mail exchange servers and company identity...</div>
    `;

    clearTimeout(precheckDebounceTimer);
    precheckDebounceTimer = setTimeout(async () => {
      try {
        const response = await window.API.post('/recruiter/verify-company-precheck', {
          companyName: cName,
          email,
          website,
        });

        if (response.success && response.isRealCompany) {
          const comp = response.companyDetails || {};
          companyPrecheckPill.style.background = '#ECFDF5';
          companyPrecheckPill.style.borderColor = '#6EE7B7';
          precheckIcon.className = 'bi bi-patch-check-fill text-success fs-5 flex-shrink-0';
          precheckText.innerHTML = `
            <div class="fw-bold text-success">✓ Verified Corporate Domain: ${escapeHtml(comp.name || comp.domain)}</div>
            <div class="small text-secondary">${escapeHtml(comp.industry || 'Technology')} · Legitimacy Trust Score: <strong>${response.confidenceScore}/100</strong></div>
          `;

          // Auto-fill company name if not filled
          if (companyName && !companyName.value.trim() && comp.name) {
            companyName.value = comp.name;
          }
        } else {
          companyPrecheckPill.style.background = '#FEF2F2';
          companyPrecheckPill.style.borderColor = '#FCA5A5';
          precheckIcon.className = 'bi bi-exclamation-triangle-fill text-danger fs-5 flex-shrink-0';
          precheckText.innerHTML = `
            <div class="fw-bold text-danger">Corporate Verification Alert</div>
            <div class="small text-danger">${escapeHtml(response.message || 'Corporate domain check failed. Please check website URL.')}</div>
          `;
        }
      } catch (err) {
        companyPrecheckPill.style.background = '#FEF2F2';
        companyPrecheckPill.style.borderColor = '#FCA5A5';
        precheckIcon.className = 'bi bi-exclamation-circle-fill text-danger fs-5 flex-shrink-0';
        precheckText.innerHTML = `
          <div class="fw-bold text-danger">Verification Failed</div>
          <div class="small text-danger">${escapeHtml(err.message || 'Could not verify company domain.')}</div>
        `;
      }
    }, 700);
  };

  if (recruiterEmail) recruiterEmail.addEventListener('input', runCorporateDomainPrecheck);
  if (companyWebsite) companyWebsite.addEventListener('input', runCorporateDomainPrecheck);

  // ── Real-Time Student Email AI / Disposable Email Validator ──
  const DISPOSABLE_EMAIL_DOMAINS = new Set([
    'mailinator.com', 'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'guerrillamail.com', 'guerrillamail.net',
    '10minutemail.com', 'throwawaymail.com', 'trashmail.com', 'sharklasers.com',
    'dispostable.com', 'fakemailgenerator.com', 'getnada.com', 'mohmal.com',
    'yopmail.com', 'yopmail.fr', 'yopmail.net', 'dropmail.me', 'inboxkitten.com',
    'burnermail.io', 'crazymailing.com', 'generator.email', 'tempinbox.com',
    'mytemp.email', 'tempail.com', 'emailondeck.com', 'internxt.com', 'disposablemail.com'
  ]);

  const isDisposableEmail = (emailStr) => {
    if (!emailStr || !emailStr.includes('@')) return false;
    const domain = emailStr.split('@')[1].trim().toLowerCase();
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
    return /^(temp|throwaway|fake|trash|disposable|guerrilla|10minute|burner).*\.(com|org|net|io|me|xyz)$/i.test(domain);
  };

  const studentEmailInput = document.getElementById('email');
  const studentEmailBadge = document.getElementById('studentEmailBadge');
  const emailValidationFeedback = document.getElementById('emailValidationFeedback');

  if (studentEmailInput && emailValidationFeedback) {
    studentEmailInput.addEventListener('input', () => {
      const val = studentEmailInput.value.trim().toLowerCase();
      if (!val || !val.includes('@')) {
        emailValidationFeedback.classList.add('d-none');
        if (studentEmailBadge) {
          studentEmailBadge.className = 'badge bg-secondary-subtle text-secondary';
          studentEmailBadge.innerHTML = '<i class="bi bi-shield-check me-1"></i> Authentic Email Required';
        }
        return;
      }

      if (isDisposableEmail(val)) {
        emailValidationFeedback.className = 'form-text small mt-1 text-danger fw-semibold';
        emailValidationFeedback.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i> Disposable / Temp Mail detected. Please use your genuine student or personal email.';
        emailValidationFeedback.classList.remove('d-none');
        if (studentEmailBadge) {
          studentEmailBadge.className = 'badge bg-danger-subtle text-danger';
          studentEmailBadge.innerHTML = '<i class="bi bi-x-circle me-1"></i> Temp Mail Blocked';
        }
      } else {
        const domain = val.split('@')[1];
        if (domain && domain.includes('.')) {
          emailValidationFeedback.className = 'form-text small mt-1 text-success';
          emailValidationFeedback.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Valid email recognized (@${escapeHtml(domain)}). Delivery ready for Gmail & WhatsApp.`;
          emailValidationFeedback.classList.remove('d-none');
          if (studentEmailBadge) {
            studentEmailBadge.className = 'badge bg-success-subtle text-success';
            studentEmailBadge.innerHTML = '<i class="bi bi-check-circle me-1"></i> Verified Provider';
          }
        } else {
          emailValidationFeedback.classList.add('d-none');
        }
      }
    });
  }

  // ── Initialize Google Authentication ────────────────────────
  if (window.GoogleAuth) {
    window.GoogleAuth.init({
      buttonId: 'btnGoogleAuth',
      wrapperId: 'g_id_signin_wrapper',
      showAlert,
      setLoadingState: (loading) => {
        const btn = document.getElementById('btnGoogleAuth');
        if (!btn) return;
        if (loading) {
          btn.disabled = true;
          btn.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span>Connecting to Google...</span>
          `;
        } else {
          btn.disabled = false;
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            <span class="fw-semibold">Sign Up with Google</span>
          `;
        }
      },
      mode: 'signup',
    });
  }

  // ── Initialize GitHub Authentication ────────────────────────
  if (window.GitHubAuth) {
    window.GitHubAuth.init({
      buttonId: 'btnGitHubAuth',
      showAlert,
      mode: 'signup',
    });
  }

  // ── OTP Digit Input Auto-Focus Navigation (Dual Channel Independent Groups) ──
  const bindDigitGroup = (inputs) => {
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val;

        if (val && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          inputs[index - 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        if (pasteData.length >= 6) {
          pasteData.slice(0, 6).split('').forEach((char, i) => {
            if (inputs[i]) inputs[i].value = char;
          });
          if (inputs[5]) inputs[5].focus();
        }
      });
    });
  };

  bindDigitGroup(emailDigitInputs);
  bindDigitGroup(waDigitInputs);

  // ── Countdown Timer for Resend OTP ──────────────────────────
  const startResendCountdown = (seconds = 60) => {
    if (countdownTimer) clearInterval(countdownTimer);
    btnResendOtp.disabled = true;

    let remaining = seconds;
    resendCountdown.textContent = `(${remaining}s)`;

    countdownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownTimer);
        resendCountdown.textContent = '';
        btnResendOtp.disabled = false;
      } else {
        resendCountdown.textContent = `(${remaining}s)`;
      }
    }, 1000);
  };

  // ── Transition to Step 2 (OTP) ──────────────────────────────
  const showOtpStep = (email, _backupOtp = null, extra = {}) => {
    currentEmail = email;
    currentPhone = extra.phone || '';

    if (displayEmail) displayEmail.textContent = email;
    if (noticeEmailText) noticeEmailText.textContent = email;

    // Reset all digits
    emailDigitInputs.forEach(i => i.value = '');
    waDigitInputs.forEach(i => i.value = '');

    if (currentPhone) {
      // Dual verification mode (Both Gmail & WhatsApp required simultaneously)
      if (whatsappOtpCard) whatsappOtpCard.classList.remove('d-none');
      if (displayTargetPhone) displayTargetPhone.textContent = currentPhone;
      if (noticePhoneText) noticePhoneText.textContent = currentPhone;

      if (verificationBadge) {
        verificationBadge.innerHTML = '<span class="pulse-dot"></span> DUAL-CHANNEL VERIFICATION';
      }
      if (verificationHeading) {
        verificationHeading.textContent = 'Verify Gmail & WhatsApp';
      }
      if (verificationSubheading) {
        verificationSubheading.textContent = 'Both verification codes are required simultaneously to activate your account.';
      }
      if (emailCardTitle) {
        emailCardTitle.textContent = '1. Gmail Verification Code';
      }
      if (verifyBtnText) {
        verifyBtnText.textContent = 'Verify Both Codes & Activate Account';
      }
    } else {
      // Single verification mode (Email only, e.g. corporate recruiter)
      if (whatsappOtpCard) whatsappOtpCard.classList.add('d-none');

      if (verificationBadge) {
        verificationBadge.innerHTML = '<span class="pulse-dot"></span> EMAIL VERIFICATION';
      }
      if (verificationHeading) {
        verificationHeading.textContent = 'Verify Your Email';
      }
      if (verificationSubheading) {
        verificationSubheading.textContent = 'Enter the 6-digit verification code sent to your email.';
      }
      if (emailCardTitle) {
        emailCardTitle.textContent = 'Email Verification Code';
      }
      if (verifyBtnText) {
        verifyBtnText.textContent = 'Verify Code & Activate Account';
      }
    }

    step1.classList.add('d-none');
    step2.classList.remove('d-none');
    alertContainer.innerHTML = '';

    if (emailDigitInputs[0]) emailDigitInputs[0].focus();

    startResendCountdown(60);

    if (currentPhone) {
      if (extra.mailSent && extra.whatsappSent) {
        showAlert(`⚡ Distinct 6-digit verification codes sent to your WhatsApp (${currentPhone}) and email! Enter both codes below to activate your account.`, 'success');
      } else if (extra.mailSent && !extra.whatsappSent) {
        showAlert(`📧 Verification code dispatched to ${email}. (WhatsApp delivery unavailable).`, 'info');
      } else if (!extra.mailSent && extra.whatsappSent) {
        showAlert(`⚡ Verification code sent to WhatsApp (${currentPhone}). Note: Email delivery failed (check server console).`, 'warning');
      } else {
        showAlert(`⚠️ Live delivery failed (SMTP auth failed). If running locally, check the server terminal for your OTP verification code.`, 'warning');
      }
    } else {
      if (extra.mailSent) {
        showAlert(`📧 A 6-digit verification code has been dispatched to ${email}. Please check your Inbox and Spam/Junk folder.`, 'info');
      } else {
        showAlert(`⚠️ Email delivery failed to reach ${email} (SMTP auth failed). If running locally, check the server terminal for your OTP verification code.`, 'warning');
      }
    }
  };

  // Back to registration form
  if (btnBackToForm) {
    btnBackToForm.addEventListener('click', () => {
      step2.classList.add('d-none');
      step1.classList.remove('d-none');
      alertContainer.innerHTML = '';
      if (countdownTimer) clearInterval(countdownTimer);
    });
  }

  // ── Step 1: Submit Student Registration Form ────────────────
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertContainer.innerHTML = '';

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phoneInput = document.getElementById('phone');
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (!name || name.length < 2) {
        showAlert('Name must be at least 2 characters.');
        return;
      }

      if (!email || !email.includes('@')) {
        showAlert('Please enter a valid email address.');
        return;
      }

      if (isDisposableEmail(email)) {
        showAlert('⚠️ Disposable / Temporary email addresses (like Temp Mail) are prohibited. Please provide a genuine student or personal email address.', 'warning');
        return;
      }

      if (!password || password.length < 6) {
        showAlert('Password must be at least 6 characters.');
        return;
      }

      if (password !== confirmPassword) {
        showAlert('Passwords do not match. Please re-check.');
        return;
      }

      const originalBtnContent = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span>Creating Account...</span>
      `;

      try {
        const response = await window.API.post('/auth/register', { name, email, password, phone });

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;

        if (response.success && (response.requiresOtp || !response.data?.token)) {
          showOtpStep(response.email || email, response.backupOtp, {
            phone: response.phone || phone,
            backupEmailOtp: response.backupEmailOtp,
            backupWhatsappOtp: response.backupWhatsappOtp,
            whatsappSent: Boolean(response.whatsappSent),
            mailSent: Boolean(response.mailSent)
          });
        } else if (response.success && response.data?.token) {
          window.Auth.setToken(response.data.token);
          window.Auth.setCurrentUser(response.data.user);
          showAlert('Account created successfully! Taking you to assessment...', 'success');
          setTimeout(() => {
            window.location.href = 'assessment.html';
          }, 500);
        } else {
          showAlert(response.message || 'Registration failed. Please try again.');
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;

        if (err.status === 429 || (err.data && err.data.rateLimited)) {
          showAlert(err.message || 'Rate limit reached: Maximum 5 verification codes allowed per 5 minutes.', 'warning');
          return;
        }

        const isExisting =
          (err.message && err.message.toLowerCase().includes('already exists')) ||
          (err.data?.message && err.data.message.toLowerCase().includes('already exists'));

        if (isExisting) {
          alertContainer.innerHTML = `
            <div class="alert alert-warning border border-warning border-opacity-50 p-3 mb-3" role="alert">
              <div class="d-flex align-items-center gap-2 mb-1">
                <i class="bi bi-person-check text-warning fs-5"></i>
                <strong class="text-ink">Account Already Registered</strong>
              </div>
              <p class="small text-secondary mb-2">
                An account with <strong>${escapeHtml(email)}</strong> already exists. You can log in directly:
              </p>
              <a href="login.html" class="btn cp-btn-primary btn-sm w-100 py-1">
                Log In to Dashboard →
              </a>
            </div>
          `;
          return;
        }

        if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
          showAlert(err.errors.map((e) => e.message).join('; '));
        } else {
          showAlert(err.message || 'Registration failed. Please try again.');
        }
      }
    });
  }

  // ── Step 1: Submit Recruiter Registration Form ──────────────
  if (recruiterForm) {
    recruiterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertContainer.innerHTML = '';

      const name = recruiterName.value.trim();
      const title = recruiterTitle.value.trim();
      const email = recruiterEmail.value.trim();
      const cName = companyName.value.trim();
      const website = companyWebsite.value.trim();
      const linkedin = recruiterLinkedin?.value.trim() || '';
      const password = recruiterPassword.value;
      const confirmPassword = recruiterConfirmPassword.value;

      if (!name || name.length < 2) {
        showAlert('Please enter your full name.');
        return;
      }

      if (!email || !email.includes('@')) {
        showAlert('Please enter your corporate work email.');
        return;
      }

      const emailDomain = email.split('@')[1].toLowerCase();
      if (FREE_MAIL_BLACKLIST.some(f => emailDomain === f || emailDomain.endsWith('.' + f))) {
        showAlert('Free webmail addresses (@gmail, @yahoo, @outlook) are prohibited for recruiter onboarding. Please use your official corporate email.');
        return;
      }

      if (!cName) {
        showAlert('Please enter your company name.');
        return;
      }

      if (!website) {
        showAlert('Please enter your company website.');
        return;
      }

      if (!password || password.length < 6) {
        showAlert('Password must be at least 6 characters.');
        return;
      }

      if (password !== confirmPassword) {
        showAlert('Passwords do not match. Please re-check.');
        return;
      }

      const originalBtnContent = recruiterSubmitBtn.innerHTML;
      recruiterSubmitBtn.disabled = true;
      recruiterSubmitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm text-white" role="status" aria-hidden="true"></span>
        <span class="text-white fw-semibold">Verifying Corporate Domain & Registering...</span>
      `;

      try {
        const response = await window.API.post('/recruiter/register', {
          name,
          title,
          email,
          companyName: cName,
          website,
          linkedinUrl: linkedin,
          password,
        });

        recruiterSubmitBtn.disabled = false;
        recruiterSubmitBtn.innerHTML = originalBtnContent;

        if (response.success && response.requiresOtp) {
          showOtpStep(response.email || email, response.backupOtp, {
            backupEmailOtp: response.backupEmailOtp,
            mailSent: Boolean(response.mailSent)
          });
        } else {
          showAlert(response.message || 'Corporate registration failed. Please try again.');
        }
      } catch (err) {
        recruiterSubmitBtn.disabled = false;
        recruiterSubmitBtn.innerHTML = originalBtnContent;

        showAlert(err.message || 'Corporate registration failed. Please ensure your email domain matches your company website.');
      }
    });
  }

  // ── Step 2: Submit OTP Verification (Dual-Channel or Single) ─────────
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertContainer.innerHTML = '';

    const emailOtp = Array.from(emailDigitInputs).map(i => i.value.trim()).join('');
    const waOtp = currentPhone ? Array.from(waDigitInputs).map(i => i.value.trim()).join('') : '';

    if (emailOtp.length !== 6) {
      showAlert('Please enter the complete 6-digit Gmail verification code.');
      const emptyEmailInput = Array.from(emailDigitInputs).find(i => !i.value.trim());
      if (emptyEmailInput) emptyEmailInput.focus();
      return;
    }

    if (currentPhone && waOtp.length !== 6) {
      showAlert('Please enter the complete 6-digit WhatsApp verification code.');
      const emptyWaInput = Array.from(waDigitInputs).find(i => !i.value.trim());
      if (emptyWaInput) emptyWaInput.focus();
      return;
    }

    const originalBtn = verifyOtpBtn.innerHTML;
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      <span>Verifying Codes...</span>
    `;

    try {
      const payload = {
        email: currentEmail,
        emailOtp,
        ...(currentPhone ? { whatsappOtp: waOtp } : {}),
        otp: emailOtp, // backward compatibility
      };

      const response = await window.API.post('/auth/verify-otp', payload);

      if (response.success && response.data?.token) {
        window.Auth.setToken(response.data.token);
        window.Auth.setCurrentUser(response.data.user);

        const isRecruiter = response.data.user?.role === 'recruiter' || activeRole === 'recruiter';
        showAlert(
          isRecruiter
            ? 'Corporate Recruiter Account Verified! Opening Recruiter Portal...'
            : 'Account verified successfully! Both Gmail & WhatsApp validated. Taking you to assessment...',
          'success'
        );

        setTimeout(() => {
          if (isRecruiter) {
            window.location.href = 'recruiter-dashboard.html';
          } else {
            window.location.href = 'assessment.html';
          }
        }, 800);
      } else {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.innerHTML = originalBtn;
        showAlert(response.message || 'Verification failed. Please check the code.');
      }
    } catch (err) {
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.innerHTML = originalBtn;
      showAlert(err.message || 'Verification failed. Please check both codes or request new ones.');
    }
  });

  // ── Resend OTP Button ───────────────────────────────────────
  btnResendOtp.addEventListener('click', async () => {
    alertContainer.innerHTML = '';
    btnResendOtp.disabled = true;

    try {
      const response = await window.API.post('/auth/resend-otp', { email: currentEmail, phone: currentPhone });
      if (response.success) {
        startResendCountdown(60);
        if (response.mailSent) {
          showAlert(response.message || 'A fresh 6-digit verification code has been dispatched to your email!', 'success');
        } else if (response.whatsappSent) {
          showAlert(response.message || 'A fresh verification code has been sent to your WhatsApp!', 'success');
        } else {
          showAlert('⚠️ Email delivery could not complete (SMTP credentials rejected). Check server console for your fresh OTP code.', 'warning');
        }
      } else {
        showAlert(response.message || 'Could not resend OTP. Please try again.');
        btnResendOtp.disabled = false;
      }
    } catch (err) {
      btnResendOtp.disabled = false;
      const isRateLimited = err.status === 429 || (err.data && err.data.rateLimited);
      if (isRateLimited) {
        startResendCountdown(300);
        showAlert(err.message || 'Rate limit reached: Maximum 5 verification codes allowed per 5 minutes.', 'warning');
      } else {
        showAlert(err.message || 'Failed to resend code.');
      }
    }
  });

  // ── Direct URL Parameter Support ────────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const targetEmail = urlParams.get('email') || urlParams.get('verifyEmail');
  if (urlParams.get('role') === 'recruiter') {
    setRoleTab('recruiter');
  }
  if ((urlParams.get('verify') === 'true' || urlParams.get('verifyEmail')) && targetEmail) {
    showOtpStep(targetEmail);
    showAlert('Please enter the 6-digit verification code sent to your email to activate your account.', 'info');
  }
});

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Check login.html
const loginPath = path.join(__dirname, '../client/login.html');
const loginContent = fs.readFileSync(loginPath, 'utf8');

const expectedLoginIds = [
  'mainNav',
  'notchMobileMenu',
  'alertContainer',
  'btnGoogleAuth',
  'loginForm',
  'email',
  'password',
  'submitBtn'
];

for (const id of expectedLoginIds) {
  const re = new RegExp(`id=["']${id}["']`);
  assert(re.test(loginContent), `Missing ID in login.html: ${id}`);
}
console.log('SUCCESS: All expected Login IDs verified!');

// 2. Check register.html
const regPath = path.join(__dirname, '../client/register.html');
const regContent = fs.readFileSync(regPath, 'utf8');

const expectedRegIds = [
  'mainNav',
  'notchMobileMenu',
  'registerStep1',
  'tabStudentRole',
  'tabRecruiterRole',
  'authFormHeader',
  'authFormTitle',
  'authFormSubtitle',
  'alertContainer',
  'studentSocialStack',
  'btnGoogleAuth',
  'registerForm',
  'name',
  'email',
  'phone',
  'password',
  'confirmPassword',
  'agreeTerms',
  'submitBtn',
  'recruiterForm',
  'recruiterName',
  'recruiterTitle',
  'recruiterEmail',
  'companyName',
  'companyWebsite',
  'recruiterLinkedin',
  'recruiterPassword',
  'recruiterConfirmPassword',
  'recruiterAgreeTerms',
  'recruiterSubmitBtn',
  'registerStep2',
  'verificationBadge',
  'verificationHeading',
  'verificationSubheading',
  'step2AlertContainer',
  'otpForm',
  'whatsappOtpCard',
  'displayTargetPhone',
  'whatsappOtpInputs',
  'waDigit0',
  'waDigit1',
  'waDigit2',
  'waDigit3',
  'waDigit4',
  'waDigit5',
  'emailOtpCard',
  'emailCardTitle',
  'displayTargetEmail',
  'emailOtpInputs',
  'c1Digit0',
  'c1Digit1',
  'c1Digit2',
  'c1Digit3',
  'c1Digit4',
  'c1Digit5',
  'verifyOtpBtn',
  'verifyBtnText',
  'btnBackToForm',
  'btnResendOtp',
  'resendIcon',
  'resendBtnText',
  'resendCountdown'
];

for (const id of expectedRegIds) {
  const re = new RegExp(`id=["']${id}["']`);
  assert(re.test(regContent), `Missing ID in register.html: ${id}`);
}
console.log('SUCCESS: All expected Register IDs verified!');

// Light theme verification
assert(!loginContent.includes('bg-[#0f172a]'), 'Dark background #0f172a in login.html');
assert(!regContent.includes('bg-[#0f172a]'), 'Dark background #0f172a in register.html');

console.log('SUCCESS: Light Theme verified across Auth screens!');

/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const User = require('../server/models/User');
const generateToken = require('../server/utils/generateToken');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const SCREENSHOT_DIR = path.join(__dirname, 'audit_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAudit() {
  console.log('Launching browser from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,800']
  });

  const page = await browser.newPage();

  const auditResults = [];

  // Helper to log in as student
  async function loginStudent() {
    console.log('\nSetting up authenticated student session...');
    const student = await User.findOne({ role: 'student', isVerified: true });
    if (!student) throw new Error('No verified student account found in database.');
    const token = generateToken(student);
    await page.goto('http://localhost:5500/index.html?view=public', { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok, usr) => {
      localStorage.clear();
      localStorage.setItem('careerpath_token', tok);
      localStorage.setItem('careerpath_user', JSON.stringify(usr));
    }, token, { id: student._id || student.id, email: student.email, name: student.name || 'Student User', role: 'student' });
    await new Promise(r => setTimeout(r, 1000));
  }

  // Helper to log in as recruiter
  async function loginRecruiter() {
    console.log('\nSetting up authenticated recruiter session...');
    const recruiter = await User.findOne({ role: 'recruiter' });
    if (!recruiter) throw new Error('No recruiter account found in database.');
    const token = generateToken(recruiter);
    await page.goto('http://localhost:5500/index.html?view=public', { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok, usr) => {
      localStorage.clear();
      localStorage.setItem('careerpath_token', tok);
      localStorage.setItem('careerpath_user', JSON.stringify(usr));
    }, token, { id: recruiter._id || recruiter.id, email: recruiter.email, name: recruiter.name || 'Recruiter Admin', role: 'recruiter' });
    await new Promise(r => setTimeout(r, 1000));
  }

  // Helper to audit a single page
  async function auditUrl(url, pageName, viewports = [{ name: 'Desktop', width: 1280, height: 800 }, { name: 'Mobile', width: 390, height: 844 }]) {
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      const consoleErrors = [];
      const consoleWarnings = [];
      const failedRequests = [];

      const onConsole = msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
        if (msg.type() === 'warning') consoleWarnings.push(msg.text());
      };
      const onRequestFailed = req => {
        failedRequests.push(`${req.method()} ${req.url()} (${req.failure()?.errorText || 'failed'})`);
      };

      page.on('console', onConsole);
      page.on('requestfailed', onRequestFailed);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));

        // Check horizontal overflow
        const overflowData = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const innerWidth = window.innerWidth;
          const hasOverflow = scrollWidth > innerWidth + 2; // small tolerance

          let overflowingElements = [];
          if (hasOverflow) {
            const all = document.querySelectorAll('*');
            for (const el of all) {
              const rect = el.getBoundingClientRect();
              if (rect.right > innerWidth + 2) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className ? `.${Array.from(el.classList).join('.')}` : '';
                const id = el.id ? `#${el.id}` : '';
                overflowingElements.push({
                  selector: `${tag}${id}${cls}`,
                  right: Math.round(rect.right),
                  excess: Math.round(rect.right - innerWidth)
                });
              }
            }
          }

          // Check for any obvious styling anomalies
          // e.g. elements with missing backgrounds, dark text on dark bg, broken images
          const brokenImages = Array.from(document.querySelectorAll('img'))
            .filter(img => !img.complete || img.naturalWidth === 0)
            .map(img => img.src || img.getAttribute('src'));

          // Check if dark theme colors leak into light edutech mode
          const bodyBg = window.getComputedStyle(body).backgroundColor;
          const mainBg = document.querySelector('main') ? window.getComputedStyle(document.querySelector('main')).backgroundColor : null;

          return {
            hasOverflow,
            scrollWidth,
            innerWidth,
            overflowingElements: overflowingElements.slice(0, 5), // top 5
            brokenImages,
            bodyBg,
            mainBg
          };
        });

        // Screenshot
        const screenshotFile = `${pageName}_${vp.name}.png`;
        const screenshotPath = path.join(SCREENSHOT_DIR, screenshotFile);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        auditResults.push({
          pageName,
          viewport: vp.name,
          url,
          overflow: overflowData.hasOverflow,
          excessWidth: overflowData.scrollWidth - overflowData.innerWidth,
          overflowingElements: overflowData.overflowingElements,
          brokenImages: overflowData.brokenImages,
          consoleErrors,
          failedRequests,
          screenshot: screenshotFile
        });

        console.log(`[${vp.name}] ${pageName} -> Overflow: ${overflowData.hasOverflow ? 'YES (' + (overflowData.scrollWidth - overflowData.innerWidth) + 'px)' : 'No'} | Console Errors: ${consoleErrors.length}`);
        if (overflowData.hasOverflow && overflowData.overflowingElements.length > 0) {
          console.log(`   Overflowing elements:`, overflowData.overflowingElements);
        }
        if (consoleErrors.length > 0) {
          console.log(`   Console errors:`, consoleErrors);
        }

        const reportPath = path.join(__dirname, 'audit_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
      } catch (err) {
        console.error(`Error auditing ${pageName} (${vp.name}):`, err.message);
        auditResults.push({
          pageName,
          viewport: vp.name,
          url,
          error: err.message
        });
      } finally {
        page.off('console', onConsole);
        page.off('requestfailed', onRequestFailed);
      }
    }
  }

  // 1. Audit public pages first
  await auditUrl('http://localhost:5500/index.html', 'Landing_Index');
  await auditUrl('http://localhost:5500/login.html', 'Auth_Login');
  await auditUrl('http://localhost:5500/register.html', 'Auth_Register');
  await auditUrl('http://localhost:5500/verify.html?certId=CP-2026-VRF892', 'Cert_Verify');

  // 2. Log in as student
  await loginStudent();

  // 3. Audit student authenticated pages
  await auditUrl('http://localhost:5500/dashboard.html', 'Student_Dashboard');
  await auditUrl('http://localhost:5500/assessment.html', 'Student_Assessment');
  await auditUrl('http://localhost:5500/recommendations.html', 'Student_Recommendations');
  await auditUrl('http://localhost:5500/roadmap.html', 'Student_Roadmap');
  await auditUrl('http://localhost:5500/quiz.html', 'Student_Quiz_CodeChamber');
  await auditUrl('http://localhost:5500/jobs.html', 'Student_Jobs');
  await auditUrl('http://localhost:5500/resume-builder.html', 'Student_Resume_Builder');
  await auditUrl('http://localhost:5500/passport.html', 'Student_Passport');

  // Test roadmap views specifically
  console.log('\nTesting Roadmap Developer Explorer toggle...');
  try {
    await page.goto('http://localhost:5500/roadmap.html', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const expBtn = document.getElementById('viewModeExplorer');
      if (expBtn) expBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'Roadmap_Explorer_View.png') });
    console.log('Saved Roadmap_Explorer_View.png');
  } catch (e) {
    console.error('Roadmap explorer view test failed:', e.message);
  }

  // 4. Log in as recruiter and audit recruiter portal
  await loginRecruiter();
  await auditUrl('http://localhost:5500/recruiter-dashboard.html', 'Recruiter_Dashboard');

  await browser.close();

  // Save audit report JSON
  const reportPath = path.join(__dirname, 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  console.log('\n=== AUDIT COMPLETE ===');
  console.log('Results written to:', reportPath);
  console.log('Screenshots written to:', SCREENSHOT_DIR);
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});

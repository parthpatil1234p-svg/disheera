const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');
const jwt = require('../server/node_modules/jsonwebtoken');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const shotDir = path.join(__dirname, '..', 'ui_audit_shots');
if (!fs.existsSync(shotDir)) {
  fs.mkdirSync(shotDir, { recursive: true });
}

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, body: d });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function audit() {
  console.log('1. Authenticating demo student...');
  const loginRes = await post('http://localhost:5000/api/auth/login', {
    email: 'demouser@gmail.com',
    password: 'demo123'
  });

  const studentToken = loginRes.body?.data?.token;
  const studentUser = loginRes.body?.data?.user;
  console.log('Student token acquired:', !!studentToken, studentUser?.name);

  // Recruiter credentials & token
  const recruiterUser = {
    id: '97a8fe8450143928ec4531cf',
    name: 'Parth Patil',
    email: 'parthpatil@disheera.site',
    role: 'recruiter',
    isRecruiter: true,
    company: 'Disheera Talent Labs'
  };
  const recruiterToken = jwt.sign(
    { id: recruiterUser.id, role: 'recruiter' },
    'careerpathai404brainsecret2026',
    { expiresIn: '7d' }
  );

  console.log('2. Launching headless browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const pages = [
    { id: '01_landing', name: 'Landing Page', url: 'http://localhost:5500/index.html', auth: 'none' },
    { id: '02_login', name: 'Login Page', url: 'http://localhost:5500/login.html', auth: 'none' },
    { id: '03_register', name: 'Register Page', url: 'http://localhost:5500/register.html', auth: 'none' },
    { id: '04_dashboard', name: 'Student Dashboard', url: 'http://localhost:5500/dashboard.html', auth: 'student' },
    { id: '05_assessment', name: 'Assessment Chamber', url: 'http://localhost:5500/assessment.html', auth: 'student' },
    { id: '06_roadmap', name: 'Career Roadmap', url: 'http://localhost:5500/roadmap.html', auth: 'student' },
    { id: '07_recommendations', name: 'Career Recommendations', url: 'http://localhost:5500/recommendations.html', auth: 'student' },
    { id: '08_passport', name: 'Career Passport', url: 'http://localhost:5500/passport.html', auth: 'student' },
    { id: '09_resume_builder', name: 'AI Resume Builder', url: 'http://localhost:5500/resume-builder.html', auth: 'student' },
    { id: '10_jobs', name: 'Jobs Matcher', url: 'http://localhost:5500/jobs.html', auth: 'student' },
    { id: '11_recruiter_dashboard', name: 'Recruiter Dashboard', url: 'http://localhost:5500/recruiter-dashboard.html', auth: 'recruiter' },
    { id: '12_verify', name: 'Public Verification', url: 'http://localhost:5500/verify.html', auth: 'none' }
  ];

  const results = [];

  for (const item of pages) {
    console.log(`\nAuditing [${item.id}] ${item.name}...`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const consoleLogs = [];
    const errors = [];
    const badRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleLogs.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));
    page.on('requestfailed', req => badRequests.push(`${req.method()} ${req.url()}: ${req.failure()?.errorText}`));

    if (item.auth === 'student' && studentToken) {
      await page.evaluateOnNewDocument((token, user) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('careerpath_token', token);
        localStorage.setItem('careerpath_user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }, studentToken, studentUser);
    } else if (item.auth === 'recruiter') {
      await page.evaluateOnNewDocument((token, user) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('careerpath_token', token);
        localStorage.setItem('careerpath_user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }, recruiterToken, recruiterUser);
    } else {
      await page.evaluateOnNewDocument(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    }

    let loadStatus = 200;
    try {
      const resp = await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 15000 });
      loadStatus = resp ? resp.status() : 200;
    } catch (e) {
      loadStatus = 'timeout: ' + e.message;
    }

    // Wait a brief moment for dynamic JS to mount
    await new Promise(r => setTimeout(r, 1500));

    // Page inspection
    const analysis = await page.evaluate(() => {
      const doc = document;
      const html = doc.documentElement;
      const body = doc.body;

      // Scroll dimensions
      const hasHScroll = html.scrollWidth > html.clientWidth || body.scrollWidth > window.innerWidth;
      const overflowDiff = Math.max(0, html.scrollWidth - html.clientWidth);

      // Broken images
      const images = Array.from(doc.querySelectorAll('img'));
      const brokenImgs = images
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => ({ src: img.src.substring(0, 80), alt: img.alt || '(no alt)' }));

      // Typography
      const h1s = Array.from(doc.querySelectorAll('h1')).map(h => h.innerText.trim()).filter(Boolean);
      const h2s = Array.from(doc.querySelectorAll('h2')).map(h => h.innerText.trim()).filter(Boolean);

      // Buttons
      const buttons = Array.from(doc.querySelectorAll('button, a.btn, a[class*="btn"]'));
      const buttonTexts = buttons.map(b => b.innerText.trim()).filter(t => t.length > 0 && t.length < 40).slice(0, 10);

      // Theme / Colors check
      const bodyStyle = window.getComputedStyle(body);
      const bodyBg = bodyStyle.backgroundColor;
      const bodyColor = bodyStyle.color;

      // Detect dark mode / pitch black anomalies in main containers
      const containers = Array.from(doc.querySelectorAll('main, section, .card, div[class*="bg-"]'));
      const darkSections = [];
      for (const el of containers) {
        const bg = window.getComputedStyle(el).backgroundColor;
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const [_, r, g, b] = match.map(Number);
          if (r < 25 && g < 30 && b < 45 && el.offsetWidth > 300 && el.offsetHeight > 100) {
            darkSections.push({ tag: el.tagName, class: el.className.substring(0, 60), bg });
          }
        }
      }

      // Check text for AI buzzwords or prompt leaks
      const allText = body.innerText || '';
      const slopKeywords = ['16:9 WIDESCREEN', 'telemetry chamber', 'hyper-personalized synergy', 'as an AI', 'delve', 'tapestry'];
      const foundSlop = slopKeywords.filter(k => allText.toLowerCase().includes(k.toLowerCase()));

      return {
        title: doc.title,
        hasHScroll,
        overflowDiff,
        totalImages: images.length,
        brokenImages: brokenImgs,
        h1Count: h1s.length,
        h1s: h1s.slice(0, 3),
        h2Count: h2s.length,
        h2s: h2s.slice(0, 5),
        buttonCount: buttons.length,
        sampleButtons: buttonTexts,
        bodyBg,
        bodyColor,
        darkSectionsFound: darkSections.length,
        darkSections: darkSections.slice(0, 3),
        foundSlop
      };
    });

    // Capture screenshot
    const shotPath = path.join(shotDir, `${item.id}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    results.push({
      ...item,
      loadStatus,
      shotPath,
      analysis,
      consoleErrors: consoleLogs.slice(0, 3),
      pageErrors: errors.slice(0, 3),
      badRequests: badRequests.slice(0, 3)
    });

    await page.close();
  }

  await browser.close();

  const reportPath = path.join(shotDir, 'detailed_audit_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nAudit completed successfully! Saved to: ${reportPath}`);
}

audit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});

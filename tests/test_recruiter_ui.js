const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const User = require('../server/models/User');
const generateToken = require('../server/utils/generateToken');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testRecruiterUI() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,800']
  });

  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    console.log('Fetching recruiter profile from database...');
    let recruiterUser = await User.findOne({ role: 'recruiter' });
    if (!recruiterUser) {
      throw new Error('No recruiter account found in database.');
    }
    const token = generateToken(recruiterUser);
    const user = {
      id: recruiterUser._id || recruiterUser.id,
      email: recruiterUser.email,
      name: recruiterUser.name || 'Recruiter Admin',
      role: 'recruiter'
    };

    console.log('Navigating to local client...');
    await page.goto('http://localhost:5500/login.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok, usr) => {
      localStorage.setItem('careerpath_token', tok);
      localStorage.setItem('careerpath_user', JSON.stringify(usr));
    }, token, user);

    // Test Desktop (1280x800)
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:5500/recruiter-dashboard.html', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1500));

    const desktopOverflow = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    console.log('Desktop Recruiter Dashboard:', desktopOverflow);

    // Test Mobile (390x844)
    await page.setViewport({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 1500));

    const mobileOverflow = await page.evaluate(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
      const innerWidth = window.innerWidth;
      const hasOverflow = scrollWidth > innerWidth + 2;

      let overflowing = [];
      if (hasOverflow) {
        document.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.right > innerWidth + 2) {
            overflowing.push({
              selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + Array.from(el.classList).join('.') : ''),
              excess: Math.round(r.right - innerWidth)
            });
          }
        });
      }

      return {
        scrollWidth,
        innerWidth,
        hasOverflow,
        overflowing: overflowing.slice(0, 5)
      };
    });

    console.log('Mobile Recruiter Dashboard:', mobileOverflow);
    console.log('Console Errors:', consoleErrors);

    const screenshotsDir = path.join(__dirname, 'audit_screenshots');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotsDir, 'Recruiter_Dashboard_Mobile.png') });
    console.log('Recruiter UI Browser Verification Completed Successfully ✅');
  } finally {
    await browser.close();
  }
}

testRecruiterUI().catch(err => {
  console.error(err);
  process.exit(1);
});

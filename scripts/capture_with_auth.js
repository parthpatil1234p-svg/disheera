const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\PARTH\\.gemini\\antigravity\\brain\\5477b5ac-dde8-43f8-b1a3-44056dddb975';

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
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function capture() {
  const loginRes = await post('http://localhost:5000/api/auth/login', {
    email: 'demouser@gmail.com',
    password: 'demo123'
  });

  const token = loginRes.body?.data?.token;
  const user = loginRes.body?.data?.user;
  console.log('Login success:', !!token, user?.name);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1440,1100']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });

  await page.evaluateOnNewDocument((t, u) => {
    localStorage.setItem('careerpath_token', t);
    localStorage.setItem('careerpath_user', JSON.stringify(u));
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, token, user);

  await page.goto('http://localhost:5500/assessment.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // Advance to Step 1: Academic Background
  await page.evaluate(() => {
    const btn = document.getElementById('step0ContinueBtn');
    if (btn) btn.click();
    else {
      const nav1 = document.getElementById('navStep1');
      if (nav1) nav1.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Populate inputs with representative user values
  await page.evaluate(() => {
    const fn = document.getElementById('fullName');
    if (fn) fn.value = 'Parth Patil';
    const c = document.getElementById('course');
    if (c) c.value = 'BCA';
    const b = document.getElementById('branch');
    if (b) b.value = 'Computer Science';
    const y = document.getElementById('year');
    if (y) y.value = 'Second Year';
    const col = document.getElementById('college');
    if (col) col.value = 'G.H. Raisoni College of Engineering and Management, Jalgaon';
  });

  const shotPath = path.join(artifactDir, 'assessment_redesign_final.png');
  await page.screenshot({ path: shotPath });
  console.log('SUCCESS: Captured screenshot to:', shotPath);

  // Check positions
  const positions = await page.evaluate(() => {
    const hdr = document.querySelector('header');
    const tel = document.querySelector('.assessment-telemetry-bar');
    return {
      headerRect: hdr ? { top: hdr.getBoundingClientRect().top, bottom: hdr.getBoundingClientRect().bottom, height: hdr.offsetHeight } : null,
      telemetryRect: tel ? { top: tel.getBoundingClientRect().top, bottom: tel.getBoundingClientRect().bottom, height: tel.offsetHeight } : null
    };
  });
  console.log('Element positions:', JSON.stringify(positions, null, 2));

  await browser.close();
}

capture().catch(console.error);

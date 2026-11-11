const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const shotDir = path.join(__dirname, '..', 'ui_audit_shots');

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

async function check() {
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
    args: ['--no-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

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
    const clg = document.getElementById('college');
    if (clg) clg.value = 'G.H. Raisoni College of Engineering and Management, Jalgaon';
  });

  const shotPath = path.join(shotDir, 'alignment_after.png');
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log('Saved screenshot to:', shotPath);

  // Check inputs in stepPanel1
  const info = await page.evaluate(() => {
    const p1 = document.getElementById('stepPanel1');
    const row = p1?.querySelector('.row');
    const cols = Array.from(row?.children || []).map(col => ({
      class: col.className,
      label: col.querySelector('label')?.innerText.trim(),
      inputWidth: col.querySelector('input, select')?.offsetWidth,
      colWidth: col.offsetWidth
    }));

    // Check navbar alignment
    const nav = document.querySelector('.cp-navbar-notch');
    const proctor = nav?.querySelector('.material-symbols-outlined')?.parentElement;
    const links = nav?.querySelector('.notch-nav-links');
    
    // Check secondary sticky bar
    const secBar = document.querySelector('.sticky.top-16');

    return {
      currentUrl: window.location.href,
      panel1Visible: p1 ? !p1.classList.contains('d-none') && window.getComputedStyle(p1).display !== 'none' : false,
      cols,
      proctorText: proctor?.innerText,
      proctorWidth: proctor?.offsetWidth,
      linksWidth: links?.offsetWidth,
      secBarChildren: Array.from(secBar?.firstElementChild?.children || []).map(c => ({
        class: c.className,
        width: c.offsetWidth,
        text: c.innerText.replace(/\n/g, ' ')
      }))
    };
  });

  console.log('DOM Info:', JSON.stringify(info, null, 2));
  await browser.close();
}

check().catch(console.error);

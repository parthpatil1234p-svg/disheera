/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Listen for any console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  // Test at 1920x1080 (Wide Desktop matching user screenshot)
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5500/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Inspect #startAssessmentBtn computed style
  const btnStyle = await page.evaluate(() => {
    const btn = document.getElementById('startAssessmentBtn');
    const label = btn ? btn.querySelector('.rg-label') : null;
    const computed = window.getComputedStyle(btn);
    const labelComputed = label ? window.getComputedStyle(label) : null;
    return {
      btnColor: computed.color,
      labelColor: labelComputed ? labelComputed.color : null,
      bg: computed.backgroundColor,
      text: btn ? btn.innerText.trim() : null
    };
  });
  console.log('Hero CTA Button Style:', btnStyle);

  // Screenshot 1920x1080 top of page (hero)
  const heroScreenshotPath = path.join(__dirname, 'hero_1920x1080.png');
  await page.screenshot({ path: heroScreenshotPath, clip: { x: 0, y: 0, width: 1920, height: 950 } });
  console.log('Saved 1920x1080 hero screenshot to:', heroScreenshotPath);

  // Test interactivity: click on Station 3 (Proctored Test)
  await page.evaluate(() => {
    const st3 = document.querySelector('.highway-station[data-station="3"]');
    if (st3) st3.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const station3ScreenshotPath = path.join(__dirname, 'hero_station3_active.png');
  await page.screenshot({ path: station3ScreenshotPath, clip: { x: 0, y: 0, width: 1920, height: 950 } });
  console.log('Saved station 3 active screenshot to:', station3ScreenshotPath);

  // Test track switcher: click on "Business"
  await page.evaluate(() => {
    const bizPill = document.querySelector('.route-track-pill[data-track="business"]');
    if (bizPill) bizPill.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const bizTrackScreenshotPath = path.join(__dirname, 'hero_biz_track.png');
  await page.screenshot({ path: bizTrackScreenshotPath, clip: { x: 0, y: 0, width: 1920, height: 950 } });
  console.log('Saved business track screenshot to:', bizTrackScreenshotPath);

  console.log('Console errors encountered:', errors.length);
  if (errors.length > 0) {
    console.log(errors);
  }

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});

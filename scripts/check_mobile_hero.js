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

async function checkMobile() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Test 375x812 (iPhone)
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5500/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const overflow375 = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Mobile 375px Horizontal Overflow:', overflow375);

  const mobileScreenshotPath = path.join(__dirname, 'hero_mobile_375.png');
  await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
  console.log('Saved 375px mobile screenshot to:', mobileScreenshotPath);

  // Test 768x1024 (iPad/Tablet)
  await page.setViewport({ width: 768, height: 1024 });
  await page.goto('http://localhost:5500/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const overflow768 = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Tablet 768px Horizontal Overflow:', overflow768);

  const tabletScreenshotPath = path.join(__dirname, 'hero_tablet_768.png');
  await page.screenshot({ path: tabletScreenshotPath, fullPage: false });
  console.log('Saved 768px tablet screenshot to:', tabletScreenshotPath);

  await browser.close();
}

checkMobile().catch(err => {
  console.error(err);
  process.exit(1);
});

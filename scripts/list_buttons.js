/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function list() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5500/index.html');
  await new Promise(r => setTimeout(r, 1500));

  const btns = await page.evaluate(() => {
    const raw = [];
    for (const el of document.querySelectorAll('button, .btn, [role="button"]')) {
      const s = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (s.display !== 'none' && s.visibility !== 'hidden' && rect.width > 0 && rect.height > 0) {
        raw.push({
          tag: el.tagName,
          cls: el.className,
          pad: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
          fs: s.fontSize,
          r: s.borderRadius,
          text: el.innerText.trim().slice(0, 30)
        });
      }
    }
    const map = new Map();
    raw.forEach(b => {
      const key = b.pad + '|' + b.r + '|' + b.fs;
      if (!map.has(key)) map.set(key, b);
    });
    return Array.from(map.values());
  });

  console.log('Distinct button styles count:', btns.length);
  console.log(btns);
  await browser.close();
}

list().catch(console.error);

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

async function diagnose() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5500/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const details = await page.evaluate(() => {
    const isVisible = el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0;
    };

    const oddRadii = [];
    const oddFontSizes = [];
    const oddColors = [];
    const buttons = [];

    document.querySelectorAll('*').forEach(el => {
      if (!isVisible(el)) return;
      const s = window.getComputedStyle(el);

      const r = s.borderRadius;
      if (r && !['6px', '10px', '16px', '9999px', '50%', '0px'].includes(r)) {
        oddRadii.push({ tag: el.tagName, class: el.className, r, html: el.outerHTML.slice(0, 100) });
      }

      let hasDirectText = false;
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
          hasDirectText = true;
          break;
        }
      }

      if (hasDirectText) {
        const fs = s.fontSize;
        if (!['13px', '14px', '16px', '18px', '20px', '24px', '32px', '44px'].includes(fs)) {
          oddFontSizes.push({ tag: el.tagName, class: el.className, fs, text: el.innerText.slice(0, 40) });
        }
      }

      if (el.tagName === 'BUTTON' || el.classList.contains('btn') || el.getAttribute('role') === 'button') {
        buttons.push({
          tag: el.tagName,
          class: el.className,
          pad: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
          radius: s.borderRadius,
          fs: s.fontSize,
          text: el.innerText.trim().slice(0, 30)
        });
      }
    });

    return { oddRadii: oddRadii.slice(0, 10), oddFontSizes: oddFontSizes.slice(0, 10), buttons: buttons.slice(0, 15) };
  });

  console.log('--- ODD RADII EXAMPLES ---', details.oddRadii);
  console.log('\n--- ODD FONT SIZES EXAMPLES ---', details.oddFontSizes);
  console.log('\n--- BUTTONS EXAMPLES ---', details.buttons);

  await browser.close();
}

diagnose().catch(console.error);

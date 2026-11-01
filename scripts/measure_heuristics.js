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

async function measure() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:5500/index.html', { waitUntil: 'networkidle2' });

  // Give any animations/deferred scripts a moment
  await new Promise(r => setTimeout(r, 1500));

  const stats = await page.evaluate(() => {
    const allEls = Array.from(document.querySelectorAll('*'));
    const fontSizes = new Set();
    const textColors = new Set();
    const radii = new Set();
    const buttonStyles = new Set();

    const isVisible = el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0;
    };

    allEls.forEach(el => {
      if (!isVisible(el)) return;
      const s = window.getComputedStyle(el);

      // Only count font-size and color if element has direct text content
      let hasDirectText = false;
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
          hasDirectText = true;
          break;
        }
      }

      if (hasDirectText) {
        fontSizes.add(s.fontSize);
        textColors.add(s.color);
      }

      if (s.borderRadius && s.borderRadius !== '0px') {
        radii.add(s.borderRadius);
      }

      if (el.tagName === 'BUTTON' || el.classList.contains('btn') || el.getAttribute('role') === 'button') {
        const btnSig = `${s.paddingTop}_${s.paddingRight}_${s.paddingBottom}_${s.paddingLeft}|${s.borderRadius}|${s.fontSize}|${s.fontWeight}`;
        buttonStyles.add(btnSig);
      }
    });

    return {
      fontSizesCount: fontSizes.size,
      fontSizes: Array.from(fontSizes).sort(),
      textColorsCount: textColors.size,
      textColors: Array.from(textColors).sort(),
      radiiCount: radii.size,
      radii: Array.from(radii).sort(),
      buttonStylesCount: buttonStyles.size,
      buttonStyles: Array.from(buttonStyles)
    };
  });

  console.log('--- COMPUTED LIVE USABILITY METRICS ---');
  console.log('1. Button Styles Count:', stats.buttonStylesCount, '(aim <= 5)');
  console.log('2. Font Sizes Count:', stats.fontSizesCount, '(aim <= 10)');
  console.log('   Font sizes:', stats.fontSizes);
  console.log('3. Text Colors Count:', stats.textColorsCount, '(aim <= 12)');
  console.log('   Text colors:', stats.textColors);
  console.log('4. Radii Count:', stats.radiiCount, '(aim <= 6)');
  console.log('   Radii:', stats.radii);

  await browser.close();
}

measure().catch(err => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node

// Export the same print layout used by the site's Download PDF button.
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'output/pdf');
const executablePath = process.env.CHROME_PATH || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  chromium.executablePath(),
].find(existsSync);
if (!executablePath) throw new Error('Install Chrome or set CHROME_PATH to a Chromium executable.');

mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.evaluate(() => document.fonts.ready);
  for (const lang of ['en', 'pt']) {
    await page.click(`[data-lang-btn="${lang}"]`);
    const destination = path.join(output, `felipe-broering-${lang}.pdf`);
    await page.pdf({ path: destination, format: 'A4', preferCSSPageSize: true, printBackground: true });
    console.log(destination);
  }
} finally {
  await browser.close();
}

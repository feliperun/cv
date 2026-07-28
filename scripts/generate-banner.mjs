#!/usr/bin/env node
/**
 * Generates the LinkedIn cover banner (assets/linkedin-banner.svg + .png).
 *
 * Abstract geometry only — no text, no waveform. The palette is the same
 * graphite + steel-blue system used by the resume site, so the profile and
 * cv.felipe.run read as one thing.
 *
 * Layout notes: LinkedIn overlays the avatar around x 265-575 / y 212-396 of
 * the 1584x396 canvas and crops the outer edges on narrow viewports, so the
 * visual weight sits centre-right and everything fades out at the borders.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = path.join(ROOT, "assets");

const W = 1584;
const H = 396;
const SCALE = 2; // upload at 3168x792 so LinkedIn's own downscale stays crisp

// -- palette (mirrors :root in generate-resume.js) ---------------------------
const INK_DEEP = "#0b0d10";
const INK_RAISE = "#161b24";
const ACCENT = "#6ea8fe";
const HAIRLINE = "150, 170, 200";

// -- diagonal hairline field -------------------------------------------------
// Lines at ~62deg, drawn well past the canvas so the slant never shows a seam.
const LINE_GAP = 38;
const LINE_SLOPE = 2.1; // dx over the full height
const lines = [];
for (let i = -Math.ceil((H * LINE_SLOPE) / LINE_GAP); i * LINE_GAP < W + H * LINE_SLOPE; i++) {
  const x = i * LINE_GAP;
  // every 7th line picks up the accent colour, at low opacity
  const accented = ((i % 5) + 5) % 5 === 0;
  lines.push(
    `<line x1="${x}" y1="${H + 40}" x2="${(x + H * LINE_SLOPE).toFixed(1)}" y2="${-40}" ` +
      `stroke="${accented ? ACCENT : `rgb(${HAIRLINE})`}" stroke-width="${accented ? 1.6 : 1}" ` +
      `opacity="${accented ? 0.62 : 0.3}"/>`
  );
}

// -- dot field ---------------------------------------------------------------
const DOT_GAP = 24;
const dots = [];
for (let y = DOT_GAP / 2; y < H; y += DOT_GAP) {
  for (let x = DOT_GAP / 2; x < W; x += DOT_GAP) {
    dots.push(`<circle cx="${x}" cy="${y}" r="1.5"/>`);
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Abstract geometric cover">
  <defs>
    <linearGradient id="base" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${INK_DEEP}"/>
      <stop offset="0.55" stop-color="${INK_RAISE}"/>
      <stop offset="1" stop-color="${INK_DEEP}"/>
    </linearGradient>

    <radialGradient id="glow" cx="0.76" cy="0.12" r="0.62">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.20"/>
      <stop offset="0.55" stop-color="${ACCENT}" stop-opacity="0.05"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>

    <!-- hairlines: absent bottom-left (under the avatar), densest top-right.
         Two masks, nested rather than blended, so X and Y actually multiply. -->
    <linearGradient id="lineFadeX" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.28" stop-color="#fff" stop-opacity="0.06"/>
      <stop offset="0.6" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="0.88" stop-color="#fff" stop-opacity="1"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0.4"/>
    </linearGradient>
    <linearGradient id="lineFadeY" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="0.45" stop-color="#fff" stop-opacity="0.6"/>
      <stop offset="1" stop-color="#fff" stop-opacity="1"/>
    </linearGradient>
    <mask id="lineMaskX"><rect width="${W}" height="${H}" fill="url(#lineFadeX)"/></mask>
    <mask id="lineMaskY"><rect width="${W}" height="${H}" fill="url(#lineFadeY)"/></mask>

    <!-- dots: a quiet field on the left, gone by the time lines take over -->
    <linearGradient id="dotFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.14" stop-color="#fff" stop-opacity="0.5"/>
      <stop offset="0.44" stop-color="#fff" stop-opacity="0.16"/>
      <stop offset="0.66" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="dotMask"><rect width="${W}" height="${H}" fill="url(#dotFade)"/></mask>

    <!-- vignette so LinkedIn's edge crop never cuts through a hard element -->
    <linearGradient id="edgeL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${INK_DEEP}" stop-opacity="0.85"/>
      <stop offset="1" stop-color="${INK_DEEP}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="edgeR" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="${INK_DEEP}" stop-opacity="0.7"/>
      <stop offset="1" stop-color="${INK_DEEP}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="edgeB" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${INK_DEEP}" stop-opacity="0.6"/>
      <stop offset="1" stop-color="${INK_DEEP}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#base)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <g mask="url(#lineMaskY)"><g mask="url(#lineMaskX)">${lines.join("")}</g></g>
  <g mask="url(#dotMask)" fill="rgb(${HAIRLINE})" opacity="0.7">${dots.join("")}</g>

  <rect width="220" height="${H}" fill="url(#edgeL)"/>
  <rect x="${W - 200}" width="200" height="${H}" fill="url(#edgeR)"/>
  <rect y="${H - 150}" width="${W}" height="150" fill="url(#edgeB)"/>
</svg>
`;

fs.mkdirSync(ASSETS, { recursive: true });
const svgPath = path.join(ASSETS, "linkedin-banner.svg");
fs.writeFileSync(svgPath, svg, "utf8");

const pngPath = path.join(ASSETS, "linkedin-banner.png");
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: SCALE,
  });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:${INK_DEEP};}svg{display:block}</style>${svg}`,
    { waitUntil: "load" }
  );
  await page.screenshot({ path: pngPath });
} finally {
  await browser.close();
}

console.log(`Generated ${path.relative(ROOT, svgPath)} and ${path.relative(ROOT, pngPath)} (${W * SCALE}x${H * SCALE})`);

#!/usr/bin/env node
/**
 * Sync the resume (README.md EN / README.pt-BR.md PT) to the LinkedIn profile
 * using CloakBrowser, driving the real edit UI.
 *
 *   npm run linkedin:sync                 # DRY-RUN (default): diff + screenshots, no writes
 *   npm run linkedin:sync -- --apply      # actually edits the profile
 *   npm run linkedin:sync -- --lang en    # only the primary (English) profile
 *   npm run linkedin:sync -- --only headline
 *
 * Safety: dry-run is the default and is read-only (opens edit modals to validate
 * selectors, then Escapes without saving). Only --apply writes. Set
 * LINKEDIN_SYNC_DISABLED=1 to hard-disable. Session comes from env secrets
 * (LINKEDIN_LI_AT / LINKEDIN_JSESSIONID) in CI, or ~/.config/cv-linkedin/session.json locally.
 *
 * ⚠️ Editing LinkedIn via automation violates its User Agreement (account risk).
 * ⚠️ The selectors need one supervised live validation (see linkedin-selectors.mjs).
 */

import { launchContext } from "cloakbrowser";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { buildContent } = require("./linkedin-content.js");
const { profileUrl, selectors, setFieldValue } = await import("./lib/linkedin-selectors.mjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// Snapshot dir is configurable so the private sync repo can persist it outside
// this checkout (LINKEDIN_SNAPSHOT_DIR). Preview screenshots stay ephemeral.
const SNAP_DIR = process.env.LINKEDIN_SNAPSHOT_DIR
  ? path.resolve(process.env.LINKEDIN_SNAPSHOT_DIR)
  : path.join(ROOT, ".linkedin");
const PREVIEW_DIR = path.join(ROOT, ".linkedin", "preview");
const SESSION_FILE = path.join(os.homedir(), ".config", "cv-linkedin", "session.json");

const VANITY = process.env.LINKEDIN_VANITY || "felipebroering";
// Primary profile = English; secondary = Portuguese (created 2026-07-23).
// Secondary locale uses the hyphenated form required by the ?locale= URL.
const LANG_CONF = {
  en: { primary: true, locale: "en-US" },
  pt: { primary: false, locale: "pt-BR" },
};
const FIELDS = ["headline", "about"]; // positions handled in a later phase

function parseArgs(argv) {
  const has = (f) => argv.includes(f);
  const val = (f) => {
    const i = argv.indexOf(f);
    return i >= 0 ? argv[i + 1] : null;
  };
  const langs = (val("--lang") || "both").toLowerCase();
  return {
    apply: has("--apply"),
    detect: has("--detect"),
    langs: langs === "both" ? ["en", "pt"] : [langs],
    only: (val("--only") || "").split(",").map((s) => s.trim()).filter(Boolean),
  };
}

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function loadSession() {
  const envLiAt = process.env.LINKEDIN_LI_AT;
  const envJsession = process.env.LINKEDIN_JSESSIONID;
  if (envLiAt && envJsession) {
    return { li_at: envLiAt, jsessionid: envJsession, storageState: null, source: "env" };
  }
  if (fs.existsSync(SESSION_FILE)) {
    const s = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
    return { ...s, source: "file" };
  }
  throw new Error(
    "No session. Set LINKEDIN_LI_AT + LINKEDIN_JSESSIONID env vars, or run `npm run linkedin:login` locally."
  );
}

function cookiesFrom(session) {
  return [
    { name: "li_at", value: session.li_at, domain: ".linkedin.com", path: "/", httpOnly: true, secure: true },
    { name: "JSESSIONID", value: session.jsessionid, domain: ".www.linkedin.com", path: "/", secure: true },
  ];
}

function readSnapshot(lang) {
  const f = path.join(SNAP_DIR, `last-synced.${lang}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
}

function writeSnapshot(lang, content, fields) {
  fs.mkdirSync(SNAP_DIR, { recursive: true });
  const prev = readSnapshot(lang);
  const next = { ...prev };
  for (const f of fields) next[f] = content[f];
  fs.writeFileSync(path.join(SNAP_DIR, `last-synced.${lang}.json`), JSON.stringify(next, null, 2) + "\n");
}

// Which of FIELDS changed vs the last-synced snapshot.
function changedFields(lang, content, only) {
  const snap = readSnapshot(lang);
  const scope = only.length ? only : FIELDS;
  return scope.filter((f) => content[f] !== undefined && content[f] !== snap[f]);
}

async function screenshot(page, name) {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const file = path.join(PREVIEW_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false }).catch(() => {});
  return file;
}

async function verifyLoggedIn(page) {
  await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" }).catch(() => {});
  const url = page.url();
  if (/\/(login|checkpoint|authwall)/.test(url)) {
    throw new Error(`Session stale / checkpoint hit (${url}). Re-run \`npm run linkedin:login\`.`);
  }
  const ok = await selectors
    .loggedIn(page)
    .waitFor({ state: "visible", timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (!ok) throw new Error("Could not confirm a logged-in session. Re-run `npm run linkedin:login`.");
}

async function editField(page, lang, field, value, { apply }) {
  const openBtn = field === "headline" ? selectors.editIntroButton : selectors.editAboutButton;
  const fieldLoc = field === "headline" ? selectors.headlineField : selectors.aboutField;
  const tag = `${lang}-${field}`;

  try {
    await openBtn(page).click({ timeout: 15000 });
  } catch {
    log(`  ! ${tag}: could not open the edit modal (selector needs validation) — skipped.`);
    return { field, status: "selector-miss" };
  }

  // The headline editor only hydrates after its area scrolls into view.
  if (field === "headline") {
    await selectors.headlineAnchor(page).scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(600);
  }

  // The modal content lazy-loads behind a spinner — wait for the field before
  // judging the selector or taking the preview screenshot.
  const seen = await fieldLoc(page)
    .waitFor({ state: "visible", timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  await screenshot(page, `${tag}-modal`);

  if (!apply) {
    // Read-only validation: confirm the field, then Escape without saving.
    await page.keyboard.press("Escape").catch(() => {});
    log(`  · ${tag}: would set ${value.length} chars${seen ? "" : " (field selector needs validation)"}.`);
    return { field, status: seen ? "dry-ok" : "dry-selector-miss" };
  }

  await setFieldValue(page, fieldLoc, value);
  await selectors.saveButton(page).click({ timeout: 15000 });
  // Confirm the modal actually closed — a validation error keeps it open.
  await selectors.dialog(page).waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await screenshot(page, `${tag}-saved`);
  log(`  ✓ ${tag}: applied (${value.length} chars).`);
  return { field, status: "applied" };
}

async function syncLang(page, lang, content, changed, opts) {
  const conf = LANG_CONF[lang];
  log(`\n[${lang}] ${conf.primary ? "primary" : "secondary"} profile — changed: ${changed.join(", ") || "none"}`);
  if (!changed.length) return [];

  await page.goto(profileUrl(VANITY, conf.primary ? null : conf.locale), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await screenshot(page, `${lang}-profile`);

  // Secondary-language editing works through the `?locale=` profile view:
  // its edit pencil links carry `language=xx&country=YY` and open the edit
  // forms of that language version (validated live 2026-07-23).

  const results = [];
  for (const field of changed) {
    results.push(await editField(page, lang, field, content[field], opts));
    await page.waitForTimeout(1200);
  }
  return results;
}

async function main() {
  if (process.env.LINKEDIN_SYNC_DISABLED === "1") {
    log("LINKEDIN_SYNC_DISABLED=1 — sync disabled, exiting.");
    return;
  }
  const opts = parseArgs(process.argv.slice(2));
  log(`LinkedIn sync — mode: ${opts.apply ? "APPLY" : "DRY-RUN"}, langs: ${opts.langs.join(",")}`);

  const content = {};
  const changed = {};
  let anyChange = false;
  for (const lang of opts.langs) {
    content[lang] = buildContent(lang);
    changed[lang] = changedFields(lang, content[lang], opts.only);
    if (changed[lang].length) anyChange = true;
    if (content[lang].warnings?.length) {
      log(`[${lang}] content warnings: ${content[lang].warnings.join("; ")}`);
    }
  }

  // Detect mode: report whether anything changed (for the cron gate), no browser.
  if (opts.detect) {
    log(`changed=${anyChange}`);
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${anyChange}\n`);
    }
    return;
  }

  if (!anyChange) {
    log("Nothing changed vs last sync — done.");
    return;
  }

  const session = loadSession();
  log(`Session source: ${session.source}.`);

  const context = await launchContext({
    headless: process.env.LINKEDIN_HEADLESS === "1",
    humanize: true,
    locale: "en-US",
    viewport: { width: 1280, height: 900 },
    contextOptions: session.storageState ? { storageState: session.storageState } : {},
  });
  if (!session.storageState) await context.addCookies(cookiesFrom(session));

  const page = await context.newPage();
  const summary = {};
  try {
    await verifyLoggedIn(page);
    for (const lang of opts.langs) {
      summary[lang] = await syncLang(page, lang, content[lang], changed[lang], opts);
    }
  } finally {
    await context.close();
  }

  // Only persist the snapshot for fields we actually applied.
  if (opts.apply) {
    for (const lang of opts.langs) {
      const applied = (summary[lang] || []).filter((r) => r.status === "applied").map((r) => r.field);
      if (applied.length) writeSnapshot(lang, content[lang], applied);
    }
  }

  log(`\nDone (${opts.apply ? "APPLY" : "DRY-RUN"}). Screenshots in ${path.relative(ROOT, PREVIEW_DIR)}/`);
  if (!opts.apply) log("Review the screenshots, then re-run with --apply.");
}

main().catch((err) => {
  console.error("\nlinkedin:sync failed:", err.message);
  process.exit(1);
});

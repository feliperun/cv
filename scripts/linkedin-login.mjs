#!/usr/bin/env node
/**
 * One-time LOCAL LinkedIn session capture (run on your Mac, headed).
 *
 * Opens a stealth Chromium, you log in + complete 2FA/checkpoint manually,
 * then this extracts the `li_at` and `JSESSIONID` cookies and:
 *   - saves a local session file (~/.config/cv-linkedin/session.json), and
 *   - prints the two values to register as GitHub Environment secrets.
 *
 * Never commits secrets. Re-run whenever the session expires.
 *
 *   npm run linkedin:login
 */

import { launchPersistentContext } from "cloakbrowser";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const CONFIG_DIR = path.join(os.homedir(), ".config", "cv-linkedin");
const PROFILE_DIR = path.join(CONFIG_DIR, "profile");
const SESSION_FILE = path.join(CONFIG_DIR, "session.json");
const LOGIN_URL = "https://www.linkedin.com/login";
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes to finish login + 2FA
const POLL_MS = 3000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  console.log("Opening stealth Chromium… log in to LinkedIn and finish 2FA/checkpoint.");
  const context = await launchPersistentContext({
    userDataDir: PROFILE_DIR,
    headless: false,
    humanize: true,
    locale: "en-US",
    viewport: { width: 1280, height: 900 },
  });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });

  const deadline = Date.now() + TIMEOUT_MS;
  let liAt = null;
  let jsession = null;
  while (Date.now() < deadline) {
    const cookies = await context.cookies("https://www.linkedin.com");
    liAt = cookies.find((c) => c.name === "li_at") || null;
    jsession = cookies.find((c) => c.name === "JSESSIONID") || null;
    if (liAt && jsession) break;
    await sleep(POLL_MS);
  }

  if (!liAt || !jsession) {
    await context.close();
    console.error("\nTimed out without capturing li_at + JSESSIONID. Re-run and complete login within 5 minutes.");
    process.exit(1);
  }

  const storageState = await context.storageState();
  const session = {
    li_at: liAt.value,
    // JSESSIONID arrives wrapped in quotes; the csrf-token header wants it verbatim.
    jsessionid: jsession.value,
    capturedAt: new Date().toISOString(),
    storageState,
  };
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), { mode: 0o600 });
  await context.close();

  console.log(`\nSession saved to ${SESSION_FILE} (chmod 600, git-ignored).`);
  console.log("\nRegister these as GitHub Environment secrets (environment: linkedin):\n");
  console.log(`  gh secret set LINKEDIN_LI_AT --env linkedin --repo feliperun/cv --body '${liAt.value}'`);
  console.log(`  gh secret set LINKEDIN_JSESSIONID --env linkedin --repo feliperun/cv --body '${jsession.value}'`);
  console.log("\n(Or paste them in the repo Settings → Environments → linkedin → Secrets.)");
  console.log("Treat both as passwords. They expire — re-run this when the sync reports a stale session.");
}

main().catch((err) => {
  console.error("linkedin:login failed:", err);
  process.exit(1);
});

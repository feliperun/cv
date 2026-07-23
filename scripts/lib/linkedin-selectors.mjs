/**
 * LinkedIn edit-UI selectors and navigation, isolated so UI changes are a
 * one-file fix.
 *
 * ⚠️ VALIDATION REQUIRED: these locators are resilient (role/aria/label/text)
 * but LinkedIn's edit DOM is private and changes. Validate/adjust them with a
 * supervised `--dry-run` run on your own machine (screenshots land in
 * .linkedin/preview/) before trusting `--apply`. The secondary-language flow
 * in particular is best-effort and must be confirmed live.
 */

const BASE = "https://www.linkedin.com";

export function profileUrl(vanity, lang) {
  // Secondary-language versions are addressed with `?locale=xx-YY` (hyphen,
  // not underscore — validated live 2026-07-23). On that view the edit pencil
  // links carry `language=xx&country=YY`, so clicking them edits that
  // language version. The primary needs no parameter.
  const q = lang ? `?locale=${encodeURIComponent(lang)}` : "";
  return `${BASE}/in/${vanity}/${q}`;
}

// Locators are returned as functions of `page` so they are lazy and reusable.
// Validated live on 2026-07-23 (see .linkedin debug probes): the old
// global-nav classes are gone and the edit pencils are <a> elements, not
// <button>s — the hrefs are the stable hook.
export const selectors = {
  // Signal that we are logged in: the global-nav "Me" menu button.
  loggedIn: (page) => page.getByRole("button", { name: /^me$/i }).first(),

  // Top-card edit pencil: an <a> to /edit/intro/ (opens the intro modal).
  editIntroButton: (page) =>
    page.locator('a[href*="/edit/intro"], a[aria-label="Edit profile" i]').first(),
  // The headline editor is a contenteditable div[role=textbox] that only
  // hydrates once scrolled into view — scroll to the anchor (its char counter,
  // the only stable id in the modal) before locating it. Beware: an id probe
  // like [id*="headline"] matches the COUNTER, not the field.
  headlineAnchor: (page) => page.locator("#headlineCounterRefIntroForm").first(),
  headlineField: (page) =>
    page.locator('[role="textbox"][contenteditable="true"]').first(),

  // About edit pencil: an <a> to /edit/forms/summary/ (opens the About modal).
  editAboutButton: (page) =>
    page.locator('a[href*="edit/forms/summary"], a[aria-label="Edit about" i]').first(),
  // The About modal's editor is a bare contenteditable DIV (no id, no
  // aria-label — probed live). It's the only contenteditable on the page while
  // the modal is open; textarea kept as a fallback.
  aboutField: (page) =>
    page
      .locator('[contenteditable="true"]')
      .or(page.locator('div[role="dialog"] textarea'))
      .first(),

  // Save button inside any edit modal.
  saveButton: (page) => page.getByRole("button", { name: /^save$/i }).first(),
  dialog: (page) => page.locator('div[role="dialog"]').first(),

  // Secondary-language: inside the intro edit modal LinkedIn offers a
  // "profile language" / "add profile in another language" control. This is the
  // uncertain part — confirm the exact control name during live validation.
  profileLanguageControl: (page) =>
    page.getByRole("button", { name: /(profile in another language|add locale|edit.*language)/i }).first(),
};

// Replace a field's value: focus, select-all, delete, type new (humanized).
// Types through the keyboard (LinkedIn's custom editors ignore fill()) and
// reads the value back — a mismatch throws instead of silently saving nothing.
export async function setFieldValue(page, locatorFn, value) {
  const field = locatorFn(page);
  await field.scrollIntoViewIfNeeded().catch(() => {});
  await field.waitFor({ state: "visible", timeout: 15000 });
  await field.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Delete");
  // insertText (IME-style input) instead of per-key typing: survives unicode
  // like "→"/"·" that keystroke simulation drops, and is instant. But it also
  // swallows \n in contenteditable — send those as real Enter presses.
  const lines = value.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    if (i) await page.keyboard.press("Enter");
    if (lines[i]) await page.keyboard.insertText(lines[i]);
  }
  // Block boundaries come back as newlines in innerText (textContent drops
  // them entirely), so read innerText and compare whitespace-insensitively.
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const got = await field.evaluate((e) => (e.value ?? e.innerText ?? e.textContent ?? "").trim());
  if (norm(got) !== norm(value)) {
    throw new Error(`field verify failed: editor holds ${got.length} chars, expected ${value.trim().length}`);
  }
}

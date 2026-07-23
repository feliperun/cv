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
  // The `?lang=` hint is best-effort; the reliable secondary-language switch is
  // done through the edit UI (see openSecondaryLanguage). Kept for navigation.
  const q = lang ? `?lang=${encodeURIComponent(lang)}` : "";
  return `${BASE}/in/${vanity}/${q}`;
}

// Locators are returned as functions of `page` so they are lazy and reusable.
export const selectors = {
  // Signal that we are logged in (global nav "Me" menu / feed identity).
  loggedIn: (page) => page.locator('img.global-nav__me-photo, [data-control-name="identity_welcome_message"]').first(),

  // "Edit intro" pencil on the profile top card (opens headline modal).
  editIntroButton: (page) => page.getByRole("button", { name: /edit intro/i }).first(),
  headlineField: (page) => page.getByLabel(/^headline$/i).first(),

  // "Edit about" pencil on the About section.
  editAboutButton: (page) => page.getByRole("button", { name: /edit about/i }).first(),
  // The About modal exposes a large rich-text/textarea; match by label then fallback.
  aboutField: (page) =>
    page
      .getByLabel(/^about$/i)
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
export async function setFieldValue(page, locatorFn, value) {
  const field = locatorFn(page);
  await field.waitFor({ state: "visible", timeout: 15000 });
  await field.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Delete");
  await field.fill(value); // fill() is atomic; humanize still applies at browser level
}

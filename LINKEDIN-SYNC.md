# LinkedIn profile sync

Keeps the LinkedIn profile in sync with the resume Markdown. When `README.md`
(EN) or `README.pt-BR.md` (PT) changes, a self-hosted runner drives a stealth
browser (CloakBrowser) to update the profile — English on the primary profile,
Portuguese on the secondary-language profile.

> ⚠️ **This automates LinkedIn, which violates its User Agreement.** Account
> restriction/ban is a real risk. Everything defaults to **dry-run**; only
> `--apply` writes. Use at your own risk.

## Pieces

| File | Role |
| --- | --- |
| `scripts/lib/parse-resume.js` | Shared Markdown structure parser (also used by the HTML generator). |
| `scripts/linkedin-content.js` | Maps the resume to LinkedIn fields `{headline, about, positions}` (EN/PT), enforcing length limits. No secrets, no network. |
| `scripts/linkedin-login.mjs` | One-time local session capture (`li_at` + `JSESSIONID`). |
| `scripts/lib/linkedin-selectors.mjs` | LinkedIn edit-UI selectors (isolated — **needs live validation**). |
| `scripts/linkedin-sync.mjs` | Orchestrator: diff vs snapshot → edit changed fields. Dry-run by default. |
| `.github/workflows/linkedin-sync.yml` | Self-hosted runner, `linkedin` environment (required reviewer). |
| `.linkedin/last-synced.{en,pt}.json` | Idempotency snapshot (committed; only changed fields are re-pushed). |

## Setup (once)

1. **Capture a session** on the Mac (headed):
   ```bash
   npm install
   npm run linkedin:login   # log in + 2FA in the window; prints li_at / JSESSIONID
   ```

2. **Create the `linkedin` Environment** with a required reviewer:
   repo → Settings → Environments → New environment `linkedin` → add yourself as a
   required reviewer, and restrict deployment branches to `main`.

3. **Add the secrets** (Environment `linkedin`):
   ```bash
   gh secret set LINKEDIN_LI_AT --env linkedin --repo feliperun/cv --body '<value>'
   gh secret set LINKEDIN_JSESSIONID --env linkedin --repo feliperun/cv --body '<value>'
   # optional Pro binary:
   gh secret set CLOAKBROWSER_LICENSE_KEY --env linkedin --repo feliperun/cv --body '<key>'
   # profile vanity (defaults to felipebroering):
   gh variable set LINKEDIN_VANITY --repo feliperun/cv --body 'felipebroering'
   ```

4. **Register the self-hosted runner** on the Mac server with labels
   `self-hosted, macOS`. Run it inside an **interactive GUI login session** (not a
   background daemon) so headed Chromium can open. (repo → Settings → Actions → Runners.)

5. **Harden fork PRs**: repo → Settings → Actions → General →
   "Require approval for all outside collaborators".

## Validate selectors (important)

The LinkedIn edit DOM is private and changes; the selectors in
`scripts/lib/linkedin-selectors.mjs` must be confirmed once, live, on the Mac:

```bash
npm run linkedin:sync            # dry-run: opens modals, screenshots to .linkedin/preview/, no writes
```

Inspect `.linkedin/preview/*.png`. If a modal didn't open or a field wasn't found
(logged as `selector-miss`), fix the locators in `linkedin-selectors.mjs` and
re-run. When headline + About look right:

```bash
npm run linkedin:sync -- --apply --only headline --lang en   # smallest real edit
```

Confirm on your profile, then allow the full sync.

## Ongoing

- Push a change to `README.md` / `README.pt-BR.md` → the workflow runs and
  **pauses for your approval** (environment reviewer) before applying.
- Manual run: Actions → "Sync LinkedIn profile" → Run workflow → `dry-run`/`apply`.
- **Session expired?** The sync fails with a "session stale / checkpoint" message —
  re-run `npm run linkedin:login` and update the two secrets.

## Not done yet / limits

- **Experience (positions)** editing is not automated (planned): only `headline`
  and `about` are synced today. Position matching (title+company) is the fragile
  part.
- **Secondary-language (PT)** editing needs live validation of LinkedIn's locale
  switch (screenshots only until confirmed).
- CloakBrowser reduces bot detection but does not eliminate ToS/account risk.

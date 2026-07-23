# LinkedIn profile sync

Keeps the LinkedIn profile in sync with the resume Markdown. When `README.md`
(EN) or `README.pt-BR.md` (PT) changes, a self-hosted runner drives a stealth
browser (CloakBrowser) to update the profile — English on the primary profile,
Portuguese on the secondary-language profile.

> ⚠️ **This automates LinkedIn, which violates its User Agreement.** Account
> restriction/ban is a real risk. Everything defaults to **dry-run**; only
> `--apply` writes. Use at your own risk.

## Where things live (two repos)

The runner + secrets + workflow live in a **separate private repo**
(`feliperun/cv-linkedin-sync`), never in this public repo — a self-hosted runner
on a public repo lets fork PRs run code on your machine (RCE). A private repo
can't be forked by outsiders, so that vector is gone.

- **This public repo (`feliperun/cv`)** — the resume content + the sync *scripts*.
  No secrets, no workflow, no runner. Source of truth.
- **Private repo (`feliperun/cv-linkedin-sync`)** — a scheduled workflow that
  checks out this repo, runs its scripts, and holds the LinkedIn secrets, the
  self-hosted runner, and the idempotency snapshot. A cheap `--detect` job gates
  the protected `linkedin` environment, so the reviewer prompt only fires on a
  real change.

## Pieces (this repo)

| File | Role |
| --- | --- |
| `scripts/lib/parse-resume.js` | Shared Markdown structure parser (also used by the HTML generator). |
| `scripts/linkedin-content.js` | Maps the resume to LinkedIn fields `{headline, about, positions}` (EN/PT), enforcing length limits. No secrets, no network. |
| `scripts/linkedin-login.mjs` | One-time local session capture (`li_at` + `JSESSIONID`). |
| `scripts/lib/linkedin-selectors.mjs` | LinkedIn edit-UI selectors (isolated — **needs live validation**). |
| `scripts/linkedin-sync.mjs` | Orchestrator: `--detect` / dry-run / `--apply`; diff vs snapshot → edit changed fields. |

Snapshot (`last-synced.{en,pt}.json`) and the workflow live in the private repo.

## Setup (once)

1. **Capture a session** on the Mac (headed), from this repo:
   ```bash
   npm install
   npm run linkedin:login   # log in + 2FA in the window; prints li_at / JSESSIONID
   ```

2. **Create the private repo** `feliperun/cv-linkedin-sync` with the workflow +
   a `linkedin` Environment (required reviewer, restricted to `main`), the two
   secrets (`LINKEDIN_LI_AT`, `LINKEDIN_JSESSIONID`), and `LINKEDIN_VANITY` var.
   (This is scaffolded for you — see that repo's README.)

3. **Register the self-hosted runner on the PRIVATE repo** (`cv-linkedin-sync` →
   Settings → Actions → Runners), labels `self-hosted, macOS`. Run it in an
   **interactive GUI login session** (not a background daemon) so headed Chromium
   can open.

## Validate selectors (important)

The LinkedIn edit DOM is private and changes; the selectors in
`scripts/lib/linkedin-selectors.mjs` must be confirmed once, live, on the Mac —
run this from a checkout of THIS repo with the captured session:

```bash
npm run linkedin:sync            # dry-run: opens modals, screenshots to .linkedin/preview/, no writes
```

Inspect `.linkedin/preview/*.png`. If a modal didn't open or a field wasn't found
(logged as `selector-miss`), fix the locators in `linkedin-selectors.mjs`, commit,
and re-run. When headline + About look right:

```bash
npm run linkedin:sync -- --apply --only headline --lang en   # smallest real edit
```

Confirm on your profile, then let the scheduled workflow take over.

## Ongoing

- The private repo polls this repo (~every 15 min). On a real content change it
  runs and **pauses for your approval** (environment reviewer) before applying.
- Manual run: private repo → Actions → run the workflow.
- **Session expired?** The sync fails with a "session stale / checkpoint" message —
  re-run `npm run linkedin:login` and update the two secrets in the private repo.

## Not done yet / limits

- **Experience (positions)** editing is not automated (planned): only `headline`
  and `about` are synced today. Position matching (title+company) is the fragile part.
- **Secondary-language (PT)** editing needs live validation of LinkedIn's locale
  switch (screenshots only until confirmed).
- CloakBrowser reduces bot detection but does not eliminate ToS/account risk.

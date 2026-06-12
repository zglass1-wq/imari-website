# Imari Website — Working Guide for Claude

This is a static marketing site for Imari (a private estate in Georgetown, D.C.) deployed on Vercel at `imari.cc`. Most of the site is public; the protected HTML files live in [private/](private/) and sit behind a **server-side password gate** at `/private-info`.

If you're being asked to add a new password-protected page, the rest of this document is the playbook. If you're being asked to change unrelated public content, skip to "Repo orientation" at the bottom.

> **For page content/structure** (the three page types — Specific Offer, Landing, Collateral — and which sections each one uses), see [PAGES.md](PAGES.md). Starter templates for each type live in [templates/](templates/) and are excluded from deploys via [.vercelignore](.vercelignore). This file (`CLAUDE.md`) owns the auth/middleware/rewrite playbook; `PAGES.md` owns what goes on the page.

---

## Where files live

- **Public files** sit at the repo root: `imari-website.html` (homepage), `private-info.html` (the gate), `private-access.html` (legacy redirect stub).
- **Protected files** sit in [private/](private/): `corporate.html` plus the personalized/event landing pages. The full URL ⇄ file ⇄ role mapping (and which pages are Astro-built vs. legacy hand-authored) lives in the [Currently protected paths](#currently-protected-paths) table near the bottom. New and migrated pages are built from Astro sources in `astro-src/`; the remaining legacy pages are hand-authored HTML pending migration. Both serve identically.

The public URL is *not* the file path. Each protected file is mapped to a clean top-level URL via a rewrite in [vercel.json](vercel.json) — `/corporate.html` serves `/private/corporate.html`, and so on. The middleware sees and matches the **public URL** (the original request path before the rewrite), so `matcher` entries and `ROLE_ALLOWS` rules always use the public path (e.g. `/corporate.html`), never `/private/corporate.html`.

---

## How the auth actually works

This is **real protection**, not the client-side gate the site used to have. The protected HTML is never sent to unauthenticated browsers — View Source on `/corporate.html` from a logged-out browser shows only a redirect.

The mechanism:

1. **User visits `/private-info`** ([private-info.html](private-info.html)) — a public page with a single password field.
2. **User enters a code, JS POSTs it to `/api/login`** ([api/login.js](api/login.js)) — an Edge Function. It compares the submitted password against role-specific env vars (`IMARI_CORPORATE_PASSWORD`, `IMARI_FREEDOM250_PASSWORD`, etc.). On match, it issues an `HttpOnly` cookie named `imari_auth` whose value is `{role}.{hmac-of-role}`, signed with `IMARI_AUTH_SECRET`.
3. **User is redirected to the destination page** (e.g. `/corporate.html`).
4. **Every request to a protected path** triggers [middleware.js](middleware.js), which:
   - Reads the `imari_auth` cookie.
   - Recomputes the HMAC for the embedded role using the secret.
   - If the signature matches **and** the role is allowed to view the requested path → request passes through.
   - Otherwise → 302 redirect to `/private-info.html`.

Cookies expire after 12 hours. To force-invalidate all sessions, rotate `IMARI_AUTH_SECRET` and redeploy.

**Passwords live only in Vercel environment variables.** They never appear in committed code or in HTML sent to browsers.

---

## Authoring & launching a private page (Astro) — the canonical workflow

Private pages are **authored in Astro** (`astro-src/`) and compiled to plain static `.html` committed into [private/](private/). **Production never runs Astro** — Vercel serves the committed `.html` exactly as before (no root `package.json`, no build command in `vercel.json`). Editing a page means editing its `.astro` source and running the build; the regenerated `.html` is what you commit and what ships.

> This **supersedes the old "hand-author an HTML file in `private/`" process.** Legacy hand-authored pages still work and still serve; new and migrated pages go through Astro. The gate steps (rewrite, matcher, role, env var) are unchanged. See [imari-private-pages-astro-design.md](imari-private-pages-astro-design.md) for the full design (Approach A1).

Naming: pick a short slug, e.g. `aba`, `july4v2`, `smith-wedding`. The slug is used identically across the page file (`astro-src/src/pages/<slug>.astro`), the build output (`private/<slug>.html`), and all three gate entries.

### Templates — the fastest start (§7b)

Don't author from a blank file — **copy the matching template** from [`astro-src/src/templates/`](astro-src/src/templates/). Each is a complete, verified working example of its page-type with the **canonical (converged) look** baked in (via `<CanonicalStyles />`); you edit it down to the new page. Templates live in `src/templates/` and are **never built or gated** — only `src/pages/` is routed, and they're `_`-prefixed as a second guard — so a template never emits a `private/*.html`.

| Template | Use it for | Sections it demonstrates |
|---|---|---|
| `_template_landing` | a general estate landing page | hero (image) · intro · gallery · use-cases · suites · services table · advisor strip · inquiry |
| `_template_collateral` | a use-case / pitch page ("who it's for, how it's used") | hero (image) · intro · use-cases · estate statement · gallery · estate details · agenda · inquiry |
| `_template_specific_offering` | a dated event with a multi-part program | hero (bg) · weekend / day-cards · estate statement · gallery · estate details · offering table · closing |

**Trigger-phrase mapping** — when the instruction is *"create a new ___ page for X with these specifics"*:
- *"landing page"* → copy `_template_landing`
- *"collateral"* (a use-case / pitch) → copy `_template_collateral`
- a **dated event / offering** (e.g. "a July 4th weekend page", "an offering for the X conference") → copy `_template_specific_offering`

Then the workflow is: **copy → edit the content down → run the template's leftover-content checklist (the comment block at the top of the file) → build → gate → verify.** Step 1 below is therefore "edit the copied template," not "write from scratch." (Authoring from scratch is still fine — the section list below is the full menu — but a template guarantees the right sections, order, and canonical styling.)

### Step 1 — Author the page (Astro source)

Either copy a template (above) — recommended — or create `astro-src/src/pages/<slug>.astro` from scratch as a **section list**: import the layout and the sections you want, in order, passing content as props (real prop names below):

```astro
---
import PrivatePageLayout from '../layouts/PrivatePageLayout.astro';
import Hero from '../components/Hero.astro';
import WeekendSection from '../components/WeekendSection.astro';
import Gallery from '../components/Gallery.astro';
import EstateStatement from '../components/EstateStatement.astro';
import EstateDetails from '../components/EstateDetails.astro';
import OfferingTable from '../components/OfferingTable.astro';
import ClosingInquire from '../components/ClosingInquire.astro';
---
<PrivatePageLayout
  title="..."
  ogTitle="..."
  ogDescription="..."
  ogUrl="https://imari.cc/<slug>.html"
>
  <Hero title="..." paragraph="..." bgImage="..." stats={[ { num: '...', label: '...' } ]} />
  <WeekendSection title="..." paragraph="..." days={[ { label: '...', title: '...', description: '...', image: '...', alt: '...', meta: '...' } ]} />
  <Gallery />          {/* omit for a no-gallery page; pass galleries={...} / keys={[...]} to override */}
  <EstateStatement />  {/* shared default; override eyebrow/statement only if the page must differ */}
  <EstateDetails />    {/* shared default; pass property={[...]} / services={[...]} to override (e.g. corporate, newdam1) */}
  <OfferingTable body="..." rows={[ { key: '...', value: '...' } ]} />
  <ClosingInquire />   {/* shared contact band; override fields only if needed */}
</PrivatePageLayout>
```

Include only the sections the page needs, in any order (§6, slot-based — there is no `sections` array / renderer). Stable sections (`<Gallery />`, `<EstateDetails />`, `<EstateStatement />`, `<ClosingInquire />`) render shared defaults with no props — the defaults live in `astro-src/src/data/galleries.ts` and `astro-src/src/data/estate.ts`. Per-event sections (`Hero`, `WeekendSection`/`DayCard`, `OfferingTable`, `IntroStrip`, `UseCase`, `Agenda`, `Suites`, `ServicesTable`, `AdvisorStrip`, `InquirySection`) take content every time (§4). Do **not** add client-side gate code — the middleware is the only gate.

> **Known component gap:** `PhotoBand` — the 4-image horizontal band used on `alarm250.html` and `freedom250.html` — is the one live section type with no component yet (it wasn't present in the july4v2 / corporate / newdam ports the kit was built from). It touches none of the three templates. Build it as a prop-driven component **if/when alarm250 or freedom250 are migrated to Astro**, not before.

### Step 2 — Build

From `astro-src/`: `npm run build`. This recompiles **every** page and emits each to `private/<name>.html` (§7a — the all-pages build is correct: a shared-component or `galleries.ts` change *should* touch every page that uses it, and the diff proves it). For quiet iteration on one page, `npm run build:one -- <slug>` emits only that page; `npm run dev` gives a live-reload preview.

> **This is the translation step.** Astro → HTML happens here, at build time, on your machine. Vercel never runs Astro. Editing `.astro` changes nothing live until you rebuild and commit the regenerated `.html`.

> **Expected: sibling CSS re-chunk churn.** Because CSS is inlined per page (`build.inlineStylesheets: 'always'`), Astro groups shared component CSS into chunks by *which set of pages share them* — so adding or changing one page can reorder/re-split the **inlined `<style>` blocks of other pages** that share components, even when you didn't touch them. This is **expected and safe**: each page is fully self-contained (no external CSS), and the churn is cosmetic — the CSS *rules* and the page's render are identical, only the `<style>`-block partitioning moves. **Policy: commit the churned sibling pages as-is** (don't revert them to keep a diff "clean"). Reverting is a manual per-build step that depends on re-proving each sibling diff is cosmetic every time, and the failure mode (accidentally reverting a sibling that genuinely changed) is worse than a noisy diff. Add a one-line note to the commit/PR when it happens, e.g. *"also re-chunks N sibling pages' inlined CSS (cosmetic, identical render)."*

### Step 3 — Wire the gate (three additive edits — never remove/modify existing entries)

- **[vercel.json](vercel.json)** — add a rewrite: `{ "source": "/<slug>.html", "destination": "/private/<slug>.html" }`
- **[middleware.js](middleware.js)** — add `/<slug>.html` to the `matcher`, and to `ROLE_ALLOWS`: `<slug>: (p) => p === '/<slug>.html' || p.startsWith('/<slug>-'),`
- **[api/login.js](api/login.js)** — add to `ROLES`: `{ role: '<slug>', envVar: 'IMARI_<SLUG>_PASSWORD', redirect: '/<slug>.html' },`

Roles don't overlap — a page's code unlocks only that page (and its `/<slug>-*` sub-pages).

### Step 4 — Set the access code in Vercel

Add env var `IMARI_<SLUG>_PASSWORD` = the code to share, in **both Production and Preview**, then **redeploy** (Edge functions read env vars at deploy time). Until set, `/<slug>.html` correctly bounces to `/private-info`.

### Step 5 — Verify behind the gate

In an incognito window, enter the code and confirm the page renders and behaves
correctly. For a **ported** page, compare against the original until
indistinguishable — that's the real acceptance test.

Because these pages commit straight to `main` (Step 6), there's no preview branch
to verify on first. Verify **before** committing using the local build: serve the
built `private/<slug>.html` (it's fully self-contained, CSS inlined) and confirm
every section renders, all images resolve, and no template/leftover content
remains. The one thing a local file can't exercise is the gate itself (middleware
runs only on Vercel), so do the incognito gate check immediately **after** the
push deploys: visit `/<slug>.html` logged-out → bounces to `/private-info`; enter
the code → lands on the page.

### Step 6 — Commit to `main` (single commit, no branch, no PR)

Private pages are low-blast-radius (gated, single-file, built from a verified
template) and nothing references a new page until its Vercel password is set.
**Commit directly to `main` as one commit** — no feature branch, no PR. This
matches the existing-password flow below and keeps page launches fast.

The single commit includes the new `.astro` source, the rebuilt
`private/<slug>.html` (**plus any other `private/*.html` that changed** if you
touched a shared component), and the three gate edits. Vercel auto-deploys from
`main`; the push is the launch.

> **The guardrail is the pre-commit build + verify (Step 5), not a branch.** On
> `main` there is no second look, so the green local build and the section/leftover
> verification are mandatory before you commit. Skipping them is the only real risk
> this convention carries.

> **One exception:** if a change touches the **shared gate or auth** files in a
> non-additive way (rewriting `middleware.js` logic, `api/login.js`, the auth
> cookie/secret handling) rather than just adding the three standard per-page
> entries, put *that* on a branch + PR — those files affect every page, not just
> the new one. A normal new-page commit (additive gate entries only) goes straight
> to `main`.

### What you give the client

The URL `https://imari.cc/<slug>.html` plus the access code. A travel agent can forward the code to their client directly — the reason codes are kept over magic links.

---

## Adding a new page that uses an EXISTING password

Use this when you want a new page (e.g. `corporate-pricing.html`) accessible to people who already have the corporate code.

### Step 1 — Add the path to the middleware matcher

Edit [middleware.js](middleware.js). The `matcher` array is an explicit list of paths the middleware runs on. Add the new file:

```js
export const config = {
  matcher: [
    '/corporate.html',
    '/corporate-pricing.html',   // ← new line
    '/alarm250.html',
    '/freedom250.html',
    '/alex0349.html',
    '/july4.html',
  ],
};
```

You do **not** need to edit `ROLE_ALLOWS` for this case — the `corporate` role's rule already grants access to anything starting with `/corporate-`.

### Step 2 — Author the page in Astro and build

Create `astro-src/src/pages/corporate-pricing.astro` (see "Authoring & launching a private page" above for the section-list pattern) and run `npm run build` from `astro-src/`, which emits `private/corporate-pricing.html`. Name it with the correct role prefix: `corporate-*` for corporate content. **The prefix is what grants access** — a slug like `pricing-corporate` would NOT be unlocked by the corporate code. The build output contains **no client-side gate code** — the middleware is the only gate.

### Step 3 — Add a rewrite in `vercel.json`

Edit [vercel.json](vercel.json) so the public URL serves the file from `private/`:

```json
{ "source": "/corporate-pricing.html", "destination": "/private/corporate-pricing.html" }
```

Without this rewrite the public URL 404s.

### Step 4 — Commit, push, deploy

```bash
git add astro-src/src/pages/corporate-pricing.astro private/corporate-pricing.html middleware.js vercel.json
git commit -m "Add corporate pricing page"
git push
```

Vercel auto-deploys from `main`. Wait ~30–60s, then test in an incognito window:

1. Visit the new page directly without logging in → should redirect to `/private-info`.
2. Enter the corporate code → should land on the corporate page.
3. Navigate to the new page from there → should load.

---

## Adding a new SECTION with its own password (a new role)

Use this when you need a separate access tier — e.g. a `vendors` section that the agents code should NOT unlock.

### Step 1 — Add a new env var in Vercel

In **Vercel → Project Settings → Environment Variables**, add for both Production and Preview environments:

| Name | Value |
|---|---|
| `IMARI_VENDORS_PASSWORD` | Whatever password you want the vendors to use. |

(Replace `VENDORS` with your role name in SCREAMING_SNAKE_CASE.)

### Step 2 — Register the role in `api/login.js`

Edit [api/login.js](api/login.js) and add an entry to the `ROLES` array:

```js
const ROLES = [
  { role: 'corporate', envVar: 'IMARI_CORPORATE_PASSWORD', redirect: '/corporate.html' },
  { role: 'vendors',   envVar: 'IMARI_VENDORS_PASSWORD',   redirect: '/vendors.html' },  // ← new
];
```

The `redirect` is where the user lands after entering the password — the role's main landing page.

### Step 3 — Grant the role access to its paths in `middleware.js`

Edit [middleware.js](middleware.js). Two edits:

**a)** Add an entry to `ROLE_ALLOWS`:

```js
const ROLE_ALLOWS = {
  corporate: (p) => p === '/corporate.html' || p.startsWith('/corporate-'),
  vendors:   (p) => p === '/vendors.html'   || p.startsWith('/vendors-'),   // ← new
};
```

**b)** Add the role's landing page (and any sub-pages) to the `matcher`:

```js
matcher: [
  // ... existing entries
  '/vendors.html',
],
```

### Step 4 — Author the page(s) in Astro and build

Create `astro-src/src/pages/vendors.astro` (and any `astro-src/src/pages/vendors-*.astro`), then run `npm run build` from `astro-src/` to emit `private/vendors.html` (and `private/vendors-*.html`). The slug must start with the role prefix (`vendors`, `vendors-*`). No client-side gate code — the middleware is the only gate.

### Step 5 — Add rewrites in `vercel.json`

Map each public URL to the file inside `private/`:

```json
{ "source": "/vendors.html", "destination": "/private/vendors.html" }
```

### Step 6 — Update the README

Add the new env var to the table in [README.md](README.md) so the list of required env vars stays accurate.

### Step 7 — Commit, push, deploy

```bash
git add astro-src/src/pages/vendors.astro private/vendors.html middleware.js api/login.js vercel.json README.md
git commit -m "Add vendors private section"
git push
```

Wait for Vercel deploy. Then in an incognito window: test that the new password lands on the new page, and that the OLD codes (agents, corporate) do NOT unlock the new page (they should redirect back to `/private-info`).

---

## Rotating passwords

### Rotating a single role's password

Use this when a code has leaked, or when you want to cycle codes on a schedule. Existing logged-in users with the old code stay logged in until their cookie expires (12h max) — they only need the new code on next login.

1. **Vercel → Project Settings → Environment Variables.** Edit the relevant `IMARI_<ROLE>_PASSWORD` (e.g. `IMARI_CORPORATE_PASSWORD`) and save the new value.
2. **Redeploy.** Vercel doesn't hot-reload env vars into Edge Functions. Either click "Redeploy" on the latest deployment, or push any commit to `main`.
3. **Share the new code** with the people who need it.
4. **Verify** in an incognito window: old code → "Incorrect access code"; new code → lands on the role's page.

### Force-logging-out every active session

Use this when a code has been **seriously compromised** (e.g. shared publicly, leaked to the wrong party), or when you want a hard cutoff for everyone with any active session. This invalidates every `imari_auth` cookie everywhere, immediately — users mid-browsing will be bounced to `/private-info` on their next request.

1. **Generate a new secret:** `openssl rand -hex 32`
2. **Vercel → Project Settings → Environment Variables.** Replace `IMARI_AUTH_SECRET` with the new value.
3. **Optionally also rotate the leaked role's password** in the same step (most common case).
4. **Redeploy.**
5. **Verify** in an incognito window AND in a browser that had an active session — both should be bounced to `/private-info`.

Note: rotating `IMARI_AUTH_SECRET` does **not** require any code change. The middleware and login API both read it dynamically.

---

## Server-side view analytics

Client-side Vercel Web Analytics runs on every page, but ad-blockers eat it — so gated-page accesses are *also* counted **server-side**, where nothing client can block them. This is the unblockable "true floor"; the client-side numbers stay as the nicer segmentation for non-blocking visitors. **No npm package, no root `package.json`** — the static-no-build architecture is preserved (it's plain `fetch` to Upstash's REST API from the Edge).

**Where the view is recorded — and why there:** in [api/login.js](api/login.js), at the **code-resolution step** — the moment a valid code matches a content role and resolves to a destination page. It is **not** recorded on raw `/private-info.html` hits. Because every shared link points at `/private-info` (the code does the routing), link-preview bots (Slackbot, iMessage, etc.) unfurl that URL but never submit a valid code — so they never reach the recording point and **wash out with no user-agent denylist**. A recorded "view" therefore means "a code unlocked this page," not "a raw page load" (refreshes/return-visits within the 12h cookie aren't re-counted). The write is backgrounded via `context.waitUntil`, **no-ops silently if the Redis env vars are unset**, and swallows network errors — analytics can never break login. The `stats` role is the readout itself and is excluded from counting.

**Data model (Upstash Redis, full history — no cap):**
- `imari:count:<role>` — lifetime counter per page (`INCR`).
- `imari:daily:<role>:<YYYY-MM-DD>` — per-day counter (UTC) so "this week" is answerable.
- `imari:events:<role>` and `imari:events:all` — full per-page and global logs (`LPUSH`, no `LTRIM`); each entry is `{ ts, role, path, country, region, city, ref }` (geo from Vercel's `x-vercel-ip-*` headers).

**The readout:** [api/stats.js](api/stats.js) is a gated Edge function returning per-page totals, a last-7-days breakdown, and the recent 100 events as JSON. It is **its own gate** — `/api/*` isn't behind the middleware matcher, so it re-checks the `imari_auth` cookie for the `stats` role (same HMAC check as the middleware) and 401s otherwise. [private/stats.html](private/stats.html) is a minimal hand-authored page (no Astro, no client analytics — it's an internal tool) that fetches it. Gated like any page: `stats` role, `/stats.html` matcher + `ROLE_ALLOWS` entry, `vercel.json` rewrite, `IMARI_STATS_PASSWORD`.

**Credentials** come from the **Vercel Storage → Redis (Upstash) integration** (attach it to *both* Production and Preview). The code resolves them from `KV_REST_API_URL`/`KV_REST_API_TOKEN` (what the integration currently injects), or `UPSTASH_REDIS_REST_URL`/`_TOKEN`, or a manual `IMARI_ANALYTICS_REST_URL`/`_TOKEN` fallback. Ignore `KV_URL` / `REDIS_URL` — those are `redis://` strings, not fetch-usable from the Edge. **Heads-up:** the integration provisions a single store shared by Preview and Production, so preview-testing accesses land in the same counts as production — flush the `imari:*` keys in the Upstash console if you need clean live numbers.

---

## Gotchas

- **Always redeploy after changing env vars in Vercel.** Vercel doesn't hot-reload env vars into Edge functions. Either trigger a manual redeploy or push any commit.
- **File naming dictates access.** A page named `corporate-something.html` is unlocked by the corporate code via the prefix rule in `ROLE_ALLOWS`. A page named `something-corporate.html` is NOT — the prefix check fails.
- **Don't reuse role names across the system.** Each `role` string in the `ROLES` array must be unique.
- **The `matcher` is an explicit list, not a wildcard.** Even though `ROLE_ALLOWS` uses prefixes, the middleware only runs on paths in the `matcher`. New pages must be added there.
- **Don't put `<div id="gate">` or password JS back into the HTML.** That was the old client-side gate which exposed both passwords and content. The middleware is the only gate now.
- **Test in incognito.** Existing cookies in your normal browser can mask bugs. After changes, always do at least one test from a fresh incognito session.
- **Don't commit `.env` files.** Passwords live in Vercel env vars only. There is no local `.env` file in this repo.
- **Protected files live in `private/`, but middleware/matcher paths do not.** Every entry in `matcher` and every key/prefix in `ROLE_ALLOWS` references the public URL (`/corporate.html`), not the file path on disk (`/private/corporate.html`). The `vercel.json` rewrite is what bridges the two.
- **Every new protected page needs a rewrite.** Without an entry in `vercel.json`, the public URL 404s even though the file exists under `private/`.

---

## Quick reference

### Critical files

| File | Role |
|---|---|
| [middleware.js](middleware.js) | Edge middleware. Gates protected routes. Defines the `matcher` (which paths it runs on) and `ROLE_ALLOWS` (which role can see which path). |
| [api/login.js](api/login.js) | Edge Function. Validates submitted password against env vars, sets the signed auth cookie. Defines the `ROLES` array. |
| [api/logout.js](api/logout.js) | Edge Function. Clears the auth cookie. |
| [api/stats.js](api/stats.js) | Edge Function. Gated JSON readout of server-side view analytics (self-checks the `stats`-role cookie). See "Server-side view analytics". |
| [private-info.html](private-info.html) | The unified public gate. One password field. |
| [private-access.html](private-access.html) | Redirect stub pointing at `private-info.html` (kept for backward compatibility with shared links). |
| [private/](private/) | Folder holding every protected HTML file. Served at clean top-level URLs via rewrites. |
| [vercel.json](vercel.json) | Vercel config: root rewrite to `imari-website.html`, clean URL for `/private-info`, and one rewrite per file in `private/`. |
| [README.md](README.md) | Repo orientation + env var reference. |

### Currently protected paths

Public URL → file (every protected file lives in [private/](private/) and is exposed via a rewrite in `vercel.json`):

| Public URL | File | Unlocked by role | Authoring |
|---|---|---|---|
| `/corporate.html` | `private/corporate.html` | `corporate` | legacy (hand-authored) |
| `/alarm250.html` | `private/alarm250.html` | `alarm250` | legacy (no gallery) |
| `/freedom250.html` | `private/freedom250.html` | `freedom250` | legacy (no gallery) |
| `/alex0349.html` | `private/alex0349.html` | `alex0349` | legacy |
| `/july4.html` | `private/july4.html` | `july4` | legacy (original; kept while july4v2 is verified) |
| `/july4v2.html` | `private/july4v2.html` | `july4v2` | **Astro** (`astro-src/src/pages/july4v2.astro`) |
| `/gp250corp.html` | `private/gp250corp.html` | `gp250corp` | **Astro** (Grand Prix weekend — client-relationship variant) |
| `/gp250gov.html` | `private/gp250gov.html` | `gp250gov` | **Astro** (Grand Prix weekend — government-affairs variant) |
| `/gp250sponsor.html` | `private/gp250sponsor.html` | `gp250sponsor` | **Astro** (Grand Prix weekend — sponsor variant) |
| `/july4p2.html` | `private/july4p2.html` | `july4p2` | legacy |
| `/newdam1.html` | `private/newdam1.html` | `newdam1` | legacy |
| `/newdamv2.html` | `private/newdamv2.html` | `newdamv2` | **Astro** (newdam landing, v2) |
| `/imaritravel.html` | `private/imaritravel.html` | `imaritravel` | **Astro** (travel-advisor landing) |
| `/imariinvestors.html` | `private/imariinvestors.html` | `imariinvestors` | **Astro** (investor landing — Mounzer's contact info) |
| `/imariinvestord.html` | `private/imariinvestord.html` | `imariinvestord` | **Astro** (investor landing — identical to `imariinvestors` except Darryl's contact info) |
| `/rocktravel.html` | `private/rocktravel.html` | `rocktravel` | **Astro** (newdamv2 landing — eyebrow "prepared for Rock Hopper Travel") |
| `/tag.html` | `private/tag.html` | `tag` | **Astro** (newdamv2 landing — eyebrow "prepared for TAG") |
| `/stfl3.html` | `private/stfl3.html` | `stfl3` | legacy (verbatim duplicate of `newdam1`; gated under `IMARI_SMART_PASSWORD`) |
| `/aba.html` | `private/aba.html` | `aba` | legacy |

> `july4v2` is the Astro-templated rebuild of `july4`; both run in parallel during migration. The three `gp250*` pages are Astro-built audience variants of the **same** Freedom 250 Grand Prix weekend (same structure, day cards, estate/gallery/details, and offering rows; only the audience-facing copy slots differ), each with its own role and password so a code unlocks only its own variant. The remaining legacy pages are being migrated to Astro one at a time (§7 of the design doc) — until a page's `.astro` source exists, its `private/*.html` is the original hand-authored file and the all-pages build does not touch it.

### Required Vercel env vars

| Variable | Purpose |
|---|---|
| `IMARI_AUTH_SECRET` | Random secret used to sign auth cookies. Generate with `openssl rand -hex 32`. **Never share or commit.** |
| `IMARI_CORPORATE_PASSWORD` | Corporate code. Shared with corporate & institutional partners. |
| `IMARI_ALARM250_PASSWORD` | Alarm.com × UFC Freedom 250 single-prospect page. |
| `IMARI_FREEDOM250_PASSWORD` | Generalized UFC Freedom 250 weekend page for any corporate prospect. |
| `IMARI_ALEX0349_PASSWORD` | Personalized landing page for Alex Endo. |
| `IMARI_JULY4_PASSWORD` | Salute to America 250 weekend landing page (legacy original). |
| `IMARI_JULY4V2_PASSWORD` | Astro-templated rebuild of the July 4 page (`july4v2.html`). |
| `IMARI_GP250CORP_PASSWORD` | Grand Prix weekend, client-relationship variant (`gp250corp.html`). |
| `IMARI_GP250GOV_PASSWORD` | Grand Prix weekend, government-affairs variant (`gp250gov.html`). |
| `IMARI_GP250SPONSOR_PASSWORD` | Grand Prix weekend, sponsor variant (`gp250sponsor.html`). |
| `IMARI_JULY4P2_PASSWORD` | July 4 weekend landing page (variant p2). |
| `IMARI_NEWDAM1_PASSWORD` | `newdam1.html` landing page. |
| `IMARI_NEWDAMV2_PASSWORD` | `newdamv2.html` landing page (Astro; newdam v2). |
| `IMARI_IMARITRAVEL_PASSWORD` | `imaritravel.html` travel-advisor landing page (Astro). |
| `IMARI_IMARIINVESTORS_PASSWORD` | `imariinvestors.html` investor landing page (Astro; Mounzer's contact info). |
| `IMARI_IMARIINVESTORD_PASSWORD` | `imariinvestord.html` investor landing page (Astro; identical to `imariinvestors` except Darryl's contact info). |
| `IMARI_ROCKTRAVEL_PASSWORD` | `rocktravel.html` travel landing page (Astro; newdamv2 with "prepared for Rock Hopper Travel"). |
| `IMARI_TAG_PASSWORD` | `tag.html` travel landing page (Astro; newdamv2 with "prepared for TAG"). |
| `IMARI_SMART_PASSWORD` | `stfl3.html` landing page (SmartFlyer; verbatim duplicate of `newdam1`). **Naming exception:** the role is `stfl3` but the env var is `IMARI_SMART_PASSWORD`, *not* `IMARI_STFL3_PASSWORD`. |
| `IMARI_ABA_PASSWORD` | `aba.html` landing page. |
| `IMARI_<ROLE>_PASSWORD` | One per new role added. |
| `IMARI_STATS_PASSWORD` | Unlocks `/stats.html`, the server-side view-analytics readout. Set by hand. |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis REST creds for view analytics. **Provisioned by the Vercel Storage → Redis integration** (both Production + Preview), not set by hand. See "Server-side view analytics". |

---

## Repo orientation

The **public** pages are plain hand-authored static HTML (`imari-website.html` etc.) — open them in a browser to preview locally. The **private** pages are authored in Astro under `astro-src/` and compiled to static `.html` committed into [private/](private/) (see "Authoring & launching a private page"). **Production still serves committed static HTML with no build step** — there is no root `package.json` and no build command in `vercel.json`, so Vercel never runs Astro. The auth flow (middleware, API, cookies) only works on the deployed Vercel site; you cannot fully test auth locally without `vercel dev`.

Deployment is automatic from the `main` branch of `github.com/zglass1-wq/imari-website`. Pushes trigger a Vercel build.

Public pages: `imari-website.html` (the homepage at `/`), `private-info.html`, `private-access.html` (redirect).
Protected pages: everything inside [private/](private/) — see the table above for the URL ⇄ file mapping.
Assets: `photos/`, `logos/`.

---

## Workflow signaling

When you finish a task and are awaiting my approval, input, or response — before
stopping your turn — run this command to notify me:

```bash
osascript -e 'display notification "Awaiting approval" with title "Claude Code" sound name "Glass"'
```

Do this every time you stop to wait for me, including:
- After completing a step that requires my review
- When you've asked a clarifying question and need an answer
- When you've shown a diff or screenshot and are waiting for approval
- When you've encountered an error that requires my input to resolve

Do not run this command when you're just thinking, processing, or in the middle
of a task — only when you've actually stopped and need me to look.

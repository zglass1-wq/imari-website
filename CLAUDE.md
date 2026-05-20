# Imari Website — Working Guide for Claude

This is a static marketing site for Imari (a private estate in Georgetown, D.C.) deployed on Vercel at `imari.cc`. Most of the site is public; a handful of pages sit behind a **server-side password gate** at `/private-info`.

If you're being asked to add a new password-protected page, the rest of this document is the playbook. If you're being asked to change unrelated public content, skip to "Repo orientation" at the bottom.

---

## How the auth actually works

This is **real protection**, not the client-side gate the site used to have. The protected HTML is never sent to unauthenticated browsers — View Source on `/agents.html` from a logged-out browser shows only a redirect.

The mechanism:

1. **User visits `/private-info`** ([private-info.html](private-info.html)) — a public page with a single password field.
2. **User enters a code, JS POSTs it to `/api/login`** ([api/login.js](api/login.js)) — an Edge Function. It compares the submitted password against role-specific env vars (`IMARI_AGENTS_PASSWORD`, `IMARI_CORPORATE_PASSWORD`, etc.). On match, it issues an `HttpOnly` cookie named `imari_auth` whose value is `{role}.{hmac-of-role}`, signed with `IMARI_AUTH_SECRET`.
3. **User is redirected to the destination page** (e.g. `/agents.html`).
4. **Every request to a protected path** triggers [middleware.js](middleware.js), which:
   - Reads the `imari_auth` cookie.
   - Recomputes the HMAC for the embedded role using the secret.
   - If the signature matches **and** the role is allowed to view the requested path → request passes through.
   - Otherwise → 302 redirect to `/private-info.html`.

Cookies expire after 12 hours. To force-invalidate all sessions, rotate `IMARI_AUTH_SECRET` and redeploy.

**Passwords live only in Vercel environment variables.** They never appear in committed code or in HTML sent to browsers.

---

## Adding a new page that uses an EXISTING password

Use this when you want a new page (e.g. `agents-pricing.html`) accessible to people who already have the agents code.

### Step 1 — Add the path to the middleware matcher

Edit [middleware.js](middleware.js). The `matcher` array is an explicit list of paths the middleware runs on. Add the new file:

```js
export const config = {
  matcher: [
    '/agents.html',
    '/agents-interior-gallery.html',
    '/agents-exterior-gallery.html',
    '/agents-site-plan.html',
    '/agents-pricing.html',   // ← new line
    '/corporate.html',
  ],
};
```

You do **not** need to edit `ROLE_ALLOWS` for this case — the `agents` role's rule already grants access to anything starting with `/agents-`.

### Step 2 — Create the HTML file

Name it with the correct role prefix: `agents-*.html` for agents content, `corporate-*.html` for corporate content. **The prefix is what grants access** — a file named `pricing-agents.html` would NOT be unlocked by the agents code.

Use an existing protected page as a template. The body should start with `<main id="main-content">` and contain **no client-side gate code** — no `<div id="gate">`, no `checkPassword()`, no `sessionStorage` flags. The middleware is the only gate.

### Step 3 — Commit, push, deploy

```bash
git add middleware.js agents-pricing.html
git commit -m "Add agents pricing page"
git push
```

Vercel auto-deploys from `main`. Wait ~30–60s, then test in an incognito window:

1. Visit the new page directly without logging in → should redirect to `/private-info`.
2. Enter the agents code → should land on the agents page.
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
  { role: 'agents',    envVar: 'IMARI_AGENTS_PASSWORD',    redirect: '/agents.html' },
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
  agents:    (p) => p === '/agents.html'    || p.startsWith('/agents-'),
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

### Step 4 — Create the HTML page(s)

Same rules as before: file name must start with the role prefix (`vendors-*.html`), no client-side gate code, body starts at `<main id="main-content">`. Copy an existing protected page as a template.

### Step 5 — Update the README

Add the new env var to the table in [README.md](README.md) so the list of required env vars stays accurate.

### Step 6 — Commit, push, deploy

```bash
git add middleware.js api/login.js vendors.html README.md
git commit -m "Add vendors private section"
git push
```

Wait for Vercel deploy. Then in an incognito window: test that the new password lands on the new page, and that the OLD codes (agents, corporate) do NOT unlock the new page (they should redirect back to `/private-info`).

---

## Rotating passwords

### Rotating a single role's password

Use this when a code has leaked, or when you want to cycle codes on a schedule. Existing logged-in users with the old code stay logged in until their cookie expires (12h max) — they only need the new code on next login.

1. **Vercel → Project Settings → Environment Variables.** Edit the relevant `IMARI_<ROLE>_PASSWORD` (e.g. `IMARI_AGENTS_PASSWORD`) and save the new value.
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

## Gotchas

- **Always redeploy after changing env vars in Vercel.** Vercel doesn't hot-reload env vars into Edge functions. Either trigger a manual redeploy or push any commit.
- **File naming dictates access.** A page named `agents-something.html` is unlocked by the agents code via the prefix rule in `ROLE_ALLOWS`. A page named `something-agents.html` is NOT — the prefix check fails.
- **Don't reuse role names across the system.** Each `role` string in the `ROLES` array must be unique.
- **The `matcher` is an explicit list, not a wildcard.** Even though `ROLE_ALLOWS` uses prefixes, the middleware only runs on paths in the `matcher`. New pages must be added there.
- **Don't put `<div id="gate">` or password JS back into the HTML.** That was the old client-side gate which exposed both passwords and content. The middleware is the only gate now.
- **Test in incognito.** Existing cookies in your normal browser can mask bugs. After changes, always do at least one test from a fresh incognito session.
- **Don't commit `.env` files.** Passwords live in Vercel env vars only. There is no local `.env` file in this repo.

---

## Quick reference

### Critical files

| File | Role |
|---|---|
| [middleware.js](middleware.js) | Edge middleware. Gates protected routes. Defines the `matcher` (which paths it runs on) and `ROLE_ALLOWS` (which role can see which path). |
| [api/login.js](api/login.js) | Edge Function. Validates submitted password against env vars, sets the signed auth cookie. Defines the `ROLES` array. |
| [api/logout.js](api/logout.js) | Edge Function. Clears the auth cookie. |
| [private-info.html](private-info.html) | The unified public gate. One password field. |
| [private-access.html](private-access.html) | Redirect stub pointing at `private-info.html` (kept for backward compatibility with shared links). |
| [vercel.json](vercel.json) | Vercel config: root rewrite to `imari-website.html`, clean URL for `/private-info`. |
| [README.md](README.md) | Repo orientation + env var reference. |

### Currently protected paths

| Path | Unlocked by role |
|---|---|
| `/agents.html` | `agents` |
| `/agents-interior-gallery.html` | `agents` |
| `/agents-exterior-gallery.html` | `agents` |
| `/agents-site-plan.html` | `agents` |
| `/corporate.html` | `corporate` |

### Required Vercel env vars

| Variable | Purpose |
|---|---|
| `IMARI_AUTH_SECRET` | Random secret used to sign auth cookies. Generate with `openssl rand -hex 32`. **Never share or commit.** |
| `IMARI_AGENTS_PASSWORD` | Agents code. Shared with trade & planning partners. |
| `IMARI_CORPORATE_PASSWORD` | Corporate code. Shared with corporate & institutional partners. |
| `IMARI_<ROLE>_PASSWORD` | One per new role added. |

---

## Repo orientation

This is a plain static HTML site — no build step, no framework. Open `imari-website.html` in a browser to preview the public pages locally. The auth flow (middleware, API, cookies) only works on the deployed Vercel site; you cannot fully test auth locally without `vercel dev`.

Deployment is automatic from the `main` branch of `github.com/zglass1-wq/imari-website`. Pushes trigger a Vercel build.

Public pages: `imari-website.html` (the homepage at `/`), `private-info.html`, `private-access.html` (redirect).
Protected pages: see the table above.
Assets: `photos/`, `logos/`.

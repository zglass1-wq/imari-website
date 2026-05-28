# imari-website

Static marketing site for Imari, deployed on Vercel. Two protected sections (`agents`, `corporate`) sit behind a single password gate at `/private-info`.

## Architecture

- **`private-info.html`** — public gate page. One password field. POSTs to `/api/login`.
- **`api/login.js`** — Edge function. Validates the submitted password against the role-specific env vars and sets a signed, HttpOnly cookie (`imari_auth`).
- **`middleware.js`** — Edge middleware. Runs on every request to a protected route, verifies the cookie's HMAC, and only lets the request through if the cookie's role grants access to that path. Otherwise redirects to `/private-info.html`.
- **`api/logout.js`** — clears the cookie.

Protected paths (declared in [middleware.js](middleware.js)):

- `/corporate.html`
- `/alarm250.html`, `/freedom250.html`, `/alex0349.html`, `/july4.html` (personalized one-off landing pages)

The protected HTML files live in [private/](private/) and are served at clean, top-level URLs via rewrites in [vercel.json](vercel.json). Middleware runs on the public URL (e.g. `/corporate.html`) before the rewrite to `/private/corporate.html` is applied.

To add a new private section, add (1) a new entry in `ROLES` in [api/login.js](api/login.js), (2) a matching `ROLE_ALLOWS` rule + matcher in [middleware.js](middleware.js), (3) a new password env var, (4) the HTML file under [private/](private/), and (5) a rewrite in [vercel.json](vercel.json) mapping the public URL to the file in `private/`.

## Required Vercel environment variables

Set these in **Vercel → Project Settings → Environment Variables** (Production + Preview):

| Variable | Purpose |
|---|---|
| `IMARI_AUTH_SECRET` | Random server-side secret used to sign the auth cookie. Generate with `openssl rand -hex 32`. **Never share or commit.** |
| `IMARI_CORPORATE_PASSWORD` | Password that unlocks `corporate.html`. Share with corporate & institutional partners. |
| `IMARI_ALARM250_PASSWORD` | Password that unlocks `alarm250.html`. Single-prospect page for Alarm.com × UFC Freedom 250. |
| `IMARI_FREEDOM250_PASSWORD` | Password that unlocks `freedom250.html`. Generalized UFC Freedom 250 weekend page for any corporate prospect. |
| `IMARI_ALEX0349_PASSWORD` | Password that unlocks `alex0349.html`. Personalized agent page that mirrors the main agents landing; also grants access to the shared `agents-*` galleries. |
| `IMARI_JULY4_PASSWORD` | Password that unlocks `july4.html`. Personalized 4th of July weekend landing page. |
| `IMARI_JULY4P2_PASSWORD` | Password that unlocks `july4p2.html`. Family-tilt variant of the Salute to America 250 weekend page. |

After updating env vars, **redeploy** — Vercel does not hot-reload env vars into Edge functions.

To rotate a password: change the env var, redeploy, and existing logged-in sessions stay valid until their cookie expires (12 hours). To force immediate logout, also rotate `IMARI_AUTH_SECRET` — that invalidates every cookie everywhere.

## Local preview

This is a plain static site. Open `imari-website.html` in a browser to preview the public pages. The gate, middleware, and API only work on the deployed Vercel site (they require the Edge runtime + env vars).

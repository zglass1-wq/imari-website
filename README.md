# imari-website

Static marketing site for Imari, deployed on Vercel. Two protected sections (`agents`, `corporate`) sit behind a single password gate at `/private-info`.

## Architecture

- **`private-info.html`** — public gate page. One password field. POSTs to `/api/login`.
- **`api/login.js`** — Edge function. Validates the submitted password against the role-specific env vars and sets a signed, HttpOnly cookie (`imari_auth`).
- **`middleware.js`** — Edge middleware. Runs on every request to a protected route, verifies the cookie's HMAC, and only lets the request through if the cookie's role grants access to that path. Otherwise redirects to `/private-info.html`.
- **`api/logout.js`** — clears the cookie.

Protected paths (declared in [middleware.js](middleware.js)):

- `/agents.html`, `/agents-*.html`
- `/corporate.html`

To add a new private section, add (1) a new entry in `ROLES` in [api/login.js](api/login.js), (2) a matching `ROLE_ALLOWS` rule + matcher in [middleware.js](middleware.js), and (3) a new password env var.

## Required Vercel environment variables

Set these in **Vercel → Project Settings → Environment Variables** (Production + Preview):

| Variable | Purpose |
|---|---|
| `IMARI_AUTH_SECRET` | Random server-side secret used to sign the auth cookie. Generate with `openssl rand -hex 32`. **Never share or commit.** |
| `IMARI_AGENTS_PASSWORD` | Password that unlocks `agents.html` and its galleries. Share with trade & planning partners. |
| `IMARI_CORPORATE_PASSWORD` | Password that unlocks `corporate.html`. Share with corporate & institutional partners. |
| `IMARI_ALARM250_PASSWORD` | Password that unlocks `alarm250.html`. Single-prospect page for Alarm.com × UFC Freedom 250. |

After updating env vars, **redeploy** — Vercel does not hot-reload env vars into Edge functions.

To rotate a password: change the env var, redeploy, and existing logged-in sessions stay valid until their cookie expires (12 hours). To force immediate logout, also rotate `IMARI_AUTH_SECRET` — that invalidates every cookie everywhere.

## Local preview

This is a plain static site. Open `imari-website.html` in a browser to preview the public pages. The gate, middleware, and API only work on the deployed Vercel site (they require the Edge runtime + env vars).

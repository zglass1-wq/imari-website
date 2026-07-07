// Vercel Edge Function — authorizes a private-page PDF download and hands off
// to the Render print service.
//
// Flow: the download icon on a gated page does `fetch('/api/pdf?page=<slug>')`,
// so the HttpOnly `imari_auth` cookie rides along. This route:
//   1. Verifies the cookie the SAME way middleware.js / api/stats.js do
//      (recompute the role HMAC with IMARI_AUTH_SECRET; constant-time compare).
//   2. Confirms `page` is a known private slug (allowlist — no minting tokens
//      for arbitrary paths).
//   3. Confirms the cookie's role is allowed to see `/<slug>.html` via the same
//      ROLE_ALLOWS predicate the gate uses (authorization parity).
//   4. Checks the cache (credential-free Last-Modified HEAD, 30-day TTL) and
//      returns JSON: `{ mode:'cached', url }` (native Cloudinary fl_attachment
//      download, no render) or `{ mode:'render', url }` (a slug-bound HMAC-token
//      render-service URL the client fetches). A cache-read failure degrades to
//      'render', never to an error.
//
// /api/* is NOT behind the middleware matcher, so this route self-checks the
// cookie (exactly like api/stats.js). It never sees an access code — those live
// only on the render service. Re-gate failures return 401 (distinct from the
// render service's 500 "render broke"); the client uses that to tell "log in
// again" from "rendering failed."

// ROLE_ALLOWS is single-sourced (shared with middleware.js) so the gate and this
// PDF route can never drift out of authorization sync.
import { ROLE_ALLOWS } from '../lib/role-allows.js';

export const config = { runtime: 'edge' };

// Slug allowlist — the private pages the render service knows (mirrors the
// print tool's pages.json). A token can only ever be minted for one of these,
// so an arbitrary or non-private path can never reach the renderer. `stats` is
// intentionally excluded (internal analytics readout, not a renderable page).
const ALLOWED_SLUGS = new Set([
  'imariinvestord', 'imariinvestors', 'imaritravel', 'imariinfo26', 'recovery',
  'newdamv2', 'newdam1', 'rocktravel', 'tag', 'stfl3', 'alex0349', 'aba',
  'corporate', 'gp250corp', 'gp250gov', 'gp250sponsor', 'july4v2', 'july4', 'july4p2',
]);

const TOKEN_TTL_MS = 120 * 1000; // 120s: covers mint → redirect → render start
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days: re-render on expiry
const CACHE_PROBE_TIMEOUT_MS = 2500; // cap the HEAD probe so a slow CDN can't stall the decision

// --- Verbatim helpers from middleware.js / api/stats.js (byte-for-byte). ------
const enc = new TextEncoder();

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

// Cache-read (fail-safe): is there a cached PDF for this slug younger than the
// TTL? Credential-free HEAD to the public Cloudinary delivery URL, reading
// Last-Modified. EVERY failure mode — no cloud configured, timeout/abort,
// network error, non-200, missing/unparseable Last-Modified — returns false,
// i.e. "treat as a miss and render". There is no path where a flaky probe
// throws or yields anything but a boolean, so a cache-read failure can only
// ever degrade to "slower but works", never break the download.
async function isCachedFresh(cloud, slug) {
  if (!cloud) return false;
  const url = `https://res.cloudinary.com/${cloud}/raw/upload/collateral/${slug}.pdf`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CACHE_PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return false; // 404 (never cached / busted) or any non-200
    const lm = res.headers.get('last-modified');
    if (!lm) return false;
    const age = Date.now() - Date.parse(lm);
    if (!Number.isFinite(age)) return false; // unparseable date → miss
    return age < CACHE_TTL_MS;
  } catch {
    return false; // timeout / abort / network error → miss (fall through to render)
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(request) {
  if (request.method !== 'GET') return json(405, { ok: false, error: 'method_not_allowed' });

  const secret = process.env.IMARI_AUTH_SECRET;
  const pdfSecret = process.env.PDF_SHARED_SECRET;
  const renderUrl = process.env.PDF_RENDER_URL;
  if (!secret || !pdfSecret || !renderUrl) {
    return json(500, { ok: false, error: 'server_misconfigured' });
  }

  // --- Verify the imari_auth cookie → role (same shape as middleware.js). -----
  let role = null;
  const cookie = readCookie(request, 'imari_auth');
  if (cookie) {
    const idx = cookie.lastIndexOf('.');
    if (idx > 0) {
      const candidate = cookie.slice(0, idx);
      const signature = cookie.slice(idx + 1);
      const expected = await hmacHex(secret, candidate);
      if (constantTimeEqual(signature, expected)) role = candidate;
    }
  }
  // No valid cookie → re-gate (401). Distinct from the render service's 500.
  if (!role) return json(401, { ok: false, error: 'unauthorized', gate: '/private-info.html' });

  // --- Validate the requested slug against the allowlist. ---------------------
  const slug = new URL(request.url).searchParams.get('page') || '';
  if (!/^[a-z0-9-]+$/i.test(slug) || !ALLOWED_SLUGS.has(slug)) {
    return json(400, { ok: false, error: 'invalid_page' });
  }

  // --- Authorization parity: this role must be allowed to view /<slug>.html. --
  if (!ROLE_ALLOWS[role] || !ROLE_ALLOWS[role](`/${slug}.html`)) {
    return json(403, { ok: false, error: 'forbidden' });
  }

  // --- Cache check (fail-safe read): a fresh cached PDF → hand the client the
  // native Cloudinary download URL (fl_attachment, CORS-open), skipping the
  // render entirely. Any probe failure returns false above → fall through to
  // the render path below. --------------------------------------------------
  const cloud = process.env.PDF_CLOUDINARY_CLOUD;
  if (await isCachedFresh(cloud, slug)) {
    const cachedUrl = `https://res.cloudinary.com/${cloud}/raw/upload/fl_attachment:imari-${slug}/collateral/${slug}.pdf`;
    return json(200, { ok: true, mode: 'cached', url: cachedUrl });
  }

  // --- Miss: mint the slug-bound token and return the render-service URL. ------
  // sig = HMAC-SHA256(PDF_SHARED_SECRET, `${slug}.${exp}`), hex — byte-for-byte
  // what server.js verifies (same secret, same "${slug}.${exp}" input, same hex
  // encoding). exp is epoch ms (server.js checks `Date.now() > exp`).
  const exp = Date.now() + TOKEN_TTL_MS;
  const sig = await hmacHex(pdfSecret, `${slug}.${exp}`);
  const token = `${slug}.${exp}.${sig}`;
  const renderTarget = `${renderUrl.replace(/\/$/, '')}/pdf?token=${token}`;
  return json(200, { ok: true, mode: 'render', url: renderTarget });
}

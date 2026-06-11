// Vercel Edge Function — validates a password against env-var secrets and
// issues an HttpOnly `imari_auth` cookie signed with IMARI_AUTH_SECRET.
// The cookie value (`{role}.{hmac}`) is verified by middleware.js on every
// request to a protected route.

export const config = { runtime: 'edge' };

const ROLES = [
  { role: 'corporate',  envVar: 'IMARI_CORPORATE_PASSWORD',  redirect: '/corporate.html' },
  { role: 'alarm250',   envVar: 'IMARI_ALARM250_PASSWORD',   redirect: '/alarm250.html' },
  { role: 'freedom250', envVar: 'IMARI_FREEDOM250_PASSWORD', redirect: '/freedom250.html' },
  { role: 'alex0349',   envVar: 'IMARI_ALEX0349_PASSWORD',   redirect: '/alex0349.html' },
  { role: 'july4',      envVar: 'IMARI_JULY4_PASSWORD',      redirect: '/july4.html' },
  { role: 'july4v2',    envVar: 'IMARI_JULY4V2_PASSWORD',    redirect: '/july4v2.html' },
  { role: 'grandprix250', envVar: 'IMARI_GRANDPRIX250_PASSWORD', redirect: '/grandprix250.html' },
  { role: 'gp250corp',  envVar: 'IMARI_GP250CORP_PASSWORD',  redirect: '/gp250corp.html' },
  { role: 'gp250gov',   envVar: 'IMARI_GP250GOV_PASSWORD',   redirect: '/gp250gov.html' },
  { role: 'gp250sponsor', envVar: 'IMARI_GP250SPONSOR_PASSWORD', redirect: '/gp250sponsor.html' },
  { role: 'july4p2',    envVar: 'IMARI_JULY4P2_PASSWORD',    redirect: '/july4p2.html' },
  { role: 'newdam1',    envVar: 'IMARI_NEWDAM1_PASSWORD',    redirect: '/newdam1.html' },
  { role: 'newdamv2',   envVar: 'IMARI_NEWDAMV2_PASSWORD',   redirect: '/newdamv2.html' },
  { role: 'imaritravel', envVar: 'IMARI_IMARITRAVEL_PASSWORD', redirect: '/imaritravel.html' },
  { role: 'imariinvestors', envVar: 'IMARI_IMARIINVESTORS_PASSWORD', redirect: '/imariinvestors.html' },
  { role: 'imariinvestord', envVar: 'IMARI_IMARIINVESTORD_PASSWORD', redirect: '/imariinvestord.html' },
  { role: 'stfl3',      envVar: 'IMARI_SMART_PASSWORD',      redirect: '/stfl3.html' },
  { role: 'aba',        envVar: 'IMARI_ABA_PASSWORD',        redirect: '/aba.html' },
  { role: 'stats',      envVar: 'IMARI_STATS_PASSWORD',      redirect: '/stats.html' },
];

const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours

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

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

// --- Server-side view analytics (Upstash Redis REST; no SDK, no package) ------
// Recorded HERE, at the code-resolution step — i.e. for the routed-to content
// page, not for raw /private-info.html hits. Link-preview bots (Slackbot,
// iMessage, etc.) unfurl the shared /private-info URL but never submit a valid
// code, so they never reach this point — no user-agent denylist needed.
// Reads whichever REST credentials the Vercel marketplace integration injects
// (Upstash-native or KV-style), falling back to a manually-set IMARI_* pair.
// Use only the *_REST_* values — KV_URL / REDIS_URL are redis:// strings that
// can't be used over fetch from the Edge.
const ANALYTICS_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  process.env.IMARI_ANALYTICS_REST_URL;
const ANALYTICS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.IMARI_ANALYTICS_REST_TOKEN;

function safeDecode(v) {
  try { return decodeURIComponent(v || ''); } catch { return v || ''; }
}

// Write one view as a single pipelined round-trip. Never throws into the
// request path: no-ops if the env vars are unset, swallows any network error.
function recordView(matched, request) {
  if (!ANALYTICS_URL || !ANALYTICS_TOKEN) return Promise.resolve();
  const h = request.headers;
  const ts = Date.now();
  const blob = JSON.stringify({
    ts,
    role: matched.role,
    path: matched.redirect,
    country: h.get('x-vercel-ip-country') || '',
    region: h.get('x-vercel-ip-country-region') || '',
    city: safeDecode(h.get('x-vercel-ip-city')),
    ref: h.get('referer') || '',
  });
  const day = new Date(ts).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  // Full history (no LTRIM): per-page log, global log, lifetime counter, and a
  // per-day counter so "this week" is answerable.
  const commands = [
    ['LPUSH', `imari:events:${matched.role}`, blob],
    ['LPUSH', 'imari:events:all', blob],
    ['INCR', `imari:count:${matched.role}`],
    ['INCR', `imari:daily:${matched.role}:${day}`],
  ];
  return fetch(`${ANALYTICS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ANALYTICS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  }).then(() => undefined).catch(() => undefined);
}

export default async function handler(request, context) {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' });
  }

  const secret = process.env.IMARI_AUTH_SECRET;
  if (!secret) {
    return json(500, { ok: false, error: 'server_misconfigured' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'bad_request' });
  }

  const submitted = typeof payload?.password === 'string' ? payload.password : '';
  if (!submitted) return json(400, { ok: false, error: 'missing_password' });

  let matched = null;
  for (const entry of ROLES) {
    const expected = process.env[entry.envVar];
    if (expected && constantTimeEqual(submitted, expected)) {
      matched = entry;
      break;
    }
  }

  if (!matched) return json(401, { ok: false, error: 'invalid_password' });

  // Record the view in the background so the response isn't delayed. The
  // 'stats' role is the readout itself, so it isn't counted as a view. Prefer
  // the platform's waitUntil; fall back to awaiting (a fast single round-trip)
  // if it isn't available, so events are never silently dropped.
  if (matched.role !== 'stats') {
    const writeP = recordView(matched, request);
    if (context && typeof context.waitUntil === 'function') {
      context.waitUntil(writeP);
    } else {
      await writeP;
    }
  }

  const signature = await hmacHex(secret, matched.role);
  const cookie = [
    `imari_auth=${matched.role}.${signature}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${COOKIE_MAX_AGE}`,
  ].join('; ');

  return json(200, { ok: true, redirect: matched.redirect }, { 'set-cookie': cookie });
}

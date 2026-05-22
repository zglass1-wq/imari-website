// Vercel Edge Function — validates a password against env-var secrets and
// issues an HttpOnly `imari_auth` cookie signed with IMARI_AUTH_SECRET.
// The cookie value (`{role}.{hmac}`) is verified by middleware.js on every
// request to a protected route.

export const config = { runtime: 'edge' };

const ROLES = [
  { role: 'agents',     envVar: 'IMARI_AGENTS_PASSWORD',     redirect: '/agents.html' },
  { role: 'corporate',  envVar: 'IMARI_CORPORATE_PASSWORD',  redirect: '/corporate.html' },
  { role: 'alarm250',   envVar: 'IMARI_ALARM250_PASSWORD',   redirect: '/alarm250.html' },
  { role: 'freedom250', envVar: 'IMARI_FREEDOM250_PASSWORD', redirect: '/freedom250.html' },
  { role: 'alex0349',   envVar: 'IMARI_ALEX0349_PASSWORD',   redirect: '/alex0349.html' },
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

export default async function handler(request) {
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

// Vercel Edge Function — gated JSON readout of server-side view analytics.
// Reads the counters/event logs written by api/login.js from Upstash Redis
// (REST, no SDK). Protected on its own: requires a valid `imari_auth` cookie
// for the 'stats' role (the same HMAC check middleware.js uses), since /api/*
// is not behind the middleware matcher and would otherwise be public.

export const config = { runtime: 'edge' };

// Same credential resolution as api/login.js: accept whichever REST names the
// Vercel marketplace integration injects (Upstash-native or KV-style), with the
// manual IMARI_* pair as a fallback. (KV_URL / REDIS_URL are not fetch-usable.)
const ANALYTICS_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  process.env.IMARI_ANALYTICS_REST_URL;
const ANALYTICS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.IMARI_ANALYTICS_REST_TOKEN;

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

// Run a pipeline of Redis commands via the Upstash REST API. Returns the array
// of per-command results ([{ result }, ...]).
async function pipeline(commands) {
  const res = await fetch(`${ANALYTICS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ANALYTICS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return res.json();
}

export default async function handler(request) {
  const secret = process.env.IMARI_AUTH_SECRET;
  if (!secret) return json(500, { ok: false, error: 'server_misconfigured' });
  if (!ANALYTICS_URL || !ANALYTICS_TOKEN) {
    return json(500, { ok: false, error: 'analytics_not_configured' });
  }

  // --- Auth: require a valid 'stats'-role cookie -----------------------------
  let authorized = false;
  const cookie = readCookie(request, 'imari_auth');
  if (cookie) {
    const idx = cookie.lastIndexOf('.');
    if (idx > 0) {
      const role = cookie.slice(0, idx);
      const signature = cookie.slice(idx + 1);
      if (role === 'stats' && constantTimeEqual(signature, await hmacHex(secret, 'stats'))) {
        authorized = true;
      }
    }
  }
  if (!authorized) return json(401, { ok: false, error: 'unauthorized' });

  // --- Read --------------------------------------------------------------------
  // 1) Discover which pages have counts (drift-proof — no hardcoded role list).
  const scan = await pipeline([['SCAN', '0', 'MATCH', 'imari:count:*', 'COUNT', '1000']]);
  const countKeys = (scan?.[0]?.result?.[1]) || [];
  const roles = countKeys.map((k) => k.slice('imari:count:'.length));

  // 2) Build the last-7-days date list (UTC, newest first), matching login.js.
  const days = [];
  const now = Date.now();
  for (let i = 0; i < 7; i++) {
    days.push(new Date(now - i * 86400000).toISOString().slice(0, 10));
  }
  const dailyKeys = [];
  for (const r of roles) for (const d of days) dailyKeys.push(`imari:daily:${r}:${d}`);

  // 3) Totals + per-day + recent global (gated) events + the homepage log and
  //    its filtered-bot tally, in one pipeline. The homepage's total/per-day
  //    flow through the SCAN above (imari:count:home); its event log is a
  //    separate key (imari:events:home) so it doesn't mix into the gated feed.
  const RECENT = 100;
  const cmds = [
    countKeys.length ? ['MGET', ...countKeys] : ['PING'],
    dailyKeys.length ? ['MGET', ...dailyKeys] : ['PING'],
    ['LRANGE', 'imari:events:all', '0', String(RECENT - 1)],
    ['LRANGE', 'imari:events:home', '0', String(RECENT - 1)],
    ['GET', 'imari:home:bots'],
  ];
  const res = await pipeline(cmds);
  const totalsArr = countKeys.length ? (res[0]?.result || []) : [];
  const dailyArr = dailyKeys.length ? (res[1]?.result || []) : [];
  const recentArr = res[2]?.result || [];
  const homeArr = res[3]?.result || [];
  const homeBots = Number(res[4]?.result || 0);

  const counts = {};
  roles.forEach((r, i) => { counts[r] = Number(totalsArr[i] || 0); });

  const daily = {};
  let di = 0;
  for (const r of roles) {
    daily[r] = {};
    for (const d of days) { daily[r][d] = Number(dailyArr[di++] || 0); }
  }

  const parseEvents = (arr) => arr
    .map((s) => { try { return JSON.parse(s); } catch { return null; } })
    .filter(Boolean);

  const recent = parseEvents(recentArr);
  const home = { recent: parseEvents(homeArr), bots: homeBots };

  return json(200, { ok: true, days, counts, daily, recent, home });
}

// Vercel Edge Middleware — gates protected HTML routes server-side.
// A request is allowed through only if it carries an `imari_auth` cookie
// whose value is a valid `{role}.{hmac}` pair signed with IMARI_AUTH_SECRET.

export const config = {
  matcher: [
    '/',
    '/corporate.html',
    '/alarm250.html',
    '/freedom250.html',
    '/alex0349.html',
    '/july4.html',
    '/july4v2.html',
    '/gp250corp.html',
    '/gp250gov.html',
    '/gp250sponsor.html',
    '/july4p2.html',
    '/newdam1.html',
    '/newdamv2.html',
    '/imaritravel.html',
    '/imariinvestors.html',
    '/imariinvestord.html',
    '/rocktravel.html',
    '/tag.html',
    '/stfl3.html',
    '/aba.html',
    '/stats.html',
  ],
};

const ROLE_ALLOWS = {
  corporate: (p) => p === '/corporate.html' || p.startsWith('/corporate-'),
  alarm250: (p) => p === '/alarm250.html' || p.startsWith('/alarm250-'),
  freedom250: (p) => p === '/freedom250.html' || p.startsWith('/freedom250-'),
  alex0349: (p) => p === '/alex0349.html' || p.startsWith('/alex0349-'),
  july4: (p) => p === '/july4.html' || p.startsWith('/july4-'),
  july4v2: (p) => p === '/july4v2.html' || p.startsWith('/july4v2-'),
  gp250corp: (p) => p === '/gp250corp.html' || p.startsWith('/gp250corp-'),
  gp250gov: (p) => p === '/gp250gov.html' || p.startsWith('/gp250gov-'),
  gp250sponsor: (p) => p === '/gp250sponsor.html' || p.startsWith('/gp250sponsor-'),
  july4p2: (p) => p === '/july4p2.html' || p.startsWith('/july4p2-'),
  newdam1: (p) => p === '/newdam1.html' || p.startsWith('/newdam1-'),
  newdamv2: (p) => p === '/newdamv2.html' || p.startsWith('/newdamv2-'),
  imaritravel: (p) => p === '/imaritravel.html' || p.startsWith('/imaritravel-'),
  imariinvestors: (p) => p === '/imariinvestors.html' || p.startsWith('/imariinvestors-'),
  imariinvestord: (p) => p === '/imariinvestord.html' || p.startsWith('/imariinvestord-'),
  rocktravel: (p) => p === '/rocktravel.html' || p.startsWith('/rocktravel-'),
  tag: (p) => p === '/tag.html' || p.startsWith('/tag-'),
  stfl3: (p) => p === '/stfl3.html' || p.startsWith('/stfl3-'),
  aba: (p) => p === '/aba.html' || p.startsWith('/aba-'),
  stats: (p) => p === '/stats.html' || p.startsWith('/stats-'),
};

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

// --- Public homepage view analytics (geo-only, bot-filtered) ------------------
// The homepage is public, so there's no gate to wash out bots. We classify each
// hit by User-Agent: real visitors get a timestamped, geo-only event (NO IP),
// suspected bots only bump a visible tally so nothing is silently dropped. This
// runs for '/' ONLY and never gates the homepage. Same Upstash REST write as
// api/login.js (no SDK, no package); credentials resolve from whichever names
// the Vercel Storage integration injects.
const ANALYTICS_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  process.env.IMARI_ANALYTICS_REST_URL;
const ANALYTICS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.IMARI_ANALYTICS_REST_TOKEN;

// Heuristic UA denylist — crawlers, social/link-preview unfurlers, headless
// browsers, and HTTP libraries. Imperfect by nature (bad bots spoof real UAs),
// which is why filtered hits are tallied, not just dropped. Empty UA = bot.
const BOT_RE = /bot|crawl|spider|slurp|mediapartners|apis-google|google-inspectiontool|feedfetcher|bingpreview|facebookexternalhit|facebot|embedly|outbrain|pinterest|slackbot|slack-imgproxy|twitterbot|telegrambot|discordbot|whatsapp|linkedinbot|skypeuripreview|redditbot|applebot|petalbot|yandex|baidu|duckduck|semrush|ahrefs|mj12|dotbot|headless|phantomjs|python-requests|aiohttp|axios|node-fetch|go-http-client|curl|wget|libwww|httpclient|java\/|okhttp|scrapy/i;

function isBot(ua) {
  return !ua || BOT_RE.test(ua);
}

function safeDecode(v) {
  try { return decodeURIComponent(v || ''); } catch { return v || ''; }
}

// Write one homepage hit. Real visitor → geo-only event + counters; suspected
// bot → tally only (no event, no geo). Never throws into the request path.
function recordHomeView(request) {
  if (!ANALYTICS_URL || !ANALYTICS_TOKEN) return Promise.resolve();
  const h = request.headers;
  let commands;
  if (isBot(h.get('user-agent'))) {
    commands = [['INCR', 'imari:home:bots']];
  } else {
    const ts = Date.now();
    const blob = JSON.stringify({
      ts,
      path: '/',
      country: h.get('x-vercel-ip-country') || '',
      region: h.get('x-vercel-ip-country-region') || '',
      city: safeDecode(h.get('x-vercel-ip-city')),
      ref: h.get('referer') || '',
    });
    const day = new Date(ts).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    commands = [
      ['LPUSH', 'imari:events:home', blob],
      ['INCR', 'imari:count:home'],
      ['INCR', `imari:daily:home:${day}`],
    ];
  }
  return fetch(`${ANALYTICS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ANALYTICS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  }).then(() => undefined).catch(() => undefined);
}

export default async function middleware(request, event) {
  const url = new URL(request.url);

  // Public homepage: record the visit and pass through — NEVER gated. Must come
  // before the gate logic below. Backgrounded via event.waitUntil so the
  // homepage response isn't delayed (awaited fallback if unavailable).
  if (url.pathname === '/') {
    if (request.method === 'GET') {
      const writeP = recordHomeView(request);
      if (event && typeof event.waitUntil === 'function') {
        event.waitUntil(writeP);
      } else {
        await writeP;
      }
    }
    return;
  }

  const secret = process.env.IMARI_AUTH_SECRET;
  const cookie = readCookie(request, 'imari_auth');

  let role = null;
  if (secret && cookie) {
    const idx = cookie.lastIndexOf('.');
    if (idx > 0) {
      const candidate = cookie.slice(0, idx);
      const signature = cookie.slice(idx + 1);
      const expected = await hmacHex(secret, candidate);
      if (constantTimeEqual(signature, expected)) role = candidate;
    }
  }

  if (role && ROLE_ALLOWS[role] && ROLE_ALLOWS[role](url.pathname)) {
    return; // authorized — pass through
  }

  const gate = new URL('/private-info.html', url);
  gate.searchParams.set('from', url.pathname);
  return Response.redirect(gate, 302);
}

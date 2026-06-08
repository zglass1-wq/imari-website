// Vercel Edge Middleware — gates protected HTML routes server-side.
// A request is allowed through only if it carries an `imari_auth` cookie
// whose value is a valid `{role}.{hmac}` pair signed with IMARI_AUTH_SECRET.

export const config = {
  matcher: [
    '/corporate.html',
    '/alarm250.html',
    '/freedom250.html',
    '/alex0349.html',
    '/july4.html',
    '/july4v2.html',
    '/july4p2.html',
    '/newdam1.html',
    '/newdamv2.html',
    '/imaritravel.html',
    '/imariinvestors.html',
    '/imariinvestord.html',
    '/stfl3.html',
    '/aba.html',
  ],
};

const ROLE_ALLOWS = {
  corporate: (p) => p === '/corporate.html' || p.startsWith('/corporate-'),
  alarm250: (p) => p === '/alarm250.html' || p.startsWith('/alarm250-'),
  freedom250: (p) => p === '/freedom250.html' || p.startsWith('/freedom250-'),
  alex0349: (p) => p === '/alex0349.html' || p.startsWith('/alex0349-'),
  july4: (p) => p === '/july4.html' || p.startsWith('/july4-'),
  july4v2: (p) => p === '/july4v2.html' || p.startsWith('/july4v2-'),
  july4p2: (p) => p === '/july4p2.html' || p.startsWith('/july4p2-'),
  newdam1: (p) => p === '/newdam1.html' || p.startsWith('/newdam1-'),
  newdamv2: (p) => p === '/newdamv2.html' || p.startsWith('/newdamv2-'),
  imaritravel: (p) => p === '/imaritravel.html' || p.startsWith('/imaritravel-'),
  imariinvestors: (p) => p === '/imariinvestors.html' || p.startsWith('/imariinvestors-'),
  imariinvestord: (p) => p === '/imariinvestord.html' || p.startsWith('/imariinvestord-'),
  stfl3: (p) => p === '/stfl3.html' || p.startsWith('/stfl3-'),
  aba: (p) => p === '/aba.html' || p.startsWith('/aba-'),
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

export default async function middleware(request) {
  const url = new URL(request.url);
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

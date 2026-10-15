import { timingSafeEqual } from 'crypto';

function sendCookie(res, name, value, options = {}) {
  const attrs = [];
  attrs.push(`${name}=${encodeURIComponent(value)}`);
  if (options.httpOnly) attrs.push('HttpOnly');
  if (options.sameSite) attrs.push(`SameSite=${options.sameSite}`);
  if (options.secure) attrs.push('Secure');
  if (options.path) attrs.push(`Path=${options.path}`);
  if (options.maxAge != null) attrs.push(`Max-Age=${options.maxAge}`);
  res.setHeader('Set-Cookie', attrs.join('; '));
}

// ---------- Limit wrong password guesses (per visitor, in memory) ----------
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_FAILS = 5;
const failMap = new Map();

function getClientIp(req) {
  // On Vercel, these headers are set by Vercel itself and can't be faked by visitors.
  const vercelIp = req.headers['x-vercel-forwarded-for'];
  if (typeof vercelIp === 'string' && vercelIp) return vercelIp.split(',')[0].trim();
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp.trim();
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function getFailEntry(ip, now) {
  if (failMap.size > 1000) {
    for (const [key, value] of failMap) {
      if (now - value.ts > LOGIN_WINDOW_MS) failMap.delete(key);
    }
  }
  const entry = failMap.get(ip);
  if (!entry || now - entry.ts > LOGIN_WINDOW_MS) return { count: 0, ts: now };
  return entry;
}

// Compares two texts without leaking (through timing) how much of the guess was right.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { password } = req.body || {};
  const expected = process.env.STATUS_PASSWORD || '';
  const token = process.env.STATUS_AUTH_TOKEN || '';

  if (!expected || !token) {
    return res.status(500).json({ error: 'Status auth not configured.' });
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const entry = getFailEntry(ip, now);
  if (entry.count >= LOGIN_MAX_FAILS) {
    return res.status(429).json({ error: 'Too many wrong passwords. Try again in a few minutes.' });
  }

  if (!safeEqual(password || '', expected)) {
    entry.count += 1;
    failMap.set(ip, entry);
    return res.status(401).json({ error: 'Invalid password.' });
  }

  failMap.delete(ip);

  sendCookie(res, 'status_auth', token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return res.status(200).json({ ok: true });
}
import { isAuthed } from '../../../lib/status-auth';

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

  if (String(password || '') !== expected) {
    return res.status(401).json({ error: 'Invalid password.' });
  }

  sendCookie(res, 'status_auth', token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return res.status(200).json({ ok: true });
}

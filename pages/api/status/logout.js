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

  if (!isAuthed(req)) {
    return res.status(200).json({ ok: true });
  }

  sendCookie(res, 'status_auth', '', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: true,
    path: '/',
    maxAge: 0,
  });

  return res.status(200).json({ ok: true });
}

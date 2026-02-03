function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

export function isAuthed(req) {
  const token = process.env.STATUS_AUTH_TOKEN || '';
  if (!token) return false;
  const cookies = parseCookies(req);
  return cookies.status_auth === token;
}

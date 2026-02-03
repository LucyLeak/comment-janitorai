import { getStatus, saveStatus } from '../../../lib/status-db';
import { isAuthed } from '../../../lib/status-auth';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 4;
const rateLimitMap = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, ts: now };
  if (now - entry.ts > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.ts = now;
  }
  entry.count += 1;
  rateLimitMap.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
}

const MAX_NAME_LEN = 30;
const MAX_MESSAGE_LEN = 140;
const MAX_AVATAR_LEN = 5 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const status = await getStatus(20);
      return res.status(200).json({ status });
    } catch (error) {
      console.error('GET /api/status error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      if (!isAuthed(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (isRateLimited(req)) {
        return res.status(429).json({ error: 'Too many requests. Try again soon.' });
      }

      const { name, message, avatar_url = null } = req.body;
      if (!name || !message) {
        return res.status(400).json({ error: 'Name and message are required.' });
      }
      const trimmedName = String(name).trim().slice(0, MAX_NAME_LEN);
      const trimmedMessage = String(message).trim().slice(0, MAX_MESSAGE_LEN);
      if (!trimmedName || !trimmedMessage) {
        return res.status(400).json({ error: 'Name and message are required.' });
      }

      let safeAvatar = null;
      if (avatar_url) {
        const avatarStr = String(avatar_url);
        const isDataUrl = avatarStr.startsWith('data:image/');
        if (!isDataUrl || avatarStr.length > MAX_AVATAR_LEN) {
          return res.status(400).json({ error: 'Invalid avatar image.' });
        }
        safeAvatar = avatarStr;
      }

      await saveStatus(trimmedName, trimmedMessage, safeAvatar);
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('POST /api/status error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

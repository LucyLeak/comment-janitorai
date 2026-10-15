import { getStatus, saveStatus } from '../../../lib/status-db';
import { isAuthed } from '../../../lib/status-auth';

// Reject oversized requests early (Next.js default is 1MB).
export const config = {
  api: {
    bodyParser: { sizeLimit: '128kb' },
  },
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 4;
const rateLimitMap = new Map();

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

function isRateLimited(req) {
  const ip = getClientIp(req);
  const now = Date.now();

  // Clean up old entries so the map doesn't grow forever.
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap) {
      if (now - value.ts > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key);
    }
  }

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

// Avatars are shrunk to 128x128 by the page before upload, so they are small.
// This is the max length of the whole "data:image/...;base64,..." text.
const MAX_AVATAR_LEN = 60 * 1000;

// Only these image types, and only plain base64 characters.
// (No SVG, and no quotes or spaces that could break the page or the SVG badge.)
const AVATAR_REGEX = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const status = await getStatus(20);
      res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
      return res.status(200).json({ status });
    } catch (error) {
      console.error('GET /api/status error:', error);
      return res.status(500).json({ error: 'Could not load status.' });
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

      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const { name, message, avatar_url = null } = body;
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
        if (avatarStr.length > MAX_AVATAR_LEN || !AVATAR_REGEX.test(avatarStr)) {
          return res.status(400).json({ error: 'Invalid avatar image. Please pick the image again.' });
        }
        safeAvatar = avatarStr;
      }

      await saveStatus(trimmedName, trimmedMessage, safeAvatar);
      return res.status(201).json({ ok: true });
    } catch (error) {
      console.error('POST /api/status error:', error);
      return res.status(500).json({ error: 'Could not save your status.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
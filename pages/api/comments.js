// pages/api/comments.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 8;
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
const MAX_MESSAGE_LEN = 100;
const MAX_AVATAR_LEN = 5 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, name, message, created_at, liked_by_owner, pinned, parent_id, avatar_url')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return res.status(200).json({ comments: data });
    } catch (error) {
      console.error('GET /api/comments error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      if (isRateLimited(req)) {
        return res.status(429).json({ error: 'Too many requests. Try again soon.' });
      }

      const { name, message, parent_id = null, avatar_url = null } = req.body;
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
      const { error } = await supabase
        .from('comments')
        .insert([{ name: trimmedName, message: trimmedMessage, parent_id, avatar_url: safeAvatar }]);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('POST /api/comments error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

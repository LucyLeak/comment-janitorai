// pages/api/comments.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Reject oversized requests early (Next.js default is 1MB).
export const config = {
  api: {
    bodyParser: { sizeLimit: '128kb' },
  },
};

// ---------- Limits ----------
const MAX_NAME_LEN = 30;
const MAX_MESSAGE_LEN = 100;

// Avatars are shrunk to 128x128 by the page before upload, so they are small.
// This is the max length of the whole "data:image/...;base64,..." text.
const MAX_AVATAR_LEN = 60 * 1000;

// Only these image types, and only plain base64 characters.
// (No SVG, and no quotes or spaces that could break the page or the SVG badge.)
const AVATAR_REGEX = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

// Rate limits
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 8; // per visitor (IP) per minute
const GLOBAL_LIMIT_MAX = 20; // total new comments per minute, everyone together

// ---------- Rate limit (per visitor, in memory) ----------
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

// ---------- Rate limit (everyone together, stored in Supabase) ----------
// Works even when the server restarts, because it just counts recent comments.
async function isGloballyRateLimited() {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);
  if (error) {
    console.error('Global rate limit check failed:', error);
    return false; // if the check breaks, still allow comments
  }
  return (count || 0) >= GLOBAL_LIMIT_MAX;
}

// ---------- Helpers ----------
// parent_id must be a whole number or a UUID, depending on how your table was made.
function normalizeParentId(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === 'string') {
    if (/^[1-9]\d{0,15}$/.test(value)) return Number(value);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return value;
  }
  return undefined; // invalid
}

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
      res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
      return res.status(200).json({ comments: data });
    } catch (error) {
      console.error('GET /api/comments error:', error);
      return res.status(500).json({ error: 'Could not load comments.' });
    }
  }

  if (req.method === 'POST') {
    try {
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

      // Avatar: small, and only png / jpeg / webp.
      let safeAvatar = null;
      if (avatar_url) {
        const avatarStr = String(avatar_url);
        if (avatarStr.length > MAX_AVATAR_LEN || !AVATAR_REGEX.test(avatarStr)) {
          return res.status(400).json({ error: 'Invalid avatar image.' });
        }
        safeAvatar = avatarStr;
      }

      // Reply: the comment being replied to must exist and must not be a reply itself.
      const parentId = normalizeParentId(body.parent_id);
      if (parentId === undefined) {
        return res.status(400).json({ error: 'Invalid reply target.' });
      }
      if (parentId !== null) {
        const { data: parent, error: parentError } = await supabase
          .from('comments')
          .select('id, parent_id')
          .eq('id', parentId)
          .maybeSingle();
        if (parentError) throw parentError;
        if (!parent || parent.parent_id) {
          return res.status(400).json({ error: 'Invalid reply target.' });
        }
      }

      if (await isGloballyRateLimited()) {
        return res.status(429).json({ error: 'Lots of comments right now. Try again soon.' });
      }

      const { error } = await supabase
        .from('comments')
        .insert([{ name: trimmedName, message: trimmedMessage, parent_id: parentId, avatar_url: safeAvatar }]);
      if (error) throw error;
      return res.status(201).json({ ok: true });
    } catch (error) {
      console.error('POST /api/comments error:', error);
      return res.status(500).json({ error: 'Could not save your comment.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
// pages/api/reactions.js
//
// Anonymous emote reactions for comments, replies and status posts.
//
//   GET  /api/reactions?type=comment&ids=ID1,ID2   -> counts for those items
//   POST /api/reactions  { target_type, target_id, emoji }  -> adds or removes the visitor's reaction
//
// Visitors are recognised only by a random ID that their browser makes up
// (sent in the "x-visitor-id" header). IP addresses are NOT used or stored here.
// The ID is scrambled (hashed) before it is saved, and it is never sent back to anyone.
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { isAuthed } from '../../lib/status-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: { sizeLimit: '4kb' },
  },
};

// ---------- Rules ----------
const TARGET_TABLES = { comment: 'comments', status: 'status' };
const MAX_PER_VISITOR = 5; // one visitor: up to 5 different emotes per item, each only once
const MAX_DIFFERENT_PER_ITEM = 20; // all visitors together: up to 20 different emotes per item
const MAX_IDS_PER_REQUEST = 100;
const MAX_ROWS_PER_REQUEST = 5000;

// Spam limits (no IP addresses involved)
const WINDOW_MS = 60 * 1000;
const VISITOR_MAX_ACTIONS = 20; // per visitor per minute (kept in memory)
const GLOBAL_MAX_NEW_REACTIONS = 60; // new reactions per minute, everyone together (counted in Supabase)

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMBER_ID_REGEX = /^[1-9]\d{0,15}$/;
const ALLOWED_EXTS = new Set(['.png', '.gif', '.jpg', '.jpeg', '.webp']);

// ---------- Helpers ----------
function isValidTargetId(value) {
  return typeof value === 'string' && (UUID_REGEX.test(value) || NUMBER_ID_REGEX.test(value));
}

// The names of the emotes in public/emojis (the only emotes people may react with).
let emojiCache = { at: 0, names: new Set() };
function getEmojiNames() {
  const now = Date.now();
  if (now - emojiCache.at < 60 * 1000 && emojiCache.names.size > 0) return emojiCache.names;
  const names = new Set();
  try {
    const dir = path.join(process.cwd(), 'public', 'emojis');
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach((file) => {
        const ext = path.extname(file);
        if (ALLOWED_EXTS.has(ext.toLowerCase())) names.add(path.basename(file, ext));
      });
    }
  } catch (err) {
    console.error('Could not read emoji folder:', err);
  }
  emojiCache = { at: now, names };
  return names;
}

// Turns the visitor's browser ID into a scrambled value that is safe to store.
function hashVisitor(visitorId) {
  const secret = process.env.REACTION_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createHash('sha256').update(`${secret}:${visitorId.toLowerCase()}`).digest('hex');
}

function readVisitorId(req) {
  const raw = req.headers['x-visitor-id'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || !UUID_REGEX.test(value.trim())) return null;
  return value.trim();
}

// Per-visitor speed limit, in memory (resets when the server restarts; that's fine).
const actionMap = new Map();
function isVisitorRateLimited(visitorHash) {
  const now = Date.now();
  if (actionMap.size > 1000) {
    for (const [key, value] of actionMap) {
      if (now - value.ts > WINDOW_MS) actionMap.delete(key);
    }
  }
  const entry = actionMap.get(visitorHash) || { count: 0, ts: now };
  if (now - entry.ts > WINDOW_MS) {
    entry.count = 0;
    entry.ts = now;
  }
  entry.count += 1;
  actionMap.set(visitorHash, entry);
  return entry.count > VISITOR_MAX_ACTIONS;
}

// Everyone-together limit, counted in Supabase so it survives server restarts.
async function isGloballyRateLimited() {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from('reactions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);
  if (error) {
    console.error('Global reaction limit check failed:', error);
    return false; // if the check breaks, still allow reactions
  }
  return (count || 0) >= GLOBAL_MAX_NEW_REACTIONS;
}

// Turns raw rows into [{ emoji, count, mine }], oldest emote first (like Discord).
function summarize(rows, myHash) {
  const byEmoji = new Map();
  for (const row of rows) {
    let entry = byEmoji.get(row.emoji);
    if (!entry) {
      entry = { emoji: row.emoji, count: 0, mine: false, firstAt: row.created_at || '' };
      byEmoji.set(row.emoji, entry);
    }
    entry.count += 1;
    if (myHash && row.voter_hash === myHash) entry.mine = true;
    if (row.created_at && row.created_at < entry.firstAt) entry.firstAt = row.created_at;
  }
  return [...byEmoji.values()]
    .sort((a, b) => (a.firstAt < b.firstAt ? -1 : a.firstAt > b.firstAt ? 1 : 0))
    .map(({ emoji, count, mine }) => ({ emoji, count, mine }));
}

// ---------- Handler ----------
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // ----- GET: counts for a list of comments / status posts -----
  if (req.method === 'GET') {
    try {
      const type = String(req.query.type || '');
      if (!TARGET_TABLES[type]) {
        return res.status(400).json({ error: 'Invalid type.' });
      }
      const ids = [
        ...new Set(
          String(req.query.ids || '')
            .split(',')
            .map((id) => id.trim())
            .filter(isValidTargetId)
        ),
      ].slice(0, MAX_IDS_PER_REQUEST);
      if (ids.length === 0) {
        return res.status(200).json({ reactions: {} });
      }

      const visitorId = readVisitorId(req);
      const myHash = visitorId ? hashVisitor(visitorId) : null;

      const { data, error } = await supabase
        .from('reactions')
        .select('target_id, emoji, voter_hash, created_at')
        .eq('target_type', type)
        .in('target_id', ids)
        .order('created_at', { ascending: true })
        .limit(MAX_ROWS_PER_REQUEST);
      if (error) throw error;

      const rowsByTarget = {};
      for (const row of data || []) {
        (rowsByTarget[row.target_id] = rowsByTarget[row.target_id] || []).push(row);
      }
      const reactions = {};
      for (const id of ids) {
        if (rowsByTarget[id]) reactions[id] = summarize(rowsByTarget[id], myHash);
      }
      return res.status(200).json({ reactions });
    } catch (error) {
      console.error('GET /api/reactions error:', error);
      return res.status(500).json({ error: 'Could not load reactions.' });
    }
  }

  // ----- POST: add or remove the visitor's reaction -----
  if (req.method === 'POST') {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const type = String(body.target_type || '');
      const targetId = typeof body.target_id === 'string' ? body.target_id.trim() : String(body.target_id ?? '');
      const emoji = typeof body.emoji === 'string' ? body.emoji : '';

      if (!TARGET_TABLES[type] || !isValidTargetId(targetId)) {
        return res.status(400).json({ error: 'Invalid reaction target.' });
      }
      if (!emoji || !getEmojiNames().has(emoji)) {
        return res.status(400).json({ error: 'Unknown emote.' });
      }
      const visitorId = readVisitorId(req);
      if (!visitorId) {
        return res.status(400).json({ error: 'Missing browser ID. Reload the page and try again.' });
      }

      // Status posts: only the logged-in owner may add or remove reactions.
      if (type === 'status' && !isAuthed(req)) {
        return res.status(401).json({ error: 'Log in to react.' });
      }

      const myHash = hashVisitor(visitorId);
      if (isVisitorRateLimited(myHash)) {
        return res.status(429).json({ error: 'Slow down a little and try again.' });
      }

      // The item must exist.
      const { data: target, error: targetError } = await supabase
        .from(TARGET_TABLES[type])
        .select('id')
        .eq('id', targetId)
        .maybeSingle();
      if (targetError) throw targetError;
      if (!target) {
        return res.status(404).json({ error: 'That item no longer exists.' });
      }

      // All reactions on this item (used for the rules and for the answer).
      const { data: existingRows, error: rowsError } = await supabase
        .from('reactions')
        .select('emoji, voter_hash, created_at')
        .eq('target_type', type)
        .eq('target_id', targetId)
        .order('created_at', { ascending: true })
        .limit(1000);
      if (rowsError) throw rowsError;
      let rows = existingRows || [];

      const noun = type === 'status' ? 'post' : 'comment';
      const alreadyReacted = rows.some((row) => row.emoji === emoji && row.voter_hash === myHash);
      let active;

      if (alreadyReacted) {
        // Clicking the same emote again removes it.
        const { error: deleteError } = await supabase
          .from('reactions')
          .delete()
          .eq('target_type', type)
          .eq('target_id', targetId)
          .eq('emoji', emoji)
          .eq('voter_hash', myHash);
        if (deleteError) throw deleteError;
        rows = rows.filter((row) => !(row.emoji === emoji && row.voter_hash === myHash));
        active = false;
      } else {
        const mineCount = rows.filter((row) => row.voter_hash === myHash).length;
        if (mineCount >= MAX_PER_VISITOR) {
          return res.status(400).json({ error: `You can add up to ${MAX_PER_VISITOR} reactions per ${noun}.` });
        }
        const differentEmotes = new Set(rows.map((row) => row.emoji));
        if (!differentEmotes.has(emoji) && differentEmotes.size >= MAX_DIFFERENT_PER_ITEM) {
          return res.status(400).json({ error: `This ${noun} already has ${MAX_DIFFERENT_PER_ITEM} different reactions.` });
        }
        if (await isGloballyRateLimited()) {
          return res.status(429).json({ error: 'Lots of reactions right now. Try again soon.' });
        }

        const { error: insertError } = await supabase
          .from('reactions')
          .insert([{ target_type: type, target_id: targetId, emoji, voter_hash: myHash }]);
        // 23505 = the database's "already exists" rule fired (two clicks at once). That's fine.
        if (insertError && insertError.code !== '23505') throw insertError;
        rows = [...rows, { emoji, voter_hash: myHash, created_at: new Date().toISOString() }];
        active = true;
      }

      return res.status(200).json({ ok: true, active, reactions: summarize(rows, myHash) });
    } catch (error) {
      console.error('POST /api/reactions error:', error);
      return res.status(500).json({ error: 'Could not save your reaction.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
// lib/visitor.js  (runs in the visitor's browser only)
//
// 1) A random, anonymous "browser ID". It is made up on the visitor's device,
//    kept in their browser, and used only to stop the same browser from
//    reacting with the same emote twice. It is not linked to a name or an IP address.
// 2) The visitor's remembered name and avatar, so they don't have to fill the
//    comment form in again on their next visit.

const ID_KEY = 'visitor_id';
const PROFILE_KEY = 'comment_profile';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Same size limit the server uses for avatars (the whole "data:image/..." text).
export const MAX_SAVED_AVATAR_LEN = 60 * 1000;

let memoryId = '';

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getVisitorId() {
  if (typeof window === 'undefined') return '';
  try {
    const stored = window.localStorage.getItem(ID_KEY);
    if (stored && UUID_REGEX.test(stored)) return stored;
    const id = memoryId || makeId();
    memoryId = id;
    window.localStorage.setItem(ID_KEY, id);
    return id;
  } catch (err) {
    // Browser storage is blocked (private mode, etc.): use an ID that lasts until the page closes.
    if (!memoryId) memoryId = makeId();
    return memoryId;
  }
}

export function loadProfile() {
  if (typeof window === 'undefined') return { name: '', avatar: '' };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILE_KEY) || '{}');
    const name = typeof parsed.name === 'string' ? parsed.name.slice(0, 30) : '';
    const avatar =
      typeof parsed.avatar === 'string' && parsed.avatar.length <= MAX_SAVED_AVATAR_LEN
        ? parsed.avatar
        : '';
    return { name, avatar };
  } catch (err) {
    return { name: '', avatar: '' };
  }
}

export function saveProfile(name, avatar) {
  if (typeof window === 'undefined') return;
  try {
    const safeAvatar =
      typeof avatar === 'string' && avatar.length <= MAX_SAVED_AVATAR_LEN ? avatar : '';
    window.localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({ name: String(name || '').slice(0, 30), avatar: safeAvatar })
    );
  } catch (err) {
    // ignore storage errors
  }
}

export function clearProfile() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PROFILE_KEY);
  } catch (err) {
    // ignore storage errors
  }
}
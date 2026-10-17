import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function saveStatus(name, message, avatar_url = null) {
  const { error } = await supabase
    .from('status')
    .insert([{ name, message, avatar_url, created_at: new Date().toISOString() }]);
  if (error) throw error;
}

export async function getStatus(limit = 10) {
  const { data, error } = await supabase
    .from('status')
    .select('id, name, message, created_at, avatar_url')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Supabase error]', error);
    return [];
  }
  return data;
}

// Emote reactions on one status post, as [{ emoji, count }], oldest emote first
// (the same order the status page shows them in). Nobody's identity is read here.
export async function getStatusReactions(statusId) {
  const { data, error } = await supabase
    .from('reactions')
    .select('emoji, created_at')
    .eq('target_type', 'status')
    .eq('target_id', String(statusId))
    .order('created_at', { ascending: true })
    .limit(1000);

  if (error) {
    console.error('[Supabase error]', error);
    return [];
  }

  const counts = new Map(); // a Map remembers the order emotes first appeared in
  for (const row of data || []) {
    counts.set(row.emoji, (counts.get(row.emoji) || 0) + 1);
  }
  return [...counts.entries()].map(([emoji, count]) => ({ emoji, count }));
}
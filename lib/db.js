// lib/db.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveComment(name, message) {
  await supabase
    .from('comments')
    .insert([{ name, message, created_at: new Date().toISOString() }]);
}

export async function getComments(limit = 50) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, name, message, created_at, liked_by_owner, pinned')
    .order('pinned', { ascending: false })          // fixados primeiro
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Supabase error]', error);
    return [];
  }
  return data;
}

export async function likeComment(id) {
  // só inverte liked_by_owner (true → false ou vice-versa)
  const { data, error } = await supabase
    .from('comments')
    .update({ liked_by_owner: true })
    .eq('id', id);
  if (error) throw error;
  return data;
}

export async function pinComment(id, pin = true) {
  const { data, error } = await supabase
    .from('comments')
    .update({ pinned: pin })
    .eq('id', id);
  if (error) throw error;
  return data;
}
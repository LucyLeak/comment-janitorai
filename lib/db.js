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
    .select('name, message, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Supabase error]', error);
    return [];
  }

  return data;
}
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function saveStatus(name, message, avatar_url = null) {
  await supabase
    .from('status')
    .insert([{ name, message, avatar_url, created_at: new Date().toISOString() }]);
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

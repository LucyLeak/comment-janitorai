const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function saveComment(name, message) {
  await supabase
    .from('comments')
    .insert([{ name, message, created_at: new Date().toISOString() }]);
}

async function getComments(limit = 5) {
  const { data } = await supabase
    .from('comments')
    .select('name, message')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data;
}

module.exports = { saveComment, getComments };
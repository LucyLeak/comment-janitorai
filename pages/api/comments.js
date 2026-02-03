// pages/api/comments.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, name, message, created_at, liked_by_owner, pinned, parent_id')
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
      const { name, message, parent_id = null } = req.body;
      if (!name || !message) {
        return res.status(400).json({ error: 'Name and message are required.' });
      }
      const { error } = await supabase
        .from('comments')
        .insert([{ name, message, parent_id }]);
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

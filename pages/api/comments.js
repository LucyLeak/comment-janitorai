// pages/api/comments.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // GET  → retorna lista de comentários
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, name, message, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      // Para compatibilidade com seu front, retornamos { comments: [...] }
      return res.status(200).json({ comments: data });
    } catch (error) {
      console.error('GET /api/comments error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST → insere um novo comentário
  if (req.method === 'POST') {
    try {
      const { name, message } = req.body;
      if (!name || !message) {
        return res.status(400).json({ error: 'Nome e mensagem são obrigatórios.' });
      }
      const { error } = await supabase
        .from('comments')
        .insert([{ name, message }]);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('POST /api/comments error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Outros métodos não permitidos
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
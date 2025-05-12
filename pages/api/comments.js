import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // use o service role apenas em endpoints protegidos
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { text, timestamp } = req.body;
    const { error } = await supabase
      .from('comments')
      .insert([{ text, timestamp }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Comentário salvo com sucesso!' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
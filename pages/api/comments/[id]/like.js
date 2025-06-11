// pages/api/comments/[id]/like.js
import { likeComment } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== 'POST') return res.status(405).end();
  try {
    await likeComment(id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

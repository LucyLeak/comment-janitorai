// pages/api/comments/[id]/pin.js
import { pinComment } from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== 'POST') return res.status(405).end();
  const { pin } = req.body; // { pin: true } ou false
  try {
    await pinComment(id, pin);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
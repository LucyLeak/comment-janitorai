import { getComments } from '../../lib/db';

export default async function handler(req, res) {
  try {
    const comments = await getComments(5);
    return res.status(200).json({ comments });
  } catch (err) {
    console.error('ERROR comments.json:', err);
    return res.status(500).json({ error: err.message });
  }
}
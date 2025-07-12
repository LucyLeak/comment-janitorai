import { getComments } from '../../lib/db';

export default async function handler(req, res) {
  try {
    const comments = await getComments(); // Remove limit to get all comments
    return res.status(200).json({ comments });
  } catch (err) {
    console.error('ERROR comments.json:', err);
    return res.status(500).json({ error: err.message });
  }
}
import { getStatus } from '../../lib/status-db';

export default async function handler(req, res) {
  try {
    const status = await getStatus(20);
    return res.status(200).json({ status });
  } catch (err) {
    console.error('ERROR status.json:', err);
    return res.status(500).json({ error: err.message });
  }
}

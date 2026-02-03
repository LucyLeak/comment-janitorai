import { isAuthed } from '../../../lib/status-auth';

export default function handler(req, res) {
  const authed = isAuthed(req);
  return res.status(200).json({ authed });
}

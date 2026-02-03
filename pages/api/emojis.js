import fs from 'fs';
import path from 'path';

const ALLOWED_EXTS = new Set(['.png', '.gif', '.jpg', '.jpeg', '.webp']);

export default function handler(req, res) {
  try {
    const dir = path.join(process.cwd(), 'public', 'emojis');
    if (!fs.existsSync(dir)) {
      return res.status(200).json({ emojis: [] });
    }

    const files = fs.readdirSync(dir);
    const emojis = files
      .filter(file => ALLOWED_EXTS.has(path.extname(file).toLowerCase()))
      .map(file => {
        const ext = path.extname(file);
        const name = path.basename(file, ext);
        return { name, url: `/emojis/${file}` };
      });

    return res.status(200).json({ emojis });
  } catch (err) {
    console.error('ERROR /api/emojis:', err);
    return res.status(500).json({ error: err.message });
  }
}

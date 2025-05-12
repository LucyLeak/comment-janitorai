import { getComments } from '../../lib/db';  // lê do seu banco

function escapeXML(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  const comments = await getComments(5);  // ou quanto quiser

  const lines = comments.map((c, i) => `
    <text x="10" y="${30 + i * 24}"
          font-family="Inter" font-size="14" fill="#E2E8F0">
      ${escapeXML(c.name)}: ${escapeXML(c.message)}
    </text>`).join('');

  const height = comments.length * 24 + 40;

  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="${height}">
  <rect width="100%" height="100%" fill="#0F172A"/>
  ${lines}
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.status(200).send(svg);
}

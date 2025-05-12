import { getComments } from '../../lib/db';

function escapeXML(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  let comments = [];
  try {
    comments = await getComments(5) || [];
  } catch (err) {
    console.error('ERROR in comments.svg:', err);
    // Retorna um SVG simples avisando erro
    const errorSvg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="40">
  <rect width="100%" height="100%" fill="#0F172A"/>
  <text x="10" y="25" font-family="Inter" font-size="14" fill="#EF4444">
    Erro ao carregar comentários
  </text>
</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, max-age=0');
    return res.status(200).send(errorSvg);
  }

  const lines = comments.map((c, i) => `
    <text x="10" y="${30 + i * 24}"
          font-family="Inter" font-size="14" fill="#E2E8F0">
      ${escapeXML(c.name)}: ${escapeXML(c.message)}
    </text>`
  ).join('');

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
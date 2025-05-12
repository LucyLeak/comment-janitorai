import { getComments } from '../../lib/db';

function escapeXML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  let comments = [];
  try {
    comments = await getComments(10) || [];
  } catch (err) {
    console.error('ERROR in comments.svg:', err);
    // Fall back to empty array
  }

  const rowHeight = 30;
  const headerHeight = 40;
  const padding = 20;
  const width = 500;
  const height = headerHeight + comments.length * rowHeight + padding;

  const lines = comments.map((c, i) => `
    <rect x="0" y="${headerHeight + i * rowHeight}" width="${width}" height="${rowHeight}" class="row-${i % 2}" />
    <text x="${padding}" y="${headerHeight + i * rowHeight + rowHeight / 1.5}" class="text">${escapeXML(c.name)}: ${escapeXML(c.message)}</text>
  `).join('');

  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>
  </defs>
  <style>
    .bg { fill: url(#bg-grad); }
    .header-bg { fill: #4F46E5; opacity: 0.8; }
    .header-text { font-family: 'Open Sans', sans-serif; fill: #FFF; font-size: 18px; font-weight: bold; }
    .text { font-family: 'Open Sans', monospace; fill: #E2E8F0; font-size: 14px; }
    .row-0 { fill: rgba(30, 41, 59, 0.5); }
    .row-1 { fill: rgba(30, 41, 59, 0.2); }
  </style>

  <!-- Background -->
  <rect class="bg" width="100%" height="100%" rx="12" />

  <!-- Header -->
  <rect class="header-bg" x="0" y="0" width="${width}" height="${headerHeight}" rx="12" />
  <text x="${padding}" y="${headerHeight / 1.5}" class="header-text">Comentários Recentes</text>

  <!-- Comment rows -->
  ${lines}
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.status(200).send(svg);
}
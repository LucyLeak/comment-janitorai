import { getComments } from '../../lib/db';

function escapeXML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'w', seconds: 604800 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];
  for (const { label, seconds: sec } of intervals) {
    const count = Math.floor(seconds / sec);
    if (count >= 1) return `${count}${label}`;
  }
  return 'now';
}

export default async function handler(req, res) {
  let comments = [];
  try {
    comments = await getComments(10) || [];
  } catch (err) {
    console.error('ERROR in comments.svg:', err);
  }

  const rowHeight = 28;
  const padding = 16;
  const width = 480;
  const height = comments.length * rowHeight + padding * 2;

  const lines = comments.map((c, i) => {
    const timeAgo = formatTimeAgo(c.created_at);
    return `
    <text x="${padding}" y="${padding + (i + 1) * rowHeight - 8}" class="comment">
      <tspan class="name">${escapeXML(c.name)}</tspan>
      <tspan class="sep">:</tspan>
      <tspan class="msg"> ${escapeXML(c.message)}</tspan>
      <tspan class="time" dx="8">${timeAgo}</tspan>
    </text>`;
  }).join('');

  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>
    <![CDATA[
    .comment { font-family: 'Open Sans', sans-serif; font-size: 14px; fill: #e2e2e2; }
    .name { font-family: monospace; fill: #ffe033; font-weight: bold; }
    .sep { fill: #e2e2e2; }
    .msg { fill: #cbd5e1; }
    .time { fill: #94a3b8; font-size: 12px; font-family: monospace; }
    ]]>
  </style>
  ${lines}
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.status(200).send(svg);
}
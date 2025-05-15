import { getComments } from '../../lib/db';

function escapeXML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString + 'Z');
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

function wrapText(text, maxCharsPerLine = 40) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + word).length > maxCharsPerLine) {
      lines.push(currentLine.trim());
      currentLine = '';
    }
    currentLine += word + ' ';
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

export default async function handler(req, res) {
  let comments = [];
  try {
    comments = await getComments(50) || [];
  } catch (err) {
    console.error('ERROR in comments.svg:', err);
  }

  const padding = 16;
  const width = 330;
  const lineHeight = 20;
  const verticalSpacing = 10;

  let yOffset = padding;
  const rendered = [];

  for (const comment of comments) {
    const timeAgo = formatTimeAgo(comment.created_at);
    const name = escapeXML(comment.name);
    const message = escapeXML(comment.message);
    const wrapped = wrapText(message, 40);
    // calculate indent for subsequent lines (approximate)
    const indentPx = (name.length + 2) * 8;

    // start tspan for first line
    let textElement = `<text x="${padding}" y="${yOffset}" class="comment">`;
    textElement += `<tspan class="name">${name}</tspan><tspan class="sep">:</tspan>`;
    textElement += `<tspan class="msg"> ${wrapped[0]}</tspan>`;
    textElement += `<tspan class="time" dx="8">${timeAgo}</tspan>`;

    // subsequent lines
    wrapped.slice(1).forEach((line) => {
      textElement += `<tspan x="${padding + indentPx}" dy="${lineHeight}">${line}</tspan>`;
    });
    textElement += `</text>`;
    rendered.push(textElement);

    // update yOffset: one lineHeight per line + verticalSpacing
    yOffset += wrapped.length * lineHeight + verticalSpacing;
  }

  const height = yOffset;
  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background: transparent">
  <style>
    <![CDATA[
    .comment { font-family: 'Open Sans', sans-serif; font-size: 14px; fill: #e2e2e2; }
    .name { font-family: monospace; fill: #ffe033; font-weight: bold; }
    .sep { fill: #e2e2e2; }
    .msg { fill: #cbd5e1; }
    .time { fill: #94a3b8; font-size: 12px; font-family: monospace; }
    ]]>
  </style>
  ${rendered.join('\n')}
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.status(200).send(svg);
}

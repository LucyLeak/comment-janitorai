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

// Aproxima a largura do texto (super compatível com Vercel)
function approximateTextWidth(text, fontSize = 14) {
  const wideCharRegex = /[^\u0000-\u00ff]/g;
  const wideChars = (text.match(wideCharRegex) || []).length;
  const narrowChars = text.length - wideChars;

  return (wideChars * fontSize) + (narrowChars * (fontSize * 0.6));
}

function wrapTextPixels(text, maxWidth, prefixWidth = 0, fontSize = 14) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  let currentWidth = prefixWidth;

  words.forEach(word => {
    const wordWidth = approximateTextWidth(word + ' ', fontSize);
    if (currentWidth + wordWidth > maxWidth) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
      currentWidth = approximateTextWidth(word + ' ', fontSize);
    } else {
      currentLine += word + ' ';
      currentWidth += wordWidth;
    }
  });

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
  const renderedLines = [];

  comments.forEach(comment => {
    const timeAgo = formatTimeAgo(comment.created_at);
    const name = escapeXML(comment.name);
    const message = escapeXML(comment.message);

    // Estimar largura do nome + separador ":"
    const nameWidth = approximateTextWidth(`${name}: `, 14);

    const wrapped = wrapTextPixels(message, width - 2 * padding, nameWidth);

    // Primeira linha com nome e timestamp
    renderedLines.push(
      `<text x="${padding}" y="${yOffset}" class="comment">
        <tspan class="name">${name}</tspan><tspan class="sep">:</tspan>
        <tspan class="msg"> ${wrapped[0]}</tspan>
        <tspan class="time" dx="8">${timeAgo}</tspan>
      </text>`
    );

    // Linhas subsequentes
    for (let i = 1; i < wrapped.length; i++) {
      yOffset += lineHeight;
      renderedLines.push(
        `<text x="${padding}" y="${yOffset}" class="comment">
          <tspan class="msg">${wrapped[i]}</tspan>
        </text>`
      );
    }

    yOffset += verticalSpacing + lineHeight;
  });

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
  ${renderedLines.join('\n')}
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.status(200).send(svg);

  const heartIcon = comments.liked_by_owner
    ? `<image href="https://files.catbox.moe/r7rk7d.png" x="${padding - 24}" y="${yOffset - 14}" width="20" height="20" clip-path="circle(10)" />`
    : '';

  renderedLines.push(
    `${avatar}
    <text x="${padding}" y="${yOffset}" class="comment">
      <tspan class="name">${name}</tspan><tspan class="sep">:</tspan>
      <tspan class="msg"> ${wrapped[0]}</tspan>
      <tspan class="time" dx="8">${timeAgo}</tspan>
      ${heartIcon}
    </text>`
  );
}
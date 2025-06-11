import { getComments } from '../../lib/db';
import { createCanvas } from 'canvas';

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

// Quebra de texto baseada em largura real usando canvas
function wrapTextPixels(text, maxWidth, ctx) {
  const lines = [];
  let line = '';
  for (const ch of text) {
    const testLine = line + ch;
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default async function handler(req, res) {
  // prepara canvas para medir texto
  const canvas = createCanvas(0, 0);
  const ctx = canvas.getContext('2d');
  ctx.font = '14px "Open Sans"';

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
    const prefix = `${name}: `;
    const message = escapeXML(comment.message);

    // calcula largura disponível para mensagem
    const prefixWidth = ctx.measureText(prefix).width;
    const timeWidth = ctx.measureText(timeAgo).width + ctx.measureText(' ').width;
    const msgMaxWidth = width - padding*2 - prefixWidth - timeWidth;

    // quebra mensagem em linhas
    const msgLines = wrapTextPixels(message, msgMaxWidth, ctx);

    // primeira linha com prefixo e timestamp
    const firstLine = msgLines.shift() || '';
    renderedLines.push(
      `<text x="${padding}" y="${yOffset}" class="comment">
        <tspan class="name">${prefix}</tspan>
        <tspan class="msg">${firstLine}</tspan>
        <tspan class="time" dx="4">${timeAgo}</tspan>
      </text>`
    );

    // linhas subsequentes só mensagem
    msgLines.forEach(lineText => {
      yOffset += lineHeight;
      renderedLines.push(
        `<text x="${padding + prefixWidth}" y="${yOffset}" class="comment">
          <tspan class="msg">${lineText}</tspan>
        </text>`
      );
    });

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
}
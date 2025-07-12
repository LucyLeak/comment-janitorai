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

  comments.forEach((comment, idx) => {
    const timeAgo = formatTimeAgo(comment.created_at);
    const name = escapeXML(comment.name);
    const message = escapeXML(comment.message);

    // Estimar largura do nome
    const nameWidth = approximateTextWidth(name, 14);
    const dateWidth = approximateTextWidth(timeAgo, 12);
    const iconSpacing = 24; // space for icons
    const rowHeight = lineHeight;
    const blockPadding = 8;

    // Prepare IDs for SVG elements
    const blockId = `comment-block-${idx}`;
    const pinnedBgId = `pinned-bg-${idx}`;

    // Wrap message text
    const wrapped = wrapTextPixels(message, width - 2 * padding, 0);

    // Calculate block height
    const blockHeight = rowHeight + wrapped.length * lineHeight + blockPadding * 2;

    // Gradient background for pinned
    if (comment.pinned) {
      renderedLines.push(`
        <defs>
          <linearGradient id="${pinnedBgId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect x="${padding}" y="${yOffset}" width="${width - 2 * padding}" height="${rowHeight}" rx="0" fill="url(#${pinnedBgId})"/>
      `);
    }

    // Start comment block group
    renderedLines.push(`<g id="${blockId}" class="comment-block">`);

    // Name row (name, date, liked, pinned)
    let nameRow = `<text x="${padding}" y="${yOffset + rowHeight - 6}" class="comment-name-row">
      <tspan class="name">${name}</tspan>
      <tspan class="date" dx="8">${timeAgo}</tspan>`;

    // Liked icon
    if (comment.liked_by_owner) {
      nameRow += `<tspan dx="8" class="liked-icon">
        <image 
          href="data:image/png;base64,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"
          x="${width - padding - 40}" y="${yOffset + rowHeight - 22}" width="16" height="16"/>
      </tspan>`;
    }

    // Pinned icon placeholder (always visible if pinned)
    if (comment.pinned) {
      nameRow += `<tspan dx="8" class="pinned-icon">
        <!-- Custom pinned icon placeholder -->
        <g id="custom-pinned-icon" class="custom-pinned-icon" x="${width - padding - 20}" y="${yOffset + rowHeight - 22}"></g>
      </tspan>`;
    }

    nameRow += `</text>`;
    renderedLines.push(nameRow);

    // Message block
    for (let i = 0; i < wrapped.length; i++) {
      renderedLines.push(
        `<text x="${padding}" y="${yOffset + rowHeight + blockPadding + i * lineHeight}" class="comment-message">
          <tspan class="msg">${wrapped[i]}</tspan>
        </text>`
      );
    }

    // End comment block group
    renderedLines.push(`</g>`);

    yOffset += blockHeight + verticalSpacing;
  });

  const height = yOffset;

  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background: transparent">
  <style>
    <![CDATA[
    .comment-block { }
    .comment-name-row { font-family: 'Open Sans', sans-serif; font-size: 14px; fill: #e2e2e2; }
    .name { font-family: monospace; fill: #ffe033; font-weight: bold; }
    .date { fill: #94a3b8; font-size: 12px; font-family: monospace; }
    .msg { fill: #cbd5e1; }
    .liked-icon { }
    .pinned-icon { }
    .custom-pinned-icon { }
    .comment-message { font-family: 'Open Sans', sans-serif; font-size: 14px; fill: #cbd5e1; }
    ]]>
  </style>
  ${renderedLines.join('\n')}
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.status(200).send(svg);
}

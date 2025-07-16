import { getComments } from '../../lib/db';
import fs from 'fs';
import path from 'path';

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

function getBase64Image(fileName) {
  try {
    const filePath = path.join(process.cwd(), 'public', fileName);
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  } catch (err) {
    return '';
  }
}

export default async function handler(req, res) {
  let comments = [];
  try {
    comments = await getComments(50) || [];
  } catch (err) {
    console.error('ERROR in comments.svg:', err);
  }

  // Limit to 20 comments, newest first
  const maxComments = 14;
  const totalComments = comments.length;
  const limitedComments = comments.slice(0, maxComments);

  const padding = 16;
  const width = 330;
  const lineHeight = 26; // Slightly larger comments
  const verticalSpacing = 10;
  const blockPadding = 12; // More space between name and comment

  let yOffset = padding;
  const renderedLines = [];

  const likedIcon = getBase64Image('likedC.png');
  const pinnedIcon = getBase64Image('pinned.png');

  limitedComments.forEach((comment, idx) => {
    const timeAgo = formatTimeAgo(comment.created_at);
    const name = escapeXML(comment.name);
    const message = escapeXML(comment.message);
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

    // Name row (name, date)
    renderedLines.push(`<text x="${padding}" y="${yOffset + lineHeight - 8}" class="comment-name-row" style="font-size:16px;">
      <tspan class="name" style="font-size:18px;">${name}</tspan>
      <tspan class="date" dx="8" style="font-size:15px;">${timeAgo}</tspan>
    </text>`);

    // Icons (pinned and liked) in the top-right corner
    const iconSize = 18;
    let iconX = width - padding - iconSize;
    const iconY = yOffset + 4;
    if (comment.pinned && pinnedIcon) {
      renderedLines.push(`<image href="${pinnedIcon}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" class="pinned-icon"/>`);
      iconX -= iconSize + 6; // 6px gap between icons
    }
    if (comment.liked_by_owner && likedIcon) {
      renderedLines.push(`<image href="${likedIcon}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" class="liked-icon"/>`);
    }

    // Message block with extra padding below the name
    const nameBottomPadding = 8; // Adjust this value for more/less space
    for (let i = 0; i < wrapped.length; i++) {
      renderedLines.push(
        `<text x="${padding}" y="${yOffset + lineHeight + blockPadding + nameBottomPadding + i * lineHeight}" class="comment-message" style="font-size:16px;">
          <tspan class="msg" style="font-size:16px;">${wrapped[i]}</tspan>
        </text>`
      );
    }

    // End comment block group
    renderedLines.push(`</g>`);

    yOffset += blockHeight + 4; // Reduced verticalSpacing for less distance between comments
  });

  const height = yOffset;

  // Add 'and more' text if there are more comments
  if (totalComments > maxComments) {
    renderedLines.push(`
      <text x="${padding}" y="${height - 8}" class="more-comments" style="font-size:12px;fill:#94a3b8;font-family:monospace;">
        and more ${totalComments - maxComments} comments
      </text>
    `);
  }

  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background: transparent">
  <style>
    <![CDATA[
    .comment-block { }
    .comment-name-row { font-family: 'Open Sans', sans-serif; font-size: 16px; fill: #e2e2e2; }
    .name { font-family: monospace; fill: #ffe033; font-weight: bold; font-size: 18px; }
    .date { fill: #94a3b8; font-size: 15px; font-family: monospace; }
    .msg { fill: #cbd5e1; font-size: 16px; }
    .liked-icon { }
    .pinned-icon { }
    .custom-pinned-icon { }
    .comment-message { font-family: 'Open Sans', sans-serif; font-size: 16px; fill: #cbd5e1; }
    ]]>
  </style>
  ${renderedLines.join('\n')}
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.status(200).send(svg);
}
